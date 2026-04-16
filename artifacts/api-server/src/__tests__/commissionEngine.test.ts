import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@workspace/db", () => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn(),
  };
  return {
    db: mockDb,
    commissionLedgerTable: { id: "id" },
    usersTable: { id: "id", name: "name", referralCode: "referralCode" },
    transactionsTable: { id: "id" },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import { db } from "@workspace/db";
import {
  processUniversalCommission,
  isValidCategory,
  getCommissionRate,
  getCommissionRates,
  type TransactionCategory,
} from "../lib/commissionEngine";

const mockDb = db as any;

const ALL_CATEGORIES: TransactionCategory[] = [
  "vehicle_purchase", "parts", "accessories", "service", "oil_change",
  "tire_rotation", "brake_service", "body_work", "diagnostic", "detailing",
  "insurance", "transport", "aftermarket", "membership", "custom",
];

const EXPECTED_RATES: Record<TransactionCategory, number> = {
  vehicle_purchase: 0.03, parts: 0.05, accessories: 0.05, service: 0.08,
  oil_change: 0.10, tire_rotation: 0.10, brake_service: 0.08, body_work: 0.06,
  diagnostic: 0.08, detailing: 0.10, insurance: 0.04, transport: 0.05,
  aftermarket: 0.06, membership: 0.20, custom: 0.05,
};

function setupSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  mockDb.select.mockReturnValue(chain);
  return chain;
}

function setupInsertChain(rows: unknown[] = [{ id: 1 }]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  };
  mockDb.insert.mockReturnValue(chain);
  return chain;
}

describe("isValidCategory", () => {
  it.each(ALL_CATEGORIES)("returns true for valid category: %s", (cat) => {
    expect(isValidCategory(cat)).toBe(true);
  });

  it("returns false for invalid categories", () => {
    expect(isValidCategory("invalid")).toBe(false);
    expect(isValidCategory("")).toBe(false);
    expect(isValidCategory("VEHICLE_PURCHASE")).toBe(false);
  });
});

describe("getCommissionRate", () => {
  it.each(ALL_CATEGORIES)("returns correct rate for %s", (cat) => {
    expect(getCommissionRate(cat)).toBe(EXPECTED_RATES[cat]);
  });
});

