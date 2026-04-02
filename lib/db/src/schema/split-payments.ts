import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const splitStatusEnum = pgEnum("split_status", [
  "Calculated",
  "Pending_Proof",
  "Proof_Verified",
  "Processing",
  "Distributed",
  "Failed",
  "Reversed",
]);

export const splitPaymentsTable = pgTable("split_payments", {
  id: serial("id").primaryKey(),
  splitRef: text("split_ref").unique().notNull(),
  taskRef: text("task_ref"),
  dealRef: text("deal_ref"),
  totalAmountUsd: numeric("total_amount_usd", { precision: 14, scale: 4 }).notNull(),
  platformFeeUsd: numeric("platform_fee_usd", { precision: 14, scale: 4 }).notNull(),
  platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull(),
  status: splitStatusEnum("status").notNull().default("Calculated"),
  proofOfCompletion: text("proof_of_completion"),
  proofHash: text("proof_hash"),
  proofType: text("proof_type"),
  blockchainTxId: text("blockchain_tx_id"),
  metadata: jsonb("metadata"),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  proofVerifiedAt: timestamp("proof_verified_at", { withTimezone: true }),
  distributedAt: timestamp("distributed_at", { withTimezone: true }),
}, (t) => [
  index("split_ref_idx").on(t.splitRef),
  index("split_task_idx").on(t.taskRef),
  index("split_deal_idx").on(t.dealRef),
  index("split_status_idx").on(t.status),
]);

export const splitRecipientsTable = pgTable("split_recipients", {
  id: serial("id").primaryKey(),
  splitId: integer("split_id").references(() => splitPaymentsTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  role: text("role").notNull(),
  label: text("label").notNull(),
  amountUsd: numeric("amount_usd", { precision: 14, scale: 4 }).notNull(),
  percentOfTotal: numeric("percent_of_total", { precision: 5, scale: 2 }).notNull(),
  payoutMethod: text("payout_method").default("wallet"),
  payoutStatus: text("payout_status").default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  transactionRef: text("transaction_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("recipient_split_idx").on(t.splitId),
  index("recipient_user_idx").on(t.userId),
  index("recipient_role_idx").on(t.role),
  index("recipient_status_idx").on(t.payoutStatus),
]);

export type SplitPayment = typeof splitPaymentsTable.$inferSelect;
export type SplitRecipient = typeof splitRecipientsTable.$inferSelect;
