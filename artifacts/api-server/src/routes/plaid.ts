import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

function isLive() {
  return !!(PLAID_CLIENT_ID && PLAID_SECRET);
}

const SIM_ACCOUNTS = [
  {
    id: "plaid-demo-001",
    name: "Chase Premier Checking",
    mask: "4821",
    type: "depository",
    subtype: "checking",
    balances: { available: 84_230.5, current: 84_420.5, limit: null, currency: "USD" },
    institution: "Chase",
    verified: true,
  },
  {
    id: "plaid-demo-002",
    name: "Amex Gold Business",
    mask: "7734",
    type: "credit",
    subtype: "credit card",
    balances: { available: 18_000, current: -3_440.75, limit: 25_000, currency: "USD" },
    institution: "American Express",
    verified: true,
  },
  {
    id: "plaid-demo-003",
    name: "Vanguard Brokerage",
    mask: "9102",
    type: "investment",
    subtype: "brokerage",
    balances: { available: null, current: 412_890.0, limit: null, currency: "USD" },
    institution: "Vanguard",
    verified: true,
  },
];

const SIM_TRANSACTIONS = [
  { id: "tx-001", date: "2026-03-18", name: "3C ONYX MEMBER SLICE", amount: -2375.0, category: "Transfer", account_id: "plaid-demo-001", status: "posted" },
  { id: "tx-002", date: "2026-03-15", name: "PORSCHE DEALER DEPOSIT", amount: -15000.0, category: "Shops", account_id: "plaid-demo-001", status: "posted" },
  { id: "tx-003", date: "2026-03-12", name: "REFERRAL REWARD", amount: -500.0, category: "Transfer", account_id: "plaid-demo-001", status: "posted" },
  { id: "tx-004", date: "2026-03-10", name: "STRIPE CONNECT PAYOUT", amount: -4200.0, category: "Transfer", account_id: "plaid-demo-001", status: "posted" },
  { id: "tx-005", date: "2026-03-08", name: "RANGE ROVER SPORT PURCHASE", amount: -189000.0, category: "Automotive", account_id: "plaid-demo-002", status: "posted" },
  { id: "tx-006", date: "2026-03-05", name: "HYPERTRACK DELIVERY FEE", amount: -340.0, category: "Service", account_id: "plaid-demo-001", status: "posted" },
];

// POST /api/plaid/link-token
router.post("/plaid/link-token", async (req: Request, res: Response) => {
  if (isLive()) {
    try {
      const resp = await fetch(`${PLAID_BASE}/link/token/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PLAID-CLIENT-ID": PLAID_CLIENT_ID!,
          "PLAID-SECRET": PLAID_SECRET!,
        },
        body: JSON.stringify({
          user: { client_user_id: req.body.userId || "3c-onyx-member" },
          client_name: "3C Onyx",
          products: ["transactions", "balance"],
          country_codes: ["US"],
          language: "en",
        }),
      });
      const data = await resp.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("Plaid link-token error:", err);
    }
  }
  res.json({
    link_token: `link-sandbox-${crypto.randomUUID()}`,
    expiration: new Date(Date.now() + 3600000).toISOString(),
    simulated: true,
  });
});

// POST /api/plaid/exchange-token
router.post("/plaid/exchange-token", async (req: Request, res: Response) => {
  const { public_token } = req.body;
  if (!public_token) { res.status(400).json({ error: "public_token required" }); return; }

  if (isLive()) {
    try {
      const resp = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PLAID-CLIENT-ID": PLAID_CLIENT_ID!,
          "PLAID-SECRET": PLAID_SECRET!,
        },
        body: JSON.stringify({ public_token }),
      });
      const data = await resp.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("Plaid exchange error:", err);
    }
  }
  res.json({
    access_token: `access-sandbox-${crypto.randomUUID()}`,
    item_id: `item-${crypto.randomUUID()}`,
    simulated: true,
  });
});

// GET /api/plaid/accounts
router.get("/plaid/accounts", async (_req: Request, res: Response) => {
  res.json({ accounts: SIM_ACCOUNTS, total_assets: 497_121.5, simulated: !isLive() });
});

// GET /api/plaid/transactions
router.get("/plaid/transactions", async (_req: Request, res: Response) => {
  res.json({ transactions: SIM_TRANSACTIONS, total_transactions: SIM_TRANSACTIONS.length, simulated: !isLive() });
});

// GET /api/plaid/net-worth
router.get("/plaid/net-worth", async (_req: Request, res: Response) => {
  res.json({
    net_worth: 493_680.75,
    assets: 497_121.5,
    liabilities: 3_440.75,
    monthly_cash_flow: 12_450.0,
    linked_accounts: SIM_ACCOUNTS.length,
    simulated: !isLive(),
  });
});

export default router;
