/**
 * 3C ONYX — Michelin Demand Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-MICHELIN-DEMAND-SOVEREIGN
 *
 * The Michelin Strategy: "Create such extreme mobility demand that vehicle
 * usage and upgrade frequency compound automatically."
 *
 * This engine transforms every friction event (accident, breakdown, recall,
 * lease expiry, high mileage) into a calculated upgrade path. It scores
 * "mobility demand pressure" and auto-triggers the appropriate agent mesh
 * response — from a soft nudge to a hard upgrade funnel.
 *
 * Named after the Michelin brothers who published free road guides to
 * increase tire demand by making people drive more. We create extreme
 * mobility demand so vehicle transactions compound.
 *
 * Friction Events → Demand Score → Upgrade Path → Auto-Trigger Agent
 */

import crypto from "crypto";
import { logger } from "./logger";

const ARCHITECT = "Ronald Antonio Cadet";
const SOVEREIGN = "CUXTOMCANDYCLUB LLC";
const ENGINE_VERSION = "1.0.0";

export type FrictionEvent =
  | "ACCIDENT"
  | "BREAKDOWN"
  | "RECALL"
  | "LEASE_EXPIRY"
  | "HIGH_MILEAGE"
  | "FAILED_INSPECTION"
  | "WARRANTY_EXPIRED"
  | "LOAN_PAYOFF_NEAR"
  | "INSURANCE_SPIKE"
  | "REPAIR_EXCEEDS_VALUE"
  | "FAMILY_SIZE_CHANGE"
  | "RELOCATION"
  | "FUEL_COST_PRESSURE"
  | "TECHNOLOGY_GAP"
  | "SAFETY_RATING_DROP";

export type DemandTier = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "EMERGENCY";

export type UpgradePathType =
  | "SOFT_NUDGE"
  | "VALUE_COMPARISON"
  | "UPGRADE_OFFER"
  | "URGENT_REPLACEMENT"
  | "EMERGENCY_SWAP"
  | "FLEET_TRANSITION";

interface FrictionProfile {
  baseScore: number;
  urgencyMultiplier: number;
  upgradeAffinity: number;
  agentTrigger: string;
  demandSignal: string;
}

