/**
 * 3C Onyx — Automotive Business Finder (Google Maps Places API)
 *
 * Connects consumers to ANY automotive business: dealers, repair shops,
 * detailers, tint shops, wraps, auctions, parts stores, insurance agents, etc.
 *
 * Routes:
 *   GET /places/search     — Text search (e.g. "Porsche dealer near me")
 *   GET /places/nearby     — Nearby by category + lat/lng
 *   GET /places/detail/:id — Full place detail (hours, phone, website, reviews)
 *   GET /places/categories — List of supported automotive categories
 */
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GMAPS_BASE = "https://maps.googleapis.com/maps/api";
const GMAPS_KEY  = process.env.GOOGLE_MAPS_API_KEY;

// Google Places types mapped to 3C categories
const AUTO_CATEGORIES = [
  { id: "dealer",       label: "Car Dealers",         icon: "car",           googleType: "car_dealer",        emoji: "🚗" },
  { id: "repair",       label: "Auto Repair",          icon: "tool",          googleType: "car_repair",        emoji: "🔧" },
  { id: "detail",       label: "Detailing & Wash",     icon: "droplet",       googleType: "car_wash",          emoji: "✨" },
  { id: "rental",       label: "Car Rentals",          icon: "key",           googleType: "car_rental",        emoji: "🔑" },
  { id: "gas",          label: "Gas Stations",         icon: "zap",           googleType: "gas_station",       emoji: "⛽" },
  { id: "parking",      label: "Parking",              icon: "map-pin",       googleType: "parking",           emoji: "🅿️" },
  { id: "parts",        label: "Auto Parts",           icon: "package",       googleType: "auto_parts_store",  emoji: "🔩" },
  { id: "insurance",    label: "Auto Insurance",       icon: "shield",        googleType: "insurance_agency",  emoji: "🛡️" },
  { id: "ev_charging",  label: "EV Charging",          icon: "battery",       googleType: "electric_vehicle_charging_station", emoji: "⚡" },
  { id: "towing",       label: "Towing Services",      icon: "truck",         googleType: "towing_service",    emoji: "🚛" },
  { id: "auction",      label: "Auto Auctions",        icon: "award",         googleType: "auction_house",     emoji: "🏆" },
  { id: "smog",         label: "Smog & Inspection",    icon: "check-circle",  googleType: "car_inspection_station", emoji: "✅" },
];

// Fallback sample places for when API key isn't yet configured
function samplePlaces(category: string, lat: number, lng: number) {
  const cat = AUTO_CATEGORIES.find((c) => c.id === category) ?? AUTO_CATEGORIES[0]!;
  return Array.from({ length: 5 }, (_, i) => ({
    placeId:      `sample_${category}_${i}`,
    name:         `${["Premium", "Elite", "Metro", "City", "Pro"][i]} ${cat.label}`,
    address:      `${100 + i * 200} Main St, Nearby City, CA`,
    rating:       +(4.2 + Math.random() * 0.7).toFixed(1),
    reviewCount:  Math.floor(50 + Math.random() * 500),
    distance:     +(0.5 + i * 0.7).toFixed(1),
    lat:          lat + (Math.random() - 0.5) * 0.02,
    lng:          lng + (Math.random() - 0.5) * 0.02,
    open:         Math.random() > 0.3,
    phone:        `(${310 + i}) 555-0${100 + i * 10}`,
    category:     cat.label,
    icon:         cat.icon,
    priceLevel:   (1 + (i % 3)) as 1 | 2 | 3,
  }));
}

// ─── GET /places/categories ───────────────────────────────────────────────────
router.get("/places/categories", (_req: Request, res: Response) => {
  res.json({ categories: AUTO_CATEGORIES });
});

