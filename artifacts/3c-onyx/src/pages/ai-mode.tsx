import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles, Send, ArrowLeft, Loader2, ChevronRight,
  Zap, Shield, Car, DollarSign, Wrench, Truck,
  TrendingUp, Radio, Activity, Hash, RotateCcw,
  Brain, Network, Globe, Clock,
} from "lucide-react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A85D";
const PINK = "#FF2D9A";
const PURPLE = "#7B61FF";
const CYAN = "#00E5FF";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  routedTo?: { id: string; name: string; color: string; tagline: string };
  relatedTopics?: string[];
  proofHash?: string;
}

interface Suggestion {
  text: string;
  category: string;
}

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("3c_auth_token");
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers as Record<string, string> ?? {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

const CATEGORY_ICONS: Record<string, typeof Car> = {
  valuation: DollarSign, search: Car, customize: Wrench, safety: Shield,
  deal: Zap, finance: TrendingUp, market: Globe, insurance: Shield,
  logistics: Truck, default: Sparkles,
};

function OnyxLogo({ size = 40 }: { size?: number }) {
  const r = size * 0.375;
  const cx = size / 2;
  const cy = size / 2;
  const forkAngle = Math.PI / 5;

  const fingerLen = r * 0.85;
  const gapBottom = r * 0.25;
  const baseY = cy + gapBottom;
  const tipY = baseY - fingerLen;

  const dx = Math.sin(forkAngle) * fingerLen;
  const dy = Math.cos(forkAngle) * fingerLen;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="ai-logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.3" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 6} fill="url(#ai-logo-glow)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.6" />
      <line x1={cx} y1={baseY} x2={cx} y2={tipY} stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={baseY} x2={cx - dx} y2={baseY - dy} stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx} y1={baseY} x2={cx + dx} y2={baseY - dy} stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      <text x={size * 0.3} y={size * 0.78} fontFamily="'Barlow Condensed', sans-serif" fontSize={size * 0.22} fontWeight="900" fill={GOLD}>3</text>
      <text x={size * 0.58} y={size * 0.78} fontFamily="'Barlow Condensed', sans-serif" fontSize={size * 0.22} fontWeight="900" fill="#fff">C</text>
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0" }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: GOLD, opacity: 0.4,
            animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let processed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

      const isBullet = /^[\s]*[-•*]\s/.test(line);
      const isNumbered = /^[\s]*\d+[.)]\s/.test(line);
      const isHeader = /^#+\s/.test(line);

      if (isHeader) {
        processed = processed.replace(/^#+\s*/, "");
        return (
          <div key={i} style={{
            fontSize: 15, fontWeight: 800, color: GOLD,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.04em", margin: "12px 0 6px",
          }} dangerouslySetInnerHTML={{ __html: processed }} />
        );
      }

      if (isBullet || isNumbered) {
        return (
          <div key={i} style={{
            display: "flex", gap: 8, padding: "3px 0", paddingLeft: 4,
          }}>
            <span style={{ color: GOLD, flexShrink: 0, fontSize: 12, marginTop: 2 }}>
              {isNumbered ? line.match(/^\s*(\d+[.)])/)?.[1] : "•"}
            </span>
            <span
              style={{ flex: 1, lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: processed.replace(/^[\s]*[-•*\d.)]+\s*/, "") }}
            />
          </div>
        );
      }

      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;

      return <div key={i} style={{ lineHeight: 1.7, margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end", marginBottom: 24,
        animation: "msg-in 0.3s ease-out both",
      }}>
        <div style={{
          maxWidth: "75%", padding: "14px 18px", borderRadius: "20px 20px 4px 20px",
          background: `linear-gradient(135deg, ${GOLD}20 0%, ${GOLD}10 100%)`,
          border: `0.5px solid ${GOLD}30`,
          fontSize: 15, color: "#fff", lineHeight: 1.6,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: 28,
      animation: "msg-in 0.4s ease-out both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 10,
          background: "rgba(201,168,93,0.1)", border: `0.5px solid ${GOLD}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={13} style={{ color: GOLD }} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: GOLD,
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.1em",
        }}>
          ONYX AI
        </span>
        {msg.routedTo && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
            background: `${msg.routedTo.color}12`,
            border: `0.5px solid ${msg.routedTo.color}25`,
            color: msg.routedTo.color,
          }}>
            {msg.routedTo.name}
          </span>
        )}
      </div>

      <div style={{
        padding: "18px 22px", borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "0.5px solid rgba(201,168,93,0.12)",
        fontSize: 14, color: "rgba(255,255,255,0.75)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(201,168,93,0.02) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {formatText(msg.text)}
        </div>
      </div>

      {msg.relatedTopics && msg.relatedTopics.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {msg.relatedTopics.map(topic => (
            <span key={topic} style={{
              fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
              background: "rgba(123,97,255,0.06)",
              border: "0.5px solid rgba(123,97,255,0.15)",
              color: "rgba(123,97,255,0.7)",
              letterSpacing: "0.03em",
            }}>
              {topic}
            </span>
          ))}
        </div>
      )}

      {msg.proofHash && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginTop: 8, opacity: 0.3,
        }}>
          <Hash size={9} />
          <span style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.05em" }}>
            {msg.proofHash.slice(0, 16)}...
          </span>
        </div>
      )}

      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

export default function AiModePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    apiFetch("/ai-mode/suggestions").then(d => setSuggestions(d.suggestions || [])).catch(() => {});
    apiFetch("/ai-mode/status").then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch("/ai-mode/query", {
        method: "POST",
        body: JSON.stringify({ message: text.trim(), sessionId }),
      });

      if (data.sessionId) setSessionId(data.sessionId);

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply,
        timestamp: new Date(),
        routedTo: data.routedTo,
        relatedTopics: data.relatedTopics,
        proofHash: data.proofHash,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: "assistant",
        text: `Connection interrupted. ONYX is re-routing your request. Stand by.`,
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  }, [loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const isConversationActive = messages.length > 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      color: "#fff",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(123,97,255,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(201,168,93,0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 90%, rgba(255,45,154,0.02) 0%, transparent 40%)
        `,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        padding: "12px 20px",
        borderBottom: "0.5px solid rgba(201,168,93,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setLocation("/")} style={{
            background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
            padding: 4,
          }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: CYAN,
              boxShadow: `0 0 8px ${CYAN}60`,
              animation: "status-blink 2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 13, fontWeight: 800, color: GOLD,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.12em",
            }}>
              ONYX AI MODE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {status && (
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              background: "rgba(0,229,255,0.06)", border: "0.5px solid rgba(0,229,255,0.15)",
              color: CYAN, letterSpacing: "0.06em",
            }}>
              {status.agentsOnline} AGENTS LIVE
            </span>
          )}
          {isConversationActive && (
            <button onClick={handleNewSession} style={{
              background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "5px 8px", cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
            }}>
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", position: "relative", zIndex: 1,
        paddingBottom: 120,
      }}>
        {!isConversationActive ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 180px)",
            padding: "40px 20px",
          }}>
            <div style={{ position: "relative", marginBottom: 28 }}>
              <div style={{
                position: "absolute", inset: -30,
                background: `radial-gradient(circle, ${GOLD}10 0%, transparent 70%)`,
                animation: "ambient-breathe 4s ease-in-out infinite",
              }} />
              <OnyxLogo size={64} />
            </div>

            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 32, fontWeight: 900, letterSpacing: "0.04em",
              margin: "0 0 8px", textAlign: "center",
              background: `linear-gradient(135deg, ${GOLD} 0%, #D4B76A 50%, ${GOLD} 100%)`,
              backgroundClip: "text", WebkitBackgroundClip: "text",
              color: "transparent",
            }}>
              Ask ONYX anything.
            </h1>

            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.35)",
              textAlign: "center", maxWidth: 420, lineHeight: 1.6,
              margin: "0 0 40px",
            }}>
              The world's most advanced Automotive Intelligence Engine.
              Powered by a {status?.agents || 12}-agent mesh.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 10, width: "100%", maxWidth: 560,
            }}>
              {suggestions.map((s, i) => {
                const Icon = CATEGORY_ICONS[s.category] || CATEGORY_ICONS.default;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    style={{
                      padding: "14px 16px", borderRadius: 16, textAlign: "left",
                      background: "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "0.5px solid rgba(201,168,93,0.1)",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 12,
                      color: "#fff",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${GOLD}35`;
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,93,0.05)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,93,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: `${GOLD}08`, border: `0.5px solid ${GOLD}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} style={{ color: GOLD, opacity: 0.7 }} />
                    </div>
                    <span style={{
                      fontSize: 13, color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.4,
                    }}>
                      {s.text}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: 50, display: "flex", gap: 24,
              justifyContent: "center", flexWrap: "wrap",
            }}>
              {[
                { icon: Brain, label: "Neural AI", sub: "Gemini-powered" },
                { icon: Network, label: "12-Agent Mesh", sub: "Full coverage" },
                { icon: Shield, label: "Proof Engine", sub: "SHA-256 sealed" },
              ].map(f => (
                <div key={f.label} style={{
                  display: "flex", alignItems: "center", gap: 8, opacity: 0.25,
                }}>
                  <f.icon size={13} />
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>{f.label}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>{f.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 10,
                  background: "rgba(201,168,93,0.1)", border: `0.5px solid ${GOLD}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "energy-pulse 2s ease-in-out infinite",
                }}>
                  <Sparkles size={13} style={{ color: GOLD }} />
                </div>
                <TypingIndicator />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
                  ONYX is thinking...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "16px 20px 24px",
        background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 30%, #000 100%)",
      }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "0.5px solid rgba(201,168,93,0.15)",
          borderRadius: 20, padding: "4px 4px 4px 16px",
          display: "flex", alignItems: "flex-end", gap: 8,
          transition: "border-color 0.3s, box-shadow 0.3s",
          boxShadow: loading
            ? `0 0 20px rgba(201,168,93,0.08), 0 0 40px rgba(0,229,255,0.04)`
            : "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ONYX anything about automotive..."
            rows={1}
            style={{
              flex: 1, padding: "12px 0", background: "transparent",
              border: "none", color: "#fff", fontSize: 15,
              outline: "none", resize: "none",
              fontFamily: "inherit", lineHeight: 1.5,
              maxHeight: 120, overflowY: "auto",
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 14, flexShrink: 0,
              background: input.trim() && !loading
                ? `linear-gradient(135deg, ${GOLD}, #8B6914)`
                : "rgba(255,255,255,0.05)",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              marginBottom: 2,
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" style={{ color: GOLD }} />
            ) : (
              <Send size={16} style={{
                color: input.trim() ? "#000" : "rgba(255,255,255,0.2)",
              }} />
            )}
          </button>
        </div>

        <div style={{
          textAlign: "center", marginTop: 8,
          fontSize: 9, color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.1em",
        }}>
          3C ONYX AI MODE — CUXTOMCANDYCLUB LLC — Architect: Ronald Antonio Cadet
        </div>
      </div>

      <style>{`
        @keyframes ambient-breathe {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes energy-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(201,168,93,0.1); }
          50%      { box-shadow: 0 0 20px rgba(201,168,93,0.25); }
        }
      `}</style>
    </div>
  );
}
