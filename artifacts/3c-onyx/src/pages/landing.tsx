/**
 * 3C Onyx — Public Marketing Landing Page
 * Shown to logged-out visitors.
 * Apple × Bloomberg Terminal × luxury automotive aesthetic.
 * "The automotive intelligence layer. We move like water."
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Shield, Brain, ArrowRight, CheckCircle2, Zap,
  Lock, Users, BarChart3, Truck, DollarSign,
  ChevronDown, Star, Layers, Route, Cpu,
  TrendingDown, Eye, Heart,
} from "lucide-react";
import { NeuralMesh } from "@/components/NeuralMesh";
import { PublicNavbar } from "@/components/PublicNavbar";
import { GlobalFooter } from "@/components/GlobalFooter";

/* ─── Feature Cards ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    title: "ONYX AI Concierge",
    desc: "12 specialized agents working simultaneously. Tell us what you need in plain language — we handle everything from pricing to paperwork.",
    color: "#C9A227",
    badge: "12 AGENTS",
  },
  {
    icon: Shield,
    title: "Guardian V2X",
    desc: "Predictive safety mesh that monitors your vehicles in real time. Anomaly detection, insurance optimization, and failure prevention.",
    color: "#34D399",
    badge: "LIVE MONITORING",
  },
  {
    icon: Lock,
    title: "Blockchain Custody",
    desc: "Every vehicle transaction is SHA-256 hashed and anchored to Ethereum. Immutable chain of title — no disputes, no fraud.",
    color: "#818CF8",
    badge: "IMMUTABLE",
  },
  {
    icon: DollarSign,
    title: "Dynasty Wallet",
    desc: "Triple-split payment engine with Stripe escrow. 5% Member Slice on every transaction. Instant payouts to runners and specialists.",
    color: "#4FC3F7",
    badge: "STRIPE CONNECT",
  },
  {
    icon: Truck,
    title: "Runner Network",
    desc: "Background-verified gig network for vehicle delivery. Cryptographic proof-of-delivery. GPS tracked from dispatch to handoff.",
    color: "#F97316",
    badge: "GPS TRACKED",
  },
  {
    icon: Eye,
    title: "AR Spatial OS",
    desc: "Augmented reality vehicle inspection overlay. See VIN data, Guardian scores, and service history layered over the physical vehicle.",
    color: "#A78BFA",
    badge: "AR POWERED",
  },
];

const STATS = [
  { value: "$4.7M",  label: "Saved vs. Retail",     color: "#34D399" },
  { value: "12",     label: "AI Agents Live",        color: "#C9A227" },
  { value: "94%",    label: "Confidence Score",      color: "#60A5FA" },
  { value: "< 2h",   label: "Avg. Resolution Time",  color: "#A78BFA" },
];

const HOW = [
  { step: "01", title: "Tell ONYX What You Need", desc: "Text in plain language. No forms. \"Find me a car under $80k\" — that's it.", icon: Brain, color: "#C9A227" },
  { step: "02", title: "We Handle the Complexity", desc: "12 agents run simultaneously: pricing, inspection, insurance, routing, financing — all at once.", icon: Cpu, color: "#60A5FA" },
  { step: "03", title: "One Clear Answer", desc: "\"Best option saves you $840. We handle everything now.\" Transparent reasoning. Zero markup.", icon: CheckCircle2, color: "#34D399" },
  { step: "04", title: "Executed, Not Just Advised", desc: "Runner dispatched. Escrow opened. Blockchain record written. You just confirm.", icon: Zap, color: "#A78BFA" },
];

const TRUST_POINTS = [
  { icon: Shield, text: "SOC2 Type II Compliant" },
  { icon: Lock,   text: "AES-256 Encryption" },
  { icon: Eye,    text: "PII Masked by Default" },
  { icon: Users,  text: "Checkr-Verified Runners" },
  { icon: Heart,  text: "Never a Competitor" },
  { icon: Star,   text: "Blockchain Anchored" },
];

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
export default function LandingPage() {
  return (
    <div className="public-page">
      <PublicNavbar />

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
            <span style={{ fontSize: 9, fontWeight: 800, color: "#34D399", letterSpacing: "0.18em" }}>TRUST LAYER LIVE · SECURITY ACTIVE</span>
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
            THE AUTOMOTIVE<br />
            <span style={{
              background: "linear-gradient(90deg, #C9A227 0%, #60A5FA 45%, #A78BFA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              INTELLIGENCE LAYER.
            </span>
          </h1>

          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto 36px" }}>
            We sit between consumers and the automotive industry — coordinating every deal, every delivery, every decision. We don't compete. We coordinate. We move like water.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/join">
              <button style={{ padding: "14px 28px", borderRadius: 14, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.06em", boxShadow: "0 8px 32px rgba(201,162,39,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Brain size={16} />JOIN THE PLATFORM
              </button>
            </Link>
            <Link href="/trust">
              <button style={{ padding: "14px 24px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Layers size={15} />HOW IT WORKS
              </button>
            </Link>
          </div>

          {/* Scroll cue */}
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>DISCOVER MORE</span>
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <div style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--onyx-text-muted)", fontWeight: 700, marginBottom: 12 }}>THE PROCESS</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,6vw,52px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, color: "var(--onyx-text-primary)" }}>HOW WE COORDINATE</h2>
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
          <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--onyx-text-muted)", fontWeight: 700, marginBottom: 12 }}>THE PLATFORM</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,6vw,52px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, color: "var(--onyx-text-primary)" }}>WHAT'S INSIDE</h2>
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

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <div style={{ padding: "80px 24px 100px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.3em", color: "#C9A227", fontWeight: 700, marginBottom: 16 }}>READY?</p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, marginBottom: 16, color: "var(--onyx-text-primary)" }}>
          TELL US WHAT YOU NEED.<br />
          <span style={{ color: "#C9A227" }}>WE HANDLE EVERYTHING.</span>
        </h2>
        <p style={{ fontSize: 14, color: "var(--onyx-text-muted)", marginBottom: 36 }}>No phone tag. No markups. No confusion. One clear answer, executed.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/join">
            <button style={{ padding: "15px 32px", borderRadius: 14, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.08em", boxShadow: "0 8px 40px rgba(201,162,39,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              GET STARTED FREE <ArrowRight size={15} />
            </button>
          </Link>
          <Link href="/login">
            <button style={{ padding: "15px 24px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif" }}>
              SIGN IN
            </button>
          </Link>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
