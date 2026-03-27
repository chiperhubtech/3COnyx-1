/**
 * Intelligence Engine — Proactive AI Automotive Operating System
 * ─────────────────────────────────────────────────────────────
 * GET  /intelligence/alerts          Personalized alert array (auth)
 * GET  /intelligence/savings         Personal savings summary (auth)
 * GET  /intelligence/weekly-digest   This week's value report (auth)
 * GET  /intelligence/profile         UAID profile (auth)
 * POST /intelligence/profile         Update UAID preferences (auth)
 * POST /intelligence/execute         One-tap execute → orchestrator (auth)
 * POST /intelligence/dismiss/:id     Dismiss an alert (auth)
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import * as wsHub from "../lib/wsHub";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type AlertPriority = "critical" | "high" | "medium" | "low";
export type AlertCategory = "insurance" | "service" | "market" | "savings" | "safety" | "finance";

export interface ProactiveAlert {
  id: string;
  priority: AlertPriority;
  category: AlertCategory;
  headline: string;
  detail: string;
  reasoning: string;
  saving: number;
  savingLabel: string;
  action: {
    label: string;
    type: "chat" | "route";
    payload: string;
  };
  createdAt: string;
  dismissed?: boolean;
}

export interface UAIDProfile {
  userId: string;
  sessionId: string;
  vehiclePreferences: {
    makes: string[];
    priceRange?: [number, number];
    bodyStyle?: string[];
  };
  dismissedAlerts: Set<string>;
  actedOnAlerts: string[];
  alertsResolved: number;
  totalDealSavingsIdentified: number;
  weekStartSavings: number;
  weekTasksCompleted: number;
  lastWeeklyReset: string;
  updatedAt: string;
}

/* ─── In-memory stores ───────────────────────────────────────────────────── */

const UAID_STORE = new Map<string, UAIDProfile>();
const DISMISSED_STORE = new Map<string, Set<string>>();

/* ─── Garage demo vehicles (mirrors garage.ts) ───────────────────────────── */
const DEMO_VEHICLES = [
  { id: "v1", year: 2021, make: "BMW", model: "M5", vin: "WBS83CH04MCF20001",    mileage: 28_400, estimatedValue: 89_500, insuranceEstimate: 4_200 },
  { id: "v2", year: 2019, make: "Mercedes", model: "S580", vin: "WDDUG8FB0KA456789", mileage: 46_100, estimatedValue: 62_000, insuranceEstimate: 3_800 },
  { id: "v3", year: 2023, make: "Porsche", model: "911 GT3", vin: "WP0AC2A99PS255123", mileage: 6_200,  estimatedValue: 218_000, insuranceEstimate: 9_100 },
];

/* ─── Alert generation ────────────────────────────────────────────────────── */

