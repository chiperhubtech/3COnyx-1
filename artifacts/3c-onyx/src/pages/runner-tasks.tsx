/**
 * 3C Onyx — Runner Task Management
 * The full task loop for Runners:
 *   View available jobs → Accept → Navigate → QR confirm delivery → Payout
 */
import { useState, useEffect, useCallback } from "react";
import {
  Truck, MapPin, DollarSign, Clock, Zap, CheckCircle2,
  ChevronRight, Loader2, AlertCircle, Navigation,
  QrCode, Shield, Package, Star, ArrowRight, RefreshCw,
  BarChart3, BadgeCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RunnerTask {
  id: string;
  type: string;
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
  estimatedHours: number;
  postedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  buyerName: string;
  specialInstructions: string | null;
}

const URGENCY_CONFIG = {
  express:  { label: "EXPRESS",  color: "#EF4444", bg: "rgba(239,68,68,0.1)"    },
  priority: { label: "PRIORITY", color: "#F97316", bg: "rgba(249,115,22,0.1)"   },
  standard: { label: "STANDARD", color: "#34D399", bg: "rgba(52,211,153,0.1)"   },
};

const TYPE_COLOR: Record<string, string> = {
  delivery:   "#60A5FA",
  inspection: "#A78BFA",
  pickup:     "#34D399",
  transport:  "#C9A227",
};

type View = "available" | "mine";

/* ─── QR Delivery Modal ─────────────────────────────────────────────────── */
function DeliveryCodeModal({ task, onComplete, onClose }: { task: RunnerTask; onComplete: () => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("3c_auth_token");
      const res = await fetch(`${BASE}/api/runner/tasks/${task.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ deliveryCode: code.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Code invalid");
      setSuccess(true);
      setTimeout(onComplete, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, borderRadius: 22, background: "#08080e", border: "1px solid rgba(201,162,39,0.2)", overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#C9A227,#34D399)" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          {!success ? (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <QrCode size={24} style={{ color: "#C9A227" }} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Confirm Delivery</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.6 }}>
                Ask the recipient for the delivery confirmation code from their 3C app. Enter it below to release funds and trigger your payout.
              </p>
              <div style={{ marginBottom: 8 }}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 20, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center", outline: "none", boxSizing: "border-box" }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {error && <p style={{ fontSize: 11, color: "#EF4444", marginBottom: 16 }}>{error}</p>}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginBottom: 20 }}>
                Vehicle: {task.vehicle} · Delivery to {task.buyerName}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button onClick={submit} disabled={loading || code.length < 6} style={{ flex: 2, padding: 12, borderRadius: 12, background: code.length >= 6 ? "linear-gradient(135deg,#34D399,#059669)" : "rgba(255,255,255,0.06)", border: "none", color: code.length >= 6 ? "#000" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 13, cursor: code.length >= 6 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} />Confirm Delivery</>}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <CheckCircle2 size={30} style={{ color: "#34D399" }} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Delivery Confirmed!</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                ${task.netPayout} payout is processing via Stripe Connect
              </p>
              <p style={{ fontSize: 10, color: "rgba(52,211,153,0.6)", letterSpacing: "0.1em" }}>FUNDS ARRIVING WITHIN 30 MINUTES</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Task Card ─────────────────────────────────────────────────────────── */
function TaskCard({ task, onAccept, onComplete, myTask }: { task: RunnerTask; onAccept?: (id: string) => void; onComplete?: (task: RunnerTask) => void; myTask?: boolean }) {
  const urgencyCfg = URGENCY_CONFIG[task.urgency];
  const typeColor = TYPE_COLOR[task.type] ?? "#60A5FA";

  return (
    <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", transition: "border-color 0.2s" }}>
      {/* Card top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${typeColor}, transparent)` }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: urgencyCfg.color, letterSpacing: "0.15em", padding: "2px 8px", borderRadius: 20, background: urgencyCfg.bg }}>{urgencyCfg.label}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: typeColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>{task.type}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 2 }}>{task.title}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{task.vehicle}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#34D399", lineHeight: 1 }}>${task.netPayout}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>NET PAYOUT</p>
          </div>
        </div>

        {/* Route */}
        {task.distanceMiles > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
            <MapPin size={11} style={{ color: "#60A5FA", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1 }}>{task.pickupCity}</span>
            <ArrowRight size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1, textAlign: "right" }}>{task.dropoffCity}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>{task.distanceMiles} mi</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {[
            { icon: Clock, val: `${task.estimatedHours}h`, label: "Est. time" },
            { icon: DollarSign, val: `$${task.payout}`, label: "Gross" },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Icon size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>{val}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>Buyer: {task.buyerName}</span>
        </div>

        {/* Special instructions */}
        {task.specialInstructions && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.15)", marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: "rgba(201,162,39,0.8)", lineHeight: 1.5 }}>📋 {task.specialInstructions}</p>
          </div>
        )}

        {/* CTA */}
        {!myTask && onAccept && (
          <button onClick={() => onAccept(task.id)} style={{ width: "100%", padding: "11px", borderRadius: 12, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, letterSpacing: "0.04em" }}>
            <Zap size={13} />Accept Task — ${task.netPayout}
          </button>
        )}

        {myTask && task.status === "accepted" && onComplete && (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60A5FA", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Navigation size={12} />Navigate
            </button>
            <button onClick={() => onComplete(task)} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <QrCode size={12} />Confirm Delivery
            </button>
          </div>
        )}

        {myTask && task.status === "completed" && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={13} style={{ color: "#34D399" }} />
            <span style={{ fontSize: 12, color: "#34D399", fontWeight: 700 }}>Completed · ${task.netPayout} paid</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function RunnerTasks() {
  const { user, token } = useAuth();
  const [view, setView] = useState<View>("available");
  const [available, setAvailable] = useState<RunnerTask[]>([]);
  const [mine, setMine] = useState<RunnerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [completingTask, setCompletingTask] = useState<RunnerTask | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/runner/tasks`, { headers: authHeaders });
      const data = await res.json();
      setAvailable(data.tasks ?? []);
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchMine = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${BASE}/api/runner/tasks/mine`, { headers: authHeaders });
    const data = await res.json();
    setMine(data.tasks ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchAvailable(); fetchMine(); }, [fetchAvailable, fetchMine]);

  async function acceptTask(id: string) {
    setAcceptingId(id);
    try {
      const res = await fetch(`${BASE}/api/runner/tasks/${id}/accept`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) { await fetchAvailable(); await fetchMine(); setView("mine"); }
    } finally { setAcceptingId(null); }
  }

  async function onDeliveryComplete() {
    setCompletingTask(null);
    await fetchMine();
  }

  const totalEarned = mine.filter((t) => t.status === "completed").reduce((s, t) => s + t.netPayout, 0);
  const activeCount = mine.filter((t) => t.status === "accepted").length;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto" style={{ paddingBottom: 80 }}>
      <PageHeader icon={Truck} title="Runner Tasks" subtitle="DISPATCH NETWORK · LIVE JOBS" />

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { icon: DollarSign, val: `$${totalEarned}`, label: "Total Earned", color: "#34D399" },
          { icon: Zap,        val: String(activeCount), label: "Active Tasks",  color: "#C9A227" },
          { icon: CheckCircle2, val: String(mine.filter(t => t.status === "completed").length), label: "Completed", color: "#60A5FA" },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{val}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["available", "mine"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 18px", borderRadius: 10, background: view === v ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${view === v ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.08)"}`, color: view === v ? "#C9A227" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "capitalize" }}>
            {v === "available" ? `Available (${available.length})` : `My Tasks (${mine.length})`}
          </button>
        ))}
        <button onClick={() => { fetchAvailable(); fetchMine(); }} style={{ marginLeft: "auto", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
          <Loader2 size={20} style={{ color: "#C9A227", animation: "slow-spin 1s linear infinite" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Loading tasks...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {view === "available" && (
            available.length > 0 ? available.map((t) => (
              <TaskCard key={t.id} task={t} onAccept={(id) => { if (!acceptingId) acceptTask(id); }} />
            )) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Package size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No tasks available right now</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>New jobs appear as orders come in</p>
              </div>
            )
          )}
          {view === "mine" && (
            mine.length > 0 ? mine.map((t) => (
              <TaskCard key={t.id} task={t} myTask onComplete={setCompletingTask} />
            )) : (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Truck size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No tasks accepted yet</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>Accept a task from Available to start earning</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Delivery Code Modal */}
      {completingTask && (
        <DeliveryCodeModal
          task={completingTask}
          onComplete={onDeliveryComplete}
          onClose={() => setCompletingTask(null)}
        />
      )}
    </div>
  );
}
