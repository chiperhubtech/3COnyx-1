import { Router, type Request, type Response } from "express";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import { eventBus } from "../lib/eventBus";
import { logger } from "../lib/logger";

const router = Router();

const processedIntents = new Set<string>();

router.get("/commerce/config", async (_req: Request, res: Response) => {
  try {
    const pk = await getStripePublishableKey();
    if (!pk) {
      res.json({ configured: false });
      return;
    }
    res.json({ configured: true, publishableKey: pk });
  } catch {
    res.json({ configured: false });
  }
});

router.post("/commerce/create-intent", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { amount, description, serviceType } = req.body;

    if (!amount || typeof amount !== "number" || amount < 1) {
      res.status(400).json({ error: "Amount is required (in dollars, minimum $1)" });
      return;
    }

    if (amount > 250000) {
      res.status(400).json({ error: "Amount exceeds maximum ($250,000)" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Payment processing is not configured" });
      return;
    }

    const userId = req.user?.sub || "guest";
    const userEmail = req.user?.email;

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        source: "onyx-commerce",
        serviceType: serviceType || "general",
        userId,
      },
      ...(userEmail ? { receipt_email: userEmail } : {}),
      description: description || `ONYX ${serviceType || "service"} payment`,
    });

    await eventBus.emit("payment.escrow.created", {
      paymentIntentId: intent.id,
      amount,
      buyerEmail: userEmail,
      buyerName: req.user?.name,
      serviceType,
    });

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commerce] Create intent error");
    res.status(500).json({ error: "Failed to create payment" });
  }
});

router.post("/commerce/confirm-payment", requireAuth, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      res.status(400).json({ error: "paymentIntentId is required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Payment processing is not configured" });
      return;
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const intentUserId = intent.metadata?.userId;
    const callerId = req.user?.sub;
    if (intentUserId && callerId && intentUserId !== callerId && req.user?.role !== "Admin") {
      res.status(403).json({ error: "You are not authorized to confirm this payment" });
      return;
    }

    if (intent.status === "succeeded") {
      if (!processedIntents.has(intent.id)) {
        processedIntents.add(intent.id);
        await eventBus.emit("payment.escrow.released", {
          paymentIntentId: intent.id,
          totalUsd: intent.amount / 100,
          sellerId: parseInt(intent.metadata.sellerId || "0", 10) || undefined,
          dealId: intent.metadata.dealId,
        });
      }

      res.json({
        status: "succeeded",
        amount: intent.amount / 100,
      });
    } else {
      res.json({
        status: intent.status,
        amount: intent.amount / 100,
      });
    }
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commerce] Confirm payment error");
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

router.get("/commerce/payment-status/:intentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "Payment processing is not configured" });
      return;
    }

    const intentId = req.params.intentId as string;
    const intent = await stripe.paymentIntents.retrieve(intentId);

    const intentUserId = intent.metadata?.userId;
    const callerId = req.user?.sub;
    if (intentUserId && callerId && intentUserId !== callerId && req.user?.role !== "Admin") {
      res.status(403).json({ error: "You are not authorized to view this payment" });
      return;
    }

    res.json({
      status: intent.status,
      amount: intent.amount / 100,
      created: new Date(intent.created * 1000).toISOString(),
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Commerce] Payment status error");
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

export default router;
