import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireSovereign } from "../middlewares/requireSovereign";
import { db, settlementLedgerTable, fxRatesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

const router = Router();

const SUPPORTED_CURRENCIES: Record<string, { name: string; symbol: string; rateToUsd: number }> = {
  USD: { name: "US Dollar", symbol: "$", rateToUsd: 1.0 },
  EUR: { name: "Euro", symbol: "€", rateToUsd: 1.08 },
  GBP: { name: "British Pound", symbol: "£", rateToUsd: 1.27 },
  CAD: { name: "Canadian Dollar", symbol: "C$", rateToUsd: 0.74 },
  AUD: { name: "Australian Dollar", symbol: "A$", rateToUsd: 0.65 },
  JPY: { name: "Japanese Yen", symbol: "¥", rateToUsd: 0.0067 },
  CHF: { name: "Swiss Franc", symbol: "CHF", rateToUsd: 1.13 },
  CNY: { name: "Chinese Yuan", symbol: "¥", rateToUsd: 0.14 },
  INR: { name: "Indian Rupee", symbol: "₹", rateToUsd: 0.012 },
  BRL: { name: "Brazilian Real", symbol: "R$", rateToUsd: 0.20 },
  MXN: { name: "Mexican Peso", symbol: "MX$", rateToUsd: 0.058 },
  KRW: { name: "South Korean Won", symbol: "₩", rateToUsd: 0.00075 },
  AED: { name: "UAE Dirham", symbol: "د.إ", rateToUsd: 0.27 },
  SGD: { name: "Singapore Dollar", symbol: "S$", rateToUsd: 0.75 },
  ZAR: { name: "South African Rand", symbol: "R", rateToUsd: 0.055 },
  NGN: { name: "Nigerian Naira", symbol: "₦", rateToUsd: 0.00063 },
  SAR: { name: "Saudi Riyal", symbol: "﷼", rateToUsd: 0.27 },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$", rateToUsd: 0.13 },
  SEK: { name: "Swedish Krona", symbol: "kr", rateToUsd: 0.095 },
  NOK: { name: "Norwegian Krone", symbol: "kr", rateToUsd: 0.093 },
};

const PLATFORM_FEE_PCT = 0.02;

router.post("/settlement/transact", requireAuth, async (req: Request, res: Response) => {
  const { fromUserId, toUserId, amountLocal, currencyLocal, jurisdiction, method } = req.body;
  if (!amountLocal || !currencyLocal) {
    res.status(400).json({ error: "amountLocal and currencyLocal required" }); return;
  }
  const currency = SUPPORTED_CURRENCIES[currencyLocal];
  if (!currency) { res.status(400).json({ error: `Unsupported currency: ${currencyLocal}` }); return; }
  const amountNum = parseFloat(amountLocal);
  const amountUsd = amountNum * currency.rateToUsd;
  const platformFee = amountUsd * PLATFORM_FEE_PCT;
  const netAmount = amountUsd - platformFee;
  const ref = `STL-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;

  const [settlement] = await db.insert(settlementLedgerTable).values({
    transactionRef: ref,
    fromUserId: fromUserId ?? null,
    toUserId: toUserId ?? null,
    amountLocal: amountNum.toFixed(4),
    currencyLocal,
    amountUsd: amountUsd.toFixed(4),
    fxRate: currency.rateToUsd.toFixed(6),
    fxProvider: "onyx-internal",
    platformFeeUsd: platformFee.toFixed(4),
    netAmountUsd: netAmount.toFixed(4),
    status: "Processing",
    settlementMethod: method ?? "stripe",
    region: jurisdiction ? jurisdiction.split("-")[0] : "US",
    jurisdiction: jurisdiction ?? "US-FL",
  }).returning();

  logger.info({ ref, amountUsd: amountUsd.toFixed(2), currency: currencyLocal }, "[settlement] Transaction initiated");

  await db.update(settlementLedgerTable)
    .set({ status: "Settled", settledAt: new Date() })
    .where(eq(settlementLedgerTable.id, settlement.id));

  res.status(201).json({
    settlement: { ...settlement, status: "Settled" },
    conversion: { from: currencyLocal, to: "USD", rate: currency.rateToUsd, amountUsd: amountUsd.toFixed(2) },
    fees: { platformFeePct: PLATFORM_FEE_PCT * 100, platformFeeUsd: platformFee.toFixed(2), netAmountUsd: netAmount.toFixed(2) },
  });
});

router.get("/settlement/ledger", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) ?? "50");
  const ledger = await db.select().from(settlementLedgerTable).orderBy(desc(settlementLedgerTable.createdAt)).limit(limit);
  res.json({ ledger, total: ledger.length });
});

router.get("/settlement/fx-rates", (_req: Request, res: Response) => {
  const rates = Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    currency: code, name: info.name, symbol: info.symbol, rateToUsd: info.rateToUsd,
    updatedAt: new Date().toISOString(),
  }));
  res.json({ baseCurrency: "USD", rates, provider: "onyx-internal", updatedAt: new Date().toISOString() });
});

router.get("/settlement/summary", requireAuth, requireSovereign, async (_req: Request, res: Response) => {
  const result = await db.select({
    totalSettled: sql<string>`COALESCE(SUM(CASE WHEN ${settlementLedgerTable.status} = 'Settled' THEN ${settlementLedgerTable.amountUsd}::numeric ELSE 0 END), 0)`,
    totalFees: sql<string>`COALESCE(SUM(${settlementLedgerTable.platformFeeUsd}::numeric), 0)`,
    txCount: sql<number>`COUNT(*)`,
    currencyCount: sql<number>`COUNT(DISTINCT ${settlementLedgerTable.currencyLocal})`,
  }).from(settlementLedgerTable);

  res.json({
    summary: result[0],
    supportedCurrencies: Object.keys(SUPPORTED_CURRENCIES).length,
    supportedMethods: ["stripe", "wire", "ach", "sepa", "pix", "upi", "alipay", "wechat_pay"],
    architect: "Ronald Antonio Cadet",
  });
});

router.get("/settlement/capabilities", (_req: Request, res: Response) => {
  res.json({
    protocol: "ONYX Global Settlement Protocol v1.0",
    currencies: Object.keys(SUPPORTED_CURRENCIES),
    paymentRails: [
      { rail: "Stripe", regions: ["Global"], settlementTime: "T+1", currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD", "HKD"] },
      { rail: "ACH", regions: ["US"], settlementTime: "T+2", currencies: ["USD"] },
      { rail: "SEPA", regions: ["EU"], settlementTime: "T+1", currencies: ["EUR"] },
      { rail: "PIX", regions: ["BR"], settlementTime: "Instant", currencies: ["BRL"] },
      { rail: "UPI", regions: ["IN"], settlementTime: "Instant", currencies: ["INR"] },
      { rail: "Wire", regions: ["Global"], settlementTime: "T+3", currencies: ["USD", "EUR", "GBP", "CHF"] },
      { rail: "Alipay", regions: ["CN", "APAC"], settlementTime: "T+1", currencies: ["CNY"] },
      { rail: "WeChat Pay", regions: ["CN"], settlementTime: "T+1", currencies: ["CNY"] },
    ],
    fxMarkup: "0.0%",
    platformFee: "2.0%",
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
  });
});

export default router;
