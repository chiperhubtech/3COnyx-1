import { Router, Request, Response } from "express";
import { db, onyxWalletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function txRef(): string {
  return `WTX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Wallet System",
    version: "1.0.0",
    description: "Cash App meets automotive — instant earnings, real-time balance, auto-split payouts",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    features: {
      instantPayouts: true,
      autoSplitIntegration: true,
      multiCurrency: true,
      proofOfCompletionGated: true,
      stripeConnectReady: true,
    },
    categories: [
      "Referral_Payout", "Service_Payout", "Logistics_Payout",
      "Location_Payout", "Deal_Payout", "Split_Distribution",
      "Commission", "Remittance_In", "Remittance_Out",
      "Platform_Fee", "Withdrawal", "Deposit", "Bonus", "Adjustment",
    ],
  });
});

router.post("/create", async (req: Request, res: Response) => {
  try {
    const { userId, currency } = req.body;
    if (!userId) { res.status(400).json({ error: "userId required" }); return; }

    const [existing] = await db.select().from(onyxWalletsTable).where(eq(onyxWalletsTable.userId, userId)).limit(1);
    if (existing) { res.json({ message: "Wallet already exists", wallet: existing }); return; }

    const [wallet] = await db.insert(onyxWalletsTable).values({
      userId,
      currency: currency || "USD",
    }).returning();

    res.status(201).json({ message: "ONYX Wallet created — start earning", wallet });
  } catch (error) {
    res.status(500).json({ error: "Wallet creation failed", detail: String(error) });
  }
});

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const [wallet] = await db.select().from(onyxWalletsTable).where(eq(onyxWalletsTable.userId, userId)).limit(1);
    if (!wallet) { res.status(404).json({ error: "No wallet found — create one first" }); return; }

    const recentTx = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, userId))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(20);

    res.json({
      wallet,
      recentTransactions: recentTx,
      summary: {
        available: wallet.balanceUsd,
        pending: wallet.pendingUsd,
        lifetimeEarned: wallet.lifetimeEarnedUsd,
        lifetimeWithdrawn: wallet.lifetimeWithdrawnUsd,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch wallet", detail: String(error) });
  }
});

router.post("/credit", async (req: Request, res: Response) => {
  try {
    const { userId, amount, category, description, sourceRef, counterpartyUserId, proofHash } = req.body;
    if (!userId || !amount || !category) {
      res.status(400).json({ error: "userId, amount, and category required" });
      return;
    }

    let [wallet] = await db.select().from(onyxWalletsTable).where(eq(onyxWalletsTable.userId, userId)).limit(1);
    if (!wallet) {
      [wallet] = await db.insert(onyxWalletsTable).values({ userId }).returning();
    }

    const amountNum = parseFloat(amount);
    const newBalance = parseFloat(wallet.balanceUsd) + amountNum;
    const newLifetime = parseFloat(wallet.lifetimeEarnedUsd) + amountNum;

    await db.update(onyxWalletsTable).set({
      balanceUsd: newBalance.toFixed(4),
      lifetimeEarnedUsd: newLifetime.toFixed(4),
      updatedAt: new Date(),
    }).where(eq(onyxWalletsTable.id, wallet.id));

    const ref = txRef();
    const hash = proofHash || crypto.createHash("sha256").update(JSON.stringify({
      ref, userId, amount, category, ts: Date.now(), architect: "Ronald Antonio Cadet",
    })).digest("hex");

    const [tx] = await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      userId,
      txRef: ref,
      direction: "Credit",
      category,
      amountUsd: amountNum.toFixed(4),
      balanceAfter: newBalance.toFixed(4),
      description: description || `${category} credit`,
      sourceRef: sourceRef || null,
      counterpartyUserId: counterpartyUserId || null,
      proofHash: hash,
    }).returning();

    res.json({
      message: `+$${amountNum.toFixed(2)} credited to your ONYX Wallet`,
      transaction: tx,
      newBalance: newBalance.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: "Credit failed", detail: String(error) });
  }
});

router.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const { userId, amount, payoutMethod } = req.body;
    if (!userId || !amount) { res.status(400).json({ error: "userId and amount required" }); return; }

    const [wallet] = await db.select().from(onyxWalletsTable).where(eq(onyxWalletsTable.userId, userId)).limit(1);
    if (!wallet) { res.status(404).json({ error: "Wallet not found" }); return; }

    const amountNum = parseFloat(amount);
    const currentBalance = parseFloat(wallet.balanceUsd);
    if (amountNum > currentBalance) {
      res.status(400).json({ error: "Insufficient balance", available: currentBalance.toFixed(2), requested: amountNum.toFixed(2) });
      return;
    }

    const newBalance = currentBalance - amountNum;
    const newWithdrawn = parseFloat(wallet.lifetimeWithdrawnUsd) + amountNum;

    await db.update(onyxWalletsTable).set({
      balanceUsd: newBalance.toFixed(4),
      lifetimeWithdrawnUsd: newWithdrawn.toFixed(4),
      lastPayoutAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(onyxWalletsTable.id, wallet.id));

    const ref = txRef();
    const [tx] = await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      userId,
      txRef: ref,
      direction: "Debit",
      category: "Withdrawal",
      amountUsd: amountNum.toFixed(4),
      balanceAfter: newBalance.toFixed(4),
      description: `Withdrawal via ${payoutMethod || "instant"}`,
      proofHash: crypto.createHash("sha256").update(JSON.stringify({
        ref, userId, amount: amountNum, ts: Date.now(), architect: "Ronald Antonio Cadet",
      })).digest("hex"),
    }).returning();

    res.json({
      message: `$${amountNum.toFixed(2)} withdrawal processed`,
      transaction: tx,
      newBalance: newBalance.toFixed(2),
      method: payoutMethod || "instant",
    });
  } catch (error) {
    res.status(500).json({ error: "Withdrawal failed", detail: String(error) });
  }
});

router.get("/history/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const limit = parseInt(req.query.limit as string) || 50;
    const txs = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, userId))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(limit);

    const credits = txs.filter(t => t.direction === "Credit");
    const debits = txs.filter(t => t.direction === "Debit");

    res.json({
      totalTransactions: txs.length,
      totalCredits: credits.reduce((s, t) => s + parseFloat(t.amountUsd), 0).toFixed(2),
      totalDebits: debits.reduce((s, t) => s + parseFloat(t.amountUsd), 0).toFixed(2),
      transactions: txs,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history", detail: String(error) });
  }
});

router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const wallets = await db.select().from(onyxWalletsTable)
      .orderBy(desc(onyxWalletsTable.lifetimeEarnedUsd))
      .limit(50);

    res.json({
      protocol: "ONYX Wallet Leaderboard",
      topEarners: wallets.map((w, i) => ({
        rank: i + 1,
        userId: w.userId,
        lifetimeEarned: w.lifetimeEarnedUsd,
        currentBalance: w.balanceUsd,
        currency: w.currency,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Leaderboard failed", detail: String(error) });
  }
});

export default router;
