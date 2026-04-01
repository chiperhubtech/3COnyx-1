/**
 * 3C ONYX — Fortress Governor
 *
 * The AI Safety & Control Layer. Every action proposed by the Agent Mesh
 * passes through the Governor before reaching the member.
 *
 * MANDATE: Safety > Accuracy > Speed
 *
 * Three-tier confidence classification:
 *   HIGH   (>90%): Auto-execute → single [Confirm] button
 *   MEDIUM (70–90%): Suggest → require explicit approval + Explainability Layer
 *   LOW    (<70%) or HIGH-RISK: Halt → instant HITL escalation, zero friction
 *
 * The Governor also provides the Explainability Layer — translating
 * technical AI reasoning into plain B2C language the member can understand.
 *
 * Architecture: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 * "Our AI doesn't guess. It proves the math, and if it's not absolutely
 *  certain, it stops."
 */

import { type EngineDecision } from "./decisionEngine";
import { determineTrigger, ESCALATION_STORE } from "../routes/escalation";
import { logger } from "./logger";
import { writeAudit } from "./auditService";
import * as wsHub from "./wsHub";

export type GovernorTier = "AUTO_EXECUTE" | "SUGGEST" | "HALT";

export type ActionDomain =
  | "vehicle_purchase"
  | "financing"
  | "insurance"
  | "service_repair"
  | "payment"
  | "document_signing"
  | "delivery"
  | "referral"
  | "inspection"
  | "general";

const HIGH_RISK_DOMAINS: Set<ActionDomain> = new Set([
  "financing",
  "insurance",
  "payment",
  "document_signing",
]);

