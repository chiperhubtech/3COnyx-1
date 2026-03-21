import { useState, useEffect } from "react";
import {
  BarChart3, Star, TrendingUp, CheckCircle2, Clock, DollarSign,
  BadgeCheck, Truck, Award, ChevronRight, AlertCircle, BrainCircuit, Zap,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DEMO_DELIVERIES = [
  { id: "T-1042", vehicle: "2022 Rolls-Royce Ghost Extended", status: "Completed", payout: 4200, rating: 5, date: "2026-03-20" },
  { id: "T-1038", vehicle: "2021 Ferrari SF90 Stradale", status: "Completed", payout: 3800, rating: 5, date: "2026-03-18" },
  { id: "T-1035", vehicle: "2023 Lamborghini Urus Performante", status: "In Progress", payout: 2900, rating: null, date: "2026-03-21" },
  { id: "T-1031", vehicle: "2022 Bentley Bentayga EWB", status: "Completed", payout: 3100, rating: 4, date: "2026-03-15" },
  { id: "T-1028", vehicle: "2023 Porsche 911 Turbo S", status: "Completed", payout: 2400, rating: 5, date: "2026-03-12" },
  { id: "T-1022", vehicle: "2021 Aston Martin DBS Superleggera", status: "Completed", payout: 3600, rating: 4, date: "2026-03-08" },
  { id: "T-1019", vehicle: "2022 McLaren 720S Spider", status: "Completed", payout: 4100, rating: 5, date: "2026-03-05" },
];

const STAT_BADGES = [
  { label: "Checkr Verified", icon: BadgeCheck, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  { label: "Top Specialist", icon: Award, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  { label: "5-Star Rated", icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
];

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className="ai-stat-card flex flex-col gap-3"
      style={accent ? { borderColor: "rgba(201,162,39,0.25)", background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(6,6,10,0.98) 100%)" } : {}}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/35 uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          accent ? "bg-amber-500/15 border border-amber-500/20" : "bg-white/[0.04] border border-white/[0.06]"
        }`}>
          <Icon size={15} className={accent ? "text-amber-400" : "text-white/40"} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? "text-amber-300" : "text-white"}`}>{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-white/10"}
        />
      ))}
    </div>
  );
}

export default function SpecialistDashboard() {
  const [avgRating] = useState(4.8);
  const completedCount = DEMO_DELIVERIES.filter((d) => d.status === "Completed").length;
  const totalEarnings = DEMO_DELIVERIES.filter((d) => d.status === "Completed")
    .reduce((sum, d) => sum + d.payout, 0);
  const completionRate = Math.round((completedCount / DEMO_DELIVERIES.length) * 100);

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={BarChart3}
        accent="#C9A227"
        title="MY DASHBOARD"
        subtitle="Performance analytics, earnings & delivery history"
        badge={<span className="neural-badge neural-badge-green"><span className="ai-live-dot mr-1" />CHECKR VERIFIED</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {STAT_BADGES.map(({ label, icon: Icon, color, bg }) => (
              <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${bg} ${color}`}>
                <Icon size={12} />
                {label}
              </div>
            ))}
          </div>
        }
      />
      <div className="p-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Earned" value={`$${totalEarnings.toLocaleString()}`} sub="After 5% Member Slice" icon={DollarSign} accent />
        <StatCard label="Deliveries" value={String(completedCount)} sub={`${completionRate}% completion rate`} icon={CheckCircle2} />
        <StatCard label="Avg. Rating" value={`${avgRating}/5.0`} sub="Based on 6 reviews" icon={Star} />
        <StatCard label="Active Tasks" value="1" sub="In Progress now" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ai-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Delivery History</h2>
            </div>
            <span className="text-xs text-white/30">{DEMO_DELIVERIES.length} total</span>
          </div>
          <div>
            {DEMO_DELIVERIES.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === "Completed" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-tight truncate">{d.vehicle}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{d.id} · {d.date}</p>
                </div>
                <div className="text-right shrink-0">
                  {d.rating !== null ? (
                    <StarRating rating={d.rating} />
                  ) : (
                    <span className="text-[10px] text-amber-400/70 font-medium">In Progress</span>
                  )}
                  <p className={`text-sm font-semibold mt-0.5 ${d.status === "Completed" ? "text-emerald-400" : "text-white/40"}`}>
                    {d.status === "Completed" ? `+$${d.payout.toLocaleString()}` : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="ai-stat-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Performance Score</h2>
            </div>
            {[
              { label: "On-time delivery", score: 97 },
              { label: "Condition rating", score: 99 },
              { label: "Client satisfaction", score: 96 },
              { label: "Communication", score: 100 },
              { label: "BGC compliance", score: 100 },
            ].map(({ label, score }) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/50">{label}</span>
                  <span className="text-xs font-semibold text-white/70">{score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${score}%`,
                      background: score >= 98 ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, #F59E0B, #FBBF24)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-300">Next Milestone</h2>
            </div>
            <p className="text-xs text-white/40 mb-2">Complete 2 more deliveries to unlock</p>
            <div className="flex items-center gap-2">
              <Award size={20} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Platinum Specialist</p>
                <p className="text-[11px] text-white/30">+2% payout bonus per task</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/5">
              <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
            </div>
            <p className="text-[10px] text-white/25 mt-1.5 text-right">7 / 10 deliveries</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
