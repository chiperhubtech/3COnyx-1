/**
 * ONYX WhatsApp Business Service
 *
 * Twilio WhatsApp API wrapper.
 * Handles all outbound messaging for the platform.
 * Inbound messages are handled in routes/whatsapp.ts
 *
 * Environment variables required:
 *   TWILIO_ACCOUNT_SID  — from Twilio Console
 *   TWILIO_AUTH_TOKEN   — from Twilio Console
 *   TWILIO_WHATSAPP_FROM — e.g. "whatsapp:+14155238886" (sandbox) or your approved number
 */

import twilio from "twilio";
import { logger } from "./logger.js";

const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER  = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

export const WA_CONFIGURED =
  Boolean(ACCOUNT_SID) && Boolean(AUTH_TOKEN);

function client() {
  if (!WA_CONFIGURED) throw new Error("Twilio not configured");
  return twilio(ACCOUNT_SID!, AUTH_TOKEN!);
}

// ─── Core sender ──────────────────────────────────────────────────────────────

export async function sendWhatsApp(to: string, body: string): Promise<string | null> {
  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  if (!WA_CONFIGURED) {
    logger.info({ to, body: body.slice(0, 60) }, "[whatsapp] SIMULATION — message not sent (Twilio not configured)");
    return `SIM_${Date.now()}`;
  }
  try {
    const msg = await client().messages.create({ from: FROM_NUMBER, to: toNumber, body });
    logger.info({ sid: msg.sid, to }, "[whatsapp] Message sent");
    return msg.sid;
  } catch (err) {
    logger.error({ err, to }, "[whatsapp] Send failed");
    return null;
  }
}

// ─── ONYX message templates ───────────────────────────────────────────────────
// Philosophy: ONYX executed. Member confirms. One word reply is all that's needed.

export const templates = {

  // ── Acquisition ────────────────────────────────────────────────────────────
  acquisitionReady: (year: number, make: string, model: string, savings: number, ref: string) =>
    `🖤 *ONYX ACQUISITION READY*\n\n` +
    `ONYX secured a *${year} ${make} ${model}* at *$${savings.toLocaleString()} below market*.\n\n` +
    `Guardian health score: ✅ Verified\n` +
    `Escrow: Pre-staged\n` +
    `Inspection: Dispatched\n\n` +
    `Reply *CONFIRM* to proceed — ONYX handles the rest.\n` +
    `Reply *CANCEL* to dismiss.\n\n` +
    `Ref: ${ref}`,

  // ── Insurance ──────────────────────────────────────────────────────────────
  insuranceSwitchReady: (savings: number, carrier: string) =>
    `🖤 *ONYX INSURANCE — SAVINGS LOCKED*\n\n` +
    `ONYX identified *$${savings.toLocaleString()}/yr* in savings.\n` +
    `Optimal carrier selected. Policy ready to activate.\n` +
    `No paperwork needed from you.\n\n` +
    `Reply *ACTIVATE* to switch — ONYX handles the transition.\n` +
    `Reply *SKIP* to dismiss.`,

  // ── Service booking ────────────────────────────────────────────────────────
  serviceBooked: (vehicle: string, date: string, specialist: string) =>
    `🖤 *ONYX SERVICE CONFIRMED*\n\n` +
    `Your *${vehicle}* service is booked.\n\n` +
    `📅 ${date}\n` +
    `🔧 ${specialist} (BGC-verified)\n\n` +
    `Rate locked. No negotiation. ONYX coordinated everything.\n` +
    `Reply *INFO* for details or *CANCEL* to reschedule.`,

  // ── Finance / refinance ────────────────────────────────────────────────────
  refinanceReady: (monthlySavings: number, totalSavings: number) =>
    `🖤 *ONYX FINANCE — RATE LOCKED*\n\n` +
    `ONYX locked in a lower auto loan rate.\n\n` +
    `💰 Monthly savings: *$${monthlySavings.toLocaleString()}*\n` +
    `💰 Total savings: *$${totalSavings.toLocaleString()}*\n\n` +
    `Reply *CONFIRM* — ONYX handles all documentation and lender coordination.`,

  // ── Market / equity ────────────────────────────────────────────────────────
  equityAlert: (vehicle: string, increase: number, action: string) =>
    `🖤 *ONYX MARKET ALERT*\n\n` +
    `Your *${vehicle}* appreciated *$${increase.toLocaleString()}*.\n\n` +
    `ONYX strategy: *${action}*\n\n` +
    `Reply *EXECUTE* — ONYX handles the transaction.\n` +
    `Reply *HOLD* to defer.`,

  // ── SOS / Emergency ────────────────────────────────────────────────────────
  sosActivated: (lat: number, lng: number) =>
    `🚨 *ONYX EMERGENCY SOS ACTIVATED*\n\n` +
    `Your emergency SOS was triggered.\n\n` +
    `📍 Location shared with responders\n` +
    `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}\n\n` +
    `ONYX has dispatched emergency services and your nearest Runner.\n` +
    `Reply *SAFE* if this was accidental.`,

  // ── Weekly digest ──────────────────────────────────────────────────────────
  weeklyDigest: (actionsCount: number, totalSaved: number) =>
    `🖤 *ONYX WEEKLY RECAP*\n\n` +
    `ONYX handled *${actionsCount} actions* on your behalf this week.\n` +
    `Total value delivered: *$${totalSaved.toLocaleString()}*\n\n` +
    `No dealers. No agents. No negotiation.\n` +
    `Just confirmation.\n\n` +
    `Reply *SUMMARY* for the full breakdown.`,

  // ── Concierge reply ────────────────────────────────────────────────────────
  conciergeReply: (body: string) =>
    `🖤 *ONYX CONCIERGE*\n\n${body}\n\n_Reply anytime — ONYX is always on._`,

  // ── Welcome ────────────────────────────────────────────────────────────────
  welcome: (name: string, memberRef: string) =>
    `🖤 *Welcome to 3C ONYX, ${name}.*\n\n` +
    `This is your direct line to ONYX.\n\n` +
    `We act. You confirm. You never negotiate.\n\n` +
    `Commands:\n` +
    `• *STATUS* — your active items\n` +
    `• *SUMMARY* — week in review\n` +
    `• Anything else — ONYX Concierge responds\n\n` +
    `Member ref: ${memberRef}\n` +
    `_ONYX CUXTOMCANDYCLUB LLC · Private Platform_`,
};

// ─── Intent parser (inbound message → action) ─────────────────────────────────

export type InboundIntent =
  | "CONFIRM" | "CANCEL" | "ACTIVATE" | "EXECUTE" | "HOLD"
  | "SKIP" | "STATUS" | "SUMMARY" | "INFO" | "SAFE" | "CONCIERGE";

export function parseIntent(body: string): InboundIntent {
  const upper = body.trim().toUpperCase().split(/\s+/)[0];
  const map: Record<string, InboundIntent> = {
    CONFIRM: "CONFIRM", YES: "CONFIRM", OK: "CONFIRM", PROCEED: "CONFIRM",
    CANCEL: "CANCEL", NO: "CANCEL", STOP: "CANCEL",
    ACTIVATE: "ACTIVATE",
    EXECUTE: "EXECUTE",
    HOLD: "HOLD", DEFER: "HOLD", WAIT: "HOLD",
    SKIP: "SKIP",
    STATUS: "STATUS", STATE: "STATUS",
    SUMMARY: "SUMMARY", RECAP: "SUMMARY", REVIEW: "SUMMARY",
    INFO: "INFO", DETAILS: "INFO",
    SAFE: "SAFE",
  };
  return map[upper] ?? "CONCIERGE";
}
