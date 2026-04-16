/**
 * 3C Onyx — Admin Dashboard API
 * All routes require: Auth + Admin role
 *
 * GET  /api/admin/stats          — Platform-wide metrics
 * GET  /api/admin/users          — All users (paginated)
 * GET  /api/admin/users/:id      — Single user detail
 * PATCH /api/admin/users/:id     — Update user (role, isActive, isVerified)
 * GET  /api/admin/transactions   — All transactions (paginated)
 * GET  /api/admin/waitlist       — Waitlist overview
 * POST /api/admin/audit          — Write admin audit entry
 */
import { Router, type Request, type Response } from "express";
import { db, usersTable, transactionsTable, waitlistTable, gigTasksTable, vehiclesTable, escrowOrdersTable } from "@workspace/db";
import { eq, desc, count, sql, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireSovereign, isSovereign } from "../middlewares/requireSovereign";
import { writeAudit } from "../lib/auditService";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth, requireRole("Admin"));

router.get("/stats", async (req: Request, res: Response) => {
  const [userCount]    = await db.select({ count: count() }).from(usersTable);
  const [txCount]      = await db.select({ count: count() }).from(transactionsTable);
  const [vehicleCount] = await db.select({ count: count() }).from(vehiclesTable);
  const [taskCount]    = await db.select({ count: count() }).from(gigTasksTable);
  const [waitCount]    = await db.select({ count: count() }).from(waitlistTable);

  if (!isSovereign(req)) {
    res.json({
      users: Number(userCount.count),
      vehicles: Number(vehicleCount.count),
      gigTasks: Number(taskCount.count),
      ts: new Date().toISOString(),
      accessLevel: "Limited — Sovereign access required for full dashboard",
    });
    return;
  }

  const roleBreakdown = await db
    .select({ role: usersTable.role, count: count() })
    .from(usersTable)
    .groupBy(usersTable.role);

  const recentTx = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);

  const totalRevenueCents = await db
    .select({ total: sql<string>`COALESCE(SUM(amount_cents),0)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "COMPLETED"));

  res.json({
    users:          Number(userCount.count),
    transactions:   Number(txCount.count),
    vehicles:       Number(vehicleCount.count),
    gigTasks:       Number(taskCount.count),
    waitlist:       Number(waitCount.count),
    totalRevenue:   `$${(Number(totalRevenueCents[0].total) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    roleBreakdown:  roleBreakdown.map((r) => ({ role: r.role, count: Number(r.count) })),
    recentTransactions: recentTx,
    ts: new Date().toISOString(),
    accessLevel: "Sovereign — Full Command Center",
  });
});

router.get("/users", async (req: Request, res: Response) => {
  const page  = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 25));
  const offset = (page - 1) * limit;

  const users = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, isActive: usersTable.isActive, isVerified: usersTable.isVerified,
      createdAt: usersTable.createdAt, lastLoginAt: usersTable.lastLoginAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ count: count() }).from(usersTable);
  res.json({ users, total: Number(total.count), page, limit, pages: Math.ceil(Number(total.count) / limit) });
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...pub } = user;
  res.json({ user: pub });
});

router.patch("/users/:id", requireSovereign, async (req: Request, res: Response) => {
  const { role, isActive, isVerified } = req.body as {
    role?: string; isActive?: boolean; isVerified?: boolean;
  };
  const userId = Number(req.params.id);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (role !== undefined)       updates.role       = role;
  if (isActive !== undefined)   updates.isActive   = isActive;
  if (isVerified !== undefined) updates.isVerified = isVerified;

  const [updated] = await db.update(usersTable).set(updates as unknown as typeof usersTable.$inferInsert).where(eq(usersTable.id, userId)).returning();
  await writeAudit({ eventType: "ADMIN", severity: "INFO", action: `Sovereign updated user ${userId}`, metadata: { updates, byAdmin: req.user!.sub } });
  const { passwordHash: _, ...pub } = updated;
  res.json({ user: pub });
});

router.get("/transactions", requireSovereign, async (req: Request, res: Response) => {
  const page  = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 25));
  const offset = (page - 1) * limit;

  const txs   = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ count: count() }).from(transactionsTable);
  res.json({ transactions: txs, total: Number(total.count), page, limit });
});

