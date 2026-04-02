import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { db, developerAppsTable, apiKeysTable, webhookEndpointsTable, webhookDeliveriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { logger } from "../lib/logger";

const router = Router();

const TIER_LIMITS: Record<string, { perMinute: number; perDay: number; maxApps: number; maxKeys: number }> = {
  Free:       { perMinute: 30,    perDay: 5_000,     maxApps: 2,  maxKeys: 2 },
  Builder:    { perMinute: 120,   perDay: 50_000,    maxApps: 10, maxKeys: 10 },
  Enterprise: { perMinute: 600,   perDay: 500_000,   maxApps: 50, maxKeys: 50 },
  Partner:    { perMinute: 2_000, perDay: 2_000_000, maxApps: 200, maxKeys: 200 },
  Sovereign:  { perMinute: 10_000, perDay: 10_000_000, maxApps: -1, maxKeys: -1 },
};

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `onyx_${randomBytes(32).toString("base64url")}`;
  const prefix = raw.slice(0, 12);
  const hash = hashKey(raw);
  return { raw, prefix, hash };
}

router.post("/developer/apps", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { appName, description, websiteUrl, callbackUrls } = req.body;
  if (!appName) { res.status(400).json({ error: "appName required" }); return; }
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const [app] = await db.insert(developerAppsTable).values({
      userId, appName, appSlug: slug, description, websiteUrl,
      callbackUrls: callbackUrls ?? [],
    }).returning();
    logger.info({ appId: app.id, slug }, "[developer-platform] App registered");
    res.status(201).json({ app });
  } catch (e: any) {
    if (e.code === "23505") { res.status(409).json({ error: "App slug already exists" }); return; }
    throw e;
  }
});

router.get("/developer/apps", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const apps = await db.select().from(developerAppsTable).where(eq(developerAppsTable.userId, userId)).orderBy(desc(developerAppsTable.createdAt));
  res.json({ apps });
});

router.get("/developer/apps/:id", requireAuth, async (req: Request, res: Response) => {
  const appId = parseInt(req.params.id ?? "0");
  const [app] = await db.select().from(developerAppsTable).where(eq(developerAppsTable.id, appId));
  if (!app) { res.status(404).json({ error: "App not found" }); return; }
  const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.appId, appId));
  const webhooks = await db.select().from(webhookEndpointsTable).where(eq(webhookEndpointsTable.appId, appId));
  res.json({ app, keys: keys.map(k => ({ ...k, keyHash: undefined })), webhooks });
});

router.post("/developer/apps/:id/keys", requireAuth, async (req: Request, res: Response) => {
  const appId = parseInt(req.params.id ?? "0");
  const { label, permissions } = req.body;
  const [app] = await db.select().from(developerAppsTable).where(eq(developerAppsTable.id, appId));
  if (!app) { res.status(404).json({ error: "App not found" }); return; }
  const limits = TIER_LIMITS[app.tier] ?? TIER_LIMITS.Free;
  const { raw, prefix, hash } = generateApiKey();
  const [key] = await db.insert(apiKeysTable).values({
    appId, keyHash: hash, keyPrefix: prefix, label,
    permissions: permissions ?? ["read"],
    rateLimitPerMinute: limits.perMinute,
    rateLimitPerDay: limits.perDay,
  }).returning();
  logger.info({ keyId: key.id, appId, prefix }, "[developer-platform] API key issued");
  res.status(201).json({ key: { ...key, keyHash: undefined }, rawKey: raw, warning: "Store this key securely — it cannot be retrieved again" });
});

router.delete("/developer/keys/:id", requireAuth, async (req: Request, res: Response) => {
  const keyId = parseInt(req.params.id ?? "0");
  await db.update(apiKeysTable).set({ status: "Revoked" }).where(eq(apiKeysTable.id, keyId));
  res.json({ success: true, revoked: keyId });
});

router.post("/developer/apps/:id/webhooks", requireAuth, async (req: Request, res: Response) => {
  const appId = parseInt(req.params.id ?? "0");
  const { url, events } = req.body;
  if (!url || !events?.length) { res.status(400).json({ error: "url and events[] required" }); return; }
  const secret = randomBytes(32).toString("hex");
  const secretHash = hashKey(secret);
  const [wh] = await db.insert(webhookEndpointsTable).values({
    appId, url, events, secretHash,
  }).returning();
  logger.info({ webhookId: wh.id, appId, events }, "[developer-platform] Webhook registered");
  res.status(201).json({ webhook: wh, signingSecret: secret, warning: "Store this secret — it cannot be retrieved again" });
});

router.get("/developer/webhooks/:id/deliveries", requireAuth, async (req: Request, res: Response) => {
  const endpointId = parseInt(req.params.id ?? "0");
  const deliveries = await db.select().from(webhookDeliveriesTable).where(eq(webhookDeliveriesTable.endpointId, endpointId)).orderBy(desc(webhookDeliveriesTable.createdAt)).limit(50);
  res.json({ deliveries });
});

router.get("/developer/tiers", (_req: Request, res: Response) => {
  res.json({
    tiers: Object.entries(TIER_LIMITS).map(([name, limits]) => ({ name, ...limits })),
    events: [
      "deal.created", "deal.closed", "deal.funded",
      "vehicle.listed", "vehicle.sold", "vehicle.inspected",
      "member.joined", "member.upgraded",
      "payment.completed", "payment.failed",
      "telemetry.alert", "telemetry.dtc_detected",
      "commission.earned", "commission.paid",
      "plugin.installed", "plugin.event",
    ],
  });
});

router.get("/developer/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const apps = await db.select().from(developerAppsTable).where(eq(developerAppsTable.userId, userId));
  const totalApps = apps.length;
  const totalRequests = apps.reduce((s, a) => s + (a.totalRequests ?? 0), 0);
  const monthlyRequests = apps.reduce((s, a) => s + (a.monthlyRequests ?? 0), 0);
  res.json({ totalApps, totalRequests, monthlyRequests, tier: apps[0]?.tier ?? "Free" });
});

export default router;
