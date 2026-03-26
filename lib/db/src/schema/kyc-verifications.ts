/**
 * KYC Verifications — Stripe Identity Integration
 * Gating high-ticket B2B transactions and financial underwriting behind
 * verified identity. Required for Dynasty Wallet access above $600/year.
 */
import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const kycStatusEnum = pgEnum("kyc_status", [
  "NOT_STARTED",
  "PENDING",
  "REQUIRES_INPUT",
  "VERIFIED",
  "FAILED",
]);

export const kycVerificationsTable = pgTable("kyc_verifications", {
  id:                     serial("id").primaryKey(),
  userId:                 integer("user_id").notNull(),
  stripeVerifSessionId:   text("stripe_verif_session_id").notNull().unique(),
  status:                 kycStatusEnum("status").notNull().default("NOT_STARTED"),
  /** Stripe-returned redacted last4 of government ID */
  idNumberLast4:          text("id_number_last4"),
  /** Document type: "driving_license" | "passport" | "id_card" */
  documentType:           text("document_type"),
  /** Country code e.g. "US" */
  issuingCountry:         text("issuing_country"),
  /** Reason if verification failed */
  failureReason:          text("failure_reason"),
  /** When Stripe confirmed identity */
  verifiedAt:             timestamp("verified_at", { withTimezone: true }),
  createdAt:              timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KycVerification    = typeof kycVerificationsTable.$inferSelect;
export type NewKycVerification = typeof kycVerificationsTable.$inferInsert;
