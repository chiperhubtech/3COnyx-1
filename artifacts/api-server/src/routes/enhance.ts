/**
 * 3C Onyx — AI Enhancement Layer
 * ─────────────────────────────────────────────────────────────────────
 * POST /enhance
 *
 * Takes a structured system output and converts it into a warm,
 * personalized explanation using the existing multi-model AI router.
 *
 * ARCHITECTURE: This is Layer 2 of the dual-layer AI design.
 * Layer 1 (ONYX Concierge + Orchestrator) makes the DECISION.
 * Layer 2 (this endpoint) EXPLAINS and PERSONALIZES the decision.
 *
 * Consumer mode → warm, 1-2 sentences, "we handle it", no jargon.
 * Professional mode → full reasoning, comparisons, confidence, logic.
 *
 * SAFETY: If this layer fails, callers fall back to structured output.
 * This layer NEVER overrides system decisions — only enhances explanation.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { route as aiRoute } from "../lib/ai-router";
import { logger } from "../lib/logger";

const router: IRouter = Router();

export type EnhanceMode = "consumer" | "professional";

const CONSUMER_SYSTEM = `You are ONYX, the 3C Onyx AI. Your job is to explain a recommendation in 1-3 warm, confident sentences.

Rules:
- Sound like a trusted advisor who just saved the user time and money
- No jargon. No bullet points. No markdown.
- Lead with the outcome, not the process
- End with confidence: "We can handle everything right now" or similar
- Max 60 words
- Never say "AI" or "algorithm" or "system"`;

const PROFESSIONAL_SYSTEM = `You are ONYX, the 3C Onyx AI concierge for industry professionals.
Provide a precise, data-driven breakdown of this recommendation.

Format:
1. Primary recommendation (1 sentence, direct)
2. Reasoning: why this option, what was compared, confidence level
3. Pricing logic: how the figure was derived, what's included/excluded
4. Risk factors: what could change this recommendation
5. Next action: what happens if they proceed

Be precise. Use numbers. Max 120 words. No fluff.`;

interface EnhanceBody {
  structuredOutput: Record<string, unknown> | string;
  mode?: EnhanceMode;
  context?: string;
}

router.post("/enhance", async (req: Request, res: Response) => {
  const { structuredOutput, mode = "consumer", context } = req.body as EnhanceBody;

  if (!structuredOutput) {
    res.status(400).json({ error: "structuredOutput is required" });
    return;
  }

  const systemPrompt = mode === "professional" ? PROFESSIONAL_SYSTEM : CONSUMER_SYSTEM;

  const outputText = typeof structuredOutput === "string"
    ? structuredOutput
    : JSON.stringify(structuredOutput, null, 2);

  const userContent = context
    ? `Context: ${context}\n\nStructured Output:\n${outputText}`
    : `Structured Output:\n${outputText}`;

  const t0 = Date.now();
  try {
    const result = await aiRoute(
      [
        { role: "system",    content: systemPrompt },
        { role: "user",      content: userContent },
      ],
      "conversation",
      systemPrompt,
    );

    res.json({
      enhancedText: result.content.trim(),
      mode,
      provider:    result.provider,
      model:       result.model,
      durationMs:  Date.now() - t0,
    });
  } catch (err) {
    logger.warn({ err, mode }, "[enhance] AI enhancement failed — returning raw output");
    // Safe fallback: return a sensible default so the UI degrades gracefully
    res.json({
      enhancedText: mode === "consumer"
        ? "We've found the best option for you. We can handle everything right now."
        : `Recommendation summary: ${outputText.slice(0, 200)}`,
      mode,
      fallback:   true,
      durationMs: Date.now() - t0,
    });
  }
});

export default router;
