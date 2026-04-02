import { pgTable, text, serial, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const offlineSyncQueueTable = pgTable("offline_sync_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  actionType: text("action_type").notNull(),
  payload: jsonb("payload").notNull(),
  clientTimestamp: timestamp("client_timestamp", { withTimezone: true }).notNull(),
  synced: boolean("synced").notNull().default(false),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  conflictResolution: text("conflict_resolution"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("sync_user_idx").on(t.userId),
  index("sync_synced_idx").on(t.synced),
  index("sync_action_idx").on(t.actionType),
]);

export type OfflineSyncQueue = typeof offlineSyncQueueTable.$inferSelect;
