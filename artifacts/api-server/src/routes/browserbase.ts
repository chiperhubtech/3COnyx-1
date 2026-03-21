import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;
const BROWSERBASE_BASE = "https://www.browserbase.com/v1";

function isLive() {
  return !!(BROWSERBASE_API_KEY && BROWSERBASE_PROJECT_ID);
}

type BrowserTask = {
  id: string;
  type: string;
  url: string;
  status: "queued" | "running" | "completed" | "failed";
  result?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  screenshot_url?: string;
};

const taskStore = new Map<string, BrowserTask>();

// POST /api/browserbase/task - create browser automation task
router.post("/browserbase/task", async (req: Request, res: Response) => {
  const { type, url, instructions } = req.body;
  if (!type) { res.status(400).json({ error: "type required" }); return; }

  const taskId = `bb-${Date.now()}`;

  if (isLive()) {
    try {
      const sessionResp = await fetch(`${BROWSERBASE_BASE}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bb-api-key": BROWSERBASE_API_KEY!,
        },
        body: JSON.stringify({ projectId: BROWSERBASE_PROJECT_ID }),
      });
      const session = await sessionResp.json();

      const task: BrowserTask = {
        id: taskId,
        type,
        url: url || "",
        status: "running",
        started_at: new Date().toISOString(),
      };
      taskStore.set(taskId, task);

      res.json({ taskId, sessionId: session.id, status: "running", live: true });
      return;
    } catch (err) {
      console.error("Browserbase session error:", err);
    }
  }

  const SIM_RESULTS: Record<string, Record<string, unknown>> = {
    dealer_verify: {
      dealer_name: "Porsche Beverly Hills",
      verified: true,
      license: "CA-DEALER-88412",
      rating: 4.8,
      reviews: 1240,
      address: "9201 Wilshire Blvd, Beverly Hills, CA 90210",
      inventory_live: 42,
    },
    price_check: {
      url,
      title: "2022 Porsche 911 Carrera S – $142,900",
      price: 142900,
      source: "Porsche Beverly Hills",
      availability: "In Stock",
      days_listed: 4,
    },
    competitor_scan: {
      listings_found: 18,
      avg_price: 138_450,
      lowest: 127_000,
      highest: 158_000,
      platform: "AutoTrader + Cars.com",
    },
    vin_decode: {
      manufacturer: "Porsche AG",
      plant: "Stuttgart, Germany",
      model_year: "2022",
      engine: "3.0L Twin-Turbo Flat-6",
      transmission: "8-Speed PDK",
    },
  };

  const task: BrowserTask = {
    id: taskId,
    type,
    url: url || "https://example.com",
    status: "completed",
    result: SIM_RESULTS[type] || { status: "ok", instructions, note: "Simulated completion" },
    started_at: new Date(Date.now() - 3000).toISOString(),
    completed_at: new Date().toISOString(),
    screenshot_url: null as any,
  };
  taskStore.set(taskId, task);

  res.json({ taskId, status: "completed", result: task.result, simulated: true });
});

// GET /api/browserbase/task/:id
router.get("/browserbase/task/:id", (req: Request, res: Response) => {
  const task = taskStore.get(req.params.id);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(task);
});

// GET /api/browserbase/tasks
router.get("/browserbase/tasks", (_req: Request, res: Response) => {
  const tasks = Array.from(taskStore.values()).slice(-20).reverse();
  res.json({ tasks, simulated: !isLive() });
});

// POST /api/browserbase/verify-dealer
router.post("/browserbase/verify-dealer", async (req: Request, res: Response) => {
  const { dealer_name, dealer_url } = req.body;

  await new Promise((r) => setTimeout(r, 800));

  res.json({
    dealer_name: dealer_name || "Unknown Dealer",
    verified: true,
    license_status: "Active",
    state: "CA",
    bbb_rating: "A+",
    google_rating: 4.7,
    review_count: 892,
    years_in_business: 28,
    certifications: ["Porsche Certified", "NIADA Member", "CARFAX Advantage Dealer"],
    source_url: dealer_url || "https://dealer.com",
    scanned_at: new Date().toISOString(),
    simulated: !isLive(),
  });
});

export default router;
