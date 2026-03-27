/**
 * 3C ONYX — Sovereign Operations Center
 *
 * The entire company runs from this screen.
 * Two people. 100 million members. ONYX handles the rest.
 */

import { useState, useEffect } from "react";
import {
  Zap, AlertTriangle, CheckCircle2, TrendingUp, Users, DollarSign,
  Bot, Shield, Activity, Clock, ChevronRight, Circle,
  Cpu, Radio, Lock, Layers, Network, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "flat";
  trendLabel: string;
  color: string;
  icon: React.ReactNode;
}

interface EscalationItem {
  id: string;
  category: "compliance" | "partner" | "member" | "finance";
  title: string;
  detail: string;
  age: string;
  severity: "critical" | "medium" | "low";
}

interface AIAction {
  id: string;
  time: string;
  action: string;
  member: string;
  outcome: string;
  saved: number;
}

interface PartnerRail {
  name: string;
  type: string;
  status: "live" | "degraded" | "down";
  requestsToday: number;
  successRate: number;
}

interface FlyWheelNode {
  label: string;
  value: string;
  note: string;
}

// ─── Static demo data ─────────────────────────────────────────────────────────

const ESCALATIONS: EscalationItem[] = [
  {
    id: "1",
    category: "compliance",
    title: "California DMV — dealer bond renewal",
    detail: "CA dealer bond expires in 14 days. ONYX has pre-filled renewal. Requires CEO wet signature.",
    age: "2 hrs ago",
    severity: "medium",
  },
];

const AI_ACTIONS: AIAction[] = [
  { id: "1",  time: "4 min ago",   action: "Insurance carrier switch executed",   member: "Member #8,821", outcome: "New policy live. $612/yr saved.",     saved: 612   },
  { id: "2",  time: "11 min ago",  action: "Service booking confirmed + dispatched", member: "Member #3,104", outcome: "BGC-verified tech en route.",         saved: 1_400 },
  { id: "3",  time: "18 min ago",  action: "Refinance application submitted",      member: "Member #6,447", outcome: "Lender pre-approved. 2.1% reduction.", saved: 6_624 },
  { id: "4",  time: "24 min ago",  action: "G63 AMG acquisition escrow opened",   member: "Member #1,038", outcome: "Price locked. Inspection dispatched.",   saved: 14_400},
  { id: "5",  time: "31 min ago",  action: "NHTSA recall scan — 3 vehicles",      member: "Member #9,220", outcome: "All clear. Guardian score updated.",    saved: 0     },
  { id: "6",  time: "47 min ago",  action: "GT3 equity strategy executed",         member: "Member #4,771", outcome: "Equity line secured. $8,200 captured.", saved: 8_200 },
  { id: "7",  time: "1 hr ago",    action: "Pre-trip safety brief delivered",      member: "Member #2,309", outcome: "2 warnings flagged. Member notified.",   saved: 0     },
  { id: "8",  time: "1 hr ago",    action: "VIN Digital Passport minted",          member: "Member #7,553", outcome: "Blockchain entry confirmed.",            saved: 0     },
];

const PARTNER_RAILS: PartnerRail[] = [
  { name: "ONYX Insurance Engine", type: "Insurance",   status: "live",     requestsToday: 847,   successRate: 99.8 },
  { name: "ONYX Finance Layer",    type: "Finance",     status: "live",     requestsToday: 312,   successRate: 99.4 },
  { name: "ONYX Vehicle Network",  type: "Marketplace", status: "live",     requestsToday: 2_104, successRate: 98.9 },
  { name: "ONYX Parts Catalog",    type: "Parts",       status: "live",     requestsToday: 441,   successRate: 100  },
  { name: "ONYX Pay",              type: "Payments",    status: "live",     requestsToday: 1_899, successRate: 99.9 },
  { name: "NHTSA Safety Feed",     type: "Safety",      status: "live",     requestsToday: 3_210, successRate: 100  },
  { name: "Guardian V2X",          type: "Telematics",  status: "degraded", requestsToday: 778,   successRate: 94.1 },
  { name: "Runner Dispatch",       type: "Logistics",   status: "live",     requestsToday: 524,   successRate: 97.6 },
];

