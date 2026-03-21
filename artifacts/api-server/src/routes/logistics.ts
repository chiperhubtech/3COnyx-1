import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";

const router: IRouter = Router();

// ─── Seed Data ─────────────────────────────────────────────────────────────────

interface Runner {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  checkrStatus: "clear" | "pending" | "consider";
  checkrCompletedAt: string | null;
  rating: number;
  completedRuns: number;
  lat: number;
  lng: number;
  heading: number;
  speed: number; // mph
  status: "active" | "en_route" | "idle";
  currentTaskId: string | null;
  vehicleType: string;
}

interface Task {
  id: string;
  type: string;
  vehicle: string;
  vin: string;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destLat: number;
  destLng: number;
  priority: "high" | "normal" | "low";
  status: "open" | "in_progress" | "complete";
  assignedRunnerId: string | null;
  estimatedMiles: number;
  payout: number;
  postedAt: string;
  eta: string;
}

const runners: Runner[] = [
  {
    id: "runner-001",
    name: "Marcus Webb",
    phone: "+1 (310) 555-0182",
    avatar: "MW",
    checkrStatus: "clear",
    checkrCompletedAt: "2026-01-15T08:30:00Z",
    rating: 4.97,
    completedRuns: 142,
    lat: 34.0522,
    lng: -118.2437,
    heading: 45,
    speed: 38,
    status: "en_route",
    currentTaskId: "task-001",
    vehicleType: "Enclosed Hauler",
  },
  {
    id: "runner-002",
    name: "Priya Rao",
    phone: "+1 (415) 555-0294",
    avatar: "PR",
    checkrStatus: "clear",
    checkrCompletedAt: "2026-02-03T10:00:00Z",
    rating: 4.91,
    completedRuns: 88,
    lat: 37.7749,
    lng: -122.4194,
    heading: 130,
    speed: 52,
    status: "active",
    currentTaskId: "task-002",
    vehicleType: "Open Carrier",
  },
  {
    id: "runner-003",
    name: "Demarco Tate",
    phone: "+1 (305) 555-0441",
    avatar: "DT",
    checkrStatus: "clear",
    checkrCompletedAt: "2025-12-10T14:15:00Z",
    rating: 4.88,
    completedRuns: 210,
    lat: 25.7617,
    lng: -80.1918,
    heading: 320,
    speed: 61,
    status: "en_route",
    currentTaskId: "task-003",
    vehicleType: "Enclosed Hauler",
  },
  {
    id: "runner-004",
    name: "Shelby Connors",
    phone: "+1 (214) 555-0371",
    avatar: "SC",
    checkrStatus: "pending",
    checkrCompletedAt: null,
    rating: 4.82,
    completedRuns: 31,
    lat: 32.7767,
    lng: -96.797,
    heading: 90,
    speed: 0,
    status: "idle",
    currentTaskId: null,
    vehicleType: "Open Carrier",
  },
  {
    id: "runner-005",
    name: "Nikolai Petrov",
    phone: "+1 (312) 555-0199",
    avatar: "NP",
    checkrStatus: "clear",
    checkrCompletedAt: "2026-01-28T09:00:00Z",
    rating: 4.95,
    completedRuns: 176,
    lat: 41.8827,
    lng: -87.6233,
    heading: 200,
    speed: 44,
    status: "active",
    currentTaskId: "task-004",
    vehicleType: "Enclosed Hauler",
  },
];

