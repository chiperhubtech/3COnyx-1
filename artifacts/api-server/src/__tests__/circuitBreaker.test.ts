import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { CircuitBreaker, type CBState } from "../lib/circuitBreaker";

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 500,
      requestTimeout: 200,
    });
  });

  it("starts in CLOSED state", () => {
    expect(cb.currentState).toBe("CLOSED");
  });

  it("passes through successful calls in CLOSED state", async () => {
    const result = await cb.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
    expect(cb.currentState).toBe("CLOSED");
  });

  describe("CLOSED → OPEN transition", () => {
    it("opens after reaching failure threshold", async () => {
      const fail = () => Promise.reject(new Error("fail"));

      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(fail)).rejects.toThrow("fail");
      }
      expect(cb.currentState).toBe("OPEN");
    });

    it("does not open before reaching threshold", async () => {
      const fail = () => Promise.reject(new Error("fail"));
      for (let i = 0; i < 2; i++) {
        await expect(cb.execute(fail)).rejects.toThrow("fail");
      }
      expect(cb.currentState).toBe("CLOSED");
    });

    it("resets failure count on success", async () => {
      const fail = () => Promise.reject(new Error("fail"));
      await expect(cb.execute(fail)).rejects.toThrow();
      await expect(cb.execute(fail)).rejects.toThrow();
      await cb.execute(() => Promise.resolve("ok"));
      await expect(cb.execute(fail)).rejects.toThrow();
      await expect(cb.execute(fail)).rejects.toThrow();
      expect(cb.currentState).toBe("CLOSED");
    });
  });

  describe("OPEN state behavior", () => {
    async function openCircuit() {
      const fail = () => Promise.reject(new Error("fail"));
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(fail)).rejects.toThrow("fail");
      }
    }

    it("rejects immediately when OPEN and timeout not elapsed", async () => {
      await openCircuit();
      await expect(cb.execute(() => Promise.resolve("ok"))).rejects.toThrow(
        /Circuit OPEN/
      );
    });

    it("transitions to HALF_OPEN after timeout elapses", async () => {
      await openCircuit();
      expect(cb.currentState).toBe("OPEN");

      await new Promise((r) => setTimeout(r, 600));

      await cb.execute(() => Promise.resolve("ok"));
      expect(cb.currentState).toBe("HALF_OPEN");
    });
  });

  describe("HALF_OPEN → CLOSED transition", () => {
    async function toHalfOpen() {
      const fail = () => Promise.reject(new Error("fail"));
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(fail)).rejects.toThrow();
      }
      await new Promise((r) => setTimeout(r, 600));
    }

    it("closes after reaching success threshold in HALF_OPEN", async () => {
      await toHalfOpen();

      await cb.execute(() => Promise.resolve("ok"));
      expect(cb.currentState).toBe("HALF_OPEN");

      await cb.execute(() => Promise.resolve("ok"));
      expect(cb.currentState).toBe("CLOSED");
    });

    it("reopens on failure in HALF_OPEN", async () => {
      await toHalfOpen();

      await cb.execute(() => Promise.resolve("ok"));
      expect(cb.currentState).toBe("HALF_OPEN");

      await expect(
        cb.execute(() => Promise.reject(new Error("fail again")))
      ).rejects.toThrow("fail again");
      expect(cb.currentState).toBe("OPEN");
    });
  });

  describe("request timeout", () => {
    it("times out slow calls", async () => {
      const slow = () => new Promise<string>((resolve) => setTimeout(() => resolve("late"), 500));
      await expect(cb.execute(slow)).rejects.toThrow(/timed out/);
    });

    it("does not time out fast calls", async () => {
      const fast = () => new Promise<string>((resolve) => setTimeout(() => resolve("quick"), 50));
      const result = await cb.execute(fast);
      expect(result).toBe("quick");
    });
  });

  describe("status()", () => {
    it("reports CLOSED status correctly", () => {
      const s = cb.status();
      expect(s.name).toBe("test");
      expect(s.state).toBe("CLOSED");
      expect(s.failureCount).toBe(0);
      expect(s.nextAttemptAt).toBeNull();
    });

    it("reports OPEN status with nextAttemptAt", async () => {
      const fail = () => Promise.reject(new Error("fail"));
      for (let i = 0; i < 3; i++) {
        await expect(cb.execute(fail)).rejects.toThrow();
      }
      const s = cb.status();
      expect(s.state).toBe("OPEN");
      expect(s.nextAttemptAt).not.toBeNull();
    });
  });
});
