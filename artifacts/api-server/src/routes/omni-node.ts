import { Router, type Request, type Response } from "express";
import { db, dealerflowTasksTable, dealerflowAuditLogTable } from "@workspace/db";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { smartRoute, extractVinFromText, extractCustomerName, extractPhoneNumber } from "../lib/smart-router";
import { optionalAuth } from "../middlewares/requireAuth";
import { randomBytes } from "crypto";

const router = Router();

const VALID_INITIATOR_TIERS = ["Lot_Attendant", "Detailer", "Customer", "External_Vendor", "Anonymous"] as const;

function generateTrackingCode(): string {
  const prefix = "3CX";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(8).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

async function detectDuplicate(title: string, description: string | null, dealershipId: number | null): Promise<{ isDuplicate: boolean; existingTaskId: number | null; similarity: number }> {
  if (!dealershipId) return { isDuplicate: false, existingTaskId: null, similarity: 0 };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTasks = await db.select({ id: dealerflowTasksTable.id, title: dealerflowTasksTable.title, description: dealerflowTasksTable.description })
    .from(dealerflowTasksTable)
    .where(and(
      eq(dealerflowTasksTable.dealershipId, dealershipId),
      gte(dealerflowTasksTable.createdAt, oneHourAgo),
      sql`${dealerflowTasksTable.status} NOT IN ('Completed', 'Cancelled')`
    ))
    .limit(50);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const inputNorm = normalize(title + " " + (description || ""));
  const inputWords = new Set(inputNorm.split(/\s+/).filter(w => w.length > 2));

  for (const t of recentTasks) {
    const existingNorm = normalize(t.title + " " + (t.description || ""));
    const existingWords = new Set(existingNorm.split(/\s+/).filter(w => w.length > 2));
    const intersection = new Set([...inputWords].filter(w => existingWords.has(w)));
    const union = new Set([...inputWords, ...existingWords]);
    const jaccard = union.size > 0 ? intersection.size / union.size : 0;

    if (jaccard > 0.7) {
      return { isDuplicate: true, existingTaskId: t.id, similarity: Math.round(jaccard * 100) };
    }
  }
  return { isDuplicate: false, existingTaskId: null, similarity: 0 };
}

function assessReliability(initiatorTier: string, hasPhoto: boolean, descriptionLength: number): number {
  let score = 0.5;
  if (initiatorTier === "Lot_Attendant" || initiatorTier === "Detailer") score += 0.2;
  if (initiatorTier === "Customer") score += 0.15;
  if (initiatorTier === "External_Vendor") score += 0.1;
  if (initiatorTier === "Anonymous") score -= 0.1;
  if (hasPhoto) score += 0.15;
  if (descriptionLength > 50) score += 0.1;
  if (descriptionLength > 150) score += 0.05;
  return Math.min(Math.max(score, 0.1), 1.0);
}

router.post("/omni-node/submit", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, initiatorName, initiatorTier, vin, dealershipCode, photoUrl, location, department: reqDepartment, urgency, contactName, contactPhone, contactEmail } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      res.status(400).json({ error: "Title is required (min 3 characters)" });
      return;
    }

    const tier = (VALID_INITIATOR_TIERS as readonly string[]).includes(initiatorTier) ? initiatorTier : "Anonymous";
    const hasAuth = !!req.user;
    const effectiveTier = hasAuth ? "Authenticated" : tier;

    const combinedText = `${title} ${description || ""}`;
    const routing = smartRoute(combinedText);
    const extractedVin = vin || extractVinFromText(combinedText);
    const extractedName = contactName || initiatorName || extractCustomerName(combinedText) || (hasAuth ? req.user!.name : "Anonymous Initiator");
    const extractedPhone = contactPhone || extractPhoneNumber(combinedText);

    const reliability = assessReliability(effectiveTier, !!photoUrl, (description || "").length);

    const dealershipId = hasAuth ? parseInt(req.user!.sub, 10) : null;

    const dupCheck = await detectDuplicate(title, description || null, dealershipId);
    if (dupCheck.isDuplicate) {
      const trackingCode = generateTrackingCode();
      res.status(200).json({
        status: "duplicate_detected",
        message: "A similar issue was already reported. Your report has been linked to the existing task.",
        existingTaskId: dupCheck.existingTaskId,
        similarity: dupCheck.similarity,
        trackingCode,
        protocol: "3C ONYX — Crowdsourced Intelligence Dedup",
      });
      return;
    }

    const trackingCode = generateTrackingCode();
    const now = new Date();
    const slaDue = new Date(now.getTime() + routing.slaMinutes * 60 * 1000);

    const [task] = await db.insert(dealerflowTasksTable).values({
      title: `[Omni-Node] ${title.trim().substring(0, 500)}`,
      description: description ? String(description).substring(0, 2000) : null,
      department: (reqDepartment || routing.department) as any,
      priority: (urgency || routing.suggestedPriority) as any,
      status: "Open",
      intakeType: "Omni_Node",
      taskScope: routing.taskScope as any,
      vin: extractedVin || null,
      dealershipId,
      initiatorId: hasAuth ? parseInt(req.user!.sub, 10) : null,
      initiatorName: extractedName.substring(0, 200),
      initiatorTier: effectiveTier as any,
      ownerId: null,
      authorizerId: null,
      trackingCode,
      slaMinutes: routing.slaMinutes,
      slaDueAt: slaDue,
      routedByAgent: routing.agent,
      routingConfidence: String(routing.confidence),
      metadata: {
        omniNode: true,
        initiatorTier: effectiveTier,
        reliability,
        photoUrl: photoUrl || null,
        location: location || null,
        phone: extractedPhone || null,
        contactEmail: contactEmail || null,
        submittedAt: now.toISOString(),
        taskScope: routing.taskScope,
        externalParty: routing.externalParty,
        externalReason: routing.externalReason,
        architect: "Ronald Antonio Cadet",
      },
    }).returning();

    await db.insert(dealerflowAuditLogTable).values({
      taskId: task.id,
      userId: hasAuth ? parseInt(req.user!.sub, 10) : null,
      userName: extractedName,
      userRole: hasAuth ? req.user!.role : effectiveTier,
      actionType: "OMNI_NODE_CREATED",
      previousStatus: null,
      newStatus: "Open",
      details: { initiatorTier: effectiveTier, reliability, routing: { department: routing.department, agent: routing.agent, confidence: routing.confidence } },
      ipAddress: (req.ip || req.headers["x-forwarded-for"] || "unknown") as string,
    });

    res.status(201).json({
      trackingCode,
      message: "Your report has been received and is being processed by the 3C ONYX AI Core.",
      department: routing.department,
      estimatedSla: `${routing.slaMinutes} minutes`,
      reliability: Math.round(reliability * 100),
      status: "Submitted",
      protocol: "3C ONYX — Zero-Trust Delegation: Open Initiation",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: "Submission failed. Please try again." });
  }
});

