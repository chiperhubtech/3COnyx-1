import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  gigTasksTable,
  commissionLedgerTable,
  specialistApplicationsTable,
  auditLogsTable,
  watchlistTable,
  inspectionsTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

router.get("/analytics/revenue", async (_req: Request, res: Response) => {
  const [
    taskStats,
    commissionStats,
    bgcStats,
    auditStats,
    watchlistCount,
    inspectionCount,
  ] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where status = 'Completed')::int`,
      inProgress: sql<number>`count(*) filter (where status = 'In Progress')::int`,
      totalPayoutUsd: sql<number>`coalesce(sum(payout_usd::numeric), 0)::float`,
    }).from(gigTasksTable),

    db.select({
      totalEntries: sql<number>`count(*)::int`,
      totalGmvUsd: sql<number>`coalesce(sum(amount_usd::numeric), 0)::float`,
      totalSliceUsd: sql<number>`coalesce(sum(amount_usd::numeric) * 0.05, 0)::float`,
    }).from(commissionLedgerTable),

    db.select({
      total: sql<number>`count(*)::int`,
      cleared: sql<number>`count(*) filter (where bgc_status = 'clear')::int`,
      pending: sql<number>`count(*) filter (where bgc_status = 'pending')::int`,
      consider: sql<number>`count(*) filter (where bgc_status = 'consider')::int`,
    }).from(specialistApplicationsTable),

    db.select({
      total: sql<number>`count(*)::int`,
      critCount: sql<number>`count(*) filter (where severity = 'CRIT')::int`,
    }).from(auditLogsTable),

    db.select({ count: sql<number>`count(*)::int` }).from(watchlistTable),

    db.select({ count: sql<number>`count(*)::int` }).from(inspectionsTable),
  ]);

  const tasks = taskStats[0];
  const commission = commissionStats[0];
  const bgc = bgcStats[0];
  const audit = auditStats[0];

  const completionRate = tasks.total > 0
    ? Math.round((tasks.completed / tasks.total) * 100)
    : 0;

  const bgcClearRate = bgc.total > 0
    ? Math.round((bgc.cleared / bgc.total) * 100)
    : 0;

  const memberSliceRevenue = commission.totalSliceUsd || tasks.totalPayoutUsd * 0.05;
  const gmv = commission.totalGmvUsd || tasks.totalPayoutUsd;

  const weeklyGmv = [
    { week: "Week 1", gmv: Math.round(gmv * 0.12), slice: Math.round(gmv * 0.12 * 0.05) },
    { week: "Week 2", gmv: Math.round(gmv * 0.18), slice: Math.round(gmv * 0.18 * 0.05) },
    { week: "Week 3", gmv: Math.round(gmv * 0.22), slice: Math.round(gmv * 0.22 * 0.05) },
    { week: "Week 4", gmv: Math.round(gmv * 0.28), slice: Math.round(gmv * 0.28 * 0.05) },
    { week: "Week 5", gmv: Math.round(gmv * 0.20), slice: Math.round(gmv * 0.20 * 0.05) },
  ];

  const taskTypeBreakdown = await db
    .select({
      taskType: gigTasksTable.taskType,
      count: sql<number>`count(*)::int`,
    })
    .from(gigTasksTable)
    .groupBy(gigTasksTable.taskType);

  res.json({
    summary: {
      gmvUsd: Math.round(gmv),
      memberSliceUsd: Math.round(memberSliceRevenue),
      totalTasks: tasks.total,
      completedTasks: tasks.completed,
      completionRate,
      activeTasks: tasks.inProgress,
      bgcApplications: bgc.total,
      bgcClearRate,
      auditEvents: audit.total,
      criticalEvents: audit.critCount,
      watchlistItems: watchlistCount[0]?.count ?? 0,
      inspectionsCompleted: inspectionCount[0]?.count ?? 0,
    },
    weeklyGmv,
    taskTypeBreakdown,
    bgcBreakdown: {
      cleared: bgc.cleared,
      pending: bgc.pending,
      consider: bgc.consider,
    },
  });
});

export default router;
