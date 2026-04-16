import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("@workspace/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
  loginAttemptsTable: {
    email: "email",
    ipAddress: "ipAddress",
    success: "success",
    attemptedAt: "attemptedAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  gte: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  count: vi.fn(() => "count"),
}));

import { checkLockout, recordAttempt, recentFailCount } from "../lib/loginGuard";

describe("loginGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      catch: vi.fn(),
    };
    mockInsert.mockReturnValue(insertChain);
  });

  describe("checkLockout", () => {
    it("returns locked: false for unknown email/ip", async () => {
      const result = await checkLockout("fresh-" + Date.now() + "@test.com", "1.2.3.4");
      expect(result.locked).toBe(false);
    });

    it("returns locked: false after fewer than 5 failures", async () => {
      const email = "few-" + Date.now() + "@test.com";
      const ip = "10.0.0.1";

      for (let i = 0; i < 4; i++) {
        await recordAttempt(email, ip, false, "test-agent", "bad password");
      }

      const result = await checkLockout(email, ip);
      expect(result.locked).toBe(false);
    });

    it("locks after 5 failures", async () => {
      const email = "lock-" + Date.now() + "@test.com";
      const ip = "10.0.0.2";

      for (let i = 0; i < 5; i++) {
        await recordAttempt(email, ip, false, "test-agent", "bad password");
      }

      const result = await checkLockout(email, ip);
      expect(result.locked).toBe(true);
      if (result.locked) {
        expect(result.retryAfter).toBeGreaterThan(0);
      }
    });

    it("clears lockout on successful login", async () => {
      const email = "clear-" + Date.now() + "@test.com";
      const ip = "10.0.0.3";

      for (let i = 0; i < 5; i++) {
        await recordAttempt(email, ip, false);
      }

      const locked = await checkLockout(email, ip);
      expect(locked.locked).toBe(true);

      await recordAttempt(email, ip, true);

      const afterSuccess = await checkLockout(email, ip);
      expect(afterSuccess.locked).toBe(false);
    });
  });

  describe("recordAttempt", () => {
    it("records a failed attempt and increments counter", async () => {
      const email = "rec-fail-" + Date.now() + "@test.com";
      const ip = "10.0.0.10";

      await recordAttempt(email, ip, false, "Chrome", "wrong password");
      expect(mockInsert).toHaveBeenCalled();
    });

    it("records a successful attempt and clears state", async () => {
      const email = "rec-success-" + Date.now() + "@test.com";
      const ip = "10.0.0.11";

      await recordAttempt(email, ip, false);
      await recordAttempt(email, ip, true);

      const result = await checkLockout(email, ip);
      expect(result.locked).toBe(false);
    });
  });

  describe("recentFailCount", () => {
    it("queries DB for recent failures", async () => {
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 3 }]),
      };
      mockSelect.mockReturnValue(selectChain);

      const count = await recentFailCount("test@example.com", "1.1.1.1");
      expect(count).toBe(3);
    });

    it("returns 0 when no failures found", async () => {
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      };
      mockSelect.mockReturnValue(selectChain);

      const count = await recentFailCount("clean@example.com", "2.2.2.2");
      expect(count).toBe(0);
    });
  });
});
