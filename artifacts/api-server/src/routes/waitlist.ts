/**
 * 3C Onyx — Beta Waitlist
 *
 * POST /api/waitlist/join         — Join the waitlist
 * GET  /api/waitlist/stats        — Public stats (total count, breakdown)
 * GET  /api/waitlist/check/:email — Check if email is on list
 * POST /api/waitlist/invite       — Admin: invite a waitlist member (requires Admin role)
 */
import { Router, type Request, type Response } from "express";
import { db, waitlistTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import crypto from "crypto";

const router = Router();

router.post("/waitlist/join", async (req: Request, res: Response) => {
  const { email, name, role = "Member", referredBy, city } = req.body as {
    email?: string; name?: string; role?: string;
    referredBy?: string; city?: string;
  };

  if (!email?.trim()) {
    res.status(400).json({ error: "Email is required", code: "VALIDATION" });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const existing = await db.select().from(waitlistTable).where(eq(waitlistTable.email, emailLower)).limit(1);
  if (existing.length > 0) {
    res.status(200).json({
      success: true,
      alreadyJoined: true,
      position: existing[0].id,
      message: "You are already on the 3C Onyx launch list.",
    });
    return;
  }

  const validRoles = ["Member", "Dealer", "Runner", "Specialist", "Investor"];
  const safeRole = validRoles.includes(role) ? role : "Member";

  const [entry] = await db.insert(waitlistTable).values({
    email:      emailLower,
    name:       name?.trim() ?? null,
    role:       safeRole as "Member" | "Dealer" | "Runner" | "Specialist" | "Investor",
    referredBy: referredBy?.trim() ?? null,
    city:       city?.trim() ?? null,
  }).returning();

  await writeAudit({ eventType: "SYSTEM", severity: "INFO", action: `Waitlist join: ${emailLower} (${safeRole})`, metadata: { entryId: entry.id } });

  res.status(201).json({
    success: true,
    alreadyJoined: false,
    position: entry.id,
    message: "You are on the 3C Onyx launch list. We will notify you before launch.",
  });
});

router.get("/waitlist/stats", async (_req: Request, res: Response) => {
  const all   = await db.select().from(waitlistTable);
  const total = all.length;
  const breakdown: Record<string, number> = {};
  all.forEach((e) => {
    breakdown[e.role] = (breakdown[e.role] ?? 0) + 1;
  });
  const invited = all.filter((e) => e.isInvited).length;

  res.json({
    total,
    invited,
    pending: total - invited,
    breakdown,
    ts: new Date().toISOString(),
  });
});

router.get("/waitlist/check/:email", async (req: Request, res: Response) => {
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const [entry] = await db.select().from(waitlistTable).where(eq(waitlistTable.email, email)).limit(1);
  if (!entry) {
    res.json({ onList: false });
    return;
  }
  res.json({
    onList:    true,
    position:  entry.id,
    isInvited: entry.isInvited,
    role:      entry.role,
    joinedAt:  entry.createdAt,
  });
});

router.post(
  "/waitlist/invite",
  requireAuth,
  requireRole("Admin"),
  async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }

    const [entry] = await db.select().from(waitlistTable).where(eq(waitlistTable.email, email.toLowerCase())).limit(1);
    if (!entry) { res.status(404).json({ error: "Email not on waitlist" }); return; }

    const inviteCode = crypto.randomBytes(8).toString("hex");
    await db.update(waitlistTable)
      .set({ isInvited: true, invitedAt: new Date(), inviteCode })
      .where(eq(waitlistTable.email, entry.email));

    await writeAudit({ eventType: "ADMIN", severity: "INFO", action: `Waitlist invite sent to ${entry.email}`, metadata: { inviteCode } });

    res.json({ success: true, email: entry.email, inviteCode, message: "Invite issued." });
  },
);

export default router;
