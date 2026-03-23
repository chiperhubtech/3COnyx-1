import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  TrendingDown,
  ShieldCheck,
  Star,
  Globe,
  Leaf,
  Users,
  Scale,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart2,
  Heart,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toLocaleString()}`;

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

export default function Impact() {
  const [activeEsg, setActiveEsg] = useState<"environmental" | "social" | "governance">("environmental");

  const { data: metrics, isLoading: mLoading } = useQuery({
    queryKey: ["impact-metrics"],
    queryFn: () => fetch(`${API}/impact/metrics`).then(r => r.json()),
    refetchInterval: 8_000,
  });

  const { data: mesh, isLoading: meshLoading } = useQuery({
    queryKey: ["impact-mesh"],
    queryFn: () => fetch(`${API}/impact/integrity-mesh`).then(r => r.json()),
    refetchInterval: 12_000,
  });

  const { data: missionData } = useQuery({
    queryKey: ["impact-mission"],
    queryFn: () => fetch(`${API}/impact/mission-stats`).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const esgColors = {
    environmental: { accent: "#34D399", label: "Environmental", icon: Leaf },
    social:        { accent: "#4FC3F7", label: "Social",        icon: Users },
    governance:    { accent: "#A78BFA", label: "Governance",    icon: Scale },
  };

  const esgScore = metrics?.esg?.[activeEsg]?.score ?? 0;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "60px" }}>
      <PageHeader
        icon={Heart}
        title="3C Impact"
        accent="#34D399"
        badge={
          <span className="neural-badge-green" style={{ fontSize: "10px", padding: "2px 8px" }}>
            ● LIVE METRICS
          </span>
        }
        subtitle="Eliminating the #1 source of consumer complaints"
        actions={
          <Link href="/guardian">
            <button className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }}>
              Guardian →
            </button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">

        {/* ── MISSION BANNER ─────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(201,162,39,0.05) 100%)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "16px",
          padding: "20px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "100%", background: "radial-gradient(circle at 100% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Globe size={18} color="#34D399" />
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", color: "#34D399", marginBottom: "6px", textTransform: "uppercase" }}>Our Mission</p>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, fontWeight: 500 }}>
                Eliminating the <span style={{ color: "#C9A227", fontWeight: 700 }}>#1 source of consumer complaints</span> through Agentic Transparency and Wholesale Access.
              </p>
              {missionData && (
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
                  {missionData.cfaRanking}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── IGNORANCE TAX TRACKER ───────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <TrendingDown size={14} color="#C9A227" />
            <p className="section-label">THE IGNORANCE TAX TRACKER</p>
          </div>

          <div className="ai-card neural-glow-gold" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

            {mLoading ? (
              <div className="skeleton" style={{ height: "100px", borderRadius: "12px" }} />
            ) : (
              <>
                {/* Big savings number */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                  <p style={{ fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>
                    Total Member Savings vs. Retail Markup
                  </p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(44px, 10vw, 64px)", fontWeight: 900, color: "#34D399", lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {fmt(metrics?.ignoranceTax?.totalMemberSavings ?? 0)}
                  </p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
                    {pct(metrics?.ignoranceTax?.taxRate ?? 0.23)} average retail markup eliminated
                  </p>
                </div>

                {/* 3-stat row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Avg Per Deal",      value: fmt(metrics?.ignoranceTax?.avgSavingsPerDeal ?? 0), color: "#C9A227" },
                    { label: "Complaints Prev.",  value: (metrics?.complaints?.prevented ?? 0).toLocaleString(), color: "#4FC3F7" },
                    { label: "Members Protected", value: (metrics?.members?.protected ?? 0).toLocaleString(), color: "#A78BFA" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginTop: "4px", textTransform: "uppercase" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Guardian detection strip */}
                <div style={{ marginTop: "16px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={13} color="#34D399" />
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>Guardian Early Detections</span>
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 800, color: "#34D399" }}>
                    {(metrics?.complaints?.guardianDetections ?? 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                    {pct(metrics?.complaints?.resolutionRate ?? 0.97)} resolution rate
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── ESG SCORE PANEL ─────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <BarChart2 size={14} color="#A78BFA" />
            <p className="section-label">ESG INVESTOR SCORE</p>
            {metrics?.esg?.overall && (
              <span className="neural-badge-violet" style={{ fontSize: "10px", padding: "2px 8px", marginLeft: "auto" }}>
                Overall {metrics.esg.overall}/100
              </span>
            )}
          </div>

          {/* ESG tab switcher */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {(["environmental", "social", "governance"] as const).map(tab => {
              const cfg = esgColors[tab];
              const active = activeEsg === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveEsg(tab)}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    borderRadius: "10px",
                    border: active ? `1px solid ${cfg.accent}40` : "1px solid rgba(255,255,255,0.06)",
                    background: active ? `${cfg.accent}10` : "rgba(255,255,255,0.02)",
                    color: active ? cfg.accent : "rgba(255,255,255,0.35)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    transition: "all 0.15s",
                  }}
                >
                  <cfg.icon size={12} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="ai-card" style={{ padding: "24px" }}>
            {mLoading ? (
              <div className="skeleton" style={{ height: "120px", borderRadius: "12px" }} />
            ) : (
              <>
                {/* Score gauge */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "18px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke={esgColors[activeEsg].accent}
                        strokeWidth="8"
                        strokeDasharray={`${(esgScore / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                        style={{ filter: `drop-shadow(0 0 6px ${esgColors[activeEsg].accent}60)` }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, color: esgColors[activeEsg].accent }}>{esgScore}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 800, color: "#FFF", letterSpacing: "0.02em", textTransform: "uppercase", marginBottom: "4px" }}>
                      {esgColors[activeEsg].label} Score
                    </p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                      {metrics?.esg?.[activeEsg]?.detail}
                    </p>
                  </div>
                </div>

                {/* Supporting stat */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {activeEsg === "environmental" && (
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: "#34D399" }}>
                        {(metrics?.esg?.environmental?.co2Saved ?? 0).toLocaleString()} kg
                      </p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>CO₂ Avoided via Longevity</p>
                    </div>
                  )}
                  {activeEsg === "social" && (
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: "#4FC3F7" }}>
                        {(metrics?.esg?.social?.jobsSupported ?? 0).toLocaleString()}
                      </p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Jobs Supported — I-95 Corridor</p>
                    </div>
                  )}
                  {activeEsg === "governance" && (
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 800, color: "#A78BFA" }}>
                        {(metrics?.esg?.governance?.auditRecords ?? 0).toLocaleString()}
                      </p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Immutable Audit Records</p>
                    </div>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>SOC2 · NIST-MCP 2026</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── INTEGRITY MESH ──────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <ShieldCheck size={14} color="#4FC3F7" />
            <p className="section-label">INTEGRITY MESH — TWO-WAY REPUTATION LEDGER</p>
          </div>

          {meshLoading ? (
            <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }} />
          ) : (
            <>
              {/* Corridor stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Coverage",        value: "I-95 Spine",   color: "#4FC3F7" },
                  { label: "Verified Shops",  value: mesh?.corridorStats?.verifiedCount ?? 0, color: "#34D399" },
                  { label: "Avg Rating",      value: `${mesh?.corridorStats?.avgRating ?? 0} ★`, color: "#C9A227" },
                  { label: "Blockchain",      value: "ACTIVE",       color: "#A78BFA" },
                ].map(s => (
                  <div key={s.label} className="ai-card" style={{ padding: "14px", textAlign: "center" }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: "9px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", fontWeight: 700, marginTop: "4px", textTransform: "uppercase" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Shop list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(mesh?.shops ?? []).map((shop: {
                  id: string; name: string; city: string; state: string;
                  rating: number; reviews: number; verified: boolean;
                  specialties: string[]; blockchainHash: string | null;
                  trend: string; activeNow: boolean;
                }) => (
                  <div key={shop.id} className="ai-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Verified pulse badge */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: shop.verified ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${shop.verified ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: shop.verified && shop.activeNow ? "scan-pulse 2.5s ease-in-out infinite" : undefined,
                      }}>
                        {shop.verified ? <ShieldCheck size={16} color="#34D399" /> : <AlertTriangle size={16} color="rgba(255,255,255,0.25)" />}
                      </div>
                    </div>

                    {/* Shop info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shop.name}</p>
                        {shop.verified && (
                          <span style={{ fontSize: "9px", padding: "1px 6px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "4px", color: "#34D399", fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                            VERIFIED SHOP
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                        {shop.city}, {shop.state} · {shop.specialties.join(" · ")}
                      </p>
                      {shop.blockchainHash && (
                        <p style={{ fontSize: "10px", color: "rgba(79,195,247,0.5)", marginTop: "2px", fontFamily: "monospace" }}>
                          Ledger: {shop.blockchainHash}
                        </p>
                      )}
                    </div>

                    {/* Rating */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
                        <Star size={12} color="#C9A227" fill="#C9A227" />
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 800, color: "#C9A227" }}>{shop.rating.toFixed(1)}</span>
                      </div>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{shop.reviews} reviews</p>
                      <p style={{ fontSize: "10px", color: shop.trend.startsWith("+") ? "#34D399" : shop.trend.startsWith("-") ? "#F87171" : "rgba(255,255,255,0.3)" }}>
                        {shop.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── INDUSTRY CRISIS STATS ───────────────────────────────────── */}
        {missionData && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <CheckCircle size={14} color="#C9A227" />
              <p className="section-label">THE SYSTEMIC PROBLEM WE'RE SOLVING</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {missionData.keyStats.map((s: { label: string; value: string; note: string }, i: number) => (
                <div key={i} className="ai-card" style={{ padding: "16px" }}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 900, color: i === 0 ? "#F87171" : i === 1 ? "#F87171" : i === 2 ? "#34D399" : "#C9A227", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>{s.label}</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "3px", lineHeight: 1.4 }}>{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRO CTA ─────────────────────────────────────────────────── */}
        <Link href="/pro">
          <div className="ai-card neural-glow-gold" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 800, color: "#FFF", textTransform: "uppercase" }}>
                Professional Agentic Mesh
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                Apprentice → Master Tech · Foreman OS · OEM Intelligence
              </p>
            </div>
            <ArrowRight size={20} color="#C9A227" />
          </div>
        </Link>

        {/* ── MISSION FOOTER ──────────────────────────────────────────── */}
        <div style={{ textAlign: "center", padding: "24px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "8px" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.6 }}>
            "Eliminating the #1 source of consumer complaints through<br />
            Agentic Transparency and Wholesale Access."
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "8px" }}>
            3C Onyx · Cuxtom Candy Club · CFA Impact Initiative 2026
          </p>
        </div>

      </div>
    </div>
  );
}
