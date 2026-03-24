// @ts-nocheck
/**
 * 3C Onyx — Agent Orchestrator API
 *
 * POST /api/orchestrator/session           — Create agent session
 * POST /api/orchestrator/task             — Submit task to orchestrator
 * GET  /api/orchestrator/session/:id      — Get session summary
 * GET  /api/orchestrator/agents           — List all agents + live status
 * GET  /api/orchestrator/ws-stats         — WebSocket hub stats
 * POST /api/orchestrator/ai/route         — Direct AI model router call
 */
import { Router, type Request, type Response } from "express";
import { createSession, submitTask, getSessionSummary, getAllAgents } from "../lib/agentOrchestrator";
import { route as aiRoute } from "../lib/ai-router";
import { stats as wsStats } from "../lib/wsHub";
import type { TaskType } from "../lib/ai-router";

const router = Router();

router.post("/orchestrator/session", (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  const session = createSession(userId ?? "anonymous");
  res.status(201).json({ sessionId: session.sessionId, createdAt: session.createdAt });
});

router.post("/orchestrator/task", async (req: Request, res: Response) => {
  const { sessionId, type, payload } = req.body as {
    sessionId: string;
    type: string;
    payload: Record<string, unknown>;
  };

  if (!sessionId || !type) {
    res.status(400).json({ error: "sessionId and type are required" });
    return;
  }

  const task = await submitTask(sessionId, type, payload ?? {});
  res.status(202).json({
    taskId: task.id,
    status: task.status,
    assignedAgent: task.assignedAgent,
    message: "Task submitted — execution is async. Poll /session/:id or subscribe to WS /agents room.",
  });
});

router.get("/orchestrator/session/:id", (req: Request, res: Response) => {
  const summary = getSessionSummary(req.params.id);
  if (!summary) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(summary);
});

router.get("/orchestrator/agents", (_req: Request, res: Response) => {
  res.json({ agents: getAllAgents(), ts: new Date().toISOString() });
});

router.get("/orchestrator/ws-stats", (_req: Request, res: Response) => {
  res.json({ ...wsStats(), ts: new Date().toISOString() });
});

router.post("/orchestrator/ai/route", async (req: Request, res: Response) => {
  const { messages, taskType, systemPrompt } = req.body as {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    taskType?: TaskType;
    systemPrompt?: string;
  };

  if (!messages?.length) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const result = await aiRoute(messages, taskType ?? "conversation", systemPrompt);
  res.json(result);
});

export default router;
