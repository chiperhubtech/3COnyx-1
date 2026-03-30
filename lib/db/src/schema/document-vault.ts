/**
 * 3C ONYX — Bank-Ready Document Vault
 * Author: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * Finance Agent packages Paint Protection (Simoniz), Tire & Wheel (Sonsio),
 * and Finance contracts into a single cryptographic bundle for faster funding.
 * Stellantis Financial, Ally, JMMB, etc. receive one authenticated package.
 */
import {
  pgTable, text, serial, integer, timestamp, pgEnum, boolean, jsonb, numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vaultBundleStatusEnum = pgEnum("vault_bundle_status", [
  "Assembling",
  "Sealed",
  "Submitted",
  "FundingApproved",
  "FundingDenied",
  "Funded",
  "Voided",
]);

export const documentVaultTable = pgTable("document_vault", {
  id:               serial("id").primaryKey(),
  bundleId:         text("bundle_id").notNull().unique(),       // BVT-XXXX
  dealId:           text("deal_id").notNull(),
  vin:              text("vin").notNull(),
  vehicleLabel:     text("vehicle_label"),
  buyerName:        text("buyer_name"),
  status:           vaultBundleStatusEnum("status").notNull().default("Assembling"),
  lenderName:       text("lender_name"),                        // "Stellantis Financial"
  lenderContact:    text("lender_contact"),
  fundingRep:       text("funding_rep"),                        // e.g. rep name at Stellantis
  dealAmountUsd:    numeric("deal_amount_usd", { precision: 14, scale: 2 }),
  documents:        jsonb("documents").notNull().default([]),    // [{type, name, url, verified}]
  bundleHash:       text("bundle_hash"),                        // SHA-256 of sealed bundle
  sealedAt:         timestamp("sealed_at", { withTimezone: true }),
  submittedAt:      timestamp("submitted_at", { withTimezone: true }),
  fundingApprovedAt: timestamp("funding_approved_at", { withTimezone: true }),
  fundedAt:         timestamp("funded_at", { withTimezone: true }),
  notes:            text("notes"),
  metadata:         jsonb("metadata"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentVaultSchema = createInsertSchema(documentVaultTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectDocumentVaultSchema = createSelectSchema(documentVaultTable);
export type InsertDocumentVault = z.infer<typeof insertDocumentVaultSchema>;
export type DocumentVault = typeof documentVaultTable.$inferSelect;
