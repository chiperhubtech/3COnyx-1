import {
  pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const clubTierEnum = pgEnum("club_tier", [
  "Crew",
  "Chapter",
  "Organization",
  "International",
]);

export const clubStatusEnum = pgEnum("club_status", [
  "pending",
  "verified",
  "suspended",
]);

export const clubMemberRoleEnum = pgEnum("club_member_role", [
  "President",
  "VicePresident",
  "Treasurer",
  "Secretary",
  "Admin",
  "Member",
]);

export const clubsTable = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  tier: clubTierEnum("tier").notNull().default("Crew"),
  status: clubStatusEnum("status").notNull().default("pending"),
  presidentId: integer("president_id").references(() => usersTable.id, { onDelete: "set null" }),
  qrCode: text("qr_code").unique(),
  referralCode: text("referral_code").unique(),
  vehicleTypes: jsonb("vehicle_types").$type<string[]>().default(["car"]),
  city: text("city"),
  state: text("state"),
  country: text("country").default("US"),
  website: text("website"),
  instagram: text("instagram"),
  treasuryBalanceCents: integer("treasury_balance_cents").notNull().default(0),
  treasuryLifetimeCents: integer("treasury_lifetime_cents").notNull().default(0),
  communityBonusPct: integer("community_bonus_pct").notNull().default(10),
  memberCount: integer("member_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("clubs_president_idx").on(t.presidentId),
  index("clubs_status_idx").on(t.status),
  index("clubs_slug_idx").on(t.slug),
  index("clubs_referral_code_idx").on(t.referralCode),
]);

export const clubMembershipsTable = pgTable("club_memberships", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubsTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  role: clubMemberRoleEnum("role").notNull().default("Member"),
  joinedVia: text("joined_via"),
  earningsCents: integer("earnings_cents").notNull().default(0),
  contributionCents: integer("contribution_cents").notNull().default(0),
  active: boolean("active").notNull().default(true),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("club_memberships_club_idx").on(t.clubId),
  index("club_memberships_user_idx").on(t.userId),
]);

export const clubTreasuryTable = pgTable("club_treasury", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubsTable.id, { onDelete: "cascade" }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  sourceUserId: integer("source_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  transactionRef: text("transaction_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("club_treasury_club_idx").on(t.clubId),
  index("club_treasury_created_idx").on(t.createdAt),
]);

export const insertClubSchema = createInsertSchema(clubsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectClubSchema = createSelectSchema(clubsTable);
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubsTable.$inferSelect;

export const insertClubMembershipSchema = createInsertSchema(clubMembershipsTable).omit({
  id: true, createdAt: true,
});
export type ClubMembership = typeof clubMembershipsTable.$inferSelect;
export type ClubTreasury = typeof clubTreasuryTable.$inferSelect;
