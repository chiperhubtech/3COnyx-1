import { Router, Request, Response } from "express";
import { db, inviteTreeTable, nodeProfilesTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const INITIAL_INVITES = 5;
const INVITE_EXPIRY_DAYS = 30;

function generateInviteCode(): string {
  return `ONYX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function hashInvite(code: string, inviterOnyxId: string): string {
  return crypto.createHash("sha256").update(`${code}:${inviterOnyxId}:3c-onyx-sovereign`).digest("hex");
}

function generateOnyxId(): string {
  return `NODE-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Invite-Only Node Architecture",
    version: "1.0.0",
    description: "Gated entry distributed node economy with cryptographic lifetime attribution",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    features: {
      invitesPerNode: INITIAL_INVITES,
      universalRoles: ["Referral", "Service", "Logistics", "Hosting", "Hybrid"],
      cryptographicLinking: "SHA-256 chain signatures",
      lifetimeAttribution: true,
      gatedEntry: true,
    },
  });
});

router.post("/node/register", async (req: Request, res: Response) => {
  try {
    const { userId, inviteCode, primaryRole, geoHash, latitude, longitude } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const [existingNode] = await db.select().from(nodeProfilesTable).where(eq(nodeProfilesTable.userId, userId)).limit(1);
    if (existingNode) {
      res.status(409).json({ error: "Node profile already exists", node: existingNode });
      return;
    }

    let parentNodeId: number | null = null;
    let treeDepth = 0;

    if (inviteCode) {
      const [invite] = await db.select().from(inviteTreeTable)
        .where(and(eq(inviteTreeTable.inviteCode, inviteCode), eq(inviteTreeTable.status, "Available")))
        .limit(1);

      if (!invite) {
        const [sentInvite] = await db.select().from(inviteTreeTable)
          .where(and(eq(inviteTreeTable.inviteCode, inviteCode), eq(inviteTreeTable.status, "Sent")))
          .limit(1);
        if (!sentInvite) {
          res.status(400).json({ error: "Invalid or expired invite code" });
          return;
        }
        parentNodeId = sentInvite.inviterUserId;
        treeDepth = sentInvite.depth + 1;

        await db.update(inviteTreeTable).set({
          status: "Claimed",
          claimedByUserId: userId,
          claimedAt: new Date(),
        }).where(eq(inviteTreeTable.id, sentInvite.id));
      } else {
        parentNodeId = invite.inviterUserId;
        treeDepth = invite.depth + 1;

        await db.update(inviteTreeTable).set({
          status: "Claimed",
          claimedByUserId: userId,
          claimedAt: new Date(),
        }).where(eq(inviteTreeTable.id, invite.id));
      }

      if (parentNodeId) {
        await db.update(nodeProfilesTable).set({
          invitesUsed: sql`invites_used + 1`,
          totalNodesRecruited: sql`total_nodes_recruited + 1`,
        }).where(eq(nodeProfilesTable.userId, parentNodeId));
      }
    }

    const onyxId = generateOnyxId();
    const [node] = await db.insert(nodeProfilesTable).values({
      userId,
      onyxId,
      primaryRole: primaryRole || "Referral",
      activeRoles: [primaryRole || "Referral"],
      invitesRemaining: INITIAL_INVITES,
      treeDepth,
      parentNodeId,
      geoHash: geoHash || null,
      latitude: latitude || null,
      longitude: longitude || null,
    }).returning();

    const invites = [];
    for (let i = 0; i < INITIAL_INVITES; i++) {
      const code = generateInviteCode();
      const hash = hashInvite(code, onyxId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const [invite] = await db.insert(inviteTreeTable).values({
        inviterUserId: userId,
        inviteCode: code,
        inviteHash: hash,
        status: "Available",
        depth: treeDepth,
        chainSignature: crypto.createHash("sha256").update(`${onyxId}:${code}:${Date.now()}`).digest("hex"),
        expiresAt,
      }).returning();
      invites.push({ code, expiresAt: invite.expiresAt });
    }

    res.status(201).json({
      message: "Node registered in the ONYX Distributed Economy",
      node,
      invites,
      attribution: parentNodeId ? { parentNodeId, treeDepth, lifetimeLinked: true } : null,
    });
  } catch (error) {
    res.status(500).json({ error: "Node registration failed", detail: String(error) });
  }
});

router.get("/node/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const [node] = await db.select().from(nodeProfilesTable).where(eq(nodeProfilesTable.userId, userId)).limit(1);
    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    const invites = await db.select({
      inviteCode: inviteTreeTable.inviteCode,
      status: inviteTreeTable.status,
      claimedByUserId: inviteTreeTable.claimedByUserId,
      expiresAt: inviteTreeTable.expiresAt,
    }).from(inviteTreeTable).where(eq(inviteTreeTable.inviterUserId, userId));

    const recruits = await db.select().from(nodeProfilesTable)
      .where(eq(nodeProfilesTable.parentNodeId, userId));

    res.json({ node, invites, recruits: recruits.length, recruitDetails: recruits });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch node", detail: String(error) });
  }
});

