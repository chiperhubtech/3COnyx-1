import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { selfLearningEngine } from "../lib/selfLearningEngine";
import { nbaEngine, type ActionCategory } from "../lib/nextBestActionEngine";
import type { MeshAgentId } from "../lib/agentMesh12";
import type { EngagementState, ObjectionType } from "../lib/sovereignBehavior";

const router = Router();

router.get("/learning/status", (_req: Request, res: Response) => {
  res.json({
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "Sovereign Intelligence Singularity",
    version: "1.0.0",
    status: "ARMED",
    systems: {
      selfLearning: { status: "ARMED", protocol: "Self-Learning Feedback Loop" },
      nextBestAction: { status: "ARMED", protocol: "Next Best Action Engine" },
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/learning/dashboard", requireAuth, (_req: Request, res: Response) => {
  res.json(selfLearningEngine.getDashboard());
});

router.post("/learning/correction", requireAuth, (req: Request, res: Response) => {
  const { sessionId, agentId, aiSuggestion, aiConfidence, humanAction, overrideReason, dealId, engagementState, objectionTypes } = req.body || {};

  if (!sessionId || !agentId || !aiSuggestion || !humanAction) {
    res.status(400).json({ error: "sessionId, agentId, aiSuggestion, and humanAction are required" });
    return;
  }

  const user = (req as any).user;
  const correction = selfLearningEngine.recordCorrection({
    sessionId,
    agentId: agentId as MeshAgentId,
    userId: user?.id ? String(user.id) : undefined,
    aiSuggestion,
    aiConfidence: typeof aiConfidence === "number" ? aiConfidence : 0.5,
    humanAction,
    overrideReason,
    dealId,
    engagementState: (engagementState as EngagementState) || "COLD",
    objectionTypes: Array.isArray(objectionTypes) ? objectionTypes as ObjectionType[] : [],
    context: {},
  });

  res.json({ recorded: true, correctionId: correction.id, correctionHash: correction.correctionHash });
});

router.post("/learning/accepted", requireAuth, (req: Request, res: Response) => {
  const { agentId, confidence } = req.body || {};
  if (!agentId) {
    res.status(400).json({ error: "agentId is required" });
    return;
  }
  selfLearningEngine.recordSuggestionAccepted(agentId as MeshAgentId, typeof confidence === "number" ? confidence : 0.85);
  res.json({ recorded: true });
});

router.post("/learning/outcome", requireAuth, (req: Request, res: Response) => {
  const { correctionId, outcome } = req.body || {};
  if (!correctionId || !["BETTER", "SAME", "WORSE"].includes(outcome)) {
    res.status(400).json({ error: "correctionId and outcome (BETTER|SAME|WORSE) are required" });
    return;
  }
  const result = selfLearningEngine.recordOutcome(correctionId, outcome);
  res.json({ recorded: result });
});

router.get("/learning/agent/:agentId/report", requireAuth, (req: Request, res: Response) => {
  const report = selfLearningEngine.getAgentLearningReport(req.params.agentId as MeshAgentId);
  res.json(report);
});

router.get("/learning/agent/:agentId/threshold", requireAuth, (req: Request, res: Response) => {
  const threshold = selfLearningEngine.getOptimalConfidenceThreshold(req.params.agentId as MeshAgentId);
  res.json({ agentId: req.params.agentId, optimalThreshold: threshold });
});

router.get("/nba/dashboard", requireAuth, (_req: Request, res: Response) => {
  res.json(nbaEngine.getDashboard());
});

router.post("/nba/compute", requireAuth, (req: Request, res: Response) => {
  const { dealId, status, daysSinceCreated, daysSinceLastActivity, hasTradeIn, hasFinancing, hasInsurance, blockers, participantCount, customerEngagementState, customerSentiment, objections, salePrice, dealType } = req.body || {};

  if (!dealId || !status) {
    res.status(400).json({ error: "dealId and status are required" });
    return;
  }

  const dealContext = {
    dealId,
    status,
    dealType,
    salePrice: typeof salePrice === "number" ? salePrice : undefined,
    daysSinceCreated: typeof daysSinceCreated === "number" ? daysSinceCreated : 0,
    daysSinceLastActivity: typeof daysSinceLastActivity === "number" ? daysSinceLastActivity : 0,
    hasTradeIn: !!hasTradeIn,
    hasFinancing: !!hasFinancing,
    hasInsurance: !!hasInsurance,
    blockers: Array.isArray(blockers) ? blockers : [],
    participantCount: typeof participantCount === "number" ? participantCount : 1,
    customerEngagementState: (customerEngagementState as EngagementState) || "COLD",
    customerSentiment: typeof customerSentiment === "number" ? customerSentiment : undefined,
    objections: Array.isArray(objections) ? objections : [],
  };

  const nba = nbaEngine.computeNBA(dealContext);
  res.json(nba);
});

router.post("/nba/batch", requireAuth, (req: Request, res: Response) => {
  const { deals } = req.body || {};
  if (!Array.isArray(deals) || deals.length === 0) {
    res.status(400).json({ error: "deals array is required" });
    return;
  }

  const dealContexts = deals.map((d: any) => ({
    dealId: d.dealId || "unknown",
    status: d.status || "Open",
    dealType: d.dealType,
    salePrice: typeof d.salePrice === "number" ? d.salePrice : undefined,
    daysSinceCreated: typeof d.daysSinceCreated === "number" ? d.daysSinceCreated : 0,
    daysSinceLastActivity: typeof d.daysSinceLastActivity === "number" ? d.daysSinceLastActivity : 0,
    hasTradeIn: !!d.hasTradeIn,
    hasFinancing: !!d.hasFinancing,
    hasInsurance: !!d.hasInsurance,
    blockers: Array.isArray(d.blockers) ? d.blockers : [],
    participantCount: typeof d.participantCount === "number" ? d.participantCount : 1,
    customerEngagementState: (d.customerEngagementState as EngagementState) || "COLD",
    customerSentiment: typeof d.customerSentiment === "number" ? d.customerSentiment : undefined,
    objections: Array.isArray(d.objections) ? d.objections : [],
  }));

  const result = nbaEngine.computeBatchNBA(dealContexts);
  res.json(result);
});

router.post("/nba/accepted", requireAuth, (req: Request, res: Response) => {
  const { actionId } = req.body || {};
  if (!actionId) {
    res.status(400).json({ error: "actionId is required" });
    return;
  }
  nbaEngine.recordActionAccepted(actionId);
  res.json({ recorded: true });
});

export default router;