const tasks: Task[] = [
  {
    id: "task-001",
    type: "Dealer Swap",
    vehicle: "2023 Rolls-Royce Ghost Extended",
    vin: "SCA664S51PUX98123",
    origin: "Beverly Hills, CA",
    originLat: 34.0736,
    originLng: -118.4004,
    destination: "Malibu, CA",
    destLat: 34.0259,
    destLng: -118.7798,
    priority: "high",
    status: "in_progress",
    assignedRunnerId: "runner-001",
    estimatedMiles: 31,
    payout: 480,
    postedAt: "2026-03-21T07:00:00Z",
    eta: "Today, 2:30 PM",
  },
  {
    id: "task-002",
    type: "Client Delivery",
    vehicle: "2023 Ferrari Roma",
    vin: "ZFF97XJA8N0267841",
    origin: "San Francisco, CA",
    originLat: 37.7749,
    originLng: -122.4194,
    destination: "Palo Alto, CA",
    destLat: 37.4419,
    destLng: -122.143,
    priority: "high",
    status: "in_progress",
    assignedRunnerId: "runner-002",
    estimatedMiles: 35,
    payout: 520,
    postedAt: "2026-03-21T09:15:00Z",
    eta: "Today, 3:00 PM",
  },
  {
    id: "task-003",
    type: "Port Pickup",
    vehicle: "2024 Bentley Bentayga EWB",
    vin: "SCBCU9ZX8PC090123",
    origin: "Port of Miami",
    originLat: 25.7617,
    originLng: -80.1918,
    destination: "Palm Beach, FL",
    destLat: 26.7056,
    destLng: -80.0364,
    priority: "normal",
    status: "in_progress",
    assignedRunnerId: "runner-003",
    estimatedMiles: 68,
    payout: 750,
    postedAt: "2026-03-21T06:30:00Z",
    eta: "Today, 5:00 PM",
  },
  {
    id: "task-004",
    type: "Dealer Swap",
    vehicle: "2023 Porsche Taycan Turbo S",
    vin: "WP0CF2Y1XNS282901",
    origin: "Chicago, IL",
    originLat: 41.8827,
    originLng: -87.6233,
    destination: "Naperville, IL",
    destLat: 41.7508,
    destLng: -88.1535,
    priority: "normal",
    status: "in_progress",
    assignedRunnerId: "runner-005",
    estimatedMiles: 29,
    payout: 390,
    postedAt: "2026-03-21T10:00:00Z",
    eta: "Today, 1:45 PM",
  },
  {
    id: "task-005",
    type: "Auction Transport",
    vehicle: "2022 Lamborghini Huracán EVO",
    vin: "ZHWUC4ZF7MLA13902",
    origin: "Scottsdale, AZ",
    originLat: 33.4942,
    originLng: -111.9261,
    destination: "Las Vegas, NV",
    destLat: 36.1699,
    destLng: -115.1398,
    priority: "high",
    status: "open",
    assignedRunnerId: null,
    estimatedMiles: 285,
    payout: 1850,
    postedAt: "2026-03-21T11:30:00Z",
    eta: "Mar 22, 10:00 AM",
  },
  {
    id: "task-006",
    type: "Client Delivery",
    vehicle: "2023 Maserati MC20",
    vin: "ZAM44XSAXP0409812",
    origin: "Dallas, TX",
    originLat: 32.7767,
    originLng: -96.797,
    destination: "Houston, TX",
    destLat: 29.7604,
    destLng: -95.3698,
    priority: "normal",
    status: "open",
    assignedRunnerId: null,
    estimatedMiles: 239,
    payout: 1200,
    postedAt: "2026-03-21T12:00:00Z",
    eta: "Mar 22, 2:00 PM",
  },
];

// Simulate GPS drift
function driftPosition(runner: Runner): Runner {
  const deltaLat = (Math.random() - 0.5) * 0.002;
  const deltaLng = (Math.random() - 0.5) * 0.003;
  const headingJitter = (Math.random() - 0.5) * 10;
  return {
    ...runner,
    lat: runner.lat + (runner.status === "idle" ? 0 : deltaLat),
    lng: runner.lng + (runner.status === "idle" ? 0 : deltaLng),
    heading: (runner.heading + headingJitter + 360) % 360,
    speed: runner.status === "idle" ? 0 : Math.max(20, Math.min(75, runner.speed + (Math.random() - 0.5) * 6)),
  };
}

// GET /api/logistics/runners
router.get("/logistics/runners", (_req: Request, res: Response) => {
  const liveRunners = runners.map((r) => {
    const drifted = driftPosition(r);
    // Update in place for next poll
    r.lat = drifted.lat;
    r.lng = drifted.lng;
    r.heading = drifted.heading;
    r.speed = drifted.speed;
    return {
      id: drifted.id,
      name: drifted.name,
      avatar: drifted.avatar,
      checkrStatus: drifted.checkrStatus,
      rating: drifted.rating,
      completedRuns: drifted.completedRuns,
      lat: drifted.lat,
      lng: drifted.lng,
      heading: drifted.heading,
      speed: Math.round(drifted.speed),
      status: drifted.status,
      currentTaskId: drifted.currentTaskId,
      vehicleType: drifted.vehicleType,
    };
  });
  res.json({ runners: liveRunners });
});

// GET /api/logistics/tasks
router.get("/logistics/tasks", (_req: Request, res: Response) => {
  res.json({ tasks });
});

// POST /api/logistics/tasks/:id/assign
router.post("/logistics/tasks/:id/assign", (req: Request, res: Response) => {
  const task = tasks.find((t) => t.id === req.params.id);
  const { runnerId } = req.body as { runnerId?: string };
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  if (runnerId) {
    task.assignedRunnerId = runnerId;
    task.status = "in_progress";
    const runner = runners.find((r) => r.id === runnerId);
    if (runner) { runner.currentTaskId = task.id; runner.status = "en_route"; }
  }
  res.json({ task });
});

// POST /api/logistics/track  — HyperTrack webhook
router.post("/logistics/hypertrack/webhook", (req: Request, res: Response) => {
  const secret = process.env.HYPERTRACK_SECRET_KEY;
  if (secret) {
    const signature = req.headers["hypertrack-signature"] as string | undefined;
    if (!signature) { res.status(401).json({ error: "Missing signature" }); return; }
  }
  req.log.info({ event: req.body }, "HyperTrack webhook received");
  res.json({ received: true });
});

// GET /api/logistics/runners/:id
router.get("/logistics/runners/:id", (req: Request, res: Response) => {
  const runner = runners.find((r) => r.id === req.params.id);
  if (!runner) { res.status(404).json({ error: "Runner not found" }); return; }
  res.json({ runner });
});

export default router;
