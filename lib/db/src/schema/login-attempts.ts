import { pgTable, serial, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";

/**
 * Login Attempts — tracks success/failure per email+IP for brute-force protection.
 * 5 consecutive failures within 15 minutes triggers a 30-minute lockout.
 * Entries older than 24 hours are pruned nightly.
 */
export const loginAttemptsTable = pgTable("login_attempts", {
  id:          serial("id").primaryKey(),
  email:       varchar("email", { length: 255 }).notNull(),
  ipAddress:   varchar("ip_address", { length: 64 }).notNull(),
  userAgent:   text("user_agent"),
  success:     boolean("success").notNull().default(false),
  failReason:  varchar("fail_reason", { length: 64 }),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});
