import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  Cpu, Globe, Zap, Network, Shield, ShoppingCart, Truck, DollarSign,
  ShieldCheck, Radio, Play, RefreshCw, CheckCircle, Circle, Clock,
  ChevronRight, MapPin, AlertTriangle, Activity, RotateCcw, Pause,
  Bot, Search, Layers, GitBranch,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ──────────────────────────────────────────────────────────────────
type AgentId = "service" | "parts" | "sales" | "logistics" | "finance" | "insurance" | "roadside";
type FeedEventType = "thinking" | "acting" | "result" | "pivot" | "temporal" | "gumloop";

interface FeedEvent {
  id: string; ts: string; agentId: AgentId; agentName: string;
  type: FeedEventType; message: string; detail?: string;
  tool?: string; geo?: string; durationMs?: number;
}

interface PipelineStep {
  id: number; label: string; agent: AgentId; tool: string;
  status: "pending" | "running" | "complete" | "failed";
  result?: string; durationMs?: number;
}

interface Pipeline {
  id: string; triggeredAt: string; trigger: string;
  status: "running" | "complete" | "failed" | "paused";
  steps: PipelineStep[]; temporalWorkflowId: string;
  checkpoints: string[]; resumable: boolean;
}

interface GeoEntry {
  geo: string; status: "searched" | "searching" | "pending";
  confidence: number; itemsFound: number;
}

interface SuperAGIGoal {
  id: string; goal: string; status: "searching" | "pivoting" | "resolved" | "failed";
  currentGeo: string; geoChain: GeoEntry[];
  resolvedAt?: string;
  result?: { geo: string; item: string; price: number; supplier: string; eta: string };
}

interface AgentState {
  id: AgentId; name: string; status: string;
  lastAction: string; actionsToday: number; successRate: number; currentTask?: string;
}

interface Checkpoint {
  id: string; workflow: string; step: string;
  status: string; ts: string; durationMs: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const AGENT_ICONS: Record<AgentId, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  service: Shield, parts: ShoppingCart, sales: DollarSign,
  logistics: Truck, finance: Zap, insurance: ShieldCheck, roadside: Radio,
};
const AGENT_COLORS: Record<AgentId, string> = {
  service: "#10B981", parts: "#4FC3F7", sales: "#C9A227",
  logistics: "#A78BFA", finance: "#F97316", insurance: "#34D399", roadside: "#F87171",
};
const STATUS_COLORS: Record<string, string> = {
  idle: "rgba(255,255,255,0.25)", thinking: "#C9A227", acting: "#818CF8",
  complete: "#10B981", pivoting: "#F97316",
};
const TYPE_COLOR: Record<FeedEventType, string> = {
  thinking: "#C9A227", acting: "#818CF8", result: "#10B981",
  pivot: "#F97316", temporal: "#4FC3F7", gumloop: "#A78BFA",
};
const TOOL_LABELS: Record<string, string> = {
  browserbase: "BB", gumloop: "GL", stripe: "Stripe",
  hypertrack: "HT", insuremo: "IM", temporal: "TP",
};

const PIPELINE_TRIGGERS = [
  "Guardian OBD-II alert — P0300 misfire · 2024 Rolls-Royce Ghost",
  "V2X ping — brake fade detected · 2024 Bentley Flying Spur",
  "Predictive fault — coolant breach risk · 2025 McLaren Artura",
  "DTC C0040 · seized caliper · 2023 Ferrari Roma",
];

const SUPERAGI_PARTS = [
  { item: "Brembo brake caliper", partNumber: "PN-2P3.9003A3" },
  { item: "Bosch fuel injector set", partNumber: "PN-0280150501" },
  { item: "Bilstein B8 shock absorber", partNumber: "PN-24-109793" },
  { item: "OEM coolant temperature sensor", partNumber: "PN-059919501A" },
];