const FLYWHEEL: FlyWheelNode[] = [
  { label: "Member joins",             value: "Automated",  note: "KYC · Stripe · VIN scan — zero human touch" },
  { label: "ONYX identifies value",    value: "AI-driven",  note: "Intelligence feed fires within 60 sec of onboard" },
  { label: "ONYX executes",            value: "Autonomous", note: "Insurance · service · finance · marketplace" },
  { label: "Member confirms",          value: "1 tap",      note: "No negotiation · no advocacy · no comparison" },
  { label: "Member earns XP + refers", value: "Gamified",   note: "Avg 2.3 referrals per active member" },
  { label: "Runner fulfills",          value: "Gig network",note: "Self-onboarding · BGC-verified · not employees" },
];

function trendIcon(t: "up" | "down" | "flat", good: "up" | "down") {
  const cls = "w-3.5 h-3.5";
  if (t === "up")   return <ArrowUpRight   className={cls} style={{ color: good === "up" ? "#34D399" : "#F87171" }} />;
  if (t === "down") return <ArrowDownRight className={cls} style={{ color: good === "down" ? "#34D399" : "#F87171" }} />;
  return <Minus className={cls} style={{ color: "#9CA3AF" }} />;
}

function statusDot(s: "live" | "degraded" | "down") {
  const color = s === "live" ? "#34D399" : s === "degraded" ? "#F59E0B" : "#F87171";
  const pulse = s === "live";
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: color }} />}
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = target / 60;
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SovereignOps() {
  const [tick, setTick] = useState(0);
  const [aiRate] = useState(97.3);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const METRICS: MetricCard[] = [
    {
      label: "AI Self-Resolution Rate",
      value: `${aiRate}%`,
      sub: "of all member requests handled by ONYX with zero human involvement",
      trend: "up", trendLabel: "+1.2% this month",
      color: "#C9A227",
      icon: <Bot className="w-5 h-5" />,
    },
    {
      label: "Active Members",
      value: "12,841",
      sub: "Founding cohort · Ghost Gate invite-only · 8-tier gamification",
      trend: "up", trendLabel: "+341 this week",
      color: "#60A5FA",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Monthly Recurring Revenue",
      value: "$1.14M",
      sub: "Subscription + marketplace spread + runner fees · zero sales team",
      trend: "up", trendLabel: "+18.4% MoM",
      color: "#34D399",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: "Human Escalations Today",
      value: "1",
      sub: "CA bond renewal — pre-filled — CEO wet signature only",
      trend: "down", trendLabel: "↓ 3 from yesterday",
      color: "#A78BFA",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      label: "Value Delivered This Month",
      value: "$4.2M",
      sub: "Insurance savings · service cost avoided · market opportunities locked",
      trend: "up", trendLabel: "Across all members",
      color: "#F59E0B",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Runner Network",
      value: "2,218",
      sub: "Active BGC-verified specialists · self-onboarded · gig network",
      trend: "up", trendLabel: "+88 this week",
      color: "#F87171",
      icon: <Radio className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── Header ── */}
      <div className="border-b border-white/5 px-5 pt-8 pb-5" style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.05) 0%, transparent 50%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black tracking-[0.3em] text-[#C9A227]/60 uppercase mb-1">3C ONYX · FOUNDER ONLY</p>
              <h1 className="text-3xl font-black tracking-tight">Sovereign <span className="text-[#C9A227]">Operations</span></h1>
              <p className="text-xs text-gray-400 mt-1">Two people. One platform. 100 million members. ONYX runs the rest.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-400 tracking-wider">SYSTEM AUTONOMOUS</span>
            </div>
          </div>

          {/* Headline stat */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { label: "Internal Headcount",  value: "2",      note: "CEO + 1 Compliance",   color: "#C9A227" },
              { label: "Members Served",       value: "12,841", note: "Founding cohort",       color: "#60A5FA" },
              { label: "AI Resolution Rate",   value: "97.3%",  note: "No human needed",       color: "#34D399" },
            ].map(s => (
              <div key={s.label} className="text-center py-4 px-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{s.label}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {METRICS.map(m => (
            <div key={m.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between mb-3">
                <div style={{ color: m.color }}>{m.icon}</div>
                <div className="flex items-center gap-1">
                  {trendIcon(m.trend, m.label === "Human Escalations Today" ? "down" : "up")}
                  <span className="text-[9px] text-gray-500">{m.trendLabel}</span>
                </div>
              </div>
              <p className="text-2xl font-black text-white mb-1" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[10px] font-bold text-gray-300 mb-1">{m.label}</p>
              <p className="text-[9px] text-gray-500 leading-relaxed">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Human Escalation Queue ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C9A227]" />
              <p className="text-sm font-bold text-white">Human Attention Queue</p>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/20">
                {ESCALATIONS.length} item{ESCALATIONS.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">Target: &lt;5/day · ONYX handles the rest</p>
          </div>

          {ESCALATIONS.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-400">Nothing needs you today</p>
              <p className="text-xs text-gray-500 mt-1">ONYX is handling everything</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ESCALATIONS.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: e.severity === "critical" ? "#F87171" : e.severity === "medium" ? "#F59E0B" : "#60A5FA" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-white">{e.title}</p>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">{e.age}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{e.detail}</p>
                  </div>
                  <button className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#C9A227" }}>
                    Handle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ONYX AI Actions — live feed ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#C9A227]" />
              <p className="text-sm font-bold text-white">ONYX AI — Live Action Feed</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AUTONOMOUS
            </div>
          </div>
          <div className="space-y-2">
            {AI_ACTIONS.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-all"
                style={{ opacity: 1 - i * 0.08, background: i === 0 ? "rgba(201,162,39,0.04)" : "rgba(255,255,255,0.01)" }}
              >
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(201,162,39,0.12)" }}>
                  <Zap className="w-3 h-3 text-[#C9A227]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white truncate">{a.action}</p>
                    <span className="text-[9px] text-gray-500 flex-shrink-0">{a.member}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.outcome}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  {a.saved > 0 && (
                    <span className="text-[10px] font-black text-emerald-400">+${a.saved.toLocaleString()}</span>
                  )}
                  <span className="text-[9px] text-gray-600">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-3">No human involved in any of the above · ONYX executed all</p>
        </div>

        {/* ── Partner API Rails ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-[#60A5FA]" />
            <p className="text-sm font-bold text-white">Partner API Rails</p>
            <span className="text-[10px] text-gray-500">— automated · no account manager needed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PARTNER_RAILS.map(r => (
              <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
                {statusDot(r.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{r.name}</p>
                  <p className="text-[9px] text-gray-500">{r.type} · {r.requestsToday.toLocaleString()} req today</p>
                </div>
                <span className="text-[10px] font-black flex-shrink-0" style={{ color: r.successRate > 98 ? "#34D399" : r.successRate > 95 ? "#F59E0B" : "#F87171" }}>
                  {r.successRate}%
                </span>
              </div>
            ))}
          </div>
          {PARTNER_RAILS.some(r => r.status === "degraded") && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              <span className="text-gray-400">Guardian V2X degraded — ONYX switched to backup telemetry. No member impact. No action needed from you.</span>
            </div>
          )}
        </div>

        {/* ── The Self-Sustaining Flywheel ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Cpu className="w-4 h-4 text-[#A78BFA]" />
            <p className="text-sm font-bold text-white">The Self-Sustaining Flywheel</p>
            <span className="text-[10px] text-gray-500">— why headcount stays near zero forever</span>
          </div>
          <div className="relative">
            {FLYWHEEL.map((node, i) => (
              <div key={node.label} className="flex items-start gap-4 mb-4 last:mb-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border"
                    style={{ background: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.25)", color: "#A78BFA" }}
                  >
                    {i + 1}
                  </div>
                  {i < FLYWHEEL.length - 1 && <div className="w-px h-6 mt-1" style={{ background: "rgba(167,139,250,0.15)" }} />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-white">{node.label}</p>
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#A78BFA" }}
                    >
                      {node.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{node.note}</p>
                </div>
              </div>
            ))}
            <div className="mt-4 ml-12 flex items-center gap-2 text-xs" style={{ color: "#A78BFA" }}>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-bold">Loop repeats. Headcount stays at 2. Members grow to 100M.</span>
            </div>
          </div>
        </div>

        {/* ── Path to 100M — Headcount stays flat ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#34D399]" />
            <p className="text-sm font-bold text-white">Path to 100M Members — Headcount Projection</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 pr-4 text-[10px] text-gray-500 font-bold">Phase</th>
                  <th className="text-right py-2 px-3 text-[10px] text-gray-500 font-bold">Members</th>
                  <th className="text-right py-2 px-3 text-[10px] text-gray-500 font-bold">Internal Team</th>
                  <th className="text-right py-2 px-3 text-[10px] text-gray-500 font-bold">Runners (gig)</th>
                  <th className="text-right py-2 pl-3 text-[10px] text-gray-500 font-bold">ARR</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { phase: "Ghost Gate (now)",   members: "12,841",   team: "2",   runners: "2,218",   arr: "$1.4M" },
                  { phase: "Early Open",          members: "100K",     team: "4",   runners: "8K",      arr: "$11M" },
                  { phase: "Regional Scale",      members: "1M",       team: "12",  runners: "65K",     arr: "$110M" },
                  { phase: "National",            members: "10M",      team: "40",  runners: "500K",    arr: "$1.1B" },
                  { phase: "Full Planet",         members: "100M",     team: "120", runners: "4M",      arr: "$11B+" },
                ].map((row, i) => (
                  <tr key={row.phase} className="border-b border-white/5 last:border-0" style={{ background: i === 0 ? "rgba(201,162,39,0.03)" : undefined }}>
                    <td className="py-3 pr-4 font-bold text-white text-xs" style={i === 0 ? { color: "#C9A227" } : undefined}>
                      {row.phase} {i === 0 && <span className="text-[9px] font-normal text-gray-500">← you are here</span>}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300">{row.members}</td>
                    <td className="py-3 px-3 text-right font-black" style={{ color: "#34D399" }}>{row.team}</td>
                    <td className="py-3 px-3 text-right text-gray-400">{row.runners}</td>
                    <td className="py-3 pl-3 text-right font-bold text-white">{row.arr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Internal team grows at 0.012% of member count — because ONYX is the operator, runners are the workforce, and partners are the regulated layer. You never build a call center. You never build a sales force. The platform sells itself through the flywheel.</p>
        </div>

        {/* ── The Two Non-Negotiable Humans ── */}
        <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#C9A227]" />
            <p className="text-sm font-bold text-white">The Two Non-Negotiable Humans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                role: "CEO — You",
                why: "Capital allocation. Strategic signatory. Regulatory relationships. The face regulators and investors need to see.",
                canDelegate: "Everything operational",
                cannotDelegate: "Capital decisions · Regulatory signatures · Vision",
                color: "#C9A227",
              },
              {
                role: "Head of Compliance",
                why: "Insurance, automotive finance, and vehicle transactions require a licensed human in the liability chain. ONYX executes — this person signs off.",
                canDelegate: "Day-to-day monitoring (AI handles it)",
                cannotDelegate: "State licenses · Carrier agreements · Legal exposure",
                color: "#A78BFA",
              },
            ].map(p => (
              <div key={p.role} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="font-black text-sm mb-2" style={{ color: p.color }}>{p.role}</p>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{p.why}</p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400">Can delegate: <span className="text-gray-300">{p.canDelegate}</span></span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Lock className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-400">Cannot delegate: <span className="text-gray-300">{p.cannotDelegate}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">Every other function — member service, execution, intelligence, logistics, growth, payments — is handled by ONYX, the runner network, or the partner API layer.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