router.get("/waitlist", async (_req: Request, res: Response) => {
  const entries = await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt)).limit(200);
  const [total] = await db.select({ count: count() }).from(waitlistTable);
  res.json({ entries, total: Number(total.count) });
});

router.post("/audit", async (req: Request, res: Response) => {
  const { message, data } = req.body as { message?: string; data?: Record<string, unknown> };
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  await writeAudit({ eventType: "ADMIN", severity: "INFO", action: message, metadata: data ?? {} });
  res.json({ success: true });
});

router.get("/reconciliation", requireSovereign, async (req: Request, res: Response) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days ?? 7)));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Stripe client unavailable — cannot reconcile" });
      return;
    }

    const stripePaymentIntents: Array<{
      id: string;
      amount: number;
      status: string;
      created: number;
      metadata: Record<string, string>;
    }> = [];

    let hasMore = true;
    let startingAfter: string | undefined;
    const createdGte = Math.floor(cutoff.getTime() / 1000);

    while (hasMore) {
      const params: Record<string, any> = {
        limit: 100,
        created: { gte: createdGte },
      };
      if (startingAfter) params.starting_after = startingAfter;

      const batch = await stripe.paymentIntents.list(params);
      for (const pi of batch.data) {
        stripePaymentIntents.push({
          id: pi.id,
          amount: pi.amount,
          status: pi.status,
          created: pi.created,
          metadata: (pi.metadata ?? {}) as Record<string, string>,
        });
      }
      hasMore = batch.has_more;
      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }

      if (stripePaymentIntents.length >= 1000) {
        hasMore = false;
      }
    }

    const internalTxs = await db.select({
      id: transactionsTable.id,
      stripePaymentId: transactionsTable.stripePaymentId,
      amountCents: transactionsTable.amountCents,
      status: transactionsTable.status,
      type: transactionsTable.type,
      createdAt: transactionsTable.createdAt,
    }).from(transactionsTable)
      .where(gte(transactionsTable.createdAt, cutoff));

    const internalByStripeId = new Map<string, typeof internalTxs[number]>();
    for (const tx of internalTxs) {
      if (tx.stripePaymentId) {
        internalByStripeId.set(tx.stripePaymentId, tx);
      }
    }

    const stripeIdSet = new Set(stripePaymentIntents.map(pi => pi.id));

    const discrepancies: Array<{
      type: string;
      stripePaymentIntentId: string;
      details: Record<string, unknown>;
    }> = [];

    for (const pi of stripePaymentIntents) {
      if (pi.status !== "succeeded") continue;

      const internal = internalByStripeId.get(pi.id);
      if (!internal) {
        discrepancies.push({
          type: "missing_internal_record",
          stripePaymentIntentId: pi.id,
          details: {
            stripeAmount: pi.amount,
            stripeCreated: new Date(pi.created * 1000).toISOString(),
            metadata: pi.metadata,
          },
        });
        continue;
      }

      if (internal.amountCents !== pi.amount) {
        discrepancies.push({
          type: "amount_mismatch",
          stripePaymentIntentId: pi.id,
          details: {
            stripeAmount: pi.amount,
            internalAmount: internal.amountCents,
            internalTxId: internal.id,
          },
        });
      }

      if (internal.status !== "COMPLETED") {
        discrepancies.push({
          type: "status_mismatch",
          stripePaymentIntentId: pi.id,
          details: {
            stripeStatus: pi.status,
            internalStatus: internal.status,
            internalTxId: internal.id,
          },
        });
      }
    }

    for (const tx of internalTxs) {
      if (tx.stripePaymentId && !stripeIdSet.has(tx.stripePaymentId) && tx.type === "PURCHASE") {
        discrepancies.push({
          type: "orphaned_internal_record",
          stripePaymentIntentId: tx.stripePaymentId,
          details: {
            internalTxId: tx.id,
            internalAmount: tx.amountCents,
            internalStatus: tx.status,
          },
        });
      }
    }

    const escrowOrders = await db.select({
      orderId: escrowOrdersTable.orderId,
      payoutStatus: escrowOrdersTable.payoutStatus,
      payoutLastError: escrowOrdersTable.payoutLastError,
      payoutRetryCount: escrowOrdersTable.payoutRetryCount,
      totalAmountCents: escrowOrdersTable.totalAmountCents,
    }).from(escrowOrdersTable)
      .where(gte(escrowOrdersTable.createdAt, cutoff));

    const failedPayouts = escrowOrders.filter(o => o.payoutStatus === "failed" || o.payoutStatus === "retry_scheduled");

    await writeAudit({
      eventType: "ADMIN",
      severity: "INFO",
      action: `Reconciliation run: ${days} days, ${stripePaymentIntents.length} Stripe PIs, ${internalTxs.length} internal txs, ${discrepancies.length} discrepancies`,
      metadata: { days, discrepancyCount: discrepancies.length },
    });

    res.json({
      period: { days, from: cutoff.toISOString(), to: new Date().toISOString() },
      summary: {
        stripePaymentIntents: stripePaymentIntents.length,
        internalTransactions: internalTxs.length,
        discrepancies: discrepancies.length,
        failedPayouts: failedPayouts.length,
      },
      discrepancies,
      failedPayouts,
      ts: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error({ err: err.message }, "[admin/reconciliation] Error");
    res.status(500).json({ error: "Reconciliation failed" });
  }
});

