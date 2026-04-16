import { describe, it, expect } from "vitest";
import { signToken, verifyToken, extractBearerToken } from "../lib/jwt";

describe("JWT signToken and verifyToken", () => {
  it("signs and verifies a token", async () => {
    const token = await signToken({
      sub: "42",
      email: "test@example.com",
      role: "member",
      name: "Test User",
    });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const payload = await verifyToken(token);
    expect(payload.sub).toBe("42");
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("member");
    expect(payload.name).toBe("Test User");
    expect(payload.jti).toBeDefined();
    expect(typeof payload.jti).toBe("string");
  });

  it("each token gets a unique jti", async () => {
    const t1 = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const t2 = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });

    const p1 = await verifyToken(t1);
    const p2 = await verifyToken(t2);
    expect(p1.jti).not.toBe(p2.jti);
  });

  it("rejects tampered tokens", async () => {
    const token = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const tampered = token.slice(0, -5) + "XXXXX";
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it("rejects invalid token format", async () => {
    await expect(verifyToken("not-a-real-token")).rejects.toThrow();
  });

  it("includes iat and exp claims", async () => {
    const token = await signToken({ sub: "1", email: "a@b.com", role: "member", name: "A" });
    const payload = await verifyToken(token);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.exp!).toBeGreaterThan(payload.iat!);
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
