/**
 * 3C ONYX — Distribution Hub Auto-Upgrade Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-DISTRIBUTION-HUB-SOVEREIGN
 *
 * The Katamari Growth Model: "By treating high-network individuals as Hubs,
 * you aren't fighting for one customer at a time. You are capturing entire
 * networks in a single roll."
 *
 * Every user starts as a Node. When their network activity exceeds defined
 * thresholds, they auto-upgrade to a Distribution Hub with advanced referral
 * dashboards, higher commission splits, and priority routing.
 *
 * Hub Categories:
 *   - Attorney Hub:     Legal professionals who funnel accident → replacement
 *   - Rideshare Hub:    Uber/Lyft drivers who are high-frequency vehicle users
 *   - Shop Hub:         Mechanics/body shops who see every broken vehicle
 *   - Dealer Hub:       Licensed dealers who need wholesale/trade channels
 *   - Fleet Hub:        Fleet managers with bulk vehicle needs
 *   - Influencer Hub:   Social connectors with high referral velocity
 *   - Community Hub:    Church/club/org leaders with trusted networks
 */

import crypto from "crypto";
import { logger } from "./logger";

const ARCHITECT = "Ronald Antonio Cadet";
const SOVEREIGN = "CUXTOMCANDYCLUB LLC";
const ENGINE_VERSION = "1.0.0";

export type NodeTier = "MEMBER" | "CONNECTOR" | "HUB" | "SUPER_HUB" | "DISTRIBUTION_CENTER";

export type HubCategory =
  | "ATTORNEY"
  | "RIDESHARE"
  | "SHOP"
  | "DEALER"
  | "FLEET"
  | "INFLUENCER"
  | "COMMUNITY"
  | "GENERAL";

interface UpgradeThreshold {
  referrals: number;
  settledDeals: number;
  networkSize: number;
  revenueGenerated: number;
  commissionSplit: number;
  features: string[];
}

const TIER_THRESHOLDS: Record<NodeTier, UpgradeThreshold> = {
  MEMBER: {
    referrals: 0,
    settledDeals: 0,
    networkSize: 0,
    revenueGenerated: 0,
    commissionSplit: 0.5,
    features: ["basic_referral_link", "qr_code", "wallet"],
  },
  CONNECTOR: {
    referrals: 1,
    settledDeals: 1,
    networkSize: 3,
    revenueGenerated: 100,
    commissionSplit: 1.0,
    features: ["referral_dashboard", "commission_tracking", "sms_sharing", "tiktok_sharing"],
  },
  HUB: {
    referrals: 5,
    settledDeals: 3,
    networkSize: 15,
    revenueGenerated: 1_000,
    commissionSplit: 1.5,
    features: ["hub_dashboard", "network_analytics", "auto_credit", "priority_support", "bulk_qr"],
  },
  SUPER_HUB: {
    referrals: 25,
    settledDeals: 15,
    networkSize: 75,
    revenueGenerated: 10_000,
    commissionSplit: 2.0,
    features: ["super_hub_console", "territory_map", "team_management", "api_access", "white_label_links"],
  },
  DISTRIBUTION_CENTER: {
    referrals: 100,
    settledDeals: 50,
    networkSize: 500,
    revenueGenerated: 100_000,
    commissionSplit: 2.5,
    features: ["distribution_center", "franchise_tools", "sub_hub_management", "revenue_forecasting", "dedicated_support", "custom_branding"],
  },
};

const HUB_CATEGORY_BONUSES: Record<HubCategory, { scoreMultiplier: number; fastTrackThreshold: number; specialFeatures: string[] }> = {
  ATTORNEY: {
    scoreMultiplier: 1.5,
    fastTrackThreshold: 3,
    specialFeatures: ["legal_case_pipeline", "accident_to_replacement_funnel", "insurance_claim_tracker"],
  },
  RIDESHARE: {
    scoreMultiplier: 1.3,
    fastTrackThreshold: 5,
    specialFeatures: ["vehicle_wear_alerts", "upgrade_calculator", "tax_deduction_tracker"],
  },
  SHOP: {
    scoreMultiplier: 1.4,
    fastTrackThreshold: 4,
    specialFeatures: ["repair_vs_replace_tool", "customer_vehicle_alerts", "parts_pipeline"],
  },
  DEALER: {
    scoreMultiplier: 1.6,
    fastTrackThreshold: 2,
    specialFeatures: ["wholesale_channel", "auction_access", "inventory_feed", "dealer_20_group"],
  },
  FLEET: {
    scoreMultiplier: 1.7,
    fastTrackThreshold: 2,
    specialFeatures: ["fleet_management", "bulk_procurement", "maintenance_scheduling", "telemetry_dashboard"],
  },
  INFLUENCER: {
    scoreMultiplier: 1.2,
    fastTrackThreshold: 10,
    specialFeatures: ["social_amplifier", "content_toolkit", "campaign_dashboard", "referral_leaderboard"],
  },
  COMMUNITY: {
    scoreMultiplier: 1.3,
    fastTrackThreshold: 8,
    specialFeatures: ["group_deals", "event_integration", "community_dashboard", "group_insurance"],
  },
  GENERAL: {
    scoreMultiplier: 1.0,
    fastTrackThreshold: 5,
    specialFeatures: [],
  },
};

