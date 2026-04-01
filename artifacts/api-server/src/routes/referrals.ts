import { Router, type Request, type Response } from "express";
import { db, usersTable, referralLedgerTable, commissionLedgerTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/requireAuth";
import { eventBus } from "../lib/eventBus";
import { getUserReferralStats } from "../lib/growth-engine";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

const LINK_SECRET = process.env.JWT_SECRET || "onyx-sovereign-link-key";

function generateReferralCode(): string {
  return "ONYX-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function signRefCode(code: string): string {
  return crypto.createHmac("sha256", LINK_SECRET).update(code).digest("hex").slice(0, 12);
}

function verifyRefSignature(code: string, sig: string): boolean {
  return signRefCode(code) === sig;
}

router.get("/referrals/my-stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user?.sub || "0", 10);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const stats = await getUserReferralStats(userId);
    if (!stats) { res.status(404).json({ error: "User not found" }); return; }

    res.json(stats);
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Referrals] Stats error");
    res.status(500).json({ error: "Failed to fetch referral stats" });
  }
});

router.post("/referrals/generate-link", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user?.sub || "0", 10);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    let code = user.referralCode;
    if (!code) {
      code = generateReferralCode();
      await db.update(usersTable)
        .set({ referralCode: code })
        .where(eq(usersTable.id, userId));
    }

    const sig = signRefCode(code);
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://3conyx.com";

    const assistLink = `${baseUrl}/assist/${code}?s=${sig}`;
    const firstName = (user.name || "").split(" ")[0] || "A friend";

    res.json({
      referralCode: code,
      referralLink: assistLink,
      referrerName: firstName,
      shareText: `${firstName} sent you ONYX. This handles everything automotive.`,
      shareUrl: assistLink,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Referrals] Generate link error");
    res.status(500).json({ error: "Failed to generate referral link" });
  }
});

router.get("/referrals/resolve/:code", async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code || "");
    const sig = String(req.query.s || "");

    if (!code) { res.status(400).json({ error: "Code required" }); return; }

    if (!sig || !verifyRefSignature(code, sig)) {
      logger.warn({ code, hasSig: !!sig }, "[Referrals] Invalid or missing deep-link signature — possible spoofing attempt");
      res.status(403).json({ error: "Invalid link signature" });
      return;
    }

    const [referrer] = await db.select({
      name: usersTable.name,
    }).from(usersTable).where(sql`${usersTable.referralCode} = ${code}`);

    if (!referrer) { res.json({ valid: false }); return; }

    const firstName = (referrer.name || "").split(" ")[0] || "Someone";

    res.json({
      valid: true,
      referrerFirstName: firstName,
      architect: "Ronald Antonio Cadet",
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Referrals] Resolve error");
    res.status(500).json({ error: "Failed to resolve referral code" });
  }
});

router.post("/referrals/track", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { referralCode, referredName, referredPhone, referredEmail } = req.body;

    if (!referralCode) {
      res.status(400).json({ error: "Referral code is required" });
      return;
    }

    const [referrer] = await db.select().from(usersTable)
      .where(eq(usersTable.referralCode, referralCode));

    if (!referrer) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }

    const refId = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    await db.insert(referralLedgerTable).values({
      referralId: refId,
      vin: "PENDING",
      referringNodeId: referrer.id,
      referringNodeName: referrer.name || "ONYX Member",
      referringNodeType: "Member",
      buyerName: referredName || "Guest Referral",
      status: "Pending",
      commissionPctBps: 300,
      metadata: {
        referredPhone: referredPhone || null,
        referredEmail: referredEmail || null,
        source: "viral_loop",
        capturedAt: new Date().toISOString(),
        architect: "Ronald Antonio Cadet",
        system: "3C ONYX Altruistic Viral Loop",
      },
    });

    await eventBus.emit("referral.created", {
      referralId: refId,
      referrerId: referrer.id,
      referrerName: referrer.name,
      referrerEmail: referrer.email,
      referredName: referredName || "Guest",
    });

    res.json({
      tracked: true,
      referralId: refId,
      message: "Referral captured. Rewards will be calculated when the referral converts.",
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Referrals] Track error");
    res.status(500).json({ error: "Failed to track referral" });
  }
});

router.get("/referrals/ledger", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user?.sub || "0", 10);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const entries = await db.select().from(referralLedgerTable)
      .where(eq(referralLedgerTable.referringNodeId, userId))
      .orderBy(desc(referralLedgerTable.createdAt))
      .limit(50);

    const commissions = await db.select().from(commissionLedgerTable)
      .where(and(
        eq(commissionLedgerTable.recipientId, userId),
        eq(commissionLedgerTable.entryType, "Referral"),
      ))
      .orderBy(desc(commissionLedgerTable.createdAt))
      .limit(50);

    res.json({ referrals: entries, commissions });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[Referrals] Ledger error");
    res.status(500).json({ error: "Failed to fetch referral ledger" });
  }
});

export default router;
