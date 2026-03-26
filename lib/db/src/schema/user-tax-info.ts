/**
 * User Tax Info — IRS/FinCEN Compliance
 * Stores encrypted Tax ID (EIN), SSN (last 4 only), and ITIN for 1099-K
 * reporting. Raw SSN/ITIN are NEVER persisted in plaintext — only AES-256-GCM
 * encrypted ciphertext is stored. Decryption key lives only in env secrets.
 *
 * IRS threshold: $600/year in slice/dividend payouts triggers 1099-K.
 */
import { pgTable, serial, integer, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const w9StatusEnum = pgEnum("w9_status", [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "VERIFIED",
  "INVALID",
]);

export const taxIdTypeEnum = pgEnum("tax_id_type", [
  "SSN",
  "EIN",
  "ITIN",
]);

export const userTaxInfoTable = pgTable("user_tax_info", {
  id:                    serial("id").primaryKey(),
  userId:                integer("user_id").notNull().unique(),
  taxIdType:             taxIdTypeEnum("tax_id_type"),
  /** AES-256-GCM encrypted tax ID — NEVER store plaintext */
  taxIdEncrypted:        text("tax_id_encrypted"),
  taxIdIv:               text("tax_id_iv"),
  taxIdTag:              text("tax_id_tag"),
  /** Last 4 digits of SSN/ITIN — plaintext for display only */
  last4:                 text("last4"),
  w9Status:              w9StatusEnum("w9_status").notNull().default("NOT_SUBMITTED"),
  w9SubmittedAt:         timestamp("w9_submitted_at", { withTimezone: true }),
  /** True when annual slice earnings ≥ $600 — triggers 1099-K workflow */
  threshold1099Reached:  boolean("threshold_1099_reached").notNull().default(false),
  /** Total slice earnings this calendar year (cents) */
  annualEarningsCents:   integer("annual_earnings_cents").notNull().default(0),
  /** Year this record applies to (e.g. 2026) */
  taxYear:               integer("tax_year").notNull().default(new Date().getFullYear()),
  /** IRS-issued 1099-K form number if filed */
  form1099kRef:          text("form_1099k_ref"),
  createdAt:             timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserTaxInfo    = typeof userTaxInfoTable.$inferSelect;
export type NewUserTaxInfo = typeof userTaxInfoTable.$inferInsert;
