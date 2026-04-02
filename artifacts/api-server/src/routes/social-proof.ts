import { Router, Request, Response } from "express";
import { db, walletTransactionsTable, onyxWalletsTable, nodeProfilesTable, locationNodesTable, taskMatchingTable, inviteTreeTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Social Proof Engine",
    version: "1.0.0",
    description: "Real-time dopamine loop — see earnings, activity, and proof that ONYX works",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    feedTypes: ["earnings", "signups", "completions", "nearby", "milestones"],
    mandate: "Show every user that real people are earning real money, right now",
  });
});

router.get("/feed", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const recentEarnings = await db.select({
      userId: walletTransactionsTable.userId,
      amount: walletTransactionsTable.amountUsd,
      category: walletTransactionsTable.category,
      createdAt: walletTransactionsTable.createdAt,
    }).from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.direction, "Credit"))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(limit);

    const feed = recentEarnings.map(e => {
      const categoryLabels: Record<string, string> = {
        Referral_Payout: "a referral",
        Service_Payout: "a service job",
        Logistics_Payout: "a logistics run",
        Location_Payout: "their location",
        Deal_Payout: "a deal",
        Split_Distribution: "a split payout",
        Commission: "a commission",
        Bonus: "a bonus",
      };

      return {
        type: "earning",
        message: `A Node just earned $${parseFloat(e.amount).toFixed(2)} from ${categoryLabels[e.category] || "activity"}`,
        amount: e.amount,
        category: e.category,
        timestamp: e.createdAt,
      };
    });

    res.json({ feed, count: feed.length });
  } catch (error) {
    res.status(500).json({ error: "Feed failed", detail: String(error) });
  }
});

