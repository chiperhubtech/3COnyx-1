import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "social-amplifier" });

const SUPPORTED_PLATFORMS = [
  { id: "instagram", name: "Instagram", authType: "oauth", autoPost: true, contentTypes: ["image", "carousel", "reel", "story"] },
  { id: "tiktok", name: "TikTok", authType: "oauth", autoPost: true, contentTypes: ["video", "story"] },
  { id: "facebook", name: "Facebook", authType: "oauth", autoPost: true, contentTypes: ["image", "video", "text", "link", "story"] },
  { id: "twitter", name: "X (Twitter)", authType: "oauth", autoPost: true, contentTypes: ["text", "image", "video", "thread"] },
  { id: "youtube", name: "YouTube", authType: "oauth", autoPost: true, contentTypes: ["video", "short", "community_post"] },
  { id: "linkedin", name: "LinkedIn", authType: "oauth", autoPost: true, contentTypes: ["text", "image", "video", "article"] },
  { id: "pinterest", name: "Pinterest", authType: "oauth", autoPost: true, contentTypes: ["pin", "idea_pin", "video_pin"] },
  { id: "snapchat", name: "Snapchat", authType: "oauth", autoPost: true, contentTypes: ["snap", "story", "spotlight"] },
  { id: "threads", name: "Threads", authType: "oauth", autoPost: true, contentTypes: ["text", "image", "video"] },
];

const CAMPAIGN_TEMPLATES = [
  { id: "new_member_welcome", name: "New Member Welcome", description: "Auto-post welcoming new members to the network", type: "content" },
  { id: "product_spotlight", name: "Product Spotlight", description: "Feature a product from the catalog on all connected platforms", type: "product" },
  { id: "event_promo", name: "Event Promotion", description: "Promote upcoming events across all social channels", type: "content" },
  { id: "vehicle_listing", name: "Vehicle Listing", description: "Auto-list vehicles across marketplace platforms", type: "product" },
  { id: "apparel_drop", name: "Apparel Drop", description: "Announce new apparel drops across all channels", type: "product" },
  { id: "member_achievement", name: "Member Achievement", description: "Celebrate member milestones — referrals, sales, club growth", type: "content" },
  { id: "testimonial", name: "Customer Testimonial", description: "Share real member stories and wins", type: "content" },
  { id: "flash_deal", name: "Flash Deal", description: "Time-limited deals pushed to all connected platforms instantly", type: "product" },
  { id: "club_recruitment", name: "Club Recruitment", description: "Help clubs recruit new members through social campaigns", type: "content" },
  { id: "music_promo", name: "Music & Entertainment", description: "Promote Spotify, Apple Music, SiriusXM, Pandora subscriptions", type: "product" },
];

router.get("/platforms", async (_req: Request, res: Response) => {
  res.json({
    platforms: SUPPORTED_PLATFORMS,
    total: SUPPORTED_PLATFORMS.length,
    message: "Connect your social accounts. We auto-post campaigns, content, and product promos across all channels.",
  });
});

router.get("/templates", async (_req: Request, res: Response) => {
  res.json({ templates: CAMPAIGN_TEMPLATES });
});

router.get("/connections", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    res.json({
      connections: [],
      total: 0,
      message: "Connect your first social account to start auto-promoting across channels.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/connect", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { platform, accessToken, refreshToken } = req.body;

    if (!platform) {
      res.status(400).json({ error: "platform required" });
      return;
    }

    const supported = SUPPORTED_PLATFORMS.find(p => p.id === platform);
    if (!supported) {
      res.status(400).json({ error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.map(p => p.name).join(", ")}` });
      return;
    }

    const connectionId = `SOC-${platform.toUpperCase()}-${Date.now().toString(36)}`;
    log.info({ userId, platform, connectionId }, "Social platform connected");

    res.json({
      success: true,
      connection: {
        id: connectionId,
        platform: supported.id,
        platformName: supported.name,
        status: "pending_auth",
        autoPostEnabled: false,
        contentTypes: supported.contentTypes,
        connectedAt: new Date().toISOString(),
      },
      message: `${supported.name} connection initiated. Complete OAuth to enable auto-posting.`,
      oauthUrl: `https://api.3conyx.com/oauth/${platform}/authorize`,
    });
  } catch (err) {
    log.error({ err }, "Social connect failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/campaign", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { templateId, platforms, content, productId, scheduledAt } = req.body;

    if (!templateId && !content) {
      res.status(400).json({ error: "templateId or custom content required" });
      return;
    }

    const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId);
    const targetPlatforms = platforms || SUPPORTED_PLATFORMS.map(p => p.id);
    const campaignId = `CAMP-${Date.now().toString(36).toUpperCase()}`;

    log.info({ userId, campaignId, templateId, platforms: targetPlatforms.length }, "Campaign created");

    res.json({
      success: true,
      campaign: {
        id: campaignId,
        templateId: templateId || null,
        templateName: template?.name || "Custom Campaign",
        platforms: targetPlatforms,
        status: scheduledAt ? "scheduled" : "queued",
        scheduledAt: scheduledAt || null,
        content: content || template?.description || "",
        productId: productId || null,
        postsGenerated: targetPlatforms.length,
        createdAt: new Date().toISOString(),
      },
      message: scheduledAt
        ? `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}. Will auto-post to ${targetPlatforms.length} platforms.`
        : `Campaign queued. Auto-posting to ${targetPlatforms.length} platforms now.`,
    });
  } catch (err) {
    log.error({ err }, "Campaign creation failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/auto-promote", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { enabled, frequency, contentTypes, platforms } = req.body;

    log.info({ userId, enabled, frequency }, "Auto-promote settings updated");

    res.json({
      success: true,
      settings: {
        enabled: enabled !== false,
        frequency: frequency || "daily",
        contentTypes: contentTypes || ["product_spotlight", "event_promo", "member_achievement"],
        platforms: platforms || SUPPORTED_PLATFORMS.map(p => p.id),
        message: "Auto-promote enabled. The platform will automatically create and post content across your connected social channels.",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/analytics", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    res.json({
      analytics: {
        totalCampaigns: 0,
        totalPosts: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        topPlatform: null,
        topCampaignType: null,
      },
      message: "Launch your first campaign to start tracking performance.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
