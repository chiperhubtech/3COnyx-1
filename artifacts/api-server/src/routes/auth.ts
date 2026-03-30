/**
 * 3C Onyx — Authentication API
 *
 * POST /api/auth/register          — Create account (name, email, password, role)
 * POST /api/auth/login             — Authenticate → JWT (brute-force locked)
 * GET  /api/auth/me                — Current user from token
 * POST /api/auth/logout            — Revoke token server-side (blacklist JTI)
 * POST /api/auth/refresh           — Issue a fresh token while current is valid
 * GET  /api/auth/validate-code     — Validate a referral / Golden Key code
 * POST /api/auth/onboarding-complete — Mark onboarding done in audit log
 */
import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, notificationsTable, type PublicUser } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, verifyToken, extractBearerToken } from "../lib/jwt";
import { requireAuth } from "../middlewares/requireAuth";
import { writeAudit } from "../lib/auditService";
import { revokeToken } from "../lib/tokenBlacklist";
import { checkLockout, recordAttempt } from "../lib/loginGuard";
import { fraudCheckRegistration } from "../middlewares/fraudScoring";

function generateReferralCode(name: string, id: number): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "3CO";
  const suffix = (id * 7919 + 1337).toString(36).toUpperCase().slice(-4).padStart(4, "0");
  return `${prefix}-${suffix}`;
}

const router = Router();
const BCRYPT_ROUNDS = 12;

function sanitize(user: typeof usersTable.$inferSelect): PublicUser {
  const { passwordHash: _, ...pub } = user;
  return pub;
}

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
}

// ─── GET /api/auth/validate-code ─────────────────────────────────────────────
router.get("/auth/validate-code", async (req: Request, res: Response) => {
  const { code } = req.query as { code?: string };
  if (!code?.trim()) {
    res.status(400).json({ valid: false, error: "A Golden Key code is required." });
    return;
  }
  const inviter = await db.select().from(usersTable)
    .where(eq(usersTable.referralCode, code.trim().toUpperCase()))
    .limit(1);
  if (!inviter[0]) {
    res.status(404).json({ valid: false, error: "That code doesn't exist. You need a valid Golden Key from an existing member." });
    return;
  }
  res.json({ valid: true, inviterName: inviter[0].name.split(" ")[0] ?? "a member" });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/auth/register", fraudCheckRegistration, async (req: Request, res: Response) => {
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
  if (!/[A-Z]/.test(password)) {
    res.status(400).json({ error: "Password must contain at least one uppercase letter", code: "VALIDATION" });
    return;
  }
  if (!/[0-9]/.test(password)) {
    res.status(400).json({ error: "Password must contain at least one number", code: "VALIDATION" });
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

  const referralCode = generateReferralCode(name.trim(), user.id);
  await db.update(usersTable)
    .set({ referralCode, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const userWithCode = { ...user, referralCode };

  await db.insert(notificationsTable).values({
    type:  "SYSTEM",
    title: "Welcome to 3C ONYX",
    body:  `You're in. Your referral code is ${referralCode}. Share it — every person you bring earns you ONYX Points and moves you up the dynasty. The platform is free. Forever. Built for you.`,
    read:  false,
  });

  const token = await signToken({
    sub:   String(user.id),
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  await writeAudit({ eventType: "AUTH", action: `New ${role} registered: ${email}`, actorId: user.id, severity: "INFO" });

  res.status(201).json({ token, user: sanitize(userWithCode) });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const ip        = clientIp(req);
  const userAgent = req.headers["user-agent"];

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required", code: "VALIDATION" });
    return;
  }

  // ── Brute-force check ─────────────────────────────────────────────────────
  const lockout = await checkLockout(email, ip);
  if (lockout.locked) {
    res.status(429).json({
      error: `Too many failed attempts. Try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.`,
      code: "ACCOUNT_LOCKED",
      retryAfter: lockout.retryAfter,
    });
    return;
  }

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  // ── Timing-attack defense: ALWAYS run bcrypt regardless of whether the
  // user exists. Without this, a missing user returns in ~0ms while a
  // wrong password takes ~100ms (bcrypt cost 12) — allowing email enumeration.
  const DUMMY_HASH = "$2a$12$invalidhashpadtodummycomparison.xxxxxxxxxxxxxxxxxxxxxxxx";
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.passwordHash) {
    await recordAttempt(email, ip, false, userAgent, "USER_NOT_FOUND");
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }
  if (!user.isActive) {
    await recordAttempt(email, ip, false, userAgent, "ACCOUNT_SUSPENDED");
    res.status(403).json({ error: "Account is suspended. Contact support.", code: "ACCOUNT_SUSPENDED" });
    return;
  }

  if (!valid) {
    await recordAttempt(email, ip, false, userAgent, "WRONG_PASSWORD");
    await writeAudit({ eventType: "AUTH", action: `Failed login: ${email} from ${ip}`, actorId: user.id, severity: "WARN" });
    res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    return;
  }

  // ── Successful login ───────────────────────────────────────────────────────
  await recordAttempt(email, ip, true, userAgent);
  await db.update(usersTable)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const token = await signToken({
    sub:   String(user.id),
    email: user.email,
    role:  user.role,
    name:  user.name,
  });

  await writeAudit({ eventType: "AUTH", action: `Login: ${email} (${user.role}) from ${ip}`, actorId: user.id, severity: "INFO" });

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
    // Blacklist the old token when issuing a refresh
    if (payload.jti) {
      const oldExpiry = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 86400 * 1000);
      void revokeToken(payload.jti, Number(payload.sub), oldExpiry);
    }
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
// Revokes the JWT server-side so it cannot be replayed even if intercepted.
router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  const payload = req.user!;
  if (payload.jti && payload.exp) {
    const expiresAt = new Date(payload.exp * 1000);
    await revokeToken(payload.jti, Number(payload.sub), expiresAt);
    await writeAudit({
      eventType: "AUTH",
      action:    `Logout: user ${payload.sub} — token ${payload.jti} revoked`,
      actorId:   Number(payload.sub),
      severity:  "INFO",
    });
  }
  res.json({ success: true, message: "Token revoked. You have been securely logged out." });
});

// ─── POST /api/auth/onboarding-complete ──────────────────────────────────────
router.post("/auth/onboarding-complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await writeAudit({
      eventType: "AUTH",
      action: "ONBOARDING_COMPLETE",
      actorId: String(user.sub),
      resourceType: "user",
      resourceId: String(user.sub),
      metadata: { completedAt: new Date().toISOString() },
    });
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

export default router;