const FRICTION_PROFILES: Record<FrictionEvent, FrictionProfile> = {
  ACCIDENT: {
    baseScore: 92,
    urgencyMultiplier: 1.8,
    upgradeAffinity: 0.95,
    agentTrigger: "deal",
    demandSignal: "Vehicle potentially totaled — replacement path active",
  },
  BREAKDOWN: {
    baseScore: 85,
    urgencyMultiplier: 1.6,
    upgradeAffinity: 0.88,
    agentTrigger: "service",
    demandSignal: "Reliability failure — upgrade economics favorable",
  },
  RECALL: {
    baseScore: 60,
    urgencyMultiplier: 1.2,
    upgradeAffinity: 0.55,
    agentTrigger: "service",
    demandSignal: "OEM recall — trust erosion creates upgrade window",
  },
  LEASE_EXPIRY: {
    baseScore: 78,
    urgencyMultiplier: 1.5,
    upgradeAffinity: 0.90,
    agentTrigger: "finance",
    demandSignal: "Lease ending — natural transition point",
  },
  HIGH_MILEAGE: {
    baseScore: 65,
    urgencyMultiplier: 1.1,
    upgradeAffinity: 0.70,
    agentTrigger: "deal",
    demandSignal: "Depreciation curve steep — trade window optimal",
  },
  FAILED_INSPECTION: {
    baseScore: 80,
    urgencyMultiplier: 1.4,
    upgradeAffinity: 0.85,
    agentTrigger: "service",
    demandSignal: "Compliance failure — replacement often cheaper than repair",
  },
  WARRANTY_EXPIRED: {
    baseScore: 55,
    urgencyMultiplier: 1.0,
    upgradeAffinity: 0.50,
    agentTrigger: "insurance",
    demandSignal: "Coverage gap — vulnerability creates urgency",
  },
  LOAN_PAYOFF_NEAR: {
    baseScore: 70,
    urgencyMultiplier: 1.3,
    upgradeAffinity: 0.80,
    agentTrigger: "finance",
    demandSignal: "Equity unlocked — upgrade with positive equity",
  },
  INSURANCE_SPIKE: {
    baseScore: 58,
    urgencyMultiplier: 1.1,
    upgradeAffinity: 0.45,
    agentTrigger: "insurance",
    demandSignal: "Premium increase — downsize/switch vehicle class",
  },
  REPAIR_EXCEEDS_VALUE: {
    baseScore: 95,
    urgencyMultiplier: 2.0,
    upgradeAffinity: 0.98,
    agentTrigger: "deal",
    demandSignal: "Repair cost exceeds vehicle value — immediate replacement",
  },
  FAMILY_SIZE_CHANGE: {
    baseScore: 72,
    urgencyMultiplier: 1.3,
    upgradeAffinity: 0.75,
    agentTrigger: "deal",
    demandSignal: "Lifestyle change — vehicle no longer fits needs",
  },
  RELOCATION: {
    baseScore: 62,
    urgencyMultiplier: 1.2,
    upgradeAffinity: 0.60,
    agentTrigger: "logistics",
    demandSignal: "Geographic change — different vehicle requirements",
  },
  FUEL_COST_PRESSURE: {
    baseScore: 50,
    urgencyMultiplier: 1.0,
    upgradeAffinity: 0.55,
    agentTrigger: "deal",
    demandSignal: "Fuel economics shifting — EV/hybrid transition window",
  },
  TECHNOLOGY_GAP: {
    baseScore: 40,
    urgencyMultiplier: 0.8,
    upgradeAffinity: 0.35,
    agentTrigger: "deal",
    demandSignal: "Technology desire — ADAS/connectivity upgrade appeal",
  },
  SAFETY_RATING_DROP: {
    baseScore: 75,
    urgencyMultiplier: 1.5,
    upgradeAffinity: 0.82,
    agentTrigger: "deal",
    demandSignal: "Safety concern — protection-motivated upgrade",
  },
};

export interface DemandAssessment {
  demandScore: number;
  demandTier: DemandTier;
  upgradePath: UpgradePathType;
  frictionEvents: FrictionEvent[];
  compoundMultiplier: number;
  agentTriggers: string[];
  demandSignals: string[];
  estimatedConversionProbability: number;
  recommendedAction: string;
  proofHash: string;
  architect: string;
  timestamp: string;
}

