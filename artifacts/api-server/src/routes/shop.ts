import { Router, type IRouter, type Request, type Response } from "express";
import { shopifyStorefrontRequest } from "../lib/shopifyStorefrontClient";
import { apiCache } from "../lib/apiCache";

/**
 * 3C ONYX Shop — Shopify-powered storefront routes (additive).
 *   GET  /shop/products  — live catalog from Shopify Storefront API (cached)
 *   POST /shop/checkout  — create a cart, return Shopify hosted checkout URL
 */
const router: IRouter = Router();

interface StorefrontProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { nodes: Array<{ id: string; title: string; availableForSale: boolean }> };
}

const PRODUCTS_QUERY = `#graphql
  query Products {
    products(first: 24, sortKey: PRICE, reverse: true) {
      nodes {
        id
        title
        handle
        description
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 5) { nodes { id title availableForSale } }
      }
    }
  }
`;

router.get("/shop/products", async (req: Request, res: Response) => {
  try {
    const data = await apiCache.get(
      "shop:products",
      async () => shopifyStorefrontRequest<{ products: { nodes: StorefrontProduct[] } }>(PRODUCTS_QUERY),
      120_000,
    );
    res.json({ products: data.products.nodes });
  } catch (err) {
    req.log.error({ err }, "Shop products fetch failed");
    res.status(502).json({ error: "The shop is temporarily unavailable — try again shortly" });
  }
});

const CART_CREATE = `#graphql
  mutation CartCreate($variantId: ID!, $quantity: Int!) {
    cartCreate(input: { lines: [{ merchandiseId: $variantId, quantity: $quantity }] }) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

router.post("/shop/checkout", async (req: Request, res: Response) => {
  const { variantId, quantity } = req.body as { variantId?: string; quantity?: number };
  if (!variantId || !variantId.startsWith("gid://shopify/ProductVariant/")) {
    res.status(400).json({ error: "A valid variantId is required" });
    return;
  }
  const qty = Math.min(Math.max(parseInt(String(quantity ?? 1), 10) || 1, 1), 10);

  try {
    const data = await shopifyStorefrontRequest<{
      cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(CART_CREATE, { variantId, quantity: qty });

    const userError = data.cartCreate.userErrors[0];
    if (userError) {
      res.status(400).json({ error: userError.message });
      return;
    }
    if (!data.cartCreate.cart?.checkoutUrl) {
      res.status(502).json({ error: "Shopify did not return a checkout URL" });
      return;
    }

    const checkoutUrl = new URL(data.cartCreate.cart.checkoutUrl);
    // Dev/preview stores are password protected until the merchant claims
    // them; this preview param keeps checkout reachable. Off in production.
    if (process.env.NODE_ENV !== "production") {
      checkoutUrl.searchParams.set("channel", "online_store");
    }

    res.json({ checkoutUrl: checkoutUrl.toString() });
  } catch (err) {
    req.log.error({ err }, "Shop checkout failed");
    res.status(502).json({ error: "Checkout is temporarily unavailable — try again shortly" });
  }
});

export default router;
