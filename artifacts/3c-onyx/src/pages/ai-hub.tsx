import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  Cpu,
  Globe,
  Zap,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  MonitorPlay,
  Network,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Workflow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  avg_duration_ms: number;
  input_schema: string[];
};

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

type BrowserTask = {
  id: string;
  type: string;
  url: string;
  status: string;
  result?: Record<string, unknown>;
  completed_at?: string;
};

const BROWSER_TASK_TYPES = [
  { type: "dealer_verify", label: "Verify Dealer", icon: ShieldCheck, color: "#34D399", placeholder: "https://dealer.com" },
  { type: "price_check", label: "Price Check", icon: Globe, color: "#4FC3F7", placeholder: "https://listing-url.com" },
  { type: "competitor_scan", label: "Market Scan", icon: Network, color: "#818CF8", placeholder: "https://autotrader.com" },
  { type: "vin_decode", label: "VIN Decode", icon: Cpu, color: "#F97316", placeholder: "VIN or URL" },
];

const STATUS_COLORS: Record<string, string> = { running: "#C9A227", completed: "#34D399", failed: "#F87171" };
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  running: RefreshCw,
  completed: CheckCircle,
  failed: AlertCircle,
};

function elapsed(ms?: number) {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AIHub() {
  const qc = useQueryClient();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState("https://porschebevilyhills.com");
  const [browserTaskType, setBrowserTaskType] = useState("dealer_verify");
  const [pollingRunId, setPollingRunId] = useState<string | null>(null);

  const { data: wfData } = useQuery<{ workflows: Workflow[] }>({
    queryKey: ["gumloop-workflows"],
    queryFn: () => fetch(`${BASE}/api/gumloop/workflows`).then((r) => r.json()),
  });

  const { data: runsData, refetch: refetchRuns } = useQuery<{ runs: WorkflowRun[] }>({
    queryKey: ["gumloop-runs"],
    queryFn: () => fetch(`${BASE}/api/gumloop/runs`).then((r) => r.json()),
    refetchInterval: pollingRunId ? 1500 : false,
  });

  const { data: browserTasksData, refetch: refetchBrowserTasks } = useQuery<{ tasks: BrowserTask[] }>({
    queryKey: ["browserbase-tasks"],
    queryFn: () => fetch(`${BASE}/api/browserbase/tasks`).then((r) => r.json()),
  });

  const runWorkflow = useMutation({
    mutationFn: (wf: Workflow) =>
      fetch(`${BASE}/api/gumloop/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: wf.id, inputs: {} }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      setPollingRunId(data.runId);
      setTimeout(() => setPollingRunId(null), 8000);
      refetchRuns();
    },
  });

  const runBrowserTask = useMutation({
    mutationFn: () =>
      fetch(`${BASE}/api/browserbase/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: browserTaskType, url: browserUrl }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setTimeout(() => refetchBrowserTasks(), 500);
    },
  });

  const workflows = wfData?.workflows ?? [];
  const runs = runsData?.runs ?? [];
  const browserTasks = browserTasksData?.tasks ?? [];

  const CATEGORY_COLORS: Record<string, string> = {
    Research: "#4FC3F7",
    Insurance: "#34D399",
    "Market Intel": "#818CF8",
    Compliance: "#C9A227",
    Finance: "#F97316",
    Logistics: "#A78BFA",
  };

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "linear-gradient(135deg, #06060a 0%, #08060f 100%)" }}>
      <PageHeader
        icon={Cpu}
        accent="#818CF8"
        title="AI AUTOMATION HUB"
        badge={<span className="neural-badge neural-badge-violet">GUMLOOP + BROWSERBASE</span>}
      />

      {/* Integration Status */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Gumloop", label: "AI Workflow Engine", icon: Network, color: "#818CF8", workflows: workflows.length, badge: "ACTIVE" },
          { name: "Browserbase", label: "Remote Browser Fleet", icon: MonitorPlay, color: "#4FC3F7", workflows: 4, badge: "ACTIVE" },
        ].map((svc) => (
          <div key={svc.name} className="ai-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}25` }}>
              <svc.icon className="w-5 h-5" style={{ color: svc.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{svc.name}</p>
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "8px", background: `${svc.color}12`, border: `1px solid ${svc.color}25`, color: svc.color, fontWeight: 700, letterSpacing: "0.15em" }}>{svc.badge}</span>
              </div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{svc.label} · {svc.workflows} workflows</p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: svc.color }} />
          </div>
        ))}
      </div>

      {/* Gumloop Workflows */}
      <div>
        <h2 className="section-label mb-3">GUMLOOP — AI WORKFLOWS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflows.map((wf) => {
            const color = CATEGORY_COLORS[wf.category] || "#C9A227";
            const isRunning = runWorkflow.isPending && runWorkflow.variables?.id === wf.id;
            return (
              <div key={wf.id} className="ai-card holographic-card p-4 flex gap-3 group cursor-pointer" onClick={() => !runWorkflow.isPending && runWorkflow.mutate(wf)}>
                <div className="text-2xl shrink-0">{wf.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{wf.name}</p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", lineHeight: "1.4" }}>{wf.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: "8px", background: `${color}12`, border: `1px solid ${color}20`, color, fontWeight: 700, letterSpacing: "0.1em" }}>
                      {wf.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>~{elapsed(wf.avg_duration_ms)}</span>
                    <button
                      disabled={runWorkflow.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: `${color}10`, border: `1px solid ${color}20`, color }}
                    >
                      {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isRunning ? "Running…" : "Run"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workflow Runs */}
      {runs.length > 0 && (
        <div>
          <h2 className="section-label mb-3">RECENT RUNS</h2>
          <div className="ai-card divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {runs.map((run) => {
              const color = STATUS_COLORS[run.status] || "#C9A227";
              const StatusIcon = STATUS_ICONS[run.status] || Clock;
              return (
                <div key={run.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${run.status === "running" ? "animate-spin" : ""}`} style={{ color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{run.workflow_name}</p>
                        <span style={{ fontSize: "9px", color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{run.status}</span>
                      </div>
                      {run.outputs && (
                        <div className="mt-2 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {Object.entries(run.outputs).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", width: "120px", flexShrink: 0 }}>{k.replace(/_/g, " ").toUpperCase()}</span>
                              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.65)", flex: 1 }}>
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>
                        {run.started_at.slice(0, 19).replace("T", " ")}
                        {run.duration_ms ? ` · ${elapsed(run.duration_ms)}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browserbase Panel */}
      <div>
        <h2 className="section-label mb-3">BROWSERBASE — REMOTE BROWSER TASKS</h2>
        <div className="ai-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {BROWSER_TASK_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setBrowserTaskType(t.type)}
                className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all"
                style={{
                  background: browserTaskType === t.type ? `${t.color}12` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${browserTaskType === t.type ? `${t.color}30` : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <t.icon className="w-5 h-5" style={{ color: browserTaskType === t.type ? t.color : "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: browserTaskType === t.type ? t.color : "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
              placeholder="Target URL or VIN"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(79,195,247,0.15)", color: "rgba(255,255,255,0.85)", outline: "none" }}
            />
            <button
              onClick={() => runBrowserTask.mutate()}
              disabled={runBrowserTask.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
              style={{ background: "rgba(79,195,247,0.12)", border: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7" }}
            >
              {runBrowserTask.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {runBrowserTask.isPending ? "Browsing…" : "Launch"}
            </button>
          </div>
        </div>

        {/* Browser Task Results */}
        {browserTasks.length > 0 && (
          <div className="mt-4 space-y-3">
            {browserTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="ai-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[task.status] || "#C9A227" }} />
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "capitalize" }}>
                      {task.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{task.id}</span>
                </div>
                {task.result && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {Object.entries(task.result).map(([k, v]) => (
                      <div key={k} className="flex flex-col">
                        <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>{k.replace(/_/g, " ").toUpperCase()}</span>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                          {typeof v === "boolean" ? (v ? "✓ Yes" : "✗ No") : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
