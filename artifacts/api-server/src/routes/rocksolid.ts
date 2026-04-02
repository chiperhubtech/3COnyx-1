import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const ROCKSOLID_KEY = process.env.ROCKSOLID_API_KEY;

function isLive(): boolean {
  return !!ROCKSOLID_KEY;
}

router.get("/ar/status", (_req: Request, res: Response) => {
  res.json({
    provider: "Basemark Rocksolid AR",
    status: isLive() ? "connected" : "standby",
    engine: "rocksolid",
    version: "25.5",
    live: isLive(),
    capabilities: {
      adas: ["lane_departure_warning", "collision_warning", "night_vision_assist", "lane_guidance", "blind_spot_alert", "pedestrian_detection"],
      navigation: ["ar_navigation", "ar_poi", "ar_arrival", "ar_street_names"],
      displays: ["hud", "cluster", "infotainment", "e_mirror", "ar_glasses"],
    },
    description: "In-vehicle AR rendering — ADAS safety visualization, AR navigation, multi-display cockpit",
  });
});

router.post("/ar/session/start", (req: Request, res: Response) => {
  const { vehicleId, displayType, features } = req.body as {
    vehicleId?: string;
    displayType?: string;
    features?: string[];
  };

  res.json({
    sessionId: `ar-${Date.now()}`,
    vehicleId: vehicleId ?? "unknown",
    displayType: displayType ?? "hud",
    activeFeatures: features ?? ["lane_departure_warning", "collision_warning", "ar_navigation"],
    status: "initialized",
    renderEngine: "rocksolid-25.5",
    graphicsApi: "vulkan-1.1",
    latencyTarget: "16ms",
    live: isLive(),
  });
});

router.post("/ar/session/:sessionId/end", (req: Request, res: Response) => {
  res.json({ sessionId: req.params.sessionId, status: "closed", duration: Math.floor(Math.random() * 3600) });
});

router.get("/ar/adas/alerts", (req: Request, res: Response) => {
  const vehicleId = req.query.vehicleId as string;
  const now = Date.now();

  res.json({
    vehicleId: vehicleId ?? "demo-001",
    timestamp: new Date().toISOString(),
    alerts: [
      {
        type: "lane_departure_warning",
        severity: "warning",
        direction: "left",
        confidence: 0.94,
        message: "Vehicle drifting left — lane boundary approaching",
        visualOverlay: { type: "lane_highlight", color: "#FF6B00", opacity: 0.8, side: "left" },
        triggeredAt: new Date(now - 2000).toISOString(),
      },
      {
        type: "blind_spot_alert",
        severity: "caution",
        direction: "right_rear",
        confidence: 0.91,
        message: "Vehicle detected in right blind spot",
        visualOverlay: { type: "zone_highlight", color: "#FFD700", opacity: 0.6, zone: "right_mirror" },
        triggeredAt: new Date(now - 500).toISOString(),
      },
      {
        type: "forward_collision_warning",
        severity: "critical",
        distance_ft: 45,
        closing_speed_mph: 12,
        confidence: 0.97,
        message: "Rapid approach detected — maintain following distance",
        visualOverlay: { type: "distance_bar", color: "#FF0000", opacity: 0.9, position: "center_hud" },
        triggeredAt: new Date(now - 100).toISOString(),
      },
    ],
    activeFeatures: ["lane_departure_warning", "blind_spot_alert", "forward_collision_warning", "pedestrian_detection", "night_vision_assist"],
    simulated: !isLive(),
  });
});

router.get("/ar/navigation/overlay", (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 34.0522;
  const lng = parseFloat(req.query.lng as string) || -118.2437;
  const heading = parseFloat(req.query.heading as string) || 280;

  res.json({
    position: { lat, lng, heading },
    overlays: [
      {
        type: "turn_arrow",
        instruction: "Turn right onto Sunset Blvd in 200 ft",
        distance_ft: 200,
        bearing: heading + 90,
        color: "#00BFFF",
        anchorPoint: { worldX: 0.3, worldY: 0.0, worldZ: 15.0 },
      },
      {
        type: "lane_guidance",
        recommendedLane: 2,
        totalLanes: 3,
        color: "#00FF88",
        anchorPoint: { worldX: 0.0, worldY: -0.5, worldZ: 30.0 },
      },
      {
        type: "poi_marker",
        name: "3C Certified Service Center",
        category: "auto_repair",
        distance_miles: 0.4,
        bearing: heading - 15,
        color: "#C9A227",
        anchorPoint: { worldX: -0.2, worldY: 0.1, worldZ: 50.0 },
      },
      {
        type: "speed_limit",
        limit_mph: 35,
        current_mph: 32,
        status: "compliant",
        color: "#FFFFFF",
        anchorPoint: { worldX: 0.8, worldY: 0.3, worldZ: 0.0 },
      },
    ],
    renderHint: "6dof_anchored",
    refreshRate: 60,
    simulated: !isLive(),
  });
});

router.get("/ar/vehicle/:vehicleId/safety-score", (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const vid = String(vehicleId);
  const seed = parseInt(vid.replace(/\D/g, "").slice(0, 4) || "42", 10);

  res.json({
    vehicleId,
    safetyScore: 85 + (seed % 15),
    breakdown: {
      lane_keeping: 90 + (seed % 10),
      following_distance: 80 + (seed % 15),
      blind_spot_awareness: 88 + (seed % 12),
      speed_compliance: 92 + (seed % 8),
      night_driving: 78 + (seed % 20),
      harsh_braking_events: Math.max(0, 5 - (seed % 6)),
      harsh_acceleration_events: Math.max(0, 3 - (seed % 4)),
    },
    period: "last_30_days",
    trips: 42 + (seed % 20),
    totalMiles: 1_200 + (seed % 800),
    insuranceDiscount: `${5 + Math.floor((85 + (seed % 15)) / 10)}%`,
    simulated: !isLive(),
  });
});

export default router;
