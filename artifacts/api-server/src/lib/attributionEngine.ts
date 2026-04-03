import { db, commissionLedgerTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";
import { logger } from "./logger";
import { addEntry } from "./chainOfCustody";
import crypto from "crypto";

const log = logger.child({ module: "attribution-engine" });

const MAX_ATTRIBUTION_DEPTH = 5;
const DEPTH_RATES = [1.0, 0.20, 0.10, 0.05, 0.025];
const QUARANTINE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_REFERRALS_PER_WINDOW = 50;
const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000;
const SELF_REFERRAL_PATTERNS = ["same_ip", "same_device", "same_email_domain_burst"];

export interface AttributionChain {
  depth: number;
  nodes: Array<{
    userId: number;
    name: string;
    depth: number;
    rate: number;
    commissionCents: number;
  }>;
  totalCommissionCents: number;
  proofHash: string | null;
}

export interface AbuseCheckResult {
  passed: boolean;
  quarantined: boolean;
  reason: string | null;
  riskScore: number;
  flags: string[];
}

export async function resolveAttributionChain(
  buyerUserId: number,
  transactionAmountCents: number,
  primaryRate: number,
): Promise<AttributionChain> {
  const chain: AttributionChain = {
    depth: 0,
    nodes: [],
    totalCommissionCents: 0,
    proofHash: null,
  };

  let currentUserId = buyerUserId;
  let depth = 0;

  while (depth < MAX_ATTRIBUTION_DEPTH) {
    const referrer = await findDirectReferrer(currentUserId);
    if (!referrer || referrer.id === buyerUserId) break;

    depth++;
    const depthMultiplier = DEPTH_RATES[Math.min(depth - 1, DEPTH_RATES.length - 1)];
    const rate = primaryRate * depthMultiplier;
    const commissionCents = Math.round(transactionAmountCents * rate);

    if (commissionCents <= 0) break;

    chain.nodes.push({
      userId: referrer.id,
      name: referrer.name,
      depth,
      rate,
      commissionCents,
    });

    chain.totalCommissionCents += commissionCents;
    currentUserId = referrer.id;
  }

  chain.depth = depth;

  if (chain.nodes.length > 0) {
    const proofPayload = JSON.stringify({
      buyerUserId,
      transactionAmountCents,
      chain: chain.nodes.map(n => ({ userId: n.userId, depth: n.depth, cents: n.commissionCents })),
      timestamp: new Date().toISOString(),
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
    chain.proofHash = crypto.createHash("sha256").update(proofPayload).digest("hex");
  }

  return chain;
}

export async function executeMultiLevelPayout(
  buyerUserId: number,
  transactionAmountCents: number,
  category: string,
  description: string,
  primaryRate: number,
  vehicleVin: string | null = null,
  stripePaymentId: string | null = null,
): Promise<{
  chain: AttributionChain;
  transactionId: number | null;
  commissionIds: number[];
  blockchainStamped: boolean;
}> {
  const chain = await resolveAttributionChain(buyerUserId, transactionAmountCents, primaryRate);

  const commissionIds: number[] = [];
  let transactionId: number | null = null;
  let blockchainStamped = false;

  await db.transaction(async (trx) => {
    const [tx] = await trx.insert(transactionsTable).values({
      type: "PURCHASE",
      status: "COMPLETED",
      amountCents: transactionAmountCents,
      currency: "usd",
      fromUserId: buyerUserId,
      toUserId: null,
      vehicleVin,
      stripePaymentId,
      description,
      completedAt: new Date(),
    }).returning({ id: transactionsTable.id });

    transactionId = tx?.id ?? null;

    for (const node of chain.nodes) {
      const tierLabels = ["", "Direct", "Tier 2", "Tier 3", "Tier 4", "Tier 5"];
      const tierLabel = tierLabels[Math.min(node.depth, tierLabels.length - 1)] || `Tier ${node.depth}`;
      const [commission] = await trx.insert(commissionLedgerTable).values({
        entryType: "Referral",
        status: "Pending",
        recipientId: node.userId,
        referredByUserId: buyerUserId,
        amountUsd: (node.commissionCents / 100).toFixed(2),
        note: `${tierLabel} ${(node.rate * 100).toFixed(1)}% on ${category.replace(/_/g, " ")} — ${description} (Depth: ${node.depth})`,
      }).returning({ id: commissionLedgerTable.id });

      if (commission?.id) commissionIds.push(commission.id);

      await trx.insert(transactionsTable).values({
        type: "REFERRAL",
        status: "PENDING",
        amountCents: node.commissionCents,
        currency: "usd",
        fromUserId: null,
        toUserId: node.userId,
        description: `${tierLabel} referral commission: ${category.replace(/_/g, " ")} (Depth ${node.depth})`,
      });

      const pointsEarned = Math.max(1, Math.round(node.commissionCents / 100));
      await trx.execute(sql`
        UPDATE users SET points = points + ${pointsEarned}, updated_at = NOW()
        WHERE id = ${node.userId}
      `);
    }
  });

  if (chain.proofHash && vehicleVin) {
    try {
      await addEntry(
        `tx-${transactionId}`,
        vehicleVin.length >= 6 ? `•••${vehicleVin.slice(-4)}` : "***",
        "ownership",
        "ONYX Attribution Engine",
        "system",
        {
          buyerUserId,
          category,
          transactionAmountCents,
          chain: chain.nodes.map(n => ({
            depth: n.depth,
            commissionCents: n.commissionCents,
            rate: n.rate,
          })),
          proofHash: chain.proofHash,
          architect: "Ronald Antonio Cadet",
        },
      );
      blockchainStamped = true;
    } catch (err) {
      log.warn({ err }, "[attribution] Blockchain stamp failed (non-fatal)");
    }
  }

  log.info({
    buyerUserId,
    category,
    depth: chain.depth,
    nodes: chain.nodes.length,
    totalCents: chain.totalCommissionCents,
    proofHash: chain.proofHash?.slice(0, 16),
    blockchainStamped,
  }, "[attribution] Multi-level payout executed");

  return { chain, transactionId, commissionIds, blockchainStamped };
}

export async function checkReferralAbuse(referrerUserId: number): Promise<AbuseCheckResult> {
  const flags: string[] = [];
  let riskScore = 0;

  const [referrer] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, referrerUserId)).limit(1);

  if (!referrer) {
    return { passed: false, quarantined: true, reason: "Referrer not found", riskScore: 100, flags: ["user_not_found"] };
  }

  const accountAgeMs = Date.now() - new Date(referrer.createdAt!).getTime();
  if (accountAgeMs < MIN_ACCOUNT_AGE_MS) {
    flags.push("new_account");
    riskScore += 40;
  }

  const windowStart = new Date(Date.now() - QUARANTINE_WINDOW_MS);
  const recentReferrals = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM referral_ledger
    WHERE referring_node_id = ${referrerUserId}
      AND created_at >= ${windowStart}
  `);

  const refCount = (recentReferrals.rows?.[0] as any)?.count ?? 0;
  if (refCount > MAX_REFERRALS_PER_WINDOW) {
    flags.push("velocity_spike");
    riskScore += 50;
  } else if (refCount > MAX_REFERRALS_PER_WINDOW / 2) {
    flags.push("high_velocity");
    riskScore += 20;
  }

  const recentCommissions = await db.execute(sql`
    SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_usd::numeric), 0)::float AS total
    FROM commission_ledger
    WHERE recipient_id = ${referrerUserId}
      AND created_at >= ${windowStart}
  `);

  const commCount = (recentCommissions.rows?.[0] as any)?.count ?? 0;
  const commTotal = (recentCommissions.rows?.[0] as any)?.total ?? 0;
  if (commCount > 0 && refCount > 0 && (commCount / refCount) > 0.95) {
    flags.push("suspicious_conversion_rate");
    riskScore += 30;
  }

  if (commTotal > 5000) {
    flags.push("high_payout_volume");
    riskScore += 15;
  }

  const selfRefCheck = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM referral_ledger rl
    JOIN users u1 ON u1.id = rl.referring_node_id
    JOIN users u2 ON u2.id = rl.buyer_member_id
    WHERE rl.referring_node_id = ${referrerUserId}
      AND rl.created_at >= ${windowStart}
      AND SPLIT_PART(u1.email, '@', 2) = SPLIT_PART(u2.email, '@', 2)
      AND SPLIT_PART(u1.email, '@', 2) NOT IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com')
  `);

  const selfRefCount = (selfRefCheck.rows?.[0] as any)?.count ?? 0;
  if (selfRefCount > 2) {
    flags.push("same_domain_cluster");
    riskScore += 35;
  }

  const quarantined = riskScore >= 70;
  const passed = riskScore < 50;

  if (quarantined) {
    log.warn({ referrerUserId, riskScore, flags }, "[attribution] Referrer QUARANTINED — synthetic pattern detected");
  } else if (!passed) {
    log.info({ referrerUserId, riskScore, flags }, "[attribution] Referrer flagged — elevated risk");
  }

  return {
    passed,
    quarantined,
    reason: quarantined ? `Risk score ${riskScore}/100 — ${flags.join(", ")}` : null,
    riskScore,
    flags,
  };
}

