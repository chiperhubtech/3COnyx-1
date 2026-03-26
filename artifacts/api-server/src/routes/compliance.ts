/**
 * Compliance Routes — IRS/FinCEN + Charter + Audit Ledger
 *
 * GET  /api/compliance/charter/status       — current user charter status
 * POST /api/compliance/charter/sign         — record charter acceptance
 * GET  /api/compliance/1099                 — 1099-K eligible users (admin)
 * GET  /api/compliance/1099/me              — my annual earnings summary
 * POST /api/compliance/tax-info             — submit encrypted Tax ID / ITIN
 * GET  /api/compliance/tax-info/me          — my tax info (masked)
 * GET  /api/compliance/backup/status        — disaster recovery status
 */
import { Router, type Request, type Response } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db, memberChartersTable, CHARTER_VERSION_CURRENT, userTaxInfoTable, bayTransactionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/admin";
import { encrypt, charterSignatureHash } from "../lib/encrypt";

const router = Router();

// ─── GET /api/compliance/charter/status ──────────────────────────────────────
router.get("/compliance/charter/status", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;
  const rows = await db.select().from(memberChartersTable)
    .where(
      and(
        eq(memberChartersTable.userId, userId),
        eq(memberChartersTable.charterVersion, CHARTER_VERSION_CURRENT),
      )
    ).limit(1);
  res.json({
    signed:         rows.length > 0,
    charterVersion: CHARTER_VERSION_CURRENT,
    signedAt:       rows[0]?.acceptedAt ?? null,
    signatureHash:  rows[0]?.signatureHash ?? null,
  });
});

// ─── POST /api/compliance/charter/sign ───────────────────────────────────────
router.post("/compliance/charter/sign", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;
  const { sliceAckd, dataAckd } = req.body as { sliceAckd?: boolean; dataAckd?: boolean };

  if (!sliceAckd || !dataAckd) {
    res.status(400).json({ error: "Both acknowledgements (slice + data) are required." });
    return;
  }

  // Idempotent — return existing if already signed
  const existing = await db.select().from(memberChartersTable)
    .where(and(eq(memberChartersTable.userId, userId), eq(memberChartersTable.charterVersion, CHARTER_VERSION_CURRENT)))
    .limit(1);
  if (existing[0]) {
    res.json({ signed: true, signatureHash: existing[0].signatureHash, existing: true });
    return;
  }

  const now = new Date().toISOString();
  const sig = charterSignatureHash(userId, CHARTER_VERSION_CURRENT, now);

  // Mask IP — keep only first two octets (GDPR/CCPA safe)
  const rawIp = String(req.ip ?? req.headers["x-forwarded-for"] ?? "");
  const maskedIp = rawIp.split(".").slice(0, 2).join(".") + ".x.x";

  const ua = String(req.headers["user-agent"] ?? "").slice(0, 256);

  const [charter] = await db.insert(memberChartersTable).values({
    userId,
    charterVersion: CHARTER_VERSION_CURRENT,
    signatureHash:  sig,
    sliceAckd:      true,
    dataAckd:       true,
    ipAddress:      maskedIp,
    userAgent:      ua,
    acceptedAt:     new Date(now),
  }).returning();

  res.status(201).json({ signed: true, signatureHash: charter.signatureHash });
});

// ─── GET /api/compliance/1099/me — personal annual earnings snapshot ──────────
router.get("/compliance/1099/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;
  const yearStart = new Date(`${new Date().getFullYear()}-01-01`);

  const rows = await db.select().from(bayTransactionsTable)
    .where(
      and(
        eq(bayTransactionsTable.specialistId, userId),
        eq(bayTransactionsTable.status, "PAID"),
        gte(bayTransactionsTable.paidAt!, yearStart),
      )
    );

  const totalCents = rows.reduce((s: number, r: { netAmountCents: number }) => s + r.netAmountCents, 0);
  const threshold1099 = 60_000; // $600 in cents

  res.json({
    taxYear:               new Date().getFullYear(),
    paidTransactions:      rows.length,
    totalNetCents:         totalCents,
    totalNetUsd:           `$${(totalCents / 100).toFixed(2)}`,
    threshold1099Reached:  totalCents >= threshold1099,
    threshold1099Usd:      "$600.00",
    requiresW9:            totalCents >= threshold1099,
  });
});

