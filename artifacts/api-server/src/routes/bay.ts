/**
 * 3C Onyx — Smart Bay Logistics API
 *
 * GET    /api/bay/slots                — List bay slots (by specialist)
 * POST   /api/bay/slots                — Add vehicle to bay queue
 * PATCH  /api/bay/slots/:id/status     — Update slot status (specialist / tech)
 * PATCH  /api/bay/slots/:id/gps        — Customer GPS check-in trigger (~20 min out)
 * POST   /api/bay/slots/:id/rush       — Manager requests rush (blocked unless READY)
 * DELETE /api/bay/slots/:id            — Remove from queue
 *
 * POST   /api/bay/qr                   — Generate Pay-at-the-Bay QR (3% tech fee)
 * GET    /api/bay/qr/:qrCode           — Retrieve QR transaction details
 * PATCH  /api/bay/qr/:qrCode/paid      — Mark transaction paid (webhook / manual)
 */
import { Router, type Request, type Response } from "express";
import { db, baySlotsTable, bayTransactionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import crypto from "crypto";

const router = Router();

const FEE_PCT       = 0.03;
const RUNNER_SPLIT  = 0.25;

function makeTxCode(): string {
  return `BAY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// ─── GET /api/bay/slots ───────────────────────────────────────────────────────
router.get("/bay/slots", requireAuth, async (req: Request, res: Response) => {
  const { specialistId } = req.query as { specialistId?: string };
  const rows = specialistId
    ? await db.select().from(baySlotsTable).where(eq(baySlotsTable.specialistId, Number(specialistId))).orderBy(desc(baySlotsTable.createdAt))
    : await db.select().from(baySlotsTable).orderBy(desc(baySlotsTable.createdAt)).limit(50);
  res.json(rows);
});

// ─── POST /api/bay/slots ──────────────────────────────────────────────────────
router.post("/bay/slots", requireAuth, async (req: Request, res: Response) => {
  const { bayNumber, vehicleVin, vehicleLabel, customerName, customerPhone, serviceType, notes } = req.body as {
    bayNumber?: number; vehicleVin?: string; vehicleLabel?: string;
    customerName?: string; customerPhone?: string; serviceType?: string; notes?: string;
  };
  if (!vehicleLabel?.trim() || !customerName?.trim() || !serviceType?.trim()) {
    res.status(400).json({ error: "vehicleLabel, customerName, and serviceType are required." });
    return;
  }
  const user = (req as Request & { user?: { id: number } }).user;
  const [slot] = await db.insert(baySlotsTable).values({
    bayNumber:    bayNumber ?? 1,
    specialistId: user?.id ?? 0,
    vehicleVin:   vehicleVin?.trim().toUpperCase(),
    vehicleLabel: vehicleLabel.trim(),
    customerName: customerName.trim(),
    customerPhone: customerPhone?.trim(),
    serviceType:  serviceType.trim(),
    notes:        notes?.trim(),
  }).returning();
  res.status(201).json(slot);
});

// ─── PATCH /api/bay/slots/:id/status ─────────────────────────────────────────
router.patch("/bay/slots/:id/status", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };
  const allowed = ["QUEUED","GPS_INCOMING","IN_PROGRESS","WAITING_PARTS","QC","READY","DISPATCHED"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
    return;
  }
  const now = new Date();
  const updates: Partial<typeof baySlotsTable.$inferSelect> = {
    status: status as typeof baySlotsTable.$inferSelect["status"],
    updatedAt: now,
  };
  if (status === "IN_PROGRESS") updates.startedAt  = now;
  if (status === "READY")       { updates.completedAt = now; updates.techApproved = true; }
  if (status === "DISPATCHED")  updates.completedAt = now;

  const [updated] = await db.update(baySlotsTable).set(updates).where(eq(baySlotsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Slot not found." }); return; }
  res.json(updated);
});

// ─── PATCH /api/bay/slots/:id/gps ────────────────────────────────────────────
router.patch("/bay/slots/:id/gps", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { etaMinutes } = req.body as { etaMinutes?: number };
  const [updated] = await db.update(baySlotsTable)
    .set({ gpsTriggered: true, etaMinutes: etaMinutes ?? 20, status: "GPS_INCOMING", updatedAt: new Date() })
    .where(eq(baySlotsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Slot not found." }); return; }
  res.json(updated);
});

// ─── POST /api/bay/slots/:id/rush ────────────────────────────────────────────
router.post("/bay/slots/:id/rush", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const slots = await db.select().from(baySlotsTable).where(eq(baySlotsTable.id, id)).limit(1);
  const slot  = slots[0];
  if (!slot) { res.status(404).json({ error: "Slot not found." }); return; }
  if (!slot.techApproved) {
    res.status(403).json({
      error: "Rush blocked. The technician has not marked this vehicle Ready for Display. The bay cycle must complete before dispatch.",
      blocked: true,
    });
    return;
  }
  const [updated] = await db.update(baySlotsTable)
    .set({ rushRequested: true, updatedAt: new Date() })
    .where(eq(baySlotsTable.id, id)).returning();
  res.json(updated);
});

// ─── DELETE /api/bay/slots/:id ────────────────────────────────────────────────
router.delete("/bay/slots/:id", requireAuth, async (req: Request, res: Response) => {
  await db.delete(baySlotsTable).where(eq(baySlotsTable.id, Number(req.params.id)));
  res.json({ ok: true });
});

// ─── POST /api/bay/qr ─────────────────────────────────────────────────────────
router.post("/bay/qr", requireAuth, async (req: Request, res: Response) => {
  const { serviceType, serviceLabel, grossAmountCents, vehicleVin, customerName, notes, runnerId } = req.body as {
    serviceType?: string; serviceLabel?: string; grossAmountCents?: number;
    vehicleVin?: string; customerName?: string; notes?: string; runnerId?: number;
  };
  if (!serviceType || !grossAmountCents || grossAmountCents < 100) {
    res.status(400).json({ error: "serviceType and grossAmountCents (min $1.00) are required." });
    return;
  }
  const user         = (req as Request & { user?: { id: number } }).user;
  const fee          = Math.round(grossAmountCents * FEE_PCT);
  const net          = grossAmountCents - fee;
  const dividend     = runnerId ? Math.round(fee * RUNNER_SPLIT) : 0;
  const qrCode       = makeTxCode();

  const stripePaymentUrl = `https://buy.stripe.com/test_placeholder?amount=${grossAmountCents}&ref=${qrCode}`;

  const [tx] = await db.insert(bayTransactionsTable).values({
    qrCode,
    specialistId:     user?.id ?? 0,
    runnerId:         runnerId ?? null,
    vehicleVin:       vehicleVin?.trim().toUpperCase(),
    serviceType:      serviceType.trim(),
    serviceLabel:     serviceLabel?.trim() ?? serviceType.trim(),
    grossAmountCents,
    feeCents:         fee,
    netAmountCents:   net,
    dividendCents:    dividend,
    stripePaymentUrl,
    customerName:     customerName?.trim(),
    notes:            notes?.trim(),
    status:           "PENDING",
  }).returning();

  res.status(201).json({
    ...tx,
    qrPayload: JSON.stringify({ qr: qrCode, url: stripePaymentUrl, amount: grossAmountCents }),
    feeSummary: {
      gross:    `$${(grossAmountCents / 100).toFixed(2)}`,
      fee:      `$${(fee / 100).toFixed(2)} (3%)`,
      net:      `$${(net / 100).toFixed(2)}`,
      dividend: dividend > 0 ? `$${(dividend / 100).toFixed(2)} → Runner` : "$0.00",
    },
  });
});

