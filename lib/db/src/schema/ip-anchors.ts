/**
 * IP Anchoring — Proof-of-Invention Module
 * Timestamps every unique AI interaction, AR anchor, and code update.
 * Each anchor is hashed (SHA-256) and recorded to the immutable ledger,
 * establishing legal priority for CUXTOMCANDYCLUB LLC IP portfolio.
 */
import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const ipAssetTypeEnum = pgEnum("ip_asset_type", [
  "AI_INTERACTION",
  "AR_ANCHOR",
  "ALGORITHM",
  "FEATURE_SPEC",
  "TRADE_SECRET",
  "BRAND_ASSET",
  "CODE_MODULE",
  "DATASET",
]);

export const ipAnchorsTable = pgTable("ip_anchors", {
  id:            serial("id").primaryKey(),
  anchoredBy:    integer("anchored_by"),        // userId (null = system)
  assetType:     ipAssetTypeEnum("asset_type").notNull(),
  title:         text("title").notNull(),
  description:   text("description").notNull(),
  /** SHA-256 of the content/artifact being anchored */
  contentHash:   text("content_hash").notNull(),
  /** SHA-256 of (contentHash + timestamp + previousHash) — chain link */
  anchorHash:    text("anchor_hash").notNull(),
  /** Running chain — hash of previous IP anchor (or "GENESIS") */
  previousHash:  text("previous_hash").notNull().default("GENESIS"),
  /** Ethereum transaction hash if anchored on-chain */
  ethTxHash:     text("eth_tx_hash"),
  /** CUXTOMCANDYCLUB LLC assignee name */
  assignee:      text("assignee").notNull().default("CUXTOMCANDYCLUB LLC"),
  anchoredAt:    timestamp("anchored_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IpAnchor    = typeof ipAnchorsTable.$inferSelect;
export type NewIpAnchor = typeof ipAnchorsTable.$inferInsert;
