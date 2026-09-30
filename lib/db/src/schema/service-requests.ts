import { pgTable, pgEnum, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const serviceRequestTypeEnum = pgEnum("service_request_type", [
  "INSURANCE", "ROADSIDE", "RENTAL", "BODY_WORK",
]);
export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "NEW", "IN_PROGRESS", "FULFILLED",
]);

export const serviceRequestsTable = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: serviceRequestTypeEnum("type").notNull(),
  status: serviceRequestStatusEnum("status").notNull().default("NEW"),
  vehicleYear: integer("vehicle_year").notNull(),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("service_requests_member_created_idx").on(table.memberId, table.createdAt),
  index("service_requests_status_created_idx").on(table.status, table.createdAt),
]);

/** Member-visible status notifications, and permanent actor-attributed status audit trail. */
export const serviceRequestEventsTable = pgTable("service_request_events", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => serviceRequestsTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").notNull().references(() => usersTable.id),
  fromStatus: serviceRequestStatusEnum("from_status"),
  toStatus: serviceRequestStatusEnum("to_status").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("service_request_events_member_created_idx").on(table.memberId, table.createdAt),
]);

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({
  id: true, memberId: true, status: true, createdAt: true, updatedAt: true,
});
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
export type ServiceRequestEvent = typeof serviceRequestEventsTable.$inferSelect;