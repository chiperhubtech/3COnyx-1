/**
 * 3C ONYX — Shipment Orders (Interstate Asset Fulfillment)
 * Author: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Patent: PAT-08 — Cross-Border Asset Fulfillment System
 *
 * Every vehicle transported through the 3C Mesh generates a ShipmentOrder.
 * The Transporter Agent owns this table. Nothing moves without a record.
 * "The distance is invisible to the customer." — Ronald Antonio Cadet, CVO
 */
import {
  pgTable, text, serial, timestamp, pgEnum, numeric, boolean, jsonb, integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "QuoteRequested",
  "ProviderAssigned",
  "PickupScheduled",
  "VehiclePickedUp",
  "InTransit",
  "CrossedStateLine",
  "FinalMileDelivery",
  "Delivered",
  "DVPStamped",
  "Cancelled",
]);

export const shipmentTypeEnum = pgEnum("shipment_type", [
  "OpenCarrier",
  "EnclosedCarrier",
  "DriveAway",
  "RailTransport",
  "FinalMileOnly",
]);

export const shipmentOrdersTable = pgTable("shipment_orders", {
  id:              serial("id").primaryKey(),
  shipmentId:      text("shipment_id").notNull().unique(),       // SHIP-{timestamp}-{rand}
  vin:             text("vin").notNull(),
  vehicleLabel:    text("vehicle_label"),                        // "2023 BMW M2 Coupe"
  buyerName:       text("buyer_name"),
  buyerPhone:      text("buyer_phone"),
  buyerEmail:      text("buyer_email"),

  // Origin
  originDealerId:  text("origin_dealer_id"),
  originAddress:   text("origin_address"),
  originCity:      text("origin_city"),
  originState:     text("origin_state"),
  originZip:       text("origin_zip"),
  originLat:       numeric("origin_lat", { precision: 9, scale: 6 }),
  originLng:       numeric("origin_lng", { precision: 9, scale: 6 }),

  // Destination
  destAddress:     text("dest_address"),
  destCity:        text("dest_city"),
  destState:       text("dest_state"),
  destZip:         text("dest_zip"),
  destLat:         numeric("dest_lat", { precision: 9, scale: 6 }),
  destLng:         numeric("dest_lng", { precision: 9, scale: 6 }),

  // Routing
  distanceMiles:   numeric("distance_miles", { precision: 10, scale: 2 }),
  isInterstate:    boolean("is_interstate").notNull().default(false),
  crossedStates:   jsonb("crossed_states"),                      // ["RI","CT","NY","PA","OH","IN","IL","WI","MN"]
  bestPath:        text("best_path"),                            // "I-95 N → I-90 W → I-94 W"

  // Provider
  providerName:    text("provider_name"),
  providerRating:  numeric("provider_rating", { precision: 3, scale: 2 }),
  providerDot:     text("provider_dot"),                         // DOT license number
  providerPhone:   text("provider_phone"),
  shipmentType:    shipmentTypeEnum("shipment_type").default("OpenCarrier"),

  // Financials
  quotedCostUsd:   numeric("quoted_cost_usd", { precision: 10, scale: 2 }),
  finalCostUsd:    numeric("final_cost_usd", { precision: 10, scale: 2 }),
  dynastyLogisticsFeeUsd: numeric("dynasty_logistics_fee_usd", { precision: 10, scale: 2 }),
  feeRatePct:      numeric("fee_rate_pct", { precision: 5, scale: 2 }).default("3.00"),
  dealBundleId:    text("deal_bundle_id"),                       // links to document_vault

  // Status & Compliance
  status:          shipmentStatusEnum("status").notNull().default("QuoteRequested"),
  complianceNotes: jsonb("compliance_notes"),                    // {state: "MN", requirement: "..."}
  dvpVerified:     boolean("dvp_verified").notNull().default(false),
  titleStateReqs:  text("title_state_reqs"),                     // destination state title/registration notes

  // Timeline events (JSON array of {ts, status, note, actor})
  timelineEvents:  jsonb("timeline_events").default([]),

  // Timestamps
  quoteRequestedAt:  timestamp("quote_requested_at", { withTimezone: true }).defaultNow(),
  providerAssignedAt:timestamp("provider_assigned_at", { withTimezone: true }),
  pickedUpAt:        timestamp("picked_up_at", { withTimezone: true }),
  deliveredAt:       timestamp("delivered_at", { withTimezone: true }),
  dvpStampedAt:      timestamp("dvp_stamped_at", { withTimezone: true }),
  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShipmentOrderSchema = createInsertSchema(shipmentOrdersTable);
export const selectShipmentOrderSchema = createSelectSchema(shipmentOrdersTable);
export type InsertShipmentOrder = z.infer<typeof insertShipmentOrderSchema>;
export type ShipmentOrder      = z.infer<typeof selectShipmentOrderSchema>;
