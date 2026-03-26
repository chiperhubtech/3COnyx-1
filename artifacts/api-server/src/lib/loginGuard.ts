/**
 * 3C Onyx — Login Guard (brute-force protection)
 *
 * Tracks failed login attempts per email+IP.
 * After MAX_FAILURES failures within the WINDOW, the account is
 * locked for LOCKOUT_MS milliseconds from the first failure.
 *
 * Uses a lightweight in-process Map for speed; DB is the source of truth.
 */
import { db, loginAttemptsTable } from "@workspace/db";
import { and, eq, gte, count } from "drizzle-orm";

const MAX_FAILURES = 5;
const WINDOW_MS    = 15 * 60 * 1000;  // 15 minutes
const LOCKOUT_MS   = 30 * 60 * 1000;  // 30-minute lockout

/** In-memory cache: key = `email:ip`, value = { failCount, firstFail } */
const state = new Map<string, { failCount: number; firstFail: number }>();

function cacheKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

/**
 * Check whether an email+IP is currently locked out.
 * Returns { locked: true, retryAfter: <seconds> } or { locked: false }.
 */
export async function checkLockout(
  email: string,
  ip: string,
): Promise<{ locked: false } | { locked: true; retryAfter: number }> {
  const key   = cacheKey(email, ip);
  const entry = state.get(key);
  if (!entry) return { locked: false };

  const elapsed = Date.now() - entry.firstFail;
  if (elapsed > LOCKOUT_MS) {
    state.delete(key);
    return { locked: false };
  }
  if (entry.failCount >= MAX_FAILURES) {
    const retryAfter = Math.ceil((LOCKOUT_MS - elapsed) / 1000);
    return { locked: true, retryAfter };
  }
  return { locked: false };
}

/** Record a login attempt to DB + in-memory state. */
export async function recordAttempt(
  email:   string,
  ip:      string,
  success: boolean,
  userAgent?: string,
  failReason?: string,
): Promise<void> {
  // DB record (async, fire-and-forget — don't block login path)
  db.insert(loginAttemptsTable)
    .values({ email: email.toLowerCase(), ipAddress: ip, success, userAgent, failReason })
    .catch(() => { /* non-fatal */ });

  const key = cacheKey(email, ip);
  if (success) {
    state.delete(key);
    return;
  }
  const existing = state.get(key);
  if (!existing) {
    state.set(key, { failCount: 1, firstFail: Date.now() });
  } else {
    existing.failCount++;
  }
}

/** Recent failure count from DB (used to seed cold-start cache). */
export async function recentFailCount(email: string, ip: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [row]  = await db
    .select({ total: count() })
    .from(loginAttemptsTable)
    .where(
      and(
        eq(loginAttemptsTable.email, email.toLowerCase()),
        eq(loginAttemptsTable.ipAddress, ip),
        eq(loginAttemptsTable.success, false),
        gte(loginAttemptsTable.attemptedAt, since),
      ),
    );
  return row?.total ?? 0;
}
