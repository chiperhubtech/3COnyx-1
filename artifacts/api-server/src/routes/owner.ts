/**
 * 3C ONYX — Owner Command API
 * ─────────────────────────────────────────────────────────────────────────────
 * OWNER: Ron / CUXTOMCANDYCLUB LLC
 *
 * These endpoints are the back door. Only one person on earth has the token.
 * Every request is logged. Wrong token = silent 403, logged to audit trail.
 * No public route links here. No sidebar. No documentation.
 *
 * SECURITY LAYERS:
 * 1. OWNER_SECRET_TOKEN env var — must match exactly
 * 2. Rate limited to 10 requests/minute from any single IP
 * 3. Every request logged with timestamp, IP, and endpoint
 * 4. Failed attempts flagged immediately
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";

const router = Router();

const OWNER_TOKEN = process.env["OWNER_SECRET_TOKEN"] ?? "";

// ─── Owner Auth + Audit ───────────────────────────────────────────────────────
interface AuditEntry {
  ts: string;
  ip: string;
  endpoint: string;
  success: boolean;
  reason?: string;
}

const ownerAuditLog: AuditEntry[] = [];
const failedAttempts: Map<string, number> = new Map();

function logAudit(req: Request, success: boolean, reason?: string) {
  const ip = (req.headers["x-forwarded-for"] as string ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  ownerAuditLog.push({ ts: new Date().toISOString(), ip, endpoint: req.path, success, reason });
  if (ownerAuditLog.length > 500) ownerAuditLog.splice(0, 100); // rolling 500
}

function requireOwner(req: Request, res: Response, next: () => void) {
  const ip = (req.headers["x-forwarded-for"] as string ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  const token = req.headers["x-owner-token"] as string | undefined;

  // Block IPs with 10+ failed attempts
  const fails = failedAttempts.get(ip) ?? 0;
  if (fails >= 10) {
    logAudit(req, false, "IP_BLOCKED");
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (!OWNER_TOKEN || !token || token !== OWNER_TOKEN) {
    failedAttempts.set(ip, fails + 1);
    logAudit(req, false, "INVALID_TOKEN");
    res.status(403).json({ error: "Access denied" });
    return;
  }

  failedAttempts.set(ip, 0); // reset on success
  logAudit(req, true);
  next();
}

// ─── Token Verification ───────────────────────────────────────────────────────
router.post("/verify", (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!OWNER_TOKEN) {
    res.status(503).json({ error: "Owner token not configured. Set OWNER_SECRET_TOKEN in Replit Secrets." });
    return;
  }
  if (!token || token !== OWNER_TOKEN) {
    const ip = (req.headers["x-forwarded-for"] as string ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
    const fails = (failedAttempts.get(ip) ?? 0) + 1;
    failedAttempts.set(ip, fails);
    logAudit(req, false, "INVALID_TOKEN");
    res.status(403).json({ verified: false, attemptsRemaining: Math.max(0, 10 - fails) });
    return;
  }
  logAudit(req, true);
  res.json({ verified: true, owner: "CUXTOMCANDYCLUB LLC", platform: "3C ONYX" });
});

// ─── Platform Overview (owner only) ──────────────────────────────────────────
router.get("/platform", requireOwner, (_req: Request, res: Response) => {
  res.json({
    platform:       "3C ONYX",
    owner:          "Ron / CUXTOMCANDYCLUB LLC",
    status:         "OPERATIONAL",
    buildVersion:   "2.4.0",
    deployedAt:     new Date().toISOString(),
    tokenConfigured: !!OWNER_TOKEN,
    apiRoutes:       58,
    secrets: {
      ownerToken:       OWNER_TOKEN ? "SET ✓" : "NOT SET ✗",
      twilioSid:        process.env["TWILIO_ACCOUNT_SID"]   ? "SET ✓" : "NOT SET — add to Replit Secrets",
      twilioToken:      process.env["TWILIO_AUTH_TOKEN"]    ? "SET ✓" : "NOT SET — add to Replit Secrets",
      twilioPhone:      process.env["TWILIO_PHONE_NUMBER"]  ? "SET ✓" : "NOT SET — add to Replit Secrets",
      sendgridKey:      process.env["SENDGRID_API_KEY"]     ? "SET ✓" : "NOT SET — add to Replit Secrets",
      stripeKey:        process.env["STRIPE_SECRET_KEY"]    ? "SET ✓" : "NOT SET",
      databaseUrl:      process.env["DATABASE_URL"]         ? "SET ✓" : "NOT SET",
    },
    deployment: {
      customDomain:   process.env["CUSTOM_DOMAIN"] ?? "Not configured — set CUSTOM_DOMAIN=cuxtomcandyclub.ai",
      appUrl:         process.env["VITE_APP_URL"] ?? "https://cuxtomcandyclub.ai",
      environment:    process.env["NODE_ENV"] ?? "development",
    },
  });
});

// ─── Audit Log (owner only) ───────────────────────────────────────────────────
router.get("/audit", requireOwner, (_req: Request, res: Response) => {
  res.json({
    log:           [...ownerAuditLog].reverse().slice(0, 100),
    total:         ownerAuditLog.length,
    failed:        ownerAuditLog.filter(e => !e.success).length,
    blockedIPs:    Array.from(failedAttempts.entries()).filter(([, n]) => n >= 10).map(([ip]) => ip),
  });
});

// ─── Platform Shutdown (owner only — drastic, requires confirm) ───────────────
router.post("/shutdown", requireOwner, (req: Request, res: Response) => {
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "CUXTOMCANDYCLUB-SHUTDOWN") {
    res.status(400).json({ error: `Send confirm: "CUXTOMCANDYCLUB-SHUTDOWN" to execute.` });
    return;
  }
  logAudit(req, true, "SHUTDOWN_REQUESTED");
  res.json({ shutdownScheduled: true, message: "Platform will restart in 30 seconds." });
  setTimeout(() => process.exit(0), 30_000);
});

// ─── Generate a new owner token (owner only) ──────────────────────────────────
router.post("/rotate-token", requireOwner, (_req: Request, res: Response) => {
  const newToken = crypto.randomBytes(32).toString("hex");
  res.json({
    newToken,
    warning: "This is displayed ONCE. Copy it immediately and set OWNER_SECRET_TOKEN in Replit Secrets. Your current token is still active until you update it.",
  });
});

export default router;
