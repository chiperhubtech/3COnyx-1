/**
 * 3C ONYX — Internal Vision Page
 * Sovereign + Staff only. Shows the full platform architecture and vision.
 * "The automotive intelligence layer" — for the team that builds it.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, Brain, ArrowRight, CheckCircle2, Zap,
  Lock, Users, BarChart3, Truck, DollarSign,
  ChevronDown, Star, Layers, Route, Cpu,
  TrendingDown, Eye, Heart, UserCheck, Briefcase, Car, Crown,
} from "lucide-react";
import { NeuralMesh } from "@/components/NeuralMesh";
import { PublicNavbar } from "@/components/PublicNavbar";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useTranslation } from "react-i18next";

/* ─── Industry Ticker ──────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "ONYX CRM Suite · Compatible with 9 major dealer platforms · Unified pipeline · Real-time sync",
  "BDC Reps · F&I Managers · Service Advisors · Master Techs · Appraisers · Runners · GMs · Dealer Principals",
  "F1 · NASCAR · NHRA · Motorsport Universe · 8-Tier ONYX Points System",
  "CUXTOMCANDYCLUB LLC · Founded by Ron · I-95 Dynasty · Mission: 132M Members",
];

function Ticker() {
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % TICKER_ITEMS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ background: "rgba(9,9,11,0.95)", borderTop: "1px solid #27272a", borderBottom: "1px solid #27272a", padding: "8px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 10, fontFamily: "monospace", color: "#52525b", letterSpacing: "0.15em", textTransform: "uppercase", transition: "opacity 0.5s" }}>
        {TICKER_ITEMS[tickerIdx]}
      </div>
    </div>
  );
}

/* ─── Front Door Selector ──────────────────────────────────────────────────── */
const DOOR_TYPES = [
  {
    id: "consumer",   icon: Car,       color: "#3B82F6",
    label: "I Own or Buy Cars",
    sub: "Consumer · Enthusiast · Car Owner",
    desc: "Track vehicles, access AI-powered deals, find verified specialists, join the marketplace.",
    cta: "Join as a Member",
    perks: ["Vehicle AI insights", "Verified specialist network", "Marketplace access", "ONYX Points rewards"],
  },
  {
    id: "specialist", icon: UserCheck, color: "#C9A227",
    label: "I Work in the Industry",
    sub: "BDC · F&I · Service · Sales · Tech · Appraiser · Runner",
    desc: "All 16 automotive professional roles. Your career network, CRM integrations, and Dynasty Wallet — built for you.",
    cta: "Claim Your Founding Slice",
    perks: ["16 role-specific AI tools", "CRM integration", "Lead management", "Dynasty Wallet"],
    highlight: true,
  },
  {
    id: "business",   icon: Briefcase, color: "#10B981",
    label: "I Run a Business",
    sub: "Dealer · OEM · Lender · Warranty · Vendor · Bank Rep",
    desc: "Enterprise CRM hub, real-time analytics, founding pilot program, and direct access to the I-95 professional network.",
    cta: "Activate Dealer Portal",
    perks: ["9 CRM platforms", "Live lead management", "Real-time analytics", "90-day free pilot"],
  },
];

