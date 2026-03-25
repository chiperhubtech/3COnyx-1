/**
 * 3C Onyx — Runner Task Management
 *
 * GET  /runner/tasks           — Available tasks for runners
 * POST /runner/tasks/:id/accept — Accept a task
 * POST /runner/tasks/:id/complete — Complete with QR proof
 * GET  /runner/tasks/mine      — Runner's accepted tasks
 * POST /runner/payout          — Trigger Stripe payout
 */
import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/requireAuth";
import * as wsHub from "../lib/wsHub";

const router: IRouter = Router();

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface RunnerTask {
  id: string;
  type: "delivery" | "inspection" | "pickup" | "transport";
  title: string;
  vehicle: string;
  vin: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCity: string;
  dropoffCity: string;
  distanceMiles: number;
  payout: number;
  platformCut: number;
  netPayout: number;
  urgency: "standard" | "priority" | "express";
  status: "available" | "accepted" | "in_progress" | "completed" | "cancelled";
  runnerId: string | null;
  runnerName: string | null;
  deliveryCode: string;
  qrData: string;
  estimatedHours: number;
  vehicleImageUrl: string | null;
  postedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  buyerName: string;
  specialInstructions: string | null;
}

/* ─── Seed tasks ─────────────────────────────────────────────────────────── */
const TASKS = new Map<string, RunnerTask>();

