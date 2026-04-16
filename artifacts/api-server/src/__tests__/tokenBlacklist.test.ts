import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();

vi.mock("@workspace/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  tokenBlacklistTable: { jti: "jti", userId: "userId", expiresAt: "expiresAt" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  lt: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
}));

import { revokeToken, isTokenRevoked, pruneExpiredBlacklistEntries } from "../lib/tokenBlacklist";

describe("tokenBlacklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("revokeToken", () => {
    it("inserts into DB and caches the revocation", async () => {
      const insertChain = {
        values: vi.fn().mockReturnThis(),
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      };
      mockInsert.mockReturnValue(insertChain);

      await revokeToken("jti-123", 1, new Date("2030-01-01"));
      expect(mockInsert).toHaveBeenCalled();
      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ jti: "jti-123", userId: 1 })
      );

      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockSelect.mockReturnValue(selectChain);

      const revoked = await isTokenRevoked("jti-123");
      expect(revoked).toBe(true);
    });
  });

  describe("isTokenRevoked", () => {
    it("returns false for non-revoked token (cache miss + DB miss)", async () => {
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockSelect.mockReturnValue(selectChain);

      const result = await isTokenRevoked("unknown-jti-" + Date.now());
      expect(result).toBe(false);
    });

    it("returns true when found in DB", async () => {
      const jti = "db-found-jti-" + Date.now();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ jti }]),
      };
      mockSelect.mockReturnValue(selectChain);

      const result = await isTokenRevoked(jti);
      expect(result).toBe(true);
    });

    it("uses cache on subsequent calls (no extra DB hit)", async () => {
      const jti = "cached-jti-" + Date.now();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ jti }]),
      };
      mockSelect.mockReturnValue(selectChain);

      await isTokenRevoked(jti);
      const callCount = mockSelect.mock.calls.length;

      await isTokenRevoked(jti);
      expect(mockSelect.mock.calls.length).toBe(callCount);
    });
  });

  describe("pruneExpiredBlacklistEntries", () => {
    it("deletes expired entries from DB", async () => {
      const deleteChain = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDelete.mockReturnValue(deleteChain);

      await pruneExpiredBlacklistEntries();
      expect(mockDelete).toHaveBeenCalled();
      expect(deleteChain.where).toHaveBeenCalled();
    });
  });
});
