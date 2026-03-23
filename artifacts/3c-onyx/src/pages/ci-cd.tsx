import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Play, RefreshCw, Terminal, Cpu, Rocket, ShieldCheck, GitBranch, Layers } from "lucide-react";

interface PipelineStep {
  name: string;
  command: string;
  status: "pending" | "running" | "passed" | "failed";
  durationMs?: number;
  output?: string;
}

interface PipelineRun {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: "running" | "passed" | "failed";
  steps: PipelineStep[];
}

interface CiStatus {
  pipeline: string;
  steps: { name: string; command: string }[];
  lastRun: PipelineRun | null;
  isRunning: boolean;
  deployment: {
    target: string;
    region: string;
    buildCommand: string;
    runCommand: string;
    healthCheck: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  passed: "text-green-400",
  failed: "text-red-400",
  running: "text-yellow-400",
  pending: "text-zinc-500",
};

const STATUS_BG: Record<string, string> = {
  passed: "bg-green-500/10 border-green-500/30",
  failed: "bg-red-500/10 border-red-500/30",
  running: "bg-yellow-500/10 border-yellow-500/30",
  pending: "bg-zinc-800 border-zinc-700",
};

function StatusIcon({ status, size = 16 }: { status: string; size?: number }) {
  if (status === "passed") return <CheckCircle size={size} className="text-green-400" />;
  if (status === "failed") return <XCircle size={size} className="text-red-400" />;
  if (status === "running") return <RefreshCw size={size} className="text-yellow-400 animate-spin" />;
  return <Clock size={size} className="text-zinc-500" />;
}

const STEP_LABELS: Record<string, string> = {
  typecheck: "TypeScript Check",
  "build-api": "Build API Server",
  "build-web": "Build Web App",
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  typecheck: <Cpu size={14} className="text-blue-400" />,
  "build-api": <Layers size={14} className="text-amber-400" />,
  "build-web": <Rocket size={14} className="text-violet-400" />,
};

export default function CiCd() {
  const [status, setStatus] = useState<CiStatus | null>(null);
  const [runResult, setRunResult] = useState<PipelineRun | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [pollingRunId, setPollingRunId] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ ts: string; msg: string; type: "info" | "success" | "error" | "tool" }>>([]);

