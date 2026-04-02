import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index } from "drizzle-orm/pg-core";

export const jurisdictionStatusEnum = pgEnum("jurisdiction_status", [
  "Active",
  "Pending_Approval",
  "Restricted",
  "Blocked",
  "Under_Review",
]);

export const complianceJurisdictionsTable = pgTable("compliance_jurisdictions", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  status: jurisdictionStatusEnum("status").notNull().default("Active"),
  regulatoryBody: text("regulatory_body"),
  licenseRequired: boolean("license_required").notNull().default(false),
  licenseNumber: text("license_number"),
  taxRatePct: text("tax_rate_pct"),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  restrictions: jsonb("restrictions").$type<string[]>().default([]),
  supportedCurrencies: jsonb("supported_currencies").$type<string[]>().default(["USD"]),
  dataResidencyRequired: boolean("data_residency_required").notNull().default(false),
  consentModel: text("consent_model").default("opt-in"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  lastAuditAt: timestamp("last_audit_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("jurisdiction_code_idx").on(t.code),
  index("jurisdiction_country_idx").on(t.country),
  index("jurisdiction_status_idx").on(t.status),
]);

export const complianceReportsTable = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  reportType: text("report_type").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  status: text("status").notNull().default("draft"),
  transactionCount: integer("transaction_count").default(0),
  totalVolumeUsd: text("total_volume_usd"),
  findings: jsonb("findings"),
  generatedBy: text("generated_by").default("system"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("compliance_report_jurisdiction_idx").on(t.jurisdictionCode),
  index("compliance_report_type_idx").on(t.reportType),
  index("compliance_report_period_idx").on(t.reportingPeriod),
]);

export type ComplianceJurisdiction = typeof complianceJurisdictionsTable.$inferSelect;
export type ComplianceReport = typeof complianceReportsTable.$inferSelect;
