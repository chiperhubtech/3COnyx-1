import { Router, type Request, type Response } from "express";
import { db, dealsTable, dealerflowTasksTable, commissionLedgerTable } from "@workspace/db";
import { eq, desc, and, sql, count, asc, ne, inArray } from "drizzle-orm";
import { smartRoute } from "../lib/smart-router";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const VALID_DEAL_STATUSES = ["Open", "In_Progress", "Pending_Finance", "Pending_Insurance", "Pending_DMV", "Pending_Recon", "Funded", "Delivered", "Unwound", "Cancelled"] as const;
const VALID_DEAL_TYPES = ["New_Sale", "Used_Sale", "Lease", "Wholesale", "Trade_In"] as const;
const VALID_COMMISSION_STATUSES = ["Pending", "Approved", "Paid", "Held", "Clawback"] as const;

function sanitizeError() { return "Internal server error"; }
function safeParseInt(val: any, def: number) { const n = parseInt(val, 10); return isNaN(n) ? def : n; }

function requireUserId(req: Request, res: Response): number | null {
  const sub = (req as any).user?.sub ?? (req as any).userId;
  if (!sub) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const id = parseInt(String(sub), 10);
  if (!Number.isFinite(id)) { res.status(401).json({ error: "Invalid user identity" }); return null; }
  return id;
}

function generateDealNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `DL-${ts}-${rand}`;
}

const DEAL_LIFECYCLE_TASKS = [
  { title: "Vehicle Reconditioning Inspection", department: "Service", scope: "Internal", priority: "Medium", sla: 480, agent: "Service Agent", reason: null, order: 0, dependsOnIndex: null },
  { title: "Due-Bill Parts Order", department: "Parts", scope: "Internal", priority: "Medium", sla: 480, agent: "Parts Agent", reason: null, order: 0, dependsOnIndex: null },
  { title: "Insurance Binder Request", department: "Finance", scope: "External", priority: "High", sla: 240, agent: "Insurance Agent", reason: "Waiting on insurance provider", order: 1, dependsOnIndex: 0 },
  { title: "DMV Title & Plates Processing", department: "DMV", scope: "External", priority: "High", sla: 1440, agent: "Title Agent", reason: "Waiting on government agency", order: 2, dependsOnIndex: 2 },
  { title: "Finance Package — Bank-Ready Submission", department: "Finance", scope: "External", priority: "Critical", sla: 120, agent: "Finance Agent", reason: "Waiting on lender/bank", order: 3, dependsOnIndex: 3 },
  { title: "Delivery Prep & Customer Handoff", department: "Sales", scope: "Internal", priority: "Medium", sla: 1440, agent: "Delivery Agent", reason: null, order: 4, dependsOnIndex: 4 },
];

