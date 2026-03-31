/**
 * 3C ONYX — DealerFlow OS Deal Lifecycle Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Unified Automotive Command Layer (UACL)
 * Trade Secret TS-DEAL — Proprietary Deal Lifecycle & Commission Engine
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vehiclesTable } from "./vehicles";

export const dealStatusEnum = pgEnum("deal_status", [
  "Open",
  "In_Progress",
  "Pending_Finance",
  "Pending_Insurance",
  "Pending_DMV",
  "Pending_Recon",
  "Funded",
  "Delivered",
  "Unwound",
  "Cancelled",
]);

export const dealTypeEnum = pgEnum("deal_type", [
  "New_Sale",
  "Used_Sale",
  "Lease",
  "Wholesale",
  "Trade_In",
]);

export const commissionStatusEnum = pgEnum("deal_commission_status", [
  "Pending",
  "Approved",
  "Paid",
  "Held",
  "Clawback",
]);

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  dealNumber: text("deal_number").notNull().unique(),
  dealType: dealTypeEnum("deal_type").notNull().default("Used_Sale"),
  status: dealStatusEnum("status").notNull().default("Open"),

  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),

  vin: text("vin"),
  vehicleLabel: text("vehicle_label"),
  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id, { onDelete: "set null" }),

  salePrice: numeric("sale_price", { precision: 14, scale: 2 }),
  grossProfit: numeric("gross_profit", { precision: 14, scale: 2 }),
  backEndProfit: numeric("back_end_profit", { precision: 14, scale: 2 }),

  salespersonId: integer("salesperson_id").references(() => usersTable.id, { onDelete: "set null" }),
  salespersonName: text("salesperson_name"),
  financeManagerId: integer("finance_manager_id").references(() => usersTable.id, { onDelete: "set null" }),
  salesManagerId: integer("sales_manager_id").references(() => usersTable.id, { onDelete: "set null" }),

  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  commissionStatus: commissionStatusEnum("commission_status").notNull().default("Pending"),
  commissionPaidAt: timestamp("commission_paid_at", { withTimezone: true }),

  lenderName: text("lender_name"),
  fundedAt: timestamp("funded_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),

  dealershipId: integer("dealership_id").references(() => usersTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("deals_status_idx").on(t.status),
  index("deals_salesperson_idx").on(t.salespersonId),
  index("deals_dealership_idx").on(t.dealershipId),
  index("deals_vin_idx").on(t.vin),
  index("deals_deal_number_idx").on(t.dealNumber),
  index("deals_commission_status_idx").on(t.commissionStatus),
]);

export const insertDealSchema = createInsertSchema(dealsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDealSchema = createSelectSchema(dealsTable);

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
