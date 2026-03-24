/**
 * 3C Spin Studio™ — Spin Media Backend
 *
 * Manages 360° spin capture sessions and frame registries for vehicles.
 * In production this integrates with the object storage layer (S3/R2) for
 * actual multi-part frame uploads. Today it manages session metadata and
 * serves frame inventories.
 *
 * Routes:
 *   GET  /api/spin/session/:vehicleId          — Get spin session for a vehicle
 *   POST /api/spin/session/:vehicleId/start    — Create/reset a spin session
 *   POST /api/spin/session/:vehicleId/frame    — Register a captured frame
 *   POST /api/spin/session/:vehicleId/submit   — Submit completed session
 *   GET  /api/spin/stats                       — Platform-wide spin stats
 */
import { Router, type Request, type Response } from "express";
import crypto from "crypto";

const router = Router();

type FrameStatus = "pending" | "captured" | "rejected";
type SessionStatus = "scheduled" | "in_progress" | "complete" | "review";

interface SpinFrame {
  frameId:   string;
  position:  number;    // 0–35 (every 10°) or 0–17 (every 20°)
  angleDeg:  number;
  label:     string;
  status:    FrameStatus;
  capturedAt?: string;
  url?:      string;
}

interface SpinSession {
  sessionId:  string;
  vehicleId:  string;
  vehicleName: string;
  status:     SessionStatus;
  runnerId:   string;
  frameCount: number;
  frames:     SpinFrame[];
  createdAt:  string;
  updatedAt:  string;
  completedAt?: string;
}

const POSITION_LABELS: Record<number, string> = {
  0: "Front Center", 20: "Front Right", 40: "Front-Right Quarter",
  60: "Right Side A", 80: "Right Side B", 100: "Rear-Right Quarter",
  120: "Rear Right", 140: "Rear Center", 160: "Rear Left",
  180: "Rear-Left Quarter", 200: "Left Side A", 220: "Left Side B",
  240: "Front-Left Quarter", 260: "Front Left", 280: "Front Center Alt",
  300: "Hood / Roof", 320: "Interior Front", 340: "Interior Rear",
};

function buildFrames(count = 18): SpinFrame[] {
  const step = Math.floor(360 / count);
  return Array.from({ length: count }, (_, i) => {
    const deg = i * step;
    return {
      frameId:  `fr-${Date.now().toString(36)}-${i}`,
      position: i,
      angleDeg: deg,
      label:    POSITION_LABELS[deg] ?? `${deg}°`,
      status:   "pending" as FrameStatus,
    };
  });
}

// In-memory spin session store (extend to DB/S3 in production)
const sessions = new Map<string, SpinSession>();

// Seed two sessions for the demo vehicles
const seed = (vehicleId: string, vehicleName: string, runnerId = "runner-001") => {
  if (!sessions.has(vehicleId)) {
    sessions.set(vehicleId, {
      sessionId:   `spin-${crypto.randomBytes(4).toString("hex")}`,
      vehicleId,
      vehicleName,
      status:      "scheduled",
      runnerId,
      frameCount:  18,
      frames:      buildFrames(18),
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });
  }
};
seed("veh-001", "2022 Porsche 911 Carrera S");
seed("veh-002", "2021 Aston Martin Vantage");

// GET /api/spin/session/:vehicleId
router.get("/spin/session/:vehicleId", (req: Request, res: Response) => {
  const vehicleId = req.params["vehicleId"] as string;
  const session = sessions.get(vehicleId);
  if (!session) {
    res.status(404).json({ error: "No spin session found for this vehicle", vehicleId }); return;
  }
  const capturedCount = session.frames.filter((f) => f.status === "captured").length;
  res.json({
    ...session,
    capturedCount,
    progress: Math.round((capturedCount / session.frameCount) * 100),
    ready:    session.status === "complete",
  });
});

// POST /api/spin/session/:vehicleId/start
router.post("/spin/session/:vehicleId/start", (req: Request, res: Response) => {
  const vehicleId = req.params["vehicleId"] as string;
  const { vehicleName = "Vehicle", runnerId = "runner-001", frameCount = 18 } = req.body as {
    vehicleName?: string; runnerId?: string; frameCount?: number;
  };

  const session: SpinSession = {
    sessionId:  `spin-${crypto.randomBytes(4).toString("hex")}`,
    vehicleId,
    vehicleName,
    status:     "in_progress",
    runnerId,
    frameCount,
    frames:     buildFrames(frameCount),
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
  };
  sessions.set(vehicleId, session);
  res.json({ sessionId: session.sessionId, vehicleId, status: "in_progress", frameCount, frames: session.frames });
});

// POST /api/spin/session/:vehicleId/frame
router.post("/spin/session/:vehicleId/frame", (req: Request, res: Response) => {
  const vehicleId = req.params["vehicleId"] as string;
  const session = sessions.get(vehicleId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const { position, url } = req.body as { position: number; url?: string };
  const frame = session.frames.find((f) => f.position === position);
  if (!frame) { res.status(400).json({ error: `Frame position ${position} not found in session` }); return; }

  frame.status      = "captured";
  frame.capturedAt  = new Date().toISOString();
  if (url) frame.url = url;

  session.status    = "in_progress";
  session.updatedAt = new Date().toISOString();

  const capturedCount = session.frames.filter((f) => f.status === "captured").length;
  res.json({
    frameId: frame.frameId, position, status: "captured",
    capturedCount, total: session.frameCount,
    progress: Math.round((capturedCount / session.frameCount) * 100),
  });
});

// POST /api/spin/session/:vehicleId/submit
router.post("/spin/session/:vehicleId/submit", (req: Request, res: Response) => {
  const vehicleId = req.params["vehicleId"] as string;
  const session = sessions.get(vehicleId);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const capturedCount = session.frames.filter((f) => f.status === "captured").length;
  session.status      = capturedCount >= session.frameCount * 0.8 ? "complete" : "review";
  session.completedAt = new Date().toISOString();
  session.updatedAt   = new Date().toISOString();

  res.json({
    sessionId:    session.sessionId,
    vehicleId,
    status:       session.status,
    capturedCount,
    total:        session.frameCount,
    progress:     Math.round((capturedCount / session.frameCount) * 100),
    ready:        session.status === "complete",
    message:      session.status === "complete"
      ? "Spin session complete. 360° viewer now active for this vehicle."
      : "Session submitted for review. Partial spin available.",
  });
});

// GET /api/spin/stats
router.get("/spin/stats", (_req: Request, res: Response) => {
  const all = Array.from(sessions.values());
  res.json({
    totalSessions:    all.length,
    completeSessions: all.filter((s) => s.status === "complete").length,
    inProgress:       all.filter((s) => s.status === "in_progress").length,
    scheduled:        all.filter((s) => s.status === "scheduled").length,
    totalFramesCaptured: all.reduce((sum, s) => sum + s.frames.filter((f) => f.status === "captured").length, 0),
    vehiclesWithSpin: all.filter((s) => s.status === "complete").map((s) => s.vehicleId),
    ts: new Date().toISOString(),
  });
});

export default router;
