import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Truck, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, ChevronRight, Globe, Clock, DollarSign,
  TrendingUp, Users, Radio,
  BarChart3, Activity, MapPin, X, Bell,
  TriangleAlert, Loader2, ShieldAlert,
  Brain, Lock, UserCheck, Plug, Target,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pulse {
  kFactor: { current: number; prev: number; delta: number; trend: string; weeklyReferrals: number; weeklyConversions: number };
  memberSlices: { totalPaid: number; thisWeek: number; activeRecipients: number; largestSinglePayout: number };
  missions: { active: number; inTransit: number; guardianActive: number; arrivingToday: number; totalDealValue: number };
  killSwitch: { flaggedCount: number; totalOnHold: number; highestRiskScore: number };
  revenue: { todayGmv: number; weekGmv: number; platformProfit: number };
  unackedAlerts: number;
  meshRegions: Record<string, number>;
  timestamp: string;
}

interface Mission {
  id: string; vehicle: string; make: string; model: string; year: number; vin: string;
  route: { from: string; to: string };
  carrier: string; status: string; dayOfTotal: string; etaHours: number;
  dealValue: number; guardianActive: boolean; lastPingMinutesAgo: number;
  currentCity: string; region: string;
}

interface FlaggedTxn {
  id: string; txnId: string; type: string; amount: number; from: string; to: string;
  riskScore: number; riskReasons: string[]; aiReasoning: string;
  flaggedAt: string; resolvedAt: string | null; resolution: string | null;
  holdUntil: string;
}

interface Alert {
  id: string; level: "critical" | "warning" | "info";
  title: string; body: string; timestamp: string; acked: boolean; source: string;
}

interface KTrend { day: string; value: number; referrals: number; conversions: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toLocaleString()}`;

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const holdIn = (iso: string) => {
  const diff = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60_000));
  return diff < 1 ? "< 1 min" : `${diff} min`;
};

const RISK_COLOR = (score: number) =>
  score >= 80 ? "text-red-400" :
  score >= 60 ? "text-amber-400" :
  "text-yellow-400";

const RISK_BG = (score: number) =>
  score >= 80 ? "bg-red-500/8 border-red-500/20" :
  score >= 60 ? "bg-amber-500/8 border-amber-500/20" :
  "bg-yellow-500/8 border-yellow-500/20";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  in_transit:      { label: "IN TRANSIT",     color: "text-blue-400",    dot: "bg-blue-400"    },
  pickup_pending:  { label: "PICKUP PENDING",  color: "text-amber-400",   dot: "bg-amber-400"   },
  guardian_active: { label: "GUARDIAN",        color: "text-emerald-400", dot: "bg-emerald-400" },
  arriving_today:  { label: "ARRIVING TODAY",  color: "text-violet-400",  dot: "bg-violet-400"  },
  delivered:       { label: "DELIVERED",       color: "text-white/30",    dot: "bg-white/20"    },
};

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-white/30 text-[11px]">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

// ─── K-Factor Sparkline ───────────────────────────────────────────────────────
function KSparkline({ trend }: { trend: KTrend[] }) {
  if (!trend.length) return null;
  const vals = trend.map((d) => d.value);
  const min = Math.min(...vals) - 0.05;
  const max = Math.max(...vals) + 0.05;
  const range = max - min;
  const W = 160, H = 40;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const viral = 1.0;
  const viralY = H - ((viral - min) / range) * H;

  return (
    <svg width={W} height={H} className="overflow-visible">
      {/* Viral threshold line */}
      <line x1={0} y1={viralY} x2={W} y2={viralY} stroke="rgba(251,191,36,0.25)" strokeWidth={1} strokeDasharray="3,3" />
      {/* Line */}
      <polyline fill="none" stroke="#10B981" strokeWidth={1.5} points={points.join(" ")} />
      {/* Dots */}
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 3.5 : 2} fill={i === vals.length - 1 ? "#10B981" : "#10B98150"} />;
      })}
      {/* Labels */}
      {trend.map((d, i) => {
        const x = (i / (vals.length - 1)) * W;
        return <text key={i} x={x} y={H + 12} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.2)">{d.day}</text>;
      })}
    </svg>
  );
}

// ─── Risk score bar ───────────────────────────────────────────────────────────
function RiskBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 80 ? "bg-red-500" : score >= 60 ? "bg-amber-500" : "bg-yellow-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-bold font-mono ${RISK_COLOR(score)}`}>{score}</span>
    </div>
  );
}

