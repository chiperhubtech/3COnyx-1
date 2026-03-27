import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Alibaba ICBU Dropshipping Product Catalog
 * Populated via alibaba.icbu.product.list API (IOP gateway)
 */
export const alibabaProductsTable = pgTable("alibaba_products", {
  id:                  serial("id").primaryKey(),
  alibabaProductId:    text("alibaba_product_id").unique(),
  title:               text("title").notNull(),
  priceUsd:            text("price_usd"),
  priceMin:            text("price_min"),
  priceMax:            text("price_max"),
  imageUrl:            text("image_url"),
  detailUrl:           text("detail_url"),
  supplierName:        text("supplier_name"),
  supplierId:          text("supplier_id"),
  supplierCountry:     text("supplier_country"),
  moq:                 integer("moq").default(1),
  hasTradeAssurance:   boolean("has_trade_assurance").default(false),
  category:            text("category"),
  subCategory:         text("sub_category"),
  keywords:            text("keywords"),
  starRating:          text("star_rating"),
  ordersCount:         integer("orders_count"),
  rawPayload:          jsonb("raw_payload"),
  importedAt:          timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlibabaProductSchema = createInsertSchema(alibabaProductsTable).omit({
  id: true,
  importedAt: true,
  updatedAt: true,
});

export const selectAlibabaProductSchema = createSelectSchema(alibabaProductsTable);

export type AlibabaProduct    = typeof alibabaProductsTable.$inferSelect;
export type NewAlibabaProduct = z.infer<typeof insertAlibabaProductSchema>;
