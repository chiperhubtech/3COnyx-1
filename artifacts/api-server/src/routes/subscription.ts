/**
 * 3C Onyx — $99/mo Revenue Gate (Stripe Subscription)
 *
 * Routes:
 *   GET  /api/subscription/status    — Check active subscription
 *   POST /api/subscription/checkout  — Create Stripe checkout session
 *   POST /api/subscription/portal    — Customer billing portal
 *   GET  /api/subscription/hectocorn — First-100 stress test stats (Founder ticker)
 *
 * Gate policy:
 *   - No AI features, marketplace data, or wallet operations without active $99/mo sub
 *   - Dev/demo bypass: SUBSCRIPTION_BYPASS=true skips Stripe check
 *   - Production: Stripe subscription webhook must confirm "active" status
 */
import { Router, type Request, type Response } from "express";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router = Router();

// ─── Mock subscription store (production would use DB) ────────────────────────
// In dev, we seed an "active" subscription so founders can demo everything
const MEMBER_SUBS: Record<string, {
  memberId: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  plan: string;
  amount: number;
  currentPeriodEnd: string;
  stripeSubId: string | null;
  cancelAtPeriodEnd: boolean;
}> = {
  "member-001": {
    memberId: "member-001",
    status: "active",
    plan: "3C Onyx — Founding Member",
    amount: 9900,
    currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    stripeSubId: "sub_3C_FOUNDING_DEMO",
    cancelAtPeriodEnd: false,
  },
};

// Default "current" member for demo
const DEFAULT_MEMBER_ID = "member-001";

// ─── Hectocorn stress test seed (First 100 Transactions) ──────────────────────
function generateHectocornData() {
  const now = Date.now();
  const transactions = Array.from({ length: 100 }, (_, i) => {
    const daysAgo = Math.floor((100 - i) / 8);
    const ts = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 8 * 60 * 60 * 1000);
    const amount = Math.floor(Math.random() * 280_000) + 45_000;
    const gmv = amount;
    const platformFee = Math.round(gmv * 0.125);
    const dealerCut = Math.round(gmv * 0.85);
    const transportCut = Math.round(gmv * 0.025);
    const referrerSlice = Math.round(platformFee * 0.20);
    return {
      txnId: `TXN-${(i + 1).toString().padStart(3, "0")}`,
      index: i + 1,
      timestamp: ts.toISOString(),
      amount: gmv,
      splits: {
        dealer: dealerCut,
        transport: transportCut,
        platformFee,
        referrerSlice,
        netPlatform: platformFee - referrerSlice,
      },
      status: i < 95 ? "settled" : i < 98 ? "processing" : "pending",
      vehicle: HECTOCORN_VEHICLES[i % HECTOCORN_VEHICLES.length],
      region: ["West", "Northeast", "South", "Midwest"][i % 4],
      latencyMs: Math.floor(Math.random() * 340) + 80,
    };
  });

  const settled = transactions.filter(t => t.status === "settled");
  const totalGMV = settled.reduce((s, t) => s + t.amount, 0);
  const totalPlatformFee = settled.reduce((s, t) => s + t.splits.platformFee, 0);
  const totalReferrerSlice = settled.reduce((s, t) => s + t.splits.referrerSlice, 0);
  const avgLatency = Math.round(settled.reduce((s, t) => s + t.latencyMs, 0) / settled.length);

  return {
    title: "Hectocorn Stress Test — First 100 Transactions",
    subtitle: "Proving 3C can orchestrate national wholesale at scale",
    transactions,
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
      txnsPerDay: +(100 / 12.5).toFixed(1),
      gmvPerDay: Math.round(totalGMV / 12.5),
      peakRegion: "West",
      peakDay: "Friday",
    },
    generatedAt: new Date().toISOString(),
  };
}

const HECTOCORN_VEHICLES = [
  "Rolls-Royce Ghost", "Bentley Flying Spur", "Ferrari Roma", "Lamborghini Urus",
  "McLaren 720S", "Porsche 911 Turbo S", "Aston Martin DB11", "Mercedes-Benz G63 AMG",
  "BMW M8 Competition", "Lexus LC 500",
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/subscription/status
router.get("/status", async (req: Request, res: Response) => {
  const bypass = process.env.SUBSCRIPTION_BYPASS === "true" || process.env.NODE_ENV !== "production";
  const sub = MEMBER_SUBS[DEFAULT_MEMBER_ID];

  if (bypass && !sub) {
    return res.json({
      active: true,
      bypass: true,
      plan: "3C Onyx — Dev Access",
      amount: 9900,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripeSubId: null,
      cancelAtPeriodEnd: false,
      features: ALL_FEATURES,
    });
  }

  if (!sub) {
    return res.json({ active: false, plan: null, features: [] });
  }

  return res.json({
    active: sub.status === "active" || sub.status === "trialing",
    bypass,
    plan: sub.plan,
    amount: sub.amount,
    currentPeriodEnd: sub.currentPeriodEnd,
    stripeSubId: sub.stripeSubId,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    features: ALL_FEATURES,
  });
});

const ALL_FEATURES = [
  "MarketCheck National Wholesale Engine",
  "Gemini AI Concierge — Unlimited",
  "Guardian Predictive Layer (V2X)",
  "Dynasty Wallet — Triple-Split",
  "Dropship Coordinator",
  "Live Delivery Tracking",
  "SOC2 Audit Vault",
  "NIST-MCP 2026 Security Layer",
  "Founder's Command Center",
  "QR Proof of Delivery",
  "Referral Rewards — 20% Member Slice",
];

// POST /api/subscription/checkout
router.post("/checkout", async (req: Request, res: Response) => {
  const { successUrl, cancelUrl } = req.body as { successUrl?: string; cancelUrl?: string };

  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    // Demo mode — simulate successful checkout
    return res.json({
      url: successUrl ?? "/",
      demo: true,
      message: "Stripe not configured — returning demo success URL",
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "3C Onyx — Founding Member",
              description: "Full platform access: AI Concierge, Guardian, Dynasty Wallet, MarketCheck Engine, and all 15 features.",
              images: [],
            },
            unit_amount: 9900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl ?? `${req.headers.origin}/`,
      cancel_url: cancelUrl ?? `${req.headers.origin}/subscribe`,
      metadata: { platform: "3c-onyx", plan: "founding-member" },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    req.log.error({ err }, "Stripe checkout failed");
    return res.status(500).json({ error: "Checkout session creation failed", detail: err.message });
  }
});

// POST /api/subscription/portal
router.post("/portal", async (req: Request, res: Response) => {
  const { returnUrl } = req.body as { returnUrl?: string };
  const stripe = await getUncachableStripeClient();
  if (!stripe) {
    return res.json({ url: returnUrl ?? "/", demo: true });
  }

  try {
    const sub = MEMBER_SUBS[DEFAULT_MEMBER_ID];
    if (!sub?.stripeSubId || sub.stripeSubId.startsWith("sub_3C_")) {
      return res.json({ url: returnUrl ?? "/", demo: true, message: "Demo subscription — no portal available" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeSubId,
      return_url: returnUrl ?? `${req.headers.origin}/`,
    });
    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: "Portal session failed", detail: err.message });
  }
});

// GET /api/subscription/hectocorn
router.get("/hectocorn", (_req: Request, res: Response) => {
  return res.json(generateHectocornData());
});

export default router;
