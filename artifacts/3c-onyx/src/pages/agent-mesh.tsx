import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Network, Send, Zap, CheckCircle2, Clock, ArrowRight, Cpu, Shield, TrendingUp, DollarSign, Wrench, Package, Car, MapPin, Users, BadgeCheck, ChevronDown, ChevronUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Agent {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  color: string;
  status: string;
  actionsToday: number;
  successRate: number;
  isAiPowered: boolean;
  capabilities: string[];
  handoffTargets: string[];
  futureReady: string[];
}

interface MeshAction {
  id: string;
  ts: string;
  agentId: string;
  agentName: string;
  action: string;
  detail: string;
  outcome: string;
}

interface ChatMessage {
  role: "user" | "onyx";
  text: string;
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  ts: string;
}

const DOMAIN_ICONS: Record<string, any> = {
  core: Zap,
  automotive: Car,
  financial: DollarSign,
  operations: MapPin,
  intelligence: Cpu,
};

const AGENT_ICONS: Record<string, any> = {
  concierge: Zap,
  deal: Car,
  service: Wrench,
  parts: Package,
  finance: DollarSign,
  insurance: Shield,
  roadside: MapPin,
  runner: Users,
  partner: BadgeCheck,
  payout: DollarSign,
  trust: Shield,
  growth: TrendingUp,
};

