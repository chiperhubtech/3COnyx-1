import {
  pgTable, text, serial, integer, timestamp, pgEnum, jsonb,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  "AUTH",
  "DB_CHANGE",
  "API_CALL",
  "PAYOUT",
  "DELIVERY",
  "ADMIN",
  "SYSTEM",
]);

export const auditSeverityEnum = pgEnum("audit_severity", [
  "INFO",
  "WARN",
  "CRIT",
]);

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  eventType: auditEventTypeEnum("event_type").notNull(),
  action: text("action").notNull(),
  actorId: text("actor_id"),
  actorRole: text("actor_role"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  method: text("method"),
  path: text("path"),
  statusCode: integer("status_code"),
  severity: auditSeverityEnum("severity").notNull().default("INFO"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  sha256Hash: text("sha256_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const selectAuditLogSchema = createSelectSchema(auditLogsTable);
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type AuditLogInsert = typeof auditLogsTable.$inferInsert;
