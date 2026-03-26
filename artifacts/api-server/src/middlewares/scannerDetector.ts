/**
 * 3C Onyx — Scanner / Reconnaissance Detector
 *
 * Tracks per-IP 404 hits and unusual endpoint probing patterns.
 * Any IP that hits 10+ distinct 404s in 60 seconds gets blocked for 1 hour.
 * Blocks are in-process (fast) and logged to the audit trail.
 *
 * This catches:
 *   - Path scanners (dirsearch, gobuster, nikto, sqlmap --crawl)
 *   - API endpoint enumerators
 *   - Automated vulnerability scanners
 */
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

const WINDOW_MS           = 60_000;   // 1-minute rolling window
const MAX_404S_IN_WINDOW  = 10;       // threshold before block
const BLOCK_DURATION_MS   = 60 * 60 * 1000; // 1-hour block

interface IPRecord {
  hits:      number;
  windowStart: number;
  blocked:   boolean;
  blockedAt: number;
  paths:     Set<string>;
}

const ipMap = new Map<string, IPRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
}

/** Middleware: track 404s and block confirmed scanners. */
export function scannerDetector(req: Request, res: Response, next: NextFunction): void {
  const ip  = getClientIp(req);
  const now = Date.now();

  // Check if currently blocked
  const record = ipMap.get(ip);
  if (record?.blocked) {
    const elapsed = now - record.blockedAt;
    if (elapsed < BLOCK_DURATION_MS) {
      res.status(403).json({ error: "Access denied.", code: "BLOCKED" });
      return;
    }
    // Block expired — clear and continue
    ipMap.delete(ip);
  }

  // Hook the response to detect 404s
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode === 404) {
      const entry = ipMap.get(ip) ?? { hits: 0, windowStart: now, blocked: false, blockedAt: 0, paths: new Set<string>() };

      // Roll window
      if (now - entry.windowStart > WINDOW_MS) {
        entry.hits        = 0;
        entry.windowStart = now;
        entry.paths       = new Set();
      }

      entry.hits++;
      entry.paths.add(req.path);

      if (entry.hits >= MAX_404S_IN_WINDOW) {
        entry.blocked   = true;
        entry.blockedAt = now;
        ipMap.set(ip, entry);
        logger.warn({
          ip,
          hitsInWindow: entry.hits,
          uniquePaths:  entry.paths.size,
          sampledPaths: [...entry.paths].slice(0, 5),
        }, "[SCANNER BLOCKED] Reconnaissance pattern detected — IP blocked for 1 hour");
      } else {
        ipMap.set(ip, entry);
      }
    }
    return originalJson(body);
  };

  next();
}

/** Returns current blocked IP count (for health endpoint). */
export function blockedIpCount(): number {
  let count = 0;
  const now = Date.now();
  for (const record of ipMap.values()) {
    if (record.blocked && (now - record.blockedAt) < BLOCK_DURATION_MS) count++;
  }
  return count;
}
