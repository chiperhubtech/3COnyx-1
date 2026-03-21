import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationTypeEnum = pgEnum("notification_type", [
  "DELIVERY",
  "BGC",
  "PAYOUT",
  "RUNNER",
  "ALERT",
  "SYSTEM",
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: notificationTypeEnum("type").notNull().default("SYSTEM"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
