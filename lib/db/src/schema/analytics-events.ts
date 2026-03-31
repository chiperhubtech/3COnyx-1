import { pgTable, text, serial, jsonb, timestamp, index } from "drizzle-orm/pg-core";

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
}, (t) => [
  index("analytics_user_id_idx").on(t.userId),
  index("analytics_session_id_idx").on(t.sessionId),
  index("analytics_event_idx").on(t.event),
  index("analytics_created_at_idx").on(t.createdAt),
]);

export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
