import { pgTable, text, serial, integer, timestamp, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const remittanceTransfersTable = pgTable("remittance_transfers", {
  id: serial("id").primaryKey(),
  transferRef: text("transfer_ref").unique().notNull(),
  senderUserId: integer("sender_user_id").references(() => usersTable.id).notNull(),
  recipientUserId: integer("recipient_user_id").references(() => usersTable.id),
  recipientName: text("recipient_name"),
  recipientContact: text("recipient_contact"),
  senderCurrency: text("sender_currency").notNull().default("USD"),
  recipientCurrency: text("recipient_currency").notNull().default("USD"),
  sendAmountOriginal: numeric("send_amount_original", { precision: 14, scale: 4 }).notNull(),
  receiveAmountConverted: numeric("receive_amount_converted", { precision: 14, scale: 4 }).notNull(),
  fxRate: numeric("fx_rate", { precision: 12, scale: 6 }),
  platformFeeUsd: numeric("platform_fee_usd", { precision: 10, scale: 4 }).notNull(),
  purpose: text("purpose").notNull(),
  serviceType: text("service_type"),
  vin: text("vin"),
  status: text("status").notNull().default("Initiated"),
  paymentRail: text("payment_rail").default("Stripe"),
  proofHash: text("proof_hash"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("rem_ref_idx").on(t.transferRef),
  index("rem_sender_idx").on(t.senderUserId),
  index("rem_recipient_idx").on(t.recipientUserId),
  index("rem_status_idx").on(t.status),
  index("rem_purpose_idx").on(t.purpose),
]);

export type RemittanceTransfer = typeof remittanceTransfersTable.$inferSelect;
