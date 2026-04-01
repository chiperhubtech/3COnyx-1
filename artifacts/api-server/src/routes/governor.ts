/**
 * 3C ONYX — Fortress Governor API
 *
 * The AI Safety & Control Layer endpoints.
 *
 * POST /api/governor/evaluate   — Submit an action for Governor classification
 * GET  /api/governor/status     — Governor system status
 * POST /api/governor/simulate   — Simulate a Governor verdict (dev/demo)
 *
 * Architecture: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  govern,
  classifyTier,
  getGovernorStatus,
  type GovernorInput,
  type ActionDomain,
} from "../lib/governor";
import {
  scoreVehicle,
  scoreShop,
  detectFraud,
  type VehicleInput,
  type ShopInput,
  type FraudInput,
} from "../lib/decisionEngine";

const router = Router();

const VALID_DOMAINS: ActionDomain[] = [
  "vehicle_purchase",
  "financing",
  "insurance",
  "service_repair",
  "payment",
  "document_signing",
  "delivery",
  "referral",
  "inspection",
  "general",
];

router.post("/governor/evaluate", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Partial<GovernorInput>;
  const derivedUserId = req.user?.sub ? Number(req.user.sub) : undefined;

  if (!body.actionId || !body.domain || !body.description || body.confidence === undefined) {
    res.status(400).json({
      error: "Required: actionId, domain, description, confidence",
      validDomains: VALID_DOMAINS,
    });
    return;
  }

  if (!VALID_DOMAINS.includes(body.domain)) {
    res.status(400).json({
      error: `Invalid domain. Must be one of: ${VALID_DOMAINS.join(", ")}`,
    });
    return;
  }

  if (body.confidence < 0 || body.confidence > 100) {
    res.status(400).json({ error: "Confidence must be 0–100" });
    return;
  }

  const verdict = await govern({
    actionId: body.actionId,
    domain: body.domain,
    description: body.description,
    confidence: body.confidence,
    estimatedValue: body.estimatedValue,
    agentChain: body.agentChain,
    engineDecision: body.engineDecision,
    userId: derivedUserId,
    sessionId: body.sessionId,
    metadata: body.metadata,
  });

  const status = verdict.tier === "HALT" ? 202 : 200;
  res.status(status).json({ verdict });
});

router.post("/governor/evaluate-vehicle", requireAuth, async (req: Request, res: Response) => {
  const derivedUserId = req.user?.sub ? Number(req.user.sub) : undefined;

  const body = req.body as Partial<VehicleInput> & {
    actionId?: string;
    sessionId?: string;
    hasPhotos?: boolean;
    photoCount?: number;
    sellerContactedViaThirdParty?: boolean;
    paymentMethodRequested?: string;
  };

  if (
    !body.vehicleId ||
    body.askingPrice === undefined ||
    body.marketAveragePrice === undefined ||
    body.conditionScore === undefined
  ) {
    res.status(400).json({
      error: "Required: vehicleId, askingPrice, marketAveragePrice, conditionScore, mileage, vehicleAgeYears, blockchainFlags, blockchainEntriesCount, titleStateMatchesReg, listingDuplicates",
    });
    return;
  }

  const decision = scoreVehicle(body as VehicleInput);
  const fraud = detectFraud({
    listingId: body.vehicleId,
    askingPrice: body.askingPrice,
    marketAveragePrice: body.marketAveragePrice,
    vinListingCount: body.listingDuplicates ?? 0,
    hasPhotos: body.hasPhotos ?? false,
    photoCount: body.photoCount ?? 0,
    sellerBlockchainHistory: body.blockchainEntriesCount ?? 0,
    titleStateMatchesReg: body.titleStateMatchesReg ?? true,
    sellerContactedViaThirdParty: body.sellerContactedViaThirdParty ?? false,
    paymentMethodRequested: body.paymentMethodRequested,
  });

  const allFlags = [...new Set([...decision.flags, ...fraud.flags])];
  const allReasoning = [...new Set([...decision.reasoning, ...fraud.reasoning])];

  const mergedDecision = {
    ...decision,
    flags: allFlags,
    reasoning: allReasoning,
  };

  const verdict = await govern({
    actionId: body.actionId ?? `veh-${Date.now()}`,
    domain: "vehicle_purchase",
    description: `Vehicle purchase evaluation: ${body.vehicleId}`,
    confidence: decision.confidenceScore,
    estimatedValue: body.askingPrice,
    engineDecision: mergedDecision,
    userId: derivedUserId,
    sessionId: body.sessionId,
  });

  res.status(verdict.tier === "HALT" ? 202 : 200).json({
    verdict,
    engineDecision: mergedDecision,
    fraudAnalysis: {
      risk: fraud.recommendation,
      riskPoints: fraud.scores["riskPoints"],
      flags: fraud.flags,
    },
  });
});

router.post("/governor/evaluate-shop", requireAuth, async (req: Request, res: Response) => {
  const derivedUserId = req.user?.sub ? Number(req.user.sub) : undefined;
  const body = req.body as Partial<ShopInput> & { actionId?: string; sessionId?: string };

  if (
    !body.shopId ||
    body.rating === undefined ||
    body.estimatedCost === undefined ||
    body.userBudget === undefined
  ) {
    res.status(400).json({
      error: "Required: shopId, rating, reviewCount, estimatedCost, userBudget, distanceMiles, certifications, previousWorkOnVehicle",
    });
    return;
  }

  const decision = scoreShop(body as ShopInput);

  const verdict = await govern({
    actionId: body.actionId ?? `shop-${Date.now()}`,
    domain: "service_repair",
    description: `Service shop evaluation: ${body.shopId}`,
    confidence: decision.confidenceScore,
    estimatedValue: body.estimatedCost,
    engineDecision: decision,
    userId: derivedUserId,
    sessionId: body.sessionId,
  });

  res.status(verdict.tier === "HALT" ? 202 : 200).json({
    verdict,
    engineDecision: decision,
  });
});

router.post("/governor/simulate", async (req: Request, res: Response) => {
  const {
    confidence = 85,
    domain = "general",
    flags = [],
    estimatedValue,
  } = req.body as {
    confidence?: number;
    domain?: ActionDomain;
    flags?: string[];
    estimatedValue?: number;
  };

  const tier = classifyTier(confidence, domain as ActionDomain, flags, estimatedValue);

  res.json({
    simulation: true,
    input: { confidence, domain, flags, estimatedValue },
    tier,
    description: tier === "AUTO_EXECUTE"
      ? "This action would auto-execute with a single [Confirm] button."
      : tier === "SUGGEST"
        ? "This action would require explicit member approval with the Explainability Layer visible."
        : "This action would be HALTED and escalated to a human specialist immediately.",
    thresholds: {
      autoExecute: domain === "financing" || domain === "insurance" || domain === "payment" || domain === "document_signing"
        ? "≥95% confidence (high-risk domain)"
        : estimatedValue && estimatedValue >= 10_000
          ? "≥92% confidence (high-value transaction)"
          : "≥90% confidence",
      suggest: "70–90% (or tighter for high-risk/value)",
      halt: "<70% or critical safety flags",
    },
    architect: "Ronald Antonio Cadet",
  });
});

router.get("/governor/status", (_req: Request, res: Response) => {
  res.json(getGovernorStatus());
});

export default router;
