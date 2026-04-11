import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storyStatusEnum = pgEnum("story_status", [
  "Draft",
  "Published",
  "Featured",
  "Archived",
]);

export const successStoriesTable = pgTable("success_stories", {
  id:               serial("id").primaryKey(),
  userId:           integer("user_id"),
  displayName:      text("display_name").notNull(),
  location:         text("location").notNull(),
  avatarUrl:        text("avatar_url"),
  previousJob:      text("previous_job").notNull(),
  previousIncome:   integer("previous_income"),
  currentRole:      text("current_role").notNull(),
  totalEarnings:    integer("total_earnings").notNull().default(0),
  monthlyAvg:       integer("monthly_avg").notNull().default(0),
  monthsOnPlatform: integer("months_on_platform").notNull().default(1),
  dealsCompleted:   integer("deals_completed").notNull().default(0),
  headline:         text("headline").notNull(),
  story:            text("story").notNull(),
  quote:            text("quote"),
  tags:             text("tags").notNull().default("[]"),
  status:           storyStatusEnum("status").notNull().default("Draft"),
  isFeatured:       boolean("is_featured").notNull().default(false),
  isVerified:       boolean("is_verified").notNull().default(false),
  publishedAt:      timestamp("published_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuccessStorySchema = createInsertSchema(successStoriesTable);
export const selectSuccessStorySchema = createSelectSchema(successStoriesTable);
export type SuccessStory = z.infer<typeof selectSuccessStorySchema>;
export type NewSuccessStory = z.infer<typeof insertSuccessStorySchema>;
