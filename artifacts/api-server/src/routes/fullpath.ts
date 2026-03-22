/**
 * 3C Onyx — Fullpath Data Intelligence Layer
 *
 * Fullpath is an automotive AI marketing & CRM platform that provides:
 *  - Shopper Intent signals (what shoppers are actively searching)
 *  - Inventory Velocity scores (how fast a spec sells in a region)
 *  - Behavioral cohort data (price sensitivity, brand loyalty, urgency)
 *
 * Integration status:
 *  - FULLPATH_API_KEY present  → Live Fullpath API v2 calls
 *  - FULLPATH_API_KEY absent   → High-fidelity mock data (same schema)
 *
 * Routes:
 *   GET  /api/fullpath/status               — API connectivity check
 *   GET  /api/fullpath/shopper-intent       — Member intent profiles
 *   GET  /api/fullpath/inventory-velocity   — Velocity scores by spec
 *   POST /api/fullpath/match                — Match a wholesale vehicle to member intents
 */
import { Router, type Request, type Response } from "express";

const router = Router();

const FULLPATH_API_KEY = process.env.FULLPATH_API_KEY;
const FULLPATH_BASE = "https://api.fullpath.com/v2";

// ─── Shopper Intent Profiles ──────────────────────────────────────────────────
export interface ShopperIntent {
  memberId: string;
  memberName: string;          // masked: "A.H."
  urgency: "immediate" | "30_days" | "90_days" | "exploring";
  preferences: {
    makes: string[];
    models: string[];
    yearMin: number;
    yearMax: number;
    maxBudget: number;
    maxMileage: number;
    colors: string[];
    bodyStyles: string[];
    mustHaveFeatures: string[];
  };
  behaviorSignals: {
    pageviewsLast7d: number;
    vdpViewsLast7d: number;    // Vehicle Detail Page views
    priceAlertsSaved: number;
    searchesLast30d: number;
    avgTimeOnVdpSeconds: number;
    returnVisitorScore: number; // 0-100
  };
  intentScore: number;          // Fullpath composite 0-100
  trackedVins: string[];        // specific vehicles under watch (masked)
  lastActivity: string;
}

