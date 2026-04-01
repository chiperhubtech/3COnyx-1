/**
 * 3C ONYX — Trust Engine API Routes
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Global Trust & Authority Layer — Zero-Trust Economy
 */
import { Router, type Request, type Response } from "express";
import { db, trustScoresTable, trustEventLogTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import {
  getOrCreateTrustProfile,
  verifyNode,
  assessSpamRisk,
  shouldBypassFiltering,
} from "../lib/trust-engine";

const router = Router();

function requireUserId(req: Request, res: Response): number | null {
  const sub = req.user?.sub;
  if (!sub) { res.status(401).json({ error: "Authentication required" }); return null; }
  return parseInt(sub, 10);
}

function sanitizeError(): string { return "Internal server error"; }

router.get("/trust/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const profile = await getOrCreateTrustProfile(userId, undefined, req.user?.name);
    if (!profile) {
      res.status(500).json({ error: "Failed to load trust profile" });
      return;
    }

    const recentEvents = await db.select().from(trustEventLogTable)
      .where(eq(trustEventLogTable.trustScoreId, profile.id))
      .orderBy(desc(trustEventLogTable.createdAt))
      .limit(20);

    const bypassesFiltering = shouldBypassFiltering(Number(profile.trustScore), profile.tier);

    res.json({
      profile: {
        id: profile.id,
        tier: profile.tier,
        trustScore: Number(profile.trustScore),
        verificationStatus: profile.verificationStatus,
        totalSubmissions: profile.totalSubmissions,
        acceptedSubmissions: profile.acceptedSubmissions,
        rejectedSubmissions: profile.rejectedSubmissions,
        spamFlagged: profile.spamFlagged,
        dealsSourced: profile.dealsSourced,
        dealsClosed: profile.dealsClosed,
        totalCommissionEarnedUsd: Number(profile.totalCommissionEarnedUsd),
        consecutiveGoodSubmissions: profile.consecutiveGoodSubmissions,
        avgResponseQuality: Number(profile.avgResponseQuality || 0),
        bypassesFiltering,
        lastActivityAt: profile.lastActivityAt,
        verifiedAt: profile.verifiedAt,
      },
      recentEvents: recentEvents.map((e) => ({
        eventType: e.eventType,
        scoreDelta: Number(e.scoreDelta),
        newScore: Number(e.newScore),
        reason: e.reason,
        createdAt: e.createdAt,
      })),
      tierThresholds: { Unverified: "0–29", Contributor: "30–59", Verified_Node: "60–79 (requires KYC)", Trusted_Node: "80–94", Keyholder: "95–100 (requires JWT role)" },
      protocol: "3C ONYX — Algorithmic Trust Economy",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.post("/trust/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { fullName, phone, email, governmentIdType, governmentIdLast4, selfieConfirmation } = req.body;

    if (!fullName || !phone || !email) {
      res.status(400).json({ error: "Full name, phone, and email are required for verification" });
      return;
    }

    if (!selfieConfirmation) {
      res.status(400).json({ error: "Selfie confirmation is required" });
      return;
    }

    const profile = await getOrCreateTrustProfile(userId, undefined, fullName);
    if (!profile) {
      res.status(500).json({ error: "Failed to load trust profile" });
      return;
    }

    if (profile.verificationStatus === "Verified") {
      res.status(400).json({ error: "Already verified", tier: profile.tier });
      return;
    }

    const verificationData = {
      fullName: String(fullName).substring(0, 200),
      phone: String(phone).substring(0, 20),
      email: String(email).substring(0, 200),
      governmentIdType: governmentIdType || "None",
      governmentIdLast4: governmentIdLast4 ? String(governmentIdLast4).substring(0, 4) : null,
      selfieConfirmed: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: "3C ONYX KYC-Lite v1.0",
      architect: "Ronald Antonio Cadet",
    };

    const result = await verifyNode(profile.id, verificationData);
    if (!result) {
      res.status(500).json({ error: "Verification failed" });
      return;
    }

    res.json({
      message: "Identity verified — you are now a Verified Node in the 3C ONYX ecosystem.",
      previousTier: profile.tier,
      newTier: result.tier,
      previousScore: result.previousScore,
      newScore: result.newScore,
      birdDogEligible: result.newScore >= 60,
      protocol: "3C ONYX — KYC-Lite Verification",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/trust/leaderboard", optionalAuth, async (_req: Request, res: Response) => {
  try {
    const topNodes = await db.select({
      id: trustScoresTable.id,
      displayName: trustScoresTable.displayName,
      tier: trustScoresTable.tier,
      trustScore: trustScoresTable.trustScore,
      totalSubmissions: trustScoresTable.totalSubmissions,
      acceptedSubmissions: trustScoresTable.acceptedSubmissions,
      dealsClosed: trustScoresTable.dealsClosed,
      totalCommissionEarnedUsd: trustScoresTable.totalCommissionEarnedUsd,
      verificationStatus: trustScoresTable.verificationStatus,
    }).from(trustScoresTable)
      .where(gte(trustScoresTable.trustScore, "30"))
      .orderBy(desc(trustScoresTable.trustScore))
      .limit(50);

    const totalNodes = await db.select({ count: sql`count(*)` }).from(trustScoresTable);
    const verifiedCount = await db.select({ count: sql`count(*)` }).from(trustScoresTable)
      .where(eq(trustScoresTable.verificationStatus, "Verified"));

    res.json({
      leaderboard: topNodes.map((n, i) => ({
        rank: i + 1,
        displayName: n.displayName,
        tier: n.tier,
        trustScore: Number(n.trustScore),
        totalSubmissions: n.totalSubmissions,
        acceptanceRate: n.totalSubmissions > 0 ? Math.round((n.acceptedSubmissions / n.totalSubmissions) * 100) : 0,
        dealsClosed: n.dealsClosed,
        verified: n.verificationStatus === "Verified",
      })),
      networkStats: {
        totalNodes: Number(totalNodes[0]?.count || 0),
        verifiedNodes: Number(verifiedCount[0]?.count || 0),
      },
      protocol: "3C ONYX — Global Trust Leaderboard",
      architect: "Ronald Antonio Cadet",
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

router.get("/trust/score-check", optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user ? parseInt(req.user.sub, 10) : null;
    if (!userId) {
      res.json({ trustScore: 50, tier: "Unverified", bypassesFiltering: false, message: "Unauthenticated users start at base trust level" });
      return;
    }

    const profile = await getOrCreateTrustProfile(userId);
    if (!profile) {
      res.json({ trustScore: 50, tier: "Unverified", bypassesFiltering: false });
      return;
    }

    res.json({
      trustScore: Number(profile.trustScore),
      tier: profile.tier,
      bypassesFiltering: shouldBypassFiltering(Number(profile.trustScore), profile.tier),
      verificationStatus: profile.verificationStatus,
      consecutiveGoodSubmissions: profile.consecutiveGoodSubmissions,
    });
  } catch {
    res.status(500).json({ error: sanitizeError() });
  }
});

export default router;