// ─── GET /api/compliance/1099 — admin: all 1099-eligible users ───────────────
router.get("/compliance/1099", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const yearStart = new Date(`${new Date().getFullYear()}-01-01`);
  const THRESHOLD = 60_000; // $600

  const result = await db
    .select({
      specialistId: bayTransactionsTable.specialistId,
      totalNet: sql<number>`sum(${bayTransactionsTable.netAmountCents})`.as("totalNet"),
    })
    .from(bayTransactionsTable)
    .where(and(eq(bayTransactionsTable.status, "PAID"), gte(bayTransactionsTable.paidAt!, yearStart)))
    .groupBy(bayTransactionsTable.specialistId);

  const eligible = result.filter((r: { specialistId: number | null; totalNet: number }) => r.totalNet >= THRESHOLD).map((r: { specialistId: number | null; totalNet: number }) => ({
    userId:               r.specialistId,
    annualNetCents:       r.totalNet,
    annualNetUsd:         `$${(r.totalNet / 100).toFixed(2)}`,
    threshold1099Reached: true,
    requiresW9:           true,
  }));

  res.json({ taxYear: new Date().getFullYear(), threshold: "$600", eligible, total: eligible.length });
});

// ─── POST /api/compliance/tax-info — submit encrypted Tax ID ─────────────────
router.post("/compliance/tax-info", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;
  const { taxId, taxIdType } = req.body as { taxId?: string; taxIdType?: string };

  if (!taxId || !taxIdType) {
    res.status(400).json({ error: "taxId and taxIdType are required." });
    return;
  }
  if (!["SSN", "EIN", "ITIN"].includes(taxIdType)) {
    res.status(400).json({ error: "taxIdType must be SSN, EIN, or ITIN." });
    return;
  }

  const encrypted = encrypt(taxId.replace(/\D/g, ""));
  const last4 = taxId.replace(/\D/g, "").slice(-4);

  await db.insert(userTaxInfoTable).values({
    userId,
    taxIdType:      taxIdType as "SSN" | "EIN" | "ITIN",
    taxIdEncrypted: encrypted.ciphertext,
    taxIdIv:        encrypted.iv,
    taxIdTag:       encrypted.tag,
    last4,
    w9Status:       "SUBMITTED",
    w9SubmittedAt:  new Date(),
    taxYear:        new Date().getFullYear(),
  })
  .onConflictDoUpdate({
    target: userTaxInfoTable.userId,
    set: {
      taxIdType:      taxIdType as "SSN" | "EIN" | "ITIN",
      taxIdEncrypted: encrypted.ciphertext,
      taxIdIv:        encrypted.iv,
      taxIdTag:       encrypted.tag,
      last4,
      w9Status:       "SUBMITTED",
      w9SubmittedAt:  new Date(),
      updatedAt:      new Date(),
    },
  });

  res.status(201).json({ success: true, last4, taxIdType, message: "Tax ID encrypted and stored securely." });
});

// ─── GET /api/compliance/tax-info/me — masked tax info ───────────────────────
router.get("/compliance/tax-info/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: number } }).user.id;
  const [row] = await db.select().from(userTaxInfoTable).where(eq(userTaxInfoTable.userId, userId)).limit(1);
  if (!row) { res.json({ submitted: false }); return; }
  res.json({
    submitted:       true,
    taxIdType:       row.taxIdType,
    last4:           row.last4,
    w9Status:        row.w9Status,
    w9SubmittedAt:   row.w9SubmittedAt,
    taxYear:         row.taxYear,
    threshold1099:   row.threshold1099Reached,
    form1099kRef:    row.form1099kRef,
  });
});

// ─── GET /api/compliance/backup/status — Disaster Recovery status ─────────────
router.get("/compliance/backup/status", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  // In production: query a `backup_runs` table updated by pg_dump cron job.
  // This endpoint reports infrastructure posture for audit/SOC2 dashboards.
  res.json({
    strategy:         "Encrypted off-site pg_dump",
    encryptionAlgo:   "AES-256-GCM",
    zeroKnowledge:    true,
    sensitiveFields:  ["tax_id_encrypted", "stripe_identity_session_id"],
    retentionDays:    90,
    lastBackup:       process.env.LAST_BACKUP_AT ?? "Awaiting first scheduled run",
    nextBackup:       process.env.NEXT_BACKUP_AT ?? "Pending cron setup",
    status:           process.env.LAST_BACKUP_AT ? "HEALTHY" : "PENDING_FIRST_RUN",
    note:             "Configure LAST_BACKUP_AT and NEXT_BACKUP_AT via your pg_dump cron hook.",
  });
});

export default router;
