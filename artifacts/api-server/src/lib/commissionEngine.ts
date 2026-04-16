import { db, commissionLedgerTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

export type TransactionCategory =
  | "vehicle_purchase"
  | "parts"
  | "accessories"
  | "service"
  | "oil_change"
  | "tire_rotation"
  | "brake_service"
  | "body_work"
  | "diagnostic"
  | "detailing"
  | "insurance"
  | "transport"
  | "aftermarket"
  | "membership"
  | "custom";

const VALID_CATEGORIES = new Set<string>([
  "vehicle_purchase","parts","accessories","service","oil_change",
  "tire_rotation","brake_service","body_work","diagnostic","detailing",
  "insurance","transport","aftermarket","membership","custom",
]);

const COMMISSION_RATES: Record<TransactionCategory, number> = {
  vehicle_purchase: 0.03,
  parts:            0.05,
  accessories:      0.05,
  service:          0.08,
  oil_change:       0.10,
  tire_rotation:    0.10,
  brake_service:    0.08,
  body_work:        0.06,
  diagnostic:       0.08,
  detailing:        0.10,
  insurance:        0.04,
  transport:        0.05,
  aftermarket:      0.06,
  membership:       0.20,
  custom:           0.05,
};

type DbClient = Pick<typeof db, "select" | "insert" | "update" | "delete" | "execute" | "transaction">;

interface CommissionInput {
  buyerUserId: number;
  transactionAmountCents: number;
  category: TransactionCategory;
  description: string;
  stripePaymentId?: string | null;
  vehicleVin?: string | null;
  metadata?: Record<string, unknown>;
  dbClient?: DbClient;
}

interface CommissionResult {
  commissionCreated: boolean;
  referrerUserId: number | null;
  referrerName: string | null;
  commissionAmountUsd: string;
  commissionRate: number;
  transactionId: number | null;
  commissionLedgerId: number | null;
  error?: string;
}

export function isValidCategory(cat: string): cat is TransactionCategory {
  return VALID_CATEGORIES.has(cat);
}

export async function processUniversalCommission(input: CommissionInput): Promise<CommissionResult> {
  const {
    buyerUserId,
    transactionAmountCents,
    category,
    description,
    stripePaymentId = null,
    vehicleVin = null,
    dbClient,
  } = input;
  const conn = dbClient ?? db;

  const noResult: CommissionResult = {
    commissionCreated: false,
    referrerUserId: null,
    referrerName: null,
    commissionAmountUsd: "0.00",
    commissionRate: 0,
    transactionId: null,
    commissionLedgerId: null,
  };

  if (!Number.isInteger(buyerUserId) || buyerUserId <= 0) {
    return { ...noResult, error: "Invalid buyerUserId" };
  }
  if (!Number.isInteger(transactionAmountCents) || transactionAmountCents <= 0) {
    return { ...noResult, error: "transactionAmountCents must be a positive integer" };
  }
  if (!isValidCategory(category)) {
    return { ...noResult, error: `Invalid category: ${category}` };
  }
  if (!description || typeof description !== "string" || description.length > 500) {
    return { ...noResult, error: "description is required and must be ≤500 chars" };
  }

  const [buyer] = await conn.select({
    id: usersTable.id,
    name: usersTable.name,
    referralCode: usersTable.referralCode,
  }).from(usersTable).where(eq(usersTable.id, buyerUserId)).limit(1);

  if (!buyer) {
    logger.warn({ buyerUserId }, "[CommissionEngine] Buyer not found");
    return { ...noResult, error: "Buyer not found" };
  }

  const referrer = await findReferrer(buyerUserId, conn);

  if (referrer && referrer.id === buyerUserId) {
    logger.warn({ buyerUserId }, "[CommissionEngine] Self-referral blocked");
    return { ...noResult, error: "Self-referral not allowed" };
  }

  if (!referrer) {
    logger.info({ buyerUserId, category }, "[CommissionEngine] No referrer found — no commission owed");

    const [tx] = await conn.insert(transactionsTable).values({
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

    return { ...noResult, transactionId: tx?.id ?? null };
  }

  const rate = COMMISSION_RATES[category];
  const commissionCents = Math.round(transactionAmountCents * rate);
  const commissionUsd = (commissionCents / 100).toFixed(2);

  const executeCommissionWrites = async (writer: DbClient) => {
    const [tx] = await writer.insert(transactionsTable).values({
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

    const [commission] = await writer.insert(commissionLedgerTable).values({
      entryType: "Referral",
      status: "Pending",
      recipientId: referrer.id,
      referredByUserId: buyerUserId,
      amountUsd: commissionUsd,
      note: `${(rate * 100).toFixed(0)}% commission on ${category.replace(/_/g, " ")} — ${description} (Buyer: ${buyer.name})`,
    }).returning({ id: commissionLedgerTable.id });

    await writer.insert(transactionsTable).values({
      type: "REFERRAL",
      status: "PENDING",
      amountCents: commissionCents,
      currency: "usd",
      fromUserId: null,
      toUserId: referrer.id,
      description: `Referral commission: ${category.replace(/_/g, " ")} — ${buyer.name}`,
    });

    const pointsEarned = Math.max(1, Math.round(commissionCents / 100));
    await writer.execute(sql`
      UPDATE users SET points = points + ${pointsEarned}, updated_at = NOW()
      WHERE id = ${referrer.id}
    `);

    return { txId: tx?.id ?? null, commissionId: commission?.id ?? null };
  };

  const result = dbClient
    ? await executeCommissionWrites(dbClient)
    : await db.transaction(async (trx) => executeCommissionWrites(trx));

  logger.info({
    buyerUserId,
    referrerId: referrer.id,
    referrerName: referrer.name,
    category,
    transactionAmountCents,
    commissionCents,
    commissionRate: rate,
  }, "[CommissionEngine] Commission recorded");

  return {
    commissionCreated: true,
    referrerUserId: referrer.id,
    referrerName: referrer.name,
    commissionAmountUsd: commissionUsd,
    commissionRate: rate,
    transactionId: result.txId,
    commissionLedgerId: result.commissionId,
  };
}

async function findReferrer(buyerUserId: number, conn: DbClient = db): Promise<{ id: number; name: string } | null> {
  const result = await conn.execute(sql`
    SELECT u2.id, u2.name
    FROM users u1
    JOIN referral_ledger rl ON rl.buyer_member_id = u1.id
    JOIN users u2 ON u2.id = rl.referring_node_id
    WHERE u1.id = ${buyerUserId}
    ORDER BY rl.created_at DESC
    LIMIT 1
  `);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0] as any;
    return { id: row.id, name: row.name };
  }

  const fallbackResult = await conn.execute(sql`
    SELECT u2.id, u2.name
    FROM users u1
    JOIN referral_ledger rl ON rl.buyer_name = u1.name
    JOIN users u2 ON u2.id = rl.referring_node_id
    WHERE u1.id = ${buyerUserId}
      AND NOT EXISTS (
        SELECT 1 FROM referral_ledger rl2
        WHERE rl2.buyer_member_id = u1.id
      )
    ORDER BY rl.created_at DESC
    LIMIT 1
  `);

  if (fallbackResult.rows && fallbackResult.rows.length > 0) {
    const row = fallbackResult.rows[0] as any;
    return { id: row.id, name: row.name };
  }

  return null;
}

export function getCommissionRate(category: TransactionCategory): number {
  return COMMISSION_RATES[category] ?? 0.05;
}

export function getCommissionRates(): Record<TransactionCategory, number> {
  return { ...COMMISSION_RATES };
}
