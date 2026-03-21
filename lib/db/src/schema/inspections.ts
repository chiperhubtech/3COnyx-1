import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inspectionsTable = pgTable("inspections", {
  id: serial("id").primaryKey(),
  vehicleLabel: text("vehicle_label").notNull(),
  inspectorName: text("inspector_name").notNull(),
  conditionFront: integer("condition_front").notNull().default(5),
  conditionRear: integer("condition_rear").notNull().default(5),
  conditionDriverSide: integer("condition_driver_side").notNull().default(5),
  conditionPassengerSide: integer("condition_passenger_side").notNull().default(5),
  conditionInterior: integer("condition_interior").notNull().default(5),
  odometerConfirmed: integer("odometer_confirmed"),
  notes: text("notes"),
  signed: boolean("signed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInspectionSchema = createInsertSchema(inspectionsTable).omit({
  id: true,
  createdAt: true,
});

export type Inspection = typeof inspectionsTable.$inferSelect;
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
