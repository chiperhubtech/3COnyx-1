/**
 * 3C ONYX — Idempotency Guard Middleware
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-IDEMPOTENCY-SOVEREIGN
 *
 * Prevents duplicate deal creation, payment processing, and state mutations.
 * Every mutating request can include an `Idempotency-Key` header. The guard
 * stores the key + response for a configurable TTL. If the same key arrives
 * again, the original response is replayed without re-executing the handler.
 *
 * This is the "Redis Redlock" equivalent for the single-node runtime.
 * In production with Redis, swap the in-memory store for a Redis-backed one.
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";

const ARCHITECT = "Ronald Antonio Cadet";
const SOVEREIGN = "CUXTOMCANDYCLUB LLC";

interface CachedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
  fingerprint: string;
}

interface PendingLock {
  createdAt: number;
  resolvers: Array<{
    resolve: (cached: CachedResponse) => void;
    reject: (err: Error) => void;
  }>;
}

const responseCache = new Map<string, CachedResponse>();
const pendingLocks = new Map<string, PendingLock>();

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const LOCK_TIMEOUT_MS = 30_000;
const MAX_CACHE_SIZE = 50_000;

setInterval(() => {
  const cutoff = Date.now() - DEFAULT_TTL_MS;
  let evicted = 0;
  for (const [key, entry] of responseCache) {
    if (entry.createdAt < cutoff) {
      responseCache.delete(key);
      evicted++;
    }
  }
  if (evicted > 0) {
    logger.debug({ evicted, remaining: responseCache.size }, "[idempotency] TTL eviction sweep");
  }

  const lockCutoff = Date.now() - LOCK_TIMEOUT_MS;
  for (const [key, lock] of pendingLocks) {
    if (lock.createdAt < lockCutoff) {
      for (const r of lock.resolvers) {
        r.reject(new Error("Idempotency lock timeout"));
      }
      pendingLocks.delete(key);
    }
  }
}, 5 * 60 * 1000);

function generateFingerprint(req: Request): string {
  const parts = [
    req.method,
    req.originalUrl,
    JSON.stringify(req.body || {}),
    ARCHITECT,
    SOVEREIGN,
  ].join("|");
  return crypto.createHash("sha256").update(parts).digest("hex").slice(0, 16);
}

function enforceCacheLimit(): void {
  if (responseCache.size <= MAX_CACHE_SIZE) return;
  const entries = [...responseCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const toEvict = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.1));
  for (const [key] of toEvict) responseCache.delete(key);
}

export function idempotencyGuard() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (!idempotencyKey) {
      return next();
    }

    const normalizedKey = `${req.method}:${req.originalUrl}:${idempotencyKey}`;
    const fingerprint = generateFingerprint(req);

    const cached = responseCache.get(normalizedKey);
    if (cached) {
      if (cached.fingerprint !== fingerprint) {
        res.status(422).json({
          error: "Idempotency key reuse with different request body",
          code: "IDEMPOTENCY_KEY_CONFLICT",
          architect: ARCHITECT,
        });
        return;
      }

      logger.info({ key: idempotencyKey, path: req.originalUrl }, "[idempotency] Replaying cached response");
      res.setHeader("X-Idempotency-Replayed", "true");
      res.setHeader("X-ONYX-Architect", ARCHITECT);
      for (const [h, v] of Object.entries(cached.headers)) {
        if (h.toLowerCase().startsWith("x-")) res.setHeader(h, v);
      }
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    const existingLock = pendingLocks.get(normalizedKey);
    if (existingLock) {
      try {
        const result = await new Promise<CachedResponse>((resolve, reject) => {
          existingLock.resolvers.push({ resolve, reject });
        });
        res.setHeader("X-Idempotency-Replayed", "true");
        res.setHeader("X-ONYX-Architect", ARCHITECT);
        res.status(result.statusCode).json(result.body);
        return;
      } catch {
        res.status(409).json({
          error: "Concurrent request with same idempotency key timed out",
          code: "IDEMPOTENCY_LOCK_TIMEOUT",
        });
        return;
      }
    }

    pendingLocks.set(normalizedKey, { createdAt: Date.now(), resolvers: [] });

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      const entry: CachedResponse = {
        statusCode: res.statusCode,
        body,
        headers: {},
        createdAt: Date.now(),
        fingerprint,
      };

      const outHeaders = res.getHeaders();
      for (const [h, v] of Object.entries(outHeaders)) {
        if (typeof v === "string" && h.toLowerCase().startsWith("x-")) {
          entry.headers[h] = v;
        }
      }

      enforceCacheLimit();
      responseCache.set(normalizedKey, entry);

      const lock = pendingLocks.get(normalizedKey);
      if (lock) {
        for (const r of lock.resolvers) r.resolve(entry);
        pendingLocks.delete(normalizedKey);
      }

      res.setHeader("X-Idempotency-Key", idempotencyKey);
      res.setHeader("X-ONYX-Architect", ARCHITECT);
      return originalJson(body);
    } as typeof res.json;

    next();
  };
}

export function getIdempotencyStats() {
  return {
    cachedResponses: responseCache.size,
    pendingLocks: pendingLocks.size,
    maxCacheSize: MAX_CACHE_SIZE,
    ttlMs: DEFAULT_TTL_MS,
    architect: ARCHITECT,
    entity: SOVEREIGN,
  };
}
