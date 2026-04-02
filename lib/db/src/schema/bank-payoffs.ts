import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const payoffStatusEnum = pgEnum("payoff_status", [
  "Initiated",
  "Lender_Contacted",
  "Payoff_Quote_Received",
  "Funding_Requested",
  "Funded",
  "Lien_Released",
  "Title_Clear",
  "Completed",
  "Failed",
  "Cancelled",
]);

export const bankPayoffsTable = pgTable("bank_payoffs", {
  id: serial("id").primaryKey(),
  payoffRef: text("payoff_ref").unique().notNull(),
  requestedByUserId: integer("requested_by_user_id").references(() => usersTable.id).notNull(),
  vin: text("vin").notNull(),
  lenderName: text("lender_name").notNull(),
  lenderPhone: text("lender_phone"),
  lenderAddress: text("lender_address"),
  accountNumber: text("account_number_masked"),
  currentPayoffAmount: numeric("current_payoff_amount", { precision: 12, scale: 2 }),
  goodThroughDate: timestamp("good_through_date", { withTimezone: true }),
  perDiemRate: numeric("per_diem_rate", { precision: 8, scale: 2 }),
  fundingSource: text("funding_source"),
  status: payoffStatusEnum("status").notNull().default("Initiated"),
  agentAssigned: text("agent_assigned").default("Finance Agent"),
  proofHash: text("proof_hash"),
  lienReleaseDocUrl: text("lien_release_doc_url"),
  titleClearDocUrl: text("title_clear_doc_url"),
  automationLog: jsonb("automation_log").$type<Array<{ step: string; ts: string; status: string; detail?: string }>>().default([]),
  metadata: jsonb("metadata"),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("payoff_ref_idx").on(t.payoffRef),
  index("payoff_user_idx").on(t.requestedByUserId),
  index("payoff_vin_idx").on(t.vin),
  index("payoff_status_idx").on(t.status),
  index("payoff_lender_idx").on(t.lenderName),
]);

export const warrantyIntelTable = pgTable("warranty_intel", {
  id: serial("id").primaryKey(),
  vin: text("vin").unique().notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  warrantyStatus: text("warranty_status").notNull().default("Unknown"),
  factoryWarrantyExpiry: timestamp("factory_warranty_expiry", { withTimezone: true }),
  powertrainExpiry: timestamp("powertrain_expiry", { withTimezone: true }),
  extendedWarrantyProvider: text("extended_warranty_provider"),
  extendedWarrantyExpiry: timestamp("extended_warranty_expiry", { withTimezone: true }),
  recallCount: integer("recall_count").default(0),
  openRecalls: jsonb("open_recalls").$type<Array<{ campaign: string; description: string; severity: string }>>().default([]),
  coverageDetails: jsonb("coverage_details"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationSource: text("verification_source").default("ONYX-Warranty-Intel"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("warranty_vin_idx").on(t.vin),
  index("warranty_status_idx").on(t.warrantyStatus),
  index("warranty_make_idx").on(t.make),
]);

export type BankPayoff = typeof bankPayoffsTable.$inferSelect;
export type WarrantyIntel = typeof warrantyIntelTable.$inferSelect;
