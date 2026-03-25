/**
 * Intelligence Feed — Live AI Savings & Opportunity Dashboard
 * "A smart system constantly working in the background."
 * ─────────────────────────────────────────────────────────────
 * Full-page feed showing ProactiveAlerts, Savings Counter,
 * Weekly Digest, and one-tap "Handle this for me" execution.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Shield, Wrench, TrendingUp, DollarSign, AlertTriangle,
  Zap, Info, X, CheckCircle, ChevronDown, ChevronUp, RefreshCw,
  Activity, BarChart3,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type AlertPriority = "critical" | "high" | "medium" | "low";
type AlertCategory = "insurance" | "service" | "market" | "savings" | "safety" | "finance";
type CardState     = "idle" | "loading" | "handled" | "dismissed";

interface ProactiveAlert {
  id:         string;
  priority:   AlertPriority;
  category:   AlertCategory;
  headline:   string;
  detail:     string;
  reasoning:  string;
  saving:     number;
  savingLabel: string;
  action:     { label: string; type: "chat" | "route"; payload: string };
  createdAt:  string;
}

interface SavingsData {
  totalIdentified: number;
  lifetimeSavings: number;
  weekSavings:     number;
  alertsResolved:  number;
  breakdown:       { label: string; amount: number; date: string }[];
}

interface DigestHighlight {
  icon:   string;
  label:  string;
  value:  string;
  impact: string;
}

interface WeeklyDigest {
  headline:         string;
  summary:          string;
  highlights:       DigestHighlight[];
  totalOpportunity: number;
  callToAction:     string;
}

interface FeedMeta {
  totalAlerts:      number;
  totalOpportunity: number;
  lifetimeSavings:  number;
  weekSavings:      number;
  alertsResolved:   number;
}

interface FeedData {
  alerts:  ProactiveAlert[];
  savings: SavingsData;
  digest:  WeeklyDigest;
  meta:    FeedMeta;
  ts:      string;
}

/* ─── Color maps ──────────────────────────────────────────────────────────── */

const GOLD    = "#C9A227";
const EMERALD = "#10B981";

const PRIORITY_CONFIG: Record<AlertPriority, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.07)",  border: "rgba(239,68,68,0.2)",  label: "CRITICAL" },
  high:     { color: GOLD,      bg: "rgba(201,162,39,0.07)", border: "rgba(201,162,39,0.2)", label: "HIGH"     },
  medium:   { color: "#3B82F6", bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.2)", label: "MEDIUM"   },
  low:      { color: EMERALD,   bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.2)", label: "LOW"      },
};

const CATEGORY_CONFIG: Record<AlertCategory, { Icon: React.ComponentType<{ size?: number; color?: string }>; color: string; label: string }> = {
  insurance: { Icon: Shield,      color: "#8B5CF6", label: "INSURANCE" },
  service:   { Icon: Wrench,      color: "#F97316", label: "SERVICE"   },
  market:    { Icon: TrendingUp,  color: GOLD,      label: "MARKET"    },
  savings:   { Icon: DollarSign,  color: EMERALD,   label: "SAVINGS"   },
  safety:    { Icon: CheckCircle, color: EMERALD,   label: "SAFETY"    },
  finance:   { Icon: BarChart3,   color: "#3B82F6", label: "FINANCE"   },
};

/* ─── Animated savings counter ────────────────────────────────────────────── */

function useCountUp(target: number, duration = 2000) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start   = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

/* ─── Savings hero ────────────────────────────────────────────────────────── */

