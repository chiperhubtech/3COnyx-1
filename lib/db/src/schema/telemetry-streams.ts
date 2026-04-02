import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const telemetrySourceEnum = pgEnum("telemetry_source", [
  "OBD2",
  "Telematics",
  "Connected_Car_API",
  "Manual_Entry",
  "Fleet_Gateway",
  "AR_Headset",
  "Robotics_Node",
  "Sensor_Mesh",
]);

export const telemetryStreamsTable = pgTable("telemetry_streams", {
  id: serial("id").primaryKey(),
  streamId: text("stream_id").unique().notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  vin: text("vin"),
  deviceId: text("device_id"),
  source: telemetrySourceEnum("source").notNull().default("OBD2"),
  isActive: boolean("is_active").notNull().default(true),
  lastDataAt: timestamp("last_data_at", { withTimezone: true }),
  totalDataPoints: integer("total_data_points").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("telemetry_stream_id_idx").on(t.streamId),
  index("telemetry_user_idx").on(t.userId),
  index("telemetry_vin_idx").on(t.vin),
  index("telemetry_device_idx").on(t.deviceId),
]);

export const telemetryDataPointsTable = pgTable("telemetry_data_points", {
  id: serial("id").primaryKey(),
  streamId: text("stream_id").notNull(),
  metricType: text("metric_type").notNull(),
  value: numeric("value", { precision: 14, scale: 4 }),
  unit: text("unit"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  dtcCodes: jsonb("dtc_codes").$type<string[]>(),
  raw: jsonb("raw"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("tdp_stream_idx").on(t.streamId),
  index("tdp_metric_idx").on(t.metricType),
  index("tdp_recorded_idx").on(t.recordedAt),
]);

export const predictiveMaintenanceTable = pgTable("predictive_maintenance", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  component: text("component").notNull(),
  healthScore: numeric("health_score", { precision: 5, scale: 2 }).notNull(),
  predictedFailureDate: timestamp("predicted_failure_date", { withTimezone: true }),
  confidencePct: numeric("confidence_pct", { precision: 5, scale: 2 }),
  recommendedAction: text("recommended_action"),
  estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale: 2 }),
  priority: text("priority").default("medium"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("pm_vin_idx").on(t.vin),
  index("pm_component_idx").on(t.component),
  index("pm_priority_idx").on(t.priority),
]);

export type TelemetryStream = typeof telemetryStreamsTable.$inferSelect;
export type TelemetryDataPoint = typeof telemetryDataPointsTable.$inferSelect;
export type PredictiveMaintenance = typeof predictiveMaintenanceTable.$inferSelect;
