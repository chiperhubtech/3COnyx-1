import { Router, type Request, type Response } from "express";
import { db, commissionLedgerTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { processUniversalCommission, getCommissionRates, isValidCategory } from "../lib/commissionEngine";
import { parsePagination, paginatedResponse } from "../lib/pagination";
import { logger } from "../lib/logger";

const router = Router();

router.post("/commissions/process", requireAuth, async (req: Request, res: Response) => {
  try {
    const callerRole = req.user?.role;
    if (callerRole !== "Admin") {
      res.status(403).json({ error: "Only system/admin can process commissions" });
      return;
    }

    const { buyerUserId, transactionAmountCents, category, description, stripePaymentId, vehicleVin } = req.body ?? {};

    if (typeof buyerUserId !== "number" || !Number.isInteger(buyerUserId) || buyerUserId <= 0) {
      res.status(400).json({ error: "buyerUserId must be a positive integer" });
      return;
    }
    if (typeof transactionAmountCents !== "number" || !Number.isInteger(transactionAmountCents) || transactionAmountCents <= 0) {
      res.status(400).json({ error: "transactionAmountCents must be a positive integer" });
      return;
    }
    if (typeof category !== "string" || !isValidCategory(category)) {
      res.status(400).json({ error: `Invalid category. Valid: vehicle_purchase, parts, accessories, service, oil_change, tire_rotation, brake_service, body_work, diagnostic, detailing, insurance, transport, aftermarket, membership, custom` });
      return;
    }
    if (typeof description !== "string" || description.length === 0 || description.length > 500) {
      res.status(400).json({ error: "description is required and must be ≤500 characters" });
      return;
    }

    const result = await processUniversalCommission({
      buyerUserId,
      transactionAmountCents,
      category,
      description,
      stripePaymentId: stripePaymentId ?? null,
      vehicleVin: vehicleVin ?? null,
    });

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commissions] Process error");
    res.status(500).json({ error: "Failed to process commission" });
  }
});

router.get("/commissions/my-earnings", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user?.sub || "0", 10);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const pg = parsePagination(req, { limit: 50, maxLimit: 100 });

    const [totalResult] = await db.select({
      count: sql<number>`count(*)::int`,
    }).from(commissionLedgerTable)
      .where(eq(commissionLedgerTable.recipientId, userId));

    const [totalEarned] = await db.select({
      total: sql<string>`COALESCE(SUM(amount_usd::numeric), 0)::text`,
    }).from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.status, "Approved"),
      ));

    const [totalPending] = await db.select({
      total: sql<string>`COALESCE(SUM(amount_usd::numeric), 0)::text`,
    }).from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.status, "Pending"),
      ));

    const [totalPaid] = await db.select({
      total: sql<string>`COALESCE(SUM(amount_usd::numeric), 0)::text`,
    }).from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.status, "Paid"),
      ));

    const entries = await db.select().from(commissionLedgerTable)
      .where(eq(commissionLedgerTable.recipientId, userId))
      .orderBy(desc(commissionLedgerTable.createdAt))
      .limit(pg.limit)
      .offset(pg.offset);

    const total = totalResult?.count ?? 0;
    const paginated = paginatedResponse(entries, total, pg);

    res.json({
      earnings: {
        approved: totalEarned?.total ?? "0.00",
        pending: totalPending?.total ?? "0.00",
        paid: totalPaid?.total ?? "0.00",
      },
      entries: paginated.data,
      pagination: paginated.pagination,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commissions] My earnings error");
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

router.get("/commissions/rates", (_req: Request, res: Response) => {
  const rates = getCommissionRates();
  const formatted = Object.entries(rates).map(([category, rate]) => ({
    category,
    label: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    rate,
    percentage: `${(rate * 100).toFixed(0)}%`,
  }));
  res.json({ rates: formatted });
});

router.get("/commissions/summary/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const callerRole = req.user?.role;
    const callerId = parseInt(req.user?.sub || "0", 10);
    const targetId = parseInt(req.params.userId || "0", 10);

    if (callerRole !== "Admin" && callerId !== targetId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [stats] = await db.select({
      totalEntries: sql<number>`count(*)::int`,
      totalEarned: sql<string>`COALESCE(SUM(CASE WHEN status IN ('Approved','Paid') THEN amount_usd::numeric ELSE 0 END), 0)::text`,
      totalPending: sql<string>`COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount_usd::numeric ELSE 0 END), 0)::text`,
      totalPaid: sql<string>`COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount_usd::numeric ELSE 0 END), 0)::text`,
    }).from(commissionLedgerTable)
      .where(eq(commissionLedgerTable.recipientId, targetId));

    const [user] = await db.select({
      name: usersTable.name,
      referralCode: usersTable.referralCode,
      points: usersTable.points,
      role: usersTable.role,
    }).from(usersTable).where(eq(usersTable.id, targetId)).limit(1);

    res.json({
      userId: targetId,
      name: user?.name ?? "Unknown",
      referralCode: user?.referralCode ?? null,
      role: user?.role ?? null,
      points: user?.points ?? 0,
      commissions: {
        totalEntries: stats?.totalEntries ?? 0,
        totalEarned: stats?.totalEarned ?? "0.00",
        totalPending: stats?.totalPending ?? "0.00",
        totalPaid: stats?.totalPaid ?? "0.00",
      },
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commissions] Summary error");
    res.status(500).json({ error: "Failed to fetch commission summary" });
  }
});

export default router;