router.patch("/escrow-orders/:orderId/connect-accounts", requireSovereign, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const { sellerConnectedAccountId, runnerConnectedAccountId, runnerId } = req.body as {
      sellerConnectedAccountId?: string;
      runnerConnectedAccountId?: string;
      runnerId?: string;
    };

    const [order] = await db.select().from(escrowOrdersTable)
      .where(eq(escrowOrdersTable.orderId, orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    await db.update(escrowOrdersTable).set({
      updatedAt: new Date(),
      ...(sellerConnectedAccountId ? { sellerConnectedAccountId } : {}),
      ...(runnerConnectedAccountId ? { runnerConnectedAccountId } : {}),
      ...(runnerId ? { runnerId } : {}),
    }).where(eq(escrowOrdersTable.orderId, orderId));

    await writeAudit({
      eventType: "SYSTEM",
      severity: "INFO",
      action: `Connected accounts updated for order ${orderId}`,
      actorId: (req as any).user?.id,
      metadata: { orderId, sellerConnectedAccountId: sellerConnectedAccountId ?? null, runnerConnectedAccountId: runnerConnectedAccountId ?? null, runnerId: runnerId ?? null },
    });

    const updatedFields = [
      ...(sellerConnectedAccountId ? ["sellerConnectedAccountId"] : []),
      ...(runnerConnectedAccountId ? ["runnerConnectedAccountId"] : []),
      ...(runnerId ? ["runnerId"] : []),
    ];
    res.json({ success: true, orderId, updated: updatedFields });
  } catch (err: any) {
    logger.error({ err: err.message }, "[admin] Connect accounts update failed");
    res.status(500).json({ error: "Failed to update connected accounts" });
  }
});

router.post("/escrow-orders/:orderId/retry-payout", requireSovereign, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const [order] = await db.select().from(escrowOrdersTable)
      .where(eq(escrowOrdersTable.orderId, orderId)).limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.payoutStatus !== "failed" && order.payoutStatus !== "retry_scheduled") {
      res.status(409).json({ error: `Cannot retry payout — current status is '${order.payoutStatus}'` });
      return;
    }

    if (!order.sellerConnectedAccountId) {
      res.status(400).json({ error: "Seller connected account must be linked before retrying payout" });
      return;
    }

    await db.update(escrowOrdersTable).set({
      payoutStatus: "retry_scheduled",
      payoutNextRetryAt: new Date(),
      payoutLastError: null,
      updatedAt: new Date(),
    }).where(eq(escrowOrdersTable.orderId, orderId));

    await writeAudit({
      eventType: "PAYOUT",
      severity: "INFO",
      action: `Admin triggered payout retry for order ${orderId}`,
      actorId: (req as any).user?.id,
      metadata: { orderId },
    });

    res.json({ success: true, orderId, message: "Payout retry scheduled — will be processed within 60 seconds" });
  } catch (err: any) {
    logger.error({ err: err.message }, "[admin] Retry payout failed");
    res.status(500).json({ error: "Failed to schedule payout retry" });
  }
});

export default router;
