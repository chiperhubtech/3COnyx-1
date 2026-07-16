/**
 * In-memory response cache — LRU-style with TTL.
 * Prevents repeated Gemini AI calls and DB hits for identical queries.
 * At millions of users, this is the difference between $10k/mo and $100k/mo in AI costs.
 */

import { getCacheBackend, INSTANCE_ID, type CacheBackend, type InvalidationMessage } from "./cacheBackend";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;
  /** Logical namespace in the shared backend; per-instance so MemoryCaches don't collide. */
  private readonly ns: string;
  private readonly backend: CacheBackend;
  private readonly hydrating = new Set<string>();

  constructor(maxSize = 500, namespace = "mem", backend: CacheBackend = getCacheBackend()) {
    this.maxSize = maxSize;
    this.ns = namespace;
    this.backend = backend;
    this.backend.onInvalidation((msg) => this.applyInvalidation(msg));
    setInterval(() => this.evictExpired(), 60_000);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.setLocal(key, value, Date.now() + ttlMs);
    // Write-through so the value is shared across instances and survives restart.
    this.backend.set(this.ns, key, { v: value, e: Date.now() + ttlMs }, ttlMs).catch(() => {});
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      // Best-effort: pull a shared value into L1 so the next read (or another
      // instance after a restart) is served locally. Returns null this call.
      this.hydrateFromShared(key);
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      this.hydrateFromShared(key);
      return null;
    }
    entry.hits++;
    this.hits++;
    return entry.value;
  }

  del(key: string): void {
    this.store.delete(key);
    this.backend.del(this.ns, key).catch(() => {});
    this.backend.publish({ ns: this.ns, kind: "key", value: key, origin: INSTANCE_ID }).catch(() => {});
  }

  flush(): void {
    this.store.clear();
    // Purge the shared copy too, otherwise a later miss re-hydrates from L2.
    this.backend.delPattern(this.ns, "").catch(() => {});
    this.backend.publish({ ns: this.ns, kind: "flush", origin: INSTANCE_ID }).catch(() => {});
  }

  private setLocal<T>(key: string, value: T, expiresAt: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldest = [...this.store.entries()]
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
      if (oldest) this.store.delete(oldest[0]);
    }
    this.store.set(key, { value, expiresAt, hits: 0 });
  }

  private hydrateFromShared(key: string): void {
    if (!this.backend.ready() || this.hydrating.has(key)) return;
    this.hydrating.add(key);
    void this.backend.get(this.ns, key)
      .then((shared) => {
        // Don't clobber a value a caller may have set in the meantime.
        if (shared && shared.e > Date.now() && !this.store.has(key)) {
          this.setLocal(key, shared.v, shared.e);
        }
      })
      .catch(() => {})
      .finally(() => this.hydrating.delete(key));
  }

  private applyInvalidation(msg: InvalidationMessage): void {
    if (msg.ns !== this.ns) return;
    if (msg.kind === "key" && msg.value !== undefined) {
      this.store.delete(msg.value);
    } else if (msg.kind === "flush") {
      this.store.clear();
    } else if (msg.kind === "pattern" && msg.value !== undefined) {
      for (const k of this.store.keys()) {
        if (k.startsWith(msg.value)) this.store.delete(k);
      }
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  stats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses === 0 ? 0 : Math.round((this.hits / (this.hits + this.misses)) * 100),
      shared: this.backend.ready(),
    };
  }
}

export { MemoryCache };
export const cache = new MemoryCache(500);

export const TTL = {
  MARKET_DATA:   5  * 60 * 1000,
  AI_GENERATION: 10 * 60 * 1000,
  AI_SCORING:    2  * 60 * 1000,
  VEHICLE_DATA:  15 * 60 * 1000,
  USER_PROFILE:  60 * 1000,
  STATIC:        60 * 60 * 1000,
} as const;