export interface GovernorInput {
  actionId: string;
  domain: ActionDomain;
  description: string;
  confidence: number;
  estimatedValue?: number;
  agentChain?: string[];
  engineDecision?: EngineDecision;
  userId?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface GovernorVerdict {
  actionId: string;
  tier: GovernorTier;
  confidence: number;
  approved: boolean;
  requiresConfirmation: boolean;
  explainability: ExplainabilityCard;
  escalationId?: string;
  safetyFlags: string[];
  domain: ActionDomain;
  governedAt: string;
  architect: "Ronald Antonio Cadet";
  source: "3C ONYX Governor v1.0";
}

export interface ExplainabilityCard {
  headline: string;
  summary: string;
  reasons: string[];
  savings?: string;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
  actionLabel: string;
  showDetailToggle: boolean;
}

const TECHNICAL_TO_PLAIN: Record<string, string> = {
  "PRICE_ANOMALY_FRAUD_RISK": "The price looks too good to be true — we're verifying this for your protection.",
  "ABOVE_MARKET_PRICE": "This is priced above market average. We can help you negotiate a better deal.",
  "SIGNIFICANTLY_OVERPRICED": "This is significantly above what similar vehicles sell for. We recommend looking at alternatives.",
  "POOR_CONDITION": "The vehicle's condition may need significant repairs. We're factoring repair costs into the total.",
  "NO_BLOCKCHAIN_HISTORY": "We can't verify the full history of this vehicle yet — requesting records now.",
  "MULTIPLE_BLOCKCHAIN_FLAGS": "Multiple issues found in this vehicle's history. A specialist is reviewing this for you.",
  "TITLE_STATE_MISMATCH": "The title and registration states don't match — our compliance team is checking this.",
  "VIN_CLONE_RISK": "This vehicle's identification number appears in multiple listings. We're verifying ownership.",
  "HIGH_MILEAGE": "Higher-than-average mileage means you should factor in maintenance costs.",
  "VERY_HIGH_MILEAGE": "Very high mileage — we recommend a thorough inspection before proceeding.",
  "LOW_RATING": "This provider has below-average ratings. We've found better-rated alternatives for you.",
  "POOR_RATING": "This provider has poor ratings. We strongly recommend the alternatives we've selected.",
  "INSUFFICIENT_REVIEWS": "Not enough reviews to be confident in this rating. We're showing you verified options too.",
  "OVER_BUDGET": "This option is over your stated budget. We're showing it with alternatives that fit.",
  "SIGNIFICANTLY_OVER_BUDGET": "This is well over budget. We've found options that deliver similar quality for less.",
  "LONG_DISTANCE": "This provider is farther away. We've included closer options for comparison.",
  "EXTREME_UNDERPRICING": "This price is far below market value — a common indicator of fraud. We've paused this for review.",
  "SIGNIFICANT_UNDERPRICING": "Unusually low price — we're verifying the listing before you proceed.",
  "VIN_LISTED_MULTIPLE_TIMES": "This vehicle appears in multiple listings. Our team is verifying which is legitimate.",
  "INSUFFICIENT_PHOTOS": "Not enough photos to verify condition. We're requesting a complete photo set.",
  "UNVERIFIED_SELLER": "This seller is new to 3C ONYX. Standard verification is in progress.",
  "OFF_PLATFORM_CONTACT": "The seller wants to communicate outside of 3C ONYX — your transaction is only protected on-platform.",
  "HIGH_RISK_PAYMENT_REQUEST": "An unsafe payment method was requested. 3C ONYX escrow protects your money.",
  "BLOCKCHAIN_FLAG": "One item flagged in the vehicle's chain-of-custody. We're reviewing it.",
};

function translateFlag(flag: string): string {
  return TECHNICAL_TO_PLAIN[flag] ?? flag.replace(/_/g, " ").toLowerCase();
}

function translateReasoning(reasoning: string[]): string[] {
  return reasoning.map((r) => {
    if (r.includes("blockchain")) return r.replace(/blockchain/gi, "verified history");
    if (r.includes("chain-of-custody")) return r.replace("chain-of-custody", "ownership history");
    return r;
  });
}

function generateHeadline(tier: GovernorTier, domain: ActionDomain, confidence: number): string {
  if (tier === "AUTO_EXECUTE") {
    return "Ready to go — one tap to confirm.";
  }
  if (tier === "SUGGEST") {
    const pct = Math.round(confidence);
    return `We're ${pct}% confident in this recommendation. Here's why.`;
  }
  return "We've paused this to protect you. A specialist is reviewing.";
}

function generateSummary(
  tier: GovernorTier,
  domain: ActionDomain,
  decision?: EngineDecision,
): string {
  const domainLabels: Record<ActionDomain, string> = {
    vehicle_purchase: "vehicle purchase",
    financing: "financing option",
    insurance: "insurance policy",
    service_repair: "service appointment",
    payment: "payment",
    document_signing: "document",
    delivery: "delivery",
    referral: "referral",
    inspection: "inspection",
    general: "request",
  };
  const label = domainLabels[domain];

  if (tier === "AUTO_EXECUTE") {
    return `We've verified this ${label} and everything checks out. Tap confirm to proceed.`;
  }
  if (tier === "SUGGEST") {
    const rec = decision?.recommendation;
    if (rec === "STRONG_BUY" || rec === "BUY" || rec === "RECOMMEND") {
      return `We recommend this ${label}. Review the details below, then confirm if it looks right.`;
    }
    if (rec === "NEUTRAL" || rec === "ALTERNATIVE") {
      return `This ${label} is acceptable, but we found some things to consider. Take a look before confirming.`;
    }
    return `We have concerns about this ${label}. Please review carefully before deciding.`;
  }
  return `This ${label} requires additional verification. We've connected you with a specialist who will handle everything — no action needed from you right now.`;
}

function generateActionLabel(tier: GovernorTier): string {
  if (tier === "AUTO_EXECUTE") return "Confirm";
  if (tier === "SUGGEST") return "Review & Confirm";
  return "Specialist Connected";
}

function deriveRiskLevel(
  flags: string[],
  confidence: number,
): ExplainabilityCard["riskLevel"] {
  const criticalFlags = [
    "PRICE_ANOMALY_FRAUD_RISK",
    "MULTIPLE_BLOCKCHAIN_FLAGS",
    "HIGH_RISK_PAYMENT_REQUEST",
    "EXTREME_UNDERPRICING",
  ];
  const highFlags = [
    "VIN_CLONE_RISK",
    "TITLE_STATE_MISMATCH",
    "OFF_PLATFORM_CONTACT",
    "VIN_LISTED_MULTIPLE_TIMES",
  ];

  if (flags.some((f) => criticalFlags.includes(f))) return "critical";
  if (flags.some((f) => highFlags.includes(f)) || confidence < 40) return "high";
  if (confidence < 60) return "medium";
  if (confidence < 80) return "low";
  return "none";
}

export function classifyTier(
  confidence: number,
  domain: ActionDomain,
  flags: string[] = [],
  estimatedValue?: number,
): GovernorTier {
  const criticalFlags = [
    "PRICE_ANOMALY_FRAUD_RISK",
    "MULTIPLE_BLOCKCHAIN_FLAGS",
    "HIGH_RISK_PAYMENT_REQUEST",
    "EXTREME_UNDERPRICING",
    "VIN_CLONE_RISK",
  ];
  if (flags.some((f) => criticalFlags.includes(f))) return "HALT";

  if (HIGH_RISK_DOMAINS.has(domain)) {
    if (confidence < 80) return "HALT";
    if (confidence < 95) return "SUGGEST";
    return "AUTO_EXECUTE";
  }

  if ((estimatedValue ?? 0) >= 10_000) {
    if (confidence < 75) return "HALT";
    if (confidence < 92) return "SUGGEST";
    return "AUTO_EXECUTE";
  }

  if (confidence < 70) return "HALT";
  if (confidence < 90) return "SUGGEST";
  return "AUTO_EXECUTE";
}

export async function govern(input: GovernorInput): Promise<GovernorVerdict> {
  const {
    actionId,
    domain,
    description,
    confidence,
    estimatedValue,
    agentChain,
    engineDecision,
    userId,
    sessionId,
    metadata,
  } = input;

  const flags = engineDecision?.flags ?? [];

  const tier = classifyTier(confidence, domain, flags, estimatedValue);

  const plainReasons = engineDecision
    ? translateReasoning(engineDecision.reasoning)
    : [];

  const translatedFlags = flags.map(translateFlag);

  const allReasons = [...new Set([...plainReasons, ...translatedFlags])];

  const savings = engineDecision?.estimatedSavings
    ? `$${engineDecision.estimatedSavings.toLocaleString()}`
    : undefined;

  const explainability: ExplainabilityCard = {
    headline: generateHeadline(tier, domain, confidence),
    summary: generateSummary(tier, domain, engineDecision),
    reasons: allReasons,
    savings,
    riskLevel: deriveRiskLevel(flags, confidence),
    actionLabel: generateActionLabel(tier),
    showDetailToggle: tier === "SUGGEST",
  };

  let escalationId: string | undefined;

  if (tier === "HALT") {
    const trigger = determineTrigger({
      confidence: confidence / 100,
      estimatedValue,
      agentChain,
    });

    const escId = `ESC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    ESCALATION_STORE.set(escId, {
      id: escId,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      trigger: trigger ?? "LOW_CONFIDENCE",
      requestSummary: description,
      confidence: confidence / 100,
      estimatedValue,
      agentChain,
      userId,
      sessionId,
      recommendation: engineDecision?.recommendation,
    });

    escalationId = escId;

    wsHub.broadcast("alerts", {
      type: "GOVERNOR_HALT",
      escalationId: escId,
      tier: "HALT",
      domain,
      confidence,
      description,
      explainability,
      ts: new Date().toISOString(),
    });

    logger.warn(
      { actionId, domain, confidence, escalationId: escId, flags },
      "[Governor] HALT — escalated to human review",
    );
  }

  const safetyFlags = flags.filter(
    (f) =>
      f.includes("FRAUD") ||
      f.includes("RISK") ||
      f.includes("MISMATCH") ||
      f.includes("CLONE") ||
      f.includes("FLAGS"),
  );

  const verdict: GovernorVerdict = {
    actionId,
    tier,
    confidence,
    approved: tier === "AUTO_EXECUTE",
    requiresConfirmation: tier !== "AUTO_EXECUTE",
    explainability,
    escalationId,
    safetyFlags,
    domain,
    governedAt: new Date().toISOString(),
    architect: "Ronald Antonio Cadet",
    source: "3C ONYX Governor v1.0",
  };

  writeAudit({
    eventType: "SYSTEM",
    action: `Governor verdict: ${tier} | domain=${domain} | confidence=${confidence} | flags=${safetyFlags.length}`,
    severity: tier === "HALT" ? "WARN" : "INFO",
    metadata: {
      actionId,
      tier,
      domain,
      confidence,
      escalationId,
      safetyFlags,
      ...(metadata ?? {}),
    },
  }).catch(() => {});

  return verdict;
}

export function getGovernorStatus() {
  const pendingEscalations = Array.from(ESCALATION_STORE.values()).filter(
    (e) => e.status === "PENDING",
  ).length;

  return {
    status: "OPERATIONAL",
    version: "1.0.0",
    mode: "fortress",
    mandate: "Safety > Accuracy > Speed",
    tiers: {
      AUTO_EXECUTE: ">90% confidence → single [Confirm] tap",
      SUGGEST: "70–90% → require approval + Explainability Layer",
      HALT: "<70% or HIGH-RISK → instant HITL escalation",
    },
    highRiskDomains: Array.from(HIGH_RISK_DOMAINS),
    pendingEscalations,
    translationCount: Object.keys(TECHNICAL_TO_PLAIN).length,
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
  };
}
