import { pgTable, text, serial, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", [
  "Member",
  "Dealer",
  "Runner",
  "Specialist",
  "Admin",
]);

export const usersTable = pgTable("users", {
  id:               serial("id").primaryKey(),
  name:             text("name").notNull(),
  email:            text("email").notNull().unique(),
  passwordHash:     text("password_hash"),
  role:             userRoleEnum("role").notNull().default("Member"),
  phone:            text("phone"),
  avatarUrl:        text("avatar_url"),
  isActive:         boolean("is_active").notNull().default(true),
  isVerified:       boolean("is_verified").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  checkrCandidateId: text("checkr_candidate_id"),
  lastLoginAt:      timestamp("last_login_at", { withTimezone: true }),
  createdAt:        timestamp("created_at",  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at",  { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
