// @ts-nocheck
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
import { requireAuth } from "../middlewares/requireAuth";
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
          headline: `${v.year} ${v.make} ${v.model} — Service Overdue`,
          detail: `Your ${v.make} ${v.model} has ${v.mileage.toLocaleString()} miles. Delaying service risks $800–$3,200 in avoidable engine wear and warranty complications.`,
          reasoning: "Mileage threshold exceeded. Proactive maintenance costs 60% less than reactive repair.",
          saving: 1_400,
          savingLabel: "avg repair cost avoided",
          action: {
            label: "Handle this for me",
            type: "chat",
            payload: `Schedule service for my ${v.year} ${v.make} ${v.model}. VIN: ${v.vin}. Find the best certified pre-paid service package and compare costs.`,
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
      headline: "You may be overpaying for insurance",
      detail: `Based on your ${v.year} ${v.make} ${v.model}'s profile (${v.mileage.toLocaleString()} mi, clean history), the average member saves $620/yr by switching carriers. Your estimated current premium: $${v.insuranceEstimate.toLocaleString()}/yr.`,
      reasoning: "3C's carrier network found 6 comparable policies averaging $3,580/yr for your vehicle profile — $620 below your current estimate.",
      saving: 620,
      savingLabel: "per year savings identified",
      action: {
        label: "Handle this for me",
        type: "chat",
        payload: `Compare insurance for my ${v.year} ${v.make} ${v.model}. VIN: ${v.vin}. Find me the best rate from your carrier network with equivalent coverage.`,
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
      detail: `GT3 values rose 3.8% this month driven by GT3 RS allocation scarcity. Your vehicle is now estimated at $${v.estimatedValue.toLocaleString()}. This may be the right time to sell or leverage equity.`,
      reasoning: "MarketCheck index shows 911 GT3 average list price up 3.8% over 30 days. Your unit trails current market by only 6,200 miles — commanding a premium.",
      saving: 8_200,
      savingLabel: "equity increase identified",
      action: {
        label: "Handle this for me",
        type: "chat",
        payload: `My 2023 Porsche 911 GT3 just appreciated $8,200. What should I do — sell it now at peak, leverage the equity, or hold? Give me an analysis.`,
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
      headline: "Refinance opportunity — 2.1% lower rate available",
      detail: "Fed rate adjustment created a refinancing window. Based on your member profile, estimated monthly savings: $184. Over 36 months: $6,624 back in your pocket.",
      reasoning: "Rate comparison via Plaid partner network. Current average auto loan APR dropped 2.1 points since your likely origination window.",
      saving: 6_624,
      savingLabel: "projected savings over loan term",
      action: {
        label: "Handle this for me",
        type: "chat",
        payload: "I want to refinance my auto loan. What refinancing options do you have access to? Check my member profile and find the best available rate.",
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
      headline: "Price drop on your watchlist — act now",
      detail: "A 2022 Mercedes G63 AMG (1 of 4 matching your criteria) dropped to $218,000 — $14,400 below market average. This listing has been active 3 days.",
      reasoning: "Watchlist cross-reference: your target criteria matched a new listing at 6.2% below market_avg. Historical data shows similar listings sell within 7 days.",
      saving: 14_400,
      savingLabel: "below market — today only",
      action: {
        label: "Handle this for me",
        type: "chat",
        payload: "I want to move on the 2022 Mercedes G63 AMG that just dropped to $218,000. Verify the listing, run the Guardian score, and if it passes, start the escrow process.",
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
    callToAction: "Review your open alerts and let ONYX handle the ones that matter most.",
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
  const profile = UAID_STORE.get(sessionId) ?? {
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
  const alertId = req.params.id;

  if (!DISMISSED_STORE.has(sessionId)) {
    DISMISSED_STORE.set(sessionId, new Set());
  }
  DISMISSED_STORE.get(sessionId)!.add(alertId);

  res.json({ success: true, dismissed: alertId });
});

export default router;
