interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

type RefreshFn<T> = () => Promise<T>;

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private refreshing = new Set<string>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
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

    const data = await fetchFn();
    this.set(key, data, ttlMs, staleWhileRevalidateMs);
    return data;
  }

  set<T>(key: string, data: T, ttlMs: number, staleWhileRevalidateMs = 0): void {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      staleAt: now + ttlMs,
      expiresAt: now + ttlMs + staleWhileRevalidateMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  stats(): { size: number; maxEntries: number } {
    return { size: this.store.size, maxEntries: this.maxEntries };
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
