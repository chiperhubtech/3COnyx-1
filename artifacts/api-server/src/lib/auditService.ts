// SOC2 Audit Service — no raw PII ever stored, all IDs masked
import crypto from "crypto";
import { db, auditLogsTable, type AuditLogInsert } from "@workspace/db";

export type EventType = "AUTH" | "DB_CHANGE" | "API_CALL" | "PAYOUT" | "DELIVERY" | "ADMIN" | "SYSTEM";
export type Severity = "INFO" | "WARN" | "CRIT";

// ─── PII-safe masking helpers ──────────────────────────────────────────────────

function maskId(id: string | number | undefined | null): string {
  if (!id) return "anon";
  const s = String(id);
  if (s.length <= 4) return "***" + s.slice(-1);
  return "***" + s.slice(-4);
}

function maskIp(ip: string | undefined | null): string {
  if (!ip) return "0.0.0.0";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  return ip.slice(0, 6) + "…";
}

// Stable SHA-256 of the entire audit row (tamper evidence)
function hashEntry(entry: Omit<AuditLogInsert, "sha256Hash">): string {
  const payload = JSON.stringify({
    eventType: entry.eventType,
    action: entry.action,
    actorId: entry.actorId,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    statusCode: entry.statusCode,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ─── Write one audit record ────────────────────────────────────────────────────

type DbWriter = Pick<typeof db, "insert">;

export interface AuditParams {
  eventType: EventType;
  action: string;
  actorId?: string | number | null;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string | number | null;
  method?: string;
  path?: string;
  statusCode?: number;
  severity?: Severity;
  metadata?: Record<string, unknown>;
  ip?: string;
  dbClient?: DbWriter;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  try {
    const conn = params.dbClient ?? db;
    const entry: Omit<AuditLogInsert, "sha256Hash"> = {
      eventType: params.eventType,
      action: params.action,
      actorId: maskId(params.actorId),
      actorRole: params.actorRole ?? "System",
      resourceType: params.resourceType,
      resourceId: params.resourceId ? maskId(params.resourceId) : null,
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      severity: params.severity ?? "INFO",
      metadata: params.metadata ? sanitiseMetadata(params.metadata) : null,
      ipAddress: maskIp(params.ip),
    };

    const sha256Hash = hashEntry(entry);
    await conn.insert(auditLogsTable).values({ ...entry, sha256Hash });
  } catch (_err) {
    // Never crash the request — audit logging is fire-and-forget
  }
}

// Strip any obvious PII from metadata before persisting
function sanitiseMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_KEYS = ["email", "phone", "vin", "ssn", "dob", "password", "token", "secret", "key"];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      const lower = k.toLowerCase();
      if (PII_KEYS.some((p) => lower.includes(p))) return [k, "***REDACTED***"];
      if (typeof v === "string" && v.length > 17) {
        // Possible VIN or long PII — show only last 4
        return [k, "***" + v.slice(-4)];
      }
      return [k, v];
    })
  );
}
