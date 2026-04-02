import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AltruisticShare, useAltruisticShare } from "@/components/AltruisticShare";
import {
  Zap, Car, Wrench, DollarSign, Shield, CheckCircle2,
  Loader2, AlertTriangle, ArrowRight, Fingerprint, Hash,
  Clock, ChevronRight, Brain, Cpu, Link2
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

type Intent = "fix" | "sell" | "deal" | "inspect";
type Phase = "idle" | "input" | "diagnosing" | "executing" | "complete" | "escalated" | "error";

interface DiagnosisAction {
  action: string;
  label: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedCost: string | null;
  automated: boolean;
}

interface DiagnosisResult {
  diagnosisId: string;
  vehicle: { vin: string | null; label: string | null; year: string | null; make: string | null; model: string | null };
  issues: string[];
  actions: DiagnosisAction[];
  confidence: number;
  aiSummary: string | null;
  processingTimeMs: number;
}

interface ExecutionStep {
  step: string;
  status: "done" | "pending" | "escalated";
  detail: string;
  timestamp: string;
}

interface ExecutionResult {
  executionId: string;
  status: "completed" | "in_progress" | "escalated";
  stepsExecuted: ExecutionStep[];
  proofHash: string | null;
  totalTimeMs: number;
  verification: { proofUrl: string } | null;
}

const INTENTS: { id: Intent; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "fix", label: "Fix My Car", icon: <Wrench className="w-6 h-6" />, description: "Diagnose issues and schedule service automatically" },
  { id: "sell", label: "Sell My Car", icon: <DollarSign className="w-6 h-6" />, description: "Get instant trade-in value and start a deal" },
  { id: "deal", label: "Start Deal", icon: <Car className="w-6 h-6" />, description: "One-tap financing, paperwork, and delivery" },
  { id: "inspect", label: "Inspect", icon: <Shield className="w-6 h-6" />, description: "Full 142-point certified inspection" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-green-400 bg-green-500/10 border-green-500/30",
};

function PhaseIndicator({ phase }: { phase: Phase }) {
  const stages = [
    { key: "input", label: "Scan" },
    { key: "diagnosing", label: "Diagnose" },
    { key: "executing", label: "Execute" },
    { key: "complete", label: "Done" },
  ];
  const activeIndex = stages.findIndex(s => s.key === phase);

  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {stages.map((stage, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex || phase === "complete";
        return (
          <div key={stage.key} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-500 ${
              isActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
              isDone ? "bg-green-500/10 text-green-400" :
              "text-zinc-600"
            }`}>
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <ChevronRight className={`w-3 h-3 mx-1 ${isDone ? "text-green-500/50" : "text-zinc-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PulseRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-32 h-32 rounded-full border border-amber-500/20 animate-ping" style={{ animationDuration: "2s" }} />
      <div className="absolute w-24 h-24 rounded-full border border-amber-500/30 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
    </div>
  );
}

export default function OneTapPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const share = useAltruisticShare();

  const startTimer = useCallback(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("onyxToken") || localStorage.getItem("3c_auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const runFullPipeline = useCallback(async () => {
    if (!selectedIntent) return;
    setError(null);
    setDiagnosis(null);
    setExecution(null);
    startTimer();

    try {
      setPhase("input");
      const inputRes = await fetch(`${API}/input/process`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          vin: vin || undefined,
          make: make || undefined,
          model: model || undefined,
          year: year || undefined,
          intent: selectedIntent,
        }),
      });
      if (!inputRes.ok) throw new Error("Input processing failed");
      const inputData = await inputRes.json();

      setPhase("diagnosing");
      const diagRes = await fetch(`${API}/ai/diagnose`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          vin: inputData.normalized.vin || undefined,
          make: inputData.normalized.make || undefined,
          model: inputData.normalized.model || undefined,
          year: inputData.normalized.year || undefined,
          vehicleLabel: inputData.vehicleLabel || undefined,
          intent: inputData.normalized.intent,
          symptoms: symptoms || undefined,
        }),
      });
      if (!diagRes.ok) throw new Error("Diagnosis failed");
      const diagData: DiagnosisResult = await diagRes.json();
      setDiagnosis(diagData);

      setPhase("executing");
      const execRes = await fetch(`${API}/decision/execute`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ diagnosisId: diagData.diagnosisId }),
      });
      if (!execRes.ok) throw new Error("Execution failed");
      const execData: ExecutionResult = await execRes.json();
      setExecution(execData);

      setPhase(execData.status === "escalated" ? "escalated" : "complete");
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    } finally {
      stopTimer();
    }
  }, [selectedIntent, vin, make, model, year, symptoms, startTimer, stopTimer]);

  const reset = () => {
    setPhase("idle");
    setSelectedIntent(null);
    setVin("");
    setMake("");
    setModel("");
    setYear("");
    setSymptoms("");
    setDiagnosis(null);
    setExecution(null);
    setError(null);
    setElapsedMs(0);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-amber-500/80 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            <Zap className="w-3.5 h-3.5" /> Autonomous Execution Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            One Tap.{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Done.</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
            Scan your vehicle. ONYX diagnoses, decides, and executes — automatically.
          </p>
        </div>

        {phase !== "idle" && <PhaseIndicator phase={phase} />}

        {phase === "idle" && (
          <div className="space-y-3">
            {INTENTS.map((intent) => (
              <button
                key={intent.id}
                onClick={() => { setSelectedIntent(intent.id); setPhase("input"); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50
                           hover:border-amber-500/40 hover:bg-zinc-900 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20
                               flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  {intent.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{intent.label}</div>
                  <div className="text-xs text-zinc-500">{intent.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {phase === "input" && selectedIntent && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
                {INTENTS.find(i => i.id === selectedIntent)?.icon}
                {INTENTS.find(i => i.id === selectedIntent)?.label}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-medium block mb-1">VIN (optional)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm
                             placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">Year</label>
                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    maxLength={4}
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm
                             placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">Make</label>
                  <input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="BMW"
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm
                             placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">Model</label>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="M5"
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm
                             placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {(selectedIntent === "fix" || selectedIntent === "inspect") && (
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">Symptoms (optional)</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe what you're experiencing..."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm
                             placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              )}
            </div>

            <button
              onClick={runFullPipeline}
              disabled={!make && !vin}
              className="w-full relative overflow-hidden py-4 rounded-xl font-bold text-lg tracking-wide
                       bg-gradient-to-r from-amber-500 to-amber-600 text-black
                       hover:from-amber-400 hover:to-amber-500 transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3"
            >
              <Fingerprint className="w-5 h-5" />
              Execute — One Tap
            </button>

            <button onClick={reset} className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2">
              ← Back
            </button>
          </div>
        )}

        {(phase === "diagnosing" || phase === "executing") && (
          <div className="flex flex-col items-center py-16 relative">
            <PulseRing />
            <div className="relative z-10 w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30
                           flex items-center justify-center mb-6">
              {phase === "diagnosing"
                ? <Brain className="w-8 h-8 text-amber-400 animate-pulse" />
                : <Cpu className="w-8 h-8 text-amber-400 animate-pulse" />
              }
            </div>
            <h2 className="text-xl font-bold mb-2">
              {phase === "diagnosing" ? "Analyzing Vehicle..." : "Executing Workflow..."}
            </h2>
            <p className="text-zinc-500 text-sm text-center max-w-xs">
              {phase === "diagnosing"
                ? "AI is scanning, classifying, and diagnosing your vehicle"
                : "Autonomous agents are completing your request"
              }
            </p>
            <div className="mt-4 text-xs text-zinc-600 font-mono">
              <Clock className="w-3 h-3 inline mr-1" />
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        {(phase === "complete" || phase === "escalated") && diagnosis && execution && (
          <div className="space-y-6">
            <div className={`text-center py-6 rounded-2xl border ${
              phase === "complete"
                ? "bg-green-500/5 border-green-500/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}>
              {phase === "complete"
                ? <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                : <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              }
              <h2 className="text-xl font-bold">
                {phase === "complete" ? "Done. Everything is handled." : "Specialist Assigned"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                {phase === "complete"
                  ? `Completed in ${(execution.totalTimeMs / 1000).toFixed(1)}s — ${execution.stepsExecuted.length} steps executed`
                  : "Some actions need human review — a specialist has been notified"
                }
              </p>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">AI Diagnosis</span>
                <span className="text-xs font-mono text-amber-400">
                  {(diagnosis.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              {diagnosis.aiSummary && (
                <p className="text-sm text-zinc-300">{diagnosis.aiSummary}</p>
              )}
              {diagnosis.issues.length > 0 && (
                <div className="space-y-1">
                  {diagnosis.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                      <div className="w-1 h-1 rounded-full bg-amber-500" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {diagnosis.actions.length > 0 && (
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-2">
                <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Actions Taken</span>
                {diagnosis.actions.map((action, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${PRIORITY_COLORS[action.priority] ?? PRIORITY_COLORS.medium}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </div>
                    {action.estimatedCost && (
                      <span className="text-xs opacity-70">{action.estimatedCost}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 space-y-2">
              <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">Execution Log</span>
              {execution.stepsExecuted.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {step.status === "done"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  }
                  <span className="text-zinc-400">{step.detail}</span>
                </div>
              ))}
            </div>

            {execution.proofHash && (
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/30 rounded-xl border border-zinc-800">
                <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500">ONYX Proof Hash</div>
                  <div className="text-xs font-mono text-zinc-400 truncate">{execution.proofHash}</div>
                </div>
                <Shield className="w-4 h-4 text-green-400 shrink-0 ml-auto" />
              </div>
            )}

            <div className="flex gap-3">
              {execution.verification && (() => {
                const vinMatch = execution.verification.proofUrl.match(/\/vehicle\/([^/]+)\//);
                const proofVin = vinMatch?.[1] ?? "";
                return (
                  <a
                    href={`/proof?vin=${proofVin}`}
                    className="flex-1 py-3 rounded-xl border border-amber-500/30 text-amber-400 text-sm font-semibold text-center hover:bg-amber-500/5 transition-colors"
                  >
                    View Proof Timeline
                  </a>
                );
              })()}
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold text-center hover:border-zinc-700 transition-colors"
              >
                New Request
              </button>
            </div>

            <button
              onClick={() => share.trigger("one-tap completion")}
              className="w-full py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-base">&#10024;</span>
              {user?.name
                ? `You helped someone, ${user.name.split(" ")[0]}! Earn by helping another.`
                : "You helped someone! Earn by helping another."
              }
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-zinc-500 text-sm mb-6">{error}</p>
            <button onClick={reset} className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-semibold hover:border-zinc-700 transition-colors">
              Try Again
            </button>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-700 tracking-wider uppercase">
            3C ONYX — Autonomous Execution Engine — CUXTOMCANDYCLUB LLC
          </p>
        </div>
      </div>

      <AltruisticShare visible={share.visible} onDismiss={share.dismiss} context={share.context} />
    </div>
  );
}
