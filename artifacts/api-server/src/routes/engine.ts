/**
 * 3C Onyx — Decision Engine API
 *
 * Exposes the rule-based decision engine over HTTP.
 * All routes work with ZERO LLM dependency.
 *
 * Routes:
 *   GET  /api/engine/status
 *   POST /api/engine/score/vehicle
 *   POST /api/engine/score/shop
 *   POST /api/engine/fraud/check
 *   POST /api/engine/feedback
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  scoreVehicle,
  scoreShop,
  detectFraud,
  getEngineStatus,
  type VehicleInput,
  type ShopInput,
  type FraudInput,
} from "../lib/decisionEngine";
import { db } from "@workspace/db";
import { engineDecisions } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ── Engine health / status ────────────────────────────────────────────────────

router.get("/engine/status", (_req: Request, res: Response) => {
  res.json(getEngineStatus());
});

// ── Vehicle scoring ───────────────────────────────────────────────────────────

router.post("/engine/score/vehicle", async (req: Request, res: Response) => {
  const input = req.body as VehicleInput;

  if (!input?.vehicleId || !input.askingPrice || !input.marketAveragePrice) {
    res.status(400).json({ error: "vehicleId, askingPrice, and marketAveragePrice are required" });
    return;
  }

  const decision = scoreVehicle(input);

  // Persist decision for feedback loop
  try {
    await db.insert(engineDecisions).values({
      decisionId: decision.id,
      entityType: decision.entityType,
      entityId: decision.entityId,
      recommendation: decision.recommendation,
      confidenceScore: decision.confidenceScore,
      reasoning: decision.reasoning,
      flags: decision.flags,
      estimatedSavings: decision.estimatedSavings ? String(decision.estimatedSavings) : null,
      scores: decision.scores,
      source: "engine",
    });
  } catch {
    // Non-fatal — decision still returned
  }

  res.json({ decision });
});

// ── Shop scoring ──────────────────────────────────────────────────────────────

router.post("/engine/score/shop", async (req: Request, res: Response) => {
  const input = req.body as ShopInput;

  if (!input?.shopId || !input.rating || !input.estimatedCost) {
    res.status(400).json({ error: "shopId, rating, and estimatedCost are required" });
    return;
  }

  const decision = scoreShop(input);

  try {
    await db.insert(engineDecisions).values({
      decisionId: decision.id,
      entityType: decision.entityType,
      entityId: decision.entityId,
      recommendation: decision.recommendation,
      confidenceScore: decision.confidenceScore,
      reasoning: decision.reasoning,
      flags: decision.flags,
      scores: decision.scores,
      source: "engine",
    });
  } catch {
    // Non-fatal
  }

  res.json({ decision });
});

// ── Fraud detection ───────────────────────────────────────────────────────────

router.post("/engine/fraud/check", async (req: Request, res: Response) => {
  const input = req.body as FraudInput;

  if (!input?.listingId || !input.askingPrice || !input.marketAveragePrice) {
    res.status(400).json({ error: "listingId, askingPrice, and marketAveragePrice are required" });
    return;
  }

  const decision = detectFraud(input);

  try {
    await db.insert(engineDecisions).values({
      decisionId: decision.id,
      entityType: decision.entityType,
      entityId: decision.entityId,
      recommendation: decision.recommendation,
      confidenceScore: decision.confidenceScore,
      reasoning: decision.reasoning,
      flags: decision.flags,
      scores: decision.scores,
      source: "engine",
    });
  } catch {
    // Non-fatal
  }

  res.json({ decision });
});

// ── Feedback loop — record user action on a decision ─────────────────────────

router.post("/engine/feedback", async (req: Request, res: Response) => {
  const { decisionId, userAction, outcome, outcomeValue } = req.body ?? {};

  if (!decisionId || !userAction) {
    res.status(400).json({ error: "decisionId and userAction are required" });
    return;
  }

  const validActions = ["accepted", "rejected", "ignored"];
  const validOutcomes = ["purchased", "saved", "complaint", "no_action"];
  if (!validActions.includes(userAction)) {
    res.status(400).json({ error: `userAction must be one of: ${validActions.join(", ")}` });
    return;
  }

  try {
    await db
      .update(engineDecisions)
      .set({
        userAction,
        outcome: validOutcomes.includes(outcome) ? outcome : null,
        outcomeValue: outcomeValue != null ? String(outcomeValue) : null,
        resolvedAt: new Date(),
      })
      .where(eq(engineDecisions.decisionId, decisionId));

    res.json({ recorded: true, decisionId, userAction });
  } catch {
    res.status(500).json({ error: "Failed to record feedback" });
  }
});

// ── Decision history (admin/analytics) ───────────────────────────────────────

router.get("/engine/decisions", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(engineDecisions)
      .limit(100);
    res.json({ decisions: rows, total: rows.length });
  } catch {
    res.json({ decisions: [], total: 0 });
  }
});

export default router;
