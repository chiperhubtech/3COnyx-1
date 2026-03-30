/**
 * 3C ONYX — Human Agent Handoff Component
 * ─────────────────────────────────────────
 * Renders inside the AIConcierge when a human ONYX specialist takes over.
 *
 * Three phases (mirroring the Namecheap specialist protocol Ron showed):
 *
 *   READING  → "A specialist is reviewing your conversation…"  (animated dots)
 *   BRIEFED  → "Your specialist is ready — connecting you now"
 *   LIVE     → Full bidirectional chat with specialist name + avatar
 *
 * Platform philosophy: ONYX acts; member confirms.
 * Specialist protocol: read first, clarify second, act third.
 */

import { useState, useEffect, useRef } from "react";
import { User, BookOpen, CheckCircle2, MessageSquare, Send } from "lucide-react";

interface HumanAgentMessage {
  id:        string;
  from:      "agent" | "member";
  content:   string;
  ts:        string;
  agentName?: string;
}

interface HumanAgent {
  agentId:    string;
  agentName:  string;
  joinedAt:   string;
  phase:      "reading" | "briefed" | "live";
  briefedAt?: string;
  liveAt?:    string;
  messages:   HumanAgentMessage[];
}

interface Props {
  escalationId:  string;
  humanAgent:    HumanAgent;
  sessionId?:    string;
  memberId?:     number;
  onNewMessage?: (msg: HumanAgentMessage) => void;
}

const BASE = (import.meta as { env: Record<string, string> }).env.BASE_URL?.replace(/\/$/, "") ?? "";

export function HumanAgentHandoff({ escalationId, humanAgent, onNewMessage }: Props) {
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [messages, setMessages] = useState<HumanAgentMessage[]>(humanAgent.messages);
  const [phase,    setPhase]    = useState(humanAgent.phase);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll for new messages + phase changes while live/briefed
  useEffect(() => {
    if (phase === "reading") return;
    const iv = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE}/api/escalation/${escalationId}/thread`);
        const data = await res.json() as { phase: string; messages: HumanAgentMessage[] };
        setPhase(data.phase as HumanAgent["phase"]);
        setMessages(data.messages);
      } catch { /* ignore */ }
    }, 2500);
    return () => clearInterval(iv);
  }, [escalationId, phase]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE}/api/escalation/${escalationId}/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: input.trim(), from: "member" }),
      });
      const data = await res.json() as { message: HumanAgentMessage };
      setMessages(prev => [...prev, data.message]);
      setInput("");
      onNewMessage?.(data.message);
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  // ── READING PHASE ─────────────────────────────────────────────────────────
  if (phase === "reading") {
    return (
      <div style={{
        margin: "8px 0", padding: "14px 16px",
        borderRadius: 14, background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <User size={14} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4FC", letterSpacing: "0.03em" }}>
              {humanAgent.agentName}
            </div>
            <div style={{ fontSize: 10, color: "rgba(165,180,252,0.6)" }}>
              ONYX Specialist · Joined
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            <BookOpen size={11} style={{ color: "#6366F1" }} />
            <span style={{ fontSize: 10, color: "#6366F1", fontWeight: 600 }}>REVIEWING</span>
          </div>
        </div>

        <div style={{
          padding: "10px 13px", borderRadius: 10,
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.15)",
          fontSize: 13, color: "#E5E7EB", lineHeight: "1.55",
          marginBottom: 10,
        }}>
          {messages[0]?.content ?? `Hello! I'm ${humanAgent.agentName} and I'll be assisting you. Please allow me a moment to review your conversation — I want to make sure I have full context before we continue.`}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(165,180,252,0.7)" }}>
            Specialist is reading your conversation
          </span>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            {[0, 0.25, 0.5].map((delay, i) => (
              <span key={i} style={{
                display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                background: "#6366F1", opacity: 0.7,
                animation: `hitl-dot 1.2s ${delay}s infinite`,
              }} />
            ))}
          </span>
        </div>

        <style>{`
          @keyframes hitl-dot {
            0%,60%,100% { transform: translateY(0); opacity: 0.4; }
            30%          { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── BRIEFED PHASE ─────────────────────────────────────────────────────────
  if (phase === "briefed") {
    return (
      <div style={{
        margin: "8px 0", padding: "14px 16px",
        borderRadius: 14, background: "rgba(16,185,129,0.07)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#10B981,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle2 size={14} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6EE7B7" }}>
              {humanAgent.agentName} · Ready
            </div>
            <div style={{ fontSize: 10, color: "rgba(110,231,183,0.6)" }}>
              Specialist has reviewed your full context — connecting you now
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIVE PHASE ────────────────────────────────────────────────────────────
  return (
    <div style={{
      margin: "8px 0", borderRadius: 14,
      background: "rgba(99,102,241,0.05)",
      border: "1px solid rgba(99,102,241,0.2)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(99,102,241,0.12)",
        background: "rgba(99,102,241,0.08)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <User size={13} style={{ color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A5B4FC" }}>
            {humanAgent.agentName}
          </div>
          <div style={{ fontSize: 9, color: "rgba(165,180,252,0.55)" }}>
            ONYX SPECIALIST · LIVE
          </div>
        </div>
        <div style={{
          marginLeft: "auto", width: 7, height: 7, borderRadius: "50%",
          background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.6)",
          animation: "hitl-pulse 2s infinite",
        }} />
      </div>

      {/* Message thread */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.from === "member" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "82%", padding: "8px 12px",
              borderRadius: msg.from === "member" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.from === "member"
                ? "linear-gradient(135deg,#F59E0B,#D97706)"
                : "rgba(99,102,241,0.15)",
              border: msg.from === "agent" ? "1px solid rgba(99,102,241,0.2)" : "none",
              fontSize: 12, lineHeight: "1.5",
              color: msg.from === "member" ? "#000" : "#E5E7EB",
              fontWeight: msg.from === "member" ? 500 : 400,
            }}>
              {msg.from === "agent" && (
                <div style={{ fontSize: 9, color: "#A5B4FC", fontWeight: 700, marginBottom: 3 }}>
                  {msg.agentName?.toUpperCase()}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div style={{
        padding: "8px 12px",
        borderTop: "1px solid rgba(99,102,241,0.12)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}>
          <MessageSquare size={11} style={{ color: "#6366F1", flexShrink: 0 }} />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendReply(); } }}
            placeholder="Reply to specialist…"
            disabled={sending}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 12, color: "#fff", opacity: sending ? 0.5 : 1,
            }}
          />
          <button
            onClick={() => void sendReply()}
            disabled={!input.trim() || sending}
            style={{
              width: 26, height: 26, borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: input.trim() && !sending ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "rgba(255,255,255,0.06)",
              opacity: !input.trim() || sending ? 0.4 : 1, transition: "all 0.15s",
            }}>
            <Send size={11} style={{ color: input.trim() && !sending ? "#fff" : "#6B7280" }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes hitl-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
