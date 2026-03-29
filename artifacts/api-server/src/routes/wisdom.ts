/**
 * 3C ONYX — Wisdom Engine API
 * ─────────────────────────────────────────────────────────────────────────────
 * The Business Canon + LeanSpark Continuous Innovation Engine.
 *
 * GET  /wisdom/canon              Full 15-book Business Canon
 * GET  /wisdom/canon/:bookId      Single book with all principles
 * GET  /wisdom/principles         All principles, optional domain filter
 * POST /wisdom/query              AI-powered query against the Business Canon
 * GET  /wisdom/stress-test        LeanSpark 7-dimension stress test for 3C ONYX
 * GET  /wisdom/sprints            PDCA sprint cycle status
 * POST /wisdom/sprints/:id/evidence  Log evidence for active sprint
 * GET  /wisdom/agent/:agentId     Wisdom context for a specific agent
 *
 * CUXTOMCANDYCLUB LLC — Built for the next 1,000 years.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { route as routeAI } from "../lib/ai-router";
import {
  BUSINESS_CANON,
  getAllPrinciples,
  getAgentWisdom,
  getWisdomContext,
  buildAgentSystemPromptContext,
  runONYXStressTest,
  searchPrinciples,
  ONYX_ACTIVE_CYCLE,
  type WisdomDomain,
  type AgentId,
  type PDCASprint,
} from "../lib/wisdomEngine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── In-memory sprint evidence store (persisted in DB in v2) ─────────────────

const sprintEvidence = new Map<string, string[]>();
const sprintOverrides = new Map<string, Partial<PDCASprint>>();

// ─── GET /wisdom/canon ────────────────────────────────────────────────────────

router.get("/canon", (_req: Request, res: Response) => {
  res.json({
    books: BUSINESS_CANON.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      year: b.year,
      category: b.category,
      tagline: b.tagline,
      coreInsight: b.coreInsight,
      onyxApplication: b.onyxApplication,
      color: b.color,
      principleCount: b.principles.length,
    })),
    totalBooks: BUSINESS_CANON.length,
    totalPrinciples: getAllPrinciples().length,
  });
});

// ─── GET /wisdom/canon/:bookId ────────────────────────────────────────────────

router.get("/canon/:bookId", (req: Request, res: Response) => {
  const book = BUSINESS_CANON.find(b => b.id === req.params.bookId);
  if (!book) {
    res.status(404).json({ error: "Book not found", bookId: req.params.bookId });
    return;
  }
  res.json(book);
});

// ─── GET /wisdom/principles ───────────────────────────────────────────────────

router.get("/principles", (req: Request, res: Response) => {
  const domain = req.query.domain as WisdomDomain | undefined;
  const q = req.query.q as string | undefined;

  let principles = getAllPrinciples();

  if (q) {
    principles = searchPrinciples(q);
  } else if (domain) {
    principles = getWisdomContext([domain]);
  }

  res.json({ principles, count: principles.length });
});

// ─── GET /wisdom/agent/:agentId ───────────────────────────────────────────────

router.get("/agent/:agentId", requireAuth, (req: Request, res: Response) => {
  const agentId = req.params.agentId as AgentId;
  const principles = getAgentWisdom(agentId);
  const systemPromptContext = buildAgentSystemPromptContext(agentId);

  res.json({
    agentId,
    principles,
    systemPromptContext,
    count: principles.length,
  });
});

// ─── POST /wisdom/query ───────────────────────────────────────────────────────

router.post("/query", requireAuth, async (req: Request, res: Response) => {
  const { question, domains } = req.body as { question?: string; domains?: WisdomDomain[] };

  if (!question || question.trim().length < 5) {
    res.status(400).json({ error: "question is required (min 5 characters)" });
    return;
  }

  const relevantPrinciples = domains?.length
    ? getWisdomContext(domains)
    : getAllPrinciples().slice(0, 20);

  const principleContext = relevantPrinciples
    .slice(0, 15)
    .map(p => {
      const book = BUSINESS_CANON.find(b => b.id === p.bookId);
      return `[${book?.title} — ${book?.author}]\n${p.title}: ${p.statement}\nONYX Context: ${p.onyxContext}`;
    })
    .join("\n\n");

  const systemPrompt = `You are the ONYX Wisdom Engine — the strategic intelligence layer of the 3C ONYX platform, built by Ronald Antonio Cadet for CUXTOMCANDYCLUB LLC.

Your knowledge base is the Business Canon: 15 foundational business books that define how ONYX operates. You answer every question by grounding your response in these timeless principles and applying them specifically to 3C ONYX's context.

Platform context:
- 3C ONYX is a luxury automotive Super App targeting 132M members and $30B valuation
- Mission: automotive justice for underserved communities
- Philosophy: ONYX acts; member confirms
- Founder: Ronald Antonio Cadet
- Entity: CUXTOMCANDYCLUB LLC (Florida)

Business Canon context for this query:
${principleContext}

Respond in a way that is:
- Grounded in specific principles from the Business Canon (cite the book and author)
- Directly applied to 3C ONYX's specific situation
- Actionable — give concrete next steps, not just theory
- Confident and visionary — this platform is built for the next 1,000 years`;

  try {
    const result = await routeAI(
      [{ role: "user", content: question }],
      "analysis",
      systemPrompt,
    );

    res.json({
      question,
      answer: result.content,
      principlesUsed: relevantPrinciples.slice(0, 15).map(p => ({
        id: p.id,
        title: p.title,
        bookId: p.bookId,
      })),
      provider: result.provider,
      model: result.model,
      durationMs: result.durationMs,
    });
  } catch (err) {
    logger.error({ err }, "Wisdom query failed");
    res.status(500).json({ error: "Wisdom Engine query failed", details: String(err) });
  }
});

// ─── GET /wisdom/stress-test ──────────────────────────────────────────────────

router.get("/stress-test", (_req: Request, res: Response) => {
  const result = runONYXStressTest();
  res.json(result);
});

// ─── GET /wisdom/sprints ──────────────────────────────────────────────────────

router.get("/sprints", (_req: Request, res: Response) => {
  const sprints = ONYX_ACTIVE_CYCLE.map(sprint => {
    const override = sprintOverrides.get(sprint.id) ?? {};
    const evidence = [...(sprint.evidence ?? []), ...(sprintEvidence.get(sprint.id) ?? [])];
    return { ...sprint, ...override, evidence };
  });

  res.json({
    cycleNumber: 1,
    cycleDurationDays: 90,
    sprintDurationDays: 14,
    totalSprints: sprints.length,
    sprints,
    methodology: "LeanSpark Continuous Innovation — PDCA Sprint Cycles",
    framework: "Ash Maurya / LeanFoundry",
  });
});

// ─── POST /wisdom/sprints/:id/evidence ───────────────────────────────────────

router.post("/sprints/:id/evidence", requireAuth, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { evidence, outcome, learnings, status } = req.body as {
    evidence?: string;
    outcome?: PDCASprint["outcome"];
    learnings?: string;
    status?: PDCASprint["status"];
  };

  const sprint = ONYX_ACTIVE_CYCLE.find(s => s.id === id);
  if (!sprint) {
    res.status(404).json({ error: "Sprint not found", id });
    return;
  }

  if (evidence) {
    if (!sprintEvidence.has(id)) sprintEvidence.set(id, []);
    sprintEvidence.get(id)!.push(evidence);
  }

  const override = sprintOverrides.get(id) ?? {};
  if (outcome) override.outcome = outcome;
  if (learnings) override.learnings = learnings;
  if (status) override.status = status;
  sprintOverrides.set(id, override);

  const updatedSprint = {
    ...sprint,
    ...override,
    evidence: [...(sprint.evidence ?? []), ...(sprintEvidence.get(id) ?? [])],
  };

  res.json({ sprint: updatedSprint, message: "Sprint updated" });
});

// ─── GET /wisdom/summary ──────────────────────────────────────────────────────

router.get("/summary", (_req: Request, res: Response) => {
  const stressTest = runONYXStressTest();
  const activeSprint = ONYX_ACTIVE_CYCLE[0];

  res.json({
    businessCanon: {
      books: BUSINESS_CANON.length,
      principles: getAllPrinciples().length,
      categories: [...new Set(BUSINESS_CANON.map(b => b.category))],
    },
    stressTest: {
      overallScore: stressTest.overallScore,
      overallRating: stressTest.overallRating,
      topRisk: stressTest.topRisks[0],
      nextAction: stressTest.nextActions[0],
    },
    activeSprint: activeSprint
      ? {
          id: activeSprint.id,
          sprintNumber: activeSprint.sprintNumber,
          assumption: activeSprint.assumption,
          status: activeSprint.status,
        }
      : null,
    generatedAt: new Date().toISOString(),
  });
});

export default router;