function generateAlerts(
  sessionId: string,
  dismissed: Set<string>
): ProactiveAlert[] {
  const alerts: ProactiveAlert[] = [];
  const now = new Date().toISOString();

  DEMO_VEHICLES.forEach((v, i) => {
    const serviceOverdue = v.mileage > 25_000;
    const tireAlert     = v.mileage > 30_000;

    if (serviceOverdue) {
      const id = `service-${v.id}`;
      if (!dismissed.has(id)) {
        alerts.push({
          id,
          priority: tireAlert ? "high" : "medium",
          category: "service",
          headline: `ONYX scheduled service for your ${v.year} ${v.make} ${v.model}`,
          detail: `ONYX detected ${v.mileage.toLocaleString()} miles on your ${v.make} ${v.model}. A certified specialist has been pre-selected and the rate locked in. No action needed — just confirm.`,
          reasoning: "ONYX Guardian flagged mileage threshold. Proactive service locked in at 60% below reactive repair cost.",
          saving: 1_400,
          savingLabel: "repair cost locked out",
          action: {
            label: "Confirm Booking",
            type: "chat",
            payload: `Book the pre-selected service for my ${v.year} ${v.make} ${v.model}. VIN: ${v.vin}. ONYX has already chosen the specialist and locked in the rate — confirm and schedule.`,
          },
          createdAt: now,
        });
      }
    }
  });

  const insId = "insurance-bmw-m5";
  if (!dismissed.has(insId)) {
    const v = DEMO_VEHICLES[0];
    alerts.push({
      id: insId,
      priority: "high",
      category: "insurance",
      headline: `ONYX identified $620/yr in insurance savings — locked in`,
      detail: `ONYX scanned 6 carriers for your ${v.year} ${v.make} ${v.model} (${v.mileage.toLocaleString()} mi, clean history). The optimal policy at $3,580/yr is ready — $620 below your current rate. No shopping needed.`,
      reasoning: "ONYX Insurance Engine ran a full carrier sweep and locked in the best equivalent coverage. No member action required to compare.",
      saving: 620,
      savingLabel: "per year — ONYX locked in",
      action: {
        label: "Activate Savings",
        type: "chat",
        payload: `ONYX has identified the optimal insurance policy for my ${v.year} ${v.make} ${v.model}. VIN: ${v.vin}. Activate the switch — handle all paperwork and notify me when coverage is live.`,
      },
      createdAt: now,
    });
  }

  const mktId = "market-911-appreciation";
  if (!dismissed.has(mktId)) {
    const v = DEMO_VEHICLES[2];
    alerts.push({
      id: mktId,
      priority: "medium",
      category: "market",
      headline: `${v.year} ${v.make} ${v.model} value increased $8,200`,
      detail: `ONYX detected a 3.8% appreciation event on your ${v.year} ${v.make} ${v.model}. Current ONYX valuation: $${v.estimatedValue.toLocaleString()}. ONYX has pre-staged an optimal exit or equity strategy — confirm to execute.`,
      reasoning: "ONYX Price Intelligence detected a GT3 appreciation spike. Strategy pre-calculated: sell at peak, equity extraction, or hold — no analysis needed from member.",
      saving: 8_200,
      savingLabel: "equity captured by ONYX",
      action: {
        label: "Execute Strategy",
        type: "chat",
        payload: `My 2023 Porsche 911 GT3 appreciated $8,200. ONYX: determine the optimal move — sell, equity extraction, or hold — and execute it. Handle all steps, notify me of outcome.`,
      },
      createdAt: now,
    });
  }

  const finId = "finance-refi-opportunity";
  if (!dismissed.has(finId)) {
    alerts.push({
      id: finId,
      priority: "medium",
      category: "finance",
      headline: "ONYX locked in a 2.1% rate reduction on your auto loan",
      detail: "ONYX Rate Watch detected a Fed-driven refinancing window and pre-selected the optimal rate. Monthly savings locked: $184. Over 36 months: $6,624 returned to you. No paperwork needed from you.",
      reasoning: "ONYX Finance Engine identified the rate drop and pre-qualified the refinance. Member confirms — ONYX handles documentation, lender coordination, and closing.",
      saving: 6_624,
      savingLabel: "ONYX locked in — over loan term",
      action: {
        label: "Confirm Refinance",
        type: "chat",
        payload: "Execute my auto loan refinance. ONYX has already identified the optimal rate. Handle all documentation, lender coordination, and closing — notify me when the new rate is live.",
      },
      createdAt: now,
    });
  }

  const safeId = "safety-recall-check";
  if (!dismissed.has(safeId)) {
    alerts.push({
      id: safeId,
      priority: "low",
      category: "safety",
      headline: "NHTSA recall scan complete — all vehicles clear",
      detail: "3C scanned all 3 garage vehicles against the NHTSA recall database. No open safety recalls found. Your Guardian V2X safety score: 97/100.",
      reasoning: "Automated weekly NHTSA scan via Guardian V2X. Last run: today.",
      saving: 0,
      savingLabel: "safety verified",
      action: {
        label: "View Guardian Report",
        type: "route",
        payload: "/guardian",
      },
      createdAt: now,
    });
  }

  const watchId = "watchlist-price-drop";
  if (!dismissed.has(watchId)) {
    alerts.push({
      id: watchId,
      priority: "high",
      category: "savings",
      headline: "ONYX secured a G63 AMG at $14,400 below market — confirm to proceed",
      detail: "ONYX matched a 2022 Mercedes G63 AMG to your watchlist criteria at $218,000. Guardian health score verified. Escrow pre-staged. No negotiation needed — ONYX already locked the price.",
      reasoning: "ONYX Watchlist Engine intercepted a 6.2% below-market listing, ran the full Guardian verification, and pre-staged the escrow. Member confirms — ONYX executes.",
      saving: 14_400,
      savingLabel: "below market — ONYX secured",
      action: {
        label: "Confirm Acquisition",
        type: "chat",
        payload: "ONYX secured the 2022 Mercedes G63 AMG at $218,000. Guardian verified. Confirm escrow and proceed with acquisition — handle inspection, financing, and white-glove delivery. No action needed from me beyond this confirmation.",
      },
      createdAt: now,
    });
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return b.saving - a.saving;
  });

  return alerts;
}

/* ─── Savings computation ─────────────────────────────────────────────────── */

