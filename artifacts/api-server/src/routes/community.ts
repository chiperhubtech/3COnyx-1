import { Router, type Request, type Response } from "express";
import { db, usersTable, referralLedgerTable, commissionLedgerTable, dealerflowTasksTable } from "@workspace/db";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

const FRIENDLY_STATUS: Record<string, string> = {
  Open: "Getting started",
  In_Progress: "Being handled",
  Completed: "Done",
  Cancelled: "Cancelled",
  Escalated: "Getting extra attention",
};

const FRIENDLY_DEPT: Record<string, string> = {
  Sales: "buying",
  Finance: "financing",
  F_And_I: "financing",
  Insurance: "insurance",
  Service: "repair",
  Parts: "parts",
  DMV: "registration",
  Logistics: "delivery",
};

router.get("/community/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      communityRole: usersTable.communityRole,
      points: usersTable.points,
      referralCode: usersTable.referralCode,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const [connectionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.referredBy, userId));

    const [peopleHelpedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referralLedgerTable)
      .where(and(
        eq(referralLedgerTable.referringNodeId, userId),
        eq(referralLedgerTable.status, "Closed"),
      ));

    const [earningsResult] = await db
      .select({ total: sql<string>`coalesce(sum(${commissionLedgerTable.amountUsd}), '0')` })
      .from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.entryType, "Referral"),
      ));

    const [pendingResult] = await db
      .select({ total: sql<string>`coalesce(sum(${commissionLedgerTable.amountUsd}), '0')` })
      .from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.entryType, "Referral"),
        eq(commissionLedgerTable.status, "Pending"),
      ));

    const connections = connectionCount?.count || 0;
    const peopleHelped = peopleHelpedResult?.count || 0;
    const totalEarnings = parseFloat(earningsResult?.total || "0");
    const pendingEarnings = parseFloat(pendingResult?.total || "0");

    let networkTier = "Starter";
    if (connections >= 50) networkTier = "Platinum";
    else if (connections >= 20) networkTier = "Gold";
    else if (connections >= 10) networkTier = "Silver";
    else if (connections >= 3) networkTier = "Bronze";

    res.json({
      memberId: user.id,
      name: user.name,
      communityRole: user.communityRole,
      referralCode: user.referralCode,
      memberSince: user.createdAt,
      points: user.points || 0,
      impact: {
        peopleHelped,
        totalEarnings,
        pendingEarnings,
        connections,
        networkTier,
      },
      mission: "We handle everything automotive so people don't have to.",
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Community] Profile fetch failed");
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.get("/community/network-feed", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const [user] = await db.select({ communityRole: usersTable.communityRole })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user || (user.communityRole !== "Connector" && user.communityRole !== "Operator")) {
      res.json({ feed: [], gated: true, message: "Become a Connector to see your network. Help someone get started." });
      return;
    }

    const referredUsers = await db.select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.referredBy, userId));

    const referredIds = referredUsers.map(u => u.id);

    if (referredIds.length === 0) {
      res.json({ feed: [], message: "Help someone get started — share your connection link." });
      return;
    }

    const activeTasks = await db.select({
      id: dealerflowTasksTable.id,
      title: dealerflowTasksTable.title,
      department: dealerflowTasksTable.department,
      status: dealerflowTasksTable.status,
      initiatorName: dealerflowTasksTable.initiatorName,
      createdAt: dealerflowTasksTable.createdAt,
    }).from(dealerflowTasksTable)
      .where(
        or(...referredIds.map(id => eq(dealerflowTasksTable.initiatorId, id)))
      )
      .orderBy(desc(dealerflowTasksTable.createdAt))
      .limit(20);

    const feed = activeTasks.map(t => {
      const firstName = (t.initiatorName || "Someone").split(" ")[0];
      const dept = FRIENDLY_DEPT[t.department || ""] || "automotive";
      const status = FRIENDLY_STATUS[t.status || ""] || "in progress";
      const statusColor = t.status === "Completed" ? "green" :
                          t.status === "In_Progress" ? "yellow" :
                          t.status === "Escalated" ? "red" : "blue";

      return {
        id: t.id,
        message: `${firstName}'s ${dept} request is ${status}`,
        statusDot: statusColor,
        department: dept,
        timestamp: t.createdAt,
      };
    });

    res.json({ feed });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Community] Network feed failed");
    res.status(500).json({ error: "Failed to load network feed" });
  }
});

router.get("/community/celebration-check", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastSeen = req.query.lastSeenId ? parseInt(req.query.lastSeenId as string, 10) : 0;

    const query = db.select({
      id: referralLedgerTable.id,
      referralId: referralLedgerTable.referralId,
      buyerName: referralLedgerTable.buyerName,
      commissionUsd: referralLedgerTable.commissionUsd,
      closedAt: referralLedgerTable.closedAt,
      metadata: referralLedgerTable.metadata,
    }).from(referralLedgerTable)
      .where(and(
        eq(referralLedgerTable.referringNodeId, userId),
        eq(referralLedgerTable.status, "Closed"),
        sql`${referralLedgerTable.closedAt} > ${oneDayAgo}`,
        ...(lastSeen ? [sql`${referralLedgerTable.id} > ${lastSeen}`] : []),
      ))
      .orderBy(desc(referralLedgerTable.closedAt))
      .limit(1);

    const [latest] = await query;

    if (!latest) {
      res.json({ hasCelebration: false });
      return;
    }

    const meta = (latest.metadata as any) || {};
    const department = meta.department || "service";
    const friendlyDept = FRIENDLY_DEPT[department] || "automotive";

    res.json({
      hasCelebration: true,
      celebration: {
        celebrationDbId: latest.id,
        referralId: latest.referralId,
        personHelped: latest.buyerName || "someone",
        serviceType: friendlyDept,
        earned: parseFloat(latest.commissionUsd || "0"),
        closedAt: latest.closedAt,
      },
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Community] Celebration check failed");
    res.status(500).json({ error: "Failed to check celebrations" });
  }
});

export default router;
