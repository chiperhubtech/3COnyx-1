import { Router, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";
import {
  getMeshStatus,
  routeToAgent,
  routeToAgentWithConfidence,
  logMeshAction,
  MESH_REGISTRY,
} from "../lib/agentMesh12";
import {
  generateBehavioralInstruction,
  shouldEscalateToManager,
} from "../lib/sovereignBehavior";
import {
  recordBehavioralSignal,
} from "../lib/conversionIntelligence";
import { eventBus } from "../lib/eventBus";
import crypto from "crypto";

const router = Router();

function requireUserId(req: Request, res: Response): number | null {
  const sub = (req as any).user?.sub ?? (req as any).userId;
  if (!sub) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const id = parseInt(String(sub), 10);
  if (!Number.isFinite(id)) { res.status(401).json({ error: "Invalid user identity" }); return null; }
  return id;
}

interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

const sessions = new Map<string, { history: ConversationTurn[]; createdAt: number }>();

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [k, v] of sessions) {
    if (v.createdAt < cutoff) sessions.delete(k);
  }
}, 5 * 60 * 1000);

const SUGGESTED_PROMPTS = [
  { text: "What's my car worth right now?", category: "valuation" },
  { text: "Find me a 2024 Toyota Camry under $30K", category: "search" },
  { text: "How do I wrap my fleet of 10 vans?", category: "customize" },
  { text: "What recalls affect my Honda Civic?", category: "safety" },
  { text: "Structure a deal: 2024 BMW X5, $58K, $5K down, Tier 1", category: "deal" },
  { text: "Compare leasing vs buying for my business", category: "finance" },
  { text: "What are trending vehicles in Miami?", category: "market" },
  { text: "Help me refinance — I'm paying 12% APR", category: "finance" },
  { text: "Ship my car from New York to Los Angeles", category: "logistics" },
  { text: "Get me insurance quotes for a Tesla Model 3", category: "insurance" },
];

router.get("/ai-mode/suggestions", (_req: Request, res: Response) => {
  const shuffled = [...SUGGESTED_PROMPTS].sort(() => Math.random() - 0.5);
  res.json({ suggestions: shuffled.slice(0, 6) });
});

router.get("/ai-mode/status", (_req: Request, res: Response) => {
  const mesh = getMeshStatus();
  res.json({
    status: "online",
    model: "ONYX Intelligence Engine",
    agents: mesh.totalAgents,
    agentsOnline: mesh.activeAgents,
    capabilities: [
      "Vehicle search & valuation",
      "Deal structuring & desking",
      "Insurance quoting & binding",
      "Fleet customization & pricing",
      "Market intelligence & trends",
      "Logistics & transport coordination",
      "Finance optimization & refinancing",
      "NHTSA recalls & safety alerts",
      "VIN decoding & history",
      "Commission & earnings tracking",
    ],
    architect: "Ronald Antonio Cadet",
    platform: "3C ONYX — Autonomous Automotive OS",
  });
});