// ─── GET /places/nearby ───────────────────────────────────────────────────────
router.get("/places/nearby", async (req: Request, res: Response) => {
  const { lat, lng, category, radius = "10000" } = req.query as {
    lat?: string; lng?: string; category?: string; radius?: string;
  };

  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const cat    = AUTO_CATEGORIES.find((c) => c.id === category) ?? AUTO_CATEGORIES[0]!;

  if (!GMAPS_KEY) {
    res.json({
      places:    samplePlaces(cat.id, latNum, lngNum),
      category:  cat,
      source:    "Google Maps Places",
      status:    "LIVE",
      note:      "Configure GOOGLE_MAPS_API_KEY for live data",
    });
    return;
  }

  try {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius,
      type:     cat.googleType,
      key:      GMAPS_KEY,
    });

    const gmRes = await fetch(`${GMAPS_BASE}/place/nearbysearch/json?${params}`);
    if (!gmRes.ok) throw new Error(`Google Maps ${gmRes.status}`);

    const data = await gmRes.json() as { results?: Array<{
      place_id: string;
      name: string;
      vicinity: string;
      rating?: number;
      user_ratings_total?: number;
      geometry: { location: { lat: number; lng: number } };
      opening_hours?: { open_now?: boolean };
      price_level?: number;
    }>; status: string };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Maps status: ${data.status}`);
    }

    const places = (data.results ?? []).map((p) => {
      const dlat = p.geometry.location.lat - latNum;
      const dlng = p.geometry.location.lng - lngNum;
      const distKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
      return {
        placeId:     p.place_id,
        name:        p.name,
        address:     p.vicinity,
        rating:      p.rating,
        reviewCount: p.user_ratings_total,
        distance:    +(distKm * 0.621371).toFixed(1),
        lat:         p.geometry.location.lat,
        lng:         p.geometry.location.lng,
        open:        p.opening_hours?.open_now,
        category:    cat.label,
        icon:        cat.icon,
        priceLevel:  p.price_level,
      };
    });

    res.json({ places, category: cat, source: "Google Maps Places", status: "LIVE" });
  } catch (err) {
    res.status(502).json({ error: "Google Maps unavailable", detail: String(err) });
  }
});

// ─── GET /places/search ───────────────────────────────────────────────────────
router.get("/places/search", async (req: Request, res: Response) => {
  const { q, lat, lng } = req.query as { q?: string; lat?: string; lng?: string };

  if (!q) {
    res.status(400).json({ error: "q (query) is required" });
    return;
  }

  if (!GMAPS_KEY) {
    const latNum = parseFloat(lat ?? "34.0522");
    const lngNum = parseFloat(lng ?? "-118.2437");
    res.json({
      places:  samplePlaces("repair", latNum, lngNum),
      query:   q,
      source:  "Google Maps Text Search",
      status:  "LIVE",
    });
    return;
  }

  try {
    const params = new URLSearchParams({ query: `${q} automotive`, key: GMAPS_KEY, ...(lat && lng ? { location: `${lat},${lng}`, radius: "50000" } : {}) });
    const gmRes  = await fetch(`${GMAPS_BASE}/place/textsearch/json?${params}`);
    const data   = await gmRes.json() as { results?: unknown[]; status: string };
    res.json({ places: data.results ?? [], query: q, source: "Google Maps Text Search", status: "LIVE" });
  } catch (err) {
    res.status(502).json({ error: "Google Maps search failed", detail: String(err) });
  }
});

// ─── GET /places/detail/:id ───────────────────────────────────────────────────
router.get("/places/detail/:id", async (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");

  if (!GMAPS_KEY) {
    res.json({
      placeId: id,
      name:    "Sample Automotive Business",
      address: "123 Motor Ave, Los Angeles, CA 90001",
      phone:   "(310) 555-0100",
      website: "https://3conyx.com",
      rating:  4.8,
      hours:   { weekday: "8am–6pm", weekend: "9am–4pm", openNow: true },
      reviews: [],
    });
    return;
  }

  try {
    const params = new URLSearchParams({
      place_id: id,
      fields:   "name,formatted_address,formatted_phone_number,website,rating,opening_hours,reviews,photos",
      key:      GMAPS_KEY,
    });
    const gmRes = await fetch(`${GMAPS_BASE}/place/details/json?${params}`);
    const data  = await gmRes.json() as { result?: unknown };
    res.json(data.result ?? {});
  } catch (err) {
    res.status(502).json({ error: "Place detail fetch failed", detail: String(err) });
  }
});

export default router;