export interface NodeProfile {
  userId: string;
  currentTier: NodeTier;
  category: HubCategory;
  referralCount: number;
  settledDeals: number;
  networkSize: number;
  totalRevenue: number;
  hubScore: number;
}

export interface UpgradeAssessment {
  eligible: boolean;
  currentTier: NodeTier;
  nextTier: NodeTier | null;
  hubScore: number;
  progress: Record<string, { current: number; required: number; met: boolean }>;
  unlockedFeatures: string[];
  categoryBonus: string;
  commissionRate: number;
  proofHash: string;
  architect: string;
  timestamp: string;
}

function calculateHubScore(profile: NodeProfile): number {
  const catBonus = HUB_CATEGORY_BONUSES[profile.category];
  const raw =
    profile.referralCount * 10 +
    profile.settledDeals * 25 +
    profile.networkSize * 2 +
    Math.log10(Math.max(profile.totalRevenue, 1)) * 15;
  return Math.round(raw * catBonus.scoreMultiplier * 100) / 100;
}

function getNextTier(current: NodeTier): NodeTier | null {
  const order: NodeTier[] = ["MEMBER", "CONNECTOR", "HUB", "SUPER_HUB", "DISTRIBUTION_CENTER"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

function generateUpgradeProof(assessment: Omit<UpgradeAssessment, "proofHash">): string {
  const payload = [
    ARCHITECT,
    SOVEREIGN,
    assessment.currentTier,
    assessment.nextTier,
    assessment.hubScore,
    assessment.timestamp,
  ].join("|");
  return crypto.createHmac("sha256", process.env.ENCRYPTION_KEY || "3CONYX-HUB-ENGINE").update(payload).digest("hex");
}

export function assessUpgrade(profile: NodeProfile): UpgradeAssessment {
  const hubScore = calculateHubScore(profile);
  const nextTier = getNextTier(profile.currentTier);
  const timestamp = new Date().toISOString();

  if (!nextTier) {
    const base: Omit<UpgradeAssessment, "proofHash"> = {
      eligible: false,
      currentTier: profile.currentTier,
      nextTier: null,
      hubScore,
      progress: {},
      unlockedFeatures: TIER_THRESHOLDS[profile.currentTier].features,
      categoryBonus: profile.category,
      commissionRate: TIER_THRESHOLDS[profile.currentTier].commissionSplit,
      architect: ARCHITECT,
      timestamp,
    };
    return { ...base, proofHash: generateUpgradeProof(base) };
  }

  const thresholds = TIER_THRESHOLDS[nextTier];
  const catBonus = HUB_CATEGORY_BONUSES[profile.category];
  const ftReduction = catBonus.fastTrackThreshold > 0 ? 0.7 : 1.0;

  const progress: Record<string, { current: number; required: number; met: boolean }> = {
    referrals: {
      current: profile.referralCount,
      required: Math.ceil(thresholds.referrals * ftReduction),
      met: profile.referralCount >= Math.ceil(thresholds.referrals * ftReduction),
    },
    settledDeals: {
      current: profile.settledDeals,
      required: Math.ceil(thresholds.settledDeals * ftReduction),
      met: profile.settledDeals >= Math.ceil(thresholds.settledDeals * ftReduction),
    },
    networkSize: {
      current: profile.networkSize,
      required: Math.ceil(thresholds.networkSize * ftReduction),
      met: profile.networkSize >= Math.ceil(thresholds.networkSize * ftReduction),
    },
    revenueGenerated: {
      current: profile.totalRevenue,
      required: Math.ceil(thresholds.revenueGenerated * ftReduction),
      met: profile.totalRevenue >= Math.ceil(thresholds.revenueGenerated * ftReduction),
    },
  };

  const eligible = Object.values(progress).every(p => p.met);
  const unlockedFeatures = [
    ...TIER_THRESHOLDS[profile.currentTier].features,
    ...(eligible ? thresholds.features : []),
    ...catBonus.specialFeatures,
  ];

  const base: Omit<UpgradeAssessment, "proofHash"> = {
    eligible,
    currentTier: profile.currentTier,
    nextTier,
    hubScore,
    progress,
    unlockedFeatures: [...new Set(unlockedFeatures)],
    categoryBonus: profile.category,
    commissionRate: eligible ? thresholds.commissionSplit : TIER_THRESHOLDS[profile.currentTier].commissionSplit,
    architect: ARCHITECT,
    timestamp,
  };

  if (eligible) {
    logger.info({
      userId: profile.userId,
      from: profile.currentTier,
      to: nextTier,
      hubScore,
      category: profile.category,
    }, "[distribution-hub] Node eligible for tier upgrade");
  }

  return { ...base, proofHash: generateUpgradeProof(base) };
}

export function getHubEngineStatus() {
  return {
    engineVersion: ENGINE_VERSION,
    tiers: Object.keys(TIER_THRESHOLDS).length,
    categories: Object.keys(HUB_CATEGORY_BONUSES).length,
    categoryList: Object.entries(HUB_CATEGORY_BONUSES).map(([cat, bonus]) => ({
      category: cat,
      scoreMultiplier: bonus.scoreMultiplier,
      specialFeatures: bonus.specialFeatures.length,
    })),
    architect: ARCHITECT,
    entity: SOVEREIGN,
    strategy: "Capture entire networks in a single roll — Katamari Growth Model",
    status: "ARMED",
  };
}
