import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_BASE = "https://api.mapbox.com";

function isLive(): boolean {
  return !!MAPBOX_TOKEN;
}

router.get("/maps/status", (_req: Request, res: Response) => {
  res.json({
    provider: "Mapbox",
    live: isLive(),
    mode: isLive() ? "production" : "demo",
    capabilities: ["geocoding", "directions", "isochrone", "static-maps", "search"],
    description: "Maps, navigation, routing, and location services for transport tracking and dealer locator",
  });
});

router.get("/maps/token", (_req: Request, res: Response) => {
  res.json({
    available: !!MAPBOX_TOKEN,
    mode: MAPBOX_TOKEN ? "live" : "demo",
    message: MAPBOX_TOKEN ? "Mapbox maps active — requests proxied through server" : "Set MAPBOX_ACCESS_TOKEN to enable live maps",
  });
});

router.get("/maps/geocode", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  if (!q) { res.status(400).json({ error: "q (query) is required" }); return; }

  if (isLive()) {
    try {
      const url = `${MAPBOX_BASE}/search/geocode/v6/forward?q=${encodeURIComponent(q)}&access_token=${MAPBOX_TOKEN}&limit=5`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[mapbox] geocode error:", err);
    }
  }

  res.json({
    features: [
      { id: "geo-1", place_name: "3C ONYX HQ, Los Angeles, CA 90028", center: [-118.3287, 34.0928], relevance: 1.0 },
      { id: "geo-2", place_name: "Beverly Hills, CA 90210", center: [-118.4065, 34.0901], relevance: 0.9 },
      { id: "geo-3", place_name: "Malibu, CA 90265", center: [-118.7798, 34.0259], relevance: 0.8 },
    ],
    simulated: true,
  });
});

router.get("/maps/directions", async (req: Request, res: Response) => {
  const origin = req.query.origin as string;
  const destination = req.query.destination as string;
  if (!origin || !destination) {
    res.status(400).json({ error: "origin and destination coordinates required (lng,lat)" });
    return;
  }

  if (isLive()) {
    try {
      const url = `${MAPBOX_BASE}/directions/v5/mapbox/driving/${origin};${destination}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=true`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[mapbox] directions error:", err);
    }
  }

  res.json({
    routes: [{
      distance: 42_500,
      duration: 2_340,
      geometry: { type: "LineString", coordinates: [[-118.3287, 34.0928], [-118.4065, 34.0901], [-118.7798, 34.0259]] },
      legs: [{
        distance: 42_500,
        duration: 2_340,
        summary: "US-101 W",
        steps: [
          { maneuver: { instruction: "Head west on Hollywood Blvd", type: "depart" }, distance: 500, duration: 45 },
          { maneuver: { instruction: "Merge onto US-101 W", type: "merge" }, distance: 38_000, duration: 1_800 },
          { maneuver: { instruction: "Arrive at destination", type: "arrive" }, distance: 0, duration: 0 },
        ],
      }],
    }],
    simulated: true,
  });
});

router.get("/maps/nearby", async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const category = (req.query.category as string) || "auto_repair";
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  if (isLive()) {
    try {
      const url = `${MAPBOX_BASE}/search/searchbox/v1/category/${category}?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&limit=10&language=en`;
      const r = await fetch(url);
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[mapbox] nearby error:", err);
    }
  }

  const categories: Record<string, Array<{ name: string; address: string; distance: number }>> = {
    auto_repair: [
      { name: "3C Certified Body Shop — West LA", address: "11500 W Olympic Blvd", distance: 2.1 },
      { name: "3C Certified Service — Beverly Hills", address: "9100 Wilshire Blvd", distance: 3.4 },
      { name: "3C Certified Detailing — Santa Monica", address: "2800 Main St", distance: 5.7 },
    ],
    gas_station: [
      { name: "Shell — Sunset Strip", address: "8600 Sunset Blvd", distance: 0.8 },
      { name: "Chevron — La Brea", address: "6200 W 3rd St", distance: 1.2 },
    ],
    ev_charging: [
      { name: "Tesla Supercharger — Hollywood", address: "6801 Hollywood Blvd", distance: 1.5 },
      { name: "ChargePoint — Fairfax", address: "6333 W 3rd St", distance: 2.0 },
    ],
  };

  const results = (categories[category] ?? categories.auto_repair).map((r, i) => ({
    id: `nearby-${i}`,
    name: r.name,
    address: r.address,
    coordinates: [lng + (Math.random() - 0.5) * 0.05, lat + (Math.random() - 0.5) * 0.05],
    distance_miles: r.distance,
    category,
  }));

  res.json({ results, simulated: true });
});

router.get("/maps/transport-track/:transportId", (req: Request, res: Response) => {
  const { transportId } = req.params;
  const now = Date.now();
  const progress = Math.min(100, ((now % 86_400_000) / 86_400_000) * 100);

  res.json({
    transportId,
    status: progress > 95 ? "delivered" : "in_transit",
    progress: Math.round(progress),
    currentLocation: {
      lat: 34.0522 + (progress / 100) * 0.5,
      lng: -118.2437 - (progress / 100) * 2.0,
      heading: 280,
      speed_mph: progress > 95 ? 0 : 62,
      updatedAt: new Date().toISOString(),
    },
    origin: { name: "3C ONYX HQ, Los Angeles", lat: 34.0522, lng: -118.2437 },
    destination: { name: "Malibu Beach House", lat: 34.0259, lng: -118.7798 },
    eta: new Date(now + 45 * 60_000).toISOString(),
    driver: { name: "Marcus W.", vehicle: "Ford F-150 Hauler", phone: "•••-•••-4821" },
    simulated: !isLive(),
  });
});

export default router;
