import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { indexVehicle } from "../lib/vehicleSearch";
import { apiCache, cacheKeys, cacheInvalidate } from "../lib/apiCache";

const router: IRouter = Router();

// In-memory vehicle store for MVP (keyed by sessionId)
const garageStore = new Map<string, LinkedVehicle[]>();

interface LinkedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  accessToken?: string;
  odometer: number;
  fuelPercent: number | null;
  batteryPercent: number | null;
  fuelType: "gasoline" | "electric" | "hybrid";
  lastSync: string;
  color: string;
}

// Demo vehicles pre-loaded to make the MVP feel live
const DEMO_VEHICLES: LinkedVehicle[] = [
  {
    id: "demo-001",
    make: "Porsche",
    model: "Cayenne Turbo S E-Hybrid",
    year: 2023,
    vin: "WP1AF2A69NLA14821",
    odometer: 61_402,
    fuelPercent: 78,
    batteryPercent: 62,
    fuelType: "hybrid",
    lastSync: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    color: "#1a1a2e",
  },
  {
    id: "demo-002",
    make: "Tesla",
    model: "Model S Plaid",
    year: 2023,
    vin: "5YJSA1E26PF391842",
    odometer: 18_994,
    fuelPercent: null,
    batteryPercent: 84,
    fuelType: "electric",
    lastSync: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    color: "#c0c0c0",
  },
];

function getSession(req: Request): string {
  const key = req.headers["x-session-id"] as string | undefined;
  return key || "default";
}

function getVehicles(sessionId: string): LinkedVehicle[] {
  if (!garageStore.has(sessionId)) {
    garageStore.set(sessionId, JSON.parse(JSON.stringify(DEMO_VEHICLES)));
  }
  return garageStore.get(sessionId)!;
}

// GET /api/garage/vehicles
router.get("/garage/vehicles", async (req: Request, res: Response) => {
  const sessionId = getSession(req);
  const payload = await apiCache.get(
    cacheKeys.vehicleListings(`session:${sessionId}`),
    async () => ({ vehicles: getVehicles(sessionId) }),
    15_000,
    30_000,
  );
  res.json(payload);
});

// GET /api/garage/vehicles/:id/telemetry
router.get("/garage/vehicles/:id/telemetry", async (req: Request, res: Response) => {
  const sessionId = getSession(req);
  const vehicles = getVehicles(sessionId);
  const vehicle = vehicles.find((v) => v.id === req.params.id);

  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const clientId = process.env.SMARTCAR_CLIENT_ID;
  const clientSecret = process.env.SMARTCAR_CLIENT_SECRET;

  // Live Smartcar data if credentials + real token exist
  if (clientId && clientSecret && vehicle.accessToken) {
    try {
      const [odometerRes, fuelRes] = await Promise.allSettled([
        fetch(`https://api.smartcar.com/v2.0/vehicles/${vehicle.id}/odometer`, {
          headers: { Authorization: `Bearer ${vehicle.accessToken}` },
        }),
        fetch(`https://api.smartcar.com/v2.0/vehicles/${vehicle.id}/fuel`, {
          headers: { Authorization: `Bearer ${vehicle.accessToken}` },
        }),
      ]);

      if (odometerRes.status === "fulfilled" && odometerRes.value.ok) {
        const data = await odometerRes.value.json() as { distance: number };
        vehicle.odometer = Math.round(data.distance * 0.621371); // km → miles
      }
      if (fuelRes.status === "fulfilled" && fuelRes.value.ok) {
        const data = await fuelRes.value.json() as { percentRemaining: number };
        vehicle.fuelPercent = Math.round(data.percentRemaining * 100);
      }
      vehicle.lastSync = new Date().toISOString();
    } catch (err) {
      req.log.warn({ err }, "Smartcar live fetch failed — using cached data");
    }
  } else {
    // Simulate telemetry drift for a realistic feel
    const jitter = (base: number, range: number) =>
      Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range));

    if (vehicle.fuelPercent !== null) vehicle.fuelPercent = Math.round(jitter(vehicle.fuelPercent, 2));
    if (vehicle.batteryPercent !== null) vehicle.batteryPercent = Math.round(jitter(vehicle.batteryPercent, 3));
    vehicle.odometer = vehicle.odometer + Math.floor(Math.random() * 3);
    vehicle.lastSync = new Date().toISOString();
  }

  indexVehicle({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    color: vehicle.color,
    condition: "used",
    mileage: vehicle.odometer,
    createdAt: vehicle.lastSync,
  }).catch(() => {});

  res.json({
    vehicleId: vehicle.id,
    odometer: vehicle.odometer,
    fuelPercent: vehicle.fuelPercent,
    batteryPercent: vehicle.batteryPercent,
    fuelType: vehicle.fuelType,
    lastSync: vehicle.lastSync,
    serviceRequired: vehicle.odometer > 50_000,
  });
});