function FrontDoor() {
  const [selected, setSelected] = useState<string | null>(null);
  const pick = DOOR_TYPES.find(d => d.id === selected);
  return (
    <div style={{ padding: "72px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "#C9A227", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>The Front Door</p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: "#fff", textTransform: "uppercase", lineHeight: 1, marginBottom: 8 }}>
          Everyone Walks Through the Same Door
        </h2>
        <p style={{ fontSize: 13, color: "#71717a" }}>Consumer. Specialist. Business. Choose your path.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {DOOR_TYPES.map(t => {
          const Icon = t.icon;
          const active = selected === t.id;
          return (
            <button key={t.id} onClick={() => setSelected(active ? null : t.id)}
              style={{ textAlign: "left", padding: 24, borderRadius: 20, border: `2px solid ${active ? t.color : "#27272a"}`, background: active ? `${t.color}10` : "#18181b", cursor: "pointer", transition: "all 0.25s", transform: active ? "scale(1.02)" : "scale(1)", position: "relative" }}>
              {t.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#C9A227", color: "#000", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Most Popular · Founding Slice
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 10, borderRadius: 12, background: `${t.color}20` }}>
                  <Icon size={18} style={{ color: t.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: t.color, fontFamily: "monospace" }}>{t.sub}</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.7, marginBottom: active ? 12 : 0 }}>{t.desc}</p>
              {active && (
                <div style={{ marginBottom: 12 }}>
                  {t.perks.map(p => (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#d4d4d8", marginBottom: 4 }}>
                      <span style={{ color: t.color }}>✓</span> {p}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: t.color, marginTop: 4 }}>
                {t.cta} <ArrowRight size={14} />
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/join">
          <button style={{ padding: "15px 36px", borderRadius: 16, background: pick ? pick.color : "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: pick?.id === "specialist" ? "#000" : pick ? "#fff" : "#000", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 8px 32px rgba(201,162,39,0.25)", letterSpacing: "0.05em", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {pick ? `${pick.cta} →` : "Claim Your Founding Member Slice →"}
          </button>
        </Link>
        <div style={{ fontSize: 10, color: "#52525b", marginTop: 8, fontFamily: "monospace" }}>
          No credit card required · Founding price locked forever · Industry Pro · Consumer · Business — all welcome
        </div>
      </div>
    </div>
  );
}

/* ─── I-95 Dynasty Quote ───────────────────────────────────────────────────── */
function DynastyQuote() {
  return (
    <div style={{ padding: "72px 24px", borderTop: "1px solid #1f1f22", background: "linear-gradient(180deg, #0a0a0d 0%, #18181b 100%)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <Crown size={28} style={{ color: "#C9A227", marginBottom: 20 }} />
        <blockquote style={{ fontSize: "clamp(17px,3vw,22px)", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
          "The I-95 Dynasty is live. Every service advisor, mechanic, F&I manager, appraiser,
          runner, and dealer I've built relationships with — your slice is pre-reserved.
          The platform is built. The AI is running. Now it's time to claim your piece of it."
        </blockquote>
        <div style={{ fontSize: 13, color: "#71717a" }}>
          — <strong style={{ color: "#d4d4d8" }}>Ron</strong> · Founder · <span style={{ color: "#C9A227" }}>CUXTOMCANDYCLUB LLC</span>
        </div>
        <div style={{ marginTop: 28 }}>
          <Link href="/join">
            <button style={{ padding: "14px 32px", borderRadius: 14, background: "#C9A227", color: "#000", fontWeight: 900, fontSize: 14, cursor: "pointer", border: "none", letterSpacing: "0.06em", fontFamily: "'Barlow Condensed', sans-serif" }}>
              Claim My Founding Slice →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Counter ──────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = to / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [to]);
  return <span>{val}{suffix}</span>;
}

/* ─── Main Landing Page ─────────────────────────────────────────────────── */
export default function VisionPage() {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: Brain,     title: t("landing.features.feature1Title"), desc: t("landing.features.feature1Desc"), color: "#C9A227", badge: t("landing.features.feature1Badge") },
    { icon: Shield,    title: t("landing.features.feature2Title"), desc: t("landing.features.feature2Desc"), color: "#34D399", badge: t("landing.features.feature2Badge") },
    { icon: Lock,      title: t("landing.features.feature3Title"), desc: t("landing.features.feature3Desc"), color: "#818CF8", badge: t("landing.features.feature3Badge") },
    { icon: DollarSign,title: t("landing.features.feature4Title"), desc: t("landing.features.feature4Desc"), color: "#4FC3F7", badge: t("landing.features.feature4Badge") },
    { icon: Truck,     title: t("landing.features.feature5Title"), desc: t("landing.features.feature5Desc"), color: "#F97316", badge: t("landing.features.feature5Badge") },
    { icon: Eye,       title: t("landing.features.feature6Title"), desc: t("landing.features.feature6Desc"), color: "#A78BFA", badge: t("landing.features.feature6Badge") },
  ];

  const STATS = [
    { value: "$4.7M", label: t("landing.stats.saved"),      color: "#34D399" },
    { value: "12",    label: t("landing.stats.agents"),     color: "#C9A227" },
    { value: "94%",   label: t("landing.stats.confidence"), color: "#60A5FA" },
    { value: "< 2h",  label: t("landing.stats.resolution"), color: "#A78BFA" },
  ];

  const HOW = [
    { step: "01", title: t("landing.how.step1Title"), desc: t("landing.how.step1Desc"), icon: Brain,        color: "#C9A227" },
    { step: "02", title: t("landing.how.step2Title"), desc: t("landing.how.step2Desc"), icon: Cpu,          color: "#60A5FA" },
    { step: "03", title: t("landing.how.step3Title"), desc: t("landing.how.step3Desc"), icon: CheckCircle2, color: "#34D399" },
    { step: "04", title: t("landing.how.step4Title"), desc: t("landing.how.step4Desc"), icon: Zap,          color: "#A78BFA" },
  ];

  const TRUST_POINTS = [
    { icon: Shield, text: t("landing.trust.soc2") },
    { icon: Lock,   text: t("landing.trust.aes") },
    { icon: Eye,    text: t("landing.trust.pii") },
    { icon: Users,  text: t("landing.trust.checkr") },
    { icon: Heart,  text: t("landing.trust.neverCompete") },
    { icon: Star,   text: t("landing.trust.blockchain") },
  ];

  return (
    <div className="public-page">
      <PublicNavbar />
      <Ticker />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "var(--onyx-page-bg)" }}>

        {/* Full bleed neural mesh */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <NeuralMesh height={700} nodeCount={70} />
        </div>

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(5,5,8,0.55) 0%, rgba(5,5,8,0.4) 40%, rgba(5,5,8,0.85) 85%, rgba(5,5,8,1) 100%)", pointerEvents: "none" }} />

        {/* Orb glows */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", top: "20%", right: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 1 }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, padding: "80px 24px 60px", maxWidth: 900, margin: "0 auto", width: "100%", textAlign: "center", boxSizing: "border-box" }}>

          {/* Status badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 20, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: 28 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#34D399", letterSpacing: "0.18em" }}>{t("landing.badge")}</span>
          </div>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(44px, 9vw, 108px)",
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            margin: "0 0 28px",
            color: "#fff",
          }}>
            {t("landing.hero.line1")}<br />
            <span style={{
              background: "linear-gradient(90deg, #C9A227 0%, #60A5FA 45%, #A78BFA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {t("landing.hero.line2")}
            </span>
          </h1>

          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto 36px" }}>
            {t("landing.hero.sub")}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/join">
              <button style={{ padding: "14px 28px", borderRadius: 14, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.06em", boxShadow: "0 8px 32px rgba(201,162,39,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Brain size={16} />{t("landing.hero.cta")}
              </button>
            </Link>
            <Link href="/trust">
              <button style={{ padding: "14px 24px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Layers size={15} />{t("landing.hero.howItWorks")}
              </button>
            </Link>
          </div>

          {/* Scroll cue */}
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>{t("landing.hero.discover")}</span>
            <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.2)", animation: "neural-float 2s ease-in-out infinite" }} />
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <div style={{ padding: "48px 24px", background: "var(--onyx-surface)", borderTop: "1px solid var(--onyx-border-line)", borderBottom: "1px solid var(--onyx-border-line)" }}>
        <div className="grid-4-col" style={{ maxWidth: 1000, margin: "0 auto" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "16px 20px" }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px,5vw,44px)", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "var(--onyx-text-muted)", letterSpacing: "0.14em", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FRONT DOOR — Who Are You? ────────────────────────────────── */}
      <FrontDoor />

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <div style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--onyx-text-muted)", fontWeight: 700, marginBottom: 12 }}>{t("landing.how.process")}</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,6vw,52px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, color: "var(--onyx-text-primary)" }}>{t("landing.how.title")}</h2>
        </div>
        <div className="grid-4-col">
          {HOW.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.step} style={{ padding: "24px 20px", borderRadius: 18, background: "var(--onyx-surface)", border: "1px solid var(--onyx-border-line)" }}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 900, color: `${h.color}30`, lineHeight: 1, marginBottom: 12 }}>{h.step}</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${h.color}12`, border: `1px solid ${h.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={16} style={{ color: h.color }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--onyx-text-primary)", marginBottom: 8, lineHeight: 1.2 }}>{h.title}</p>
                <p style={{ fontSize: 12, color: "var(--onyx-text-muted)", lineHeight: 1.6 }}>{h.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FEATURES GRID ────────────────────────────────────────────── */}
      <div style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--onyx-text-muted)", fontWeight: 700, marginBottom: 12 }}>{t("landing.features.platform")}</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,6vw,52px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, color: "var(--onyx-text-primary)" }}>{t("landing.features.title")}</h2>
        </div>
        <div className="grid-3-col">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ padding: "24px 22px", borderRadius: 18, background: "var(--onyx-surface)", border: "1px solid var(--onyx-border-line)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${f.color}12 0%, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 800, color: f.color, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 20, background: `${f.color}10`, border: `1px solid ${f.color}20` }}>{f.badge}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--onyx-text-primary)", marginBottom: 8 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: "var(--onyx-text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
      <div style={{ padding: "36px 24px", borderTop: "1px solid var(--onyx-border-line)", background: "var(--onyx-surface)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", alignItems: "center" }}>
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon size={13} style={{ color: "#34D399" }} />
              <span style={{ fontSize: 12, color: "var(--onyx-text-muted)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── I-95 DYNASTY QUOTE ───────────────────────────────────────── */}
      <DynastyQuote />

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 24px 100px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "#C9A227", fontWeight: 700, marginBottom: 16 }}>{t("landing.cta.ready")}</p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, marginBottom: 16, color: "var(--onyx-text-primary)" }}>
          {t("landing.cta.title")}<br />
          <span style={{ color: "#C9A227" }}>{t("landing.cta.titleGold")}</span>
        </h2>
        <p style={{ fontSize: 14, color: "var(--onyx-text-muted)", marginBottom: 36 }}>{t("landing.cta.sub")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/join">
            <button style={{ padding: "15px 32px", borderRadius: 14, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.08em", boxShadow: "0 8px 40px rgba(201,162,39,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {t("landing.cta.getStarted")} <ArrowRight size={15} />
            </button>
          </Link>
          <Link href="/login">
            <button style={{ padding: "15px 24px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {t("landing.cta.signIn")}
            </button>
          </Link>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
