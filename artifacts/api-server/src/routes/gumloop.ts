import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GUMLOOP_API_KEY = process.env.GUMLOOP_API_KEY;
const GUMLOOP_BASE = "https://api.gumloop.com/v1";

function isLive() {
  return !!GUMLOOP_API_KEY;
}

type WorkflowRun = {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: "running" | "completed" | "failed";
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
};

const runStore = new Map<string, WorkflowRun>();

const WORKFLOWS = [
  {
    id: "wf-001",
    name: "Vehicle Research Agent",
    description: "Browses listings, pulls history, cross-references pricing data for a VIN",
    icon: "🔍",
    category: "Research",
    avg_duration_ms: 8200,
    input_schema: ["vin", "target_price"],
  },
  {
    id: "wf-002",
    name: "Insurance Comparison Engine",
    description: "Fetches and ranks insurance quotes across 12 carriers for your vehicle profile",
    icon: "🛡️",
    category: "Insurance",
    avg_duration_ms: 4500,
    input_schema: ["vin", "year", "make", "model"],
  },
  {
    id: "wf-003",
    name: "Market Opportunity Scanner",
    description: "Monitors 8 marketplaces for underpriced luxury vehicles matching your criteria",
    icon: "📡",
    category: "Market Intel",
    avg_duration_ms: 12000,
    input_schema: ["make", "model", "max_price", "max_miles"],
  },
  {
    id: "wf-004",
    name: "Specialist BGC Accelerator",
    description: "Streamlines Checkr background check with document extraction and pre-fill",
    icon: "✅",
    category: "Compliance",
    avg_duration_ms: 6000,
    input_schema: ["applicant_name", "email", "dl_state"],
  },
  {
    id: "wf-005",
    name: "Financial Health Report",
    description: "Aggregates Plaid account data and generates a 3C member financial summary",
    icon: "💰",
    category: "Finance",
    avg_duration_ms: 3800,
    input_schema: ["access_token"],
  },
  {
    id: "wf-006",
    name: "Delivery Route Optimizer",
    description: "Analyzes traffic, runner locations, and schedules optimal delivery windows",
    icon: "🗺️",
    category: "Logistics",
    avg_duration_ms: 2200,
    input_schema: ["origin_zip", "destination_zip", "vehicle_id"],
  },
];

const SIM_OUTPUTS: Record<string, Record<string, unknown>> = {
  "wf-001": {
    vin_decoded: { year: 2022, make: "Porsche", model: "911 Carrera S" },
    history_score: 94,
    accidents: 0,
    owners: 1,
    market_value: 142_900,
    price_gap: -2100,
    recommendation: "BUY — Priced $2,100 below market. Clean title, single owner.",
    confidence: 0.91,
  },
  "wf-002": {
    best_quote: { provider: "Hagerty Collector", monthly: 504, coverage: 500_000 },
    quotes_evaluated: 12,
    savings_vs_standard: 28,
    recommended_deductible: 0,
  },
  "wf-003": {
    opportunities_found: 7,
    best_deal: { title: "2021 Ferrari Roma", price: 187_000, below_market_pct: 9.4, source: "DuPont Registry" },
    avg_discount: "6.2%",
    alert_set: true,
  },
  "wf-004": {
    candidate_ready: true,
    documents_extracted: ["Driver's License", "Social Security Card"],
    checkr_pre_filled: true,
    estimated_turnaround: "48 hours",
  },
  "wf-005": {
    net_worth: 493_680.75,
    credit_utilization: "13.8%",
    monthly_cash_flow: 12_450,
    member_tier: "Platinum",
    vehicle_purchasing_power: 285_000,
  },
  "wf-006": {
    optimal_window: "2:00 PM – 4:00 PM",
    runner_eta_minutes: 18,
    route_miles: 24.3,
    traffic_grade: "B+",
    co2_offset_lbs: 12.4,
  },
};

// GET /api/gumloop/workflows
router.get("/gumloop/workflows", (_req: Request, res: Response) => {
  res.json({ workflows: WORKFLOWS, simulated: !isLive() });
});

// POST /api/gumloop/run
router.post("/gumloop/run", async (req: Request, res: Response) => {
  const { workflow_id, inputs } = req.body;
  if (!workflow_id) { res.status(400).json({ error: "workflow_id required" }); return; }

  const wf = WORKFLOWS.find((w) => w.id === workflow_id);
  if (!wf) { res.status(404).json({ error: "Workflow not found" }); return; }

  const runId = `run-${Date.now()}`;

  if (isLive()) {
    try {
      const resp = await fetch(`${GUMLOOP_BASE}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GUMLOOP_API_KEY}`,
        },
        body: JSON.stringify({ workflow_id, inputs }),
      });
      const data = await resp.json();
      runStore.set(runId, { id: runId, workflow_id, workflow_name: wf.name, status: "running", inputs: inputs || {}, started_at: new Date().toISOString() });
      res.json({ runId, ...data, live: true });
      return;
    } catch (err) {
      console.error("Gumloop run error:", err);
    }
  }

  const run: WorkflowRun = {
    id: runId,
    workflow_id,
    workflow_name: wf.name,
    status: "running",
    inputs: inputs || {},
    started_at: new Date().toISOString(),
  };
  runStore.set(runId, run);

  setTimeout(() => {
    const r = runStore.get(runId);
    if (r) {
      r.status = "completed";
      r.outputs = SIM_OUTPUTS[workflow_id] || { result: "Workflow completed successfully." };
      r.completed_at = new Date().toISOString();
      r.duration_ms = wf.avg_duration_ms;
      runStore.set(runId, r);
    }
  }, Math.min(wf.avg_duration_ms, 6000));

  res.json({ runId, status: "running", workflow_name: wf.name, simulated: true });
});

// GET /api/gumloop/run/:id
router.get("/gumloop/run/:id", (req: Request, res: Response) => {
  const run = runStore.get(req.params.id);
  if (!run) { res.status(404).json({ error: "Run not found" }); return; }
  res.json({ ...run, simulated: !isLive() });
});

// GET /api/gumloop/runs
router.get("/gumloop/runs", (_req: Request, res: Response) => {
  const runs = Array.from(runStore.values()).slice(-10).reverse();
  res.json({ runs, simulated: !isLive() });
});

export default router;
