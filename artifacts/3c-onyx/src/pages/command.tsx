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
import { useAuth } from "@/context/AuthContext";

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

interface AgentDirective {
  id: string;
  category: string;
  urgency: string;
  confidence: number;
  directive: string;
  timestamp: number;
}

interface AgentStatusEntry {
  id: string;
  title: string;
  name: string;
  domain: string;
  status: string;
  maturity: string;
  totalDirectives: number;
  acceptanceRate: number;
  lastActive: number;
  kpis: string[];
  responsibilities: string[];
  recentDirectives: AgentDirective[];
}

interface AgentStatusResponse {
  status: string;
  totalAgents: number;
  activeRules: number;
  agents: AgentStatusEntry[];
  timestamp: string;
}

interface SuccessStoryCard {
  id: number;
  displayName: string;
  location: string;
  previousJob: string;
  currentRole: string;
  totalEarnings: number;
  monthlyAvg: number;
  monthsOnPlatform: number;
  dealsCompleted: number;
  referralChainDepth: number;
  headline: string;
  story: string;
  isFeatured: boolean;
  isVerified: boolean;
}

interface SuccessStatsData {
  totalStories: number;
  totalEarnings: number;
  avgMonthly: number;
  totalDeals: number;
  topEarner: number;
}

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
type Tab = "overview" | "missions" | "killswitch" | "alerts" | "hectocorn" | "intelligence" | "c-suite" | "fintech" | "book-doctrine" | "success-stories" | "founder-dashboard";

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


const SOVEREIGN_USER_ID = 6;

