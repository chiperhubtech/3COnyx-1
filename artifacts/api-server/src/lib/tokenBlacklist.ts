/**
 * 3C Onyx — Token Blacklist Service
 *
 * Revoked JTIs are stored in PostgreSQL and cached in-process with a
 * 5-minute LRU so every requireAuth check does NOT hit the DB.
 * On logout the JTI is added to both stores immediately.
 */
import { db, tokenBlacklistTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";

/** Simple in-memory set with TTL.  Entries expire after MAX_AGE ms. */
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry { revoked: boolean; ts: number }
const cache = new Map<string, CacheEntry>();

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.ts > CACHE_MAX_AGE_MS) cache.delete(key);
  }
}

/** Persist a revoked JTI to the DB + local cache. */
export async function revokeToken(jti: string, userId: number, expiresAt: Date): Promise<void> {
  await db.insert(tokenBlacklistTable)
    .values({ jti, userId, expiresAt })
    .onConflictDoNothing();
  cache.set(jti, { revoked: true, ts: Date.now() });
}

/** Returns true if the JTI has been revoked. */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  pruneCache();
  const cached = cache.get(jti);
  if (cached !== undefined) return cached.revoked;

  const rows = await db.select({ jti: tokenBlacklistTable.jti })
    .from(tokenBlacklistTable)
    .where(eq(tokenBlacklistTable.jti, jti))
    .limit(1);

  const revoked = rows.length > 0;
  cache.set(jti, { revoked, ts: Date.now() });
  return revoked;
}

/** Prune expired blacklist entries from DB (call nightly or on startup). */
export async function pruneExpiredBlacklistEntries(): Promise<void> {
  await db.delete(tokenBlacklistTable)
    .where(lt(tokenBlacklistTable.expiresAt, new Date()));
}
