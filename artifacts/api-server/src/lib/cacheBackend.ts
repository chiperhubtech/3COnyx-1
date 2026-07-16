/**
 * Shared cache backend — the L2 layer that lets every API instance read from
 * and invalidate the same cache, and lets cached data survive restarts.
 *
 * Design: a small pluggable adapter sits *behind* the in-process caches
 * (`apiCache` and `cache`), which act as a fast local L1 near-cache.
 *
 *   - When `REDIS_URL` (or `REDIS_HOST`) is configured, a Redis adapter is used:
 *       • set() write-through persists entries so they outlive a restart and are
 *         visible to other instances.
 *       • get() lets a cold instance hydrate from the shared store.
 *       • invalidations fan out over a Redis pub/sub channel so every instance
 *         drops the key — no instance serves stale data after a write.
 *   - When Redis is not configured, or the connection drops, a no-op adapter is
 *     used and the caches transparently fall back to pure in-memory behaviour.
 *     A Redis outage never takes the API down.
 *
 * Callers of `apiCache` / `cache` do not change — this all lives behind them.
 */
import type Redis from "ioredis";
import { randomBytes } from "node:crypto";
import { logger } from "./logger";

/** Serialized cache entry as stored in the shared backend. */
export interface SharedEntry {
  /** The cached value/data. */
  v: unknown;
  /** Absolute epoch ms at which the entry becomes stale (apiCache SWR). */
  s?: number;
  /** Absolute epoch ms at which the entry fully expires. */
  e: number;
}

export interface InvalidationMessage {
  /** Logical cache namespace, e.g. "api" or "mem". */
  ns: string;
  kind: "key" | "pattern" | "flush";
  value?: string;
  /** Instance that originated the message — used to ignore our own echoes. */
  origin: string;
}

type InvalidationHandler = (msg: InvalidationMessage) => void;

const CHANNEL = "cache:invalidate";
const KEY_PREFIX = "cache";

/** Unique id for this process so we can ignore pub/sub messages we sent. */
export const INSTANCE_ID = `${process.pid}-${randomBytes(4).toString("hex")}`;

export interface CacheBackend {
  /** True when the shared store is connected and usable. */
  ready(): boolean;
  get(ns: string, key: string): Promise<SharedEntry | null>;
  set(ns: string, key: string, entry: SharedEntry, ttlMs: number): Promise<void>;
  del(ns: string, key: string): Promise<void>;
  delPattern(ns: string, prefix: string): Promise<void>;
  publish(msg: InvalidationMessage): Promise<void>;
  onInvalidation(handler: InvalidationHandler): void;
}

function redisKey(ns: string, key: string): string {
  return `${KEY_PREFIX}:${ns}:${key}`;
}

/** Fallback adapter used when Redis is not configured. Everything is local-only. */
class NoopBackend implements CacheBackend {
  private handlers: InvalidationHandler[] = [];
  ready(): boolean { return false; }
  async get(): Promise<SharedEntry | null> { return null; }
  async set(): Promise<void> { /* local-only */ }
  async del(): Promise<void> { /* local-only */ }
  async delPattern(): Promise<void> { /* local-only */ }
  async publish(): Promise<void> { /* local-only */ }
  onInvalidation(handler: InvalidationHandler): void { this.handlers.push(handler); }
}

class RedisBackend implements CacheBackend {
  private pub: Redis;
  private sub: Redis;
  private connected = false;
  private handlers: InvalidationHandler[] = [];