export default function CommandCenter() {
  const { user } = useAuth();
  const isSovereign = user?.id === SOVEREIGN_USER_ID;
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [flagged, setFlagged] = useState<FlaggedTxn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kTrend, setKTrend] = useState<KTrend[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [storySearch, setStorySearch] = useState("");
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

  const { data: hardenedData } = useQuery<{
    layers: {
      stateHardener: { domains: number; totalStates: number; totalTransitions: number; status: string };
      michelinDemand: { frictionEventTypes: number; demandTiers: number; status: string };
      distributionHub: { tiers: number; categories: number; status: string };
      idempotencyGuard: { cachedResponses: number; pendingLocks: number };
    };
    status: string;
  }>({
    queryKey: ["hardened-status"],
    queryFn: () => fetch("/api/hardened/status").then(r => r.json()),
    enabled: tab === "intelligence",
    refetchInterval: 60_000,
  });

  const { data: infraMeshData } = useQuery<any>({
    queryKey: ["infra-mesh"],
    queryFn: () => fetch("/api/infrastructure/mesh", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 15_000,
  });

  const { data: infraMetricsData } = useQuery<any>({
    queryKey: ["infra-metrics"],
    queryFn: () => fetch("/api/infrastructure/metrics", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 10_000,
  });

  const { data: infraLogsData } = useQuery<any>({
    queryKey: ["infra-logs-dashboard"],
    queryFn: () => fetch("/api/infrastructure/logs/dashboard", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 15_000,
  });

  const { data: infraVaultData } = useQuery<any>({
    queryKey: ["infra-vault"],
    queryFn: () => fetch("/api/infrastructure/vault", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 30_000,
  });

  const { data: infraPipelineData } = useQuery<any>({
    queryKey: ["infra-pipeline"],
    queryFn: () => fetch("/api/infrastructure/pipeline", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 30_000,
  });

  const { data: learningData } = useQuery<any>({
    queryKey: ["self-learning"],
    queryFn: () => fetch("/api/learning/dashboard", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 15_000,
  });

  const { data: nbaData } = useQuery<any>({
    queryKey: ["nba-dashboard"],
    queryFn: () => fetch("/api/nba/dashboard", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "intelligence",
    refetchInterval: 15_000,
  });

  const { data: cSuiteData } = useQuery<any>({
    queryKey: ["c-suite-dashboard"],
    queryFn: () => fetch("/api/c-suite/dashboard", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "c-suite" || tab === "book-doctrine",
    refetchInterval: 10_000,
  });

  const { data: agentStatusData } = useQuery<AgentStatusResponse | null>({
    queryKey: ["c-suite-status"],
    queryFn: () => fetch("/api/c-suite/status").then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "book-doctrine" || tab === "c-suite" || tab === "founder-dashboard",
    refetchInterval: 10_000,
  });

  const { data: fintechData } = useQuery<any>({
    queryKey: ["fintech-dashboard"],
    queryFn: () => fetch("/api/fintech/dashboard", { headers: { "Content-Type": "application/json" } }).then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "fintech",
    refetchInterval: 10_000,
  });

  const { data: successStoriesData } = useQuery<{ stories: SuccessStoryCard[] } | null>({
    queryKey: ["success-stories-published"],
    queryFn: () => fetch("/api/success-stories/published").then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "success-stories",
  });

  const { data: successStatsData } = useQuery<SuccessStatsData | null>({
    queryKey: ["success-stories-stats"],
    queryFn: () => fetch("/api/success-stories/stats").then(r => r.ok ? r.json() : null).catch(() => null),
    enabled: tab === "success-stories",
  });

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview",          label: "Overview" },
    { id: "intelligence",      label: "Intelligence" },
    { id: "missions",          label: "Missions",        badge: missions.filter(m => m.status !== "delivered").length },
    { id: "killswitch",        label: "Kill-Switch",     badge: unresolvedFlagged.length },
    { id: "alerts",            label: "Alerts",          badge: unackedAlerts.length },
    { id: "hectocorn",         label: "Hectocorn" },
    { id: "c-suite",           label: "C-Suite AI" },
    { id: "book-doctrine",     label: "Book Doctrine" },
    { id: "success-stories",   label: "Success Stories" },
    { id: "fintech",           label: "Fintech Guard" },
    ...(isSovereign ? [{ id: "founder-dashboard" as Tab, label: "Founder HQ" }] : []),
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
              <p className="text-[10px] text-white/40 mt-0.5">RAC3C · CUXTOMCANDYCLUB LLC · Private — Your Eyes Only</p>
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
                  className="w-full mt-2 min-h-[48px] rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
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
              className={`flex items-center gap-2 px-4 min-h-[48px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                <button onClick={() => setTab("missions")} className="text-[10px] text-white/25 hover:text-white/50 min-h-[48px] px-2">View all →</button>
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
                <button onClick={() => setTab("alerts")} className="text-[10px] text-white/25 hover:text-white/50 min-h-[48px] px-2">View all →</button>
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
                    <span className="text-[10px] text-emerald-400 font-bold">RAC3C — Full Access</span>
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

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-white">Hardened Infrastructure</p>
                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full ${hardenedData?.status === "ARMED" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {hardenedData?.status ?? "LOADING"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
                <div className="p-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-2">State Hardener</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Domains</span>
                      <span className="text-red-400 font-bold">{hardenedData?.layers?.stateHardener?.domains ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">States</span>
                      <span className="text-white/50 font-bold">{hardenedData?.layers?.stateHardener?.totalStates ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Transitions</span>
                      <span className="text-white/50 font-bold">{hardenedData?.layers?.stateHardener?.totalTransitions ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Michelin Demand</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Friction Types</span>
                      <span className="text-orange-400 font-bold">{hardenedData?.layers?.michelinDemand?.frictionEventTypes ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Demand Tiers</span>
                      <span className="text-white/50 font-bold">{hardenedData?.layers?.michelinDemand?.demandTiers ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Distribution Hubs</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Node Tiers</span>
                      <span className="text-cyan-400 font-bold">{hardenedData?.layers?.distributionHub?.tiers ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Hub Categories</span>
                      <span className="text-white/50 font-bold">{hardenedData?.layers?.distributionHub?.categories ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Idempotency Guard</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Cached</span>
                      <span className="text-violet-400 font-bold">{hardenedData?.layers?.idempotencyGuard?.cachedResponses ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Locks Active</span>
                      <span className="text-white/50 font-bold">{hardenedData?.layers?.idempotencyGuard?.pendingLocks ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-pink-500/15 bg-pink-500/[0.02] overflow-hidden">
              <div className="p-4 border-b border-pink-500/10 flex items-center gap-2">
                <Brain className="w-4 h-4 text-pink-400" />
                <p className="text-sm font-semibold text-white">Intelligence Singularity</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">SELF-LEARNING</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-3.5 h-3.5 text-pink-400" />
                    <p className="text-[10px] text-pink-400/60 uppercase tracking-wider font-bold">Self-Learning Feedback Loop</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Corrections Captured</span>
                      <span className="text-pink-400 font-bold">{learningData?.totalCorrections ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Learning Insights</span>
                      <span className="text-white/50 font-bold">{learningData?.totalInsights ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Network Learning Score</span>
                      <span className="text-emerald-400 font-bold">{learningData?.networkLearningScore ?? 0}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Agent Profiles</span>
                      <span className="text-white/50 font-bold">{learningData?.agentProfiles?.length ?? 0}</span>
                    </div>
                  </div>
                  {learningData?.agentProfiles?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {learningData.agentProfiles.slice(0, 4).map((ap: any) => (
                        <div key={ap.agentId} className="flex items-center justify-between text-[9px] py-0.5">
                          <span className="text-white/25">{ap.agentId}</span>
                          <span className={`font-bold ${ap.maturityLevel === "MASTER" ? "text-yellow-400" : ap.maturityLevel === "EXPERT" ? "text-emerald-400" : ap.maturityLevel === "COMPETENT" ? "text-cyan-400" : "text-white/30"}`}>{ap.maturityLevel}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-[10px] text-amber-400/60 uppercase tracking-wider font-bold">Next Best Action Engine</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Actions Generated</span>
                      <span className="text-amber-400 font-bold">{nbaData?.totalActionsGenerated ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Actions Accepted</span>
                      <span className="text-white/50 font-bold">{nbaData?.totalActionsAccepted ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Acceptance Rate</span>
                      <span className="text-emerald-400 font-bold">{nbaData?.acceptanceRate ?? 0}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Active Rules</span>
                      <span className="text-white/50 font-bold">{nbaData?.activeRules ?? 0}</span>
                    </div>
                  </div>
                  {nbaData?.actionCategories && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {nbaData.actionCategories.map((cat: string) => (
                        <span key={cat} className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/60">{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.02] overflow-hidden">
              <div className="p-4 border-b border-cyan-500/10 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-semibold text-white">Sovereign Infrastructure Grid</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">5 SYSTEMS ARMED</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
                <div className="p-4">
                  <p className="text-[9px] text-cyan-400/50 uppercase tracking-wider mb-2">Service Mesh</p>
                  <p className="text-[9px] text-white/15 mb-2">Kubernetes-equivalent</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Services</span>
                      <span className="text-cyan-400 font-bold">{infraMeshData?.cluster?.totalServices ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Healthy</span>
                      <span className="text-emerald-400 font-bold">{infraMeshData?.cluster?.healthyServices ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Replicas</span>
                      <span className="text-white/50 font-bold">{infraMeshData?.cluster?.totalReplicas ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Avg CPU</span>
                      <span className="text-white/50 font-bold">{infraMeshData?.cluster?.totalCPU ? `${infraMeshData.cluster.totalCPU.toFixed(1)}%` : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[9px] text-violet-400/50 uppercase tracking-wider mb-2">Metrics Engine</p>
                  <p className="text-[9px] text-white/15 mb-2">Prometheus+Grafana</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Requests</span>
                      <span className="text-violet-400 font-bold">{infraMetricsData?.summary?.totalRequests?.toLocaleString() ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Req/s</span>
                      <span className="text-white/50 font-bold">{infraMetricsData?.summary?.requestRate ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">P95 Latency</span>
                      <span className="text-white/50 font-bold">{infraMetricsData?.summary?.p95Latency ? `${infraMetricsData.summary.p95Latency}ms` : "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Error Rate</span>
                      <span className={`font-bold ${(infraMetricsData?.summary?.errorRate ?? 0) > 5 ? "text-red-400" : "text-emerald-400"}`}>{infraMetricsData?.summary?.errorRate ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[9px] text-amber-400/50 uppercase tracking-wider mb-2">Log Aggregator</p>
                  <p className="text-[9px] text-white/15 mb-2">ELK Stack-equivalent</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Total Logs</span>
                      <span className="text-amber-400 font-bold">{infraLogsData?.totalLogs?.toLocaleString() ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Logs/min</span>
                      <span className="text-white/50 font-bold">{infraLogsData?.aggregation?.logsPerMinute ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Error Rate</span>
                      <span className={`font-bold ${(infraLogsData?.aggregation?.errorRate ?? 0) > 5 ? "text-red-400" : "text-emerald-400"}`}>{infraLogsData?.aggregation?.errorRate ?? 0}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Services</span>
                      <span className="text-white/50 font-bold">{infraLogsData?.services?.length ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[9px] text-emerald-400/50 uppercase tracking-wider mb-2">Object Vault</p>
                  <p className="text-[9px] text-white/15 mb-2">S3+CloudFront</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Objects</span>
                      <span className="text-emerald-400 font-bold">{infraVaultData?.storage?.totalObjects ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Storage</span>
                      <span className="text-white/50 font-bold">{infraVaultData?.storage?.totalSizeFormatted ?? "0 B"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Buckets</span>
                      <span className="text-white/50 font-bold">{infraVaultData?.storage?.bucketCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Cache Hit</span>
                      <span className="text-white/50 font-bold">{infraVaultData?.storage?.cacheHitRate ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[9px] text-pink-400/50 uppercase tracking-wider mb-2">CI/CD Pipeline</p>
                  <p className="text-[9px] text-white/15 mb-2">GitHub Actions</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Status</span>
                      <span className={`font-bold ${infraPipelineData?.status === "ARMED" ? "text-emerald-400" : "text-amber-400"}`}>{infraPipelineData?.status ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Total Runs</span>
                      <span className="text-pink-400 font-bold">{infraPipelineData?.totalRuns ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Pass Rate</span>
                      <span className="text-white/50 font-bold">{infraPipelineData?.passRate ?? 0}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30">Stages</span>
                      <span className="text-white/50 font-bold">{infraPipelineData?.stages?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {infraMeshData?.services && infraMeshData.services.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="p-4 border-b border-white/6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm font-semibold text-white">Service Mesh — Live Cluster</p>
                  <span className="ml-auto text-[9px] text-white/30">{infraMeshData.services.length} services</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left p-3 text-white/20 font-medium">Service</th>
                        <th className="text-center p-3 text-white/20 font-medium">Status</th>
                        <th className="text-center p-3 text-white/20 font-medium">Replicas</th>
                        <th className="text-center p-3 text-white/20 font-medium">CPU</th>
                        <th className="text-center p-3 text-white/20 font-medium">Memory</th>
                        <th className="text-center p-3 text-white/20 font-medium">RPS</th>
                        <th className="text-center p-3 text-white/20 font-medium">Circuit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {infraMeshData.services.map((svc: any) => (
                        <tr key={svc.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="p-3 text-white/60 font-medium">{svc.name}</td>
                          <td className="p-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              svc.status === "RUNNING" ? "bg-emerald-500/20 text-emerald-400" :
                              svc.status === "DEGRADED" ? "bg-amber-500/20 text-amber-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>{svc.status}</span>
                          </td>
                          <td className="p-3 text-center text-white/50">{svc.replicas}</td>
                          <td className="p-3 text-center">
                            <span className={svc.cpu > 80 ? "text-red-400" : svc.cpu > 50 ? "text-amber-400" : "text-emerald-400"}>{svc.cpu}%</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={svc.memory > 80 ? "text-red-400" : svc.memory > 50 ? "text-amber-400" : "text-emerald-400"}>{svc.memory}%</span>
                          </td>
                          <td className="p-3 text-center text-white/50">{svc.rps}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[8px] font-bold ${svc.circuitBreaker === "CLOSED" ? "text-emerald-400" : svc.circuitBreaker === "HALF_OPEN" ? "text-amber-400" : "text-red-400"}`}>{svc.circuitBreaker}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {infraPipelineData?.deploymentChecks && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="p-4 border-b border-white/6 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Deployment Readiness</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {infraPipelineData.deploymentChecks.map((check: any) => (
                    <div key={check.name} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${check.status === "PASS" ? "bg-emerald-400" : check.status === "WARN" ? "bg-amber-400" : "bg-red-400"}`} />
                      <div>
                        <p className="text-[10px] text-white/60 font-medium">{check.name}</p>
                        <p className="text-[9px] text-white/25 mt-0.5">{check.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <p className="text-[10px] font-black text-amber-400/60 tracking-wider">SOVEREIGN INTELLIGENCE SINGULARITY</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                The Intelligence Singularity transforms 3C ONYX from a platform into a Living Organism.
                The Self-Learning Feedback Loop captures every operator override as a correction event — when a human
                overrides the AI, the system logs it, detects patterns, adjusts confidence thresholds, and optimizes
                agent behavior. Each agent matures from INFANT → LEARNING → COMPETENT → EXPERT → MASTER.
                The Next Best Action Engine eliminates operator guesswork — 11 action rules across 11 categories
                analyze deal state, engagement temperature, objections, and timing to suggest the exact next move
                with a confidence score and a suggested response. Zero-Blindness Execution: take someone off the street,
                give them the HUD, and they perform like a 10-year veteran in 5 minutes.
                The Sovereign Infrastructure Grid provides Kubernetes, Prometheus, ELK, S3, and CI/CD — all native,
                zero external dependencies, portable to any cloud on day one.
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

        {tab === "c-suite" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#C9A85D]/20 bg-[#C9A85D]/[0.03] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#C9A85D]/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#C9A85D]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">C-Suite AI Agent Engine</p>
                  <p className="text-[9px] text-white/30">7 Executive AI Agents — Autonomous Company Operations</p>
                </div>
                <span className="ml-auto text-[9px] font-black px-2.5 py-1 rounded-full bg-[#C9A85D]/20 text-[#C9A85D]">
                  {cSuiteData?.status || "LOADING"}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "TOTAL DIRECTIVES", value: cSuiteData?.totalDirectivesIssued ?? 0, color: "#C9A85D" },
                  { label: "ACCEPTED", value: cSuiteData?.totalDirectivesAccepted ?? 0, color: "#10B981" },
                  { label: "ACCEPTANCE RATE", value: `${cSuiteData?.overallAcceptanceRate ?? 100}%`, color: "#10B981" },
                  { label: "ACTIVE RULES", value: cSuiteData?.activeRules ?? 0, color: "#fff" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-[9px] text-white/25 font-bold tracking-wider mb-1">{s.label}</div>
                    <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(cSuiteData?.agents || []).map((agent: any) => (
                <div
                  key={agent.id}
                  className="rounded-xl border bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                  style={{ borderColor: `${agent.color}22` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                      style={{ backgroundColor: `${agent.color}30` }}
                    >
                      {agent.id === "ceo" ? "👔" : agent.id === "cto" ? "⚡" : agent.id === "cfo" ? "💰" : agent.id === "coo" ? "⚙️" : agent.id === "content-social" ? "📱" : agent.id === "business-dev" ? "🚀" : "⚖️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{agent.name}</p>
                      <p className="text-[8px] text-white/25 truncate">{agent.title}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Maturity</span>
                      <span className={`font-bold ${
                        agent.maturity === "SOVEREIGN" ? "text-[#C9A85D]" :
                        agent.maturity === "AUTONOMOUS" ? "text-emerald-400" :
                        agent.maturity === "CALIBRATED" ? "text-cyan-400" :
                        agent.maturity === "LEARNING" ? "text-amber-400" :
                        "text-white/30"
                      }`}>{agent.maturity}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Directives</span>
                      <span className="text-white/50 font-bold">{agent.totalDirectives}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Acceptance</span>
                      <span className="text-emerald-400 font-bold">{agent.acceptanceRate}%</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Calibration</span>
                      <span className="text-white/40 font-bold">{agent.confidenceCalibration}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2">
                    <p className="text-[8px] text-white/20 font-bold tracking-wider mb-1">KPIs</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.kpis?.slice(0, 3).map((kpi: string) => (
                        <span
                          key={kpi}
                          className="text-[7px] px-1 py-0.5 rounded"
                          style={{ backgroundColor: `${agent.color}15`, color: `${agent.color}AA` }}
                        >{kpi}</span>
                      ))}
                    </div>
                  </div>

                  {agent.recentDirectives?.length > 0 && (
                    <div className="border-t border-white/5 pt-2 mt-2">
                      <p className="text-[8px] text-white/20 font-bold tracking-wider mb-1">LATEST DIRECTIVE</p>
                      <p className="text-[9px] text-white/40 leading-relaxed line-clamp-2">{agent.recentDirectives[0]?.directive}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[7px] font-black px-1 py-0.5 rounded ${
                          agent.recentDirectives[0]?.urgency === "SOVEREIGN" ? "bg-[#C9A85D]/20 text-[#C9A85D]" :
                          agent.recentDirectives[0]?.urgency === "CRITICAL" ? "bg-red-500/20 text-red-400" :
                          agent.recentDirectives[0]?.urgency === "HIGH" ? "bg-amber-500/20 text-amber-400" :
                          "bg-white/10 text-white/30"
                        }`}>{agent.recentDirectives[0]?.urgency}</span>
                        <span className="text-[7px] text-white/20">{(agent.recentDirectives[0]?.confidence * 100).toFixed(0)}% confidence</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#C9A85D]/10 bg-[#C9A85D]/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#C9A85D]" />
                <p className="text-[10px] font-black text-[#C9A85D]/60 tracking-wider">AUTONOMOUS C-SUITE PROTOCOL</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                The C-Suite AI Agent Engine replaces the need for a full executive team.
                7 autonomous agents — CEO (SOVEREIGN-1), CTO (ARCHITECT-1), CFO (TREASURY-1),
                COO (OPERATIONS-1), Content Director (SIGNAL-1), BD Director (EXPANSION-1),
                and Legal Officer (GUARDIAN-1) — each with their own decision rules,
                confidence scoring, urgency levels, and self-learning integration.
                Every directive is architect-sealed, every override feeds back into the
                Self-Learning Engine. The system matures from INITIALIZING to SOVEREIGN
                as it accumulates operational intelligence. Bootstrap to billion nodes
                with under 10 people — the AI runs the company.
              </p>
            </div>
          </div>
        )}

        {tab === "fintech" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                <p className="text-[10px] text-emerald-400/60 font-bold tracking-wider mb-1">VALIDATIONS</p>
                <p className="text-xl font-black text-emerald-400">{fintechData?.totalValidations ?? 0}</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                <p className="text-[10px] text-red-400/60 font-bold tracking-wider mb-1">BLOCKED</p>
                <p className="text-xl font-black text-red-400">{fintechData?.totalBlocked ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#C9A85D]/20 bg-[#C9A85D]/5 p-3 text-center">
                <p className="text-[10px] text-[#C9A85D]/60 font-bold tracking-wider mb-1">RELEASED</p>
                <p className="text-xl font-black text-[#C9A85D]">{fintechData?.totalReleased ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#FF2D9A]/20 bg-[#FF2D9A]/5 p-3 text-center">
                <p className="text-[10px] text-[#FF2D9A]/60 font-bold tracking-wider mb-1">HELD USD</p>
                <p className="text-xl font-black text-[#FF2D9A]">${fintechData?.totalHeldAmountUsd?.toFixed(2) ?? "0.00"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/10 bg-[#0A0A0F] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-bold text-white">Payout Enforcement</p>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-black text-emerald-400 tracking-wider">
                  {fintechData?.status ?? "ARMED"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Allowed Methods</span>
                  <span className="text-emerald-400 font-mono text-[10px]">
                    {(fintechData?.allowedPayoutMethods ?? []).join(" · ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Block Rate</span>
                  <span className="text-white font-mono">{fintechData?.blockRate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/40">Held Earnings</span>
                  <span className="text-[#FF2D9A] font-mono">{fintechData?.totalHeldEarnings ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/10 bg-[#0A0A0F] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-red-400" />
                <p className="text-sm font-bold text-white">Forbidden Patterns</p>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {(fintechData?.forbiddenPatterns ?? []).map((p: string) => (
                  <div key={p} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-[10px] font-mono text-red-300">{p}</span>
                    <span className="ml-auto text-[9px] text-red-400/60 font-bold">BLOCKED</span>
                  </div>
                ))}
              </div>
            </div>

            {fintechData?.heldByReason && Object.keys(fintechData.heldByReason).length > 0 && (
              <div className="rounded-xl border border-[#C9A85D]/10 bg-[#0A0A0F] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#C9A85D]" />
                  <p className="text-sm font-bold text-white">Held by Reason</p>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(fintechData.heldByReason).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#C9A85D]/5 border border-[#C9A85D]/10">
                      <span className="text-[10px] font-mono text-[#C9A85D]">{reason}</span>
                      <span className="text-[11px] font-bold text-white">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fintechData?.recentAudit && fintechData.recentAudit.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-[#0A0A0F] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-white/40" />
                  <p className="text-sm font-bold text-white">Audit Trail</p>
                </div>
                <div className="space-y-1">
                  {fintechData.recentAudit.slice(0, 10).map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/[0.02]">
                      <span className="text-[9px] text-white/20 font-mono w-20 shrink-0">{new Date(a.ts).toLocaleTimeString()}</span>
                      <span className="text-[10px] text-white/50 font-mono">{a.action}</span>
                      <span className={`ml-auto text-[9px] font-bold ${a.result === "APPROVED" ? "text-emerald-400" : a.result.includes("CONNECT") || a.result.includes("KYC") ? "text-[#FF2D9A]" : "text-white/40"}`}>
                        {a.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#C9A85D]/10 bg-[#C9A85D]/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#C9A85D]" />
                <p className="text-[10px] font-black text-[#C9A85D]/60 tracking-wider">FINTECH COMPLIANCE MANDATE</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                ALL money movement is 100% compliant, authorized, traceable, and scalable.
                Payouts flow exclusively through Stripe Connect — raw bank transfers, Plaid payouts,
                and unverified account distributions are permanently blocked at the code level.
                When a participant earns but hasn't connected their Stripe account, funds are held
                in the platform with an "Earnings Ready" notification and one-tap onboarding.
                Every transaction carries a SHA-256 proof hash. Every payout attempt is validated
                against KYC status, connected account verification, and fraud scoring before execution.
                Connect once → automate forever.
              </p>
            </div>
          </div>
        )}

        {/* ── BOOK DOCTRINE TAB (Live Data from C-Suite Engine) ──── */}
        {tab === "book-doctrine" && (() => {
          const DOCTRINE_BOOK_MAP: Record<string, { book: string; icon: string }> = {
            "blitzscale":          { book: "Blitzscaling — Reid Hoffman",               icon: "🚀" },
            "lean-startup":        { book: "The Lean Startup — Eric Ries",              icon: "🔬" },
            "greatest-salesman":   { book: "Greatest Salesman — Og Mandino",            icon: "📜" },
            "trillion-coach":      { book: "Trillion Dollar Coach — Schmidt/Eagle",     icon: "🏆" },
            "twelve-week":         { book: "The 12 Week Year — Moran/Lennington",       icon: "⏱️" },
            "katamari":            { book: "Katamari Philosophy — Compound Growth",     icon: "🔮" },
            "intelligent-investor":{ book: "The Intelligent Investor — Ben Graham",     icon: "📊" },
            "blue-ocean":          { book: "Blue Ocean Strategy — Kim/Mauborgne",       icon: "🌊" },
            "art-of-war":          { book: "The Art of War — Sun Tzu",                  icon: "⚔️" },
            "rich-dad":            { book: "Rich Dad Poor Dad — Kiyosaki",              icon: "💎" },
            "think-grow-rich":     { book: "Think and Grow Rich — Napoleon Hill",       icon: "🔥" },
          };
          const CSUITE_IDS = ["ceo","cto","cfo","coo","content-social","business-dev","legal-compliance"];
          const liveAgents: AgentStatusEntry[] = agentStatusData?.agents || [];
          const doctrineAgents = liveAgents.filter((a) => !CSUITE_IDS.includes(a.id));
          const totalDirectives = doctrineAgents.reduce((s, a) => s + (a.totalDirectives || 0), 0);
          const avgAcceptance = doctrineAgents.length > 0 ? doctrineAgents.reduce((s, a) => s + (a.acceptanceRate || 0), 0) / doctrineAgents.length : 0;

          return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#FF8F00]/20 bg-[#FF8F00]/[0.03] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FF8F00]/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#FF8F00]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Book Doctrine AI Engine</p>
                  <p className="text-[9px] text-white/30">{doctrineAgents.length} Doctrine Agents — Live from Sovereign Mesh</p>
                </div>
                <span className="ml-auto text-[9px] font-black px-2.5 py-1 rounded-full bg-[#FF8F00]/20 text-[#FF8F00]">{agentStatusData?.status || "LOADING"}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <p className="text-lg font-black text-[#FF8F00]">{doctrineAgents.length}</p>
                  <p className="text-[8px] text-white/25">Doctrine Agents</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <p className="text-lg font-black text-emerald-400">{totalDirectives}</p>
                  <p className="text-[8px] text-white/25">Directives Issued</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                  <p className="text-lg font-black text-cyan-400">{avgAcceptance.toFixed(0)}%</p>
                  <p className="text-[8px] text-white/25">Avg Acceptance</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctrineAgents.map((agent) => {
                const bookInfo = DOCTRINE_BOOK_MAP[agent.id] || { book: agent.domain, icon: "📖" };
                const healthColor = agent.maturity === "AUTONOMOUS" ? "#4CAF50" : agent.maturity === "SCALING" ? "#00BCD4" : agent.maturity === "CALIBRATING" ? "#FF9800" : "#FFD700";
                const responsibilities = agent.responsibilities || [];
                const recentDirectives = agent.recentDirectives || [];
                return (
                <div
                  key={agent.id}
                  className="rounded-xl border bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
                  style={{ borderColor: `${healthColor}22` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${healthColor}20` }}
                    >
                      {bookInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{agent.name}</p>
                      <p className="text-[8px] text-white/25 truncate">{agent.title}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: healthColor }} />
                      <span className="text-[7px] font-bold" style={{ color: healthColor }}>{agent.maturity}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Domain</span>
                      <span className="text-white/50 font-medium text-right truncate ml-2" style={{ maxWidth: "60%" }}>{agent.domain}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Source</span>
                      <span className="font-bold truncate ml-2 text-right" style={{ color: healthColor, maxWidth: "65%" }}>{bookInfo.book}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Directives</span>
                      <span className="font-bold text-white/60">{agent.totalDirectives || 0}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Acceptance</span>
                      <span className="font-bold text-emerald-400">{(agent.acceptanceRate || 0).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/25">Status</span>
                      <span className="font-bold" style={{ color: healthColor }}>{agent.status}</span>
                    </div>
                  </div>

                  {responsibilities.length > 0 && (
                    <div className="border-t border-white/5 pt-2 mb-2">
                      <p className="text-[8px] text-white/20 font-bold tracking-wider mb-1">PHILOSOPHY</p>
                      <ul className="space-y-0.5">
                        {responsibilities.map((r: string, i: number) => (
                          <li key={i} className="text-[9px] text-white/40 leading-tight flex items-start gap-1">
                            <span className="text-[7px] mt-0.5" style={{ color: healthColor }}>&#9670;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recentDirectives.length > 0 && (
                    <div className="border-t border-white/5 pt-2 mb-2">
                      <p className="text-[8px] text-white/20 font-bold tracking-wider mb-1">RECENT DIRECTIVES</p>
                      <div className="space-y-1">
                        {recentDirectives.map((d: AgentDirective) => (
                          <div key={d.id} className="rounded px-1.5 py-1 bg-white/[0.02]">
                            <p className="text-[8px] text-white/50 leading-tight">{d.directive}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[7px] font-bold" style={{ color: d.urgency === "high" ? "#FF2D9A" : d.urgency === "medium" ? "#FF9800" : "#4CAF50" }}>
                                {d.urgency.toUpperCase()}
                              </span>
                              <span className="text-[7px] text-white/20">{d.category}</span>
                              <span className="text-[7px] text-white/15">{Math.round(d.confidence * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-2">
                    <p className="text-[8px] text-white/20 font-bold tracking-wider mb-1">KPIs</p>
                    <div className="flex flex-wrap gap-1">
                      {(agent.kpis || []).map((kpi: string) => (
                        <span
                          key={kpi}
                          className="text-[7px] px-1 py-0.5 rounded"
                          style={{ backgroundColor: `${healthColor}15`, color: `${healthColor}AA` }}
                        >{kpi}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF8F00]" />
                <p className="text-sm font-semibold text-white">18-Agent Sovereign Mesh — Live Health</p>
                <span className="ml-auto text-[9px] text-white/25">{agentStatusData?.totalAgents || 0} agents · {agentStatusData?.activeRules || 0} rules</span>
              </div>

              <div className="p-3 border-b border-white/5 flex items-center gap-4 text-[9px]">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4CAF50]" /><span className="text-white/40">Healthy</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF9800]" /><span className="text-white/40">Initializing</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F44336]" /><span className="text-white/40">Degraded</span></div>
              </div>

              <div className="divide-y divide-white/5">
                {liveAgents.map((a: any) => {
                  const healthColor = a.totalDirectives > 0 ? "#4CAF50" : a.maturity === "INITIALIZING" ? "#FF9800" : a.acceptanceRate < 50 ? "#F44336" : "#4CAF50";
                  const healthLabel = a.totalDirectives > 0 ? "HEALTHY" : a.maturity === "INITIALIZING" ? "INITIALIZING" : a.acceptanceRate < 50 ? "DEGRADED" : "HEALTHY";
                  const lastRunAgo = a.lastActive ? Math.round((Date.now() - a.lastActive) / 1000) : null;
                  const lastRunLabel = lastRunAgo === null ? "Never" : lastRunAgo < 60 ? `${lastRunAgo}s ago` : lastRunAgo < 3600 ? `${Math.round(lastRunAgo/60)}m ago` : `${Math.round(lastRunAgo/3600)}h ago`;
                  const delegatesTo = CSUITE_IDS.includes(a.id) ? "Sovereign" : a.id === "blitzscale" || a.id === "art-of-war" ? "CEO → Sovereign" : a.id === "lean-startup" ? "CTO → Sovereign" : a.id === "intelligent-investor" ? "CFO → Sovereign" : "COO → Sovereign";

                  return (
                  <div key={a.name} className="flex items-center gap-3 px-4 min-h-[48px]">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}40` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{a.name}</p>
                    </div>
                    <div className="hidden sm:block text-[8px] text-white/20 w-24 truncate">{a.domain?.split(" ").slice(0,2).join(" ") || "—"}</div>
                    <div className="text-[8px] text-white/25 w-20 text-center">{delegatesTo}</div>
                    <div className="text-[8px] text-white/30 font-mono w-12 text-center">{a.totalDirectives || 0}</div>
                    <div className="text-[8px] text-white/20 w-14 text-right">{lastRunLabel}</div>
                    <div className="text-[7px] font-bold w-16 text-right" style={{ color: healthColor }}>{healthLabel}</div>
                  </div>
                )})}
              </div>
            </div>

            <div className="rounded-xl border border-[#FF8F00]/10 bg-[#FF8F00]/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#FF8F00]" />
                <p className="text-[10px] font-black text-[#FF8F00]/60 tracking-wider">BOOK DOCTRINE PROTOCOL</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                The Book Doctrine layer encodes the core strategic frameworks from 11 foundational texts into autonomous AI agents.
                Each agent continuously analyzes platform context and issues directives aligned with its source material —
                from Reid Hoffman's Blitzscaling velocity to Sun Tzu's competitive terrain mastery.
                Combined with the 7 C-Suite executive agents, the full 18-Agent Sovereign Mesh operates
                as a self-learning, self-correcting autonomous company. Every directive is architect-sealed.
                Every override feeds back into the Self-Learning Engine.
                RAC3C doesn't just read these books — ONYX runs on them.
              </p>
            </div>
          </div>
        );})()}

        {/* ── SUCCESS STORIES TAB ───────────────────────────────────── */}
        {tab === "success-stories" && (() => {
          const allStories: SuccessStoryCard[] = successStoriesData?.stories ?? [];
          const searchLower = storySearch.toLowerCase();
          const filteredStories = searchLower
            ? allStories.filter((s) =>
                (s.displayName || "").toLowerCase().includes(searchLower) ||
                (s.currentRole || "").toLowerCase().includes(searchLower) ||
                (s.location || "").toLowerCase().includes(searchLower) ||
                (s.headline || "").toLowerCase().includes(searchLower) ||
                (s.previousJob || "").toLowerCase().includes(searchLower)
              )
            : allStories;
          return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "TOTAL STORIES",  value: successStatsData?.totalStories ?? 0,                                    color: "#C9A85D" },
                { label: "TOTAL EARNED",   value: `$${((successStatsData?.totalEarnings ?? 0) / 1000).toFixed(0)}K`,       color: "#10B981" },
                { label: "AVG MONTHLY",    value: `$${(successStatsData?.avgMonthly ?? 0).toLocaleString()}`,              color: "#FF2D9A" },
                { label: "TOTAL DEALS",    value: successStatsData?.totalDeals ?? 0,                                       color: "#fff"    },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                  <p className="text-[9px] font-bold tracking-wider mb-1" style={{ color: `${s.color}99` }}>{s.label}</p>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search stories by name, role, location..."
                value={storySearch}
                onChange={(e) => setStorySearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#FF2D9A]/40 transition-colors"
              />
              {storySearch && (
                <button onClick={() => setStorySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredStories.length > 0 ? (
                filteredStories.map((story) => (
                  <div
                    key={story.id}
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-black"
                        style={{ background: "linear-gradient(135deg, #C9A227, #FF2D9A)", color: "#fff" }}
                      >
                        {(story.displayName || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-white truncate">{story.displayName}</p>
                          {story.isFeatured && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#C9A85D]/20 text-[#C9A85D]">FEATURED</span>
                          )}
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">{story.currentRole}</span>
                        </div>
                        <p className="text-[11px] text-white/35 mb-1">{story.headline}</p>
                        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-2">{story.story}</p>
                        <div className="flex items-center gap-4 text-[10px]">
                          <div>
                            <span className="text-white/20">Total </span>
                            <span className="text-emerald-400 font-bold">${(story.totalEarnings ?? 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-white/20">Monthly </span>
                            <span className="text-[#FF2D9A] font-bold">${(story.monthlyAvg ?? 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-white/20">Deals </span>
                            <span className="text-white font-bold">{story.dealsCompleted ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-white/20">Months </span>
                            <span className="text-violet-400 font-bold">{story.monthsOnPlatform ?? 0}</span>
                          </div>
                          {(story.referralChainDepth ?? 0) > 0 && (
                            <div>
                              <span className="text-white/20">Chain </span>
                              <span className="text-[#7B61FF] font-bold">{story.referralChainDepth} deep</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-8 text-center">
                  <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white/40 mb-1">No Success Stories Yet</p>
                  <p className="text-[11px] text-white/20">As members earn through the ONYX network, their stories will appear here.</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#C9A85D]/10 bg-[#C9A85D]/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#C9A85D]" />
                <p className="text-[10px] font-black text-[#C9A85D]/60 tracking-wider">SUCCESS STORIES PROTOCOL</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                Every success story is verified through the platform — real deals, real earnings, real people.
                From casual bird-dogs earning $1.8K–$6K/year to dedicated network builders pulling $100K–$300K+.
                These are blue-collar workers building wealth from their phones. No gatekeepers. No corporate ladder.
                Just results. ONYX makes the ordinary extraordinary.
              </p>
            </div>
          </div>
        );})()}

        {/* ── FOUNDER DASHBOARD TAB (Sovereign-only: userId 6) ─────── */}
        {tab === "founder-dashboard" && isSovereign && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#C9A85D]/30 bg-gradient-to-br from-[#C9A85D]/[0.06] to-transparent p-5">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)" }}
                >
                  <Shield className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-lg font-black text-white tracking-wide">SOVEREIGN HQ</p>
                  <p className="text-[10px] text-[#C9A85D]/60">RAC3C · userId 6 · CUXTOMCANDYCLUB LLC · Sole Sovereign Operator</p>
                </div>
                <span className="ml-auto text-[9px] font-black px-3 py-1.5 rounded-full bg-[#C9A85D]/20 text-[#C9A85D] border border-[#C9A85D]/30">
                  SOVEREIGN ACCESS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: "NETWORK NODES",      value: pulse?.missions.active ?? 0,                                                                  icon: "🌐", color: "#C9A85D" },
                  { label: "PLATFORM GMV",        value: pulse ? fmt(pulse.revenue.weekGmv) : "—",                                                    icon: "💰", color: "#10B981" },
                  { label: "K-FACTOR",            value: pulse?.kFactor.current.toFixed(2) ?? "—",                                                    icon: "📈", color: "#FF2D9A" },
                  { label: "REV / NODE",          value: pulse && pulse.missions.active > 0 ? fmt(Math.round(pulse.revenue.weekGmv * 0.03 / pulse.missions.active)) : "—", icon: "⚡", color: "#7B61FF" },
                  { label: "KILL-SWITCH",         value: unresolvedFlagged.length,                                                                     icon: "🛡️", color: unresolvedFlagged.length > 0 ? "#EF4444" : "#10B981" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 min-h-[48px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{s.icon}</span>
                      <p className="text-[9px] text-white/25 font-bold tracking-wider">{s.label}</p>
                    </div>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#00E5FF]/15 bg-[#00E5FF]/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#00E5FF]" />
                <p className="text-sm font-semibold text-white">AI Execution Health</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">LIVE</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
                <div className="p-3 bg-[#0d0d10]">
                  <p className="text-[9px] text-white/25 font-bold tracking-wider mb-1">AGENTS ONLINE</p>
                  <p className="text-xl font-black text-[#4CAF50]">{agentStatusData?.totalAgents || 0}</p>
                  <p className="text-[8px] text-white/20">/ 18 target</p>
                </div>
                <div className="p-3 bg-[#0d0d10]">
                  <p className="text-[9px] text-white/25 font-bold tracking-wider mb-1">DIRECTIVE RULES</p>
                  <p className="text-xl font-black text-[#FF8F00]">{agentStatusData?.activeRules || 0}</p>
                  <p className="text-[8px] text-white/20">Active rules</p>
                </div>
                <div className="p-3 bg-[#0d0d10]">
                  <p className="text-[9px] text-white/25 font-bold tracking-wider mb-1">LOOP STATUS</p>
                  <p className="text-xl font-black text-[#4CAF50]">{agentStatusData?.status || "—"}</p>
                  <p className="text-[8px] text-white/20">Engine state</p>
                </div>
                <div className="p-3 bg-[#0d0d10]">
                  <p className="text-[9px] text-white/25 font-bold tracking-wider mb-1">ERROR RATE</p>
                  <p className="text-xl font-black text-[#4CAF50]">{pulse ? ((pulse.killSwitch.flaggedCount / Math.max(pulse.missions.active, 1)) * 100).toFixed(1) : "0.0"}%</p>
                  <p className="text-[8px] text-white/20">Platform errors</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF2D9A]" />
                <p className="text-sm font-semibold text-white">RAM-1500 Infotainment Command</p>
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FF2D9A]/20 text-[#FF2D9A]">BLUEPRINT DNA</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Uconnect 12\" Display",   detail: "Full platform control from the dashboard. Every ONYX function at your fingertips while driving.", color: "#FF2D9A" },
                    { label: "Voice Command Layer",      detail: "\"Hey ONYX, show me my network earnings.\" Natural language → platform action. Hands-free sovereignty.", color: "#7B61FF" },
                    { label: "V2X Telemetry Live",       detail: "Real-time vehicle health, location mesh, and Guardian AI overlay. The truck IS the command center.", color: "#00E5FF" },
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: f.color }}>{f.label}</p>
                      <p className="text-[11px] text-white/40 leading-relaxed">{f.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/20 leading-relaxed">
                  The RAM-1500 is not just a vehicle — it's the Sovereign's mobile command center.
                  The infotainment system runs ONYX natively, turning every drive into an operational session.
                  This is the blueprint for every vehicle in the network. The truck came first. The platform followed.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/6 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7B61FF]" />
                <p className="text-sm font-semibold text-white">Sovereign Transactional Grid</p>
                <span className="ml-auto text-[9px] text-white/25">3% Platform Commission · Every Transaction · Forever</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-[#C9A85D]/60 font-bold tracking-wider mb-2">INCOME TIERS</p>
                  {[
                    { tier: "Casual",          range: "$1.8K – $6K/yr",     desc: "Part-time bird-dogging. 2-5 referrals/month.", color: "#60A5FA" },
                    { tier: "Active",          range: "$8.4K – $21.6K/yr",  desc: "Consistent effort. 10-20 referrals/month.",     color: "#34D399" },
                    { tier: "Dedicated",       range: "$37K – $112K/yr",    desc: "Full commitment. Building sub-networks.",        color: "#FF2D9A" },
                    { tier: "Network Builder", range: "$100K – $300K+/yr",  desc: "Multi-tier dynasty. Passive income machine.",    color: "#C9A85D" },
                  ].map((t) => (
                    <div key={t.tier} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-[11px] font-bold" style={{ color: t.color }}>{t.tier}</p>
                        <p className="text-[9px] text-white/20">{t.desc}</p>
                      </div>
                      <p className="text-xs font-black text-white">{t.range}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-[#C9A85D]/60 font-bold tracking-wider mb-2">REVENUE STREAMS</p>
                  {[
                    { stream: "3% Global Tech Fee",       status: "ACTIVE",   desc: "Every transaction. Every vehicle type. Forever.",    color: "#C9A85D" },
                    { stream: "V2X Data Vault",           status: "BUILDING", desc: "Anonymized telemetry licensed to OEMs at scale.",    color: "#7B61FF" },
                    { stream: "White-Label API",          status: "PLANNED",  desc: "Dealerships, fleets, insurers plug into ONYX rail.", color: "#00E5FF" },
                    { stream: "Premium Subscriptions",    status: "ACTIVE",   desc: "Enhanced AI, priority concierge, advanced analytics.", color: "#FF2D9A" },
                  ].map((r) => (
                    <div key={r.stream} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-[11px] font-bold text-white">{r.stream}</p>
                        <p className="text-[9px] text-white/20">{r.desc}</p>
                      </div>
                      <span
                        className="text-[8px] font-black px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: r.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : r.status === "BUILDING" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                          color: r.status === "ACTIVE" ? "#10B981" : r.status === "BUILDING" ? "#FBBF24" : "rgba(255,255,255,0.3)",
                        }}
                      >{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#C9A85D]/15 bg-[#C9A85D]/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#C9A85D]" />
                <p className="text-[10px] font-black text-[#C9A85D]/60 tracking-wider">SOVEREIGN MANDATE</p>
              </div>
              <p className="text-[11px] text-white/40 leading-5">
                This dashboard exists for one person: RAC3C. UserId 6. The Sovereign Operator.
                Every metric, every agent, every directive flows through this single point of authority.
                The platform was designed to be run by under 10 people — because the AI runs the company.
                18 agents. 3% commission. Billion-node scale. From a RAM-1500 in Connecticut.
                The distance is invisible to the customer. ONYX acts; member confirms.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
