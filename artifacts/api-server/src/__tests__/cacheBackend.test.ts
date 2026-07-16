import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import type { CacheBackend, InvalidationMessage, SharedEntry } from "../lib/cacheBackend";
import { MemoryCache } from "../lib/cache";

/**
 * In-process stand-in for a shared Redis store: a single store + pub/sub bus
 * that multiple cache instances register against, so we can prove cross-instance
 * write-through and invalidation fan-out without a live Redis server.
 */
class LoopbackBackend {
  store = new Map<string, SharedEntry>();
  handlers: Array<(m: InvalidationMessage) => void> = [];
  isReady = true;

  /** Hand out a per-instance "connection" that shares this store and bus. */
  connection(): CacheBackend {
    const bus = this;
    return {
      ready: () => bus.isReady,
      async get(ns, key) {
        const e = bus.store.get(`${ns}:${key}`);
        if (!e) return null;
        if (e.e <= Date.now()) { bus.store.delete(`${ns}:${key}`); return null; }
        return e;
      },
      async set(ns, key, entry) { bus.store.set(`${ns}:${key}`, entry); },
      async del(ns, key) { bus.store.delete(`${ns}:${key}`); },
      async delPattern(ns, prefix) {
        for (const k of [...bus.store.keys()]) {
          if (k.startsWith(`${ns}:${prefix}`)) bus.store.delete(k);
        }
      },
      async publish(msg) {
        // Deliver to every registered handler — models cross-process delivery
        // where each instance has a distinct origin.
        for (const h of bus.handlers) h(msg);
      },
      onInvalidation(h) { bus.handlers.push(h); },
    };
  }
}

describe("shared cache backend", () => {
  let bus: LoopbackBackend;
  let instanceA: MemoryCache;
  let instanceB: MemoryCache;

  beforeEach(() => {
    bus = new LoopbackBackend();
    instanceA = new MemoryCache(500, "test", bus.connection());
    instanceB = new MemoryCache(500, "test", bus.connection());
  });

  it("write-through persists to the shared store", () => {
    instanceA.set("k", "v", 60_000);
    expect(bus.store.get("test:k")?.v).toBe("v");
  });

  it("a cold instance hydrates from the shared store (survives restart)", async () => {
    instanceA.set("warm", "data", 60_000);
    // instanceB has never seen this key locally — first read misses but hydrates.
    expect(instanceB.get("warm")).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(instanceB.get("warm")).toBe("data");
  });

  it("invalidation on one instance clears the key on every instance", async () => {
    instanceA.set("shared", "x", 60_000);
    expect(instanceA.get("shared")).toBe("x");
    // Warm B's L1.
    expect(instanceB.get("shared")).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(instanceB.get("shared")).toBe("x");

    // Delete on A fans out to B and purges the shared store.
    instanceA.del("shared");
    expect(instanceA.get("shared")).toBeNull();
    expect(instanceB.get("shared")).toBeNull();
    expect(bus.store.has("test:shared")).toBe(false);
  });

  it("flush purges the shared store so a later read doesn't re-hydrate", async () => {
    instanceA.set("f", "y", 60_000);
    instanceA.flush();
    expect(bus.store.has("test:f")).toBe(false);
    expect(instanceB.get("f")).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(instanceB.get("f")).toBeNull();
  });

  it("falls back cleanly when the backend is not ready (no throw)", () => {
    bus.isReady = false;
    const c = new MemoryCache(500, "test", bus.connection());
    expect(() => c.set("a", 1, 60_000)).not.toThrow();
    expect(c.get("a")).toBe(1);          // served from local L1
    expect(c.get("missing")).toBeNull(); // hydrate skipped, no crash
  });

  it("survives a backend that throws on every operation", () => {
    const exploding: CacheBackend = {
      ready: () => true,
      get: () => Promise.reject(new Error("down")),
      set: () => Promise.reject(new Error("down")),
      del: () => Promise.reject(new Error("down")),
      delPattern: () => Promise.reject(new Error("down")),
      publish: () => Promise.reject(new Error("down")),
      onInvalidation: () => {},
    };
    const c = new MemoryCache(500, "test", exploding);
    expect(() => c.set("a", 1, 60_000)).not.toThrow();
    expect(c.get("a")).toBe(1);
    expect(() => c.del("a")).not.toThrow();
    expect(() => c.flush()).not.toThrow();
  });
});
