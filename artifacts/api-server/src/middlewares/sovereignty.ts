/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * Sovereignty Middleware
 * ──────────────────────
 * Stamps every single HTTP response leaving this server with the
 * forensic ownership fingerprint of Ronald Antonio Cadet and
 * CUXTOMCANDYCLUB LLC. Every byte served by this platform carries
 * the owner's signature. There is no response without attribution.
 *
 * This creates an unbroken, server-log-provable chain of custody
 * from origin to recipient on every transaction.
 */

import { type Request, type Response, type NextFunction } from "express";
import { getSovereigntyHeaders } from "../lib/honeyToken";

export function sovereigntyMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const headers = getSovereigntyHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  next();
}
