import { Router, type Request, type Response } from "express";
import { db, dealerflowTasksTable, documentScansTable, customerTicketsTable, commissionLedgerTable, dealsTable } from "@workspace/db";
import { eq, desc, and, sql, count, asc, lt, ne, gte, lte, inArray } from "drizzle-orm";
import { smartRoute, extractVinFromText, extractPartNumbers, extractCustomerName, extractPhoneNumber, checkSlaBreached, calculateTechFee, suggestNextStep } from "../lib/smart-router";
import { analyzeImage } from "../lib/ai-router";
import { requireAuth } from "../middlewares/requireAuth";

const AUTO_STATUS_MESSAGES: Record<string, string> = {
  DMV: "Your registration and title processing is complete. You'll receive your plates shortly.",
  Parts: "The parts for your vehicle have arrived and been installed.",
  Service: "Your vehicle reconditioning is complete and the car is ready.",
  Finance: "Your finance package has been approved and processed.",
  Sales: "Your vehicle delivery is being finalized — we'll contact you to schedule pickup.",
  Insurance: "Your insurance binder has been confirmed and is on file.",
  Logistics: "Your vehicle transport has been completed.",
  General: "A step in your vehicle process has been completed.",
};

async function autoDispatchCustomerUpdate(taskId: number, dealId: number | null) {
  try {
    if (!dealId) return null;

    const [freshTask] = await db.select().from(dealerflowTasksTable).where(eq(dealerflowTasksTable.id, taskId)).limit(1);
    if (!freshTask) return null;

    const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
    if (!deal || (!deal.customerPhone && !deal.customerEmail)) return null;

    const dept = freshTask.department || "General";
    const message = AUTO_STATUS_MESSAGES[dept] || AUTO_STATUS_MESSAGES.General;

    const notification = {
      type: "auto_dispatch",
      channel: deal.customerPhone ? "SMS" : "Email",
      recipient: deal.customerPhone || deal.customerEmail,
      customerName: deal.customerName,
      dealNumber: deal.dealNumber,
      message,
      department: dept,
      taskTitle: freshTask.title?.replace(/\[.*?\]\s*/, ""),
      dispatchedAt: new Date().toISOString(),
      status: "queued",
    };

    const meta = (freshTask.metadata || {}) as Record<string, any>;
    if (!Array.isArray(meta.notifications)) meta.notifications = [];
    meta.notifications.push(notification);
    meta.lastAutoNotifiedAt = notification.dispatchedAt;

    await db.update(dealerflowTasksTable)
      .set({ metadata: meta })
      .where(eq(dealerflowTasksTable.id, taskId));

    const allDealTasks = await db.select().from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.dealId, dealId));
    const allCompleted = allDealTasks.length > 0 && allDealTasks.every((t) => t.status === "Completed" || t.status === "Cancelled");

    if (allCompleted && deal.status !== "Delivered" && deal.status !== "Funded") {
      await db.update(dealsTable)
        .set({ status: "Funded", updatedAt: new Date() })
        .where(eq(dealsTable.id, dealId));
    }

    return notification;
  } catch {
    return null;
  }
}

const router = Router();

const VALID_DEPARTMENTS = ["DMV", "Parts", "Service", "Finance", "Logistics", "Sales", "Customer_Service", "General"] as const;
const VALID_STATUSES = ["Open", "In_Progress", "Waiting", "Pending_Approval", "Pending_External", "Completed", "Escalated", "Cancelled"] as const;
const VALID_SCOPES = ["Internal", "External"] as const;
const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
const VALID_DOC_TYPES = ["Invoice", "DMV_Form", "Title", "Registration", "Mopar_Sheet", "Parts_Order", "Warranty_Claim", "Insurance_Doc", "Bill_of_Sale", "Other"] as const;
const VALID_CHANNELS = ["SMS", "Email", "Phone", "Walk_In", "App", "WhatsApp"] as const;
const VALID_TICKET_CATEGORIES = ["Registration", "Title", "Parts_Status", "Service_Update", "Delivery", "Warranty", "Billing", "General"] as const;

const DEPT_TO_TICKET_CATEGORY: Record<string, string> = {
  DMV: "Registration",
  Parts: "Parts_Status",
  Service: "Service_Update",
  Finance: "Billing",
  Logistics: "Delivery",
  Sales: "General",
  Customer_Service: "General",
  General: "General",
};

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function safeParseInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeError(): string {
  return "An internal error occurred. Please try again.";
}

function getUserId(req: Request): number | null {
  const sub = (req as any).user?.sub;
  if (!sub) return null;
  const id = parseInt(String(sub), 10);
  return Number.isFinite(id) ? id : null;
}

function requireUserId(req: Request, res: Response): number | null {
  const id = getUserId(req);
  if (!id) {
    res.status(403).json({ error: "User identity required" });
    return null;
  }
  return id;
}

