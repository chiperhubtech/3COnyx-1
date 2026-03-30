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

  // ── Human-in-the-loop takeover protocol ───────────────────────────────────
  // Phase: reading → briefed → live
  // Mirrors the Namecheap specialist handoff pattern:
  //   1. Specialist joins → auto-message sent to member ("reading your conversation")
  //   2. Specialist confirms context read → member notified ("specialist is ready")
  //   3. Specialist types directly → member receives in real-time
  humanAgent?: {
    agentId:    string;
    agentName:  string;
    joinedAt:   string;
    phase:      "reading" | "briefed" | "live";
    briefedAt?: string;
    liveAt?:    string;
    messages:   HumanAgentMessage[];
  };
}

interface HumanAgentMessage {
  id:        string;
  from:      "agent" | "member";
  content:   string;
  ts:        string;
  agentName?: string;
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

  await writeAudit({ eventType: "ADMIN", action: `Escalation created: ${esc.id} — ${esc.trigger}`, severity: "WARN", metadata: {
    id: esc.id, trigger: esc.trigger, estimatedValue, confidence,
  } });

  // Push real-time alert to supervisor room
  wsHub.broadcast("alerts", {
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
  const esc = ESCALATION_STORE.get((req.params["id"] as string));
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

  const esc = ESCALATION_STORE.get((req.params["id"] as string));
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

  await writeAudit({ eventType: "ADMIN", severity: action === "APPROVED" ? "INFO" : "WARN",
    action: `Escalation ${esc.id} resolved: ${action} by ${supervisorId ?? "admin"}`,
    metadata: { id: esc.id, action, supervisorNote } });

  wsHub.broadcast("alerts", {
    type: "ESCALATION_RESOLVED",
    escalation: esc,
    ts: new Date().toISOString(),
  });

  res.json({
    escalation: esc,
    message:    `Escalation ${action.toLowerCase()}. ${action === "APPROVED" ? "Execution may proceed." : action === "REJECTED" ? "Request blocked." : "Manual override recorded."}`,
  });
});

// ─── POST /api/escalation/:id/takeover ──────────────────────────────────────
// Phase 1: Human specialist joins the case.
// Auto-broadcasts a "reading your conversation" message to the member
// — exactly like the Namecheap specialist protocol Ron showed.
router.post("/escalation/:id/takeover", async (req: Request, res: Response) => {
  const esc = ESCALATION_STORE.get(String(req.params["id"] ?? ""));
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  if (esc.humanAgent) { res.status(409).json({ error: "A specialist has already joined this case" }); return; }

  const { agentId, agentName } = req.body as { agentId?: string; agentName?: string };
  if (!agentId || !agentName) {
    res.status(400).json({ error: "agentId and agentName are required" }); return;
  }

  const joinedAt = new Date().toISOString();
  const readingMessage: HumanAgentMessage = {
    id:        `msg-${Date.now()}`,
    from:      "agent",
    content:   `Hello! I'm ${agentName} and I'll be assisting you. Please allow me a moment to review your conversation — I want to make sure I have full context before we continue.`,
    ts:        joinedAt,
    agentName,
  };

  esc.humanAgent = {
    agentId,
    agentName,
    joinedAt,
    phase:    "reading",
    messages: [readingMessage],
  };
  ESCALATION_STORE.set(esc.id, esc);

  await writeAudit({
    eventType: "ADMIN", severity: "INFO",
    action: `Human specialist ${agentName} joined escalation ${esc.id}`,
    metadata: { escalationId: esc.id, agentId, agentName },
  });

  // Broadcast to member's session — they see the "reading" message in real-time
  wsHub.broadcast("alerts", {
    type:         "HUMAN_SPECIALIST_JOINED",
    escalationId: esc.id,
    sessionId:    esc.sessionId,
    phase:        "reading",
    message:      readingMessage,
    agentName,
    ts:           joinedAt,
  });

  logger.info({ escalationId: esc.id, agentId, agentName }, "[escalation] Human specialist joined — reading phase");
  res.json({ ok: true, escalationId: esc.id, phase: "reading", message: readingMessage });
});

// ─── POST /api/escalation/:id/briefed ────────────────────────────────────────
// Phase 2: Specialist confirms they have read the full context.
// Member sees "Specialist is ready" — live conversation can now begin.
router.post("/escalation/:id/briefed", async (req: Request, res: Response) => {
  const esc = ESCALATION_STORE.get(String(req.params["id"] ?? ""));
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  if (!esc.humanAgent) { res.status(400).json({ error: "No specialist has joined this case yet" }); return; }
  if (esc.humanAgent.phase !== "reading") {
    res.status(409).json({ error: `Already in phase: ${esc.humanAgent.phase}` }); return;
  }

  esc.humanAgent.phase    = "briefed";
  esc.humanAgent.briefedAt = new Date().toISOString();
  ESCALATION_STORE.set(esc.id, esc);

  wsHub.broadcast("alerts", {
    type:         "HUMAN_SPECIALIST_BRIEFED",
    escalationId: esc.id,
    sessionId:    esc.sessionId,
    phase:        "briefed",
    agentName:    esc.humanAgent.agentName,
    ts:           esc.humanAgent.briefedAt,
  });

  logger.info({ escalationId: esc.id }, "[escalation] Specialist briefed — ready to go live");
  res.json({ ok: true, escalationId: esc.id, phase: "briefed" });
});

// ─── POST /api/escalation/:id/message ────────────────────────────────────────
// Phase 3 — Live: Specialist sends a direct message to the member.
// Member replies here too. Full bidirectional conversation.
router.post("/escalation/:id/message", async (req: Request, res: Response) => {
  const esc = ESCALATION_STORE.get(String(req.params["id"] ?? ""));
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  if (!esc.humanAgent) { res.status(400).json({ error: "No specialist on this case" }); return; }

  const { content, from } = req.body as { content?: string; from?: "agent" | "member" };
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

  // First message from specialist moves phase to live
  if (esc.humanAgent.phase === "briefed" && from === "agent") {
    esc.humanAgent.phase  = "live";
    esc.humanAgent.liveAt = new Date().toISOString();
  }

  const msg: HumanAgentMessage = {
    id:        `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    from:      from ?? "agent",
    content:   content.trim(),
    ts:        new Date().toISOString(),
    agentName: from === "agent" ? esc.humanAgent.agentName : undefined,
  };

  esc.humanAgent.messages.push(msg);
  ESCALATION_STORE.set(esc.id, esc);

  wsHub.broadcast("alerts", {
    type:         "HUMAN_SPECIALIST_MESSAGE",
    escalationId: esc.id,
    sessionId:    esc.sessionId,
    phase:        esc.humanAgent.phase,
    message:      msg,
    ts:           msg.ts,
  });

  res.json({ ok: true, escalationId: esc.id, phase: esc.humanAgent.phase, message: msg });
});

// ─── GET /api/escalation/:id/thread ──────────────────────────────────────────
// Get full human agent conversation thread for a case.
router.get("/escalation/:id/thread", async (req: Request, res: Response) => {
  const esc = ESCALATION_STORE.get(String(req.params["id"] ?? ""));
  if (!esc) { res.status(404).json({ error: "Escalation not found" }); return; }
  res.json({
    escalationId: esc.id,
    humanAgent:   esc.humanAgent ?? null,
    messages:     esc.humanAgent?.messages ?? [],
    phase:        esc.humanAgent?.phase ?? "no_agent",
    memberContext: {
      userId:         esc.userId,
      sessionId:      esc.sessionId,
      requestSummary: esc.requestSummary,
      trigger:        esc.trigger,
      estimatedValue: esc.estimatedValue,
      confidence:     esc.confidence,
      agentChain:     esc.agentChain,
    },
  });
});

export { determineTrigger, ESCALATION_STORE };
export default router;
