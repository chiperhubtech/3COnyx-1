import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

const SOVEREIGN_USER_ID = 6;
const ARCHITECT = "Ronald Antonio Cadet";

const sovereignAuditLog: Array<{
  ts: string;
  userId: number | null;
  ip: string;
  endpoint: string;
  allowed: boolean;
  reason: string;
}> = [];

function logSovereignAttempt(req: Request, userId: number | null, allowed: boolean, reason: string) {
  const ip = (req.headers["x-forwarded-for"] as string ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  sovereignAuditLog.push({ ts: new Date().toISOString(), userId, ip, endpoint: req.originalUrl, allowed, reason });
  if (sovereignAuditLog.length > 1000) sovereignAuditLog.splice(0, 200);

  if (!allowed) {
    logger.warn({ userId, ip, endpoint: req.originalUrl, reason }, "[sovereign] Unauthorized access attempt");
  }
}

export function requireSovereign(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user) {
    logSovereignAttempt(req, null, false, "NO_AUTH");
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const userId = parseInt(String(user.sub ?? user.id), 10);

  if (userId !== SOVEREIGN_USER_ID) {
    logSovereignAttempt(req, userId, false, "NOT_SOVEREIGN");
    res.status(403).json({ error: "Sovereign access required" });
    return;
  }

  logSovereignAttempt(req, userId, true, "SOVEREIGN_VERIFIED");
  next();
}

export function isSovereign(req: Request): boolean {
  const user = (req as any).user;
  if (!user) return false;
  const userId = parseInt(String(user.sub ?? user.id), 10);
  return userId === SOVEREIGN_USER_ID;
}

export function scopedResponse(req: Request, fullData: any, scopedData: any): any {
  return isSovereign(req) ? fullData : scopedData;
}

export function getSovereignAuditLog() {
  return sovereignAuditLog.slice(-100);
}

export { SOVEREIGN_USER_ID, ARCHITECT };
