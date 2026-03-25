/**
 * 3C ONYX — Strategic Intelligence API
 * ─────────────────────────────────────────────────────────────────────────────
 * Every number here comes directly from the CFO/VC strategy session:
 *
 * Mission:  132M Members  |  2× AAA  |  $30B Valuation
 * Flywheel: Specialist → Team → GM → Dealer → Consumers
 * Horizon:  Year 1 ($569K ARR) → Year 5 ($2B ARR)
 *
 * This is the single source of truth for all strategic metrics on the platform.
 */

import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Strategic Constants ──────────────────────────────────────────────────────
export const STRATEGY = {
  mission: {
    memberTarget:    132_000_000,
    memberTargetLabel: "132M",
    aaaMemberBase:   66_000_000,
    aaaRevenueB:     7.7,
    multiplierVsAAA: "2×",
    valuationTarget: 30_000_000_000,
    valuationLabel:  "$30B",
  },
  currentState: {
    members:          1_247,
    foundingMembers:  0,
    dealerPilots:     0,
    crmConnections:   1,
    valuationLow:     4_000_000,
    valuationHigh:    10_000_000,
    phase:            "Pre-Revenue · Platform Built",
  },
  yearlyModel: [
    {
      year: 1,
      label: "Year 1",
      members:         10_000,
      dealers:         100,
      avgDealValue:    47_083,
      monthlyDeals:    50,
      txnFeeRate:      0.02,
      saasLow:         299,
      saasHigh:        999,
      saasAvg:         499,
      txnRevenue:      282_498,
      saasRevenue:     598_800,
      dataRevenue:     50_000,
      totalARR:        569_000,
      valuationLow:    30_000_000,
      valuationHigh:   50_000_000,
      valuationLabel:  "$30M–$50M",
      milestone:       "Series A",
      kFactor:         1.2,
    },
    {
      year: 2,
      label: "Year 2",
      members:         100_000,
      dealers:         1_000,
      avgDealValue:    47_083,
      monthlyDeals:    500,
      txnFeeRate:      0.02,
      saasLow:         299,
      saasHigh:        999,
      saasAvg:         599,
      txnRevenue:      2_824_980,
      saasRevenue:     7_188_000,
      dataRevenue:     500_000,
      totalARR:        6_800_000,
      valuationLow:    200_000_000,
      valuationHigh:   500_000_000,
      valuationLabel:  "$200M–$500M",
      milestone:       "Series B",
      kFactor:         1.5,
    },
    {
      year: 3,
      label: "Year 3",
      members:         1_000_000,
      dealers:         10_000,
      avgDealValue:    52_000,
      monthlyDeals:    5_000,
      txnFeeRate:      0.02,
      saasLow:         499,
      saasHigh:        999,
      saasAvg:         699,
      txnRevenue:      31_200_000,
      saasRevenue:     83_880_000,
      dataRevenue:     5_000_000,
      totalARR:        68_000_000,
      valuationLow:    2_000_000_000,
      valuationHigh:   5_000_000_000,
      valuationLabel:  "$2B–$5B",
      milestone:       "Series C / Pre-IPO",
      kFactor:         1.8,
    },
    {
      year: 4,
      label: "Year 4",
      members:         10_000_000,
      dealers:         50_000,
      avgDealValue:    55_000,
      monthlyDeals:    50_000,
      txnFeeRate:      0.02,
      saasLow:         499,
      saasHigh:        1499,
      saasAvg:         899,
      txnRevenue:      330_000_000,
      saasRevenue:     539_400_000,
      dataRevenue:     50_000_000,
      totalARR:        680_000_000,
      valuationLow:    8_000_000_000,
      valuationHigh:   15_000_000_000,
      valuationLabel:  "$8B–$15B",
      milestone:       "IPO Window",
      kFactor:         2.1,
    },
    {
      year: 5,
      label: "Year 5",
      members:         132_000_000,
      dealers:         200_000,
      avgDealValue:    58_000,
      monthlyDeals:    500_000,
      txnFeeRate:      0.02,
      saasLow:         999,
      saasHigh:        2499,
      saasAvg:         1299,
      txnRevenue:      3_480_000_000,
      saasRevenue:     2_398_000_000,
      dataRevenue:     500_000_000,
      totalARR:        2_000_000_000,
      valuationLow:    25_000_000_000,
      valuationHigh:   40_000_000_000,
      valuationLabel:  "$25B–$40B",
      milestone:       "2× AAA Scale",
      kFactor:         2.5,
    },
  ],
  revenueStreams: [
    { id: "txn",        label: "Transaction Fees",       rate: "2% of each deal",     color: "#7C3AED", pct: 42 },
    { id: "saas",       label: "Dealer SaaS",            rate: "$299–$999/mo",         color: "#C9A227", pct: 38 },
    { id: "data",       label: "Market Intelligence",    rate: "Anonymized data API",  color: "#10B981", pct: 10 },
    { id: "marketplace",label: "Marketplace Commission", rate: "Parts, accessories",   color: "#3B82F6", pct: 6  },
    { id: "concierge",  label: "Concierge Premium",      rate: "White-glove tier",     color: "#F97316", pct: 4  },
  ],
  flywheel: [
    { step: 1, actor: "Specialist",   action: "Joins free",                detail: "BDC Rep, F&I, Tech, Appraiser — all 16 roles",        multiplier: "1 person" },
    { step: 2, actor: "Team",         action: "Refers 8 colleagues",       detail: "Avg 8 referrals per specialist in first 90 days",     multiplier: "8×" },
    { step: 3, actor: "Department",   action: "Organic adoption",          detail: "Whole BDC team, service dept, F&I desk joins",        multiplier: "20–50 people" },
    { step: 4, actor: "GM / Owner",   action: "Requests dealer account",   detail: "GM sees team value, requests enterprise access",      multiplier: "$299–$999/mo" },
    { step: 5, actor: "Dealer",       action: "Onboards customers",        detail: "Dealer embeds ONYX in sales process for consumers",   multiplier: "100–500 consumers" },
    { step: 6, actor: "Consumer",     action: "Joins ecosystem",           detail: "Consumer refers friends — K-factor compounds",        multiplier: "K-Factor ×" },
  ],
  roles: [
    { id: "bdc_rep",            label: "BDC Representative",        category: "bdc",        ltv: 340, referralMultiplier: 8 },
    { id: "bdc_manager",        label: "BDC Manager",               category: "bdc",        ltv: 420, referralMultiplier: 12 },
    { id: "internet_sales",     label: "Internet Sales Manager",    category: "bdc",        ltv: 380, referralMultiplier: 9  },
    { id: "f_and_i_manager",    label: "F&I Manager",               category: "finance",    ltv: 520, referralMultiplier: 6  },
    { id: "finance_manager",    label: "Finance Manager",           category: "finance",    ltv: 480, referralMultiplier: 7  },
    { id: "sales_consultant",   label: "Sales Consultant",          category: "sales",      ltv: 290, referralMultiplier: 10 },
    { id: "sales_manager",      label: "Sales Manager",             category: "sales",      ltv: 450, referralMultiplier: 11 },
    { id: "used_car_director",  label: "Used Car Director",         category: "sales",      ltv: 490, referralMultiplier: 8  },
    { id: "auto_appraiser",     label: "Auto Appraiser",            category: "operations", ltv: 350, referralMultiplier: 5  },
    { id: "lot_runner",         label: "Lot Runner",                category: "operations", ltv: 180, referralMultiplier: 4  },
    { id: "transport_driver",   label: "Transport / Delivery",      category: "operations", ltv: 200, referralMultiplier: 5  },
    { id: "master_tech",        label: "Master Technician",         category: "service",    ltv: 310, referralMultiplier: 6  },
    { id: "service_advisor",    label: "Service Advisor",           category: "service",    ltv: 270, referralMultiplier: 7  },
    { id: "body_shop_tech",     label: "Body Shop Technician",      category: "service",    ltv: 250, referralMultiplier: 5  },
    { id: "parts_specialist",   label: "Parts Specialist",          category: "service",    ltv: 220, referralMultiplier: 4  },
    { id: "dealer_principal",   label: "Dealer Principal / GM",     category: "ownership",  ltv: 780, referralMultiplier: 15 },
  ],
  competitiveEdge: {
    aaa: { members: 66_000_000, revenue: 7_700_000_000, products: 12, aiFeatures: 0, automotive_focus: "partial" },
    onyx: { members: 132_000_000, revenue: 2_000_000_000, products: 50, aiFeatures: 8, automotive_focus: "100%" },
    advantages: [
      "First automotive-native super app (AAA is insurance-first, not automotive-first)",
      "AI-powered across every workflow vs. zero AI at AAA",
      "Gamification + points economy creates lock-in AAA cannot replicate",
      "Bottom-up specialist acquisition — self-propagating growth AAA cannot copy",
      "2% transaction fee on every deal — AAA charges flat membership, misses deal flow",
      "CRM Hub integrates all 9 dealer platforms — AAA has no dealer relationships",
      "132M target = 2× AAA on 1/4 their revenue, proving SaaS model superiority",
    ],
  },
  foundingPilot: {
    target: 5,
    current: 0,
    durationDays: 90,
    conversionTarget: "$299–$999/month",
    dealStructure: "90-day free trial → Monthly SaaS + 2% transaction fee",
    targetProfiles: [
      { rank: 1, type: "High-volume used car dealer",  location: "Southeast US",   volume: "150+ units/mo" },
      { rank: 2, type: "Luxury franchise dealer",      location: "Metro market",   volume: "80+ units/mo"  },
      { rank: 3, type: "Independent dealer group",     location: "Any market",     volume: "50+ units/mo"  },
      { rank: 4, type: "BDC-heavy franchise group",   location: "Midwest/South",  volume: "200+ units/mo" },
      { rank: 5, type: "Auction / wholesale dealer",   location: "Any market",     volume: "500+ units/mo" },
    ],
  },
  gamificationTiers: [
    { tier: 1, name: "Onyx Initiate",   color: "#6B7280", members: 0, pointMin: 0,      pointMax: 999,    perks: ["Platform access", "Basic AI prompts"] },
    { tier: 2, name: "Onyx Specialist", color: "#3B82F6", members: 0, pointMin: 1000,   pointMax: 4999,   perks: ["Priority support", "CRM integration"] },
    { tier: 3, name: "Onyx Pro",        color: "#10B981", members: 0, pointMin: 5000,   pointMax: 14999,  perks: ["Advanced analytics", "API access"] },
    { tier: 4, name: "Onyx Elite",      color: "#F97316", members: 0, pointMin: 15000,  pointMax: 34999,  perks: ["White-label tools", "Custom AI training"] },
    { tier: 5, name: "Onyx Gold",       color: "#C9A227", members: 0, pointMin: 35000,  pointMax: 74999,  perks: ["Revenue share", "Board advisory circle"] },
    { tier: 6, name: "Onyx Platinum",   color: "#A78BFA", members: 0, pointMin: 75000,  pointMax: 149999, perks: ["Equity consideration", "Private deals"] },
    { tier: 7, name: "Onyx Diamond",    color: "#67E8F9", members: 0, pointMin: 150000, pointMax: 499999, perks: ["Unicorn circle access", "Fund co-investment"] },
    { tier: 8, name: "Onyx Legend",     color: "#F0ABFC", members: 0, pointMin: 500000, pointMax: null,   perks: ["Founding partner status", "Platform co-ownership"] },
  ],
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/overview", (_req: Request, res: Response) => {
  const current = STRATEGY.currentState;
  const y1      = STRATEGY.yearlyModel[0];
  const progress = {
    membersToY1:   { current: current.members, target: y1.members, pct: Math.round(current.members / y1.members * 100) },
    dealersToY1:   { current: current.dealerPilots, target: y1.dealers, pct: 0 },
    crmToY1:       { current: current.crmConnections, target: 50, pct: Math.round(current.crmConnections / 50 * 100) },
    revenueToY1:   { current: 0, target: y1.totalARR, pct: 0 },
  };
  res.json({
    mission:       STRATEGY.mission,
    currentState:  current,
    progress,
    yearlyModel:   STRATEGY.yearlyModel,
    revenueStreams: STRATEGY.revenueStreams,
    flywheel:      STRATEGY.flywheel,
    foundingPilot: STRATEGY.foundingPilot,
    competitiveEdge: STRATEGY.competitiveEdge,
    gamificationTiers: STRATEGY.gamificationTiers,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/model", (_req: Request, res: Response) => {
  res.json({ yearlyModel: STRATEGY.yearlyModel, revenueStreams: STRATEGY.revenueStreams });
});

router.get("/flywheel", (_req: Request, res: Response) => {
  res.json({ flywheel: STRATEGY.flywheel, roles: STRATEGY.roles });
});

router.get("/valuation", (_req: Request, res: Response) => {
  const milestones = STRATEGY.yearlyModel.map(y => ({
    year: y.year,
    label: y.label,
    milestone: y.milestone,
    members: y.members,
    arr: y.totalARR,
    valuationLow: y.valuationLow,
    valuationHigh: y.valuationHigh,
    valuationLabel: y.valuationLabel,
    kFactor: y.kFactor,
  }));
  res.json({
    currentValuation: STRATEGY.currentState,
    milestones,
    target: STRATEGY.mission,
    competitiveEdge: STRATEGY.competitiveEdge,
  });
});

router.get("/founding-pilot", (_req: Request, res: Response) => {
  res.json({ foundingPilot: STRATEGY.foundingPilot, roles: STRATEGY.roles });
});

export default router;
