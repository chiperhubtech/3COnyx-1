import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { optionalAuth } from "../middlewares/requireAuth";
import {
  getTikTokStatus,
  getCampaignTemplates,
  getAutomotiveAudiences,
  createCampaign,
  getCampaigns,
  getCampaignAnalytics,
  ingestTikTokLead,
  getTikTokLeads,
  initTikTokAds,
  generateShareLink,
  getTikTokShareUrl,
} from "../lib/tiktokAdsIntegration";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "tiktok-ads-routes" });

router.get("/status", (_req: Request, res: Response) => {
  res.json(getTikTokStatus());
});

router.post("/connect", requireAuth, (req: Request, res: Response) => {
  const { accessToken, advertiserId, appId, appSecret } = req.body as Record<string, string>;
  if (!accessToken || !advertiserId) {
    res.status(400).json({ error: "accessToken and advertiserId required" });
    return;
  }
  initTikTokAds({ accessToken, advertiserId, appId, appSecret });
  log.info({ advertiserId }, "TikTok Ads connected");
  res.json({ success: true, message: "TikTok Ads connected successfully" });
});

router.get("/templates", (_req: Request, res: Response) => {
  res.json({ templates: getCampaignTemplates() });
});

router.get("/audiences", (_req: Request, res: Response) => {
  res.json({ audiences: getAutomotiveAudiences() });
});

router.get("/campaigns", requireAuth, (_req: Request, res: Response) => {
  res.json({ campaigns: getCampaigns() });
});

router.post("/campaigns", requireAuth, (req: Request, res: Response) => {
  const { name, templateId, objective, dailyBudget, targetAudienceId } = req.body;
  if (!dailyBudget) {
    res.status(400).json({ error: "dailyBudget required" });
    return;
  }
  const campaign = createCampaign({ name, templateId, objective, dailyBudget, targetAudienceId });
  res.status(201).json({ campaign, created: true });
});

router.get("/analytics", requireAuth, (_req: Request, res: Response) => {
  res.json(getCampaignAnalytics());
});

router.get("/leads", requireAuth, (_req: Request, res: Response) => {
  res.json({ leads: getTikTokLeads() });
});

router.post("/leads/ingest", (req: Request, res: Response) => {
  const { campaignId, adGroupId, email, firstName, lastName, phone, vehicleInterest, adName } = req.body;
  if (!campaignId || !email || !firstName) {
    res.status(400).json({ error: "campaignId, email, and firstName required" });
    return;
  }
  const lead = ingestTikTokLead({ campaignId, adGroupId, email, firstName, lastName, phone, vehicleInterest, adName });
  res.json({ lead, ingested: true, syncedToHubSpot: lead.syncedToHubSpot });
});

router.get("/share-link", optionalAuth, (req: Request, res: Response) => {
  const referralCode = (req.query.ref as string) || "ONYX";
  const campaignId = req.query.campaignId as string | undefined;
  const shareLink = generateShareLink(referralCode, campaignId);
  const tiktokShareUrl = getTikTokShareUrl({ referralCode, campaignId });
  res.json({ shareLink, tiktokShareUrl, referralCode });
});

router.post("/webhook", (req: Request, res: Response) => {
  const payload = req.body;
  log.info({ eventType: payload?.event_type }, "TikTok webhook received");

  if (payload?.event_type === "lead" && payload?.lead_data) {
    const data = payload.lead_data;
    ingestTikTokLead({
      campaignId: data.campaign_id || "webhook",
      adGroupId: data.ad_group_id,
      email: data.email,
      firstName: data.first_name || data.name?.split(" ")[0] || "Unknown",
      lastName: data.last_name || data.name?.split(" ").slice(1).join(" ") || "",
      phone: data.phone,
      vehicleInterest: data.custom_fields?.vehicle_interest,
      adName: data.ad_name,
    });
  }

  res.json({ received: true });
});

export default router;
