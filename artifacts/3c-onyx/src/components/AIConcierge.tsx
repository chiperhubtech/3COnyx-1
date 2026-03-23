import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Sparkles, Send, ChevronDown, Car, Zap, MapPin, RotateCcw,
  AlertTriangle, CheckCircle2, Wrench, DollarSign, ArrowRight,
  Brain, Route, Shield,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  diagnostic?: DiagnosticResult;
  intent?: IntentResult;
  reward?: RewardResult;
}

interface DiagnosticResult {
  vehicle: string;
  problemType: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  costRangeMin: number;
  costRangeMax: number;
  serviceType: string;
  recommendedAction: string;
  runnerBooked?: boolean;
}

interface IntentResult {
  intent: string;
  confidence: number;
  urgency: string;
  routeTo: string;
  summary: string;
}

interface RewardResult {
  rewardId: string;
  amount: number;
  rewardType: string;
  vehicle: string;
  fromName: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const URGENCY_CONFIG = {
  LOW:      { color: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)",  label: "LOW" },
  MEDIUM:   { color: "#C9A227", bg: "rgba(201,162,39,0.08)",  border: "rgba(201,162,39,0.2)",  label: "MEDIUM" },
  HIGH:     { color: "#F97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)",  label: "HIGH" },
  CRITICAL: { color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", label: "CRITICAL" },
};

const INTENT_COLORS: Record<string, string> = {
  DIAGNOSTIC:    "#F97316",
  MARKETPLACE:   "#34D399",
  LOGISTICS:     "#4FC3F7",
  FINANCIAL:     "#C9A227",
  GARAGE:        "#A78BFA",
  WATCHLIST:     "#F472B6",
  NOTIFICATIONS: "#94A3B8",
  GENERAL:       "#9CA3AF",
};

const QUICK_CHIPS = [
  { label: "Diagnose my vehicle", icon: Wrench },
  { label: "Book a Runner", icon: MapPin },
  { label: "My car won't start", icon: Zap },
  { label: "Browse luxury inventory", icon: Sparkles },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

function DiagnosticCard({ d }: { d: DiagnosticResult }) {
  const cfg = URGENCY_CONFIG[d.urgency] || URGENCY_CONFIG.MEDIUM;
  return (
    <div style={{
      margin: "6px 0",
      borderRadius: 12,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wrench size={12} style={{ color: cfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.08em" }}>
              AI DIAGNOSTIC
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
            color: cfg.color, background: `${cfg.color}15`,
            padding: "2px 7px", borderRadius: 20, border: `1px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 5, marginBottom: 0 }}>{d.problemType}</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{d.vehicle}</p>
      </div>

      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>EST. COST RANGE</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
            ${d.costRangeMin.toLocaleString()} – ${d.costRangeMax.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>SERVICE TYPE</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>{d.serviceType}</p>
        </div>
      </div>

      <div style={{ padding: "8px 12px", borderTop: `1px solid ${cfg.border}`, display: "flex", alignItems: "flex-start", gap: 6 }}>
        <ArrowRight size={11} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, margin: 0 }}>{d.recommendedAction}</p>
      </div>

      {d.runnerBooked && (
        <div style={{ padding: "6px 12px", background: "rgba(52,211,153,0.06)", borderTop: "1px solid rgba(52,211,153,0.15)", display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={10} style={{ color: "#34D399" }} />
          <span style={{ fontSize: 10, color: "#34D399", fontWeight: 600 }}>Runner booked automatically — track on Logistics</span>
        </div>
      )}
    </div>
  );
}

function IntentChip({ d }: { d: IntentResult }) {
  const color = INTENT_COLORS[d.intent] || "#9CA3AF";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20, marginBottom: 6,
      background: `${color}10`, border: `1px solid ${color}25`,
    }}>
      <Route size={10} style={{ color }} />
      <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: "0.1em" }}>
        ROUTING → {d.intent}
      </span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
        {Math.round((d.confidence || 0.92) * 100)}% confidence
      </span>
    </div>
  );
}

function RewardChip({ d }: { d: RewardResult }) {
  return (
    <div style={{
      margin: "6px 0",
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(201,162,39,0.07)",
      border: "1px solid rgba(201,162,39,0.25)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <DollarSign size={14} style={{ color: "#C9A227" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#C9A227", margin: 0 }}>You earned ${d.amount}</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          From: {d.fromName} · {d.vehicle}
        </p>
        <p style={{ fontSize: 9, color: "rgba(201,162,39,0.45)", margin: "1px 0 0", fontFamily: "monospace" }}>{d.rewardId}</p>
      </div>
    </div>
  );
}

export function RewardToast() {
  const [toast, setToast] = useState<RewardResult | null>(null);
  const [visible, setVisible] = useState(false);
  const lastSeenRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/rewards/events`);
      if (!res.ok) return;
      const data: { events: RewardResult[] } = await res.json();
      if (!data.events?.length) return;
      const newest = data.events[0];
      if (!newest || newest.rewardId === lastSeenRef.current) return;
      lastSeenRef.current = newest.rewardId;
      setToast(newest);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setToast(null), 400);
      }, 7000);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 4000);
    return () => { clearInterval(id); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [poll]);

  if (!toast) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, right: 80, zIndex: 9999,
      transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
    }}>
      <div style={{
        width: 296, borderRadius: 16,
        border: "1px solid rgba(201,162,39,0.4)",
        background: "#0f0e09",
        boxShadow: "0 0 40px rgba(201,162,39,0.18), 0 12px 40px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #C9A227, transparent)" }} />
        <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <DollarSign size={18} style={{ color: "#C9A227" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#C9A227", letterSpacing: "0.1em" }}>REWARD EARNED</span>
              <button onClick={() => { setVisible(false); setTimeout(() => setToast(null), 400); }}
                style={{ color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={12} />
              </button>
            </div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>
              +${toast.amount.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              From: {toast.fromName}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {toast.vehicle}
            </p>
          </div>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.03)", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            background: "rgba(201,162,39,0.5)",
            animation: "reward-drain 7s linear forwards",
          }} />
        </div>
      </div>
      <style>{`
        @keyframes reward-drain {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [garageVehicles, setGarageVehicles] = useState<Vehicle[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [routingIntent, setRoutingIntent] = useState<IntentResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch(`${BASE}/api/garage/vehicles`)
      .then((r) => r.json())
      .then((d: { vehicles: Vehicle[] }) => setGarageVehicles(d.vehicles ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open && conversationId === null) initConversation();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  async function initConversation() {
    try {
      const res = await fetch(`${BASE}/api/gemini/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Master Concierge Session" }),
      });
      const data = await res.json();
      setConversationId(data.id);
      setMessages([{
        id: generateId(),
        role: "assistant",
        content: garageVehicles.length > 0
          ? `Welcome back. I can see your ${garageVehicles.map((v) => `${v.year} ${v.make} ${v.model}`).join(" and ")} in your garage. I'm your Master AI Concierge — I diagnose, route, and resolve any automotive need. What's going on?`
          : "Welcome to 3C Onyx. I'm ONYX — your Master AI Concierge. I diagnose vehicle issues, book Runners, find your next luxury vehicle, and optimize every transaction. What can I help you with?",
      }]);
    } catch {
      setMessages([{
        id: generateId(),
        role: "assistant",
        content: "Welcome to 3C Onyx. I'm ONYX — your Master AI Concierge. How can I assist you today?",
      }]);
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || conversationId === null) return;

      const userMsg: Message = { id: generateId(), role: "user", content: text };
      const assistantId = generateId();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);
      setRoutingIntent(null);

