import { pgTable, text, serial, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vehiclesTable } from "./vehicles";

export const gigTaskTypeEnum = pgEnum("gig_task_type", [
  "Delivery",
  "Inspection",
  "Photography",
  "Detailing",
  "Transport",
  "Concierge",
  "Other",
]);

export const gigTaskStatusEnum = pgEnum("gig_task_status", [
  "Open",
  "Claimed",
  "In Progress",
  "Completed",
  "Cancelled",
  "Disputed",
]);

export const gigTasksTable = pgTable("gig_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  taskType: gigTaskTypeEnum("task_type").notNull(),
  status: gigTaskStatusEnum("status").notNull().default("Open"),
  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id, { onDelete: "set null" }),
  assignedRunnerId: integer("assigned_runner_id").references(() => usersTable.id, { onDelete: "set null" }),
  postedByDealerId: integer("posted_by_dealer_id").references(() => usersTable.id, { onDelete: "set null" }),
  payoutUsd: text("payout_usd").notNull().default("0.00"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("gig_tasks_vehicle_id_idx").on(t.vehicleId),
  index("gig_tasks_runner_id_idx").on(t.assignedRunnerId),
  index("gig_tasks_dealer_id_idx").on(t.postedByDealerId),
  index("gig_tasks_status_idx").on(t.status),
]);

export const insertGigTaskSchema = createInsertSchema(gigTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectGigTaskSchema = createSelectSchema(gigTasksTable);

export type InsertGigTask = z.infer<typeof insertGigTaskSchema>;
export type GigTask = typeof gigTasksTable.$inferSelect;
