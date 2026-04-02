import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const nodeRoleEnum = pgEnum("node_role", [
  "Referral",
  "Service",
  "Logistics",
  "Hosting",
  "Hybrid",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "Available",
  "Sent",
  "Claimed",
  "Expired",
  "Revoked",
]);

export const inviteTreeTable = pgTable("invite_tree", {
  id: serial("id").primaryKey(),
  inviterUserId: integer("inviter_user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  inviteHash: text("invite_hash").unique().notNull(),
  status: inviteStatusEnum("status").notNull().default("Available"),
  claimedByUserId: integer("claimed_by_user_id").references(() => usersTable.id),
  sentToEmail: text("sent_to_email"),
  sentToPhone: text("sent_to_phone"),
  depth: integer("depth").notNull().default(0),
  chainSignature: text("chain_signature"),
  metadata: jsonb("metadata"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("invite_inviter_idx").on(t.inviterUserId),
  index("invite_code_idx").on(t.inviteCode),
  index("invite_status_idx").on(t.status),
  index("invite_claimed_by_idx").on(t.claimedByUserId),
]);

export const nodeProfilesTable = pgTable("node_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).unique().notNull(),
  onyxId: text("onyx_id").unique().notNull(),
  primaryRole: nodeRoleEnum("primary_role").notNull().default("Referral"),
  activeRoles: jsonb("active_roles").$type<string[]>().default(["Referral"]),
  invitesRemaining: integer("invites_remaining").notNull().default(5),
  invitesUsed: integer("invites_used").notNull().default(0),
  totalNodesRecruited: integer("total_nodes_recruited").notNull().default(0),
  lifetimeEarningsUsd: text("lifetime_earnings_usd").default("0.00"),
  treeDepth: integer("tree_depth").notNull().default(0),
  parentNodeId: integer("parent_node_id"),
  geoHash: text("geo_hash"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  serviceRadius: integer("service_radius_miles").default(25),
  isAvailable: boolean("is_available").notNull().default(true),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  capabilities: jsonb("capabilities").$type<string[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  rating: integer("rating").default(100),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("node_user_idx").on(t.userId),
  index("node_onyx_id_idx").on(t.onyxId),
  index("node_role_idx").on(t.primaryRole),
  index("node_geo_idx").on(t.geoHash),
  index("node_available_idx").on(t.isAvailable),
  index("node_parent_idx").on(t.parentNodeId),
]);

export type InviteTree = typeof inviteTreeTable.$inferSelect;
export type NodeProfile = typeof nodeProfilesTable.$inferSelect;
