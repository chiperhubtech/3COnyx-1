import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireSovereign } from "../middlewares/requireSovereign";
import { fintechGuard } from "../lib/fintechComplianceGuard";

const router = Router();

router.get("/fintech/status", (_req: Request, res: Response) => {
  res.json({
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "Fintech Compliance Guard",
    version: "1.0.0",
    status: "ARMED",
    mandate: "ALL money movement must be 100% compliant, authorized, traceable, and scalable",
    enforcement: {
      payoutMethod: "Stripe Connect ONLY — raw bank transfers STRICTLY PROHIBITED",
      kycRequired: "Stripe Identity verification required before payout release",
      auditTrail: "SHA-256 proof hash on every transaction",
      holdSystem: "Earnings held until account connected — one-tap release",
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/fintech/dashboard", requireAuth, (_req: Request, res: Response) => {
  res.json(fintechGuard.getDashboard());
});

router.post("/fintech/validate-payout", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const { userId, amountUsd, transactionType, dealRef } = req.body;
  if (!userId || !amountUsd || !transactionType) {
    res.status(400).json({ error: "userId, amountUsd, and transactionType required" });
    return;
  }

  const result = await fintechGuard.validatePayoutEligibility(userId, amountUsd, transactionType, dealRef);
  res.json(result);
});

router.post("/fintech/enforce-method", requireAuth, requireSovereign, (req: Request, res: Response) => {
  const { method } = req.body;
  if (!method) {
    res.status(400).json({ error: "method required" });
    return;
  }

  const result = fintechGuard.enforcePayoutMethod(method);
  if (!result.allowed) {
    res.status(403).json({ blocked: true, violation: result.violation });
    return;
  }
  res.json({ allowed: true, method });
});

router.get("/fintech/held-earnings/me", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const held = fintechGuard.getHeldEarningsForUser(userId);
  res.json({
    userId,
    heldCount: held.length,
    totalHeldUsd: held.reduce((s, h) => s + h.amountUsd, 0),
    earnings: held,
    action: held.length > 0 ? "Connect your Stripe account to release earnings" : null,
  });
});

router.get("/fintech/held-earnings/:userId", requireAuth, requireSovereign, (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  const held = fintechGuard.getHeldEarningsForUser(userId);
  res.json({
    userId,
    heldCount: held.length,
    totalHeldUsd: held.reduce((s, h) => s + h.amountUsd, 0),
    earnings: held,
    action: held.length > 0 ? "Connect your Stripe account to release earnings" : null,
  });
});

router.post("/fintech/release-earnings", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const { heldId } = req.body;
  if (!heldId) {
    res.status(400).json({ error: "heldId required" });
    return;
  }

  const result = await fintechGuard.releaseHeldEarnings(heldId);
  res.json(result);
});

export default router;
