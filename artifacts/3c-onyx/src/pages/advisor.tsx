import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, Send, Loader2, TrendingDown, Tag, Shield, DollarSign,
  AlertTriangle, Copy, CheckCircle2, ChevronDown, SlidersHorizontal,
  Bookmark, BookmarkCheck, ArrowUpRight, Zap, BadgeCheck, Calendar,
  Gauge, MapPin, X, Info, BarChart3, FileText, MessageSquare,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A85D";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Intent {
  id: string;
  title: string;
  subtitle: string;
  seedPrompt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  routedTo?: { name: string; color: string; tagline: string; confidence: number };
  relatedTopics?: string[];
  proofHash?: string;
}

interface EnrichedListing {
  id: string;
  heading: string;
  price: number;
  miles: number;
  year: number;
  make: string;
  model: string;
  exterior_color?: string;
  city?: string;
  state?: string;
  dom?: number;
  vin: string;
  media?: { photo_links?: string[] };
  seller?: { name?: string };
  market_avg?: number;
  guardian_health_score?: number;
  club_price?: number;
  savings_vs_retail?: number;
  wholesale_potential?: boolean;
  dealer_discount?: number;
  platform_fee?: number;
  rank?: number;
  pick_score?: number;
  pick_reason?: string;
}

interface QuoteAuditResult {
  audit: {
    verdict: "FAIR" | "NEGOTIABLE" | "OVERPRICED";
    verdictSummary: string;
    estimatedOverchargeUsd: number;
    lineItems: Array<{
      item: string;
      quotedUsd: number;
      assessment: "fair" | "high" | "junk_fee" | "unknown";
      note: string;
    }>;
    redFlags: string[];
    negotiationScript: string[];
    fairTargetUsd: number;
  };
  proofHash: string;
}

interface AdvisorPrefs {
  budgetMin?: number;
  budgetMax?: number;
  bodyStyle?: string;
  zip?: string;
}

