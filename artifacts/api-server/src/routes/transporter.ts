/**
 * 3C ONYX — Transporter Agent Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCHITECT: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 * PATENT: PAT-08 — Cross-Border Asset Fulfillment System
 *
 * "The distance is invisible to the customer."
 *
 * POST /api/transport/quote              — VIN + dest ZIP → full logistics quote
 * GET  /api/transport/:shipmentId        — Get shipment status + timeline
 * PUT  /api/transport/:shipmentId/status — Advance shipment to next status
 * GET  /api/transport/active             — All active shipments
 * GET  /api/transport/status             — Transporter Agent system status
 */

import { Router, type Request, type Response } from "express";
import { eq, ne, and } from "drizzle-orm";
import { db, shipmentOrdersTable } from "@workspace/db";
import {
  generateShipmentQuote,
  buildShipmentId,
  getTransporterStatus,
} from "../lib/transporterAgent";
import { eventBus } from "../lib/eventBus";
import { logger } from "../lib/logger";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transport/status
// ─────────────────────────────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  return res.json({ ok: true, ...getTransporterStatus() });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transport/quote
// Body: { vin, vehicleLabel?, originZip, destZip, buyerName?, buyerPhone?, dealBundleId? }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/quote", async (req: Request, res: Response) => {
  const { vin, vehicleLabel, originZip, destZip, buyerName, buyerPhone, buyerEmail, dealBundleId } = req.body as {
    vin?:          string;
    vehicleLabel?: string;
    originZip?:    string;
    destZip?:      string;
    buyerName?:    string;
    buyerPhone?:   string;
    buyerEmail?:   string;
    dealBundleId?: string;
  };

  if (!vin)       return res.status(400).json({ error: "VIN is required" });
  if (!originZip) return res.status(400).json({ error: "Origin ZIP is required" });
  if (!destZip)   return res.status(400).json({ error: "Destination ZIP is required — the platform needs to know where we're sending this vehicle" });

  try {
    const quote = generateShipmentQuote({ vin, vehicleLabel, originZip, destZip, buyerName });

    // Persist to DB
    await db.insert(shipmentOrdersTable).values({
      shipmentId:    quote.shipmentId,
      vin:           quote.vin,
      vehicleLabel:  quote.vehicleLabel,
      buyerName:     buyerName ?? null,
      buyerPhone:    buyerPhone ?? null,
      buyerEmail:    buyerEmail ?? null,
      originZip:     quote.origin.zip,
      originCity:    quote.origin.city,
      originState:   quote.origin.state,
      originLat:     String(quote.origin.lat),
      originLng:     String(quote.origin.lng),
      destZip:       quote.destination.zip,
      destCity:      quote.destination.city,
      destState:     quote.destination.state,
      destLat:       String(quote.destination.lat),
      destLng:       String(quote.destination.lng),
      distanceMiles: String(quote.distanceMiles),
      isInterstate:  quote.isInterstate,
      crossedStates: quote.crossedStates,
      bestPath:      quote.bestPath,
      providerName:  quote.provider.name,
      providerRating:String(quote.provider.rating),
      providerDot:   quote.provider.dot,
      providerPhone: quote.provider.phone,
      shipmentType:  quote.provider.type,
      quotedCostUsd: String(quote.quotedCostUsd),
      dynastyLogisticsFeeUsd: String(quote.dynastyLogisticsFee),
      feeRatePct:    "3.00",
      dealBundleId:  dealBundleId ?? null,
      status:        "QuoteRequested",
      complianceNotes: quote.compliance,
      titleStateReqs: quote.compliance.notes,
      timelineEvents: quote.timeline,
      dvpVerified:   false,
    });

    // Emit event to the everything-logged feed
    await eventBus.emit("runner.dispatched", {
      shipmentId: quote.shipmentId,
      vin:        quote.vin,
      provider:   quote.provider.name,
      distanceMiles: quote.distanceMiles,
      isInterstate:  quote.isInterstate,
      destState:  quote.destination.stateCode,
    });

    return res.status(201).json({
      success:  true,
      message:  quote.isInterstate
        ? `Interstate shipment quote confirmed. The platform is handling the ${quote.distanceMiles.toLocaleString()} miles from ${quote.origin.city}, ${quote.origin.stateCode} to ${quote.destination.city}, ${quote.destination.stateCode}.`
        : `Local delivery quote confirmed. ${quote.distanceMiles} miles from ${quote.origin.city} to ${quote.destination.city}.`,
      quote,
      nextStep: {
        action:   "CONFIRM SHIPMENT → POST /api/transport/{shipmentId}/confirm",
        note:     `Confirming assigns ${quote.provider.name} and initiates the logistics timeline in the everything-logged feed.`,
      },
      sovereign: {
        architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
        patent:    "PAT-08: Cross-Border Asset Fulfillment System",
      },
    });
  } catch (err) {
    logger.error({ err, vin, originZip, destZip }, "[transporter] Quote generation failed");
    return res.status(500).json({ error: "Quote generation failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transport/:shipmentId/confirm — Confirm quote → assign provider
// ─────────────────────────────────────────────────────────────────────────────

router.post("/:shipmentId/confirm", async (req: Request, res: Response) => {
  const { shipmentId } = req.params as { shipmentId: string };

  const [shipment] = await db
    .select()
    .from(shipmentOrdersTable)
    .where(eq(shipmentOrdersTable.shipmentId, shipmentId))
    .limit(1);

  if (!shipment) return res.status(404).json({ error: `Shipment ${shipmentId} not found` });
  if (shipment.status !== "QuoteRequested") return res.status(409).json({ error: `Shipment already confirmed (status: ${shipment.status})` });

  await db.update(shipmentOrdersTable)
    .set({
      status:             "ProviderAssigned",
      providerAssignedAt: new Date(),
      updatedAt:          new Date(),
    })
    .where(eq(shipmentOrdersTable.shipmentId, shipmentId));

  await eventBus.emit("runner.dispatched", {
    shipmentId,
    vin:      shipment.vin,
    event:    "ProviderAssigned",
    provider: shipment.providerName,
  });

  return res.json({
    success:  true,
    shipmentId,
    status:   "ProviderAssigned",
    message:  `${shipment.providerName} confirmed. Pickup scheduled from ${shipment.originCity}, ${shipment.originState}. Vehicle will be in transit shortly.`,
    provider: {
      name:    shipment.providerName,
      dot:     shipment.providerDot,
      phone:   shipment.providerPhone,
      rating:  shipment.providerRating,
    },
    trackingUrl: `/api/transport/${shipmentId}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transport/:shipmentId/status — Advance shipment status
// Body: { status, note? }
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_ORDER = [
  "QuoteRequested", "ProviderAssigned", "PickupScheduled",
  "VehiclePickedUp", "InTransit", "CrossedStateLine",
  "FinalMileDelivery", "Delivered", "DVPStamped",
];

router.put("/:shipmentId/status", async (req: Request, res: Response) => {
  const { shipmentId } = req.params as { shipmentId: string };
  const { status, note } = req.body as { status?: string; note?: string };

  if (!status || !STATUS_ORDER.includes(status)) {
    return res.status(400).json({ error: "Invalid status", validStatuses: STATUS_ORDER });
  }

  const [shipment] = await db
    .select()
    .from(shipmentOrdersTable)
    .where(eq(shipmentOrdersTable.shipmentId, shipmentId))
    .limit(1);

  if (!shipment) return res.status(404).json({ error: `Shipment ${shipmentId} not found` });

  const existingEvents = Array.isArray(shipment.timelineEvents) ? shipment.timelineEvents as object[] : [];
  const newEvent = { ts: new Date().toISOString(), status, note: note ?? status, actor: "Transporter Agent" };

  const updates: Record<string, unknown> = {
    status,
    timelineEvents: [...existingEvents, newEvent],
    updatedAt:      new Date(),
  };

  if (status === "VehiclePickedUp")    updates.pickedUpAt   = new Date();
  if (status === "Delivered")          updates.deliveredAt  = new Date();
  if (status === "DVPStamped")         { updates.dvpStampedAt = new Date(); updates.dvpVerified = true; }

  await db.update(shipmentOrdersTable).set(updates).where(eq(shipmentOrdersTable.shipmentId, shipmentId));

  await eventBus.emit("runner.location.updated", {
    shipmentId,
    vin:    shipment.vin,
    status,
    note:   note ?? status,
  });

  return res.json({
    success:   true,
    shipmentId,
    status,
    message:   `Shipment ${shipmentId} advanced to: ${status}`,
    dvpUpdate: status === "DVPStamped" ? "Digital Vehicle Passport stamped — ownership transfer complete" : null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transport/active — All active shipments (not DVPStamped / Cancelled)
// NOTE: Must be defined BEFORE /:shipmentId to avoid "active" matching as ID
// ─────────────────────────────────────────────────────────────────────────────

router.get("/active", async (_req: Request, res: Response) => {
  const active = await db
    .select()
    .from(shipmentOrdersTable)
    .where(
      and(
        ne(shipmentOrdersTable.status, "DVPStamped"),
        ne(shipmentOrdersTable.status, "Cancelled"),
      )
    )
    .limit(50);

  return res.json({
    count: active.length,
    shipments: active.map(s => ({
      shipmentId:   s.shipmentId,
      vin:          s.vin,
      vehicleLabel: s.vehicleLabel,
      buyer:        s.buyerName,
      status:       s.status,
      route:        `${s.originCity}, ${s.originState} → ${s.destCity}, ${s.destState}`,
      miles:        s.distanceMiles,
      provider:     s.providerName,
      interstate:   s.isInterstate,
      dvpVerified:  s.dvpVerified,
    })),
    sovereign: {
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
      patent:    "PAT-08: Cross-Border Asset Fulfillment System",
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transport/:shipmentId — Full shipment detail + live timeline
// ─────────────────────────────────────────────────────────────────────────────

router.get("/:shipmentId", async (req: Request, res: Response) => {
  const { shipmentId } = req.params as { shipmentId: string };

  const [shipment] = await db
    .select()
    .from(shipmentOrdersTable)
    .where(eq(shipmentOrdersTable.shipmentId, shipmentId))
    .limit(1);

  if (!shipment) return res.status(404).json({ error: `Shipment ${shipmentId} not found` });

  const currentStep    = STATUS_ORDER.indexOf(shipment.status);
  const progressPct    = Math.round((currentStep / (STATUS_ORDER.length - 1)) * 100);
  const isComplete     = shipment.status === "DVPStamped" || shipment.status === "Delivered";

  return res.json({
    shipmentId,
    vin:          shipment.vin,
    vehicleLabel: shipment.vehicleLabel,
    buyer:        shipment.buyerName,
    status:       shipment.status,
    progressPct,
    isComplete,
    route: {
      from:      `${shipment.originCity}, ${shipment.originState} ${shipment.originZip}`,
      to:        `${shipment.destCity}, ${shipment.destState} ${shipment.destZip}`,
      miles:     shipment.distanceMiles,
      path:      shipment.bestPath,
      states:    shipment.crossedStates,
      interstate:shipment.isInterstate,
    },
    provider: {
      name:   shipment.providerName,
      dot:    shipment.providerDot,
      phone:  shipment.providerPhone,
      rating: shipment.providerRating,
      type:   shipment.shipmentType,
    },
    financials: {
      transportCost:    `$${parseFloat(String(shipment.quotedCostUsd ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      dynastyFee:       `$${parseFloat(String(shipment.dynastyLogisticsFeeUsd ?? 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      feeNote:          "3% Dynasty Logistics Fee — platform management, carrier vetting, compliance routing",
    },
    compliance:       shipment.complianceNotes,
    titleStateReqs:   shipment.titleStateReqs,
    dvpVerified:      shipment.dvpVerified,
    timeline:         shipment.timelineEvents,
    timestamps: {
      quoted:    shipment.quoteRequestedAt,
      assigned:  shipment.providerAssignedAt,
      pickedUp:  shipment.pickedUpAt,
      delivered: shipment.deliveredAt,
      dvpStamped:shipment.dvpStampedAt,
    },
    sovereign: {
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
      patent:    "PAT-08: Cross-Border Asset Fulfillment System",
    },
  });
});

export default router;
