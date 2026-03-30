/**
 * 3C ONYX — Vehicle Inspection Routes (AWS-08 Rekognition)
 * AI-powered vehicle damage detection for Guardian Agent and AR Viewer.
 *
 * POST /api/inspection/analyze   — Analyze vehicle photo for damage
 * GET  /api/inspection/status    — Rekognition provider status
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { inspectVehicle, getRekognitionStatus } from "../lib/rekognition";
import { eventBus } from "../lib/eventBus";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/inspection/status
router.get("/status", (_req, res) => {
  res.json({ ok: true, ...getRekognitionStatus() });
});

// POST /api/inspection/analyze
// Content-Type: application/json with { imageBase64: string, vin?: string, inspectionId?: string }
// OR Content-Type: multipart/form-data with file field 'image'
router.post("/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    let imageBuffer: Buffer;

    if (body["imageBase64"]) {
      // Base64 encoded image (from web/mobile app)
      const b64 = String(body["imageBase64"]).replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(b64, "base64");
    } else {
      // No image provided — run with empty buffer for fallback response
      imageBuffer = Buffer.alloc(0);
    }

    const inspectionId = body["inspectionId"] ? String(body["inspectionId"]) : undefined;
    const vin          = body["vin"] ? String(body["vin"]) : undefined;

    const result = await inspectVehicle(imageBuffer, inspectionId);

    // Publish to Guardian Agent via event bus
    await eventBus.emit("vehicle.inspection.complete", {
      inspectionId: result.inspectionId,
      vin,
      conditionScore:   result.conditionScore,
      overallCondition: result.overallCondition,
      damageCount:      result.damageAreas.length,
      dvpReady:         result.dvpReady,
    });

    // If severe damage found, trigger Guardian Alert
    if (result.overallCondition === "poor") {
      await eventBus.emit("vehicle.alert.guardian", {
        type:         "inspection_failure",
        inspectionId: result.inspectionId,
        vin,
        severity:     "high",
        message:      `Vehicle inspection score: ${result.conditionScore}/100 — ${result.overallCondition}`,
      });
    }

    logger.info({ inspectionId: result.inspectionId, vin, score: result.conditionScore }, "[inspection] Analysis complete");

    res.json({
      ok: true,
      inspection: result,
      dvpReady:   result.dvpReady,
      vin,
    });

  } catch (err) {
    logger.error({ err: (err as Error).message }, "[inspection] Analysis error");
    res.status(500).json({ ok: false, error: "Inspection analysis failed" });
  }
});

export default router;
