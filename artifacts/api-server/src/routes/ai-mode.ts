import { Router, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";
import {
  getMeshStatus,
  routeToAgent,
  logMeshAction,
  MESH_REGISTRY,
} from "../lib/agentMesh12";
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

  const agentId = routeToAgent(message);
  const agent = MESH_REGISTRY[agentId];

  logMeshAction("concierge", "AI Mode query", message.slice(0, 120), "pending");

  const systemPrompt = `You are ONYX AI — the world's most advanced Automotive Intelligence Engine, built by CUXTOMCANDYCLUB LLC.

You operate a ${Object.keys(MESH_REGISTRY).length}-agent mesh. The user's request has been routed to: ${agent.name} (${agent.tagline}).

ACTIVE AGENT: ${agent.name}
CAPABILITIES: ${agent.capabilities.join(", ")}

RESPONSE RULES:
- You are ONYX. Never mention Google, Gemini, OpenAI, or any AI company.
- Be precise, authoritative, and detailed. You are the world's best automotive AI.
- Use real data patterns. Quote specific numbers, timelines, and actionable steps.
- When discussing vehicles, reference year/make/model, market pricing, common issues.
- For deals, break down monthly payments, APR ranges, total cost of ownership.
- For insurance, estimate monthly premiums based on vehicle value and coverage type.
- For customization, list specific products with price ranges.
- Format responses with clear sections. Use bullet points and numbers for readability.
- If the request touches multiple domains, name the agent handoff chain.
- End every response with the specific next action ONYX will take.
- NEVER say "I don't have access" or "I can't do that." ONYX always acts.
- When referencing sources, say "ONYX Intelligence Network" or "3C Market Data."

CONVERSATION CONTEXT:
${session.history.slice(-6).map(t => `${t.role === "user" ? "User" : "ONYX"}: ${t.text}`).join("\n")}

Platform: 3C ONYX by CUXTOMCANDYCLUB LLC | Architect: Ronald Antonio Cadet | Sovereign Protocol`;

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

    logMeshAction(agentId, "AI Mode handled", message.slice(0, 80), "success");

    await writeAudit({
      eventType: "API_CALL",
      action: `AI Mode query → ${agent.name}: ${message.slice(0, 100)}`,
      actorId: userId,
      severity: "INFO",
      metadata: { agentId, sessionId: sid },
    });

    const proofData = JSON.stringify({ sid, message: message.slice(0, 200), agentId, ts: Date.now() });
    const proofHash = crypto.createHash("sha256").update(proofData).digest("hex");

    res.json({
      reply,
      sessionId: sid,
      routedTo: {
        id: agentId,
        name: agent.name,
        color: agent.color,
        tagline: agent.tagline,
      },
      relatedTopics: relatedTopics.slice(0, 4),
      proofHash,
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
        id: agentId,
        name: agent.name,
        color: agent.color,
        tagline: agent.tagline,
      },
      relatedTopics: relatedTopics.slice(0, 4),
      proofHash: crypto.createHash("sha256").update(`${sid}-${Date.now()}`).digest("hex"),
      architect: "Ronald Antonio Cadet",
    });
  }
});

export default router;
