/**
 * 3C Onyx — Founder's Command Center
 *
 * Routes:
 *   GET  /api/command/pulse              — Live pulse: K-Factor, slices, missions, revenue
 *   GET  /api/command/k-factor/trend     — 7-day K-Factor sparkline data
 *   GET  /api/command/missions           — Active cars in transit or under Guardian
 *   GET  /api/command/flagged            — AI-flagged high-risk transactions
 *   POST /api/command/override/:id       — Manual kill-switch: approve or reject flagged txn
 *   GET  /api/command/alerts             — System-wide alerts feed
 *   GET  /api/command/mesh/stats         — National Mesh overview (regions)
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
type MissionStatus = "in_transit" | "pickup_pending" | "guardian_active" | "arriving_today" | "delivered";
type RiskReason = "aml_velocity" | "new_account_large_sum" | "k_factor_anomaly" | "geo_mismatch" | "rapid_reversal";
type OverrideAction = "approved" | "rejected";

interface Mission {
  id: string;
  vehicle: string;
  make: string;
  model: string;
  year: number;
  vin: string; // masked
  route: { from: string; to: string };
  carrier: "Ship.cars" | "RunBuggy" | "uShip" | "Guardian";
  status: MissionStatus;
  dayOfTotal: string;       // e.g. "2 of 4"
  etaHours: number;
  dealValue: number;
  guardianActive: boolean;
  lastPingMinutesAgo: number;
  currentCity: string;
  region: "west" | "midwest" | "south" | "northeast";
}

interface FlaggedTransaction {
  id: string;
  txnId: string;
  type: "wire_transfer" | "dynasty_split" | "referral_bonus" | "escrow_release";
  amount: number;
  from: string;
  to: string;
  riskScore: number;   // 0-100
  riskReasons: RiskReason[];
  aiReasoning: string;
  flaggedAt: string;
  resolvedAt: string | null;
  resolution: OverrideAction | null;
  resolvedBy: string | null;
  vehicleId?: string;
  holdUntil: string;  // ISO — auto-releases after 2h if no action
}

interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  body: string;
  timestamp: string;
  acked: boolean;
  source: string;
}

// ─── Seed: Active Missions ─────────────────────────────────────────────────────
const MISSIONS: Mission[] = [
  {
    id: "msn-001", vehicle: "2023 Rolls-Royce Ghost Extended",
    make: "Rolls-Royce", model: "Ghost Extended", year: 2023, vin: "•••••••••••8123",
    route: { from: "Los Angeles, CA", to: "New York, NY" },
    carrier: "Ship.cars", status: "in_transit", dayOfTotal: "2 of 4", etaHours: 47,
    dealValue: 287_500, guardianActive: true, lastPingMinutesAgo: 4, currentCity: "Albuquerque, NM", region: "west",
  },
  {
    id: "msn-002", vehicle: "2023 Ferrari Roma Coupe",
    make: "Ferrari", model: "Roma", year: 2023, vin: "•••••••••••7841",
    route: { from: "Miami, FL", to: "Chicago, IL" },
    carrier: "RunBuggy", status: "pickup_pending", dayOfTotal: "0 of 3", etaHours: 72,
    dealValue: 241_000, guardianActive: false, lastPingMinutesAgo: 12, currentCity: "Miami, FL", region: "south",
  },
  {
    id: "msn-003", vehicle: "2024 Lamborghini Urus S",
    make: "Lamborghini", model: "Urus S", year: 2024, vin: "•••••••••••2290",
    route: { from: "San Francisco, CA", to: "Seattle, WA" },
    carrier: "Guardian", status: "guardian_active", dayOfTotal: "1 of 2", etaHours: 18,
    dealValue: 318_000, guardianActive: true, lastPingMinutesAgo: 1, currentCity: "Portland, OR", region: "west",
  },
  {
    id: "msn-004", vehicle: "2024 Bentley Mulsanne",
    make: "Bentley", model: "Mulsanne", year: 2024, vin: "•••••••••••4417",
    route: { from: "Houston, TX", to: "Dallas, TX" },
    carrier: "Ship.cars", status: "arriving_today", dayOfTotal: "3 of 3", etaHours: 3,
    dealValue: 194_000, guardianActive: true, lastPingMinutesAgo: 2, currentCity: "Corsicana, TX", region: "south",
  },
  {
    id: "msn-005", vehicle: "2024 McLaren 750S",
    make: "McLaren", model: "750S", year: 2024, vin: "•••••••••••9033",
    route: { from: "New York, NY", to: "Boston, MA" },
    carrier: "RunBuggy", status: "in_transit", dayOfTotal: "1 of 2", etaHours: 6,
    dealValue: 389_000, guardianActive: true, lastPingMinutesAgo: 7, currentCity: "Stamford, CT", region: "northeast",
  },
  {
    id: "msn-006", vehicle: "2023 Porsche 911 GT3 RS",
    make: "Porsche", model: "911 GT3 RS", year: 2023, vin: "•••••••••••7001",
    route: { from: "Denver, CO", to: "Las Vegas, NV" },
    carrier: "Ship.cars", status: "in_transit", dayOfTotal: "1 of 2", etaHours: 14,
    dealValue: 247_000, guardianActive: false, lastPingMinutesAgo: 22, currentCity: "St. George, UT", region: "west",
  },
  {
    id: "msn-007", vehicle: "2024 Aston Martin DB12",
    make: "Aston Martin", model: "DB12", year: 2024, vin: "•••••••••••5512",
    route: { from: "Atlanta, GA", to: "Nashville, TN" },
    carrier: "Guardian", status: "guardian_active", dayOfTotal: "1 of 1", etaHours: 4,
    dealValue: 276_000, guardianActive: true, lastPingMinutesAgo: 3, currentCity: "Chattanooga, TN", region: "south",
  },
  {
    id: "msn-008", vehicle: "2023 Maserati GranTurismo",
    make: "Maserati", model: "GranTurismo", year: 2023, vin: "•••••••••••3344",
    route: { from: "Phoenix, AZ", to: "Los Angeles, CA" },
    carrier: "RunBuggy", status: "in_transit", dayOfTotal: "1 of 1", etaHours: 8,
    dealValue: 198_000, guardianActive: false, lastPingMinutesAgo: 31, currentCity: "Palm Springs, CA", region: "west",
  },
];

// ─── Seed: Flagged Transactions (Kill-Switch Queue) ────────────────────────────
const FLAGGED_TXNS: FlaggedTransaction[] = [
  {
    id: "flag-001",
    txnId: "TXN-88241",
    type: "wire_transfer",
    amount: 284_000,
    from: "A.H. (mem-001) — Plaid ACH #3C-0044821",
    to: "Sterling Escrow LLC — Chase #8812xxxx",
    riskScore: 87,
    riskReasons: ["aml_velocity", "geo_mismatch"],
    aiReasoning: "Third large transfer (>$100K) from this account within 48 hours. Total 48h exposure: $612,000. FINCEN velocity rule exceeded. Geographic anomaly: initiating IP is Chicago, IL — account registered in Beverly Hills, CA. Auto-hold per AML Policy 3.2(b). Manual review required.",
    flaggedAt: new Date(Date.now() - 34 * 60_000).toISOString(),
    resolvedAt: null, resolution: null, resolvedBy: null,
    holdUntil: new Date(Date.now() + 86 * 60_000).toISOString(),
  },
  {
    id: "flag-002",
    txnId: "TXN-88309",
    type: "dynasty_split",
    amount: 127_500,
    from: "Dynasty Platform (3C Profit Split)",
    to: "mem-7741 — Stripe Connect acct_1RXk... (New Account, 0 prior payouts)",
    riskScore: 71,
    riskReasons: ["new_account_large_sum"],
    aiReasoning: "Referrer payout of $127,500 to a Stripe Connect account created 6 hours ago with zero prior transaction history. This is the account's first payout and it exceeds the $100K threshold. KYC was completed but Checkr BGC is still processing (ETA 4h). Flagging for founder review before release.",
    flaggedAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    resolvedAt: null, resolution: null, resolvedBy: null,
    vehicleId: "msn-001",
    holdUntil: new Date(Date.now() + 102 * 60_000).toISOString(),
  },
  {
    id: "flag-003",
    txnId: "TXN-88421",
    type: "referral_bonus",
    amount: 45_000,
    from: "3C Referral Engine — K-Factor Payout Batch",
    to: "mem-2209 — Dynasty Wallet",
    riskScore: 64,
    riskReasons: ["k_factor_anomaly"],
    aiReasoning: "Single user (mem-2209) generated 847 referral sign-ups in 72 hours via a single tracking link. Typical top-performer generates 12–40 referrals/week organically. Bot or coordinated fraud pattern suspected. Referral bonus of $45,000 is on hold pending manual confirmation that referred users are human (email verification rate: 34%, expected: >80%).",
    flaggedAt: new Date(Date.now() - 7 * 60_000).toISOString(),
    resolvedAt: null, resolution: null, resolvedBy: null,
    holdUntil: new Date(Date.now() + 113 * 60_000).toISOString(),
  },
];

// ─── Seed: System Alerts ──────────────────────────────────────────────────────
const ALERTS: Alert[] = [
  {
    id: "alt-001", level: "warning",
    title: "Guardian Ping Delayed — msn-006 (Porsche GT3 RS)",
    body: "Last GPS ping was 22 minutes ago. Expected interval: ≤5 min. Carrier notified. Auto-escalates in 8 min.",
    timestamp: new Date(Date.now() - 22 * 60_000).toISOString(), acked: false, source: "Guardian",
  },
  {
    id: "alt-002", level: "critical",
    title: "3 Transactions in Kill-Switch Queue",
    body: "TXN-88241 ($284K), TXN-88309 ($127.5K), TXN-88421 ($45K) awaiting founder override. Total on hold: $456,500.",
    timestamp: new Date(Date.now() - 7 * 60_000).toISOString(), acked: false, source: "AML Engine",
  },
  {
    id: "alt-003", level: "info",
    title: "K-Factor crossed 1.20 — Viral Threshold",
    body: "Network K-Factor reached 1.24 at 14:32. 3C is in viral growth. Dynasty Wallet slices will increase proportionally.",
    timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(), acked: false, source: "Growth Engine",
  },
  {
    id: "alt-004", level: "info",
    title: "msn-004 (Bentley Mulsanne) arriving in ~3 hours",
    body: "ETA: Dallas, TX. QR Proof of Delivery ready. Buyer notified via SMS.",
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(), acked: true, source: "Dropship",
  },
  {
    id: "alt-005", level: "warning",
    title: "Checkr BGC Pending — mem-7741",
    body: "Background check for referrer payout recipient (mem-7741) still processing. Dynasty split for TXN-88309 remains on hold.",
    timestamp: new Date(Date.now() - 18 * 60_000).toISOString(), acked: false, source: "Checkr",
  },
];

// ─── K-Factor trend (7-day) ────────────────────────────────────────────────────
const K_FACTOR_TREND = [
  { day: "Mon", value: 0.89, referrals: 142, conversions: 127 },
  { day: "Tue", value: 0.92, referrals: 189, conversions: 174 },
  { day: "Wed", value: 1.01, referrals: 247, conversions: 249 },
  { day: "Thu", value: 1.08, referrals: 312, conversions: 337 },
  { day: "Fri", value: 1.15, referrals: 401, conversions: 461 },
  { day: "Sat", value: 1.21, referrals: 489, conversions: 591 },
  { day: "Sun", value: 1.24, referrals: 534, conversions: 662 },
];

// ─── GET /api/command/pulse ────────────────────────────────────────────────────
router.get("/command/pulse", (_req: Request, res: Response) => {
  const activeMissions = MISSIONS.filter((m) => m.status !== "delivered");
  const guardianActive = MISSIONS.filter((m) => m.guardianActive).length;
  const unresolved = FLAGGED_TXNS.filter((t) => !t.resolvedAt);
  const holdAmount = unresolved.reduce((s, t) => s + t.amount, 0);
  const currentKFactor = K_FACTOR_TREND[K_FACTOR_TREND.length - 1].value;
  const prevKFactor = K_FACTOR_TREND[K_FACTOR_TREND.length - 2].value;

  res.json({
    kFactor: {
      current: currentKFactor,
      prev: prevKFactor,
      delta: parseFloat((currentKFactor - prevKFactor).toFixed(2)),
      trend: currentKFactor > 1.0 ? "viral" : currentKFactor > 0.8 ? "healthy" : "declining",
      weeklyReferrals: K_FACTOR_TREND.reduce((s, d) => s + d.referrals, 0),
      weeklyConversions: K_FACTOR_TREND.reduce((s, d) => s + d.conversions, 0),
    },
    memberSlices: {
      totalPaid: 1_284_720,
      thisWeek: 247_380,
      thisMonth: 641_200,
      activeRecipients: 312,
      largestSinglePayout: 127_500,
    },
    missions: {
      active: activeMissions.length,
      inTransit: MISSIONS.filter((m) => m.status === "in_transit").length,
      guardianActive,
      arrivingToday: MISSIONS.filter((m) => m.status === "arriving_today").length,
      pickupPending: MISSIONS.filter((m) => m.status === "pickup_pending").length,
      totalDealValue: activeMissions.reduce((s, m) => s + m.dealValue, 0),
    },
    killSwitch: {
      flaggedCount: unresolved.length,
      totalOnHold: holdAmount,
      highestRiskScore: unresolved.length > 0 ? Math.max(...unresolved.map((t) => t.riskScore)) : 0,
    },
    revenue: {
      todayGmv: 1_847_000,
      weekGmv: 9_214_000,
      platformProfit: 1_151_750,  // 12.5% of GMV
      dynastySplitsPending: holdAmount,
    },
    unackedAlerts: ALERTS.filter((a) => !a.acked).length,
    meshRegions: {
      west: MISSIONS.filter((m) => m.region === "west").length,
      midwest: MISSIONS.filter((m) => m.region === "midwest").length,
      south: MISSIONS.filter((m) => m.region === "south").length,
      northeast: MISSIONS.filter((m) => m.region === "northeast").length,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── GET /api/command/k-factor/trend ──────────────────────────────────────────
router.get("/command/k-factor/trend", (_req: Request, res: Response) => {
  res.json({ trend: K_FACTOR_TREND, viralThreshold: 1.0 });
});

// ─── GET /api/command/missions ────────────────────────────────────────────────
router.get("/command/missions", (_req: Request, res: Response) => {
  res.json({ missions: MISSIONS, total: MISSIONS.length });
});

// ─── GET /api/command/flagged ─────────────────────────────────────────────────
router.get("/command/flagged", (_req: Request, res: Response) => {
  res.json({
    flagged: FLAGGED_TXNS,
    unresolved: FLAGGED_TXNS.filter((t) => !t.resolvedAt).length,
    totalOnHold: FLAGGED_TXNS.filter((t) => !t.resolvedAt).reduce((s, t) => s + t.amount, 0),
  });
});

// ─── POST /api/command/override/:id ───────────────────────────────────────────
router.post("/command/override/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, note } = req.body as { action: OverrideAction; note?: string };

  const txn = FLAGGED_TXNS.find((t) => t.id === id);
  if (!txn) { res.status(404).json({ error: "Flagged transaction not found" }); return; }
  if (txn.resolvedAt) { res.status(409).json({ error: "Already resolved", resolution: txn.resolution }); return; }
  if (!["approved", "rejected"].includes(action)) {
    res.status(400).json({ error: "action must be 'approved' or 'rejected'" });
    return;
  }

  txn.resolvedAt = new Date().toISOString();
  txn.resolution = action;
  txn.resolvedBy = "founder@3c-onyx.com";

  // Add a resolved alert
  ALERTS.unshift({
    id: `alt-${crypto.randomBytes(4).toString("hex")}`,
    level: action === "approved" ? "info" : "warning",
    title: `Kill-Switch ${action === "approved" ? "APPROVED" : "REJECTED"} — ${txn.txnId}`,
    body: `${action === "approved" ? "Transaction approved" : "Transaction rejected"} by Founder. Amount: $${txn.amount.toLocaleString()}. ${note ? "Note: " + note : ""}`,
    timestamp: new Date().toISOString(),
    acked: false,
    source: "Founder Kill-Switch",
  });

  res.json({
    txnId: txn.txnId,
    action,
    resolvedAt: txn.resolvedAt,
    resolvedBy: txn.resolvedBy,
    message: action === "approved"
      ? `Transaction ${txn.txnId} approved — funds will be released within 60 seconds.`
      : `Transaction ${txn.txnId} rejected — funds returned to sender. Account flagged for review.`,
  });
});

// ─── GET /api/command/alerts ──────────────────────────────────────────────────
router.get("/command/alerts", (_req: Request, res: Response) => {
  res.json({ alerts: ALERTS });
});

// ─── POST /api/command/alerts/:id/ack ─────────────────────────────────────────
router.post("/command/alerts/:id/ack", (req: Request, res: Response) => {
  const alert = ALERTS.find((a) => a.id === req.params.id);
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  alert.acked = true;
  res.json({ acked: true });
});

// ─── GET /api/command/mesh/stats ──────────────────────────────────────────────
router.get("/command/mesh/stats", (_req: Request, res: Response) => {
  res.json({
    totalNodes: 847,      // active 3C members
    activeCarriers: 12,
    regionsOnline: 4,
    avgResponseTimeMs: 142,
    uptime: 99.94,
    regions: [
      { name: "West Coast",  code: "west",      carriers: 5, missions: MISSIONS.filter(m => m.region === "west").length,      members: 312 },
      { name: "Midwest",     code: "midwest",   carriers: 2, missions: MISSIONS.filter(m => m.region === "midwest").length,   members: 124 },
      { name: "South",       code: "south",     carriers: 3, missions: MISSIONS.filter(m => m.region === "south").length,     members: 228 },
      { name: "Northeast",   code: "northeast", carriers: 2, missions: MISSIONS.filter(m => m.region === "northeast").length, members: 183 },
    ],
  });
});

// ─── GET /api/command/hectocorn ───────────────────────────────────────────────
const HECTOCORN_VEHICLES = [
  "Rolls-Royce Ghost", "Bentley Flying Spur", "Ferrari Roma", "Lamborghini Urus",
  "McLaren 720S", "Porsche 911 Turbo S", "Aston Martin DB11", "Mercedes G63 AMG",
  "BMW M8 Competition", "Lexus LC 500",
];

router.get("/command/hectocorn", (_req: Request, res: Response) => {
  const now = Date.now();
  const transactions = Array.from({ length: 100 }, (_, i) => {
    const daysAgo = Math.floor((100 - i) / 8);
    const ts = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - ((i * 1234567) % (8 * 60 * 60 * 1000)));
    const amount = 45_000 + ((i * 28_317 + 7_823) % 280_000);
    const platformFee = Math.round(amount * 0.125);
    const referrerSlice = Math.round(platformFee * 0.20);
    return {
      txnId: `TXN-${(i + 1).toString().padStart(3, "0")}`,
      index: i + 1,
      timestamp: ts.toISOString(),
      amount,
      splits: {
        dealer: Math.round(amount * 0.85),
        transport: Math.round(amount * 0.025),
        platformFee,
        referrerSlice,
        netPlatform: platformFee - referrerSlice,
      },
      status: i < 95 ? "settled" : i < 98 ? "processing" : "pending",
      vehicle: HECTOCORN_VEHICLES[i % HECTOCORN_VEHICLES.length],
      region: ["West", "Northeast", "South", "Midwest"][i % 4],
      latencyMs: 80 + ((i * 43) % 340),
    };
  });

  const settled = transactions.filter(t => t.status === "settled");
  const totalGMV = settled.reduce((s, t) => s + t.amount, 0);
  const totalPlatformFee = settled.reduce((s, t) => s + t.splits.platformFee, 0);
  const totalReferrerSlice = settled.reduce((s, t) => s + t.splits.referrerSlice, 0);
  const avgLatency = Math.round(settled.reduce((s, t) => s + t.latencyMs, 0) / settled.length);

  res.json({
    title: "Hectocorn Stress Test — First 100 Transactions",
    transactions: transactions.slice(-10).reverse(), // last 10 for display
    allTransactions: transactions,
    summary: {
      total: 100,
      settled: settled.length,
      processing: transactions.filter(t => t.status === "processing").length,
      pending: transactions.filter(t => t.status === "pending").length,
      totalGMV,
      totalPlatformFee,
      totalReferrerSlice,
      netPlatformRevenue: totalPlatformFee - totalReferrerSlice,
      avgDealSize: Math.round(totalGMV / settled.length),
      avgLatencyMs: avgLatency,
      successRate: ((settled.length / 100) * 100).toFixed(1) + "%",
      projectedAnnualGMV: Math.round(totalGMV * 52),
      projectedAnnualProfit: Math.round((totalPlatformFee - totalReferrerSlice) * 52),
    },
    velocity: {
      txnsPerDay: 8,
      gmvPerDay: Math.round(totalGMV / 12.5),
      peakRegion: "West",
      peakDay: "Friday",
    },
  });
});

export default router;