function elapsed(ms?: number) {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function AgentPill({ agent }: { agent: AgentState }) {
  const Icon = AGENT_ICONS[agent.id as AgentId] || Bot;
  const col = AGENT_COLORS[agent.id as AgentId] || "#818CF8";
  const statusCol = STATUS_COLORS[agent.status] || "#fff";
  const isActive = agent.status === "thinking" || agent.status === "acting";
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl relative overflow-hidden"
      style={{ background: `${col}08`, border: `1px solid ${isActive ? col + "40" : col + "18"}`, minWidth: 0 }}
    >
      {isActive && (
        <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 0%, ${col}, transparent 70%)` }} />
      )}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${col}18` }}>
          <Icon className="w-3 h-3" style={{ color: col }} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {agent.name.replace(" Agent", "")}
          </p>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "animate-pulse" : ""}`} style={{ background: statusCol }} />
      </div>
      <div>
        <p style={{ fontSize: "9px", color: statusCol, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{agent.status}</p>
        <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", marginTop: "1px", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
          {agent.currentTask || agent.lastAction}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>{agent.actionsToday} today</span>
        <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 700 }}>{agent.successRate}%</span>
      </div>
    </div>
  );
}

function PipelineStepCard({ step, isActive }: { step: PipelineStep; isActive: boolean }) {
  const agentCol = AGENT_COLORS[step.agent] || "#818CF8";
  const AgentIcon = AGENT_ICONS[step.agent] || Bot;
  return (
    <div
      className="relative p-4 rounded-xl transition-all duration-300"
      style={{
        background: step.status === "complete" ? "rgba(16,185,129,0.05)"
          : step.status === "running" ? `${agentCol}08`
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${step.status === "complete" ? "rgba(16,185,129,0.2)"
          : step.status === "running" ? agentCol + "35"
          : "rgba(255,255,255,0.06)"}`,
        boxShadow: isActive ? `0 0 20px ${agentCol}20` : "none",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Step number / status icon */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
          style={{
            background: step.status === "complete" ? "rgba(16,185,129,0.15)"
              : step.status === "running" ? `${agentCol}15` : "rgba(255,255,255,0.05)",
            border: `1px solid ${step.status === "complete" ? "rgba(16,185,129,0.3)"
              : step.status === "running" ? agentCol + "40" : "rgba(255,255,255,0.1)"}`,
            color: step.status === "complete" ? "#10B981" : step.status === "running" ? agentCol : "rgba(255,255,255,0.3)",
          }}
        >
          {step.status === "complete" ? <CheckCircle className="w-4 h-4" />
            : step.status === "running" ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <span style={{ fontFamily: "monospace", fontSize: 12 }}>{step.id}</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: "12px", fontWeight: 700, color: step.status === "pending" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.9)" }}>
              {step.label}
            </p>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ fontSize: "8px", background: `${agentCol}12`, color: agentCol, border: `1px solid ${agentCol}20`, letterSpacing: "0.08em" }}
            >
              {step.tool}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <AgentIcon className="w-3 h-3" style={{ color: agentCol, opacity: 0.6 }} />
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
              {step.agent.charAt(0).toUpperCase() + step.agent.slice(1)} Agent
              {step.durationMs ? ` · ${elapsed(step.durationMs)}` : ""}
            </p>
          </div>
          {step.result && (
            <p style={{ fontSize: "9px", color: "#10B981", marginTop: "4px", lineHeight: 1.4 }}>{step.result}</p>
          )}
        </div>
      </div>

      {/* Connector arrow between steps */}
      {step.id < 4 && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div style={{ width: "1px", height: "8px", background: step.status === "complete" ? "#10B981" : "rgba(255,255,255,0.08)" }} />
          <ChevronRight className="w-3 h-3 rotate-90" style={{ color: step.status === "complete" ? "#10B981" : "rgba(255,255,255,0.1)" }} />
        </div>
      )}
    </div>
  );
}

