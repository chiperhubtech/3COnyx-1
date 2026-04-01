import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen, Plus, Send, Brain, Sparkles, FileText, TrendingUp,
  Car, Shield, DollarSign, Trash2, Clock, ChevronRight,
  Lightbulb, Target, Zap, RotateCcw, Copy, Check,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

interface NotebookEntry {
  id: string;
  title: string;
  type: "research" | "deal-intel" | "market" | "strategy" | "custom";
  query: string;
  response: string;
  timestamp: number;
  sources?: string[];
}

const ENTRY_TYPES = [
  { id: "deal-intel", label: "Deal Intelligence", icon: DollarSign, accent: "#C9A227", prompt: "Analyze this deal opportunity and provide intelligence on pricing, market position, and negotiation leverage:" },
  { id: "market", label: "Market Research", icon: TrendingUp, accent: "#34D399", prompt: "Provide comprehensive market research and analysis on:" },
  { id: "research", label: "Vehicle Research", icon: Car, accent: "#4FC3F7", prompt: "Research this vehicle thoroughly — specs, reliability, market value, common issues, and buyer recommendations:" },
  { id: "strategy", label: "Business Strategy", icon: Target, accent: "#8B5CF6", prompt: "Analyze this business strategy question for an automotive platform aiming for $251B dynasty valuation:" },
  { id: "custom", label: "Custom Query", icon: Lightbulb, accent: "#F59E0B", prompt: "" },
] as const;

const STARTER_PROMPTS = [
  { label: "Analyze EV market trends for 2026", type: "market" as const, icon: TrendingUp },
  { label: "Best negotiation tactics for trade-ins", type: "deal-intel" as const, icon: DollarSign },
  { label: "Compare Tesla Model 3 vs BMW i4", type: "research" as const, icon: Car },
  { label: "How to scale a referral network to 1M users", type: "strategy" as const, icon: Target },
  { label: "Insurance optimization for fleet vehicles", type: "deal-intel" as const, icon: Shield },
  { label: "Luxury automotive market positioning strategy", type: "strategy" as const, icon: Sparkles },
];

