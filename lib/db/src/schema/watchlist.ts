import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().default("demo"),
  vinMasked: text("vin_masked").notNull(),
  heading: text("heading").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  listedPrice: integer("listed_price"),
  targetPrice: integer("target_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlistTable).omit({
  id: true,
  createdAt: true,
});

export type WatchlistItem = typeof watchlistTable.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