function calculateDemandTier(score: number): DemandTier {
  if (score >= 90) return "EMERGENCY";
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

function determineUpgradePath(tier: DemandTier, topEvent: FrictionEvent): UpgradePathType {
  if (tier === "EMERGENCY") return "EMERGENCY_SWAP";
  if (tier === "CRITICAL") return "URGENT_REPLACEMENT";
  if (tier === "HIGH") return "UPGRADE_OFFER";
  if (tier === "MODERATE") return "VALUE_COMPARISON";
  return "SOFT_NUDGE";
}

function generateDemandProof(assessment: Omit<DemandAssessment, "proofHash">): string {
  const payload = [
    ARCHITECT,
    SOVEREIGN,
    assessment.demandScore,
    assessment.demandTier,
    assessment.frictionEvents.join(","),
    assessment.timestamp,
  ].join("|");
  return crypto.createHmac("sha256", process.env.ENCRYPTION_KEY || "3CONYX-MICHELIN-DEMAND").update(payload).digest("hex");
}

export function assessDemand(
  frictionEvents: FrictionEvent[],
  vehicleAge?: number,
  vehicleMileage?: number,
  ownerTenure?: number,
): DemandAssessment {
  if (frictionEvents.length === 0) {
    const timestamp = new Date().toISOString();
    const base: Omit<DemandAssessment, "proofHash"> = {
      demandScore: 0,
      demandTier: "LOW",
      upgradePath: "SOFT_NUDGE",
      frictionEvents: [],
      compoundMultiplier: 1.0,
      agentTriggers: [],
      demandSignals: [],
      estimatedConversionProbability: 0.02,
      recommendedAction: "No friction detected — maintain engagement with value content",
      architect: ARCHITECT,
      timestamp,
    };
    return { ...base, proofHash: generateDemandProof(base) };
  }

  const profiles = frictionEvents.map(e => ({ event: e, ...FRICTION_PROFILES[e] }));

  let rawScore = profiles.reduce((sum, p) => sum + p.baseScore * p.urgencyMultiplier, 0) / profiles.length;

  const compoundMultiplier = 1 + (frictionEvents.length - 1) * 0.15;
  rawScore *= compoundMultiplier;

  if (vehicleAge && vehicleAge > 8) rawScore *= 1.1;
  if (vehicleAge && vehicleAge > 12) rawScore *= 1.15;
  if (vehicleMileage && vehicleMileage > 100_000) rawScore *= 1.08;
  if (vehicleMileage && vehicleMileage > 150_000) rawScore *= 1.12;
  if (ownerTenure && ownerTenure > 5) rawScore *= 1.05;

  const demandScore = Math.min(Math.round(rawScore * 100) / 100, 100);
  const demandTier = calculateDemandTier(demandScore);
  const topEvent = profiles.sort((a, b) => b.baseScore * b.urgencyMultiplier - a.baseScore * a.urgencyMultiplier)[0];
  const upgradePath = determineUpgradePath(demandTier, topEvent.event);

  const avgAffinity = profiles.reduce((sum, p) => sum + p.upgradeAffinity, 0) / profiles.length;
  const convProb = Math.min(avgAffinity * (demandScore / 100) * compoundMultiplier, 0.98);

  const agentTriggers = [...new Set(profiles.map(p => p.agentTrigger))];
  const demandSignals = profiles.map(p => p.demandSignal);

  const actionMap: Record<DemandTier, string> = {
    EMERGENCY: "Activate Emergency Swap protocol — connect to Deal Agent immediately with pre-approved financing options",
    CRITICAL: "Deploy Urgent Replacement funnel — push upgrade comparison with current vehicle trade-in value",
    HIGH: "Send Upgrade Offer via preferred channel — include payment comparison showing monthly savings",
    MODERATE: "Queue Value Comparison content — educate on total cost of ownership vs. upgrade",
    LOW: "Soft nudge only — include upgrade awareness in next scheduled touchpoint",
  };

  const timestamp = new Date().toISOString();
  const base: Omit<DemandAssessment, "proofHash"> = {
    demandScore,
    demandTier,
    upgradePath,
    frictionEvents,
    compoundMultiplier: Math.round(compoundMultiplier * 100) / 100,
    agentTriggers,
    demandSignals,
    estimatedConversionProbability: Math.round(convProb * 1000) / 1000,
    recommendedAction: actionMap[demandTier],
    architect: ARCHITECT,
    timestamp,
  };

  const proofHash = generateDemandProof(base);

  logger.info({
    demandScore,
    demandTier,
    upgradePath,
    frictionEvents,
    conversionProbability: base.estimatedConversionProbability,
    proofHash: proofHash.slice(0, 12),
  }, "[michelin-demand] Demand assessed");

  return { ...base, proofHash };
}

export function getMichelinEngineStatus() {
  return {
    engineVersion: ENGINE_VERSION,
    frictionEventTypes: Object.keys(FRICTION_PROFILES).length,
    demandTiers: 5,
    upgradePathTypes: 6,
    compoundingEnabled: true,
    architect: ARCHITECT,
    entity: SOVEREIGN,
    strategy: "Create extreme mobility demand so vehicle transactions compound automatically",
    status: "ARMED",
  };
}