export default function NotebookPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotebookEntry[]>(() => {
    try {
      const stored = localStorage.getItem("onyx-notebook-entries");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedType, setSelectedType] = useState<typeof ENTRY_TYPES[number]["id"]>("custom");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("onyx-notebook-entries", JSON.stringify(entries));
    } catch {}
  }, [entries]);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamingText]);

  const generateResponse = useCallback(async (query: string, type: string) => {
    setIsGenerating(true);
    setStreamingText("");

    const typeConfig = ENTRY_TYPES.find(t => t.id === type);
    const systemPrompt = `You are ONYX Intelligence — the premium AI knowledge engine powering the 3C ONYX Sovereign Automotive Ecosystem OS. You provide deep, actionable intelligence for automotive industry professionals and consumers.

Your responses should be:
- Comprehensive yet concise
- Data-driven with specific numbers when possible
- Actionable with clear recommendations
- Formatted with clear sections using markdown-style headers
- Professional and authoritative

Context: The user "${user?.name || "Member"}" is using the ONYX Notebook for ${typeConfig?.label || "research"}. ONYX is a $251B dynasty-class automotive platform founded by Ronald Antonio Cadet. The platform unifies Sales, Service, Parts, Insurance, and Lenders into a single coordination engine.`;

    const fullPrompt = typeConfig?.prompt
      ? `${typeConfig.prompt}\n\n${query}`
      : query;

    try {
      const token = localStorage.getItem("3c_auth_token");
      const res = await fetch(`${API}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: fullPrompt,
          systemPrompt,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const data = await res.json();
      const responseText = data.response || data.text || data.content || "No response generated.";

      const newEntry: NotebookEntry = {
        id: `nb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: query.slice(0, 80) + (query.length > 80 ? "..." : ""),
        type: type as NotebookEntry["type"],
        query,
        response: responseText,
        timestamp: Date.now(),
      };

      setEntries(prev => [newEntry, ...prev]);
      setActiveEntry(newEntry.id);
      setStreamingText(responseText);
    } catch (err) {
      setStreamingText("ONYX Intelligence encountered an issue processing this request. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const handleSubmit = () => {
    if (!input.trim() || isGenerating) return;
    generateResponse(input.trim(), selectedType);
    setInput("");
  };

  const handleStarterClick = (prompt: string, type: string) => {
    setSelectedType(type as any);
    setInput(prompt);
    setTimeout(() => {
      generateResponse(prompt, type);
    }, 100);
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (activeEntry === id) {
      setActiveEntry(null);
      setStreamingText("");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeEntryData = entries.find(e => e.id === activeEntry);

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--onyx-page-bg)" }}>
      <div style={{
        width: 280,
        borderRight: "1px solid var(--onyx-border-line)",
        display: "flex",
        flexDirection: "column",
        background: "rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}
        className="hidden md:flex"
      >
        <div style={{ padding: "20px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={16} style={{ color: "#fff" }} />
            </div>
            <div>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 800, color: "var(--onyx-text-primary)",
                letterSpacing: "0.08em", lineHeight: 1,
              }}>ONYX NOTEBOOK</h2>
              <p style={{ fontSize: 9, color: "var(--onyx-gold)", letterSpacing: "0.14em", fontWeight: 700, marginTop: 2 }}>
                AI INTELLIGENCE HUB
              </p>
            </div>
          </div>

          <button
            onClick={() => { setActiveEntry(null); setStreamingText(""); setInput(""); }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: "#8B5CF6",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            <Plus size={14} /> NEW RESEARCH
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px", scrollbarWidth: "thin" }}>
          {entries.length === 0 ? (
            <div style={{ padding: "20px 12px", textAlign: "center" }}>
              <Brain size={24} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>No research yet</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.12)", marginTop: 4 }}>Start by asking ONYX anything</p>
            </div>
          ) : entries.map(entry => {
            const typeConfig = ENTRY_TYPES.find(t => t.id === entry.type);
            const Icon = typeConfig?.icon || FileText;
            const isActive = activeEntry === entry.id;
            return (
              <div
                key={entry.id}
                onClick={() => {
                  setActiveEntry(entry.id);
                  setStreamingText(entry.response);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 2,
                  background: isActive ? "rgba(139,92,246,0.08)" : "transparent",
                  border: isActive ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Icon size={12} style={{ color: typeConfig?.accent || "#C9A227", marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                      fontWeight: isActive ? 600 : 400, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{entry.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 9, color: typeConfig?.accent || "#C9A227", fontWeight: 600, letterSpacing: "0.06em" }}>
                        {typeConfig?.label || "Research"}
                      </span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)" }}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: 0.3 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.3"; }}
                  >
                    <Trash2 size={11} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeEntry && !isGenerating ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(201,162,39,0.1) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Sparkles size={28} style={{ color: "#C9A227" }} />
            </div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 28, fontWeight: 900, color: "var(--onyx-text-primary)",
              letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.1,
            }}>
              ONYX NOTEBOOK
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 6, maxWidth: 400, lineHeight: 1.5 }}>
              Your premium AI intelligence hub. Research vehicles, analyze deals, explore market trends, and develop strategy — powered by the ONYX Neural Engine.
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 20, maxWidth: 560 }}>
              {ENTRY_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 20,
                      background: isSelected ? `${type.accent}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? `${type.accent}40` : "rgba(255,255,255,0.06)"}`,
                      color: isSelected ? type.accent : "rgba(255,255,255,0.4)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <Icon size={12} /> {type.label}
                  </button>
                );
              })}
            </div>

            <div style={{
              width: "100%", maxWidth: 560, marginTop: 20,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{ position: "relative" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                  placeholder="Ask ONYX Intelligence anything..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "transparent",
                    border: "none",
                    color: "var(--onyx-text-primary)",
                    fontSize: 14,
                    resize: "none",
                    outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isGenerating}
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 10,
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: input.trim()
                      ? "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)"
                      : "rgba(255,255,255,0.06)",
                    border: "none",
                    cursor: input.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <Send size={14} style={{ color: input.trim() ? "#000" : "rgba(255,255,255,0.2)" }} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 24, width: "100%", maxWidth: 560 }}>
              <p style={{
                fontSize: 9, color: "rgba(255,255,255,0.18)", fontWeight: 700,
                letterSpacing: "0.2em", marginBottom: 10,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>SUGGESTED RESEARCH</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {STARTER_PROMPTS.map((prompt, i) => {
                  const Icon = prompt.icon;
                  const typeConfig = ENTRY_TYPES.find(t => t.id === prompt.type);
                  return (
                    <button
                      key={i}
                      onClick={() => handleStarterClick(prompt.label, prompt.type)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = `${typeConfig?.accent || "#C9A227"}40`;
                        (e.currentTarget as HTMLButtonElement).style.background = `${typeConfig?.accent || "#C9A227"}08`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
                      }}
                    >
                      <Icon size={13} style={{ color: typeConfig?.accent || "#C9A227", marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>{prompt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p style={{
              fontSize: 9, color: "rgba(255,255,255,0.1)", marginTop: 24,
              letterSpacing: "0.1em", fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              POWERED BY ONYX NEURAL ENGINE &middot; CUXTOMCANDYCLUB LLC
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--onyx-border-line)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}>
              <button
                onClick={() => { setActiveEntry(null); setStreamingText(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.3)", padding: 4,
                }}
              >
                <RotateCcw size={14} />
              </button>
              {activeEntryData && (() => {
                const typeConfig = ENTRY_TYPES.find(t => t.id === activeEntryData.type);
                const Icon = typeConfig?.icon || FileText;
                return (
                  <>
                    <Icon size={14} style={{ color: typeConfig?.accent || "#C9A227" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: "var(--onyx-text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{activeEntryData.title}</p>
                      <p style={{ fontSize: 9, color: typeConfig?.accent || "#C9A227", letterSpacing: "0.08em", fontWeight: 600 }}>
                        {typeConfig?.label} &middot; {new Date(activeEntryData.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </>
                );
              })()}
              {activeEntryData && (
                <button
                  onClick={() => handleCopy(activeEntryData.response, activeEntryData.id)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    cursor: "pointer",
                    padding: "5px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                  }}
                >
                  {copied === activeEntryData.id ? <Check size={11} style={{ color: "#34D399" }} /> : <Copy size={11} />}
                  {copied === activeEntryData.id ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div
              ref={responseRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                scrollbarWidth: "thin",
              }}
            >
              {isGenerating && !streamingText && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(139,92,246,0.1) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "pulse 1.5s infinite",
                  }}>
                    <Brain size={16} style={{ color: "#C9A227" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                      ONYX Intelligence is analyzing...
                    </p>
                    <p style={{ fontSize: 9, color: "var(--onyx-gold)", letterSpacing: "0.1em", fontWeight: 600, marginTop: 2 }}>
                      NEURAL ENGINE PROCESSING
                    </p>
                  </div>
                </div>
              )}
              {streamingText && (
                <div
                  style={{
                    color: "var(--onyx-text-primary)",
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatResponse(streamingText),
                  }}
                />
              )}
            </div>

            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--onyx-border-line)",
              flexShrink: 0,
            }}>
              <div style={{
                display: "flex",
                gap: 8,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "4px",
              }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
                  }}
                  placeholder="Follow-up question..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    color: "var(--onyx-text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isGenerating}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: input.trim()
                      ? "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: "none",
                    cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Send size={13} style={{ color: input.trim() ? "#000" : "rgba(255,255,255,0.15)" }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatResponse(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/^### (.+)$/gm, '<h3 style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:#C9A227;letter-spacing:0.06em;margin:20px 0 8px;line-height:1.2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:800;color:#C9A227;letter-spacing:0.06em;margin:24px 0 10px;line-height:1.2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:Barlow Condensed,sans-serif;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.06em;margin:0 0 12px;line-height:1.2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:rgba(255,255,255,0.7)">$1</em>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px"><span style="color:#C9A227;font-size:8px;margin-top:6px">●</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, (_, content, offset, str) => {
      const before = str.slice(0, offset);
      const num = (before.match(/^\d+\. /gm) || []).length + 1;
      return `<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px"><span style="color:#C9A227;font-weight:700;font-size:12px;min-width:16px">${num}.</span><span>${content}</span></div>`;
    })
    .replace(/\n\n/g, '<div style="height:12px"></div>')
    .replace(/\n/g, '<br/>');
}
