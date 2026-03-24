// @ts-nocheck
/**
 * 3C Onyx — Authentication API
 *
 * POST /api/auth/register  — Create account (name, email, password, role)
 * POST /api/auth/login     — Authenticate → JWT
 * GET  /api/auth/me        — Current user from token
 * POST /api/auth/logout    — Invalidate (client-side; token is stateless)
 * POST /api/auth/refresh   — Issue a fresh token while current is valid
 */
import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, type PublicUser } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, extractBearerToken } from "../lib/jwt";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";

const router = Router();
const BCRYPT_ROUNDS = 12;

function sanitize(user: typeof usersTable.$inferSelect): PublicUser {
  const { passwordHash: _, ...pub } = user;
  return pub;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
  const { name, email, password, role = "Member", phone } = req.body as {
    name?: string; email?: string; password?: string;
    role?: string; phone?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "name, email, and password are required", code: "VALIDATION" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters", code: "VALIDATION" });
    return;
  }
  const validRoles = ["Member", "Dealer", "Runner", "Specialist"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}`, code: "VALIDATION" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists", code: "DUPLICATE_EMAIL" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [user] = await db.insert(usersTable).values({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: role as "Member" | "Dealer" | "Runner" | "Specialist",
    phone: phone?.trim() ?? null,
    isActive: true,
    isVerified: false,
  }).returning();

  const token = await signToken({
    sub:   String(user.id),
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  await writeAudit("AUTH", "INFO", `New ${role} registered: ${email}`, { userId: user.id });

  res.status(201).json({ token, user: sanitize(user) });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required", code: "VALIDATION" });
    return;
  }

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ error: "Account is suspended. Contact support.", code: "ACCOUNT_SUSPENDED" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }

  await db.update(usersTable)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const token = await signToken({
    sub:   String(user.id),
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  await writeAudit("AUTH", "INFO", `Login: ${email} (${user.role})`, { userId: user.id });

  res.json({ token, user: sanitize(user) });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, Number(req.user!.sub)))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    return;
  }
  res.json({ user: sanitize(user) });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post("/auth/refresh", async (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Token required", code: "UNAUTHENTICATED" });
    return;
  }
  try {
    const payload = await verifyToken(token);
    const newToken = await signToken({
      sub:   payload.sub,
      email: payload.email,
      role:  payload.role,
      name:  payload.name,
    });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/auth/logout", requireAuth, (_req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out. Discard your token client-side." });
});

// ─── POST /api/auth/onboarding-complete ──────────────────────────────────────
router.post("/auth/onboarding-complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: number };
    // Mark onboarding complete on user record if the column exists
    // For now, log and ack — the localStorage flag is the primary gate
    await writeAudit({
      userId: String(user.id),
      action: "ONBOARDING_COMPLETE",
      resource: "user",
      resourceId: String(user.id),
      meta: { completedAt: new Date().toISOString() },
    });
    res.json({ success: true });
  } catch {
    // Non-blocking — client still marks complete
    res.json({ success: true });
  }
});

export default router;
