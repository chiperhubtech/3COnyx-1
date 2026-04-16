import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireSovereign } from "../middlewares/requireSovereign";
import { cSuiteEngine, type CSuiteAgentId } from "../lib/cSuiteAgentEngine";

const router = Router();

const VALID_AGENTS: CSuiteAgentId[] = ["ceo", "cto", "cfo", "coo", "content-social", "business-dev", "legal-compliance"];

router.get("/c-suite/status", (_req: Request, res: Response) => {
  const dashboard = cSuiteEngine.getDashboard();
  res.json({
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "C-Suite AI Agent Engine",
    version: "1.0.0",
    status: "ARMED",
    totalAgents: dashboard.agents.length,
    activeRules: dashboard.activeRules,
    agents: dashboard.agents.map(a => ({
      id: a.id,
      title: a.title,
      name: a.name,
      domain: a.domain,
      status: "ARMED",
      maturity: a.maturity,
      totalDirectives: a.totalDirectives,
      acceptanceRate: a.acceptanceRate,
      lastActive: a.lastActive,
      kpis: a.kpis,
      responsibilities: a.responsibilities,
      recentDirectives: a.recentDirectives.slice(0, 3),
    })),
    timestamp: new Date().toISOString(),
  });
});

router.get("/c-suite/dashboard", requireAuth, (_req: Request, res: Response) => {
  res.json(cSuiteEngine.getDashboard());
});

router.post("/c-suite/compute", requireSovereign, (req: Request, res: Response) => {
  const { agentId, platformContext } = req.body;
  if (!agentId || !platformContext) {
    res.status(400).json({ error: "agentId and platformContext required" });
    return;
  }

  if (!VALID_AGENTS.includes(agentId)) {
    res.status(400).json({ error: `Invalid agentId. Valid: ${VALID_AGENTS.join(", ")}` });
    return;
  }

  const directives = cSuiteEngine.computeDirectives(agentId, platformContext);
  res.json({
    agentId,
    directiveCount: directives.length,
    directives,
    timestamp: new Date().toISOString(),
  });
});

router.post("/c-suite/compute-all", requireSovereign, (req: Request, res: Response) => {
  const { platformContext } = req.body;
  if (!platformContext) {
    res.status(400).json({ error: "platformContext required" });
    return;
  }

  const result = cSuiteEngine.computeAllDirectives(platformContext);
  res.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
});

router.get("/c-suite/agent/:agentId", requireAuth, (req: Request, res: Response) => {
  const agentId = req.params.agentId as CSuiteAgentId;
  if (!VALID_AGENTS.includes(agentId)) {
    res.status(400).json({ error: "Invalid agent ID" });
    return;
  }

  const profile = cSuiteEngine.getAgentProfile(agentId);
  if (!profile) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const history = cSuiteEngine.getAgentDirectiveHistory(agentId);
  res.json({
    profile,
    recentDirectives: history,
    timestamp: new Date().toISOString(),
  });
});

router.post("/c-suite/directive/accepted", requireSovereign, (req: Request, res: Response) => {
  const { directiveId, agentId } = req.body;
  if (!directiveId || !agentId) {
    res.status(400).json({ error: "directiveId and agentId required" });
    return;
  }
  if (!VALID_AGENTS.includes(agentId)) {
    res.status(400).json({ error: "Invalid agent ID" });
    return;
  }

  cSuiteEngine.recordDirectiveAccepted(directiveId, agentId);
  res.json({ success: true, directiveId, agentId, status: "accepted" });
});

router.post("/c-suite/directive/overridden", requireSovereign, (req: Request, res: Response) => {
  const { directiveId, agentId, overrideReason } = req.body;
  if (!directiveId || !agentId || !overrideReason) {
    res.status(400).json({ error: "directiveId, agentId, and overrideReason required" });
    return;
  }
  if (!VALID_AGENTS.includes(agentId)) {
    res.status(400).json({ error: "Invalid agent ID" });
    return;
  }

  cSuiteEngine.recordDirectiveOverridden(directiveId, agentId, overrideReason);
  res.json({ success: true, directiveId, agentId, status: "overridden" });
});

export default router;
