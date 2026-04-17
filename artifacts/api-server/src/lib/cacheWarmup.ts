/**
 * Cache Warm-Up — pre-loads frequently accessed config and aggregate data
 * on server boot so the first round of post-restart requests don't
 * stampede a cold database.
 */
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { cache, TTL } from "./cache";
import { apiCache, cacheKeys } from "./apiCache";
import { logger } from "./logger";

const COMMISSION_RATES = {
  referralPctBps: 300,
  serviceNodePctBps: 300,
  platformFeePct: 1.2,
  dealerDiscountPct: 3.0,
  techFeePct: 3.0,
};

async function loadCommissionRates(): Promise<typeof COMMISSION_RATES> {
  return COMMISSION_RATES;
}

async function loadActivePlanCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db
      .select({
        tier: usersTable.subscriptionTier,
        count: sql<number>`count(*)::int`,
      })
      .from(usersTable)
      .where(eq(usersTable.subscriptionStatus, "active"))
      .groupBy(usersTable.subscriptionTier);
    const out: Record<string, number> = {};
    for (const r of rows) out[r.tier ?? "free"] = r.count;
    return out;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "[cache-warmup] active plan counts unavailable");
    return {};
  }
}

async function loadPlatformMetrics(): Promise<{ totalUsers: number; activeUsers: number }> {
  try {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(usersTable);
    const [{ active }] = await db
      .select({ active: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.isActive, true));
    return { totalUsers: total ?? 0, activeUsers: active ?? 0 };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "[cache-warmup] platform metrics unavailable");
    return { totalUsers: 0, activeUsers: 0 };
  }
}

export async function warmCaches(): Promise<void> {
  const start = Date.now();
  const results = await Promise.allSettled([
    loadCommissionRates().then((r) => {
      cache.set(cacheKeys.commissionRates(), r, TTL.STATIC);
      apiCache.set(cacheKeys.commissionRates(), r, TTL.STATIC, TTL.STATIC);
    }),
    loadActivePlanCounts().then((r) => {
      apiCache.set(cacheKeys.activePlanCounts(), r, 5 * 60 * 1000, 5 * 60 * 1000);
    }),
    loadPlatformMetrics().then((r) => {
      apiCache.set(cacheKeys.platformMetrics(), r, 5 * 60 * 1000, 5 * 60 * 1000);
    }),
  ]);
  const ok   = results.filter((r) => r.status === "fulfilled").length;
  const fail = results.length - ok;
  logger.info({ ok, fail, durationMs: Date.now() - start }, "[cache-warmup] complete");
}
