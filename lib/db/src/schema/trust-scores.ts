/**
 * 3C ONYX — Global Trust Score Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Algorithmic Trust Economy
 * Trade Secret TS-TRUST — Proprietary Contribution Quality Scoring
 *
 * The Trust Score is a dynamic, mathematically-computed reputation index
 * that determines a participant's authority level within the ecosystem.
 * Every action — submission, referral, completion, rejection — feeds the
 * scoring algorithm. High-trust nodes bypass AI filtering and earn priority routing.
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const trustTierEnum = pgEnum("trust_tier", [
  "Unverified",
  "Contributor",
  "Verified_Node",
  "Trusted_Node",
  "Keyholder",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "None",
  "Pending",
  "Verified",
  "Rejected",
  "Suspended",
]);

export const trustScoresTable = pgTable("trust_scores", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .unique(),

  externalFingerprint: text("external_fingerprint").unique(),

  displayName: text("display_name"),
  tier: trustTierEnum("tier").notNull().default("Unverified"),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("None"),

  trustScore: numeric("trust_score", { precision: 6, scale: 3 }).notNull().default("50.000"),

  totalSubmissions: integer("total_submissions").notNull().default(0),
  acceptedSubmissions: integer("accepted_submissions").notNull().default(0),
  rejectedSubmissions: integer("rejected_submissions").notNull().default(0),
  spamFlagged: integer("spam_flagged").notNull().default(0),
  dealsSourced: integer("deals_sourced").notNull().default(0),
  dealsClosed: integer("deals_closed").notNull().default(0),
  totalCommissionEarnedUsd: numeric("total_commission_earned_usd", { precision: 14, scale: 2 }).notNull().default("0.00"),

  avgResponseQuality: numeric("avg_response_quality", { precision: 5, scale: 3 }).default("0.000"),
  consecutiveGoodSubmissions: integer("consecutive_good_submissions").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),

  verificationData: jsonb("verification_data"),
  metadata: jsonb("metadata"),

  architect: text("architect").notNull().default("Ronald Antonio Cadet"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("trust_user_idx").on(t.userId),
  index("trust_tier_idx").on(t.tier),
  index("trust_score_idx").on(t.trustScore),
  index("trust_fingerprint_idx").on(t.externalFingerprint),
  index("trust_verification_idx").on(t.verificationStatus),
]);

export const trustEventLogTable = pgTable("trust_event_log", {
  id: serial("id").primaryKey(),
  trustScoreId: integer("trust_score_id")
    .references(() => trustScoresTable.id, { onDelete: "cascade" })
    .notNull(),
  eventType: text("event_type").notNull(),
  previousScore: numeric("previous_score", { precision: 6, scale: 3 }),
  newScore: numeric("new_score", { precision: 6, scale: 3 }),
  scoreDelta: numeric("score_delta", { precision: 6, scale: 3 }),
  reason: text("reason"),
  taskId: integer("task_id"),
  dealId: integer("deal_id"),
  metadata: jsonb("metadata"),
  architect: text("architect").notNull().default("Ronald Antonio Cadet"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("trust_event_score_idx").on(t.trustScoreId),
  index("trust_event_type_idx").on(t.eventType),
  index("trust_event_created_idx").on(t.createdAt),
]);

export const insertTrustScoreSchema = createInsertSchema(trustScoresTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTrustScoreSchema = createSelectSchema(trustScoresTable);

export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;
export type TrustScore = typeof trustScoresTable.$inferSelect;
export type TrustEventLog = typeof trustEventLogTable.$inferSelect;
