/**
 * 3C ONYX — Alibaba ICBU Dropshipping Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the Alibaba International Open Platform (IOP) SDK signing logic.
 * Uses the alibaba.icbu.product.list API to source automobile parts with
 * 1-piece MOQ and Trade Assurance filter.
 *
 * Routes:
 *   GET  /api/alibaba/auth/status           — Check current token state
 *   POST /api/alibaba/auth/token            — Exchange auth code for access_token
 *   POST /api/alibaba/auth/refresh          — Refresh an expiring access_token
 *   POST /api/alibaba/products/import       — Search ICBU + store results in DB
 *   GET  /api/alibaba/products              — List all imported products
 *   GET  /api/alibaba/products/:id          — Single product detail
 *   DELETE /api/alibaba/products/:id        — Remove product from catalog
 *
 * Credentials (Replit Secrets):
 *   ALIBABA_APP_KEY     — App Key from Alibaba Open Platform console
 *   ALIBABA_APP_SECRET  — App Secret (used only for signing, never exposed)
 *   ALIBABA_ACCESS_TOKEN — OAuth 2.0 access_token (session key for user-level API calls)
 *   ALIBABA_REFRESH_TOKEN — OAuth 2.0 refresh_token (optional, for auto-renewal)
 */

import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, alibabaProductsTable, type NewAlibabaProduct } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Constants ────────────────────────────────────────────────────────────────

const IOP_GATEWAY = "https://api.taobao.com/router/rest";
const OAUTH_TOKEN_URL = "https://oauth.alibaba.com/token";
const OAUTH_AUTHORIZE_URL = "https://oauth.alibaba.com/authorize";

// Default search keyword for this platform's use case
const DEFAULT_KEYWORD = "automobile parts accessories";
const DEFAULT_PAGE_SIZE = 20;

// ─── IOP Signing (mirrors the official Alibaba IOP SDK) ──────────────────────

/**
 * Generates the IOP API signature.
 *
 * Algorithm (per official Alibaba IOP SDK):
 *  1. Collect all request parameters except "sign"
 *  2. Sort parameters alphabetically by key
 *  3. Concatenate key+value pairs with no separator (key1value1key2value2...)
 *  4. HMAC-SHA256(appSecret, concatenatedString) → uppercase hex
 */
function signIOP(
  params: Record<string, string>,
  appSecret: string,
): string {
  const filtered: Record<string, string> = { ...params };
  delete filtered["sign"];

  const concatenated = Object.keys(filtered)
    .sort()
    .map((k) => k + filtered[k])
    .join("");

  return crypto
    .createHmac("sha256", appSecret)
    .update(concatenated)
    .digest("hex")
    .toUpperCase();
}

/**
 * Builds a complete signed IOP request body (as URLSearchParams).
 * Injects app_key, timestamp, format, v, sign_method automatically.
 */
function buildSignedParams(
  method: string,
  apiParams: Record<string, string>,
  appKey: string,
  appSecret: string,
  accessToken?: string,
): URLSearchParams {
  const base: Record<string, string> = {
    method,
    app_key: appKey,
    format: "json",
    v: "2.0",
    sign_method: "sha256",
    timestamp: new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, ""),
    ...apiParams,
  };

  if (accessToken) {
    base["session"] = accessToken;
  }

  base["sign"] = signIOP(base, appSecret);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    params.set(k, v);
  }
  return params;
}

// ─── OAuth Token Management ───────────────────────────────────────────────────

// In-memory token cache (persists while server is running)
let tokenCache: {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
} | null = null;

function loadTokenFromEnv(): typeof tokenCache {
  const accessToken = process.env["ALIBABA_ACCESS_TOKEN"];
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: process.env["ALIBABA_REFRESH_TOKEN"] ?? null,
    // Assume env token is valid (no expiry known from env)
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

function getCredentials():
  | { appKey: string; appSecret: string; configured: true }
  | { configured: false } {
  const appKey = process.env["ALIBABA_APP_KEY"];
  const appSecret = process.env["ALIBABA_APP_SECRET"];
  if (!appKey || !appSecret) return { configured: false };
  return { appKey, appSecret, configured: true };
}

function getActiveToken(): string | null {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }
  const fromEnv = loadTokenFromEnv();
  if (fromEnv) {
    tokenCache = fromEnv;
    return tokenCache.accessToken;
  }
  return null;
}

