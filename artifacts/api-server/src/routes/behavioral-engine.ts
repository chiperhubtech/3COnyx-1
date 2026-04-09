import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { aiLimiter } from "../middlewares/rateLimiter";
import {
  getBehavioralStatus,
  generateBehavioralInstruction,
  getEngagement,
  detectObjections,
  analyzeSentiment,
  shouldEscalateToManager,
} from "../lib/sovereignBehavior";
import {
  getNetworkIntelligence,
  getAgentMetrics,
  getTopPatterns,
} from "../lib/conversionIntelligence";
import type { MeshAgentId } from "../lib/agentMesh12";

const router = Router();

router.get("/behavioral/status", (_req: Request, res: Response) => {
  const status = getBehavioralStatus();
  res.json(status);
});

router.get("/behavioral/intelligence", requireAuth, (_req: Request, res: Response) => {
  const intelligence = getNetworkIntelligence();
  res.json(intelligence);
});

router.get("/behavioral/agent/:agentId/metrics", requireAuth, (req: Request, res: Response) => {
  const agentId = req.params.agentId as string as MeshAgentId;
  const metrics = getAgentMetrics(agentId);
  res.json(metrics);
});

router.get("/behavioral/agent/:agentId/patterns", requireAuth, (req: Request, res: Response) => {
  const agentId = req.params.agentId as string as MeshAgentId;
  const limit = parseInt(String(req.query.limit ?? "5"), 10);
  const patterns = getTopPatterns(agentId, limit);
  res.json({ agentId, patterns });
});

router.get("/behavioral/session/:sessionId", requireAuth, (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const engagement = getEngagement(sessionId);
  if (!engagement) {
    res.json({ sessionId, state: "COLD", touchCount: 0, message: "No active engagement" });
    return;
  }
  res.json({
    sessionId: engagement.sessionId,
    state: engagement.state,
    score: engagement.score,
    touchCount: engagement.touchCount,
    transitions: engagement.transitions,
    sentiment: engagement.sentiment,
    objectionCount: engagement.objections.length,
    lastAgentId: engagement.lastAgentId,
    lastBehavioralPattern: engagement.lastBehavioralPattern,
  });
});

router.post("/behavioral/analyze", requireAuth, aiLimiter, (req: Request, res: Response) => {
  const { message } = req.body as { message?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const objections = detectObjections(message);
  const sentiment = analyzeSentiment(message);
  const escalation = shouldEscalateToManager(sentiment, objections, "COLD");

  res.json({
    objections,
    sentiment,
    escalation,
    architect: "Ronald Antonio Cadet",
    protocol: "Sovereign Behavioral Execution Engine",
  });
});

export default router;
