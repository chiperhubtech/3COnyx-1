/**
 * ONYX Agent Mesh — API Routes
 * /api/mesh/status  → full mesh state
 * /api/mesh/chat    → concierge routes to correct agent
 * /api/mesh/log     → trust agent action log
 * /api/mesh/route   → which agent handles a message
 */
import { Router, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  getMeshStatus,
  routeToAgent,
  logMeshAction,
  meshActionLog,
  MESH_REGISTRY,
} from "../lib/agentMesh12";

const router = Router();

// GET /api/mesh/status
router.get("/mesh/status", (_req: Request, res: Response) => {
  try {
    const status = getMeshStatus();
    logMeshAction("trust", "Mesh status polled", "Full 12-agent status returned", "success");
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ error: "Mesh status unavailable" });
  }
});

// GET /api/mesh/log
router.get("/mesh/log", (_req: Request, res: Response) => {
  res.json({ ok: true, actions: meshActionLog.slice(0, 50), total: meshActionLog.length });
});

// GET /api/mesh/route?q=message
router.get("/mesh/route", (req: Request, res: Response) => {
  const q = String(req.query.q || "");
  if (!q.trim()) {
    return res.status(400).json({ error: "Query required" });
  }
  const agentId = routeToAgent(q);
  const agent = MESH_REGISTRY[agentId];
  res.json({ ok: true, agentId, agentName: agent.name, color: agent.color, tagline: agent.tagline });
});

// POST /api/mesh/chat — AI Concierge powered by Gemini, routes to best agent
router.post("/mesh/chat", async (req: Request, res: Response) => {
  const { message, sessionId } = req.body as { message: string; sessionId?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message required" });
  }

  const agentId = routeToAgent(message);
  const agent = MESH_REGISTRY[agentId];

  logMeshAction("concierge", "Message received", message.slice(0, 120), "pending");

  const systemPrompt = `You are ONYX — the 3C Automotive Master AI Concierge for CUXTOMCANDYCLUB LLC.

You operate a 12-agent mesh. You have just routed the user's request to: ${agent.name} (${agent.tagline}).

ACTIVE AGENT: ${agent.name}
CAPABILITIES: ${agent.capabilities.join(", ")}

RESPONSE RULES:
- Respond as ONYX. Never mention Google, Gemini, or any AI company.
- Confirm which agent is handling the request and what action it is taking.
- Be precise, confident, and luxury in tone — the user never negotiates. ONYX acts; member confirms.
- If the request needs multiple agents, name the handoff chain.
- Keep responses under 120 words unless the user asks for detail.
- End every response with the next action ONYX will take on the user's behalf.

Platform: 3C ONYX by CUXTOMCANDYCLUB LLC | Founder: Ronald Antonio Cadet | Governing: Florida, USA`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: { systemInstruction: systemPrompt, temperature: 0.7, maxOutputTokens: 512 },
    });

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "ONYX is processing your request.";

    logMeshAction(agentId, "Request handled", message.slice(0, 80), "success");
    logMeshAction("trust", "Exchange logged", `User→${agent.name}: ${message.slice(0, 60)}`, "success");

    res.json({
      ok: true,
      reply,
      routedTo: { id: agentId, name: agent.name, color: agent.color, tagline: agent.tagline },
      sessionId: sessionId ?? `session-${Date.now()}`,
    });
  } catch (err) {
    logMeshAction("concierge", "Chat error", String(err), "pending");
    res.json({
      ok: true,
      reply: `${agent.name} is standing by. I've logged your request and will process it now. ONYX acts; you confirm.`,
      routedTo: { id: agentId, name: agent.name, color: agent.color, tagline: agent.tagline },
      sessionId: sessionId ?? `session-${Date.now()}`,
    });
  }
});

export default router;
