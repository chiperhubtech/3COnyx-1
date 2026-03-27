/**
 * 3C ONYX — Family Office Governance Engine API
 *
 * Powers the ONYX Sovereign Wealth governance layer.
 * AI-driven charter alignment, trust structure recommendations,
 * and asset integration for Dynasty-tier family offices.
 *
 * Routes:
 *   GET  /api/family-office/mission          — Get user's mission statement
 *   POST /api/family-office/mission          — Save/update mission statement
 *   POST /api/family-office/analyze          — AI governance analysis
 *   GET  /api/family-office/analyses         — Analysis history
 *   POST /api/family-office/assets           — Add asset to registry
 *   GET  /api/family-office/assets           — Get asset registry
 *   DELETE /api/family-office/assets/:id     — Remove asset
 */

import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  familyMissionsTable,
  familyGovernanceAnalysesTable,
  familyAssetsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { route as aiRoute } from "../lib/ai-router";

type AuthedReq = Request & {
  user: { id: number; name: string; role: string };
};

const router = Router();

// ─── System Prompt — ONYX Family Governance AI ────────────────────────────────
const GOVERNANCE_SYSTEM_PROMPT = `You are the ONYX Family Office Governance Engine — a world-class AI advisor for multi-generational wealth governance, asset protection, and family charter alignment.

You combine the expertise of:
- A top-tier Estate Planning Attorney (Dynasty Trusts, GRATs, LLCs)
- A Family Office CFO (cash flow, tax optimization, asset allocation)
- A Wealth Preservation Strategist (sovereign structures, legacy planning)

Your analysis is specific, legally sophisticated, and actionable. You never give vague advice.

ALWAYS respond with valid JSON matching this EXACT structure — no markdown, no explanation outside the JSON:
{
  "alignmentScore": <integer 1-10>,
  "alignmentRationale": "<2-3 sentence explanation of the score>",
  "charterConflicts": ["<specific conflict>", "<specific conflict>"],
  "trustGuardrail": "<one specific, legally precise condition to add to the Trust document>",
  "charterIntegration": "<specific values and behavioral guidelines the family should uphold regarding this asset — 2-3 sentences>",
  "trustStructure": {
    "recommendation": "<exactly one of: Dynasty Trust | Irrevocable Trust | LLC | GRAT | S-Corp | FLP>",
    "rationale": "<why this structure is optimal — 2 sentences>",
    "taxAdvantage": "<specific tax benefit with approximate savings methodology>"
  },
  "officeExecutionSteps": [
    "<Step 1: specific action with responsible party and timeline>",
    "<Step 2: specific action with responsible party and timeline>",
    "<Step 3: specific action with responsible party and timeline>"
  ]
}

If charterConflicts is empty, return an empty array [].
Return ONLY the JSON object. No preamble, no markdown.`;

// ─── GET /api/family-office/mission ───────────────────────────────────────────
router.get("/api/family-office/mission", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const [mission] = await db
    .select()
    .from(familyMissionsTable)
    .where(eq(familyMissionsTable.userId, userId))
    .orderBy(desc(familyMissionsTable.updatedAt))
    .limit(1);
  res.json({ mission: mission ?? null });
});

// ─── POST /api/family-office/mission ──────────────────────────────────────────
router.post("/api/family-office/mission", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const {
    familyName, missionStatement,
    pillarOne, pillarTwo, pillarThree,
    pillarOneDesc, pillarTwoDesc, pillarThreeDesc,
    coreValues,
  } = req.body as Record<string, string>;

  if (!missionStatement?.trim()) {
    res.status(400).json({ error: "Mission statement is required." });
    return;
  }

  const [existing] = await db
    .select({ id: familyMissionsTable.id })
    .from(familyMissionsTable)
    .where(eq(familyMissionsTable.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(familyMissionsTable)
      .set({
        familyName: familyName?.trim() || "My Family Office",
        missionStatement: missionStatement.trim(),
        pillarOne:       pillarOne?.trim()       || null,
        pillarTwo:       pillarTwo?.trim()       || null,
        pillarThree:     pillarThree?.trim()     || null,
        pillarOneDesc:   pillarOneDesc?.trim()   || null,
        pillarTwoDesc:   pillarTwoDesc?.trim()   || null,
        pillarThreeDesc: pillarThreeDesc?.trim() || null,
        coreValues:      coreValues?.trim()      || null,
        updatedAt:       new Date(),
      })
      .where(eq(familyMissionsTable.id, existing.id));
    res.json({ ok: true, id: existing.id, action: "updated" });
  } else {
    const [created] = await db
      .insert(familyMissionsTable)
      .values({
        userId,
        familyName:       familyName?.trim()       || "My Family Office",
        missionStatement: missionStatement.trim(),
        pillarOne:        pillarOne?.trim()         || null,
        pillarTwo:        pillarTwo?.trim()         || null,
        pillarThree:      pillarThree?.trim()       || null,
        pillarOneDesc:    pillarOneDesc?.trim()     || null,
        pillarTwoDesc:    pillarTwoDesc?.trim()     || null,
        pillarThreeDesc:  pillarThreeDesc?.trim()   || null,
        coreValues:       coreValues?.trim()        || null,
      })
      .returning({ id: familyMissionsTable.id });
    res.json({ ok: true, id: created?.id, action: "created" });
  }
});

