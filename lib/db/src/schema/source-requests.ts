/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * ONYX Source — Sovereign Procurement Engine Schema
 * ─────────────────────────────────────────────────
 * Inspired by PERSUIT (side-by-side comparison), JusticeBid (reverse auction),
 * Theorem (anonymous identity protection), and Lawcadia (budget + fee tracking).
 *
 * Members submit service requests anonymously. Vetted vendors compete.
 * ONYX AI scores and ranks bids. Member confirms one recommendation.
 * Platform earns its fee on every award. Member never negotiates.
 */

import {
  pgTable, text, serial, integer, timestamp, pgEnum, boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// ── Category of procurement request ──────────────────────────────────────────
export const sourceCategoryEnum = pgEnum("source_category", [
  "VEHICLE_PURCHASE",
  "VEHICLE_TRANSPORT",
  "VEHICLE_SERVICE",
  "VEHICLE_INSURANCE",
  "LEGAL_SERVICES",
  "FINANCIAL_SERVICES",
  "CONCIERGE",
  "OTHER",
]);

// ── Status of the request lifecycle ──────────────────────────────────────────
export const sourceRequestStatusEnum = pgEnum("source_request_status", [
  "OPEN",         // Accepting bids from vendor network
  "IN_REVIEW",    // ONYX AI is scoring bids
  "AWARDED",      // Member confirmed a vendor
  "CLOSED",       // Closed without award
]);

// ── Fee structure preference ──────────────────────────────────────────────────
export const sourceFeeStructureEnum = pgEnum("source_fee_structure", [
  "FIXED",
  "HOURLY",
  "HYBRID",
  "ANY",
]);

// ── Status of each individual bid ─────────────────────────────────────────────
export const sourceBidStatusEnum = pgEnum("source_bid_status", [
  "PENDING",
  "SHORTLISTED",
  "AWARDED",
  "REJECTED",
]);

// ── Source Requests — member procurement requests ─────────────────────────────
export const sourceRequestsTable = pgTable("source_requests", {
  id:                   serial("id").primaryKey(),
  memberId:             integer("member_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  category:             sourceCategoryEnum("category").notNull(),
  title:                text("title").notNull(),
  description:          text("description").notNull(),
  budgetMinCents:       integer("budget_min_cents").notNull().default(0),
  budgetMaxCents:       integer("budget_max_cents").notNull(),
  feeStructurePref:     sourceFeeStructureEnum("fee_structure_pref").notNull().default("ANY"),
  anonymousToken:       text("anonymous_token").notNull(),        // Sent to vendors; hides member identity
  isAnonymous:          boolean("is_anonymous").notNull().default(true),
  deadline:             timestamp("deadline", { withTimezone: true }).notNull(),
  status:               sourceRequestStatusEnum("status").notNull().default("OPEN"),
  awardedBidId:         integer("awarded_bid_id"),               // FK added after source_bids table
  platformFeeCents:     integer("platform_fee_cents").default(0),
  aiTopBidId:           integer("ai_top_bid_id"),                // ONYX AI recommendation
  aiSummary:            text("ai_summary"),                      // AI reasoning for recommendation
  createdAt:            timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Source Bids — vendor proposals ───────────────────────────────────────────
export const sourceBidsTable = pgTable("source_bids", {
  id:             serial("id").primaryKey(),
  requestId:      integer("request_id").notNull().references(() => sourceRequestsTable.id, { onDelete: "cascade" }),
  vendorId:       integer("vendor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  proposalText:   text("proposal_text").notNull(),
  priceCents:     integer("price_cents").notNull(),
  feeStructure:   sourceFeeStructureEnum("fee_structure").notNull().default("FIXED"),
  deliveryDays:   integer("delivery_days").notNull().default(7),
  credentials:    text("credentials"),                           // Vendor's relevant credentials/certs
  aiScore:        integer("ai_score").default(0),               // ONYX AI score 0–100
  aiReasoning:    text("ai_reasoning"),                         // Why ONYX ranked it this way
  status:         sourceBidStatusEnum("status").notNull().default("PENDING"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Zod Schemas ──────────────────────────────────────────────────────────────
export const insertSourceRequestSchema = createInsertSchema(sourceRequestsTable);
export const selectSourceRequestSchema = createSelectSchema(sourceRequestsTable);
export const insertSourceBidSchema     = createInsertSchema(sourceBidsTable);
export const selectSourceBidSchema     = createSelectSchema(sourceBidsTable);

export type SourceRequest    = z.infer<typeof selectSourceRequestSchema>;
export type NewSourceRequest = z.infer<typeof insertSourceRequestSchema>;
export type SourceBid        = z.infer<typeof selectSourceBidSchema>;
export type NewSourceBid     = z.infer<typeof insertSourceBidSchema>;
