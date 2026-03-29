import { pgTable, text, serial, integer, timestamp, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const creatorProfilesTable = pgTable("creator_profiles", {
  id:             serial("id").primaryKey(),
  platform:       text("platform").notNull(),
  handle:         text("handle").notNull(),
  followerCount:  integer("follower_count").notNull().default(0),
  grade:          text("grade").notNull().default("N/A"),
  sbRank:         integer("sb_rank"),
  niche:          text("niche"),
  contactEmail:   text("contact_email"),
  contactPhone:   text("contact_phone"),
  outreachStatus: text("outreach_status").notNull().default("not_contacted"),
  referralCode:   text("referral_code"),
  campaignId:     integer("campaign_id"),
  discoveredAt:   timestamp("discovered_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:      timestamp("created_at",    { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("uq_creator_platform_handle").on(t.platform, t.handle)]);

export const creatorCampaignsTable = pgTable("creator_campaigns", {
  id:               serial("id").primaryKey(),
  name:             text("name").notNull(),
  briefText:        text("brief_text"),
  targetPlatforms:  text("target_platforms"),
  targetMinGrade:   text("target_min_grade").default("B"),
  commissionPct:    numeric("commission_pct", { precision: 5, scale: 2 }).default("10.00"),
  shoutCampaignId:  text("shout_campaign_id"),
  status:           text("status").notNull().default("draft"),
  launchDate:       text("launch_date"),
  talkingPoints:    text("talking_points"),
  memberBenefits:   text("member_benefits"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatorOutreachLogTable = pgTable("creator_outreach_log", {
  id:               serial("id").primaryKey(),
  creatorId:        integer("creator_id").notNull(),
  campaignId:       integer("campaign_id"),
  aiMessage:        text("ai_message").notNull(),
  deliveryChannel:  text("delivery_channel").notNull().default("email"),
  sentAt:           timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  responseStatus:   text("response_status").notNull().default("awaiting"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCreatorProfileSchema  = createInsertSchema(creatorProfilesTable).omit({ id: true, createdAt: true, discoveredAt: true });
export const selectCreatorProfileSchema  = createSelectSchema(creatorProfilesTable);
export const insertCreatorCampaignSchema = createInsertSchema(creatorCampaignsTable).omit({ id: true, createdAt: true });
export const selectCreatorCampaignSchema = createSelectSchema(creatorCampaignsTable);
export const insertCreatorOutreachLogSchema = createInsertSchema(creatorOutreachLogTable).omit({ id: true, createdAt: true, sentAt: true });
export const selectCreatorOutreachLogSchema = createSelectSchema(creatorOutreachLogTable);

export type CreatorProfile    = typeof creatorProfilesTable.$inferSelect;
export type InsertCreatorProfile = z.infer<typeof insertCreatorProfileSchema>;
export type CreatorCampaign   = typeof creatorCampaignsTable.$inferSelect;
export type InsertCreatorCampaign = z.infer<typeof insertCreatorCampaignSchema>;
export type CreatorOutreachLog = typeof creatorOutreachLogTable.$inferSelect;
