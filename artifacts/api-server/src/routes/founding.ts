/**
 * Founding Member API
 * ──────────────────────────────────────────────────────────────────
 * POST /founding/checkout    Create Stripe Checkout Session ($99)
 * GET  /founding/count       Real-time founding member count (public)
 * GET  /founding/verify/:id  Verify checkout session post-payment
 * POST /founding/confirm     Webhook confirms payment (called by webhooks.ts)
 *
 * $99 × 100,000 members = $9.9M pre-launch.
 * Every founding member gets a referral code.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import { foundingMembersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

const FOUNDING_PRICE_CENTS = 9900; // $99.00
const FOUNDING_PRODUCT_NAME = "3C Onyx Founding Member";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function generateReferralCode(name: string): string {
  const slug = name.split(" ")[0].toUpperCase().slice(0, 6).replace(/[^A-Z]/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `3C-${slug}-${suffix}`;
}

function getSuccessUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host  = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const base  = process.env.APP_BASE_URL ?? `${proto}://${host}`;
  return `${base}/join/success?session_id={CHECKOUT_SESSION_ID}`;
}

function getCancelUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host  = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const base  = process.env.APP_BASE_URL ?? `${proto}://${host}`;
  return `${base}/join?cancelled=1`;
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */

/**
 * GET /founding/count — Real-time founding member count (public, no auth needed)
 */
const SPOTS_TOTAL = 10_000;

router.get("/founding/count", async (_req: Request, res: Response) => {
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(foundingMembersTable)
      .where(eq(foundingMembersTable.status, "active"));

    const totalCount = Number(value);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let joinedToday = 0;
    try {
      const [{ todayVal }] = await db
        .select({ todayVal: count() })
        .from(foundingMembersTable)
        .where(sql`status = 'active' AND confirmed_at >= ${today.toISOString()}`);
      joinedToday = Number(todayVal);
    } catch { /* non-critical */ }

    res.json({
      count: totalCount,
      spotsTotal: SPOTS_TOTAL,
      spotsRemaining: Math.max(SPOTS_TOTAL - totalCount, 0),
      percentFilled: Math.min(((totalCount / SPOTS_TOTAL) * 100), 100),
      joinedToday,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, "[founding] Count query failed");
    res.json({ count: 1, spotsTotal: SPOTS_TOTAL, spotsRemaining: SPOTS_TOTAL - 1, percentFilled: 0.01, joinedToday: 0, ts: new Date().toISOString() });
  }
});

/**
 * POST /founding/checkout — Create Stripe Checkout Session
 * Body: { name, email, referredBy? }
 */
router.post("/founding/checkout", async (req: Request, res: Response) => {
  const { name, email, referredBy } = req.body as {
    name: string;
    email: string;
    referredBy?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: "Name and email are required", code: "VALIDATION_ERROR" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await db
      .select({ id: foundingMembersTable.id, status: foundingMembersTable.status })
      .from(foundingMembersTable)
      .where(eq(foundingMembersTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0 && existing[0].status === "active") {
      res.status(409).json({ error: "This email is already a founding member.", code: "ALREADY_MEMBER" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Payment service temporarily unavailable.", code: "STRIPE_UNAVAILABLE" });
      return;
    }

    const referralCode = generateReferralCode(name.trim());

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: normalizedEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: FOUNDING_PRICE_CENTS,
            product_data: {
              name: FOUNDING_PRODUCT_NAME,
              description: "Founding member — lifetime price lock · Early access · Priority support",
              images: [],
            },
          },
        },
      ],
      metadata: {
        name: name.trim(),
        email: normalizedEmail,
        referralCode,
        referredBy: referredBy ?? "",
        product: "founding_member",
      },
      success_url: getSuccessUrl(req),
      cancel_url:  getCancelUrl(req),
      allow_promotion_codes: true,
    });

    if (existing.length > 0) {
      await db
        .update(foundingMembersTable)
        .set({
          name: name.trim(),
          stripeCheckoutSessionId: session.id,
          referralCode,
          referredBy: referredBy ?? null,
          status: "pending",
        })
        .where(eq(foundingMembersTable.email, normalizedEmail));
    } else {
      await db.insert(foundingMembersTable).values({
        name: name.trim(),
        email: normalizedEmail,
        stripeCheckoutSessionId: session.id,
        referralCode,
        referredBy: referredBy ?? null,
        status: "pending",
        amountPaid: FOUNDING_PRICE_CENTS,
      });
    }

    logger.info({ email: normalizedEmail, sessionId: session.id }, "[founding] Checkout session created");

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err, email: normalizedEmail }, "[founding] Checkout session creation failed");
    res.status(500).json({ error: "Failed to create checkout session. Please try again.", code: "CHECKOUT_ERROR" });
  }
});

/**
 * GET /founding/verify/:sessionId — Verify checkout session after redirect
 * Returns member number and referral code for the success page.
 */
router.get("/founding/verify/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Payment service unavailable", code: "STRIPE_UNAVAILABLE" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      res.status(402).json({ error: "Payment not completed", code: "PAYMENT_PENDING", status: session.payment_status });
      return;
    }

    const [member] = await db
      .select()
      .from(foundingMembersTable)
      .where(eq(foundingMembersTable.stripeCheckoutSessionId, sessionId))
      .limit(1);

    if (!member) {
      res.status(404).json({ error: "Member record not found", code: "MEMBER_NOT_FOUND" });
      return;
    }

    if (member.status !== "active") {
      await db
        .update(foundingMembersTable)
        .set({
          status: "active",
          stripeCustomerId: session.customer as string ?? null,
          stripePaymentIntentId: session.payment_intent as string ?? null,
          confirmedAt: new Date(),
        })
        .where(eq(foundingMembersTable.stripeCheckoutSessionId, sessionId));
    }

    const [{ totalActive }] = await db
      .select({ totalActive: count() })
      .from(foundingMembersTable)
      .where(eq(foundingMembersTable.status, "active"));

    res.json({
      memberNumber: member.memberNumber,
      name: member.name,
      email: member.email,
      referralCode: member.referralCode,
      totalMembers: Number(totalActive),
      confirmedAt: member.confirmedAt ?? new Date(),
      ts: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, sessionId }, "[founding] Session verification failed");
    res.status(500).json({ error: "Verification failed", code: "VERIFY_ERROR" });
  }
});

/**
 * POST /founding/confirm — Called by webhook handler when payment_intent.succeeded
 */
router.post("/founding/confirm", async (req: Request, res: Response) => {
  const { stripeCheckoutSessionId, stripeCustomerId, stripePaymentIntentId } = req.body as {
    stripeCheckoutSessionId: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
  };

  try {
    await db
      .update(foundingMembersTable)
      .set({
        status: "active",
        stripeCustomerId: stripeCustomerId ?? null,
        stripePaymentIntentId: stripePaymentIntentId ?? null,
        confirmedAt: new Date(),
      })
      .where(eq(foundingMembersTable.stripeCheckoutSessionId, stripeCheckoutSessionId));

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[founding] Confirm failed");
    res.status(500).json({ error: "Confirm failed" });
  }
});

export default router;
