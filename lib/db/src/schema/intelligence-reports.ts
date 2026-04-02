import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, numeric } from "drizzle-orm/pg-core";

export const reportTypeEnum = pgEnum("intelligence_report_type", [
  "Market_Pricing",
  "Demand_Forecast",
  "Supply_Analysis",
  "Regional_Trend",
  "Segment_Deep_Dive",
  "Competitive_Intel",
  "Predictive_Maintenance",
  "Fleet_Analytics",
  "Revenue_Forecast",
  "Network_Health",
]);

export const intelligenceReportsTable = pgTable("intelligence_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").unique().notNull(),
  reportType: reportTypeEnum("report_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  region: text("region"),
  segment: text("segment"),
  dataPointCount: integer("data_point_count").default(0),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 3 }),
  insights: jsonb("insights"),
  charts: jsonb("charts"),
  recommendations: jsonb("recommendations"),
  modelVersion: text("model_version").default("ONYX-Intelligence-v3.0"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
}, (t) => [
  index("intel_report_id_idx").on(t.reportId),
  index("intel_report_type_idx").on(t.reportType),
  index("intel_report_region_idx").on(t.region),
  index("intel_report_generated_idx").on(t.generatedAt),
]);

export const marketDataSnapshotsTable = pgTable("market_data_snapshots", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  trim: text("trim"),
  region: text("region").default("US"),
  avgPriceUsd: numeric("avg_price_usd", { precision: 12, scale: 2 }),
  medianPriceUsd: numeric("median_price_usd", { precision: 12, scale: 2 }),
  listingCount: integer("listing_count").default(0),
  avgDaysOnMarket: integer("avg_days_on_market"),
  demandIndex: numeric("demand_index", { precision: 5, scale: 2 }),
  supplyIndex: numeric("supply_index", { precision: 5, scale: 2 }),
  priceChangePercent30d: numeric("price_change_percent_30d", { precision: 6, scale: 2 }),
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("mds_make_model_idx").on(t.make, t.model),
  index("mds_year_idx").on(t.year),
  index("mds_region_idx").on(t.region),
  index("mds_snapshot_date_idx").on(t.snapshotDate),
]);

export type IntelligenceReport = typeof intelligenceReportsTable.$inferSelect;
export type MarketDataSnapshot = typeof marketDataSnapshotsTable.$inferSelect;
