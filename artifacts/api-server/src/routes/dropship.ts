/**
 * Automated Dropship Coordinator
 * Mock-connects to Ship.cars + RunBuggy carriers
 *
 * Routes:
 *   GET  /api/dropship/carriers              — List available carriers
 *   POST /api/dropship/claim                 — Claim vehicle, generate BOL
 *   GET  /api/dropship/bol/:bolId            — Get Bill of Lading
 *   GET  /api/dropship/shipments             — All active shipments
 *   POST /api/dropship/shipments/:id/status  — Update shipment status
 *   POST /api/dropship/scan/submit           — Runner submits 360° scan
 *   GET  /api/dropship/scan/:vehicleId       — Get scan for vehicle
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Carrier {
  id: string;
  name: "Ship.cars" | "RunBuggy" | "uShip";
  logo: string;
  type: "enclosed" | "open" | "flatbed";
  transitDays: number;
  ratePerMile: number;
  insurance: number;
  rating: number;
  totalCarried: number;
  available: boolean;
}

export interface BillOfLading {
  bolId: string;
  bolNumber: string;
  carrierId: string;
  carrierName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleVin: string;
  vehicleVinMasked: string;
  color: string;
  year: number;
  originAddress: string;
  originCity: string;
  originState: string;
  destinationAddress: string;
  destinationCity: string;
  destinationState: string;
  estimatedMiles: number;
  estimatedTransitDays: number;
  pickupDate: string;
  estimatedDelivery: string;
  carrierRate: number;
  insurance: number;
  totalCost: number;
  status: "issued" | "picked_up" | "in_transit" | "delivered";
  runnerId: string | null;
  runnerName: string | null;
  sha256Hash: string;
  issuedAt: string;
  digitalSignature: string;
  scanAvailable: boolean;
}

export interface ScanPosition {
  angle: number;
  label: string;
  capturedAt: string | null;
  imageUrl: string | null;
}

export interface VehicleScan {
  scanId: string;
  vehicleId: string;
  vehicleName: string;
  runnerId: string;
  runnerName: string;
  positions: ScanPosition[];
  completedPositions: number;
  totalPositions: number;
  isComplete: boolean;
  submittedAt: string | null;
  sha256Hash: string | null;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const CARRIERS: Carrier[] = [
  {
    id: "carrier-shipcars",
    name: "Ship.cars",
    logo: "SC",
    type: "enclosed",
    transitDays: 3,
    ratePerMile: 1.85,
    insurance: 500_000,
    rating: 4.9,
    totalCarried: 24_891,
    available: true,
  },
  {
    id: "carrier-runbuggy",
    name: "RunBuggy",
    logo: "RB",
    type: "open",
    transitDays: 4,
    ratePerMile: 1.42,
    insurance: 300_000,
    rating: 4.7,
    totalCarried: 61_443,
    available: true,
  },
  {
    id: "carrier-uship",
    name: "uShip",
    logo: "US",
    type: "enclosed",
    transitDays: 5,
    ratePerMile: 1.65,
    insurance: 400_000,
    rating: 4.6,
    totalCarried: 38_220,
    available: false,
  },
];

const SCAN_POSITIONS = [
  "Front",
  "Front-Right 45°",
  "Right Side",
  "Rear-Right 45°",
  "Rear",
  "Rear-Left 45°",
  "Left Side",
  "Front-Left 45°",
];

const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80",
  "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
];

const bols: BillOfLading[] = [];
const scans: VehicleScan[] = [];

// Seed two demo BOLs
function makeBol(
  vehicleId: string,
  vehicleName: string,
  vin: string,
  color: string,
  year: number,
  origin: string,
  dest: string,
  miles: number,
  carrierId: string,
  runnerId: string,
  runnerName: string,
  status: BillOfLading["status"],
  daysAgo: number,
): BillOfLading {
  const carrier = CARRIERS.find((c) => c.id === carrierId)!;
  const cost = Math.round(miles * carrier.ratePerMile);
  const issued = new Date(Date.now() - daysAgo * 86_400_000);
  const pickup = new Date(issued.getTime() + 86_400_000);
  const delivery = new Date(pickup.getTime() + carrier.transitDays * 86_400_000);
  const bolNum = `BOL-3C-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const payload = `${bolNum}|${vehicleName}|${vin}|${origin}|${dest}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  const [originCity, originState] = origin.split(", ");
  const [destCity, destState] = dest.split(", ");

  return {
    bolId: `bol-${crypto.randomBytes(4).toString("hex")}`,
    bolNumber: bolNum,
    carrierId,
    carrierName: carrier.name,
    vehicleId,
    vehicleName,
    vehicleVin: vin,
    vehicleVinMasked: `•••••••••••${vin.slice(-4)}`,
    color,
    year,
    originAddress: "3C Certified Origin",
    originCity,
    originState,
    destinationAddress: "Buyer Driveway",
    destinationCity: destCity,
    destinationState: destState,
    estimatedMiles: miles,
    estimatedTransitDays: carrier.transitDays,
    pickupDate: pickup.toISOString(),
    estimatedDelivery: delivery.toISOString(),
    carrierRate: cost,
    insurance: carrier.insurance,
    totalCost: cost + 195,
    status,
    runnerId,
    runnerName,
    sha256Hash: hash,
    issuedAt: issued.toISOString(),
    digitalSignature: `3C-SIG-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    scanAvailable: status !== "issued",
  };
}

bols.push(
  makeBol(
    "task-001", "2023 Rolls-Royce Ghost Extended", "SCA664S51PUX98123",
    "Midnight Sapphire", 2023,
    "Beverly Hills, CA", "Malibu, CA", 31,
    "carrier-shipcars", "runner-001", "Marcus Webb", "in_transit", 2,
  ),
  makeBol(
    "task-002", "2023 Ferrari Roma Coupe", "ZFF97XJA8N0267841",
    "Grigio Ingrid", 2023,
    "San Francisco, CA", "Palo Alto, CA", 35,
    "carrier-runbuggy", "runner-002", "Priya Rao", "picked_up", 1,
  ),
  makeBol(
    "task-003", "2022 Lamborghini Urus Pearl Capsule", "ZPBUA1ZL3NLA08213",
    "Pearl White", 2022,
    "Miami, FL", "Palm Beach, FL", 68,
    "carrier-shipcars", "runner-003", "Demarco Tate", "delivered", 5,
  ),
  makeBol(
    "task-004", "2023 Bentley Flying Spur Mulliner", "SCBEF2ZG9PC010872",
    "Midnight Emerald", 2023,
    "New York, NY", "Greenwich, CT", 54,
    "carrier-runbuggy", "runner-004", "Nikolai Petrov", "delivered", 7,
  ),
);

// Seed a demo scan for task-001 (Rolls-Royce — in transit, all 8 angles)
scans.push({
  scanId: `scan-${crypto.randomBytes(4).toString("hex")}`,
  vehicleId: "task-001",
  vehicleName: "2023 Rolls-Royce Ghost Extended",
  runnerId: "runner-001",
  runnerName: "Marcus Webb",
  positions: SCAN_POSITIONS.map((label, i) => ({
    angle: i * 45,
    label,
    capturedAt: new Date(Date.now() - (8 - i) * 120_000).toISOString(),
    imageUrl: CAR_IMAGES[i],
  })),
  completedPositions: 8,
  totalPositions: 8,
  isComplete: true,
  submittedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  sha256Hash: crypto.randomBytes(16).toString("hex"),
});

// Seed a demo scan for task-002 (Ferrari Roma — picked up, all 8 angles)
scans.push({
  scanId: `scan-${crypto.randomBytes(4).toString("hex")}`,
  vehicleId: "task-002",
  vehicleName: "2023 Ferrari Roma Coupe",
  runnerId: "runner-002",
  runnerName: "Priya Rao",
  positions: SCAN_POSITIONS.map((label, i) => ({
    angle: i * 45,
    label,
    capturedAt: new Date(Date.now() - (8 - i) * 90_000).toISOString(),
    imageUrl: CAR_IMAGES[(i + 2) % CAR_IMAGES.length],
  })),
  completedPositions: 8,
  totalPositions: 8,
  isComplete: true,
  submittedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  sha256Hash: crypto.randomBytes(16).toString("hex"),
});

// ─── GET /api/dropship/carriers ───────────────────────────────────────────────
router.get("/dropship/carriers", (_req: Request, res: Response) => {
  res.json({ carriers: CARRIERS });
});

// ─── GET /api/dropship/shipments ──────────────────────────────────────────────
router.get("/dropship/shipments", (_req: Request, res: Response) => {
  res.json({
    shipments: bols,
    stats: {
      total: bols.length,
      inTransit: bols.filter((b) => b.status === "in_transit").length,
      delivered: bols.filter((b) => b.status === "delivered").length,
      totalVolume: bols.reduce((s, b) => s + b.totalCost, 0),
    },
  });
});

// ─── GET /api/dropship/bol/:bolId ─────────────────────────────────────────────
router.get("/dropship/bol/:bolId", (req: Request, res: Response) => {
  const bol = bols.find((b) => b.bolId === req.params.bolId);
  if (!bol) { res.status(404).json({ error: "BOL not found" }); return; }
  res.json({ bol });
});

// ─── POST /api/dropship/claim ─────────────────────────────────────────────────
router.post("/dropship/claim", (req: Request, res: Response) => {
  const {
    vehicleId, vehicleName, vehicleVin, color, year,
    origin, destination, estimatedMiles,
    carrierId, runnerId, runnerName,
  } = req.body as {
    vehicleId: string; vehicleName: string; vehicleVin: string;
    color: string; year: number;
    origin: string; destination: string; estimatedMiles: number;
    carrierId: string; runnerId?: string; runnerName?: string;
  };

  if (!vehicleId || !vehicleName || !carrierId) {
    res.status(400).json({ error: "vehicleId, vehicleName, carrierId required" });
    return;
  }

  // Check if already claimed
  const existing = bols.find((b) => b.vehicleId === vehicleId);
  if (existing) {
    res.json({ bol: existing, alreadyClaimed: true });
    return;
  }

  const bol = makeBol(
    vehicleId, vehicleName, vehicleVin ?? "UNKNOWNVIN00000",
    color ?? "Black", year ?? 2024,
    origin ?? "Origin, CA", destination ?? "Destination, CA",
    estimatedMiles ?? 100,
    carrierId,
    runnerId ?? "runner-001",
    runnerName ?? "Assigned Runner",
    "issued",
    0,
  );
  bols.unshift(bol);

  // Create an empty scan session for this vehicle
  const newScan: VehicleScan = {
    scanId: `scan-${crypto.randomBytes(4).toString("hex")}`,
    vehicleId,
    vehicleName,
    runnerId: runnerId ?? "runner-001",
    runnerName: runnerName ?? "Runner",
    positions: SCAN_POSITIONS.map((label, i) => ({
      angle: i * 45,
      label,
      capturedAt: null,
      imageUrl: null,
    })),
    completedPositions: 0,
    totalPositions: 8,
    isComplete: false,
    submittedAt: null,
    sha256Hash: null,
  };
  scans.push(newScan);

  res.json({ bol, scan: newScan, success: true });
});

// ─── POST /api/dropship/shipments/:bolId/status ───────────────────────────────
router.post("/dropship/shipments/:bolId/status", (req: Request, res: Response) => {
  const bol = bols.find((b) => b.bolId === req.params.bolId);
  if (!bol) { res.status(404).json({ error: "BOL not found" }); return; }
  const { status } = req.body as { status: BillOfLading["status"] };
  bol.status = status;
  res.json({ bol });
});

// ─── POST /api/dropship/scan/submit ──────────────────────────────────────────
router.post("/dropship/scan/submit", (req: Request, res: Response) => {
  const { vehicleId, positionIndex, imageUrl } = req.body as {
    vehicleId: string;
    positionIndex: number;
    imageUrl?: string;
  };

  let scan = scans.find((s) => s.vehicleId === vehicleId);
  if (!scan) {
    res.status(404).json({ error: "No scan session for this vehicle — claim first" });
    return;
  }

  if (positionIndex >= 0 && positionIndex < 8) {
    scan.positions[positionIndex].capturedAt = new Date().toISOString();
    scan.positions[positionIndex].imageUrl =
      imageUrl ?? CAR_IMAGES[positionIndex % CAR_IMAGES.length];
    scan.completedPositions = scan.positions.filter((p) => p.capturedAt !== null).length;
  }

  if (scan.completedPositions >= 8 && !scan.isComplete) {
    scan.isComplete = true;
    scan.submittedAt = new Date().toISOString();
    const payload = scan.positions.map((p) => `${p.label}:${p.capturedAt}`).join("|");
    scan.sha256Hash = crypto.createHash("sha256").update(payload).digest("hex");

    // Mark BOL as scan-available
    const bol = bols.find((b) => b.vehicleId === vehicleId);
    if (bol) bol.scanAvailable = true;
  }

  res.json({ scan });
});

// ─── GET /api/dropship/scan/:vehicleId ───────────────────────────────────────
router.get("/dropship/scan/:vehicleId", (req: Request, res: Response) => {
  const scan = scans.find((s) => s.vehicleId === req.params.vehicleId);
  if (!scan) {
    res.status(404).json({ error: "No scan found for this vehicle" });
    return;
  }
  res.json({ scan });
});

// ─── GET /api/dropship/scan/:vehicleId/ar ─────────────────────────────────────
router.get("/dropship/scan/:vehicleId/ar", (req: Request, res: Response) => {
  const scan = scans.find((s) => s.vehicleId === req.params.vehicleId);
  res.json({
    available: !!scan?.isComplete,
    vehicleId: req.params.vehicleId,
    vehicleName: scan?.vehicleName ?? null,
    images: scan?.positions.map((p) => p.imageUrl).filter(Boolean) ?? [],
    primaryImage: scan?.positions[0]?.imageUrl ?? null,
  });
});

export default router;
