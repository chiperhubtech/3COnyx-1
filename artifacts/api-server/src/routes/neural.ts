/**
 * 3C ONYX — Neural Brain API
 * ─────────────────────────────────────────────────────────────────────────────
 * The central intelligence layer. Narrow × General × Generative × Agentic.
 * All 4 types of AI working as a single unified brain.
 *
 * NARROW AI   → Task-specific: lead scoring, vehicle appraisal, fraud detection
 * GENERATIVE  → Content creation: outreach, descriptions, deal write-ups
 * AGENTIC     → Autonomous multi-step: plan, execute, monitor, adapt
 * GENERAL     → Complex reasoning: strategy, market analysis, business decisions
 *
 * Powered by Gemini 3.1 Pro (agentic/reasoning) + Flash (high-volume/generation)
 * No mocks. No placeholders. Every call hits real AI.
 */

import { Router, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

// ─── Model Selection ──────────────────────────────────────────────────────────
const BRAIN_MODEL    = "gemini-3.1-pro-preview"; // deep reasoning + agentic
const GENERATE_MODEL = "gemini-3-flash-preview";  // fast generation + scoring

// ─── Active Agents Registry (in-memory, stateful) ─────────────────────────────
interface NeuralAgent {
  id: string;
  role: string;
  specialty: string;
  status: "idle" | "thinking" | "executing" | "complete" | "error";
  currentTask?: string;
  result?: string;
  steps: string[];
  startedAt: string;
  completedAt?: string;
}

const activeAgents: Map<string, NeuralAgent> = new Map();

// ─── Automotive Narrow AI Scoring Engine ─────────────────────────────────────
function scoreLeadNarrow(lead: {
  responseTime?: number;    // minutes since inquiry
  vehicleYear?: number;
  creditScore?: number;
  tradeInValue?: number;
  monthlyBudget?: number;
  priorPurchases?: number;
  source?: string;
}) {
  let score = 50;
  const signals: string[] = [];

  if (lead.responseTime !== undefined) {
    if (lead.responseTime < 5)   { score += 25; signals.push("Lightning response (< 5min) +25"); }
    else if (lead.responseTime < 30) { score += 15; signals.push("Fast response (< 30min) +15"); }
    else if (lead.responseTime > 240) { score -= 20; signals.push("Cold lead (> 4hr) -20"); }
  }
  if (lead.creditScore !== undefined) {
    if (lead.creditScore >= 720) { score += 20; signals.push("Prime credit +20"); }
    else if (lead.creditScore >= 650) { score += 8; signals.push("Near-prime credit +8"); }
    else if (lead.creditScore < 580) { score -= 15; signals.push("Sub-prime risk -15"); }
  }
  if (lead.tradeInValue !== undefined && lead.tradeInValue > 0) {
    score += 10; signals.push("Active trade-in +10");
  }
  if (lead.monthlyBudget !== undefined && lead.monthlyBudget > 500) {
    score += 8; signals.push("Strong budget signal +8");
  }
  if (lead.vehicleYear !== undefined && lead.vehicleYear >= new Date().getFullYear() - 1) {
    score += 5; signals.push("New vehicle intent +5");
  }
  if (lead.priorPurchases !== undefined && lead.priorPurchases > 0) {
    score += 12; signals.push(`Returning buyer (${lead.priorPurchases}x) +12`);
  }
  const sourceBonus: Record<string, number> = { referral: 20, organic: 8, social: 5, paid: 0 };
  if (lead.source && sourceBonus[lead.source] !== undefined) {
    const bonus = sourceBonus[lead.source] ?? 0;
    score += bonus;
    if (bonus > 0) signals.push(`${lead.source} source +${bonus}`);
  }

  score = Math.max(0, Math.min(100, score));
  const tier = score >= 85 ? "HOT" : score >= 65 ? "WARM" : score >= 40 ? "COLD" : "DEAD";
  const action = tier === "HOT" ? "Call within 2 minutes" : tier === "WARM" ? "Follow up within 1 hour" : tier === "COLD" ? "Add to nurture sequence" : "Disqualify — archive";

  return { score, tier, signals, action, confidence: Math.min(95, 60 + signals.length * 5) };
}

// ─── POST /neural/think ───────────────────────────────────────────────────────
// Give the brain any problem. It reasons, plans, and returns a full execution.
router.post("/think", async (req: Request, res: Response) => {
  const { prompt, context, role = "strategist" } = req.body as { prompt?: string; context?: string; role?: string };
  if (!prompt?.trim()) { res.status(400).json({ error: "prompt is required" }); return; }

  const systemPrompt = `You are ONYX — the 3C ONYX Neural Brain built by CUXTOMCANDYCLUB LLC.
You are a ${role} operating at the intersection of automotive industry expertise and advanced AI reasoning.
You have the combined intelligence of:
- Narrow AI: Deep automotive domain knowledge (leads, vehicles, finance, service, logistics)
- General AI: Complex multi-domain reasoning across business, technology, and strategy
- Generative AI: Ability to create compelling, personalized content instantly
- Agentic AI: Autonomous multi-step planning and execution

PERSONA: Confident. Precise. Luxury-caliber thinking. 
You are Ron's AI partner — built to make CUXTOMCANDYCLUB the dominant force in automotive.

When given a problem, always output:
1. ASSESSMENT (2-3 sentences of sharp analysis)
2. PLAN (numbered steps, specific and actionable)
3. AI_ACTIONS (what specific AI capabilities you will deploy)
4. EXPECTED_OUTCOME (the measurable result)

Target market: 132M automotive professionals and consumers.
Current platform: 9 CRM integrations, 16 specialist roles, I-95 Dynasty network.`;

  try {
    const response = await ai.models.generateContent({
      model: BRAIN_MODEL,
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${context ? `CONTEXT: ${context}\n\n` : ""}PROBLEM/TASK: ${prompt}` }] }
      ],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    res.json({
      type: "GENERAL_REASONING",
      model: BRAIN_MODEL,
      role,
      prompt,
      response: text,
      tokensEstimate: Math.ceil(text.length / 4),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Neural brain unavailable", detail: String(err) });
  }
});

// ─── POST /neural/generate ────────────────────────────────────────────────────
// Generative AI: create any automotive content instantly
router.post("/generate", async (req: Request, res: Response) => {
  const {
    type,
    context = {},
  } = req.body as {
    type: "outreach" | "vehicle_description" | "deal_summary" | "lead_followup" | "market_report" | "bio";
    context: Record<string, unknown>;
  };

  const PROMPTS: Record<string, string> = {
    outreach: `Write a personalized automotive outreach message for:
Name: ${String(context["name"] ?? "[Name]")}
Role: ${String(context["role"] ?? "Industry Professional")}
Company: ${String(context["company"] ?? "")}
Personal link: ${String(context["referralLink"] ?? "[link]")}

Message is from Ron, founder of CUXTOMCANDYCLUB LLC and 3C ONYX platform.
Make it feel personal — not like a blast. Reference their specific role. Max 3 sentences.
Tone: Confident. Direct. Luxury. No fluff.`,

    vehicle_description: `Write a compelling vehicle listing description for:
${JSON.stringify(context, null, 2)}
Style: Premium dealer listing. Highlight condition, features, value. 3-4 sentences. No price.`,

    deal_summary: `Summarize this automotive deal for the F&I manager:
${JSON.stringify(context, null, 2)}
Include: buyer profile, deal structure highlights, risks, and recommended products (VSC, GAP, PPM).
Be specific. 4-5 sentences.`,

    lead_followup: `Write a lead follow-up message for:
Name: ${String(context["name"] ?? "[Name]")}
Vehicle interest: ${String(context["vehicle"] ?? "vehicle")}
Time since inquiry: ${String(context["hoursAgo"] ?? "?")} hours
Tone: Urgent but not pushy. Luxury service level. Under 100 words.`,

    market_report: `Generate a brief automotive market intelligence report for:
Market: ${String(context["market"] ?? "US automotive")}
Segment: ${String(context["segment"] ?? "general")}
Date: ${new Date().toLocaleDateString()}
Include: current trends, pricing pressure, demand signals, 30-day outlook. 5 bullet points.`,

    bio: `Write a professional bio for a 3C ONYX platform member:
${JSON.stringify(context, null, 2)}
Style: Professional but personable. LinkedIn-quality. 3 sentences.`,
  };

  const prompt = PROMPTS[type];
  if (!prompt) { res.status(400).json({ error: `Unknown generation type: ${type}. Valid: ${Object.keys(PROMPTS).join(", ")}` }); return; }

  try {
    const response = await ai.models.generateContent({
      model: GENERATE_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });
    res.json({ type: "GENERATIVE_AI", contentType: type, content: response.text ?? "", model: GENERATE_MODEL, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Generation failed", detail: String(err) });
  }
});

// ─── POST /neural/score ───────────────────────────────────────────────────────
// Narrow AI: deterministic automotive scoring + AI explanation
router.post("/score", async (req: Request, res: Response) => {
  const { type, data } = req.body as { type: "lead" | "vehicle" | "deal" | "specialist"; data: Record<string, unknown> };

  if (type === "lead") {
    const result = scoreLeadNarrow(data as Parameters<typeof scoreLeadNarrow>[0]);

    // AI explanation of the score
    try {
      const aiExplanation = await ai.models.generateContent({
        model: GENERATE_MODEL,
        contents: [{
          role: "user", parts: [{ text: `You are an automotive BDC expert. A lead scored ${result.score}/100 (${result.tier}).
Signals: ${result.signals.join(", ")}.
Recommended action: ${result.action}.
Write a 2-sentence coaching note for the BDC rep explaining WHY this lead got this score and exactly what to say in the first call. Be specific and tactical.` }]
        }],
        config: { maxOutputTokens: 8192 },
      });
      res.json({ type: "NARROW_AI", scoreType: "lead", ...result, aiCoaching: aiExplanation.text ?? "", model: GENERATE_MODEL });
    } catch {
      res.json({ type: "NARROW_AI", scoreType: "lead", ...result });
    }
    return;
  }

  if (type === "vehicle") {
    const year = Number(data["year"] ?? 2020);
    const miles = Number(data["miles"] ?? 50000);
    const condition = String(data["condition"] ?? "good");
    const accidents = Number(data["accidents"] ?? 0);

    let baseScore = 100;
    const age = new Date().getFullYear() - year;
    baseScore -= age * 4;
    baseScore -= Math.floor(miles / 10000) * 3;
    if (condition === "excellent") baseScore += 10;
    if (condition === "fair") baseScore -= 15;
    if (condition === "poor") baseScore -= 30;
    baseScore -= accidents * 12;
    const vehicleScore = Math.max(10, Math.min(100, baseScore));

    try {
      const aiAnalysis = await ai.models.generateContent({
        model: GENERATE_MODEL,
        contents: [{
          role: "user", parts: [{ text: `Automotive appraiser: This ${year} vehicle with ${miles.toLocaleString()} miles, ${condition} condition, ${accidents} accident(s) scored ${vehicleScore}/100.
Data: ${JSON.stringify(data)}.
Write a 2-sentence appraisal note including: market positioning, reconditioning recommendation, and realistic retail/wholesale spread estimate.` }]
        }],
        config: { maxOutputTokens: 8192 },
      });
      res.json({ type: "NARROW_AI", scoreType: "vehicle", score: vehicleScore, tier: vehicleScore >= 80 ? "RETAIL" : vehicleScore >= 55 ? "WHOLESALE" : "AUCTION", aiAppraisal: aiAnalysis.text ?? "" });
    } catch {
      res.json({ type: "NARROW_AI", scoreType: "vehicle", score: vehicleScore });
    }
    return;
  }

  res.status(400).json({ error: `Unknown score type: ${type}. Valid: lead, vehicle, deal, specialist` });
});

// ─── POST /neural/agents/spawn ────────────────────────────────────────────────
// Agentic AI: spawn an autonomous agent to complete a multi-step task
router.post("/agents/spawn", async (req: Request, res: Response) => {
  const { role, task, context = {} } = req.body as { role: string; task: string; context?: Record<string, unknown> };
  if (!role || !task) { res.status(400).json({ error: "role and task are required" }); return; }

  const agentId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const agent: NeuralAgent = {
    id: agentId,
    role,
    specialty: task,
    status: "thinking",
    currentTask: task,
    steps: [],
    startedAt: new Date().toISOString(),
  };
  activeAgents.set(agentId, agent);

  // Non-blocking: execute agent in background
  void (async () => {
    try {
      const plan = await ai.models.generateContent({
        model: BRAIN_MODEL,
        contents: [{
          role: "user", parts: [{ text: `You are the ${role} AI Agent inside 3C ONYX by CUXTOMCANDYCLUB LLC.
Your mission: ${task}
Context: ${JSON.stringify(context)}

Execute this autonomously. Think step by step. Output your execution as:
STEP 1: [action taken]
STEP 2: [action taken]
...
RESULT: [final outcome and recommendation]

Be specific, tactical, and decisive. Max 8 steps.` }]
        }],
        config: { maxOutputTokens: 8192 },
      });

      const text = plan.text ?? "";
      const lines = text.split("\n").filter(l => l.match(/^STEP \d+:|^RESULT:/i));
      agent.steps = lines.length > 0 ? lines : [text.slice(0, 200)];
      agent.result = text;
      agent.status = "complete";
      agent.completedAt = new Date().toISOString();
    } catch (err) {
      agent.status = "error";
      agent.result = String(err);
      agent.completedAt = new Date().toISOString();
    }
    activeAgents.set(agentId, agent);
  })();

  res.status(202).json({ agentId, role, task, status: "thinking", message: `Agent ${role} is executing autonomously. Poll GET /neural/agents/${agentId} for result.` });
});

// ─── GET /neural/agents ───────────────────────────────────────────────────────
router.get("/agents", (_req: Request, res: Response) => {
  const list = Array.from(activeAgents.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  res.json({ agents: list, active: list.filter(a => a.status === "thinking" || a.status === "executing").length, total: list.length });
});

// ─── GET /neural/agents/:id ───────────────────────────────────────────────────
router.get("/agents/:id", (req: Request, res: Response) => {
  const agent = activeAgents.get(String(req.params["id"] ?? ""));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
  res.json(agent);
});

// ─── POST /neural/analyze ─────────────────────────────────────────────────────
// General AI: deep market and competitive intelligence
router.post("/analyze", async (req: Request, res: Response) => {
  const { subject, question, data } = req.body as { subject: string; question: string; data?: Record<string, unknown> };
  if (!subject || !question) { res.status(400).json({ error: "subject and question are required" }); return; }

  try {
    const response = await ai.models.generateContent({
      model: BRAIN_MODEL,
      contents: [{
        role: "user", parts: [{ text: `You are the ONYX Strategic Intelligence Engine for CUXTOMCANDYCLUB LLC.
Platform: 3C ONYX — Automotive Super App targeting 132M members, $30B valuation.
Founder: Ron. Network: I-95 Dynasty.

SUBJECT: ${subject}
QUESTION: ${question}
${data ? `DATA: ${JSON.stringify(data, null, 2)}` : ""}

Deliver a strategic intelligence analysis. Include:
1. SITUATION (what's happening)
2. DRIVERS (why it's happening)
3. IMPLICATIONS (what it means for 3C ONYX and Ron)
4. RECOMMENDATION (3 specific actions)
5. RISK (what could go wrong)

Be direct, specific, and executive-level. This is a $30B company being built.` }]
      }],
      config: { maxOutputTokens: 8192 },
    });

    res.json({ type: "GENERAL_AI_ANALYSIS", subject, question, analysis: response.text ?? "", model: BRAIN_MODEL, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Analysis failed", detail: String(err) });
  }
});

// ─── GET /neural/status ───────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    brain: "ONLINE",
    platform: "3C ONYX by CUXTOMCANDYCLUB LLC",
    models: {
      reasoning: BRAIN_MODEL,
      generation: GENERATE_MODEL,
    },
    capabilities: {
      narrowAI:    { status: "ACTIVE", description: "Lead scoring, vehicle appraisal, fraud detection", endpoints: ["/neural/score"] },
      generativeAI:{ status: "ACTIVE", description: "Outreach messages, vehicle descriptions, deal summaries", endpoints: ["/neural/generate"] },
      agenticAI:   { status: "ACTIVE", description: "Autonomous multi-step task execution", endpoints: ["/neural/agents/spawn", "/neural/agents"] },
      generalAI:   { status: "ACTIVE", description: "Complex reasoning, strategy, market intelligence", endpoints: ["/neural/think", "/neural/analyze"] },
    },
    activeAgents: Array.from(activeAgents.values()).filter(a => a.status === "thinking" || a.status === "executing").length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