router.get("/my-stats/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));

    const [wallet] = await db.select().from(onyxWalletsTable)
      .where(eq(onyxWalletsTable.userId, userId)).limit(1);

    const invitesClaimed = await db.select({ count: sql<number>`count(*)` })
      .from(inviteTreeTable)
      .where(and(eq(inviteTreeTable.inviterUserId, userId), eq(inviteTreeTable.status, "Claimed")));

    const tasksCompleted = await db.select({ count: sql<number>`count(*)` })
      .from(taskMatchingTable)
      .where(and(eq(taskMatchingTable.assignedNodeId, userId), eq(taskMatchingTable.state, "Completed")));

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEarnings = await db.select({
      total: sql<string>`COALESCE(SUM(amount_usd), 0)`,
    }).from(walletTransactionsTable)
      .where(and(
        eq(walletTransactionsTable.userId, userId),
        eq(walletTransactionsTable.direction, "Credit"),
        gte(walletTransactionsTable.createdAt, last24h)
      ));

    res.json({
      userId,
      lifetimeEarnings: wallet?.lifetimeEarnedUsd || "0.00",
      currentBalance: wallet?.balanceUsd || "0.00",
      pendingEarnings: wallet?.pendingUsd || "0.00",
      last24hEarnings: recentEarnings[0]?.total || "0.00",
      peopleReferred: Number(invitesClaimed[0]?.count || 0),
      tasksCompleted: Number(tasksCompleted[0]?.count || 0),
      socialProof: {
        earningsBadge: parseFloat(wallet?.lifetimeEarnedUsd || "0") >= 1000 ? "Power Earner" :
          parseFloat(wallet?.lifetimeEarnedUsd || "0") >= 100 ? "Active Earner" : "Rising Node",
        referralBadge: Number(invitesClaimed[0]?.count || 0) >= 10 ? "Network Builder" :
          Number(invitesClaimed[0]?.count || 0) >= 3 ? "Connector" : "Newcomer",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Stats failed", detail: String(error) });
  }
});

router.get("/nearby-activity", async (req: Request, res: Response) => {
  try {
    const geoHash = req.query.geoHash as string;

    const recentTasks = await db.select().from(taskMatchingTable)
      .where(eq(taskMatchingTable.state, "Completed"))
      .orderBy(desc(taskMatchingTable.completedAt))
      .limit(10);

    const totalRecentPayouts = recentTasks.reduce((s, t) => s + parseFloat(t.actualPayoutUsd || t.estimatedPayoutUsd || "0"), 0);

    const activeLocations = await db.select({ count: sql<number>`count(*)` })
      .from(locationNodesTable)
      .where(eq(locationNodesTable.isActive, true));

    res.json({
      nearbyActivity: {
        recentCompletedTasks: recentTasks.length,
        totalPayoutsNearby: `$${totalRecentPayouts.toFixed(2)}`,
        activeLocations: Number(activeLocations[0]?.count || 0),
        message: totalRecentPayouts > 0
          ? `$${totalRecentPayouts.toFixed(2)} generated near you recently`
          : "Be the first to earn in your area",
      },
      recentTasks: recentTasks.map(t => ({
        category: t.category,
        payout: t.actualPayoutUsd || t.estimatedPayoutUsd,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Nearby activity failed", detail: String(error) });
  }
});

router.get("/milestones/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));

    const [wallet] = await db.select().from(onyxWalletsTable)
      .where(eq(onyxWalletsTable.userId, userId)).limit(1);

    const lifetime = parseFloat(wallet?.lifetimeEarnedUsd || "0");
    const milestones = [
      { threshold: 1, label: "First Dollar", emoji: "spark", reached: lifetime >= 1 },
      { threshold: 10, label: "Double Digits", emoji: "fire", reached: lifetime >= 10 },
      { threshold: 100, label: "Centurion", emoji: "bolt", reached: lifetime >= 100 },
      { threshold: 500, label: "Half Grand", emoji: "star", reached: lifetime >= 500 },
      { threshold: 1000, label: "Grand Earner", emoji: "trophy", reached: lifetime >= 1000 },
      { threshold: 5000, label: "Five Stack", emoji: "diamond", reached: lifetime >= 5000 },
      { threshold: 10000, label: "Ten Thousand Club", emoji: "crown", reached: lifetime >= 10000 },
      { threshold: 50000, label: "Fifty K Legend", emoji: "rocket", reached: lifetime >= 50000 },
      { threshold: 100000, label: "Hundred K Sovereign", emoji: "globe", reached: lifetime >= 100000 },
    ];

    const nextMilestone = milestones.find(m => !m.reached);

    res.json({
      userId,
      lifetimeEarnings: lifetime.toFixed(2),
      milestonesReached: milestones.filter(m => m.reached).length,
      totalMilestones: milestones.length,
      milestones,
      nextMilestone: nextMilestone ? {
        ...nextMilestone,
        remaining: (nextMilestone.threshold - lifetime).toFixed(2),
      } : { label: "All milestones reached — you are ONYX Royalty" },
    });
  } catch (error) {
    res.status(500).json({ error: "Milestones failed", detail: String(error) });
  }
});

router.get("/network-stats", async (_req: Request, res: Response) => {
  try {
    const [totalNodes] = await db.select({ count: sql<number>`count(*)` }).from(nodeProfilesTable);
    const [totalLocations] = await db.select({ count: sql<number>`count(*)` }).from(locationNodesTable);
    const [totalTasks] = await db.select({ count: sql<number>`count(*)` }).from(taskMatchingTable);
    const [totalEarnings] = await db.select({
      total: sql<string>`COALESCE(SUM(lifetime_earned_usd), 0)`,
    }).from(onyxWalletsTable);

    res.json({
      protocol: "ONYX Global Network Stats",
      totalNodes: Number(totalNodes?.count || 0),
      totalLocations: Number(totalLocations?.count || 0),
      totalTasksProcessed: Number(totalTasks?.count || 0),
      totalEarningsDistributed: `$${parseFloat(totalEarnings?.total || "0").toFixed(2)}`,
      networkHealth: "Operational",
      architect: "Ronald Antonio Cadet",
    });
  } catch (error) {
    res.status(500).json({ error: "Network stats failed", detail: String(error) });
  }
});

export default router;
