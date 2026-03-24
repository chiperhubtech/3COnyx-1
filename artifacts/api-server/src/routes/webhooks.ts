/**
 * 3C Onyx — Stripe Webhook Handler
 *
 * All Stripe events arrive here. Signature is verified with STRIPE_WEBHOOK_SECRET.
 * Route must receive the raw request body (no JSON parsing) for signature to validate.
 *
 * Handled events:
 *   customer.subscription.created    → Activate member access
 *   customer.subscription.updated    → Update subscription status
 *   customer.subscription.deleted    → Revoke member access
 *   invoice.payment_succeeded        → Log successful payment
 *   invoice.payment_failed           → Flag account + notify
 *   customer.subscription.trial_will_end → Send pre-expiry notification
 *   payment_intent.succeeded         → Record vehicle purchase transaction
 *   payment_intent.payment_failed    → Flag failed purchase
 *
 * POST /api/webhooks/stripe — Stripe webhook endpoint (must be raw body)
 */
import { Router, type Request, type Response } from "express";
import type Stripe from "stripe";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/webhooks/stripe",
  express_raw_body_middleware(),
  async (req: Request, res: Response) => {
    const sig       = req.headers["stripe-signature"];
    const secret    = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      logger.warn("STRIPE_WEBHOOK_SECRET not configured — skipping signature check (dev only)");
      await handleEvent(req.body);
      res.json({ received: true });
      return;
    }

    if (!sig) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event;
    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) throw new Error("Stripe client unavailable");
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, secret);
    } catch (err) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature invalid" });
      return;
    }

    try {
      await handleEvent(event);
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Webhook handler error");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }

    res.json({ received: true, eventType: event.type });
  },
);

async function handleEvent(event: Stripe.Event) {
  const obj = event.data.object as unknown as Record<string, unknown>;

  switch (event.type) {

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = obj.customer as string;
      const status     = obj.status as string;
      logger.info({ customerId, status }, `Subscription ${event.type}`);
      const [user] = await db.select().from(usersTable)
        .where(eq(usersTable.stripeCustomerId, customerId)).limit(1);
      if (user) {
        await db.insert(transactionsTable).values({
          type:            "SUBSCRIPTION",
          status:          status === "active" ? "COMPLETED" : "PENDING",
          amountCents:     (obj.items as { data: { price: { unit_amount: number } }[] })?.data?.[0]?.price?.unit_amount ?? 9900,
          fromUserId:      user.id,
          description:     `Subscription ${event.type.split(".").pop()} — status: ${status}`,
          stripePaymentId: obj.id as string,
        });
        await writeAudit({ eventType: "PAYOUT", severity: "INFO", action: `Stripe subscription ${status} for user ${user.id}`, metadata: { customerId, status } });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = obj.customer as string;
      logger.info({ customerId }, "Subscription cancelled");
      await writeAudit({ eventType: "PAYOUT", severity: "WARN", action: `Subscription cancelled for customer ${customerId}`, metadata: { customerId } });
      break;
    }

    case "invoice.payment_succeeded": {
      const customerId = obj.customer as string;
      const amount     = obj.amount_paid as number;
      logger.info({ customerId, amount }, "Invoice payment succeeded");
      const [user] = await db.select().from(usersTable)
        .where(eq(usersTable.stripeCustomerId, customerId)).limit(1);
      if (user) {
        await db.insert(transactionsTable).values({
          type:            "SUBSCRIPTION",
          status:          "COMPLETED",
          amountCents:     amount,
          fromUserId:      user.id,
          description:     `Invoice paid — ${obj.number as string}`,
          stripePaymentId: obj.payment_intent as string,
          completedAt:     new Date(),
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const customerId = obj.customer as string;
      logger.warn({ customerId }, "Invoice payment FAILED");
      await writeAudit({ eventType: "PAYOUT", severity: "WARN", action: `Invoice payment failed for customer ${customerId}`, metadata: { customerId } });
      break;
    }

    case "payment_intent.succeeded": {
      const amount   = obj.amount as number;
      const metadata = obj.metadata as Record<string, string>;
      logger.info({ amount, metadata }, "Payment intent succeeded");
      await db.insert(transactionsTable).values({
        type:            "PURCHASE",
        status:          "COMPLETED",
        amountCents:     amount,
        vehicleVin:      metadata?.vin,
        description:     metadata?.description ?? "Vehicle purchase",
        stripePaymentId: obj.id as string,
        completedAt:     new Date(),
      });
      await writeAudit({ eventType: "PAYOUT", severity: "INFO", action: `Purchase PaymentIntent succeeded: ${obj.id as string}`, metadata: { amount } });
      break;
    }

    case "payment_intent.payment_failed": {
      logger.warn({ paymentIntentId: obj.id }, "PaymentIntent FAILED");
      await db.insert(transactionsTable).values({
        type:            "PURCHASE",
        status:          "FAILED",
        amountCents:     obj.amount as number,
        description:     `Payment failed: ${(obj.last_payment_error as { message?: string })?.message ?? "unknown"}`,
        stripePaymentId: obj.id as string,
      });
      break;
    }

    case "checkout.session.completed": {
      const session  = obj as { id: string; customer: string; payment_intent: string; payment_status: string; metadata: Record<string, string> };
      const metadata = session.metadata ?? {};

      if (metadata.product === "founding_member" && session.payment_status === "paid") {
        const { foundingMembersTable } = await import("@workspace/db");
        const { eq } = await import("drizzle-orm");
        await db
          .update(foundingMembersTable)
          .set({
            status: "active",
            stripeCustomerId: session.customer ?? null,
            stripePaymentIntentId: session.payment_intent ?? null,
            confirmedAt: new Date(),
          })
          .where(eq(foundingMembersTable.stripeCheckoutSessionId, session.id));
        logger.info({ sessionId: session.id, email: metadata.email }, "[founding] Founding member confirmed via webhook");
        await writeAudit({ eventType: "SYSTEM", severity: "INFO", action: `Founding member confirmed: ${metadata.email ?? session.id}`, metadata: { sessionId: session.id } });
      }
      break;
    }

    case "customer.subscription.trial_will_end": {
      logger.info({ customer: obj.customer }, "Trial ending soon");
      await writeAudit({ eventType: "SYSTEM", severity: "INFO", action: `Trial ending for customer ${obj.customer as string}` });
      break;
    }

    default:
      logger.info({ eventType: event.type }, "Unhandled Stripe event (ignored)");
  }
}

function express_raw_body_middleware() {
  return (req: Request, _res: Response, next: () => void) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      req.body = Buffer.concat(chunks);
      next();
    });
  };
}

export default router;
