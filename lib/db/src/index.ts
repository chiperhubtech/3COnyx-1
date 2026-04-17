import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const POOL_MAX = Number(process.env.DB_POOL_MAX || 20);
const POOL_MIN = Number(process.env.DB_POOL_MIN || 2);
const POOL_WAIT_WARN_THRESHOLD = Number(process.env.DB_POOL_WAIT_WARN || 3);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: POOL_MAX,
  min: POOL_MIN,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  maxUses: 7_500,
  allowExitOnIdle: false,
});

pool.on("error", (err) => {
  console.error("[DB POOL] unexpected idle client error", err.message);
});

/**
 * Pool exhaustion early-warning monitor.
 * Logs a structured warning the moment `waitingCount` crosses the configured
 * threshold so the alert engine can pick it up before the pool actually
 * runs dry and requests start timing out.
 */
let lastPoolWarnAt = 0;
const POOL_WARN_COOLDOWN_MS = 15_000;
const poolMonitor = setInterval(() => {
  const waiting = pool.waitingCount;
  const total   = pool.totalCount;
  const idle    = pool.idleCount;
  const active  = total - idle;
  if (waiting >= POOL_WAIT_WARN_THRESHOLD) {
    const now = Date.now();
    if (now - lastPoolWarnAt >= POOL_WARN_COOLDOWN_MS) {
      lastPoolWarnAt = now;
      console.warn(JSON.stringify({
        level: "warn",
        component: "db_pool",
        event: "pool_pressure",
        message: "[DB POOL] connection pressure detected",
        waitingCount: waiting,
        totalCount: total,
        idleCount: idle,
        activeCount: active,
        max: POOL_MAX,
        threshold: POOL_WAIT_WARN_THRESHOLD,
        ts: new Date().toISOString(),
      }));
    }
  }
}, 5_000);
poolMonitor.unref?.();

export function getPoolStats(): {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  activeCount: number;
  max: number;
  min: number;
} {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    activeCount: pool.totalCount - pool.idleCount,
    max: POOL_MAX,
    min: POOL_MIN,
  };
}

export const db = drizzle(pool, { schema });

export * from "./schema";
