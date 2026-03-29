/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * Member Covenant Schema
 * ──────────────────────
 * Every member who joins 3C ONYX signs a digital covenant.
 * This is the legal binding that ties their identity to the platform's
 * sovereignty rules permanently.
 *
 * The covenant states:
 *   - They acknowledge Ronald Antonio Cadet as sole owner
 *   - They agree that only Ronald Cadet's family benefits directly
 *   - They agree their membership cannot be used against the platform
 *   - Their IP, device, and timestamp are recorded as evidence
 *
 * This is not a terms-of-service checkbox.
 * This is a legally operative digital instrument.
 */

import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const memberCovenantsTable = pgTable("member_covenants", {
  id:               serial("id").primaryKey(),
  memberId:         integer("member_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  covenantVersion:  text("covenant_version").notNull().default("1.0"),
  signedAt:         timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress:        text("ip_address").notNull(),
  userAgent:        text("user_agent"),
  deviceFingerprint:text("device_fingerprint"),
  acknowledged:     boolean("acknowledged").notNull().default(true),
  covenantHash:     text("covenant_hash").notNull(),     // SHA-256 of covenant text + memberId + timestamp
  covenantText:     text("covenant_text").notNull(),     // Full text stored permanently
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMemberCovenantSchema = createInsertSchema(memberCovenantsTable);
export const selectMemberCovenantSchema = createSelectSchema(memberCovenantsTable);

export type MemberCovenant    = z.infer<typeof selectMemberCovenantSchema>;
export type NewMemberCovenant = z.infer<typeof insertMemberCovenantSchema>;