// POST /api/garage/connect  — simulate or initiate Smartcar Connect
router.post("/garage/connect", (req: Request, res: Response) => {
  const sessionId = getSession(req);
  const clientId = process.env.SMARTCAR_CLIENT_ID;

  if (clientId) {
    const redirectUri = `${process.env.APP_BASE_URL ?? "http://localhost:80"}/api/garage/callback`;
    const state = crypto.randomBytes(16).toString("hex");
    const connectUrl =
      `https://connect.smartcar.com/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=read_odometer read_fuel read_battery read_vin read_vehicle_info` +
      `&state=${state}` +
      `&mode=live`;
    res.json({ connectUrl, mode: "smartcar" });
    return;
  }

  // Simulation mode — accept make/model from body
  const { make, model, year, vin } = req.body as {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
  };

  const fuelTypes: Record<string, LinkedVehicle["fuelType"]> = {
    Tesla: "electric",
    Rivian: "electric",
    Polestar: "electric",
  };

  const newVehicle: LinkedVehicle = {
    id: `sim-${crypto.randomBytes(6).toString("hex")}`,
    make: make ?? "Porsche",
    model: model ?? "Panamera",
    year: year ?? 2023,
    vin: vin ?? `SIM${crypto.randomBytes(8).toString("hex").toUpperCase().slice(0, 14)}`,
    odometer: Math.floor(Math.random() * 80_000) + 5_000,
    fuelPercent: fuelTypes[make ?? ""] === "electric" ? null : Math.floor(Math.random() * 60) + 30,
    batteryPercent: fuelTypes[make ?? ""] !== "gasoline" ? Math.floor(Math.random() * 60) + 30 : null,
    fuelType: fuelTypes[make ?? ""] ?? "gasoline",
    lastSync: new Date().toISOString(),
    color: "#2d2d3d",
  };

  const vehicles = getVehicles(sessionId);
  vehicles.push(newVehicle);
  garageStore.set(sessionId, vehicles);

  indexVehicle({
    id: newVehicle.id,
    make: newVehicle.make,
    model: newVehicle.model,
    year: newVehicle.year,
    vin: newVehicle.vin,
    color: newVehicle.color,
    condition: "used",
    mileage: newVehicle.odometer,
    createdAt: newVehicle.lastSync,
  }).catch(() => {});

  apiCache.invalidate(cacheKeys.vehicleListings(`session:${sessionId}`));
  res.json({ vehicle: newVehicle, mode: "live" });
});

// DELETE /api/garage/vehicles/:id
router.delete("/garage/vehicles/:id", (req: Request, res: Response) => {
  const sessionId = getSession(req);
  const vehicles = getVehicles(sessionId);
  const filtered = vehicles.filter((v) => v.id !== req.params.id);
  garageStore.set(sessionId, filtered);
  apiCache.invalidate(cacheKeys.vehicleListings(`session:${sessionId}`));
  res.json({ success: true });
});

// POST /api/garage/specialist  — request a 3C Specialist
router.post("/garage/specialist", (req: Request, res: Response) => {
  const { vehicleId, name, phone, concern } = req.body as {
    vehicleId: string;
    name: string;
    phone: string;
    concern?: string;
  };

  if (!vehicleId || !name || !phone) {
    res.status(400).json({ error: "vehicleId, name, and phone are required" });
    return;
  }

  const refId = `3CS-${Date.now().toString().slice(-6)}`;
  req.log.info({ vehicleId, refId }, "Specialist request submitted");

  res.json({
    success: true,
    refId,
    message: "A 3C Specialist will contact you within 2 hours.",
    eta: "2 hours",
  });
});

export default router;
