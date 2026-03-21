import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import QRCode from "qrcode";

const router: IRouter = Router();

// ─── In-memory stores ─────────────────────────────────────────────────────────

interface DeliveryToken {
  token: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  vin: string;
  runnerName: string;
  runnerId: string;
  origin: string;
  destination: string;
  payout: number;
  generatedAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
}

interface AuditEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  vin: string;
  runnerName: string;
  dealerAction: "DELIVERY_CONFIRMED";
  status: "COMPLETED";
  completedAt: string;
  payout: number;
  origin: string;
  destination: string;
  auditHash: string;
}

const tokenStore = new Map<string, DeliveryToken>();
const auditLog = new Map<string, AuditEntry>();

// Seed a few tokens for the demo so the scanner can immediately verify them
const DEMO_TASKS = [
  {
    taskId: "task-001",
    taskTitle: "Dealer Swap",
    vehicle: "2023 Rolls-Royce Ghost Extended",
    vin: "SCA664S51PUX98123",
    runnerName: "Marcus Webb",
    runnerId: "runner-001",
    origin: "Beverly Hills, CA",
    destination: "Malibu, CA",
    payout: 480,
  },
  {
    taskId: "task-002",
    taskTitle: "Client Delivery",
    vehicle: "2023 Ferrari Roma",
    vin: "ZFF97XJA8N0267841",
    runnerName: "Priya Rao",
    runnerId: "runner-002",
    origin: "San Francisco, CA",
    destination: "Palo Alto, CA",
    payout: 520,
  },
  {
    taskId: "task-003",
    taskTitle: "Port Pickup",
    vehicle: "2024 Bentley Bentayga EWB",
    vin: "SCBCU9ZX8PC090123",
    runnerName: "Demarco Tate",
    runnerId: "runner-003",
    origin: "Port of Miami",
    destination: "Palm Beach, FL",
    payout: 750,
  },
  {
    taskId: "task-004",
    taskTitle: "Dealer Swap",
    vehicle: "2023 Porsche Taycan Turbo S",
    vin: "WP0CF2Y1XNS282901",
    runnerName: "Nikolai Petrov",
    runnerId: "runner-005",
    origin: "Chicago, IL",
    destination: "Naperville, IL",
    payout: 390,
  },
];

function makeToken(taskData: (typeof DEMO_TASKS)[0]): DeliveryToken {
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const exp = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
  return {
    token,
    ...taskData,
    generatedAt: now.toISOString(),
    expiresAt: exp.toISOString(),
    used: false,
  };
}

// Pre-generate tokens for demo tasks
DEMO_TASKS.forEach((task) => {
  const t = makeToken(task);
  tokenStore.set(t.token, t);
  // Also index by taskId for lookup
  tokenStore.set(`taskid:${task.taskId}`, t);
});

// ─── POST /api/delivery/qr/:taskId ────────────────────────────────────────────
router.post("/delivery/qr/:taskId", async (req: Request, res: Response) => {
  const { taskId } = req.params;

  // Find or create token for this task
  let entry = tokenStore.get(`taskid:${taskId}`);
  if (!entry || entry.used) {
    // Find task data from demo set or request body
    const body = req.body as Partial<(typeof DEMO_TASKS)[0]>;
    const demo = DEMO_TASKS.find((t) => t.taskId === taskId);
    if (!demo && !body.vehicle) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    const data = demo ?? {
      taskId,
      taskTitle: body.taskTitle ?? "Delivery",
      vehicle: body.vehicle ?? "Vehicle",
      vin: body.vin ?? "UNKNOWN",
      runnerName: body.runnerName ?? "Runner",
      runnerId: body.runnerId ?? "unknown",
      origin: body.origin ?? "Origin",
      destination: body.destination ?? "Destination",
      payout: body.payout ?? 0,
    };
    entry = makeToken(data);
    tokenStore.set(entry.token, entry);
    tokenStore.set(`taskid:${taskId}`, entry);
  }

  // Build QR payload
  const qrPayload = JSON.stringify({
    t: entry.token,
    id: entry.taskId,
    ts: Date.now(),
    sig: crypto.createHash("sha256").update(`${entry.token}:${entry.taskId}`).digest("hex").slice(0, 8),
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
      color: { dark: "#F59E0B", light: "#0d0d10" },
    });

    res.json({
      token: entry.token,
      taskId: entry.taskId,
      taskTitle: entry.taskTitle,
      vehicle: entry.vehicle,
      runnerName: entry.runnerName,
      origin: entry.origin,
      destination: entry.destination,
      payout: entry.payout,
      generatedAt: entry.generatedAt,
      expiresAt: entry.expiresAt,
      qrDataUrl,
      qrPayload,
      used: entry.used,
    });
  } catch (err) {
    req.log.error({ err }, "QR generation failed");
    res.status(500).json({ error: "QR generation failed" });
  }
});

