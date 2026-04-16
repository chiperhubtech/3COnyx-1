/**
 * 3C ONYX — Dynasty Foundation
 *
 * The immutable constitutional layer of the platform.
 * Not a feature. The soul.
 *
 * Calculated through:
 * John Dee · Rockefeller · Carnegie · JP Morgan · Steve Jobs
 * Jeff Bezos · Mansa Musa · Jesus Christ
 *
 * Founder: Ronald Antonio Cadet aka Ron3C
 * Entity: CUXTOMCANDYCLUB LLC
 * Mission: Make it indefinite. Bottom-up. Unstoppable. Unbreakable.
 */

import { useState, useEffect, useRef } from "react";
import {
  Shield, Zap, Lock, TrendingUp, Users, DollarSign,
  Globe, Crown, Cpu, ChevronRight, CheckCircle2,
  Activity, Network, Layers, BookOpen, Infinity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Principle {
  name: string;
  era: string;
  thesis: string;
  onyxApplication: string;
  color: string;
}

interface AgentStatus {
  id: number;
  name: string;
  role: string;
  status: "active" | "standby";
  actionsToday: number;
  color: string;
}

interface RevenueStream {
  name: string;
  mechanic: string;
  atScale: string;
  compoundFactor: string;
  color: string;
}

interface Covenant {
  promise: string;
  toWhom: "member" | "founder" | "both";
  immutable: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRINCIPLES: Principle[] = [
  {
    name: "John Dee",
    era: "1527–1608 · Mathematician, Spymaster, Architect of British Intelligence",
    thesis: "Intelligence is the dominion. He who knows everything controls everything. Dee built the first national intelligence network — not to fight wars, but to prevent them by knowing more than any adversary ever could.",
    onyxApplication: "The V2X telemetry mesh, Guardian AI, and VIN Digital Passport are ONYX's intelligence layer. Every vehicle becomes a data node. Every member becomes a sensor. The platform sees everything before any participant does — and acts before they even know they need it.",
    color: "#818CF8",
  },
  {
    name: "John D. Rockefeller",
    era: "1839–1937 · Standard Oil · First American Billionaire",
    thesis: "Never own the crude. Own the pipeline. Rockefeller didn't compete with oil producers — he made them dependent on his infrastructure. The toll on every barrel moved through Standard's network built the most durable fortune in American history.",
    onyxApplication: "The 3% Global Tech Fee is the pipeline toll. ONYX does not own vehicles, dealerships, or insurance carriers. It owns the rail through which every automotive transaction flows. At 100M members transacting $20K/year — the fee generates $60B annually. Immutable. Compounding. Forever.",
    color: "#C9A227",
  },
  {
    name: "Andrew Carnegie",
    era: "1835–1919 · U.S. Steel · The Gospel of Wealth",
    thesis: "Infrastructure precedes legacy. Carnegie built steel mills before he built libraries. The physical infrastructure — rails, girders, bridges — made the cultural legacy possible and permanent. You cannot have a dynasty without a physical anchor.",
    onyxApplication: "The Milford Node on I-95 is the Carnegie steel mill. A distress-asset acquisition at zero inventory liability. It anchors the digital platform to physical reality — a verification hub, a fulfillment center, the proof that ONYX is not software, it is infrastructure. The library (dynasty trust, family office, cultural institution) comes after the steel.",
    color: "#60A5FA",
  },
  {
    name: "J.P. Morgan",
    era: "1837–1913 · Morgan Bank · Architect of American Capital",
    thesis: "Capital alignment is permanent loyalty. Morgan didn't build companies — he organized the capital structures that made them impossible to abandon. He created the conditions where every participant was economically compelled to see the enterprise succeed.",
    onyxApplication: "Member residual income — the multi-tier referral dividend — is the Morgan architecture. Every founding member owns a stake in every transaction their network generates, forever. You cannot leave what you own. The moment a member refers their first connection, they become a permanent stakeholder. Their exit destroys their income. The platform is unbreakable.",
    color: "#34D399",
  },
  {
    name: "Steve Jobs",
    era: "1955–2011 · Apple · The Product Theology",
    thesis: "The product is a religion before it is a product. Jobs did not sell computers — he sold a worldview. Think Different was a confession of faith before it was an advertisement. The customer does not buy the device; they join the tribe.",
    onyxApplication: "ONYX does not sell a car app. It sells sovereignty. The 8-tier gamification, the Ghost Gate invite-only structure, the black-gold aesthetic, the ONYX Concierge that speaks with the authority of a private banker — these are liturgical. Members do not download ONYX. They are anointed. The product is perfect because perfection is the only acceptable standard.",
    color: "#F59E0B",
  },
  {
    name: "Jeff Bezos",
    era: "1964– · Amazon · AWS · Blue Origin · The Flywheel",
    thesis: "The flywheel never stops. Bezos understood that Amazon's true product was the infrastructure — AWS — not the storefront. Every seller on Amazon made AWS more valuable. Every AWS customer made Amazon more reliable. The wheel accelerates with every turn.",
    onyxApplication: "Every ONYX member adds V2X telemetry data to the mesh. That data trains the AI. Better AI delivers more value per member. More value attracts more members. More members generate more data. The Data Vault — anonymized V2X telemetry licensed to OEMs — is ONYX's AWS. The platform grows stronger the larger it gets. There is no ceiling.",
    color: "#F97316",
  },
  {
    name: "Mansa Musa",
    era: "1280–1337 · Emperor of Mali · Richest Human in History",
    thesis: "Distribute wealth so broadly it becomes the economy itself. Mansa Musa gave away so much gold during his pilgrimage to Mecca that he caused inflation across North Africa and the Middle East for a decade. When you distribute at that scale, you don't participate in the economy — you become it.",
    onyxApplication: "The Member Slice — residual income, specialist bounties, referral dividends — is the Musa distribution. When ONYX members earn more from the platform than from their primary employment, the platform supersedes the traditional economy for them. At 100M members each earning $200–$2,000/month from their network, ONYX becomes the largest distributed income system in automotive history. You cannot compete with an economy.",
    color: "#A78BFA",
  },
  {
    name: "Jesus of Nazareth",
    era: "4 BC–33 AD · The Movement that Restructured Civilization",
    thesis: "Start with fishermen. The bottom-up movement is the only unstoppable kind. He did not begin with emperors or high priests. He began with twelve ordinary people who could not stop telling others what they had experienced. Within three centuries, the most powerful empire in the world had adopted the movement as its foundation.",
    onyxApplication: "The Ghost Gate founding cohort are the apostles. Not investors — apostles. People who experienced ONYX's complete agency model and could not stop describing it to others. The platform does not advertise — it testifies. Every member who has ONYX handle a car purchase without a single negotiation becomes an evangelist. The bottom-up multiplication is the only growth that is truly uncontrollable. 12 → 120 → 12,000 → 100,000,000.",
    color: "#E5E7EB",
  },
];

const AGENTS: AgentStatus[] = [
  { id: 1, name: "SALES AGENT",      role: "Conversational deal closer — high trust, high conviction. Never pressures, always closes.",         status: "active",  actionsToday: 847,   color: "#C9A227" },
  { id: 2, name: "GUARDIAN AGENT",   role: "Truth layer. Real-time VIN + odometer integrity. Cannot be deceived or bypassed.",                  status: "active",  actionsToday: 3_210, color: "#34D399" },
  { id: 3, name: "LOGISTICS AGENT",  role: "Transporter plate management, Runner dispatch, I-95 node coordination.",                            status: "active",  actionsToday: 524,   color: "#60A5FA" },
  { id: 4, name: "FINANCE AGENT",    role: "ITIN/Tax-ID verification, Dynasty Wallet payouts, refinance execution.",                            status: "active",  actionsToday: 312,   color: "#A78BFA" },
  { id: 5, name: "CUSTOM AGENT",     role: "Custom Candy visualizer + parts-sourcing bounty marketplace.",                                      status: "active",  actionsToday: 198,   color: "#F59E0B" },
  { id: 6, name: "COMPLIANCE AGENT", role: "GSA/FBI/DOT audit-ready reporting. All 50 states. Real-time.",                                     status: "active",  actionsToday: 91,    color: "#F87171" },
  { id: 7, name: "LOBBYIST AGENT",   role: "Automated ATTAIN/SMART grant proposals. Government bridge. Law enforcement API gateway.",           status: "standby", actionsToday: 14,    color: "#818CF8" },
];

const REVENUE_STREAMS: RevenueStream[] = [
  {
    name: "3% Global Tech Fee",
    mechanic: "Immutable toll on every vehicle transaction processed through ONYX rail — buying, selling, financing, insuring.",
    atScale: "$60B / year at 100M members × $20K avg transaction",
    compoundFactor: "Grows with vehicle prices and transaction volume. Never renegotiated.",
    color: "#C9A227",
  },
  {
    name: "Member Residual Income (The Slice)",
    mechanic: "Multi-tier referral dividend. Every member earns a percentage of every transaction their network generates — permanently.",
    atScale: "$200–$2,000 / month per active member at depth-3 network",
    compoundFactor: "Avg 2.3 referrals per member. Geometric growth. No ceiling.",
    color: "#34D399",
  },
  {
    name: "Specialist Bounty System",
    mechanic: "BGC-verified specialists earn instant payouts for quality-verified labor. ONYX takes a coordination fee on every dispatch.",
    atScale: "$4M+ / day in bounty volume at 2M active runners",
    compoundFactor: "Self-expanding. More members → more service demand → more runner income → more runners join.",
    color: "#60A5FA",
  },
  {
    name: "V2X Data Vault",
    mechanic: "Anonymized vehicle telemetry licensed to OEMs, insurance actuaries, and urban planners. Members opt in — ONYX monetizes.",
    atScale: "$4B / year at 100M connected vehicles (OEM licensing rate: $40/vehicle/year)",
    compoundFactor: "The Bezos flywheel. More vehicles → better data → higher OEM price → more revenue → better AI → more members.",
    color: "#A78BFA",
  },
];

const COVENANTS: Covenant[] = [
  { promise: "100% equity retained by the founder. No dilution. No VC control. Ever.", toWhom: "founder", immutable: true },
  { promise: "Member residual income is perpetual. ONYX cannot retroactively reduce a member's earned dividend rate.", toWhom: "member", immutable: true },
  { promise: "All member data is encrypted at FIPS 140-3 standard. Sovereign Shield. No data sold without explicit opt-in.", toWhom: "both", immutable: true },
  { promise: "The 3% tech fee is the ceiling and the floor. No creep. No surprise charges. One immutable toll.", toWhom: "both", immutable: true },
  { promise: "ONYX acts on behalf of the member in every transaction. The member never negotiates, advocates, or debates. Ever.", toWhom: "member", immutable: true },
  { promise: "Founding member status is permanent. Ghost Gate entry cannot be revoked for founding cohort members.", toWhom: "member", immutable: true },
  { promise: "The platform is asset-light. No floor-plan debt. No inventory liability. The Milford Node operates at zero carrying cost.", toWhom: "founder", immutable: true },
  { promise: "No competitor can replicate the 7-Agent mesh without the telemetry moat. The data advantage is structural and compounding.", toWhom: "both", immutable: true },
];

// ─── Animated number ──────────────────────────────────────────────────────────

function AnimatedNum({ end, prefix = "", suffix = "", duration = 1200 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const step = end / (duration / 16);
    let cur = 0;
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setVal(end); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [end, duration]);
  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ─── Agent pulse ──────────────────────────────────────────────────────────────

function AgentPulse({ color, active }: { color: string; active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-30" style={{ background: color }} />}
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: active ? color : "#374151" }} />
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DynastyFoundation() {
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#060606] text-white">

      {/* ── Hero ── */}
      <div
        className="relative px-5 pt-12 pb-10 border-b border-white/5 overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.08) 0%, rgba(0,0,0,0) 60%)" }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(201,162,39,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A227]/20 bg-[#C9A227]/[0.06] mb-6">
            <Crown className="w-3.5 h-3.5 text-[#C9A227]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-[#C9A227]/80 uppercase">CUXTOMCANDYCLUB LLC · SOVEREIGN</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            The <span className="text-[#C9A227]">Dynasty</span> Foundation
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto mb-2">
            The immutable constitutional layer of 3C ONYX. Not a mission statement. Not a pitch deck. The permanent architecture of a platform designed to be indefinite, bottom-up, unstoppable, and unbreakable for every participant — founding member to the last.
          </p>
          <p className="text-[11px] text-gray-600 font-mono">
            Founded by RAC3C · CUXTOMCANDYCLUB LLC
          </p>

          {/* Core numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              { val: 100_000_000, prefix: "", suffix: "", label: "Target Members",    color: "#C9A227" },
              { val: 30_000_000_000, prefix: "$", suffix: "", label: "Valuation Target", color: "#34D399" },
              { val: 3, prefix: "", suffix: "%",  label: "Immutable Tech Fee",  color: "#60A5FA" },
              { val: 7, prefix: "", suffix: "",   label: "AI Agents — Live",    color: "#A78BFA" },
            ].map(s => (
              <div key={s.label} className="py-4 px-3 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-2xl font-black" style={{ color: s.color }}>
                  <AnimatedNum end={s.val} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">

        {/* ── Founder Directive ── */}
        <div className="rounded-2xl border border-[#C9A227]/25 bg-[#C9A227]/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#C9A227]" />
            <p className="text-xs font-black tracking-widest text-[#C9A227]/70 uppercase">The Founder's Directive — Non-Negotiable · Immutable</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Equity Architecture", value: "100% retained by founder. No dilution. No VC board seats. No outside control. Ever." },
              { label: "Sovereign Shield",    value: "FIPS 140-3 encryption on all member data. Sovereign infrastructure. No surveillance capitalism." },
              { label: "Asset-Light Model",   value: "Shadow-Broker logistics. Zero floor-plan debt. Zero inventory liability. The Milford Node operates at distress-asset cost." },
              { label: "The Immutable Toll",  value: "3% Global Tech Fee on every transaction through the ONYX rail. Permanent. Non-renegotiable. Compound-forever." },
              { label: "Dynasty-First",       value: "Every architectural decision is evaluated against a 100-year horizon, not a 5-year exit. This is not a startup. It is an institution." },
            ].map(d => (
              <div key={d.label} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full bg-[#C9A227] flex-shrink-0 mt-1.5" />
                <div>
                  <p className="text-xs font-black text-[#C9A227] mb-0.5">{d.label}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── The 8 Principles ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The 8 Principles — Calculated Through History's Greatest Minds</p>
          </div>
          <div className="space-y-2">
            {PRINCIPLES.map((p, i) => (
              <div
                key={p.name}
                className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedPrinciple(expandedPrinciple === i ? null : i)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black"
                    style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">{p.name}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{p.era}</p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-gray-600 flex-shrink-0 transition-transform"
                    style={{ transform: expandedPrinciple === i ? "rotate(90deg)" : "rotate(0)" }}
                  />
                </button>

                {expandedPrinciple === i && (
                  <div className="px-4 pb-5 border-t border-white/5">
                    <div className="pt-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: `${p.color}90` }}>Historical Principle</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{p.thesis}</p>
                      </div>
                      <div className="p-4 rounded-xl" style={{ background: `${p.color}08`, border: `1px solid ${p.color}20` }}>
                        <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: p.color }}>ONYX Application</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{p.onyxApplication}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 7-Agent Mesh ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The 7-Agent AI Mesh — The Brain · V2X Compliant · SAE J2735</p>
          </div>
          <div className="space-y-2">
            {AGENTS.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.02]">
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black"
                  style={{ background: `${a.color}12`, color: a.color, border: `1px solid ${a.color}20` }}
                >
                  {a.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-black text-white">{a.name}</p>
                    <AgentPulse color={a.color} active={a.status === "active"} />
                    <span className="text-[9px] font-bold" style={{ color: a.status === "active" ? a.color : "#6B7280" }}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{a.role}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-black" style={{ color: a.color }}>{a.actionsToday.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-600">today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Revenue Engine ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The Revenue Engine — The Heart · 4 Streams · 1 Flywheel</p>
          </div>
          <div className="space-y-3">
            {REVENUE_STREAMS.map(r => (
              <div key={r.name} className="p-5 rounded-2xl border border-white/8 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <p className="text-sm font-black text-white">{r.name}</p>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{r.mechanic}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: `${r.color}08`, border: `1px solid ${r.color}15` }}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: `${r.color}80` }}>At 100M Scale</p>
                    <p className="text-xs font-bold" style={{ color: r.color }}>{r.atScale}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Compound Factor</p>
                    <p className="text-xs text-gray-300">{r.compoundFactor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Math of Indefinite ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#34D399]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The Mathematics of Indefinite</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2 pr-4 text-[10px] font-bold text-gray-500">Year</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold text-gray-500">Members</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold text-gray-500">3% Fee ARR</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold text-gray-500">Data Vault</th>
                  <th className="text-right py-2 pl-3 text-[10px] font-bold text-gray-500">Platform Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { yr: "Now",  members: "12,841",    fee: "$3.1M",   vault: "$0.5M",  pv: "$31M" },
                  { yr: "Y1",   members: "100K",       fee: "$24M",    vault: "$4M",    pv: "$280M" },
                  { yr: "Y2",   members: "1M",         fee: "$240M",   vault: "$40M",   pv: "$2.8B" },
                  { yr: "Y3",   members: "10M",        fee: "$2.4B",   vault: "$400M",  pv: "$28B" },
                  { yr: "Y5",   members: "100M",       fee: "$60B",    vault: "$4B",    pv: "$640B+" },
                ].map((r, i) => (
                  <tr key={r.yr} className="border-b border-white/5 last:border-0" style={{ background: i === 0 ? "rgba(201,162,39,0.03)" : undefined }}>
                    <td className="py-3 pr-4 font-black text-xs" style={{ color: i === 0 ? "#C9A227" : "#9CA3AF" }}>
                      {r.yr} {i === 0 && <span className="text-[9px] font-normal text-gray-600">← today</span>}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300">{r.members}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#C9A227]">{r.fee}</td>
                    <td className="py-3 px-3 text-right text-[#A78BFA]">{r.vault}</td>
                    <td className="py-3 pl-3 text-right font-black text-white">{r.pv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Assumes $20K avg transaction/member/year · 2.3x referral multiplier · OEM data licensing at $40/vehicle/year. No advertising spend modeled — growth is apostolic.</p>
        </div>

        {/* ── The Flywheel ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Infinity className="w-4 h-4 text-[#60A5FA]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The Self-Accelerating Flywheel — Why It Cannot Be Stopped</p>
          </div>
          <div className="space-y-3">
            {[
              { n: "1", label: "Member joins via Ghost Gate referral",      result: "Network trust pre-established. Zero CAC.",                          color: "#C9A227" },
              { n: "2", label: "ONYX onboards, scans VIN, activates AI",    result: "Vehicle joins telemetry mesh. Data moat grows.",                    color: "#34D399" },
              { n: "3", label: "ONYX identifies and executes value",         result: "Member saves money. Trust established.",                            color: "#60A5FA" },
              { n: "4", label: "Member earns residual from their network",   result: "Economic alignment locked. Exit = income loss.",                    color: "#A78BFA" },
              { n: "5", label: "Member refers 2.3 new members",             result: "Flywheel turn. Network compounds.",                                 color: "#F59E0B" },
              { n: "6", label: "V2X telemetry grows → AI improves",         result: "Better AI → more value → more referrals. Accelerating curve.",      color: "#F87171" },
              { n: "∞", label: "The wheel never stops",                      result: "Every new member makes ONYX more valuable for all existing members.", color: "#E5E7EB" },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                  style={{ background: `${step.color}12`, color: step.color, border: `1px solid ${step.color}20` }}
                >
                  {step.n}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-xs font-bold text-white">{step.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{step.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Milford Node ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[#60A5FA]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The Milford Node — Physical Anchor · I-95 · Carnegie's Steel Mill</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Acquisition Model",   value: "Distress-asset. Dark Mitsubishi site. Zero premium. Zero inventory.",     color: "#C9A227" },
              { label: "Function",            value: "I-95 Verification Hub. High-velocity fulfillment. BGC specialist staging.", color: "#60A5FA" },
              { label: "Financial Structure", value: "100% digital closing. 0% inventory liability. Asset-light. Infinite scale.", color: "#34D399" },
            ].map(m => (
              <div key={m.label} className="p-4 rounded-xl border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: m.color }}>{m.label}</p>
                <p className="text-xs text-gray-300 leading-relaxed">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Member Covenant ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#C9A227]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">The Covenant — What ONYX Promises Every Participant · Immutable</p>
          </div>
          <div className="space-y-2">
            {COVENANTS.map((c, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: c.toWhom === "founder" ? "#C9A227" : c.toWhom === "member" ? "#34D399" : "#60A5FA" }}
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-200 leading-relaxed">{c.promise}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={
                        c.toWhom === "founder"
                          ? { background: "rgba(201,162,39,0.1)", color: "#C9A227" }
                          : c.toWhom === "member"
                          ? { background: "rgba(52,211,153,0.1)", color: "#34D399" }
                          : { background: "rgba(96,165,250,0.1)", color: "#60A5FA" }
                      }
                    >
                      {c.toWhom === "both" ? "FOUNDER + MEMBER" : c.toWhom.toUpperCase()}
                    </span>
                    {c.immutable && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/5 text-gray-500 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />IMMUTABLE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Global Deployment ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-[#A78BFA]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Global Deployment Sprint — 100M Driver Target</p>
          </div>
          <div className="space-y-2">
            {[
              { label: "V2X Interoperability",  detail: "SAE J2735 Standard compliant. Every ONYX vehicle speaks the same protocol as smart infrastructure globally.",             color: "#C9A227" },
              { label: "Government Bridge",     detail: "Direct API gateway for Law Enforcement (LEO). GSA/FBI/DOT audit-ready. Compliance Agent runs continuously.",              color: "#34D399" },
              { label: "National Sharding",     detail: "High-frequency database sharding architecture for 41% US driver saturation (132M licenses).",                            color: "#60A5FA" },
              { label: "Grant Engine",          detail: "ATTAIN + SMART grant proposals auto-generated by the Lobbyist Agent. Government funds the infrastructure expansion.",     color: "#A78BFA" },
              { label: "ITIN/Tax-ID Coverage",  detail: "Finance Agent verifies ITIN and Tax-ID for unbanked and underbanked members. 132M addressable regardless of credit.",   color: "#F59E0B" },
            ].map(g => (
              <div key={g.label} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: g.color }} />
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">{g.label}</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{g.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Platform DNA — Sovereign Blueprint ── */}
        <div className="rounded-2xl border border-[#FF2D9A]/15 bg-[#FF2D9A]/[0.02] p-5">
          <div className="flex items-center gap-2 mb-5">
            <Cpu className="w-4 h-4 text-[#FF2D9A]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Platform DNA — The Sovereign Blueprint</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-[#FF2D9A]/10 bg-[#FF2D9A]/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#FF2D9A] mb-2">RAM-1500 Infotainment Command</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                The platform was born on a Uconnect 12" display. Every ONYX function — deals, network, earnings, AI agents — runs natively from the dashboard. The truck IS the command center. Voice-first. Hands-free. Sovereign.
              </p>
            </div>
            <div className="rounded-xl border border-[#7B61FF]/10 bg-[#7B61FF]/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#7B61FF] mb-2">18-Agent Sovereign Mesh</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                7 C-Suite AI executives (CEO, CTO, CFO, COO, Content, BD, Legal) + 11 Book Doctrine agents (Blitzscaling, Lean Startup, Art of War, Rich Dad, and more). The AI runs the company.
              </p>
            </div>
            <div className="rounded-xl border border-[#C9A227]/10 bg-[#C9A227]/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#C9A227] mb-2">Sovereign Transactional Grid</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                3% platform commission on every transaction. Every vehicle type. Every service. Forever. At 100M members transacting $20K/year — $60B annual recurring revenue. The toll never stops.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <p className="text-[9px] text-white/20 font-bold tracking-wider">AGENT MESH STATUS — 18 AUTONOMOUS AGENTS</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/5">
              {[
                { name: "SOVEREIGN-1",  role: "CEO",        color: "#C9A227" },
                { name: "ARCHITECT-1",  role: "CTO",        color: "#00E5FF" },
                { name: "TREASURY-1",   role: "CFO",        color: "#4CAF50" },
                { name: "OPERATIONS-1", role: "COO",        color: "#FF9800" },
                { name: "SIGNAL-1",     role: "Content",    color: "#FF2D9A" },
                { name: "EXPANSION-1",  role: "BD",         color: "#7B61FF" },
                { name: "GUARDIAN-1",    role: "Legal",      color: "#F44336" },
                { name: "BLITZSCALE-1", role: "Velocity",   color: "#FF6B00" },
                { name: "LEAN-1",       role: "Innovation", color: "#2196F3" },
                { name: "SCROLLS-1",    role: "Sales",      color: "#FFD700" },
                { name: "COACH-1",      role: "Coaching",   color: "#9C27B0" },
                { name: "SPRINT-1",     role: "Execution",  color: "#00BCD4" },
                { name: "KATAMARI-1",   role: "Compound",   color: "#E91E63" },
                { name: "GRAHAM-1",     role: "Value",      color: "#1B5E20" },
                { name: "OCEAN-1",      role: "Blue Ocean", color: "#0277BD" },
                { name: "SUNZI-1",      role: "Strategy",   color: "#B71C1C" },
                { name: "KIYOSAKI-1",   role: "Assets",     color: "#6A1B9A" },
                { name: "HILL-1",       role: "Mastermind", color: "#FF8F00" },
              ].map(a => (
                <div key={a.name} className="p-2 text-center" style={{ background: "#0d0d10" }}>
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mb-1" style={{ backgroundColor: a.color, boxShadow: `0 0 6px ${a.color}40` }} />
                  <p className="text-[8px] font-bold text-white/60 truncate">{a.name}</p>
                  <p className="text-[7px] text-white/20">{a.role}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
            The Sovereign Blueprint is not a feature — it is the platform's constitutional DNA.
            RAM-1500 Infotainment → 18-Agent Mesh → Transactional Grid. This is how one person
            bootstraps a trillion-dollar network with under 10 people. The AI runs the company.
            RAC3C architects the vision.
          </p>
        </div>

        {/* ── The Seal ── */}
        <div
          className="rounded-2xl p-6 text-center border"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.06) 0%, rgba(0,0,0,0) 70%)", borderColor: "rgba(201,162,39,0.15)" }}
        >
          <Crown className="w-8 h-8 text-[#C9A227] mx-auto mb-4 opacity-80" />
          <p className="text-xs font-black tracking-[0.25em] text-[#C9A227]/60 uppercase mb-2">Founded & Sealed</p>
          <p className="text-xl font-black text-white mb-1">RAC3C</p>
          <p className="text-xs text-gray-500 mb-4">aka Ron3C · Founder & Chief Visionary Officer · CUXTOMCANDYCLUB LLC</p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent mx-auto mb-4" />
          <p className="text-[11px] text-gray-500 leading-relaxed max-w-md mx-auto">
            This foundation is not a document. It is an institution. Its principles are not aspirational — they are operational. Every line of code, every agent, every covenant, every revenue stream was calculated through the combined intelligence of history's most consequential builders and executed with absolute integrity.
          </p>
          <p className="text-[10px] text-gray-700 mt-4 font-mono">EXECUTE WITH ABSOLUTE INTEGRITY · [SYSTEM INITIALIZED]</p>
        </div>

      </div>
    </div>
  );
}
