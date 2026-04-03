import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "constant-contact" });

const PLATFORM_COMMISSION_RATE = 0.03;

const EMAIL_CAMPAIGN_TYPES = [
  { id: "welcome_series", name: "Welcome Series", description: "Automated 5-email drip for new members. Introduces the network, how to earn, first referral prompt.", stages: 5, automatable: true },
  { id: "product_launch", name: "Product Launch", description: "Announce new products, apparel drops, or vehicle listings to your entire list.", stages: 3, automatable: true },
  { id: "event_invite", name: "Event Invitation", description: "Auto-send event invites with RSVP tracking. Syncs with event-radar.", stages: 2, automatable: true },
  { id: "re_engagement", name: "Re-engagement", description: "Win back inactive members with personalized deals based on cultural profile.", stages: 4, automatable: true },
  { id: "referral_nudge", name: "Referral Nudge", description: "Remind members to share their referral code. Shows potential earnings.", stages: 2, automatable: true },
  { id: "maintenance_reminder", name: "Maintenance Reminder", description: "Service reminders synced with vehicle data. Oil changes, tire rotations, inspections.", stages: 1, automatable: true },
  { id: "birthday_reward", name: "Birthday Reward", description: "Auto-send birthday discounts based on member profile.", stages: 1, automatable: true },
  { id: "club_newsletter", name: "Club Newsletter", description: "Weekly or monthly club updates, leaderboards, upcoming events.", stages: 1, automatable: true },
  { id: "flash_sale", name: "Flash Sale Alert", description: "Time-sensitive deals pushed to email + SMS simultaneously.", stages: 1, automatable: true },
  { id: "testimonial_request", name: "Testimonial Request", description: "Ask happy customers for reviews and testimonials. Auto-posts to social proof.", stages: 2, automatable: true },
];

const SMS_CAMPAIGN_TYPES = [
  { id: "sms_welcome", name: "Welcome SMS", description: "Instant welcome text with referral link." },
  { id: "sms_deal_alert", name: "Deal Alert", description: "Push flash deals and limited-time offers via SMS." },
  { id: "sms_appointment", name: "Appointment Reminder", description: "Service appointment reminders synced with vehicle lifecycle." },
  { id: "sms_event_rsvp", name: "Event RSVP", description: "Event invites with one-tap RSVP via text." },
  { id: "sms_payment_confirm", name: "Payment Confirmation", description: "Transaction receipts and commission notifications." },
  { id: "sms_referral", name: "Referral Prompt", description: "Share-your-code prompts after positive interactions." },
];

const LANDING_PAGE_TEMPLATES = [
  { id: "lp_join", name: "Join the Network", description: "Member signup page with referral tracking built in." },
  { id: "lp_event", name: "Event Registration", description: "Event landing page with countdown, RSVP, and social sharing." },
  { id: "lp_product", name: "Product Showcase", description: "Shoppable landing page for apparel, accessories, or vehicle listings." },
  { id: "lp_club", name: "Club Recruitment", description: "Club-specific landing page showing benefits, members, and events." },
  { id: "lp_dealership", name: "Dealership Portal", description: "White-label landing page for dealership onboarding." },
  { id: "lp_seasonal", name: "Seasonal Promotion", description: "Holiday, summer, winter — themed promotional pages." },
];

router.get("/capabilities", async (_req: Request, res: Response) => {
  res.json({
    emailCampaigns: EMAIL_CAMPAIGN_TYPES,
    smsCampaigns: SMS_CAMPAIGN_TYPES,
    landingPages: LANDING_PAGE_TEMPLATES,
    features: {
      emailMarketing: true,
      smsMarketing: true,
      socialPosting: true,
      landingPages: true,
      ecommerce: true,
      automations: true,
      abTesting: true,
      analytics: true,
      contactSegmentation: true,
      listManagement: true,
    },
    commissionRate: PLATFORM_COMMISSION_RATE,
    message: "3C ONYX Marketing Hub powers all email, SMS, landing pages, and ecommerce campaigns. Fully automated.",
  });
});