function SavingsHero({ meta }: { meta: FeedMeta | undefined }) {
  const total    = useCountUp(meta?.totalOpportunity ?? 0);
  const lifetime = meta?.lifetimeSavings ?? 0;
  const week     = meta?.weekSavings     ?? 0;
  const resolved = meta?.alertsResolved  ?? 0;
  const alerts   = meta?.totalAlerts     ?? 0;

  return (
    <div style={{
      background:   "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(0,0,0,0) 60%)",
      border:       "1px solid rgba(201,162,39,0.18)",
      borderRadius: 20,
      padding:      "28px 32px",
      marginBottom: 24,
      position:     "relative",
      overflow:     "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position:     "absolute",
        top:          -60,
        right:        -60,
        width:        240,
        height:       240,
        borderRadius: "50%",
        background:   "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          6,
          background:   "rgba(16,185,129,0.12)",
          border:       "1px solid rgba(16,185,129,0.25)",
          borderRadius: 6,
          padding:      "3px 10px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, animation: "pulse 1.4s infinite" }} />
          <span style={{ color: EMERALD, fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>LIVE</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
          ONYX INTELLIGENCE ENGINE
        </span>
      </div>

      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 2.5 }}>
          3C IDENTIFIED
        </span>
      </div>

      <div style={{ color: GOLD, fontSize: 64, fontWeight: 900, letterSpacing: -3, lineHeight: 1, marginBottom: 6 }}>
        ${total.toLocaleString()}
      </div>

      <div style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 3, marginBottom: 24 }}>
        IN TOTAL OPPORTUNITIES
      </div>

      <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(201,162,39,0.12)", paddingTop: 20 }}>
        {[
          { label: "this week",      value: `$${week.toLocaleString()}`,  color: EMERALD },
          { label: "lifetime saved", value: `$${lifetime.toLocaleString()}`, color: GOLD   },
          { label: "insights open",  value: String(alerts),               color: "#3B82F6" },
          { label: "actions done",   value: String(resolved),             color: "#A78BFA" },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              flex:        1,
              textAlign:   "center",
              borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              padding:     "0 16px",
            }}
          >
            <div style={{ color: s.color, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Alert feed card ─────────────────────────────────────────────────────── */

function AlertCard({
  alert,
  cardState,
  onHandle,
  onDismiss,
}: {
  alert:     ProactiveAlert;
  cardState: CardState;
  onHandle:  () => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  if (cardState === "dismissed") return null;

  const pri = PRIORITY_CONFIG[alert.priority];
  const cat = CATEGORY_CONFIG[alert.category];
  const { Icon } = cat;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? `${pri.bg.replace("0.07", "0.10")}` : pri.bg,
        border:       `1px solid ${hovered ? pri.color + "40" : pri.border}`,
        borderRadius: 16,
        overflow:     "hidden",
        transition:   "border-color 0.15s, background 0.15s",
        position:     "relative",
      }}
    >
      {/* Priority left strip */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width:        3,
        background:   pri.color,
        borderRadius: "16px 0 0 16px",
      }} />

      <div style={{ padding: "16px 18px 16px 22px" }}>
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          5,
            background:   `${cat.color}18`,
            border:       `1px solid ${cat.color}28`,
            borderRadius: 6,
            padding:      "3px 9px",
          }}>
            <Icon size={10} color={cat.color} />
            <span style={{ color: cat.color, fontSize: 9, fontWeight: 800, letterSpacing: 1.2 }}>
              {cat.label}
            </span>
          </div>

          <div style={{
            display:      "flex",
            alignItems:   "center",
            background:   `${pri.color}12`,
            border:       `1px solid ${pri.color}22`,
            borderRadius: 6,
            padding:      "3px 8px",
          }}>
            <span style={{ color: pri.color, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
              {pri.label}
            </span>
          </div>

          {alert.saving > 0 && (
            <div style={{
              background:   "rgba(16,185,129,0.12)",
              border:       "1px solid rgba(16,185,129,0.25)",
              borderRadius: 6,
              padding:      "3px 9px",
            }}>
              <span style={{ color: EMERALD, fontSize: 9, fontWeight: 800 }}>
                +${alert.saving.toLocaleString()}
              </span>
            </div>
          )}

          <button
            onClick={onDismiss}
            style={{
              marginLeft:  "auto",
              background:  "transparent",
              border:      "none",
              cursor:      "pointer",
              padding:     4,
              color:       "rgba(255,255,255,0.25)",
              display:     "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Headline */}
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginBottom: 4 }}>
          {alert.headline}
        </div>

        {/* Saving label */}
        {alert.saving > 0 && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500, marginBottom: 10 }}>
            {alert.savingLabel}
          </div>
        )}

        {/* Detail (expandable) */}
        {expanded && (
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
            {alert.detail}
          </div>
        )}

        {/* Expand/collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background:  "transparent",
            border:      "none",
            cursor:      "pointer",
            color:       "rgba(255,255,255,0.35)",
            fontSize:    11,
            display:     "flex",
            alignItems:  "center",
            gap:         4,
            padding:     "0 0 10px 0",
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Less detail" : "More detail"}
        </button>

        {/* CTA */}
        {cardState === "handled" ? (
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            background:   "rgba(16,185,129,0.10)",
            border:       "1px solid rgba(16,185,129,0.22)",
            borderRadius: 10,
            padding:      "10px 14px",
          }}>
            <CheckCircle size={15} color={EMERALD} />
            <span style={{ color: EMERALD, fontSize: 12, fontWeight: 700 }}>
              ONYX AI is handling this
            </span>
          </div>
        ) : (
          <button
            onClick={onHandle}
            disabled={cardState === "loading"}
            style={{
              width:          "100%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            7,
              background:     cardState === "loading" ? "rgba(201,162,39,0.08)" : "rgba(201,162,39,0.12)",
              border:         `1px solid rgba(201,162,39,${cardState === "loading" ? "0.2" : "0.3"})`,
              borderRadius:   10,
              padding:        "11px 16px",
              cursor:         cardState === "loading" ? "not-allowed" : "pointer",
              transition:     "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (cardState !== "loading")
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                cardState === "loading" ? "rgba(201,162,39,0.08)" : "rgba(201,162,39,0.12)";
            }}
          >
            {cardState === "loading" ? (
              <>
                <Activity size={14} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>
                  Sending to ONYX AI...
                </span>
              </>
            ) : (
              <>
                <Zap size={14} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>
                  {alert.action.label}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Weekly digest card ──────────────────────────────────────────────────── */

function DigestCard({ digest }: { digest: WeeklyDigest }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background:   "rgba(139,92,246,0.07)",
      border:       "1px solid rgba(139,92,246,0.2)",
      borderRadius: 16,
      overflow:     "hidden",
      position:     "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: "#8B5CF6" }} />
      <div style={{ padding: "16px 18px 16px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(139,92,246,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={16} color="#8B5CF6" />
          </div>
          <div>
            <div style={{ color: "#8B5CF6", fontSize: 9, fontWeight: 800, letterSpacing: 1.5 }}>
              WEEKLY DIGEST
            </div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{digest.headline}</div>
          </div>
        </div>

        {expanded && (
          <div style={{ marginBottom: 12 }}>
            {digest.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent: "space-between",
                  padding:       "9px 0",
                  borderTop:     i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{h.label}</span>
                <span style={{ color: EMERALD, fontSize: 12, fontWeight: 700 }}>{h.impact}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width:          "100%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            gap:            6,
            background:     "rgba(139,92,246,0.08)",
            border:         "1px solid rgba(139,92,246,0.2)",
            borderRadius:   8,
            padding:        "8px 14px",
            cursor:         "pointer",
            color:          "rgba(255,255,255,0.4)",
            fontSize:       11,
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Hide highlights" : `View ${digest.highlights.length} highlights`}
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function IntelligenceFeed() {
  const [, navigate]     = useLocation();
  const queryClient      = useQueryClient();
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const setCardState = useCallback((id: string, state: CardState) => {
    setCardStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const { data: feedData, isLoading, refetch } = useQuery<FeedData>({
    queryKey:       ["intelligence-feed"],
    queryFn:        () => fetch(`${API}/intelligence/feed`).then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime:       30_000,
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: string) =>
      fetch(`${API}/intelligence/dismiss-public/${alertId}`, { method: "POST" }),
    onSuccess: (_data, alertId) => {
      setCardState(alertId, "dismissed");
      queryClient.invalidateQueries({ queryKey: ["intelligence-feed"] });
    },
  });

  const handleAction = useCallback((alert: ProactiveAlert) => {
    setCardState(alert.id, "loading");
    setTimeout(() => {
      setCardState(alert.id, "handled");
      if (alert.action.type === "route") navigate(alert.action.payload);
    }, 1200);
  }, [setCardState, navigate]);

  const alerts  = feedData?.alerts  ?? [];
  const meta    = feedData?.meta;
  const digest  = feedData?.digest;
  const visible = alerts.filter((a) => cardStates[a.id] !== "dismissed");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color:      "#fff",
      padding:    "32px 24px 80px",
      maxWidth:   780,
      margin:     "0 auto",
    }}>
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(201,162,39,0.12)",
              border: "1px solid rgba(201,162,39,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Brain size={16} color={GOLD} />
            </div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: 0.5, margin: 0 }}>
              Intelligence Feed
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "6px 0 0 0" }}>
            ONYX AI monitoring your fleet 24/7 · Powered by CUXTOMCANDYCLUB LLC
          </p>
        </div>

        <button
          onClick={() => refetch()}
          title="Refresh feed"
          style={{
            background:   "rgba(255,255,255,0.05)",
            border:       "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            padding:      "9px 12px",
            cursor:       "pointer",
            color:        "rgba(255,255,255,0.5)",
            display:      "flex",
            alignItems:   "center",
            gap:          6,
          }}
        >
          <RefreshCw size={14} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>Refresh</span>
        </button>
      </div>

      {/* ── Savings hero ───────────────────────────────────────────────── */}
      <SavingsHero meta={meta} />

      {/* ── Section header ─────────────────────────────────────────────── */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           12,
        marginBottom:  16,
      }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 800, letterSpacing: 2.5, whiteSpace: "nowrap" }}>
          INTELLIGENCE FEED
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        {visible.length > 0 && (
          <span style={{
            background:   "rgba(201,162,39,0.12)",
            border:       "1px solid rgba(201,162,39,0.25)",
            borderRadius: 6,
            padding:      "2px 9px",
            color:        GOLD,
            fontSize:     9,
            fontWeight:   800,
          }}>
            {visible.length} INSIGHTS
          </span>
        )}
      </div>

      {/* ── Loading state ───────────────────────────────────────────────── */}
      {isLoading && (
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          background:   "rgba(201,162,39,0.05)",
          border:       "1px solid rgba(201,162,39,0.12)",
          borderRadius: 12,
          padding:      "16px 18px",
          marginBottom: 12,
        }}>
          <Activity size={14} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            ONYX scanning for opportunities...
          </span>
        </div>
      )}

      {/* ── Feed cards ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            cardState={cardStates[alert.id] ?? "idle"}
            onHandle={() => handleAction(alert)}
            onDismiss={() => dismissMutation.mutate(alert.id)}
          />
        ))}
      </div>

      {!isLoading && visible.length === 0 && (
        <div style={{
          textAlign:    "center",
          background:   "rgba(16,185,129,0.06)",
          border:       "1px solid rgba(16,185,129,0.15)",
          borderRadius: 16,
          padding:      "40px 24px",
        }}>
          <CheckCircle size={28} color={EMERALD} style={{ marginBottom: 12 }} />
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>All clear</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            No open opportunities right now. ONYX is monitoring your fleet.
          </div>
        </div>
      )}

      {/* ── Weekly digest ───────────────────────────────────────────────── */}
      {digest && (
        <>
          <div style={{
            display:       "flex",
            alignItems:    "center",
            gap:           12,
            margin:        "28px 0 14px",
          }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 800, letterSpacing: 2.5, whiteSpace: "nowrap" }}>
              THIS WEEK
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>
          <DigestCard digest={digest} />
        </>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: 48, color: "rgba(255,255,255,0.15)", fontSize: 9, letterSpacing: 1.5 }}>
        3C ONYX · CUXTOMCANDYCLUB LLC · AES-256 · INTELLIGENCE ENGINE ACTIVE
      </div>

      {/* ── Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
