/**
 * KYC Routes — Stripe Identity Verification Gate
 *
 * POST /api/kyc/session          — create Stripe Identity session
 * GET  /api/kyc/status           — current user KYC status
 * POST /api/kyc/admin/user/:id   — admin: view KYC status for any user
 *
 * Stripe Identity webhook events are handled in /api/webhooks/stripe.
 * Required: STRIPE_SECRET_KEY + Stripe Identity product enabled in dashboard.
 */
import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, kycVerificationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/admin";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { logger } from "../lib/logger";

const router = Router();

// ─── POST /api/kyc/session ────────────────────────────────────────────────────
router.post("/kyc/session", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number; email: string } }).user.id;
  const userEmail = (req as Request & { user: { id: number; email: string } }).user.email;

  // Return existing active session if not yet verified
  const existing = await db.select().from(kycVerificationsTable)
    .where(eq(kycVerificationsTable.userId, userId))
    .orderBy(kycVerificationsTable.createdAt)
    .limit(1);

  if (existing[0]?.status === "VERIFIED") {
    res.json({ alreadyVerified: true, status: "VERIFIED", verifiedAt: existing[0].verifiedAt });
    return;
  }

  const stripe = await getUncachableStripeClient();

  if (!stripe) {
    // Stripe not configured — return simulated pending status
    logger.warn("KYC: Stripe not configured — returning simulated session");
    const simId = `vs_sim_${Date.now()}`;
    await db.insert(kycVerificationsTable).values({
      userId,
      stripeVerifSessionId: simId,
      status: "PENDING",
    }).onConflictDoNothing();
    res.json({ sessionId: simId, clientSecret: `${simId}_secret`, simulated: true, status: "PENDING" });
    return;
  }

  try {
    // Create Stripe Identity verification session
    const session = await (stripe as import("stripe").default).identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      metadata: { userId: String(userId), email: userEmail },
      return_url: `${process.env.VITE_APP_URL ?? "https://cuxtomcandyclub.ai"}/kyc-complete`,
    });

    await db.insert(kycVerificationsTable).values({
      userId,
      stripeVerifSessionId: session.id,
      status: "PENDING",
    }).onConflictDoNothing();

    res.json({ sessionId: session.id, clientSecret: session.client_secret, status: "PENDING" });
  } catch (err) {
    logger.error({ err }, "KYC: Stripe Identity session creation failed");
    res.status(500).json({ error: "Could not create KYC session. Ensure Stripe Identity is enabled." });
  }
});

// ─── GET /api/kyc/status ──────────────────────────────────────────────────────
router.get("/kyc/status", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;

  const [row] = await db.select().from(kycVerificationsTable)
    .where(eq(kycVerificationsTable.userId, userId))
    .limit(1);

  if (!row) {
    res.json({ status: "NOT_STARTED", verified: false });
    return;
  }

  res.json({
    status:        row.status,
    verified:      row.status === "VERIFIED",
    documentType:  row.documentType,
    issuingCountry:row.issuingCountry,
    verifiedAt:    row.verifiedAt,
    failureReason: row.failureReason,
  });
});

// ─── GET /api/kyc/admin/user/:id — admin: inspect any user KYC ────────────────
router.get("/kyc/admin/user/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const targetId = parseInt(String(req.params["id"] ?? "0"), 10);
  const [row] = await db.select().from(kycVerificationsTable)
    .where(eq(kycVerificationsTable.userId, targetId)).limit(1);
  if (!row) { res.json({ status: "NOT_STARTED" }); return; }
  res.json(row);
});

export default router;
