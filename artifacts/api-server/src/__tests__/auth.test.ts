import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { signToken, verifyToken, extractBearerToken } from "../lib/jwt";

const insertChain = {
  values: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  catch: vi.fn(),
};

const selectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

const deleteChain = {
  where: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@workspace/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      catch: vi.fn(),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
  tokenBlacklistTable: { jti: "jti", userId: "userId", expiresAt: "expiresAt" },
  loginAttemptsTable: {
    email: "email",
    ipAddress: "ipAddress",
    success: "success",
    attemptedAt: "attemptedAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  lt: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  and: vi.fn((...args: unknown[]) => args),
  gte: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  count: vi.fn(() => "count"),
}));

import { revokeToken, isTokenRevoked } from "../lib/tokenBlacklist";
import { checkLockout, recordAttempt } from "../lib/loginGuard";
import { db } from "@workspace/db";

describe("Auth integration: JWT lifecycle + token blacklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      catch: vi.fn(),
    });
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });
  });

  it("full lifecycle: sign → verify → revoke → blacklisted", async () => {
    const token = await signToken({
      sub: "10",
      email: "user@test.com",
      role: "member",
      name: "Test User",
    });

    const payload = await verifyToken(token);
    expect(payload.sub).toBe("10");
    expect(payload.jti).toBeDefined();

    await revokeToken(payload.jti, 10, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const revoked = await isTokenRevoked(payload.jti);
    expect(revoked).toBe(true);
  });

  it("non-revoked tokens pass blacklist check", async () => {
    const jti = "clean-jti-" + Date.now();

    const result = await isTokenRevoked(jti);
    expect(result).toBe(false);
  });

  it("JWT verification rejects tampered tokens", async () => {
    const token = await signToken({
      sub: "1",
      email: "a@b.com",
      role: "member",
      name: "A",
    });

    const tampered = token.slice(0, -3) + "XXX";
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it("each token gets a unique jti for blacklisting", async () => {
    const t1 = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const t2 = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const p1 = await verifyToken(t1);
    const p2 = await verifyToken(t2);
    expect(p1.jti).not.toBe(p2.jti);
  });

  it("includes iat and exp claims for session management", async () => {
    const token = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const payload = await verifyToken(token);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.exp!).toBeGreaterThan(payload.iat!);
  });
});

describe("Auth integration: login lockout flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnThis(),
      catch: vi.fn(),
    });
  });

  it("full lockout lifecycle: fail N times → locked → success → unlocked", async () => {
    const email = "lockout-flow-" + Date.now() + "@test.com";
    const ip = "192.168.1.1";

    const notLocked = await checkLockout(email, ip);
    expect(notLocked.locked).toBe(false);

    for (let i = 0; i < 5; i++) {
      await recordAttempt(email, ip, false, "Chrome/Test", "wrong password");
    }

    const locked = await checkLockout(email, ip);
    expect(locked.locked).toBe(true);
    if (locked.locked) {
      expect(locked.retryAfter).toBeGreaterThan(0);
      expect(locked.retryAfter).toBeLessThanOrEqual(1800);
    }

    await recordAttempt(email, ip, true);

    const afterSuccess = await checkLockout(email, ip);
    expect(afterSuccess.locked).toBe(false);
  });

  it("different IPs have independent lockout states", async () => {
    const email = "multi-ip-" + Date.now() + "@test.com";

    for (let i = 0; i < 5; i++) {
      await recordAttempt(email, "10.0.0.1", false);
    }

    expect((await checkLockout(email, "10.0.0.1")).locked).toBe(true);
    expect((await checkLockout(email, "10.0.0.2")).locked).toBe(false);
  });

  it("partial failures (4 of 5) do not trigger lockout", async () => {
    const email = "partial-" + Date.now() + "@test.com";
    const ip = "10.0.0.3";

    for (let i = 0; i < 4; i++) {
      await recordAttempt(email, ip, false);
    }

    expect((await checkLockout(email, ip)).locked).toBe(false);
  });

  it("successful login clears accumulated failures", async () => {
    const email = "clear-" + Date.now() + "@test.com";
    const ip = "10.0.0.4";

    for (let i = 0; i < 3; i++) {
      await recordAttempt(email, ip, false);
    }
    await recordAttempt(email, ip, true);

    for (let i = 0; i < 4; i++) {
      await recordAttempt(email, ip, false);
    }

    expect((await checkLockout(email, ip)).locked).toBe(false);
  });
});

describe("extractBearerToken", () => {
  it("extracts token from valid Bearer header", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("returns null for undefined header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it("returns null for non-Bearer header", () => {
    expect(extractBearerToken("Basic abc123")).toBeNull();
  });

  it("returns null for empty Bearer value", () => {
    expect(extractBearerToken("Bearer ")).toBeNull();
  });

  it("trims whitespace from token", () => {
    expect(extractBearerToken("Bearer  abc123  ")).toBe("abc123");
  });
});
