import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "Active",
  "Revoked",
  "Expired",
  "Rate_Limited",
  "Suspended",
]);

export const developerTierEnum = pgEnum("developer_tier", [
  "Free",
  "Builder",
  "Enterprise",
  "Partner",
  "Sovereign",
]);

export const developerAppsTable = pgTable("developer_apps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  appName: text("app_name").notNull(),
  appSlug: text("app_slug").unique().notNull(),
  description: text("description"),
  tier: developerTierEnum("tier").notNull().default("Free"),
  websiteUrl: text("website_url"),
  callbackUrls: jsonb("callback_urls").$type<string[]>().default([]),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  totalRequests: integer("total_requests").notNull().default(0),
  monthlyRequests: integer("monthly_requests").notNull().default(0),
  revenueSharePct: numeric("revenue_share_pct", { precision: 5, scale: 2 }).default("0.00"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("dev_app_user_idx").on(t.userId),
  index("dev_app_slug_idx").on(t.appSlug),
  index("dev_app_tier_idx").on(t.tier),
]);

export const apiKeysTable = pgTable("onyx_api_keys", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").references(() => developerAppsTable.id, { onDelete: "cascade" }).notNull(),
  keyHash: text("key_hash").unique().notNull(),
  keyPrefix: text("key_prefix").notNull(),
  label: text("label"),
  status: apiKeyStatusEnum("status").notNull().default("Active"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
  rateLimitPerDay: integer("rate_limit_per_day").notNull().default(10000),
  totalCalls: integer("total_calls").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("api_key_app_idx").on(t.appId),
  index("api_key_hash_idx").on(t.keyHash),
  index("api_key_status_idx").on(t.status),
]);

export const webhookEndpointsTable = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").references(() => developerAppsTable.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  events: jsonb("events").$type<string[]>().notNull(),
  secretHash: text("secret_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  failureCount: integer("failure_count").notNull().default(0),
  lastDeliveredAt: timestamp("last_delivered_at", { withTimezone: true }),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("webhook_app_idx").on(t.appId),
]);

export const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  endpointId: integer("endpoint_id").references(() => webhookEndpointsTable.id, { onDelete: "cascade" }).notNull(),
  event: text("event").notNull(),
  payload: jsonb("payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("webhook_delivery_endpoint_idx").on(t.endpointId),
  index("webhook_delivery_event_idx").on(t.event),
]);

export type DeveloperApp = typeof developerAppsTable.$inferSelect;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpointsTable.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveriesTable.$inferSelect;
