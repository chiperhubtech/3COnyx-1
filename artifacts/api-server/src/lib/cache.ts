/**
 * In-memory response cache — LRU-style with TTL.
 * Prevents repeated Gemini AI calls and DB hits for identical queries.
 * At millions of users, this is the difference between $10k/mo and $100k/mo in AI costs.
 */

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

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    setInterval(() => this.evictExpired(), 60_000);
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) {
      const oldest = [...this.store.entries()]
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
      if (oldest) this.store.delete(oldest[0]);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs, hits: 0 });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) { this.misses++; return null; }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    entry.hits++;
    this.hits++;
    return entry.value;
  }

  del(key: string): void {
    this.store.delete(key);
  }

  flush(): void {
    this.store.clear();
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
