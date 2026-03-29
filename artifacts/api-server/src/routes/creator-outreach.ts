/**
 * 3C ONYX — Creator Outreach Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Social Blade + SHOUT + AI Agent powered creator discovery and outreach.
 * Finds automotive content creators, grades them, generates AI-personalized
 * outreach messages, and fires via I-95 (Twilio/SendGrid) or SHOUT campaigns.
 *
 * Routes:
 *   GET  /creator-outreach/discover              — Social Blade search with filters
 *   POST /creator-outreach/creators              — Save a creator to DB
 *   GET  /creator-outreach/creators              — List all with optional status filter
 *   PATCH /creator-outreach/creators/:id/status  — Update outreach status
 *   POST /creator-outreach/campaigns             — Create a campaign
 *   GET  /creator-outreach/campaigns             — List campaigns
 *   POST /creator-outreach/shout/campaigns       — Create SHOUT campaign
 *   GET  /creator-outreach/shout/campaigns/:id   — Get SHOUT campaign status
 *   POST /creator-outreach/preview-message       — AI preview without sending
 *   POST /creator-outreach/outreach/:id          — AI generate + fire via I-95/SHOUT
 *   GET  /creator-outreach/log                   — Full outreach activity log
 *   GET  /creator-outreach/stats                 — Dashboard aggregate numbers
 *
 * SECURITY: All routes require Auth + Admin role.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  creatorProfilesTable,
  creatorCampaignsTable,
  creatorOutreachLogTable,
} from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";
import { PRIMARY_DOMAIN } from "../lib/domainConfig";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

// All creator-outreach routes require Admin auth
router.use("/creator-outreach", requireAuth, requireRole("Admin"));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateReferralCode(handle: string): string {
  const slug = handle.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const rand = crypto.randomBytes(3).toString("hex");
  return `CR-${slug}-${rand}`.toUpperCase();
}

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E+", "E", "E-", "N/A"];

function gradeRank(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx === -1 ? GRADE_ORDER.length : idx;
}

function meetsMinGrade(creatorGrade: string, minGrade: string): boolean {
  return gradeRank(creatorGrade) <= gradeRank(minGrade);
}

// ─── Social Blade platform-specific URL builder ───────────────────────────────
function buildSocialBladeUrl(keyword: string, platform: string, limit: string): string {
  const encodedKeyword = encodeURIComponent(keyword);
  const lp = platform.toLowerCase();
  // Social Blade Matrix API endpoints per platform
  const endpoints: Record<string, string> = {
    youtube:   `https://matrix.socialblade.com/youtube/search?q=${encodedKeyword}&limit=${limit}`,
    tiktok:    `https://matrix.socialblade.com/tiktok/search?q=${encodedKeyword}&limit=${limit}`,
    instagram: `https://matrix.socialblade.com/instagram/search?q=${encodedKeyword}&limit=${limit}`,
    twitch:    `https://matrix.socialblade.com/twitch/search?q=${encodedKeyword}&limit=${limit}`,
    facebook:  `https://matrix.socialblade.com/facebook/search?q=${encodedKeyword}&limit=${limit}`,
  };
  return endpoints[lp] ?? endpoints.youtube;
}

// ─── AI Message Generator ─────────────────────────────────────────────────────
async function generateCreatorMessage(
  creator: typeof creatorProfilesTable.$inferSelect,
  campaign: typeof creatorCampaignsTable.$inferSelect | null,
): Promise<string> {
  const referralLink = `${PRIMARY_DOMAIN}/join?ref=${creator.referralCode ?? creator.handle}`;
  const commissionPct = campaign?.commissionPct ?? "10";
  const launchDate = campaign?.launchDate ?? "Q1 2026";

  const prompt = `You are the ONYX Creator Agent for 3C ONYX, the AI-powered automotive platform built by Ron (founder of CUXTOMCANDYCLUB LLC).

Generate a personalized affiliate outreach message for this content creator:
- Platform: ${creator.platform}
- Handle: @${creator.handle}
- Followers: ${creator.followerCount?.toLocaleString()}
- Grade: ${creator.grade}
- Niche: ${creator.niche || "automotive"}

Campaign details:
- Commission: ${commissionPct}% on every founding member they refer
- Launch date: ${launchDate}
- Member benefits: ${campaign?.memberBenefits || "Founding member pricing locked forever, Dynasty Wallet revenue sharing, Guardian V2X priority access"}
- Talking points: ${campaign?.talkingPoints || "3C ONYX connects underserved communities to luxury automotive services via AI — concierge, marketplace, parts sourcing, fleet management, insurance"}
- Their personal referral link: ${referralLink}
- Brief: ${campaign?.briefText || "Build the 3C ONYX launch ambassador network"}

The message MUST include:
1. Who Ron is and his background (founder of CUXTOMCANDYCLUB LLC, building 3C ONYX for underserved communities)
2. What 3C ONYX is (AI-powered automotive platform — the trust layer between consumers and the auto industry)
3. Why THIS SPECIFIC CREATOR was chosen (be specific to their platform, niche, and reach — they are clearly influential in the ${creator.niche || "automotive"} space with ${creator.followerCount?.toLocaleString()} followers and a ${creator.grade} Social Blade grade)
4. The exact affiliate commission rate (${commissionPct}%)
5. Founding member benefits for their audience
6. Their personalized referral link: ${referralLink}

Tone: Professional but genuine. Warm, not generic. Luxury brand energy but approachable. 
Length: 150–250 words.
Format: Plain text (no markdown, no bullet points — this will be sent as an email/SMS).`;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Social Blade Discovery ───────────────────────────────────────────────────
// GET /creator-outreach/discover
router.get("/creator-outreach/discover", async (req: Request, res: Response) => {
  const sbKey = process.env["SOCIALBLADE_API_KEY"];

  if (!sbKey) {
    res.status(200).json({
      setupRequired: true,
      message: "Social Blade API key not configured. Add SOCIALBLADE_API_KEY to your environment secrets to enable creator discovery.",
      instructions: [
        "1. Visit https://socialblade.com/auth/developer to get your API key",
        "2. Add SOCIALBLADE_API_KEY to your Replit environment secrets",
        "3. Restart the API server",
        "4. Return here to search for creators",
      ],
      creators: [],
    });
    return;
  }

  const {
    keyword = "automotive",
    platform = "youtube",
    minGrade = "B",
    minFollowers = "0",
    maxFollowers = "999999999",
    limit = "20",
  } = req.query as Record<string, string>;

  try {
    const sbUrl = buildSocialBladeUrl(keyword, platform, limit);
    const sbRes = await fetch(sbUrl, {
      headers: {
        "Authorization": `Bearer ${sbKey}`,
        "Accept": "application/json",
      },
    });

    if (!sbRes.ok) {
      const errText = await sbRes.text();
      res.status(502).json({ error: `Social Blade API error: ${sbRes.status}`, detail: errText });
      return;
    }

    const sbData = await sbRes.json() as { data?: any[] };
    const raw = Array.isArray(sbData.data) ? sbData.data : [];

    const creators = raw
      .map((item: any) => ({
        platform: platform.toLowerCase(),
        handle:        item.username || item.handle || item.channel_name || "",
        followerCount: item.subscribers || item.followers || item.follower_count || 0,
        grade:         item.grade || "N/A",
        sbRank:        item.rank || null,
        niche:         item.category || item.niche || keyword,
      }))
      .filter((c: any) => {
        const fc = Number(c.followerCount);
        return (
          fc >= Number(minFollowers) &&
          fc <= Number(maxFollowers) &&
          meetsMinGrade(c.grade, minGrade)
        );
      })
      .sort((a: any, b: any) => gradeRank(a.grade) - gradeRank(b.grade));

    res.json({ creators, total: creators.length, keyword, platform, minGrade });
  } catch (err) {
    res.status(500).json({ error: "Social Blade request failed", detail: String(err) });
  }
});

// ─── Save Creator ─────────────────────────────────────────────────────────────
// POST /creator-outreach/creators
router.post("/creator-outreach/creators", async (req: Request, res: Response) => {
  const body = req.body as {
    platform: string;
    handle: string;
    followerCount?: number;
    grade?: string;
    sbRank?: number;
    niche?: string;
    contactEmail?: string;
    contactPhone?: string;
    campaignId?: number;
  };

  if (!body.platform || !body.handle) {
    res.status(400).json({ error: "platform and handle are required" });
    return;
  }

  try {
    const referralCode = generateReferralCode(body.handle);
    const [creator] = await db
      .insert(creatorProfilesTable)
      .values({
        platform:      body.platform,
        handle:        body.handle,
        followerCount: body.followerCount ?? 0,
        grade:         body.grade ?? "N/A",
        sbRank:        body.sbRank ?? null,
        niche:         body.niche ?? null,
        contactEmail:  body.contactEmail ?? null,
        contactPhone:  body.contactPhone ?? null,
        referralCode,
        campaignId:    body.campaignId ?? null,
        outreachStatus: "not_contacted",
      })
      .returning();

    res.status(201).json({ creator });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Creator already exists with this handle/platform" });
      return;
    }
    res.status(500).json({ error: "Failed to save creator", detail: String(err) });
  }
});

// ─── List Creators ────────────────────────────────────────────────────────────
// GET /creator-outreach/creators
router.get("/creator-outreach/creators", async (req: Request, res: Response) => {
  const { status, platform, campaignId } = req.query as Record<string, string>;

  try {
    let query = db.select().from(creatorProfilesTable).$dynamic();

    const conditions = [];
    if (status)     conditions.push(eq(creatorProfilesTable.outreachStatus, status));
    if (platform)   conditions.push(eq(creatorProfilesTable.platform, platform));
    if (campaignId) conditions.push(eq(creatorProfilesTable.campaignId, Number(campaignId)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const creators = await query.orderBy(desc(creatorProfilesTable.discoveredAt));
    res.json({ creators, total: creators.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch creators", detail: String(err) });
  }
});

// ─── Update Creator Status ────────────────────────────────────────────────────
// PATCH /creator-outreach/creators/:creatorId/status
router.patch("/creator-outreach/creators/:creatorId/status", async (req: Request, res: Response) => {
  const creatorId = Number(req.params["creatorId"]);
  const { outreachStatus } = req.body as { outreachStatus: string };

  if (!outreachStatus) {
    res.status(400).json({ error: "outreachStatus is required" });
    return;
  }

  try {
    const [updated] = await db
      .update(creatorProfilesTable)
      .set({ outreachStatus })
      .where(eq(creatorProfilesTable.id, creatorId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Creator not found" }); return; }
    res.json({ creator: updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed", detail: String(err) });
  }
});

// ─── Create Campaign ──────────────────────────────────────────────────────────
// POST /creator-outreach/campaigns
router.post("/creator-outreach/campaigns", async (req: Request, res: Response) => {
  const body = req.body as {
    name: string;
    briefText?: string;
    targetPlatforms?: string;
    targetMinGrade?: string;
    commissionPct?: number;
    launchDate?: string;
    talkingPoints?: string;
    memberBenefits?: string;
  };

  if (!body.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const [campaign] = await db
      .insert(creatorCampaignsTable)
      .values({
        name:            body.name,
        briefText:       body.briefText ?? null,
        targetPlatforms: body.targetPlatforms ?? "youtube,tiktok,instagram",
        targetMinGrade:  body.targetMinGrade ?? "B",
        commissionPct:   String(body.commissionPct ?? "10.00"),
        launchDate:      body.launchDate ?? null,
        talkingPoints:   body.talkingPoints ?? null,
        memberBenefits:  body.memberBenefits ?? null,
        status:          "active",
      })
      .returning();

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: "Failed to create campaign", detail: String(err) });
  }
});

// ─── List Campaigns ───────────────────────────────────────────────────────────
// GET /creator-outreach/campaigns
router.get("/creator-outreach/campaigns", async (_req: Request, res: Response) => {
  try {
    const campaigns = await db
      .select()
      .from(creatorCampaignsTable)
      .orderBy(desc(creatorCampaignsTable.createdAt));
    res.json({ campaigns, total: campaigns.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns", detail: String(err) });
  }
});

// ─── SHOUT Campaign Create ────────────────────────────────────────────────────
// POST /creator-outreach/shout/campaigns
router.post("/creator-outreach/shout/campaigns", async (req: Request, res: Response) => {
  const shoutKey = process.env["SHOUT_API_KEY"];
  const { campaignId } = req.body as { campaignId: number };

  if (!campaignId) {
    res.status(400).json({ error: "campaignId is required" });
    return;
  }

  const [campaign] = await db
    .select()
    .from(creatorCampaignsTable)
    .where(eq(creatorCampaignsTable.id, campaignId))
    .limit(1);

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  if (!shoutKey) {
    res.status(200).json({
      setupRequired: true,
      message: "SHOUT_API_KEY not configured. Add it to your environment secrets to enable SHOUT campaign management.",
      instructions: [
        "1. Sign up at https://shoutugc.com to get your API key",
        "2. Add SHOUT_API_KEY to your Replit environment secrets",
        "3. Restart the API server and retry",
      ],
      campaign,
    });
    return;
  }

  try {
    const shoutRes = await fetch("https://api.shoutugc.com/v1/campaigns", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${shoutKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name:          campaign.name,
        brief:         campaign.briefText,
        platforms:     campaign.targetPlatforms?.split(",") ?? ["youtube", "tiktok", "instagram"],
        commissionPct: campaign.commissionPct,
        launchDate:    campaign.launchDate,
      }),
    });

    if (!shoutRes.ok) {
      const errText = await shoutRes.text();
      res.status(502).json({ error: `SHOUT API error: ${shoutRes.status}`, detail: errText });
      return;
    }

    const shoutData = await shoutRes.json() as { id?: string };
    const shoutCampaignId = shoutData.id ?? `shout-${Date.now()}`;

    // Store SHOUT campaign ID in our DB
    const [updated] = await db
      .update(creatorCampaignsTable)
      .set({ shoutCampaignId })
      .where(eq(creatorCampaignsTable.id, campaignId))
      .returning();

    res.json({ shoutCampaignId, campaign: updated });
  } catch (err) {
    res.status(500).json({ error: "SHOUT campaign creation failed", detail: String(err) });
  }
});

// ─── SHOUT Campaign Status ────────────────────────────────────────────────────
// GET /creator-outreach/shout/campaigns/:shoutCampaignId
router.get("/creator-outreach/shout/campaigns/:shoutCampaignId", async (req: Request, res: Response) => {
  const shoutKey = process.env["SHOUT_API_KEY"];
  const { shoutCampaignId } = req.params as { shoutCampaignId: string };

  if (!shoutKey) {
    res.status(200).json({
      setupRequired: true,
      message: "SHOUT_API_KEY not configured.",
      shoutCampaignId,
    });
    return;
  }

  try {
    const shoutRes = await fetch(`https://api.shoutugc.com/v1/campaigns/${shoutCampaignId}`, {
      headers: { "Authorization": `Bearer ${shoutKey}` },
    });

    if (!shoutRes.ok) {
      const errText = await shoutRes.text();
      res.status(502).json({ error: `SHOUT API error: ${shoutRes.status}`, detail: errText });
      return;
    }

    const shoutData = await shoutRes.json();
    res.json({ status: shoutData });
  } catch (err) {
    res.status(500).json({ error: "SHOUT status fetch failed", detail: String(err) });
  }
});

// ─── AI Message Preview (no send) ────────────────────────────────────────────
// POST /creator-outreach/preview-message
router.post("/creator-outreach/preview-message", async (req: Request, res: Response) => {
  const { creatorId, campaignId } = req.body as { creatorId: number; campaignId?: number };

  const [creator] = await db
    .select()
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.id, creatorId))
    .limit(1);

  if (!creator) { res.status(404).json({ error: "Creator not found" }); return; }

  let campaign = null;
  if (campaignId) {
    const [c] = await db.select().from(creatorCampaignsTable).where(eq(creatorCampaignsTable.id, campaignId)).limit(1);
    campaign = c ?? null;
  }

  try {
    const aiMessage = await generateCreatorMessage(creator, campaign);
    const referralLink = `${PRIMARY_DOMAIN}/join?ref=${creator.referralCode ?? creator.handle}`;
    res.json({ aiMessage, referralLink, creator });
  } catch (err) {
    res.status(500).json({ error: "AI message generation failed", detail: String(err) });
  }
});

// ─── AI Outreach — Core Creator Agent ────────────────────────────────────────
// POST /creator-outreach/outreach/:creatorId
router.post("/creator-outreach/outreach/:creatorId", async (req: Request, res: Response) => {
  const creatorId = Number(req.params["creatorId"]);
  const { campaignId, channel = "email", editedMessage } = req.body as {
    campaignId?: number;
    channel?: "email" | "sms" | "shout";
    editedMessage?: string;
  };

  // Fetch creator
  const [creator] = await db
    .select()
    .from(creatorProfilesTable)
    .where(eq(creatorProfilesTable.id, creatorId))
    .limit(1);

  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  // Fetch campaign (if any)
  let campaign = null;
  if (campaignId) {
    const [c] = await db.select().from(creatorCampaignsTable).where(eq(creatorCampaignsTable.id, campaignId)).limit(1);
    campaign = c ?? null;
  }

  // ─── Creator Agent — AI message generation ────────────────────────────────
  let aiMessage = editedMessage ?? "";

  if (!aiMessage) {
    try {
      aiMessage = await generateCreatorMessage(creator, campaign);
    } catch (err) {
      res.status(500).json({ error: "AI message generation failed", detail: String(err) });
      return;
    }
  }

  // ─── SHOUT delivery ───────────────────────────────────────────────────────
  if (channel === "shout") {
    const shoutKey = process.env["SHOUT_API_KEY"];
    if (!shoutKey) {
      // Save to DB with shout_pending status, continue
      const [logEntry] = await db.insert(creatorOutreachLogTable).values({
        creatorId: creator.id,
        campaignId: campaignId ?? null,
        aiMessage,
        deliveryChannel: "shout_pending",
        responseStatus: "awaiting",
      }).returning();
      await db.update(creatorProfilesTable)
        .set({ outreachStatus: "messaged" })
        .where(eq(creatorProfilesTable.id, creatorId));

      res.json({
        sent: false,
        shoutRequired: true,
        message: "SHOUT_API_KEY not configured. Creator saved for manual SHOUT import. Message stored in outreach log.",
        aiMessage,
        logEntry,
        setupInstructions: [
          "1. Sign up at https://shoutugc.com to get your API key",
          "2. Add SHOUT_API_KEY to your Replit environment secrets",
          "3. Restart the API server and re-send",
        ],
      });
      return;
    }

    // Fire SHOUT API — add creator to campaign
    try {
      const shoutRes = await fetch("https://api.shoutugc.com/v1/campaigns/add-creator", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${shoutKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign?.shoutCampaignId ?? null,
          creatorHandle: creator.handle,
          platform: creator.platform,
          message: aiMessage,
        }),
      });

      if (!shoutRes.ok) {
        const errText = await shoutRes.text();
        res.status(502).json({ error: `SHOUT API error: ${shoutRes.status}`, detail: errText });
        return;
      }
    } catch (err) {
      res.status(502).json({ error: "SHOUT API request failed", detail: String(err) });
      return;
    }
  }

  // ─── Email delivery via SendGrid ──────────────────────────────────────────
  if (channel === "email") {
    if (!creator.contactEmail) {
      res.status(400).json({ error: "Creator has no email address on file. Add contactEmail to the creator profile before sending via email." });
      return;
    }
    const sgKey = process.env["SENDGRID_API_KEY"];
    if (!sgKey) {
      res.status(400).json({ error: "SENDGRID_API_KEY not configured. Add it to environment secrets to send emails." });
      return;
    }
    sgMail.setApiKey(sgKey);
    try {
      await sgMail.send({
        to: creator.contactEmail,
        from: { email: "ron@3conyx.com", name: "Ron | 3C ONYX" },
        subject: `3C ONYX Creator Partnership — @${creator.handle}`,
        text: aiMessage,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#fff;padding:32px 24px;border-radius:12px;">
          <div style="font-size:22px;font-weight:900;color:#C9A227;margin-bottom:4px;">3C ONYX</div>
          <div style="font-size:10px;color:#71717a;letter-spacing:3px;margin-bottom:24px;">CREATOR PARTNERSHIP</div>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:15px;line-height:1.7;color:#e4e4e7;">${aiMessage}</pre>
          <div style="margin-top:28px;padding-top:16px;border-top:1px solid #27272a;font-size:11px;color:#52525b;">
            CUXTOMCANDYCLUB LLC · 3C ONYX Platform · Reply to connect with Ron directly.
          </div>
        </div>`,
      });
    } catch (err) {
      res.status(502).json({ error: "SendGrid delivery failed", detail: String(err) });
      return;
    }
  }

  // ─── SMS delivery via Twilio ──────────────────────────────────────────────
  if (channel === "sms") {
    if (!creator.contactPhone) {
      res.status(400).json({ error: "Creator has no phone number on file. Add contactPhone to the creator profile before sending via SMS." });
      return;
    }
    const twilioSid   = process.env["TWILIO_ACCOUNT_SID"];
    const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
    const twilioFrom  = process.env["TWILIO_PHONE_NUMBER"];

    if (!twilioSid || !twilioToken || !twilioFrom) {
      res.status(400).json({ error: "Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in environment secrets." });
      return;
    }
    const twilioClient = twilio(twilioSid, twilioToken);
    try {
      await twilioClient.messages.create({
        body: aiMessage.slice(0, 1600),
        from: twilioFrom,
        to: creator.contactPhone,
      });
    } catch (err) {
      res.status(502).json({ error: "Twilio SMS delivery failed", detail: String(err) });
      return;
    }
  }

  // Save outreach log
  const [logEntry] = await db.insert(creatorOutreachLogTable).values({
    creatorId: creator.id,
    campaignId: campaignId ?? null,
    aiMessage,
    deliveryChannel: channel,
    responseStatus: "awaiting",
  }).returning();

  // Update creator status
  await db.update(creatorProfilesTable)
    .set({ outreachStatus: "messaged" })
    .where(eq(creatorProfilesTable.id, creatorId));

  const referralLink = `${PRIMARY_DOMAIN}/join?ref=${creator.referralCode ?? creator.handle}`;
  res.json({ sent: true, aiMessage, logEntry, referralLink });
});

// ─── Outreach Log ─────────────────────────────────────────────────────────────
// GET /creator-outreach/log
router.get("/creator-outreach/log", async (req: Request, res: Response) => {
  const { creatorId, campaignId } = req.query as Record<string, string>;

  try {
    let query = db
      .select({
        log: creatorOutreachLogTable,
        creator: {
          handle:   creatorProfilesTable.handle,
          platform: creatorProfilesTable.platform,
          grade:    creatorProfilesTable.grade,
        },
      })
      .from(creatorOutreachLogTable)
      .leftJoin(creatorProfilesTable, eq(creatorOutreachLogTable.creatorId, creatorProfilesTable.id))
      .$dynamic();

    const conditions = [];
    if (creatorId)  conditions.push(eq(creatorOutreachLogTable.creatorId, Number(creatorId)));
    if (campaignId) conditions.push(eq(creatorOutreachLogTable.campaignId, Number(campaignId)));

    if (conditions.length > 0) query = query.where(and(...conditions));

    const log = await query.orderBy(desc(creatorOutreachLogTable.sentAt)).limit(100);
    res.json({ log, total: log.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log", detail: String(err) });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// GET /creator-outreach/stats
router.get("/creator-outreach/stats", async (_req: Request, res: Response) => {
  try {
    const [stats] = await db.select({
      totalDiscovered: sql<number>`count(*)::int`,
      notContacted:    sql<number>`count(*) filter (where outreach_status = 'not_contacted')::int`,
      messaged:        sql<number>`count(*) filter (where outreach_status = 'messaged')::int`,
      responded:       sql<number>`count(*) filter (where outreach_status = 'responded')::int`,
      converted:       sql<number>`count(*) filter (where outreach_status = 'converted')::int`,
    }).from(creatorProfilesTable);

    const [logStats] = await db.select({
      totalOutreachSent: sql<number>`count(*)::int`,
    }).from(creatorOutreachLogTable);

    const [campaignStats] = await db.select({
      totalCampaigns: sql<number>`count(*)::int`,
      activeCampaigns: sql<number>`count(*) filter (where status = 'active')::int`,
    }).from(creatorCampaignsTable);

    const sbConfigured    = !!process.env["SOCIALBLADE_API_KEY"];
    const shoutConfigured = !!process.env["SHOUT_API_KEY"];

    res.json({
      creators: {
        totalDiscovered:  stats?.totalDiscovered ?? 0,
        notContacted:     stats?.notContacted    ?? 0,
        messaged:         stats?.messaged        ?? 0,
        responded:        stats?.responded       ?? 0,
        converted:        stats?.converted       ?? 0,
      },
      outreach: {
        totalSent: logStats?.totalOutreachSent ?? 0,
      },
      campaigns: {
        total:  campaignStats?.totalCampaigns  ?? 0,
        active: campaignStats?.activeCampaigns ?? 0,
      },
      integrations: {
        socialBlade: sbConfigured,
        shout:       shoutConfigured,
        sendgrid:    !!process.env["SENDGRID_API_KEY"],
        twilio:      !!process.env["TWILIO_ACCOUNT_SID"],
      },
      ts: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Stats unavailable", detail: String(err) });
  }
});

export default router;