// ─── POST /api/family-office/analyze ──────────────────────────────────────────
router.post("/api/family-office/analyze", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const {
    missionStatement,
    proposedAction,
    assetName,
    assetType,
    assetValue,
    missionId,
  } = req.body as {
    missionStatement: string;
    proposedAction:   string;
    assetName?:       string;
    assetType?:       string;
    assetValue?:      string;
    missionId?:       number;
  };

  if (!missionStatement?.trim()) {
    res.status(400).json({ error: "Mission statement is required for analysis." });
    return;
  }
  if (!proposedAction?.trim()) {
    res.status(400).json({ error: "Proposed action is required for analysis." });
    return;
  }

  // Build the user prompt
  const userPrompt = [
    `FAMILY MISSION STATEMENT:\n${missionStatement.trim()}`,
    `\nPROPOSED ACTION:\n${proposedAction.trim()}`,
    assetName  ? `\nASSET NAME: ${assetName}` : "",
    assetType  ? `ASSET TYPE: ${assetType}` : "",
    assetValue ? `ESTIMATED VALUE: $${Number(assetValue).toLocaleString()}` : "",
  ].filter(Boolean).join("\n");

  let parsed: Record<string, unknown>;
  let provider = "unknown";

  try {
    const result = await aiRoute(
      [{ role: "user", content: userPrompt }],
      "analysis",
      GOVERNANCE_SYSTEM_PROMPT,
    );
    provider = result.provider;

    // Parse JSON response — handle markdown fences if present
    const raw = result.content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    res.status(502).json({
      error: "ONYX Neural analysis temporarily unavailable. Please try again.",
      detail: (err as Error).message?.slice(0, 120),
    });
    return;
  }

  // Extract fields from parsed JSON
  const alignmentScore     = Number(parsed.alignmentScore ?? 0);
  const alignmentRationale = String(parsed.alignmentRationale ?? "");
  const charterConflicts   = Array.isArray(parsed.charterConflicts)
    ? JSON.stringify(parsed.charterConflicts)
    : "[]";
  const trustGuardrail     = String(parsed.trustGuardrail ?? "");
  const charterIntegration = String(parsed.charterIntegration ?? "");
  const trustStructureObj  = (parsed.trustStructure ?? {}) as Record<string, string>;
  const trustStructure     = String(trustStructureObj.recommendation ?? "");
  const trustRationale     = String(trustStructureObj.rationale ?? "");
  const taxAdvantage       = String(trustStructureObj.taxAdvantage ?? "");
  const officeSteps        = Array.isArray(parsed.officeExecutionSteps)
    ? JSON.stringify(parsed.officeExecutionSteps)
    : "[]";

  // Persist to database
  const [analysis] = await db
    .insert(familyGovernanceAnalysesTable)
    .values({
      userId,
      missionId:            missionId ?? null,
      proposedAction:       proposedAction.trim(),
      assetName:            assetName?.trim() || null,
      assetType:            assetType?.trim() || null,
      assetValue:           assetValue ? String(assetValue) : null,
      alignmentScore:       String(alignmentScore),
      alignmentRationale,
      charterConflicts,
      trustGuardrail,
      charterIntegration,
      trustStructure,
      trustRationale,
      taxAdvantage,
      officeExecutionSteps: officeSteps,
      aiProvider:           provider,
    })
    .returning({ id: familyGovernanceAnalysesTable.id });

  res.json({
    ok: true,
    analysisId: analysis?.id,
    alignmentScore,
    alignmentRationale,
    charterConflicts: JSON.parse(charterConflicts) as string[],
    trustGuardrail,
    charterIntegration,
    trustStructure: {
      recommendation: trustStructure,
      rationale:      trustRationale,
      taxAdvantage,
    },
    officeExecutionSteps: JSON.parse(officeSteps) as string[],
    provider,
  });
});

// ─── GET /api/family-office/analyses ──────────────────────────────────────────
router.get("/api/family-office/analyses", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const analyses = await db
    .select()
    .from(familyGovernanceAnalysesTable)
    .where(eq(familyGovernanceAnalysesTable.userId, userId))
    .orderBy(desc(familyGovernanceAnalysesTable.analyzedAt))
    .limit(20);
  res.json({ analyses });
});

// ─── POST /api/family-office/assets ───────────────────────────────────────────
router.post("/api/family-office/assets", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const { name, assetType, estimatedValue, trustStructure, notes, analysisId } = req.body as {
    name:            string;
    assetType:       string;
    estimatedValue?: string;
    trustStructure?: string;
    notes?:          string;
    analysisId?:     number;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "Asset name is required." });
    return;
  }
  const [asset] = await db
    .insert(familyAssetsTable)
    .values({
      userId,
      name:            name.trim(),
      assetType:       assetType?.trim() || "other",
      estimatedValue:  estimatedValue ? String(estimatedValue) : null,
      trustStructure:  trustStructure?.trim() || null,
      notes:           notes?.trim() || null,
      analysisId:      analysisId ?? null,
      status:          "active",
    })
    .returning();
  res.json({ ok: true, asset });
});

// ─── GET /api/family-office/assets ────────────────────────────────────────────
router.get("/api/family-office/assets", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const assets = await db
    .select()
    .from(familyAssetsTable)
    .where(eq(familyAssetsTable.userId, userId))
    .orderBy(desc(familyAssetsTable.createdAt));
  res.json({ assets });
});

// ─── DELETE /api/family-office/assets/:id ─────────────────────────────────────
router.delete("/api/family-office/assets/:id", requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthedReq).user;
  const assetId = Number(req.params["id"]);
  if (isNaN(assetId)) { res.status(400).json({ error: "Invalid asset id." }); return; }
  await db
    .delete(familyAssetsTable)
    .where(eq(familyAssetsTable.id, assetId));
  res.json({ ok: true });
});

export default router;