type DealTab = "market" | "picks";
type SortKey = "price" | "savings" | "score";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getPrefs(): AdvisorPrefs {
  try {
    const raw = localStorage.getItem("onyx_advisor_prefs");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrefs(prefs: AdvisorPrefs) {
  try {
    localStorage.setItem("onyx_advisor_prefs", JSON.stringify(prefs));
  } catch {}
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  // Safe inline renderer: converts **bold** / *italic* markdown into React
  // elements without ever injecting raw HTML (LLM output is untrusted).
  const renderInline = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) nodes.push(text.slice(last, m.index));
      if (m[1] !== undefined) {
        nodes.push(<strong key={k++} style={{ color: "#fff", fontWeight: 700 }}>{m[1]}</strong>);
      } else {
        nodes.push(<em key={k++}>{m[2]}</em>);
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  };

  const formatText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const isBullet = /^[\s]*[-•*]\s/.test(line);
      const isNumbered = /^[\s]*\d+[.)]\s/.test(line);

      if (isBullet || isNumbered) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, padding: "3px 0" }}>
            <span style={{ color: GOLD, flexShrink: 0, fontSize: 12 }}>
              {isNumbered ? line.match(/^\s*(\d+[.)])/)?.[1] : "•"}
            </span>
            <span style={{ flex: 1, lineHeight: 1.6 }}>
              {renderInline(line.replace(/^[\s]*[-•*\d.)]+\s*/, ""))}
            </span>
          </div>
        );
      }

      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;

      return <div key={i} style={{ lineHeight: 1.7 }}>{renderInline(line)}</div>;
    });
  };

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <div style={{
          maxWidth: "75%", padding: "12px 16px", borderRadius: "18px 18px 4px 18px",
          background: `linear-gradient(135deg, ${GOLD}20 0%, ${GOLD}10 100%)`,
          border: `0.5px solid ${GOLD}30`,
          fontSize: 14, color: "#fff", lineHeight: 1.6,
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: "rgba(201,168,93,0.1)", border: `0.5px solid ${GOLD}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={11} style={{ color: GOLD }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: GOLD,
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: "0.1em",
        }}>
          ONYX ADVISOR
        </span>
      </div>

      <div style={{
        padding: "16px 18px", borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "0.5px solid rgba(201,168,93,0.12)",
        fontSize: 13, color: "rgba(255,255,255,0.75)",
      }}>
        {formatText(msg.text)}
      </div>

      {msg.relatedTopics && msg.relatedTopics.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {msg.relatedTopics.map(topic => (
            <span key={topic} style={{
              fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              background: "rgba(123,97,255,0.06)",
              border: "0.5px solid rgba(123,97,255,0.15)",
              color: "rgba(123,97,255,0.7)",
            }}>
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Intent Cards ─────────────────────────────────────────────────────────────

function IntentCards({ intents, onSelect }: { intents: Intent[]; onSelect: (intent: Intent) => void }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 12,
    }}>
      {intents.map((intent) => (
        <button
          key={intent.id}
          onClick={() => onSelect(intent)}
          style={{
            padding: "14px 16px", borderRadius: 14, textAlign: "left",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(201,168,93,0.1)",
            cursor: "pointer", transition: "all 0.2s",
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
          <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 4 }}>
            {intent.title}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            {intent.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onWatch, watched }: {
  deal: EnrichedListing;
  onWatch: (d: EnrichedListing) => void;
  watched: boolean;
}) {
  const location = [deal.city, deal.state].filter(Boolean).join(", ");
  const hasWholesale = deal.wholesale_potential && deal.club_price != null;

  return (
    <div
      style={{
        borderRadius: 16, overflow: "hidden",
        background: hasWholesale
          ? "linear-gradient(160deg, rgba(14,14,20,0.98) 0%, rgba(10,10,16,1) 100%)"
          : "rgba(10,10,16,0.98)",
        border: hasWholesale
          ? "1px solid rgba(201,162,39,0.22)"
          : "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.2s",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
        {deal.media?.photo_links?.[0] ? (
          <img src={deal.media.photo_links[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)" }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))",
        }} />

        {/* 3C Certified */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 20,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          border: "0.5px solid rgba(201,168,93,0.3)",
        }}>
          <BadgeCheck size={12} style={{ color: GOLD }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: GOLD }}>3C Certified</span>
        </div>

        {/* Savings badge */}
        {hasWholesale && deal.savings_vs_retail != null && deal.savings_vs_retail > 0 && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20,
            background: "linear-gradient(135deg, rgba(201,162,39,0.9), rgba(180,130,10,0.95))",
            border: "1px solid rgba(255,220,100,0.4)",
          }}>
            <Tag size={10} style={{ color: "#000" }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: "#000" }}>
              SAVE ${deal.savings_vs_retail.toLocaleString()}
            </span>
          </div>
        )}

        {/* Days listed */}
        {deal.dom != null && (
          <div style={{
            position: "absolute", bottom: 8, left: 8,
            padding: "2px 8px", borderRadius: 6,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{deal.dom}d listed</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.3, flex: 1 }}>
            {deal.heading}
          </h3>
          {deal.guardian_health_score != null && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                border: `2px solid ${deal.guardian_health_score >= 85 ? "#34D399" : deal.guardian_health_score >= 70 ? "#C9A227" : "#F87171"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff",
              }}>
                {deal.guardian_health_score}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Gauge size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
            {deal.miles.toLocaleString()} mi
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
            {deal.year}
          </div>
          {location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, gridColumn: "1 / -1" }}>
              <MapPin size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
              {location}
            </div>
          )}
        </div>

        {/* AI Pick reason */}
        {deal.pick_reason && (
          <div style={{
            padding: "8px 10px", borderRadius: 10, marginBottom: 10,
            background: "rgba(123,97,255,0.06)",
            border: "0.5px solid rgba(123,97,255,0.15)",
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(123,97,255,0.8)", marginBottom: 3 }}>
              WHY ONYX PICKED THIS
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
              {deal.pick_reason}
            </p>
          </div>
        )}

        {/* Pricing */}
        {hasWholesale && deal.club_price != null ? (
          <div style={{
            padding: "10px 12px", borderRadius: 10, marginBottom: 10,
            background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(6,6,10,0.9) 100%)",
            border: "1px solid rgba(201,162,39,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(201,168,93,0.7)", marginBottom: 2 }}>
                  3C CLUB PRICE
                </p>
                <p style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>
                  ${deal.club_price.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>Retail avg</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textDecoration: "line-through" }}>
                  ${(deal.market_avg ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              ${deal.price.toLocaleString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onWatch(deal)}
            style={{
              padding: 8, borderRadius: 8,
              background: watched ? "rgba(201,168,93,0.1)" : "rgba(255,255,255,0.05)",
              border: watched ? `0.5px solid ${GOLD}40` : "0.5px solid rgba(255,255,255,0.1)",
              cursor: "pointer", transition: "all 0.2s",
              color: watched ? GOLD : "rgba(255,255,255,0.3)",
            }}
          >
            {watched ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <button
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              background: hasWholesale
                ? "linear-gradient(135deg, #C9A227 0%, #E8B800 100%)"
                : "linear-gradient(135deg, #B8941F 0%, #C9A227 100%)",
              border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 900, color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <ArrowUpRight size={12} />
            {hasWholesale ? "Claim" : "View"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quote Audit Report ───────────────────────────────────────────────────────

function QuoteAuditReport({ result, onClose }: { result: QuoteAuditResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const { audit } = result;

  const verdictColor = audit.verdict === "FAIR" ? "#34D399" : audit.verdict === "NEGOTIABLE" ? "#C9A227" : "#F87171";

  const copyScript = () => {
    navigator.clipboard.writeText(audit.negotiationScript.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto",
        background: "rgba(10,10,16,0.98)",
        border: "1px solid rgba(201,168,93,0.2)",
        borderRadius: 20, padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={20} style={{ color: GOLD }} />
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: "#fff",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              ONYX QUOTE AUDIT
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.4)",
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Verdict */}
        <div style={{
          padding: 16, borderRadius: 14, marginBottom: 20,
          background: `linear-gradient(135deg, ${verdictColor}10 0%, transparent 100%)`,
          border: `1px solid ${verdictColor}30`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: `${verdictColor}20`,
              border: `1px solid ${verdictColor}40`,
              fontSize: 11, fontWeight: 900, color: verdictColor,
            }}>
              {audit.verdict}
            </div>
            {audit.estimatedOverchargeUsd > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={14} style={{ color: "#F87171" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F87171" }}>
                  ${audit.estimatedOverchargeUsd.toLocaleString()} padding detected
                </span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            {audit.verdictSummary}
          </p>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em", marginBottom: 10,
          }}>
            LINE ITEMS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {audit.lineItems.map((item, i) => {
              const itemColor = item.assessment === "fair" ? "#34D399" : item.assessment === "junk_fee" ? "#F87171" : "#C9A227";
              return (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: `0.5px solid ${itemColor}20`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{item.item}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: itemColor }}>
                      ${item.quotedUsd.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{item.note}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Flags */}
        {audit.redFlags.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.1em", marginBottom: 10,
            }}>
              RED FLAGS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {audit.redFlags.map((flag, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8,
                  background: "rgba(248,113,113,0.06)",
                  border: "0.5px solid rgba(248,113,113,0.2)",
                }}>
                  <AlertTriangle size={12} style={{ color: "#F87171", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Script */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.1em",
            }}>
              NEGOTIATION SCRIPT
            </p>
            <button onClick={copyScript} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6,
              background: "rgba(201,168,93,0.1)", border: `0.5px solid ${GOLD}30`,
              cursor: "pointer", fontSize: 9, fontWeight: 700, color: GOLD,
            }}>
              {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(201,168,93,0.15)",
          }}>
            {audit.negotiationScript.map((line, i) => (
              <p key={i} style={{
                fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                marginBottom: i < audit.negotiationScript.length - 1 ? 10 : 0,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Fair Target */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, transparent 100%)",
          border: "1px solid rgba(52,211,153,0.2)",
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(52,211,153,0.7)", marginBottom: 4 }}>
            FAIR TARGET PRICE
          </p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#34D399" }}>
            ${audit.fairTargetUsd.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showQuoteAudit, setShowQuoteAudit] = useState(false);

  const [dealTab, setDealTab] = useState<DealTab>("market");
  const [marketDeals, setMarketDeals] = useState<EnrichedListing[]>([]);
  const [aiPicks, setAiPicks] = useState<EnrichedListing[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [watchedVins, setWatchedVins] = useState<Set<string>>(new Set());

  const [quoteText, setQuoteText] = useState("");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditResult, setAuditResult] = useState<QuoteAuditResult | null>(null);

  const [prefs, setPrefs] = useState<AdvisorPrefs>(getPrefs());
  const [showPrefsEdit, setShowPrefsEdit] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasToken = !!localStorage.getItem("3c_auth_token");

  // Fetch intents on mount
  useEffect(() => {
    apiFetch("/advisor/intents").then(d => setIntents(d.intents || [])).catch(() => {});
  }, []);

  // Fetch deals on mount
  useEffect(() => {
    apiFetch("/marketcheck/search").then(d => setMarketDeals(d.listings || [])).catch(() => {});
    apiFetch("/advisor/picks").then(d => setAiPicks(d.picks || [])).catch(() => {});
  }, []);

  // Auto-scroll chat
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

  const handleIntentSelect = (intent: Intent) => {
    if (intent.seedPrompt === "__QUOTE_AUDIT__") {
      setShowQuoteAudit(true);
    } else {
      // Seed with prefs if present
      let msg = intent.seedPrompt;
      if (prefs.budgetMax || prefs.bodyStyle || prefs.zip) {
        const prefLines = [];
        if (prefs.budgetMin || prefs.budgetMax) {
          prefLines.push(`Budget: $${prefs.budgetMin?.toLocaleString() ?? "0"} - $${prefs.budgetMax?.toLocaleString() ?? "open"}`);
        }
        if (prefs.bodyStyle) prefLines.push(`Body: ${prefs.bodyStyle}`);
        if (prefs.zip) prefLines.push(`ZIP: ${prefs.zip}`);
        msg += `\n\nMy preferences:\n${prefLines.join("\n")}`;
      }
      sendMessage(msg);
    }
  };

  const handleWatch = (deal: EnrichedListing) => {
    setWatchedVins(prev => new Set([...prev, deal.id]));
  };

  const submitQuoteAudit = async () => {
    if (!quoteText.trim() || !hasToken) return;
    setAuditLoading(true);
    setAuditError("");
    setAuditResult(null);

    try {
      const data = await apiFetch("/advisor/quote-audit", {
        method: "POST",
        body: JSON.stringify({ quoteText: quoteText.trim(), vehicle: vehicleDesc.trim() || undefined }),
      });
      setAuditResult(data);
    } catch (err: any) {
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setAuditError("Sign in required. Head to /login to unlock Quote Audit.");
      } else {
        setAuditError(err.message || "Audit failed. Please try again.");
      }
    } finally {
      setAuditLoading(false);
    }
  };

  const savePrefsLocal = () => {
    savePrefs(prefs);
    setShowPrefsEdit(false);
  };

  const sortedDeals = (deals: EnrichedListing[]) => {
    return [...deals].sort((a, b) => {
      if (sortKey === "price") return (a.club_price ?? a.price) - (b.club_price ?? b.price);
      if (sortKey === "savings") return (b.savings_vs_retail ?? 0) - (a.savings_vs_retail ?? 0);
      if (sortKey === "score") return (b.guardian_health_score ?? 0) - (a.guardian_health_score ?? 0);
      return 0;
    });
  };

  const currentDeals = dealTab === "market" ? sortedDeals(marketDeals) : sortedDeals(aiPicks);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient gradient */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(123,97,255,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(201,168,93,0.04) 0%, transparent 50%)
        `,
      }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "16px 20px",
        borderBottom: "0.5px solid rgba(201,168,93,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(0,0,0,0.6)",
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 900, color: GOLD,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.08em",
              margin: 0,
            }}>
              ONYX ADVISOR
            </h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              AI-powered car-buying concierge • Your insider advantage
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowPrefsEdit(!showPrefsEdit)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                cursor: "pointer", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)",
              }}
            >
              <SlidersHorizontal size={12} />
              Preferences
            </button>
          </div>
        </div>

        {/* Prefs edit bar */}
        {showPrefsEdit && (
          <div style={{
            maxWidth: 1400, margin: "12px auto 0",
            padding: 12, borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(201,168,93,0.1)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                  Budget Min
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30000"
                  value={prefs.budgetMin ?? ""}
                  onChange={e => setPrefs({ ...prefs, budgetMin: e.target.value ? Number(e.target.value) : undefined })}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 6,
                    background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 11, outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                  Budget Max
                </label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={prefs.budgetMax ?? ""}
                  onChange={e => setPrefs({ ...prefs, budgetMax: e.target.value ? Number(e.target.value) : undefined })}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 6,
                    background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 11, outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                  Body Style
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUV, Sedan"
                  value={prefs.bodyStyle ?? ""}
                  onChange={e => setPrefs({ ...prefs, bodyStyle: e.target.value || undefined })}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 6,
                    background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 11, outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                  ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 90210"
                  value={prefs.zip ?? ""}
                  onChange={e => setPrefs({ ...prefs, zip: e.target.value || undefined })}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 6,
                    background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 11, outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={savePrefsLocal} style={{
                padding: "6px 14px", borderRadius: 6,
                background: GOLD, border: "none",
                cursor: "pointer", fontSize: 10, fontWeight: 900, color: "#000",
              }}>
                Save
              </button>
              <button onClick={() => setShowPrefsEdit(false)} style={{
                padding: "6px 14px", borderRadius: 6,
                background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                cursor: "pointer", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1400, margin: "0 auto",
        padding: "20px",
        display: "grid",
        gridTemplateColumns: showQuoteAudit ? "1fr" : "1fr 400px",
        gap: 20,
      }}>
        {/* Left: Chat OR Quote Audit */}
        <div>
          {showQuoteAudit ? (
            <div style={{
              background: "rgba(10,10,16,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "0.5px solid rgba(201,168,93,0.15)",
              borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} style={{ color: GOLD }} />
                  <h2 style={{
                    fontSize: 18, fontWeight: 900, color: "#fff",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    margin: 0,
                  }}>
                    Quote Audit
                  </h2>
                </div>
                <button onClick={() => setShowQuoteAudit(false)} style={{
                  background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.4)",
                }}>
                  <X size={14} />
                </button>
              </div>

              {!hasToken ? (
                <div style={{
                  padding: "16px 18px", borderRadius: 10,
                  background: "rgba(248,113,113,0.06)",
                  border: "0.5px solid rgba(248,113,113,0.2)",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
                    Quote Audit requires an ONYX account. Sign in to unlock.
                  </p>
                  <a href="/login" style={{
                    display: "inline-block", padding: "8px 16px", borderRadius: 8,
                    background: GOLD, color: "#000", fontSize: 11, fontWeight: 900,
                    textDecoration: "none",
                  }}>
                    Sign In
                  </a>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                      Dealer Quote (paste entire quote here)
                    </label>
                    <textarea
                      value={quoteText}
                      onChange={e => setQuoteText(e.target.value)}
                      placeholder="Paste the full quote from the dealer..."
                      rows={8}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 8,
                        background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: 11, outline: "none", resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>
                      Vehicle Description (optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleDesc}
                      onChange={e => setVehicleDesc(e.target.value)}
                      placeholder="e.g. 2024 Tesla Model 3 Long Range"
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 6,
                        background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                        color: "#fff", fontSize: 11, outline: "none",
                      }}
                    />
                  </div>

                  {auditError && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                      background: "rgba(248,113,113,0.06)",
                      border: "0.5px solid rgba(248,113,113,0.2)",
                    }}>
                      <p style={{ fontSize: 11, color: "#F87171" }}>{auditError}</p>
                    </div>
                  )}

                  <button
                    onClick={submitQuoteAudit}
                    disabled={!quoteText.trim() || auditLoading}
                    style={{
                      width: "100%", padding: "10px 16px", borderRadius: 8,
                      background: quoteText.trim() && !auditLoading
                        ? "linear-gradient(135deg, #C9A227 0%, #E8B800 100%)"
                        : "rgba(255,255,255,0.05)",
                      border: "none", cursor: quoteText.trim() && !auditLoading ? "pointer" : "default",
                      fontSize: 12, fontWeight: 900, color: quoteText.trim() && !auditLoading ? "#000" : "rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {auditLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        Run Audit
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{
              background: "rgba(10,10,16,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "0.5px solid rgba(201,168,93,0.15)",
              borderRadius: 16, padding: 20,
              minHeight: 500,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <MessageSquare size={16} style={{ color: GOLD }} />
                <h2 style={{
                  fontSize: 16, fontWeight: 900, color: "#fff",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  margin: 0,
                }}>
                  Advisor Chat
                </h2>
              </div>

              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                {messages.length === 0 ? (
                  <div>
                    <p style={{
                      fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.6,
                    }}>
                      ONYX works the market for you. Tell us what you need, or choose a starting point:
                    </p>
                    <IntentCards intents={intents} onSelect={handleIntentSelect} />
                  </div>
                ) : (
                  messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
                )}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: GOLD }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>ONYX is thinking...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{
                display: "flex", gap: 8,
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(30px)",
                WebkitBackdropFilter: "blur(30px)",
                border: "0.5px solid rgba(201,168,93,0.15)",
                borderRadius: 12, padding: "6px 6px 6px 12px",
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask ONYX anything..."
                  rows={1}
                  style={{
                    flex: 1, padding: "8px 0", background: "transparent",
                    border: "none", color: "#fff", fontSize: 13,
                    outline: "none", resize: "none",
                    fontFamily: "inherit", maxHeight: 80, overflowY: "auto",
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: input.trim() && !loading
                      ? `linear-gradient(135deg, ${GOLD}, #8B6914)`
                      : "rgba(255,255,255,0.05)",
                    border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: GOLD }} />
                  ) : (
                    <Send size={14} style={{ color: input.trim() ? "#000" : "rgba(255,255,255,0.2)" }} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Deal Feed */}
        {!showQuoteAudit && (
          <div style={{
            background: "rgba(10,10,16,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(201,168,93,0.15)",
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setDealTab("market")}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: dealTab === "market" ? "rgba(201,168,93,0.15)" : "transparent",
                    border: dealTab === "market" ? `0.5px solid ${GOLD}40` : "0.5px solid rgba(255,255,255,0.1)",
                    cursor: "pointer", fontSize: 11, fontWeight: 700,
                    color: dealTab === "market" ? GOLD : "rgba(255,255,255,0.4)",
                  }}
                >
                  Market Deals
                </button>
                <button
                  onClick={() => setDealTab("picks")}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: dealTab === "picks" ? "rgba(123,97,255,0.15)" : "transparent",
                    border: dealTab === "picks" ? "0.5px solid rgba(123,97,255,0.4)" : "0.5px solid rgba(255,255,255,0.1)",
                    cursor: "pointer", fontSize: 11, fontWeight: 700,
                    color: dealTab === "picks" ? "#818CF8" : "rgba(255,255,255,0.4)",
                  }}
                >
                  AI Picks
                </button>
              </div>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                style={{
                  padding: "4px 8px", borderRadius: 6,
                  background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 600, outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="price">Price</option>
                <option value="savings">Savings</option>
                <option value="score">Guardian Score</option>
              </select>
            </div>

            <div style={{
              maxHeight: "calc(100vh - 280px)", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {currentDeals.length === 0 ? (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 20 }}>
                  No deals available.
                </p>
              ) : (
                currentDeals.map(deal => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onWatch={handleWatch}
                    watched={watchedVins.has(deal.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Audit Result Modal */}
      {auditResult && <QuoteAuditReport result={auditResult} onClose={() => setAuditResult(null)} />}
    </div>
  );
}
