import { Router, type IRouter, type Request, type Response } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { desc, eq, like, or, and, gte, lte, sql } from "drizzle-orm";
import { writeAudit } from "../lib/auditService";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Seed helpers (realistic SOC2-grade historical data) ──────────────────────
const SEED_ACTORS = [
  { id: "usr-1001", role: "Admin" },
  { id: "usr-2034", role: "Dealer" },
  { id: "usr-3118", role: "Runner" },
  { id: "usr-4200", role: "Member" },
  { id: "system", role: "System" },
];

const SEED_EVENTS = [
  // AUTH events
  { eventType: "AUTH" as const, action: "LOGIN_SUCCESS", resource: "User", severity: "INFO" as const, meta: { session: "ses_****8a2f" } },
  { eventType: "AUTH" as const, action: "LOGIN_FAILED", resource: "User", severity: "WARN" as const, meta: { reason: "invalid_credentials", attempts: 3 } },
  { eventType: "AUTH" as const, action: "SESSION_EXPIRED", resource: "User", severity: "INFO" as const, meta: { expiredAfterMin: 60 } },
  { eventType: "AUTH" as const, action: "MFA_VERIFIED", resource: "User", severity: "INFO" as const, meta: { method: "totp" } },
  { eventType: "AUTH" as const, action: "PASSWORD_RESET_REQUESTED", resource: "User", severity: "WARN" as const, meta: {} },
  // DB_CHANGE events
  { eventType: "DB_CHANGE" as const, action: "VEHICLE_CREATED", resource: "Vehicle", severity: "INFO" as const, meta: { make: "Rolls-Royce", model: "Ghost", year: 2023 } },
  { eventType: "DB_CHANGE" as const, action: "VEHICLE_UPDATED", resource: "Vehicle", severity: "INFO" as const, meta: { field: "status", from: "Available", to: "In Transit" } },
  { eventType: "DB_CHANGE" as const, action: "GIGTASK_CREATED", resource: "GigTask", severity: "INFO" as const, meta: { taskType: "Delivery", payoutUsd: "48000.00" } },
  { eventType: "DB_CHANGE" as const, action: "GIGTASK_STATUS_CHANGED", resource: "GigTask", severity: "INFO" as const, meta: { from: "In Progress", to: "Completed" } },
  { eventType: "DB_CHANGE" as const, action: "USER_ROLE_CHANGED", resource: "User", severity: "WARN" as const, meta: { from: "Member", to: "Admin" } },
  { eventType: "DB_CHANGE" as const, action: "COMMISSION_LEDGER_ENTRY", resource: "CommissionLedger", severity: "INFO" as const, meta: { amountUsd: "2400.00" } },
  // PAYOUT events
  { eventType: "PAYOUT" as const, action: "MEMBER_SLICE_PAYOUT", resource: "Payment", severity: "INFO" as const, meta: { slicePct: 5, amountUsd: "2400.00", stripeTransfer: "tr_****1234" } },
  { eventType: "PAYOUT" as const, action: "MEMBER_SLICE_PAYOUT", resource: "Payment", severity: "INFO" as const, meta: { slicePct: 5, amountUsd: "1750.00", stripeTransfer: "tr_****5678" } },
  { eventType: "PAYOUT" as const, action: "STRIPE_CONNECT_ONBOARD", resource: "Payment", severity: "INFO" as const, meta: { accountType: "express", status: "pending" } },
  { eventType: "PAYOUT" as const, action: "PAYOUT_FAILED", resource: "Payment", severity: "CRIT" as const, meta: { reason: "insufficient_funds", retryable: true } },
  // DELIVERY events
  { eventType: "DELIVERY" as const, action: "QR_TOKEN_GENERATED", resource: "Delivery", severity: "INFO" as const, meta: { vehicle: "2023 Ferrari Roma", singleUse: true } },
  { eventType: "DELIVERY" as const, action: "QR_DELIVERY_VERIFIED", resource: "Delivery", severity: "INFO" as const, meta: { vehicle: "2023 Rolls-Royce Ghost Extended", sha256: "b3d…***" } },
  { eventType: "DELIVERY" as const, action: "QR_TOKEN_REUSE_ATTEMPT", resource: "Delivery", severity: "CRIT" as const, meta: { reason: "token_already_used", blocked: true } },
  // ADMIN events
  { eventType: "ADMIN" as const, action: "AUDIT_VAULT_ACCESS", resource: "AuditLog", severity: "WARN" as const, meta: { recordsViewed: 150 } },
  { eventType: "ADMIN" as const, action: "PII_MASK_VERIFIED", resource: "System", severity: "INFO" as const, meta: { checkedFields: ["vin", "bank_account", "email"] } },
  { eventType: "ADMIN" as const, action: "ADMIN_SETTINGS_UPDATED", resource: "Config", severity: "WARN" as const, meta: { setting: "session_timeout", from: "30m", to: "60m" } },
  // SYSTEM events
  { eventType: "SYSTEM" as const, action: "SERVER_STARTED", resource: "System", severity: "INFO" as const, meta: { version: "1.4.2", env: "development" } },
  { eventType: "SYSTEM" as const, action: "DB_MIGRATION_RUN", resource: "System", severity: "INFO" as const, meta: { migrations: 1, table: "audit_logs" } },
  { eventType: "SYSTEM" as const, action: "STRIPE_WEBHOOK_RECEIVED", resource: "Payment", severity: "INFO" as const, meta: { event: "account.updated" } },
  { eventType: "SYSTEM" as const, action: "RATE_LIMIT_TRIGGERED", resource: "API", severity: "WARN" as const, meta: { path: "/api/garage", threshold: 100 } },
];

