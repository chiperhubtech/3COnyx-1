import { eventBus } from "./eventBus";
import { logger } from "./logger";

interface PendingMessage {
  channel: "sms" | "email";
  to: string;
  subject?: string;
  body: string;
  brandedFrom: string;
  triggeredBy: string;
  createdAt: string;
}

const pendingMessages: PendingMessage[] = [];

const BRANDED_FROM_SMS = "3C ONYX";
const BRANDED_FROM_EMAIL = "ONYX Concierge <concierge@3conyx.com>";

const STATUS_MESSAGES: Record<string, string> = {
  DMV: "Great news — your registration and title processing is complete. Your plates will arrive shortly.",
  Parts: "Your parts have arrived and been installed. Your vehicle is ready.",
  Service: "Your vehicle service is complete and ready for pickup.",
  Finance: "Your financing has been approved and processed.",
  Sales: "Your vehicle is being prepared for delivery. We'll reach out to schedule pickup.",
  Insurance: "Your insurance policy has been bound and is active.",
  Logistics: "Your vehicle transport is complete and has arrived safely.",
};

async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM || process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    pendingMessages.push({
      channel: "sms",
      to,
      body,
      brandedFrom: BRANDED_FROM_SMS,
      triggeredBy: "communication-orchestrator",
      createdAt: new Date().toISOString(),
    });
    logger.info({ to, bodyLen: body.length }, "[CommOrch] SMS queued (Twilio not configured)");
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: `[${BRANDED_FROM_SMS}] ${body}` }),
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "[CommOrch] Twilio SMS failed");
      return false;
    }
    logger.info({ to }, "[CommOrch] SMS sent via Twilio");
    return true;
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[CommOrch] SMS send error");
    return false;
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    pendingMessages.push({
      channel: "email",
      to,
      subject,
      body,
      brandedFrom: BRANDED_FROM_EMAIL,
      triggeredBy: "communication-orchestrator",
      createdAt: new Date().toISOString(),
    });
    logger.info({ to, subject }, "[CommOrch] Email queued (SendGrid not configured)");
    return false;
  }

  try {
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "concierge@3conyx.com", name: "ONYX Concierge" },
        subject: `[ONYX] ${subject}`,
        content: [{ type: "text/plain", value: body }],
      }),
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "[CommOrch] SendGrid email failed");
      return false;
    }
    logger.info({ to, subject }, "[CommOrch] Email sent via SendGrid");
    return true;
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[CommOrch] Email send error");
    return false;
  }
}

export function initCommunicationOrchestrator() {
  eventBus.onEvent("agent.task.complete", async (event) => {
    const { taskId, customerPhone, customerEmail, department } = event.payload as any;
    if (!taskId) return;

    const message = STATUS_MESSAGES[department] || "Your request has been completed. Thank you for choosing ONYX.";

    if (customerPhone) {
      await sendSms(customerPhone, message);
    }
    if (customerEmail) {
      await sendEmail(customerEmail, `Your ${department || "service"} request is complete`, message);
    }
  });

  eventBus.onEvent("referral.created", async (event) => {
    const { referrerEmail, referrerName, referredName } = event.payload as any;
    if (!referrerEmail) return;

    await sendEmail(
      referrerEmail,
      "Someone used your referral!",
      `Hey ${referrerName || "there"}, ${referredName || "someone"} just signed up through your ONYX referral link. Your rewards are being calculated. Check your ONYX feed for details.`
    );
  });

  eventBus.onEvent("payment.escrow.created", async (event) => {
    const { buyerEmail, buyerName, amount } = event.payload as any;
    if (!buyerEmail) return;

    await sendEmail(
      buyerEmail,
      "Payment confirmed",
      `Hi ${buyerName || "there"}, your payment of $${amount} has been securely processed through ONYX. You'll receive updates as your order progresses.`
    );
  });

  logger.info("[CommOrch] Headless Communication Orchestrator initialized");
}

export function getPendingMessages() {
  return [...pendingMessages];
}

export function getPendingMessageCount() {
  return pendingMessages.length;
}
