import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Token Blacklist — tracks revoked JWTs.
 * On logout the token's JTI is recorded here.
 * requireAuth checks this table before allowing access.
 * Expired entries are pruned nightly.
 */
export const tokenBlacklistTable = pgTable("token_blacklist", {
  id:        serial("id").primaryKey(),
  jti:       varchar("jti", { length: 64 }).notNull().unique(),
  userId:    integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