// ─── POST /api/delivery/verify ────────────────────────────────────────────────
router.post("/delivery/verify", (req: Request, res: Response) => {
  const { qrPayload, token: rawToken } = req.body as { qrPayload?: string; token?: string };

  let token = rawToken;

  // Parse QR payload if provided
  if (qrPayload && !token) {
    try {
      const parsed = JSON.parse(qrPayload) as { t?: string };
      token = parsed.t;
    } catch {
      res.status(400).json({ error: "Invalid QR payload" });
      return;
    }
  }

  if (!token) {
    res.status(400).json({ error: "Token or QR payload required" });
    return;
  }

  const entry = tokenStore.get(token);

  if (!entry) {
    res.status(404).json({ error: "Invalid or expired QR code", code: "INVALID_TOKEN" });
    return;
  }

  if (entry.used) {
    const audit = auditLog.get(entry.taskId);
    res.status(409).json({
      error: "QR code already used",
      code: "ALREADY_USED",
      completedAt: entry.usedAt,
      audit,
    });
    return;
  }

  if (new Date(entry.expiresAt) < new Date()) {
    res.status(410).json({ error: "QR code expired", code: "EXPIRED" });
    return;
  }

  // Mark as used
  const completedAt = new Date().toISOString();
  entry.used = true;
  entry.usedAt = completedAt;
  tokenStore.set(token, entry);

  // Create audit record
  const auditHash = crypto
    .createHash("sha256")
    .update(`${entry.token}:${entry.taskId}:${completedAt}`)
    .digest("hex");

  const auditEntry: AuditEntry = {
    id: `audit-${crypto.randomBytes(6).toString("hex")}`,
    taskId: entry.taskId,
    taskTitle: entry.taskTitle,
    vehicle: entry.vehicle,
    vin: entry.vin,
    runnerName: entry.runnerName,
    dealerAction: "DELIVERY_CONFIRMED",
    status: "COMPLETED",
    completedAt,
    payout: entry.payout,
    origin: entry.origin,
    destination: entry.destination,
    auditHash,
  };

  auditLog.set(entry.taskId, auditEntry);
  req.log.info({ taskId: entry.taskId, auditHash }, "Delivery verified and completed");

  res.json({
    success: true,
    message: "Delivery confirmed. Task marked COMPLETED.",
    audit: auditEntry,
  });
});

// ─── GET /api/delivery/receipt/:taskId ────────────────────────────────────────
router.get("/delivery/receipt/:taskId", (req: Request, res: Response) => {
  const audit = auditLog.get(req.params.taskId);
  if (!audit) {
    res.status(404).json({ error: "No audit record found for this task" });
    return;
  }
  res.json({ audit });
});

// ─── GET /api/delivery/tasks ──────────────────────────────────────────────────
router.get("/delivery/tasks", (_req: Request, res: Response) => {
  const tasks = DEMO_TASKS.map((t) => {
    const token = tokenStore.get(`taskid:${t.taskId}`);
    const audit = auditLog.get(t.taskId);
    return {
      ...t,
      status: audit ? "COMPLETED" : token?.used ? "COMPLETED" : "IN_PROGRESS",
      completedAt: audit?.completedAt ?? null,
      auditHash: audit?.auditHash ?? null,
    };
  });
  res.json({ tasks });
});

export default router;
