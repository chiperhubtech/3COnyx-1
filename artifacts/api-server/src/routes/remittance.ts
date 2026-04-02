import { Router, Request, Response } from "express";
import { db, remittanceTransfersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function transferRef(): string {
  return `REM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const FX_RATES: Record<string, number> = {
  USD: 1.0, EUR: 0.92, GBP: 0.79, CAD: 1.36, MXN: 17.15,
  BRL: 4.97, COP: 3950, PEN: 3.72, ARS: 870, CLP: 935,
  DOP: 56.80, JMD: 155.50, HTG: 132.50, TTD: 6.78,
  NGN: 1550, GHS: 14.50, KES: 153, ZAR: 18.65, XOF: 610,
  PHP: 56.20, INR: 83.10, PKR: 278, BDT: 110, LKR: 312,
  GBP_: 0.79, JPY: 149.50, CNY: 7.24, KRW: 1320,
};

const REMITTANCE_FEE_PCT = 1.5;

const PURPOSES = [
  "Vehicle_Repair", "Vehicle_Purchase", "Parts_Order", "Service_Payment",
  "Insurance_Payment", "Registration_Fee", "Inspection_Fee",
  "Family_Support", "Business_Payment", "Other",
];

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Global Remittance System",
    version: "1.0.0",
    description: "Send money across borders for automotive services — a user in Haiti pays for a repair in Florida, instantly",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    supportedCurrencies: Object.keys(FX_RATES).length,
    feePct: REMITTANCE_FEE_PCT,
    purposes: PURPOSES,
    corridors: [
      "US → Haiti", "US → Jamaica", "US → Dominican Republic", "US → Mexico",
      "US → Brazil", "US → Colombia", "US → Nigeria", "US → Ghana",
      "US → Philippines", "US → India", "UK → Nigeria", "UK → Ghana",
      "Canada → Philippines", "Any → Any",
    ],
    mandate: "Anyone in the world can pay for automotive services through ONYX",
  });
});

router.get("/rates", (req: Request, res: Response) => {
  const from = (req.query.from as string)?.toUpperCase() || "USD";
  const to = (req.query.to as string)?.toUpperCase();

  if (to) {
    const fromRate = FX_RATES[from] || 1;
    const toRate = FX_RATES[to];
    if (!toRate) { res.status(400).json({ error: `Unsupported currency: ${to}` }); return; }
    const rate = toRate / fromRate;
    res.json({ from, to, rate: rate.toFixed(6), feePct: REMITTANCE_FEE_PCT, example: { send: 100, receive: (100 * rate * (1 - REMITTANCE_FEE_PCT / 100)).toFixed(2) } });
  } else {
    res.json({ baseCurrency: from, rates: FX_RATES, feePct: REMITTANCE_FEE_PCT });
  }
});

router.post("/send", async (req: Request, res: Response) => {
  try {
    const { senderUserId, recipientUserId, recipientName, recipientContact, senderCurrency, recipientCurrency, amount, purpose, serviceType, vin } = req.body;

    if (!senderUserId || !amount || !purpose) {
      res.status(400).json({ error: "senderUserId, amount, and purpose required" });
      return;
    }

    const fromCurr = (senderCurrency || "USD").toUpperCase();
    const toCurr = (recipientCurrency || "USD").toUpperCase();
    const sendAmount = parseFloat(amount);
    const fromRate = FX_RATES[fromCurr] || 1;
    const toRate = FX_RATES[toCurr] || 1;
    const fxRate = toRate / fromRate;
    const fee = sendAmount * (REMITTANCE_FEE_PCT / 100);
    const netAmount = sendAmount - fee;
    const receiveAmount = netAmount * fxRate;

    const ref = transferRef();
    const proofHash = crypto.createHash("sha256").update(JSON.stringify({
      ref, senderUserId, amount: sendAmount, from: fromCurr, to: toCurr, ts: Date.now(), architect: "Ronald Antonio Cadet",
    })).digest("hex");

    const [transfer] = await db.insert(remittanceTransfersTable).values({
      transferRef: ref,
      senderUserId,
      recipientUserId: recipientUserId || null,
      recipientName: recipientName || null,
      recipientContact: recipientContact || null,
      senderCurrency: fromCurr,
      recipientCurrency: toCurr,
      sendAmountOriginal: sendAmount.toFixed(4),
      receiveAmountConverted: receiveAmount.toFixed(4),
      fxRate: fxRate.toFixed(6),
      platformFeeUsd: fee.toFixed(4),
      purpose,
      serviceType: serviceType || null,
      vin: vin || null,
      status: "Processing",
      paymentRail: "Stripe",
      proofHash,
    }).returning();

    res.status(201).json({
      message: "Remittance initiated — funds in transit",
      transfer,
      summary: {
        sent: `${sendAmount.toFixed(2)} ${fromCurr}`,
        fee: `${fee.toFixed(2)} ${fromCurr}`,
        received: `${receiveAmount.toFixed(2)} ${toCurr}`,
        fxRate: fxRate.toFixed(4),
        estimatedArrival: "< 2 minutes",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Remittance failed", detail: String(error) });
  }
});

router.post("/complete/:transferRef", async (req: Request, res: Response) => {
  try {
    const [transfer] = await db.select().from(remittanceTransfersTable)
      .where(eq(remittanceTransfersTable.transferRef, req.params.transferRef)).limit(1);
    if (!transfer) { res.status(404).json({ error: "Transfer not found" }); return; }

    const [updated] = await db.update(remittanceTransfersTable).set({
      status: "Completed",
      completedAt: new Date(),
    }).where(eq(remittanceTransfersTable.id, transfer.id)).returning();

    res.json({ message: "Remittance completed — recipient has received funds", transfer: updated });
  } catch (error) {
    res.status(500).json({ error: "Completion failed", detail: String(error) });
  }
});

router.get("/transfer/:transferRef", async (req: Request, res: Response) => {
  try {
    const [transfer] = await db.select().from(remittanceTransfersTable)
      .where(eq(remittanceTransfersTable.transferRef, req.params.transferRef)).limit(1);
    if (!transfer) { res.status(404).json({ error: "Transfer not found" }); return; }
    res.json({ transfer });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transfer", detail: String(error) });
  }
});

router.get("/my-transfers/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const sent = await db.select().from(remittanceTransfersTable)
      .where(eq(remittanceTransfersTable.senderUserId, userId))
      .orderBy(desc(remittanceTransfersTable.createdAt)).limit(50);
    const received = await db.select().from(remittanceTransfersTable)
      .where(eq(remittanceTransfersTable.recipientUserId, userId))
      .orderBy(desc(remittanceTransfersTable.createdAt)).limit(50);

    res.json({
      sent: { count: sent.length, transfers: sent },
      received: { count: received.length, transfers: received },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transfers", detail: String(error) });
  }
});

export default router;
