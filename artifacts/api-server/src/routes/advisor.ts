import { Router, type IRouter, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../middlewares/requireAuth";
import { aiLimiter } from "../middlewares/rateLimiter";
import { getCuratedEnrichedListings, type EnrichedListing } from "./marketcheck";
import crypto from "crypto";

/**
 * ONYX Advisor — additive upgrade inspired by market-leading AI car-buying
 * assistants. Powers the /advisor page:
 *   GET  /advisor/picks        — AI Picks: ranked deal feed with a reason per pick (public)
 *   GET  /advisor/intents      — intent chips for the advisor chat (public)
 *   POST /advisor/quote-audit  — paste a dealer quote, ONYX audits it line by line (auth)
 */
const router: IRouter = Router();

// ─── AI Picks ─────────────────────────────────────────────────────────────────

interface AdvisorPick extends EnrichedListing {
  rank: number;
  pick_score: number;
  pick_reason: string;
}

function pickReason(l: EnrichedListing): string {
  const reasons: string[] = [];
  if (l.savings_vs_retail > 0) {
    reasons.push(`$${l.savings_vs_retail.toLocaleString()} under regional retail`);
  }
  if (l.guardian_health_score >= 90) {
    reasons.push(`Guardian score ${l.guardian_health_score} — top-tier condition signals`);
  } else if (l.guardian_health_score >= 80) {
    reasons.push(`Guardian score ${l.guardian_health_score}`);
  }
  if (l.dom != null && l.dom <= 3) {
    reasons.push(`only ${l.dom} day${l.dom === 1 ? "" : "s"} on market — moving fast`);
  }
  if (l.miles < 5000) {
    reasons.push(`${l.miles.toLocaleString()} miles — effectively new`);
  }
  return reasons.length
    ? reasons.join(" · ")
    : "Priced within band for its segment — ONYX is monitoring for movement";
}

router.get("/advisor/picks", (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "8"), 10) || 8, 24);
  const listings = getCuratedEnrichedListings();

  const scored = listings
    .map((l) => {
      const savingsPct = l.market_avg > 0 ? (l.savings_vs_retail / l.market_avg) * 100 : 0;
      const velocity = l.dom != null ? Math.max(0, 10 - l.dom) : 0;
      const pick_score = Math.round(
        l.guardian_health_score * 0.5 + savingsPct * 3 + velocity * 1.5,
      );
      return { ...l, pick_score, pick_reason: pickReason(l) };
    })
    .sort((a, b) => b.pick_score - a.pick_score)
    .slice(0, limit)
    .map((l, i) => ({ ...l, rank: i + 1 }) as AdvisorPick);

  res.json({
    picks: scored,
    totalCount: scored.length,
    generatedAt: new Date().toISOString(),
    engine: "ONYX Advisor — Intelligence-ranked market picks",
  });
});

// ─── Intent chips ─────────────────────────────────────────────────────────────

const ADVISOR_INTENTS = [
  {
    id: "specific",
    title: "I'm Looking for a Specific Vehicle",
    subtitle: "I know what I want",
    seedPrompt: "I'm looking for a specific vehicle. Help me find the best deal on it.",
  },
  {
    id: "browsing",
    title: "Just Browsing Deals Near Me",
    subtitle: "I don't know what I want yet",
    seedPrompt: "I'm browsing. Show me the strongest deals on the market right now and why they're strong.",
  },
  {
    id: "enthusiast",
    title: "I'm a Car Enthusiast",
    subtitle: "Let's talk specs and performance",
    seedPrompt: "I'm an enthusiast. Let's talk specs, performance, and what's undervalued right now.",
  },
  {
    id: "quote",
    title: "Audit My Dealer Quote",
    subtitle: "Paste a quote — ONYX finds the padding",
    seedPrompt: "__QUOTE_AUDIT__",
  },
];

router.get("/advisor/intents", (_req: Request, res: Response) => {
  res.json({ intents: ADVISOR_INTENTS });
});

// ─── Quote Audit ──────────────────────────────────────────────────────────────

interface QuoteAuditResult {
  verdict: "FAIR" | "NEGOTIABLE" | "OVERPRICED";
  verdictSummary: string;
  estimatedOverchargeUsd: number;
  lineItems: Array<{
    item: string;
    quotedUsd: number | null;
    assessment: "fair" | "high" | "junk_fee" | "unknown";
    note: string;
  }>;
  redFlags: string[];
  negotiationScript: string[];
  fairTargetUsd: number | null;
}

const AUDIT_SYSTEM_PROMPT = `You are ONYX — the Automotive Intelligence Engine's dealer-quote auditor. A member pastes a dealer quote (out-the-door sheet, lease worksheet, finance menu, or free-form text). Audit it like the sharpest buyer's advocate in the industry.

Return ONLY valid JSON matching exactly this shape (no markdown, no commentary):
{
  "verdict": "FAIR" | "NEGOTIABLE" | "OVERPRICED",
  "verdictSummary": "one tight sentence",
  "estimatedOverchargeUsd": number,
  "lineItems": [{ "item": string, "quotedUsd": number | null, "assessment": "fair" | "high" | "junk_fee" | "unknown", "note": "why, in one sentence" }],
  "redFlags": ["specific red flags found"],
  "negotiationScript": ["exact sentences the member should say, in order"],
  "fairTargetUsd": number | null
}

Rules:
- Identify classic padding: doc fees above regional norms, nitrogen tires, VIN etching, paint/fabric protection, dealer add-on packs, inflated money factor / APR markup, GAP or warranty priced above market.
- Quote specific dollar amounts pulled from the text; use null when not stated.
- estimatedOverchargeUsd is the sum of everything above fair market.
- negotiationScript: 3-5 short, assertive, usable sentences.
- Never mention Google, Gemini, or any AI provider. You are ONYX.`;

router.post("/advisor/quote-audit", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  const { quoteText, vehicle } = req.body as { quoteText?: string; vehicle?: string };
  const text = (quoteText ?? "").trim();

  if (!text) {
    res.status(400).json({ error: "quoteText is required — paste the dealer quote" });
    return;
  }
  if (text.length > 12000) {
    res.status(400).json({ error: "Quote text too long — paste up to 12,000 characters" });
    return;
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user" as const,
          parts: [
            {
              text: `${vehicle ? `Vehicle context: ${vehicle}\n\n` : ""}DEALER QUOTE:\n${text}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let audit: QuoteAuditResult;
    try {
      audit = JSON.parse(raw.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim()) as QuoteAuditResult;
    } catch {
      req.log.error({ raw: raw.slice(0, 300) }, "Advisor quote-audit: model returned non-JSON");
      res.status(502).json({ error: "Audit engine returned an unreadable result — try again" });
      return;
    }

    const proofHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ text: text.slice(0, 500), verdict: audit.verdict, ts: Date.now() }))
      .digest("hex");

    res.json({ audit, proofHash, engine: "ONYX Quote Audit", auditedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "Advisor quote-audit failed");
    res.status(502).json({ error: "Quote audit temporarily unavailable — try again shortly" });
  }
});

export default router;