router.get("/omni-node/track/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    if (!code || typeof code !== "string" || code.length < 5) {
      res.status(400).json({ error: "Invalid tracking code" });
      return;
    }

    const [task] = await db.select({
      id: dealerflowTasksTable.id,
      status: dealerflowTasksTable.status,
      department: dealerflowTasksTable.department,
      priority: dealerflowTasksTable.priority,
      createdAt: dealerflowTasksTable.createdAt,
      updatedAt: dealerflowTasksTable.updatedAt,
      resolvedAt: dealerflowTasksTable.resolvedAt,
      trackingCode: dealerflowTasksTable.trackingCode,
    }).from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.trackingCode, code));

    if (!task) {
      res.status(404).json({ error: "Task not found. Check your tracking code." });
      return;
    }

    const statusMessages: Record<string, string> = {
      Open: "Your report has been received and queued for processing.",
      In_Progress: "A team member is currently working on your report.",
      Waiting: "Your report is on hold pending additional information.",
      Pending_Approval: "Your report is awaiting manager approval.",
      Pending_External: "Your report is waiting on an external party.",
      Completed: "Your report has been resolved. Thank you for contributing!",
      Escalated: "Your report has been escalated to a senior team member.",
      Cancelled: "Your report has been closed.",
      Blocked: "Your report is waiting on a prerequisite task to complete.",
    };

    const auditLog = await db.select({
      actionType: dealerflowAuditLogTable.actionType,
      newStatus: dealerflowAuditLogTable.newStatus,
      createdAt: dealerflowAuditLogTable.createdAt,
    }).from(dealerflowAuditLogTable)
      .where(eq(dealerflowAuditLogTable.taskId, task.id))
      .orderBy(desc(dealerflowAuditLogTable.createdAt))
      .limit(10);

    res.json({
      trackingCode: task.trackingCode,
      status: task.status,
      statusMessage: statusMessages[task.status] || "Processing...",
      department: task.department,
      priority: task.priority,
      submittedAt: task.createdAt,
      lastUpdated: task.updatedAt,
      resolvedAt: task.resolvedAt,
      timeline: auditLog.map((a) => ({
        action: a.actionType,
        status: a.newStatus,
        timestamp: a.createdAt,
      })),
      protocol: "3C ONYX — Zero-Trust Status Tracker",
    });
  } catch {
    res.status(500).json({ error: "Tracking lookup failed" });
  }
});

router.get("/omni-node/my-submissions", optionalAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required to view submissions" });
      return;
    }

    const userId = parseInt(req.user.sub, 10);
    const tasks = await db.select({
      id: dealerflowTasksTable.id,
      title: dealerflowTasksTable.title,
      status: dealerflowTasksTable.status,
      department: dealerflowTasksTable.department,
      trackingCode: dealerflowTasksTable.trackingCode,
      createdAt: dealerflowTasksTable.createdAt,
      updatedAt: dealerflowTasksTable.updatedAt,
    }).from(dealerflowTasksTable)
      .where(eq(dealerflowTasksTable.initiatorId, userId))
      .orderBy(desc(dealerflowTasksTable.createdAt))
      .limit(50);

    res.json({ submissions: tasks, count: tasks.length });
  } catch {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

export default router;
