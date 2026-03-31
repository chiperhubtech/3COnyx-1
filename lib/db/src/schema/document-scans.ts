/**
 * 3C ONYX — DealerFlow OS Document Scanning Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Multi-Modal Universal Intake (OCR + AI Vision)
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scanDocTypeEnum = pgEnum("scan_doc_type", [
  "Invoice",
  "DMV_Form",
  "Title",
  "Registration",
  "Mopar_Sheet",
  "Parts_Order",
  "Warranty_Claim",
  "Insurance_Doc",
  "Bill_of_Sale",
  "Other",
]);

export const scanStatusEnum = pgEnum("scan_status", [
  "Processing",
  "Completed",
  "Failed",
  "Routed",
]);

export const documentScansTable = pgTable("document_scans", {
  id: serial("id").primaryKey(),
  documentType: scanDocTypeEnum("document_type").notNull().default("Other"),
  status: scanStatusEnum("status").notNull().default("Processing"),
  imageUrl: text("image_url"),
  rawOcrText: text("raw_ocr_text"),
  extractedData: jsonb("extracted_data"),
  extractedVin: text("extracted_vin"),
  extractedCustomerName: text("extracted_customer_name"),
  extractedPartNumbers: jsonb("extracted_part_numbers"),
  routedToDepartment: text("routed_to_department"),
  routedToTaskId: integer("routed_to_task_id"),
  scannedById: integer("scanned_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  dealershipId: integer("dealership_id").references(() => usersTable.id, { onDelete: "set null" }),
  confidence: text("confidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("doc_scans_type_idx").on(t.documentType),
  index("doc_scans_status_idx").on(t.status),
  index("doc_scans_dealer_idx").on(t.dealershipId),
  index("doc_scans_vin_idx").on(t.extractedVin),
]);

export const insertDocumentScanSchema = createInsertSchema(documentScansTable).omit({
  id: true,
  createdAt: true,
});

export const selectDocumentScanSchema = createSelectSchema(documentScansTable);

export type InsertDocumentScan = z.infer<typeof insertDocumentScanSchema>;
export type DocumentScan = typeof documentScansTable.$inferSelect;
