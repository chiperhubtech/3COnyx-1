import {
  pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "pending_approval",
  "approved",
  "active",
  "completed",
  "cancelled",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "car_meet",
  "bike_night",
  "cruise",
  "show_and_shine",
  "swap_meet",
  "drag_race",
  "track_day",
  "charity_ride",
  "auction",
  "pop_up_shop",
  "workshop",
  "club_meeting",
  "custom",
]);

export const venueTypeEnum = pgEnum("venue_type", [
  "parking_lot",
  "dealership",
  "warehouse",
  "track",
  "park",
  "fairgrounds",
  "mall_lot",
  "private_property",
  "public_space",
  "garage",
]);

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: eventTypeEnum("type").notNull().default("car_meet"),
  status: eventStatusEnum("status").notNull().default("draft"),
  organizerId: integer("organizer_id").references(() => usersTable.id, { onDelete: "set null" }),
  clubId: integer("club_id").references(() => clubsTable.id, { onDelete: "set null" }),
  venueId: integer("venue_id").references(() => venuesTable.id, { onDelete: "set null" }),
  coverImageUrl: text("cover_image_url"),
  vehicleTypes: jsonb("vehicle_types").$type<string[]>().default(["car"]),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  maxAttendees: integer("max_attendees"),
  entryFeeCents: integer("entry_fee_cents").default(0),
  vendorFeeCents: integer("vendor_fee_cents").default(0),
  permitNumber: text("permit_number"),
  permitStatus: text("permit_status"),
  insuranceCertUrl: text("insurance_cert_url"),
  complianceNotes: text("compliance_notes"),
  attendeeCount: integer("attendee_count").notNull().default(0),
  revenueCents: integer("revenue_cents").notNull().default(0),
  rules: jsonb("rules").$type<string[]>(),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("events_organizer_idx").on(t.organizerId),
  index("events_club_idx").on(t.clubId),
  index("events_status_idx").on(t.status),
  index("events_starts_at_idx").on(t.startsAt),
  index("events_slug_idx").on(t.slug),
]);

export const eventAttendeesTable = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => eventsTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("registered"),
  role: text("role").notNull().default("attendee"),
  vehicleInfo: text("vehicle_info"),
  ticketRef: text("ticket_ref"),
  paidCents: integer("paid_cents").default(0),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("event_attendees_event_idx").on(t.eventId),
  index("event_attendees_user_idx").on(t.userId),
]);

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: venueTypeEnum("type").notNull().default("parking_lot"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  businessName: text("business_name"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  capacity: integer("capacity"),
  hourlyRateCents: integer("hourly_rate_cents"),
  afterHoursAvailable: boolean("after_hours_available").notNull().default(false),
  afterHoursStart: text("after_hours_start"),
  afterHoursEnd: text("after_hours_end"),
  amenities: jsonb("amenities").$type<string[]>(),
  rules: jsonb("rules").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  permitRequired: boolean("permit_required").notNull().default(false),
  insuranceRequired: boolean("insurance_required").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  active: boolean("active").notNull().default(true),
  totalEventsHosted: integer("total_events_hosted").notNull().default(0),
  totalRevenueCents: integer("total_revenue_cents").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("venues_owner_idx").on(t.ownerId),
  index("venues_city_state_idx").on(t.city, t.state),
  index("venues_slug_idx").on(t.slug),
]);

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectEventSchema = createSelectSchema(eventsTable);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;

export const insertVenueSchema = createInsertSchema(venuesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type Venue = typeof venuesTable.$inferSelect;
export type EventAttendee = typeof eventAttendeesTable.$inferSelect;
