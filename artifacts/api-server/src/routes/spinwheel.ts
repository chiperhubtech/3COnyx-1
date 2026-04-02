import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const SW_API_KEY = process.env.SPINWHEEL_API_KEY;
const SW_BASE = process.env.SPINWHEEL_BASE_URL || "https://api.spinwheel.io/v1";

function isLive(): boolean {
  return !!SW_API_KEY;
}

router.get("/spinwheel/status", (_req: Request, res: Response) => {
  res.json({
    provider: "Spinwheel Connect",
    live: isLive(),
    mode: isLive() ? "production" : "demo",
    capabilities: ["liability_verification", "auto_loan_lookup", "payoff_quote", "credit_account_summary"],
    description: "Consumer financial and liability account verification — auto loan payoffs, trade-in equity calculations",
  });
});

router.post("/spinwheel/connect", requireAuth, async (req: Request, res: Response) => {
  const { phone, dateOfBirth } = req.body as { phone?: string; dateOfBirth?: string };

  if (!phone) {
    res.status(400).json({ error: "phone is required for Spinwheel Connect" });
    return;
  }

  if (isLive()) {
    try {
      const r = await fetch(`${SW_BASE}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SW_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ phone, dateOfBirth }),
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[spinwheel] connect error:", err);
    }
  }

  res.json({
    sessionId: `sw-${Date.now()}`,
    status: "connected",
    accountsFound: 3,
    accounts: [
      {
        id: "acc-auto-001",
        type: "auto_loan",
        lender: "Capital One Auto",
        accountNumber: "•••••7823",
        originalAmount: 42_500,
        currentBalance: 28_340,
        monthlyPayment: 685,
        interestRate: 4.9,
        remainingPayments: 42,
        payoffAmount: 28_680,
        maturityDate: "2029-08-15",
        vehicle: { year: 2023, make: "BMW", model: "X5 xDrive40i", vin: "•••••••••••14821" },
        status: "current",
      },
      {
        id: "acc-auto-002",
        type: "auto_lease",
        lender: "Porsche Financial Services",
        accountNumber: "•••••3901",
        originalAmount: 78_000,
        currentBalance: 34_200,
        monthlyPayment: 1_150,
        interestRate: 3.2,
        remainingPayments: 18,
        payoffAmount: 52_800,
        maturityDate: "2027-10-01",
        vehicle: { year: 2024, make: "Porsche", model: "Cayenne Turbo", vin: "•••••••••••09283" },
        status: "current",
      },
      {
        id: "acc-cc-001",
        type: "credit_card",
        lender: "Chase Sapphire",
        accountNumber: "•••••4455",
        creditLimit: 25_000,
        currentBalance: 3_820,
        monthlyPayment: 250,
        interestRate: 19.99,
        status: "current",
      },
    ],
    simulated: true,
  });
});

router.get("/spinwheel/payoff/:accountId", requireAuth, async (req: Request, res: Response) => {
  const { accountId } = req.params;

  if (isLive()) {
    try {
      const r = await fetch(`${SW_BASE}/accounts/${accountId}/payoff`, {
        headers: { Authorization: `Bearer ${SW_API_KEY}` },
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[spinwheel] payoff error:", err);
    }
  }

  res.json({
    accountId,
    payoffAmount: 28_680,
    goodThrough: new Date(Date.now() + 10 * 86_400_000).toISOString(),
    perDiemInterest: 3.85,
    lender: "Capital One Auto",
    payoffAddress: "Capital One Auto Finance, PO Box 71083, Charlotte, NC 28272",
    simulated: true,
  });
});

router.post("/spinwheel/trade-equity", requireAuth, (req: Request, res: Response) => {
  const { payoffAmount, marketValue } = req.body as { payoffAmount?: number; marketValue?: number };

  if (!payoffAmount || !marketValue) {
    res.status(400).json({ error: "payoffAmount and marketValue are required" });
    return;
  }

  const equity = marketValue - payoffAmount;
  res.json({
    marketValue,
    payoffAmount,
    equity,
    position: equity >= 0 ? "positive" : "negative",
    recommendation: equity >= 0
      ? `$${equity.toLocaleString()} positive equity — strong trade-in candidate`
      : `$${Math.abs(equity).toLocaleString()} negative equity — consider rolling into new loan or paying down first`,
    simulated: !isLive(),
  });
});

export default router;
