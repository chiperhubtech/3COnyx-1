/**
 * IntelligencePanel — Proactive AI Alert Feed
 * Personalized alerts with one-tap execution, savings tracker, and weekly digest.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Brain, Shield, Wrench, TrendingUp, DollarSign, AlertTriangle,
  ChevronRight, X, Zap, Flame, Info, ArrowRight, BarChart3,
  Star, RefreshCw, CheckCircle,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface ProactiveAlert {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "insurance" | "service" | "market" | "savings" | "safety" | "finance";
  headline: string;
  detail: string;
  reasoning: string;
  saving: number;
  savingLabel: string;
  action: { label: string; type: "chat" | "route"; payload: string };
  createdAt: string;
}

interface SavingsData {
  totalIdentified: number;
  alertsResolved: number;
  weekSavings: number;
  lifetimeSavings: number;
  breakdown: { label: string; amount: number; date: string }[];
}

interface DigestHighlight {
  icon: string;
  label: string;
  value: string;
  impact: string;
}

interface WeeklyDigest {
  headline: string;
  summary: string;
  highlights: DigestHighlight[];
  totalOpportunity: number;
  callToAction: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const PRIORITY_CONFIG = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", label: "CRITICAL", Icon: Flame },
  high:     { color: "#F97316", bg: "rgba(249,115,22,0.08)", label: "HIGH",     Icon: AlertTriangle },
  medium:   { color: "#C9A227", bg: "rgba(201,162,39,0.08)", label: "ACTION",   Icon: Zap },
  low:      { color: "#60A5FA", bg: "rgba(96,165,250,0.08)", label: "INFO",     Icon: Info },
};

const CATEGORY_ICONS: Record<string, any> = {
  insurance: Shield,
  service:   Wrench,
  market:    TrendingUp,
  savings:   DollarSign,
  safety:    Shield,
  finance:   BarChart3,
};

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `$${n.toLocaleString()}`;
}

/* ─── Alert Card ──────────────────────────────────────────────────────────── */

