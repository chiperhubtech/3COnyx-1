import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bayTxStatusEnum = pgEnum("bay_tx_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const bayTransactionsTable = pgTable("bay_transactions", {
  id:               serial("id").primaryKey(),
  qrCode:           text("qr_code").notNull().unique(),
  specialistId:     integer("specialist_id").notNull(),
  runnerId:         integer("runner_id"),
  vehicleVin:       text("vehicle_vin"),
  serviceType:      text("service_type").notNull(),
  serviceLabel:     text("service_label").notNull(),
  grossAmountCents: integer("gross_amount_cents").notNull(),
  feeCents:         integer("fee_cents").notNull(),
  netAmountCents:   integer("net_amount_cents").notNull(),
  dividendCents:    integer("dividend_cents").notNull().default(0),
  stripePaymentId:  text("stripe_payment_id"),
  stripePaymentUrl: text("stripe_payment_url"),
  status:           bayTxStatusEnum("status").notNull().default("PENDING"),
  customerName:     text("customer_name"),
  notes:            text("notes"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt:           timestamp("paid_at", { withTimezone: true }),
});

export const insertBayTransactionSchema = createInsertSchema(bayTransactionsTable).omit({
  id: true,
  createdAt: true,
});

export type BayTransaction    = typeof bayTransactionsTable.$inferSelect;
export type NewBayTransaction = z.infer<typeof insertBayTransactionSchema>;