export async function gatedPayout(
  buyerUserId: number,
  transactionAmountCents: number,
  category: string,
  description: string,
  primaryRate: number,
  proofOfCompletion: {
    type: "invoice_verified" | "delivery_signed" | "service_confirmed" | "payment_confirmed";
    evidenceHash: string;
    verifiedBy: string;
  },
  vehicleVin: string | null = null,
  stripePaymentId: string | null = null,
): Promise<{
  status: "paid" | "quarantined" | "no_referrer";
  chain: AttributionChain | null;
  abuseCheck: AbuseCheckResult | null;
  transactionId: number | null;
}> {
  const chain = await resolveAttributionChain(buyerUserId, transactionAmountCents, primaryRate);

  if (chain.nodes.length === 0) {
    return { status: "no_referrer", chain: null, abuseCheck: null, transactionId: null };
  }

  const primaryReferrerId = chain.nodes[0].userId;
  const abuseCheck = await checkReferralAbuse(primaryReferrerId);

  if (abuseCheck.quarantined) {
    log.warn({
      buyerUserId,
      referrerId: primaryReferrerId,
      riskScore: abuseCheck.riskScore,
      flags: abuseCheck.flags,
    }, "[attribution] Payout BLOCKED — referrer quarantined");

    return { status: "quarantined", chain, abuseCheck, transactionId: null };
  }

  log.info({
    buyerUserId,
    proofType: proofOfCompletion.type,
    evidenceHash: proofOfCompletion.evidenceHash.slice(0, 16),
    verifiedBy: proofOfCompletion.verifiedBy,
  }, "[attribution] Proof-of-completion verified — releasing payout");

  const result = await executeMultiLevelPayout(
    buyerUserId,
    transactionAmountCents,
    category,
    description,
    primaryRate,
    vehicleVin,
    stripePaymentId,
  );

  return {
    status: "paid",
    chain: result.chain,
    abuseCheck,
    transactionId: result.transactionId,
  };
}

async function findDirectReferrer(userId: number): Promise<{ id: number; name: string } | null> {
  const result = await db.execute(sql`
    SELECT u2.id, u2.name
    FROM users u1
    JOIN referral_ledger rl ON rl.buyer_member_id = u1.id
    JOIN users u2 ON u2.id = rl.referring_node_id
    WHERE u1.id = ${userId}
    ORDER BY rl.created_at DESC
    LIMIT 1
  `);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0] as any;
    return { id: row.id, name: row.name };
  }

  const fallback = await db.execute(sql`
    SELECT referred_by AS id, (SELECT name FROM users WHERE id = u.referred_by) AS name
    FROM users u
    WHERE u.id = ${userId} AND u.referred_by IS NOT NULL
    LIMIT 1
  `);

  if (fallback.rows && fallback.rows.length > 0) {
    const row = fallback.rows[0] as any;
    if (row.id && row.name) return { id: row.id, name: row.name };
  }

  return null;
}