describe("getCommissionRates", () => {
  it("returns a copy of all 15 rates", () => {
    const rates = getCommissionRates();
    expect(Object.keys(rates)).toHaveLength(15);
    expect(rates).toEqual(EXPECTED_RATES);
  });

  it("returns a new object (not a reference)", () => {
    const a = getCommissionRates();
    const b = getCommissionRates();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("processUniversalCommission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    buyerUserId: 1,
    transactionAmountCents: 10000,
    category: "vehicle_purchase" as TransactionCategory,
    description: "Test purchase",
  };

  describe("input validation", () => {
    it("rejects invalid buyerUserId (0)", async () => {
      const result = await processUniversalCommission({ ...validInput, buyerUserId: 0 });
      expect(result.commissionCreated).toBe(false);
      expect(result.error).toBe("Invalid buyerUserId");
    });

    it("rejects negative buyerUserId", async () => {
      const result = await processUniversalCommission({ ...validInput, buyerUserId: -1 });
      expect(result.error).toBe("Invalid buyerUserId");
    });

    it("rejects non-integer buyerUserId", async () => {
      const result = await processUniversalCommission({ ...validInput, buyerUserId: 1.5 });
      expect(result.error).toBe("Invalid buyerUserId");
    });

    it("rejects zero transactionAmountCents", async () => {
      const result = await processUniversalCommission({ ...validInput, transactionAmountCents: 0 });
      expect(result.error).toBe("transactionAmountCents must be a positive integer");
    });

    it("rejects negative transactionAmountCents", async () => {
      const result = await processUniversalCommission({ ...validInput, transactionAmountCents: -100 });
      expect(result.error).toBe("transactionAmountCents must be a positive integer");
    });

    it("rejects non-integer transactionAmountCents", async () => {
      const result = await processUniversalCommission({ ...validInput, transactionAmountCents: 99.5 });
      expect(result.error).toBe("transactionAmountCents must be a positive integer");
    });

    it("rejects invalid category", async () => {
      const result = await processUniversalCommission({ ...validInput, category: "invalid" as TransactionCategory });
      expect(result.error).toBe("Invalid category: invalid");
    });

    it("rejects empty description", async () => {
      const result = await processUniversalCommission({ ...validInput, description: "" });
      expect(result.error).toBe("description is required and must be ≤500 chars");
    });

    it("rejects description over 500 chars", async () => {
      const result = await processUniversalCommission({ ...validInput, description: "x".repeat(501) });
      expect(result.error).toBe("description is required and must be ≤500 chars");
    });
  });

  describe("buyer not found", () => {
    it("returns error when buyer does not exist", async () => {
      setupSelectChain([]);
      const result = await processUniversalCommission(validInput);
      expect(result.commissionCreated).toBe(false);
      expect(result.error).toBe("Buyer not found");
    });
  });

  describe("self-referral blocking", () => {
    it("blocks self-referral", async () => {
      setupSelectChain([{ id: 1, name: "Buyer", referralCode: "ABC" }]);
      mockDb.execute.mockResolvedValueOnce({ rows: [{ id: 1, name: "Buyer" }] });

      const result = await processUniversalCommission(validInput);
      expect(result.commissionCreated).toBe(false);
      expect(result.error).toBe("Self-referral not allowed");
    });
  });

  describe("no referrer found", () => {
    it("creates transaction but no commission when no referrer", async () => {
      setupSelectChain([{ id: 1, name: "Buyer", referralCode: "ABC" }]);
      mockDb.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      setupInsertChain([{ id: 42 }]);

      const result = await processUniversalCommission(validInput);
      expect(result.commissionCreated).toBe(false);
      expect(result.transactionId).toBe(42);
      expect(result.error).toBeUndefined();
    });
  });

  describe("commission calculation for all 15 categories", () => {
    it.each(ALL_CATEGORIES)("calculates correct commission for %s", async (category) => {
      setupSelectChain([{ id: 1, name: "Buyer", referralCode: "ABC" }]);
      mockDb.execute
        .mockResolvedValueOnce({ rows: [{ id: 2, name: "Referrer" }] });

      const trxInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 10 }]),
      };
      const commInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 20 }]),
      };
      const refInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };
      const trx = {
        insert: vi.fn()
          .mockReturnValueOnce(trxInsert)
          .mockReturnValueOnce(commInsert)
          .mockReturnValueOnce(refInsert),
        execute: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.transaction.mockImplementation(async (fn: (t: any) => Promise<unknown>) => fn(trx));

      const amountCents = 10000;
      const rate = EXPECTED_RATES[category];
      const expectedCommissionCents = Math.round(amountCents * rate);
      const expectedUsd = (expectedCommissionCents / 100).toFixed(2);

      const result = await processUniversalCommission({
        ...validInput,
        category,
        transactionAmountCents: amountCents,
      });

      expect(result.commissionCreated).toBe(true);
      expect(result.referrerUserId).toBe(2);
      expect(result.referrerName).toBe("Referrer");
      expect(result.commissionAmountUsd).toBe(expectedUsd);
      expect(result.commissionRate).toBe(rate);
      expect(result.transactionId).toBe(10);
      expect(result.commissionLedgerId).toBe(20);
    });
  });

  describe("database transaction rollback", () => {
    it("propagates error when transaction fails", async () => {
      setupSelectChain([{ id: 1, name: "Buyer", referralCode: "ABC" }]);
      mockDb.execute
        .mockResolvedValueOnce({ rows: [{ id: 2, name: "Referrer" }] });
      mockDb.transaction.mockRejectedValue(new Error("DB transaction failed"));

      await expect(processUniversalCommission(validInput)).rejects.toThrow("DB transaction failed");
    });
  });
});
