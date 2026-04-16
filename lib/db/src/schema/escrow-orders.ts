import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const escrowStatusEnum = pgEnum("escrow_status", [
  "pending",
  "escrowed",
  "in_transit",
  "delivered",
  "released",
  "refunded",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "none",
  "pending",
  "processing",
  "completed",
  "failed",
  "retry_scheduled",
]);

export const escrowOrdersTable = pgTable("escrow_orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").unique().notNull(),
  vehicleId: text("vehicle_id").notNull(),
  vehicleName: text("vehicle_name").notNull(),
  vin: text("vin").notNull(),
  buyerId: integer("buyer_id").references(() => usersTable.id, { onDelete: "set null" }),
  buyerEmail: text("buyer_email").notNull(),
  priceCents: integer("price_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  paymentIntentId: text("payment_intent_id"),
  status: escrowStatusEnum("status").notNull().default("pending"),
  sellerId: integer("seller_id").references(() => usersTable.id, { onDelete: "set null" }),
  runnerId: text("runner_id"),
  sellerConnectedAccountId: text("seller_connected_account_id"),
  runnerConnectedAccountId: text("runner_connected_account_id"),
  blockchainHash: text("blockchain_hash"),
  stripeTransferId: text("stripe_transfer_id"),
  runnerPayoutTransferId: text("runner_payout_transfer_id"),
  payoutStatus: payoutStatusEnum("payout_status").notNull().default("none"),
  payoutRetryCount: integer("payout_retry_count").notNull().default(0),
  payoutLastError: text("payout_last_error"),
  payoutNextRetryAt: timestamp("payout_next_retry_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("escrow_order_id_idx").on(t.orderId),
  index("escrow_buyer_id_idx").on(t.buyerId),
  index("escrow_status_idx").on(t.status),
  index("escrow_payment_intent_idx").on(t.paymentIntentId),
  index("escrow_payout_status_idx").on(t.payoutStatus),
]);

export const insertEscrowOrderSchema = createInsertSchema(escrowOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectEscrowOrderSchema = createSelectSchema(escrowOrdersTable);

export type InsertEscrowOrder = z.infer<typeof insertEscrowOrderSchema>;
export type EscrowOrder = typeof escrowOrdersTable.$inferSelect;
