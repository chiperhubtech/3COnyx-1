import { getCacheBackend, INSTANCE_ID, type CacheBackend, type InvalidationMessage } from "./cacheBackend";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

type RefreshFn<T> = () => Promise<T>;

/** Logical namespace for this cache in the shared backend. */
const NS = "api";

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private refreshing = new Set<string>();
  private maxEntries: number;
  private backend: CacheBackend;

  constructor(maxEntries = 500, backend: CacheBackend = getCacheBackend()) {
    this.maxEntries = maxEntries;
    this.backend = backend;
    // When another instance invalidates, drop the key from our local L1 too.
    this.backend.onInvalidation((msg) => this.applyInvalidation(msg));
  }

  async get<T>(
    key: string,
    fetchFn: RefreshFn<T>,
    ttlMs: number,
    staleWhileRevalidateMs = 0,
  ): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (entry) {
      if (now < entry.staleAt) {
        return entry.data;
      }

      if (now < entry.expiresAt && staleWhileRevalidateMs > 0) {
        this.backgroundRefresh(key, fetchFn, ttlMs, staleWhileRevalidateMs);
        return entry.data;
      }
    }

    // L1 miss / fully stale — try the shared backend (survives restart + shared
    // across instances) before paying for a fresh fetch.
    if (this.backend.ready()) {
      const shared = await this.backend.get(NS, key);
      if (shared) {
        const staleAt = shared.s ?? shared.e;
        this.storeLocal(key, { data: shared.v as T, staleAt, expiresAt: shared.e });
        if (now < staleAt) return shared.v as T;
        if (now < shared.e && staleWhileRevalidateMs > 0) {
          this.backgroundRefresh(key, fetchFn, ttlMs, staleWhileRevalidateMs);
          return shared.v as T;
        }
      }
    }

    const data = await fetchFn();
    this.set(key, data, ttlMs, staleWhileRevalidateMs);
    return data;
  }

  set<T>(key: string, data: T, ttlMs: number, staleWhileRevalidateMs = 0): void {
    const now = Date.now();
    const staleAt = now + ttlMs;
    const expiresAt = now + ttlMs + staleWhileRevalidateMs;
    this.storeLocal(key, { data, staleAt, expiresAt });
    // Write-through to the shared store so other instances and post-restart
    // boots can read it. Fire-and-forget; failure just means in-memory only.
    this.backend.set(NS, key, { v: data, s: staleAt, e: expiresAt }, ttlMs + staleWhileRevalidateMs).catch(() => {});
  }

  invalidate(key: string): void {
    this.store.delete(key);
    this.backend.del(NS, key).catch(() => {});
    this.backend.publish({ ns: NS, kind: "key", value: key, origin: INSTANCE_ID }).catch(() => {});
  }

  invalidatePattern(prefix: string): void {
    this.deleteLocalPattern(prefix);
    this.backend.delPattern(NS, prefix).catch(() => {});
    this.backend.publish({ ns: NS, kind: "pattern", value: prefix, origin: INSTANCE_ID }).catch(() => {});
  }

  stats(): { size: number; maxEntries: number; shared: boolean } {
    return { size: this.store.size, maxEntries: this.maxEntries, shared: this.backend.ready() };
  }

  private storeLocal<T>(key: string, entry: CacheEntry<T>): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }
    this.store.set(key, entry);
  }

  private deleteLocalPattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Apply an invalidation that originated on another instance to local L1. */
  private applyInvalidation(msg: InvalidationMessage): void {
    if (msg.ns !== NS) return;
    if (msg.kind === "key" && msg.value !== undefined) {
      this.store.delete(msg.value);
    } else if (msg.kind === "pattern" && msg.value !== undefined) {
      this.deleteLocalPattern(msg.value);
    } else if (msg.kind === "flush") {
      this.store.clear();
    }
  }

  private backgroundRefresh<T>(
    key: string,
    fetchFn: RefreshFn<T>,
    ttlMs: number,
    staleWhileRevalidateMs: number,
  ): void {
    if (this.refreshing.has(key)) return;
    this.refreshing.add(key);
    fetchFn()
      .then((data) => this.set(key, data, ttlMs, staleWhileRevalidateMs))
      .catch(() => {})
      .finally(() => this.refreshing.delete(key));
  }

  private evictOldest(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
  }
}

export const apiCache = new ApiCache(500);

/**
 * Centralized cache key registry.
 * Every read-side cache key and every write-side invalidation
 * MUST go through these helpers so we can never drift.
 */
export const cacheKeys = {
  vehicleListings:    (q = "")            => `vehicles:listings:${q}`,
  vehicleListPrefix:  ()                  => `vehicles:listings:`,
  marketplaceSearch:  (q = "")            => `marketplace:search:${q}`,
  marketplacePrefix:  ()                  => `marketplace:`,
  marketplaceWholesale: ()                => `marketplace:wholesale`,
  dashboard:          (userId: number)    => `dashboard:${userId}`,
  dashboardPrefix:    ()                  => `dashboard:`,
  communityProfile:   (userId: number)    => `community:profile:${userId}`,
  communityPrefix:    ()                  => `community:`,
  communityStats:     (userId: number)    => `community:stats:${userId}`,
  dashboardStore:     (userId: number)    => `dashboard:store:${userId}`,
  walletBalance:      (userId: number)    => `wallet:balance:${userId}`,
  walletPrefix:       (userId: number)    => `wallet:balance:${userId}`,
  dealStatus:         (dealId: number)    => `deal:status:${dealId}`,
  dealsForUser:       (userId: number)    => `deals:user:${userId}`,
  dealsPrefix:        ()                  => `deal`,
  subscriptionState:  (userId: number)    => `subscription:${userId}`,
  commissionRates:    ()                  => `config:commission-rates`,
  activePlanCounts:   ()                  => `metrics:active-plan-counts`,
  platformMetrics:    ()                  => `metrics:platform-aggregate`,
};

/**
 * Write-through invalidation helpers.
 * Call these from the write-side handler whenever mutating state so the
 * next read fetches fresh data instead of serving stale cache.
 */
export const cacheInvalidate = {
  deal(dealId: number, ownerUserId?: number): void {
    apiCache.invalidate(cacheKeys.dealStatus(dealId));
    apiCache.invalidatePattern("deal");
    apiCache.invalidatePattern(cacheKeys.dashboardPrefix());
    if (ownerUserId) apiCache.invalidate(cacheKeys.dealsForUser(ownerUserId));
  },
  transaction(userId?: number): void {
    apiCache.invalidatePattern(cacheKeys.dashboardPrefix());
    if (userId) {
      apiCache.invalidate(cacheKeys.walletBalance(userId));
      apiCache.invalidate(cacheKeys.dashboard(userId));
    }
  },
  wallet(userId: number): void {
    apiCache.invalidate(cacheKeys.walletBalance(userId));
    apiCache.invalidate(cacheKeys.dashboard(userId));
  },
  subscription(userId: number): void {
    apiCache.invalidate(cacheKeys.subscriptionState(userId));
    apiCache.invalidate(cacheKeys.dashboard(userId));
  },
  vehicle(): void {
    apiCache.invalidatePattern(cacheKeys.vehicleListPrefix());
    apiCache.invalidatePattern(cacheKeys.marketplacePrefix());
  },
  community(userId?: number): void {
    if (userId) {
      apiCache.invalidate(cacheKeys.communityProfile(userId));
      apiCache.invalidatePattern(cacheKeys.communityStats(userId));
    } else {
      apiCache.invalidatePattern("community:");
    }
  },
};