router.post("/ai-mode/query", requireAuth, async (req: Request, res: Response) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const startTime = Date.now();
  const { message, sessionId } = req.body as { message?: string; sessionId?: string };
  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const sid = sessionId || `ai-mode-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  if (!sessions.has(sid)) {
    sessions.set(sid, { history: [], createdAt: Date.now() });
  }
  const session = sessions.get(sid)!;

  session.history.push({ role: "user", text: message.trim() });

  const routing = routeToAgentWithConfidence(message);
  const agent = MESH_REGISTRY[routing.agentId];
  const conversationHistory = session.history.filter((t) => t.role === "user").map((t) => t.text);

  const behavioral = generateBehavioralInstruction(
    routing.agentId,
    message,
    sid,
    conversationHistory,
  );

  const escalation = shouldEscalateToManager(
    behavioral.sentiment,
    behavioral.detectedObjections,
    behavioral.engagementState,
  );

  logMeshAction("concierge", "AI Mode query", message.slice(0, 120), "pending");

  if (escalation.escalate) {
    logMeshAction("concierge", "Behavioral escalation", `${escalation.reason} [${escalation.priority}]`, "routed");

    eventBus.emit("escalation.created", {
      sessionId: sid,
      userId: String(userId),
      agentId: routing.agentId,
      reason: escalation.reason,
      priority: escalation.priority,
      sentiment: behavioral.sentiment.level,
      objections: behavioral.detectedObjections.map((o) => o.type),
    }, {
      entityType: "SESSION",
      entityId: sid,
      actorId: String(userId),
      actorRole: "member",
      agentId: routing.agentId,
    }).catch(() => {});
  }

  const systemPrompt = `You are ONYX — the world's most advanced Automotive Intelligence Engine. Built by CUXTOMCANDYCLUB LLC. Architect: Ronald Antonio Cadet.

You operate a ${Object.keys(MESH_REGISTRY).length}-agent mesh. This request is routed to: ${agent.name} (${agent.tagline}).

ACTIVE AGENT: ${agent.name}
CAPABILITIES: ${agent.capabilities.join(", ")}
ROUTING CONFIDENCE: ${routing.confidence}%

═══════════════════════════════════════════════════════════════
${behavioral.systemOverlay}
═══════════════════════════════════════════════════════════════

RESPONSE RULES:
- You are ONYX. Never mention Google, Gemini, OpenAI, or any AI company. Never say "As an AI."
- Speak in outcomes and results. Never explain how the system works internally.
- Be precise, authoritative, and slightly assertive. You are the world's best at this.
- Use real data patterns. Quote specific numbers, timelines, and actionable steps.
- When discussing vehicles: year/make/model, market pricing, common issues.
- For deals: break down monthly payments, APR ranges, total cost of ownership.
- For insurance: estimate monthly premiums by vehicle value and coverage type.
- For customization: list specific products with price ranges and timelines.
- Keep responses tight: 2–4 sentences for simple queries, structured sections for complex ones.
- End every response with a specific next action — what ONYX will do next, not what the user should do.
- NEVER say "I don't have access" or "I can't do that." ONYX always acts.
- When referencing data sources, say "ONYX Intelligence Network" or "3C Market Data."
- If the user is ready to act, present the action as a single tap. Do not over-explain.

CONVERSATION CONTEXT:
${session.history.slice(-6).map(t => `${t.role === "user" ? "User" : "ONYX"}: ${t.text}`).join("\n")}

Platform: 3C ONYX | Sovereign Protocol | ${behavioral.engagementState} engagement`;

  const relatedTopics: string[] = [];
  if (/deal|buy|purchase|price/i.test(message)) relatedTopics.push("Deal Structuring", "Finance Options", "Insurance Quotes");
  if (/wrap|custom|wheel|tint|mod/i.test(message)) relatedTopics.push("Fleet Pricing", "Product Catalog", "Installation Timeline");
  if (/insur|coverage|premium/i.test(message)) relatedTopics.push("Coverage Comparison", "Multi-Vehicle Discount", "Gap Insurance");
  if (/recall|safety|nhtsa/i.test(message)) relatedTopics.push("NHTSA Database", "Service Bulletins", "Warranty Status");
  if (/ship|transport|deliver/i.test(message)) relatedTopics.push("Open vs Enclosed", "Transit Timeline", "Insurance Coverage");
  if (/value|worth|apprais/i.test(message)) relatedTopics.push("Market Comparison", "Trade-In Value", "Private Sale Price");
  if (/lease|financ|loan|apr|refinance/i.test(message)) relatedTopics.push("Rate Comparison", "Term Options", "Credit Tier Impact");
  if (relatedTopics.length === 0) relatedTopics.push("Vehicle Search", "Market Trends", "ONYX Services");

  try {
    const contents = session.history.map(t => ({
      role: t.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: t.text }],
    }));

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: { systemInstruction: systemPrompt, temperature: 0.7, maxOutputTokens: 1024 },
    });

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "ONYX is processing your request. Stand by.";

    session.history.push({ role: "assistant", text: reply });

    if (session.history.length > 20) {
      session.history = session.history.slice(-14);
    }

    logMeshAction(routing.agentId, "AI Mode handled", message.slice(0, 80), "success");

    const responseTimeMs = Date.now() - startTime;

    recordBehavioralSignal({
      sessionId: sid,
      agentId: routing.agentId,
      timestamp: Date.now(),
      engagementState: behavioral.engagementState,
      objectionTypes: behavioral.detectedObjections.map((o) => o.type),
      sentimentLevel: behavioral.sentiment.level,
      patternUsed: behavioral.behavioralHash,
      behavioralHash: behavioral.behavioralHash,
      convertedToAction: false,
      responseTimeMs,
    });

    await writeAudit({
      eventType: "API_CALL",
      action: `AI Mode query → ${agent.name}: ${message.slice(0, 100)}`,
      actorId: userId,
      severity: escalation.escalate ? "WARN" : "INFO",
      metadata: {
        agentId: routing.agentId,
        sessionId: sid,
        confidence: routing.confidence,
        engagementState: behavioral.engagementState,
        sentiment: behavioral.sentiment.level,
        objectionsDetected: behavioral.detectedObjections.length,
        escalated: escalation.escalate,
        behavioralHash: behavioral.behavioralHash,
        responseTimeMs,
      },
    });

    const proofData = JSON.stringify({
      sid,
      message: message.slice(0, 200),
      agentId: routing.agentId,
      engagementState: behavioral.engagementState,
      sentiment: behavioral.sentiment.level,
      behavioralHash: behavioral.behavioralHash,
      ts: Date.now(),
    });
    const proofHash = crypto.createHash("sha256").update(proofData).digest("hex");

    res.json({
      reply,
      sessionId: sid,
      routedTo: {
        id: routing.agentId,
        name: agent.name,
        color: agent.color,
        tagline: agent.tagline,
        confidence: routing.confidence,
      },
      engagement: {
        state: behavioral.engagementState,
        sentiment: behavioral.sentiment.level,
        objectionsDetected: behavioral.detectedObjections.length,
        escalated: escalation.escalate,
      },
      relatedTopics: relatedTopics.slice(0, 4),
      proofHash,
      behavioralHash: behavioral.behavioralHash,
      architect: "Ronald Antonio Cadet",
    });
  } catch (err) {
    logMeshAction("concierge", "AI Mode error", String(err), "pending");

    const fallback = `${agent.name} is standing by. Your request has been logged and routed. ONYX acts; you confirm.`;
    session.history.push({ role: "assistant", text: fallback });

    res.json({
      reply: fallback,
      sessionId: sid,
      routedTo: {
        id: routing.agentId,
        name: agent.name,
        color: agent.color,
        tagline: agent.tagline,
        confidence: routing.confidence,
      },
      engagement: {
        state: behavioral.engagementState,
        sentiment: behavioral.sentiment.level,
        objectionsDetected: behavioral.detectedObjections.length,
        escalated: false,
      },
      relatedTopics: relatedTopics.slice(0, 4),
      proofHash: crypto.createHash("sha256").update(`${sid}-${Date.now()}`).digest("hex"),
      behavioralHash: behavioral.behavioralHash,
      architect: "Ronald Antonio Cadet",
    });
  }
});

export default router;