function computePersonalSavings(sessionId: string): {
  totalIdentified: number;
  alertsResolved: number;
  weekSavings: number;
  lifetimeSavings: number;
  breakdown: { label: string; amount: number; date: string }[];
} {
  const profile = UAID_STORE.get(sessionId);
  const alertsResolved = profile?.alertsResolved ?? 2;
  const weekSavings = profile?.weekStartSavings ?? 1_840;

  return {
    totalIdentified: 31_644,
    alertsResolved,
    weekSavings,
    lifetimeSavings: 4_890 + (alertsResolved * 220),
    breakdown: [
      { label: "Insurance optimization",   amount: 620,    date: new Date(Date.now() - 864e5 * 3).toISOString() },
      { label: "G63 AMG marketplace deal",  amount: 14_400, date: new Date(Date.now() - 864e5 * 1).toISOString() },
      { label: "Service cost avoided",      amount: 1_400,  date: new Date(Date.now() - 864e5 * 7).toISOString() },
      { label: "Refinance identified",      amount: 6_624,  date: new Date(Date.now() - 864e5 * 2).toISOString() },
      { label: "GT3 equity captured",       amount: 8_200,  date: new Date().toISOString() },
    ],
  };
}

/* ─── Weekly digest ───────────────────────────────────────────────────────── */

function generateWeeklyDigest(sessionId: string) {
  const profile = UAID_STORE.get(sessionId);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    weekOf: weekStart.toISOString(),
    headline: "Here's what 3C did for you this week",
    summary: "3C monitored your 3 vehicles 24/7, identified $31,644 in total financial opportunities, and kept your fleet running optimally.",
    highlights: [
      { icon: "shield",     label: "NHTSA Recall Scans",         value: "3 vehicles cleared",    impact: "Safety verified" },
      { icon: "trending",   label: "Market Monitoring",           value: "6 price alerts fired",  impact: "$14,400 opportunity found" },
      { icon: "wrench",     label: "Service Intelligence",        value: "1 alert generated",     impact: "$1,400 cost avoided" },
      { icon: "insurance",  label: "Insurance Analysis",          value: "Carrier comparison run", impact: "$620/yr savings identified" },
      { icon: "finance",    label: "Rate Watch",                   value: "Refi window detected",  impact: "$6,624 over 36 months" },
    ],
    totalOpportunity: 31_644,
    callToAction: "ONYX handled your priority actions this week. Review outcomes and confirm anything pending.",
  };
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */

router.get("/intelligence/alerts", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const dismissed = DISMISSED_STORE.get(sessionId) ?? new Set<string>();
  const alerts = generateAlerts(sessionId, dismissed);
  res.json({ alerts, total: alerts.length, ts: new Date().toISOString() });
});

router.get("/intelligence/savings", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const savings = computePersonalSavings(sessionId);
  res.json({ ...savings, ts: new Date().toISOString() });
});

router.get("/intelligence/weekly-digest", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const digest = generateWeeklyDigest(sessionId);
  res.json({ digest, ts: new Date().toISOString() });
});

router.get("/intelligence/profile", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const profile = UAID_STORE.get(sessionId) ?? {
    userId: sessionId,
    sessionId,
    vehiclePreferences: { makes: ["BMW", "Mercedes", "Porsche", "Ferrari"] },
    dismissedAlerts: [],
    actedOnAlerts: [],
    alertsResolved: 2,
    totalDealSavingsIdentified: 31_644,
    weekStartSavings: 1_840,
    weekTasksCompleted: 3,
    lastWeeklyReset: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  res.json({ profile });
});

router.post("/intelligence/profile", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const existing = UAID_STORE.get(sessionId);
  const updated: UAIDProfile = {
    userId: sessionId,
    sessionId,
    vehiclePreferences: { makes: [] },
    dismissedAlerts: new Set(),
    actedOnAlerts: [],
    alertsResolved: 0,
    totalDealSavingsIdentified: 0,
    weekStartSavings: 0,
    weekTasksCompleted: 0,
    lastWeeklyReset: new Date().toISOString(),
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  UAID_STORE.set(sessionId, updated);
  res.json({ success: true, profile: updated });
});

