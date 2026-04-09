import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  getHubSpotStatus,
  getPipelines,
  getCustomProperties,
  syncContactToHubSpot,
  createHubSpotDeal,
  getHubSpotContacts,
  getHubSpotDeals,
  getHubSpotAnalytics,
  initHubSpot,
} from "../lib/hubspotIntegration";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "hubspot-routes" });

router.get("/status", (_req: Request, res: Response) => {
  res.json(getHubSpotStatus());
});

router.post("/connect", requireAuth, (req: Request, res: Response) => {
  const { apiKey, portalId } = req.body as { apiKey?: string; portalId?: string };
  if (!apiKey) {
    res.status(400).json({ error: "apiKey required" });
    return;
  }
  const success = initHubSpot({ apiKey, portalId });
  log.info({ portalId }, "HubSpot connected via API");
  res.json({ success, message: "HubSpot CRM connected successfully" });
});

router.get("/pipelines", requireAuth, (_req: Request, res: Response) => {
  res.json({ pipelines: getPipelines() });
});

router.get("/properties", requireAuth, (_req: Request, res: Response) => {
  res.json({ properties: getCustomProperties() });
});

router.get("/contacts", requireAuth, (req: Request, res: Response) => {
  const { lifecycleStage, leadSource } = req.query as Record<string, string>;
  const contacts = getHubSpotContacts({ lifecycleStage, leadSource });
  res.json({ contacts, total: contacts.length });
});

router.post("/contacts", requireAuth, (req: Request, res: Response) => {
  const { email, firstName, lastName, phone, company, memberId, referralCode, vehicleInterest, leadSource } = req.body;
  if (!email || !firstName) {
    res.status(400).json({ error: "email and firstName required" });
    return;
  }
  const contact = syncContactToHubSpot({ email, firstName, lastName, phone, company, memberId, referralCode, vehicleInterest, leadSource });
  res.status(201).json({ contact, synced: true });
});

router.get("/deals", requireAuth, (req: Request, res: Response) => {
  const { pipeline, stage } = req.query as Record<string, string>;
  const deals = getHubSpotDeals({ pipeline, stage });
  res.json({ deals, total: deals.length });
});

router.post("/deals", requireAuth, (req: Request, res: Response) => {
  const { name, amount, pipelineId, stageId, contactEmail, vehicleVin, vehicleMake, vehicleModel, vehicleYear } = req.body;
  if (!name || !amount) {
    res.status(400).json({ error: "name and amount required" });
    return;
  }
  const deal = createHubSpotDeal({ name, amount, pipelineId, stageId, contactEmail, vehicleVin, vehicleMake, vehicleModel, vehicleYear });
  res.status(201).json({ deal, synced: true });
});

router.get("/analytics", requireAuth, (_req: Request, res: Response) => {
  res.json(getHubSpotAnalytics());
});

router.post("/webhook", (req: Request, res: Response) => {
  const events = req.body;
  log.info({ eventCount: Array.isArray(events) ? events.length : 1 }, "HubSpot webhook received");
  res.json({ received: true, processed: Date.now() });
});

export default router;
