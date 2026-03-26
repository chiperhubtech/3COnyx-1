import { pgTable, serial, text, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vinPassportsTable = pgTable("vin_passports", {
  id:              serial("id").primaryKey(),
  vin:             text("vin").notNull().unique(),
  make:            text("make"),
  model:           text("model"),
  year:            integer("year"),
  trim:            text("trim"),
  bodyClass:       text("body_class"),
  driveType:       text("drive_type"),
  engineType:      text("engine_type"),
  fuelType:        text("fuel_type"),
  doors:           integer("doors"),
  rawNhtsa:        jsonb("raw_nhtsa"),
  aiSummaryEn:     text("ai_summary_en"),
  aiSummaryEs:     text("ai_summary_es"),
  recallCount:     integer("recall_count").default(0),
  hasOpenRecalls:  boolean("has_open_recalls").default(false),
  blockchainHash:  text("blockchain_hash"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVinPassportSchema = createInsertSchema(vinPassportsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VinPassport    = typeof vinPassportsTable.$inferSelect;
export type NewVinPassport = z.infer<typeof insertVinPassportSchema>;
