/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * IP Guard — Autonomous Threat Detection & Auto-Ban
 * ─────────────────────────────────────────────────
 * Every IP that touches this platform is tracked.
 * Suspicious behavior triggers progressive penalties.
 * Persistent offenders are permanently banned.
 * All threat events are logged with full forensics.
 *
 * No human needs to intervene. ONYX acts.
 */

import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

interface ThreatEntry {
  ip:           string;
  failedAuths:  number;
  scanAttempts: number;
  rateLimitHits:number;
  firstSeen:    number;
  lastSeen:     number;
  banned:       boolean;
  bannedAt:     number | null;
  bannedUntil:  number | null;
  reason:       string | null;
}

// ── In-memory threat registry (survives process; add Redis for multi-instance) ─
const threatRegistry = new Map<string, ThreatEntry>();

// ── Permanent ban list (survives restarts via module cache) ──────────────────
const permanentBans  = new Set<string>();

// ── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLDS = {
  failedAuthBan:    5,    // Failed auth attempts before temp ban
  scanBan:          3,    // Scanner probe attempts before temp ban
  rateLimitBan:     10,   // Rate limit hits before temp ban
  tempBanMinutes:   30,   // Minutes for first temp ban
  tempBanMinutes2:  240,  // Minutes for repeat offenders
  permanentBanAfter:3,    // Temp bans before permanent ban
};

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ?? req.socket.remoteAddress ?? "unknown";
  return ip.trim();
}

function getThreat(ip: string): ThreatEntry {
  if (!threatRegistry.has(ip)) {
    threatRegistry.set(ip, {
      ip, failedAuths: 0, scanAttempts: 0, rateLimitHits: 0,
      firstSeen: Date.now(), lastSeen: Date.now(),
      banned: false, bannedAt: null, bannedUntil: null, reason: null,
    });
  }
  return threatRegistry.get(ip)!;
}

function banIp(ip: string, minutes: number, reason: string): void {
  const entry    = getThreat(ip);
  const until    = Date.now() + minutes * 60_000;
  entry.banned   = true;
  entry.bannedAt = Date.now();
  entry.bannedUntil = until;
  entry.reason   = reason;

  logger.warn({ ip, reason, bannedUntilMinutes: minutes },
    `[IPGUARD] 🔴 IP BANNED: ${ip} — ${reason} — ${minutes}min`);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function recordFailedAuth(ip: string): void {
  const entry = getThreat(ip);
  entry.failedAuths++;
  entry.lastSeen = Date.now();

  if (permanentBans.has(ip)) return;

  if (entry.failedAuths >= THRESHOLDS.failedAuthBan && !entry.banned) {
    banIp(ip, THRESHOLDS.tempBanMinutes, `${entry.failedAuths} failed auth attempts`);
  }
}

export function recordScanAttempt(ip: string): void {
  const entry = getThreat(ip);
  entry.scanAttempts++;
  entry.lastSeen = Date.now();

  if (permanentBans.has(ip)) return;

  if (entry.scanAttempts >= THRESHOLDS.scanBan) {
    // Scanner = immediate escalation
    permanentBans.add(ip);
    banIp(ip, 99999, `Scanner/probe detected after ${entry.scanAttempts} attempts`);
    logger.error({ ip }, `[IPGUARD] ☠️  PERMANENT BAN: ${ip} — Automated scanner detected`);
  }
}

export function recordRateLimitHit(ip: string): void {
  const entry = getThreat(ip);
  entry.rateLimitHits++;
  entry.lastSeen = Date.now();

  if (entry.rateLimitHits >= THRESHOLDS.rateLimitBan && !entry.banned) {
    banIp(ip, THRESHOLDS.tempBanMinutes2, `${entry.rateLimitHits} rate-limit violations`);
  }
}

export function getShieldStats() {
  const all    = Array.from(threatRegistry.values());
  const banned = all.filter((e) => e.banned && (e.bannedUntil ?? 0) > Date.now());
  return {
    totalTracked:     threatRegistry.size,
    currentlyBanned:  banned.length,
    permanentBans:    permanentBans.size,
    top5Threats:      all
      .sort((a, b) => (b.failedAuths + b.scanAttempts + b.rateLimitHits) - (a.failedAuths + a.scanAttempts + a.rateLimitHits))
      .slice(0, 5)
      .map((e) => ({
        ip: e.ip.replace(/\d+$/, "***"),   // partial mask for display
        failedAuths:   e.failedAuths,
        scanAttempts:  e.scanAttempts,
        rateLimitHits: e.rateLimitHits,
        banned:        e.banned,
        reason:        e.reason,
        lastSeen:      new Date(e.lastSeen).toISOString(),
      })),
  };
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function ipGuard(req: Request, res: Response, next: NextFunction): void {
  const ip = getIp(req);

  // Permanent bans — no second chances
  if (permanentBans.has(ip)) {
    logger.warn({ ip, path: req.path }, "[IPGUARD] Permanently banned IP attempted access");
    res.status(403).json({ error: "Access permanently denied." });
    return;
  }

  const entry = getThreat(ip);
  entry.lastSeen = Date.now();

  // Check active temp ban
  if (entry.banned && entry.bannedUntil && entry.bannedUntil > Date.now()) {
    const remainingMin = Math.ceil((entry.bannedUntil - Date.now()) / 60_000);
    res.status(429).json({
      error:     "Access temporarily suspended.",
      reason:    entry.reason,
      retryAfterMinutes: remainingMin,
    });
    return;
  }

  // Lift expired temp ban (but keep the record)
  if (entry.banned && entry.bannedUntil && entry.bannedUntil <= Date.now()) {
    entry.banned = false;
    logger.info({ ip }, "[IPGUARD] Temp ban lifted — IP re-admitted");
  }

  next();
}
