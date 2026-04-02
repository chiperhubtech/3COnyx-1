import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index, numeric } from "drizzle-orm/pg-core";

export const federationNodeStatusEnum = pgEnum("federation_node_status", [
  "Bootstrapping",
  "Syncing",
  "Active",
  "Degraded",
  "Offline",
  "Decommissioned",
]);

export const federationRegionEnum = pgEnum("federation_region", [
  "NA_EAST",
  "NA_WEST",
  "NA_CENTRAL",
  "EU_WEST",
  "EU_CENTRAL",
  "APAC_EAST",
  "APAC_SOUTH",
  "LATAM",
  "MEA",
  "GLOBAL",
]);

export const federationNodesTable = pgTable("federation_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").unique().notNull(),
  nodeName: text("node_name").notNull(),
  region: federationRegionEnum("region").notNull(),
  status: federationNodeStatusEnum("status").notNull().default("Bootstrapping"),
  endpoint: text("endpoint").notNull(),
  publicKey: text("public_key"),
  jurisdictions: jsonb("jurisdictions").$type<string[]>().default([]),
  capabilities: jsonb("capabilities").$type<string[]>().default([]),
  maxThroughputTps: integer("max_throughput_tps").notNull().default(1000),
  currentLoadPct: numeric("current_load_pct", { precision: 5, scale: 2 }).default("0.00"),
  totalTransactionsProcessed: integer("total_transactions_processed").notNull().default(0),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  syncLagMs: integer("sync_lag_ms").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("fed_node_id_idx").on(t.nodeId),
  index("fed_node_region_idx").on(t.region),
  index("fed_node_status_idx").on(t.status),
]);

export const crossRegionSyncTable = pgTable("cross_region_sync", {
  id: serial("id").primaryKey(),
  sourceNodeId: text("source_node_id").notNull(),
  targetNodeId: text("target_node_id").notNull(),
  syncType: text("sync_type").notNull(),
  recordCount: integer("record_count").notNull().default(0),
  bytesTransferred: integer("bytes_transferred").notNull().default(0),
  durationMs: integer("duration_ms"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("sync_source_idx").on(t.sourceNodeId),
  index("sync_target_idx").on(t.targetNodeId),
  index("sync_status_idx").on(t.status),
]);

export type FederationNode = typeof federationNodesTable.$inferSelect;
export type CrossRegionSync = typeof crossRegionSyncTable.$inferSelect;
