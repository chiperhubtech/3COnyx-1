import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Zap, AlertTriangle, CheckCircle, XCircle, Activity,
  Bot, ShoppingCart, Truck, Lock, Bell, ChevronDown, ChevronUp, Cpu,
  Target, TrendingUp, DollarSign, Eye, Rocket } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PredictiveAlert {
  id: string; vehicleId: string; vehicle: string;
  component: string; partNumber: string; probability: number;
  severity: "critical" | "warning" | "info";
  estimatedDaysToFailure: number; dtcCodes: string[];
  wholesalePartCost: number; status: "pending" | "approved" | "dismissed";
  flaggedAt: string; approvedAt?: string; meshLog?: AgentDecision[];
  luxuryProse?: string;
}

interface AgentDecision {
  agent: string; agentIndex: number; action: string; result: string;
  timestamp: string; durationMs: number; metadata?: Record<string, unknown>;
}

interface Telemetry {
  vehicleId: string; make: string; model: string; year: number; mileage: number;
  health: number; v2xPing: string; v2xLatencyMs: number;
  vin: string; location: string;
  obd: {
    batteryVoltage: number; alternatorOutput: number; engineTemp: number;
    oilPressure: number; fuelLevel: number; tirePressFl: number; tirePressRr: number;
    tirePressFr: number; tirePressRl: number; transmissionTemp: number;
    coolantLevel: string; dtcCodes: string[]; throttlePosition: number;
  };
}

interface HighValueStrike {
  id: string;
  status: "live" | "locked" | "deployed" | "expired";
  tier: "S" | "A" | "B";
  strikeScore: number;
  vehicle: {
    vinMasked: string; year: number; make: string; model: string;
    trim: string; mileage: number; color: string;
    wholesalePrice: number; estimatedRetail: number; gap: number;
  };
  fullpathSignals: {
    matchedMembers: number; topMemberId: string; topMemberName: string;
    topIntentScore: number; inventoryDemandScore: number;
    avgDaysOnMarket: number; searchVolume7d: number;
  };
  conciergeAlert: string;
  stripeHoldId: string | null;
  missionId: string | null;
  vaultHash: string | null;
  detectedAt: string;
  deployedAt: string | null;
  agentDecisions: AgentDecision[];
}

interface StrikeStats {
  total: number; live: number; deployed: number; locked: number; tierS: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1) return "just now"; if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const AGENT_ICONS = [Shield, Bot, ShoppingCart, Truck, Lock, Zap, Bell];
const AGENT_COLORS = ["#10B981", "#8B5CF6", "#3B82F6", "#F59E0B", "#6B7280", "#EF4444", "#EC4899"];

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProbabilityRing({ pct, severity }: { pct: number; severity: string }) {
  const color = severity === "critical" ? "#EF4444" : severity === "warning" ? "#FBBF24" : "#10B981";
  const r = 28; const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{pct}%</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>RISK</span>
      </div>
    </div>
  );
}

function TelemetryGauge({ label, value, unit, min, max, warn, danger }: {
  label: string; value: number; unit: string; min: number; max: number; warn: number; danger: number;
}) {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const color = value <= danger ? "#EF4444" : value <= warn ? "#FBBF24" : "#10B981";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 800 }}>{value}{unit}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

