import { Router } from "express";

const router = Router();

// ── Seed data helpers ─────────────────────────────────────────────────────────
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const lerp = (base: number, jitter: number) =>
  +(base + (Math.random() - 0.5) * jitter).toFixed(2);

// Deterministic-ish offset by minute so numbers don't flicker every req
const minuteSeed = () => Math.floor(Date.now() / 60_000);

function stableRand(min: number, max: number, salt: number = 0): number {
  const seed = (minuteSeed() + salt) % 1000;
  return Math.floor(min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min));
}

// ── GET /api/impact/metrics ───────────────────────────────────────────────────
router.get("/impact/metrics", (_req, res) => {
  const totalSavings       = stableRand(4_200_000, 5_100_000, 1);
  const avgSavingsPerDeal  = stableRand(8_400, 12_300, 2);
  const complaintsPrevent  = stableRand(1_820, 2_240, 3);
  const guardianDetections = stableRand(3_100, 3_900, 4);
  const membersProtected   = stableRand(2_800, 3_200, 5);
  const dealerScore        = lerp(4.7, 0.2);
  const ignoranceTaxRate   = 0.23;  // ~23% retail markup over wholesale = "Ignorance Tax"

  res.json({
    ignoranceTax: {
      totalMemberSavings:   totalSavings,
      avgSavingsPerDeal:    avgSavingsPerDeal,
      taxRate:              ignoranceTaxRate,
      tagline:              "vs. traditional retail markup",
    },
    complaints: {
      prevented:            complaintsPrevent,
      guardianDetections:   guardianDetections,
      earlyInterventions:   Math.floor(guardianDetections * 0.74),
      resolutionRate:       0.97,
    },
    members: {
      protected:            membersProtected,
      avgReputationScore:   dealerScore,
      verifiedShops:        stableRand(140, 180, 6),
      activeDeals:          stableRand(220, 290, 7),
    },
    esg: {
      overall:              stableRand(78, 86, 8),
      environmental: {
        score:   stableRand(72, 80, 9),
        detail:  "Vehicle longevity extension reduces manufacturing demand. Avg 3.2 additional service years per Guardian-maintained vehicle.",
        co2Saved: stableRand(1_200, 1_800, 10),  // kg CO2 avoided
      },
      social: {
        score:   stableRand(82, 92, 11),
        detail:  "Consumer protection through wholesale transparency. Apprentice up-skilling prevents 73% of first-year tech errors.",
        jobsSupported: stableRand(340, 410, 12),
      },
      governance: {
        score:   stableRand(76, 88, 13),
        detail:  "SOC2 Type II compliant audit trail. Every agent decision is immutably logged. Zero undisclosed markups.",
        auditRecords: stableRand(28_000, 34_000, 14),
      },
    },
    updatedAt: new Date().toISOString(),
  });
});

// ── GET /api/impact/integrity-mesh ────────────────────────────────────────────
router.get("/impact/integrity-mesh", (_req, res) => {
  const shops = [
    { id: "s1", name: "Apex Certified Auto",      city: "Miami",       state: "FL", rating: 4.9, reviews: 312, verified: true,  specialties: ["EV", "Luxury"], blockchainHash: "0x3a7f…c4d2", trend: "+0.1" },
    { id: "s2", name: "NorthStar Service Center", city: "New York",    state: "NY", rating: 4.8, reviews: 287, verified: true,  specialties: ["German", "Performance"], blockchainHash: "0x8b2e…f1a9", trend: "0.0" },
    { id: "s3", name: "Capital Auto Specialists", city: "Washington",  state: "DC", rating: 4.7, reviews: 198, verified: true,  specialties: ["Domestic", "Fleet"], blockchainHash: "0x5c9d…e3b7", trend: "+0.2" },
    { id: "s4", name: "Seaport Motorsport",       city: "Baltimore",   state: "MD", rating: 4.6, reviews: 144, verified: true,  specialties: ["Italian", "Exotic"], blockchainHash: "0x1f4a…7c8e", trend: "-0.1" },
    { id: "s5", name: "Hunts Point Auto Spa",     city: "Bronx",       state: "NY", rating: 4.5, reviews: 89,  verified: false, specialties: ["Detailing", "Prep"],   blockchainHash: null,          trend: "+0.3" },
    { id: "s6", name: "Corridor Elite Service",   city: "Philadelphia",state: "PA", rating: 4.8, reviews: 256, verified: true,  specialties: ["BMW", "Mercedes"], blockchainHash: "0x2d6b…a5f3", trend: "+0.1" },
    { id: "s7", name: "Greenway Auto Group",      city: "Newark",      state: "NJ", rating: 4.4, reviews: 67,  verified: false, specialties: ["Budget", "Hybrids"],   blockchainHash: null,          trend: "-0.2" },
    { id: "s8", name: "Summit Certified Repair",  city: "Hartford",    state: "CT", rating: 4.9, reviews: 411, verified: true,  specialties: ["Audi", "Porsche"], blockchainHash: "0x9e1c…b2d6", trend: "+0.2" },
  ];

  // Simulate small fluctuations in ratings
  const liveShops = shops.map(s => ({
    ...s,
    rating: +(s.rating + (Math.random() - 0.5) * 0.05).toFixed(1),
    activeNow: Math.random() > 0.5,
  }));

  res.json({
    shops: liveShops,
    corridorStats: {
      i95Coverage:      "Boston → Miami (1,508 mi)",
      totalShops:       liveShops.length,
      verifiedCount:    liveShops.filter(s => s.verified).length,
      avgRating:        +(liveShops.reduce((a, s) => a + s.rating, 0) / liveShops.length).toFixed(2),
      blockchainLedger: "Active — SHA-256 · Immutable",
    },
    updatedAt: new Date().toISOString(),
  });
});

// ── GET /api/impact/mission-stats ─────────────────────────────────────────────
router.get("/impact/mission-stats", (_req, res) => {
  res.json({
    mission: "Eliminating the #1 source of consumer complaints through Agentic Transparency and Wholesale Access.",
    cfaRanking: "#1 consumer complaint category — auto dealer sales (FTC 2024)",
    keyStats: [
      { label: "Avg Retail Markup",     value: "23%",        note: "vs. wholesale — the Ignorance Tax" },
      { label: "CFPB Auto Complaints",  value: "42,000+",    note: "per year, per CFPB 2023 report"    },
      { label: "3C Resolution Rate",    value: "97%",        note: "Guardian early detection"           },
      { label: "Member Avg Savings",    value: "$9,800",     note: "per transaction vs. retail"         },
    ],
    updatedAt: new Date().toISOString(),
  });
});

export default router;
