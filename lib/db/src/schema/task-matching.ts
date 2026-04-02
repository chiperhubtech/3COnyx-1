import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const taskStateEnum = pgEnum("task_state", [
  "Open",
  "Matching",
  "Matched",
  "Confirmed",
  "En_Route",
  "Executing",
  "Verifying",
  "Completed",
  "Paid",
  "Cancelled",
  "Disputed",
]);

export const taskCategoryEnum = pgEnum("task_category", [
  "Bank_Payoff",
  "DMV_Run",
  "Vehicle_Inspection",
  "Mechanic_Service",
  "Detailing",
  "Tire_Service",
  "Oil_Change",
  "Transport",
  "Parts_Pickup",
  "Document_Delivery",
  "Warranty_Claim",
  "Insurance_Quote",
  "Title_Transfer",
  "Registration",
  "Roadside_Assist",
  "Custom",
]);

export const urgencyEnum = pgEnum("task_urgency", [
  "Standard",
  "Priority",
  "Urgent",
  "Emergency",
]);

export const taskMatchingTable = pgTable("task_matching", {
  id: serial("id").primaryKey(),
  taskRef: text("task_ref").unique().notNull(),
  category: taskCategoryEnum("category").notNull(),
  state: taskStateEnum("state").notNull().default("Open"),
  urgency: urgencyEnum("urgency").notNull().default("Standard"),
  title: text("title").notNull(),
  description: text("description"),
  requestedByUserId: integer("requested_by_user_id").references(() => usersTable.id).notNull(),
  assignedNodeId: integer("assigned_node_id").references(() => usersTable.id),
  vin: text("vin"),
  geoHash: text("geo_hash"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  radiusMiles: integer("radius_miles").default(25),
  estimatedPayoutUsd: numeric("estimated_payout_usd", { precision: 10, scale: 2 }),
  actualPayoutUsd: numeric("actual_payout_usd", { precision: 10, scale: 2 }),
  platformFeeUsd: numeric("platform_fee_usd", { precision: 10, scale: 2 }),
  matchedAt: timestamp("matched_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  executionStartedAt: timestamp("execution_started_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
  proofHashes: jsonb("proof_hashes").$type<string[]>().default([]),
  agentRouting: text("agent_routing"),
  splitPaymentId: integer("split_payment_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("task_ref_idx").on(t.taskRef),
  index("task_state_idx").on(t.state),
  index("task_category_idx").on(t.category),
  index("task_requester_idx").on(t.requestedByUserId),
  index("task_assigned_idx").on(t.assignedNodeId),
  index("task_geo_idx").on(t.geoHash),
  index("task_urgency_idx").on(t.urgency),
]);

export type TaskMatching = typeof taskMatchingTable.$inferSelect;
