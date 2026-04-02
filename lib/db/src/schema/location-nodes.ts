import { pgTable, text, serial, integer, timestamp, jsonb, index, numeric, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const locationNodesTable = pgTable("location_nodes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  locationRef: text("location_ref").unique().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("other"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country").default("US"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  geoHash: text("geo_hash"),
  qrCode: text("qr_code"),
  qrScans: integer("qr_scans").notNull().default(0),
  signupsGenerated: integer("signups_generated").notNull().default(0),
  transactionsGenerated: integer("transactions_generated").notNull().default(0),
  revenueGeneratedUsd: numeric("revenue_generated_usd", { precision: 14, scale: 4 }).notNull().default("0.0000"),
  isActive: boolean("is_active").notNull().default(true),
  operatingHours: jsonb("operating_hours"),
  photos: jsonb("photos").$type<string[]>().default([]),
  rating: integer("rating").default(100),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("loc_user_idx").on(t.userId),
  index("loc_ref_idx").on(t.locationRef),
  index("loc_type_idx").on(t.type),
  index("loc_geo_idx").on(t.geoHash),
  index("loc_active_idx").on(t.isActive),
  index("loc_city_idx").on(t.city),
]);

export type LocationNode = typeof locationNodesTable.$inferSelect;
