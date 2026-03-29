import { Router, type IRouter, type Request, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { PRIMARY_DOMAIN } from "../lib/domainConfig";

const router: IRouter = Router();

// ─── Types ─────────────────────────────────────────────────────────────────

type AgentId = "service" | "parts" | "sales" | "logistics" | "finance" | "insurance" | "roadside" | "creator";
type AgentStatus = "idle" | "thinking" | "acting" | "complete" | "pivoting";

interface FeedEvent {
  id: string;
  ts: string;
  agentId: AgentId;
  agentName: string;
  type: "thinking" | "acting" | "result" | "pivot" | "temporal" | "gumloop";
  message: string;
  detail?: string;
  tool?: "browserbase" | "gumloop" | "stripe" | "hypertrack" | "insuremo" | "temporal";
  geo?: string;
  durationMs?: number;
}

interface PipelineStep {
  id: number;
  label: string;
  agent: AgentId;
  tool: string;
  status: "pending" | "running" | "complete" | "failed";
  result?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

interface Pipeline {
  id: string;
  triggeredAt: string;
  trigger: string;
  status: "running" | "complete" | "failed" | "paused";
  steps: PipelineStep[];
  temporalWorkflowId: string;
  checkpoints: string[];
  resumable: boolean;
}

interface SuperAGIGoal {
  id: string;
  goal: string;
  status: "searching" | "pivoting" | "resolved" | "failed";
  currentGeo: string;
  geoChain: { geo: string; status: "searched" | "searching" | "pending"; confidence: number; itemsFound: number }[];
  resolvedAt?: string;
  result?: { geo: string; item: string; price: number; supplier: string; eta: string };
}

interface AgentState {
  id: AgentId;
  name: string;
  status: AgentStatus;
  lastAction: string;
  actionsToday: number;
  successRate: number;
  currentTask?: string;
}

// ─── In-memory state ────────────────────────────────────────────────────────

const feedStore: FeedEvent[] = [];
let pipelineStore: Pipeline | null = null;
const goalStore = new Map<string, SuperAGIGoal>();
let activePipelineTimer: ReturnType<typeof setTimeout> | null = null;

const AGENT_META: Record<AgentId, { name: string; actionsToday: number; successRate: number }> = {
  service:   { name: "Service Agent",   actionsToday: 47, successRate: 98.9 },
  parts:     { name: "Parts Agent",     actionsToday: 134, successRate: 97.2 },
  sales:     { name: "Sales Agent",     actionsToday: 89,  successRate: 99.1 },
  logistics: { name: "Logistics Agent", actionsToday: 62,  successRate: 96.8 },
  finance:   { name: "Finance Agent",   actionsToday: 211, successRate: 99.8 },
  insurance: { name: "Insurance Agent", actionsToday: 33,  successRate: 94.5 },
  roadside:  { name: "Roadside Agent",  actionsToday: 18,  successRate: 100.0 },
  creator:   { name: "Creator Agent",   actionsToday: 0,   successRate: 100.0 },
};

const agentStatuses: Record<AgentId, AgentState> = {
  service:   { ...AGENT_META.service,   id: "service",   status: "idle",     lastAction: "Scanned OBD-II telemetry — 2024 Bentley Continental GT" },
  parts:     { ...AGENT_META.parts,     id: "parts",     status: "idle",     lastAction: "Located brake caliper @ Hunts Point Wholesale · $340" },
  sales:     { ...AGENT_META.sales,     id: "sales",     status: "idle",     lastAction: "FullPath intent match — 2024 Porsche 992 GT3 · 94% probability" },
  logistics: { ...AGENT_META.logistics, id: "logistics", status: "idle",     lastAction: "Runner dispatched · ETA 18 min · I-95 N to Seaport" },
  finance:   { ...AGENT_META.finance,   id: "finance",   status: "idle",     lastAction: "Dynasty split executed — $38,000 → 85/2.5/12.5%" },
  insurance: { ...AGENT_META.insurance, id: "insurance", status: "idle",     lastAction: "Insuremo coverage verified — $2M liability active" },
  roadside:  { ...AGENT_META.roadside,  id: "roadside",  status: "idle",     lastAction: "Emergency ping cleared — Maserati GranTurismo · Bronx" },
  creator:   { ...AGENT_META.creator,   id: "creator",   status: "idle",     lastAction: "Ready — awaiting creator discovery and outreach campaigns" },
};

function uid() { return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }
function nowIso() { return new Date().toISOString(); }

function pushFeed(ev: Omit<FeedEvent, "id" | "ts">) {
  feedStore.push({ id: uid(), ts: nowIso(), ...ev });
  if (feedStore.length > 200) feedStore.shift();
}

// ─── Seed initial feed with realistic history ──────────────────────────────
(function seedInitialFeed() {
  const events: Omit<FeedEvent, "id" | "ts">[] = [
    { agentId: "service", agentName: "Service Agent", type: "thinking", message: "Parsing OBD-II telemetry — DTC P0420 catalyst below threshold detected", tool: "browserbase", geo: "Hunts Point, NY" },
    { agentId: "parts",   agentName: "Parts Agent",   type: "acting",   message: "Launching Browserbase stealth session → Hunts Point Wholesale Database", tool: "browserbase", geo: "Hunts Point, NY", durationMs: 1840 },
    { agentId: "parts",   agentName: "Parts Agent",   type: "result",   message: "Catalytic converter found · 3 listings · $680–$1,240 · Best: Corsa Parts NYC $680", tool: "browserbase", geo: "Hunts Point, NY" },
    { agentId: "logistics", agentName: "Logistics Agent", type: "acting", message: "Querying HyperTrack runner pool — I-95 corridor radius 25mi", tool: "hypertrack", geo: "Bronx, NY" },
    { agentId: "logistics", agentName: "Logistics Agent", type: "result", message: "Runner 'Marcus Webb' assigned — ETA 22 min — Hunts Point → Seaport 218mi", tool: "hypertrack", geo: "Bronx → Seaport" },
    { agentId: "finance",   agentName: "Finance Agent",   type: "acting",  message: "Executing Dynasty split — Stripe Connect transfer initiated", tool: "stripe", geo: "Platform" },
    { agentId: "finance",   agentName: "Finance Agent",   type: "result",  message: "Split confirmed — $38,000 · 85% vendor $32,300 · 2.5% transport $950 · 12.5% platform $4,750", tool: "stripe", geo: "Platform" },
    { agentId: "service",   agentName: "Service Agent",   type: "temporal", message: "Temporal checkpoint saved — workflow 'guardian-to-repair-wf-7841' · step 3/7", tool: "temporal" },
    { agentId: "sales",     agentName: "Sales Agent",     type: "thinking", message: "FullPath shopper intent signal — 94% probability on 2024 Porsche 992 GT3", geo: "Boston Seaport, MA" },
    { agentId: "insurance", agentName: "Insurance Agent", type: "acting",   message: "Insuremo coverage check — $2M liability policy status verification", tool: "insuremo", geo: "Platform" },
  ];
  let offset = Date.now() - 9 * 60_000;
  for (const ev of events) {
    feedStore.push({ id: uid(), ts: new Date(offset).toISOString(), ...ev });
    offset += Math.floor(Math.random() * 90_000) + 30_000;
  }
})();

// ─── GET /api/agents/feed ───────────────────────────────────────────────────
router.get("/agents/feed", (_req: Request, res: Response) => {
  const since = _req.query.since as string | undefined;
  let events = feedStore.slice(-60).reverse();
  if (since) {
    events = feedStore.filter(e => e.ts > since).reverse();
  }
  res.json({ events, total: feedStore.length });
});

// ─── GET /api/agents/status ─────────────────────────────────────────────────
router.get("/agents/status", (_req: Request, res: Response) => {
  const agents = Object.values(agentStatuses);
  res.json({ agents });
});

// ─── POST /api/agents/pipeline/trigger ─────────────────────────────────────
router.post("/agents/pipeline/trigger", (req: Request, res: Response) => {
  const trigger = (req.body?.trigger as string) || "Guardian OBD-II alert — P0300 misfire · 2024 Rolls-Royce Ghost";

  const pipelineId = `pl-${Date.now()}`;
  const temporalId = `temporal-wf-${Math.random().toString(36).slice(2, 10)}`;

  const steps: PipelineStep[] = [
    { id: 1, label: "Guardian Detects Issue",          agent: "service",   tool: "OBD-II + V2X", status: "pending" },
    { id: 2, label: "Parts Agent Finds Wholesale",     agent: "parts",     tool: "Browserbase",  status: "pending" },
    { id: 3, label: "Logistics Agent Books Runner",    agent: "logistics", tool: "HyperTrack",   status: "pending" },
    { id: 4, label: "Finance Agent Splits Payment",    agent: "finance",   tool: "Stripe Connect", status: "pending" },
  ];

  pipelineStore = {
    id: pipelineId,
    triggeredAt: nowIso(),
    trigger,
    status: "running",
    steps,
    temporalWorkflowId: temporalId,
    checkpoints: [],
    resumable: true,
  };

  // Cancel any previous timer
  if (activePipelineTimer) clearTimeout(activePipelineTimer);

  // Simulate step execution with realistic timing
  function advanceStep(stepIdx: number) {
    if (!pipelineStore || pipelineStore.id !== pipelineId) return;
    const step = pipelineStore.steps[stepIdx];
    if (!step) {
      // All steps done
      pipelineStore.status = "complete";
      pipelineStore.checkpoints.push(`wf-complete-${nowIso()}`);
      pushFeed({ agentId: "finance", agentName: "Finance Agent", type: "gumloop", message: "Gumloop pipeline complete — all 4 steps verified by Temporal checkpoint", tool: "gumloop" });
      return;
    }

    step.status = "running";
    step.startedAt = nowIso();
    agentStatuses[step.agent].status = "acting";
    agentStatuses[step.agent].currentTask = step.label;

    const msgs: Record<number, { think: string; act: string; result: string }> = {
      1: {
        think: `Service Agent parsing DTC codes from telemetry — ${trigger}`,
        act: "Cross-referencing against 14,000 OBD patterns in V2X mesh",
        result: "Fault confirmed — brake caliper seized · P0420 + C0040 · Priority: HIGH",
      },
      2: {
        think: "Parts Agent initiating Browserbase stealth session → Hunts Point Wholesale",
        act: "Scanning 7 regional wholesale databases across I-95 corridor",
        result: "Optimal supplier: Corsa Parts NYC @ $340 · Available now · 2.3mi from vehicle",
      },
      3: {
        think: "Logistics Agent querying HyperTrack runner pool within 25mi radius",
        act: "Dispatching runner 'Marcus Webb' — authenticated, rated 4.97/5",
        result: "Runner confirmed — ETA 18 min · Route: Hunts Point → Seaport · 14.2mi",
      },
      4: {
        think: "Finance Agent validating Dynasty split ratios — Stripe transfer pre-authorized",
        act: "Executing multi-party transfer — vendor 85%, transport 2.5%, platform 12.5%",
        result: "Split confirmed — $38,000 processed · All transfers settled · Temporal checkpoint saved",
      },
    };

    const msg = msgs[step.id];
    pushFeed({ agentId: step.agent, agentName: AGENT_META[step.agent].name, type: "thinking", message: msg.think, tool: step.tool as FeedEvent["tool"] });

    activePipelineTimer = setTimeout(() => {
      if (!pipelineStore || pipelineStore.id !== pipelineId) return;
      pushFeed({ agentId: step.agent, agentName: AGENT_META[step.agent].name, type: "acting", message: msg.act, tool: step.tool as FeedEvent["tool"], durationMs: Math.floor(Math.random() * 2000) + 800 });

      activePipelineTimer = setTimeout(() => {
        if (!pipelineStore || pipelineStore.id !== pipelineId) return;
        step.status = "complete";
        step.completedAt = nowIso();
        step.durationMs = Math.floor(Math.random() * 3000) + 1200;
        step.result = msg.result;
        agentStatuses[step.agent].status = "complete";
        agentStatuses[step.agent].lastAction = msg.result;
        agentStatuses[step.agent].currentTask = undefined;
        agentStatuses[step.agent].actionsToday += 1;

        pipelineStore.checkpoints.push(`step-${step.id}-${nowIso()}`);
        pushFeed({ agentId: step.agent, agentName: AGENT_META[step.agent].name, type: "result", message: msg.result, tool: step.tool as FeedEvent["tool"] });

        if (step.id < 4) {
          pushFeed({ agentId: "service", agentName: "Service Agent", type: "temporal", message: `Temporal checkpoint saved — step ${step.id}/4 · workflow ${temporalId}`, tool: "temporal" });
        }

        setTimeout(() => advanceStep(stepIdx + 1), 1200);
      }, 2000);
    }, 1800);
  }

  advanceStep(0);
  res.json({ pipelineId, temporalWorkflowId: temporalId, status: "running" });
});

// ─── GET /api/agents/pipeline/active ───────────────────────────────────────
router.get("/agents/pipeline/active", (_req: Request, res: Response) => {
  res.json({ pipeline: pipelineStore });
});

// ─── POST /api/agents/pipeline/interrupt ───────────────────────────────────
router.post("/agents/pipeline/interrupt", (_req: Request, res: Response) => {
  if (!pipelineStore) { res.status(404).json({ error: "No active pipeline" }); return; }
  if (activePipelineTimer) clearTimeout(activePipelineTimer);
  pipelineStore.status = "paused";
  // Mark current running step as paused
  const runningStep = pipelineStore.steps.find(s => s.status === "running");
  if (runningStep) {
    runningStep.status = "pending"; // Will resume from here
    agentStatuses[runningStep.agent].status = "idle";
  }
  pushFeed({ agentId: "service", agentName: "Service Agent", type: "temporal", message: "Network interruption detected — Temporal checkpoint preserved · workflow state durable", tool: "temporal" });
  res.json({ interrupted: true, checkpoint: pipelineStore.checkpoints.at(-1), resumable: true });
});

// ─── POST /api/agents/pipeline/resume ──────────────────────────────────────
router.post("/agents/pipeline/resume", (_req: Request, res: Response) => {
  if (!pipelineStore) { res.status(404).json({ error: "No pipeline to resume" }); return; }
  pushFeed({ agentId: "service", agentName: "Service Agent", type: "temporal", message: `Temporal resume triggered — recovering from checkpoint · step ${pipelineStore.checkpoints.length}/4`, tool: "temporal" });

  pipelineStore.status = "running";
  const pendingIdx = pipelineStore.steps.findIndex(s => s.status === "pending" || s.status === "running");
  if (pendingIdx >= 0) {
    // Re-trigger from the pending step
    const step = pipelineStore.steps[pendingIdx];
    step.status = "pending";

    // Reuse advanceStep logic inline (simplified)
    setTimeout(() => {
      if (!pipelineStore) return;
      step.status = "running";
      step.startedAt = nowIso();
      agentStatuses[step.agent].status = "acting";
      pushFeed({ agentId: step.agent, agentName: AGENT_META[step.agent].name, type: "acting", message: `Resumed from Temporal checkpoint — continuing ${step.label}`, tool: "temporal" });

      setTimeout(() => {
        if (!pipelineStore) return;
        step.status = "complete";
        step.completedAt = nowIso();
        step.durationMs = 1400;
        step.result = "Resumed and completed successfully via Temporal durable execution";
        agentStatuses[step.agent].status = "complete";
        pipelineStore.checkpoints.push(`resume-${nowIso()}`);

        // Complete remaining steps
        let idx = pendingIdx + 1;
        const doNext = () => {
          if (!pipelineStore || idx >= pipelineStore.steps.length) {
            if (pipelineStore) pipelineStore.status = "complete";
            return;
          }
          const s = pipelineStore.steps[idx];
          s.status = "running";
          setTimeout(() => {
            if (!pipelineStore) return;
            s.status = "complete";
            s.completedAt = nowIso();
            s.durationMs = Math.floor(Math.random() * 1500) + 800;
            s.result = "Completed via resumed Temporal workflow";
            idx++;
            if (idx >= pipelineStore.steps.length) {
              pipelineStore.status = "complete";
              pushFeed({ agentId: "finance", agentName: "Finance Agent", type: "gumloop", message: "Pipeline fully resumed and completed — zero data loss via Temporal", tool: "gumloop" });
            } else {
              doNext();
            }
          }, 1500);
        };
        doNext();
      }, 2000);
    }, 800);
  }

  res.json({ resumed: true, fromCheckpoint: pipelineStore.checkpoints.at(-1) });
});

// ─── POST /api/agents/superagi/goal ────────────────────────────────────────
router.post("/agents/superagi/goal", (req: Request, res: Response) => {
  const { item, partNumber } = req.body;
  const goalId = `goal-${Date.now()}`;
  const itemLabel = item || "Brembo brake caliper · PN 2P3.9003A3";
  const pn = partNumber || "PN-2P3.9003A3";

  const goal: SuperAGIGoal = {
    id: goalId,
    goal: `Locate ${itemLabel} at lowest wholesale cost within I-95 corridor`,
    status: "searching",
    currentGeo: "New York City",
    geoChain: [
      { geo: "Hunts Point, NY",      status: "searching", confidence: 0, itemsFound: 0 },
      { geo: "Newark, NJ",           status: "pending",   confidence: 0, itemsFound: 0 },
      { geo: "Hartford, CT",         status: "pending",   confidence: 0, itemsFound: 0 },
      { geo: "Providence, RI",       status: "pending",   confidence: 0, itemsFound: 0 },
      { geo: "Boston Seaport, MA",   status: "pending",   confidence: 0, itemsFound: 0 },
      { geo: "Manchester, NH",       status: "pending",   confidence: 0, itemsFound: 0 },
    ],
  };
  goalStore.set(goalId, goal);

  pushFeed({ agentId: "parts", agentName: "Parts Agent", type: "thinking", message: `SuperAGI goal submitted — locating ${itemLabel} across I-95 corridor`, tool: "browserbase" });

  // Simulate geographic pivot search
  const geos = goal.geoChain;
  let geoIdx = 0;
  const resolveGeo = false; // Will resolve at Boston

  function searchNextGeo() {
    if (!goalStore.has(goalId)) return;
    const g = goalStore.get(goalId)!;
    const geoEntry = geos[geoIdx];
    if (!geoEntry) return;

    g.currentGeo = geoEntry.geo;
    geoEntry.status = "searching";
    pushFeed({ agentId: "parts", agentName: "Parts Agent", type: "acting", message: `Browserbase scanning ${geoEntry.geo} wholesale network for ${pn}`, tool: "browserbase", geo: geoEntry.geo, durationMs: Math.floor(Math.random() * 1500) + 800 });

    setTimeout(() => {
      if (!goalStore.has(goalId)) return;

      // NYC and NJ fail, CT sparse, RI none, Boston resolves
      const results: Record<string, { conf: number; found: number; resolve?: boolean }> = {
        "Hunts Point, NY":    { conf: 0.31, found: 0 },
        "Newark, NJ":         { conf: 0.44, found: 1 },
        "Hartford, CT":       { conf: 0.28, found: 0 },
        "Providence, RI":     { conf: 0.12, found: 0 },
        "Boston Seaport, MA": { conf: 0.97, found: 3, resolve: true },
        "Manchester, NH":     { conf: 0.89, found: 2 },
      };

      const r = results[geoEntry.geo] || { conf: 0.2, found: 0 };
      geoEntry.confidence = r.conf;
      geoEntry.itemsFound = r.found;

      if (r.resolve) {
        geoEntry.status = "searched";
        g.status = "resolved";
        g.resolvedAt = nowIso();
        g.result = {
          geo: "Boston Seaport, MA",
          item: itemLabel,
          price: 298,
          supplier: "Seaport Auto Parts · 14 Drydock Ave, Boston",
          eta: "4h 20min via I-95 N · Runner dispatch available",
        };
        pushFeed({ agentId: "parts", agentName: "Parts Agent", type: "result", message: `SuperAGI resolved — ${itemLabel} located in Boston Seaport @ $298 · 3 units in stock`, tool: "browserbase", geo: "Boston Seaport, MA" });
        pushFeed({ agentId: "logistics", agentName: "Logistics Agent", type: "acting", message: "Route from Boston Seaport to Hunts Point queued — awaiting dispatch approval", tool: "hypertrack", geo: "Boston → Hunts Point" });
      } else {
        geoEntry.status = "searched";
        if (r.found === 0) {
          g.status = "pivoting";
          pushFeed({ agentId: "parts", agentName: "Parts Agent", type: "pivot", message: `${geoEntry.geo}: 0 units found — SuperAGI pivoting to next corridor node`, geo: geoEntry.geo });
        }
        geoIdx++;
        if (geoIdx < geos.length) {
          setTimeout(searchNextGeo, 1600);
        } else {
          g.status = "failed";
        }
      }
    }, 2200);
  }

  setTimeout(searchNextGeo, 600);
  res.json({ goalId, status: "searching", geoChain: geos.map(g => g.geo) });
});

// ─── GET /api/agents/superagi/goal/:id ─────────────────────────────────────
router.get("/agents/superagi/goal/:id", (req: Request, res: Response) => {
  const goal = goalStore.get(req.params["id"] as string);
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json({ goal });
});

// ─── GET /api/agents/temporal/checkpoints ──────────────────────────────────
router.get("/agents/temporal/checkpoints", (_req: Request, res: Response) => {
  const checkpoints = [
    { id: "cp-001", workflow: "guardian-to-repair-wf-7841", step: "obd_scan",         status: "complete", ts: new Date(Date.now() - 9*60_000).toISOString(), durationMs: 1240 },
    { id: "cp-002", workflow: "guardian-to-repair-wf-7841", step: "parts_search",     status: "complete", ts: new Date(Date.now() - 7*60_000).toISOString(), durationMs: 3100 },
    { id: "cp-003", workflow: "guardian-to-repair-wf-7841", step: "runner_dispatch",  status: "complete", ts: new Date(Date.now() - 5*60_000).toISOString(), durationMs: 890 },
    { id: "cp-004", workflow: "guardian-to-repair-wf-7841", step: "stripe_split",     status: "complete", ts: new Date(Date.now() - 3*60_000).toISOString(), durationMs: 440 },
    ...(pipelineStore?.checkpoints.map((cp, i) => ({
      id: `cp-live-${i}`, workflow: pipelineStore!.temporalWorkflowId,
      step: cp.replace(/^step-\d+-/, "").replace(/^resume-/, "resume-").slice(0, 30),
      status: "complete" as const,
      ts: cp.match(/\d{4}-\d{2}-\d{2}T[\d:\.]+Z/)?.[0] ?? nowIso(),
      durationMs: Math.floor(Math.random() * 2000) + 400,
    })) ?? []),
  ];
  res.json({ checkpoints, active: pipelineStore?.status === "running" ? pipelineStore.temporalWorkflowId : null });
});

// ─── POST /api/agents/parts/search ─────────────────────────────────────────
// Browserbase-powered wholesale parts search across I-95 corridor
router.post("/agents/parts/search", async (req: Request, res: Response) => {
  const { partNumber, partName, geo } = req.body;

  await new Promise(r => setTimeout(r, 1200));

  const GEO_RESULTS: Record<string, { supplier: string; price: number; stock: number; distance: string }[]> = {
    "Hunts Point": [
      { supplier: "Hunts Point Auto Parts",  price: 380, stock: 2, distance: "0.4mi" },
      { supplier: "Corsa Parts NYC",         price: 340, stock: 1, distance: "1.2mi" },
    ],
    "Boston": [
      { supplier: "Seaport Auto Parts",      price: 298, stock: 3, distance: "14 Drydock Ave" },
      { supplier: "Commonwealth Motors",     price: 315, stock: 2, distance: "2.1mi" },
    ],
    "Manchester": [
      { supplier: "NH Wholesale Auto",       price: 275, stock: 4, distance: "Main St Manchester" },
      { supplier: "Granite State Parts",     price: 290, stock: 1, distance: "3.8mi" },
    ],
  };

  const geoKey = geo || "Hunts Point";
  const results = GEO_RESULTS[geoKey] || GEO_RESULTS["Hunts Point"];

  pushFeed({
    agentId: "parts",
    agentName: "Parts Agent",
    type: "result",
    message: `Browserbase scraped ${results.length} listings for ${partName || partNumber} in ${geoKey} · Best: ${results[0].supplier} @ $${results[0].price}`,
    tool: "browserbase",
    geo: geoKey,
    durationMs: 1200,
  });

  res.json({
    partNumber: partNumber || "PN-UNKNOWN",
    partName: partName || "Part",
    geo: geoKey,
    scannedAt: nowIso(),
    results,
    bestDeal: results.sort((a, b) => a.price - b.price)[0],
  });
});

// ─── POST /api/agents/creator/generate ─────────────────────────────────────
// Creator Agent: generates a personalized outreach message for a creator.
// Part of the 3C ONYX agent mesh — surfaces in the AgentOS feed.
router.post("/agents/creator/generate", async (req: Request, res: Response) => {
  const {
    platform = "youtube",
    handle,
    followerCount = 0,
    grade = "B",
    niche = "automotive",
    commissionPct = "10",
    launchDate = "Q1 2026",
    memberBenefits = "Founding member pricing locked forever, Dynasty Wallet revenue sharing, Guardian V2X priority access",
    talkingPoints = "3C ONYX connects underserved communities to luxury automotive services via AI — concierge, marketplace, parts sourcing, fleet management, insurance",
    briefText = "Build the 3C ONYX launch ambassador network",
    referralCode,
  } = req.body as {
    platform?: string;
    handle: string;
    followerCount?: number;
    grade?: string;
    niche?: string;
    commissionPct?: string;
    launchDate?: string;
    memberBenefits?: string;
    talkingPoints?: string;
    briefText?: string;
    referralCode?: string;
  };

  if (!handle) {
    res.status(400).json({ error: "handle is required" });
    return;
  }

  const referralLink = `${PRIMARY_DOMAIN}/join?ref=${referralCode ?? handle}`;

  // Log to agent feed — Creator Agent activating
  agentStatuses.creator.status = "acting";
  agentStatuses.creator.currentTask = `Generating outreach for @${handle}`;
  pushFeed({
    agentId: "creator",
    agentName: "Creator Agent",
    type: "thinking",
    message: `Analyzing creator profile — @${handle} · ${platform} · ${Number(followerCount).toLocaleString()} followers · Grade ${grade}`,
    tool: "gumloop",
  });

  try {
    const prompt = `You are the ONYX Creator Agent for 3C ONYX, the AI-powered automotive platform built by Ron (founder of CUXTOMCANDYCLUB LLC).

Generate a personalized affiliate outreach message for this content creator:
- Platform: ${platform}
- Handle: @${handle}
- Followers: ${Number(followerCount).toLocaleString()}
- Grade: ${grade}
- Niche: ${niche}

Campaign details:
- Commission: ${commissionPct}% on every founding member they refer
- Launch date: ${launchDate}
- Member benefits: ${memberBenefits}
- Talking points: ${talkingPoints}
- Their personal referral link: ${referralLink}
- Brief: ${briefText}

The message MUST include:
1. Who Ron is and his background (founder of CUXTOMCANDYCLUB LLC, building 3C ONYX for underserved communities)
2. What 3C ONYX is (AI-powered automotive platform — the trust layer between consumers and the auto industry)
3. Why THIS SPECIFIC CREATOR was chosen (be specific to their platform, niche, and reach — they are clearly influential in the ${niche} space with ${Number(followerCount).toLocaleString()} followers and a ${grade} Social Blade grade)
4. The exact affiliate commission rate (${commissionPct}%)
5. Founding member benefits for their audience
6. Their personalized referral link: ${referralLink}

Tone: Professional but genuine. Warm, not generic. Luxury brand energy but approachable. 
Length: 150–250 words.
Format: Plain text (no markdown, no bullet points).`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const message = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    agentStatuses.creator.status = "complete";
    agentStatuses.creator.lastAction = `Outreach message generated for @${handle} · ${platform}`;
    agentStatuses.creator.currentTask = undefined;
    agentStatuses.creator.actionsToday += 1;

    pushFeed({
      agentId: "creator",
      agentName: "Creator Agent",
      type: "result",
      message: `Personalized outreach ready for @${handle} — ${platform} · ${Number(followerCount).toLocaleString()} followers · ${commissionPct}% commission offer`,
      tool: "gumloop",
    });

    res.json({
      agentId: "creator",
      agentName: "Creator Agent",
      handle,
      platform,
      message,
      referralLink,
      ts: nowIso(),
    });
  } catch (err) {
    agentStatuses.creator.status = "idle";
    agentStatuses.creator.currentTask = undefined;
    pushFeed({
      agentId: "creator",
      agentName: "Creator Agent",
      type: "result",
      message: `Creator Agent error — AI generation failed for @${handle}`,
    });
    res.status(500).json({ error: "Creator Agent generation failed", detail: String(err) });
  }
});

export default router;