  constructor(RedisCtor: typeof Redis, url: string) {
    const opts = {
      lazyConnect: false,
      // Fail commands fast instead of queueing them while disconnected, so the
      // caches fall back to in-memory immediately rather than hanging.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      // Keep trying to reconnect forever with a capped backoff; a transient
      // Redis blip should self-heal without restarting the API.
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
    };

    this.pub = new RedisCtor(url, opts);
    this.sub = new RedisCtor(url, opts);

    // Read/write readiness tracks the command (pub) client only. A transient
    // error on the subscriber must NOT disable L2 reads/writes — the subscriber
    // re-subscribes on its own "ready" event below.
    this.pub.on("error", (err: Error) => {
      if (this.connected) {
        logger.warn({ err: err.message }, "[cache-backend] redis error — falling back to in-memory");
      }
      this.connected = false;
    });
    this.pub.on("end", () => { this.connected = false; });
    this.pub.on("ready", () => {
      this.connected = true;
      logger.info("[cache-backend] redis connected — shared cache active");
    });
    this.sub.on("error", (err: Error) => {
      logger.debug?.({ err: err.message }, "[cache-backend] redis subscriber error — will re-subscribe on reconnect");
    });

    // Subscribe on every "ready" — fires on first connect AND on each reconnect.
    // A one-shot subscribe in the constructor would silently miss invalidations
    // if the socket wasn't ready yet (offline queue is disabled) or after a drop.
    this.sub.on("ready", () => this.ensureSubscribed());
    this.sub.on("message", (channel: string, raw: string) => {
      if (channel !== CHANNEL) return;
      let msg: InvalidationMessage;
      try { msg = JSON.parse(raw) as InvalidationMessage; } catch { return; }
      if (msg.origin === INSTANCE_ID) return; // already applied locally
      for (const h of this.handlers) {
        try { h(msg); } catch { /* never let a handler break pub/sub */ }
      }
    });
  }

  ready(): boolean { return this.connected; }

  private ensureSubscribed(): void {
    this.sub.subscribe(CHANNEL).catch((err: Error) => {
      logger.warn({ err: err.message }, "[cache-backend] redis subscribe failed — retrying on next reconnect");
    });
  }

  async get(ns: string, key: string): Promise<SharedEntry | null> {
    if (!this.connected) return null;
    try {
      const raw = await this.pub.get(redisKey(ns, key));
      if (!raw) return null;
      return JSON.parse(raw) as SharedEntry;
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "[cache-backend] get failed");
      return null;
    }
  }

  async set(ns: string, key: string, entry: SharedEntry, ttlMs: number): Promise<void> {
    if (!this.connected) return;
    try {
      await this.pub.set(redisKey(ns, key), JSON.stringify(entry), "PX", Math.max(1, Math.round(ttlMs)));
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "[cache-backend] set failed");
    }
  }

  async del(ns: string, key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.pub.del(redisKey(ns, key));
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "[cache-backend] del failed");
    }
  }

  async delPattern(ns: string, prefix: string): Promise<void> {
    if (!this.connected) return;
    const match = `${redisKey(ns, prefix)}*`;
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.pub.scan(cursor, "MATCH", match, "COUNT", 200);
        cursor = next;
        if (keys.length) await this.pub.del(...keys);
      } while (cursor !== "0");
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "[cache-backend] delPattern failed");
    }
  }

  async publish(msg: InvalidationMessage): Promise<void> {
    if (!this.connected) return;
    try {
      await this.pub.publish(CHANNEL, JSON.stringify(msg));
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "[cache-backend] publish failed");
    }
  }

  onInvalidation(handler: InvalidationHandler): void { this.handlers.push(handler); }
}

let backend: CacheBackend | null = null;

/**
 * Lazily resolve the shared cache backend. Constructed once per process.
 * Returns a Redis-backed adapter when REDIS_URL/REDIS_HOST is set, otherwise a
 * no-op adapter that keeps the caches purely in-memory.
 */
export function getCacheBackend(): CacheBackend {
  if (backend) return backend;

  const url = process.env.REDIS_URL
    ?? (process.env.REDIS_HOST
      ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? "6379"}`
      : undefined);

  if (!url) {
    backend = new NoopBackend();
    return backend;
  }

  try {
    // Imported eagerly at the top for types; required here so a missing module
    // never crashes startup — we just fall back to in-memory.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RedisCtor = require("ioredis") as typeof Redis;
    backend = new RedisBackend(RedisCtor, url);
    logger.info("[cache-backend] using redis shared cache");
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "[cache-backend] redis init failed — using in-memory cache");
    backend = new NoopBackend();
  }
  return backend;
}
