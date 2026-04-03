import { Router, type Request, type Response } from "express";
import {
  db, clubsTable, clubMembershipsTable, clubTreasuryTable, usersTable,
} from "@workspace/db";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const log = logger.child({ module: "clubs" });

const SOVEREIGN_USER_ID = 6;
const PLATFORM_COMMISSION_RATE = 0.03;

function isSovereign(userId: number): boolean {
  return userId === SOVEREIGN_USER_ID;
}

function generateClubCode(): string {
  return "CLB-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

router.post("/clubs", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { name, description, vehicleTypes, city, state, country, website, instagram } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Club name required (min 2 chars)" });
      return;
    }

    const slug = slugify(name) + "-" + crypto.randomBytes(2).toString("hex");
    const referralCode = generateClubCode();

    const [club] = await db.insert(clubsTable).values({
      name: name.trim(),
      slug,
      description: description || null,
      presidentId: userId,
      referralCode,
      vehicleTypes: vehicleTypes || ["car"],
      city: city || null,
      state: state || null,
      country: country || "US",
      website: website || null,
      instagram: instagram || null,
      memberCount: 1,
    }).returning();

    await db.insert(clubMembershipsTable).values({
      clubId: club.id,
      userId,
      role: "President",
      joinedVia: "founder",
    });

    log.info({ clubId: club.id, userId }, "Club created");
    res.status(201).json({ club });
  } catch (err) {
    log.error({ err }, "Failed to create club");
    res.status(500).json({ error: "Failed to create club" });
  }
});

router.get("/clubs", async (_req: Request, res: Response) => {
  try {
    const clubs = await db.select({
      id: clubsTable.id,
      name: clubsTable.name,
      slug: clubsTable.slug,
      description: clubsTable.description,
      tier: clubsTable.tier,
      status: clubsTable.status,
      vehicleTypes: clubsTable.vehicleTypes,
      city: clubsTable.city,
      state: clubsTable.state,
      memberCount: clubsTable.memberCount,
      verified: clubsTable.verified,
      logoUrl: clubsTable.logoUrl,
      referralCode: clubsTable.referralCode,
      createdAt: clubsTable.createdAt,
    }).from(clubsTable)
      .where(eq(clubsTable.status, "verified"))
      .orderBy(desc(clubsTable.memberCount))
      .limit(100);

    res.json({ clubs });
  } catch (err) {
    log.error({ err }, "Failed to list clubs");
    res.status(500).json({ error: "Failed to list clubs" });
  }
});

router.get("/clubs/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const clubs = await db.select().from(clubsTable).orderBy(desc(clubsTable.createdAt));
    res.json({ clubs });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/clubs/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.slug, slug));

    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    const members = await db.select({
      id: clubMembershipsTable.id,
      userId: clubMembershipsTable.userId,
      role: clubMembershipsTable.role,
      earningsCents: clubMembershipsTable.earningsCents,
      contributionCents: clubMembershipsTable.contributionCents,
      joinedAt: clubMembershipsTable.joinedAt,
      userName: usersTable.name,
    }).from(clubMembershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, clubMembershipsTable.userId))
      .where(and(eq(clubMembershipsTable.clubId, club.id), eq(clubMembershipsTable.active, true)))
      .orderBy(asc(clubMembershipsTable.joinedAt));

    res.json({ club, members });
  } catch (err) {
    log.error({ err }, "Failed to get club");
    res.status(500).json({ error: "Failed to get club" });
  }
});

router.post("/clubs/:slug/join", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const slug = req.params.slug as string;

    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.slug, slug));
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    const [existing] = await db.select().from(clubMembershipsTable)
      .where(and(eq(clubMembershipsTable.clubId, club.id), eq(clubMembershipsTable.userId, userId)));

    if (existing) {
      if (existing.active) {
        res.status(409).json({ error: "Already a member" });
        return;
      }
      await db.update(clubMembershipsTable)
        .set({ active: true })
        .where(eq(clubMembershipsTable.id, existing.id));
    } else {
      await db.insert(clubMembershipsTable).values({
        clubId: club.id,
        userId,
        role: "Member",
        joinedVia: req.body?.joinedVia || "direct",
      });
    }

    await db.update(clubsTable)
      .set({ memberCount: sql`${clubsTable.memberCount} + 1` })
      .where(eq(clubsTable.id, club.id));

    log.info({ clubId: club.id, userId }, "Member joined club");
    res.json({ success: true, message: "Welcome to the network" });
  } catch (err) {
    log.error({ err }, "Failed to join club");
    res.status(500).json({ error: "Failed to join club" });
  }
});