router.post("/intelligence/execute", requireAuth, async (req: Request, res: Response) => {
  const { alertId, message, actionType } = req.body as {
    alertId: string;
    message: string;
    actionType: "chat" | "route";
  };

  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const profile: UAIDProfile = UAID_STORE.get(sessionId) ?? {
    userId: sessionId,
    sessionId,
    vehiclePreferences: { makes: [] },
    dismissedAlerts: new Set<string>(),
    actedOnAlerts: [] as string[],
    alertsResolved: 0,
    totalDealSavingsIdentified: 0,
    weekStartSavings: 0,
    weekTasksCompleted: 0,
    lastWeeklyReset: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (alertId && !profile.actedOnAlerts.includes(alertId)) {
    profile.actedOnAlerts.push(alertId);
    profile.alertsResolved += 1;
    profile.updatedAt = new Date().toISOString();
    UAID_STORE.set(sessionId, profile);
  }

  wsHub.broadcast("notify", {
    type: "INTELLIGENCE_EXECUTE",
    alertId,
    message,
    ts: new Date().toISOString(),
  });

  logger.info({ alertId, actionType }, "[intelligence] One-tap execute triggered");

  res.json({
    success: true,
    redirect: actionType === "chat"
      ? `/concierge?q=${encodeURIComponent(message)}`
      : message,
    ts: new Date().toISOString(),
  });
});

router.post("/intelligence/dismiss/:id", requireAuth, (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id ?? req.ip ?? "anon";
  const alertId = req.params["id"] as string;

  if (!DISMISSED_STORE.has(sessionId)) {
    DISMISSED_STORE.set(sessionId, new Set());
  }
  DISMISSED_STORE.get(sessionId)!.add(alertId);

  res.json({ success: true, dismissed: alertId });
});

// ─── PUBLIC FEED endpoint (optionalAuth) ─────────────────────────────────────
// Bundles alerts + savings + digest in one call for the mobile home feed.
// Works without auth — unauthenticated users get IP-scoped session data.
router.get("/intelligence/feed", optionalAuth, (req: Request, res: Response) => {
  const sessionId = String((req as Request & { user?: { id: string } }).user?.id ?? req.ip ?? "anon");
  const dismissed = DISMISSED_STORE.get(sessionId) ?? new Set<string>();
  const alerts    = generateAlerts(sessionId, dismissed);
  const savings   = computePersonalSavings(sessionId);
  const digest    = generateWeeklyDigest(sessionId);

  res.json({
    alerts,
    savings,
    digest,
    meta: {
      totalAlerts:       alerts.length,
      totalOpportunity:  savings.totalIdentified,
      lifetimeSavings:   savings.lifetimeSavings,
      weekSavings:       savings.weekSavings,
      alertsResolved:    savings.alertsResolved,
    },
    ts: new Date().toISOString(),
  });
});

// ─── FLEET STATUS — vehicle health + driver score ─────────────────────────────
router.get("/intelligence/fleet-status", optionalAuth, (_req: Request, res: Response) => {
  const vehicles = DEMO_VEHICLES.map((v) => {
    const seed        = v.id.charCodeAt(1);
    const oilLifePct  = Math.max(5,  100 - Math.round((v.mileage % 7_500)  / 75));
    const fuelPct     = 30 + (seed * 17 % 60);
    const tirePct     = Math.max(10, 100 - Math.round((v.mileage % 45_000) / 450));
    const epaRange    = v.make === "BMW" ? 280 : v.make === "Mercedes" ? 340 : 190;
    const driverScore = Math.max(65, Math.min(99,
      97
      - (v.mileage > 25_000 ? 8 : 0)
      - Math.round((100 - oilLifePct) / 10)
      + (v.mileage < 10_000 ? 4 : 0)
    ));
    return {
      id:               v.id,
      year:             v.year,
      make:             v.make,
      model:            v.model,
      vin:              v.vin,
      mileage:          v.mileage,
      estimatedValue:   v.estimatedValue,
      oilLifePct,
      fuelLevelPct:     fuelPct,
      tirePct,
      batteryPct:       null as number | null,
      lockStatus:       "locked" as const,
      isOnline:         true,
      lastSeen:         "Just now",
      driverScore,
      rangeRemaining:   Math.round(epaRange * (fuelPct / 100)),
      nextServiceMiles: Math.max(0, 7_500 - (v.mileage % 7_500)),
    };
  });

  const overallDriverScore = Math.round(
    vehicles.reduce((s, v) => s + v.driverScore, 0) / vehicles.length
  );

  res.json({ vehicles, overallDriverScore, ts: new Date().toISOString() });
});

// Public dismiss — works without auth (IP-scoped)
router.post("/intelligence/dismiss-public/:id", optionalAuth, (req: Request, res: Response) => {
  const sessionId = String((req as Request & { user?: { id: string } }).user?.id ?? req.ip ?? "anon");
  const alertId   = String(req.params["id"] ?? "");
  if (!DISMISSED_STORE.has(sessionId)) DISMISSED_STORE.set(sessionId, new Set());
  DISMISSED_STORE.get(sessionId)!.add(alertId);
  res.json({ success: true, dismissed: alertId });
});

export default router;