export default function AgentMesh() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [actions, setActions] = useState<MeshAction[]>([]);
  const [summary, setSummary] = useState({ totalAgents: 12, activeAgents: 0, totalActionsToday: 0, avgSuccessRate: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "onyx",
      text: "ONYX Agent Mesh is live. All 12 agents are standing by. Tell me what you need — I'll route it to the right agent instantly.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [expandLog, setExpandLog] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
    fetchLog();
    const interval = setInterval(() => { fetchLog(); }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchStatus() {
    try {
      const res = await fetch(`${BASE}/api/mesh/status`);
      const data = await res.json();
      if (data.ok) {
        setAgents(data.agents);
        setSummary({
          totalAgents: data.totalAgents,
          activeAgents: data.activeAgents,
          totalActionsToday: data.totalActionsToday,
          avgSuccessRate: data.avgSuccessRate,
        });
      }
    } catch {}
  }

  async function fetchLog() {
    try {
      const res = await fetch(`${BASE}/api/mesh/log`);
      const data = await res.json();
      if (data.ok) setActions(data.actions);
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMsg, ts: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(`${BASE}/api/mesh/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "onyx",
            text: data.reply,
            agentId: data.routedTo?.id,
            agentName: data.routedTo?.name,
            agentColor: data.routedTo?.color,
            ts: new Date().toISOString(),
          },
        ]);
        fetchLog();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "onyx", text: "ONYX is processing your request. All agents are standing by.", ts: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  const gold = "#C9A227";

  return (
    <div className="min-h-screen bg-[#050510] text-white pb-20">
      <PageHeader
        title="ONYX Agent Mesh"
        subtitle="12 AI agents · fully connected · ONYX acts, you confirm"
        icon={Network}
        badge="LIVE"
        accent={gold}
      />

      {/* ── Summary Bar ─────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Agents", value: summary.totalAgents, color: gold },
            { label: "Active Now", value: summary.activeAgents, color: "#34D399" },
            { label: "Actions Today", value: summary.totalActionsToday.toLocaleString(), color: "#60A5FA" },
            { label: "Avg Success", value: `${summary.avgSuccessRate}%`, color: "#A78BFA" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/3 p-3 text-center">
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-white/35 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Agent Grid ─────────────────────────────────── */}
        <div className="lg:col-span-2">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
            Agent Network — Click any agent to inspect
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {agents.map((agent) => {
              const Icon = AGENT_ICONS[agent.id] || Cpu;
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(isSelected ? null : agent)}
                  className="rounded-xl border text-left p-3 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? agent.color : "rgba(255,255,255,0.06)",
                    background: isSelected
                      ? `${agent.color}12`
                      : "rgba(255,255,255,0.02)",
                    boxShadow: isSelected ? `0 0 20px ${agent.color}20` : "none",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${agent.color}18` }}
                    >
                      <Icon size={14} style={{ color: agent.color }} />
                    </div>
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: agent.status === "active" ? "#34D399" : agent.status === "standby" ? "#F59E0B" : "#555",
                        boxShadow: agent.status === "active" ? "0 0 6px #34D399" : "none",
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-white leading-tight mb-0.5">{agent.name}</p>
                  <p className="text-[9px] text-white/30 leading-tight mb-2 line-clamp-2">{agent.tagline}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px]" style={{ color: agent.color }}>
                      {agent.actionsToday} actions
                    </span>
                    <span className="text-[9px] text-white/30">{agent.successRate}%</span>
                  </div>
                  {agent.isAiPowered && (
                    <div
                      className="mt-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded inline-block"
                      style={{ color: gold, background: `${gold}14` }}
                    >
                      AI
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Agent Detail Panel */}
          {selectedAgent && (
            <div
              className="rounded-2xl border p-4 mb-4"
              style={{ borderColor: `${selectedAgent.color}40`, background: `${selectedAgent.color}08` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-black text-white text-sm">{selectedAgent.name}</h3>
                  <p className="text-[10px] text-white/40">{selectedAgent.tagline}</p>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Capabilities</p>
                  {selectedAgent.capabilities.map((c) => (
                    <div key={c} className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={9} style={{ color: selectedAgent.color }} />
                      <span className="text-[10px] text-white/70">{c}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Future Ready</p>
                  {selectedAgent.futureReady.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 mb-1">
                      <Zap size={9} style={{ color: gold }} />
                      <span className="text-[10px] text-white/50">{f}</span>
                    </div>
                  ))}
                  {selectedAgent.handoffTargets.length > 0 && (
                    <>
                      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1.5 mt-3">Handoff To</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedAgent.handoffTargets.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded"
                            style={{ background: `${selectedAgent.color}20`, color: selectedAgent.color }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Trust Agent Log ──────────────────────────────── */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-3">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setExpandLog(!expandLog)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" style={{ boxShadow: "0 0 6px #60A5FA" }} />
                <span className="text-[10px] uppercase tracking-widest text-white/40">Trust Agent — Live Action Log</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">{actions.length} entries</span>
              </div>
              {expandLog ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
            </button>

            {expandLog && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                {actions.length === 0 ? (
                  <p className="text-[10px] text-white/25 text-center py-4">No actions logged yet</p>
                ) : (
                  actions.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 py-1 border-b border-white/4 last:border-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: a.outcome === "success" ? "#34D399" : a.outcome === "pending" ? "#F59E0B" : "#60A5FA",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-white/60">{a.agentName}</span>
                          <ArrowRight size={8} className="text-white/20" />
                          <span className="text-[9px] text-white/40">{a.action}</span>
                        </div>
                        {a.detail && (
                          <p className="text-[9px] text-white/25 truncate">{a.detail}</p>
                        )}
                      </div>
                      <span className="text-[8px] text-white/20 flex-shrink-0">
                        {new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: AI Concierge Chat ──────────────────────── */}
        <div className="flex flex-col">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
            AI Concierge — Ask Anything
          </p>
          <div
            className="flex-1 rounded-2xl border overflow-hidden flex flex-col"
            style={{
              borderColor: `${gold}30`,
              background: "rgba(201,162,39,0.03)",
              minHeight: "520px",
            }}
          >
            {/* Chat header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: `${gold}15`, background: `${gold}08` }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${gold}20` }}>
                <Zap size={15} style={{ color: gold }} />
              </div>
              <div>
                <p className="text-xs font-black text-white">ONYX</p>
                <p className="text-[9px] text-white/35">All 12 agents · always on</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px #34D399" }} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "380px" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3 py-2.5"
                    style={{
                      background:
                        msg.role === "user"
                          ? `${gold}22`
                          : "rgba(255,255,255,0.05)",
                      border: msg.role === "user" ? `1px solid ${gold}35` : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {msg.agentName && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: msg.agentColor || gold }}
                        />
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: msg.agentColor || gold }}
                        >
                          {msg.agentName}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-white/85 leading-relaxed">{msg.text}</p>
                    <p className="text-[8px] text-white/20 mt-1">
                      {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 border border-white/7 bg-white/4">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <div
                          key={d}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: gold, animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {[
                "Find me a vehicle under $40K",
                "Book a runner to pick up my car",
                "Check my referral earnings",
                "I need roadside help now",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[9px] px-2 py-1 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: `${gold}15` }}>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Tell ONYX what you need…"
                  className="flex-1 bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-[11px] text-white placeholder-white/25 outline-none focus:border-yellow-600/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: gold }}
                >
                  <Send size={14} color="#000" />
                </button>
              </div>
              <p className="text-[8px] text-white/15 text-center mt-2 tracking-wide">
                ONYX ACTS · MEMBER CONFIRMS · ALL ACTIONS LOGGED BY TRUST AGENT
              </p>
            </div>
          </div>

          {/* Agent Domain Legend */}
          <div className="mt-4 rounded-xl border border-white/5 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">Agent Domains</p>
            <div className="space-y-1.5">
              {[
                { domain: "Core", color: "#C9A227", agents: "Concierge" },
                { domain: "Automotive", color: "#3B82F6", agents: "Deal · Service · Parts" },
                { domain: "Financial", color: "#10B981", agents: "Finance · Insurance · Payout" },
                { domain: "Operations", color: "#F59E0B", agents: "Roadside · Runner · Partner" },
                { domain: "Intelligence", color: "#60A5FA", agents: "Trust · Growth" },
              ].map((d) => (
                <div key={d.domain} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[9px] font-bold" style={{ color: d.color }}>{d.domain}</span>
                  <span className="text-[9px] text-white/25">{d.agents}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Future Ready Banner */}
          <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "#8B5CF620", background: "#8B5CF608" }}>
            <p className="text-[9px] uppercase tracking-widest text-purple-400 mb-1">Future Ready</p>
            <div className="flex flex-wrap gap-1">
              {["AR/VR Customization", "NVIDIA SDV", "Predictive AI", "Blockchain", "DeFi", "Voice Command"].map((f) => (
                <span key={f} className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
