/**
 * 3C ONYX — Dealer Connector Routes
 * ORA-01: Oracle OIC dealer management system integration
 *
 * GET  /api/dealers/status            — Connector status + supported DMS
 * GET  /api/dealers/:dealerId/inventory — Fetch live dealer inventory
 * POST /api/dealers/:dealerId/leads   — Submit member lead to dealer CRM
 * GET  /api/dealers/:dealerId/slots   — Get available service slots
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  getDealerInventory,
  submitDealerLead,
  getDealerServiceSlots,
  getDealerConnectorStatus,
  type DmsProvider,
} from "../lib/dealerConnectors";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/dealers/status
router.get("/status", (_req, res) => {
  res.json({
    ok:     true,
    status: getDealerConnectorStatus(),
  });
});

// GET /api/dealers/:dealerId/inventory
router.get("/:dealerId/inventory", requireAuth, async (req, res) => {
  try {
    const dealerId = String(req.params["dealerId"] ?? "");
    const dmsProvider = (String(req.query["dms"] ?? "cdk")) as DmsProvider;

    const inventory = await getDealerInventory({ dealerId, dmsProvider });

    res.json({
      ok:       true,
      dealerId,
      dms:      dmsProvider,
      count:    inventory.length,
      inventory,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message, path: req.path }, "[dealers] Inventory fetch error");
    res.status(500).json({ ok: false, error: "Inventory unavailable" });
  }
});

// POST /api/dealers/:dealerId/leads
router.post("/:dealerId/leads", requireAuth, async (req, res) => {
  try {
    const dealerId = String(req.params["dealerId"] ?? "");
    const dmsProvider = (String(req.body["dms"] ?? "cdk")) as DmsProvider;
    const body = req.body as Record<string, unknown>;

    const result = await submitDealerLead(
      { dealerId, dmsProvider },
      {
        memberId:            String(body["memberId"] ?? ""),
        memberName:          String(body["memberName"] ?? ""),
        memberEmail:         String(body["memberEmail"] ?? ""),
        memberPhone:         body["memberPhone"] ? String(body["memberPhone"]) : undefined,
        vehicleVin:          body["vehicleVin"] ? String(body["vehicleVin"]) : undefined,
        stockNumber:         body["stockNumber"] ? String(body["stockNumber"]) : undefined,
        intent:              (body["intent"] as "purchase" | "trade_in" | "finance" | "lease" | "service") ?? "purchase",
        source:              "3c-onyx",
        notes:               body["notes"] ? String(body["notes"]) : undefined,
        dynastyFeeEligible:  body["dynastyFeeEligible"] !== false,
      },
    );

    res.status(result.success ? 201 : 500).json({ ok: result.success, ...result });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[dealers] Lead submission error");
    res.status(500).json({ ok: false, error: "Lead submission failed" });
  }
});

// GET /api/dealers/:dealerId/slots
router.get("/:dealerId/slots", requireAuth, async (req, res) => {
  try {
    const dealerId    = String(req.params["dealerId"] ?? "");
    const dmsProvider = (String(req.query["dms"] ?? "cdk")) as DmsProvider;
    const serviceType = String(req.query["serviceType"] ?? "oil_change");
    const date        = String(req.query["date"] ?? new Date().toISOString().slice(0, 10));

    const slots = await getDealerServiceSlots({ dealerId, dmsProvider }, serviceType, date);
    res.json({ ok: true, dealerId, date, serviceType, slots });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[dealers] Slots fetch error");
    res.status(500).json({ ok: false, error: "Slot availability unavailable" });
  }
});

export default router;
