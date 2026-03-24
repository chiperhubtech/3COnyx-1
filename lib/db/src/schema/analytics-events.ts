import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Fire-and-forget event tracking for growth analytics.
 * Tracks: page_view, referral_click, checkout_started,
 *         member_confirmed, reward_unlocked, share_action
 */
export const analyticsEventsTable = pgTable("analytics_events", {
  id:          serial("id").primaryKey(),
  event:       text("event").notNull(),
  sessionId:   text("session_id"),
  userId:      text("user_id"),
  referralCode: text("referral_code"),
  payload:     jsonb("payload"),
  ip:          text("ip"),
  userAgent:   text("user_agent"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
