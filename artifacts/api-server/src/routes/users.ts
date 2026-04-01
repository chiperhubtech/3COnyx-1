/**
 * 3C Onyx — User Profile Routes
 *
 * PATCH /api/users/push-token  — Save Expo push token to user record
 * GET   /api/users/profile     — Get current user profile (me)
 * PATCH /api/users/profile     — Update name, phone, avatarUrl, birthday
 * PATCH /api/users/role        — Update onboarding role detail
 */
import { Router, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// ─── PATCH /api/users/push-token ─────────────────────────────────────────────
router.patch("/users/push-token", requireAuth, async (req: Request, res: Response) => {
  const { pushToken } = req.body as { pushToken?: string };
  if (!pushToken) { res.status(400).json({ error: "pushToken is required" }); return; }

  const userId = Number(req.user!.sub);
  await db.update(usersTable)
    .set({
      pushToken,
      pushTokenUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId));

  res.json({ ok: true });
});

// ─── GET /api/users/profile ───────────────────────────────────────────────────
router.get("/users/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = Number(req.user!.sub);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...pub } = user;
  res.json({ user: pub });
});

// ─── PATCH /api/users/profile ─────────────────────────────────────────────────
router.patch("/users/profile", requireAuth, async (req: Request, res: Response) => {
  const { name, phone, avatarUrl, onboardingRole, birthday } = req.body as {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    onboardingRole?: string;
    birthday?: string;
  };
  const userId = Number(req.user!.sub);
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (name?.trim())        patch["name"]          = name.trim();
  if (phone?.trim())       patch["phone"]         = phone.trim();
  if (avatarUrl?.trim())   patch["avatarUrl"]     = avatarUrl.trim();
  if (onboardingRole)      patch["onboardingRole"] = onboardingRole;
  if (birthday)            patch["birthday"]      = birthday;

  await db.update(usersTable).set(patch).where(eq(usersTable.id, userId));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const { passwordHash: _, ...pub } = updated!;
  res.json({ user: pub });
});

export default router;
