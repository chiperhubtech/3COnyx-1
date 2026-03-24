/**
 * 3C / CUXTOM CANDY CLUB — Trust Layer Page
 *
 * Explains how the platform works as a trust layer between consumers
 * and the automotive industry. Not a competitor to anyone.
 * "We move like water."
 */
import { useState } from "react";
import {
  Shield, Users, Building2, ArrowRight, CheckCircle2,
  Zap, Lock, Eye, BarChart3, Heart, Layers,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const PARTIES = [
  {
    icon: Users,
    label: "CONSUMERS",
    desc: "Buyers, sellers, owners — anyone who drives",
    color: "#C9A227",
  },
  {
    icon: Layers,
    label: "3C ONYX",
    desc: "The trust layer — we handle coordination, decision-making, and execution",
    color: "#60A5FA",
    center: true,
  },
  {
    icon: Building2,
    label: "AUTOMOTIVE INDUSTRY",
    desc: "Dealers, shops, specialists, insurers, carriers",
    color: "#34D399",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "You Tell Us What You Need",
    desc: "Text ONYX, our AI Concierge, in plain language. No forms, no phone tag, no runaround.",
    icon: Zap,
    color: "#C9A227",
    examples: ["\"Find me a car under $80k\"", "\"My car makes a noise\"", "\"I need insurance\""],
  },
  {
    step: "02",
    title: "We Handle the Complexity",
    desc: "Our AI dispatches specialized agents to source, price, diagnose, match, and verify — simultaneously, invisibly.",
    icon: BarChart3,
    color: "#60A5FA",
    examples: ["Pricing comparison across 12 sources", "Background checks on service providers", "Route optimization for delivery"],
  },
  {
    step: "03",
    title: "You Receive One Clear Answer",
    desc: "\"Best option saves you $420. We can handle everything now.\" No noise. No markups. No confusion.",
    icon: CheckCircle2,
    color: "#34D399",
    examples: ["Transparent pricing breakdown", "Reason for every recommendation", "Full audit trail logged"],
  },
  {
    step: "04",
    title: "Execution, Not Just Advice",
    desc: "We actually do it — book Runners, dispatch specialists, escrow payments, write blockchain records.",
    icon: Shield,
    color: "#A78BFA",
    examples: ["Runner dispatched in minutes", "Stripe escrow protects both sides", "Chain-of-custody on blockchain"],
  },
];

const TRUST_PRINCIPLES = [
  { icon: Shield,   label: "Never the Service Provider",  desc: "We coordinate. We never compete with the shops, dealers, or specialists we connect you with.", color: "#C9A227" },
  { icon: Eye,      label: "Full Transparency",            desc: "Every recommendation shows its reasoning. Every price comparison is real. Every decision is logged.", color: "#60A5FA" },
  { icon: Lock,     label: "SOC2 Audit Trail",             desc: "Every action writes to an immutable audit log. Blockchain chain-of-custody. SHA-256 delivery verification.", color: "#34D399" },
  { icon: Heart,    label: "Both Sides Win",               desc: "Consumers save. Professionals earn more. We charge a fair platform fee — never a hidden markup.", color: "#F472B6" },
];

const WHO_WE_SERVE = [
  {
    icon: Users,
    role: "Consumers",
    color: "#C9A227",
    items: [
      "Save money vs. retail pricing",
      "Skip the runaround — one request handles everything",
      "Know exactly what you're getting and why",
      "Track everything live",
    ],
  },
  {
    icon: Building2,
    role: "Automotive Professionals",
    color: "#34D399",
    items: [
      "Get matched to qualified customers automatically",
      "No competing on price alone — trust drives selection",
      "Payments via Stripe — always protected",
      "Build verifiable reputation on the platform",
    ],
  },
  {
    icon: Shield,
    role: "Runners (Gig Network)",
    color: "#60A5FA",
    items: [
      "Set your own hours — pick up tasks from the network",
      "Cryptographic proof-of-delivery for every job",
      "Instant Stripe payouts",
      "Background-verified — earns you higher-pay tasks",
    ],
  },
];

export default function TrustPage() {
  const { t } = useTranslation();
  const [activeWho, setActiveWho] = useState(0);

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{ padding: "48px 0 60px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", fontSize: 10, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", marginBottom: 24 }}>
          <Layers size={11} /> {t("trust.badge")}
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 8vw, 64px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1, margin: "0 0 20px" }}>
          {t("trust.title")}<br />
          <span style={{ color: "#60A5FA" }}>{t("trust.titleGold")}</span>
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 36px" }}>
          {t("trust.sub")}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/concierge" style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(96,165,250,0.9)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: "0.06em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            TALK TO ONYX AI <ArrowRight size={14} />
          </a>
          <a href="/apply" style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            JOIN AS PROFESSIONAL
          </a>
        </div>
      </div>

      {/* Trust Layer Diagram */}
      <div style={{ padding: "48px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", textAlign: "center", marginBottom: 32 }}>{t("trust.principles")}</p>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          {PARTIES.map((party, i) => {
            const Icon = party.icon;
            const isCenter = !!party.center;
            return (
              <div key={party.label} style={{ flex: isCenter ? 1.4 : 1, display: "flex", alignItems: "center", gap: 0 }}>
                {i > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
                    <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                    <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)", transform: "rotate(180deg)" }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: "24px 20px", borderRadius: 16, background: isCenter ? "rgba(96,165,250,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${isCenter ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.07)"}`, textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${party.color}14`, border: `1px solid ${party.color}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Icon size={20} style={{ color: party.color }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: party.color, letterSpacing: "0.1em", margin: "0 0 8px" }}>{party.label}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: 0 }}>{party.desc}</p>
                  {isCenter && (
                    <div style={{ marginTop: 12, padding: "4px 10px", borderRadius: 20, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", display: "inline-block" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em" }}>NOT A COMPETITOR</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ padding: "0 0 48px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", marginBottom: 24 }}>HOW IT WORKS</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {HOW_IT_WORKS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 20, padding: "20px 22px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: `${step.color}25`, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, width: 44, textAlign: "center" }}>{step.step}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon size={14} style={{ color: step.color }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{step.title}</p>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {step.examples.map((ex) => (
                    <div key={ex} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap", fontStyle: ex.startsWith('"') ? "italic" : "normal" }}>{ex}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Principles */}
      <div style={{ padding: "0 0 48px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", marginBottom: 20 }}>OUR TRUST PRINCIPLES</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {TRUST_PRINCIPLES.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} style={{ padding: "20px 18px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{label}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who We Serve */}
      <div style={{ padding: "0 0 48px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", marginBottom: 20 }}>WHO WE SERVE</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {WHO_WE_SERVE.map((group, i) => {
            const Icon = group.icon;
            return (
              <button key={group.role} onClick={() => setActiveWho(i)} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: activeWho === i ? `${group.color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${activeWho === i ? `${group.color}30` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={13} style={{ color: activeWho === i ? group.color : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: activeWho === i ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{group.role}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${WHO_WE_SERVE[activeWho].color}20` }}>
          {WHO_WE_SERVE[activeWho].items.map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <CheckCircle2 size={13} style={{ color: WHO_WE_SERVE[activeWho].color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "32px 28px", borderRadius: 20, background: "linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.04))", border: "1px solid rgba(96,165,250,0.15)", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.12em", marginBottom: 12 }}>READY TO EXPERIENCE IT?</p>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: "uppercase", color: "#fff", marginBottom: 10 }}>
          TELL US WHAT YOU NEED.<br />WE HANDLE EVERYTHING.
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
          No phone tag. No markups. No confusion. Just one clear answer, executed.
        </p>
        <a href="/concierge" style={{ padding: "13px 32px", borderRadius: 12, background: "rgba(96,165,250,0.9)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          START WITH ONYX AI <ArrowRight size={15} />
        </a>
      </div>

    </div>
  );
}
