import { pgTable, text, serial, integer, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "Available",
  "Reserved",
  "In Transit",
  "Sold",
  "Maintenance",
]);

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull().unique(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  color: text("color"),
  mileage: integer("mileage").notNull().default(0),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }),
  status: vehicleStatusEnum("status").notNull().default("Available"),
  dealerId: integer("dealer_id").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectVehicleSchema = createSelectSchema(vehiclesTable);

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
