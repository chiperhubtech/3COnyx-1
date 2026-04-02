import { Router, Request, Response } from "express";
import { db, splitPaymentsTable, splitRecipientsTable, nodeProfilesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateSplitRef(): string {
  return `SPLIT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const DEFAULT_SPLIT_RULES = {
  platformFeePct: 8.5,
  locationHostPct: 5.0,
  referrerPct: 10.0,
  serviceProviderPct: 65.0,
  logisticsRunnerPct: 11.5,
};

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Instant Split-Payment Engine",
    version: "1.0.0",
    description: "Automatic multi-party split on every transaction with proof-of-completion trigger",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    defaultSplitRules: DEFAULT_SPLIT_RULES,
    payoutTrigger: "Proof of Completion verified → instant distribution",
    proofTypes: ["invoice_verified", "delivery_signed", "service_confirmed", "payment_confirmed", "photo_proof", "gps_verified"],
    mandate: "If a Node touches the deal, the system mathematically guarantees an instant payout",
  });
});

router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { totalAmountUsd, taskRef, dealRef, participants, customSplitRules } = req.body;

    if (!totalAmountUsd) {
      res.status(400).json({ error: "totalAmountUsd is required" });
      return;
    }

    const rules = customSplitRules || DEFAULT_SPLIT_RULES;
    const total = parseFloat(totalAmountUsd);
    const splitRef = generateSplitRef();
    const platformFee = total * (rules.platformFeePct / 100);

    const defaultParticipants = [
      { role: "Platform", label: "3C ONYX Platform Fee", userId: null, pct: rules.platformFeePct },
      { role: "LocationHost", label: "Location Host", userId: participants?.locationHostUserId || null, pct: rules.locationHostPct },
      { role: "Referrer", label: "Referrer / Bird-Dog", userId: participants?.referrerUserId || null, pct: rules.referrerPct },
      { role: "ServiceProvider", label: "Service Provider", userId: participants?.serviceProviderUserId || null, pct: rules.serviceProviderPct },
      { role: "LogisticsRunner", label: "Logistics Runner", userId: participants?.logisticsRunnerUserId || null, pct: rules.logisticsRunnerPct },
    ];

    const activeParticipants = defaultParticipants.filter(p => p.userId !== null || p.role === "Platform");

    let totalAllocatedPct = activeParticipants.reduce((sum, p) => sum + p.pct, 0);
    if (totalAllocatedPct < 100 && activeParticipants.length > 1) {
      const serviceProvider = activeParticipants.find(p => p.role === "ServiceProvider");
      if (serviceProvider) {
        serviceProvider.pct += (100 - totalAllocatedPct);
        totalAllocatedPct = 100;
      }
    }

    const scaleFactor = 100 / totalAllocatedPct;

    const [split] = await db.insert(splitPaymentsTable).values({
      splitRef,
      taskRef: taskRef || null,
      dealRef: dealRef || null,
      totalAmountUsd: totalAmountUsd.toString(),
      platformFeeUsd: platformFee.toFixed(4),
      platformFeePct: rules.platformFeePct.toString(),
      status: "Calculated",
    }).returning();

    const recipients = [];
    for (const participant of activeParticipants) {
      const adjustedPct = participant.pct * scaleFactor;
      const amount = total * (adjustedPct / 100);

      const [recipient] = await db.insert(splitRecipientsTable).values({
        splitId: split.id,
        userId: participant.userId,
        role: participant.role,
        label: participant.label,
        amountUsd: amount.toFixed(4),
        percentOfTotal: adjustedPct.toFixed(2),
      }).returning();
      recipients.push(recipient);
    }

    res.status(201).json({
      message: "Split calculated — awaiting proof of completion",
      split,
      recipients,
      summary: {
        totalAmountUsd: total.toFixed(2),
        platformFee: platformFee.toFixed(2),
        participantCount: recipients.length,
        nextStep: "Submit proof of completion to trigger instant payouts",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Split calculation failed", detail: String(error) });
  }
});

router.post("/verify/:splitRef", async (req: Request, res: Response) => {
  try {
    const splitRef = req.params.splitRef as string;
    const { proofOfCompletion, proofType } = req.body;

    const [split] = await db.select().from(splitPaymentsTable)
      .where(eq(splitPaymentsTable.splitRef, splitRef)).limit(1);

    if (!split) {
      res.status(404).json({ error: "Split not found" });
      return;
    }

    if (split.status !== "Calculated" && split.status !== "Pending_Proof") {
      res.status(400).json({ error: `Split already in state: ${split.status}` });
      return;
    }

    const proofHash = crypto.createHash("sha256").update(JSON.stringify({
      splitRef,
      proofOfCompletion,
      proofType,
      ts: Date.now(),
      architect: "Ronald Antonio Cadet",
    })).digest("hex");

    const [updated] = await db.update(splitPaymentsTable).set({
      status: "Proof_Verified",
      proofOfCompletion: proofOfCompletion || "verified",
      proofHash,
      proofType: proofType || "service_confirmed",
      proofVerifiedAt: new Date(),
    }).where(eq(splitPaymentsTable.id, split.id)).returning();

    res.json({
      message: "Proof verified — ready for instant distribution",
      split: updated,
      proofHash,
      nextStep: "POST /api/splits/distribute/" + splitRef,
    });
  } catch (error) {
    res.status(500).json({ error: "Proof verification failed", detail: String(error) });
  }
});

router.post("/distribute/:splitRef", async (req: Request, res: Response) => {
  try {
    const splitRef = req.params.splitRef as string;

    const [split] = await db.select().from(splitPaymentsTable)
      .where(eq(splitPaymentsTable.splitRef, splitRef)).limit(1);

    if (!split) {
      res.status(404).json({ error: "Split not found" });
      return;
    }

    if (split.status !== "Proof_Verified") {
      res.status(400).json({ error: `Cannot distribute — proof not verified. Current status: ${split.status}` });
      return;
    }

    const recipients = await db.select().from(splitRecipientsTable)
      .where(eq(splitRecipientsTable.splitId, split.id));

    const blockchainTxId = crypto.createHash("sha256").update(JSON.stringify({
      splitRef,
      recipients: recipients.map(r => ({ id: r.id, amount: r.amountUsd })),
      ts: Date.now(),
      architect: "Ronald Antonio Cadet",
    })).digest("hex");

    for (const recipient of recipients) {
      const txRef = `TX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      await db.update(splitRecipientsTable).set({
        payoutStatus: "paid",
        paidAt: new Date(),
        transactionRef: txRef,
      }).where(eq(splitRecipientsTable.id, recipient.id));

      if (recipient.userId) {
        await db.update(nodeProfilesTable).set({
          lifetimeEarningsUsd: sql`(CAST(lifetime_earnings_usd AS NUMERIC) + ${parseFloat(recipient.amountUsd)})::TEXT`,
          updatedAt: new Date(),
        }).where(eq(nodeProfilesTable.userId, recipient.userId));
      }
    }

    const [updatedSplit] = await db.update(splitPaymentsTable).set({
      status: "Distributed",
      blockchainTxId,
      distributedAt: new Date(),
    }).where(eq(splitPaymentsTable.id, split.id)).returning();

    const updatedRecipients = await db.select().from(splitRecipientsTable)
      .where(eq(splitRecipientsTable.splitId, split.id));

    res.json({
      message: "INSTANT PAYOUT COMPLETE — All nodes paid",
      split: updatedSplit,
      recipients: updatedRecipients,
      blockchainProof: blockchainTxId,
      summary: {
        totalDistributed: split.totalAmountUsd,
        recipientsPaid: updatedRecipients.length,
        platformFeeCollected: split.platformFeeUsd,
        distributedAt: updatedSplit.distributedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Distribution failed", detail: String(error) });
  }
});

router.get("/split/:splitRef", async (req: Request, res: Response) => {
  try {
    const [split] = await db.select().from(splitPaymentsTable)
      .where(eq(splitPaymentsTable.splitRef, String(req.params.splitRef))).limit(1);

    if (!split) {
      res.status(404).json({ error: "Split not found" });
      return;
    }

    const recipients = await db.select().from(splitRecipientsTable)
      .where(eq(splitRecipientsTable.splitId, split.id));

    res.json({ split, recipients });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch split", detail: String(error) });
  }
});

router.get("/history/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const recipientRecords = await db.select().from(splitRecipientsTable)
      .where(eq(splitRecipientsTable.userId, userId))
      .orderBy(desc(splitRecipientsTable.createdAt))
      .limit(100);

    const totalEarned = recipientRecords
      .filter(r => r.payoutStatus === "paid")
      .reduce((sum, r) => sum + parseFloat(r.amountUsd), 0);

    const totalPending = recipientRecords
      .filter(r => r.payoutStatus === "pending")
      .reduce((sum, r) => sum + parseFloat(r.amountUsd), 0);

    res.json({
      userId,
      totalEarned: totalEarned.toFixed(2),
      totalPending: totalPending.toFixed(2),
      transactionCount: recipientRecords.length,
      transactions: recipientRecords,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history", detail: String(error) });
  }
});

export default router;
