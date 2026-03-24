import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foundingMembersTable = pgTable("founding_members", {
  id:                     serial("id").primaryKey(),
  memberNumber:           serial("member_number"),
  name:                   text("name").notNull(),
  email:                  text("email").notNull().unique(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId:  text("stripe_payment_intent_id"),
  stripeCustomerId:       text("stripe_customer_id"),
  status:                 text("status").notNull().default("pending"),
  amountPaid:             integer("amount_paid").default(9900),
  referralCode:           text("referral_code").unique(),
  referredBy:             text("referred_by"),
  isFounder:              boolean("is_founder").notNull().default(true),
  confirmedAt:            timestamp("confirmed_at", { withTimezone: true }),
  createdAt:              timestamp("created_at",  { withTimezone: true }).notNull().defaultNow(),
});

export const insertFoundingMemberSchema = createInsertSchema(foundingMembersTable).omit({
  id: true,
  memberNumber: true,
  createdAt: true,
});

export const selectFoundingMemberSchema = createSelectSchema(foundingMembersTable);

export type InsertFoundingMember = z.infer<typeof insertFoundingMemberSchema>;
export type FoundingMember = typeof foundingMembersTable.$inferSelect;