// ─── Kill-Switch Card ─────────────────────────────────────────────────────────
function KillSwitchCard({ txn, onOverride }: { txn: FlaggedTxn; onOverride: (id: string, action: "approved" | "rejected") => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState<"approved" | "rejected" | null>(null);
  const resolved = !!txn.resolvedAt;

  const handleAction = async (action: "approved" | "rejected") => {
    setActing(action);
    await onOverride(txn.id, action);
    setActing(null);
  };

  const RISK_REASON_LABELS: Record<string, string> = {
    aml_velocity:       "AML velocity flag",
    new_account_large_sum: "New account / large sum",
    k_factor_anomaly:   "K-Factor anomaly",
    geo_mismatch:       "Geo mismatch",
    rapid_reversal:     "Rapid reversal",
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${resolved
      ? txn.resolution === "approved" ? "border-emerald-500/15 bg-emerald-500/[0.02]" : "border-white/5 bg-white/[0.01] opacity-50"
      : RISK_BG(txn.riskScore)
    }`}>
      <button className="w-full text-left p-4" onClick={() => !resolved && setExpanded((v) => !v)}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${RISK_BG(txn.riskScore)}`}>
            {resolved
              ? txn.resolution === "approved"
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-white/30" />
              : <AlertTriangle className={`w-4 h-4 ${RISK_COLOR(txn.riskScore)}`} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-white font-mono">{txn.txnId}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${RISK_BG(txn.riskScore)} ${RISK_COLOR(txn.riskScore)}`}>
                {txn.type.replace(/_/g, " ").toUpperCase()}
              </span>
              {resolved && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ml-auto ${txn.resolution === "approved" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/8" : "text-white/30 border-white/10 bg-white/5"}`}>
                  {txn.resolution?.toUpperCase()}
                </span>
              )}
            </div>
            <p className={`text-base font-bold mb-1 ${resolved ? "text-white/40" : "text-white"}`}>{fmt(txn.amount)}</p>
            <div className="flex items-center gap-2">
              <RiskBar score={txn.riskScore} />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {txn.riskReasons.map((r) => (
                <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${RISK_COLOR(txn.riskScore)} bg-white/[0.03] border border-white/6`}>
                  {RISK_REASON_LABELS[r] ?? r}
                </span>
              ))}
            </div>
          </div>

          {!resolved && <ChevronRight className={`w-4 h-4 text-white/20 shrink-0 mt-1 transition-transform ${expanded ? "rotate-90" : ""}`} />}
        </div>
      </button>

      {/* Expanded AI reasoning */}
      {expanded && !resolved && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5">AI Risk Analysis</p>
            <p className="text-[11px] text-white/50 leading-5 bg-black/30 rounded-xl p-3 border border-white/6 font-mono">{txn.aiReasoning}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/6">
              <p className="text-white/20 mb-0.5">From</p>
              <p className="text-white/60 truncate">{txn.from}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/6">
              <p className="text-white/20 mb-0.5">To</p>
              <p className="text-white/60 truncate">{txn.to}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/25">
            <Clock className="w-3 h-3" />
            <span>Flagged {timeAgo(txn.flaggedAt)}</span>
            <span>·</span>
            <span>Auto-releases in {holdIn(txn.holdUntil)}</span>
          </div>

          {/* Kill-switch buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction("rejected")}
              disabled={!!acting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-500/20 disabled:opacity-40 transition-colors"
            >
              {acting === "rejected" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              REJECT & BLOCK
            </button>
            <button
              onClick={() => handleAction("approved")}
              disabled={!!acting}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
            >
              {acting === "approved" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              APPROVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mission Row ──────────────────────────────────────────────────────────────
function MissionRow({ m }: { m: Mission }) {
  const sc = STATUS_CONFIG[m.status] ?? { label: m.status, color: "text-white/40", dot: "bg-white/20" };
  return (
    <div className="flex items-start gap-3 p-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
      <div className="relative shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
          <Truck className="w-3.5 h-3.5 text-white/30" />
        </div>
        {m.guardianActive && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-[#07070b] flex items-center justify-center">
            <Shield className="w-2 h-2 text-black" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{m.vehicle}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-white/20 shrink-0" />
          <p className="text-[10px] text-white/30 truncate">{m.currentCity}</p>
          <span className="text-[10px] text-white/15">→</span>
          <p className="text-[10px] text-white/20 truncate">{m.route.to}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[9px] font-bold ${sc.color}`}>{sc.label}</span>
          <span className="text-[9px] text-white/20">Day {m.dayOfTotal}</span>
          <span className="text-[9px] text-white/20">·</span>
          <span className="text-[9px] text-white/20">{m.carrier}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-white">{fmt(m.dealValue)}</p>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${m.lastPingMinutesAgo <= 5 ? "bg-emerald-400" : m.lastPingMinutesAgo <= 15 ? "bg-amber-400" : "bg-red-400"} ${m.lastPingMinutesAgo <= 5 ? "animate-pulse" : ""}`} />
          <span className="text-[9px] text-white/20">{m.lastPingMinutesAgo}m ago</span>
        </div>
        <p className="text-[9px] text-white/20 mt-0.5">ETA {m.etaHours}h</p>
      </div>
    </div>
  );
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────
function AlertsPanel({ alerts, onAck }: { alerts: Alert[]; onAck: (id: string) => void }) {
  const LEVEL_CFG = {
    critical: { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-500/8",    border: "border-red-500/15"    },
    warning:  { icon: TriangleAlert, color: "text-amber-400",  bg: "bg-amber-500/8",  border: "border-amber-500/15"  },
    info:     { icon: Activity,      color: "text-blue-400",   bg: "bg-blue-500/8",   border: "border-blue-500/15"   },
  };
  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const cfg = LEVEL_CFG[a.level];
        const Icon = cfg.icon;
        return (
          <div key={a.id} className={`flex items-start gap-2.5 p-3 rounded-xl border transition-opacity ${a.acked ? "opacity-35" : ""} ${cfg.bg} ${cfg.border}`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-semibold ${cfg.color}`}>{a.title}</p>
              <p className="text-[10px] text-white/35 leading-4 mt-0.5">{a.body}</p>
              <p className="text-[9px] text-white/20 mt-1">{a.source} · {timeAgo(a.timestamp)}</p>
            </div>
            {!a.acked && (
              <button onClick={() => onAck(a.id)} className="text-white/15 hover:text-white/40 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "overview" | "missions" | "killswitch" | "alerts" | "hectocorn" | "intelligence";

interface BehavioralStatus {
  engineVersion: string;
  activeSessions: number;
  stateDistribution: Record<string, number>;
  agentProfiles: number;
  objectionTypes: number;
  status: string;
}

interface IntelligenceData {
  totalPatterns: number;
  topPatterns: { pattern: string; effectiveness: number; conversions: number }[];
  engagementFunnel: Record<string, number>;
  networkLearningScore: number;
}

interface IntegrationStatus {
  hubspot: { connected: boolean; contacts: number; deals: number; configured: boolean };
  tiktok: { connected: boolean; campaigns: number; leads: number; configured: boolean };
  constantContact: { connected: boolean; configured: boolean };
}


export default function CommandCenter() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [flagged, setFlagged] = useState<FlaggedTxn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kTrend, setKTrend] = useState<KTrend[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pulseR, missionsR, flaggedR, alertsR, trendR] = await Promise.all([
      fetch("/api/command/pulse"),
      fetch("/api/command/missions"),
      fetch("/api/command/flagged"),
      fetch("/api/command/alerts"),
      fetch("/api/command/k-factor/trend"),
    ]);
    const [p, m, f, a, t] = await Promise.all([
      pulseR.json(), missionsR.json(), flaggedR.json(), alertsR.json(), trendR.json(),
    ]);
    setPulse(p);
    setMissions(m.missions ?? []);
    setFlagged(f.flagged ?? []);
    setAlerts(a.alerts ?? []);
    setKTrend(t.trend ?? []);
    setLastRefresh(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const handleOverride = async (id: string, action: "approved" | "rejected") => {
    const res = await fetch(`/api/command/override/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const d = await res.json();
      toast({
        title: action === "approved" ? "Transaction Approved" : "Transaction Blocked",
        description: d.message,
      });
      await fetchAll();
    }
  };

  const ackAlert = async (id: string) => {
    await fetch(`/api/command/alerts/${id}/ack`, { method: "POST" });
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acked: true } : a));
  };

  const unresolvedFlagged = flagged.filter((t) => !t.resolvedAt);
  const unackedAlerts = alerts.filter((a) => !a.acked);

  const { data: hectocornData } = useQuery({
    queryKey: ["hectocorn"],
    queryFn: () => fetch("/api/command/hectocorn").then(r => r.json()),
    enabled: tab === "hectocorn",
    refetchInterval: 60_000,
  });

  const { data: behavioralData } = useQuery<BehavioralStatus>({
    queryKey: ["behavioral-status"],
    queryFn: () => fetch("/api/behavioral/status").then(r => r.json()),
    enabled: tab === "intelligence",
    refetchInterval: 15_000,
  });

  const { data: intelligenceData } = useQuery<IntelligenceData>({
    queryKey: ["behavioral-intelligence"],
    queryFn: () => fetch("/api/behavioral/intelligence", {
      headers: { Authorization: `Bearer ${localStorage.getItem("3c_auth_token") || ""}` },
    }).then(r => r.ok ? r.json() : { totalPatterns: 0, topPatterns: [], engagementFunnel: {}, networkLearningScore: 0 }),
    enabled: tab === "intelligence",
    refetchInterval: 30_000,
  });

  const { data: integrationStatus } = useQuery<IntegrationStatus>({
    queryKey: ["integration-status"],
    queryFn: async () => {
      const [hs, tt, cc] = await Promise.all([
        fetch("/api/hubspot/status").then(r => r.json()).catch(() => ({ connected: false, contacts: 0, deals: 0, configured: false })),
        fetch("/api/tiktok-ads/status").then(r => r.json()).catch(() => ({ connected: false, campaigns: 0, totalLeads: 0, configured: false })),
        fetch("/api/marketing/capabilities").then(r => r.json()).catch(() => ({ connected: false, configured: false })),
      ]);
      return {
        hubspot: { connected: !!hs.connected, contacts: hs.contacts || 0, deals: hs.deals || 0, configured: !!hs.configured },
        tiktok: { connected: !!tt.connected, campaigns: tt.campaigns || 0, leads: tt.totalLeads || 0, configured: !!tt.configured },
        constantContact: { connected: !!cc.features?.emailMarketing, configured: !!cc.features },
      };
    },
    enabled: tab === "intelligence",
    refetchInterval: 60_000,
  });

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview",      label: "Overview" },
    { id: "intelligence",  label: "Intelligence" },
    { id: "missions",      label: "Missions",    badge: missions.filter(m => m.status !== "delivered").length },
    { id: "killswitch",    label: "Kill-Switch", badge: unresolvedFlagged.length },
    { id: "alerts",        label: "Alerts",      badge: unackedAlerts.length },
    { id: "hectocorn",     label: "Hectocorn" },
  ];

  const kColor = pulse
    ? pulse.kFactor.trend === "viral"    ? "text-emerald-400"
    : pulse.kFactor.trend === "healthy"  ? "text-amber-400"
    : "text-red-400"
    : "text-white/30";

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Radio}
        accent="#EF4444"
        title="FOUNDER'S COMMAND CENTER"
        subtitle="Live K-Factor · Member Slices · Active Missions · Kill-Switch"
        badge={
          <div className="flex items-center gap-2">
            <span className="neural-badge neural-badge-orange">FOUNDER ACCESS</span>
            {unackedAlerts.some(a => a.level === "critical") && (
              <span className="neural-badge neural-badge-orange animate-pulse">⚠ CRITICAL ALERT</span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <LiveClock />
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8 text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        }
      />

      <div className="p-6">

        {/* ── Founder Contract ─────────────────────────────────────── */}
        <a
          href="/founder"
          style={{ textDecoration: "none" }}
          className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.04)] hover:bg-[rgba(201,162,39,0.07)] transition-all p-4 mb-5 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)" }}>
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-wide uppercase">Founder's Ownership Contract</p>
              <p className="text-[10px] text-white/40 mt-0.5">Ronald Antonio Cadet · CUXTOMCANDYCLUB LLC · Private — Your Eyes Only</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#C9A227] border border-[rgba(201,162,39,0.35)] px-2 py-1 rounded-lg">
              VIEW
            </span>
          </div>
        </a>

        {/* ── Pulse Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* K-Factor */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Live K-Factor</p>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <p className={`text-3xl font-black ${kColor}`}>{pulse?.kFactor.current.toFixed(2) ?? "—"}</p>
              <div className="mb-1">
                <span className={`text-[10px] font-bold ${pulse?.kFactor.delta && pulse.kFactor.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pulse?.kFactor.delta !== undefined ? (pulse.kFactor.delta > 0 ? "+" : "") + pulse.kFactor.delta.toFixed(2) : ""}
                </span>
                <p className="text-[9px] text-white/20">vs yesterday</p>
              </div>
            </div>
            <KSparkline trend={kTrend} />
            <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-[9px] text-white/20">Referrals</p>
                <p className="text-xs font-bold text-white">{pulse?.kFactor.weeklyReferrals.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/20">Conversions</p>
                <p className="text-xs font-bold text-white">{pulse?.kFactor.weeklyConversions.toLocaleString()}</p>
              </div>
              <div className="ml-auto">
                <p className="text-[9px] text-white/20">Status</p>
                <p className={`text-xs font-bold uppercase ${kColor}`}>{pulse?.kFactor.trend ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Member Slices */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Member Slices</p>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pulse ? fmt(pulse.memberSlices.totalPaid) : "—"}</p>
            <p className="text-[10px] text-white/25 mb-3">total paid out</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-white/25">This week</span>
                <span className="text-violet-400 font-bold">{pulse ? fmt(pulse.memberSlices.thisWeek) : "—"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/25">Recipients</span>
                <span className="text-white font-bold">{pulse?.memberSlices.activeRecipients.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/25">Largest payout</span>
                <span className="text-white font-bold">{pulse ? fmt(pulse.memberSlices.largestSinglePayout) : "—"}</span>
              </div>
            </div>
          </div>

          {/* Active Missions */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Active Missions</p>
            </div>
            <p className="text-2xl font-black text-white mb-1">{pulse?.missions.active ?? "—"}</p>
            <p className="text-[10px] text-white/25 mb-3">{pulse ? fmt(pulse.missions.totalDealValue) : "—"} total at risk</p>
            <div className="space-y-1.5">
              {[
                { label: "In transit",      val: pulse?.missions.inTransit,      color: "text-blue-400"    },
                { label: "Guardian active", val: pulse?.missions.guardianActive,  color: "text-emerald-400" },
                { label: "Arriving today",  val: pulse?.missions.arrivingToday,  color: "text-violet-400"  },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-[10px]">
                  <span className="text-white/25">{label}</span>
                  <span className={`font-bold ${color}`}>{val ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kill-Switch */}
          <div className={`rounded-2xl border p-4 ${unresolvedFlagged.length > 0 ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className={`w-3.5 h-3.5 ${unresolvedFlagged.length > 0 ? "text-red-400 animate-pulse" : "text-white/25"}`} />
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Kill-Switch Queue</p>
            </div>
            <p className={`text-2xl font-black mb-1 ${unresolvedFlagged.length > 0 ? "text-red-400" : "text-white"}`}>
              {pulse?.killSwitch.flaggedCount ?? "—"}
            </p>
            <p className="text-[10px] text-white/25 mb-3">transactions flagged</p>
            {unresolvedFlagged.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/25">On hold</span>
                  <span className="text-red-400 font-bold">{pulse ? fmt(pulse.killSwitch.totalOnHold) : "—"}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/25">Highest risk</span>
                  <span className="text-red-400 font-bold">{pulse?.killSwitch.highestRiskScore ?? "—"}/100</span>
                </div>
                <button
                  onClick={() => setTab("killswitch")}
                  className="w-full mt-2 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                >
                  REVIEW & OVERRIDE →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All clear
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/6 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === id ? "bg-white/8 text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              {label}
              {badge !== undefined && badge > 0 && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                  id === "killswitch" ? "bg-red-500 text-white" : "bg-white/10 text-white/60"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue strip */}
            <div className="lg:col-span-2 grid grid-cols-3 gap-3">
              {[
                { label: "Today GMV",       val: pulse?.revenue.todayGmv,     color: "text-white" },
                { label: "Week GMV",        val: pulse?.revenue.weekGmv,      color: "text-white" },
                { label: "Platform Profit", val: pulse?.revenue.platformProfit, color: "text-emerald-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BarChart3 className="w-3 h-3 text-white/20" />
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className={`text-lg font-bold ${color}`}>{val ? fmt(val) : "—"}</p>
                </div>
              ))}
            </div>

            {/* Missions (mini) */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-semibold text-white">Active Missions</p>
                </div>
                <button onClick={() => setTab("missions")} className="text-[10px] text-white/25 hover:text-white/50">View all →</button>
              </div>
              <div>
                {missions.filter(m => m.status !== "delivered").slice(0, 4).map((m) => (
                  <MissionRow key={m.id} m={m} />
                ))}
              </div>
            </div>

            {/* Alerts (mini) */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-semibold text-white">System Alerts</p>
                  {unackedAlerts.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{unackedAlerts.length}</span>
                  )}
                </div>
                <button onClick={() => setTab("alerts")} className="text-[10px] text-white/25 hover:text-white/50">View all →</button>
              </div>
              <div className="p-3">
                <AlertsPanel alerts={alerts.slice(0, 4)} onAck={ackAlert} />
              </div>
            </div>

            {/* Mesh stats */}
            <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                <p className="text-sm font-semibold text-white">National Mesh</p>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">4 regions online</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
                {[
                  { label: "West Coast", key: "west",      color: "text-sky-400"     },
                  { label: "Midwest",    key: "midwest",   color: "text-amber-400"   },
                  { label: "South",      key: "south",     color: "text-rose-400"    },
                  { label: "Northeast",  key: "northeast", color: "text-violet-400"  },
                ].map(({ label, key, color }) => (
                  <div key={key} className="p-4 text-center bg-[#0d0d10]">
                    <p className={`text-xl font-black ${color}`}>{pulse?.meshRegions[key] ?? 0}</p>
                    <p className="text-[9px] text-white/20 mt-0.5">{label}</p>
                    <p className="text-[9px] text-white/15">active</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Missions Tab ──────────────────────────────────────────── */}
        {tab === "missions" && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/6 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">All Active Missions</p>
              <span className="text-[10px] text-white/25 ml-auto">Guardian = green shield badge</span>
            </div>
            {missions.map((m) => <MissionRow key={m.id} m={m} />)}
          </div>
        )}

        {/* ── Kill-Switch Tab ───────────────────────────────────────── */}
        {tab === "killswitch" && (
          <div className="space-y-4">
            {unresolvedFlagged.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-400">{unresolvedFlagged.length} transaction{unresolvedFlagged.length > 1 ? "s" : ""} in Kill-Switch Queue</p>
                  <p className="text-[11px] text-white/40">Total on hold: {fmt(unresolvedFlagged.reduce((s, t) => s + t.amount, 0))} · Tap a card to review & override</p>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {flagged.map((t) => <KillSwitchCard key={t.id} txn={t} onOverride={handleOverride} />)}
            </div>
          </div>
        )}

        {/* ── Alerts Tab ────────────────────────────────────────────── */}
        {tab === "alerts" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">{unackedAlerts.length} unacknowledged</p>
              <button
                onClick={() => unackedAlerts.forEach((a) => ackAlert(a.id))}
                className="text-[10px] text-white/25 hover:text-white/50"
              >
                Ack all
              </button>
            </div>
            <AlertsPanel alerts={alerts} onAck={ackAlert} />
          </div>
        )}

        {/* ── INTELLIGENCE TAB ─────────────────────────────────────────── */}
        {tab === "intelligence" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Behavioral Engine</p>
                </div>
                <p className="text-2xl font-black text-violet-400 mb-1">{behavioralData?.status === "OPERATIONAL" ? "LIVE" : "OFFLINE"}</p>
                <p className="text-[10px] text-white/25">v{behavioralData?.engineVersion ?? "—"}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/25">Agent Profiles</span>
                    <span className="text-violet-400 font-bold">{behavioralData?.agentProfiles ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/25">Objection Types</span>
                    <span className="text-violet-400 font-bold">{behavioralData?.objectionTypes ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/25">Active Sessions</span>
                    <span className="text-white font-bold">{behavioralData?.activeSessions ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Conversion Intel</p>
                </div>
                <p className="text-2xl font-black text-emerald-400 mb-1">{intelligenceData?.networkLearningScore?.toFixed(0) ?? "0"}%</p>
                <p className="text-[10px] text-white/25">Network Learning Score</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/25">Patterns Tracked</span>
                    <span className="text-emerald-400 font-bold">{intelligenceData?.totalPatterns ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/25">Top Pattern Score</span>
                    <span className="text-white font-bold">{intelligenceData?.topPatterns?.[0]?.effectiveness?.toFixed(0) ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Engagement Funnel</p>
                </div>
                <div className="space-y-1">
                  {["COLD", "CURIOUS", "WARM", "HOT", "CLOSING", "CLOSED"].map((state, i) => {
                    const count = behavioralData?.stateDistribution?.[state] ?? 0;
                    const colors = ["text-blue-400", "text-cyan-400", "text-amber-400", "text-orange-400", "text-red-400", "text-emerald-400"];
                    return (
                      <div key={state} className="flex justify-between text-[10px]">
                        <span className="text-white/25">{state}</span>
                        <span className={`font-bold ${colors[i]}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Staff Access</p>
                </div>
                <p className="text-2xl font-black text-amber-400 mb-1">Sovereign</p>
                <p className="text-[10px] text-white/25">Full intelligence access</p>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[9px] text-white/20 mb-2">Grant access to staff members from the Staff Management panel. Intelligence data is restricted to Sovereign and authorized personnel only.</p>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold">Ron Cadet — Full Access</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="p-4 border-b border-white/6 flex items-center gap-2">
                  <Plug className="w-4 h-4 text-[#FF2D9A]" />
                  <p className="text-sm font-semibold text-white">Integration Status</p>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    {
                      name: "HubSpot CRM",
                      icon: "HS",
                      color: "#FF7A59",
                      status: integrationStatus?.hubspot?.connected ? "Connected" : integrationStatus?.hubspot?.configured ? "Configured" : "Ready to Connect",
                      live: integrationStatus?.hubspot?.connected,
                      stats: integrationStatus?.hubspot?.connected
                        ? `${integrationStatus.hubspot.contacts} contacts · ${integrationStatus.hubspot.deals} deals`
                        : "Add HUBSPOT_API_KEY to activate",
                    },
                    {
                      name: "TikTok Ads",
                      icon: "TT",
                      color: "#FF2D9A",
                      status: integrationStatus?.tiktok?.connected ? "Connected" : integrationStatus?.tiktok?.configured ? "Configured" : "Ready to Connect",
                      live: integrationStatus?.tiktok?.connected,
                      stats: integrationStatus?.tiktok?.connected
                        ? `${integrationStatus.tiktok.campaigns} campaigns · ${integrationStatus.tiktok.leads} leads`
                        : "Add TIKTOK_ADS_ACCESS_TOKEN to activate",
                    },
                    {
                      name: "Constant Contact",
                      icon: "CC",
                      color: "#0076BE",
                      status: integrationStatus?.constantContact?.configured ? "Ready" : "Ready to Connect",
                      live: integrationStatus?.constantContact?.connected,
                      stats: "Email + SMS + Landing Pages + E-Commerce",
                    },
                  ].map(integ => (
                    <div key={integ.name} className="flex items-center gap-3 p-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-white"
                        style={{ background: `${integ.color}20`, border: `1px solid ${integ.color}30` }}
                      >
                        {integ.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white">{integ.name}</p>
                          <div className={`w-1.5 h-1.5 rounded-full ${integ.live ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                          <span className={`text-[9px] font-bold ${integ.live ? "text-emerald-400" : "text-amber-400"}`}>
                            {integ.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">{integ.stats}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="p-4 border-b border-white/6 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-semibold text-white">Top Behavioral Patterns</p>
                </div>
                <div className="p-4 space-y-3">
                  {(intelligenceData?.topPatterns ?? []).length > 0 ? (
                    intelligenceData!.topPatterns.slice(0, 8).map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/15 font-mono w-4">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-[11px] text-white/60 font-medium">{p.pattern}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 rounded-full bg-white/6 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                                style={{ width: `${Math.min(p.effectiveness * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-violet-400 font-bold">{(p.effectiveness * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-white/20">{p.conversions} conv.</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-[11px] text-white/25">Behavioral patterns accumulate as users interact with ONYX agents.</p>
                      <p className="text-[10px] text-white/15 mt-1">The Learning Brain gets smarter with every conversation.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <p className="text-[10px] font-black text-amber-400/60 tracking-wider">SOVEREIGN INTELLIGENCE PROTOCOL</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                The Intelligence Layer combines Behavioral DNA (12 agent profiles), Conversion Intelligence (pattern learning),
                HubSpot CRM (contact + deal pipeline), TikTok Ads (lead generation + audience targeting),
                and Constant Contact (email/SMS marketing automation). All data flows through the proof chain.
                Staff access is controlled exclusively by the Sovereign — grant or revoke from this panel.
              </p>
            </div>
          </div>
        )}

        {/* ── HECTOCORN TICKER ──────────────────────────────────────────── */}
        {tab === "hectocorn" && (
          <div>
            {!hectocornData ? (
              <p className="text-center text-white/30 py-16 text-sm">Loading Hectocorn data…</p>
            ) : (
              <div>
                {/* Hero summary */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 mb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-black tracking-[1.5px] text-amber-400">HECTOCORN — UNITY TRANSACTIONS · HUNTS POINT → SEAPORT CORRIDOR</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "TOTAL GMV", value: `$${(hectocornData.summary.totalGMV / 1_000_000).toFixed(2)}M`, color: "#C9A227" },
                      { label: "NET PLATFORM", value: `$${(hectocornData.summary.netPlatformRevenue / 1_000).toFixed(0)}K`, color: "#10B981" },
                      { label: "AVG DEAL SIZE", value: `$${(hectocornData.summary.avgDealSize / 1_000).toFixed(0)}K`, color: "#fff" },
                      { label: "SUCCESS RATE", value: hectocornData.summary.successRate, color: "#10B981" },
                    ].map((s: { label: string; value: string; color: string }) => (
                      <div key={s.label}>
                        <div className="text-[9px] text-white/25 font-bold tracking-wider mb-1">{s.label}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/6">
                    {[
                      { label: "SETTLED", value: hectocornData.summary.settled, color: "#10B981" },
                      { label: "PROCESSING", value: hectocornData.summary.processing, color: "#FBBF24" },
                      { label: "PENDING", value: hectocornData.summary.pending, color: "rgba(255,255,255,0.4)" },
                      { label: "AVG LATENCY", value: `${hectocornData.summary.avgLatencyMs}ms`, color: "#fff" },
                    ].map((s: { label: string; value: number | string; color: string }) => (
                      <div key={s.label}>
                        <div className="text-[9px] text-white/25 font-bold tracking-wider mb-1">{s.label}</div>
                        <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projection */}
                <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4 mb-5">
                  <p className="text-[9px] font-bold text-amber-400/60 tracking-wider mb-2">ANNUALISED PROJECTIONS (×52 WEEKS)</p>
                  <div className="flex gap-8">
                    <div>
                      <div className="text-[9px] text-white/25 mb-1">Projected GMV</div>
                      <div className="text-2xl font-black text-amber-400">${(hectocornData.summary.projectedAnnualGMV / 1_000_000).toFixed(1)}M</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/25 mb-1">Projected Profit</div>
                      <div className="text-2xl font-black text-emerald-400">${(hectocornData.summary.projectedAnnualProfit / 1_000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/25 mb-1">Txns/Day</div>
                      <div className="text-2xl font-black text-white">{hectocornData.velocity.txnsPerDay}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/25 mb-1">Peak Region</div>
                      <div className="text-2xl font-black text-white">{hectocornData.velocity.peakRegion}</div>
                    </div>
                  </div>
                </div>

                {/* Recent transactions */}
                <p className="text-[9px] font-bold text-white/25 tracking-wider mb-3">RECENT TRANSACTIONS</p>
                <div className="flex flex-col gap-2">
                  {(hectocornData.transactions as any[]).map((txn: any) => (
                    <div key={txn.txnId} className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-white/20">{txn.txnId}</span>
                        <span className="text-xs font-semibold text-white/70">{txn.vehicle}</span>
                        <span className="text-[9px] text-white/30">{txn.region}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">${(txn.amount / 1_000).toFixed(0)}K</div>
                          <div className="text-[9px] text-emerald-400/70">+${(txn.splits.netPlatform / 1_000).toFixed(1)}K net</div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          txn.status === "settled" ? "bg-emerald-400/10 text-emerald-400" :
                          txn.status === "processing" ? "bg-amber-400/10 text-amber-400" :
                          "bg-white/5 text-white/30"
                        }`}>{txn.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
