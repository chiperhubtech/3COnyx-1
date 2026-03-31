/**
 * 3C ONYX — Neural Brain Command Center
 * ─────────────────────────────────────────────────────────────────────────────
 * Narrow × General × Generative × Agentic — all 4 types of AI, live.
 * Every call hits real Gemini. No mocks. No placeholders.
 *
 * CUXTOMCANDYCLUB LLC — Times 1,000,000.
 */

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Brain, Zap, Bot, Cpu, Sparkles, Target, TrendingUp,
  Activity, Play, CheckCircle2, Clock, AlertCircle,
  ChevronRight, RefreshCw, Users, Star, Crown,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface NeuralStatus {
  brain: string;
  capabilities: Record<string, { status: string; description: string }>;
  activeAgents: number;
  models: { reasoning: string; generation: string };
}

interface NeuralAgent {
  id: string;
  role: string;
  specialty: string;
  status: "idle" | "thinking" | "executing" | "complete" | "error";
  currentTask?: string;
  result?: string;
  steps: string[];
  startedAt: string;
  completedAt?: string;
}

/* ─── Mini Badge ──────────────────────────────────────────────────────────── */
function AIBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  );
}

/* ─── Live Pulse Dot ──────────────────────────────────────────────────────── */
function PulseDot({ color = "#10B981" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

/* ─── NARROW AI — Lead Scorer ──────────────────────────────────────────────── */
function NarrowAIPanel() {
  const [form, setForm] = useState({ responseTime: 8, creditScore: 700, tradeInValue: 5000, monthlyBudget: 600, priorPurchases: 1, source: "referral" });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function score() {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${BASE}/api/neural/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lead", data: form }),
      });
      setResult(await r.json() as Record<string, unknown>);
    } catch { /* ignore */ }
    setLoading(false);
  }

  const scoreVal = Number((result as { score?: number } | null)?.score ?? 0);
  const tier     = (result as { tier?: string } | null)?.tier ?? "";
  const tierColor = tier === "HOT" ? "#ef4444" : tier === "WARM" ? "#f97316" : tier === "COLD" ? "#60A5FA" : "#71717a";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-orange-400" />
        <span className="font-bold text-white text-sm">Lead Scoring Engine</span>
        <AIBadge label="Narrow AI" color="#F97316" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {([
          ["responseTime", "Response Time (min)", 0, 480],
          ["creditScore",  "Credit Score",        300, 850],
          ["tradeInValue", "Trade-In Value ($)",   0, 50000],
          ["monthlyBudget","Monthly Budget ($)",   200, 2000],
          ["priorPurchases","Prior Purchases",     0, 10],
        ] as [keyof typeof form, string, number, number][]).map(([k, label, min, max]) => (
          <div key={k}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-zinc-500">{label}</span>
              <span className="text-[10px] font-mono text-zinc-300">{form[k].toLocaleString()}</span>
            </div>
            <input type="range" min={min} max={max} value={form[k] as number}
              onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400 cursor-pointer" />
          </div>
        ))}
        <div>
          <div className="text-[10px] text-zinc-500 mb-1">Lead Source</div>
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 outline-none">
            {["referral", "organic", "social", "paid"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <button onClick={score} disabled={loading}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
        style={{ background: loading ? "#27272a" : "#F97316", color: "#000" }}>
        {loading ? "Scoring…" : "Run AI Score"}
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-black font-mono" style={{ color: tierColor }}>{scoreVal}/100</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: tierColor }}>{tier} LEAD</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-500">AI Action</div>
              <div className="text-xs text-zinc-200 font-medium max-w-32 text-right">{String((result as { action?: string }).action ?? "")}</div>
            </div>
          </div>
          <div className="space-y-1">
            {((result as { signals?: string[] }).signals ?? []).map((s: string, i: number) => (
              <div key={i} className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-orange-400 flex-shrink-0" />{s}
              </div>
            ))}
          </div>
          {(result as { aiCoaching?: string }).aiCoaching && (
            <div className="bg-orange-950/30 border border-orange-900/40 rounded-xl p-3">
              <div className="text-[9px] text-orange-400 font-mono mb-1 tracking-wider">AI COACHING</div>
              <p className="text-xs text-zinc-300 leading-relaxed">{String((result as { aiCoaching?: string }).aiCoaching)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── GENERATIVE AI — Content Factory ─────────────────────────────────────── */
function GenerativeAIPanel() {
  const [type, setType] = useState<string>("outreach");
  const [context, setContext] = useState(`{"name": "Marcus Williams", "role": "F&I Manager", "company": "AutoNation Broward", "referralLink": "https://cuxtomcandyclub.ai/join?ref=MARCUS-A1B2"}`);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const TYPES = [
    { id: "outreach",           label: "Outreach Message" },
    { id: "vehicle_description",label: "Vehicle Listing"  },
    { id: "deal_summary",       label: "Deal Summary"     },
    { id: "lead_followup",      label: "Lead Follow-Up"   },
    { id: "market_report",      label: "Market Report"    },
  ];

  async function generate() {
    setLoading(true); setResult("");
    try {
      let ctx: Record<string, unknown> = {};
      try { ctx = JSON.parse(context); } catch { ctx = { text: context }; }
      const r = await fetch(`${BASE}/api/neural/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context: ctx }),
      });
      const d = await r.json() as { content?: string };
      setResult(d.content ?? "");
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="font-bold text-white text-sm">Content Factory</span>
        <AIBadge label="Generative AI" color="#A78BFA" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: type === t.id ? "#A78BFA20" : "#18181b", color: type === t.id ? "#A78BFA" : "#71717a", border: `1px solid ${type === t.id ? "#A78BFA40" : "#27272a"}` }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <div className="text-[10px] text-zinc-500 mb-1.5 font-mono">CONTEXT (JSON or text)</div>
        <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-xs p-3 font-mono outline-none resize-none" />
      </div>

      <button onClick={generate} disabled={loading}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all mb-4"
        style={{ background: loading ? "#27272a" : "#A78BFA", color: "#000" }}>
        {loading ? "Generating with Gemini…" : "✦ Generate"}
      </button>

      {result && (
        <div className="bg-violet-950/30 border border-violet-900/40 rounded-xl p-4">
          <div className="text-[9px] text-violet-400 font-mono mb-2 tracking-wider">GENERATED BY GEMINI</div>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

/* ─── AGENTIC AI — Agent Spawner ───────────────────────────────────────────── */
function AgenticPanel() {
  const [agents, setAgents] = useState<NeuralAgent[]>([]);
  const [role, setRole] = useState("BDC AI Agent");
  const [task, setTask] = useState("Analyze the incoming lead pipeline and identify the top 3 high-probability deals. Create a follow-up sequence for each with personalized messaging.");
  const [loading, setLoading] = useState(false);

  const PRESET_AGENTS = [
    { role: "BDC AI Agent",        task: "Analyze the lead pipeline. Score every pending lead. Create personalized follow-up sequences for the top 5 hot leads." },
    { role: "F&I Intelligence Agent", task: "Evaluate the current deal structure. Identify product penetration gaps. Recommend GAP, VSC, and ancillary products per buyer profile." },
    { role: "Market Intel Agent",   task: "Analyze current market conditions for the I-95 corridor. Identify pricing opportunities. Flag any competitor promotions in the last 30 days." },
    { role: "I-95 Dynasty Agent",   task: "Map Ron's professional network. Identify the top 20 contacts most likely to join as Founding Members. Generate outreach priority order with reasoning." },
    { role: "Dealer Pilot Agent",   task: "Evaluate all 5 target founding dealers. Score each on: relationship strength, product fit, conversion probability. Recommend which to approach first." },
  ];

  async function spawnAgent() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/neural/agents/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, task }),
      });
      const d = await r.json() as { agentId?: string };
      if (d.agentId) {
        setAgents(prev => [{ id: d.agentId ?? "", role, specialty: task, status: "thinking", steps: [], startedAt: new Date().toISOString() }, ...prev]);
        pollAgent(d.agentId);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  function pollAgent(id: string) {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/api/neural/agents/${id}`);
        const agent = await r.json() as NeuralAgent;
        setAgents(prev => prev.map(a => a.id === id ? agent : a));
        if (agent.status === "complete" || agent.status === "error") clearInterval(interval);
      } catch { clearInterval(interval); }
    }, 2000);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-4 h-4 text-emerald-400" />
        <span className="font-bold text-white text-sm">Autonomous Agents</span>
        <AIBadge label="Agentic AI" color="#10B981" />
        {agents.filter(a => a.status === "thinking").length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <PulseDot color="#10B981" />
            <span className="text-[10px] text-emerald-400 font-mono">{agents.filter(a => a.status === "thinking").length} RUNNING</span>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_AGENTS.map(p => (
          <button key={p.role} onClick={() => { setRole(p.role); setTask(p.task); }}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-800 border border-zinc-700 transition-all">
            {p.role}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-3">
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="Agent role…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 text-sm px-3 py-2 outline-none" />
        <textarea value={task} onChange={e => setTask(e.target.value)} rows={2} placeholder="Agent mission…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 text-xs px-3 py-2 outline-none font-mono resize-none" />
      </div>

      <button onClick={spawnAgent} disabled={loading || !role || !task}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all mb-4"
        style={{ background: loading ? "#27272a" : "#10B981", color: "#000" }}>
        {loading ? "Spawning…" : "⚡ Spawn Autonomous Agent"}
      </button>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {agents.map(agent => (
          <div key={agent.id} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {agent.status === "thinking" && <PulseDot color="#10B981" />}
                {agent.status === "complete" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {agent.status === "error"    && <AlertCircle  className="w-3 h-3 text-red-400" />}
                <span className="text-xs font-bold text-zinc-200">{agent.role}</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: agent.status === "complete" ? "#10B98120" : agent.status === "thinking" ? "#C9A22720" : "#27272a", color: agent.status === "complete" ? "#10B981" : agent.status === "thinking" ? "#C9A227" : "#71717a" }}>
                {agent.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mb-2 line-clamp-2">{agent.specialty}</p>
            {agent.steps.slice(0, 4).map((step, i) => (
              <div key={i} className="text-[10px] font-mono text-emerald-400/80 mb-0.5 flex items-start gap-1">
                <ChevronRight className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" /><span>{step}</span>
              </div>
            ))}
            {agent.status === "thinking" && (
              <div className="text-[9px] text-zinc-600 font-mono animate-pulse mt-1">Gemini reasoning autonomously…</div>
            )}
          </div>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs">No agents spawned yet. Select a preset or write a custom mission.</div>
        )}
      </div>
    </div>
  );
}

/* ─── GENERAL AI — Strategy Brain ─────────────────────────────────────────── */
function GeneralAIPanel() {
  const [question, setQuestion] = useState("We have 1,247 members but 0 paying dealers. What is the single highest-leverage action Ron should take in the next 7 days to close the first founding dealer and prove the flywheel?");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const PRESETS = [
    "We have 1,247 members but 0 paying dealers. What is the single highest-leverage action Ron should take in the next 7 days to close the first founding dealer?",
    "How should 3C ONYX price the founding member tier to maximize both short-term revenue and long-term referral virality?",
    "Design the I-95 referral program structure so that every industry professional is financially incentivized to bring in 10 contacts within 30 days.",
    "3C ONYX vs AAA. Where are we stronger right now, where are we weaker, and what should we build next to close the gap fastest?",
    "What is the exact pitch to give a GM of a 10-rooftop dealer group to sign a 90-day founding pilot with zero upfront cost?",
  ];

  async function think() {
    setLoading(true); setResult("");
    try {
      const r = await fetch(`${BASE}/api/neural/think`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, role: "chief_strategist", context: "CUXTOMCANDYCLUB LLC, 3C ONYX platform, automotive ecosystem OS, 1247 current members, 0 paying dealers, I-95 Dynasty network, Ron as founder" }),
      });
      const d = await r.json() as { response?: string };
      setResult(d.response ?? "");
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-blue-400" />
        <span className="font-bold text-white text-sm">Strategy Brain</span>
        <AIBadge label="General AI" color="#60A5FA" />
        <span className="ml-auto text-[9px] font-mono text-blue-400/60">Gemini 3.1 Pro</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.slice(0, 3).map((p, i) => (
          <button key={i} onClick={() => setQuestion(p)}
            className="text-[9px] bg-zinc-800 text-zinc-500 hover:text-blue-400 hover:border-blue-900 border border-zinc-700 rounded-lg px-2 py-1 transition-all font-mono line-clamp-1 max-w-full text-left">
            {p.slice(0, 55)}…
          </button>
        ))}
      </div>

      <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 text-sm px-3 py-2.5 outline-none resize-none mb-3"
        placeholder="Ask the brain anything about the platform, strategy, market, or Ron's next move…" />

      <button onClick={think} disabled={loading || !question}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all mb-4"
        style={{ background: loading ? "#27272a" : "#60A5FA", color: "#000" }}>
        {loading ? "Gemini is thinking deeply…" : "∞  Ask the Brain"}
      </button>

      {loading && (
        <div className="text-center py-6">
          <div className="text-xs text-blue-400/60 font-mono animate-pulse">Gemini 3.1 Pro · Deep reasoning active · Complex multi-domain analysis…</div>
        </div>
      )}

      {result && (
        <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4">
          <div className="text-[9px] text-blue-400 font-mono mb-2 tracking-wider">GEMINI 3.1 PRO — STRATEGIC ANALYSIS</div>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function ONYXBrain() {
  const [status, setStatus] = useState<NeuralStatus | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/neural/status`).then(r => r.json()).then(d => setStatus(d as NeuralStatus)).catch(() => null);
  }, []);

  const AI_TYPES = [
    { label: "Narrow AI",    color: "#F97316", icon: Target,   desc: "Automotive-specific models. Lead scoring, vehicle appraisal, fraud detection, BDC intelligence." },
    { label: "Generative AI",color: "#A78BFA", icon: Sparkles, desc: "Content at scale. Personalized outreach, vehicle descriptions, deal summaries, market reports." },
    { label: "Agentic AI",   color: "#10B981", icon: Bot,      desc: "Autonomous execution. Multi-step agents that plan, decide, and act without human intervention." },
    { label: "General AI",   color: "#60A5FA", icon: Brain,    desc: "Complex reasoning. Strategy, competitive analysis, market intelligence. Powered by Gemini 3.1 Pro." },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--onyx-page-bg)" }}>
      <PageHeader
        title="ONYX Neural Brain"
        subtitle="Narrow × General × Generative × Agentic — all 4 types, live"
        icon={Brain}
        accent="#C9A227"
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* ── Status Header ─────────────────────────────────────────── */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-black text-white text-base">3C ONYX Neural Intelligence</div>
                <div className="text-[10px] font-mono text-zinc-500 tracking-widest">CUXTOMCANDYCLUB LLC · POWERED BY GEMINI</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PulseDot color="#10B981" />
              <span className="text-xs font-mono text-emerald-400">{status ? "BRAIN ONLINE" : "CONNECTING…"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AI_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                    <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.label}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <PulseDot color={t.color} />
                    <span className="text-[9px] font-mono text-zinc-500">ACTIVE</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
          </div>

          {status && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500">
              <span>REASONING MODEL: <span className="text-blue-400">{status.models?.reasoning}</span></span>
              <span>GENERATION MODEL: <span className="text-violet-400">{status.models?.generation}</span></span>
              <span>ACTIVE AGENTS: <span className="text-emerald-400">{status.activeAgents}</span></span>
            </div>
          )}
        </div>

        {/* ── Power Statement ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-yellow-950/30 via-zinc-900 to-blue-950/30 border border-zinc-800 rounded-2xl p-6 text-center">
          <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white mb-2">
            CUXTOMCANDYCLUB × 3C ONYX
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
            Every interaction on this platform runs through 4 layers of AI simultaneously.
            Narrow intelligence scores your leads. Generative intelligence writes your outreach.
            Agentic intelligence executes multi-step workflows autonomously.
            General intelligence advises Ron's next move at the $30B level.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-mono text-yellow-500 tracking-widest">TIMES 1,000,000</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
        </div>

        {/* ── 4 AI Panels — 2×2 grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <NarrowAIPanel />
          <GenerativeAIPanel />
          <AgenticPanel />
          <GeneralAIPanel />
        </div>

      </div>
    </div>
  );
}