function seedTasks() {
  const seed: Omit<RunnerTask, "id" | "deliveryCode" | "qrData" | "postedAt" | "acceptedAt" | "completedAt">[] = [
    {
      type: "delivery",
      title: "Vehicle Delivery — Brickell to Coral Gables",
      vehicle: "2023 BMW M3 Competition",
      vin: "WBS83AF0XP5J45821",
      pickupAddress: "200 Brickell Ave",
      dropoffAddress: "450 Alhambra Circle",
      pickupCity: "Miami, FL",
      dropoffCity: "Coral Gables, FL",
      distanceMiles: 8.4,
      payout: 185,
      platformCut: 9,
      netPayout: 176,
      urgency: "priority",
      status: "available",
      runnerId: null,
      runnerName: null,
      estimatedHours: 1.5,
      vehicleImageUrl: null,
      buyerName: "Marcus R.",
      specialInstructions: "Call buyer 10 min before arrival. Park in guest spot B.",
    },
    {
      type: "transport",
      title: "Auction Transport — Manheim to Dealer Lot",
      vehicle: "2022 Mercedes-Benz S580",
      vin: "W1K6G7GB4NA123456",
      pickupAddress: "9800 NW 77th Ave",
      dropoffAddress: "2101 Biscayne Blvd",
      pickupCity: "Hialeah, FL",
      dropoffCity: "Miami, FL",
      distanceMiles: 14.2,
      payout: 240,
      platformCut: 12,
      netPayout: 228,
      urgency: "standard",
      status: "available",
      runnerId: null,
      runnerName: null,
      estimatedHours: 2.0,
      vehicleImageUrl: null,
      buyerName: "Premier Auto Group",
      specialInstructions: "Keys at Manheim lot office. Dealer receiving hours: 9AM-5PM.",
    },
    {
      type: "inspection",
      title: "Pre-Purchase Inspection",
      vehicle: "2021 Porsche 911 Carrera S",
      vin: "WP0AB2A94MS245001",
      pickupAddress: "1 Bayfront Park Dr",
      dropoffAddress: "1 Bayfront Park Dr",
      pickupCity: "Miami, FL",
      dropoffCity: "Miami, FL",
      distanceMiles: 0,
      payout: 120,
      platformCut: 6,
      netPayout: 114,
      urgency: "express",
      status: "available",
      runnerId: null,
      runnerName: null,
      estimatedHours: 1.0,
      vehicleImageUrl: null,
      buyerName: "Diana W.",
      specialInstructions: "Use 3C inspection checklist. Photo all four corners + interior.",
    },
    {
      type: "pickup",
      title: "Trade-In Pickup — Aventura",
      vehicle: "2020 Range Rover Sport HSE",
      vin: "SALWR2RK1LA123789",
      pickupAddress: "19501 Biscayne Blvd",
      dropoffAddress: "3900 NW 79th Ave",
      pickupCity: "Aventura, FL",
      dropoffCity: "Doral, FL",
      distanceMiles: 22.1,
      payout: 310,
      platformCut: 15,
      netPayout: 295,
      urgency: "standard",
      status: "available",
      runnerId: null,
      runnerName: null,
      estimatedHours: 3.0,
      vehicleImageUrl: null,
      buyerName: "3C Trade Engine",
      specialInstructions: null,
    },
  ];

  seed.forEach((s) => {
    const id = `TASK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const deliveryCode = crypto
      .createHash("sha256")
      .update(`${id}:${s.vin}`)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase();
    TASKS.set(id, {
      ...s,
      id,
      deliveryCode,
      qrData: JSON.stringify({ taskId: id, vin: s.vin, code: deliveryCode }),
      postedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      acceptedAt: null,
      completedAt: null,
    });
  });
}

seedTasks();

/* ─── GET /runner/tasks ──────────────────────────────────────────────────── */
router.get("/runner/tasks", requireAuth, (_req: Request, res: Response) => {
  const tasks = Array.from(TASKS.values())
    .filter((t) => t.status === "available")
    .sort((a, b) => b.netPayout - a.netPayout);
  res.json({ tasks });
});

/* ─── GET /runner/tasks/mine ─────────────────────────────────────────────── */
router.get("/runner/tasks/mine", requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const tasks = Array.from(TASKS.values())
    .filter((t) => t.runnerId === String(user.id))
    .sort((a, b) => (b.acceptedAt ?? "").localeCompare(a.acceptedAt ?? ""));
  res.json({ tasks });
});

/* ─── POST /runner/tasks/:id/accept ──────────────────────────────────────── */
router.post("/runner/tasks/:id/accept", requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const task = TASKS.get((req.params["id"] as string));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  if (task.status !== "available") { res.status(409).json({ error: "Task already taken" }); return; }

  task.status = "accepted";
  task.runnerId = String(user.id);
  task.runnerName = user.name;
  task.acceptedAt = new Date().toISOString();

  wsHub.broadcast("notify", {
    type: "task_accepted",
    title: "Runner Dispatched",
    body: `${user.name} is en route for ${task.vehicle}`,
    taskId: task.id,
    ts: new Date().toISOString(),
  });

  res.json({ task });
});

/* ─── POST /runner/tasks/:id/complete ────────────────────────────────────── */
router.post("/runner/tasks/:id/complete", requireAuth, (req: Request, res: Response) => {
  const { deliveryCode } = req.body as { deliveryCode: string };
  const task = TASKS.get((req.params["id"] as string));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  if (deliveryCode !== task.deliveryCode) {
    res.status(400).json({ error: "Invalid delivery code" });
    return;
  }

  task.status = "completed";
  task.completedAt = new Date().toISOString();

  wsHub.broadcast("notify", {
    type: "delivery_complete",
    title: "Delivery Complete",
    body: `${task.vehicle} delivered. Payout of $${task.netPayout} processing.`,
    taskId: task.id,
    ts: new Date().toISOString(),
  });

  res.json({ task, payoutTriggered: true, netPayout: task.netPayout });
});

/* ─── POST /runner/payout ────────────────────────────────────────────────── */
router.post("/runner/payout", requireAuth, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body as { taskId: string };
    const task = TASKS.get(taskId);
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (task.status !== "completed") { res.status(400).json({ error: "Task not yet completed" }); return; }

    // In production: stripe.transfers.create({ amount: task.netPayout * 100, destination: runner.stripeAccountId })
    res.json({
      success: true,
      taskId,
      netPayout: task.netPayout,
      message: `$${task.netPayout} payout initiated via Stripe Connect`,
      estimatedArrival: "Instant — within 30 minutes",
    });
  } catch (err) {
    console.error("[runner/payout]", err);
    res.status(500).json({ error: "Payout failed" });
  }
});

export default router;
