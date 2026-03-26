/**
 * 3C Onyx — Startup Security Guard
 *
 * Validates all critical secrets before the server accepts any traffic.
 * In production: FAIL HARD if any required secret is missing or weak.
 * In development: WARN and continue so the dev loop stays fast.
 *
 * Inspired by Netflix Hystrix fail-fast pattern + NIST SP 800-57.
 */
import { logger } from "./logger";

interface SecretRule {
  name:        string;
  envKey:      string;
  required:    boolean;
  minLength:   number;
  description: string;
}

const REQUIRED_SECRETS: SecretRule[] = [
  {
    name:        "JWT_SECRET",
    envKey:      "JWT_SECRET",
    required:    true,
    minLength:   64,
    description: "JWT signing secret (min 64 chars = 512-bit entropy)",
  },
  {
    name:        "ENCRYPTION_KEY",
    envKey:      "ENCRYPTION_KEY",
    required:    true,
    minLength:   64,
    description: "AES-256-GCM encryption key (64-char hex = 256-bit key)",
  },
  {
    name:        "DATABASE_URL",
    envKey:      "DATABASE_URL",
    required:    true,
    minLength:   20,
    description: "PostgreSQL connection string",
  },
];

const DEV_DEFAULTS = new Set([
  "3c-onyx-dev-secret-change-in-production-min32ch",
  "3C-ONYX-NIST-MCP-2026-DEV-KEY-X9",
]);

export function runStartupSecurityChecks(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const failures: string[] = [];
  const warnings: string[] = [];

  for (const rule of REQUIRED_SECRETS) {
    const value = process.env[rule.envKey];

    if (!value) {
      if (rule.required) {
        failures.push(`MISSING: ${rule.name} — ${rule.description}`);
      }
      continue;
    }

    if (value.length < rule.minLength) {
      const msg = `WEAK: ${rule.name} is ${value.length} chars, minimum is ${rule.minLength}`;
      if (isProduction) {
        failures.push(msg);
      } else {
        warnings.push(msg);
      }
    }

    if (DEV_DEFAULTS.has(value)) {
      const msg = `INSECURE: ${rule.name} is using a known dev default — rotate before production`;
      if (isProduction) {
        failures.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  // Warn about weak JWT algo
  if ((process.env.JWT_SECRET?.length ?? 0) < 64) {
    warnings.push("JWT_SECRET should be ≥64 chars for HS256 to be collision-resistant");
  }

  for (const w of warnings) {
    logger.warn(`[SECURITY STARTUP] ⚠️  ${w}`);
  }

  if (failures.length > 0) {
    for (const f of failures) {
      logger.error(`[SECURITY STARTUP] ❌ ${f}`);
    }
    if (isProduction) {
      logger.error("[SECURITY STARTUP] Server REFUSED to start — fix the above secrets first.");
      process.exit(1);
    }
  }

  logger.info(`[SECURITY STARTUP] ✅ Security checks passed (${isProduction ? "PRODUCTION" : "development"} mode)`);
}
