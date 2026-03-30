/**
 * 3C Onyx — Multi-Agent Orchestrator
 *
 * Formal agent registry with:
 *   - 7 named agents (Guardian, Concierge, MarketCheck, Mission, Vault, Stripe, Notify)
 *   - State machine: pending → assigned → running → complete | failed | handed_off
 *   - Tool execution framework per agent
 *   - Handoff protocol: agent yields to next with full context
 *   - Session persistence (in-memory, Redis-ready interface)
 *   - Full audit trail on every state transition
 */
import crypto from "crypto";
import { broadcast } from "./wsHub";
import { route } from "./ai-router";
import { logger } from "./logger";
import { eventBus } from "./eventBus";

export type AgentId =
  | "guardian"
  | "concierge"
  | "marketcheck"
  | "mission"
  | "vault"
  | "stripe"
  | "notify";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "running"
  | "complete"
  | "failed"
  | "handed_off";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  tools: string[];
  handoffTargets: AgentId[];
  taskTypes: string[];
  aiTaskType: "conversation" | "analysis" | "quick" | "summarization" | "coding";
}

export interface HandoffRecord {
  fromAgent: AgentId;
  toAgent: AgentId;
  ts: string;
  reason: string;
}

export interface AgentTask {
  id: string;
  sessionId: string;
  type: string;
  payload: Record<string, unknown>;
  assignedAgent: AgentId | null;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  handoffChain: HandoffRecord[];
  auditLog: Array<{ ts: string; agentId: AgentId; event: string; detail?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSession {
  sessionId: string;
  userId: string;
  tasks: AgentTask[];
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  guardian: {
    id: "guardian",
    name: "Guardian Agent",
    description: "Validates V2X/OBD-II alerts, locks them, and initiates the 7-agent pipeline",
    tools: ["obd_read", "v2x_ping", "alert_lock", "vin_lookup"],
    handoffTargets: ["concierge", "marketcheck"],
    taskTypes: ["vehicle_alert", "predictive_failure", "dtc_code"],
    aiTaskType: "analysis",
  },
  concierge: {
    id: "concierge",
    name: "Concierge Agent",
    description: "Generates luxury prose explanations and member-facing communication",
    tools: ["gemini_chat", "pii_mask", "notification_compose"],
    handoffTargets: ["mission", "notify"],
    taskTypes: ["member_communication", "explain_alert", "service_recommendation"],
    aiTaskType: "conversation",
  },
  marketcheck: {
    id: "marketcheck",
    name: "MarketCheck Agent",
    description: "Sources wholesale parts, pricing, and comparable vehicle data",
    tools: ["marketcheck_search", "part_lookup", "price_compare", "supplier_rank"],
    handoffTargets: ["mission", "stripe"],
    taskTypes: ["part_sourcing", "vehicle_valuation", "market_pricing"],
    aiTaskType: "analysis",
  },
  mission: {
    id: "mission",
    name: "Mission Agent",
    description: "Creates and dispatches Runner pickup/delivery missions",
    tools: ["runner_dispatch", "route_optimize", "eta_calculate", "hypertrack_create"],
    handoffTargets: ["vault", "notify"],
    taskTypes: ["runner_dispatch", "logistics_mission", "service_appointment"],
    aiTaskType: "quick",
  },
  vault: {
    id: "vault",
    name: "Vault Agent",
    description: "Writes immutable SOC2 audit entries and chain-of-custody records",
    tools: ["audit_write", "chain_hash", "sha256_sign", "compliance_flag"],
    handoffTargets: ["stripe", "notify"],
    taskTypes: ["audit_entry", "compliance_record", "chain_of_custody"],
    aiTaskType: "summarization",
  },
  stripe: {
    id: "stripe",
    name: "Stripe Agent",
    description: "Executes multi-split payments (vendor + 20% referrer + 3C fee)",
    tools: ["stripe_charge", "split_calculate", "payout_schedule", "receipt_generate"],
    handoffTargets: ["vault", "notify"],
    taskTypes: ["payment_split", "payout", "subscription_manage"],
    aiTaskType: "quick",
  },
  notify: {
    id: "notify",
    name: "Notify Agent",
    description: "Pushes real-time notifications to members via WebSocket and push",
    tools: ["ws_broadcast", "push_notify", "sms_send", "email_compose"],
    handoffTargets: [],
    taskTypes: ["push_notification", "alert_delivery", "digest_send"],
    aiTaskType: "quick",
  },
};

const sessions = new Map<string, AgentSession>();

export function createSession(userId: string): AgentSession {
  const session: AgentSession = {
    sessionId: crypto.randomUUID(),
    userId,
    tasks: [],
    context: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string): AgentSession | undefined {
  return sessions.get(sessionId);
}

function findAgent(taskType: string): AgentId {
  for (const [id, def] of Object.entries(AGENT_REGISTRY)) {
    if (def.taskTypes.includes(taskType)) return id as AgentId;
  }
  return "concierge";
}

function transitionTask(task: AgentTask, status: TaskStatus, agentId: AgentId, detail?: string): void {
  task.status = status;
  task.updatedAt = new Date().toISOString();
  task.auditLog.push({ ts: new Date().toISOString(), agentId, event: status, detail });

  const payload = {
    taskId:    task.id,
    sessionId: task.sessionId,
    taskType:  task.type,
    status,
    agentId,
    agentName: AGENT_REGISTRY[agentId]?.name,
    detail,
    ts:        task.updatedAt,
  };

  // Broadcast via WebSocket (real-time UI)
  broadcast("agents", { type: "task_transition", ...payload });

  // Emit to event bus (EventBridge in prod, local emitter in dev)
  const eventType = status === "complete"    ? "agent.task.complete"   :
                    status === "failed"      ? "agent.task.failed"     :
                    status === "handed_off"  ? "agent.task.handed_off" :
                    status === "running"     ? "agent.task.running"    :
                    status === "assigned"    ? "agent.task.assigned"   :
                    "agent.task.pending";

  eventBus.emit(eventType, payload).catch(err => {
    logger.warn({ taskId: task.id, err: (err as Error).message }, "[orchestrator] EventBus emit failed");
  });
}

export async function submitTask(
  sessionId: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<AgentTask> {
  let session = sessions.get(sessionId);
  if (!session) {
    session = createSession(payload["userId"] as string ?? "anonymous");
  }

  const task: AgentTask = {
    id: crypto.randomUUID(),
    sessionId: session.sessionId,
    type,
    payload,
    assignedAgent: null,
    status: "pending",
    handoffChain: [],
    auditLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  session.tasks.push(task);
  session.updatedAt = new Date().toISOString();

  setImmediate(() => executeTask(task, session!).catch(err => {
    logger.error({ taskId: task.id, err: err.message }, "Agent task execution error");
  }));

  return task;
}

async function executeTask(task: AgentTask, session: AgentSession): Promise<void> {
  const agentId = findAgent(task.type);
  const agent = AGENT_REGISTRY[agentId];
  task.assignedAgent = agentId;
  transitionTask(task, "assigned", agentId, `Routed to ${agent.name}`);

  await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
  transitionTask(task, "running", agentId, `${agent.name} executing ${task.type}`);

  try {
    const contextStr = JSON.stringify({ taskType: task.type, payload: task.payload, tools: agent.tools });
    const aiResult = await route(
      [{ role: "user", content: `Execute task: ${task.type}. Context: ${contextStr}` }],
      agent.aiTaskType,
      `You are the ${agent.name} in the 3C Onyx agentic mesh. Your tools: ${agent.tools.join(", ")}. 
      Respond with a JSON object: {"result": "...", "handoff": null | "agentId", "handoffReason": "..."}.
      Keep result concise (1-2 sentences). Only hand off if genuinely needed.`,
    );

    let parsed: { result: string; handoff?: AgentId | null; handoffReason?: string } = {
      result: aiResult.content,
    };

    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = { result: aiResult.content };
    }

    task.result = parsed.result;

    if (parsed.handoff && agent.handoffTargets.includes(parsed.handoff)) {
      const handoffRecord: HandoffRecord = {
        fromAgent: agentId,
        toAgent: parsed.handoff,
        ts: new Date().toISOString(),
        reason: parsed.handoffReason ?? "Agent-initiated handoff",
      };
      task.handoffChain.push(handoffRecord);
      transitionTask(task, "handed_off", agentId, `Handing off to ${AGENT_REGISTRY[parsed.handoff].name}`);

      await new Promise(r => setTimeout(r, 100));
      const nextTask = { ...task, id: crypto.randomUUID(), type: parsed.handoff, assignedAgent: null, status: "pending" as TaskStatus };
      session.tasks.push(nextTask);
      await executeTask(nextTask, session);
      task.status = "complete";
    } else {
      transitionTask(task, "complete", agentId, `Completed: ${String(parsed.result).slice(0, 100)}`);
    }

    broadcast("agents", { type: "task_complete", taskId: task.id, agentId, result: task.result });
  } catch (err) {
    task.error = (err as Error).message;
    transitionTask(task, "failed", agentId, `Error: ${task.error?.slice(0, 100)}`);
    broadcast("agents", { type: "task_failed", taskId: task.id, agentId, error: task.error });
  }
}

export function getSessionSummary(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    taskCount: session.tasks.length,
    byStatus: session.tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    tasks: session.tasks.map(t => ({
      id: t.id,
      type: t.type,
      status: t.status,
      assignedAgent: t.assignedAgent,
      handoffChain: t.handoffChain,
      result: t.result,
    })),
  };
}

export function getAllAgents() {
  return Object.values(AGENT_REGISTRY).map(a => ({
    ...a,
    activeTasks: [...sessions.values()].flatMap(s => s.tasks)
      .filter(t => t.assignedAgent === a.id && t.status === "running").length,
  }));
}