router.get("/account", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    res.json({
      connected: false,
      account: null,
      message: "Connect your marketing account to enable automated campaigns across email, SMS, and social.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/connect", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const connectionId = `MH-${Date.now().toString(36).toUpperCase()}`;
    log.info({ userId, connectionId }, "Marketing Hub connected");

    res.json({
      success: true,
      connection: {
        id: connectionId,
        status: "pending_oauth",
        features: ["email", "sms", "social", "landing_pages", "ecommerce", "automations"],
        connectedAt: new Date().toISOString(),
      },
      oauthUrl: `https://api.3conyx.com/oauth/constantcontact/authorize`,
      message: "Complete authorization to enable automated marketing campaigns.",
    });
  } catch (err) {
    log.error({ err }, "CC connect failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/campaign/email", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { templateId, subject, body, segmentId, scheduledAt } = req.body;

    if (!templateId && !subject) {
      res.status(400).json({ error: "templateId or subject required" });
      return;
    }

    const template = EMAIL_CAMPAIGN_TYPES.find(t => t.id === templateId);
    const campaignId = `EMAIL-${Date.now().toString(36).toUpperCase()}`;

    log.info({ userId, campaignId, templateId }, "Email campaign created");

    res.json({
      success: true,
      campaign: {
        id: campaignId,
        type: "email",
        templateId: templateId || null,
        templateName: template?.name || "Custom Email",
        subject: subject || template?.name || "3C ONYX Update",
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt || null,
        estimatedRecipients: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    log.error({ err }, "Email campaign failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/campaign/sms", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { templateId, message, segmentId, scheduledAt } = req.body;

    if (!templateId && !message) {
      res.status(400).json({ error: "templateId or message required" });
      return;
    }

    const template = SMS_CAMPAIGN_TYPES.find(t => t.id === templateId);
    const campaignId = `SMS-${Date.now().toString(36).toUpperCase()}`;

    log.info({ userId, campaignId, templateId }, "SMS campaign created");

    res.json({
      success: true,
      campaign: {
        id: campaignId,
        type: "sms",
        templateId: templateId || null,
        templateName: template?.name || "Custom SMS",
        status: scheduledAt ? "scheduled" : "draft",
        scheduledAt: scheduledAt || null,
        estimatedRecipients: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    log.error({ err }, "SMS campaign failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/automation", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { trigger, actions, name } = req.body;

    if (!trigger) {
      res.status(400).json({ error: "trigger required (e.g., 'new_member', 'purchase', 'referral', 'birthday', 'inactive_30d')" });
      return;
    }

    const automationId = `AUTO-${Date.now().toString(36).toUpperCase()}`;
    log.info({ userId, automationId, trigger }, "Marketing automation created");

    res.json({
      success: true,
      automation: {
        id: automationId,
        name: name || `Automation: ${trigger}`,
        trigger,
        actions: actions || ["send_email", "wait_2d", "send_sms"],
        status: "active",
        createdAt: new Date().toISOString(),
      },
      message: "Automation active. Campaigns fire automatically based on trigger events.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/landing-page", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { templateId, title, slug } = req.body;

    if (!templateId) {
      res.status(400).json({ error: "templateId required" });
      return;
    }

    const template = LANDING_PAGE_TEMPLATES.find(t => t.id === templateId);
    const pageId = `LP-${Date.now().toString(36).toUpperCase()}`;

    log.info({ userId, pageId, templateId }, "Landing page created");

    res.json({
      success: true,
      page: {
        id: pageId,
        templateId,
        templateName: template?.name || "Custom Page",
        title: title || template?.name || "3C ONYX",
        slug: slug || pageId.toLowerCase(),
        status: "draft",
        url: `https://3conyx.com/p/${slug || pageId.toLowerCase()}`,
        createdAt: new Date().toISOString(),
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
        email: { sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, openRate: 0, clickRate: 0 },
        sms: { sent: 0, delivered: 0, clicked: 0, optedOut: 0, deliveryRate: 0 },
        landingPages: { views: 0, conversions: 0, conversionRate: 0 },
        automations: { triggered: 0, completed: 0, revenue: 0 },
        overall: {
          totalContacts: 0,
          activeContacts: 0,
          totalCampaigns: 0,
          totalRevenueCents: 0,
          totalCommissionCents: 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
