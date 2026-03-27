/**
 * 3C Onyx — Home / Command Dashboard
 * Apple × GTA × Bloomberg Terminal × Cockpit
 * "The automotive intelligence layer. We move like water."
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ShoppingBag, Gauge, Truck, CreditCard, Bookmark,
  ArrowRight, QrCode, Zap, Shield,
  Wrench, ClipboardCheck, Package, LayoutDashboard,
  Brain, Layers, Lock, BarChart3, ChevronRight,
  Activity, Users, Cpu, Route,
} from "lucide-react";
import { NeuralMesh } from "@/components/NeuralMesh";
import IntelligencePanel, { PersonalSavingsTracker } from "@/components/IntelligencePanel";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

/* ─── Agent Status Ring ─────────────────────────────────────────────────────── */
const AGENTS = [
  { name: "ONYX",     color: "#C9A227", active: true  },
  { name: "PRICING",  color: "#60A5FA", active: true  },
  { name: "MARKET",   color: "#A78BFA", active: true  },
  { name: "GUARDIAN", color: "#34D399", active: true  },
  { name: "ROUTE",    color: "#F97316", active: true  },
  { name: "TRUST",    color: "#34D399", active: true  },
  { name: "AUDIT",    color: "#818CF8", active: false },
  { name: "INSPECT",  color: "#60A5FA", active: true  },
  { name: "FINANCE",  color: "#4FC3F7", active: false },
  { name: "CUSTODY",  color: "#818CF8", active: true  },
  { name: "RUNNER",   color: "#F97316", active: true  },
  { name: "SENTINEL", color: "#34D399", active: false },
];

function AgentRing() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const active = AGENTS.filter((a) => a.active).length;

  return (
    <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
      {/* Center orb */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 72, height: 72, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.04) 60%, transparent 100%)",
        border: "1px solid rgba(201,162,39,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 40px rgba(201,162,39,0.15), inset 0 0 20px rgba(201,162,39,0.05)",
      }}>
        <Brain size={22} style={{ color: "#C9A227" }} />
      </div>
      {/* Rotating ring */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        border: "1px dashed rgba(201,162,39,0.12)",
        animation: "slow-spin 30s linear infinite",
      }} />
      {/* Agent nodes around ring */}
      {AGENTS.map((agent, i) => {
        const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
        const r = 76;
        const x = 90 + r * Math.cos(angle);
        const y = 90 + r * Math.sin(angle);
        const isPulsing = agent.active && (tick % AGENTS.length) === i;
        return (
          <div
            key={agent.name}
            title={agent.name}
            style={{
              position: "absolute",
              left: x - 6, top: y - 6,
              width: 12, height: 12,
              borderRadius: "50%",
              background: agent.active ? agent.color : "rgba(255,255,255,0.1)",
              opacity: agent.active ? 1 : 0.25,
              boxShadow: isPulsing ? `0 0 12px 4px ${agent.color}` : agent.active ? `0 0 4px ${agent.color}80` : "none",
              transition: "box-shadow 0.4s",
            }}
          />
        );
      })}
      {/* Active count badge */}
      <div style={{
        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
        fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.1em", whiteSpace: "nowrap",
      }}>
        {active}/{AGENTS.length} LIVE
      </div>
    </div>
  );
}

