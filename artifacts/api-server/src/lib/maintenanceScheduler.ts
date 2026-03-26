/**
 * 3C Onyx — Maintenance Scheduler
 *
 * Runs nightly cleanup tasks to keep the security tables lean:
 *   - Prune expired token_blacklist entries
 *   - Prune login_attempts older than 24 hours
 *
 * Uses a simple setInterval — no external cron dependency.
 * Runs immediately on startup (catches any leftover expired rows),
 * then every 24 hours.
 */
import { logger } from "./logger";
import { pruneExpiredBlacklistEntries } from "./tokenBlacklist";
import { db, loginAttemptsTable } from "@workspace/db";
import { lt } from "drizzle-orm";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function runMaintenance(): Promise<void> {
  try {
    // 1. Prune expired token blacklist entries
    await pruneExpiredBlacklistEntries();

    // 2. Prune login attempts older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.delete(loginAttemptsTable)
      .where(lt(loginAttemptsTable.attemptedAt, cutoff));

    logger.info("[MAINTENANCE] Nightly security table cleanup completed");
  } catch (err) {
    logger.warn({ err }, "[MAINTENANCE] Cleanup run failed — will retry next interval");
  }
}

export function startMaintenanceScheduler(): void {
  // Run immediately on startup
  void runMaintenance();
  // Then every 24 hours
  setInterval(() => { void runMaintenance(); }, INTERVAL_MS);
  logger.info("[MAINTENANCE] Scheduler started — nightly cleanup active");
}
