/**
 * 3C ONYX — AWS Secrets Manager Abstraction
 * ──────────────────────────────────────────
 * In production: reads from AWS Secrets Manager (auto-rotating, zero breach surface)
 * In development: falls back to process.env (safe local dev)
 *
 * Usage:
 *   import { getSecret } from "./secrets";
 *   const jwtSecret = await getSecret("jwt-secret");
 *
 * AWS-03 upgrade — replaces all direct process.env secret access
 */

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { logger } from "./logger";

// Secret name → env var fallback map
const SECRET_MAP: Record<string, string> = {
  "jwt-secret":       "JWT_SECRET",
  "encryption-key":   "ENCRYPTION_KEY",
  "stripe-key":       "STRIPE_SECRET_KEY",
  "twilio-sid":       "TWILIO_ACCOUNT_SID",
  "twilio-token":     "TWILIO_AUTH_TOKEN",
  "twilio-whatsapp":  "TWILIO_WHATSAPP_FROM",
  "marketcheck-key":  "MARKETCHECK_API_KEY",
  "smartcar-key":     "SMARTCAR_CLIENT_SECRET",
  "checkr-key":       "CHECKR_API_KEY",
  "gemini-key":       "AI_INTEGRATIONS_GEMINI_AI_API_KEY",
  "openai-key":       "AI_INTEGRATIONS_OPENAI_API_KEY",
  "anthropic-key":    "AI_INTEGRATIONS_ANTHROPIC_API_KEY",
  "bedrock-region":   "AWS_BEDROCK_REGION",
  "owner-token":      "OWNER_SECRET_TOKEN",
};

// AWS Secrets Manager prefix (matches CDK secret names)
const SECRET_PREFIX = "3c/prod/";

let _client: SecretsManagerClient | null = null;
const _cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getClient(): SecretsManagerClient | null {
  if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) return null;
  if (!_client) {
    _client = new SecretsManagerClient({
      region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1",
    });
  }
  return _client;
}

/**
 * Retrieve a secret by logical name.
 * Tries Secrets Manager first (prod), falls back to env var (dev).
 */
export async function getSecret(name: string): Promise<string | undefined> {
  // Check cache
  const cached = _cache.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const client = getClient();

  // Try Secrets Manager in production
  if (client && process.env.NODE_ENV === "production") {
    try {
      const cmd = new GetSecretValueCommand({ SecretId: `${SECRET_PREFIX}${name}` });
      const res = await client.send(cmd);
      const value = res.SecretString ?? "";
      _cache.set(name, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      logger.warn({ name, err: (err as Error).message }, "[secrets] Secrets Manager miss — falling back to env var");
    }
  }

  // Fallback: env var
  const envKey = SECRET_MAP[name];
  const value = envKey ? process.env[envKey] : undefined;
  if (value) _cache.set(name, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/**
 * Synchronous env-var fallback (for non-async contexts at startup).
 * Only reads from process.env — does not call Secrets Manager.
 */
export function getSecretSync(name: string): string | undefined {
  const envKey = SECRET_MAP[name];
  return envKey ? process.env[envKey] : undefined;
}

/**
 * Warm the cache on startup for critical secrets.
 * Call once at server boot to reduce per-request latency.
 */
export async function warmSecrets(names: string[]): Promise<void> {
  await Promise.allSettled(names.map(n => getSecret(n)));
  logger.info({ count: names.length }, "[secrets] Secret cache warmed");
}

export const CRITICAL_SECRETS = [
  "jwt-secret",
  "encryption-key",
  "stripe-key",
  "gemini-key",
  "marketcheck-key",
] as const;
