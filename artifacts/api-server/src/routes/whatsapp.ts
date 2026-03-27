/**
 * ONYX WhatsApp Routes
 *
 * POST /api/whatsapp/webhook  — Twilio inbound message webhook
 * POST /api/whatsapp/send     — Internal: send a message to a member
 * GET  /api/whatsapp/status   — Integration health check
 * POST /api/whatsapp/test     — Send a test message (dev only)
 */

import { Router, type Request, type Response } from "express";
import twilio from "twilio";
import { sendWhatsApp, templates, parseIntent, WA_CONFIGURED } from "../lib/whatsapp.js";
import { logger } from "../lib/logger.js";

export const whatsappRouter = Router();

const WEBHOOK_SECRET = process.env.TWILIO_AUTH_TOKEN ?? "";

// ─── Webhook validation middleware ────────────────────────────────────────────
function validateTwilio(req: Request, res: Response, next: () => void) {
  if (process.env.NODE_ENV !== "production" || !WA_CONFIGURED) {
    return next(); // skip validation in dev/sandbox
  }
  const signature = req.headers["x-twilio-signature"] as string ?? "";
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  const valid = twilio.validateRequest(WEBHOOK_SECRET, signature, url, req.body ?? {});
  if (!valid) {
    logger.warn("[whatsapp] Invalid Twilio signature — request rejected");
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// ─── POST /api/whatsapp/webhook ───────────────────────────────────────────────
// Twilio sends inbound member messages here.
whatsappRouter.post(
  "/webhook",
  validateTwilio,
  async (req: Request, res: Response) => {
    const { From, Body, ProfileName } = req.body as {
      From: string;
      Body: string;
      ProfileName?: string;
    };

    logger.info({ from: From, body: Body?.slice(0, 80) }, "[whatsapp] Inbound message");

    const intent = parseIntent(Body ?? "");
    const name = ProfileName ?? "Member";

    let reply: string;

    switch (intent) {
      case "CONFIRM":
      case "ACTIVATE":
      case "EXECUTE":
        reply = templates.conciergeReply(
          `✅ Confirmed. ONYX is executing now.\n\nYou'll receive a status update when complete. No further action needed from you.`
        );
        break;

      case "CANCEL":
      case "SKIP":
      case "HOLD":
        reply = templates.conciergeReply(
          `Understood. This action has been paused. ONYX will re-evaluate and notify you if conditions change.`
        );
        break;

      case "STATUS": {
        reply = templates.conciergeReply(
          `📋 *Your Active Items*\n\n` +
          `• G63 AMG acquisition — awaiting your CONFIRM\n` +
          `• Insurance switch — $620/yr saved, ready to ACTIVATE\n` +
          `• BMW M5 service — booked for tomorrow 10am\n\n` +
          `Reply the command next to any item to proceed.`
        );
        break;
      }

      case "SUMMARY": {
        reply = templates.weeklyDigest(8, 31_644);
        break;
      }

      case "INFO":
        reply = templates.conciergeReply(
          `ONYX handles buying, selling, insuring, financing, and servicing your vehicles.\n\n` +
          `You never negotiate. You confirm.\n\n` +
          `Commands: STATUS · SUMMARY · CONFIRM · CANCEL · ACTIVATE\n\n` +
          `Or just ask ONYX anything.`
        );
        break;

      case "SAFE":
        reply = templates.conciergeReply(
          `✅ SOS cancelled. Glad you're safe.\n\nONYX has notified responders. No further action needed.`
        );
        break;

      case "CONCIERGE":
      default: {
        // Route to AI concierge — for now return a branded holding reply
        // In production this calls the AI router with the member's message
        reply = templates.conciergeReply(
          `${name}, ONYX received your message.\n\n` +
          `"${Body?.slice(0, 120)}"\n\n` +
          `ONYX Concierge is analyzing and will respond momentarily. ` +
          `If this requires immediate action, reply STATUS to see your open items.`
        );
        break;
      }
    }

    // Send reply via Twilio
    await sendWhatsApp(From, reply);

    // Twilio expects 200 TwiML or empty response
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
);

// ─── POST /api/whatsapp/send ──────────────────────────────────────────────────
// Internal route — triggered by platform actions (intelligence feed, SOS, etc.)
whatsappRouter.post("/send", async (req: Request, res: Response) => {
  const { to, template, data } = req.body as {
    to: string;
    template: keyof typeof templates;
    data: unknown[];
  };

  if (!to || !template) {
    return res.status(400).json({ error: "to and template are required" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (templates as any)[template];
  if (typeof fn !== "function") {
    return res.status(400).json({ error: `Unknown template: ${template}` });
  }

  const body: string = fn(...(data ?? []));
  const sid = await sendWhatsApp(to, body);

  return res.json({ ok: true, sid, simulated: !WA_CONFIGURED });
});

// ─── GET /api/whatsapp/status ─────────────────────────────────────────────────
whatsappRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    configured: WA_CONFIGURED,
    mode: WA_CONFIGURED ? "live" : "simulation",
    from: process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886 (sandbox)",
    templates: Object.keys(templates),
    webhookPath: "/api/whatsapp/webhook",
    setupSteps: WA_CONFIGURED ? [] : [
      "1. Create account at twilio.com",
      "2. Get Account SID + Auth Token from Twilio Console",
      "3. Buy a phone number ($1/month)",
      "4. Enable WhatsApp on the number via Twilio Console → Messaging → Senders → WhatsApp",
      "5. Set webhook URL to: https://YOUR_DOMAIN/api/whatsapp/webhook",
      "6. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to Replit Secrets",
      "7. Submit WhatsApp Business number for Meta approval (24–48 hrs)",
    ],
  });
});

// ─── POST /api/whatsapp/test ──────────────────────────────────────────────────
// Dev only — send a test message to verify credentials
whatsappRouter.post("/test", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Test endpoint disabled in production" });
  }
  const { to } = req.body as { to: string };
  if (!to) return res.status(400).json({ error: "to is required" });

  const body = templates.welcome("Founding Member", `ONYX-${Date.now().toString().slice(-6)}`);
  const sid = await sendWhatsApp(to, body);
  return res.json({ ok: true, sid, body, simulated: !WA_CONFIGURED });
});
