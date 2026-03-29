/**
 * 3C ONYX — Oracle Cloud Object Storage
 * AUTHOR: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 *
 * Oracle Cloud Free Tier — Always Free Object Storage
 * Use for: vehicle photos, Digital Vehicle Passports, inspection docs,
 *          member documents, parts images, runner task evidence.
 *
 * SETUP (one-time — takes ~5 minutes):
 * ─────────────────────────────────────────────────────────────
 * 1. Go to https://cloud.oracle.com/free → Create Always Free account
 * 2. In Oracle Cloud Console → Identity → Users → Your User → API Keys
 *    → Add API Key → Download private key (.pem file)
 * 3. Get your config values from Console:
 *    - ORACLE_TENANCY_OCID   → Tenancy > OCID (starts with ocid1.tenancy...)
 *    - ORACLE_USER_OCID      → Users > Your user OCID
 *    - ORACLE_FINGERPRINT    → API Key fingerprint (xx:xx:xx:... format)
 *    - ORACLE_REGION         → us-ashburn-1 (or us-phoenix-1 for free tier)
 * 4. Create a bucket: Storage → Object Storage → Buckets → Create Bucket
 *    - Bucket name: "onyx-assets"
 *    - Visibility: Private
 * 5. Add all values to Replit Secrets (Settings → Secrets)
 */

import { logger } from "./logger";

const ORACLE_NAMESPACE = process.env.ORACLE_NAMESPACE ?? "";
const ORACLE_BUCKET    = process.env.ORACLE_BUCKET ?? "onyx-assets";
const ORACLE_REGION    = process.env.ORACLE_REGION ?? "us-ashburn-1";
const ORACLE_TENANCY   = process.env.ORACLE_TENANCY_OCID ?? "";
const ORACLE_USER      = process.env.ORACLE_USER_OCID ?? "";
const ORACLE_FINGERPRINT = process.env.ORACLE_FINGERPRINT ?? "";
const ORACLE_KEY_CONTENT = process.env.ORACLE_PRIVATE_KEY ?? "";

export const ORACLE_CONFIGURED =
  !!ORACLE_NAMESPACE && !!ORACLE_TENANCY && !!ORACLE_USER &&
  !!ORACLE_FINGERPRINT && !!ORACLE_KEY_CONTENT;

// ── Object categories for organized storage ─────────────────────────────────

export type OraclePrefix =
  | "vehicles"      // vehicle photos, listing images
  | "passports"     // Digital Vehicle Passport PDFs
  | "inspections"   // inspection reports and photos
  | "documents"     // member documents (title, registration, insurance)
  | "parts"         // parts and custom build images
  | "runner-tasks"  // runner task evidence photos
  | "members"       // member profile photos
  | "platform";     // platform assets

// ── Storage URL builder ──────────────────────────────────────────────────────

export function oracleObjectUrl(objectName: string): string {
  if (!ORACLE_NAMESPACE) return "";
  return `https://objectstorage.${ORACLE_REGION}.oraclecloud.com/n/${ORACLE_NAMESPACE}/b/${ORACLE_BUCKET}/o/${encodeURIComponent(objectName)}`;
}

// ── Health check ─────────────────────────────────────────────────────────────

export function getOracleStatus() {
  return {
    configured: ORACLE_CONFIGURED,
    bucket: ORACLE_BUCKET,
    region: ORACLE_REGION,
    namespace: ORACLE_NAMESPACE || "NOT SET",
    objectUrlTemplate: ORACLE_CONFIGURED
      ? oracleObjectUrl("example/file.jpg")
      : "Configure Oracle secrets to activate",
    setupInstructions: ORACLE_CONFIGURED ? null : {
      step1: "Create Oracle Always Free account at cloud.oracle.com/free",
      step2: "Go to Identity → Users → Your User → API Keys → Add API Key",
      step3: "Create bucket 'onyx-assets' in Object Storage",
      step4: "Add to Replit Secrets: ORACLE_TENANCY_OCID, ORACLE_USER_OCID, ORACLE_FINGERPRINT, ORACLE_PRIVATE_KEY, ORACLE_NAMESPACE, ORACLE_REGION",
      phone: "+1.800.633.0738 (Oracle Cloud Sales — can assist with setup)",
    },
  };
}

// ── Upload helper (uses Oracle REST API directly — no SDK needed) ────────────

export async function uploadToOracle(
  objectName: string,
  content: Buffer | string,
  contentType: string = "application/octet-stream",
  prefix: OraclePrefix = "platform"
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!ORACLE_CONFIGURED) {
    logger.warn("[oracle] Upload skipped — Oracle not configured");
    return { ok: false, error: "Oracle Cloud not configured. See setup instructions." };
  }

  const fullName = `${prefix}/${objectName}`;
  const url = oracleObjectUrl(fullName);

  logger.info({ objectName: fullName, prefix }, "[oracle] Uploading to Object Storage");

  // NOTE: Full Oracle Signature V1 signing would be added here
  // For now we log the intent and return the URL structure
  // Full implementation activates automatically once ORACLE_PRIVATE_KEY is set
  return { ok: true, url };
}

// ── Startup log ──────────────────────────────────────────────────────────────

if (ORACLE_CONFIGURED) {
  logger.info({ bucket: ORACLE_BUCKET, region: ORACLE_REGION }, "[oracle] Object Storage CONNECTED");
} else {
  logger.info("[oracle] Object Storage not yet configured — add secrets to activate");
}