function AgentStep({ decision, isLast }: { decision: AgentDecision; isLast: boolean }) {
  const Icon = AGENT_ICONS[(decision.agentIndex - 1) % AGENT_ICONS.length];
  const color = AGENT_COLORS[(decision.agentIndex - 1) % AGENT_COLORS.length];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `${color}18`, border: `1px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={14} style={{ color }} />
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{decision.agent}</span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{decision.durationMs}ms</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginBottom: 3, lineHeight: 1.5 }}>{decision.action}</p>
        <p style={{ color, fontSize: 10, fontWeight: 600, lineHeight: 1.5 }}>{decision.result}</p>
      </div>
    </div>
  );
}

// ─── Strike Score Ring ────────────────────────────────────────────────────────
function StrikeRing({ score, tier }: { score: number; tier: string }) {
  const tierColor = tier === "S" ? "#F59E0B" : tier === "A" ? "#10B981" : "#3B82F6";
  const r = 28; const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={tierColor} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: tierColor, fontSize: 11, fontWeight: 900, lineHeight: 1 }}>T-{tier}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── StrikeCard ───────────────────────────────────────────────────────────────
function StrikeCard({ strike, onDeploy }: { strike: HighValueStrike; onDeploy: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = strike.tier === "S" ? "#F59E0B" : strike.tier === "A" ? "#10B981" : "#3B82F6";
  const isLive = strike.status === "live";
  const isDeployed = strike.status === "deployed" || strike.status === "locked";

  return (
    <div style={{
      background: isDeployed ? "rgba(16,185,129,0.04)" : isLive ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${isDeployed ? "rgba(16,185,129,0.2)" : isLive ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <StrikeRing score={strike.strikeScore} tier={strike.tier} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{
              background: isDeployed ? "rgba(16,185,129,0.15)" : `${tierColor}18`,
              color: isDeployed ? "#10B981" : tierColor,
              border: `1px solid ${isDeployed ? "rgba(16,185,129,0.3)" : `${tierColor}30`}`,
              padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1,
            }}>
              {isDeployed ? "MESH DEPLOYED" : isLive ? "HIGH-VALUE STRIKE" : strike.status.toUpperCase()}
            </span>
            <span style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>
              Fullpath Intent Score: {strike.fullpathSignals.topIntentScore}/100
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{timeAgo(strike.detectedAt)}</span>
          </div>

          <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
            {strike.vehicle.year} {strike.vehicle.make} {strike.vehicle.model} {strike.vehicle.trim}
          </h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>
            {strike.vehicle.color} · {strike.vehicle.mileage.toLocaleString()} mi · VIN: {strike.vehicle.vinMasked}
          </p>

          {/* Price row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>WHOLESALE</span>
              <div style={{ color: "#F59E0B", fontSize: 14, fontWeight: 900 }}>{fmt(strike.vehicle.wholesalePrice)}</div>
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>RETAIL EST.</span>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700 }}>{fmt(strike.vehicle.estimatedRetail)}</div>
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>GAP</span>
              <div style={{ color: "#10B981", fontSize: 14, fontWeight: 900 }}>+{fmt(strike.vehicle.gap)}</div>
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>DEMAND</span>
              <div style={{ color: "#3B82F6", fontSize: 13, fontWeight: 800 }}>{strike.fullpathSignals.inventoryDemandScore}/100</div>
            </div>
          </div>
        </div>

        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {/* Concierge Alert */}
          <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Bot size={12} style={{ color: "#8B5CF6" }} />
              <span style={{ color: "#8B5CF6", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>ONYX CONCIERGE — TIER-1 ALERT</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.7, fontStyle: "italic" }}>
              "{strike.conciergeAlert}"
            </p>
          </div>

          {/* Fullpath signals */}
          <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <p style={{ color: "#3B82F6", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>FULLPATH INTELLIGENCE SIGNALS</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Matched Members", val: strike.fullpathSignals.matchedMembers.toString() },
                { label: "Top Intent", val: `${strike.fullpathSignals.topIntentScore}/100` },
                { label: "Demand Score", val: `${strike.fullpathSignals.inventoryDemandScore}/100` },
                { label: "Avg Days on Mkt", val: `${strike.fullpathSignals.avgDaysOnMarket}d` },
                { label: "Search Vol 7d", val: strike.fullpathSignals.searchVolume7d.toLocaleString() },
                { label: "Top Member", val: strike.fullpathSignals.topMemberName },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent decisions (post-deploy) */}
          {isDeployed && strike.agentDecisions.length > 0 && (
            <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>7-AGENT MESH LOG</p>
              {strike.agentDecisions.map((d, i) => {
                const Icon = AGENT_ICONS[i % AGENT_ICONS.length];
                const color = AGENT_COLORS[i % AGENT_COLORS.length];
                return (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < strike.agentDecisions.length - 1 ? 12 : 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}18`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{d.agent}</span>
                      <p style={{ color: color, fontSize: 10, marginTop: 2 }}>{d.decision ?? d.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Deploy status or action */}
          {isDeployed ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {strike.stripeHoldId && (
                <span style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981", padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                  $500 Hold · {strike.stripeHoldId.slice(0, 20)}…
                </span>
              )}
              {strike.missionId && (
                <span style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B", padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                  Mission: {strike.missionId}
                </span>
              )}
              {strike.vaultHash && (
                <span style={{ background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)", color: "rgba(255,255,255,0.4)", padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                  Vault: {strike.vaultHash.slice(0, 14)}…
                </span>
              )}
            </div>
          ) : isLive ? (
            <button
              onClick={() => onDeploy(strike.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))",
                border: "1px solid rgba(245,158,11,0.4)", borderRadius: 10, cursor: "pointer",
                color: "#F59E0B", fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
              }}
            >
              <Rocket size={14} />
              Deploy 7-Agent Mesh — Lock Vehicle · $500 Hold · Mission
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onApprove, onDismiss }: {
  alert: PredictiveAlert;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [meshOpen, setMeshOpen] = useState(false);
  const sev = alert.severity;
  const color = sev === "critical" ? "#EF4444" : sev === "warning" ? "#FBBF24" : "#10B981";
  const bg = sev === "critical" ? "rgba(239,68,68,0.05)" : sev === "warning" ? "rgba(251,191,36,0.05)" : "rgba(16,185,129,0.05)";
  const border = sev === "critical" ? "rgba(239,68,68,0.15)" : sev === "warning" ? "rgba(251,191,36,0.15)" : "rgba(16,185,129,0.15)";
  const approved = alert.status === "approved";
  const dismissed = alert.status === "dismissed";

  return (
    <div style={{
      background: approved ? "rgba(16,185,129,0.04)" : dismissed ? "rgba(255,255,255,0.01)" : bg,
      border: `1px solid ${approved ? "rgba(16,185,129,0.2)" : dismissed ? "rgba(255,255,255,0.06)" : border}`,
      borderRadius: 16, overflow: "hidden",
      opacity: dismissed ? 0.5 : 1,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <ProbabilityRing pct={alert.probability} severity={approved ? "info" : alert.severity} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{
              background: approved ? "rgba(16,185,129,0.15)" : dismissed ? "rgba(255,255,255,0.06)" : `${color}18`,
              color: approved ? "#10B981" : dismissed ? "rgba(255,255,255,0.3)" : color,
              border: `1px solid ${approved ? "rgba(16,185,129,0.3)" : dismissed ? "rgba(255,255,255,0.1)" : `${color}30`}`,
              padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1,
            }}>
              {approved ? "MESH DEPLOYED" : dismissed ? "DISMISSED" : sev.toUpperCase()}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{timeAgo(alert.flaggedAt)}</span>
          </div>
          <h3 style={{ color: dismissed ? "rgba(255,255,255,0.4)" : "#fff", fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
            {alert.component}
          </h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{alert.vehicle}</p>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>DAYS TO FAILURE</span>
              <div style={{ color: color, fontSize: 13, fontWeight: 800 }}>{alert.estimatedDaysToFailure}d</div>
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>PART COST</span>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{fmt(alert.wholesalePartCost)}</div>
            </div>
            {alert.dtcCodes.length > 0 && (
              <div>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>DTC CODES</span>
                <div style={{ color: "#FBBF24", fontSize: 11, fontWeight: 700 }}>{alert.dtcCodes.join(" · ")}</div>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {alert.luxuryProse && (
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Bot size={12} style={{ color: "#8B5CF6" }} />
                <span style={{ color: "#8B5CF6", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>ONYX AI CONCIERGE</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.7, fontStyle: "italic" }}>"{alert.luxuryProse}"</p>
            </div>
          )}

          {/* Mesh log */}
          {alert.meshLog && alert.meshLog.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <button
                onClick={() => setMeshOpen(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                  cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700,
                  letterSpacing: 0.5, marginBottom: meshOpen ? 12 : 0,
                }}
              >
                <Cpu size={11} />7-AGENT MESH LOG
                {meshOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {meshOpen && (
                <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                  {alert.meshLog.map((d, i) => (
                    <AgentStep key={d.agentIndex} decision={d} isLast={i === alert.meshLog!.length - 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {alert.status === "pending" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => onApprove(alert.id)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10,
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                  color: "#10B981", fontSize: 11, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Zap size={13} />DEPLOY 7-AGENT MESH
              </button>
              <button
                onClick={() => onDismiss(alert.id)}
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <XCircle size={13} />Dismiss
              </button>
            </div>
          )}

          {approved && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }}>
              <CheckCircle size={14} style={{ color: "#10B981" }} />
              <span style={{ color: "#10B981", fontSize: 11, fontWeight: 700 }}>7-Agent Mesh deployed · Runner dispatched · Dynasty split executed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const VEHICLE_IDS = ["veh-001", "veh-002", "veh-003"];

export default function GuardianPage() {
  const qc = useQueryClient();

  // Persist active tab across refreshes
  const [activeTab, setActiveTab] = useState<"alerts" | "telemetry" | "mesh" | "strikes">(() => {
    try { return (localStorage.getItem("guardian-tab") as any) || "strikes"; } catch { return "strikes"; }
  });
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    try { localStorage.setItem("guardian-tab", tab); } catch { /* ignore */ }
  };

  const [selectedVehicle, setSelectedVehicle] = useState(() => {
    try { return localStorage.getItem("guardian-vehicle") || VEHICLE_IDS[0]; } catch { return VEHICLE_IDS[0]; }
  });
  const handleVehicleChange = (id: string) => {
    setSelectedVehicle(id);
    try { localStorage.setItem("guardian-vehicle", id); } catch { /* ignore */ }
  };

  const { data: alertData, isLoading: alertLoading } = useQuery({
    queryKey: ["guardian-alerts"],
    queryFn: () => fetch("/api/guardian/alerts").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: telData, isLoading: telLoading } = useQuery({
    queryKey: ["guardian-telemetry", selectedVehicle],
    queryFn: () => fetch(`/api/guardian/telemetry/${selectedVehicle}`).then(r => r.json()),
    refetchInterval: 15_000,
  });

  const { data: meshData } = useQuery({
    queryKey: ["guardian-mesh"],
    queryFn: () => fetch("/api/guardian/mesh-log").then(r => r.json()),
    enabled: activeTab === "mesh",
  });

  const { data: strikeData, isLoading: strikeLoading } = useQuery({
    queryKey: ["guardian-strikes"],
    queryFn: () => fetch("/api/guardian/strikes").then(r => r.json()),
    refetchInterval: 20_000,
  });

  const { data: fullpathStatus } = useQuery({
    queryKey: ["fullpath-status"],
    queryFn: () => fetch("/api/fullpath/status").then(r => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/guardian/alerts/${id}/approve`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardian-alerts"] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/guardian/alerts/${id}/dismiss`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardian-alerts"] }),
  });

  const deployStrikeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/guardian/strikes/${id}/deploy`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardian-strikes"] }),
  });

  const alerts: PredictiveAlert[] = alertData?.alerts ?? [];
  const stats = alertData?.stats ?? { total: 0, critical: 0, pending: 0, approved: 0 };
  const tel: Telemetry | null = telData ?? null;
  const strikes: HighValueStrike[] = strikeData?.strikes ?? [];
  const strikeStats: StrikeStats = strikeData?.stats ?? { total: 0, live: 0, deployed: 0, locked: 0, tierS: 0 };

  const TABS = [
    { id: "strikes" as const, label: "High-Value Strikes", badge: strikeStats.live },
    { id: "alerts" as const, label: "Predictive Alerts", badge: stats.pending },
    { id: "telemetry" as const, label: "V2X Telemetry" },
    { id: "mesh" as const, label: "Mesh Log", badge: meshData?.total },
  ];

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Shield}
        title="Guardian"
        subtitle="V2X Predictive Intelligence · 7-Agent Mesh"
        accent="#10B981"
        badge={stats.critical > 0 ? `${stats.critical} CRITICAL` : undefined}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "5px 10px" }}>
              <Activity size={10} style={{ color: "#10B981" }} />
              <span style={{ color: "#10B981", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>V2X LIVE</span>
            </div>
          </div>
        }
      />

      <div className="p-6">
        {/* Fullpath intelligence status — always shown as connected for MVP */}

        {/* Stats bar */}
        {(() => {
          const statItems = activeTab === "strikes" ? [
            { label: "LIVE STRIKES", value: strikeStats.live, color: "#F59E0B" },
            { label: "TIER-S ASSETS", value: strikeStats.tierS, color: "#FBBF24" },
            { label: "DEPLOYED", value: strikeStats.deployed, color: "#10B981" },
            { label: "TOTAL FLAGGED", value: strikeStats.total, color: "#fff" },
          ] : [
            { label: "TOTAL ALERTS", value: stats.total, color: "#fff" },
            { label: "CRITICAL", value: stats.critical, color: "#EF4444" },
            { label: "PENDING ACTION", value: stats.pending, color: "#FBBF24" },
            { label: "MESH DEPLOYED", value: stats.approved, color: "#10B981" },
          ];
          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {statItems.map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ color: s.color, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
              background: activeTab === t.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeTab === t.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: activeTab === t.id ? "#10B981" : "rgba(255,255,255,0.4)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
            }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{ background: "#EF4444", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── STRIKES TAB ────────────────────────────────────────────────── */}
        {activeTab === "strikes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Intelligence source row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
              <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingUp size={14} style={{ color: "#3B82F6" }} />
                <div>
                  <div style={{ color: "#3B82F6", fontSize: 10, fontWeight: 700 }}>FULLPATH SHOPPER INTENT</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>3 members · 2 high-intent (80+)</div>
                </div>
                <span style={{ marginLeft: "auto", color: "#10B981", fontSize: 9, fontWeight: 700 }}>LIVE</span>
              </div>
              <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <Target size={14} style={{ color: "#F59E0B" }} />
                <div>
                  <div style={{ color: "#F59E0B", fontSize: 10, fontWeight: 700 }}>MARKETCHECK WHOLESALE MESH</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>National · 50 states · Live auction data</div>
                </div>
                <span style={{ marginLeft: "auto", color: "#10B981", fontSize: 9, fontWeight: 700 }}>LIVE</span>
              </div>
            </div>

            {strikeLoading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton scan-pulse" style={{ height: 80, borderRadius: 14 }} />
                ))}
                <p style={{ textAlign: "center", color: "rgba(201,162,39,0.4)", fontSize: 11, letterSpacing: "0.1em", paddingTop: 4 }}>
                  SCANNING WHOLESALE MESH…
                </p>
              </div>
            ) : strikes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <Target size={32} style={{ color: "rgba(245,158,11,0.4)", margin: "0 auto 12px" }} />
                <p style={{ color: "#F59E0B", fontWeight: 700 }}>No Active Strikes</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>The Mesh is scanning. High-value opportunities will surface here.</p>
              </div>
            ) : (
              strikes.map(s => (
                <StrikeCard
                  key={s.id} strike={s}
                  onDeploy={(id) => deployStrikeMutation.mutate(id)}
                />
              ))
            )}
          </div>
        )}

        {/* ── ALERTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alertLoading ? (
              <div className="space-y-3 p-2">
                {[1, 2].map(i => (
                  <div key={i} className="skeleton scan-pulse" style={{ height: 90, borderRadius: 14 }} />
                ))}
                <p style={{ textAlign: "center", color: "rgba(201,162,39,0.4)", fontSize: 11, letterSpacing: "0.1em", paddingTop: 4 }}>
                  LOADING V2X INTELLIGENCE…
                </p>
              </div>
            ) : alerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <Shield size={32} style={{ color: "rgba(16,185,129,0.4)", margin: "0 auto 12px" }} />
                <p style={{ color: "#10B981", fontWeight: 700 }}>All Systems Nominal</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No predictive alerts at this time</p>
              </div>
            ) : (
              alerts.map(a => (
                <AlertCard
                  key={a.id} alert={a}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onDismiss={(id) => dismissMutation.mutate(id)}
                />
              ))
            )}
          </div>
        )}

        {/* ── TELEMETRY TAB ──────────────────────────────────────────────── */}
        {activeTab === "telemetry" && (
          <div>
            {/* Vehicle selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "veh-001", label: "Porsche 911" },
                { id: "veh-002", label: "Aston Martin Vantage" },
                { id: "veh-003", label: "Ferrari Roma" },
              ].map(v => (
                <button key={v.id} onClick={() => handleVehicleChange(v.id)} style={{
                  padding: "8px 14px", borderRadius: 10,
                  background: selectedVehicle === v.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedVehicle === v.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                  color: selectedVehicle === v.id ? "#10B981" : "rgba(255,255,255,0.4)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>
                  {v.label}
                </button>
              ))}
            </div>

            {telLoading ? (
              <div className="space-y-3 p-2">
                <div className="skeleton scan-pulse" style={{ height: 120, borderRadius: 16 }} />
                <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
                </div>
                <p style={{ textAlign: "center", color: "rgba(201,162,39,0.4)", fontSize: 11, letterSpacing: "0.1em", paddingTop: 4 }}>
                  READING V2X TELEMETRY…
                </p>
              </div>
            ) : tel ? (
              <div>
                {/* Health score hero */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{tel.year} {tel.make} {tel.model}</h3>
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{tel.vin} · {tel.mileage.toLocaleString()} mi · {tel.location}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>V2X ping {new Date(tel.v2xPing).toLocaleTimeString()} · {tel.v2xLatencyMs}ms latency</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 48, fontWeight: 900, color: tel.health >= 80 ? "#10B981" : tel.health >= 60 ? "#FBBF24" : "#EF4444", lineHeight: 1 }}>{tel.health}</div>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700 }}>HEALTH SCORE</div>
                    </div>
                  </div>
                  {tel.obd.dtcCodes.length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {tel.obd.dtcCodes.map(c => (
                        <span key={c} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* OBD gauges */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  <TelemetryGauge label="ALTERNATOR OUTPUT" value={tel.obd.alternatorOutput} unit="V" min={12} max={15} warn={13.5} danger={13.0} />
                  <TelemetryGauge label="BATTERY VOLTAGE" value={tel.obd.batteryVoltage} unit="V" min={10} max={14} warn={12.4} danger={11.9} />
                  <TelemetryGauge label="ENGINE TEMP" value={tel.obd.engineTemp} unit="°F" min={150} max={250} warn={205} danger={220} />
                  <TelemetryGauge label="OIL PRESSURE" value={tel.obd.oilPressure} unit="psi" min={20} max={80} warn={35} danger={28} />
                  <TelemetryGauge label="TRANSMISSION TEMP" value={tel.obd.transmissionTemp} unit="°F" min={140} max={230} warn={190} danger={210} />
                  <TelemetryGauge label="FUEL LEVEL" value={tel.obd.fuelLevel} unit="%" min={0} max={100} warn={20} danger={10} />
                </div>

                {/* Tire pressure */}
                <div style={{ marginTop: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TIRE PRESSURE (PSI)</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "FL", val: tel.obd.tirePressFl },
                      { label: "FR", val: tel.obd.tirePressFr },
                      { label: "RL", val: tel.obd.tirePressRl },
                      { label: "RR", val: tel.obd.tirePressRr },
                    ].map(t => (
                      <div key={t.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                        <span style={{ color: t.val < 30 ? "#EF4444" : t.val < 33 ? "#FBBF24" : "#10B981", fontSize: 13, fontWeight: 800 }}>{t.val} psi</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── MESH LOG TAB ───────────────────────────────────────────────── */}
        {activeTab === "mesh" && (
          <div>
            {!meshData || meshData.total === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <Cpu size={32} style={{ color: "rgba(16,185,129,0.4)", margin: "0 auto 12px" }} />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>No agent decisions yet. Approve a predictive alert to trigger the 7-Agent Mesh.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{meshData.total} agentic decisions logged</span>
                  <span style={{ color: "#10B981", fontSize: 9, fontWeight: 700 }}>NIST-MCP 2026 COMPLIANT</span>
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                  {(meshData.log as AgentDecision[]).map((d, i) => (
                    <AgentStep key={i} decision={d} isLast={i === meshData.log.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
