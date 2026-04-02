import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const walletStatusEnum = pgEnum("wallet_status", [
  "Active",
  "Frozen",
  "Suspended",
  "Closed",
]);

export const txDirectionEnum = pgEnum("tx_direction", [
  "Credit",
  "Debit",
]);

export const txCategoryEnum = pgEnum("tx_category", [
  "Referral_Payout",
  "Service_Payout",
  "Logistics_Payout",
  "Location_Payout",
  "Deal_Payout",
  "Split_Distribution",
  "Commission",
  "Remittance_In",
  "Remittance_Out",
  "Platform_Fee",
  "Withdrawal",
  "Deposit",
  "Bonus",
  "Adjustment",
]);

export const onyxWalletsTable = pgTable("onyx_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).unique().notNull(),
  balanceUsd: numeric("balance_usd", { precision: 14, scale: 4 }).notNull().default("0.0000"),
  pendingUsd: numeric("pending_usd", { precision: 14, scale: 4 }).notNull().default("0.0000"),
  lifetimeEarnedUsd: numeric("lifetime_earned_usd", { precision: 14, scale: 4 }).notNull().default("0.0000"),
  lifetimeWithdrawnUsd: numeric("lifetime_withdrawn_usd", { precision: 14, scale: 4 }).notNull().default("0.0000"),
  currency: text("currency").notNull().default("USD"),
  status: walletStatusEnum("status").notNull().default("Active"),
  stripeConnectId: text("stripe_connect_id"),
  payoutMethod: text("payout_method").default("instant"),
  lastPayoutAt: timestamp("last_payout_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("wallet_user_idx").on(t.userId),
  index("wallet_status_idx").on(t.status),
]);

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => onyxWalletsTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  txRef: text("tx_ref").unique().notNull(),
  direction: txDirectionEnum("direction").notNull(),
  category: txCategoryEnum("category").notNull(),
  amountUsd: numeric("amount_usd", { precision: 14, scale: 4 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 14, scale: 4 }).notNull(),
  description: text("description"),
  sourceRef: text("source_ref"),
  counterpartyUserId: integer("counterparty_user_id"),
  proofHash: text("proof_hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("wtx_wallet_idx").on(t.walletId),
  index("wtx_user_idx").on(t.userId),
  index("wtx_ref_idx").on(t.txRef),
  index("wtx_direction_idx").on(t.direction),
  index("wtx_category_idx").on(t.category),
  index("wtx_created_idx").on(t.createdAt),
]);

export type OnyxWallet = typeof onyxWalletsTable.$inferSelect;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
