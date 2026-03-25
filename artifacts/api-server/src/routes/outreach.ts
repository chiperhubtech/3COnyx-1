/**
 * 3C ONYX — I-95 Mass Outreach Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner: Ron / CUXTOMCANDYCLUB LLC
 *
 * The viral inhale system. One command reaches every contact with a
 * personalized referral link. SMS via Twilio, Email via SendGrid.
 *
 * SECURITY: All fire endpoints require X-Owner-Token header.
 * Wrong token = immediate 403. No retries logged publicly.
 *
 * TEMPLATE:
 * "Ron here. The I-95 Dynasty is live. As an industry pro, I've
 *  pre-registered you for a Founding Member Slice. Claim your legacy at
 *  [PersonalizedLink]."
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import twilio from "twilio";
import sgMail from "@sendgrid/mail";

const router = Router();

// ─── Owner Auth Guard ─────────────────────────────────────────────────────────
const OWNER_TOKEN = process.env["OWNER_SECRET_TOKEN"] ?? "";

function requireOwner(req: Request, res: Response, next: () => void) {
  const token = req.headers["x-owner-token"] as string | undefined;
  if (!OWNER_TOKEN || !token || token !== OWNER_TOKEN) {
    res.status(403).json({
      error: "Access denied",
      code: "OWNER_ONLY",
      message: "This endpoint requires owner authentication."
    });
    return;
  }
  next();
}

// ─── In-Memory Contact Store ──────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  company?: string;
  referralCode: string;
  referralLink: string;
  smsStatus: "pending" | "sent" | "failed" | "skipped";
  emailStatus: "pending" | "sent" | "failed" | "skipped";
  addedAt: string;
}

interface BlastRecord {
  id: string;
  firedAt: string;
  firedBy: string;
  totalContacts: number;
  smsSent: number;
  emailSent: number;
  failed: number;
  mode: "preview" | "live";
}

const contacts: Map<string, Contact> = new Map();
const blastHistory: BlastRecord[] = [];

const BASE_URL = process.env["VITE_APP_URL"] ?? "https://cuxtomcandyclub.ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateReferralCode(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "").slice(0, 8);
  const rand = crypto.randomBytes(3).toString("hex");
  return `${slug}-${rand}`.toUpperCase();
}

function buildReferralLink(code: string): string {
  return `${BASE_URL}/join?ref=${code}`;
}

function buildSMSMessage(contact: Contact): string {
  const firstName = contact.name.split(" ")[0] ?? contact.name;
  return `Hey ${firstName}, Ron here. The I-95 Dynasty is live. As an industry pro, I've pre-registered you for a Founding Member Slice. Claim your legacy → ${contact.referralLink}`;
}

function buildEmailHTML(contact: Contact): string {
  const firstName = contact.name.split(" ")[0] ?? contact.name;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>3C ONYX — Your Founding Slice</title></head>
<body style="background:#09090b;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#C9A227;">3C ONYX</div>
      <div style="font-size:11px;color:#71717a;letter-spacing:3px;margin-top:4px;">CUXTOMCANDYCLUB LLC</div>
    </div>
    <h1 style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">
      ${firstName} — Your Founding Slice is Reserved.
    </h1>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.7;">
      Ron here. The <strong style="color:#C9A227;">I-95 Dynasty</strong> is live.<br><br>
      As an industry professional, I've pre-registered you for a
      <strong style="color:#fff;">Founding Member Slice</strong> — 
      permanent founding-member pricing, locked forever, 
      with a referral dividend from everyone you bring in.
    </p>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.7;">
      Role: <strong style="color:#fff;">${contact.role}</strong><br>
      ${contact.company ? `Company: <strong style="color:#fff;">${contact.company}</strong><br>` : ""}
      Your personal link below is unique — it's tied to you from day one.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${contact.referralLink}" style="display:inline-block;background:#C9A227;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
        CLAIM YOUR FOUNDING SLICE →
      </a>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;color:#71717a;letter-spacing:2px;margin-bottom:4px;">YOUR PERSONAL LINK</div>
      <div style="font-size:13px;color:#C9A227;font-family:monospace;word-break:break-all;">${contact.referralLink}</div>
    </div>
    <p style="color:#52525b;font-size:12px;text-align:center;line-height:1.6;">
      CUXTOMCANDYCLUB LLC · 3C ONYX Platform<br>
      This invite is personal and non-transferable.<br>
      Reply STOP to opt out of future messages.
    </p>
  </div>
</body>
</html>`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /outreach/contacts — list all contacts
router.get("/contacts", requireOwner, (_req: Request, res: Response) => {
  const list = Array.from(contacts.values());
  res.json({ contacts: list, total: list.length });
});

// POST /outreach/contacts — add contacts (single or bulk)
router.post("/contacts", requireOwner, (req: Request, res: Response) => {
  const body = req.body as { contacts?: unknown[]; name?: string; phone?: string; email?: string; role?: string; company?: string };
  const raw: { name?: string; phone?: string; email?: string; role?: string; company?: string }[] =
    Array.isArray(body.contacts) ? (body.contacts as typeof raw) : [{ name: body.name, phone: body.phone, email: body.email, role: body.role, company: body.company }];

  const added: Contact[] = [];
  for (const c of raw) {
    if (!c.name) continue;
    const referralCode = generateReferralCode(c.name);
    const referralLink = buildReferralLink(referralCode);
    const contact: Contact = {
      id: `c_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      name: c.name,
      phone: c.phone,
      email: c.email,
      role: c.role ?? "Industry Professional",
      company: c.company,
      referralCode,
      referralLink,
      smsStatus: "pending",
      emailStatus: "pending",
      addedAt: new Date().toISOString(),
    };
    contacts.set(contact.id, contact);
    added.push(contact);
  }
  res.status(201).json({ added: added.length, contacts: added });
});

// DELETE /outreach/contacts/:id — remove a contact
router.delete("/contacts/:id", requireOwner, (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  if (contacts.delete(id)) { res.json({ deleted: true }); return; }
  res.status(404).json({ error: "Contact not found" });
});

// GET /outreach/blast/preview — preview what would be sent
router.get("/blast/preview", requireOwner, (_req: Request, res: Response) => {
  const list = Array.from(contacts.values());
  const previews = list.slice(0, 5).map(c => ({
    name: c.name,
    phone: c.phone ? `***${c.phone.slice(-4)}` : null,
    email: c.email ?? null,
    sms: c.phone ? buildSMSMessage(c) : null,
    emailSubject: `Ron here — Your I-95 Founding Slice is Reserved, ${c.name.split(" ")[0]}`,
    referralLink: c.referralLink,
  }));
  res.json({
    totalContacts: list.length,
    smsEligible: list.filter(c => c.phone).length,
    emailEligible: list.filter(c => c.email).length,
    previewSample: previews,
    messageTemplate: buildSMSMessage(list[0] ?? {
      name: "[First Name]",
      referralLink: `${BASE_URL}/join?ref=XXXXX`,
    } as Contact),
    status: "READY_TO_FIRE — call POST /outreach/blast/fire to execute",
  });
});

// POST /outreach/blast/fire — OWNER ONLY — arm and fire the blast
router.post("/blast/fire", requireOwner, async (req: Request, res: Response) => {
  const { mode = "live" } = req.body as { mode?: "preview" | "live" };

  // Validate Twilio + SendGrid credentials
  const twilioSid   = process.env["TWILIO_ACCOUNT_SID"];
  const twilioToken = process.env["TWILIO_AUTH_TOKEN"];
  const twilioFrom  = process.env["TWILIO_PHONE_NUMBER"];
  const sgKey       = process.env["SENDGRID_API_KEY"];
  const fromEmail   = process.env["SENDGRID_FROM_EMAIL"] ?? "ron@cuxtomcandyclub.ai";

  if (mode === "live" && (!twilioSid || !twilioToken || !twilioFrom)) {
    res.status(400).json({ error: "Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in environment secrets." });
    return;
  }
  if (mode === "live" && !sgKey) {
    res.status(400).json({ error: "SendGrid API key missing. Set SENDGRID_API_KEY in environment secrets." });
    return;
  }

  const list = Array.from(contacts.values());
  if (list.length === 0) {
    res.status(400).json({ error: "No contacts loaded. Add contacts first via POST /outreach/contacts." });
    return;
  }

  const record: BlastRecord = {
    id: `blast_${Date.now()}`,
    firedAt: new Date().toISOString(),
    firedBy: "owner",
    totalContacts: list.length,
    smsSent: 0,
    emailSent: 0,
    failed: 0,
    mode,
  };

  if (mode === "preview") {
    record.smsSent   = list.filter(c => c.phone).length;
    record.emailSent = list.filter(c => c.email).length;
    blastHistory.push(record);
    res.json({ mode: "preview", wouldSend: { sms: record.smsSent, email: record.emailSent }, contacts: list.length, record });
    return;
  }

  // LIVE mode — fire it
  const twilioClient = twilio(twilioSid, twilioToken);
  sgMail.setApiKey(sgKey!);

  for (const contact of list) {
    // SMS
    if (contact.phone && twilioFrom) {
      try {
        await twilioClient.messages.create({ body: buildSMSMessage(contact), from: twilioFrom, to: contact.phone });
        contact.smsStatus = "sent";
        record.smsSent++;
      } catch {
        contact.smsStatus = "failed";
        record.failed++;
      }
    }

    // Email
    if (contact.email) {
      try {
        await sgMail.send({
          to: contact.email,
          from: { email: fromEmail, name: "Ron | 3C ONYX" },
          subject: `Ron here — Your I-95 Founding Slice is Reserved, ${contact.name.split(" ")[0]}`,
          html: buildEmailHTML(contact),
          text: buildSMSMessage(contact),
          trackingSettings: { clickTracking: { enable: true }, openTracking: { enable: true } },
        });
        contact.emailStatus = "sent";
        record.emailSent++;
      } catch {
        contact.emailStatus = "failed";
        record.failed++;
      }
    }

    contacts.set(contact.id, contact);
  }

  blastHistory.push(record);
  res.json({
    mode: "LIVE",
    fired: true,
    totalContacts: record.totalContacts,
    smsSent: record.smsSent,
    emailSent: record.emailSent,
    failed: record.failed,
    blastId: record.id,
    timestamp: record.firedAt,
  });
});

// GET /outreach/blast/history — blast history
router.get("/blast/history", requireOwner, (_req: Request, res: Response) => {
  res.json({ blasts: [...blastHistory].reverse(), total: blastHistory.length });
});

// GET /outreach/stats — outreach dashboard stats
router.get("/stats", requireOwner, (_req: Request, res: Response) => {
  const list = Array.from(contacts.values());
  res.json({
    totalContacts: list.length,
    smsEligible:   list.filter(c => c.phone).length,
    emailEligible: list.filter(c => c.email).length,
    smsSent:       list.filter(c => c.smsStatus === "sent").length,
    emailSent:     list.filter(c => c.emailStatus === "sent").length,
    pending:       list.filter(c => c.smsStatus === "pending" && c.emailStatus === "pending").length,
    blastsFired:   blastHistory.filter(b => b.mode === "live").length,
    lastBlast:     blastHistory.find(b => b.mode === "live")?.firedAt ?? null,
  });
});

export default router;
