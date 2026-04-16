import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { cache, TTL, MemoryCache } from "../lib/cache";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.flush();
  });

  describe("set and get", () => {
    it("stores and retrieves a value within TTL", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.get("key1")).toBe("value1");
    });

    it("returns null for missing key", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("overwrites existing key", () => {
      cache.set("key", "old", 60000);
      cache.set("key", "new", 60000);
      expect(cache.get("key")).toBe("new");
    });

    it("stores complex objects", () => {
      const obj = { user: { name: "John", scores: [1, 2, 3] } };
      cache.set("complex", obj, 60000);
      expect(cache.get("complex")).toEqual(obj);
    });
  });

  describe("TTL expiry", () => {
    it("expired entries return null", async () => {
      cache.set("expiring", "data", 50);
      await new Promise((r) => setTimeout(r, 100));
      expect(cache.get("expiring")).toBeNull();
    });

    it("entries within TTL are returned", () => {
      cache.set("alive", "data", 60000);
      expect(cache.get("alive")).toBe("data");
    });
  });

  describe("del and flush", () => {
    it("del removes a single entry", () => {
      cache.set("to-delete", "value", 60000);
      expect(cache.get("to-delete")).toBe("value");
      cache.del("to-delete");
      expect(cache.get("to-delete")).toBeNull();
    });

    it("flush clears all entries", () => {
      cache.set("a", 1, 60000);
      cache.set("b", 2, 60000);
      cache.flush();
      expect(cache.get("a")).toBeNull();
      expect(cache.get("b")).toBeNull();
    });
  });

  describe("LRU eviction when full (real MemoryCache)", () => {
    it("evicts oldest-expiring entry when cache exceeds maxSize", () => {
      const smallCache = new MemoryCache(3);
      smallCache.set("first", "1", 60000);
      smallCache.set("second", "2", 60000);
      smallCache.set("third", "3", 60000);

      expect(smallCache.stats().size).toBe(3);

      smallCache.set("fourth", "4", 60000);

      expect(smallCache.stats().size).toBe(3);
      expect(smallCache.get("first")).toBeNull();
      expect(smallCache.get("second")).toBe("2");
      expect(smallCache.get("third")).toBe("3");
      expect(smallCache.get("fourth")).toBe("4");
    });

    it("evicts entry with earliest expiration when full", () => {
      const smallCache = new MemoryCache(3);
      smallCache.set("short-ttl", "x", 1000);
      smallCache.set("medium-ttl", "y", 30000);
      smallCache.set("long-ttl", "z", 60000);

      smallCache.set("new-entry", "w", 60000);

      expect(smallCache.get("short-ttl")).toBeNull();
      expect(smallCache.get("new-entry")).toBe("w");
    });

    it("does not evict when below maxSize", () => {
      const smallCache = new MemoryCache(5);
      smallCache.set("a", 1, 60000);
      smallCache.set("b", 2, 60000);
      expect(smallCache.stats().size).toBe(2);
      expect(smallCache.get("a")).toBe(1);
      expect(smallCache.get("b")).toBe(2);
    });

    it("maintains correct size through multiple evictions", () => {
      const smallCache = new MemoryCache(2);
      smallCache.set("a", 1, 60000);
      smallCache.set("b", 2, 60000);
      smallCache.set("c", 3, 60000);
      smallCache.set("d", 4, 60000);

      expect(smallCache.stats().size).toBe(2);
      expect(smallCache.get("a")).toBeNull();
      expect(smallCache.get("b")).toBeNull();
      expect(smallCache.get("c")).toBe(3);
      expect(smallCache.get("d")).toBe(4);
    });
  });

  describe("stats tracking accuracy", () => {
    it("tracks hits and misses correctly", () => {
      cache.set("stats-key", "val", 60000);

      const before = cache.stats();
      cache.get("stats-key");
      cache.get("stats-key");
      cache.get("missing");

      const after = cache.stats();
      expect(after.hits).toBe(before.hits + 2);
      expect(after.misses).toBe(before.misses + 1);
    });

    it("reports hitRate as percentage", () => {
      cache.set("hr-key", "val", 60000);
      cache.get("hr-key");
      cache.get("miss1");

      const stats = cache.stats();
      expect(typeof stats.hitRate).toBe("number");
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });

    it("reports correct size", () => {
      cache.set("s1", 1, 60000);
      cache.set("s2", 2, 60000);
      expect(cache.stats().size).toBe(2);
    });

    it("reports maxSize of 500", () => {
      expect(cache.stats().maxSize).toBe(500);
    });

    it("hitRate is 0 when no operations performed", () => {
      const fresh = new MemoryCache(10);
      expect(fresh.stats().hitRate).toBe(0);
    });

    it("stats are accurate on MemoryCache with custom maxSize", () => {
      const c = new MemoryCache(3);
      c.set("a", 1, 60000);
      c.get("a");
      c.get("missing");
      const s = c.stats();
      expect(s.size).toBe(1);
      expect(s.maxSize).toBe(3);
      expect(s.hits).toBe(1);
      expect(s.misses).toBe(1);
      expect(s.hitRate).toBe(50);
    });
  });
});

describe("TTL constants", () => {
  it("has expected TTL values", () => {
    expect(TTL.MARKET_DATA).toBe(5 * 60 * 1000);
    expect(TTL.AI_GENERATION).toBe(10 * 60 * 1000);
    expect(TTL.AI_SCORING).toBe(2 * 60 * 1000);
    expect(TTL.VEHICLE_DATA).toBe(15 * 60 * 1000);
    expect(TTL.USER_PROFILE).toBe(60 * 1000);
    expect(TTL.STATIC).toBe(60 * 60 * 1000);
  });
});
