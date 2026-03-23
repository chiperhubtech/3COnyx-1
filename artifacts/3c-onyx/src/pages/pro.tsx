import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  ShieldAlert,
  Cpu,
  Trophy,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Users,
  BarChart2,
  Star,
  MapPin,
  Clock,
  Package,
  MessageSquare,
  FileCheck,
  Bot,
  HardHat,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

type ProTab = "apprentice" | "foreman" | "oem" | "ledger";

const SEVERITY_COLOR: Record<string, string> = {
  HIGH:   "#F87171",
  MEDIUM: "#FBBF24",
  LOW:    "#34D399",
};
const LEVEL_COLOR: Record<string, string> = {
  APPRENTICE:   "#4FC3F7",
  TECHNICIAN:   "#34D399",
  JOURNEYMAN:   "#C9A227",
  SENIOR_TECH:  "#A78BFA",
  MASTER_TECH:  "#F87171",
};
const BADGE_COLOR: Record<string, string> = {
  RISING_STAR:    "#4FC3F7",
  VERIFIED_TECH:  "#34D399",
  HV_CERTIFIED:   "#FBBF24",
  MASTER_BADGE:   "#A78BFA",
  FAST_LEARNER:   "#34D399",
  LEGEND:         "#C9A227",
};

export default function Pro() {
  const [activeTab, setActiveTab] = useState<ProTab>("apprentice");
  const [expandedGuide, setExpandedGuide] = useState<string | null>("g1");
  const [expandedStep, setExpandedStep] = useState<Record<string, boolean>>({});
  const [signedOff, setSignedOff] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data: guides, isLoading: gLoading } = useQuery({
    queryKey: ["pro-guides"],
    queryFn: () => fetch(`${API}/pro/apprentice/guides`).then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: foreman, isLoading: fLoading } = useQuery({
    queryKey: ["pro-foreman"],
    queryFn: () => fetch(`${API}/pro/foreman/command`).then(r => r.json()),
    refetchInterval: 10_000,
    enabled: activeTab === "foreman",
  });

  const { data: oem, isLoading: oLoading } = useQuery({
    queryKey: ["pro-oem"],
    queryFn: () => fetch(`${API}/pro/oem/heatmap`).then(r => r.json()),
    refetchInterval: 15_000,
    enabled: activeTab === "oem",
  });

  const { data: ledger, isLoading: lLoading } = useQuery({
    queryKey: ["pro-ledger"],
    queryFn: () => fetch(`${API}/pro/ledger`).then(r => r.json()),
    refetchInterval: 8_000,
    enabled: activeTab === "ledger",
  });

  const signoffMutation = useMutation({
    mutationFn: (signoffId: string) =>
      fetch(`${API}/pro/apprentice/signoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideId: signoffId, foremanId: "FOREMAN_001" }),
      }).then(r => r.json()),
    onSuccess: (_, signoffId) => {
      setSignedOff(prev => ({ ...prev, [signoffId]: true }));
      qc.invalidateQueries({ queryKey: ["pro-foreman"] });
    },
  });

  const TABS: { id: ProTab; label: string; icon: React.ElementType }[] = [
    { id: "apprentice", label: "Apprentice", icon: HardHat },
    { id: "foreman",    label: "Foreman OS", icon: Cpu      },
    { id: "oem",        label: "OEM Intel",  icon: BarChart2},
    { id: "ledger",     label: "Skill Ledger",icon: Trophy  },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      <PageHeader
        icon={Wrench}
        title="Professional Mesh"
        accent="#A78BFA"
        badge={
          <span className="neural-badge-violet" style={{ fontSize: "10px", padding: "2px 8px" }}>
            ● PRO TIER
          </span>
        }
        subtitle="Apprentice → Master Tech · Foreman OS · OEM Intel"
      />

      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "2px", padding: "12px 16px", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "10px", whiteSpace: "nowrap",
                border: active ? "1px solid rgba(167,139,250,0.35)" : "1px solid transparent",
                background: active ? "rgba(167,139,250,0.1)" : "transparent",
                color: active ? "#A78BFA" : "rgba(255,255,255,0.35)",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 space-y-5">

        {/* ═══════════════════════════════════════════════════════════════
            APPRENTICE MENTOR TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "apprentice" && (
          <>
            {/* Mentor intro */}
            <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "14px", padding: "16px 18px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={16} color="#A78BFA" />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#A78BFA", marginBottom: "4px" }}>Guardian AI Mentor — Active</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  Every guide is pre-analysed against 3,400+ real cases. Safety overrides are mandatory for HV procedures — the AI cannot clear a job without Foreman sign-off.
                </p>
              </div>
            </div>

            {gLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "12px" }} />
              ))
            ) : (
              guides?.guides?.map((guide: {
                id: string; title: string; difficulty: string; estimatedTime: string;
                safetyLevel: string; requiresSignOff: boolean; steps: { step: number; action: string; tool: string; tip: string }[];
                agentNote: string;
              }) => {
                const open = expandedGuide === guide.id;
                const isHV = guide.safetyLevel === "HIGH_VOLTAGE";
                return (
                  <div key={guide.id} className="ai-card" style={{ overflow: "hidden", border: isHV ? "1px solid rgba(248,113,113,0.2)" : undefined }}>
                    {/* Guide header */}
                    <button
                      onClick={() => setExpandedGuide(open ? null : guide.id)}
                      style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: isHV ? "rgba(248,113,113,0.1)" : "rgba(167,139,250,0.08)", border: `1px solid ${isHV ? "rgba(248,113,113,0.25)" : "rgba(167,139,250,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isHV ? <ShieldAlert size={16} color="#F87171" /> : <Wrench size={16} color="#A78BFA" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>{guide.title}</p>
                          {isHV && (
                            <span style={{ fontSize: "9px", padding: "1px 6px", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "4px", color: "#F87171", fontWeight: 700, letterSpacing: "0.08em" }}>
                              ⚠ HV SAFETY
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                          {guide.difficulty} · {guide.estimatedTime} · {guide.steps.length} steps
                        </p>
                      </div>
                      {open ? <ChevronDown size={16} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.3)" />}
                    </button>

                    {/* Expanded content */}
                    {open && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "0 16px 16px" }}>
                        {/* HV sign-off gate */}
                        {guide.requiresSignOff && !signedOff[guide.id] && (
                          <div style={{ margin: "14px 0", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px", padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <ShieldAlert size={14} color="#F87171" />
                              <p style={{ fontSize: "12px", fontWeight: 700, color: "#F87171" }}>SAFETY OVERRIDE — FOREMAN SIGN-OFF REQUIRED</p>
                            </div>
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "12px", lineHeight: 1.5 }}>
                              High-Voltage procedures require Foreman authorization before the apprentice can proceed. Guardian will not log this repair without confirmed sign-off.
                            </p>
                            <button
                              onClick={() => signoffMutation.mutate(guide.id)}
                              disabled={signoffMutation.isPending}
                              style={{ padding: "8px 18px", borderRadius: "8px", background: "#F87171", border: "none", color: "#FFF", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                              {signoffMutation.isPending ? "Requesting…" : "Request Foreman Sign-Off"}
                            </button>
                          </div>
                        )}
                        {signedOff[guide.id] && (
                          <div style={{ margin: "12px 0", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "10px" }}>
                            <CheckCircle size={14} color="#34D399" />
                            <p style={{ fontSize: "12px", color: "#34D399", fontWeight: 600 }}>Foreman sign-off confirmed — proceed safely</p>
                          </div>
                        )}

                        {/* Step-by-step checklist */}
                        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {guide.steps.map(step => {
                            const stepKey = `${guide.id}-${step.step}`;
                            const done = expandedStep[stepKey];
                            const blocked = guide.requiresSignOff && step.step > 1 && !signedOff[guide.id];
                            return (
                              <div
                                key={step.step}
                                onClick={() => !blocked && setExpandedStep(prev => ({ ...prev, [stepKey]: !done }))}
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: "10px",
                                  border: `1px solid ${done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
                                  background: done ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.02)",
                                  cursor: blocked ? "not-allowed" : "pointer",
                                  opacity: blocked ? 0.4 : 1,
                                  transition: "all 0.15s",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: done ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${done ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                    {done ? <CheckCircle size={12} color="#34D399" /> : <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{step.step}</span>}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "12px", color: done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)", fontWeight: 500, lineHeight: 1.4, textDecoration: done ? "line-through" : undefined }}>{step.action}</p>
                                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>Tool: {step.tool}</p>
                                    <p style={{ fontSize: "10px", color: "#A78BFA", marginTop: "4px", lineHeight: 1.4 }}>💡 {step.tip}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Agent note */}
                        <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(79,195,247,0.04)", border: "1px solid rgba(79,195,247,0.12)", borderRadius: "10px" }}>
                          <p style={{ fontSize: "11px", color: "rgba(79,195,247,0.7)", lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700 }}>Guardian AI: </span>{guide.agentNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FOREMAN COMMAND CENTER TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "foreman" && (
          <>
            {fLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "12px" }} />)
            ) : (
              <>
                {/* Shop stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Active Bays",  value: foreman?.shopStats?.active    ?? 0, color: "#34D399" },
                    { label: "Waiting",      value: foreman?.shopStats?.waiting   ?? 0, color: "#FBBF24" },
                    { label: "Completed",    value: foreman?.shopStats?.completed ?? 0, color: "#4FC3F7" },
                    { label: "Avg Cycle",    value: foreman?.shopStats?.avgCycleTime ?? "—", color: "#A78BFA" },
                  ].map(s => (
                    <div key={s.label} className="ai-card" style={{ padding: "14px", textAlign: "center" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginTop: "4px", textTransform: "uppercase" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Guardian alerts */}
                <div>
                  <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldAlert size={12} color="#F87171" /> GUARDIAN ALERTS
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {foreman?.alerts?.map((alert: { id: string; severity: string; vin: string; tech: string; desc: string; elapsed: string; pending: boolean }) => (
                      <div key={alert.id} className="ai-card" style={{ padding: "12px 14px", borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity]}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "9px", padding: "2px 7px", background: `${SEVERITY_COLOR[alert.severity]}15`, border: `1px solid ${SEVERITY_COLOR[alert.severity]}40`, borderRadius: "4px", color: SEVERITY_COLOR[alert.severity], fontWeight: 700, letterSpacing: "0.08em" }}>{alert.severity}</span>
                          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{alert.vin.slice(-8)}</span>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Tech: {alert.tech}</span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>{alert.elapsed}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "6px", lineHeight: 1.4 }}>{alert.desc}</p>
                        {alert.pending && <span style={{ fontSize: "10px", color: "#FBBF24", fontWeight: 600 }}>Pending action →</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign-offs needed */}
                {foreman?.pendingSignoffs?.length > 0 && (
                  <div>
                    <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FileCheck size={12} color="#FBBF24" /> PENDING SIGN-OFFS
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {foreman.pendingSignoffs.map((so: { id: string; tech: string; procedure: string; urgency: string }) => (
                        <div key={so.id} className="ai-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <HardHat size={16} color="#FBBF24" />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>{so.procedure}</p>
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Tech: {so.tech}</p>
                          </div>
                          <button
                            onClick={() => setSignedOff(prev => ({ ...prev, [so.id]: true }))}
                            style={{ padding: "7px 14px", borderRadius: "8px", background: signedOff[so.id] ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", border: `1px solid ${signedOff[so.id] ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`, color: signedOff[so.id] ? "#34D399" : "#F87171", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                          >
                            {signedOff[so.id] ? "✓ Signed" : "Sign Off"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gumloop Automation */}
                <div>
                  <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Zap size={12} color="#34D399" /> GUMLOOP AUTOMATION — ADMIN TAX ELIMINATED
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {foreman?.gumloopAutomation?.map((task: { task: string; vendor?: string; part?: string; customer?: string; message?: string; vin?: string; event?: string; status: string; eta?: string }, i: number) => (
                      <div key={i} className="ai-card" style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {task.task.includes("Parts") ? <Package size={12} color="#34D399" /> : task.task.includes("SMS") ? <MessageSquare size={12} color="#34D399" /> : <CheckCircle size={12} color="#34D399" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: 600, color: "#FFF" }}>{task.task}</p>
                          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                            {task.vendor && `Vendor: ${task.vendor} · `}
                            {task.part && `${task.part} · `}
                            {task.customer && `Customer: ${task.customer} · `}
                            {task.eta && `ETA: ${task.eta}`}
                          </p>
                        </div>
                        <span style={{ fontSize: "10px", padding: "2px 7px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "4px", color: "#34D399", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bay queue */}
                <div>
                  <p className="section-label mb-3">SHOP BAY QUEUE</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {foreman?.shopQueue?.map((bay: { bay: number; vin: string; make: string; model: string; status: string; tech: string; eta: string }) => {
                      const statusColors: Record<string, string> = { IN_PROGRESS: "#C9A227", WAITING: "#4FC3F7", SIGN_OFF_REQ: "#F87171", COMPLETE: "#34D399" };
                      return (
                        <div key={bay.bay} className="ai-card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{bay.bay}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>{bay.make} {bay.model}</p>
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Tech: {bay.tech}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "10px", padding: "2px 7px", background: `${statusColors[bay.status]}15`, border: `1px solid ${statusColors[bay.status]}30`, borderRadius: "4px", color: statusColors[bay.status], fontWeight: 700 }}>
                              {bay.status.replace(/_/g, " ")}
                            </span>
                            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "3px" }}>ETA: {bay.eta}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            OEM INTELLIGENCE FEED TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "oem" && (
          <>
            {oLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />)
            ) : (
              <>
                {/* Header */}
                <div style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.12)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <BarChart2 size={16} color="#F87171" />
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#F87171" }}>{oem?.corridor}</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                      {(oem?.totalDataPoints ?? 0).toLocaleString()} data points · {oem?.dataLatency}
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: "#F87171", fontWeight: 600 }}>
                      {oem?.oemAlerts?.softRecallCandidates} Recall Candidates
                    </p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      {oem?.oemAlerts?.serviceBulletins} Service Bulletins
                    </p>
                  </div>
                </div>

                {/* Corridor heatmap (text-based) */}
                <div>
                  <p className="section-label mb-3">I-95 FAILURE HEATMAP — CITY BY CITY</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {oem?.cities?.map((city: { city: string; state: string; failureCount: number; topPart: string; topMake: string }) => {
                      const maxCount = Math.max(...(oem.cities.map((c: { failureCount: number }) => c.failureCount)));
                      const pctWidth = (city.failureCount / maxCount) * 100;
                      const heatColor = pctWidth > 75 ? "#F87171" : pctWidth > 50 ? "#FBBF24" : pctWidth > 25 ? "#C9A227" : "#34D399";
                      return (
                        <div key={city.city} className="ai-card" style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <MapPin size={11} color={heatColor} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFF", flex: 1 }}>{city.city}, {city.state}</span>
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px", fontWeight: 800, color: heatColor }}>{city.failureCount}</span>
                          </div>
                          {/* Heat bar */}
                          <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${pctWidth}%`, height: "100%", background: heatColor, borderRadius: "2px", transition: "width 0.6s ease" }} />
                          </div>
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                            Top: {city.topPart} · {city.topMake}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trending failures */}
                <div>
                  <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={12} color="#FBBF24" /> TRENDING FAILURES — SOFT RECALL INTELLIGENCE
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {oem?.trendingFailures?.map((f: { part: string; count: number; makeModel: string; trend: string; alert: string }, i: number) => {
                      const alertColors: Record<string, string> = { SOFT_RECALL_CANDIDATE: "#F87171", SERVICE_BULLETIN: "#FBBF24", MONITOR: "#4FC3F7" };
                      const alertColor = alertColors[f.alert] ?? "#4FC3F7";
                      return (
                        <div key={i} className="ai-card" style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                                <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>{f.part}</p>
                                <span style={{ fontSize: "9px", padding: "1px 6px", background: `${alertColor}12`, border: `1px solid ${alertColor}30`, borderRadius: "4px", color: alertColor, fontWeight: 700, letterSpacing: "0.06em" }}>
                                  {f.alert.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{f.makeModel}</p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 800, color: "#FFF" }}>{f.count}</p>
                              <p style={{ fontSize: "11px", color: f.trend.startsWith("+") ? "#F87171" : "#34D399", fontWeight: 600 }}>{f.trend} trend</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SKILL TOKEN LEDGER TAB
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "ledger" && (
          <>
            {lLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: "70px", borderRadius: "12px" }} />)
            ) : (
              <>
                {/* Ledger stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tokens Issued",   value: ((ledger?.ledgerStats?.totalTokensIssued ?? 0) / 1000).toFixed(0) + "K", color: "#C9A227" },
                    { label: "Active Earners",  value: ledger?.ledgerStats?.activeEarners ?? 0,   color: "#4FC3F7" },
                    { label: "Master Techs",    value: ledger?.ledgerStats?.masterTechs ?? 0,      color: "#A78BFA" },
                    { label: "Avg Per Repair",  value: ledger?.ledgerStats?.avgTokensPerRepair ?? 0, color: "#34D399" },
                  ].map(s => (
                    <div key={s.label} className="ai-card" style={{ padding: "14px", textAlign: "center" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginTop: "4px", textTransform: "uppercase" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Blockchain status */}
                <div style={{ padding: "12px 16px", background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.15)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="scan-pulse" style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#C9A227" }} />
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    {ledger?.ledgerStats?.blockchainStatus} — Skill Tokens are tamper-proof digital credentials, more valuable than a paper certificate.
                  </p>
                </div>

                {/* Leaderboard */}
                <div>
                  <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Trophy size={12} color="#C9A227" /> PROFESSIONAL LEADERBOARD
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {ledger?.apprentices?.map((tech: { id: string; name: string; level: string; tokens: number; repairs: number; badge: string; specialty: string }, rank: number) => (
                      <div key={tech.id} className="ai-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Rank */}
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: rank < 3 ? `rgba(201,162,39,0.15)` : "rgba(255,255,255,0.04)", border: `1px solid ${rank < 3 ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {rank === 0 ? <Trophy size={14} color="#C9A227" /> : <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px", fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>#{rank + 1}</span>}
                        </div>

                        {/* Tech info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF" }}>{tech.name}</p>
                            <span style={{ fontSize: "9px", padding: "1px 6px", background: `${BADGE_COLOR[tech.badge]}12`, border: `1px solid ${BADGE_COLOR[tech.badge]}30`, borderRadius: "4px", color: BADGE_COLOR[tech.badge], fontWeight: 700, letterSpacing: "0.06em" }}>
                              {tech.badge.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                            <span style={{ fontSize: "10px", color: LEVEL_COLOR[tech.level] ?? "rgba(255,255,255,0.3)", fontWeight: 600 }}>{tech.level.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>· {tech.specialty}</span>
                          </div>
                        </div>

                        {/* Tokens + repairs */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 800, color: "#C9A227" }}>
                            {(tech.tokens).toLocaleString()} <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(201,162,39,0.5)" }}>SKL</span>
                          </p>
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{tech.repairs} repairs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div>
                  <p className="section-label mb-3" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Star size={12} color="#C9A227" /> RECENT TOKEN EVENTS
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {ledger?.recentActivity?.map((evt: { tech: string; event: string; tokens: string; timestamp: string }, i: number) => (
                      <div key={i} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Award size={13} color="#C9A227" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                            <span style={{ fontWeight: 600, color: "#FFF" }}>{evt.tech}</span> — {evt.event}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "#C9A227" }}>{evt.tokens}</p>
                          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>{evt.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
