/**
 * 3C ONYX — Domain Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * CUXTOMCANDYCLUB LLC owns all four domains below.
 * The PRIMARY domain (for links, emails, KYC return URLs) is set via
 * the VITE_APP_URL environment variable in production.
 *
 * All four domains are whitelisted for CORS and treated as trusted origins.
 */

/** All CUXTOMCANDYCLUB LLC production domains */
export const OWNED_DOMAINS = [
  "https://cuxtomcandyclub.ai",
  "https://www.cuxtomcandyclub.ai",
  "https://3conyx.ai",
  "https://www.3conyx.ai",
  "https://cuxtomcandyclub.com",
  "https://www.cuxtomcandyclub.com",
  "https://3conyx.com",
  "https://www.3conyx.com",
] as const;

/**
 * Primary public-facing domain.
 * Set VITE_APP_URL in production to override (e.g. https://cuxtomcandyclub.ai).
 * Used for: KYC return URLs, outreach referral links, email footers.
 */
export const PRIMARY_DOMAIN =
  process.env["VITE_APP_URL"] ?? "https://cuxtomcandyclub.ai";

/**
 * Primary "from" email address.
 * Set SENDGRID_FROM_EMAIL in production to override.
 */
export const FROM_EMAIL =
  process.env["SENDGRID_FROM_EMAIL"] ?? "ron@cuxtomcandyclub.ai";

/**
 * Returns true if an incoming request origin is one of the owned domains.
 */
export function isOwnedOrigin(origin: string): boolean {
  return OWNED_DOMAINS.some(d => origin.startsWith(d));
}
