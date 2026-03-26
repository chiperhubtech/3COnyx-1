import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const baySlotStatusEnum = pgEnum("bay_slot_status", [
  "QUEUED",
  "GPS_INCOMING",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "QC",
  "READY",
  "DISPATCHED",
]);

export const baySlotsTable = pgTable("bay_slots", {
  id:            serial("id").primaryKey(),
  bayNumber:     integer("bay_number").notNull().default(1),
  specialistId:  integer("specialist_id").notNull(),
  vehicleVin:    text("vehicle_vin"),
  vehicleLabel:  text("vehicle_label").notNull(),
  customerName:  text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  serviceType:   text("service_type").notNull(),
  status:        baySlotStatusEnum("status").notNull().default("QUEUED"),
  etaMinutes:    integer("eta_minutes"),
  gpsTriggered:  boolean("gps_triggered").notNull().default(false),
  rushRequested: boolean("rush_requested").notNull().default(false),
  techApproved:  boolean("tech_approved").notNull().default(false),
  startedAt:     timestamp("started_at",   { withTimezone: true }),
  completedAt:   timestamp("completed_at", { withTimezone: true }),
  cycleSeconds:  integer("cycle_seconds"),
  notes:         text("notes"),
  createdAt:     timestamp("created_at",   { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at",   { withTimezone: true }).notNull().defaultNow(),
});

export const insertBaySlotSchema = createInsertSchema(baySlotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BaySlot    = typeof baySlotsTable.$inferSelect;
export type NewBaySlot = z.infer<typeof insertBaySlotSchema>;
