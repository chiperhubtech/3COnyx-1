/**
 * Smart Membership Agreement — Digital Charter
 * Every user (Member, Runner, Specialist) must digitally sign this Charter
 * during onboarding. The signature is cryptographically anchored (SHA-256)
 * and stored immutably for audit, legal, and IRS/FinCEN compliance.
 */
import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const CHARTER_VERSION_CURRENT = "v1.0.0-2026";

export const memberChartersTable = pgTable("member_charters", {
  id:              serial("id").primaryKey(),
  userId:          integer("user_id").notNull(),
  charterVersion:  text("charter_version").notNull().default(CHARTER_VERSION_CURRENT),
  /** SHA-256 of (userId + charterVersion + acceptedAt ISO string) — tamper-evident */
  signatureHash:   text("signature_hash").notNull(),
  /** User acknowledged Member Slice is a loyalty dividend, not wages */
  sliceAckd:       boolean("slice_ackd").notNull().default(false),
  /** User acknowledged data sovereignty rights */
  dataAckd:        boolean("data_ackd").notNull().default(false),
  /** IP address at time of signing (PII-masked before storage) */
  ipAddress:       text("ip_address"),
  /** User agent string (truncated) */
  userAgent:       text("user_agent"),
  acceptedAt:      timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MemberCharter    = typeof memberChartersTable.$inferSelect;
export type NewMemberCharter = typeof memberChartersTable.$inferInsert;
