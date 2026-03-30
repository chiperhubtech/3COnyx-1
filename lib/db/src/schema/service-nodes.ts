/**
 * 3C ONYX — Service Node Registry (Vendor Portal)
 * Author: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Logistics Agent auto-schedules CUXTOMCANDY services based on proximity
 * to customer and the Milford Node hub. Every connected node earns via
 * the 3% Dynasty Tech Fee on routed work.
 */
import {
  pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb, real,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const serviceNodeTypeEnum = pgEnum("service_node_type", [
  "Paint",
  "Rims",
  "Customization",
  "Detailing",
  "Tires",
  "Upholstery",
  "Wrapping",
  "PPF",
  "WindowTint",
  "AudioVideo",
  "Mechanic",
  "BodyShop",
  "Storage",
  "Other",
]);

export const serviceNodeStatusEnum = pgEnum("service_node_status", [
  "Active",
  "Inactive",
  "Suspended",
  "Pending",
  "Verified",
]);

export const serviceNodesTable = pgTable("service_nodes", {
  id:             serial("id").primaryKey(),
  ownerId:        integer("owner_id")
                    .references(() => usersTable.id, { onDelete: "set null" }),
  name:           text("name").notNull(),
  nodeType:       serviceNodeTypeEnum("node_type").notNull(),
  status:         serviceNodeStatusEnum("status").notNull().default("Pending"),
  address:        text("address").notNull(),
  city:           text("city").notNull(),
  state:          text("state").notNull(),
  zip:            text("zip").notNull(),
  lat:            real("lat"),
  lng:            real("lng"),
  distanceMilesFromMilfordHub: real("distance_miles_from_milford_hub"),
  phone:          text("phone"),
  email:          text("email"),
  website:        text("website"),
  contactName:    text("contact_name"),
  servicesOffered: jsonb("services_offered").notNull().default([]),
  capacityPerDay: integer("capacity_per_day").notNull().default(4),
  reputationScore: real("reputation_score").notNull().default(80.0),
  totalJobsCompleted: integer("total_jobs_completed").notNull().default(0),
  techFeeRateBps: integer("tech_fee_rate_bps").notNull().default(300),    // 300 = 3%
  stripeConnectId: text("stripe_connect_id"),
  isHubNode:      boolean("is_hub_node").notNull().default(false),         // Milford Node
  metadata:       jsonb("metadata"),
  verifiedAt:     timestamp("verified_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceNodeSchema = createInsertSchema(serviceNodesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectServiceNodeSchema = createSelectSchema(serviceNodesTable);
export type InsertServiceNode = z.infer<typeof insertServiceNodeSchema>;
export type ServiceNode = typeof serviceNodesTable.$inferSelect;
