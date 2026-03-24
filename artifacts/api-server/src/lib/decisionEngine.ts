/**
 * 3C Onyx — Decision Engine
 *
 * The platform's primary intelligence system. Rule-based, deterministic,
 * LLM-independent. All final recommendations come from here.
 *
 * LLMs are permitted to NARRATE engine output — never to override it.
 *
 * Architecture: Score → Weight → Composite → Decision + Reasoning + Flags
 */

export type Recommendation = "STRONG_BUY" | "BUY" | "NEUTRAL" | "CAUTION" | "AVOID";
export type ShopRecommendation = "RECOMMEND" | "ALTERNATIVE" | "AVOID";
export type FraudRisk = "CLEAN" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EngineDecision {
  id: string;
  entityType: "vehicle" | "shop" | "insurance" | "fraud";
  entityId: string;
  recommendation: Recommendation | ShopRecommendation | FraudRisk;
  confidenceScore: number;
  reasoning: string[];
  flags: string[];
  estimatedSavings?: number;
  scores: Record<string, number>;
  deterministic: true;
  source: "engine";
  generatedAt: string;
}

// ─── Vehicle Scoring ─────────────────────────────────────────────────────────

export interface VehicleInput {
  vehicleId: string;
  askingPrice: number;
  marketAveragePrice: number;
  conditionScore: number;       // 0–100 (from inspection or self-reported)
  mileage: number;
  vehicleAgeYears: number;
  blockchainFlags: number;      // 0 = clean, 1+ = each flag reduces trust
  blockchainEntriesCount: number;
  titleStateMatchesReg: boolean;
  listingDuplicates: number;    // # of times this VIN appears across listings
}