// ─── GET /api/bay/qr/all — Dashboard: all transactions (auth required) ────────
router.get("/bay/qr/all", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db.select().from(bayTransactionsTable).orderBy(bayTransactionsTable.createdAt).limit(200);
  const mapped = rows.map(r => ({
    id:               r.id,
    qrCode:           r.qrCode,
    serviceType:      r.serviceType,
    serviceLabel:     r.serviceLabel,
    grossAmountCents: r.grossAmountCents,
    feeCents:         r.feeCents,
    netCents:         r.netAmountCents,
    dividendCents:    r.dividendCents,
    status:           r.status.toLowerCase(),
    customerName:     r.customerName,
    vehicleVin:       r.vehicleVin,
    createdAt:        r.createdAt,
  }));
  res.json(mapped);
});

// ─── GET /api/bay/qr/:qrCode ─────────────────────────────────────────────────
router.get("/bay/qr/:qrCode", async (req: Request, res: Response) => {
  const qrCode = String(req.params["qrCode"] ?? "");
  const rows = await db.select().from(bayTransactionsTable)
    .where(eq(bayTransactionsTable.qrCode, qrCode)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "QR code not found." }); return; }
  res.json(rows[0]);
});

// ─── PATCH /api/bay/qr/:qrCode/paid ──────────────────────────────────────────
router.patch("/bay/qr/:qrCode/paid", requireAuth, async (req: Request, res: Response) => {
  const qrCode = String(req.params["qrCode"] ?? "");
  const { stripePaymentId } = req.body as { stripePaymentId?: string };
  const [updated] = await db.update(bayTransactionsTable)
    .set({ status: "PAID", paidAt: new Date(), stripePaymentId: stripePaymentId ?? null })
    .where(and(eq(bayTransactionsTable.qrCode, qrCode), eq(bayTransactionsTable.status, "PENDING")))
    .returning();
  if (!updated) { res.status(404).json({ error: "QR not found or already processed." }); return; }
  res.json(updated);
});

export default router;
