/**
 * 3C ONYX — Warranty Status Records
 * Author: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Guardian Agent pulls in-service date + odometer to instantly resolve warranty status.
 * Eliminates the 4-step manual dealer check.
 */
import {
  pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warrantyStatusEnum = pgEnum("warranty_status", [
  "Active",
  "Expired",
  "ExpiringSoon",
  "Unknown",
  "Extended",
  "Voided",
]);

export const warrantyTypeEnum = pgEnum("warranty_type", [
  "Bumper-to-Bumper",
  "Powertrain",
  "Extended",
  "CPO",
  "PaintProtection",
  "TireWheel",
  "Custom",
]);

export const warrantyRecordsTable = pgTable("warranty_records", {
  id:                serial("id").primaryKey(),
  vin:               text("vin").notNull(),
  vehicleLabel:      text("vehicle_label"),
  warrantyType:      warrantyTypeEnum("warranty_type").notNull(),
  providerName:      text("provider_name").notNull(),              // "Simoniz", "Sonsio", "Stellantis"
  contractNumber:    text("contract_number"),
  inServiceDate:     timestamp("in_service_date", { withTimezone: true }),
  inServiceOdometer: integer("in_service_odometer"),
  currentOdometer:   integer("current_odometer"),
  expiresDate:       timestamp("expires_date", { withTimezone: true }),
  expiresOdometer:   integer("expires_odometer"),
  status:            warrantyStatusEnum("status").notNull().default("Unknown"),
  coverageDetails:   jsonb("coverage_details"),                     // what is/isn't covered
  isTransferable:    boolean("is_transferable").notNull().default(false),
  deductibleUsd:     numeric("deductible_usd", { precision: 8, scale: 2 }),
  lastCheckedAt:     timestamp("last_checked_at", { withTimezone: true }).notNull().defaultNow(),
  guardianVerified:  boolean("guardian_verified").notNull().default(false),
  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWarrantyRecordSchema = createInsertSchema(warrantyRecordsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectWarrantyRecordSchema = createSelectSchema(warrantyRecordsTable);
export type InsertWarrantyRecord = z.infer<typeof insertWarrantyRecordSchema>;
export type WarrantyRecord = typeof warrantyRecordsTable.$inferSelect;