async function seedAudit() {
  const IPS = ["203.0.113.45", "198.51.100.22", "172.16.254.9", "10.0.0.1"];
  const entries = [];
  const now = Date.now();

  for (let i = 0; i < 80; i++) {
    const ev = SEED_EVENTS[i % SEED_EVENTS.length];
    const actor = SEED_ACTORS[i % SEED_ACTORS.length];
    const ip = IPS[i % IPS.length];
    const daysAgo = Math.floor(i / 3); // spread over ~26 days
    const secsAgo = (i % 3) * 3600 + Math.floor(Math.random() * 1800);
    const createdAt = new Date(now - daysAgo * 86400_000 - secsAgo * 1000);

    const maskedActorId = "***" + actor.id.slice(-4);
    const maskedIp = ip.split(".").slice(0, 2).join(".") + ".***.***";
    const payload = JSON.stringify({ eventType: ev.eventType, action: ev.action, actorId: maskedActorId, createdAt: createdAt.toISOString() });
    const sha256Hash = crypto.createHash("sha256").update(payload).digest("hex");

    entries.push({
      eventType: ev.eventType,
      action: ev.action,
      actorId: maskedActorId,
      actorRole: actor.role,
      resourceType: ev.resource,
      resourceId: "***" + String(1000 + i).slice(-4),
      method: "POST",
      path: `/api/${ev.resource.toLowerCase()}`,
      statusCode: ev.severity === "CRIT" ? 500 : ev.severity === "WARN" ? 400 : 200,
      severity: ev.severity,
      metadata: ev.meta,
      ipAddress: maskedIp,
      sha256Hash,
      createdAt,
    });
  }

  await db.insert(auditLogsTable).values(entries);
  return entries.length;
}

// ─── GET /api/audit/logs ──────────────────────────────────────────────────────
router.get("/audit/logs", async (req: Request, res: Response) => {
  const {
    eventType, severity, search,
    from, to,
    limit = "100", offset = "0",
  } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];

  if (eventType && eventType !== "ALL") {
    conditions.push(eq(auditLogsTable.eventType, eventType as any));
  }
  if (severity && severity !== "ALL") {
    conditions.push(eq(auditLogsTable.severity, severity as any));
  }
  if (from) {
    conditions.push(gte(auditLogsTable.createdAt, new Date(from)));
  }
  if (to) {
    conditions.push(lte(auditLogsTable.createdAt, new Date(to)));
  }
  if (search) {
    conditions.push(
      or(
        like(auditLogsTable.action, `%${search}%`),
        like(auditLogsTable.actorId, `%${search}%`),
        like(auditLogsTable.path, `%${search}%`),
        like(auditLogsTable.resourceType, `%${search}%`),
      ) as any
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(auditLogsTable)
      .where(where)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset)),
    db.select({ count: sql<number>`count(*)::int` })
      .from(auditLogsTable)
      .where(where),
  ]);

  res.json({ logs: rows, total: countResult[0]?.count ?? 0 });
});

// ─── GET /api/audit/stats ─────────────────────────────────────────────────────
router.get("/audit/stats", async (_req: Request, res: Response) => {
  const [total, bySeverity, byType] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogsTable),
    db.select({ severity: auditLogsTable.severity, count: sql<number>`count(*)::int` })
      .from(auditLogsTable).groupBy(auditLogsTable.severity),
    db.select({ eventType: auditLogsTable.eventType, count: sql<number>`count(*)::int` })
      .from(auditLogsTable).groupBy(auditLogsTable.eventType),
  ]);

  res.json({
    total: total[0]?.count ?? 0,
    bySeverity: Object.fromEntries(bySeverity.map((r) => [r.severity, r.count])),
    byType: Object.fromEntries(byType.map((r) => [r.eventType, r.count])),
  });
});

// ─── POST /api/audit/seed ─────────────────────────────────────────────────────
router.post("/audit/seed", async (_req: Request, res: Response) => {
  const count = await seedAudit();
  await writeAudit({
    eventType: "ADMIN",
    action: "AUDIT_SEED_RUN",
    actorRole: "Admin",
    severity: "WARN",
    metadata: { seeded: count },
  });
  res.json({ seeded: count });
});

export default router;
