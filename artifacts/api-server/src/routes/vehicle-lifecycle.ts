/**
 * 3C Onyx — Vehicle Lifecycle / Digital Twin API
 *
 * GET /api/vehicle/timeline/:vin — Chronological lifecycle of a vehicle
 *
 * Combines: VIN Passports + Bay Transactions + Inspections + Registry events
 * This is the Digital Twin "spine" — every vehicle tells its story.
 */
import { Router, type Request, type Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, vinPassportsTable, bayTransactionsTable, inspectionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

type EventKind = "registration" | "service" | "inspection" | "payment" | "recall" | "upgrade";

interface TimelineEvent {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  amountUsd?: number;
  timestamp: string;
  verifiedOnChain: boolean;
  source: string;
  metadata?: Record<string, unknown>;
}

// ─── GET /api/vehicle/timeline/:vin ────────────────────────────────────────────
router.get("/vehicle/timeline/:vin", requireAuth, async (req: Request, res: Response) => {
  const vin = (req.params["vin"] as string).toUpperCase().trim();

  if (!vin || vin.length < 10) {
    return res.status(400).json({ error: "Invalid VIN" });
  }

  try {
    const events: TimelineEvent[] = [];
    let totalServiceSpend = 0;

    // ── 1. VIN Passport registration record ──────────────────────────────────
    const [passport] = await db
      .select()
      .from(vinPassportsTable)
      .where(eq(vinPassportsTable.vin, vin))
      .limit(1);

    if (passport) {
      events.push({
        id: `passport-${passport.id}`,
        kind: "registration",
        title: `${passport.year ?? ""} ${passport.make ?? ""} ${passport.model ?? ""} — VIN Registered`.trim(),
        description: `Vehicle registered in the ONYX Digital Passport system.${passport.recallCount ? ` ${passport.recallCount} recall(s) on record.` : " No open recalls."}`,
        timestamp: passport.createdAt.toISOString(),
        verifiedOnChain: !!passport.blockchainHash,
        source: "VIN Digital Passport — ONYX Blockchain",
        metadata: {
          make: passport.make,
          model: passport.model,
          year: passport.year,
          fuelType: passport.fuelType,
          engineType: passport.engineType,
          recallCount: passport.recallCount,
          hasOpenRecalls: passport.hasOpenRecalls,
          blockchainHash: passport.blockchainHash,
        },
      });

      // Recall event if applicable
      if (passport.hasOpenRecalls) {
        events.push({
          id: `recall-${passport.id}`,
          kind: "recall",
          title: `Open Recall — ${passport.recallCount} issue(s) flagged`,
          description: `NHTSA has flagged ${passport.recallCount} recall(s) for this vehicle. Guardian AI monitoring active.`,
          timestamp: passport.updatedAt.toISOString(),
          verifiedOnChain: false,
          source: "NHTSA Recall Database",
        });
      }
    }

    // ── 2. Bay transactions (service payments by VIN) ────────────────────────
    const bayTxs = await db
      .select()
      .from(bayTransactionsTable)
      .where(eq(bayTransactionsTable.vehicleVin, vin))
      .orderBy(desc(bayTransactionsTable.createdAt));

    for (const tx of bayTxs) {
      const amountUsd = tx.grossAmountCents / 100;
      if (tx.status === "PAID") totalServiceSpend += amountUsd;
      events.push({
        id: `bay-${tx.id}`,
        kind: tx.status === "PAID" ? "payment" : "service",
        title: `${tx.serviceLabel} — ${tx.status === "PAID" ? "Paid" : tx.status}`,
        description: `${tx.serviceType} service via Smart Bay. Net to specialist: $${(tx.netAmountCents / 100).toFixed(2)}. Platform fee: $${(tx.feeCents / 100).toFixed(2)}.`,
        amountUsd,
        timestamp: tx.createdAt.toISOString(),
        verifiedOnChain: tx.status === "PAID" && !!tx.stripePaymentId,
        source: "Pay-at-the-Bay — Smart Bay System",
        metadata: {
          stripePaymentId: tx.stripePaymentId ?? null,
          specialistId: tx.specialistId,
          runnerId: tx.runnerId ?? null,
          status: tx.status,
          customerName: tx.customerName ?? null,
        },
      });
    }

    // ── 3. Inspections by vehicle label (contains VIN or vehicle name) ───────
    const inspRows = await db
      .select()
      .from(inspectionsTable)
      .where(sql`lower(${inspectionsTable.vehicleLabel}) like lower(${"%" + vin + "%"})`)
      .orderBy(desc(inspectionsTable.createdAt));

    for (const ins of inspRows) {
      const avgCondition = Math.round(
        (ins.conditionFront + ins.conditionRear + ins.conditionDriverSide + ins.conditionPassengerSide + ins.conditionInterior) / 5
      );
      const condLabel = avgCondition >= 8 ? "Excellent" : avgCondition >= 6 ? "Good" : avgCondition >= 4 ? "Fair" : "Poor";
      events.push({
        id: `insp-${ins.id}`,
        kind: "inspection",
        title: `Inspection — ${condLabel} condition`,
        description: `Inspector: ${ins.inspectorName}. Overall score: ${avgCondition}/10. ${ins.odometerConfirmed ? `Odometer: ${ins.odometerConfirmed.toLocaleString()} mi.` : ""}${ins.notes ? ` Notes: ${ins.notes}` : ""}`,
        timestamp: ins.createdAt.toISOString(),
        verifiedOnChain: ins.signed,
        source: "3C Inspection System",
        metadata: {
          front: ins.conditionFront,
          rear: ins.conditionRear,
          driverSide: ins.conditionDriverSide,
          passengerSide: ins.conditionPassengerSide,
          interior: ins.conditionInterior,
          mileage: ins.odometerConfirmed,
          signed: ins.signed,
        },
      });
    }

    // ── 4. Sort newest first ──────────────────────────────────────────────────
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── 5. Health score ───────────────────────────────────────────────────────
    let healthScore = 100;
    if (passport?.hasOpenRecalls) healthScore -= 20;
    if (bayTxs.filter(t => t.status === "FAILED").length > 0) healthScore -= 10;
    if (inspRows.length > 0) {
      const latestInsp = inspRows[0]!;
      const avg = (latestInsp.conditionFront + latestInsp.conditionRear + latestInsp.conditionDriverSide + latestInsp.conditionPassengerSide + latestInsp.conditionInterior) / 5;
      if (avg < 4) healthScore -= 30;
      else if (avg < 6) healthScore -= 15;
    }
    healthScore = Math.max(healthScore, 0);

    const firstSeen = events.length > 0 ? events[events.length - 1]!.timestamp : null;
    const lastActivity = events.length > 0 ? events[0]!.timestamp : null;

    if (events.length === 0) {
      return res.json({
        vin,
        timeline: [],
        totalEvents: 0,
        totalServiceSpend: 0,
        firstSeen: null,
        lastActivity: null,
        healthScore: null,
        digitalTwinReady: false,
        message: "No history recorded yet for this VIN. Every service, inspection, and payment will appear here automatically — immutably and chronologically.",
      });
    }

    return res.json({
      vin,
      timeline: events,
      totalEvents: events.length,
      totalServiceSpend,
      firstSeen,
      lastActivity,
      healthScore,
      digitalTwinReady: true,
      vehicle: passport ? {
        make: passport.make,
        model: passport.model,
        year: passport.year,
        trim: passport.trim,
        fuelType: passport.fuelType,
        aiSummary: passport.aiSummaryEn,
      } : null,
    });
  } catch (err) {
    console.error("[vehicle/timeline]", err);
    return res.status(500).json({ error: "Timeline unavailable" });
  }
});

export default router;
