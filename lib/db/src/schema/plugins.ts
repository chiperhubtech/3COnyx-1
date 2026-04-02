import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { developerAppsTable } from "./developer-platform";

export const pluginStatusEnum = pgEnum("plugin_status", [
  "Draft",
  "Review",
  "Published",
  "Suspended",
  "Deprecated",
]);

export const pluginCategoryEnum = pgEnum("plugin_category", [
  "Analytics",
  "Payments",
  "Inventory",
  "CRM",
  "Logistics",
  "Insurance",
  "Compliance",
  "Marketing",
  "AI_Agent",
  "IoT",
  "Custom",
]);

export const pluginsTable = pgTable("plugins", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").references(() => developerAppsTable.id, { onDelete: "cascade" }).notNull(),
  pluginSlug: text("plugin_slug").unique().notNull(),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description"),
  category: pluginCategoryEnum("category").notNull().default("Custom"),
  status: pluginStatusEnum("status").notNull().default("Draft"),
  entryPoint: text("entry_point").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  configSchema: jsonb("config_schema"),
  iconUrl: text("icon_url"),
  installCount: integer("install_count").notNull().default(0),
  rating: integer("rating").default(0),
  isSandboxed: boolean("is_sandboxed").notNull().default(true),
  maxMemoryMb: integer("max_memory_mb").default(128),
  timeoutMs: integer("timeout_ms").default(30000),
  metadata: jsonb("metadata"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("plugin_app_idx").on(t.appId),
  index("plugin_slug_idx").on(t.pluginSlug),
  index("plugin_category_idx").on(t.category),
  index("plugin_status_idx").on(t.status),
]);

export const pluginInstallsTable = pgTable("plugin_installs", {
  id: serial("id").primaryKey(),
  pluginId: integer("plugin_id").references(() => pluginsTable.id, { onDelete: "cascade" }).notNull(),
  installedBy: integer("installed_by").notNull(),
  config: jsonb("config"),
  isActive: boolean("is_active").notNull().default(true),
  installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("plugin_install_plugin_idx").on(t.pluginId),
  index("plugin_install_user_idx").on(t.installedBy),
]);

export type Plugin = typeof pluginsTable.$inferSelect;
export type PluginInstall = typeof pluginInstallsTable.$inferSelect;