// ─── ICBU Product Search ──────────────────────────────────────────────────────

interface IcbuProduct {
  product_id?: string;
  subject?: string;
  description?: string;
  price?: string;
  min_price?: string;
  max_price?: string;
  main_image?: { original?: string };
  detail_url?: string;
  supplier?: {
    login_id?: string;
    company_name?: string;
    country?: string;
  };
  min_order_quantity?: { quantity?: number };
  trade_guarantee?: boolean;
  category?: string;
  star_rating?: string;
  order_count?: number;
}

async function searchIcbuProducts(opts: {
  keywords: string;
  pageNo?: number;
  pageSize?: number;
  appKey: string;
  appSecret: string;
  accessToken?: string;
}): Promise<{ products: IcbuProduct[]; totalCount: number; error?: string }> {
  const { keywords, pageNo = 1, pageSize = DEFAULT_PAGE_SIZE, appKey, appSecret, accessToken } = opts;

  const apiParams: Record<string, string> = {
    keywords,
    page_no: String(pageNo),
    page_size: String(pageSize),
    // Filters: Trade Assurance + MOQ=1 is done via post-filter on response
    // (alibaba.icbu.product.list does not expose direct MOQ filter in all API tiers)
  };

  const body = buildSignedParams(
    "alibaba.icbu.product.list",
    apiParams,
    appKey,
    appSecret,
    accessToken,
  );

  const response = await fetch(IOP_GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`IOP gateway returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  // IOP wraps result in a method-specific key
  const resultKey = "alibaba_icbu_product_list_response";
  if (data["error_response"]) {
    const err = data["error_response"] as Record<string, unknown>;
    return {
      products: [],
      totalCount: 0,
      error: `Alibaba API error ${err["code"]}: ${err["sub_msg"] ?? err["msg"]}`,
    };
  }

  const result = (data[resultKey] ?? {}) as Record<string, unknown>;
  const products = (result["products"] as IcbuProduct[]) ?? [];
  const totalCount = (result["total_count"] as number) ?? products.length;

  return { products, totalCount };
}

// ─── Route: GET /api/alibaba/auth/status ─────────────────────────────────────

router.get("/alibaba/auth/status", (req: Request, res: Response) => {
  const creds = getCredentials();
  const token = getActiveToken();

  const authorizeUrl = creds.configured
    ? `${OAUTH_AUTHORIZE_URL}?response_type=code&redirect_uri=${encodeURIComponent(
        process.env["ALIBABA_REDIRECT_URI"] ?? "https://cuxtomcandyclub.ai/api/alibaba/auth/callback"
      )}&client_id=${(creds as { appKey: string }).appKey}&site=ICBU`
    : null;

  res.json({
    configured: creds.configured,
    authenticated: !!token,
    tokenActive: !!token,
    authorizeUrl,
    oauthTokenUrl: OAUTH_TOKEN_URL,
    setupInstructions: !creds.configured
      ? [
          "Add ALIBABA_APP_KEY to Replit Secrets (from Alibaba Open Platform console)",
          "Add ALIBABA_APP_SECRET to Replit Secrets",
          "Add ALIBABA_ACCESS_TOKEN once your OAuth flow is complete",
          "Optionally add ALIBABA_REFRESH_TOKEN for automatic renewal",
        ]
      : null,
  });
});

// ─── Route: POST /api/alibaba/auth/token ─────────────────────────────────────

router.post("/alibaba/auth/token", requireAuth, async (req: Request, res: Response) => {
  const { code, redirect_uri } = req.body as { code?: string; redirect_uri?: string };

  if (!code) {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  const creds = getCredentials();
  if (!creds.configured) {
    res.status(503).json({ error: "ALIBABA_APP_KEY / ALIBABA_APP_SECRET not configured" });
    return;
  }

  const { appKey, appSecret } = creds;
  const redirectUri = redirect_uri ?? process.env["ALIBABA_REDIRECT_URI"] ?? "";

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      need_refresh_token: "true",
      client_id: appKey,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const response = await fetch(`${OAUTH_TOKEN_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data["error"]) {
      res.status(400).json({ error: String(data["error_description"] ?? data["error"]) });
      return;
    }

    const accessToken = String(data["access_token"] ?? "");
    const refreshToken = data["refresh_token"] ? String(data["refresh_token"]) : null;
    const expiresIn = Number(data["expires_in"] ?? 604800);

    tokenCache = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    logger.info("Alibaba IOP: access_token obtained via authorization_code flow");

    res.json({
      ok: true,
      expiresIn,
      hasRefreshToken: !!refreshToken,
      note: "Store ALIBABA_ACCESS_TOKEN in Replit Secrets for persistence across restarts",
    });
  } catch (err) {
    logger.error({ err }, "Alibaba auth/token failed");
    res.status(502).json({ error: "Failed to exchange authorization code" });
  }
});

