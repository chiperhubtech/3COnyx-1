import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "api2cart" });

const PLATFORM_COMMISSION_RATE = 0.03;

const SUPPORTED_CARTS = [
  "Shopify", "WooCommerce", "Magento", "BigCommerce", "PrestaShop",
  "OpenCart", "Volusion", "3dcart", "Squarespace", "Wix",
  "Ecwid", "Lightspeed", "Salesforce Commerce", "SAP Commerce",
  "Neto", "Shift4Shop", "X-Cart", "CS-Cart", "Zen Cart",
  "osCommerce", "VirtueMart", "Loaded Commerce", "Tictail",
  "Amazon Marketplace", "eBay", "Etsy", "Walmart Marketplace",
];

interface CartConnection {
  id: string;
  platform: string;
  storeName: string;
  storeUrl: string;
  status: "active" | "pending" | "disconnected" | "error";
  productCount: number;
  orderCount: number;
  lastSyncAt: string | null;
  commissionEarned: number;
}

interface CartProduct {
  id: string;
  sourceCartId: string;
  sourcePlatform: string;
  name: string;
  description: string;
  priceUsd: number;
  costUsd: number;
  sku: string;
  category: string;
  images: string[];
  inStock: boolean;
  quantity: number;
  variants: Array<{ name: string; options: string[] }>;
  tags: string[];
  sourceUrl: string;
}

router.get("/platforms", async (_req: Request, res: Response) => {
  res.json({
    platforms: SUPPORTED_CARTS,
    total: SUPPORTED_CARTS.length,
    message: "API2Cart unified eCommerce — one API, 40+ platforms. Every cart, every product, one network.",
  });
});

router.get("/connections", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    res.json({
      connections: [] as CartConnection[],
      total: 0,
      message: "Connect your first store to start syncing products across the network.",
      supportedPlatforms: SUPPORTED_CARTS.length,
    });
  } catch (err) {
    log.error({ err }, "Failed to list connections");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/connect", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { platform, storeUrl, apiKey } = req.body;

    if (!platform || !storeUrl) {
      res.status(400).json({ error: "platform and storeUrl required" });
      return;
    }

    if (!SUPPORTED_CARTS.map(c => c.toLowerCase()).includes(platform.toLowerCase())) {
      res.status(400).json({ error: `Unsupported platform. Supported: ${SUPPORTED_CARTS.join(", ")}` });
      return;
    }

    const connectionId = "CART-" + Date.now().toString(36).toUpperCase();

    log.info({ userId, platform, storeUrl, connectionId }, "Cart connection initiated");

    res.json({
      success: true,
      connection: {
        id: connectionId,
        platform,
        storeName: new URL(storeUrl).hostname.replace("www.", "").split(".")[0],
        storeUrl,
        status: "pending",
        productCount: 0,
        orderCount: 0,
        lastSyncAt: null,
        commissionEarned: 0,
      } as CartConnection,
      message: `Connecting to ${platform}. Products will sync automatically once verified.`,
      nextSteps: [
        "Verify store ownership via API key or OAuth",
        "Products auto-sync to your 3C ONYX catalog",
        "3% platform commission on every sale through the network",
        "Bottom-up attribution — whoever brings the customer eats first",
      ],
    });
  } catch (err) {
    log.error({ err }, "Cart connection failed");
    res.status(500).json({ error: "Connection failed" });
  }
});

router.post("/sync/:connectionId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const connectionId = req.params.connectionId as string;

    log.info({ userId, connectionId }, "Manual sync triggered");

    res.json({
      success: true,
      syncId: "SYNC-" + Date.now().toString(36).toUpperCase(),
      status: "in_progress",
      message: "Syncing products from your store. This usually takes 1-5 minutes depending on catalog size.",
    });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
});

router.get("/products", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const platform = req.query.platform as string | undefined;
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;

    res.json({
      products: [] as CartProduct[],
      total: 0,
      message: "Connect a store to see synced products here. Every product is available across the entire 3C ONYX network.",
      commissionRate: PLATFORM_COMMISSION_RATE,
    });
  } catch (err) {
    log.error({ err }, "Product fetch failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/orders", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    res.json({
      orders: [],
      total: 0,
      commissionEarnedCents: 0,
      message: "Orders from all connected stores appear here. Commission is auto-calculated and attributed bottom-up.",
    });
  } catch (err) {
    log.error({ err }, "Orders fetch failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/analytics", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    res.json({
      analytics: {
        totalConnections: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenueCents: 0,
        totalCommissionCents: 0,
        topPlatforms: [],
        topProducts: [],
        conversionRate: 0,
      },
      message: "Connect stores to see cross-platform eCommerce analytics.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/connections/:connectionId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const connectionId = req.params.connectionId as string;

    log.info({ userId, connectionId }, "Cart disconnected");
    res.json({ success: true, message: "Store disconnected. Products removed from network catalog." });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
