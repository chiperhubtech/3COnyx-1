import { pgTable, text, integer, timestamp, jsonb, boolean, numeric } from "drizzle-orm/pg-core";

export const sdvProfiles = pgTable("sdv_profiles", {
  id:               integer("id").generatedAlwaysAsIdentity().primaryKey(),
  vehicleId:        text("vehicle_id").notNull().unique(),
  vin:              text("vin"),
  make:             text("make"),
  model:            text("model"),
  year:             integer("year"),

  // SDV Tier: 0 (legacy) → 4 (autonomous-ready)
  sdvTier:          integer("sdv_tier").notNull().default(0),
  sdvScore:         integer("sdv_score").notNull().default(0),

  // Capabilities
  hasOtaCapability:       boolean("has_ota_capability").default(false),
  hasVehicleApi:          boolean("has_vehicle_api").default(false),
  hasV2x:                 boolean("has_v2x").default(false),
  hasRemoteAccess:        boolean("has_remote_access").default(false),
  sensorTypes:            jsonb("sensor_types").$type<string[]>().default([]),
  v2xProtocols:           jsonb("v2x_protocols").$type<string[]>().default([]),
  inVehicleApps:          jsonb("in_vehicle_apps").$type<string[]>().default([]),
  softwareVersion:        text("software_version"),
  softwareArchitecture:   text("software_architecture"),

  // OTA history
  otaUpdatesCount:        integer("ota_updates_count").default(0),
  lastOtaAt:              timestamp("last_ota_at"),
  lastOtaVersion:         text("last_ota_version"),

  // Telemetry (latest snapshot)
  lastTelemetryAt:        timestamp("last_telemetry_at"),
  latestTelemetry:        jsonb("latest_telemetry").$type<Record<string, unknown>>(),

  // Value impact
  sdvValuePremium:        numeric("sdv_value_premium").default("0"), // % value increase from SDV features

  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
});

export const sdvOtaEvents = pgTable("sdv_ota_events", {
  id:               integer("id").generatedAlwaysAsIdentity().primaryKey(),
  vehicleId:        text("vehicle_id").notNull(),
  vin:              text("vin"),
  fromVersion:      text("from_version"),
  toVersion:        text("to_version").notNull(),
  updateType:       text("update_type").notNull(), // 'feature' | 'security' | 'performance' | 'autonomous'
  description:      text("description"),
  sdvScoreDelta:    integer("sdv_score_delta").default(0), // How much this update changed the SDV score
  blockchainHash:   text("blockchain_hash"),
  installedAt:      timestamp("installed_at").defaultNow().notNull(),
});

export const sdvTelemetry = pgTable("sdv_telemetry", {
  id:               integer("id").generatedAlwaysAsIdentity().primaryKey(),
  vehicleId:        text("vehicle_id").notNull(),
  vin:              text("vin"),
  speed:            numeric("speed"),
  batteryLevel:     numeric("battery_level"),
  range:            numeric("range"),
  latitude:         numeric("latitude"),
  longitude:        numeric("longitude"),
  diagnosticCodes:  jsonb("diagnostic_codes").$type<string[]>().default([]),
  sensorData:       jsonb("sensor_data").$type<Record<string, unknown>>(),
  receivedAt:       timestamp("received_at").defaultNow().notNull(),
});