function FeedRow({ event, isNew }: { event: FeedEvent; isNew?: boolean }) {
  const agentCol = AGENT_COLORS[event.agentId] || "#818CF8";
  const typeCol = TYPE_COLOR[event.type] || "#fff";
  const AgentIcon = AGENT_ICONS[event.agentId] || Bot;
  return (
    <div className={`flex gap-2.5 py-2.5 border-b ${isNew ? "feed-entry" : ""}`} style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${agentCol}15` }}>
        <AgentIcon className="w-2.5 h-2.5" style={{ color: agentCol }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span style={{ fontSize: "9px", fontWeight: 700, color: agentCol, letterSpacing: "0.06em" }}>{event.agentName.toUpperCase()}</span>
          <span style={{ fontSize: "8px", color: typeCol, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{event.type}</span>
          {event.tool && (
            <span className="px-1 rounded" style={{ fontSize: "7px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 700 }}>
              {TOOL_LABELS[event.tool] || event.tool}
            </span>
          )}
          {event.geo && (
            <span className="flex items-center gap-0.5" style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>
              <MapPin className="w-2 h-2" />{event.geo}
            </span>
          )}
        </div>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{event.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>{timeAgo(event.ts)}</span>
          {event.durationMs && <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)" }}>· {elapsed(event.durationMs)}</span>}
        </div>
      </div>
    </div>
  );
}

function GeoNode({ entry, isCurrent }: { entry: GeoEntry; isCurrent: boolean }) {
  const col = entry.status === "searched"
    ? (entry.itemsFound > 0 ? "#10B981" : "#EF4444")
    : entry.status === "searching" ? "#C9A227"
    : "rgba(255,255,255,0.15)";
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isCurrent ? `${col}10` : "rgba(255,255,255,0.02)",
        border: `1px solid ${isCurrent ? col + "35" : "rgba(255,255,255,0.06)"}`,
        boxShadow: isCurrent ? `0 0 12px ${col}20` : "none",
      }}
    >
      <div className="w-2.5 h-2.5 rounded-full shrink-0 transition-all" style={{ background: col, boxShadow: isCurrent ? `0 0 8px ${col}` : "none" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: "11px", fontWeight: 700, color: isCurrent ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
            {entry.geo}
          </p>
          {entry.status === "searching" && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: "#C9A227" }} />}
        </div>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>
          {entry.status === "pending" ? "Queued"
            : entry.status === "searching" ? "Scanning wholesale database via Browserbase..."
            : entry.itemsFound > 0 ? `${entry.itemsFound} unit${entry.itemsFound !== 1 ? "s" : ""} found · ${Math.round(entry.confidence * 100)}% confidence`
            : `No stock found · pivoting north`}
        </p>
      </div>
      {entry.status === "searched" && entry.itemsFound === 0 && (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#EF4444", opacity: 0.7 }} />
      )}
      {entry.status === "searched" && entry.itemsFound > 0 && (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#10B981" }} />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AgenticOS() {
  const qc = useQueryClient();
  const feedBottomRef = useRef<HTMLDivElement>(null);

  const [pipelineTrigger, setPipelineTrigger] = useState(PIPELINE_TRIGGERS[0]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState(SUPERAGI_PARTS[0]);
  const [isPipelinePolling, setIsPipelinePolling] = useState(false);
  const [lastFeedTs, setLastFeedTs] = useState<string | null>(null);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);

  // Agent status
  const { data: agentsData, refetch: refetchAgents } = useQuery<{ agents: AgentState[] }>({
    queryKey: ["agents-status"],
    queryFn: () => fetch(`${BASE}/api/agents/status`).then(r => r.json()),
    refetchInterval: 3000,
  });

  // Live feed (polling)
  const { data: feedData } = useQuery<{ events: FeedEvent[] }>({
    queryKey: ["agents-feed", lastFeedTs],
    queryFn: () => fetch(`${BASE}/api/agents/feed${lastFeedTs ? `?since=${lastFeedTs}` : ""}`).then(r => r.json()),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!feedData?.events?.length) return;
    setFeedEvents(prev => {
      const ids = new Set(prev.map(e => e.id));
      const newOnes = feedData.events.filter(e => !ids.has(e.id));
      if (!newOnes.length) return prev;
      const merged = [...prev, ...newOnes].sort((a, b) => a.ts.localeCompare(b.ts)).slice(-80);
      const latest = merged.at(-1)?.ts;
      if (latest) setLastFeedTs(latest);
      return merged;
    });
  }, [feedData]);

  // Auto-scroll feed
  useEffect(() => {
    feedBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedEvents.length]);

  // Active pipeline
  const { data: pipelineData, refetch: refetchPipeline } = useQuery<{ pipeline: Pipeline | null }>({
    queryKey: ["agents-pipeline"],
    queryFn: () => fetch(`${BASE}/api/agents/pipeline/active`).then(r => r.json()),
    refetchInterval: isPipelinePolling ? 1200 : false,
  });

  const pipeline = pipelineData?.pipeline;
  useEffect(() => {
    if (pipeline?.status === "complete" || pipeline?.status === "failed") {
      setIsPipelinePolling(false);
      refetchAgents();
    }
  }, [pipeline?.status]);

  // SuperAGI goal
  const { data: goalData, refetch: refetchGoal } = useQuery<{ goal: SuperAGIGoal }>({
    queryKey: ["superagi-goal", activeGoalId],
    queryFn: () => activeGoalId
      ? fetch(`${BASE}/api/agents/superagi/goal/${activeGoalId}`).then(r => r.json())
      : Promise.resolve({ goal: null }),
    enabled: !!activeGoalId,
    refetchInterval: activeGoalId ? 1500 : false,
  });

  const goal = goalData?.goal;

  // Temporal checkpoints
  const { data: temporalData } = useQuery<{ checkpoints: Checkpoint[]; active: string | null }>({
    queryKey: ["temporal-checkpoints"],
    queryFn: () => fetch(`${BASE}/api/agents/temporal/checkpoints`).then(r => r.json()),
    refetchInterval: 4000,
  });

  const [conciergeMsg, setConciergeMsg] = useState<string | null>(null);
  const showConcierge = (msg: string) => {
    setConciergeMsg(msg);
    setTimeout(() => setConciergeMsg(null), 6000);
  };

  // Mutations
  const triggerPipeline = useMutation({
    mutationFn: (trigger: string) =>
      fetch(`${BASE}/api/agents/pipeline/trigger`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger }),
      }).then(r => { if (!r.ok) throw new Error("pipeline"); return r.json(); }),
    onSuccess: () => {
      setIsPipelinePolling(true);
      setTimeout(() => refetchPipeline(), 500);
      refetchAgents();
    },
    onError: () => showConcierge("The Guardian pipeline is recalibrating the Seaport grid — one moment."),
  });

  const interruptPipeline = useMutation({
    mutationFn: () =>
      fetch(`${BASE}/api/agents/pipeline/interrupt`, { method: "POST" }).then(r => { if (!r.ok) throw new Error("interrupt"); return r.json(); }),
    onSuccess: () => { setIsPipelinePolling(false); refetchPipeline(); },
    onError: () => showConcierge("The interrupt signal is propagating through the mesh — one moment."),
  });

  const resumePipeline = useMutation({
    mutationFn: () =>
      fetch(`${BASE}/api/agents/pipeline/resume`, { method: "POST" }).then(r => { if (!r.ok) throw new Error("resume"); return r.json(); }),
    onSuccess: () => { setIsPipelinePolling(true); setTimeout(() => refetchPipeline(), 800); },
    onError: () => showConcierge("The Agent is resyncing the Temporal checkpoint — one moment."),
  });

  const submitGoal = useMutation({
    mutationFn: (part: typeof SUPERAGI_PARTS[0]) =>
      fetch(`${BASE}/api/agents/superagi/goal`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: part.item, partNumber: part.partNumber }),
      }).then(r => { if (!r.ok) throw new Error("goal"); return r.json(); }),
    onSuccess: (data) => {
      setActiveGoalId(data.goalId);
      setTimeout(() => refetchGoal(), 800);
    },
    onError: () => showConcierge("SuperAGI is recalibrating the Manchester grid — one moment."),
  });

  const agents = agentsData?.agents ?? [];
  const checkpoints = temporalData?.checkpoints ?? [];

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5" style={{ background: "linear-gradient(135deg, #06060a 0%, #08060f 100%)" }}>
      <PageHeader
        icon={Cpu}
        accent="#818CF8"
        title="AGENTIC OS"
        badge={<span className="neural-badge neural-badge-violet">BROWSERBASE · GUMLOOP · SUPERAGI</span>}
        subtitle="Industrial Autonomy Engine · 7-Agent Mesh · I-95 Corridor"
      />

      {/* Concierge error message */}
      {conciergeMsg && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background: "rgba(201,162,39,0.06)", borderColor: "rgba(201,162,39,0.25)", animation: "feed-in 0.3s ease-out" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" style={{ animation: "pulse 1.5s infinite" }} />
          <p style={{ fontSize: "12px", color: "rgba(201,162,39,0.9)", fontStyle: "italic", lineHeight: 1.5 }}>
            Concierge: {conciergeMsg}
          </p>
        </div>
      )}

      {/* Integration Status Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "Browserbase", label: "Stealth browser fleet · scraping wholesale", col: "#4FC3F7", icon: Globe },
          { name: "Gumloop", label: "Workflow orchestration · 4-step pipeline", col: "#818CF8", icon: Network },
          { name: "SuperAGI", label: "Goal-seeking AI · geographic pivot engine", col: "#C9A227", icon: Bot },
        ].map(svc => (
          <div key={svc.name} className="ai-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${svc.col}12`, border: `1px solid ${svc.col}20` }}>
              <svc.icon className="w-4 h-4" style={{ color: svc.col }} />
            </div>
            <div className="flex-1 min-w-0 hidden sm:block">
              <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{svc.name}</p>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{svc.label}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: svc.col }} />
              <span style={{ fontSize: "8px", color: svc.col, fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* 7 Agent Grid */}
      <div>
        <h2 className="section-label mb-3">7-AGENT STATUS GRID</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {agents.map(a => <AgentPill key={a.id} agent={a} />)}
        </div>
      </div>

      {/* Main split: Pipeline + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Gumloop Pipeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">GUMLOOP — 4-STEP PIPELINE</h2>
            {pipeline && (
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${pipeline.status === "running" ? "animate-pulse" : ""}`}
                  style={{ background: pipeline.status === "complete" ? "#10B981" : pipeline.status === "paused" ? "#F97316" : pipeline.status === "running" ? "#818CF8" : "#EF4444" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                  {pipeline.status}
                </span>
              </div>
            )}
          </div>

          {/* Trigger selector */}
          <div className="ai-card p-4 space-y-3">
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>TRIGGER EVENT</p>
            <div className="space-y-1.5">
              {PIPELINE_TRIGGERS.map(t => (
                <button
                  key={t}
                  onClick={() => setPipelineTrigger(t)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: pipelineTrigger === t ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${pipelineTrigger === t ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <p style={{ fontSize: "10px", color: pipelineTrigger === t ? "#818CF8" : "rgba(255,255,255,0.45)", fontWeight: pipelineTrigger === t ? 700 : 400 }}>
                    {t}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => triggerPipeline.mutate(pipelineTrigger)}
                disabled={triggerPipeline.isPending || isPipelinePolling}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)", color: "#818CF8", opacity: (triggerPipeline.isPending || isPipelinePolling) ? 0.5 : 1 }}
              >
                {isPipelinePolling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isPipelinePolling ? "Running…" : "Launch Pipeline"}
              </button>
              {pipeline?.status === "running" && (
                <button
                  onClick={() => interruptPipeline.mutate()}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#F97316" }}
                >
                  <Pause className="w-4 h-4" /> Interrupt
                </button>
              )}
              {pipeline?.status === "paused" && (
                <button
                  onClick={() => resumePipeline.mutate()}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}
                >
                  <RotateCcw className="w-4 h-4" /> Resume
                </button>
              )}
            </div>
          </div>

          {/* Pipeline Steps */}
          {pipeline && (
            <div className="ai-card p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-3.5 h-3.5" style={{ color: "#818CF8" }} />
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                  temporal://{pipeline.temporalWorkflowId}
                </p>
              </div>
              <div className="space-y-5">
                {pipeline.steps.map(step => (
                  <PipelineStepCard key={step.id} step={step} isActive={step.status === "running"} />
                ))}
              </div>
              {pipeline.status === "complete" && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <CheckCircle className="w-4 h-4" style={{ color: "#10B981" }} />
                  <p style={{ fontSize: "10px", color: "#10B981", fontWeight: 700 }}>
                    Pipeline complete · {pipeline.checkpoints.length} Temporal checkpoints saved · Zero data loss
                  </p>
                </div>
              )}
              {pipeline.status === "paused" && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  <Clock className="w-4 h-4" style={{ color: "#F97316" }} />
                  <div>
                    <p style={{ fontSize: "10px", color: "#F97316", fontWeight: 700 }}>Pipeline paused · Temporal state preserved</p>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>Click Resume to continue from last checkpoint</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Temporal Checkpoint Log */}
          <div>
            <h2 className="section-label mb-3">TEMPORAL.IO — DURABLE CHECKPOINTS</h2>
            <div className="ai-card divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {checkpoints.slice(0, 6).map(cp => (
                <div key={cp.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4FC3F7" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{cp.step}</p>
                      <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 700 }}>SAVED</span>
                    </div>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{cp.workflow.slice(0, 32)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>{elapsed(cp.durationMs)}</p>
                    <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.15)" }}>{timeAgo(cp.ts)}</p>
                  </div>
                </div>
              ))}
              {checkpoints.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>Launch a pipeline to create Temporal checkpoints</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Agent Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">LIVE AGENT FEED</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10B981" }} />
              <span style={{ fontSize: "9px", color: "#10B981", fontWeight: 700, letterSpacing: "0.1em" }}>STREAMING</span>
            </div>
          </div>
          <div
            className="ai-card p-4 overflow-y-auto flex flex-col"
            style={{ height: "520px" }}
          >
            <div className="space-y-0 flex-1">
              {feedEvents.slice(-40).map((ev, i, arr) => <FeedRow key={ev.id} event={ev} isNew={i >= arr.length - 3} />)}
              {feedEvents.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>Waiting for agent activity…</p>
                </div>
              )}
            </div>
            <div ref={feedBottomRef} />
          </div>

          {/* Feed legend */}
          <div className="ai-card p-3 flex flex-wrap gap-3">
            {(["thinking", "acting", "result", "pivot", "temporal", "gumloop"] as FeedEventType[]).map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SuperAGI Goal-Seeking Panel */}
      <div>
        <h2 className="section-label mb-3">SUPERAGI — GOAL-SEEKING ENGINE · I-95 CORRIDOR PIVOT</h2>
        <div className="ai-card p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Goal Config */}
            <div className="space-y-3">
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>SELECT PART — SUPERAGI WILL LOCATE IT</p>
              <div className="space-y-2">
                {SUPERAGI_PARTS.map(p => (
                  <button
                    key={p.partNumber}
                    onClick={() => setSelectedPart(p)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: selectedPart.partNumber === p.partNumber ? "rgba(201,162,39,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedPart.partNumber === p.partNumber ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 700, color: selectedPart.partNumber === p.partNumber ? "#C9A227" : "rgba(255,255,255,0.5)" }}>{p.item}</p>
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{p.partNumber}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => submitGoal.mutate(selectedPart)}
                disabled={submitGoal.isPending || (!!goal && (goal.status === "searching" || goal.status === "pivoting"))}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)", color: "#C9A227",
                  opacity: submitGoal.isPending || (goal && (goal.status === "searching" || goal.status === "pivoting")) ? 0.5 : 1,
                }}
              >
                {(submitGoal.isPending || (goal && (goal.status === "searching" || goal.status === "pivoting")))
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Searching corridor…</>
                  : <><Search className="w-4 h-4" /> Launch SuperAGI Goal</>
                }
              </button>

              {/* Resolved result */}
              {goal?.status === "resolved" && goal.result && (
                <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" style={{ color: "#10B981" }} />
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#10B981" }}>SuperAGI Resolved</p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Location", goal.result.geo],
                      ["Supplier", goal.result.supplier],
                      ["Price", `$${goal.result.price} wholesale`],
                      ["Runner ETA", goal.result.eta],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3">
                        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", width: "60px", flexShrink: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>{k}</span>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Geo Chain visualization */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color: "#C9A227" }} />
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>
                  I-95 CORRIDOR PIVOT CHAIN
                </p>
              </div>
              {goal ? (
                <div className="space-y-2">
                  {goal.geoChain.map(entry => (
                    <GeoNode key={entry.geo} entry={entry} isCurrent={goal.currentGeo === entry.geo && goal.status !== "resolved"} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {["Hunts Point, NY", "Newark, NJ", "Hartford, CT", "Providence, RI", "Boston Seaport, MA", "Manchester, NH"].map((geo, i) => (
                    <GeoNode key={geo} entry={{ geo, status: "pending", confidence: 0, itemsFound: 0 }} isCurrent={false} />
                  ))}
                </div>
              )}
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
                SuperAGI autonomously pivots north up the I-95 corridor if no stock is found, without user intervention. When resolved, Logistics Agent queues a runner dispatch automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Browserbase Parts Search */}
      <div>
        <h2 className="section-label mb-3">BROWSERBASE — WHOLESALE PARTS SCAN · REAL-TIME PRICING</h2>
        <PartsSearchPanel />
      </div>
    </div>
  );
}

function PartsSearchPanel() {
  const [partName, setPartName] = useState("Brembo brake caliper");
  const [partNumber, setPartNumber] = useState("PN-2P3.9003A3");
  const [geo, setGeo] = useState("Hunts Point");
  const [result, setResult] = useState<any>(null);

  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: () =>
      fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/agents/parts/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partName, partNumber, geo }),
      }).then(r => { if (!r.ok) throw new Error("search"); return r.json(); }),
    onSuccess: (data) => { setResult(data); setSearchError(null); },
    onError: () => setSearchError("Browserbase is recalibrating the regional pricing mesh — one moment."),
  });

  const GEOS = ["Hunts Point", "Boston", "Manchester"];

  return (
    <div className="ai-card p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>PART NAME</label>
          <input
            value={partName}
            onChange={e => setPartName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(79,195,247,0.15)", color: "rgba(255,255,255,0.8)", outline: "none" }}
          />
        </div>
        <div className="space-y-1">
          <label style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>PART NUMBER</label>
          <input
            value={partNumber}
            onChange={e => setPartNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm font-mono"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(79,195,247,0.15)", color: "rgba(255,255,255,0.8)", outline: "none" }}
          />
        </div>
        <div className="space-y-1">
          <label style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", fontWeight: 700 }}>SEARCH REGION</label>
          <div className="flex gap-2">
            {GEOS.map(g => (
              <button
                key={g}
                onClick={() => setGeo(g)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: geo === g ? "rgba(79,195,247,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${geo === g ? "rgba(79,195,247,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: geo === g ? "#4FC3F7" : "rgba(255,255,255,0.35)",
                }}
              >
                {g.split(",")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => search.mutate()}
        disabled={search.isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all"
        style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7" }}
      >
        {search.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
        {search.isPending ? "Scanning via Browserbase…" : "Launch Stealth Browser Scan"}
      </button>

      {searchError && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" style={{ animation: "pulse 1.5s infinite" }} />
          <p style={{ fontSize: "11px", color: "rgba(201,162,39,0.8)", fontStyle: "italic" }}>Concierge: {searchError}</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.results?.map((r: any, i: number) => (
            <div key={i} className="p-3 rounded-xl" style={{
              background: i === 0 ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${i === 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}>
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{r.supplier}</p>
                {i === 0 && <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 700, letterSpacing: "0.1em" }}>BEST DEAL</span>}
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: "18px", fontWeight: 900, color: i === 0 ? "#10B981" : "#C9A227" }}>${r.price}</span>
                <div>
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{r.stock} units in stock</p>
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>{r.distance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
