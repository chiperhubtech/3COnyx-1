/**
 * 3C ONYX — Strategic Command Center
 * ─────────────────────────────────────────────────────────────────────────────
 * Every number, every projection, every calculated milestone from the
 * CFO/VC strategy session — live, tracked, and actionable on the platform.
 *
 * Mission: 132M Members | 2× AAA | $30B Valuation
 * Flywheel: Specialist → Team → GM → Dealer → Consumers → K-Factor loops
 * Model: $569K Y1 → $2B ARR Y5
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target, TrendingUp, Users, DollarSign, Zap, ChevronRight,
  Shield, Crown, Star, Trophy, BarChart3, ArrowRight,
  Globe, Briefcase, Cpu, CheckCircle2, Circle, RefreshCw,
  Building2, UserCheck, Award, Rocket, Brain,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface YearModel {
  year: number; label: string; members: number; dealers: number; totalARR: number;
  valuationLow: number; valuationHigh: number; valuationLabel: string;
  milestone: string; kFactor: number;
  txnRevenue: number; saasRevenue: number; dataRevenue: number;
}

interface RevenueStream {
  id: string; label: string; rate: string; color: string; pct: number;
}

interface FlywheelStep {
  step: number; actor: string; action: string; detail: string; multiplier: string;
}

interface Role {
  id: string; label: string; category: string; ltv: number; referralMultiplier: number;
}

interface FoundingPilot {
  target: number; current: number; durationDays: number; conversionTarget: string;
  dealStructure: string;
  targetProfiles: { rank: number; type: string; location: string; volume: string }[];
}

interface GamificationTier {
  tier: number; name: string; color: string; members: number;
  pointMin: number; pointMax: number | null; perks: string[];
}

interface StrategyData {
  mission: { memberTarget: number; memberTargetLabel: string; aaaMemberBase: number; aaaRevenueB: number; valuationLabel: string };
  currentState: { members: number; foundingMembers: number; dealerPilots: number; crmConnections: number; valuationLow: number; valuationHigh: number; phase: string };
  progress: { membersToY1: { current: number; target: number; pct: number }; dealersToY1: { current: number; target: number; pct: number } };
  yearlyModel: YearModel[];
  revenueStreams: RevenueStream[];
  flywheel: FlywheelStep[];
  roles: Role[];
  foundingPilot: FoundingPilot;
  gamificationTiers: GamificationTier[];
  competitiveEdge: {
    aaa: { members: number; revenue: number; products: number; aiFeatures: number };
    onyx: { members: number; revenue: number; products: number; aiFeatures: number };
    advantages: string[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const api  = (p: string) => `${BASE}/api${p}`;

const fmtM = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtMembers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  bdc:       { icon: Zap,        color: "text-violet-400", label: "BDC" },
  finance:   { icon: DollarSign, color: "text-emerald-400", label: "Finance" },
  sales:     { icon: TrendingUp, color: "text-blue-400", label: "Sales" },
  operations:{ icon: Globe,      color: "text-amber-400", label: "Operations" },
  service:   { icon: Shield,     color: "text-cyan-400", label: "Service" },
  ownership: { icon: Crown,      color: "text-yellow-400", label: "Ownership" },
};

const TIER_ICONS: React.ElementType[] = [Circle, Star, Zap, Shield, Award, Crown, Trophy, Rocket];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, accent = "#C9A227" }: { icon: React.ElementType; title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg" style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono">{title}</h2>
    </div>
  );
}

function ProgressBar({ pct, color = "#C9A227" }: { pct: number; color?: string }) {
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function StatCard({ label, value, sub, color = "#C9A227" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-black font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function MissionHero({ data }: { data: StrategyData }) {
  const { mission, currentState } = data;
  const memberPct = (currentState.members / mission.memberTarget * 100);
  return (
    <div className="relative bg-gradient-to-br from-zinc-900 via-violet-950/20 to-zinc-900 border border-violet-500/20 rounded-2xl p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative">
        <div className="text-xs font-mono text-violet-400 mb-2 uppercase tracking-widest">Mission Statement</div>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
          {mission.memberTargetLabel} Members
        </h1>
        <div className="text-base font-bold text-yellow-400 mb-4">2× AAA · {mission.valuationLabel} Valuation · Powered by CUXTOMCANDYCLUB LLC</div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Current Members" value={currentState.members.toLocaleString()} color="#10B981" />
          <StatCard label="Platform Phase"  value="Pre-Revenue" sub={currentState.phase} color="#A78BFA" />
          <StatCard label="Valuation Now"   value={`$${(currentState.valuationLow / 1_000_000).toFixed(0)}M–$${(currentState.valuationHigh / 1_000_000).toFixed(0)}M`} color="#C9A227" />
          <StatCard label="Valuation Target" value={mission.valuationLabel} sub="Year 5" color="#F0ABFC" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-500">
            <span>PROGRESS TO 132M MEMBERS</span>
            <span className="text-violet-400">{currentState.members.toLocaleString()} / {mission.memberTargetLabel}</span>
          </div>
          <ProgressBar pct={memberPct} color="#7C3AED" />
          <div className="text-[10px] font-mono text-zinc-600">
            AAA has 66M members and $7.7B revenue. 3C ONYX targets 2× at $2B ARR — proving SaaS multiples beat membership fees.
          </div>
        </div>
      </div>
    </div>
  );
}

function YearlyModelTable({ years }: { years: YearModel[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  return (
    <div>
      <SectionHeader icon={BarChart3} title="Year 1–5 Revenue Model" accent="#C9A227" />

      {/* Year selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {years.map(y => (
          <button
            key={y.year}
            onClick={() => setSelectedYear(selectedYear === y.year ? null : y.year)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              selectedYear === y.year
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {y.label} · {fmtM(y.totalARR)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              {["", "Members", "Dealers", "Txn Revenue", "SaaS ARR", "Data ARR", "Total ARR", "Valuation", "K-Factor"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(y => {
              const active = selectedYear === y.year;
              return (
                <tr
                  key={y.year}
                  onClick={() => setSelectedYear(active ? null : y.year)}
                  className={`border-b border-zinc-900 cursor-pointer transition-colors ${active ? "bg-yellow-500/8" : "hover:bg-zinc-900/60"}`}
                >
                  <td className="px-3 py-3">
                    <div className="font-bold text-zinc-300">{y.label}</div>
                    <div className="text-zinc-600 text-[10px]">{y.milestone}</div>
                  </td>
                  <td className="px-3 py-3 text-blue-400 font-bold">{fmtMembers(y.members)}</td>
                  <td className="px-3 py-3 text-zinc-300">{y.dealers.toLocaleString()}</td>
                  <td className="px-3 py-3 text-emerald-400">{fmtM(y.txnRevenue)}</td>
                  <td className="px-3 py-3 text-violet-400">{fmtM(y.saasRevenue)}</td>
                  <td className="px-3 py-3 text-amber-400">{fmtM(y.dataRevenue)}</td>
                  <td className="px-3 py-3 text-yellow-400 font-bold">{fmtM(y.totalARR)}</td>
                  <td className="px-3 py-3 text-pink-400">{y.valuationLabel}</td>
                  <td className="px-3 py-3">
                    <span className={`font-bold ${y.kFactor >= 1.5 ? "text-emerald-400" : "text-amber-400"}`}>
                      {y.kFactor.toFixed(1)}×
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded detail */}
      {selectedYear && (() => {
        const y = years.find(yr => yr.year === selectedYear);
        if (!y) return null;
        return (
          <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 space-y-3">
            <div className="text-sm font-bold text-yellow-400">{y.label} — {y.milestone}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-zinc-900/60 rounded-lg px-3 py-2">
                <div className="text-zinc-500">Transaction Fees</div>
                <div className="text-emerald-400 font-bold text-base mt-1">{fmtM(y.txnRevenue)}</div>
                <div className="text-zinc-600">2% of all deals closed</div>
              </div>
              <div className="bg-zinc-900/60 rounded-lg px-3 py-2">
                <div className="text-zinc-500">Dealer SaaS</div>
                <div className="text-violet-400 font-bold text-base mt-1">{fmtM(y.saasRevenue)}</div>
                <div className="text-zinc-600">{y.dealers.toLocaleString()} dealers × avg ${y.year <= 2 ? y.year === 1 ? "499" : "599" : y.year === 3 ? "699" : y.year === 4 ? "899" : "1,299"}/mo</div>
              </div>
              <div className="bg-zinc-900/60 rounded-lg px-3 py-2">
                <div className="text-zinc-500">Data Licensing</div>
                <div className="text-amber-400 font-bold text-base mt-1">{fmtM(y.dataRevenue)}</div>
                <div className="text-zinc-600">Anonymized market intelligence</div>
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              Valuation Range: <span className="text-pink-400 font-bold">{y.valuationLabel}</span> · 
              K-Factor Target: <span className={`font-bold ${y.kFactor >= 1.5 ? "text-emerald-400" : "text-amber-400"}`}>{y.kFactor}×</span> · 
              Funding Stage: <span className="text-zinc-300">{y.milestone}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function ValuationTimeline({ years }: { years: YearModel[] }) {
  const max = 40_000_000_000;
  return (
    <div>
      <SectionHeader icon={TrendingUp} title="Valuation Trajectory  ·  $4M → $30B" accent="#7C3AED" />
      <div className="space-y-3">
        {[
          { label: "NOW", range: "$4M–$10M", low: 4_000_000, high: 10_000_000, note: "Platform built. Pre-revenue.", color: "#6B7280" },
          ...years.map(y => ({ label: y.label, range: y.valuationLabel, low: y.valuationLow, high: y.valuationHigh, note: y.milestone, color: y.year === 1 ? "#F59E0B" : y.year === 2 ? "#10B981" : y.year === 3 ? "#3B82F6" : y.year === 4 ? "#A78BFA" : "#F0ABFC" })),
        ].map((item, i) => {
          const barPct = Math.round(item.high / max * 100);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="text-xs font-mono text-zinc-500 w-12 shrink-0 text-right">{item.label}</div>
              <div className="flex-1 relative">
                <div className="w-full bg-zinc-800/50 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-6 rounded-full flex items-center px-3 transition-all duration-700"
                    style={{ width: `${Math.max(barPct, 3)}%`, background: `${item.color}30`, border: `1px solid ${item.color}50` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-mono font-bold" style={{ color: item.color }}>{item.range}</span>
                </div>
              </div>
              <div className="text-xs text-zinc-600 w-28 shrink-0 hidden sm:block">{item.note}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-zinc-600 font-mono">
        At $2B ARR with SaaS-grade 15× revenue multiple = $30B. AAA earns $7.7B on 66M members at 1× revenue. ONYX wins on multiples.
      </div>
    </div>
  );
}

function FlywheelDiagram({ steps }: { steps: FlywheelStep[] }) {
  return (
    <div>
      <SectionHeader icon={Zap} title="Bottom-Up Growth Flywheel" accent="#10B981" />
      <div className="relative">
        {steps.map((step, i) => (
          <div key={step.step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                i === 0 ? "border-violet-400 bg-violet-400/20 text-violet-400" :
                i === 1 ? "border-blue-400 bg-blue-400/20 text-blue-400" :
                i === 2 ? "border-cyan-400 bg-cyan-400/20 text-cyan-400" :
                i === 3 ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" :
                i === 4 ? "border-orange-400 bg-orange-400/20 text-orange-400" :
                          "border-emerald-400 bg-emerald-400/20 text-emerald-400"
              }`}>
                {step.step}
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 flex-1 my-1 bg-gradient-to-b from-zinc-700 to-zinc-800" style={{ minHeight: "24px" }} />
              )}
            </div>
            <div className={`pb-4 flex-1 ${i === steps.length - 1 ? "pb-0" : ""}`}>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-bold text-zinc-200">{step.actor}</span>
                <ChevronRight className="w-3 h-3 text-zinc-600" />
                <span className="text-sm text-zinc-400">{step.action}</span>
                <span className={`ml-auto text-xs font-mono font-bold ${
                  i === 0 ? "text-violet-400" : i === 3 ? "text-yellow-400" : "text-emerald-400"
                }`}>{step.multiplier}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
        <div className="text-xs font-mono text-emerald-400 font-bold mb-1">Why this flywheel is unbeatable:</div>
        <div className="text-xs text-zinc-400">
          Zero paid acquisition at launch. One BDC rep → 8 colleagues → whole dealership → hundreds of consumers.
          Every new dealer brings 100–500 consumers. Every consumer refers 1–3 friends.
          When K-Factor crosses 1.5, the platform grows without any advertising spend.
        </div>
      </div>
    </div>
  );
}

function RevenueStreams({ streams }: { streams: RevenueStream[] }) {
  return (
    <div>
      <SectionHeader icon={DollarSign} title="5 Revenue Streams" accent="#10B981" />
      <div className="space-y-3">
        {streams.map(s => (
          <div key={s.id} className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-200 font-medium">{s.label}</span>
                <span className="text-xs font-mono text-zinc-400">{s.pct}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.rate}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FoundingPilotTracker({ pilot }: { pilot: FoundingPilot }) {
  const pct = Math.round(pilot.current / pilot.target * 100);
  return (
    <div>
      <SectionHeader icon={Building2} title="Founding 5 Dealer Pilot" accent="#F97316" />
      <div className="bg-zinc-900/80 border border-orange-500/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black font-mono text-orange-400">{pilot.current} / {pilot.target}</div>
            <div className="text-xs text-zinc-500">Founding dealers secured</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-zinc-300">{pilot.durationDays}-Day Free Trial</div>
            <div className="text-xs text-zinc-500">→ {pilot.conversionTarget}/mo</div>
          </div>
        </div>

        <ProgressBar pct={pct} color="#F97316" />

        <div className="text-xs font-mono text-zinc-600 bg-zinc-800/40 px-3 py-2 rounded-lg">
          {pilot.dealStructure}
        </div>

        <div className="space-y-2">
          {pilot.targetProfiles.map(p => (
            <div key={p.rank} className="flex items-center gap-3 text-xs">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 font-mono font-bold ${
                p.rank <= pilot.current
                  ? "border-orange-400 bg-orange-400/20 text-orange-400"
                  : "border-zinc-700 text-zinc-600"
              }`}>
                {p.rank <= pilot.current ? "✓" : p.rank}
              </div>
              <div className="flex-1">
                <span className="text-zinc-300 font-medium">{p.type}</span>
                <span className="text-zinc-600 ml-2">{p.location} · {p.volume}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleAcquisitionGrid({ roles }: { roles: Role[] }) {
  const grouped = roles.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Role[]>);

  return (
    <div>
      <SectionHeader icon={UserCheck} title="16 Role Acquisition Targets" accent="#3B82F6" />
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, roleList]) => {
          const cfg = CATEGORY_ICONS[cat] ?? { icon: Users, color: "text-zinc-400", label: cat };
          const Icon = cfg.icon;
          return (
            <div key={cat}>
              <div className={`flex items-center gap-2 mb-2 text-xs font-mono font-bold uppercase tracking-wider ${cfg.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roleList.map(role => (
                  <div key={role.id} className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-300">{role.label}</span>
                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-zinc-500">LTV</div>
                        <div className="text-emerald-400 font-bold">{role.ltv}×</div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-500">Refs</div>
                        <div className="text-blue-400 font-bold">{role.referralMultiplier}×</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-zinc-600 font-mono">
        LTV = lifetime value index relative to platform avg. Refs = avg referrals per member in first 90 days.
        BDC Reps at 340× LTV are the highest-value entry point.
      </div>
    </div>
  );
}

function AAAComparison({ data }: { data: StrategyData["competitiveEdge"] }) {
  const rows = [
    { metric: "Members",      aaa: "66M",    onyx: "132M (target)", better: "onyx" },
    { metric: "Revenue",      aaa: "$7.7B",  onyx: "$2B ARR (15× multiple = $30B val)", better: "onyx" },
    { metric: "AI Features",  aaa: "0",      onyx: "8+ integrated", better: "onyx" },
    { metric: "Products",     aaa: "12",     onyx: "50+", better: "onyx" },
    { metric: "Auto Focus",   aaa: "Partial",onyx: "100% automotive-native", better: "onyx" },
    { metric: "CRM Integration", aaa: "None", onyx: "9 platforms live", better: "onyx" },
    { metric: "Gamification", aaa: "None",   onyx: "8-tier ONYX system", better: "onyx" },
    { metric: "Dealer Network",aaa: "None",  onyx: "Founding pilot active", better: "onyx" },
  ];

  return (
    <div>
      <SectionHeader icon={Trophy} title="3C ONYX vs. AAA — Competitive Scorecard" accent="#C9A227" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2 text-zinc-500 uppercase tracking-wider">Metric</th>
              <th className="text-center px-3 py-2 text-zinc-500 uppercase tracking-wider">AAA (66M members)</th>
              <th className="text-center px-3 py-2 text-yellow-500 uppercase tracking-wider">3C ONYX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.metric} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                <td className="px-3 py-2.5 text-zinc-400 font-medium">{r.metric}</td>
                <td className="px-3 py-2.5 text-center text-zinc-500">{r.aaa}</td>
                <td className="px-3 py-2.5 text-center text-yellow-400 font-bold">{r.onyx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Our Unfair Advantages</div>
        {data.advantages.map((adv, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{adv}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamificationTiers({ tiers }: { tiers: GamificationTier[] }) {
  const TierIcons = TIER_ICONS;
  return (
    <div>
      <SectionHeader icon={Crown} title="8-Tier Gamification System" accent="#A78BFA" />
      <div className="space-y-2">
        {tiers.map((tier, i) => {
          const Icon = TierIcons[i] ?? Star;
          return (
            <div
              key={tier.tier}
              className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 hover:bg-zinc-900/80 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: tier.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</span>
                  <span className="text-xs font-mono text-zinc-600">
                    {tier.pointMin.toLocaleString()}{tier.pointMax ? `–${tier.pointMax.toLocaleString()}` : "+"} pts
                  </span>
                </div>
                <div className="text-xs text-zinc-500 truncate">{tier.perks.join(" · ")}</div>
              </div>
              <div className="text-xs font-mono text-zinc-600 shrink-0">Tier {tier.tier}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "mission",    label: "Mission",   icon: Rocket },
  { id: "model",      label: "Revenue",   icon: DollarSign },
  { id: "flywheel",   label: "Flywheel",  icon: Zap },
  { id: "valuation",  label: "Valuation", icon: TrendingUp },
  { id: "competition",label: "vs. AAA",   icon: Trophy },
  { id: "tiers",      label: "Tiers",     icon: Crown },
] as const;

type TabId = typeof TABS[number]["id"];

export default function StrategicCenter() {
  const [tab, setTab] = useState<TabId>("mission");

  const { data, isLoading, refetch } = useQuery<StrategyData>({
    queryKey: ["strategy/overview"],
    queryFn: () => fetch(api("/strategy/overview")).then(r => r.json()),
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <PageHeader
        icon={Briefcase}
        title="Strategic Command Center"
        subtitle="132M Members · 2× AAA · $30B — Every Calculation, Live on the Platform"
        accent="#C9A227"
      />

      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-6">

        {/* Status */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono text-zinc-500">CFO/VC Model · Live Calculations · CUXTOMCANDYCLUB LLC</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800 p-1 rounded-xl overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-200 ${
                  tab === t.id ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-8 justify-center">
            <Cpu className="w-4 h-4 animate-pulse" />
            Loading strategic model…
          </div>
        )}

        {data && (
          <>
            {tab === "mission" && (
              <div className="space-y-6">
                <MissionHero data={data} />
                <FoundingPilotTracker pilot={data.foundingPilot} />
                <RoleAcquisitionGrid roles={data.roles} />
              </div>
            )}

            {tab === "model" && (
              <div className="space-y-8">
                <RevenueStreams streams={data.revenueStreams} />
                <YearlyModelTable years={data.yearlyModel} />
              </div>
            )}

            {tab === "flywheel" && (
              <FlywheelDiagram steps={data.flywheel} />
            )}

            {tab === "valuation" && (
              <ValuationTimeline years={data.yearlyModel} />
            )}

            {tab === "competition" && (
              <AAAComparison data={data.competitiveEdge} />
            )}

            {tab === "tiers" && (
              <GamificationTiers tiers={data.gamificationTiers} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
