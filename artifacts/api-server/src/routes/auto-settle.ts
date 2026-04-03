import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { autoSettle, settleMultiParty, getAutoSettleStatus, type SettleRequest } from "../lib/autoSettle";
import { logger } from "../lib/logger";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  res.json(getAutoSettleStatus());
});

router.post("/settle", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      recipientUserId, amount, transactionType, sourceChannel,
      description, dealId, dealNumber, vin, businessName, businessType,
      sourceRef, participants, metadata,
    } = req.body;

    if (!recipientUserId || !amount || !transactionType) {
      res.status(400).json({
        error: "recipientUserId, amount, and transactionType required",
        supportedTypes: getAutoSettleStatus().supportedTransactionTypes,
        supportedChannels: getAutoSettleStatus().supportedSourceChannels,
      });
      return;
    }

    const result = await autoSettle({
      recipientUserId,
      amount: parseFloat(amount),
      transactionType,
      sourceChannel: sourceChannel || "Direct",
      description: description || `${transactionType} — auto-settle`,
      dealId,
      dealNumber,
      vin,
      businessName,
      businessType,
      sourceRef,
      participants,
      metadata,
    });

    const status = result.success ? 200 : 500;
    res.status(status).json(result);
  } catch (error) {
    logger.error({ error }, "[auto-settle] Route error");
    res.status(500).json({ error: "Settlement failed" });
  }
});

router.post("/settle-batch", requireAuth, async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({ error: "transactions array required" });
      return;
    }

    if (transactions.length > 50) {
      res.status(400).json({ error: "Maximum 50 transactions per batch" });
      return;
    }

    const results = await settleMultiParty(transactions as SettleRequest[]);
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalNet = results.reduce((s, r) => s + (r.success ? r.netAmount : 0), 0);
    const totalFees = results.reduce((s, r) => s + (r.success ? r.platformFee : 0), 0);

    res.json({
      batchId: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      total: transactions.length,
      succeeded,
      failed,
      totalGross: results.reduce((s, r) => s + r.grossAmount, 0).toFixed(2),
      totalPlatformFees: totalFees.toFixed(2),
      totalNetPaid: totalNet.toFixed(2),
      results,
    });
  } catch (error) {
    logger.error({ error }, "[auto-settle] Batch error");
    res.status(500).json({ error: "Batch settlement failed" });
  }
});

export default router;
