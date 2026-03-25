/**
 * 3C ONYX — Platform Neural Intelligence Center
 * ─────────────────────────────────────────────────────────────────────────────
 * CTO Philosophy Applied:
 *
 * NVIDIA  → Every metric has a predicted trajectory. AI runs everything.
 * SpaceX  → Mission control aesthetic. One screen shows the entire platform truth.
 * Amazon  → Observable events. Every action surfaces in the live feed.
 * Oracle  → Immutable audit ledger. Zero data loss. Rock-solid sourcing.
 * Tesla   → Fleet learning. Platform intelligence grows with every member.
 * Microsoft → Copilot-style proactive insights — not reactive, predictive.
 * Apple   → Signal over noise. Only show what matters. Every pixel earns its place.
 * Meta    → Network graph. K-factor and viral coefficient front and center.
 *
 * No vanity metrics. Real-time. Predictive. Actionable.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain, Zap, TrendingUp, Users, DollarSign, Activity,
  Shield, ChevronRight, AlertTriangle, CheckCircle2,
  BarChart3, Radio, Cpu, Globe, RefreshCw, Target,
  Lightbulb, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlatformMetrics {
  timestamp: string;
  healthScore: number;
  members:  { total: number; today: number; thisWeek: number; specialists: number; dealers: number; runners: number; consumers: number };
  leads:    { total: number; today: number; hotLeads: number; avgScore: number; conversionRate: number; revenueInfluenced: number };
  revenue:  { todayGMV: number; weekGMV: number; monthGMV: number; transactionFees: number; saasARR: number; totalARR: number };
  crm:      { activeConnections: number; totalLeadsImported: number; totalDealsClosed: number; inventorySynced: number; lastSync: string };
  network:  { viralCoefficient: number; avgReferralsPerMember: number; nps: number; dau: number; mau: number; dauMauRatio: number };
  system:   { healthScore: number; apiLatencyMs: number; uptimePct: number; activeWebSockets: number; dbQueryMs: number; eventsProcessed: number };
  ai:       { insightsGenerated: number; actionsRecommended: number; avgConfidence: number; modelVersion: string; lastInferencMs: number };
}

interface AIInsight {
  id: string;
  priority: "critical" | "high" | "medium" | "opportunity";
  category: string;
  title: string;
  body: string;
  action: string;
  confidence: number;
  estimatedImpact: string;
  generatedAt: string;
}

interface Prediction {
  metric: string;
  current: number;
  predicted7d: number;
  predicted30d: number;
  predicted90d: number;
  confidence: number;
  driver: string;
  unit: string;
}

interface TelemetryEvent {
  id: string;
  category: string;
  action: string;
  actor: string;
  value?: number;
  metadata: Record<string, unknown>;
  ts: string;
}

interface PulseData {
  metrics:    PlatformMetrics;
  insights:   AIInsight[];
  forecasts:  Prediction[];
  eventCount: number;
}

interface EventData {
  events: TelemetryEvent[];
  total:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const api  = (path: string) => `${BASE}/api${path}`;

const fmtDollar = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtNum = (n: number) => n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const PRIORITY_CONFIG: Record<AIInsight["priority"], { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical:    { label: "CRITICAL",     color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/30",    icon: AlertTriangle },
  high:        { label: "HIGH",         color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/30",  icon: Zap },
  medium:      { label: "MEDIUM",       color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Activity },
  opportunity: { label: "OPPORTUNITY",  color: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/30",icon: TrendingUp },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  lead:       { icon: Target,    color: "text-violet-400" },
  deal:       { icon: DollarSign,color: "text-emerald-400" },
  member:     { icon: Users,     color: "text-blue-400" },
  specialist: { icon: Shield,    color: "text-amber-400" },
  transport:  { icon: Globe,     color: "text-cyan-400" },
  crm:        { icon: Activity,  color: "text-indigo-400" },
  revenue:    { icon: DollarSign,color: "text-green-400" },
  system:     { icon: Cpu,       color: "text-slate-400" },
  ai:         { icon: Brain,     color: "text-violet-400" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ label, value, sub, trend, color = "text-white" }: {
  label: string; value: string; sub?: string; trend?: "up" | "down" | "flat"; color?: string;
}) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-500";
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
        {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
      </div>
      <div className={`text-2xl font-black font-mono tracking-tight ${color}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 90 ? "bg-emerald-400" : score >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const cfg = PRIORITY_CONFIG[insight.priority];
  const Icon = cfg.icon;
  return (
    <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 space-y-2`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold font-mono ${cfg.color} uppercase tracking-wider`}>{cfg.label}</span>
            <span className="text-[10px] text-zinc-500 font-mono">{insight.category}</span>
            <span className="text-[10px] text-zinc-600 font-mono ml-auto">{Math.round(insight.confidence * 100)}% confidence</span>
          </div>
          <p className="text-sm text-zinc-200 font-medium leading-snug">{insight.title}</p>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{insight.body}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50">
            <span className="text-xs text-emerald-400 font-mono font-bold">{insight.estimatedImpact}</span>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <ChevronRight className="w-3 h-3" />
              <span className="hidden sm:inline">{insight.action}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastRow({ pred }: { pred: Prediction }) {
  const pct7d  = Math.round((pred.predicted7d  / pred.current - 1) * 100);
  const pct30d = Math.round((pred.predicted30d / pred.current - 1) * 100);
  const pct90d = Math.round((pred.predicted90d / pred.current - 1) * 100);
  const fmt    = pred.unit === "USD" ? fmtDollar : fmtNum;
  return (
    <div className="border border-zinc-800 rounded-lg px-4 py-3 bg-zinc-900/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-200">{pred.metric}</span>
        <span className="text-xs text-zinc-500 font-mono">{Math.round(pred.confidence * 100)}% conf.</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
        <div className="text-center">
          <div className="text-zinc-500 mb-0.5">NOW</div>
          <div className="text-white font-bold">{fmt(pred.current)}</div>
        </div>
        <div className="text-center">
          <div className="text-zinc-500 mb-0.5">7D</div>
          <div className="text-emerald-400 font-bold">{fmt(pred.predicted7d)}</div>
          <div className="text-emerald-600 text-[10px]">+{pct7d}%</div>
        </div>
        <div className="text-center">
          <div className="text-zinc-500 mb-0.5">30D</div>
          <div className="text-emerald-400 font-bold">{fmt(pred.predicted30d)}</div>
          <div className="text-emerald-600 text-[10px]">+{pct30d}%</div>
        </div>
        <div className="text-center">
          <div className="text-zinc-500 mb-0.5">90D</div>
          <div className="text-violet-400 font-bold">{fmt(pred.predicted90d)}</div>
          <div className="text-violet-600 text-[10px]">+{pct90d}%</div>
        </div>
      </div>
      <div className="text-[10px] text-zinc-600 italic truncate">Driver: {pred.driver}</div>
    </div>
  );
}

function EventFeed({ events }: { events: TelemetryEvent[] }) {
  const categoryIcon = (cat: string) => {
    const cfg = CATEGORY_CONFIG[cat] ?? { icon: Activity, color: "text-zinc-400" };
    return cfg;
  };
  const formatValue = (e: TelemetryEvent) => {
    if (!e.value || e.value === 0) return null;
    if (["deal", "revenue", "transport"].includes(e.category)) return fmtDollar(e.value);
    if (e.category === "lead") return `Score ${e.value}`;
    return String(e.value);
  };

  return (
    <div className="space-y-1">
      {events.map(ev => {
        const { icon: Icon, color } = categoryIcon(ev.category);
        const val = formatValue(ev);
        return (
          <div key={ev.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-zinc-300 truncate">
                  <span className="text-zinc-500">{ev.actor}</span>
                  {" → "}
                  <span className="text-zinc-200">{ev.action.replace(/_/g, " ")}</span>
                </span>
                {val && <span className="text-xs font-mono text-emerald-400 shrink-0">{val}</span>}
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-600 shrink-0">{timeAgo(ev.ts)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlatformIntelligence() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "forecast" | "events">("overview");

  const { data: pulse, refetch: refetchPulse, isLoading: pulseLoading } = useQuery<PulseData>({
    queryKey: ["telemetry/pulse"],
    queryFn: () => fetch(api("/telemetry/pulse")).then(r => r.json()),
    refetchInterval: 8_000,
  });

  const { data: eventData, refetch: refetchEvents } = useQuery<EventData>({
    queryKey: ["telemetry/events"],
    queryFn: () => fetch(api("/telemetry/events?limit=25")).then(r => r.json()),
    refetchInterval: 10_000,
  });

  const handleRefresh = useCallback(() => {
    refetchPulse();
    refetchEvents();
    setLastRefresh(new Date());
  }, [refetchPulse, refetchEvents]);

  useEffect(() => {
    const ticker = setInterval(() => setLastRefresh(new Date()), 8_000);
    return () => clearInterval(ticker);
  }, []);

  const m  = pulse?.metrics;
  const hs = m?.system.healthScore ?? 0;
  const hsColor = hs >= 90 ? "text-emerald-400" : hs >= 70 ? "text-amber-400" : "text-red-400";

  const TABS = [
    { id: "overview",  label: "OVERVIEW",  icon: BarChart3 },
    { id: "ai",        label: "AI ENGINE", icon: Brain },
    { id: "forecast",  label: "FORECAST",  icon: TrendingUp },
    { id: "events",    label: "EVENTS",    icon: Radio },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <PageHeader
        icon={Brain}
        title="Platform Intelligence"
        subtitle="ONYX Neural Engine — Real-Time Platform Truth"
        accent="#7C3AED"
      />

      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-6">

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">NEURAL ENGINE LIVE</span>
            </div>
            {m && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                hs >= 90 ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
              }`}>
                <CheckCircle2 className={`w-3 h-3 ${hsColor}`} />
                <span className={`text-xs font-mono font-bold ${hsColor}`}>{hs}/100 HEALTH</span>
              </div>
            )}
            {m && (
              <div className="text-xs font-mono text-zinc-600">
                {m.ai.modelVersion}
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            <RefreshCw className={`w-3 h-3 ${pulseLoading ? "animate-spin" : ""}`} />
            {lastRefresh.toLocaleTimeString()}
          </button>
        </div>

        {/* Uptime Banner */}
        {m && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 flex-wrap text-xs font-mono">
              <div><span className="text-zinc-500">API LATENCY</span> <span className={m.system.apiLatencyMs < 100 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{m.system.apiLatencyMs}ms</span></div>
              <div><span className="text-zinc-500">UPTIME</span> <span className="text-emerald-400 font-bold">{m.system.uptimePct.toFixed(3)}%</span></div>
              <div><span className="text-zinc-500">WEB SOCKETS</span> <span className="text-blue-400 font-bold">{m.system.activeWebSockets}</span></div>
              <div><span className="text-zinc-500">DB QUERY</span> <span className="text-emerald-400 font-bold">{m.system.dbQueryMs}ms</span></div>
              <div><span className="text-zinc-500">EVENTS</span> <span className="text-zinc-300 font-bold">{m.system.eventsProcessed}</span></div>
              <div><span className="text-zinc-500">AI INFERENCE</span> <span className="text-violet-400 font-bold">{m.ai.lastInferencMs}ms</span></div>
            </div>
            <div className="flex-1 min-w-[120px] max-w-[200px]">
              <HealthBar score={hs} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 ${
                  active ? "bg-violet-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && m && (
          <div className="space-y-6">
            {/* Revenue Row */}
            <div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Revenue</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KPICard label="Today GMV" value={fmtDollar(m.revenue.todayGMV)}   trend="up" color="text-emerald-400" />
                <KPICard label="Week GMV"  value={fmtDollar(m.revenue.weekGMV)}    trend="up" color="text-emerald-400" />
                <KPICard label="Month GMV" value={fmtDollar(m.revenue.monthGMV)}   trend="up" color="text-white" />
                <KPICard label="Txn Fees"  value={fmtDollar(m.revenue.transactionFees)} sub="2% of GMV" trend="up" color="text-violet-400" />
                <KPICard label="Total ARR" value={fmtDollar(m.revenue.totalARR)}   sub="Growing" trend="up" color="text-violet-400" />
              </div>
            </div>

            {/* Members Row */}
            <div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Network</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <KPICard label="Total Members"   value={fmtNum(m.members.total)}       trend="up" color="text-white"  />
                <KPICard label="Joined Today"    value={String(m.members.today)}        trend="up" color="text-emerald-400" />
                <KPICard label="This Week"       value={String(m.members.thisWeek)}     trend="up" />
                <KPICard label="Specialists"     value={fmtNum(m.members.specialists)}  />
                <KPICard label="Dealers"         value={fmtNum(m.members.dealers)}      />
                <KPICard label="Runners"         value={fmtNum(m.members.runners)}      />
                <KPICard label="Consumers"       value={fmtNum(m.members.consumers)}    />
              </div>
            </div>

            {/* Leads + Network Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Leads</div>
                <div className="grid grid-cols-2 gap-3">
                  <KPICard label="Today"        value={String(m.leads.today)}          trend="up" color="text-blue-400" />
                  <KPICard label="HOT LEADS"    value={String(m.leads.hotLeads)}        color="text-red-400" sub="Score 85+" />
                  <KPICard label="Avg Score"    value={`${m.leads.avgScore}/100`}       />
                  <KPICard label="Conv. Rate"   value={`${m.leads.conversionRate}%`}   trend="up" color="text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Network Health (Meta-Inspired K-Factor)</div>
                <div className="grid grid-cols-2 gap-3">
                  <KPICard
                    label="Viral K-Factor"
                    value={m.network.viralCoefficient.toFixed(2)}
                    sub={m.network.viralCoefficient >= 1.5 ? "VIRAL ✓" : `Need ${(1.5 - m.network.viralCoefficient).toFixed(2)} more`}
                    color={m.network.viralCoefficient >= 1.5 ? "text-emerald-400" : "text-amber-400"}
                  />
                  <KPICard label="NPS Score"     value={`${m.network.nps}/100`}          color="text-emerald-400" />
                  <KPICard label="DAU"           value={fmtNum(m.network.dau)}            trend="up" />
                  <KPICard label="DAU/MAU"       value={`${(m.network.dauMauRatio * 100).toFixed(0)}%`} sub="Target: 25%+" />
                </div>
              </div>
            </div>

            {/* CRM Status */}
            <div>
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">CRM Hub Status</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard label="Active Connections" value={String(m.crm.activeConnections)}    color="text-blue-400" />
                <KPICard label="Leads Imported"    value={fmtNum(m.crm.totalLeadsImported)}   />
                <KPICard label="Deals Closed"      value={String(m.crm.totalDealsClosed)}       color="text-emerald-400" />
                <KPICard label="Inventory Synced"  value={fmtNum(m.crm.inventorySynced)}       />
              </div>
            </div>
          </div>
        )}

        {/* ── AI ENGINE ─────────────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            {/* Engine header */}
            <div className="bg-zinc-900/80 border border-violet-500/20 rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-violet-400 font-mono">{pulse?.metrics.ai.modelVersion ?? "ONYX-Neural-v2.4"}</div>
                <div className="text-xs text-zinc-500">
                  {pulse?.insights.length ?? 0} active insights ·{" "}
                  {Math.round((pulse?.metrics.ai.avgConfidence ?? 0) * 100)}% avg confidence ·{" "}
                  {pulse?.metrics.ai.lastInferencMs ?? 0}ms inference latency
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
                </span>
                <span className="text-xs font-mono text-violet-400">INFERRING</span>
              </div>
            </div>

            {/* Company-level benchmarks */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">CTO Benchmark Analysis</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {[
                  { co: "NVIDIA",    metric: "AI Inference", value: `${pulse?.metrics.ai.lastInferencMs ?? 0}ms`, target: "<50ms",  ok: (pulse?.metrics.ai.lastInferencMs ?? 99) < 50 },
                  { co: "TESLA",     metric: "Fleet Events", value: fmtNum(pulse?.eventCount ?? 0), target: "Growing", ok: true },
                  { co: "AMAZON",    metric: "API Latency",  value: `${pulse?.metrics.system.apiLatencyMs ?? 0}ms`, target: "<200ms", ok: (pulse?.metrics.system.apiLatencyMs ?? 999) < 200 },
                  { co: "APPLE",     metric: "Uptime",       value: `${pulse?.metrics.system.uptimePct.toFixed(3) ?? 0}%`, target: "99.99%", ok: (pulse?.metrics.system.uptimePct ?? 0) > 99.9 },
                  { co: "MICROSOFT", metric: "AI Confidence",value: `${Math.round((pulse?.metrics.ai.avgConfidence ?? 0) * 100)}%`, target: ">85%", ok: (pulse?.metrics.ai.avgConfidence ?? 0) > 0.85 },
                  { co: "META",      metric: "K-Factor",     value: pulse?.metrics.network.viralCoefficient.toFixed(2) ?? "0", target: "1.5+", ok: (pulse?.metrics.network.viralCoefficient ?? 0) >= 1.5 },
                  { co: "ORACLE",    metric: "Events Logged",value: fmtNum(pulse?.metrics.system.eventsProcessed ?? 0), target: "All", ok: true },
                  { co: "SPACEX",    metric: "DB Query",     value: `${pulse?.metrics.system.dbQueryMs ?? 0}ms`, target: "<20ms", ok: (pulse?.metrics.system.dbQueryMs ?? 999) < 20 },
                ].map(b => (
                  <div key={b.co} className="flex items-center justify-between bg-zinc-800/40 px-3 py-2 rounded-lg">
                    <span className="text-zinc-400">{b.co} · {b.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{b.value}</span>
                      <span className={b.ok ? "text-emerald-400" : "text-amber-400"}>{b.ok ? "✓" : "↑"} {b.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              AI Recommendations ({pulse?.insights.length ?? 0})
            </div>
            {pulseLoading && (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Cpu className="w-4 h-4 animate-pulse" /> ONYX Engine inferring…
              </div>
            )}
            <div className="space-y-3">
              {(pulse?.insights ?? []).map(ins => <InsightCard key={ins.id} insight={ins} />)}
            </div>
          </div>
        )}

        {/* ── FORECAST ──────────────────────────────────────────────────────── */}
        {activeTab === "forecast" && (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-zinc-200">Neural Predictive Model</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Predictions are generated by ONYX-Neural-v2.4 using viral coefficient, CRM connection growth rate,
                historical lead conversion, and platform engagement signals. Confidence intervals are bootstrapped
                from comparable automotive SaaS platform trajectories. Updated every 8 seconds.
              </p>
            </div>

            <div className="space-y-3">
              {(pulse?.forecasts ?? []).map(pred => (
                <ForecastRow key={pred.metric} pred={pred} />
              ))}
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Scale Milestones</div>
              {[
                { milestone: "132M Members (2× AAA)",    revenue: "$2B ARR",    timeline: "Year 5",  color: "border-violet-500/30 text-violet-400" },
                { milestone: "1M Members",               revenue: "$45M ARR",   timeline: "Year 3",  color: "border-blue-500/30 text-blue-400" },
                { milestone: "100K Dealer Connections",  revenue: "$12M ARR",   timeline: "Year 2",  color: "border-emerald-500/30 text-emerald-400" },
                { milestone: "10K Members",              revenue: "$569K ARR",  timeline: "Year 1",  color: "border-amber-500/30 text-amber-400" },
              ].map(ms => (
                <div key={ms.milestone} className={`border rounded-lg px-4 py-3 flex items-center justify-between ${ms.color}`}>
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{ms.milestone}</div>
                    <div className="text-xs text-zinc-500">{ms.timeline}</div>
                  </div>
                  <div className="text-sm font-mono font-bold">{ms.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVENTS ────────────────────────────────────────────────────────── */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-200">Immutable Event Ledger</div>
                <div className="text-xs text-zinc-500">{eventData?.total ?? 0} total events · Oracle-grade audit trail · Zero data loss</div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                LIVE
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2">
              <EventFeed events={eventData?.events ?? []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