export function scoreVehicle(input: VehicleInput): EngineDecision {
  const reasoning: string[] = [];
  const flags: string[] = [];

  // 1. Price Score (35% weight)
  const priceRatio = input.askingPrice / input.marketAveragePrice;
  let priceScore: number;
  let estimatedSavings = 0;

  if (priceRatio <= 0.85) {
    priceScore = 95;
    estimatedSavings = input.marketAveragePrice - input.askingPrice;
    reasoning.push(`Priced ${Math.round((1 - priceRatio) * 100)}% below market — exceptional value`);
  } else if (priceRatio <= 0.93) {
    priceScore = 80;
    estimatedSavings = input.marketAveragePrice - input.askingPrice;
    reasoning.push(`Priced ${Math.round((1 - priceRatio) * 100)}% below market — good value`);
  } else if (priceRatio <= 1.00) {
    priceScore = 62;
    reasoning.push("Priced at or slightly below market average");
  } else if (priceRatio <= 1.07) {
    priceScore = 45;
    flags.push("ABOVE_MARKET_PRICE");
    reasoning.push(`Priced ${Math.round((priceRatio - 1) * 100)}% above market — negotiate down`);
  } else if (priceRatio <= 1.15) {
    priceScore = 28;
    flags.push("ABOVE_MARKET_PRICE");
    reasoning.push(`Priced ${Math.round((priceRatio - 1) * 100)}% above market — strong pushback needed`);
  } else {
    priceScore = 10;
    flags.push("SIGNIFICANTLY_OVERPRICED");
    reasoning.push(`Priced ${Math.round((priceRatio - 1) * 100)}% above market — not recommended at this price`);
  }

  // Fraud check: suspiciously low price
  if (priceRatio <= 0.65) {
    flags.push("PRICE_ANOMALY_FRAUD_RISK");
    reasoning.push("Price is unusually far below market — verify legitimacy before proceeding");
  }

  // 2. Condition Score (25% weight) — pass-through from inspection
  const conditionScore = Math.max(0, Math.min(100, input.conditionScore));
  if (conditionScore >= 85) reasoning.push("Condition rated excellent");
  else if (conditionScore >= 70) reasoning.push("Condition rated good");
  else if (conditionScore >= 55) reasoning.push("Condition rated fair — factor repair costs into offer");
  else {
    flags.push("POOR_CONDITION");
    reasoning.push("Condition rated poor — significant repairs likely");
  }

  // 3. History / Blockchain Score (25% weight)
  let historyScore: number;
  if (input.blockchainFlags === 0 && input.blockchainEntriesCount >= 2) {
    historyScore = 100;
    reasoning.push("Clean blockchain chain-of-custody — fully verified");
  } else if (input.blockchainFlags === 0 && input.blockchainEntriesCount === 1) {
    historyScore = 80;
    reasoning.push("One verified blockchain record — partial history");
  } else if (input.blockchainFlags === 0) {
    historyScore = 55;
    flags.push("NO_BLOCKCHAIN_HISTORY");
    reasoning.push("No chain-of-custody records — history unverifiable");
  } else if (input.blockchainFlags === 1) {
    historyScore = 40;
    flags.push("BLOCKCHAIN_FLAG");
    reasoning.push("One flag on chain-of-custody — review before purchase");
  } else {
    historyScore = 15;
    flags.push("MULTIPLE_BLOCKCHAIN_FLAGS");
    reasoning.push(`${input.blockchainFlags} flags on chain-of-custody — high risk`);
  }

  if (!input.titleStateMatchesReg) {
    historyScore = Math.min(historyScore, 30);
    flags.push("TITLE_STATE_MISMATCH");
    reasoning.push("Title state does not match registration state — possible title washing");
  }

  if (input.listingDuplicates > 1) {
    flags.push("VIN_CLONE_RISK");
    reasoning.push(`VIN appears in ${input.listingDuplicates} listings — verify ownership`);
  }

  // 4. Mileage Score (15% weight)
  let mileageScore: number;
  const milesPerYear = input.vehicleAgeYears > 0
    ? input.mileage / input.vehicleAgeYears
    : input.mileage;

  if (milesPerYear <= 8_000) {
    mileageScore = 100;
    reasoning.push(`Low usage: ${Math.round(milesPerYear).toLocaleString()} mi/year`);
  } else if (milesPerYear <= 12_000) {
    mileageScore = 85;
    reasoning.push(`Average usage: ${Math.round(milesPerYear).toLocaleString()} mi/year`);
  } else if (milesPerYear <= 18_000) {
    mileageScore = 68;
    reasoning.push(`Above-average usage: ${Math.round(milesPerYear).toLocaleString()} mi/year`);
  } else if (milesPerYear <= 25_000) {
    mileageScore = 45;
    flags.push("HIGH_MILEAGE");
    reasoning.push(`High usage: ${Math.round(milesPerYear).toLocaleString()} mi/year — maintenance costs elevated`);
  } else {
    mileageScore = 20;
    flags.push("VERY_HIGH_MILEAGE");
    reasoning.push(`Very high usage: ${Math.round(milesPerYear).toLocaleString()} mi/year — inspect thoroughly`);
  }

  // ── Composite Score ──────────────────────────────────────────────────────
  const composite = Math.round(
    priceScore    * 0.35 +
    conditionScore * 0.25 +
    historyScore  * 0.25 +
    mileageScore  * 0.15
  );

  let recommendation: Recommendation;
  if (flags.includes("PRICE_ANOMALY_FRAUD_RISK") || flags.includes("MULTIPLE_BLOCKCHAIN_FLAGS")) {
    recommendation = "AVOID";
  } else if (composite >= 80) {
    recommendation = "STRONG_BUY";
  } else if (composite >= 65) {
    recommendation = "BUY";
  } else if (composite >= 50) {
    recommendation = "NEUTRAL";
  } else if (composite >= 35) {
    recommendation = "CAUTION";
  } else {
    recommendation = "AVOID";
  }

  return {
    id: `ve-${Date.now()}-${input.vehicleId}`,
    entityType: "vehicle",
    entityId: input.vehicleId,
    recommendation,
    confidenceScore: composite,
    reasoning,
    flags,
    estimatedSavings: estimatedSavings > 0 ? Math.round(estimatedSavings) : undefined,
    scores: { priceScore, conditionScore, historyScore, mileageScore, composite },
    deterministic: true,
    source: "engine",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Shop / Service Scoring ──────────────────────────────────────────────────

export interface ShopInput {
  shopId: string;
  rating: number;          // 0–5
  reviewCount: number;
  estimatedCost: number;
  userBudget: number;
  distanceMiles: number;
  certifications: string[];
  previousWorkOnVehicle: boolean;
}

export function scoreShop(input: ShopInput): EngineDecision {
  const reasoning: string[] = [];
  const flags: string[] = [];

  // Rating Score (55% weight)
  let ratingScore: number;
  if (input.rating >= 4.7) {
    ratingScore = 100;
    reasoning.push(`Exceptional rating: ${input.rating}/5 (${input.reviewCount} reviews)`);
  } else if (input.rating >= 4.3) {
    ratingScore = 82;
    reasoning.push(`Strong rating: ${input.rating}/5`);
  } else if (input.rating >= 3.8) {
    ratingScore = 62;
    reasoning.push(`Acceptable rating: ${input.rating}/5 — verify recent reviews`);
  } else if (input.rating >= 3.0) {
    ratingScore = 40;
    flags.push("LOW_RATING");
    reasoning.push(`Below-average rating: ${input.rating}/5 — proceed with caution`);
  } else {
    ratingScore = 15;
    flags.push("POOR_RATING");
    reasoning.push(`Poor rating: ${input.rating}/5 — not recommended`);
  }

  if (input.reviewCount < 10) {
    ratingScore = Math.round(ratingScore * 0.75);
    flags.push("INSUFFICIENT_REVIEWS");
    reasoning.push("Fewer than 10 reviews — rating may not be reliable");
  }

  // Price Score (30% weight)
  const budgetRatio = input.estimatedCost / input.userBudget;
  let priceScore: number;
  if (budgetRatio <= 0.80) {
    priceScore = 100;
    const saved = Math.round(input.userBudget - input.estimatedCost);
    reasoning.push(`Estimate $${saved} under budget`);
  } else if (budgetRatio <= 0.92) {
    priceScore = 80;
    reasoning.push("Estimate comfortably within budget");
  } else if (budgetRatio <= 1.00) {
    priceScore = 60;
    reasoning.push("Estimate at budget limit");
  } else if (budgetRatio <= 1.15) {
    priceScore = 35;
    flags.push("OVER_BUDGET");
    reasoning.push(`Estimate ${Math.round((budgetRatio - 1) * 100)}% over budget`);
  } else {
    priceScore = 10;
    flags.push("SIGNIFICANTLY_OVER_BUDGET");
    reasoning.push(`Estimate ${Math.round((budgetRatio - 1) * 100)}% over budget — negotiate or shop around`);
  }

  // Distance (15% weight)
  let distanceScore: number;
  if (input.distanceMiles <= 5) distanceScore = 100;
  else if (input.distanceMiles <= 15) distanceScore = 80;
  else if (input.distanceMiles <= 30) distanceScore = 60;
  else if (input.distanceMiles <= 50) distanceScore = 40;
  else { distanceScore = 20; flags.push("LONG_DISTANCE"); }

  if (input.previousWorkOnVehicle) {
    reasoning.push("This shop has previous work history on this vehicle");
  }

  if (input.certifications.length > 0) {
    reasoning.push(`Certified: ${input.certifications.join(", ")}`);
  }

  const composite = Math.round(
    ratingScore   * 0.55 +
    priceScore    * 0.30 +
    distanceScore * 0.15
  );

  const recommendation: ShopRecommendation =
    composite >= 68 ? "RECOMMEND" :
    composite >= 48 ? "ALTERNATIVE" :
    "AVOID";

  return {
    id: `sh-${Date.now()}-${input.shopId}`,
    entityType: "shop",
    entityId: input.shopId,
    recommendation,
    confidenceScore: composite,
    reasoning,
    flags,
    scores: { ratingScore, priceScore, distanceScore, composite },
    deterministic: true,
    source: "engine",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Fraud Detection ──────────────────────────────────────────────────────────

export interface FraudInput {
  listingId: string;
  askingPrice: number;
  marketAveragePrice: number;
  vinListingCount: number;
  hasPhotos: boolean;
  photoCount: number;
  sellerBlockchainHistory: number;
  titleStateMatchesReg: boolean;
  sellerContactedViaThirdParty: boolean;
  paymentMethodRequested?: string;
}

export function detectFraud(input: FraudInput): EngineDecision {
  const flags: string[] = [];
  const reasoning: string[] = [];
  let riskPoints = 0;

  const priceRatio = input.askingPrice / input.marketAveragePrice;
  if (priceRatio <= 0.60) {
    riskPoints += 35;
    flags.push("EXTREME_UNDERPRICING");
    reasoning.push(`Priced ${Math.round((1 - priceRatio) * 100)}% below market — classic fraud signal`);
  } else if (priceRatio <= 0.75) {
    riskPoints += 20;
    flags.push("SIGNIFICANT_UNDERPRICING");
    reasoning.push("Price is significantly below market — verify before engaging");
  }

  if (input.vinListingCount > 1) {
    riskPoints += 30;
    flags.push("VIN_LISTED_MULTIPLE_TIMES");
    reasoning.push(`This VIN appears in ${input.vinListingCount} active listings — possible clone`);
  }

  if (!input.hasPhotos || input.photoCount < 4) {
    riskPoints += 15;
    flags.push("INSUFFICIENT_PHOTOS");
    reasoning.push("Fewer than 4 photos — request full photo set before proceeding");
  }

  if (input.sellerBlockchainHistory === 0) {
    riskPoints += 20;
    flags.push("UNVERIFIED_SELLER");
    reasoning.push("Seller has no blockchain-verified transaction history on 3C Onyx");
  }

  if (!input.titleStateMatchesReg) {
    riskPoints += 25;
    flags.push("TITLE_STATE_MISMATCH");
    reasoning.push("Title state differs from registration state — possible title washing");
  }

  if (input.sellerContactedViaThirdParty) {
    riskPoints += 20;
    flags.push("OFF_PLATFORM_CONTACT");
    reasoning.push("Seller requested contact off-platform — does not apply to protected transactions");
  }

  const paymentFlag = ["wire transfer", "western union", "zelle", "cash app", "bitcoin", "crypto"];
  if (input.paymentMethodRequested && paymentFlag.some(m => input.paymentMethodRequested!.toLowerCase().includes(m))) {
    riskPoints += 40;
    flags.push("HIGH_RISK_PAYMENT_REQUEST");
    reasoning.push(`Payment method "${input.paymentMethodRequested}" is a common fraud vector — use platform escrow only`);
  }

  const risk: FraudRisk =
    riskPoints >= 70 ? "CRITICAL" :
    riskPoints >= 45 ? "HIGH" :
    riskPoints >= 25 ? "MEDIUM" :
    riskPoints >= 10 ? "LOW" :
    "CLEAN";

  if (risk === "CLEAN") reasoning.push("No fraud indicators detected");

  return {
    id: `fd-${Date.now()}-${input.listingId}`,
    entityType: "fraud",
    entityId: input.listingId,
    recommendation: risk,
    confidenceScore: Math.min(100, riskPoints + 30),
    reasoning,
    flags,
    scores: { riskPoints },
    deterministic: true,
    source: "engine",
    generatedAt: new Date().toISOString(),
  };
}

// ─── Engine Status ────────────────────────────────────────────────────────────

export function getEngineStatus() {
  return {
    status: "OPERATIONAL",
    mode: "deterministic",
    version: "1.0.0",
    capabilities: ["vehicle_scoring", "shop_scoring", "fraud_detection"],
    llmDependency: false,
    note: "Platform operates fully without LLM. AI providers enhance communication only.",
    uptime: process.uptime(),
  };
}
