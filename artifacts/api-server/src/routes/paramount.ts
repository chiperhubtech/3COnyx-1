import { Router, type Request, type Response } from "express";
import { db, usersTable, clubMembershipsTable, clubsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const log = logger.child({ module: "paramount" });

const SOVEREIGN_USER_ID = 6;
const CREDENTIAL_VERSION = "1.0.0";

function isSovereign(userId: number): boolean {
  return userId === SOVEREIGN_USER_ID;
}

interface ParamountCredential {
  version: string;
  userId: number;
  name: string;
  credentialId: string;
  level: "sovereign" | "member";
  memberships: Array<{ clubId: number; clubName: string; role: string }>;
  vehicleTypes: string[];
  issuedAt: string;
  expiresAt: string;
  proof: string;
}

function generateCredentialProof(data: Omit<ParamountCredential, "proof">): string {
  const payload = JSON.stringify(data);
  return crypto.createHash("sha256").update(payload).digest("hex");
}

router.get("/credential", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    }).from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const memberships = await db.select({
      clubId: clubsTable.id,
      clubName: clubsTable.name,
      role: clubMembershipsTable.role,
      vehicleTypes: clubsTable.vehicleTypes,
    }).from(clubMembershipsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, clubMembershipsTable.clubId))
      .where(and(
        eq(clubMembershipsTable.userId, userId),
        eq(clubMembershipsTable.active, true),
      ));

    const allVehicleTypes = new Set<string>();
    allVehicleTypes.add("car");
    for (const m of memberships) {
      if (Array.isArray(m.vehicleTypes)) {
        for (const vt of m.vehicleTypes as string[]) allVehicleTypes.add(vt);
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const credentialData: Omit<ParamountCredential, "proof"> = {
      version: CREDENTIAL_VERSION,
      userId: user.id,
      name: user.name || "Network Member",
      credentialId: "PAR-" + crypto.randomBytes(6).toString("hex").toUpperCase(),
      level: isSovereign(userId) ? "sovereign" : "member",
      memberships: memberships.map(m => ({
        clubId: m.clubId,
        clubName: m.clubName,
        role: m.role,
      })),
      vehicleTypes: Array.from(allVehicleTypes),
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const proof = generateCredentialProof(credentialData);

    const credential: ParamountCredential = {
      ...credentialData,
      proof,
    };

    log.info({ userId, credentialId: credential.credentialId }, "Paramount credential issued");
    res.json({ credential });
  } catch (err) {
    log.error({ err }, "Failed to issue credential");
    res.status(500).json({ error: "Failed to generate credential" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { credentialId, proof, userId } = req.body;

    if (!credentialId || !proof || !userId) {
      res.status(400).json({ error: "credentialId, proof, and userId required" });
      return;
    }

    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
    }).from(usersTable).where(eq(usersTable.id, parseInt(userId, 10)));

    if (!user) {
      res.json({ valid: false, reason: "Unknown member" });
      return;
    }

    const memberships = await db.select({
      clubId: clubsTable.id,
      clubName: clubsTable.name,
      role: clubMembershipsTable.role,
    }).from(clubMembershipsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, clubMembershipsTable.clubId))
      .where(and(
        eq(clubMembershipsTable.userId, user.id),
        eq(clubMembershipsTable.active, true),
      ));

    res.json({
      valid: true,
      member: {
        id: user.id,
        name: user.name,
        level: isSovereign(user.id) ? "sovereign" : "member",
        clubs: memberships.map(m => m.clubName),
      },
    });
  } catch (err) {
    log.error({ err }, "Credential verification failed");
    res.status(500).json({ error: "Verification failed" });
  }
});

router.get("/sovereign/keys", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only. One door, one key holder." });
      return;
    }

    res.json({
      sovereign: true,
      userId: SOVEREIGN_USER_ID,
      access: "full",
      capabilities: [
        "verify_clubs",
        "approve_events",
        "verify_venues",
        "treasury_all",
        "view_all_clubs",
        "view_all_events",
        "view_all_venues",
        "transfer_sovereignty",
        "override_attribution",
        "global_analytics",
      ],
      message: "Everyone enters the same door. Only you hold the keys.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/sovereign/transfer", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Only the Sovereign can transfer the keys" });
      return;
    }

    log.warn({ userId, targetUserId: req.body?.targetUserId }, "Sovereignty transfer requested — requires manual override");
    res.json({
      success: false,
      message: "Sovereignty transfer requires manual code deployment. This is by design — the keys cannot be passed through the API alone.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
