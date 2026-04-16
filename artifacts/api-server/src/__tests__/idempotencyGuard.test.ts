import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { idempotencyGuard, getIdempotencyStats } from "../middlewares/idempotencyGuard";

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    originalUrl: "/api/checkout",
    headers: {},
    body: { amount: 100 },
    path: "/api/checkout",
    ...overrides,
  } as any;
}

function createMockRes() {
  const headers: Record<string, string> = {};
  const res: any = {
    statusCode: 200,
    status: vi.fn().mockImplementation(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function (this: any, body: unknown) {
      this._body = body;
      return this;
    }),
    setHeader: vi.fn().mockImplementation((_name: string, _val: string) => {
      headers[_name] = _val;
    }),
    getHeaders: vi.fn().mockReturnValue(headers),
    _headers: headers,
    _body: undefined,
  };
  return res;
}

describe("idempotencyGuard", () => {
  const middleware = idempotencyGuard();

  it("passes through GET requests", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();
    const next = vi.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through POST requests without idempotency key", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("first request with idempotency key passes through and caches", async () => {
    const key = "first-pass-" + Date.now();
    const req = createMockReq({ headers: { "idempotency-key": key } });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    res.statusCode = 201;
    res.json({ orderId: "123" });
  });

  it("replays cached response for duplicate key", async () => {
    const key = "dup-replay-" + Date.now();
    const req1 = createMockReq({ headers: { "idempotency-key": key } });
    const res1 = createMockRes();
    const next1 = vi.fn();

    await middleware(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    res1.statusCode = 201;
    res1.json({ orderId: "abc" });

    const req2 = createMockReq({ headers: { "idempotency-key": key } });
    const res2 = createMockRes();
    const next2 = vi.fn();

    await middleware(req2, res2, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res2.status).toHaveBeenCalledWith(201);
    expect(res2.json).toHaveBeenCalledWith({ orderId: "abc" });
  });

  it("returns 422 when key is reused with different body", async () => {
    const key = "conflict-" + Date.now();
    const req1 = createMockReq({
      headers: { "idempotency-key": key },
      body: { amount: 100 },
    });
    const res1 = createMockRes();
    const next1 = vi.fn();

    await middleware(req1, res1, next1);
    res1.statusCode = 200;
    res1.json({ ok: true });

    const req2 = createMockReq({
      headers: { "idempotency-key": key },
      body: { amount: 999 },
    });
    const res2 = createMockRes();
    const next2 = vi.fn();

    await middleware(req2, res2, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res2.status).toHaveBeenCalledWith(422);
    expect(res2.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "IDEMPOTENCY_KEY_CONFLICT" })
    );
  });

  it("skips GET, HEAD, and OPTIONS methods", async () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const req = createMockReq({ method, headers: { "idempotency-key": "key" } });
      const res = createMockRes();
      const next = vi.fn();
      await middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  describe("concurrent requests with same key", () => {
    it("queues concurrent duplicate requests and replays cached response", async () => {
      const key = "concurrent-" + Date.now();
      const mw = idempotencyGuard();

      const req1 = createMockReq({ headers: { "idempotency-key": key } });
      const res1 = createMockRes();
      const next1 = vi.fn();

      await mw(req1, res1, next1);
      expect(next1).toHaveBeenCalled();

      const req2 = createMockReq({ headers: { "idempotency-key": key } });
      const res2 = createMockRes();
      const next2 = vi.fn();

      const waitPromise = mw(req2, res2, next2);

      res1.statusCode = 200;
      res1.json({ result: "done" });

      await waitPromise;

      expect(next2).not.toHaveBeenCalled();
      expect(res2.status).toHaveBeenCalledWith(200);
      expect(res2.json).toHaveBeenCalledWith({ result: "done" });
    });
  });

  describe("lock timeout behavior", () => {
    it("returns 409 IDEMPOTENCY_LOCK_TIMEOUT when handler error is not cached and lock rejects", async () => {
      const key = "timeout-" + Date.now();
      const mw = idempotencyGuard({ cacheErrors: false });

      const req1 = createMockReq({
        headers: { "idempotency-key": key },
        originalUrl: "/api/timeout-test",
      });
      const res1 = createMockRes();
      const next1 = vi.fn();

      await mw(req1, res1, next1);
      expect(next1).toHaveBeenCalled();

      const req2 = createMockReq({
        headers: { "idempotency-key": key },
        originalUrl: "/api/timeout-test",
      });
      const res2 = createMockRes();
      const next2 = vi.fn();

      const waitPromise = mw(req2, res2, next2);

      res1.statusCode = 500;
      res1.json({ error: "Server error" });

      await waitPromise;

      expect(next2).not.toHaveBeenCalled();
      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "IDEMPOTENCY_LOCK_TIMEOUT" })
      );
    });
  });
});

describe("getIdempotencyStats", () => {
  it("returns stats object with expected fields", () => {
    const stats = getIdempotencyStats();
    expect(stats).toHaveProperty("cachedResponses");
    expect(stats).toHaveProperty("pendingLocks");
    expect(stats).toHaveProperty("maxCacheSize");
    expect(stats).toHaveProperty("ttlMs");
    expect(typeof stats.cachedResponses).toBe("number");
    expect(stats.maxCacheSize).toBe(50000);
    expect(stats.ttlMs).toBe(24 * 60 * 60 * 1000);
  });
});
