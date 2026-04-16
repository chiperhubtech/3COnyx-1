import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../lib/auditService", () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    _req.user = { id: 1, email: "buyer@test.com", name: "Test Buyer", role: "Member" };
    next();
  },
}));

vi.mock("../lib/stripeClient", () => ({
  getUncachableStripeClient: vi.fn().mockResolvedValue(null),
}));

vi.mock("../lib/wsHub", () => ({
  broadcast: vi.fn(),
}));

vi.mock("@workspace/db", () => {
  const insertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{
      id: 1, orderId: "3C-MOCK0001", status: "escrowed",
      vehicleId: "v-001", vehicleName: "Test Car", vin: "VIN123",
      buyerId: 1, buyerEmail: "buyer@test.com",
      priceCents: 3500000, platformFeeCents: 52500, totalAmountCents: 3552500,
      paymentIntentId: null, blockchainHash: "abc123",
    }]),
  };
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([]),
  };
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  return {
    db: {
      insert: vi.fn().mockReturnValue(insertChain),
      select: vi.fn().mockReturnValue(selectChain),
      update: vi.fn().mockReturnValue(updateChain),
      _insertChain: insertChain,
      _selectChain: selectChain,
      _updateChain: updateChain,
    },
    escrowOrdersTable: {
      orderId: "orderId",
      buyerId: "buyerId",
      createdAt: "createdAt",
      status: "status",
    },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
  desc: vi.fn((_col: unknown) => ({ _col })),
  and: vi.fn((...args: unknown[]) => args),
  lte: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
}));

import { db } from "@workspace/db";

const insertChain = (db as any)._insertChain;
const selectChain = (db as any)._selectChain;

async function callHandler(router: any, method: string, path: string, body?: any) {
  const stack = (router as any).stack || [];

  let matchedHandlers: any[] | null = null;
  const params: Record<string, string> = {};

  for (const layer of stack) {
    if (!layer.route) continue;
    const routePath = layer.route.path;
    if (!layer.route.methods[method.toLowerCase()]) continue;

    if (routePath === path) {
      matchedHandlers = layer.route.stack.map((s: any) => s.handle);
      break;
    }

    const paramNames = [...routePath.matchAll(/:(\w+)/g)].map((m: any) => m[1]);
    if (paramNames.length > 0) {
      const paramPattern = routePath.replace(/:(\w+)/g, "([^/]+)");
      const match = path.match(new RegExp(`^${paramPattern}$`));
      if (match) {
        paramNames.forEach((name: string, i: number) => { params[name] = match[i + 1]; });
        matchedHandlers = layer.route.stack.map((s: any) => s.handle);
        break;
      }
    }
  }

  if (!matchedHandlers) return { statusCode: 404, body: { error: "Route not found" } };

  const req: any = {
    method: method.toUpperCase(),
    path,
    body: body || {},
    params,
    user: { id: 1, email: "buyer@test.com", name: "Test Buyer", role: "Member" },
  };

  let statusCode = 200;
  let responseBody: any = null;

  const res: any = {
    statusCode: 200,
    status(code: number) { statusCode = code; this.statusCode = code; return this; },
    json(data: any) { responseBody = data; return this; },
    setHeader: vi.fn(),
    getHeaders: vi.fn().mockReturnValue({}),
  };

  for (const handler of matchedHandlers) {
    await handler(req, res, () => {});
  }

  return { statusCode, body: responseBody };
}

