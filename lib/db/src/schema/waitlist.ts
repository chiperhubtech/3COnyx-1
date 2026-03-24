import { pgTable, text, serial, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistRoleEnum = pgEnum("waitlist_role", [
  "Member",
  "Dealer",
  "Runner",
  "Specialist",
  "Investor",
]);

export const waitlistTable = pgTable("waitlist", {
  id:          serial("id").primaryKey(),
  email:       text("email").notNull().unique(),
  name:        text("name"),
  role:        waitlistRoleEnum("waitlist_role").notNull().default("Member"),
  referredBy:  text("referred_by"),
  city:        text("city"),
  inviteCode:  text("invite_code"),
  isInvited:   boolean("is_invited").notNull().default(false),
  invitedAt:   timestamp("invited_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({
  id: true,
  createdAt: true,
  isInvited: true,
  invitedAt: true,
});

export type WaitlistEntry = typeof waitlistTable.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistSchema>;
