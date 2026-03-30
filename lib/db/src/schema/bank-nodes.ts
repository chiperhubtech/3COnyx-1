/**
 * 3C ONYX — Bank Node Registry (The "Messy Family" Network)
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Registers bank reps / lenders as Verified Bank Nodes in the 3C Mesh.
 * Each node gets a read-only Rep Portal Key — no waiting for scanned PDFs.
 * "The Stellantis Protocol" — Patent Candidate PAT-04.
 */
import {
  pgTable, text, serial, integer, timestamp, pgEnum, boolean, jsonb, numeric, real,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bankNodeStatusEnum = pgEnum("bank_node_status", [
  "Invited",
  "Pending",
  "Verified",
  "Active",
  "Suspended",
  "Inactive",
]);

export const bankNodeTierEnum = pgEnum("bank_node_tier", [
  "Tier1",    // Stellantis Financial, Ally Financial, Chase Auto
  "Tier2",    // Regional banks, credit unions
  "Tier3",    // Community lenders, specialty finance
  "Pilot",    // Pilot program — first verified nodes
]);

export const partnerNodeCategoryEnum = pgEnum("partner_node_category", [
  "Bank",             // Lenders — Stellantis Financial, Ally, Chase, Capital One
  "WarrantyAdmin",    // Warranty companies — Simoniz, Sonsio, JM&A, Protective
  "Insurance",        // Insurance carriers
  "TitleAgency",      // Title & registration agencies
  "Government",       // DMV, NHTSA, DOT federal portals
]);

export const bankNodesTable = pgTable("bank_nodes", {
  id:               serial("id").primaryKey(),
  nodeCategory:     partnerNodeCategoryEnum("node_category").notNull().default("Bank"),
  institutionName:  text("institution_name").notNull(),    // "Stellantis Financial"
  repName:          text("rep_name").notNull(),             // "Ned"
  repTitle:         text("rep_title"),                      // "Finance Manager"
  repEmail:         text("rep_email"),
  repPhone:         text("rep_phone"),
  tier:             bankNodeTierEnum("tier").notNull().default("Pilot"),
  status:           bankNodeStatusEnum("status").notNull().default("Invited"),
  repPortalKey:     text("rep_portal_key").unique(),        // Read-only access key
  keyGeneratedAt:   timestamp("key_generated_at", { withTimezone: true }),
  keyExpiresAt:     timestamp("key_expires_at", { withTimezone: true }),
  region:           text("region"),                         // "Northeast", "National"
  dealsReviewed:    integer("deals_reviewed").notNull().default(0),
  dealsFunded:      integer("deals_funded").notNull().default(0),
  avgFundingDaysTraditional: real("avg_funding_days_traditional").default(3.5), // before 3C
  avgFundingHours3c: real("avg_funding_hours_3c"),           // after joining mesh
  totalFundedUsd:   numeric("total_funded_usd", { precision: 16, scale: 2 }).default("0"),
  referredNodes:    integer("referred_nodes").notNull().default(0),  // "Family" spread
  isPilotNode:      boolean("is_pilot_node").notNull().default(false),
  invitedAt:        timestamp("invited_at", { withTimezone: true }),
  verifiedAt:       timestamp("verified_at", { withTimezone: true }),
  lastActiveAt:     timestamp("last_active_at", { withTimezone: true }),
  invitedBy:        text("invited_by").default("Ronald Antonio Cadet — 3C ONYX"),
  notes:            text("notes"),
  metadata:         jsonb("metadata"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBankNodeSchema = createInsertSchema(bankNodesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectBankNodeSchema = createSelectSchema(bankNodesTable);
export type InsertBankNode = z.infer<typeof insertBankNodeSchema>;
export type BankNode = typeof bankNodesTable.$inferSelect;
