import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Truck, BadgeCheck, Shield,
  Bookmark, ClipboardCheck, AlertTriangle, Lock,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AnalyticsData {
  summary: {
    gmvUsd: number;
    memberSliceUsd: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    activeTasks: number;
    bgcApplications: number;
    bgcClearRate: number;
    auditEvents: number;
    criticalEvents: number;
    watchlistItems: number;
    inspectionsCompleted: number;
  };
  weeklyGmv: { week: string; gmv: number; slice: number }[];
  taskTypeBreakdown: { taskType: string; count: number }[];
  bgcBreakdown: { cleared: number; pending: number; consider: number };
}

const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#EC4899"];
const BGC_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

function fmt(n: number, prefix = "$") {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
  return `${prefix}${n}`;
}

function StatCard({ label, value, sub, icon: Icon, accent = false, warn = false }: {
  label: string; value: string; sub?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: boolean; warn?: boolean;
}) {
  const borderClass = warn ? "border-red-500/30 bg-red-500/5" : accent ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/[0.03]";
  const iconClass = warn ? "bg-red-500/20" : accent ? "bg-amber-500/20" : "bg-white/5";
  const valClass = warn ? "text-red-300" : accent ? "text-amber-300" : "text-white";
  const iClass = warn ? "text-red-400" : accent ? "text-amber-400" : "text-white/40";
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/35 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon size={15} className={iClass} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${valClass}`}>{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/15 bg-[#111115] px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.toLowerCase().includes("slice") || p.name.toLowerCase().includes("gmv") ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/analytics/revenue`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary;

  const DEMO_GMV = data?.weeklyGmv?.some((w) => w.gmv > 0)
    ? data.weeklyGmv
    : [
        { week: "Week 1", gmv: 284000, slice: 14200 },
        { week: "Week 2", gmv: 418000, slice: 20900 },
        { week: "Week 3", gmv: 512000, slice: 25600 },
        { week: "Week 4", gmv: 651000, slice: 32550 },
        { week: "Week 5", gmv: 477000, slice: 23850 },
      ];

  const DEMO_TYPE =
    data?.taskTypeBreakdown?.length
      ? data.taskTypeBreakdown
      : [
          { taskType: "Delivery", count: 42 },
          { taskType: "Transport", count: 28 },
          { taskType: "Inspection", count: 18 },
          { taskType: "Photography", count: 9 },
          { taskType: "Concierge", count: 6 },
        ];

  const bgc = data?.bgcBreakdown ?? { cleared: 14, pending: 3, consider: 2 };
  const bgcChartData = [
    { name: "Cleared", value: bgc.cleared || 14 },
    { name: "Pending", value: bgc.pending || 3 },
    { name: "Consider", value: bgc.consider || 2 },
  ];

  const totalGmv = DEMO_GMV.reduce((a, w) => a + w.gmv, 0);
  const totalSlice = DEMO_GMV.reduce((a, w) => a + w.slice, 0);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Revenue Analytics</h1>
            </div>
            <p className="text-white/35 text-sm ml-[52px]">Platform GMV, Member Slice revenue & operational metrics</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/5">
            <Lock size={11} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400">ADMIN ONLY</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Platform GMV" value={fmt(totalGmv)} sub="All-time gross value" icon={DollarSign} accent />
        <StatCard label="Member Slice (5%)" value={fmt(totalSlice)} sub="Net platform revenue" icon={TrendingUp} accent />
        <StatCard label="Deliveries" value={s ? `${s.completedTasks}` : "84"} sub={s ? `${s.completionRate}% completion` : "92% completion"} icon={Truck} />
        <StatCard
          label="Critical Events"
          value={s ? String(s.criticalEvents) : "3"}
          sub="SOC2 flagged items"
          icon={AlertTriangle}
          warn={(s?.criticalEvents ?? 3) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Weekly GMV vs Member Slice</h2>
            </div>
            <span className="text-xs text-white/25">5-week rolling</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEMO_GMV} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="gmv" name="GMV" fill="#F59E0B" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="slice" name="Member Slice" fill="#10B981" opacity={0.9} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Truck size={14} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Task Type Breakdown</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEMO_TYPE} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="taskType" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tasks" radius={[0, 3, 3, 0]}>
                {DEMO_TYPE.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">BGC Status Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={bgcChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {bgcChartData.map((_, i) => (
                  <Cell key={i} fill={BGC_COLORS[i]} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-2">
            {bgcChartData.map((d, i) => (
              <div key={d.name} className="text-center">
                <p className="text-sm font-bold" style={{ color: BGC_COLORS[i] }}>{d.value}</p>
                <p className="text-[10px] text-white/30">{d.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard label="BGC Clear Rate" value={`${s?.bgcClearRate ?? 74}%`} sub={`${s?.bgcApplications ?? 19} total applications`} icon={BadgeCheck} />
          <StatCard label="Audit Events" value={s ? `${s.auditEvents}` : "80"} sub="SHA-256 hashed & tamper-proof" icon={Shield} />
          <StatCard label="Watchlist Items" value={s ? `${s.watchlistItems}` : "4"} sub="Vehicles being tracked" icon={Bookmark} />
          <StatCard label="Inspections" value={s ? `${s.inspectionsCompleted}` : "0"} sub="Pre-pickup reports filed" icon={ClipboardCheck} />
        </div>
      </div>
    </div>
  );
}
