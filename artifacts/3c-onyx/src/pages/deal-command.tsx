import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  FileText, CreditCard, Shield, MapPin, Send, CheckCircle2,
  ArrowLeft, MessageCircle, Loader2, ChevronRight,
  Car, DollarSign, AlertTriangle, Sparkles, Zap,
  TrendingUp, Clock, Hash, X, Truck, Radio, Wrench,
  Activity, Package,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A85D";
const GOLD_BRIGHT = "#D4B76A";
const PINK = "#FF2D9A";
const PURPLE = "#7B61FF";
const CYAN = "#00E5FF";
const BLACK = "#000000";

interface Deal {
  id: number;
  dealNumber: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  vehicleLabel?: string;
  vin?: string;
  salePrice?: string;
  grossProfit?: string;
  createdAt: string;
}

interface ThreadMessage {
  id: string;
  sender: string;
  senderType: "human" | "agent" | "system";
  text: string;
  timestamp: Date;
  agentIcon?: string;
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

const COMMAND_BUTTONS = [
  { id: "structure", label: "STRUCTURE\nDEAL", icon: FileText, color: GOLD, desc: "Build payment options" },
  { id: "credit",    label: "RUN\nCREDIT", icon: CreditCard, color: "#60A5FA", desc: "Submit to lenders" },
  { id: "insurance", label: "BIND\nINSURANCE", icon: Shield, color: "#34D399", desc: "One tap — no calls" },
  { id: "locate",    label: "LOCATE\nVEHICLE", icon: MapPin, color: "#F59E0B", desc: "Search the network" },
  { id: "contract",  label: "SEND\nCONTRACT", icon: Send, color: "#A78BFA", desc: "Digital signing" },
  { id: "complete",  label: "COMPLETE\nDEAL", icon: CheckCircle2, color: "#10B981", desc: "Deliver & fund" },
];

function CommandGrid({ activeDeal, onAction }: { activeDeal: Deal | null; onAction: (id: string) => void }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10, padding: "0 16px",
    }}>
      {COMMAND_BUTTONS.map((btn) => {
        const Icon = btn.icon;
        const disabled = !activeDeal && btn.id !== "structure";
        return (
          <button
            key={btn.id}
            onClick={() => !disabled && onAction(btn.id)}
            style={{
              padding: "20px 8px", borderRadius: 20,
              background: disabled ? "rgba(255,255,255,0.02)" : `${btn.color}08`,
              backdropFilter: disabled ? "none" : "blur(20px)",
              WebkitBackdropFilter: disabled ? "none" : "blur(20px)",
              border: `0.5px solid ${disabled ? "rgba(255,255,255,0.04)" : `${btn.color}25`}`,
              cursor: disabled ? "default" : "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s cubic-bezier(0.4,0,0.2,1)",
              opacity: disabled ? 0.35 : 1,
              minHeight: 110,
              position: "relative",
              overflow: "hidden",
              boxShadow: disabled ? "none" : `inset 0 0 20px ${btn.color}04, 0 1px 3px rgba(0,0,0,0.3)`,
            }}
            onMouseEnter={e => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${btn.color}45`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 25px ${btn.color}12, inset 0 0 20px ${btn.color}06`;
              }
            }}
            onMouseLeave={e => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${btn.color}25`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `inset 0 0 20px ${btn.color}04, 0 1px 3px rgba(0,0,0,0.3)`;
              }
            }}
            onMouseDown={e => {
              if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
            }}
            onMouseUp={e => {
              if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: "inherit",
              background: `linear-gradient(135deg, ${btn.color}06 0%, transparent 50%)`,
              pointerEvents: "none",
            }} />
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `${btn.color}10`, border: `0.5px solid ${btn.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 1,
            }}>
              <Icon size={22} style={{ color: btn.color }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 900, color: disabled ? "rgba(255,255,255,0.25)" : "#fff",
              textAlign: "center", lineHeight: 1.3,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.08em", whiteSpace: "pre-line",
              position: "relative", zIndex: 1,
            }}>
              {btn.label}
            </span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textAlign: "center", position: "relative", zIndex: 1 }}>
              {btn.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const PIPELINE_ICONS: Record<string, typeof Car> = {
  lead: Sparkles, structure: FileText, credit: CreditCard, lender: DollarSign,
  insurance: Shield, vehicle: Car, transport: Truck, delivery: Package, funding: CheckCircle2,
};

interface PipelineStage {
  id: string;
  label: string;
  state: "completed" | "active" | "pending";
}

function DealPipeline({ stages, progress }: { stages: PipelineStage[]; progress: number }) {
  return (
    <div style={{
      margin: "0 16px 16px", padding: 16,
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "0.5px solid rgba(201,168,93,0.12)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "inset 0 0 20px rgba(201,168,93,0.02)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={12} style={{ color: GOLD }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
            DEAL PIPELINE
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, color: GOLD,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {progress}%
        </span>
      </div>

      <div style={{
        height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)",
        marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: `linear-gradient(90deg, ${GOLD}, #10B981)`,
          width: `${progress}%`,
          transition: "width 0.5s ease",
        }} />
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", gap: 2,
        overflowX: "auto", paddingBottom: 4,
      }}>
        {stages.map((stage, i) => {
          const Icon = PIPELINE_ICONS[stage.id] || Zap;
          const colors = {
            completed: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", icon: "#10B981", text: "#10B981" },
            active: { bg: `${GOLD}15`, border: `${GOLD}35`, icon: GOLD, text: GOLD },
            pending: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.05)", icon: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.2)" },
          }[stage.state];

          return (
            <div key={stage.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, minWidth: 0, flex: "1 1 0",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: colors.bg, border: `1px solid ${colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                {stage.state === "completed" ? (
                  <CheckCircle2 size={14} style={{ color: colors.icon }} />
                ) : stage.state === "active" ? (
                  <div style={{ position: "relative" }}>
                    <Icon size={13} style={{ color: colors.icon }} />
                    <div style={{
                      position: "absolute", top: -2, right: -2,
                      width: 6, height: 6, borderRadius: "50%",
                      background: GOLD, boxShadow: `0 0 6px ${GOLD}`,
                    }} />
                  </div>
                ) : (
                  <Icon size={12} style={{ color: colors.icon }} />
                )}
              </div>
              <span style={{
                fontSize: 7, fontWeight: 700, color: colors.text,
                textAlign: "center", letterSpacing: "0.05em",
                lineHeight: 1.2, maxWidth: 50,
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {stage.label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehicleIntelCard({ make, model }: { make: string; model: string }) {
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!make) { setLoading(false); return; }
    apiFetch(`/auto-pulse/vehicle-intel?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model || "")}`)
      .then(setIntel)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [make, model]);

  if (!make || loading) return null;
  if (!intel || intel.totalIntel === 0) return null;

  return (
    <div style={{
      margin: "0 16px 12px", padding: 14,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Radio size={12} style={{ color: GOLD }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
          VEHICLE INTELLIGENCE — {make.toUpperCase()} {model?.toUpperCase() || ""}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
          background: `${GOLD}12`, color: GOLD,
        }}>
          {intel.totalIntel} items
        </span>
      </div>

      {intel.sections?.recalls?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {intel.sections.recalls.slice(0, 2).map((r: any) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{
              display: "block", padding: "8px 10px", borderRadius: 10, marginBottom: 4,
              background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)",
              textDecoration: "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={10} style={{ color: "#EF4444" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>RECALL</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "4px 0 0", lineHeight: 1.4 }}>
                {r.title.replace(/^RECALL:\s*/, "").slice(0, 100)}
              </p>
            </a>
          ))}
        </div>
      )}

      {intel.sections?.news?.length > 0 && (
        <div>
          {intel.sections.news.slice(0, 2).map((n: any) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" style={{
              display: "block", padding: "6px 10px", borderRadius: 8, marginBottom: 4,
              background: "rgba(255,255,255,0.02)",
              textDecoration: "none",
            }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.4 }}>
                {n.title.slice(0, 80)}
              </p>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{n.source}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TextToDealInput({ onParsed }: { onParsed: (result: any) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch("/deals/text-to-deal", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setResult(data);
      onParsed(data);
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "0 16px", marginBottom: 16 }}>
      <div style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "0.5px solid rgba(201,168,93,0.15)",
        borderRadius: 20, padding: 16,
        position: "relative", overflow: "hidden",
        boxShadow: "inset 0 0 30px rgba(201,168,93,0.02), 0 2px 8px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(201,168,93,0.03) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: loading ? "energy-pulse-inline 2s ease-in-out infinite" : "none",
          }}>
            <Sparkles size={14} style={{ color: GOLD }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.15em", opacity: 0.7 }}>
            TEXT-TO-DEAL
          </span>
          <style>{`@keyframes energy-pulse-inline { 0%,100%{filter:drop-shadow(0 0 4px rgba(201,168,93,0.2));} 50%{filter:drop-shadow(0 0 12px rgba(0,229,255,0.4));} }`}</style>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Type or paste a deal...\ne.g. \"2024 Honda Civic $28,500 — $2k down, 72 months, tier 2 credit\""}
          rows={3}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 14,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
            resize: "none", fontFamily: "inherit", lineHeight: 1.5,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={handleParse}
            disabled={loading || !text.trim()}
            style={{
              flex: 1, padding: "12px", borderRadius: 14,
              background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
              border: "none", color: "#000", fontWeight: 800, fontSize: 13,
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading || !text.trim() ? 0.6 : 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {loading ? "PARSING..." : "PARSE DEAL"}
          </button>
        </div>

        {result?.error && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 14,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={12} style={{ color: "#EF4444" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>
                {result.error}
              </span>
            </div>
          </div>
        )}

        {result && !result.error && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 14,
            background: `rgba(52,211,153,0.06)`,
            border: "1px solid rgba(52,211,153,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingUp size={12} style={{ color: "#34D399" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399" }}>
                {result.confidence}% CONFIDENCE
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              {result.parsed?.vehicleLabel && <div>Vehicle: <strong style={{ color: "#fff" }}>{result.parsed.vehicleLabel}</strong></div>}
              {result.parsed?.salePrice && <div>Price: <strong style={{ color: "#fff" }}>${Number(result.parsed.salePrice).toLocaleString()}</strong></div>}
              {result.parsed?.downPayment && <div>Down: <strong style={{ color: "#fff" }}>${Number(result.parsed.downPayment).toLocaleString()}</strong></div>}
              {result.parsed?.creditTier && <div>Credit: <strong style={{ color: "#fff" }}>{result.parsed.creditTier}</strong></div>}
              {result.parsed?.dealType && <div>Type: <strong style={{ color: "#fff" }}>{result.parsed.dealType.replace(/_/g, " ")}</strong></div>}
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8, margin: 0 }}>
              {result.suggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveDealThread({ deal, messages, onSend }: {
  deal: Deal;
  messages: ThreadMessage[];
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "0.5px solid rgba(201,168,93,0.12)",
      borderRadius: 20, margin: "0 16px", overflow: "hidden",
      boxShadow: "inset 0 0 20px rgba(201,168,93,0.02)",
    }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: "0.5px solid rgba(201,168,93,0.08)",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(201,168,93,0.02)",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: CYAN, boxShadow: `0 0 6px ${CYAN}60`,
          animation: "status-blink 2s ease-in-out infinite",
        }} />
        <MessageCircle size={14} style={{ color: GOLD }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", opacity: 0.7 }}>
          LIVE DEAL THREAD — {deal.dealNumber}
        </span>
      </div>

      <div ref={scrollRef} style={{ maxHeight: 260, overflowY: "auto", padding: 16 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            marginBottom: 12,
            display: "flex", flexDirection: "column",
            alignItems: msg.senderType === "human" ? "flex-end" : "flex-start",
          }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 4, fontWeight: 600 }}>
              {msg.sender}
            </span>
            <div style={{
              padding: "10px 14px", borderRadius: 14,
              maxWidth: "85%",
              background: msg.senderType === "human"
                ? `${GOLD}15` : msg.senderType === "agent"
                ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${msg.senderType === "human"
                ? `${GOLD}25` : msg.senderType === "agent"
                ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)"}`,
            }}>
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.7)",
                margin: 0, lineHeight: 1.5,
              }}>
                {msg.text}
              </p>
            </div>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginTop: 3 }}>
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
        <button onClick={handleSend} style={{
          padding: "10px 16px", borderRadius: 12,
          background: GOLD, border: "none", cursor: "pointer",
        }}>
          <Send size={16} style={{ color: "#000" }} />
        </button>
      </div>
    </div>
  );
}