router.post("/clubs/:slug/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const slug = req.params.slug as string;
    await db.update(clubsTable)
      .set({ status: "verified", verified: true, updatedAt: new Date() })
      .where(eq(clubsTable.slug, slug));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify club" });
  }
});

router.get("/clubs/:slug/treasury", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const slug = req.params.slug as string;

    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.slug, slug));
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    if (!isSovereign(userId)) {
      const [membership] = await db.select().from(clubMembershipsTable)
        .where(and(
          eq(clubMembershipsTable.clubId, club.id),
          eq(clubMembershipsTable.userId, userId),
          eq(clubMembershipsTable.active, true),
        ));

      if (!membership || !["President", "Treasurer", "VicePresident"].includes(membership.role)) {
        res.status(403).json({ error: "Treasury access restricted to club leadership" });
        return;
      }
    }

    const ledger = await db.select().from(clubTreasuryTable)
      .where(eq(clubTreasuryTable.clubId, club.id))
      .orderBy(desc(clubTreasuryTable.createdAt))
      .limit(100);

    res.json({
      balanceCents: club.treasuryBalanceCents,
      lifetimeCents: club.treasuryLifetimeCents,
      communityBonusPct: club.communityBonusPct,
      ledger,
    });
  } catch (err) {
    log.error({ err }, "Failed to get treasury");
    res.status(500).json({ error: "Failed to get treasury" });
  }
});

router.post("/clubs/:slug/treasury/attribute", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const slug = req.params.slug as string;
    const { amountCents, type, description, transactionRef, sourceUserId } = req.body;

    if (!amountCents || amountCents <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const [club] = await db.select().from(clubsTable).where(eq(clubsTable.slug, slug));
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    await db.insert(clubTreasuryTable).values({
      clubId: club.id,
      amountCents,
      type: type || "commission_split",
      description: description || "Bottom-up attribution credit",
      sourceUserId: sourceUserId || null,
      transactionRef: transactionRef || null,
    });

    await db.update(clubsTable).set({
      treasuryBalanceCents: sql`${clubsTable.treasuryBalanceCents} + ${amountCents}`,
      treasuryLifetimeCents: sql`${clubsTable.treasuryLifetimeCents} + ${amountCents}`,
      updatedAt: new Date(),
    }).where(eq(clubsTable.id, club.id));

    log.info({ clubId: club.id, amountCents }, "Treasury credited");
    res.json({ success: true, newBalance: club.treasuryBalanceCents + amountCents });
  } catch (err) {
    log.error({ err }, "Treasury attribution failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/clubs/my/memberships", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const memberships = await db.select({
      membershipId: clubMembershipsTable.id,
      role: clubMembershipsTable.role,
      earningsCents: clubMembershipsTable.earningsCents,
      contributionCents: clubMembershipsTable.contributionCents,
      joinedAt: clubMembershipsTable.joinedAt,
      clubId: clubsTable.id,
      clubName: clubsTable.name,
      clubSlug: clubsTable.slug,
      clubTier: clubsTable.tier,
      clubMemberCount: clubsTable.memberCount,
      clubVehicleTypes: clubsTable.vehicleTypes,
    }).from(clubMembershipsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, clubMembershipsTable.clubId))
      .where(and(eq(clubMembershipsTable.userId, userId), eq(clubMembershipsTable.active, true)))
      .orderBy(desc(clubMembershipsTable.joinedAt));

    res.json({ memberships });
  } catch (err) {
    log.error({ err }, "Failed to get memberships");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
