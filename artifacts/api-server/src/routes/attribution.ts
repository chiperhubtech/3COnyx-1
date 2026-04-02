import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { aiLimiter } from "../middlewares/rateLimiter";
import { db, usersTable, commissionLedgerTable, transactionsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  resolveAttributionChain,
  gatedPayout,
  checkReferralAbuse,
} from "../lib/attributionEngine";
import { isValidCategory, getCommissionRate, type TransactionCategory } from "../lib/commissionEngine";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const log = logger.child({ module: "attribution-api" });

router.get("/node/:id/earnings", requireAuth, async (req: Request, res: Response) => {
  try {
    const nodeId = parseInt(req.params.id as string, 10);
    if (isNaN(nodeId) || nodeId <= 0) {
      res.status(400).json({ error: "Invalid node ID" });
      return;
    }

    const requesterId = (req as unknown as { userId?: number }).userId ?? 0;
    if (requesterId !== nodeId) {
      res.status(403).json({ error: "Can only view your own earnings" });
      return;
    }

    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      referralCode: usersTable.referralCode,
      points: usersTable.points,
    }).from(usersTable).where(eq(usersTable.id, nodeId)).limit(1);

    if (!user) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    const earnings = await db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount_usd::numeric ELSE 0 END), 0)::float AS total_paid,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount_usd::numeric ELSE 0 END), 0)::float AS total_pending,
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN amount_usd::numeric ELSE 0 END), 0)::float AS total_approved,
        COUNT(*)::int AS total_entries,
        COUNT(CASE WHEN status = 'Paid' THEN 1 END)::int AS paid_count,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END)::int AS pending_count
      FROM commission_ledger
      WHERE recipient_id = ${nodeId}
    `);

    const row = (earnings.rows?.[0] as any) ?? {};

    const recentActivity = await db.select({
      id: commissionLedgerTable.id,
      entryType: commissionLedgerTable.entryType,
      status: commissionLedgerTable.status,
      amountUsd: commissionLedgerTable.amountUsd,
      note: commissionLedgerTable.note,
      createdAt: commissionLedgerTable.createdAt,
    })
      .from(commissionLedgerTable)
      .where(eq(commissionLedgerTable.recipientId, nodeId))
      .orderBy(desc(commissionLedgerTable.createdAt))
      .limit(20);

    const networkSize = await db.execute(sql`
      SELECT COUNT(DISTINCT buyer_member_id)::int AS referral_count
      FROM referral_ledger
      WHERE referring_node_id = ${nodeId}
    `);

    const refCount = (networkSize.rows?.[0] as any)?.referral_count ?? 0;

    res.json({
      node: {
        id: user.id,
        name: user.name,
        referralCode: user.referralCode,
        points: user.points,
      },
      earnings: {
        totalPaid: row.total_paid ?? 0,
        totalPending: row.total_pending ?? 0,
        totalApproved: row.total_approved ?? 0,
        totalEntries: row.total_entries ?? 0,
        paidCount: row.paid_count ?? 0,
        pendingCount: row.pending_count ?? 0,
      },
      network: {
        referralCount: refCount,
        attributionDepth: 2,
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        type: a.entryType,
        status: a.status,
        amount: a.amountUsd,
        note: a.note,
        timestamp: a.createdAt,
      })),
      platform: "3C ONYX — Universal Attribution Engine",
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
  } catch (err) {
    log.error({ err }, "[attribution] Earnings fetch failed");
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

const VALID_PROOF_TYPES = new Set(["invoice_verified", "delivery_signed", "service_confirmed", "payment_confirmed"]);
const processedPayoutKeys = new Set<string>();

setInterval(() => {
  if (processedPayoutKeys.size > 10000) processedPayoutKeys.clear();
}, 60 * 60 * 1000);

router.post("/payout/distribute", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  try {
    const requesterId = (req as unknown as { userId?: number; userRole?: string }).userId ?? 0;
    const requesterRole = (req as unknown as { userRole?: string }).userRole ?? "Member";

    const {
      buyerUserId,
      transactionAmountCents,
      category,
      description,
      vehicleVin,
      stripePaymentId,
      proofOfCompletion,
    } = req.body as {
      buyerUserId: number;
      transactionAmountCents: number;
      category: string;
      description: string;
      vehicleVin?: string;
      stripePaymentId?: string;
      proofOfCompletion: {
        type: string;
        evidenceHash: string;
        verifiedBy: string;
      };
    };

    if (!buyerUserId || !transactionAmountCents || !category || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!Number.isInteger(transactionAmountCents) || transactionAmountCents <= 0 || transactionAmountCents > 100_000_00) {
      res.status(400).json({ error: "transactionAmountCents must be a positive integer <= $100,000" });
      return;
    }

    const isAdmin = requesterRole === "Admin" || requesterRole === "Finance";
    if (requesterId !== buyerUserId && !isAdmin) {
      res.status(403).json({ error: "Not authorized — can only distribute payouts for your own transactions or with admin/finance role" });
      return;
    }

    if (!proofOfCompletion?.type || !proofOfCompletion?.evidenceHash || !proofOfCompletion?.verifiedBy) {
      res.status(400).json({ error: "proofOfCompletion required with type, evidenceHash, and verifiedBy" });
      return;
    }

    if (!VALID_PROOF_TYPES.has(proofOfCompletion.type)) {
      res.status(400).json({ error: `Invalid proof type: ${proofOfCompletion.type}` });
      return;
    }

    if (typeof proofOfCompletion.evidenceHash !== "string" || proofOfCompletion.evidenceHash.length < 16) {
      res.status(400).json({ error: "evidenceHash must be at least 16 characters" });
      return;
    }

    if (!isValidCategory(category)) {
      res.status(400).json({ error: `Invalid category: ${category}` });
      return;
    }

    const dedupeKey = stripePaymentId
      ? `stripe:${stripePaymentId}`
      : `proof:${proofOfCompletion.evidenceHash}:${buyerUserId}:${transactionAmountCents}`;

    if (processedPayoutKeys.has(dedupeKey)) {
      res.status(409).json({ error: "Duplicate payout — this transaction has already been processed" });
      return;
    }

    const existingTx = stripePaymentId ? await db.execute(sql`
      SELECT id FROM transactions
      WHERE stripe_payment_id = ${stripePaymentId}
        AND type = 'PURCHASE' AND status = 'COMPLETED'
      LIMIT 1
    `) : null;

    if (existingTx?.rows && existingTx.rows.length > 0) {
      res.status(409).json({ error: "Duplicate payout — stripePaymentId already settled" });
      return;
    }

    processedPayoutKeys.add(dedupeKey);

    const rate = getCommissionRate(category as TransactionCategory);

    const result = await gatedPayout(
      buyerUserId,
      transactionAmountCents,
      category,
      description,
      rate,
      {
        type: proofOfCompletion.type as "invoice_verified" | "delivery_signed" | "service_confirmed" | "payment_confirmed",
        evidenceHash: proofOfCompletion.evidenceHash,
        verifiedBy: proofOfCompletion.verifiedBy,
      },
      vehicleVin ?? null,
      stripePaymentId ?? null,
    );

    if (result.status === "quarantined") {
      processedPayoutKeys.delete(dedupeKey);
      res.status(403).json({
        status: "quarantined",
        reason: "Referral pattern flagged for review — payout held",
        riskScore: result.abuseCheck?.riskScore,
        flags: result.abuseCheck?.flags,
      });
      return;
    }

    res.json({
      status: result.status,
      chain: result.chain ? {
        depth: result.chain.depth,
        nodes: result.chain.nodes.map(n => ({
          depth: n.depth,
          rate: n.rate,
          commissionUsd: (n.commissionCents / 100).toFixed(2),
        })),
        totalCommissionUsd: (result.chain.totalCommissionCents / 100).toFixed(2),
        proofHash: result.chain.proofHash,
      } : null,
      transactionId: result.transactionId,
      platform: "3C ONYX — Universal Attribution Engine",
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
  } catch (err) {
    log.error({ err }, "[attribution] Payout distribution failed");
    res.status(500).json({ error: "Payout distribution failed" });
  }
});

router.get("/attribution/status", (_req: Request, res: Response) => {
  res.json({
    engine: "ONYX Universal Attribution Engine",
    version: "1.0.0",
    status: "LIVE",
    capabilities: [
      "Multi-level attribution (Direct + Secondary)",
      "Proof-of-completion gated payouts",
      "Anti-abuse referral detection & quarantine",
      "Blockchain-stamped attribution chains",
      "Tiered commission rates by category",
      "Real-time earnings hub",
    ],
    attribution: {
      maxDepth: 2,
      secondaryRate: "20% of primary rate",
      proofRequired: true,
      antiAbuse: {
        velocityLimit: "50 referrals / 24h",
        minAccountAge: "1 hour",
        selfReferralDetection: true,
        conversionRateMonitoring: true,
        quarantineThreshold: "Risk score >= 70/100",
      },
    },
    endpoints: {
      earnings: "GET /api/node/:id/earnings",
      distribute: "POST /api/payout/distribute",
      status: "GET /api/attribution/status",
    },
    architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    mandate: "Trust and profit are mathematically linked.",
  });
});

export default router;