function DealCard({ deal, onSelect }: { deal: Deal; onSelect: () => void }) {
  const statusColor: Record<string, string> = {
    Open: "#60A5FA", In_Progress: GOLD, Pending_Finance: "#A78BFA",
    Pending_Insurance: "#34D399", Funded: "#10B981", Delivered: "#10B981",
  };
  const color = statusColor[deal.status] || "rgba(255,255,255,0.3)";

  return (
    <button onClick={onSelect} style={{
      width: "100%", textAlign: "left", padding: 16, borderRadius: 16,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer", transition: "all 0.2s", color: "#fff",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Hash size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
              {deal.dealNumber}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
              background: `${color}15`, color, border: `1px solid ${color}30`,
            }}>
              {deal.status.replace(/_/g, " ")}
            </span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px" }}>{deal.customerName}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {deal.vehicleLabel || deal.vin || "No vehicle"}
            {deal.salePrice ? ` · $${Number(deal.salePrice).toLocaleString()}` : ""}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
    </button>
  );
}

function DealDeskModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [structure, setStructure] = useState<any>(null);
  const [msrp, setMsrp] = useState("");
  const [sp, setSp] = useState(deal.salePrice || "");
  const [down, setDown] = useState("");
  const [trade, setTrade] = useState("");
  const [tier, setTier] = useState("Tier2");

  const handleDesk = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/deals/${deal.id}/desk`, {
        method: "POST",
        body: JSON.stringify({
          msrp: parseFloat(msrp) || undefined,
          sellingPrice: parseFloat(sp) || undefined,
          downPayment: parseFloat(down) || 0,
          tradeInValue: parseFloat(trade) || 0,
          creditTier: tier,
        }),
      });
      setStructure(data.structure);
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 480, maxHeight: "90vh",
        background: "#0c0c12", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "auto",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.15em" }}>MOBILE DESKING</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>{deal.customerName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {!structure ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "MSRP", val: msrp, set: setMsrp, ph: "e.g. 38000" },
                  { label: "SELLING PRICE", val: sp, set: setSp, ph: "e.g. 35000" },
                  { label: "DOWN PAYMENT", val: down, set: setDown, ph: "e.g. 2000" },
                  { label: "TRADE-IN VALUE", val: trade, set: setTrade, ph: "e.g. 5000" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginBottom: 4 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type="number" style={inputStyle} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginBottom: 6 }}>CREDIT TIER</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Tier1", "Tier2", "Tier3", "Tier4"].map(t => (
                    <button key={t} onClick={() => setTier(t)} style={{
                      flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                      background: tier === t ? `${GOLD}20` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${tier === t ? `${GOLD}50` : "rgba(255,255,255,0.06)"}`,
                      color: tier === t ? GOLD : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }}>
                      {t.replace("Tier", "T")}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleDesk} disabled={loading || !sp} style={{
                padding: 14, borderRadius: 14,
                background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
                border: "none", color: "#000", fontWeight: 800, fontSize: 14,
                cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading || !sp ? 0.6 : 1,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading ? "STRUCTURING..." : "STRUCTURE DEAL"}
              </button>
            </>
          ) : (
            <div>
              <div style={{
                padding: 14, borderRadius: 14, marginBottom: 12,
                background: `${GOLD}08`, border: `1px solid ${GOLD}20`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.12em", marginBottom: 8 }}>
                  RECOMMENDED: {structure.recommendation.bestOption.toUpperCase()}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                  {structure.recommendation.rationale}
                </p>
              </div>

              {[
                { label: "CASH", data: structure.cash, color: "#10B981" },
                { label: "FINANCE", data: structure.finance, color: "#60A5FA" },
                { label: "LEASE", data: structure.lease, color: "#A78BFA" },
              ].map(opt => (
                <div key={opt.label} style={{
                  padding: 14, borderRadius: 14, marginBottom: 8,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: opt.color, letterSpacing: "0.1em" }}>{opt.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>
                      {opt.data.monthlyPayment
                        ? `$${Math.round(opt.data.monthlyWithFi || opt.data.monthlyPayment)}/mo`
                        : `$${Number(opt.data.totalOop || 0).toLocaleString()}`
                      }
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {opt.data.recommendation}
                  </p>
                </div>
              ))}

              <button onClick={() => setStructure(null)} style={{
                width: "100%", padding: 12, borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 13,
                cursor: "pointer", marginTop: 4,
              }}>
                RE-STRUCTURE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DealCommandCenter() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [view, setView] = useState<"command" | "deals" | "thread">("command");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDesk, setShowDesk] = useState(false);
  const [parsedDeal, setParsedDeal] = useState<any>(null);
  const [pipeline, setPipeline] = useState<{ stages: PipelineStage[]; progress: number } | null>(null);

  const loadDeals = useCallback(async () => {
    try {
      const data = await apiFetch("/deals?limit=20");
      setDeals(data.deals || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const addMessage = useCallback((sender: string, senderType: ThreadMessage["senderType"], text: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      sender, senderType, text,
      timestamp: new Date(),
    }]);
  }, []);

  const handleAction = useCallback(async (actionId: string) => {
    if (actionId === "structure") {
      if (activeDeal) {
        setShowDesk(true);
      } else if (parsedDeal?.parsed) {
        const p = parsedDeal.parsed;
        setActionLoading("structure");
        try {
          const data = await apiFetch("/deals", {
            method: "POST",
            body: JSON.stringify({
              customerName: p.customerName || "Walk-In Customer",
              vin: p.vin || undefined,
              vehicleLabel: p.vehicleLabel || undefined,
              dealType: p.dealType || "Used_Sale",
              salePrice: p.salePrice ? String(p.salePrice) : undefined,
            }),
          });
          setActiveDeal(data.deal);
          addMessage("ONYX System", "system", `Deal ${data.deal.dealNumber} created. ${data.lifecycle.totalTasks} tasks spawned.`);
          addMessage("Sales Agent", "agent", `I've structured the deal for ${data.deal.customerName}. ${data.deal.vehicleLabel || "Vehicle"} at ${data.deal.salePrice ? "$" + Number(data.deal.salePrice).toLocaleString() : "price TBD"}.`);
          setView("thread");
          loadDeals();
          setTimeout(() => setShowDesk(true), 500);
        } catch (err: any) {
          addMessage("System", "system", `Error: ${err.message}`);
        }
        setActionLoading(null);
      }
      return;
    }

    if (!activeDeal) return;
    setActionLoading(actionId);

    try {
      if (actionId === "insurance") {
        const data = await apiFetch(`/deals/${activeDeal.id}/bind-insurance`, {
          method: "POST",
          body: JSON.stringify({ coverageType: "Full Coverage" }),
        });
        addMessage("Insurance Agent", "agent", `Insurance bound instantly. Policy ${data.policy.policyNumber} — $${data.policy.monthlyPremium}/mo. No phone calls needed.`);
      } else if (actionId === "credit") {
        addMessage("Finance Agent", "agent", "Submitting to lender network... Checking Ally, Chase Auto, Capital One, Stellantis Financial.");
        await new Promise(r => setTimeout(r, 1200));
        addMessage("Finance Agent", "agent", "Pre-approval received. Best rate: 5.9% APR through Ally Financial — 72 months. Ready for contract generation.");
      } else if (actionId === "locate") {
        addMessage("Inventory Agent", "agent", `Searching dealer network for ${activeDeal.vehicleLabel || "matching vehicles"}...`);
        await new Promise(r => setTimeout(r, 800));
        addMessage("Inventory Agent", "agent", "Found 3 matches within 50 miles. Closest unit available for same-day pickup. Shall I initiate a digital dealer trade?");
      } else if (actionId === "contract") {
        addMessage("System", "system", "Generating digital contract package...");
        await new Promise(r => setTimeout(r, 1000));
        addMessage("Finance Agent", "agent", "Contract generated and sent to customer for e-signature. All documents are in the secure vault.");
      } else if (actionId === "complete") {
        addMessage("System", "system", `Deal ${activeDeal.dealNumber} is COMPLETE. Auto-settle triggered — commissions being calculated.`);
        addMessage("Delivery Agent", "agent", "Vehicle is ready for customer handoff. All paperwork is in the vault. Survey Shield is active — monitoring customer satisfaction.");
        loadDeals();
      }

      await apiFetch(`/deals/${activeDeal.id}/complete-step`, {
        method: "POST",
        body: JSON.stringify({ step: actionId }),
      });
    } catch (err: any) {
      addMessage("System", "system", `Error: ${err.message}`);
    }
    setActionLoading(null);
  }, [activeDeal, parsedDeal, addMessage, loadDeals]);

  const handleThreadSend = useCallback((text: string) => {
    addMessage(user?.name || "You", "human", text);
    setTimeout(() => {
      addMessage("ONYX Concierge", "agent", "Understood. I've noted that and updated the deal record. The relevant agent is being notified.");
    }, 800);
  }, [user, addMessage]);

  const selectDeal = useCallback((deal: Deal) => {
    setActiveDeal(deal);
    setMessages([
      {
        id: "init",
        sender: "ONYX System",
        senderType: "system",
        text: `Deal ${deal.dealNumber} loaded. Status: ${deal.status.replace(/_/g, " ")}. All 7 agents are standing by.`,
        timestamp: new Date(),
      },
    ]);
    setView("thread");
  }, []);

  const greetingTime = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening";

  return (
    <div style={{
      background: BLACK, minHeight: "100vh", color: "#fff", paddingBottom: 100,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `
          radial-gradient(ellipse at 15% 25%, rgba(123,97,255,0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 75%, rgba(201,168,93,0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 95%, rgba(255,45,154,0.015) 0%, transparent 40%)
        `,
      }} />

      {showDesk && activeDeal && (
        <DealDeskModal deal={activeDeal} onClose={() => setShowDesk(false)} />
      )}

      <div style={{
        padding: "16px 20px 12px",
        background: "linear-gradient(180deg, rgba(201,168,93,0.06) 0%, transparent 100%)",
        borderBottom: "0.5px solid rgba(201,168,93,0.1)",
        position: "relative", zIndex: 1,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", margin: "0 0 4px" }}>
              DEAL COMMAND CENTER
            </p>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22, fontWeight: 900, margin: 0, color: "#fff",
            }}>
              Good {greetingTime}, {user?.name?.split(" ")[0] || "Operator"}
            </h1>
          </div>
          <div style={{
            display: "flex", gap: 4,
          }}>
            {[
              { v: "command" as const, label: "Command", icon: Zap },
              { v: "deals" as const, label: "Deals", icon: Car },
            ].map(tab => (
              <button
                key={tab.v}
                onClick={() => setView(tab.v)}
                style={{
                  padding: "8px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: view === tab.v ? `${GOLD}15` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${view === tab.v ? `${GOLD}30` : "rgba(255,255,255,0.06)"}`,
                  color: view === tab.v ? GOLD : "rgba(255,255,255,0.4)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeDeal && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Car size={14} style={{ color: GOLD }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{activeDeal.customerName}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>
                  {activeDeal.dealNumber}
                </span>
              </div>
            </div>
            <button onClick={() => { setActiveDeal(null); setView("command"); }} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", fontSize: 10, fontWeight: 700, padding: "4px 8px",
            }}>
              CLOSE
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 0", position: "relative", zIndex: 1 }}>
        {view === "command" && (
          <>
            <TextToDealInput onParsed={setParsedDeal} />
            <CommandGrid activeDeal={activeDeal} onAction={handleAction} />

            {actionLoading && (
              <div style={{
                margin: "16px", padding: "14px 16px", borderRadius: 14,
                background: `${GOLD}08`, border: `1px solid ${GOLD}15`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Loader2 size={16} className="animate-spin" style={{ color: GOLD }} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                  Processing {actionLoading}...
                </span>
              </div>
            )}

            <div style={{ padding: "24px 16px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Clock size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
                  RECENT DEALS
                </span>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: GOLD }} />
                </div>
              ) : deals.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: 24 }}>
                  No deals yet. Use Text-to-Deal above to create your first one.
                </p>
              ) : (
                deals.slice(0, 5).map(d => (
                  <DealCard key={d.id} deal={d} onSelect={() => selectDeal(d)} />
                ))
              )}
            </div>
          </>
        )}

        {view === "deals" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Car size={14} style={{ color: GOLD }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>
                ALL DEALS
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                background: `${GOLD}12`, color: GOLD,
              }}>
                {deals.length}
              </span>
            </div>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Loader2 size={20} className="animate-spin" style={{ color: GOLD }} />
              </div>
            ) : deals.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Car size={32} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No deals yet</p>
              </div>
            ) : (
              deals.map(d => (
                <DealCard key={d.id} deal={d} onSelect={() => selectDeal(d)} />
              ))
            )}
          </div>
        )}

        {view === "thread" && activeDeal && (
          <>
            <div style={{ padding: "0 16px 12px" }}>
              <button onClick={() => setView("command")} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", color: GOLD,
                cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0,
              }}>
                <ArrowLeft size={14} /> Back to Command
              </button>
            </div>
            <LiveDealThread deal={activeDeal} messages={messages} onSend={handleThreadSend} />
            <div style={{ marginTop: 16 }}>
              <CommandGrid activeDeal={activeDeal} onAction={handleAction} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