router.get("/dealerflow/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { department, status, priority, scope, limit: rawLimit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [eq(dealerflowTasksTable.dealershipId, userId)];

    if (department && typeof department === "string" && (VALID_DEPARTMENTS as readonly string[]).includes(department)) {
      conditions.push(eq(dealerflowTasksTable.department, department as typeof VALID_DEPARTMENTS[number]));
    }
    if (status && typeof status === "string" && (VALID_STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(dealerflowTasksTable.status, status as typeof VALID_STATUSES[number]));
    }
    if (priority && typeof priority === "string" && (VALID_PRIORITIES as readonly string[]).includes(priority)) {
      conditions.push(eq(dealerflowTasksTable.priority, priority as typeof VALID_PRIORITIES[number]));
    }
    if (scope && typeof scope === "string" && (VALID_SCOPES as readonly string[]).includes(scope)) {
      conditions.push(eq(dealerflowTasksTable.taskScope, scope as typeof VALID_SCOPES[number]));
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);
    const where = and(...conditions);

    const tasks = await db
      .select()
      .from(dealerflowTasksTable)
      .where(where)
      .orderBy(desc(dealerflowTasksTable.createdAt))
      .limit(maxRows);

    const SLA_PAUSED_STATUSES = ["Completed", "Cancelled", "Pending_Approval", "Pending_External"];
    const enriched = tasks.map((t) => {
      if (SLA_PAUSED_STATUSES.includes(t.status)) {
        return { ...t, slaBreached: false, minutesOverdue: 0 };
      }
      const sla = checkSlaBreached(t.slaDueAt);
      return { ...t, slaBreached: sla.breached, minutesOverdue: sla.minutesOverdue };
    });

    res.json({ tasks: enriched, count: enriched.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { title, description, department, priority, vin, intakeType } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const routing = smartRoute(`${title} ${description || ""}`);
    const effectivePriority = (VALID_PRIORITIES as readonly string[]).includes(priority) ? priority : routing.suggestedPriority;
    const effectiveDept = (VALID_DEPARTMENTS as readonly string[]).includes(department) ? department : routing.department;
    const effectiveSla = routing.slaMinutes;
    const now = new Date();
    const slaDue = new Date(now.getTime() + effectiveSla * 60 * 1000);

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: title.trim().substring(0, 500),
      description: description ? String(description).substring(0, 2000) : null,
      department: effectiveDept as typeof VALID_DEPARTMENTS[number],
      priority: effectivePriority,
      status: "Open",
      intakeType: intakeType || "Manual",
      taskScope: routing.taskScope,
      vin: vin ? String(vin).substring(0, 17) : null,
      dealershipId: userId,
      slaMinutes: effectiveSla,
      slaDueAt: slaDue,
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: {
        matchedKeywords: routing.matchedKeywords,
        matchedPhrases: routing.matchedPhrases,
        urgencyScore: routing.urgencyScore,
        bankReady: routing.bankReady,
        bankReadySignals: routing.bankReadySignals,
        taskScope: routing.taskScope,
        externalParty: routing.externalParty,
        externalReason: routing.externalReason,
      },
    }).returning();

    res.status(201).json({ task, routing });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.patch("/dealerflow/tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const [existing] = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (existing.status === "Pending_Approval") {
      res.status(400).json({ error: "Task is pending approval — use the approval endpoint to approve or reject" });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const meta = (existing.metadata || {}) as Record<string, any>;

    if (req.body.status && (VALID_STATUSES as readonly string[]).includes(req.body.status)) {
      updates.status = req.body.status;
    }
    if (req.body.priority && (VALID_PRIORITIES as readonly string[]).includes(req.body.priority)) {
      updates.priority = req.body.priority;
    }
    if (req.body.taskScope && (VALID_SCOPES as readonly string[]).includes(req.body.taskScope)) {
      updates.taskScope = req.body.taskScope;
      if (req.body.taskScope === "External" && !meta.externalParty) {
        meta.externalParty = req.body.externalParty || "Unspecified";
        meta.externalReason = req.body.externalReason || "Manually marked external";
        updates.metadata = meta;
      }
    }
    if (req.body.department && (VALID_DEPARTMENTS as readonly string[]).includes(req.body.department) && req.body.department !== existing.department) {
      if (!meta.originalDepartment) {
        meta.originalDepartment = existing.department;
      }
      if (!Array.isArray(meta.departmentHistory)) {
        meta.departmentHistory = [];
      }
      meta.departmentHistory.push({ from: existing.department, to: req.body.department, at: new Date().toISOString() });
      updates.department = req.body.department;
      updates.metadata = meta;
    }

    const isNewCompletion = req.body.status === "Completed" && existing.status !== "Completed";
    if (isNewCompletion) {
      updates.resolvedAt = new Date();
    }

    const [task] = await db.update(dealerflowTasksTable)
      .set(updates)
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)))
      .returning();

    let techFeeLogged = false;
    let bankVaultEligible = false;
    let customerNotification: any = null;

    if (isNewCompletion && task) {
      const meta = (task.metadata as any) || {};
      bankVaultEligible = meta.bankReady === true;

      if (bankVaultEligible) {
        await db.update(dealerflowTasksTable)
          .set({ metadata: { ...meta, bankVaultStatus: "Ready", bankVaultTimestamp: new Date().toISOString() } })
          .where(eq(dealerflowTasksTable.id, id));
      }

      try {
        const taskValue = task.department === "Finance" ? 500 : task.department === "Sales" ? 300 : 100;
        const fee = calculateTechFee(taskValue);
        await db.insert(commissionLedgerTable).values({
          entryType: "GigCompletion",
          status: "Pending",
          recipientId: userId,
          amountUsd: String(fee),
          note: `DealerFlow tech fee — ${task.department} task #${task.id}: ${task.title?.substring(0, 100)}`,
        });
        techFeeLogged = true;
      } catch {
        techFeeLogged = false;
      }

      customerNotification = await autoDispatchCustomerUpdate(task.id, task.dealId);
    }

    res.json({ task, techFeeLogged, bankVaultEligible, customerNotification });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tasks/:id/request-approval", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) { res.status(400).json({ error: "Invalid task ID" }); return; }

    const { approvalNote, targetDepartment } = req.body;

    const [existing] = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)));

    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    if (existing.status === "Completed" || existing.status === "Cancelled") {
      res.status(400).json({ error: "Cannot request approval on a closed task" }); return;
    }

    const meta = (existing.metadata || {}) as Record<string, any>;
    if (!Array.isArray(meta.approvalHistory)) meta.approvalHistory = [];

    meta.approvalHistory.push({
      action: "requested",
      fromDepartment: existing.department,
      targetDepartment: targetDepartment || null,
      note: approvalNote || null,
      requestedAt: new Date().toISOString(),
    });

    meta.pendingApproval = {
      fromDepartment: existing.department,
      targetDepartment: targetDepartment || null,
      note: approvalNote || null,
      requestedAt: new Date().toISOString(),
    };

    const [task] = await db.update(dealerflowTasksTable)
      .set({ status: "Pending_Approval", metadata: meta, updatedAt: new Date() })
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)))
      .returning();

    res.json({ task, message: "Approval requested — awaiting manager decision" });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tasks/:id/approve", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) { res.status(400).json({ error: "Invalid task ID" }); return; }

    const { decision, decisionNote } = req.body;

    if (!decision || !["Approved", "Rejected"].includes(decision)) {
      res.status(400).json({ error: "decision must be 'Approved' or 'Rejected'" }); return;
    }

    const [existing] = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)));

    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    if (existing.status !== "Pending_Approval") {
      res.status(400).json({ error: "Task is not pending approval" }); return;
    }

    const meta = (existing.metadata || {}) as Record<string, any>;
    if (!Array.isArray(meta.approvalHistory)) meta.approvalHistory = [];

    meta.approvalHistory.push({
      action: decision.toLowerCase(),
      note: decisionNote || null,
      decidedAt: new Date().toISOString(),
    });

    const newStatus = decision === "Approved" ? "In_Progress" : "Cancelled";

    if (meta.pendingApproval) {
      meta.lastApprovalDecision = { ...meta.pendingApproval, decision, decisionNote: decisionNote || null, decidedAt: new Date().toISOString() };
      delete meta.pendingApproval;
    }

    const [task] = await db.update(dealerflowTasksTable)
      .set({ status: newStatus, metadata: meta, updatedAt: new Date() })
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)))
      .returning();

    res.json({ task, decision, message: `Task ${decision.toLowerCase()} — status set to ${newStatus.replace("_", " ")}` });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/approvals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const pendingTasks = await db.select().from(dealerflowTasksTable)
      .where(and(
        eq(dealerflowTasksTable.dealershipId, userId),
        eq(dealerflowTasksTable.status, "Pending_Approval"),
      ))
      .orderBy(asc(dealerflowTasksTable.createdAt))
      .limit(50);

    const enriched = pendingTasks.map((t) => {
      const sla = checkSlaBreached(t.slaDueAt);
      const meta = (t.metadata || {}) as Record<string, any>;
      return {
        ...t,
        slaBreached: sla.breached,
        minutesOverdue: sla.minutesOverdue,
        approvalNote: meta.pendingApproval?.note || null,
        fromDepartment: meta.pendingApproval?.fromDepartment || t.department,
        targetDepartment: meta.pendingApproval?.targetDepartment || null,
        requestedAt: meta.pendingApproval?.requestedAt || null,
      };
    });

    res.json({ approvals: enriched, count: enriched.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/tasks/:id/suggest", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) { res.status(400).json({ error: "Invalid task ID" }); return; }

    const [task] = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.id, id), eq(dealerflowTasksTable.dealershipId, userId)));

    if (!task) { res.status(404).json({ error: "Task not found" }); return; }

    const meta = (task.metadata || {}) as Record<string, any>;
    const suggestions = suggestNextStep(task.department, task.status, meta);

    const needsApproval = (task.department === "Service" || task.department === "Parts") &&
      task.status === "In_Progress" &&
      !meta.lastApprovalDecision;

    res.json({
      taskId: task.id,
      currentDepartment: task.department,
      status: task.status,
      suggestions,
      needsApproval,
      approvalHint: needsApproval ? "Consider requesting manager approval before proceeding" : null,
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/intake", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { rawText, documentType } = req.body;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      res.status(400).json({ error: "rawText is required" });
      return;
    }

    const safeText = rawText.substring(0, 10000);
    const effectiveDocType = (VALID_DOC_TYPES as readonly string[]).includes(documentType) ? documentType : "Other";

    const vin = extractVinFromText(safeText);
    const partNumbers = extractPartNumbers(safeText);
    const customerName = extractCustomerName(safeText);
    const phoneNumber = extractPhoneNumber(safeText);
    const routing = smartRoute(safeText);

    const [scan] = await db.insert(documentScansTable).values({
      documentType: effectiveDocType,
      status: "Completed",
      rawOcrText: safeText,
      extractedVin: vin,
      extractedPartNumbers: partNumbers.length > 0 ? partNumbers : null,
      extractedData: {
        routing,
        rawLength: safeText.length,
        customerName,
        phoneNumber,
        bankReady: routing.bankReady,
        bankReadySignals: routing.bankReadySignals,
      },
      routedToDepartment: routing.department,
      scannedById: userId,
      dealershipId: userId,
      confidence: String(routing.confidence),
    }).returning();

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: `${routing.department} — ${vin ? `VIN: ${vin}` : "Document Scan"}`,
      description: safeText.substring(0, 500),
      department: routing.department as typeof VALID_DEPARTMENTS[number],
      priority: routing.suggestedPriority as typeof VALID_PRIORITIES[number],
      status: "Open",
      intakeType: "Scan",
      taskScope: routing.taskScope,
      vin: vin || null,
      dealershipId: userId,
      slaMinutes: routing.slaMinutes,
      slaDueAt: new Date(Date.now() + routing.slaMinutes * 60 * 1000),
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: {
        scanId: scan.id,
        extractedPartNumbers: partNumbers,
        extractedCustomerName: customerName,
        extractedPhone: phoneNumber,
        urgencyScore: routing.urgencyScore,
        bankReady: routing.bankReady,
        bankReadySignals: routing.bankReadySignals,
        taskScope: routing.taskScope,
        externalParty: routing.externalParty,
        externalReason: routing.externalReason,
      },
    }).returning();

    await db.update(documentScansTable)
      .set({ routedToTaskId: task.id, status: "Routed" })
      .where(eq(documentScansTable.id, scan.id));

    res.status(201).json({ scan, task, routing });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/tickets", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { status, category, limit: rawLimit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [eq(customerTicketsTable.dealershipId, userId)];

    if (status && typeof status === "string" && (["New", "Open", "In_Progress", "Waiting_Customer", "Resolved", "Closed"] as readonly string[]).includes(status)) {
      conditions.push(eq(customerTicketsTable.status, status as any));
    }
    if (category && typeof category === "string" && (VALID_TICKET_CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(customerTicketsTable.category, category as typeof VALID_TICKET_CATEGORIES[number]));
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);

    const tickets = await db
      .select()
      .from(customerTicketsTable)
      .where(and(...conditions))
      .orderBy(desc(customerTicketsTable.createdAt))
      .limit(maxRows);

    res.json({ tickets, count: tickets.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tickets", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { subject, description, channel, category, customerName, customerPhone, customerEmail, relatedVin } = req.body;

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }
    const routing = smartRoute(`${subject} ${description || ""}`);
    const effectiveChannel = (VALID_CHANNELS as readonly string[]).includes(channel) ? channel : "App";
    const effectiveCategory = (VALID_TICKET_CATEGORIES as readonly string[]).includes(category)
      ? category
      : (DEPT_TO_TICKET_CATEGORY[routing.department] || "General");

    const autoResponses: Record<string, string> = {
      DMV: "Your DMV request has been received. A clerk is reviewing your documents. You'll receive an update within 24 hours.",
      Parts: "Your parts inquiry has been logged. Our parts team will check availability and reach out shortly.",
      Service: "Your service request has been received. A service advisor will contact you within 2 hours to schedule.",
      Finance: "Your finance inquiry has been received. Our finance team will review and contact you within 4 hours.",
      Sales: "Thank you for your interest. A sales associate will reach out to you shortly.",
      Logistics: "Your delivery/logistics request has been noted. Our logistics coordinator will provide an update soon.",
      Customer_Service: "We've received your message and a team member will respond within 1 hour.",
    };
    const autoResponse = autoResponses[routing.department] || "Thank you for contacting us. A team member will respond shortly.";

    const [ticket] = await db.insert(customerTicketsTable).values({
      subject: subject.trim().substring(0, 500),
      description: description ? String(description).substring(0, 2000) : null,
      status: "New",
      channel: effectiveChannel,
      category: effectiveCategory as typeof VALID_TICKET_CATEGORIES[number],
      customerName: customerName ? String(customerName).substring(0, 200) : null,
      customerPhone: customerPhone ? String(customerPhone).substring(0, 20) : null,
      customerEmail: customerEmail ? String(customerEmail).substring(0, 320) : null,
      dealershipId: userId,
      relatedVin: relatedVin ? String(relatedVin).substring(0, 17) : null,
      autoResponse,
      lastMessage: (description || subject).substring(0, 1000),
    }).returning();

    res.status(201).json({ ticket, autoResponse, routing });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.patch("/dealerflow/tickets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const VALID_TICKET_STATUSES = ["New", "Open", "In_Progress", "Waiting_Customer", "Resolved", "Closed"] as const;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (req.body.status && (VALID_TICKET_STATUSES as readonly string[]).includes(req.body.status)) {
      updates.status = req.body.status;
    }
    if (req.body.lastMessage && typeof req.body.lastMessage === "string") {
      updates.lastMessage = req.body.lastMessage.substring(0, 1000);
    }
    if (req.body.status === "Resolved" || req.body.status === "Closed") {
      updates.resolvedAt = new Date();
    }

    const [ticket] = await db.update(customerTicketsTable)
      .set(updates)
      .where(and(eq(customerTicketsTable.id, id), eq(customerTicketsTable.dealershipId, userId)))
      .returning();

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json({ ticket });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [taskStats] = await db
      .select({
        total: count(),
        open: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Open')`,
        inProgress: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'In_Progress')`,
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
        escalated: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
        waiting: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Waiting')`,
        completedToday: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed' and ${dealerflowTasksTable.resolvedAt} >= ${todayStart})`,
        completedThisWeek: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed' and ${dealerflowTasksTable.resolvedAt} >= ${weekStart})`,
        overdueSla: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} not in ('Completed', 'Cancelled', 'Pending_Approval', 'Pending_External') and ${dealerflowTasksTable.slaDueAt} < ${now})`,
        critical: sql<number>`count(*) filter (where ${dealerflowTasksTable.priority} = 'Critical' and ${dealerflowTasksTable.status} not in ('Completed', 'Cancelled'))`,
        avgResolutionMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
        pendingApprovals: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Pending_Approval')`,
        pendingExternal: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Pending_External')`,
        externalTotal: sql<number>`count(*) filter (where ${dealerflowTasksTable.taskScope} = 'External')`,
        internalTotal: sql<number>`count(*) filter (where ${dealerflowTasksTable.taskScope} = 'Internal')`,
        externalActive: sql<number>`count(*) filter (where ${dealerflowTasksTable.taskScope} = 'External' and ${dealerflowTasksTable.status} not in ('Completed', 'Cancelled'))`,
      })
      .from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.dealershipId, userId));

    const departmentBreakdown = await db
      .select({
        department: dealerflowTasksTable.department,
        total: count(),
        open: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Open')`,
        inProgress: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'In_Progress')`,
        overdue: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} not in ('Completed', 'Cancelled', 'Pending_Approval', 'Pending_External') and ${dealerflowTasksTable.slaDueAt} < ${now})`,
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
      })
      .from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.dealershipId, userId))
      .groupBy(dealerflowTasksTable.department);

    const [ticketStats] = await db
      .select({
        total: count(),
        newTickets: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'New')`,
        open: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'Open')`,
        inProgress: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'In_Progress')`,
        resolved: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'Resolved')`,
        avgResponseMinutes: sql<number>`coalesce(avg(extract(epoch from (${customerTicketsTable.resolvedAt} - ${customerTicketsTable.createdAt})) / 60) filter (where ${customerTicketsTable.resolvedAt} is not null), 0)`,
      })
      .from(customerTicketsTable)
      .where(eq(customerTicketsTable.dealershipId, userId));

    const [scanStats] = await db
      .select({
        total: count(),
        routed: sql<number>`count(*) filter (where ${documentScansTable.status} = 'Routed')`,
        todayScans: sql<number>`count(*) filter (where ${documentScansTable.createdAt} >= ${todayStart})`,
      })
      .from(documentScansTable)
      .where(eq(documentScansTable.dealershipId, userId));

    const departmentPulses = departmentBreakdown.map((d) => ({
      department: d.department,
      pulse: `${Number(d.open) + Number(d.inProgress)} active, ${d.overdue} overdue`,
      health: Number(d.overdue) > 0 ? "warning" : "healthy",
      active: Number(d.open) + Number(d.inProgress),
      overdue: Number(d.overdue),
    }));

    res.json({
      tasks: taskStats,
      tickets: ticketStats,
      scans: scanStats,
      departments: departmentBreakdown,
      departmentPulses,
      generatedAt: now.toISOString(),
      platform: "3C ONYX — DealerFlow OS",
      architect: "Ronald Antonio Cadet",
      version: "2.0",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/queue", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { department, limit: rawLimit } = req.query;

    if (!department || typeof department !== "string" || !(VALID_DEPARTMENTS as readonly string[]).includes(department)) {
      res.status(400).json({ error: "Valid department is required" });
      return;
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);
    const now = new Date();

    const tasks = await db
      .select()
      .from(dealerflowTasksTable)
      .where(
        and(
          eq(dealerflowTasksTable.dealershipId, userId),
          eq(dealerflowTasksTable.department, department as typeof VALID_DEPARTMENTS[number]),
          sql`${dealerflowTasksTable.status} not in ('Completed', 'Cancelled')`
        )
      )
      .orderBy(
        sql`case ${dealerflowTasksTable.priority} when 'Critical' then 0 when 'High' then 1 when 'Medium' then 2 when 'Low' then 3 end`,
        asc(dealerflowTasksTable.createdAt)
      )
      .limit(maxRows);

    const SLA_PAUSED = ["Completed", "Cancelled", "Pending_Approval", "Pending_External"];
    const enriched = tasks.map((t, i) => {
      const paused = SLA_PAUSED.includes(t.status);
      const sla = paused ? { breached: false, minutesOverdue: 0 } : checkSlaBreached(t.slaDueAt);
      return {
        ...t,
        queuePosition: i + 1,
        slaBreached: sla.breached,
        minutesOverdue: sla.minutesOverdue,
        ageMinutes: Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / 60000),
      };
    });

    res.json({ department, queue: enriched, count: enriched.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/escalate", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const now = new Date();

    const overdueTasks = await db
      .select()
      .from(dealerflowTasksTable)
      .where(
        and(
          eq(dealerflowTasksTable.dealershipId, userId),
          sql`${dealerflowTasksTable.status} not in ('Completed', 'Cancelled', 'Escalated', 'Pending_Approval', 'Pending_External')`,
          lt(dealerflowTasksTable.slaDueAt, now)
        )
      );

    if (overdueTasks.length === 0) {
      res.json({ escalated: 0, message: "No overdue tasks found" });
      return;
    }

    const ids = overdueTasks.map((t) => t.id);
    await db.update(dealerflowTasksTable)
      .set({ status: "Escalated", updatedAt: now })
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), inArray(dealerflowTasksTable.id, ids)));

    const escalatedByDept: Record<string, number> = {};
    for (const t of overdueTasks) {
      escalatedByDept[t.department] = (escalatedByDept[t.department] || 0) + 1;
    }

    res.json({
      escalated: overdueTasks.length,
      byDepartment: escalatedByDept,
      message: `${overdueTasks.length} task(s) escalated for SLA breach`,
      taskIds: ids,
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/bank-vault", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { limit: rawLimit } = req.query;
    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);

    const tasks = await db
      .select()
      .from(dealerflowTasksTable)
      .where(
        and(
          eq(dealerflowTasksTable.dealershipId, userId),
          eq(dealerflowTasksTable.status, "Completed"),
          sql`(${dealerflowTasksTable.metadata}->>'bankReady')::boolean = true`
        )
      )
      .orderBy(desc(dealerflowTasksTable.resolvedAt))
      .limit(maxRows);

    const enriched = tasks.map((t) => {
      const meta = (t.metadata as any) || {};
      return {
        ...t,
        bankVaultStatus: meta.bankVaultStatus || "Ready",
        bankVaultTimestamp: meta.bankVaultTimestamp || t.resolvedAt,
        fundingSignals: meta.bankReadySignals || [],
      };
    });

    res.json({
      vaultItems: enriched,
      count: enriched.length,
      totalFundingReady: enriched.length,
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/performance", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);

    const [weeklyStats] = await db
      .select({
        totalCreated: count(),
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
        escalated: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
        avgResolutionMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
        slaComplianceRate: sql<number>`coalesce(
          (count(*) filter (where ${dealerflowTasksTable.status} = 'Completed' and ${dealerflowTasksTable.resolvedAt} <= ${dealerflowTasksTable.slaDueAt})::numeric /
          nullif(count(*) filter (where ${dealerflowTasksTable.status} = 'Completed'), 0)) * 100
        , 0)`,
      })
      .from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, weekStart)));

    const deptPerformance = await db
      .select({
        department: dealerflowTasksTable.department,
        totalCreated: count(),
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
        avgResolutionMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
        escalated: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
      })
      .from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, weekStart)))
      .groupBy(dealerflowTasksTable.department);

    const [monthlyStats] = await db
      .select({
        totalCreated: count(),
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
        avgResolutionMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
      })
      .from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, monthStart)));

    const [weeklyTickets] = await db
      .select({
        totalCreated: count(),
        resolved: sql<number>`count(*) filter (where ${customerTicketsTable.status} in ('Resolved', 'Closed'))`,
        avgResponseMinutes: sql<number>`coalesce(avg(extract(epoch from (${customerTicketsTable.resolvedAt} - ${customerTicketsTable.createdAt})) / 60) filter (where ${customerTicketsTable.resolvedAt} is not null), 0)`,
      })
      .from(customerTicketsTable)
      .where(and(eq(customerTicketsTable.dealershipId, userId), gte(customerTicketsTable.createdAt, weekStart)));

    const [weeklyScans] = await db
      .select({
        totalScans: count(),
        routed: sql<number>`count(*) filter (where ${documentScansTable.status} = 'Routed')`,
      })
      .from(documentScansTable)
      .where(and(eq(documentScansTable.dealershipId, userId), gte(documentScansTable.createdAt, weekStart)));

    const [techFeeTotal] = await db
      .select({
        totalFees: sql<number>`coalesce(sum(${commissionLedgerTable.amountUsd}::numeric), 0)`,
        pendingFees: sql<number>`coalesce(sum(${commissionLedgerTable.amountUsd}::numeric) filter (where ${commissionLedgerTable.status} = 'Pending'), 0)`,
      })
      .from(commissionLedgerTable)
      .where(and(eq(commissionLedgerTable.recipientId, userId), sql`${commissionLedgerTable.note} like 'DealerFlow tech fee%'`));

    const completedCount = Number(weeklyStats?.completed || 0);
    const totalCreated = Number(weeklyStats?.totalCreated || 0);
    const avgRes = Math.round(Number(weeklyStats?.avgResolutionMinutes || 0));
    const hoursPerTask = 0.5;
    const hoursSaved = Math.round(completedCount * hoursPerTask * 10) / 10;
    const efficiency = totalCreated > 0 ? Math.round((completedCount / totalCreated) * 100) : 0;

    res.json({
      period: "Last 7 Days",
      periodStart: weekStart.toISOString(),
      periodEnd: now.toISOString(),
      weekly: {
        ...weeklyStats,
        avgResolutionFormatted: `${Math.floor(avgRes / 60)}h ${avgRes % 60}m`,
      },
      monthly: monthlyStats,
      departmentPerformance: deptPerformance.map((d) => ({
        ...d,
        avgResolutionFormatted: `${Math.floor(Number(d.avgResolutionMinutes) / 60)}h ${Math.round(Number(d.avgResolutionMinutes) % 60)}m`,
        completionRate: Number(d.totalCreated) > 0 ? Math.round((Number(d.completed) / Number(d.totalCreated)) * 100) : 0,
      })),
      tickets: weeklyTickets,
      scans: weeklyScans,
      techFees: techFeeTotal,
      impact: {
        hoursSaved,
        efficiency,
        paperworkEliminated: Number(weeklyScans?.routed || 0),
        customerResponseImprovement: `${Math.round(Number(weeklyTickets?.avgResponseMinutes || 0))}min avg`,
      },
      platform: "3C ONYX — DealerFlow OS",
      architect: "Ronald Antonio Cadet",
      generatedAt: now.toISOString(),
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/intake/vision", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { imageBase64, documentType } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }

    if (imageBase64.length > 15_000_000) {
      res.status(400).json({ error: "Image too large (max 10MB)" });
      return;
    }

    const effectiveDocType = (VALID_DOC_TYPES as readonly string[]).includes(documentType) ? documentType : "Other";

    const ocrPrompt = `Extract ALL text content from this document image. This is an automotive dealership document (type: ${effectiveDocType}).
Extract exactly:
- All visible text, numbers, dates, dollar amounts
- VINs (17-character vehicle identification numbers)
- Customer names, phone numbers, addresses
- Part numbers, invoice numbers, deal numbers
- Any financial figures, bank names, funding references
Return the raw extracted text only — no commentary or formatting.`;

    const visionResult = await analyzeImage(imageBase64, ocrPrompt);
    const extractedText = visionResult.content || "";

    if (!extractedText || extractedText.length < 5) {
      res.status(422).json({ error: "Could not extract readable text from image" });
      return;
    }

    const safeText = extractedText.substring(0, 10000);
    const vin = extractVinFromText(safeText);
    const partNumbers = extractPartNumbers(safeText);
    const customerName = extractCustomerName(safeText);
    const phoneNumber = extractPhoneNumber(safeText);
    const routing = smartRoute(safeText);

    const [scan] = await db.insert(documentScansTable).values({
      documentType: effectiveDocType,
      status: "Completed",
      rawOcrText: safeText,
      extractedVin: vin,
      extractedPartNumbers: partNumbers.length > 0 ? partNumbers : null,
      extractedData: {
        routing,
        rawLength: safeText.length,
        customerName,
        phoneNumber,
        bankReady: routing.bankReady,
        bankReadySignals: routing.bankReadySignals,
        ocrSource: "ai-vision",
        originalImageSize: imageBase64.length,
      },
      routedToDepartment: routing.department,
      scannedById: userId,
      dealershipId: userId,
      confidence: String(routing.confidence),
    }).returning();

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: `${routing.department} — ${vin ? `VIN: ${vin}` : `${effectiveDocType.replace("_", " ")} Scan`}`,
      description: safeText.substring(0, 500),
      department: routing.department as typeof VALID_DEPARTMENTS[number],
      priority: routing.suggestedPriority as typeof VALID_PRIORITIES[number],
      status: "Open",
      intakeType: "Vision_Scan",
      taskScope: routing.taskScope,
      vin: vin || null,
      dealershipId: userId,
      slaMinutes: routing.slaMinutes,
      slaDueAt: new Date(Date.now() + routing.slaMinutes * 60 * 1000),
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: {
        scanId: scan.id,
        extractedPartNumbers: partNumbers,
        extractedCustomerName: customerName,
        extractedPhone: phoneNumber,
        urgencyScore: routing.urgencyScore,
        bankReady: routing.bankReady,
        bankReadySignals: routing.bankReadySignals,
        ocrSource: "ai-vision",
        taskScope: routing.taskScope,
        externalParty: routing.externalParty,
        externalReason: routing.externalReason,
      },
    }).returning();

    await db.update(documentScansTable)
      .set({ routedToTaskId: task.id, status: "Routed" })
      .where(and(eq(documentScansTable.id, scan.id), eq(documentScansTable.dealershipId, userId)));

    res.status(201).json({ scan, task, routing, ocrText: safeText });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tasks/:id/notify", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const taskId = safeParseInt(req.params.id, 0);
    if (taskId <= 0) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const { message, channel } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const notifyChannel = (VALID_CHANNELS as readonly string[]).includes(channel) ? channel : "App";

    const [task] = await db.select().from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.id, taskId), eq(dealerflowTasksTable.dealershipId, userId)));

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const meta = (task.metadata || {}) as Record<string, any>;
    const notifications = Array.isArray(meta.notifications) ? meta.notifications : [];
    const safeMessage = message.substring(0, 500);

    notifications.push({
      message: safeMessage,
      channel: notifyChannel,
      sentAt: new Date().toISOString(),
      sentBy: userId,
    });

    await db.update(dealerflowTasksTable)
      .set({
        metadata: { ...meta, notifications, lastNotifiedAt: new Date().toISOString() },
        updatedAt: new Date(),
      })
      .where(and(eq(dealerflowTasksTable.id, taskId), eq(dealerflowTasksTable.dealershipId, userId)));

    const customerName = meta.extractedCustomerName || "Customer";
    const phone = meta.extractedPhone || null;

    res.json({
      notified: true,
      channel: notifyChannel,
      customer: customerName,
      phone,
      message: safeMessage,
      totalNotifications: notifications.length,
      note: notifyChannel === "SMS" ? "SMS delivery requires Twilio integration" : "Notification logged to task",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/referrals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const crossDeptTasks = await db.select({
      fromDepartment: sql<string>`${dealerflowTasksTable.metadata}->>'originalDepartment'`,
      toDepartment: dealerflowTasksTable.department,
      taskCount: count(),
    }).from(dealerflowTasksTable)
      .where(and(
        eq(dealerflowTasksTable.dealershipId, userId),
        gte(dealerflowTasksTable.createdAt, weekStart),
        sql`${dealerflowTasksTable.metadata}->>'originalDepartment' is not null`,
        sql`${dealerflowTasksTable.metadata}->>'originalDepartment' != ${dealerflowTasksTable.department}`,
      ))
      .groupBy(sql`${dealerflowTasksTable.metadata}->>'originalDepartment'`, dealerflowTasksTable.department);

    const [techFeeStats] = await db.select({
      totalFees: sql<number>`coalesce(sum(${commissionLedgerTable.amountUsd}::numeric), 0)`,
      entryCount: count(),
    }).from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        sql`${commissionLedgerTable.note} like 'DealerFlow tech fee%'`,
        gte(commissionLedgerTable.createdAt, weekStart),
      ));

    const completedTasks = await db.select({
      completedCount: count(),
      rerouted: sql<number>`count(*) filter (where ${dealerflowTasksTable.metadata}->>'originalDepartment' is not null)`,
    }).from(dealerflowTasksTable)
      .where(and(
        eq(dealerflowTasksTable.dealershipId, userId),
        eq(dealerflowTasksTable.status, "Completed"),
        gte(dealerflowTasksTable.createdAt, weekStart),
      ));

    const globalTechFeeRate = 0.03;

    res.json({
      period: "Last 7 Days",
      crossDepartmentReferrals: crossDeptTasks,
      techFees: {
        weeklyTotal: Number(techFeeStats?.totalFees || 0),
        weeklyEntries: Number(techFeeStats?.entryCount || 0),
        globalRate: `${globalTechFeeRate * 100}%`,
      },
      completedTasks: {
        completedCount: Number(completedTasks[0]?.completedCount || 0),
        rerouted: Number(completedTasks[0]?.rerouted || 0),
      },
      platform: "3C ONYX — Bird-Dog Monetization Ledger",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/dealerflow/velocity", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const [velocityStats] = await db.select({
      totalTasks: count(),
      completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
      avgResMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
      fastestResMinutes: sql<number>`coalesce(min(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
      slowestResMinutes: sql<number>`coalesce(max(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
      slaHitRate: sql<number>`coalesce(
        (count(*) filter (where ${dealerflowTasksTable.status} = 'Completed' and ${dealerflowTasksTable.resolvedAt} <= ${dealerflowTasksTable.slaDueAt})::numeric /
        nullif(count(*) filter (where ${dealerflowTasksTable.status} = 'Completed'), 0)) * 100
      , 0)`,
      escalated: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
      openBacklog: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} in ('Open', 'In_Progress', 'Waiting'))`,
    }).from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, weekStart)));

    const bottlenecks = await db.select({
      department: dealerflowTasksTable.department,
      openTasks: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} in ('Open', 'In_Progress', 'Waiting'))`,
      escalatedTasks: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
      avgResMinutes: sql<number>`coalesce(avg(extract(epoch from (${dealerflowTasksTable.resolvedAt} - ${dealerflowTasksTable.createdAt})) / 60) filter (where ${dealerflowTasksTable.resolvedAt} is not null), 0)`,
      slaBreaches: sql<number>`count(*) filter (where ${dealerflowTasksTable.resolvedAt} > ${dealerflowTasksTable.slaDueAt})`,
    }).from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, weekStart)))
      .groupBy(dealerflowTasksTable.department)
      .orderBy(sql`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated') desc`);

    const dailyThroughput = await db.select({
      day: sql<string>`to_char(${dealerflowTasksTable.createdAt}, 'YYYY-MM-DD')`,
      created: count(),
      completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
    }).from(dealerflowTasksTable)
      .where(and(eq(dealerflowTasksTable.dealershipId, userId), gte(dealerflowTasksTable.createdAt, weekStart)))
      .groupBy(sql`to_char(${dealerflowTasksTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${dealerflowTasksTable.createdAt}, 'YYYY-MM-DD')`);

    const avgRes = Math.round(Number(velocityStats?.avgResMinutes || 0));
    const fastest = Math.round(Number(velocityStats?.fastestResMinutes || 0));
    const slowest = Math.round(Number(velocityStats?.slowestResMinutes || 0));
    const formatTime = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

    res.json({
      dealershipVelocity: {
        avgTimeToResolution: formatTime(avgRes),
        avgTimeToResolutionMinutes: avgRes,
        fastestResolution: formatTime(fastest),
        slowestResolution: formatTime(slowest),
        totalCompleted: Number(velocityStats?.completed || 0),
        totalTasks: Number(velocityStats?.totalTasks || 0),
        slaComplianceRate: Math.round(Number(velocityStats?.slaHitRate || 0)),
        escalationRate: Number(velocityStats?.totalTasks || 0) > 0
          ? Math.round((Number(velocityStats?.escalated || 0) / Number(velocityStats?.totalTasks || 0)) * 100)
          : 0,
        openBacklog: Number(velocityStats?.openBacklog || 0),
      },
      bottlenecks: bottlenecks.map((b) => ({
        department: b.department,
        openTasks: Number(b.openTasks),
        escalatedTasks: Number(b.escalatedTasks),
        avgResolutionMinutes: Math.round(Number(b.avgResMinutes)),
        avgResolutionFormatted: formatTime(Math.round(Number(b.avgResMinutes))),
        slaBreaches: Number(b.slaBreaches),
        severity: Number(b.escalatedTasks) > 3 ? "Critical" : Number(b.openTasks) > 5 ? "High" : "Normal",
      })),
      dailyThroughput,
      period: "Last 7 Days",
      platform: "3C ONYX — DealerFlow OS GM View",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/route", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const safeText = text.substring(0, 5000);
    const routing = smartRoute(safeText);
    const vin = extractVinFromText(safeText);
    const parts = extractPartNumbers(safeText);
    const customerName = extractCustomerName(safeText);
    const phone = extractPhoneNumber(safeText);

    res.json({ routing, extractedVin: vin, extractedPartNumbers: parts, extractedCustomerName: customerName, extractedPhone: phone });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

export default router;