// ─── Inventory Velocity ───────────────────────────────────────────────────────
export interface InventoryVelocity {
  specKey: string;              // e.g. "porsche-911-2022-2023"
  make: string;
  model: string;
  yearRange: [number, number];
  region: string;
  avgDaysOnMarket: number;
  searchVolume7d: number;
  searchVolumeChange: number;   // % vs prior 7d
  priceDeclinePct: number;      // avg price drop per week at wholesale
  demandScore: number;          // 0-100 composite
  supplyCount: number;          // units currently at wholesale nationally
  velocityTrend: "accelerating" | "stable" | "decelerating";
  retailToWholesaleGap: number; // avg $ premium retail vs wholesale
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
export const MOCK_SHOPPER_INTENTS: ShopperIntent[] = [
  {
    memberId: "member-001",
    memberName: "A.H.",
    urgency: "immediate",
    preferences: {
      makes: ["Porsche", "Ferrari", "McLaren"],
      models: ["911 GT3", "911 Turbo S", "Roma", "720S"],
      yearMin: 2020, yearMax: 2024,
      maxBudget: 280_000, maxMileage: 15_000,
      colors: ["Chalk", "GT Silver", "Grigio Titanio"],
      bodyStyles: ["coupe", "roadster"],
      mustHaveFeatures: ["Sport Chrono", "PCCB", "Carbon Roof"],
    },
    behaviorSignals: {
      pageviewsLast7d: 847, vdpViewsLast7d: 34,
      priceAlertsSaved: 7, searchesLast30d: 312,
      avgTimeOnVdpSeconds: 218, returnVisitorScore: 94,
    },
    intentScore: 96,
    trackedVins: ["•••••••••••2934", "•••••••••••7811"],
    lastActivity: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  },
  {
    memberId: "member-002",
    memberName: "D.K.",
    urgency: "30_days",
    preferences: {
      makes: ["Rolls-Royce", "Bentley", "Mercedes-Benz"],
      models: ["Ghost", "Flying Spur", "S-Class"],
      yearMin: 2021, yearMax: 2024,
      maxBudget: 350_000, maxMileage: 20_000,
      colors: ["Mystic White", "Onyx", "Moonbeam"],
      bodyStyles: ["sedan", "extended"],
      mustHaveFeatures: ["Starlight Headliner", "Bespoke Audio", "Rear Theatre"],
    },
    behaviorSignals: {
      pageviewsLast7d: 412, vdpViewsLast7d: 18,
      priceAlertsSaved: 3, searchesLast30d: 94,
      avgTimeOnVdpSeconds: 341, returnVisitorScore: 87,
    },
    intentScore: 82,
    trackedVins: ["•••••••••••8123"],
    lastActivity: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    memberId: "member-003",
    memberName: "S.P.",
    urgency: "90_days",
    preferences: {
      makes: ["Lamborghini", "Ferrari", "Aston Martin"],
      models: ["Urus", "Purosangue", "DBX707"],
      yearMin: 2022, yearMax: 2024,
      maxBudget: 400_000, maxMileage: 12_000,
      colors: ["Giallo Orion", "Rosso Mars", "Existing Plum"],
      bodyStyles: ["suv"],
      mustHaveFeatures: ["Carbon Pack", "Lifting System", "Night Vision"],
    },
    behaviorSignals: {
      pageviewsLast7d: 234, vdpViewsLast7d: 9,
      priceAlertsSaved: 2, searchesLast30d: 67,
      avgTimeOnVdpSeconds: 156, returnVisitorScore: 71,
    },
    intentScore: 74,
    trackedVins: [],
    lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_VELOCITY: InventoryVelocity[] = [
  {
    specKey: "porsche-911-2022-2024",
    make: "Porsche", model: "911 GT3 / Turbo S",
    yearRange: [2022, 2024], region: "National",
    avgDaysOnMarket: 4.2, searchVolume7d: 18_340, searchVolumeChange: +23.4,
    priceDeclinePct: 0.8, demandScore: 94,
    supplyCount: 7, velocityTrend: "accelerating",
    retailToWholesaleGap: 24_800,
  },
  {
    specKey: "rolls-royce-ghost-2021-2024",
    make: "Rolls-Royce", model: "Ghost / Ghost Extended",
    yearRange: [2021, 2024], region: "National",
    avgDaysOnMarket: 11.7, searchVolume7d: 6_210, searchVolumeChange: +8.1,
    priceDeclinePct: 1.2, demandScore: 79,
    supplyCount: 3, velocityTrend: "stable",
    retailToWholesaleGap: 38_500,
  },
  {
    specKey: "ferrari-roma-2020-2024",
    make: "Ferrari", model: "Roma",
    yearRange: [2020, 2024], region: "National",
    avgDaysOnMarket: 6.8, searchVolume7d: 9_870, searchVolumeChange: +14.6,
    priceDeclinePct: 0.6, demandScore: 88,
    supplyCount: 5, velocityTrend: "accelerating",
    retailToWholesaleGap: 29_200,
  },
  {
    specKey: "lamborghini-urus-2022-2024",
    make: "Lamborghini", model: "Urus / Urus S",
    yearRange: [2022, 2024], region: "National",
    avgDaysOnMarket: 8.4, searchVolume7d: 12_450, searchVolumeChange: +18.9,
    priceDeclinePct: 1.0, demandScore: 86,
    supplyCount: 9, velocityTrend: "accelerating",
    retailToWholesaleGap: 21_300,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fullpathApiCall(path: string): Promise<any> {
  if (!FULLPATH_API_KEY) return null;
  const res = await fetch(`${FULLPATH_BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${FULLPATH_API_KEY}`,
      "Content-Type": "application/json",
      "X-Platform": "3c-onyx",
    },
  });
  if (!res.ok) throw new Error(`Fullpath API error: ${res.status}`);
  return res.json();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/fullpath/status
router.get("/status", async (_req: Request, res: Response) => {
  if (!FULLPATH_API_KEY) {
    return res.json({
      connected: false,
      mode: "mock",
      message: "Add FULLPATH_API_KEY to Replit Secrets to connect live Fullpath data streams.",
      mockDataActive: true,
      mockProfiles: MOCK_SHOPPER_INTENTS.length,
      setupUrl: "https://replit.com/secrets",
    });
  }

  try {
    await fullpathApiCall("/health");
    return res.json({ connected: true, mode: "live", apiVersion: "v2" });
  } catch (err: any) {
    return res.json({ connected: false, mode: "error", error: err.message });
  }
});

// GET /api/fullpath/shopper-intent
router.get("/shopper-intent", async (_req: Request, res: Response) => {
  if (FULLPATH_API_KEY) {
    try {
      const data = await fullpathApiCall("/shopper-intent/active");
      return res.json({ source: "live", data });
    } catch { /* fall through to mock */ }
  }

  return res.json({
    source: "mock",
    intents: MOCK_SHOPPER_INTENTS,
    totalMembers: MOCK_SHOPPER_INTENTS.length,
    highIntentCount: MOCK_SHOPPER_INTENTS.filter(i => i.intentScore >= 80).length,
  });
});

// GET /api/fullpath/inventory-velocity
router.get("/inventory-velocity", async (_req: Request, res: Response) => {
  if (FULLPATH_API_KEY) {
    try {
      const data = await fullpathApiCall("/inventory/velocity?region=national");
      return res.json({ source: "live", data });
    } catch { /* fall through to mock */ }
  }

  return res.json({
    source: "mock",
    velocity: MOCK_VELOCITY,
    hotSpecs: MOCK_VELOCITY.filter(v => v.demandScore >= 85).map(v => v.specKey),
  });
});

// POST /api/fullpath/match
router.post("/match", (req: Request, res: Response) => {
  const { make, model, year, wholesalePrice, mileage } = req.body as {
    make: string; model: string; year: number;
    wholesalePrice: number; mileage: number;
  };

  const matches: Array<{
    member: ShopperIntent;
    matchScore: number;
    matchReasons: string[];
    velocity: InventoryVelocity | null;
    strikeScore: number;
  }> = [];

  for (const intent of MOCK_SHOPPER_INTENTS) {
    const reasons: string[] = [];
    let score = 0;

    if (intent.preferences.makes.some(m => m.toLowerCase() === make?.toLowerCase())) {
      score += 30; reasons.push(`Make match: ${make}`);
    }
    if (intent.preferences.models.some(m => model?.toLowerCase().includes(m.toLowerCase()))) {
      score += 25; reasons.push(`Model match: ${model}`);
    }
    if (year >= intent.preferences.yearMin && year <= intent.preferences.yearMax) {
      score += 15; reasons.push(`Year in range: ${year}`);
    }
    if (wholesalePrice <= intent.preferences.maxBudget) {
      score += 20; reasons.push(`Price below budget: $${wholesalePrice.toLocaleString()}`);
    }
    if (mileage <= intent.preferences.maxMileage) {
      score += 10; reasons.push(`Mileage acceptable: ${mileage.toLocaleString()} mi`);
    }

    if (score >= 40) {
      const vel = MOCK_VELOCITY.find(v =>
        v.make.toLowerCase() === make?.toLowerCase() &&
        year >= v.yearRange[0] && year <= v.yearRange[1]
      ) ?? null;

      const strikeScore = Math.min(
        Math.round(score * 0.5 + intent.intentScore * 0.3 + (vel?.demandScore ?? 50) * 0.2),
        100
      );

      matches.push({ member: intent, matchScore: score, matchReasons: reasons, velocity: vel, strikeScore });
    }
  }

  matches.sort((a, b) => b.strikeScore - a.strikeScore);

  return res.json({
    matches,
    totalMatches: matches.length,
    highStrike: matches.filter(m => m.strikeScore >= 75).length,
  });
});

export default router;
