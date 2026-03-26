/**
 * AES-256-GCM Encryption — Zero-Knowledge Sensitive Field Wrapper
 * Used for: Tax IDs, SSN last 4, ITIN values, any PII that must never
 * appear in plaintext in the database or logs.
 *
 * Key derivation: ENCRYPTION_KEY env var (32-byte hex string = 256-bit).
 * If not set in development, a deterministic dev key is used (NEVER in prod).
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length >= 64) {
    return Buffer.from(envKey.slice(0, 64), "hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY must be set in production (64-char hex = 256-bit)");
  }
  // Dev-only deterministic key — NEVER use in production
  return createHash("sha256").update("3c-onyx-dev-key-cuxtomcandyclub").digest();
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv:         string; // hex — 12 bytes GCM nonce
  tag:        string; // hex — 16 bytes GCM auth tag
}

/**
 * Encrypt plaintext → AES-256-GCM ciphertext.
 * Returns { ciphertext, iv, tag } — store all three in DB.
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv  = randomBytes(12); // 96-bit nonce — GCM standard
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("hex"),
    iv:         iv.toString("hex"),
    tag:        tag.toString("hex"),
  };
}

/**
 * Decrypt AES-256-GCM ciphertext back to plaintext.
 * Throws if the auth tag doesn't match (tamper detection).
 */
export function decrypt({ ciphertext, iv, tag }: EncryptedPayload): string {
  const key     = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Hash a value (one-way) using SHA-256.
 * Used for: charter signatures, content fingerprinting, IP anchoring.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Generate a charter signature hash from userId + version + timestamp.
 * Deterministic — can be re-verified against stored value.
 */
export function charterSignatureHash(userId: number, version: string, ts: string): string {
  return sha256(`CHARTER|${userId}|${version}|${ts}|CUXTOMCANDYCLUB`);
}
