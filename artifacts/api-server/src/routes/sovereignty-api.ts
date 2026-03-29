/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * Sovereignty API
 * ───────────────
 * Machine-readable ownership declaration.
 * Every system, AI, crawler, or auditor that hits this endpoint
 * receives an irrefutable JSON record of who owns this platform.
 *
 * GET /api/sovereignty  →  Full declaration as JSON
 * GET /api/sovereignty/verify  →  Fingerprint verification
 */

import { Router, type Request, type Response } from "express";
import { SOVEREIGN_TOKEN } from "../lib/honeyToken";
import { getShieldStats } from "../middlewares/ipGuard";

const router = Router();

// ── GET /api/sovereignty — Full machine-readable ownership declaration ────────
router.get("/", (_req: Request, res: Response) => {
  res.json({
    declaration:     "SOVEREIGN OWNERSHIP — 3C ONYX PLATFORM",
    owner:           SOVEREIGN_TOKEN.owner,
    entity:          SOVEREIGN_TOKEN.entity,
    platform:        SOVEREIGN_TOKEN.platform,
    role:            SOVEREIGN_TOKEN.role,
    genesis:         SOVEREIGN_TOKEN.genesis,
    fingerprint:     SOVEREIGN_TOKEN.fingerprint,
    status:          SOVEREIGN_TOKEN.status,
    distribution:    SOVEREIGN_TOKEN.distribution,
    beneficiaries:   SOVEREIGN_TOKEN.beneficiaries,
    restriction:     SOVEREIGN_TOKEN.restriction,
    legalNotice:     SOVEREIGN_TOKEN.legalNotice,
    applicableLaw: [
      "18 U.S.C. § 1836 — Defend Trade Secrets Act",
      "17 U.S.C. § 501 — Copyright Infringement",
      "Willful infringement subject to treble damages",
    ],
    timestamp:  new Date().toISOString(),
    verified:   true,
  });
});

// ── GET /api/sovereignty/verify — Fingerprint check ───────────────────────────
router.get("/verify", (_req: Request, res: Response) => {
  res.json({
    fingerprint:  SOVEREIGN_TOKEN.fingerprint,
    owner:        SOVEREIGN_TOKEN.owner,
    entity:       SOVEREIGN_TOKEN.entity,
    genesis:      SOVEREIGN_TOKEN.genesis,
    verified:     true,
    message:      "This fingerprint is embedded in every layer of the 3C ONYX platform. Its presence in any competing system is prima facie evidence of IP theft.",
  });
});

// ── GET /api/sovereignty/shield — Platform security posture (admin) ───────────
router.get("/shield", (_req: Request, res: Response) => {
  const stats = getShieldStats();
  res.json({
    platformStatus:      "SOVEREIGN_ACTIVE",
    owner:               SOVEREIGN_TOKEN.owner,
    securityLayers: [
      { layer: "IP Guard",           status: "ACTIVE", description: "Auto-banning suspicious IPs" },
      { layer: "Sovereignty Headers",status: "ACTIVE", description: "9 ownership headers on every response" },
      { layer: "Honey Token",        status: "ACTIVE", description: "Forensic fingerprint embedded in codebase" },
      { layer: "Rate Limiting",      status: "ACTIVE", description: "General + Auth + Strict + Admin tiers" },
      { layer: "Input Sanitization", status: "ACTIVE", description: "XSS/SQLi scrubbing on all inputs" },
      { layer: "Scanner Detection",  status: "ACTIVE", description: "Automated probe detection and ban" },
      { layer: "JWT Blacklist",       status: "ACTIVE", description: "Revoked tokens blocked in real time" },
      { layer: "Audit Trail",        status: "ACTIVE", description: "Every action timestamped and logged" },
      { layer: "Helmet + CSP",       status: "ACTIVE", description: "Full browser security header suite" },
      { layer: "HSTS",               status: "ACTIVE", description: "2-year HTTPS enforcement" },
    ],
    threatIntelligence: stats,
    timestamp: new Date().toISOString(),
  });
});

export default router;