describe("Checkout flow integration tests", () => {
  let checkoutRouter: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    insertChain.values.mockReturnThis();
    insertChain.returning.mockResolvedValue([{
      id: 1, orderId: "3C-MOCK0001", status: "escrowed",
      vehicleId: "v-001", vehicleName: "Test Car", vin: "VIN123",
      buyerId: 1, buyerEmail: "buyer@test.com",
      priceCents: 3500000, platformFeeCents: 52500, totalAmountCents: 3552500,
      paymentIntentId: null, blockchainHash: "abc123",
    }]);
    selectChain.from.mockReturnThis();
    selectChain.where.mockReturnThis();
    selectChain.limit.mockResolvedValue([]);
    selectChain.orderBy.mockResolvedValue([]);
    (db.insert as any).mockReturnValue(insertChain);
    (db.select as any).mockReturnValue(selectChain);

    const mod = await import("../routes/checkout");
    checkoutRouter = mod.default;
  });

  describe("POST /checkout/vehicle — order creation", () => {
    it("creates an escrow order successfully", async () => {
      const { statusCode, body } = await callHandler(checkoutRouter, "post", "/checkout/vehicle", {
        vehicleId: "v-001",
        vin: "1HGCM82633A004352",
        vehicleName: "2024 Tesla Model 3",
        price: 35000,
        platformFee: 525,
        totalAmount: 35525,
      });

      expect(statusCode).toBe(201);
      expect(body.orderId).toBeDefined();
      expect(body.status).toBe("escrowed");
      expect(body.blockchainHash).toBeDefined();
      expect(body.message).toContain("Escrow opened");
      expect(db.insert).toHaveBeenCalled();
    });

    it("returns 400 for missing required fields", async () => {
      const { statusCode, body } = await callHandler(checkoutRouter, "post", "/checkout/vehicle", {
        vehicleId: "v-001",
      });

      expect(statusCode).toBe(400);
      expect(body.error).toBe("Missing required checkout fields");
    });

    it("returns 400 when vin is missing", async () => {
      const { statusCode } = await callHandler(checkoutRouter, "post", "/checkout/vehicle", {
        vehicleId: "v-001",
        vehicleName: "Car",
        price: 10000,
      });

      expect(statusCode).toBe(400);
    });

    it("returns 400 when price is missing", async () => {
      const { statusCode } = await callHandler(checkoutRouter, "post", "/checkout/vehicle", {
        vehicleId: "v-001",
        vin: "ABC123",
        vehicleName: "Car",
      });

      expect(statusCode).toBe(400);
    });
  });

  describe("POST /checkout/release — delivery code verification", () => {
    it("returns 404 for non-existent order", async () => {
      selectChain.limit.mockResolvedValueOnce([]);

      const { statusCode, body } = await callHandler(checkoutRouter, "post", "/checkout/release", {
        orderId: "3C-NONEXISTENT",
        deliveryCode: "AAAABBBB",
      });

      expect(statusCode).toBe(404);
      expect(body.error).toBe("Order not found");
    });

    it("releases escrow with valid delivery code", async () => {
      const orderId = "3C-TEST1234";
      const vin = "1HGCM82633A004352";
      const expectedCode = crypto
        .createHash("sha256")
        .update(`${orderId}:${vin}`)
        .digest("hex")
        .slice(0, 8)
        .toUpperCase();

      selectChain.limit.mockResolvedValueOnce([{
        id: 1, orderId, vin, buyerId: 1, status: "escrowed",
        vehicleName: "Test Car", priceCents: 3500000,
        sellerConnectedAccountId: null, runnerConnectedAccountId: null,
      }]);

      const { statusCode, body } = await callHandler(checkoutRouter, "post", "/checkout/release", {
        orderId,
        deliveryCode: expectedCode,
      });

      expect(statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.status).toBe("released");
    });

    it("rejects invalid delivery code", async () => {
      selectChain.limit.mockResolvedValueOnce([{
        id: 1, orderId: "3C-BADCODE", vin: "VIN999", buyerId: 1, status: "escrowed",
        vehicleName: "BMW", priceCents: 6000000,
        sellerConnectedAccountId: null, runnerConnectedAccountId: null,
      }]);

      const { statusCode, body } = await callHandler(checkoutRouter, "post", "/checkout/release", {
        orderId: "3C-BADCODE",
        deliveryCode: "WRONGCODE",
      });

      expect(statusCode).toBe(400);
      expect(body.error).toBe("Invalid delivery confirmation code");
    });
  });

  describe("GET /checkout/orders — list user orders", () => {
    it("returns orders array for current user", async () => {
      selectChain.orderBy.mockResolvedValueOnce([
        { id: 1, orderId: "3C-001", status: "escrowed", vehicleName: "Car 1" },
        { id: 2, orderId: "3C-002", status: "released", vehicleName: "Car 2" },
      ]);

      const { statusCode, body } = await callHandler(checkoutRouter, "get", "/checkout/orders");

      expect(statusCode).toBe(200);
      expect(body.orders).toBeDefined();
      expect(Array.isArray(body.orders)).toBe(true);
    });
  });

  describe("GET /checkout/orders/:id — single order detail", () => {
    it("returns specific order details", async () => {
      selectChain.limit.mockResolvedValueOnce([{
        id: 1, orderId: "3C-DETAIL", vehicleName: "Detail Car",
        status: "escrowed", buyerId: 1,
      }]);

      const { statusCode, body } = await callHandler(checkoutRouter, "get", "/checkout/orders/3C-DETAIL");

      expect(statusCode).toBe(200);
      expect(body.order).toBeDefined();
    });

    it("returns 404 for non-existent order ID", async () => {
      selectChain.limit.mockResolvedValueOnce([]);

      const { statusCode, body } = await callHandler(checkoutRouter, "get", "/checkout/orders/FAKE-ID");

      expect(statusCode).toBe(404);
      expect(body.error).toBe("Order not found");
    });
  });
});
