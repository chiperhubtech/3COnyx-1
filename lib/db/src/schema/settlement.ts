import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const settlementStatusEnum = pgEnum("settlement_status", [
  "Pending",
  "Processing",
  "Settled",
  "Failed",
  "Reversed",
  "Held",
]);

export const currencyEnum = pgEnum("currency_code", [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF",
  "CNY", "INR", "BRL", "MXN", "KRW", "AED", "SGD",
  "ZAR", "NGN", "SAR", "HKD", "SEK", "NOK",
]);

export const settlementLedgerTable = pgTable("settlement_ledger", {
  id: serial("id").primaryKey(),
  transactionRef: text("transaction_ref").unique().notNull(),
  fromUserId: integer("from_user_id").references(() => usersTable.id),
  toUserId: integer("to_user_id").references(() => usersTable.id),
  amountLocal: numeric("amount_local", { precision: 18, scale: 4 }).notNull(),
  currencyLocal: currencyEnum("currency_local").notNull().default("USD"),
  amountUsd: numeric("amount_usd", { precision: 18, scale: 4 }).notNull(),
  fxRate: numeric("fx_rate", { precision: 12, scale: 6 }).default("1.000000"),
  fxProvider: text("fx_provider").default("internal"),
  platformFeeUsd: numeric("platform_fee_usd", { precision: 14, scale: 4 }).default("0.0000"),
  netAmountUsd: numeric("net_amount_usd", { precision: 18, scale: 4 }).notNull(),
  status: settlementStatusEnum("status").notNull().default("Pending"),
  settlementMethod: text("settlement_method").default("stripe"),
  region: text("region"),
  jurisdiction: text("jurisdiction"),
  complianceFlags: jsonb("compliance_flags").$type<string[]>().default([]),
  metadata: jsonb("metadata"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("settlement_ref_idx").on(t.transactionRef),
  index("settlement_from_idx").on(t.fromUserId),
  index("settlement_to_idx").on(t.toUserId),
  index("settlement_status_idx").on(t.status),
  index("settlement_currency_idx").on(t.currencyLocal),
  index("settlement_region_idx").on(t.region),
]);

export const fxRatesTable = pgTable("fx_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  quoteCurrency: text("quote_currency").notNull(),
  rate: numeric("rate", { precision: 12, scale: 6 }).notNull(),
  source: text("source").notNull().default("ecb"),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
}, (t) => [
  index("fx_pair_idx").on(t.baseCurrency, t.quoteCurrency),
]);

export type SettlementLedger = typeof settlementLedgerTable.$inferSelect;
export type FxRate = typeof fxRatesTable.$inferSelect;
