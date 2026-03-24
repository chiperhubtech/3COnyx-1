import { pgTable, serial, varchar, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const blockchainRecordsTable = pgTable("blockchain_records", {
  id: serial("id").primaryKey(),
  entryId: varchar("entry_id", { length: 36 }).notNull().unique(),
  vehicleId: varchar("vehicle_id", { length: 100 }).notNull(),
  vinMasked: varchar("vin_masked", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull(),
  actor: varchar("actor", { length: 200 }).notNull(),
  actorRole: varchar("actor_role", { length: 100 }).notNull(),
  data: jsonb("data").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull().unique(),
  previousHash: varchar("previous_hash", { length: 64 }).notNull(),
  blockIndex: integer("block_index").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  hmacSignature: varchar("hmac_signature", { length: 64 }).notNull(),
  ethTxHash: varchar("eth_tx_hash", { length: 100 }),
  ethBlock: integer("eth_block"),
  verified: boolean("verified").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BlockchainRecord = typeof blockchainRecordsTable.$inferSelect;
export type NewBlockchainRecord = typeof blockchainRecordsTable.$inferInsert;
