/**
 * 3C Onyx — Deep Health Check
 *
 * AWS ALB / ECS / K8s-compatible liveness & readiness probe.
 * Returns 200 if all critical services are healthy, 503 if degraded.
 *
 * Endpoints:
 *   GET /healthz   — Full deep health check (subsystems + metrics)
 *   GET /readyz    — Lightweight readiness probe (for AWS ALB target group)
 *   GET /livez     — Liveness probe (process is alive)
 */
import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import * as wsHub from "../lib/wsHub";
import { blockedIpCount } from "../middlewares/scannerDetector";
import { allCircuitStatuses } from "../lib/circuitBreaker";
import { apiCache } from "../lib/apiCache";
import { getGovernorStatus } from "../lib/governor";
import { alertEngine } from "../lib/alertEngine";
import os from "os";

const router: IRouter = Router();
const START_TIME = Date.now();
const PLATFORM_VERSION = "1.0.0";

type ServiceStatus = "healthy" | "degraded" | "unknown";

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    await db.execute(sql`SELECT 1`);
    return "healthy";
  } catch {
    return "degraded";
  }
}

function checkWebSocket(): ServiceStatus {
  try {
    const s = wsHub.stats();
    return typeof s.totalConnections === "number" ? "healthy" : "degraded";
  } catch {
    return "unknown";
  }
}

function getSystemMetrics() {
  const mem = process.memoryUsage();
  const loadAvg = os.loadavg();
  return {
    heapUsedMb:  Math.round(mem.heapUsed  / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb:       Math.round(mem.rss       / 1024 / 1024),
    cpuLoad1m:   Math.round(loadAvg[0] * 100) / 100,
    nodeVersion: process.version,
  };
}

// Full deep health check — used by monitoring dashboards
router.get("/healthz", async (_req, res) => {
  const [dbStatus, wsStatus] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkWebSocket()),
  ]);

  const services: Record<string, ServiceStatus> = {
    database:  dbStatus,
    websocket: wsStatus,
    api:       "healthy",
  };

  // Only DB is a critical dependency — WS degradation does NOT serve a 503
  const degraded = services.database === "degraded";
  const uptimeSec = Math.round((Date.now() - START_TIME) / 1000);
  const metrics = getSystemMetrics();

  const securityPosture = {
    tokenBlacklist:    "active",
    inputSanitization: "active",
    scannerDetector:   "active",
    csp:               "enforced",
    hsts:              "enforced",
    rateLimiting:      "active",
    blockedIps:        blockedIpCount(),
    loginLockout:      "active",
    secretsValidated:  "startup",
  };

  const circuitBreakers = allCircuitStatuses();
  const openCircuits = circuitBreakers.filter((c) => c.state !== "CLOSED");

  const poolStats = {
    totalCount:     pool.totalCount,
    idleCount:      pool.idleCount,
    waitingCount:   pool.waitingCount,
  };

  res.status(degraded ? 503 : 200).json({
    status:      degraded ? "degraded" : "healthy",
    version:     PLATFORM_VERSION,
    environment: process.env.NODE_ENV ?? "development",
    uptimeSec,
    services,
    security:    securityPosture,
    circuitBreakers: {
      all:    circuitBreakers,
      open:   openCircuits.length,
      status: openCircuits.length === 0 ? "all_closed" : `${openCircuits.length}_open`,
    },
    governor: getGovernorStatus(),
    performance: {
      connectionPool: poolStats,
      cache:          apiCache.stats(),
      compression:    "gzip/brotli level-6 (threshold 1KB)",
      pagination:     "standardized (page/limit/offset)",
      asyncLogging:   "fire-and-forget (res.on finish)",
    },
    alerts: {
      active: alertEngine.getActiveAlerts(),
      count: alertEngine.getActiveAlerts().length,
    },
    metrics,
    ts: new Date().toISOString(),
  });
});

// AWS ALB readiness probe — only check DB; fast path
router.get("/readyz", async (_req, res) => {
  const dbStatus = await checkDatabase();
  const ready = dbStatus === "healthy";
  res.status(ready ? 200 : 503).json({
    ready,
    database: dbStatus,
    ts: new Date().toISOString(),
  });
});

// K8s/ECS liveness probe — just confirm the process is alive
router.get("/livez", (_req, res) => {
  res.status(200).json({ alive: true, uptimeSec: Math.round((Date.now() - START_TIME) / 1000) });
});

export default router;
