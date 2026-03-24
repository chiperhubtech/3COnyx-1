// @ts-nocheck
/**
 * 3C Onyx — Human-in-the-Loop Escalation System
 *
 * The platform auto-escalates complex, high-value, or low-confidence
 * requests for human supervisor review before execution.
 *
 * ESCALATION TRIGGERS (from spec):
 *   1. Complex cases (multi-agent, cross-domain)
 *   2. High-value transactions ($10,000+)
 *   3. Low confidence decisions (<70%)
 *
 * POST /api/escalation/create      — Create a new escalation case
 * GET  /api/escalation/queue       — Active escalation queue (Supervisor view)
 * GET  /api/escalation/:id         — Get single case detail
 * PATCH /api/escalation/:id/resolve — Approve / reject / override
 * GET  /api/escalation/stats       — Escalation metrics
 */
import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import { logger } from "../lib/logger";
import * as wsHub from "../lib/wsHub";

const router = Router();

interface EscalationCase {
  id: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "OVERRIDDEN";
  trigger: "HIGH_VALUE" | "LOW_CONFIDENCE" | "COMPLEX" | "MANUAL";
  requestSummary: string;
  confidence?: number;
  estimatedValue?: number;
  agentChain?: string[];
  userId?: number;
  sessionId?: string;
  supervisorId?: string;
  supervisorNote?: string;
  resolvedAt?: string;
  originalToolCall?: string;
  recommendation?: string;
}

const ESCALATION_STORE: Map<string, EscalationCase> = new Map();

function generateEscId(): string {
  return `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function determineTrigger(params: {
  confidence?: number;
  estimatedValue?: number;
  agentChain?: string[];
  manualFlag?: boolean;
}): EscalationCase["trigger"] | null {
  if (params.manualFlag) return "MANUAL";
  if ((params.estimatedValue ?? 0) >= 10_000) return "HIGH_VALUE";
  if ((params.confidence ?? 1) < 0.70) return "LOW_CONFIDENCE";
  if ((params.agentChain?.length ?? 0) >= 4) return "COMPLEX";
  return null;
}

// ─── POST /api/escalation/create ─────────────────────────────────────────────
router.post("/escalation/create", async (req: Request, res: Response) => {
  const {
    requestSummary, confidence, estimatedValue, agentChain,
    userId, sessionId, originalToolCall, recommendation, manualFlag,
  } = req.body as {
    requestSummary?: string; confidence?: number; estimatedValue?: number;
    agentChain?: string[]; userId?: number; sessionId?: string;
    originalToolCall?: string; recommendation?: string; manualFlag?: boolean;
  };

  if (!requestSummary) {
    res.status(400).json({ error: "requestSummary is required", code: "VALIDATION" });
    return;
  }

  const trigger = determineTrigger({ confidence, estimatedValue, agentChain, manualFlag });

  const esc: EscalationCase = {
    id:              generateEscId(),
    createdAt:       new Date().toISOString(),
    status:          "PENDING",
    trigger:         trigger ?? "MANUAL",
    requestSummary,
    confidence,
    estimatedValue,
    agentChain,
    userId,
    sessionId,
    originalToolCall,
    recommendation,
  };

  ESCALATION_STORE.set(esc.id, esc);

  await writeAudit("ADMIN", "WARN", `Escalation created: ${esc.id} — ${esc.trigger}`, {
    id: esc.id, trigger: esc.trigger, estimatedValue, confidence,
  });

  // Push real-time alert to supervisor room
  wsHub.broadcast("admin", {
    type: "ESCALATION_CREATED",
    escalation: esc,
    ts: new Date().toISOString(),
  });

  logger.warn({ escalationId: esc.id, trigger: esc.trigger }, "Escalation created — awaiting human review");

  res.status(201).json({
    escalationId: esc.id,
    trigger:      esc.trigger,
    status:       esc.status,
    message:      "Case escalated for supervisor review. Execution is paused.",
  });
});

// ─── GET /api/escalation/queue ────────────────────────────────────────────────
router.get("/escalation/queue", async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "PENDING";
  const cases = Array.from(ESCALATION_STORE.values())
    .filter((e) => status === "ALL" ? true : e.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    queue:   cases,
    total:   cases.length,
    pending: Array.from(ESCALATION_STORE.values()).filter((e) => e.status === "PENDING").length,
    ts:      new Date().toISOString(),
  });
});

// ─── GET /api/escalation/stats ────────────────────────────────────────────────
router.get("/escalation/stats", async (_req: Request, res: Response) => {
  const all   = Array.from(ESCALATION_STORE.values());
  const byStatus: Record<string, number> = {};
  const byTrigger: Record<string, number> = {};
  all.forEach((e) => {
    byStatus[e.status]   = (byStatus[e.status]   ?? 0) + 1;
    byTrigger[e.trigger] = (byTrigger[e.trigger] ?? 0) + 1;
  });
  const avgConfidence = all.filter((e) => e.confidence !== undefined)
    .reduce((acc, e) => acc + (e.confidence ?? 0), 0) / Math.max(all.filter((e) => e.confidence !== undefined).length, 1);

  res.json({
    total: all.length,
    byStatus,
    byTrigger,
    avgConfidence: Math.round(avgConfidence * 100),
    ts: new Date().toISOString(),
  });
});

// ─── GET /api/escalation/:id ──────────────────────────────────────────────────
router.get("/escalation/:id", async (req: Request, res: Response) => {
  const esc = ESCALATION_STORE.get(req.params.id);
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  res.json({ escalation: esc });
});

// ─── PATCH /api/escalation/:id/resolve ───────────────────────────────────────
router.patch("/escalation/:id/resolve", async (req: Request, res: Response) => {
  const { action, supervisorNote, supervisorId } = req.body as {
    action?: "APPROVED" | "REJECTED" | "OVERRIDDEN";
    supervisorNote?: string;
    supervisorId?: string;
  };

  const esc = ESCALATION_STORE.get(req.params.id);
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  if (esc.status !== "PENDING") {
    res.status(409).json({ error: `Already resolved as ${esc.status}` }); return;
  }
  if (!action || !["APPROVED", "REJECTED", "OVERRIDDEN"].includes(action)) {
    res.status(400).json({ error: "action must be APPROVED | REJECTED | OVERRIDDEN" }); return;
  }

  esc.status        = action;
  esc.supervisorId  = supervisorId;
  esc.supervisorNote = supervisorNote;
  esc.resolvedAt    = new Date().toISOString();
  ESCALATION_STORE.set(esc.id, esc);

  await writeAudit("ADMIN", action === "APPROVED" ? "INFO" : "WARN",
    `Escalation ${esc.id} resolved: ${action} by ${supervisorId ?? "admin"}`,
    { id: esc.id, action, supervisorNote });

  wsHub.broadcast("admin", {
    type: "ESCALATION_RESOLVED",
    escalation: esc,
    ts: new Date().toISOString(),
  });

  res.json({
    escalation: esc,
    message:    `Escalation ${action.toLowerCase()}. ${action === "APPROVED" ? "Execution may proceed." : action === "REJECTED" ? "Request blocked." : "Manual override recorded."}`,
  });
});

export { determineTrigger, ESCALATION_STORE };
export default router;