  const addLog = useCallback((msg: string, type: "info" | "success" | "error" | "tool" = "info") => {
    setLogs((prev) => [{ ts: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ci/status");
      const data = await res.json();
      setStatus(data);
      if (data.lastRun) setRunResult(data.lastRun);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!pollingRunId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ci/run/${pollingRunId}`);
        const data: PipelineRun = await res.json();
        setRunResult(data);
        if (data.status !== "running") {
          setPollingRunId(null);
          setIsLaunching(false);
          addLog(
            `Pipeline ${data.status === "passed" ? "PASSED" : "FAILED"} in ${((data.durationMs || 0) / 1000).toFixed(1)}s`,
            data.status === "passed" ? "success" : "error"
          );
          fetchStatus();
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pollingRunId, addLog, fetchStatus]);

  const runPipeline = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setRunResult(null);
    addLog("Triggering CI pipeline…", "info");
    try {
      const res = await fetch("/api/ci/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRunResult({ ...data, steps: status?.steps.map((s) => ({ ...s, status: "pending" })) || [] });
        setPollingRunId(data.runId);
        addLog(`Run ${data.runId} started`, "tool");
      } else {
        addLog(data.error || "Failed to start pipeline", "error");
        setIsLaunching(false);
      }
    } catch {
      addLog("Network error starting pipeline", "error");
      setIsLaunching(false);
    }
  };

  const activeRun = runResult || status?.lastRun;
  const overallStatus = isLaunching ? "running" : (activeRun?.status ?? "pending");

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-blue-500/30 flex items-center justify-center">
              <GitBranch size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CI / CD Pipeline</h1>
              <p className="text-sm text-zinc-400">3C Onyx — Security First build system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchStatus} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={runPipeline}
              disabled={isLaunching || !!pollingRunId}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
            >
              {isLaunching || pollingRunId ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
              {isLaunching || pollingRunId ? "Running…" : "Run Pipeline"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "STATUS", value: overallStatus.toUpperCase(), icon: <StatusIcon status={overallStatus} size={20} />, color: STATUS_COLORS[overallStatus] },
            { label: "LAST RUN", value: activeRun ? new Date(activeRun.startedAt).toLocaleTimeString() : "—", icon: <Clock size={20} className="text-zinc-400" />, color: "text-white" },
            { label: "DURATION", value: activeRun?.durationMs ? `${(activeRun.durationMs / 1000).toFixed(1)}s` : "—", icon: <Terminal size={20} className="text-zinc-400" />, color: "text-white" },
            { label: "DEPLOYMENT", value: status?.deployment.target.toUpperCase() || "AUTOSCALE", icon: <Rocket size={20} className="text-violet-400" />, color: "text-violet-300" },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-4 ${STATUS_BG[overallStatus] || "bg-zinc-900 border-zinc-800"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 font-medium tracking-widest">{card.label}</span>
                {card.icon}
              </div>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide">Pipeline Steps</h2>
            </div>
            {(activeRun?.steps || status?.steps || []).map((step) => {
              const s = step as PipelineStep;
              const stepStatus = s.status || "pending";
              const isExpanded = expandedStep === s.name;
              return (
                <div key={s.name} className={`rounded-lg border transition-all ${STATUS_BG[stepStatus]} overflow-hidden`}>
                  <button
                    className="w-full flex items-center justify-between p-3 text-left"
                    onClick={() => setExpandedStep(isExpanded ? null : s.name)}
                  >
                    <div className="flex items-center gap-2">
                      {STEP_ICONS[s.name] || <Terminal size={14} className="text-zinc-400" />}
                      <span className="text-sm font-medium text-white">{STEP_LABELS[s.name] || s.name}</span>
                      {s.durationMs && <span className="text-xs text-zinc-500">{(s.durationMs / 1000).toFixed(1)}s</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${STATUS_COLORS[stepStatus]}`}>{stepStatus.toUpperCase()}</span>
                      <StatusIcon status={stepStatus} size={15} />
                    </div>
                  </button>
                  {isExpanded && s.output && (
                    <div className="px-3 pb-3">
                      <pre className="text-xs text-zinc-400 bg-zinc-950 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-48">{s.output}</pre>
                    </div>
                  )}
                  {isExpanded && !s.output && (
                    <div className="px-3 pb-3 text-xs text-zinc-500">{stepStatus === "pending" ? "Waiting to run…" : "No output captured."}</div>
                  )}
                </div>
              );
            })}
            {!activeRun && !status?.steps?.length && (
              <div className="text-center py-6 text-zinc-600 text-sm">No pipeline runs yet. Click Run Pipeline.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Rocket size={16} className="text-violet-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">Deployment Config</h2>
              </div>
              {status?.deployment && (
                <div className="space-y-2">
                  {Object.entries({
                    Target: status.deployment.target,
                    Region: status.deployment.region,
                    "Build Command": status.deployment.buildCommand,
                    "Run Command": status.deployment.runCommand,
                    "Health Check": status.deployment.healthCheck,
                  }).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-zinc-500 whitespace-nowrap">{k}</span>
                      <span className="text-xs text-zinc-300 font-mono text-right">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-xs text-green-400">SOC2 compliant · TLS enforced · PII masked</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={16} className="text-zinc-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">Activity Log</h2>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {logs.length === 0 && <p className="text-xs text-zinc-600">No activity yet.</p>}
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-zinc-600 shrink-0">{log.ts}</span>
                    <span className={`text-xs ${log.type === "success" ? "text-green-400" : log.type === "error" ? "text-red-400" : log.type === "tool" ? "text-amber-400" : "text-zinc-400"}`}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">MCP Server — Live Tool Registry</h2>
            <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <McpToolsPanel />
        </div>

      </div>
    </div>
  );
}

function McpToolsPanel() {
  const [tools, setTools] = useState<{ name: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mcp/tools")
      .then((r) => r.json())
      .then((d) => { setTools(d.tools || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const testTool = async (toolName: string) => {
    setTesting(toolName);
    setTestResult(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: toolName === "search_vehicles" ? { query: "Rolls-Royce" } : {},
          },
        }),
      });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const content = json?.result?.content?.[0]?.text || JSON.stringify(json.result || json, null, 2);
        setTestResult(content.slice(0, 400));
      } catch {
        setTestResult(text.slice(0, 400));
      }
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTesting(null);
    }
  };

  if (loading) return <div className="text-xs text-zinc-500 animate-pulse">Loading MCP tools…</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => (
          <div key={tool.name} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-amber-300 mb-0.5">{tool.name}</p>
              <p className="text-xs text-zinc-500 leading-tight">{tool.description}</p>
            </div>
            <button
              onClick={() => testTool(tool.name)}
              disabled={testing === tool.name}
              className="shrink-0 text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {testing === tool.name ? "…" : "Test"}
            </button>
          </div>
        ))}
      </div>
      {testResult && (
        <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3">
          <p className="text-xs text-amber-400 mb-1 font-mono">Tool Response:</p>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
}
