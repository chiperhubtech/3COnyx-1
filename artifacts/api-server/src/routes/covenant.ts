/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * Member Covenant API
 * ────────────────────
 * Every 3C ONYX member signs a digital covenant at registration.
 * This is not a checkbox — it is a legally operative instrument
 * that permanently binds the member's digital identity to the
 * platform's sovereign rules.
 *
 * POST /api/covenant        — Sign the covenant (new member)
 * GET  /api/covenant/mine   — Member retrieves their covenant record
 * GET  /api/covenant/all    — Admin: all signed covenants
 */

import { Router, type Request, type Response } from "express";
import { db, memberCovenantsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createHash } from "crypto";

const router = Router();

// ── The canonical covenant text (v1.0) ───────────────────────────────────────
export const COVENANT_TEXT_V1 = `
3C ONYX MEMBER COVENANT — VERSION 1.0
CUXTOMCANDYCLUB LLC — ALL RIGHTS RESERVED

By activating your 3C ONYX membership, you acknowledge and agree:

1. SOVEREIGNTY
   3C ONYX is exclusively owned by Ronald Antonio Cadet (Ron3C)
   through CUXTOMCANDYCLUB LLC. No portion of this platform's
   intellectual property, architecture, or systems may be reproduced,
   reverse-engineered, or repurposed without express written consent.

2. BENEFICIARY RULE
   The platform exists for the benefit of its members within the
   framework designed by Ronald Antonio Cadet. Only Ronald Antonio Cadet,
   his direct family, and entities he wholly controls may directly benefit
   from the platform's financial instruments at the ownership level.

3. PLATFORM INTEGRITY
   You agree not to attempt to circumvent, probe, scan, reverse-engineer,
   copy, or attack any component of this platform. You agree that any
   such attempt grants CUXTOMCANDYCLUB LLC the right to pursue full
   legal remedies including injunctive relief and damages.

4. NON-DESTRUCTION
   This platform was not built to destroy any business. It was built
   to serve its members at the highest level. Your membership does not
   grant you standing to use the platform against its founders or
   fellow members.

5. BINDING NATURE
   This covenant is binding upon acceptance and is recorded with your
   IP address, device fingerprint, and timestamp as forensic evidence.
   It is governed by the laws of the State of Florida, USA.

GENESIS TOKEN: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED
`.trim();

// ── POST /api/covenant — Sign the covenant ────────────────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId    = (req as Request & { user: { id: number } }).user.id;
    const ip        = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
                    ?? req.socket.remoteAddress ?? "unknown";
    const userAgent = req.headers["user-agent"] ?? null;
    const deviceFp  = (req.headers["x-device-fingerprint"] as string | undefined) ?? null;

    // Check if already signed
    const existing = await db
      .select({ id: memberCovenantsTable.id })
      .from(memberCovenantsTable)
      .where(eq(memberCovenantsTable.memberId, userId))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ already: true, message: "Covenant already signed." });
    }

    // Hash for integrity verification
    const covenantHash = createHash("sha256")
      .update(`${COVENANT_TEXT_V1}:${userId}:${Date.now()}`)
      .digest("hex");

    const [record] = await db.insert(memberCovenantsTable).values({
      memberId:         userId,
      covenantVersion:  "1.0",
      ipAddress:        ip,
      userAgent,
      deviceFingerprint:deviceFp,
      acknowledged:     true,
      covenantHash,
      covenantText:     COVENANT_TEXT_V1,
    }).returning();

    return res.status(201).json({
      signed:   true,
      recordId: record.id,
      hash:     covenantHash,
      signedAt: record.signedAt,
      message:  "Covenant signed and recorded permanently.",
    });
  } catch (err) {
    console.error("[covenant] sign error:", err);
    return res.status(500).json({ error: "Failed to record covenant." });
  }
});

// ── GET /api/covenant/mine — Member's own covenant ────────────────────────────
router.get("/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user: { id: number } }).user.id;
    const [record] = await db
      .select()
      .from(memberCovenantsTable)
      .where(eq(memberCovenantsTable.memberId, userId))
      .limit(1);

    if (!record) return res.json({ signed: false });
    return res.json({ signed: true, record });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve covenant." });
  }
});

// ── GET /api/covenant/text — Public: retrieve current covenant text ───────────
router.get("/text", (_req: Request, res: Response) => {
  res.json({ version: "1.0", text: COVENANT_TEXT_V1 });
});

// ── GET /api/covenant/all — Admin: all signed covenants ───────────────────────
router.get("/all", requireAuth, requireRole("Admin"), async (_req: Request, res: Response) => {
  try {
    const records = await db
      .select({
        id:       memberCovenantsTable.id,
        memberId: memberCovenantsTable.memberId,
        version:  memberCovenantsTable.covenantVersion,
        signedAt: memberCovenantsTable.signedAt,
        ipAddress:memberCovenantsTable.ipAddress,
        hash:     memberCovenantsTable.covenantHash,
      })
      .from(memberCovenantsTable)
      .orderBy(desc(memberCovenantsTable.signedAt));

    return res.json({ total: records.length, records });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve covenant records." });
  }
});

export default router;
