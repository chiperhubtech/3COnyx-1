import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../lib/auditService", () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/commissionEngine", () => ({
  processUniversalCommission: vi.fn().mockResolvedValue({
    commissionCreated: false,
    referrerUserId: null,
    referrerName: null,
    commissionAmountUsd: "0.00",
    commissionRate: 0,
    transactionId: null,
    commissionLedgerId: null,
  }),
}));

vi.mock("../lib/stripeClient", () => ({
  getUncachableStripeClient: vi.fn(),
}));

const trxSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};
const trxInsertChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 1 }]),
};
const trxUpdateChain = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
};

const mockTrx = {
  select: vi.fn().mockReturnValue(trxSelectChain),
  insert: vi.fn().mockReturnValue(trxInsertChain),
  update: vi.fn().mockReturnValue(trxUpdateChain),
};

vi.mock("@workspace/db", () => ({
  db: {
    transaction: vi.fn(async (fn: (trx: any) => Promise<void>) => fn(mockTrx)),
  },
  usersTable: { id: "id", stripeCustomerId: "stripeCustomerId", email: "email" },
  transactionsTable: { id: "id" },
  kycVerificationsTable: { stripeVerifSessionId: "stripeVerifSessionId", status: "status" },
  escrowOrdersTable: { orderId: "orderId" },
  foundingMembersTable: { stripeCheckoutSessionId: "stripeCheckoutSessionId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
}));

import { handleEvent } from "../routes/webhooks";
import { writeAudit } from "../lib/auditService";

function makeEvent(type: string, obj: Record<string, unknown>) {
  return { type, data: { object: obj } } as any;
}

describe("Webhook handleEvent — integration tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trxSelectChain.limit.mockResolvedValue([]);
    trxInsertChain.values.mockReturnThis();
    trxInsertChain.returning.mockResolvedValue([{ id: 1 }]);
    trxUpdateChain.set.mockReturnThis();
    trxUpdateChain.where.mockResolvedValue(undefined);
  });

  describe("customer.subscription.created", () => {
    it("inserts SUBSCRIPTION transaction for known customer", async () => {
      trxSelectChain.limit.mockResolvedValueOnce([{ id: 5, stripeCustomerId: "cus_abc" }]);

      await handleEvent(makeEvent("customer.subscription.created", {
        customer: "cus_abc",
        status: "active",
        id: "sub_123",
        items: { data: [{ price: { unit_amount: 9900 } }] },
      }));

      expect(mockTrx.insert).toHaveBeenCalled();
      expect(trxInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SUBSCRIPTION",
          status: "COMPLETED",
          amountCents: 9900,
          fromUserId: 5,
        })
      );
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "PAYOUT", severity: "INFO" })
      );
    });

    it("skips insert when customer not found in DB", async () => {
      trxSelectChain.limit.mockResolvedValueOnce([]);

      await handleEvent(makeEvent("customer.subscription.created", {
        customer: "cus_unknown",
        status: "active",
        id: "sub_456",
        items: { data: [{ price: { unit_amount: 4900 } }] },
      }));

      expect(mockTrx.insert).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.updated", () => {
    it("inserts PENDING transaction for non-active status", async () => {
      trxSelectChain.limit.mockResolvedValueOnce([{ id: 7, stripeCustomerId: "cus_upd" }]);

      await handleEvent(makeEvent("customer.subscription.updated", {
        customer: "cus_upd",
        status: "past_due",
        id: "sub_789",
        items: { data: [{ price: { unit_amount: 2900 } }] },
      }));

      expect(trxInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SUBSCRIPTION",
          status: "PENDING",
        })
      );
    });
  });

  describe("customer.subscription.deleted", () => {
    it("writes audit log for cancellation", async () => {
      await handleEvent(makeEvent("customer.subscription.deleted", {
        customer: "cus_del",
      }));

      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "PAYOUT",
          severity: "WARN",
          action: expect.stringContaining("cancelled"),
        })
      );
    });
  });

  describe("payment_intent.succeeded", () => {
    it("inserts PURCHASE transaction for non-escrow payment", async () => {
      await handleEvent(makeEvent("payment_intent.succeeded", {
        id: "pi_test",
        amount: 2500000,
        metadata: {
          vin: "1HGCM82633A123456",
          description: "2024 BMW X5 Purchase",
        },
      }));

      expect(mockTrx.insert).toHaveBeenCalled();
      expect(trxInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "PURCHASE",
          status: "COMPLETED",
          amountCents: 2500000,
          stripePaymentId: "pi_test",
        })
      );
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "PAYOUT", severity: "INFO" })
      );
    });
  });

  describe("payment_intent.payment_failed", () => {
    it("inserts FAILED transaction with error message", async () => {
      await handleEvent(makeEvent("payment_intent.payment_failed", {
        id: "pi_fail",
        amount: 500000,
        last_payment_error: { message: "Card declined" },
      }));

      expect(mockTrx.insert).toHaveBeenCalled();
      expect(trxInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "PURCHASE",
          status: "FAILED",
          amountCents: 500000,
          description: expect.stringContaining("Card declined"),
        })
      );
    });

    it("handles missing error message gracefully", async () => {
      await handleEvent(makeEvent("payment_intent.payment_failed", {
        id: "pi_fail2",
        amount: 100000,
        last_payment_error: {},
      }));

      expect(trxInsertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining("unknown"),
        })
      );
    });
  });

  describe("identity.verification_session.verified", () => {
    it("updates KYC status to VERIFIED", async () => {
      await handleEvent(makeEvent("identity.verification_session.verified", {
        id: "vs_verified_123",
      }));

      expect(mockTrx.update).toHaveBeenCalled();
      expect(trxUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "VERIFIED" })
      );
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "AUTH",
          action: expect.stringContaining("vs_verified_123"),
        })
      );
    });
  });

  describe("identity.verification_session.requires_input", () => {
    it("updates KYC status to FAILED", async () => {
      await handleEvent(makeEvent("identity.verification_session.requires_input", {
        id: "vs_failed_456",
      }));

      expect(mockTrx.update).toHaveBeenCalled();
      expect(trxUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FAILED" })
      );
    });
  });

  describe("invoice.payment_failed", () => {
    it("writes audit log for failed invoice", async () => {
      await handleEvent(makeEvent("invoice.payment_failed", {
        customer: "cus_inv_fail",
      }));

      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "PAYOUT",
          severity: "WARN",
          action: expect.stringContaining("payment failed"),
        })
      );
    });
  });

  describe("unhandled events", () => {
    it("handles unknown event types without error", async () => {
      await expect(
        handleEvent(makeEvent("unknown.event.type", { id: "test" }))
      ).resolves.not.toThrow();
    });
  });
});

describe("Webhook route structure", () => {
  it("exports a default router and handleEvent function", async () => {
    const mod = await import("../routes/webhooks");
    expect(mod.default).toBeDefined();
    expect(mod.handleEvent).toBeDefined();
    expect(typeof mod.handleEvent).toBe("function");
  });
});
