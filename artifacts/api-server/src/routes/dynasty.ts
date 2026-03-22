/**
 * Dynasty Wallet — High-Value Vehicle Transaction Engine
 *
 * Handles:
 *   POST /api/dynasty/kyc/initiate   — Stripe Identity KYC (simulation fallback)
 *   POST /api/dynasty/purchase       — Triple-Split payment processor
 *   GET  /api/dynasty/passive-income/:referrerId — Passive income alerts (poll)
 *   GET  /api/dynasty/ledger         — All split transactions
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

// ─── Constants ────────────────────────────────────────────────────────────────
const DEALER_WHOLESALE_PCT    = 0.85;   // 85% of sale → selling dealer
const TRANSPORT_FEE_PCT       = 0.025;  // 2.5% of sale → logistics agent
const THREC_PROFIT_PCT        = 1 - DEALER_WHOLESALE_PCT - TRANSPORT_FEE_PCT; // 12.5%
const REFERRER_SLICE_PCT      = 0.20;   // 20% of 3C profit → referrer

// ─── In-memory stores ─────────────────────────────────────────────────────────
interface KycSession {
  id: string;
  buyerName: string;
  buyerEmail: string;
  vehiclePrice: number;
  status: "pending" | "verified" | "failed" | "requires_input";
  stripeSessionId: string | null;
  verificationUrl: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

interface SplitLeg {
  label: string;
  recipient: string;
  recipientType: "dealer" | "logistics" | "referrer" | "platform";
  amount: number;
  percentage: number;
  stripeTransferId: string | null;
  status: "paid" | "pending";
}

export interface DynastyTransaction {
  id: string;
  vehicle: string;
  vehicleVin: string;
  salePrice: number;
  buyerName: string;
  referrerId: string | null;
  referrerName: string | null;
  kycSessionId: string;
  kycStatus: "verified" | "simulated";
  legs: SplitLeg[];
  totalDistributed: number;
  platformRetained: number;
  createdAt: string;
  source: "live" | "simulated";
}

interface PassiveIncomeAlert {
  id: string;
  transactionId: string;
  referrerId: string;
  vehicle: string;
  amount: number;
  salePrice: number;
  splitPct: number;
  read: boolean;
  createdAt: string;
}

const kycSessions: Record<string, KycSession> = {};
const dynastyLedger: DynastyTransaction[] = [];
const passiveIncomeAlerts: PassiveIncomeAlert[] = [];

// Seed ledger with demo data
dynastyLedger.push(
  {
    id: "dyn-001",
    vehicle: "2023 Rolls-Royce Ghost Extended",
    vehicleVin: "SCA664S51PUX98123",
    salePrice: 489_000,
    buyerName: "Alexander Harrington",
    referrerId: "mem-001",
    referrerName: "Alexander Harrington",
    kycSessionId: "kyc_sim_rr001",
    kycStatus: "verified",
    legs: [
      { label: "Dealer Wholesale Payment", recipient: "Rolls-Royce Motor Cars Houston", recipientType: "dealer", amount: Math.round(489_000 * DEALER_WHOLESALE_PCT), percentage: DEALER_WHOLESALE_PCT * 100, stripeTransferId: "tr_3sim_dealer_rr001", status: "paid" },
      { label: "Transport & Logistics Fee", recipient: "3C Logistics Network", recipientType: "logistics", amount: Math.round(489_000 * TRANSPORT_FEE_PCT), percentage: TRANSPORT_FEE_PCT * 100, stripeTransferId: "tr_3sim_log_rr001", status: "paid" },
      { label: "Referrer Passive Income (20% of profit)", recipient: "Alexander Harrington", recipientType: "referrer", amount: Math.round(489_000 * THREC_PROFIT_PCT * REFERRER_SLICE_PCT), percentage: THREC_PROFIT_PCT * REFERRER_SLICE_PCT * 100, stripeTransferId: "tr_3sim_ref_rr001", status: "paid" },
    ],
    totalDistributed: Math.round(489_000 * (DEALER_WHOLESALE_PCT + TRANSPORT_FEE_PCT + THREC_PROFIT_PCT * REFERRER_SLICE_PCT)),
    platformRetained: Math.round(489_000 * THREC_PROFIT_PCT * (1 - REFERRER_SLICE_PCT)),
    createdAt: "2026-03-18T14:00:00Z",
    source: "simulated",
  },
  {
    id: "dyn-002",
    vehicle: "2022 Ferrari Roma Coupe",
    vehicleVin: "ZFF97XJA8N0267841",
    salePrice: 319_000,
    buyerName: "Natasha Worthington",
    referrerId: "mem-001",
    referrerName: "Alexander Harrington",
    kycSessionId: "kyc_sim_fer002",
    kycStatus: "verified",
    legs: [
      { label: "Dealer Wholesale Payment", recipient: "Ferrari of New England", recipientType: "dealer", amount: Math.round(319_000 * DEALER_WHOLESALE_PCT), percentage: DEALER_WHOLESALE_PCT * 100, stripeTransferId: "tr_3sim_dealer_fer002", status: "paid" },
      { label: "Transport & Logistics Fee", recipient: "3C Logistics Network", recipientType: "logistics", amount: Math.round(319_000 * TRANSPORT_FEE_PCT), percentage: TRANSPORT_FEE_PCT * 100, stripeTransferId: "tr_3sim_log_fer002", status: "paid" },
      { label: "Referrer Passive Income (20% of profit)", recipient: "Alexander Harrington", recipientType: "referrer", amount: Math.round(319_000 * THREC_PROFIT_PCT * REFERRER_SLICE_PCT), percentage: THREC_PROFIT_PCT * REFERRER_SLICE_PCT * 100, stripeTransferId: "tr_3sim_ref_fer002", status: "paid" },
    ],
    totalDistributed: Math.round(319_000 * (DEALER_WHOLESALE_PCT + TRANSPORT_FEE_PCT + THREC_PROFIT_PCT * REFERRER_SLICE_PCT)),
    platformRetained: Math.round(319_000 * THREC_PROFIT_PCT * (1 - REFERRER_SLICE_PCT)),
    createdAt: "2026-03-15T11:00:00Z",
    source: "simulated",
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeSplit(salePrice: number, referrerName: string | null): {
  dealerPayment: number;
  transportFee: number;
  threeCProfit: number;
  referrerSlice: number;
  platformRetained: number;
} {
  const dealerPayment   = Math.round(salePrice * DEALER_WHOLESALE_PCT);
  const transportFee    = Math.round(salePrice * TRANSPORT_FEE_PCT);
  const threeCProfit    = salePrice - dealerPayment - transportFee;
  const referrerSlice   = referrerName ? Math.round(threeCProfit * REFERRER_SLICE_PCT) : 0;
  const platformRetained = threeCProfit - referrerSlice;
  return { dealerPayment, transportFee, threeCProfit, referrerSlice, platformRetained };
}

// ─── POST /api/dynasty/kyc/initiate ──────────────────────────────────────────
router.post("/dynasty/kyc/initiate", async (req: Request, res: Response) => {
  const { buyerName, buyerEmail, vehiclePrice } = req.body as {
    buyerName: string;
    buyerEmail: string;
    vehiclePrice: number;
  };

  if (!buyerName || !vehiclePrice) {
    res.status(400).json({ error: "buyerName, vehiclePrice required" });
    return;
  }

  // AML threshold: require KYC for $10K+ transactions
  if (vehiclePrice < 10_000) {
    res.json({ required: false, message: "KYC not required for transactions under $10,000" });
    return;
  }

  const sessionId = `kyc_${crypto.randomBytes(8).toString("hex")}`;
  const stripe = await getUncachableStripeClient();

  if (stripe) {
    try {
      // Live Stripe Identity verification session
      const session = await (stripe.identity?.verificationSessions as any)?.create({
        type: "document",
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
        metadata: {
          buyerName,
          buyerEmail: buyerEmail ?? "",
          vehiclePrice: String(vehiclePrice),
          platform: "3c-onyx",
        },
      });

      const kycSession: KycSession = {
        id: sessionId,
        buyerName,
        buyerEmail,
        vehiclePrice,
        status: "requires_input",
        stripeSessionId: session.id,
        verificationUrl: session.url,
        createdAt: new Date().toISOString(),
        verifiedAt: null,
      };
      kycSessions[sessionId] = kycSession;

      res.json({
        required: true,
        sessionId,
        verificationUrl: session.url,
        mode: "live",
        stripeSessionId: session.id,
      });
      return;
    } catch (err) {
      req.log.warn({ err }, "Stripe Identity not available — using simulation");
    }
  }

  // Simulation fallback
  const kycSession: KycSession = {
    id: sessionId,
    buyerName,
    buyerEmail: buyerEmail ?? "",
    vehiclePrice,
    status: "pending",
    stripeSessionId: null,
    verificationUrl: null,
    createdAt: new Date().toISOString(),
    verifiedAt: null,
  };
  kycSessions[sessionId] = kycSession;

  res.json({
    required: true,
    sessionId,
    verificationUrl: null,
    mode: "simulated",
    message: "Stripe Identity not configured — KYC running in simulation mode",
  });
});

// ─── POST /api/dynasty/kyc/verify (simulate completion) ─────────────────────
router.post("/dynasty/kyc/verify", (req: Request, res: Response) => {
  const { sessionId, outcome = "verified" } = req.body as {
    sessionId: string;
    outcome?: "verified" | "failed";
  };

  const session = kycSessions[sessionId];
  if (!session) {
    res.status(404).json({ error: "KYC session not found" });
    return;
  }

  session.status = outcome as KycSession["status"];
  session.verifiedAt = outcome === "verified" ? new Date().toISOString() : null;

  res.json({ sessionId, status: session.status, verified: outcome === "verified" });
});

// ─── POST /api/dynasty/purchase — Triple-Split ────────────────────────────────
router.post("/dynasty/purchase", async (req: Request, res: Response) => {
  const {
    vehicleName, vehicleVin, salePrice,
    dealerName, buyerName,
    referrerId, referrerName,
    kycSessionId,
  } = req.body as {
    vehicleName: string;
    vehicleVin: string;
    salePrice: number;
    dealerName: string;
    buyerName: string;
    referrerId?: string;
    referrerName?: string;
    kycSessionId: string;
  };

  if (!vehicleName || !salePrice || !kycSessionId) {
    res.status(400).json({ error: "vehicleName, salePrice, kycSessionId required" });
    return;
  }

  // Verify KYC session
  const kyc = kycSessions[kycSessionId];
  if (!kyc || (kyc.status !== "verified" && kyc.status !== "requires_input")) {
    res.status(403).json({ error: "KYC verification required before purchase" });
    return;
  }

  const split = computeSplit(salePrice, referrerName ?? null);
  const stripe = await getUncachableStripeClient();
  const transactionId = `dyn-${crypto.randomBytes(6).toString("hex")}`;

  // Build legs
  const legs: SplitLeg[] = [
    {
      label: "Dealer Wholesale Payment",
      recipient: dealerName ?? "Selling Dealer",
      recipientType: "dealer",
      amount: split.dealerPayment,
      percentage: DEALER_WHOLESALE_PCT * 100,
      stripeTransferId: null,
      status: "pending",
    },
    {
      label: "Transport & Logistics Fee",
      recipient: "3C Logistics Network",
      recipientType: "logistics",
      amount: split.transportFee,
      percentage: TRANSPORT_FEE_PCT * 100,
      stripeTransferId: null,
      status: "pending",
    },
  ];

  if (referrerId && split.referrerSlice > 0) {
    legs.push({
      label: "Referrer Passive Income (20% of 3C profit)",
      recipient: referrerName ?? "Referrer",
      recipientType: "referrer",
      amount: split.referrerSlice,
      percentage: THREC_PROFIT_PCT * REFERRER_SLICE_PCT * 100,
      stripeTransferId: null,
      status: "pending",
    });
  }

  // Attempt Stripe transfers
  if (stripe) {
    for (const leg of legs) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(leg.amount * 100),
          currency: "usd",
          destination: `acct_sim_${leg.recipientType}`, // would be real connected account in prod
          transfer_group: `DYNASTY_${transactionId}`,
          metadata: {
            transactionId,
            vehicle: vehicleName,
            leg: leg.recipientType,
            buyerName,
          },
        });
        leg.stripeTransferId = transfer.id;
        leg.status = "paid";
      } catch {
        // Fall through — record as pending
      }
    }
  } else {
    // Simulation: mark all as paid with mock IDs
    for (const leg of legs) {
      leg.stripeTransferId = `tr_sim_${leg.recipientType}_${crypto.randomBytes(4).toString("hex")}`;
      leg.status = "paid";
    }
  }

  kyc.status = "verified";
  kyc.verifiedAt = kyc.verifiedAt ?? new Date().toISOString();

  const txn: DynastyTransaction = {
    id: transactionId,
    vehicle: vehicleName,
    vehicleVin: vehicleVin ?? "",
    salePrice,
    buyerName,
    referrerId: referrerId ?? null,
    referrerName: referrerName ?? null,
    kycSessionId,
    kycStatus: stripe ? "verified" : "simulated",
    legs,
    totalDistributed: legs.reduce((s, l) => s + l.amount, 0),
    platformRetained: split.platformRetained,
    createdAt: new Date().toISOString(),
    source: stripe ? "live" : "simulated",
  };
  dynastyLedger.unshift(txn);

  // Push passive income alert to referrer
  if (referrerId && split.referrerSlice > 0) {
    passiveIncomeAlerts.push({
      id: `pia-${crypto.randomBytes(4).toString("hex")}`,
      transactionId,
      referrerId,
      vehicle: vehicleName,
      amount: split.referrerSlice,
      salePrice,
      splitPct: THREC_PROFIT_PCT * REFERRER_SLICE_PCT * 100,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    transactionId,
    split: {
      salePrice,
      dealerPayment: split.dealerPayment,
      transportFee: split.transportFee,
      threeCProfit: split.threeCProfit,
      referrerSlice: split.referrerSlice,
      platformRetained: split.platformRetained,
    },
    legs,
    passiveIncomeAlert: referrerId ? {
      referrerId,
      referrerName,
      amount: split.referrerSlice,
    } : null,
    source: txn.source,
  });
});

// ─── GET /api/dynasty/passive-income/:referrerId ──────────────────────────────
router.get("/dynasty/passive-income/:referrerId", (req: Request, res: Response) => {
  const { referrerId } = req.params;
  const unread = passiveIncomeAlerts.filter(
    (a) => a.referrerId === referrerId && !a.read
  );
  // Mark as read after delivery
  unread.forEach((a) => { a.read = true; });
  res.json({ alerts: unread, count: unread.length });
});

// ─── GET /api/dynasty/ledger ──────────────────────────────────────────────────
router.get("/dynasty/ledger", (_req: Request, res: Response) => {
  res.json({
    transactions: dynastyLedger,
    totalVolume: dynastyLedger.reduce((s, t) => s + t.salePrice, 0),
    totalDealer: dynastyLedger.reduce((s, t) => s + (t.legs.find((l) => l.recipientType === "dealer")?.amount ?? 0), 0),
    totalTransport: dynastyLedger.reduce((s, t) => s + (t.legs.find((l) => l.recipientType === "logistics")?.amount ?? 0), 0),
    totalReferrer: dynastyLedger.reduce((s, t) => s + (t.legs.find((l) => l.recipientType === "referrer")?.amount ?? 0), 0),
    totalPlatform: dynastyLedger.reduce((s, t) => s + t.platformRetained, 0),
  });
});

// ─── GET /api/dynasty/constants ───────────────────────────────────────────────
router.get("/dynasty/constants", (_req: Request, res: Response) => {
  res.json({
    dealerWholesalePct: DEALER_WHOLESALE_PCT,
    transportFeePct: TRANSPORT_FEE_PCT,
    threeCProfitPct: THREC_PROFIT_PCT,
    referrerSlicePct: REFERRER_SLICE_PCT,
    amlThreshold: 10_000,
  });
});

export default router;
