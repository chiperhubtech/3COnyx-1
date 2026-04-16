/**
 * 3C Onyx — Checkout Routes
 *
 * POST /checkout/vehicle   — Create Stripe PaymentIntent + open escrow
 * POST /checkout/release   — Release escrow on confirmed delivery
 * GET  /checkout/orders    — List orders for current user
 * GET  /checkout/orders/:id — Single order detail
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";
import { getUncachableStripeClient } from "../lib/stripeClient";
import * as wsHub from "../lib/wsHub";
import { db, escrowOrdersTable } from "@workspace/db";
import { eq, desc, and, lte } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function makeHash(data: string): string {
  return crypto.createHash("sha256").update(data + Date.now()).digest("hex");
}

const MAX_TRANSFER_RETRIES = 5;

function getBackoffDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 60000);
}

/* ─── POST /checkout/vehicle ─────────────────────────────────────────────── */
router.post("/checkout/vehicle", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { vehicleId, vin, vehicleName, price, platformFee, totalAmount, sellerId } = req.body as {
      vehicleId: string;
      vin: string;
      vehicleName: string;
      price: number;
      platformFee?: number;
      totalAmount?: number;
      sellerId?: number;
    };

    if (!vehicleId || !vin || !vehicleName || !price) {
      res.status(400).json({ error: "Missing required checkout fields" });
      return;
    }

    const orderId = `3C-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const blockchainHash = makeHash(`${orderId}:${vin}:${price}`);

    const priceCents = Math.round(price * 100);
    const resolvedPlatformFee = platformFee ?? Math.round(price * 0.015 * 100) / 100;
    const platformFeeCents = Math.round(resolvedPlatformFee * 100);
    const totalAmountCents = totalAmount
      ? Math.round(totalAmount * 100)
      : priceCents + platformFeeCents;

    let paymentIntentId: string | null = null;

    try {
      const stripe = await getUncachableStripeClient();
      if (!stripe) throw new Error("Stripe unavailable");
      const pi = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: "usd",
        metadata: {
          orderId,
          vehicleId,
          vin,
          buyerEmail: user.email,
          type: "vehicle_escrow",
        },
        description: `3C Onyx Escrow — ${vehicleName}`,
      });
      paymentIntentId = pi.id;
    } catch {
      paymentIntentId = null;
    }

    const [order] = await db.insert(escrowOrdersTable).values({
      orderId,
      vehicleId,
      vehicleName,
      vin,
      buyerId: user.id,
      buyerEmail: user.email,
      priceCents,
      platformFeeCents,
      totalAmountCents,
      paymentIntentId,
      status: "escrowed",
      sellerId: sellerId ?? null,
      runnerId: null,
      sellerConnectedAccountId: null,
      runnerConnectedAccountId: null,
      blockchainHash,
    }).returning();

    wsHub.broadcast("notify", {
      type: "new_task",
      title: "New Delivery Task",
      body: `${vehicleName} — available for pickup`,
      orderId,
      ts: new Date().toISOString(),
    });

    wsHub.broadcast("notify", {
      type: "escrow_opened",
      title: "Escrow Opened",
      body: `$${(totalAmountCents / 100).toLocaleString()} secured for ${vehicleName}`,
      orderId,
      ts: new Date().toISOString(),
    });

    res.status(201).json({
      orderId,
      paymentIntentId,
      blockchainHash,
      status: "escrowed",
      message: "Escrow opened. Runner will be dispatched shortly.",
    });
  } catch (err) {
    console.error("[checkout/vehicle]", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

/* ─── POST /checkout/release ─────────────────────────────────────────────── */
router.post("/checkout/release", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId, deliveryCode } = req.body as { orderId: string; deliveryCode: string };
    const [order] = await db.select().from(escrowOrdersTable)
      .where(eq(escrowOrdersTable.orderId, orderId)).limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const isAdmin = user.role === "Admin" || user.role === "Sovereign";
    if (order.buyerId !== user.id && !isAdmin) {
      await writeAudit({
        eventType: "PAYOUT",
        severity: "CRIT",
        action: `Unauthorized escrow release attempt on order ${orderId}`,
        actorId: user.id,
        metadata: { orderId, actualBuyerId: order.buyerId },
      });
      res.status(403).json({ error: "Not authorized to release this escrow" });
      return;
    }

    if (order.status === "released" || order.status === "refunded") {
      res.status(409).json({ error: `Order already ${order.status} — cannot release again` });
      return;
    }
    if (order.payoutStatus === "processing" || order.payoutStatus === "completed") {
      res.status(409).json({ error: `Payout already ${order.payoutStatus} — duplicate release blocked` });
      return;
    }

    const expectedCode = crypto
      .createHash("sha256")
      .update(`${orderId}:${order.vin}`)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase();

    if (deliveryCode !== expectedCode) {
      res.status(400).json({ error: "Invalid delivery confirmation code" });
      return;
    }

    const now = new Date();

    await db.update(escrowOrdersTable).set({
      status: "released",
      deliveredAt: now,
      releasedAt: now,
      payoutStatus: "processing",
      updatedAt: now,
    }).where(eq(escrowOrdersTable.orderId, orderId));

    const transferResults = await executeEscrowTransfers(order, orderId);

    wsHub.broadcast("notify", {
      type: "escrow_released",
      title: "Delivery Confirmed",
      body: `Funds released for ${order.vehicleName}. Transaction complete.`,
      orderId,
      ts: now.toISOString(),
    });

    res.json({
      success: true,
      status: "released",
      orderId,
      transfers: transferResults,
    });
  } catch (err) {
    console.error("[checkout/release]", err);
    res.status(500).json({ error: "Release failed" });
  }
});

async function executeEscrowTransfers(
  order: typeof escrowOrdersTable.$inferSelect,
  orderId: string,
): Promise<{ sellerTransfer: string | null; runnerPayout: string | null; error?: string }> {
  const result: { sellerTransfer: string | null; runnerPayout: string | null; error?: string } = {
    sellerTransfer: null,
    runnerPayout: null,
  };

  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      logger.warn({ orderId }, "[escrow] Stripe unavailable — skipping transfers");
      await db.update(escrowOrdersTable).set({
        payoutStatus: "failed",
        payoutLastError: "Stripe client unavailable",
        updatedAt: new Date(),
      }).where(eq(escrowOrdersTable.orderId, orderId));
      return { ...result, error: "Stripe unavailable" };
    }

    if (!order.sellerConnectedAccountId) {
      logger.error({ orderId }, "[escrow] Seller connected account not set — cannot release funds");
      await db.update(escrowOrdersTable).set({
        payoutStatus: "failed",
        payoutLastError: "Seller connected account not configured — payout blocked",
        updatedAt: new Date(),
      }).where(eq(escrowOrdersTable.orderId, orderId));
      await writeAudit({
        eventType: "PAYOUT",
        severity: "CRIT",
        action: `Escrow release BLOCKED for ${orderId} — seller has no connected account`,
        metadata: { orderId },
      });
      return { ...result, error: "Seller connected account not configured — payout cannot proceed. Link the seller's Stripe Connect account first." };
    }

    if (order.sellerConnectedAccountId && !order.stripeTransferId) {
      const sellerAmount = order.priceCents;
      try {
        const transfer = await stripe.transfers.create({
          amount: sellerAmount,
          currency: "usd",
          destination: order.sellerConnectedAccountId,
          metadata: {
            orderId,
            type: "seller_escrow_release",
            vin: order.vin,
          },
          description: `Escrow release — ${order.vehicleName} (${orderId})`,
        }, {
          idempotencyKey: `seller-transfer-${orderId}`,
        });
        result.sellerTransfer = transfer.id;

        await db.update(escrowOrdersTable).set({
          stripeTransferId: transfer.id,
          updatedAt: new Date(),
        }).where(eq(escrowOrdersTable.orderId, orderId));

        await writeAudit({
          eventType: "PAYOUT",
          severity: "INFO",
          action: `Seller transfer completed: ${transfer.id} for order ${orderId}`,
          metadata: { amount: sellerAmount, destination: order.sellerConnectedAccountId },
        });

        logger.info({ orderId, transferId: transfer.id, amount: sellerAmount }, "[escrow] Seller transfer completed");
      } catch (err: any) {
        logger.error({ orderId, err: err.message }, "[escrow] Seller transfer FAILED");
        await writeAudit({
          eventType: "PAYOUT",
          severity: "CRIT",
          action: `Seller transfer FAILED for order ${orderId}: ${err.message}`,
          metadata: { orderId, error: err.message },
        });
        await scheduleTransferRetry(orderId, `seller: ${err.message}`);
        result.error = `Seller transfer failed: ${err.message}`;
      }
    }

    if (order.sellerConnectedAccountId && order.stripeTransferId) {
      result.sellerTransfer = order.stripeTransferId;
    }

    if (order.runnerConnectedAccountId && !order.runnerPayoutTransferId) {
      const runnerAmount = order.platformFeeCents;
      try {
        const payout = await stripe.transfers.create({
          amount: runnerAmount,
          currency: "usd",
          destination: order.runnerConnectedAccountId,
          metadata: {
            orderId,
            type: "runner_delivery_payout",
            vin: order.vin,
          },
          description: `Runner delivery payout — ${order.vehicleName} (${orderId})`,
        }, {
          idempotencyKey: `runner-payout-${orderId}`,
        });
        result.runnerPayout = payout.id;

        await db.update(escrowOrdersTable).set({
          runnerPayoutTransferId: payout.id,
          updatedAt: new Date(),
        }).where(eq(escrowOrdersTable.orderId, orderId));

        await writeAudit({
          eventType: "PAYOUT",
          severity: "INFO",
          action: `Runner payout completed: ${payout.id} for order ${orderId}`,
          metadata: { amount: runnerAmount, destination: order.runnerConnectedAccountId },
        });

        logger.info({ orderId, payoutId: payout.id, amount: runnerAmount }, "[escrow] Runner payout completed");
      } catch (err: any) {
        logger.error({ orderId, err: err.message }, "[escrow] Runner payout FAILED");
        await writeAudit({
          eventType: "PAYOUT",
          severity: "CRIT",
          action: `Runner payout FAILED for order ${orderId}: ${err.message}`,
          metadata: { orderId, error: err.message },
        });
        await scheduleTransferRetry(orderId, `runner: ${err.message}`);
        result.error = (result.error ? result.error + "; " : "") + `Runner payout failed: ${err.message}`;
      }
    }

    if (order.runnerConnectedAccountId && order.runnerPayoutTransferId) {
      result.runnerPayout = order.runnerPayoutTransferId;
    }

    if (!result.error) {
      await db.update(escrowOrdersTable).set({
        payoutStatus: "completed",
        updatedAt: new Date(),
      }).where(eq(escrowOrdersTable.orderId, orderId));
    }

    return result;
  } catch (err: any) {
    logger.error({ orderId, err: err.message }, "[escrow] Transfer execution error");
    await scheduleTransferRetry(orderId, err.message);
    return { ...result, error: err.message };
  }
}

async function scheduleTransferRetry(orderId: string, errorMessage: string): Promise<void> {
  const [order] = await db.select({
    payoutRetryCount: escrowOrdersTable.payoutRetryCount,
  }).from(escrowOrdersTable).where(eq(escrowOrdersTable.orderId, orderId)).limit(1);

  const retryCount = (order?.payoutRetryCount ?? 0) + 1;

  if (retryCount > MAX_TRANSFER_RETRIES) {
    await db.update(escrowOrdersTable).set({
      payoutStatus: "failed",
      payoutLastError: `Max retries exceeded. Last error: ${errorMessage}`,
      payoutRetryCount: retryCount,
      updatedAt: new Date(),
    }).where(eq(escrowOrdersTable.orderId, orderId));
    logger.error({ orderId, retryCount }, "[escrow] Max transfer retries exceeded — manual intervention required");
    return;
  }

  const delay = getBackoffDelay(retryCount);
  const nextRetry = new Date(Date.now() + delay);

  await db.update(escrowOrdersTable).set({
    payoutStatus: "retry_scheduled",
    payoutRetryCount: retryCount,
    payoutLastError: errorMessage,
    payoutNextRetryAt: nextRetry,
    updatedAt: new Date(),
  }).where(eq(escrowOrdersTable.orderId, orderId));

  logger.info({ orderId, retryCount, nextRetry: nextRetry.toISOString() }, "[escrow] Transfer retry scheduled (DB-backed)");
}

const RETRY_POLL_INTERVAL_MS = 60_000;
let retryPollerStarted = false;

export function startPayoutRetryPoller(): void {
  if (retryPollerStarted) return;
  retryPollerStarted = true;
  logger.info("[escrow] Starting DB-backed payout retry poller (60s interval)");

  setInterval(async () => {
    try {
      const now = new Date();
      const pendingRetries = await db.select().from(escrowOrdersTable)
        .where(
          and(
            eq(escrowOrdersTable.payoutStatus, "retry_scheduled"),
            lte(escrowOrdersTable.payoutNextRetryAt, now),
          )
        );

      for (const order of pendingRetries) {
        logger.info({ orderId: order.orderId, retryCount: order.payoutRetryCount }, "[escrow] Processing DB-backed payout retry");
        await db.update(escrowOrdersTable).set({
          payoutStatus: "processing",
          updatedAt: now,
        }).where(eq(escrowOrdersTable.orderId, order.orderId));

        try {
          await executeEscrowTransfers(order, order.orderId);
        } catch (err: any) {
          logger.error({ orderId: order.orderId, err: err.message }, "[escrow] Retry execution failed");
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message }, "[escrow] Retry poller error");
    }
  }, RETRY_POLL_INTERVAL_MS);
}

/* ─── GET /checkout/orders ───────────────────────────────────────────────── */
router.get("/checkout/orders", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orders = await db.select().from(escrowOrdersTable)
    .where(eq(escrowOrdersTable.buyerId, user.id))
    .orderBy(desc(escrowOrdersTable.createdAt));
  res.json({ orders });
});

/* ─── GET /checkout/orders/:id ──────────────────────────────────────────── */
router.get("/checkout/orders/:id", requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const [order] = await db.select().from(escrowOrdersTable)
    .where(eq(escrowOrdersTable.orderId, req.params["id"] as string)).limit(1);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  const isAdmin = user.role === "Admin" || user.role === "Sovereign";
  if (order.buyerId !== user.id && !isAdmin) {
    res.status(403).json({ error: "Not authorized to view this order" });
    return;
  }
  res.json({ order });
});

export default router;
