/**
 * 3C ONYX — DealerFlow OS Customer Ticket Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Unified Customer Communication Hub
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ticketStatusEnum = pgEnum("ticket_status", [
  "New",
  "Open",
  "In_Progress",
  "Waiting_Customer",
  "Resolved",
  "Closed",
]);

export const ticketChannelEnum = pgEnum("ticket_channel", [
  "SMS",
  "Email",
  "Phone",
  "Walk_In",
  "App",
  "WhatsApp",
]);

export const ticketCategoryEnum = pgEnum("ticket_category", [
  "Registration",
  "Title",
  "Parts_Status",
  "Service_Update",
  "Delivery",
  "Warranty",
  "Billing",
  "General",
]);

export const customerTicketsTable = pgTable("customer_tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description"),
  status: ticketStatusEnum("status").notNull().default("New"),
  channel: ticketChannelEnum("channel").notNull().default("App"),
  category: ticketCategoryEnum("category").notNull().default("General"),
  customerId: integer("customer_id").references(() => usersTable.id, { onDelete: "set null" }),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id, { onDelete: "set null" }),
  dealershipId: integer("dealership_id").references(() => usersTable.id, { onDelete: "set null" }),
  relatedTaskId: integer("related_task_id"),
  relatedVin: text("related_vin"),
  lastMessage: text("last_message"),
  autoResponse: text("auto_response"),
  metadata: jsonb("metadata"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("tickets_status_idx").on(t.status),
  index("tickets_customer_idx").on(t.customerId),
  index("tickets_assigned_idx").on(t.assignedToId),
  index("tickets_dealer_idx").on(t.dealershipId),
  index("tickets_category_idx").on(t.category),
]);

export const insertCustomerTicketSchema = createInsertSchema(customerTicketsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCustomerTicketSchema = createSelectSchema(customerTicketsTable);

export type InsertCustomerTicket = z.infer<typeof insertCustomerTicketSchema>;
export type CustomerTicket = typeof customerTicketsTable.$inferSelect;