// ─── Route: POST /api/alibaba/auth/refresh ───────────────────────────────────

router.post("/alibaba/auth/refresh", requireAuth, async (req: Request, res: Response) => {
  const creds = getCredentials();
  if (!creds.configured) {
    res.status(503).json({ error: "Alibaba credentials not configured" });
    return;
  }

  const refreshToken =
    (req.body as { refresh_token?: string }).refresh_token ??
    tokenCache?.refreshToken ??
    process.env["ALIBABA_REFRESH_TOKEN"];

  if (!refreshToken) {
    res.status(400).json({ error: "No refresh_token available" });
    return;
  }

  const { appKey, appSecret } = creds;

  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: appKey,
      client_secret: appSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(`${OAUTH_TOKEN_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data["error"]) {
      res.status(400).json({ error: String(data["error_description"] ?? data["error"]) });
      return;
    }

    const newAccessToken = String(data["access_token"] ?? "");
    const newRefreshToken = data["refresh_token"] ? String(data["refresh_token"]) : refreshToken;
    const expiresIn = Number(data["expires_in"] ?? 604800);

    tokenCache = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    logger.info("Alibaba IOP: access_token refreshed successfully");

    res.json({ ok: true, expiresIn, hasRefreshToken: !!newRefreshToken });
  } catch (err) {
    logger.error({ err }, "Alibaba auth/refresh failed");
    res.status(502).json({ error: "Failed to refresh token" });
  }
});

// ─── Route: POST /api/alibaba/products/import ────────────────────────────────

router.post("/alibaba/products/import", requireAuth, async (req: Request, res: Response) => {
  const creds = getCredentials();
  if (!creds.configured) {
    res.status(503).json({
      error: "Alibaba credentials not configured. Add ALIBABA_APP_KEY and ALIBABA_APP_SECRET to Replit Secrets.",
      setupRequired: true,
    });
    return;
  }

  const {
    keywords = DEFAULT_KEYWORD,
    pageNo = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    requireTradeAssurance = true,
    maxMoq = 1,
  } = req.body as {
    keywords?: string;
    pageNo?: number;
    pageSize?: number;
    requireTradeAssurance?: boolean;
    maxMoq?: number;
  };

  const { appKey, appSecret } = creds;
  const accessToken = getActiveToken() ?? undefined;

  try {
    logger.info({ keywords, pageNo, pageSize }, "Alibaba ICBU: starting product import");

    const { products, totalCount, error } = await searchIcbuProducts({
      keywords,
      pageNo,
      pageSize,
      appKey,
      appSecret,
      accessToken,
    });

    if (error) {
      res.status(422).json({ error, hint: "Check your ALIBABA_ACCESS_TOKEN or API tier permissions" });
      return;
    }

    // Apply post-response filters: MOQ ≤ maxMoq + Trade Assurance
    const filtered = products.filter((p) => {
      const moq = p.min_order_quantity?.quantity ?? 1;
      const tradeOk = !requireTradeAssurance || p.trade_guarantee === true;
      return moq <= maxMoq && tradeOk;
    });

    // Upsert into DB
    const inserted: number[] = [];
    const skipped: string[] = [];

    for (const p of filtered) {
      const record: NewAlibabaProduct = {
        alibabaProductId: p.product_id ?? null,
        title:            p.subject ?? "Unknown Product",
        priceUsd:         p.price ?? null,
        priceMin:         p.min_price ?? null,
        priceMax:         p.max_price ?? null,
        imageUrl:         p.main_image?.original ?? null,
        detailUrl:        p.detail_url ?? null,
        supplierName:     p.supplier?.company_name ?? null,
        supplierId:       p.supplier?.login_id ?? null,
        supplierCountry:  p.supplier?.country ?? null,
        moq:              p.min_order_quantity?.quantity ?? 1,
        hasTradeAssurance: p.trade_guarantee ?? false,
        category:         p.category ?? null,
        starRating:       p.star_rating ?? null,
        ordersCount:      p.order_count ?? null,
        keywords,
        rawPayload:       p as Record<string, unknown>,
      };

      try {
        const existing = p.product_id
          ? await db
              .select({ id: alibabaProductsTable.id })
              .from(alibabaProductsTable)
              .where(eq(alibabaProductsTable.alibabaProductId, p.product_id))
              .limit(1)
          : [];

        if (existing.length > 0) {
          await db
            .update(alibabaProductsTable)
            .set({ ...record, updatedAt: new Date() })
            .where(eq(alibabaProductsTable.id, existing[0]!.id));
          skipped.push(p.product_id ?? "unknown");
        } else {
          const rows = await db.insert(alibabaProductsTable).values(record).returning({ id: alibabaProductsTable.id });
          if (rows[0]) inserted.push(rows[0].id);
        }
      } catch (dbErr) {
        logger.error({ dbErr, product_id: p.product_id }, "Alibaba: failed to upsert product");
      }
    }

    logger.info({ inserted: inserted.length, updated: skipped.length }, "Alibaba ICBU: import complete");

    res.json({
      ok: true,
      totalFromApi: totalCount,
      returned: products.length,
      afterFilter: filtered.length,
      inserted: inserted.length,
      updated: skipped.length,
      filters: { requireTradeAssurance, maxMoq, keywords },
    });
  } catch (err) {
    logger.error({ err }, "Alibaba products/import failed");
    res.status(502).json({ error: "Failed to reach Alibaba API. Check credentials and network." });
  }
});

// ─── Route: GET /api/alibaba/products ────────────────────────────────────────

router.get("/alibaba/products", async (req: Request, res: Response) => {
  const { limit = "50", offset = "0", tradeAssurance } = req.query as {
    limit?: string;
    offset?: string;
    tradeAssurance?: string;
  };

  const pageLimit = Math.min(Number(limit) || 50, 200);
  const pageOffset = Number(offset) || 0;

  try {
    let query = db
      .select({
        id:               alibabaProductsTable.id,
        alibabaProductId: alibabaProductsTable.alibabaProductId,
        title:            alibabaProductsTable.title,
        priceUsd:         alibabaProductsTable.priceUsd,
        priceMin:         alibabaProductsTable.priceMin,
        priceMax:         alibabaProductsTable.priceMax,
        imageUrl:         alibabaProductsTable.imageUrl,
        detailUrl:        alibabaProductsTable.detailUrl,
        supplierName:     alibabaProductsTable.supplierName,
        supplierCountry:  alibabaProductsTable.supplierCountry,
        moq:              alibabaProductsTable.moq,
        hasTradeAssurance: alibabaProductsTable.hasTradeAssurance,
        category:         alibabaProductsTable.category,
        starRating:       alibabaProductsTable.starRating,
        ordersCount:      alibabaProductsTable.ordersCount,
        keywords:         alibabaProductsTable.keywords,
        importedAt:       alibabaProductsTable.importedAt,
      })
      .from(alibabaProductsTable)
      .orderBy(desc(alibabaProductsTable.importedAt))
      .$dynamic();

    if (tradeAssurance === "true") {
      query = query.where(eq(alibabaProductsTable.hasTradeAssurance, true));
    }

    const rows = await query.limit(pageLimit).offset(pageOffset);

    res.json({
      products: rows,
      count: rows.length,
      limit: pageLimit,
      offset: pageOffset,
    });
  } catch (err) {
    logger.error({ err }, "Alibaba GET /products failed");
    res.status(500).json({ error: "Database error" });
  }
});

// ─── Route: GET /api/alibaba/products/:id ────────────────────────────────────

router.get("/alibaba/products/:id", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(alibabaProductsTable)
      .where(eq(alibabaProductsTable.id, id))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ product: rows[0] });
  } catch (err) {
    logger.error({ err }, "Alibaba GET /products/:id failed");
    res.status(500).json({ error: "Database error" });
  }
});

// ─── Route: DELETE /api/alibaba/products/:id ─────────────────────────────────

router.delete("/alibaba/products/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  try {
    await db.delete(alibabaProductsTable).where(eq(alibabaProductsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Alibaba DELETE /products/:id failed");
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
