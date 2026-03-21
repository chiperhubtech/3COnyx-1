import { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode, Shield, CheckCircle2, Clock, Truck, ChevronRight,
  RefreshCw, Loader2, X, Copy, AlertTriangle, Scan, FileCheck,
  Hash, MapPin, DollarSign, User,
} from "lucide-react";
import { maskVin } from "@/lib/piiMask";

interface DeliveryTask {
  taskId: string;
  taskTitle: string;
  vehicle: string;
  vin: string;
  runnerName: string;
  origin: string;
  destination: string;
  payout: number;
  status: "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
  auditHash: string | null;
}

interface QrData {
  token: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  runnerName: string;
  origin: string;
  destination: string;
  payout: number;
  generatedAt: string;
  expiresAt: string;
  qrDataUrl: string;
  qrPayload: string;
  used: boolean;
}

interface AuditEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  vin: string;
  runnerName: string;
  dealerAction: string;
  status: string;
  completedAt: string;
  payout: number;
  origin: string;
  destination: string;
  auditHash: string;
}

// ─── QR Display (Runner View) ──────────────────────────────────────────────────
function RunnerQRView({ task, onBack }: { task: DeliveryTask; onBack: () => void }) {
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/delivery/qr/${task.taskId}`, { method: "POST" });
        if (res.ok) setQrData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [task.taskId]);

  const copyPayload = () => {
    if (!qrData) return;
    navigator.clipboard.writeText(qrData.qrPayload).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedVin = maskVin(task.vin);

  return (
    <div className="max-w-sm mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-400 mb-5 transition-colors">
        ← Back to tasks
      </button>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-amber-500/15">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{task.taskTitle}</p>
              <p className="text-xs text-white/35">{task.taskId}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center">
          {loading ? (
            <div className="w-56 h-56 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500/40 animate-spin" />
            </div>
          ) : qrData ? (
            <>
              <div className="p-3 bg-[#0d0d10] rounded-xl border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
                <img
                  src={qrData.qrDataUrl}
                  alt="Proof of Delivery QR Code"
                  className="w-56 h-56 rounded-lg"
                />
              </div>

              <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-white/40">Scan to confirm delivery</p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/20 justify-center">
                  <Clock className="w-3 h-3" />
                  Expires {new Date(qrData.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Task details */}
              <div className="w-full mt-5 space-y-2.5">
                <div className="flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-white">{task.vehicle}</p>
                    <p className="text-[10px] font-mono text-white/25">{maskedVin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <p className="text-xs text-white/40">{task.origin} → {task.destination}</p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <p className="text-xs text-white/40">{task.runnerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400/50 shrink-0" />
                  <p className="text-xs font-medium text-emerald-400">${task.payout.toLocaleString()} upon confirmation</p>
                </div>
              </div>

              {/* Copy payload — helps demo the scanner flow */}
              <button
                onClick={copyPayload}
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/60 text-xs font-medium transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied — paste in Dealer Scanner" : "Copy QR Payload for Dealer Scanner"}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-red-400/40 mx-auto mb-2" />
              <p className="text-xs text-white/30">Failed to generate QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scanner (Dealer View) ─────────────────────────────────────────────────────
function DealerScanView() {
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [audit, setAudit] = useState<AuditEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraScanning, setCameraScanning] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const scannerContainerId = "html5qr-scanner";

  // ── Camera scanner init/teardown ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      setCameraScanning(true);
      setError(null);

      const scanner = new Html5QrcodeScanner(
        scannerContainerId,
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        false,
      );

      scanner.render(
        async (decodedText: string) => {
          await scanner.clear();
          setCameraScanning(false);
          verifyPayload(decodedText);
        },
        (_err: unknown) => {
          /* suppress per-frame errors */
        },
      );

      scannerRef.current = scanner;
    } catch {
      setCameraScanning(false);
      setError("Camera unavailable — use the manual paste scanner below.");
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current as { clear: () => Promise<void> };
        await s.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setCameraScanning(false);
  }, []);

  // ── Verify payload or manual token ────────────────────────────────────────
  const verifyPayload = async (payload: string) => {
    setScanning(true);
    setError(null);
    setAudit(null);
    try {
      const res = await fetch("/api/delivery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: payload }),
      });
      const data = await res.json();
      if (res.ok && data.audit) {
        setAudit(data.audit);
        setScanInput("");
      } else if (res.status === 409 && data.audit) {
        setAudit(data.audit);
        setError("This QR code was already scanned — showing existing receipt.");
      } else {
        setError(data.error ?? "Verification failed. Check the QR payload.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    if (!scanInput.trim()) return;
    verifyPayload(scanInput.trim());
  };

  // Demo scan: auto-fetch a QR payload and verify it
  const handleDemoScan = async (taskId: string) => {
    setScanning(true);
    setError(null);
    setAudit(null);
    try {
      const res = await fetch(`/api/delivery/qr/${taskId}`, { method: "POST" });
      const data = await res.json();
      if (data.qrPayload) {
        await verifyPayload(data.qrPayload);
      }
    } finally {
      setScanning(false);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  if (audit) {
    return <CompletionReceipt audit={audit} onReset={() => { setAudit(null); setError(null); }} />;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Scan className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Dealer Scanner</p>
              <p className="text-xs text-white/30">Confirm delivery with Proof of Delivery QR</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera section */}
          {!cameraScanning ? (
            <button
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] text-amber-400 text-sm font-medium transition-all"
            >
              <QrCode className="w-4 h-4" />
              Open Camera Scanner
            </button>
          ) : (
            <div>
              <div id={scannerContainerId} className="rounded-xl overflow-hidden" />
              <button
                onClick={stopCamera}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel camera
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/25">or paste QR payload</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Manual input */}
          <div>
            <textarea
              rows={3}
              placeholder={`Paste QR payload from runner's screen…\n{"t":"abc123…","id":"task-001","ts":…}`}
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/15 focus:border-amber-500/40 focus:outline-none resize-none"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!scanInput.trim() || scanning}
              className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {scanning && <Loader2 className="w-4 h-4 animate-spin" />}
              {scanning ? "Verifying…" : "Verify & Complete Delivery"}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
          )}

          {/* Demo scan shortcuts */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] text-white/20 mb-2 uppercase tracking-wider">Quick-scan demo tasks</p>
            <div className="space-y-1.5">
              {[
                { id: "task-001", label: "Rolls-Royce Ghost · Beverly Hills → Malibu" },
                { id: "task-002", label: "Ferrari Roma · SF → Palo Alto" },
                { id: "task-003", label: "Bentley Bentayga · Miami Port → Palm Beach" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleDemoScan(t.id)}
                  disabled={scanning}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] text-left text-[11px] text-white/40 hover:text-white/60 transition-all disabled:opacity-40"
                >
                  <QrCode className="w-3 h-3 shrink-0 text-amber-400/50" />
                  <span className="truncate">{t.label}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Receipt ────────────────────────────────────────────────────────
function CompletionReceipt({ audit, onReset }: { audit: AuditEntry; onReset: () => void }) {
  const maskedVin = maskVin(audit.vin);
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(audit.auditHash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Success state */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
        <div className="p-6 border-b border-emerald-500/15 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Delivery Confirmed</h3>
          <p className="text-emerald-400/70 text-xs font-medium uppercase tracking-wider">Task Status → COMPLETED</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Task summary */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Task</p>
              <p className="text-sm font-medium text-white">{audit.taskTitle} · {audit.taskId}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-sm text-white/70">{audit.vehicle}</p>
              <p className="text-[10px] font-mono text-white/25 mt-0.5">{maskedVin}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Runner</p>
                <p className="text-xs text-white/60">{audit.runnerName}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Payout</p>
                <p className="text-xs font-semibold text-emerald-400">${audit.payout.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Route</p>
              <p className="text-xs text-white/50">{audit.origin} → {audit.destination}</p>
            </div>
          </div>

          {/* Audit log */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-semibold text-white/70">SOC2 Audit Record</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] text-white/25">Completed At</p>
                <p className="text-[10px] font-mono text-white/50 text-right">
                  {new Date(audit.completedAt).toLocaleString([], {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] text-white/25">Action</p>
                <p className="text-[10px] font-mono text-emerald-400/60">{audit.dealerAction}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] text-white/25">Audit ID</p>
                <p className="text-[10px] font-mono text-white/30">{audit.id}</p>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-white/20" />
                    <p className="text-[10px] text-white/25">SHA-256 Audit Hash</p>
                  </div>
                  <button
                    onClick={copyHash}
                    className="text-[10px] text-amber-400/50 hover:text-amber-400 transition-colors flex items-center gap-1"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[9px] font-mono text-white/20 break-all leading-relaxed">{audit.auditHash}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:bg-white/5 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
          >
            <Scan className="w-4 h-4" />
            Scan Another Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Delivery() {
  const [mode, setMode] = useState<"runner" | "dealer">("runner");
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/delivery/tasks");
      if (res.ok) setTasks((await res.json()).tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Proof of Delivery</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">Digital handshake — QR-coded delivery confirmation with SOC2 audit trail</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/8 mb-6 w-fit">
        {(["runner", "dealer"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedTask(null); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? "bg-amber-500 text-black shadow-sm"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {m === "runner" ? <QrCode className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
            {m === "runner" ? "Runner — Show QR" : "Dealer — Scan QR"}
          </button>
        ))}
      </div>

      {/* ── Runner mode ──────────────────────────────────────────────────────── */}
      {mode === "runner" && (
        selectedTask ? (
          <RunnerQRView task={selectedTask} onBack={() => setSelectedTask(null)} />
        ) : (
          <div className="max-w-lg">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "In Progress", value: inProgressTasks.length, color: "text-amber-400" },
                { label: "Completed", value: completedTasks.length, color: "text-emerald-400" },
                { label: "Total", value: tasks.length, color: "text-white" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-white/30 mb-3 uppercase tracking-wider">Select task to generate QR</p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/8 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const done = task.status === "COMPLETED";
                  return (
                    <button
                      key={task.taskId}
                      onClick={() => !done && setSelectedTask(task)}
                      disabled={done}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        done
                          ? "border-white/5 bg-white/[0.01] opacity-50 cursor-default"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/20 cursor-pointer"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        done ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                      }`}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <QrCode className="w-4 h-4 text-amber-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-white truncate">{task.vehicle}</p>
                          {done && (
                            <span className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/35 truncate">
                          {task.taskTitle} · {task.origin} → {task.destination}
                        </p>
                        {done && task.completedAt && (
                          <p className="text-[10px] text-emerald-400/50 mt-0.5">
                            {new Date(task.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      {!done && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={fetchTasks}
              className="mt-4 flex items-center gap-1.5 text-xs text-white/25 hover:text-white/40 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )
      )}

      {/* ── Dealer mode ──────────────────────────────────────────────────────── */}
      {mode === "dealer" && (
        <div>
          <div className="mb-5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300 mb-0.5">SOC2-Compliant Audit</p>
              <p className="text-[11px] text-amber-400/50">
                Each scan creates an immutable audit record with SHA-256 hash, timestamp, and task ID — stored in the 3C audit log.
              </p>
            </div>
          </div>
          <DealerScanView />
        </div>
      )}
    </div>
  );
}
