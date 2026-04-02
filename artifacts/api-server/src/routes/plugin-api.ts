import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { db, pluginsTable, pluginInstallsTable, developerAppsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const SYSTEM_PLUGINS = [
  { pluginSlug: "onyx-guardian", name: "ONYX Guardian Agent", category: "AI_Agent" as const, description: "Autonomous vehicle protection, recall monitoring, and safety scoring", version: "3.0.0", installCount: 1247, rating: 98 },
  { pluginSlug: "onyx-bird-dog", name: "Bird-Dog Referral Engine", category: "Marketing" as const, description: "Zero-CAC viral distribution protocol with multi-level attribution", version: "2.5.0", installCount: 1247, rating: 96 },
  { pluginSlug: "onyx-fi-agent", name: "F&I Autonomous Agent", category: "Payments" as const, description: "Automated finance and insurance product matching with compliance", version: "2.0.0", installCount: 890, rating: 94 },
  { pluginSlug: "onyx-marketplace", name: "ONYX Marketplace Connector", category: "Inventory" as const, description: "Multi-source inventory aggregation from 50+ automotive marketplaces", version: "1.8.0", installCount: 756, rating: 92 },
  { pluginSlug: "onyx-fleet-telemetry", name: "Fleet Telemetry Pipeline", category: "IoT" as const, description: "OBD-II + connected car data ingestion with predictive maintenance", version: "1.5.0", installCount: 423, rating: 91 },
  { pluginSlug: "onyx-compliance-shield", name: "Compliance Shield", category: "Compliance" as const, description: "Multi-jurisdiction regulatory compliance with automated reporting", version: "1.2.0", installCount: 312, rating: 95 },
  { pluginSlug: "onyx-dealer-crm", name: "Dealer CRM Bridge", category: "CRM" as const, description: "Bi-directional sync with VinSolutions, DealerSocket, and CDK", version: "2.1.0", installCount: 645, rating: 89 },
  { pluginSlug: "onyx-transport", name: "Transport Orchestrator", category: "Logistics" as const, description: "Automated vehicle transport coordination with real-time tracking", version: "1.7.0", installCount: 234, rating: 90 },
];

router.get("/plugins/marketplace", (_req: Request, res: Response) => {
  res.json({
    plugins: SYSTEM_PLUGINS.map(p => ({
      ...p, status: "Published", isSandboxed: true, isSystem: true,
      architect: "Ronald Antonio Cadet",
    })),
    categories: ["Analytics", "Payments", "Inventory", "CRM", "Logistics", "Insurance", "Compliance", "Marketing", "AI_Agent", "IoT", "Custom"],
    totalPlugins: SYSTEM_PLUGINS.length,
  });
});

router.get("/plugins", requireAuth, async (_req: Request, res: Response) => {
  const plugins = await db.select().from(pluginsTable).orderBy(desc(pluginsTable.createdAt));
  const combined = [...SYSTEM_PLUGINS.map((p, i) => ({ id: -(i + 1), appId: 0, ...p, status: "Published" as const, entryPoint: `@onyx/${p.pluginSlug}`, permissions: ["read"], configSchema: null, iconUrl: null, isSandboxed: true, maxMemoryMb: 256, timeoutMs: 30000, metadata: null, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() })), ...plugins];
  res.json({ plugins: combined });
});

router.post("/plugins", requireAuth, async (req: Request, res: Response) => {
  const { appId, name, description, category, entryPoint, permissions, configSchema } = req.body;
  if (!appId || !name || !entryPoint) {
    res.status(400).json({ error: "appId, name, and entryPoint required" }); return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const [plugin] = await db.insert(pluginsTable).values({
      appId, pluginSlug: slug, name, description,
      category: category ?? "Custom", entryPoint,
      permissions: permissions ?? ["read"],
      configSchema: configSchema ?? null,
    }).returning();
    logger.info({ pluginId: plugin.id, slug }, "[plugins] Plugin registered");
    res.status(201).json({ plugin });
  } catch (e: any) {
    if (e.code === "23505") { res.status(409).json({ error: "Plugin slug exists" }); return; }
    throw e;
  }
});

router.post("/plugins/:id/install", requireAuth, async (req: Request, res: Response) => {
  const pluginId = parseInt(req.params.id ?? "0");
  const userId = (req as any).user?.id;
  const { config } = req.body;
  const [install] = await db.insert(pluginInstallsTable).values({
    pluginId, installedBy: userId, config: config ?? {},
  }).returning();
  if (pluginId > 0) {
    await db.update(pluginsTable)
      .set({ installCount: sql`${pluginsTable.installCount} + 1` })
      .where(eq(pluginsTable.id, pluginId));
  }
  logger.info({ pluginId, userId }, "[plugins] Plugin installed");
  res.status(201).json({ install });
});

router.delete("/plugins/installs/:id", requireAuth, async (req: Request, res: Response) => {
  const installId = parseInt(req.params.id ?? "0");
  await db.update(pluginInstallsTable).set({ isActive: false }).where(eq(pluginInstallsTable.id, installId));
  res.json({ success: true, uninstalled: installId });
});

router.get("/plugins/runtime", (_req: Request, res: Response) => {
  res.json({
    protocol: "ONYX Plugin Runtime v1.0",
    executionModel: "Sandboxed V8 isolates with memory limits",
    capabilities: [
      "Database read/write (scoped to plugin namespace)",
      "HTTP outbound (allowlisted domains)",
      "WebSocket event subscription",
      "Agent mesh message passing",
      "Telemetry stream consumption",
      "Settlement API access (with approval)",
    ],
    limits: { maxMemoryMb: 256, maxCpuMs: 30000, maxHttpOutbound: 100, maxDbQueries: 1000 },
    lifecycle: ["Draft → Review → Published → Suspended → Deprecated"],
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
  });
});

export default router;
