import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const txTypeEnum = pgEnum("tx_type", [
  "PURCHASE",
  "PAYOUT",
  "REFERRAL",
  "SUBSCRIPTION",
  "REFUND",
  "PLATFORM_FEE",
  "TRANSPORT_FEE",
  "PENALTY",
]);

export const txStatusEnum = pgEnum("tx_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "DISPUTED",
]);

export const transactionsTable = pgTable("transactions", {
  id:               serial("id").primaryKey(),
  type:             txTypeEnum("type").notNull(),
  status:           txStatusEnum("status").notNull().default("PENDING"),
  amountCents:      integer("amount_cents").notNull(),
  currency:         text("currency").notNull().default("usd"),
  fromUserId:       integer("from_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  toUserId:         integer("to_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  vehicleVin:       text("vehicle_vin"),
  stripePaymentId:  text("stripe_payment_id"),
  stripeTransferId: text("stripe_transfer_id"),
  description:      text("description"),
  metadata:         text("metadata"),
  completedAt:      timestamp("completed_at",  { withTimezone: true }),
  createdAt:        timestamp("created_at",    { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at",    { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("transactions_stripe_payment_id_idx").on(t.stripePaymentId),
  index("transactions_from_user_id_idx").on(t.fromUserId),
  index("transactions_to_user_id_idx").on(t.toUserId),
  index("transactions_status_idx").on(t.status),
  index("transactions_type_idx").on(t.type),
  index("transactions_vehicle_vin_idx").on(t.vehicleVin),
  index("transactions_created_at_idx").on(t.createdAt),
]);

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTransactionSchema = createSelectSchema(transactionsTable);

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