function AlertCard({
  alert,
  token,
  onDismiss,
  onExecute,
}: {
  alert: ProactiveAlert;
  token: string | null;
  onDismiss: (id: string) => void;
  onExecute: (alert: ProactiveAlert) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  const cfg = PRIORITY_CONFIG[alert.priority];
  const CatIcon = CATEGORY_ICONS[alert.category] ?? Brain;

  async function handleExecute() {
    setExecuting(true);
    try {
      await fetch(`${API}/intelligence/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          alertId: alert.id,
          message: alert.action.payload,
          actionType: alert.action.type,
        }),
      });
      setDone(true);
      onExecute(alert);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div style={{
      borderRadius: 12,
      background: cfg.bg,
      border: `1px solid ${cfg.color}22`,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Alert header */}
      <div
        style={{ padding: "12px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Category icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CatIcon size={13} style={{ color: cfg.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Priority + saving */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <cfg.Icon size={9} style={{ color: cfg.color }} />
              <span style={{ fontSize: 8, fontWeight: 800, color: cfg.color, letterSpacing: "0.14em" }}>
                {cfg.label}
              </span>
            </div>
            {alert.saving > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#34D399",
                background: "rgba(52,211,153,0.1)", padding: "1px 7px", borderRadius: 20,
              }}>
                {fmt(alert.saving)}
              </span>
            )}
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 2 }}>
            {alert.headline}
          </p>
          {!expanded && (
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
              {alert.detail.slice(0, 80)}…
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.35, color: "#fff" }}
          >
            <X size={12} />
          </button>
          <ChevronRight
            size={12}
            style={{
              color: cfg.color, opacity: 0.6,
              transform: expanded ? "rotate(90deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${cfg.color}15` }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 10, paddingTop: 10 }}>
            {alert.detail}
          </p>

          {/* Reasoning box */}
          <div style={{
            padding: "8px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 12,
          }}>
            <p style={{ fontSize: 8, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 4 }}>
              WHY 3C IS RECOMMENDING THIS
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
              {alert.reasoning}
            </p>
          </div>

          {alert.saving > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ height: 1, flex: 1, background: `${cfg.color}20` }} />
              <span style={{ fontSize: 10, color: "#34D399", fontWeight: 700 }}>
                {fmt(alert.saving)} {alert.savingLabel}
              </span>
              <div style={{ height: 1, flex: 1, background: `${cfg.color}20` }} />
            </div>
          )}

          {done ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <CheckCircle size={13} style={{ color: "#34D399" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399" }}>Handed off to ONYX — redirecting…</span>
            </div>
          ) : (
            <button
              onClick={handleExecute}
              disabled={executing}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: executing ? "rgba(201,162,39,0.1)" : "linear-gradient(135deg, #C9A227, #8B6914)",
                border: executing ? "1px solid rgba(201,162,39,0.3)" : "none",
                cursor: executing ? "wait" : "pointer",
                color: executing ? "#C9A227" : "#000",
                fontWeight: 800, fontSize: 11, letterSpacing: "0.06em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {executing ? (
                <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> ROUTING TO ONYX…</>
              ) : (
                <><Zap size={12} /> {alert.action.label.toUpperCase()}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Savings Strip ───────────────────────────────────────────────────────── */

export function PersonalSavingsTracker({ token }: { token: string | null }) {
  const [savings, setSavings] = useState<SavingsData | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/intelligence/savings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setSavings(d))
      .catch(() => {});
  }, [token]);

  const total = savings?.lifetimeSavings ?? 4_890;
  const identified = savings?.totalIdentified ?? 31_644;
  const resolved = savings?.alertsResolved ?? 2;

  return (
    <div style={{
      padding: "14px 20px",
      borderRadius: 14,
      background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(201,162,39,0.04) 100%)",
      border: "1px solid rgba(52,211,153,0.18)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <DollarSign size={16} style={{ color: "#34D399" }} />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 8, letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 3 }}>
          YOUR TOTAL SAVINGS — POWERED BY 3C
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 28, fontWeight: 900, color: "#34D399", lineHeight: 1,
          }}>
            ${total.toLocaleString()}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            realized · {fmt(identified)} identified · {resolved} alerts resolved
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Star size={11} style={{ color: "#C9A227", fill: "#C9A227" }} />
        <span style={{ fontSize: 9, color: "#C9A227", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
      </div>
    </div>
  );
}

/* ─── Weekly Digest Card ─────────────────────────────────────────────────── */

function WeeklyDigestCard({ token }: { token: string | null }) {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!token) return;
    const dismissed = localStorage.getItem("3c_digest_dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / 864e5;
      if (daysSince < 7) { setVisible(false); return; }
    }

    fetch(`${API}/intelligence/weekly-digest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setDigest(d.digest ?? null))
      .catch(() => {});
  }, [token]);

  if (!visible || !digest) return null;

  return (
    <div style={{
      borderRadius: 14,
      background: "rgba(201,162,39,0.05)",
      border: "1px solid rgba(201,162,39,0.18)",
      overflow: "hidden",
      marginBottom: 8,
    }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(201,162,39,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Star size={11} style={{ color: "#C9A227", fill: "#C9A227" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A227", letterSpacing: "0.12em" }}>
            WEEKLY INTELLIGENCE REPORT
          </span>
        </div>
        <button
          onClick={() => { localStorage.setItem("3c_digest_dismissed", new Date().toISOString()); setVisible(false); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 2 }}
        >
          <X size={12} />
        </button>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{digest.headline}</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, marginBottom: 10 }}>{digest.summary}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {digest.highlights.map((h) => (
            <div key={h.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{h.label}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 6 }}>{h.value}</span>
              </div>
              <span style={{ fontSize: 9, color: "#34D399", fontWeight: 700 }}>{h.impact}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 12, padding: "8px 12px", borderRadius: 8,
          background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.15)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <ArrowRight size={11} style={{ color: "#C9A227", flexShrink: 0 }} />
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{digest.callToAction}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main IntelligencePanel ─────────────────────────────────────────────── */

export default function IntelligencePanel({ token }: { token: string | null }) {
  const [, navigate] = useLocation();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showAll, setShowAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch(`${API}/intelligence/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setAlerts(d.alerts ?? []);
      setLastRefresh(new Date());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  function handleDismiss(id: string) {
    setAlerts((a) => a.filter((x) => x.id !== id));
    if (!token) return;
    fetch(`${API}/intelligence/dismiss/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  function handleExecute(alert: ProactiveAlert) {
    setTimeout(() => {
      if (alert.action.type === "chat") {
        navigate(`/agentic-os?q=${encodeURIComponent(alert.action.payload)}`);
      } else {
        navigate(alert.action.payload);
      }
    }, 1200);
  }

  const visible = showAll ? alerts : alerts.slice(0, 3);
  const pendingCount = alerts.filter((a) => a.priority === "critical" || a.priority === "high").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Weekly Digest */}
      <WeeklyDigestCard token={token} />

      {/* Panel header */}
      <div style={{
        borderRadius: 14,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Brain size={12} style={{ color: "#C9A227" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A227", letterSpacing: "0.12em" }}>
              LIVE INTELLIGENCE
            </span>
            {pendingCount > 0 && (
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>{pendingCount}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
          </div>
        </div>

        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <RefreshCw size={16} style={{ color: "rgba(255,255,255,0.2)", animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>SCANNING YOUR VEHICLES…</p>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <CheckCircle size={20} style={{ color: "#34D399", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>All clear — no active alerts</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>3C is watching 3 vehicles 24/7</p>
            </div>
          ) : (
            visible.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                token={token}
                onDismiss={handleDismiss}
                onExecute={handleExecute}
              />
            ))
          )}

          {alerts.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, cursor: "pointer", padding: "7px 12px",
                color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            >
              {showAll ? "SHOW FEWER" : `+${alerts.length - 3} MORE ALERTS`}
              <ChevronRight size={11} style={{ transform: showAll ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