      try {
        const res = await fetch(`${BASE}/api/gemini/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, garageVehicles }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let diagnostic: DiagnosticResult | undefined;
        let intentResult: IntentResult | undefined;
        let rewardResult: RewardResult | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.done) break;
              if (payload.content) {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId
                    ? { ...m, content: m.content + payload.content }
                    : m
                  )
                );
              }
              if (payload.toolResult?.name === "run_diagnostic") {
                try {
                  const d = JSON.parse(payload.toolResult.output);
                  if (d.aiDiagnostic) diagnostic = d as DiagnosticResult;
                } catch { /* skip */ }
              }
              if (payload.toolResult?.name === "classify_intent") {
                try {
                  const d = JSON.parse(payload.toolResult.output);
                  if (d.classified) {
                    intentResult = d as IntentResult;
                    setRoutingIntent(d);
                  }
                } catch { /* skip */ }
              }
              if (payload.toolResult?.name === "trigger_reward") {
                try {
                  const d = JSON.parse(payload.toolResult.output);
                  if (d.rewardId) rewardResult = d as RewardResult;
                } catch { /* skip */ }
              }
            } catch { /* skip malformed */ }
          }
        }

        setMessages((prev) =>
          prev.map((m) => m.id === assistantId
            ? { ...m, streaming: false, diagnostic, intent: intentResult, reward: rewardResult }
            : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId
            ? { ...m, content: "I'm having trouble connecting. Please try again.", streaming: false }
            : m
          )
        );
      } finally {
        setIsStreaming(false);
        setRoutingIntent(null);
      }
    },
    [conversationId, garageVehicles, isStreaming]
  );

  function handleReset() {
    setConversationId(null);
    setMessages([]);
    setRoutingIntent(null);
    initConversation();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Master AI Concierge"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 50,
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          boxShadow: pulse
            ? "0 0 0 0 rgba(245,158,11,0.7)"
            : "0 8px 32px rgba(245,158,11,0.4)",
          animation: pulse ? "concierge-pulse 1.5s ease-out 3" : undefined,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.3s",
        }}
      >
        {open ? <ChevronDown size={22} style={{ color: "#000" }} /> : <Sparkles size={22} style={{ color: "#000" }} />}
      </button>

      <div style={{
        position: "fixed", bottom: 88, right: 24, zIndex: 50,
        width: 400, maxWidth: "calc(100vw - 24px)",
        height: 580, maxHeight: "calc(100vh - 120px)",
        transform: open ? "scale(1)" : "scale(0)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transformOrigin: "bottom right",
        borderRadius: 18,
        background: "#0e0e11",
        border: "1px solid rgba(245,158,11,0.25)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.08)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 14px", flexShrink: 0,
          background: "linear-gradient(90deg, #120f00 0%, #160d02 100%)",
          borderBottom: "1px solid rgba(245,158,11,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(245,158,11,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Brain size={15} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em" }}>ONYX</span>
                <span style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: "0.12em",
                  color: "#F59E0B", background: "rgba(245,158,11,0.1)",
                  padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)",
                }}>MASTER AI</span>
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>
                Diagnostic · Routing · Rewards
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {routingIntent && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 8,
                background: `${INTENT_COLORS[routingIntent.intent] || "#9CA3AF"}12`,
                border: `1px solid ${INTENT_COLORS[routingIntent.intent] || "#9CA3AF"}25`,
              }}>
                <Shield size={9} style={{ color: INTENT_COLORS[routingIntent.intent] || "#9CA3AF" }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: INTENT_COLORS[routingIntent.intent] || "#9CA3AF", letterSpacing: "0.08em" }}>
                  {routingIntent.intent}
                </span>
              </div>
            )}
            <button onClick={handleReset} title="New conversation"
              style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
              <RotateCcw size={13} />
            </button>
            <button onClick={() => setOpen(false)}
              style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "none" }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.intent && <IntentChip d={msg.intent} />}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginBottom: 2,
                    background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Brain size={10} style={{ color: "#F59E0B" }} />
                  </div>
                )}
                {(msg.content || msg.streaming) && (
                  <div style={{
                    maxWidth: "80%", padding: "9px 13px", fontSize: 13, lineHeight: "1.55",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg,#F59E0B,#D97706)"
                      : "rgba(255,255,255,0.055)",
                    color: msg.role === "user" ? "#000" : "#E5E7EB",
                    fontWeight: msg.role === "user" ? 500 : 400,
                  }}>
                    {msg.content || (msg.streaming && (
                      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                        <span className="typing-dot" />
                        <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                        <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.diagnostic && <div style={{ marginTop: 6, width: "90%" }}><DiagnosticCard d={msg.diagnostic} /></div>}
              {msg.reward && <div style={{ marginTop: 6, width: "85%" }}><RewardChip d={msg.reward} /></div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 12px 8px", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
            {QUICK_CHIPS.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => sendMessage(label)} disabled={isStreaming}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "#F59E0B", fontSize: 11, fontWeight: 600,
                  opacity: isStreaming ? 0.5 : 1, transition: "all 0.15s",
                }}>
                <Icon size={10} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              disabled={isStreaming}
              placeholder="What's going on with your vehicle?"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 13, color: "#fff", opacity: isStreaming ? 0.5 : 1,
              }}
            />
            <button onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              style={{
                width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: input.trim() && !isStreaming
                  ? "linear-gradient(135deg,#F59E0B,#D97706)"
                  : "rgba(255,255,255,0.08)",
                opacity: !input.trim() || isStreaming ? 0.4 : 1,
                transition: "all 0.2s",
              }}>
              <Send size={13} style={{ color: input.trim() && !isStreaming ? "#000" : "#6B7280" }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 5, gap: 4 }}>
            <Car size={8} style={{ color: "rgba(255,255,255,0.15)" }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em" }}>
              DIAGNOSE · ROUTE · REWARD · SECURE
            </span>
            <Shield size={8} style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes concierge-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(245,158,11,0.7); }
          70%  { box-shadow: 0 0 0 18px rgba(245,158,11,0);   }
          100% { box-shadow: 0 0 0 0   rgba(245,158,11,0);   }
        }
        .typing-dot {
          display: inline-block; width: 6px; height: 6px;
          border-radius: 50%; background: #9CA3AF;
          animation: typing-bounce 1.2s infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