router.post("/invite/send", async (req: Request, res: Response) => {
  try {
    const { inviteCode, email, phone } = req.body;
    if (!inviteCode) {
      res.status(400).json({ error: "inviteCode is required" });
      return;
    }

    const [invite] = await db.select().from(inviteTreeTable)
      .where(and(eq(inviteTreeTable.inviteCode, inviteCode), eq(inviteTreeTable.status, "Available")))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invite not found or already used" });
      return;
    }

    const [updated] = await db.update(inviteTreeTable).set({
      status: "Sent",
      sentToEmail: email || null,
      sentToPhone: phone || null,
    }).where(eq(inviteTreeTable.id, invite.id)).returning();

    res.json({ message: "Invite sent", invite: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to send invite", detail: String(error) });
  }
});

router.post("/node/availability", async (req: Request, res: Response) => {
  try {
    const { userId, isAvailable, geoHash, latitude, longitude } = req.body;
    const [updated] = await db.update(nodeProfilesTable).set({
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      geoHash: geoHash || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(nodeProfilesTable.userId, userId)).returning();

    res.json({ message: "Availability updated", node: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update availability", detail: String(error) });
  }
});

router.get("/node/nearby/:geoHash", async (req: Request, res: Response) => {
  try {
    const prefix = req.params.geoHash.substring(0, 4);
    const role = req.query.role as string;

    let query = db.select().from(nodeProfilesTable)
      .where(and(
        eq(nodeProfilesTable.isAvailable, true),
        sql`${nodeProfilesTable.geoHash} LIKE ${prefix + '%'}`
      ))
      .limit(20);

    const nodes = await query;
    const filtered = role ? nodes.filter(n => (n.activeRoles as string[])?.includes(role)) : nodes;

    res.json({
      geoPrefix: prefix,
      availableNodes: filtered.length,
      nodes: filtered,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to find nearby nodes", detail: String(error) });
  }
});

router.get("/tree/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    const [rootNode] = await db.select().from(nodeProfilesTable).where(eq(nodeProfilesTable.userId, userId)).limit(1);
    if (!rootNode) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    const directRecruits = await db.select().from(nodeProfilesTable)
      .where(eq(nodeProfilesTable.parentNodeId, userId));

    const secondaryIds = directRecruits.map(r => r.userId);
    let secondaryRecruits: any[] = [];
    for (const id of secondaryIds) {
      const subs = await db.select().from(nodeProfilesTable)
        .where(eq(nodeProfilesTable.parentNodeId, id));
      secondaryRecruits.push(...subs);
    }

    res.json({
      root: rootNode,
      directRecruits: directRecruits.length,
      secondaryRecruits: secondaryRecruits.length,
      totalNetworkSize: 1 + directRecruits.length + secondaryRecruits.length,
      tree: {
        direct: directRecruits,
        secondary: secondaryRecruits,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to build invite tree", detail: String(error) });
  }
});

router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const nodes = await db.select().from(nodeProfilesTable)
      .orderBy(desc(nodeProfilesTable.totalNodesRecruited))
      .limit(50);

    res.json({
      protocol: "ONYX Node Leaderboard",
      topNodes: nodes.map((n, i) => ({
        rank: i + 1,
        onyxId: n.onyxId,
        nodesRecruited: n.totalNodesRecruited,
        tasksCompleted: n.tasksCompleted,
        lifetimeEarnings: n.lifetimeEarningsUsd,
        rating: n.rating,
        role: n.primaryRole,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard", detail: String(error) });
  }
});

export default router;