router.post("/deals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { customerName, customerPhone, customerEmail, vin, vehicleLabel, dealType, salePrice, grossProfit, backEndProfit, salespersonName, lenderName, commissionAmount } = req.body;

    if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0) {
      res.status(400).json({ error: "customerName is required" });
      return;
    }

    const effectiveDealType = (VALID_DEAL_TYPES as readonly string[]).includes(dealType) ? dealType : "Used_Sale";
    const dealNumber = generateDealNumber();

    const [deal] = await db.insert(dealsTable).values({
      dealNumber,
      dealType: effectiveDealType,
      status: "Open",
      customerName: customerName.trim().substring(0, 200),
      customerPhone: customerPhone ? String(customerPhone).substring(0, 20) : null,
      customerEmail: customerEmail ? String(customerEmail).substring(0, 200) : null,
      vin: vin ? String(vin).substring(0, 17) : null,
      vehicleLabel: vehicleLabel ? String(vehicleLabel).substring(0, 200) : null,
      salePrice: salePrice ? String(salePrice) : null,
      grossProfit: grossProfit ? String(grossProfit) : null,
      backEndProfit: backEndProfit ? String(backEndProfit) : null,
      salespersonId: userId,
      salespersonName: salespersonName ? String(salespersonName).substring(0, 100) : null,
      commissionAmount: commissionAmount ? String(commissionAmount) : null,
      commissionStatus: "Pending",
      lenderName: lenderName ? String(lenderName).substring(0, 200) : null,
      dealershipId: userId,
      metadata: {
        architect: "Ronald Antonio Cadet",
        platform: "3C ONYX — DealerFlow OS",
        createdVia: "DealerFlow Deal Creator",
      },
    }).returning();

    const now = new Date();
    const createdTasks: any[] = [];
    for (let i = 0; i < DEAL_LIFECYCLE_TASKS.length; i++) {
      const tmpl = DEAL_LIFECYCLE_TASKS[i];
      const hasUnmetDep = tmpl.dependsOnIndex !== null;
      const predecessorId = hasUnmetDep ? createdTasks[tmpl.dependsOnIndex]?.id ?? null : null;
      const initialStatus = predecessorId ? "Blocked" : "Open";
      const slaDue = initialStatus === "Blocked" ? null : new Date(now.getTime() + tmpl.sla * 60 * 1000);
      const [task] = await db.insert(dealerflowTasksTable).values({
        title: `[${dealNumber}] ${tmpl.title}`,
        description: `Auto-generated for Deal ${dealNumber} — ${customerName}`,
        department: tmpl.department as any,
        priority: tmpl.priority as any,
        status: initialStatus,
        intakeType: "Manual",
        taskScope: tmpl.scope as any,
        vin: vin || null,
        dealId: deal.id,
        dealershipId: userId,
        slaMinutes: tmpl.sla,
        slaDueAt: slaDue,
        dependsOnTaskId: predecessorId,
        routedByAgent: tmpl.agent,
        routingConfidence: "1",
        metadata: {
          dealNumber,
          dealId: deal.id,
          lifecycleTask: true,
          lifecycleOrder: tmpl.order,
          taskScope: tmpl.scope,
          externalParty: tmpl.scope === "External" ? tmpl.title.split(" ")[0] : null,
          externalReason: tmpl.reason,
        },
      }).returning();
      createdTasks.push(task);
    }

    res.status(201).json({
      deal,
      tasks: createdTasks,
      lifecycle: {
        totalTasks: createdTasks.length,
        externalTasks: createdTasks.filter((t) => t.taskScope === "External").length,
        internalTasks: createdTasks.filter((t) => t.taskScope === "Internal").length,
      },
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/deals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { status, dealType, limit: rawLimit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [eq(dealsTable.dealershipId, userId)];

    if (status && typeof status === "string" && (VALID_DEAL_STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(dealsTable.status, status as typeof VALID_DEAL_STATUSES[number]));
    }
    if (dealType && typeof dealType === "string" && (VALID_DEAL_TYPES as readonly string[]).includes(dealType)) {
      conditions.push(eq(dealsTable.dealType, dealType as typeof VALID_DEAL_TYPES[number]));
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);
    const where = and(...conditions);

    const deals = await db.select().from(dealsTable)
      .where(where)
      .orderBy(desc(dealsTable.createdAt))
      .limit(maxRows);

    res.json({ deals, count: deals.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/deals/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) { res.status(400).json({ error: "Invalid deal ID" }); return; }

    const [deal] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, id), eq(dealsTable.dealershipId, userId)));

    if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

    const tasks = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealId, id), eq(dealerflowTasksTable.dealershipId, userId)))
      .orderBy(asc(dealerflowTasksTable.createdAt));

    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const totalTasks = tasks.length;
    const blockers = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status) && t.priority === "Critical");

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const enrichedTasks = tasks.map((t) => {
      const predecessor = t.dependsOnTaskId ? taskMap.get(t.dependsOnTaskId) : null;
      return {
        ...t,
        predecessorTitle: predecessor ? predecessor.title.replace(/\[.*?\]\s*/, "") : null,
        predecessorStatus: predecessor ? predecessor.status : null,
      };
    });

    const nextAction = enrichedTasks.find((t) => !["Completed", "Cancelled", "Blocked"].includes(t.status));

    res.json({
      deal,
      tasks: enrichedTasks,
      progress: {
        completed: completedTasks,
        total: totalTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        blockers: blockers.map((b) => ({ id: b.id, title: b.title, status: b.status, department: b.department })),
        nextActionTaskId: nextAction?.id ?? null,
      },
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.patch("/deals/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) { res.status(400).json({ error: "Invalid deal ID" }); return; }

    const [existing] = await db.select().from(dealsTable)
      .where(and(eq(dealsTable.id, id), eq(dealsTable.dealershipId, userId)));

    if (!existing) { res.status(404).json({ error: "Deal not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (req.body.status && (VALID_DEAL_STATUSES as readonly string[]).includes(req.body.status)) {
      updates.status = req.body.status;
      if (req.body.status === "Funded") updates.fundedAt = new Date();
      if (req.body.status === "Delivered") updates.deliveredAt = new Date();
    }
    if (req.body.commissionStatus && (VALID_COMMISSION_STATUSES as readonly string[]).includes(req.body.commissionStatus)) {
      updates.commissionStatus = req.body.commissionStatus;
      if (req.body.commissionStatus === "Paid") updates.commissionPaidAt = new Date();
    }
    if (req.body.salePrice !== undefined) updates.salePrice = String(req.body.salePrice);
    if (req.body.grossProfit !== undefined) updates.grossProfit = String(req.body.grossProfit);
    if (req.body.backEndProfit !== undefined) updates.backEndProfit = String(req.body.backEndProfit);
    if (req.body.commissionAmount !== undefined) updates.commissionAmount = String(req.body.commissionAmount);
    if (req.body.lenderName) updates.lenderName = String(req.body.lenderName).substring(0, 200);
    if (req.body.customerPhone) updates.customerPhone = String(req.body.customerPhone).substring(0, 20);
    if (req.body.customerEmail) updates.customerEmail = String(req.body.customerEmail).substring(0, 200);

    const [updated] = await db.update(dealsTable)
      .set(updates)
      .where(and(eq(dealsTable.id, id), eq(dealsTable.dealershipId, userId)))
      .returning();

    res.json({ deal: updated });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/deals/dashboard/my-deals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const [stats] = await db
      .select({
        totalDeals: count(),
        openDeals: sql<number>`count(*) filter (where ${dealsTable.status} not in ('Delivered', 'Cancelled', 'Unwound'))`,
        fundedDeals: sql<number>`count(*) filter (where ${dealsTable.status} = 'Funded' or ${dealsTable.status} = 'Delivered')`,
        deliveredDeals: sql<number>`count(*) filter (where ${dealsTable.status} = 'Delivered')`,
        cancelledDeals: sql<number>`count(*) filter (where ${dealsTable.status} = 'Cancelled' or ${dealsTable.status} = 'Unwound')`,
        totalCommission: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} != 'Clawback'), 0)`,
        pendingCommission: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} = 'Pending'), 0)`,
        approvedCommission: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} = 'Approved'), 0)`,
        paidCommission: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} = 'Paid'), 0)`,
        heldCommission: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} = 'Held'), 0)`,
        totalSaleVolume: sql<string>`coalesce(sum(${dealsTable.salePrice}::numeric), 0)`,
        totalGrossProfit: sql<string>`coalesce(sum(${dealsTable.grossProfit}::numeric), 0)`,
        avgDealSize: sql<string>`coalesce(avg(${dealsTable.salePrice}::numeric), 0)`,
      })
      .from(dealsTable)
      .where(eq(dealsTable.dealershipId, userId));

    const recentDeals = await db.select().from(dealsTable)
      .where(eq(dealsTable.dealershipId, userId))
      .orderBy(desc(dealsTable.createdAt))
      .limit(10);

    const blockedDeals = [];
    for (const deal of recentDeals.filter((d) => !["Delivered", "Cancelled", "Unwound"].includes(d.status))) {
      const tasks = await db.select({
        id: dealerflowTasksTable.id,
        title: dealerflowTasksTable.title,
        status: dealerflowTasksTable.status,
        department: dealerflowTasksTable.department,
        taskScope: dealerflowTasksTable.taskScope,
        slaDueAt: dealerflowTasksTable.slaDueAt,
        dependsOnTaskId: dealerflowTasksTable.dependsOnTaskId,
      }).from(dealerflowTasksTable)
        .where(and(
          eq(dealerflowTasksTable.dealId, deal.id),
          ne(dealerflowTasksTable.status, "Completed"),
          ne(dealerflowTasksTable.status, "Cancelled"),
        ));

      if (tasks.length > 0) {
        const allDealTasks = await db.select({
          id: dealerflowTasksTable.id,
          title: dealerflowTasksTable.title,
          status: dealerflowTasksTable.status,
          dependsOnTaskId: dealerflowTasksTable.dependsOnTaskId,
        }).from(dealerflowTasksTable)
          .where(eq(dealerflowTasksTable.dealId, deal.id));

        const taskMap = new Map(allDealTasks.map((t) => [t.id, t]));

        function buildBlockerChain(taskId: number): string[] {
          const chain: string[] = [];
          const visited = new Set<number>();
          const startTask = taskMap.get(taskId);
          if (startTask && startTask.status !== "Completed") {
            chain.push(startTask.title.replace(/\[.*?\]\s*/, ""));
          }
          let current = startTask;
          while (current && current.dependsOnTaskId && !visited.has(current.id)) {
            visited.add(current.id);
            const pred = taskMap.get(current.dependsOnTaskId);
            if (pred && pred.status !== "Completed") {
              chain.push(pred.title.replace(/\[.*?\]\s*/, ""));
              current = pred;
            } else {
              break;
            }
          }
          return chain;
        }

        const incompleteTasks = tasks
          .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
          .sort((a, b) => {
            if (a.status === "Blocked" && b.status !== "Blocked") return -1;
            if (a.status !== "Blocked" && b.status === "Blocked") return 1;
            return 0;
          });
        const firstBlocker = incompleteTasks[0] || null;
        const blockerChain = firstBlocker ? buildBlockerChain(firstBlocker.id).reverse() : [];

        blockedDeals.push({
          dealId: deal.id,
          dealNumber: deal.dealNumber,
          customerName: deal.customerName,
          vehicleLabel: deal.vehicleLabel,
          commissionAmount: deal.commissionAmount,
          blockerChain: blockerChain.length > 0 ? blockerChain : null,
          missingSteps: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            department: t.department,
            status: t.status,
            scope: t.taskScope,
            slaOverdue: t.slaDueAt ? new Date(t.slaDueAt).getTime() < Date.now() : false,
          })),
        });
      }
    }

    res.json({
      salesperson: stats,
      recentDeals,
      blockedDeals,
      platform: "3C ONYX — DealerFlow OS",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/deals/dashboard/store-performance", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats] = await db
      .select({
        totalDeals: count(),
        openDeals: sql<number>`count(*) filter (where ${dealsTable.status} not in ('Delivered', 'Cancelled', 'Unwound'))`,
        deliveredDeals: sql<number>`count(*) filter (where ${dealsTable.status} = 'Delivered')`,
        fundedDeals: sql<number>`count(*) filter (where ${dealsTable.status} = 'Funded' or ${dealsTable.status} = 'Delivered')`,
        dealsThisMonth: sql<number>`count(*) filter (where ${dealsTable.createdAt} >= ${monthStart})`,
        deliveredThisMonth: sql<number>`count(*) filter (where ${dealsTable.status} = 'Delivered' and ${dealsTable.deliveredAt} >= ${monthStart})`,
        totalRevenue: sql<string>`coalesce(sum(${dealsTable.salePrice}::numeric), 0)`,
        totalGross: sql<string>`coalesce(sum(${dealsTable.grossProfit}::numeric), 0)`,
        totalBackEnd: sql<string>`coalesce(sum(${dealsTable.backEndProfit}::numeric), 0)`,
        totalCommissionsOwed: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} in ('Pending', 'Approved')), 0)`,
        totalCommissionsPaid: sql<string>`coalesce(sum(${dealsTable.commissionAmount}::numeric) filter (where ${dealsTable.commissionStatus} = 'Paid'), 0)`,
        pendingApprovals: sql<number>`count(*) filter (where ${dealsTable.commissionStatus} = 'Pending')`,
        avgGrossPerDeal: sql<string>`coalesce(avg(${dealsTable.grossProfit}::numeric) filter (where ${dealsTable.grossProfit} is not null), 0)`,
      })
      .from(dealsTable)
      .where(eq(dealsTable.dealershipId, userId));

    const dealsByStatus = await db
      .select({
        status: dealsTable.status,
        count: count(),
        totalValue: sql<string>`coalesce(sum(${dealsTable.salePrice}::numeric), 0)`,
      })
      .from(dealsTable)
      .where(eq(dealsTable.dealershipId, userId))
      .groupBy(dealsTable.status);

    const dealsByType = await db
      .select({
        dealType: dealsTable.dealType,
        count: count(),
        totalValue: sql<string>`coalesce(sum(${dealsTable.salePrice}::numeric), 0)`,
      })
      .from(dealsTable)
      .where(eq(dealsTable.dealershipId, userId))
      .groupBy(dealsTable.dealType);

    res.json({
      store: stats,
      dealsByStatus,
      dealsByType,
      platform: "3C ONYX — DealerFlow OS",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/deals/search/global", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { q } = req.query;
    if (!q || typeof q !== "string" || q.trim().length < 2) {
      res.status(400).json({ error: "Search query must be at least 2 characters" });
      return;
    }

    const query = q.trim().substring(0, 200);
    const pattern = `%${query}%`;

    const deals = await db.select({
      id: dealsTable.id,
      dealNumber: dealsTable.dealNumber,
      customerName: dealsTable.customerName,
      vehicleLabel: dealsTable.vehicleLabel,
      vin: dealsTable.vin,
      status: dealsTable.status,
      salePrice: dealsTable.salePrice,
    }).from(dealsTable)
      .where(and(
        eq(dealsTable.dealershipId, userId),
        sql`(${dealsTable.customerName} ilike ${pattern} or ${dealsTable.vin} ilike ${pattern} or ${dealsTable.dealNumber} ilike ${pattern} or ${dealsTable.vehicleLabel} ilike ${pattern})`
      ))
      .orderBy(desc(dealsTable.createdAt))
      .limit(20);

    const tasks = await db.select({
      id: dealerflowTasksTable.id,
      title: dealerflowTasksTable.title,
      department: dealerflowTasksTable.department,
      status: dealerflowTasksTable.status,
      vin: dealerflowTasksTable.vin,
      dealId: dealerflowTasksTable.dealId,
    }).from(dealerflowTasksTable)
      .where(and(
        eq(dealerflowTasksTable.dealershipId, userId),
        sql`(${dealerflowTasksTable.title} ilike ${pattern} or ${dealerflowTasksTable.vin} ilike ${pattern})`
      ))
      .orderBy(desc(dealerflowTasksTable.createdAt))
      .limit(20);

    res.json({
      query,
      results: {
        deals: deals.map((d) => ({ ...d, type: "deal" })),
        tasks: tasks.map((t) => ({ ...t, type: "task" })),
        totalResults: deals.length + tasks.length,
      },
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

export default router;
