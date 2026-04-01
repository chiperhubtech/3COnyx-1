/**
 * 3C ONYX — DealerFlow OS Task Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Unified Automotive Command Layer (UACL)
 * Trade Secret TS-DEALERFLOW — Proprietary Task Routing & SLA Engine
 * Zero-Trust Delegation Architecture — Open Initiation + Controlled Execution
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { vehiclesTable } from "./vehicles";
import { dealsTable } from "./deals";

export const dfDepartmentEnum = pgEnum("df_department", [
  "DMV",
  "Parts",
  "Service",
  "Finance",
  "Logistics",
  "Sales",
  "Customer_Service",
  "General",
]);

export const dfPriorityEnum = pgEnum("df_priority", [
  "Critical",
  "High",
  "Medium",
  "Low",
]);

export const dfTaskStatusEnum = pgEnum("df_task_status", [
  "Open",
  "In_Progress",
  "Waiting",
  "Pending_Approval",
  "Pending_External",
  "Completed",
  "Escalated",
  "Cancelled",
  "Blocked",
]);

export const dfTaskScopeEnum = pgEnum("df_task_scope", [
  "Internal",
  "External",
]);

export const dfIntakeTypeEnum = pgEnum("df_intake_type", [
  "Scan",
  "SMS",
  "Email",
  "Manual",
  "Phone",
  "Walk_In",
  "Vision_Scan",
  "Omni_Node",
]);

export const dfInitiatorTierEnum = pgEnum("df_initiator_tier", [
  "Authenticated",
  "Lot_Attendant",
  "Detailer",
  "Customer",
  "External_Vendor",
  "Anonymous",
]);

export const dealerflowTasksTable = pgTable("dealerflow_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  department: dfDepartmentEnum("department").notNull(),
  priority: dfPriorityEnum("priority").notNull().default("Medium"),
  status: dfTaskStatusEnum("status").notNull().default("Open"),
  intakeType: dfIntakeTypeEnum("intake_type").notNull().default("Manual"),
  taskScope: dfTaskScopeEnum("task_scope").notNull().default("Internal"),
  vin: text("vin"),
  dealId: integer("deal_id").references(() => dealsTable.id, { onDelete: "set null" }),
  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => usersTable.id, { onDelete: "set null" }),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id, { onDelete: "set null" }),
  dealershipId: integer("dealership_id").references(() => usersTable.id, { onDelete: "set null" }),
  initiatorId: integer("initiator_id").references(() => usersTable.id, { onDelete: "set null" }),
  initiatorName: text("initiator_name"),
  initiatorTier: dfInitiatorTierEnum("initiator_tier").default("Authenticated"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorizerId: integer("authorizer_id").references(() => usersTable.id, { onDelete: "set null" }),
  authorizedAt: timestamp("authorized_at", { withTimezone: true }),
  trackingCode: text("tracking_code").unique(),
  slaMinutes: integer("sla_minutes").notNull().default(480),
  slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
  routedByAgent: text("routed_by_agent"),
  routingConfidence: text("routing_confidence"),
  dependsOnTaskId: integer("depends_on_task_id").references((): AnyPgColumn => dealerflowTasksTable.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("df_tasks_department_idx").on(t.department),
  index("df_tasks_status_idx").on(t.status),
  index("df_tasks_assigned_idx").on(t.assignedToId),
  index("df_tasks_dealer_idx").on(t.dealershipId),
  index("df_tasks_priority_idx").on(t.priority),
  index("df_tasks_vin_idx").on(t.vin),
  index("df_tasks_sla_due_idx").on(t.slaDueAt),
  index("df_tasks_scope_idx").on(t.taskScope),
  index("df_tasks_deal_idx").on(t.dealId),
  index("df_tasks_depends_on_idx").on(t.dependsOnTaskId),
  index("df_tasks_initiator_idx").on(t.initiatorId),
  index("df_tasks_owner_idx").on(t.ownerId),
  index("df_tasks_tracking_idx").on(t.trackingCode),
]);

export const dealerflowAuditLogTable = pgTable("dealerflow_audit_log", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => dealerflowTasksTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  userName: text("user_name"),
  userRole: text("user_role"),
  actionType: text("action_type").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  architect: text("architect").notNull().default("Ronald Antonio Cadet"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("df_audit_task_idx").on(t.taskId),
  index("df_audit_user_idx").on(t.userId),
  index("df_audit_action_idx").on(t.actionType),
  index("df_audit_created_idx").on(t.createdAt),
]);

export const insertDealerflowTaskSchema = createInsertSchema(dealerflowTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDealerflowTaskSchema = createSelectSchema(dealerflowTasksTable);

export type InsertDealerflowTask = z.infer<typeof insertDealerflowTaskSchema>;
export type DealerflowTask = typeof dealerflowTasksTable.$inferSelect;
