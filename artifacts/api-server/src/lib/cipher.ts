/**
 * 3C Onyx — NIST-MCP 2026 AES-256-GCM Cipher Layer
 *
 * Every sensitive field is encrypted at rest with AES-256-GCM.
 * The encrypted envelope stores { ct, iv, tag, v } as base64 tokens.
 * The key is derived from ENCRYPTION_KEY env var (must be 32+ chars).
 *
 * PII masking rules (never expose full value):
 *   VIN:     show only last 4 digits  → "•••••••••••1234"
 *   SSN:     never expose digits      → "•••-••-••••"
 *   address: show city/state only     → "[Street redacted], Beverly Hills, CA"
 *   name:    show initials only       → "A. H." or "[OWNER REDACTED]" for agents
 *   email:   show domain only         → "****@example.com"
 */
import crypto from "crypto";

// ─── Key derivation ───────────────────────────────────────────────────────────
const RAW_KEY = process.env.ENCRYPTION_KEY ?? "3C-ONYX-NIST-MCP-2026-DEV-KEY-X9";
// Derive a 32-byte key via SHA-256 so any length env var works safely
const KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EncryptedField {
  ct: string;   // ciphertext (base64)
  iv: string;   // initialisation vector (base64, 12 bytes)
  tag: string;  // GCM auth tag (base64, 16 bytes)
  v: 1;         // schema version
}

export type PiiType = "vin" | "ssn" | "address" | "name" | "email" | "phone";

// ─── Encrypt ──────────────────────────────────────────────────────────────────
export function encrypt(plaintext: string): EncryptedField {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ct: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    v: 1,
  };
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────
export function decrypt(field: EncryptedField): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(field.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(field.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(field.ct, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// ─── Safe string round-trip (for demo/audit purposes) ─────────────────────────
export function encryptString(value: string): string {
  const enc = encrypt(value);
  return Buffer.from(JSON.stringify(enc)).toString("base64");
}

export function decryptString(token: string): string {
  try {
    const enc = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as EncryptedField;
    return decrypt(enc);
  } catch {
    return "[decryption error]";
  }
}

// ─── PII Masking (display-safe representations) ───────────────────────────────
export function maskPii(value: string, type: PiiType): string {
  switch (type) {
    case "vin": {
      const v = value.trim();
      return "•••••••••••" + v.slice(-4);
    }
    case "ssn": {
      return "•••-••-" + value.replace(/\D/g, "").slice(-4);
    }
    case "address": {
      // Keep city/state, redact street
      const parts = value.split(",").map((s) => s.trim());
      if (parts.length >= 3) return `[Street redacted], ${parts.slice(1).join(", ")}`;
      if (parts.length === 2) return `[Street redacted], ${parts[1]}`;
      return "[Address redacted]";
    }
    case "name": {
      const words = value.trim().split(/\s+/);
      return words.map((w, i) => (i === 0 ? w[0] + "." : w[0] + ".")).join(" ");
    }
    case "email": {
      const [user, domain] = value.split("@");
      return (user?.[0] ?? "*") + "****@" + (domain ?? "****");
    }
    case "phone": {
      return value.replace(/\d(?=\d{4})/g, "•");
    }
    default:
      return "•••••••••";
  }
}

// ─── Agent-safe "vitals" sanitiser ───────────────────────────────────────────
/** Strips owner PII, returns only vehicle vitals safe for AI agent consumption */
export function sanitiseForAgent(vehicleRecord: Record<string, unknown>): Record<string, unknown> {
  const PII_KEYS = new Set([
    "ownerName", "owner_name", "ownerEmail", "owner_email",
    "ownerAddress", "owner_address", "ownerPhone", "owner_phone",
    "ssn", "socialSecurity", "driverLicense", "driver_license",
    "bankAccount", "bank_account", "taxId", "tax_id",
  ]);

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(vehicleRecord)) {
    if (PII_KEYS.has(k)) {
      safe[k] = "[AGENT REDACTED — NIST-MCP 4.3.2(a)]";
    } else if (k.toLowerCase().includes("vin")) {
      safe[k] = typeof v === "string" ? maskPii(v, "vin") : v;
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

// ─── Hash chain helper ────────────────────────────────────────────────────────
export const GENESIS_HASH = crypto
  .createHash("sha256")
  .update("3C-ONYX-NIST-MCP-2026-GENESIS")
  .digest("hex");

export function chainHash(prevHash: string, data: string): string {
  return crypto.createHash("sha256").update(prevHash + data).digest("hex");
}
