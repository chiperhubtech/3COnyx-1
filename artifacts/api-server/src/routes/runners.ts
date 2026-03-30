/**
 * 3C ONYX — Runner Location Routes (AWS-10 Amazon Location Service)
 * Replaces HyperTrack external dependency. Member and runner location data
 * stays inside AWS — sovereign, 80% cheaper at scale.
 *
 * POST /api/runners/location          — Runner updates their GPS position
 * GET  /api/runners/location/:id      — Get specific runner position
 * GET  /api/runners/active            — Get all active runners (for dispatch map)
 * GET  /api/runners/nearest           — Find nearest available runner
 * GET  /api/runners/status            — Location service status
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  updateRunnerPosition,
  getRunnerPosition,
  getAllActiveRunners,
  findNearestRunner,
  calculateETA,
  getLocationStatus,
  type RunnerPosition,
} from "../lib/locationService";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/runners/status
router.get("/status", (_req, res) => {
  res.json({ ok: true, ...getLocationStatus() });
});

// POST /api/runners/location — Runner app calls this every 30 seconds
router.post("/location", requireAuth, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    const pos: RunnerPosition = {
      runnerId:  String(body["runnerId"] ?? ""),
      lat:       Number(body["lat"]),
      lng:       Number(body["lng"]),
      accuracy:  body["accuracy"] ? Number(body["accuracy"]) : undefined,
      heading:   body["heading"]  ? Number(body["heading"])  : undefined,
      speed:     body["speed"]    ? Number(body["speed"])    : undefined,
      status:    (body["status"] as RunnerPosition["status"]) ?? "available",
      missionId: body["missionId"] ? String(body["missionId"]) : undefined,
      updatedAt: new Date().toISOString(),
    };

    if (!pos.runnerId || !pos.lat || !pos.lng) {
      res.status(400).json({ ok: false, error: "runnerId, lat, lng are required" });
      return;
    }

    await updateRunnerPosition(pos);
    res.json({ ok: true, runnerId: pos.runnerId, updatedAt: pos.updatedAt });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[runners] Location update error");
    res.status(500).json({ ok: false, error: "Location update failed" });
  }
});

// GET /api/runners/location/:id
router.get("/location/:id", requireAuth, async (req, res) => {
  try {
    const pos = await getRunnerPosition(String(req.params["id"] ?? ""));
    if (!pos) {
      res.status(404).json({ ok: false, error: "Runner not found or not yet tracked" });
      return;
    }
    res.json({ ok: true, position: pos });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[runners] Get position error");
    res.status(500).json({ ok: false, error: "Position unavailable" });
  }
});

// GET /api/runners/active
router.get("/active", requireAuth, async (_req, res) => {
  try {
    const runners = await getAllActiveRunners();
    res.json({ ok: true, count: runners.length, runners });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[runners] Get active runners error");
    res.status(500).json({ ok: false, error: "Active runners unavailable" });
  }
});

// GET /api/runners/nearest?lat=25.7617&lng=-80.1918
router.get("/nearest", requireAuth, async (req, res) => {
  try {
    const lat = Number(req.query["lat"]);
    const lng = Number(req.query["lng"]);

    if (!lat || !lng) {
      res.status(400).json({ ok: false, error: "lat and lng query params required" });
      return;
    }

    const result = await findNearestRunner(lat, lng);
    if (!result) {
      res.json({ ok: true, found: false, message: "No available runners in range" });
      return;
    }

    res.json({
      ok:          true,
      found:       true,
      runner:      result.runner,
      etaMinutes:  result.etaMinutes,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[runners] Nearest runner error");
    res.status(500).json({ ok: false, error: "Runner search failed" });
  }
});

// GET /api/runners/eta?runnerLat=25.7617&runnerLng=-80.1918&destLat=25.78&destLng=-80.21
router.get("/eta", async (req, res) => {
  try {
    const rLat = Number(req.query["runnerLat"]);
    const rLng = Number(req.query["runnerLng"]);
    const dLat = Number(req.query["destLat"]);
    const dLng = Number(req.query["destLng"]);

    if (!rLat || !rLng || !dLat || !dLng) {
      res.status(400).json({ ok: false, error: "runnerLat, runnerLng, destLat, destLng required" });
      return;
    }

    const etaMinutes = calculateETA(rLat, rLng, dLat, dLng);
    res.json({ ok: true, etaMinutes });
  } catch (err) {
    res.status(500).json({ ok: false, error: "ETA calculation failed" });
  }
});

export default router;
