import { Router, type Request, type Response } from "express";
import { db, dealerflowTasksTable, documentScansTable, customerTicketsTable } from "@workspace/db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { smartRoute, extractVinFromText, extractPartNumbers } from "../lib/smart-router";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const VALID_DEPARTMENTS = ["DMV", "Parts", "Service", "Finance", "Logistics", "Sales", "Customer_Service", "General"] as const;
const VALID_STATUSES = ["Open", "In_Progress", "Waiting", "Completed", "Escalated", "Cancelled"] as const;
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

function safeParseInt(val: unknown, fallback: number): number {
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeError(): string {
  return "An internal error occurred. Please try again.";
}

function getUserId(req: Request): number | null {
  return (req as any).userId ?? null;
}

router.get("/dealerflow/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const { department, status, priority, limit: rawLimit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];

    if (department && typeof department === "string" && (VALID_DEPARTMENTS as readonly string[]).includes(department)) {
      conditions.push(eq(dealerflowTasksTable.department, department as typeof VALID_DEPARTMENTS[number]));
    }
    if (status && typeof status === "string" && (VALID_STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(dealerflowTasksTable.status, status as typeof VALID_STATUSES[number]));
    }
    if (priority && typeof priority === "string" && (VALID_PRIORITIES as readonly string[]).includes(priority)) {
      conditions.push(eq(dealerflowTasksTable.priority, priority as typeof VALID_PRIORITIES[number]));
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const tasks = await db
      .select()
      .from(dealerflowTasksTable)
      .where(where)
      .orderBy(desc(dealerflowTasksTable.createdAt))
      .limit(maxRows);

    res.json({ tasks, count: tasks.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, department, priority, vin, intakeType } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const effectivePriority = (VALID_PRIORITIES as readonly string[]).includes(priority) ? priority : "Medium";
    const routing = smartRoute(`${title} ${description || ""}`);
    const effectiveDept = (VALID_DEPARTMENTS as readonly string[]).includes(department) ? department : routing.department;
    const effectiveSla = routing.slaMinutes;
    const now = new Date();
    const slaDue = new Date(now.getTime() + effectiveSla * 60 * 1000);
    const userId = getUserId(req);

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: title.trim().substring(0, 500),
      description: description ? String(description).substring(0, 2000) : null,
      department: effectiveDept as typeof VALID_DEPARTMENTS[number],
      priority: effectivePriority,
      status: "Open",
      intakeType: intakeType || "Manual",
      vin: vin ? String(vin).substring(0, 17) : null,
      dealershipId: userId,
      slaMinutes: effectiveSla,
      slaDueAt: slaDue,
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: { matchedKeywords: routing.matchedKeywords },
    }).returning();

    res.status(201).json({ task, routing });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.patch("/dealerflow/tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = safeParseInt(req.params.id, 0);
    if (id <= 0) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (req.body.status && (VALID_STATUSES as readonly string[]).includes(req.body.status)) {
      updates.status = req.body.status;
    }
    if (req.body.priority && (VALID_PRIORITIES as readonly string[]).includes(req.body.priority)) {
      updates.priority = req.body.priority;
    }

    if (req.body.status === "Completed") {
      updates.resolvedAt = new Date();
    }

    const [task] = await db.update(dealerflowTasksTable)
      .set(updates)
      .where(eq(dealerflowTasksTable.id, id))
      .returning();

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ task });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/intake", requireAuth, async (req: Request, res: Response) => {
  try {
    const { rawText, documentType } = req.body;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      res.status(400).json({ error: "rawText is required" });
      return;
    }

    const safeText = rawText.substring(0, 10000);
    const effectiveDocType = (VALID_DOC_TYPES as readonly string[]).includes(documentType) ? documentType : "Other";
    const userId = getUserId(req);

    const vin = extractVinFromText(safeText);
    const partNumbers = extractPartNumbers(safeText);
    const routing = smartRoute(safeText);

    const [scan] = await db.insert(documentScansTable).values({
      documentType: effectiveDocType,
      status: "Completed",
      rawOcrText: safeText,
      extractedVin: vin,
      extractedPartNumbers: partNumbers.length > 0 ? partNumbers : null,
      extractedData: { routing, rawLength: safeText.length },
      routedToDepartment: routing.department,
      scannedById: userId,
      dealershipId: userId,
      confidence: String(routing.confidence),
    }).returning();

    const customerNameMatch = safeText.match(/(?:customer|name|client)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i);

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: `${routing.department} — ${vin ? `VIN: ${vin}` : "Document Scan"}`,
      description: safeText.substring(0, 500),
      department: routing.department as typeof VALID_DEPARTMENTS[number],
      priority: routing.confidence > 0.5 ? "High" : "Medium",
      status: "Open",
      intakeType: "Scan",
      vin: vin || null,
      dealershipId: userId,
      slaMinutes: routing.slaMinutes,
      slaDueAt: new Date(Date.now() + routing.slaMinutes * 60 * 1000),
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: {
        scanId: scan.id,
        extractedPartNumbers: partNumbers,
        extractedCustomerName: customerNameMatch?.[1] || null,
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
    const { status, category, limit: rawLimit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];

    if (status && typeof status === "string" && (["New", "Open", "In_Progress", "Waiting_Customer", "Resolved", "Closed"] as readonly string[]).includes(status)) {
      conditions.push(eq(customerTicketsTable.status, status as any));
    }
    if (category && typeof category === "string" && (VALID_TICKET_CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(customerTicketsTable.category, category as typeof VALID_TICKET_CATEGORIES[number]));
    }

    const maxRows = Math.min(Math.max(safeParseInt(rawLimit, 50), 1), 200);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const tickets = await db
      .select()
      .from(customerTicketsTable)
      .where(where)
      .orderBy(desc(customerTicketsTable.createdAt))
      .limit(maxRows);

    res.json({ tickets, count: tickets.length });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/tickets", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subject, description, channel, category, customerName, customerPhone, customerEmail, relatedVin } = req.body;

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      res.status(400).json({ error: "Subject is required" });
      return;
    }

    const userId = getUserId(req);
    const routing = smartRoute(`${subject} ${description || ""}`);
    const effectiveChannel = (VALID_CHANNELS as readonly string[]).includes(channel) ? channel : "App";
    const effectiveCategory = (VALID_TICKET_CATEGORIES as readonly string[]).includes(category)
      ? category
      : (DEPT_TO_TICKET_CATEGORY[routing.department] || "General");

    let autoResponse: string;
    if (routing.department === "DMV") {
      autoResponse = "Your DMV request has been received. A clerk is reviewing your documents. You'll receive an update within 24 hours.";
    } else if (routing.department === "Parts") {
      autoResponse = "Your parts inquiry has been logged. Our parts team will check availability and reach out shortly.";
    } else if (routing.department === "Service") {
      autoResponse = "Your service request has been received. A service advisor will contact you within 2 hours to schedule.";
    } else {
      autoResponse = "Thank you for contacting us. A team member will respond shortly.";
    }

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

    res.status(201).json({ ticket, autoResponse });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.patch("/dealerflow/tickets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
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
      .where(eq(customerTicketsTable.id, id))
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

router.get("/dealerflow/dashboard", requireAuth, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [taskStats] = await db
      .select({
        total: count(),
        open: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Open')`,
        inProgress: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'In_Progress')`,
        completed: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed')`,
        escalated: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Escalated')`,
        completedToday: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} = 'Completed' and ${dealerflowTasksTable.resolvedAt} >= ${todayStart})`,
        overdueSla: sql<number>`count(*) filter (where ${dealerflowTasksTable.status} not in ('Completed', 'Cancelled') and ${dealerflowTasksTable.slaDueAt} < ${now})`,
      })
      .from(dealerflowTasksTable);

    const departmentBreakdown = await db
      .select({
        department: dealerflowTasksTable.department,
        count: count(),
      })
      .from(dealerflowTasksTable)
      .where(sql`${dealerflowTasksTable.status} not in ('Completed', 'Cancelled')`)
      .groupBy(dealerflowTasksTable.department);

    const [ticketStats] = await db
      .select({
        total: count(),
        newTickets: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'New')`,
        open: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'Open')`,
        resolved: sql<number>`count(*) filter (where ${customerTicketsTable.status} = 'Resolved')`,
      })
      .from(customerTicketsTable);

    const [scanStats] = await db
      .select({
        total: count(),
        routed: sql<number>`count(*) filter (where ${documentScansTable.status} = 'Routed')`,
      })
      .from(documentScansTable);

    res.json({
      tasks: taskStats,
      tickets: ticketStats,
      scans: scanStats,
      departments: departmentBreakdown,
      generatedAt: now.toISOString(),
      platform: "3C ONYX — DealerFlow OS",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/dealerflow/route", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const safeText = text.substring(0, 5000);
    const routing = smartRoute(safeText);
    const vin = extractVinFromText(safeText);
    const parts = extractPartNumbers(safeText);

    res.json({ routing, extractedVin: vin, extractedPartNumbers: parts });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

export default router;
