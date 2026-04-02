import { pgTable, text, serial, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userThemePrefsTable = pgTable("user_theme_prefs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).unique().notNull(),
  themeId: text("theme_id").notNull().default("onyx-default"),
  darkMode: boolean("dark_mode").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("theme_user_idx").on(t.userId),
  index("theme_id_idx").on(t.themeId),
]);

export type UserThemePref = typeof userThemePrefsTable.$inferSelect;
