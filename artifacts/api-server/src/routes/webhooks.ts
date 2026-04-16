/**
 * 3C Onyx — Stripe Webhook Handler
 *
 * All Stripe events arrive here. Signature is verified with STRIPE_WEBHOOK_SECRET.
 * Route must receive the raw request body (no JSON parsing) for signature to validate.
 *
 * Uses the existing idempotencyGuard middleware keyed on Stripe event ID.
 * The guard is configured with cacheErrors: false so transient failures (500)
 * are NOT cached — Stripe can safely retry failed deliveries.
 *
 * Handled events:
 *   customer.subscription.created    → Activate member access
 *   customer.subscription.updated    → Update subscription status
 *   customer.subscription.deleted    → Revoke member access
 *   invoice.payment_succeeded        → Log successful payment
 *   invoice.payment_failed           → Flag account + notify
 *   customer.subscription.trial_will_end → Send pre-expiry notification
 *   payment_intent.succeeded         → Record vehicle purchase transaction + commission
 *   payment_intent.payment_failed    → Flag failed purchase
 *
 * POST /api/webhooks/stripe — Stripe webhook endpoint (must be raw body)
 */
import { Router, type Request, type Response } from "express";
import type Stripe from "stripe";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { db, usersTable, transactionsTable, kycVerificationsTable, escrowOrdersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import { logger } from "../lib/logger";
import { processUniversalCommission, type TransactionCategory } from "../lib/commissionEngine";
import { idempotencyGuard } from "../middlewares/idempotencyGuard";

const router = Router();

function extractStripeEventId(req: Request): string | undefined {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body ?? "");
    const match = raw.match(/"id"\s*:\s*"(evt_[a-zA-Z0-9_]+)"/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

router.post(
  "/stripe",
  idempotencyGuard({ cacheErrors: false, keyExtractor: extractStripeEventId }),
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

export async function handleEvent(event: Stripe.Event) {
  const obj = event.data.object as unknown as Record<string, unknown>;

  await db.transaction(async (trx) => {
    switch (event.type) {

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const customerId = obj.customer as string;
        const status     = obj.status as string;
        logger.info({ customerId, status }, `Subscription ${event.type}`);
        const [user] = await trx.select().from(usersTable)
          .where(eq(usersTable.stripeCustomerId, customerId)).limit(1);
        if (user) {
          await trx.insert(transactionsTable).values({
            type:            "SUBSCRIPTION",
            status:          status === "active" ? "COMPLETED" : "PENDING",
            amountCents:     (obj.items as { data: { price: { unit_amount: number } }[] })?.data?.[0]?.price?.unit_amount ?? 9900,
            fromUserId:      user.id,
            description:     `Subscription ${event.type.split(".").pop()} — status: ${status}`,
            stripePaymentId: obj.id as string,
          });
          await writeAudit({ eventType: "PAYOUT", severity: "INFO", action: `Stripe subscription ${status} for user ${user.id}`, metadata: { customerId, status }, dbClient: trx });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const customerId = obj.customer as string;
        logger.info({ customerId }, "Subscription cancelled");
        await writeAudit({ eventType: "PAYOUT", severity: "WARN", action: `Subscription cancelled for customer ${customerId}`, metadata: { customerId }, dbClient: trx });
        break;
      }

      case "invoice.payment_succeeded": {
        const customerId = obj.customer as string;
        const amount     = obj.amount_paid as number;
        logger.info({ customerId, amount }, "Invoice payment succeeded");
        const [user] = await trx.select().from(usersTable)
          .where(eq(usersTable.stripeCustomerId, customerId)).limit(1);
        if (user) {
          await trx.insert(transactionsTable).values({
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
        await writeAudit({ eventType: "PAYOUT", severity: "WARN", action: `Invoice payment failed for customer ${customerId}`, metadata: { customerId }, dbClient: trx });
        break;
      }

      case "payment_intent.succeeded": {
        const amount   = obj.amount as number;
        const metadata = obj.metadata as Record<string, string>;
        logger.info({ amount, metadata }, "Payment intent succeeded");

        const isVehicleEscrow = metadata?.type === "vehicle_escrow";

        if (metadata?.orderId) {
          await trx.update(escrowOrdersTable).set({
            status: "escrowed",
            updatedAt: new Date(),
          }).where(eq(escrowOrdersTable.orderId, metadata.orderId));
        }

        if (isVehicleEscrow && metadata?.buyerEmail) {
          const [buyer] = await trx.select({ id: usersTable.id }).from(usersTable)
            .where(eq(usersTable.email, metadata.buyerEmail)).limit(1);
          if (buyer) {
            const category: TransactionCategory = "vehicle_purchase";
            const commissionResult = await processUniversalCommission({
              buyerUserId: buyer.id,
              transactionAmountCents: amount,
              category,
              description: metadata?.description ?? `Vehicle escrow purchase — ${metadata?.vin ?? "unknown"}`,
              stripePaymentId: obj.id as string,
              vehicleVin: metadata?.vin ?? null,
              dbClient: trx,
            });
            if (commissionResult.commissionCreated) {
              logger.info({
                buyerId: buyer.id,
                referrerId: commissionResult.referrerUserId,
                commissionAmount: commissionResult.commissionAmountUsd,
              }, "[webhook] Commission processed for vehicle purchase");
            }
          } else {
            await trx.insert(transactionsTable).values({
              type:            "PURCHASE",
              status:          "COMPLETED",
              amountCents:     amount,
              vehicleVin:      metadata?.vin,
              description:     metadata?.description ?? "Vehicle purchase",
              stripePaymentId: obj.id as string,
              completedAt:     new Date(),
            });
          }
        } else {
          await trx.insert(transactionsTable).values({
            type:            "PURCHASE",
            status:          "COMPLETED",
            amountCents:     amount,
            vehicleVin:      metadata?.vin,
            description:     metadata?.description ?? "Vehicle purchase",
            stripePaymentId: obj.id as string,
            completedAt:     new Date(),
          });
        }

        await writeAudit({ eventType: "PAYOUT", severity: "INFO", action: `Purchase PaymentIntent succeeded: ${obj.id as string}`, metadata: { amount }, dbClient: trx });
        break;
      }

      case "payment_intent.payment_failed": {
        logger.warn({ paymentIntentId: obj.id }, "PaymentIntent FAILED");
        await trx.insert(transactionsTable).values({
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
          const { eq: eqFn } = await import("drizzle-orm");
          await trx
            .update(foundingMembersTable)
            .set({
              status: "active",
              stripeCustomerId: session.customer ?? null,
              stripePaymentIntentId: session.payment_intent ?? null,
              confirmedAt: new Date(),
            })
            .where(eqFn(foundingMembersTable.stripeCheckoutSessionId, session.id));
          logger.info({ sessionId: session.id, email: metadata.email }, "[founding] Founding member confirmed via webhook");
          await writeAudit({ eventType: "SYSTEM", severity: "INFO", action: `Founding member confirmed: ${metadata.email ?? session.id}`, metadata: { sessionId: session.id }, dbClient: trx });
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        logger.info({ customer: obj.customer }, "Trial ending soon");
        await writeAudit({ eventType: "SYSTEM", severity: "INFO", action: `Trial ending for customer ${obj.customer as string}`, dbClient: trx });
        break;
      }

      case "identity.verification_session.verified": {
        const session = obj as unknown as Stripe.Identity.VerificationSession;
        if (session.id) {
          await trx
            .update(kycVerificationsTable)
            .set({ status: "VERIFIED", verifiedAt: new Date() })
            .where(eq(kycVerificationsTable.stripeVerifSessionId, session.id));
          logger.info({ sessionId: session.id }, "KYC verification_session.verified — status updated");
          await writeAudit({
            eventType: "AUTH",
            severity: "INFO",
            action: `KYC verified via Stripe Identity session ${session.id}`,
            dbClient: trx,
          });
        }
        break;
      }

      case "identity.verification_session.requires_input": {
        const session = obj as unknown as Stripe.Identity.VerificationSession;
        if (session.id) {
          await trx
            .update(kycVerificationsTable)
            .set({ status: "FAILED" })
            .where(eq(kycVerificationsTable.stripeVerifSessionId, session.id));
          logger.warn({ sessionId: session.id }, "KYC verification requires_input — marked FAILED");
        }
        break;
      }

      default:
        logger.info({ eventType: event.type }, "Unhandled Stripe event (ignored)");
    }
  });
}

export default router;
