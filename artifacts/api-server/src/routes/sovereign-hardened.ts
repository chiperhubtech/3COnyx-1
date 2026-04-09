/**
 * 3C ONYX — Sovereign Hardened Infrastructure Routes
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-HARDENED-INFRA-SOVEREIGN
 *
 * Exposes the hardened infrastructure layer:
 *   - State Transition Hardener (validate/enforce state transitions)
 *   - Michelin Demand Engine (friction → upgrade path scoring)
 *   - Distribution Hub Engine (auto-upgrade nodes to hubs)
 *   - Idempotency Guard (duplicate prevention stats)
 *
 * These are the "Institutional Viability" endpoints — the proof that
 * the system is "Unbreakable" for PE or global OEM partnerships.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { aiLimiter } from "../middlewares/rateLimiter";
import {
  validateTransition,
  getValidTransitions,
  getDomainStates,
  getHardenerStatus,
} from "../lib/stateTransitionHardener";
import {
  assessDemand,
  getMichelinEngineStatus,
  type FrictionEvent,
} from "../lib/michelinDemandEngine";
import {
  assessUpgrade,
  getHubEngineStatus,
  type NodeProfile,
  type HubCategory,
  type NodeTier,
} from "../lib/distributionHubEngine";
import { getIdempotencyStats } from "../middlewares/idempotencyGuard";

const router = Router();
const ARCHITECT = "Ronald Antonio Cadet";

router.get("/hardened/status", (_req: Request, res: Response) => {
  res.json({
    architect: ARCHITECT,
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "Sovereign Hardened Infrastructure",
    version: "1.0.0",
    layers: {
      stateHardener: getHardenerStatus(),
      michelinDemand: getMichelinEngineStatus(),
      distributionHub: getHubEngineStatus(),
      idempotencyGuard: getIdempotencyStats(),
    },
    status: "ARMED",
    timestamp: new Date().toISOString(),
  });
});

router.get("/hardened/state-hardener/status", (_req: Request, res: Response) => {
  res.json(getHardenerStatus());
});

router.post("/hardened/state-hardener/validate", requireAuth, (req: Request, res: Response) => {
  const { domain, from, to } = req.body || {};
  if (!domain || !from || !to) {
    res.status(400).json({ error: "domain, from, and to are required" });
    return;
  }
  const result = validateTransition(domain, from, to);
  res.status(result.valid ? 200 : 422).json(result);
});

router.get("/hardened/state-hardener/transitions/:domain/:state", (req: Request, res: Response) => {
  const domain = req.params.domain as string;
  const state = req.params.state as string;
  const valid = getValidTransitions(domain, state);
  const allStates = getDomainStates(domain);
  res.json({
    domain,
    currentState: state,
    validTransitions: valid,
    allStates,
    architect: ARCHITECT,
  });
});

router.get("/hardened/michelin/status", (_req: Request, res: Response) => {
  res.json(getMichelinEngineStatus());
});

const VALID_FRICTION_EVENTS = new Set<string>([
  "ACCIDENT", "BREAKDOWN", "RECALL", "LEASE_EXPIRY", "HIGH_MILEAGE",
  "FAILED_INSPECTION", "WARRANTY_EXPIRED", "LOAN_PAYOFF_NEAR", "INSURANCE_SPIKE",
  "REPAIR_EXCEEDS_VALUE", "FAMILY_SIZE_CHANGE", "RELOCATION",
  "FUEL_COST_PRESSURE", "TECHNOLOGY_GAP", "SAFETY_RATING_DROP",
]);

router.post("/hardened/michelin/assess", requireAuth, aiLimiter, (req: Request, res: Response) => {
  const { frictionEvents, vehicleAge, vehicleMileage, ownerTenure } = req.body || {};
  if (!Array.isArray(frictionEvents) || frictionEvents.length === 0) {
    res.status(400).json({ error: "frictionEvents array is required" });
    return;
  }
  const validated = frictionEvents.filter((e: unknown) => typeof e === "string" && VALID_FRICTION_EVENTS.has(e));
  if (validated.length === 0) {
    res.status(400).json({ error: "No valid friction events provided", validEvents: [...VALID_FRICTION_EVENTS] });
    return;
  }
  const assessment = assessDemand(
    validated as FrictionEvent[],
    typeof vehicleAge === "number" ? vehicleAge : undefined,
    typeof vehicleMileage === "number" ? vehicleMileage : undefined,
    typeof ownerTenure === "number" ? ownerTenure : undefined,
  );
  res.json(assessment);
});

router.get("/hardened/hub/status", (_req: Request, res: Response) => {
  res.json(getHubEngineStatus());
});

const VALID_TIERS = new Set(["MEMBER", "CONNECTOR", "HUB", "SUPER_HUB", "DISTRIBUTION_CENTER"]);
const VALID_CATEGORIES = new Set(["ATTORNEY", "RIDESHARE", "SHOP", "DEALER", "FLEET", "INFLUENCER", "COMMUNITY", "GENERAL"]);

router.post("/hardened/hub/assess", requireAuth, (req: Request, res: Response) => {
  const { userId, currentTier, category, referralCount, settledDeals, networkSize, totalRevenue } = req.body || {};
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const tier = typeof currentTier === "string" && VALID_TIERS.has(currentTier) ? currentTier : "MEMBER";
  const cat = typeof category === "string" && VALID_CATEGORIES.has(category) ? category : "GENERAL";

  const profile: NodeProfile = {
    userId: String(userId),
    currentTier: tier as NodeTier,
    category: cat as HubCategory,
    referralCount: typeof referralCount === "number" ? referralCount : 0,
    settledDeals: typeof settledDeals === "number" ? settledDeals : 0,
    networkSize: typeof networkSize === "number" ? networkSize : 0,
    totalRevenue: typeof totalRevenue === "number" ? totalRevenue : 0,
    hubScore: 0,
  };

  const assessment = assessUpgrade(profile);
  res.json(assessment);
});

router.get("/hardened/idempotency/stats", requireAuth, (_req: Request, res: Response) => {
  res.json(getIdempotencyStats());
});

export default router;