/* ─── Stat Pulse Card ─────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub: string; color: string; icon: any;
}) {
  return (
    <div style={{
      flex: 1,
      padding: "18px 20px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      position: "relative",
      overflow: "hidden",
      minWidth: 0,
    }}>
      {/* Corner glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Icon size={11} style={{ color }} />
        <span style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{label}</span>
      </div>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(28px, 4vw, 38px)",
        fontWeight: 900, color, lineHeight: 1, margin: 0,
      }}>{value}</p>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>{sub}</p>
    </div>
  );
}

/* ─── Quick Action Card ─────────────────────────────────────────────────────── */
function ActionCard({ icon: Icon, label, description, href, accent, glow }: {
  icon: any; label: string; description: string; href: string; accent: string; glow: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "20px 18px",
          borderRadius: 16,
          background: hovered ? `${glow}` : "rgba(255,255,255,0.025)",
          border: `1px solid ${hovered ? accent + "35" : "rgba(255,255,255,0.07)"}`,
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: hovered ? `0 8px 32px ${accent}12, 0 0 0 1px ${accent}18` : "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${accent}12`, border: `1px solid ${accent}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
          boxShadow: hovered ? `0 0 16px ${accent}30` : "none",
          transition: "box-shadow 0.2s",
        }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "0.02em", marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", lineHeight: 1.4, marginBottom: 14 }}>{description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: accent, fontWeight: 600, letterSpacing: "0.06em" }}>OPEN</span>
          <ArrowRight size={11} style={{ color: accent }} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Intelligence Bar ─────────────────────────────────────────────────────── */
function IntelligenceBar({ savingsStr }: { savingsStr: string }) {
  const [agentCount, setAgentCount] = useState(9);
  const [confidence, setConfidence] = useState(94);
  const [latency, setLatency] = useState(0.18);

  useEffect(() => {
    const id = setInterval(() => {
      setAgentCount(8 + Math.floor(Math.random() * 5));
      setConfidence(91 + Math.floor(Math.random() * 7));
      setLatency(+(0.12 + Math.random() * 0.14).toFixed(2));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const pills = [
    { label: "AGENTS LIVE",   value: `${agentCount}`,         color: "#C9A227" },
    { label: "AVG RESPONSE",  value: `${latency}s`,           color: "#60A5FA" },
    { label: "CONFIDENCE",    value: `${confidence}%`,        color: "#34D399" },
    { label: "SAVED VS RETAIL", value: savingsStr,            color: "#A78BFA" },
    { label: "SECURITY",      value: "SOC2 · PII MASKED",     color: "#34D399" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      padding: "0 0 20px",
      overflowX: "auto",
      scrollbarWidth: "none",
    }}>
      {pills.map((p, i) => (
        <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
          <div style={{ padding: "6px 16px", borderRadius: 0 }}>
            <p style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 2 }}>{p.label}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 800, color: p.color, letterSpacing: "0.04em", lineHeight: 1 }}>{p.value}</p>
          </div>
          {i < pills.length - 1 && (
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Home Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [time, setTime] = useState(new Date());
  const [walletBalance] = useState("$21,200");
  const [deliveries] = useState("1");
  const [watchlistCount] = useState("4");
  const [notifCount] = useState("9");

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: impactMetrics } = useQuery({
    queryKey: ["home-impact"],
    queryFn: () => fetch(`${API}/impact/metrics`).then(r => r.json()),
    refetchInterval: 10_000,
  });

  const hour = time.getHours();
  const greeting = hour < 12 ? t("home.greeting.morning") : hour < 18 ? t("home.greeting.afternoon") : t("home.greeting.evening");
  const timeStr  = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr  = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const savingsStr = impactMetrics?.ignoranceTax?.totalMemberSavings
    ? `$${(impactMetrics.ignoranceTax.totalMemberSavings / 1_000_000).toFixed(2)}M`
    : "$4.72M";

  return (
    <div style={{ background: "#050508", minHeight: "100%", overflowX: "hidden" }}>

      {/* ── HERO — Neural Brain Section ───────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden" }}>

        {/* Neural Mesh canvas — full bleed background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <NeuralMesh height={480} nodeCount={56} />
        </div>

        {/* Dark gradient overlay to make text readable */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(5,5,8,0.45) 0%, rgba(5,5,8,0.7) 60%, rgba(5,5,8,1) 100%)",
          pointerEvents: "none",
        }} />

        {/* Left-side amber glow orb */}
        <div style={{
          position: "absolute", top: -100, left: -80, zIndex: 1,
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(201,162,39,0.07) 0%, transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none",
        }} />

        {/* Right-side blue glow orb */}
        <div style={{
          position: "absolute", top: -60, right: -60, zIndex: 1,
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Hero Content */}
        <div style={{ position: "relative", zIndex: 2, padding: "32px 40px 0" }}>

          {/* Top status bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", letterSpacing: "0.14em" }}>SECURITY ACTIVE · PII MASKED</span>
              </div>
              <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)", fontSize: 9, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em" }}>
                TRUST LAYER LIVE
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.9)", lineHeight: 1, letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>{timeStr}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", marginTop: 2 }}>{dateStr}</p>
            </div>
          </div>

          {/* Main hero — two columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center", paddingBottom: 40 }}>

            {/* Left: copy */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.35em", color: "#C9A227", fontWeight: 700, marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {greeting}, MEMBER
              </p>

              <h1 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(48px, 7vw, 84px)",
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-0.01em",
                color: "#fff",
                textTransform: "uppercase",
                margin: "0 0 20px",
              }}>
                {t("home.hero.line1")}<br />
                <span style={{
                  background: "linear-gradient(90deg, #C9A227 0%, #60A5FA 50%, #A78BFA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {t("home.hero.line2")}
                </span>
              </h1>

              <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, #C9A227, #60A5FA, transparent)", marginBottom: 16 }} />

              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 420, lineHeight: 1.75, marginBottom: 24 }}>
                {t("home.hero.sub")}
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/concierge">
                  <button style={{
                    padding: "11px 22px", borderRadius: 12,
                    background: "linear-gradient(135deg, #C9A227, #8B6914)",
                    border: "none", cursor: "pointer",
                    color: "#000", fontWeight: 800, fontSize: 12, letterSpacing: "0.08em",
                    display: "flex", alignItems: "center", gap: 7,
                    boxShadow: "0 4px 20px rgba(201,162,39,0.3)",
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}>
                    <Brain size={14} />{t("home.hero.cta")}
                  </button>
                </Link>
                <Link href="/trust">
                  <button style={{
                    padding: "11px 22px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    cursor: "pointer", color: "rgba(255,255,255,0.7)",
                    fontWeight: 700, fontSize: 12, letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", gap: 7,
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}>
                    <Layers size={14} />{t("home.hero.howItWorks")}
                  </button>
                </Link>
              </div>

              {/* Integration pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>
                {[
                  { label: "ONYX Neural",    color: "#F87171" },
                  { label: "ONYX Pay",       color: "#818CF8" },
                  { label: "ONYX Finance",   color: "#4FC3F7" },
                  { label: "ONYX Vehicle",   color: "#F97316" },
                  { label: "ONYX Insurance", color: "#34D399" },
                  { label: "ONYX Chain",     color: "#A78BFA" },
                ].map((p) => (
                  <span key={p.label} style={{
                    padding: "3px 9px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                    background: `${p.color}10`, border: `1px solid ${p.color}25`, color: p.color,
                    letterSpacing: "0.08em",
                  }}>{p.label}</span>
                ))}
              </div>
            </div>

            {/* Right: Agent Ring + Feed */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <AgentRing />
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", textAlign: "center" }}>
                12-AGENT NEURAL MESH
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTELLIGENCE STATUS BAR ─────────────────────────────────── */}
      <div style={{ padding: "0 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <IntelligenceBar savingsStr={savingsStr} />
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────── */}
      <div style={{ padding: "32px 40px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 28 }}>

        {/* Left column */}
        <div style={{ minWidth: 0 }}>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <StatCard label="WALLET BALANCE"    value={walletBalance}    sub="After 5% Member Slice" color="#34D399" icon={CreditCard} />
            <StatCard label="ACTIVE DELIVERIES" value={deliveries}        sub="In transit now"        color="#C9A227" icon={Truck} />
            <StatCard label="WATCHLIST"         value={watchlistCount}   sub="Vehicles tracked"      color="#60A5FA" icon={Bookmark} />
            <StatCard label="NOTIFICATIONS"     value={notifCount}       sub="Unread alerts"         color="#F87171" icon={Activity} />
          </div>

          {/* Personal Savings Tracker */}
          <div style={{ marginBottom: 28 }}>
            <PersonalSavingsTracker token={token} />
          </div>

          {/* Quick Access — 3 col grid */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>QUICK ACCESS</p>
            <Link href="/marketplace">
              <span style={{ fontSize: 11, color: "#C9A227", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>All services <ArrowRight size={11} /></span>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
            <ActionCard icon={ShoppingBag} label="Marketplace"    description="Certified luxury vehicles" href="/marketplace"  accent="#C9A227" glow="rgba(201,162,39,0.07)" />
            <ActionCard icon={Gauge}       label="My Garage"      description="Fleet & telematics"        href="/garage"       accent="#4FC3F7" glow="rgba(79,195,247,0.07)"  />
            <ActionCard icon={Truck}       label="Live Tracking"  description="Runner GPS"                href="/logistics"    accent="#A78BFA" glow="rgba(167,139,250,0.07)" />
            <ActionCard icon={CreditCard}  label="Dynasty Wallet" description="KYC · Triple-split"       href="/wallet"       accent="#34D399" glow="rgba(52,211,153,0.07)"  />
            <ActionCard icon={Bookmark}    label="Watchlist"      description="Price alerts & targets"   href="/watchlist"    accent="#F87171" glow="rgba(248,113,113,0.07)" />
            <ActionCard icon={QrCode}      label="Proof of Drop"  description="QR handshake · audit"     href="/delivery"     accent="#FBBF24" glow="rgba(251,191,36,0.07)"  />
          </div>

          {/* Pro Professionals */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>AUTOMOTIVE PROFESSIONALS</p>
            <Link href="/pro">
              <span style={{ fontSize: 11, color: "#A78BFA", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Pro Mesh <ArrowRight size={11} /></span>
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
            {[
              { icon: Wrench,          label: "Pro Mesh",     sub: "Apprentice → Master",     href: "/pro",                  accent: "#A78BFA" },
              { icon: LayoutDashboard, label: "Specialist",   sub: "Earnings & ratings",      href: "/specialist-dashboard", accent: "#4FC3F7" },
              { icon: ClipboardCheck,  label: "Inspection",   sub: "Pre-pickup SHA-256",      href: "/inspection",           accent: "#34D399" },
              { icon: Package,         label: "Dropship",     sub: "BOL · 360° scan",         href: "/dropship",             accent: "#F97316" },
            ].map((p) => (
              <Link key={p.href} href={p.href}>
                <div
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `${p.accent}08`;
                    (e.currentTarget as HTMLDivElement).style.borderColor = `${p.accent}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${p.accent}12`, border: `1px solid ${p.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <p.icon size={15} style={{ color: p.accent }} />
                  </div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>{p.sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Platform Feature Strip */}
          <div style={{
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(201,162,39,0.04)",
            border: "1px solid rgba(201,162,39,0.12)",
            display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between",
          }}>
            {[
              { icon: Shield,    text: "SOC2 Compliant",    color: "#34D399" },
              { icon: Zap,       text: "Real-Time GPS",     color: "#C9A227" },
              { icon: Lock,      text: "AES-256 Encrypted", color: "#60A5FA" },
              { icon: Brain,     text: "12-Agent AI Mesh",  color: "#A78BFA" },
              { icon: Users,     text: "Checkr Verified",   color: "#4FC3F7" },
              { icon: Cpu,       text: "Blockchain Anchored", color: "#818CF8" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={12} style={{ color }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Proactive Intelligence */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Personalized Alert Feed */}
          <IntelligencePanel token={token} />

          {/* Neural Agent Grid */}
          <div style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 7 }}>
              <Cpu size={12} style={{ color: "#60A5FA" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#60A5FA", letterSpacing: "0.12em" }}>AGENT STATUS</span>
            </div>
            <div style={{ padding: "10px 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {AGENTS.map((agent) => (
                <div key={agent.name} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 8px", borderRadius: 6,
                  background: agent.active ? `${agent.color}08` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${agent.active ? agent.color + "20" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: agent.active ? agent.color : "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: agent.active ? agent.color : "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>{agent.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 7 }}>
              <Route size={12} style={{ color: "#A78BFA" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#A78BFA", letterSpacing: "0.12em" }}>PLATFORM</span>
            </div>
            <div style={{ padding: "8px 10px" }}>
              {[
                { label: "Guardian V2X",        sub: "Predictive safety",      href: "/guardian",   color: "#34D399" },
                { label: "Blockchain Custody",   sub: "SHA-256 chain",          href: "/custody",    color: "#818CF8" },
                { label: "SDV Intelligence",      sub: "$213B → $1.2T market",   href: "/sdv",        color: "#C9A227" },
                { label: "Trust Layer",          sub: "How it works",           href: "/trust",      color: "#60A5FA" },
                { label: "AI Command Center",    sub: "K-factor · kill-switch", href: "/command",    color: "#EF4444" },
                { label: "AR Spatial OS",        sub: "Rocksolid · Guardian",   href: "/ar-viewer",  color: "#C9A227" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{item.sub}</p>
                    </div>
                    <ChevronRight size={12} style={{ color: item.color, opacity: 0.6 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
