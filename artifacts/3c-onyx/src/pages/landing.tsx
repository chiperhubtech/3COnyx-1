import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2,
  Users, DollarSign,
  ChevronDown, Star,
  Car, UserCheck, Briefcase, Crown,
  Shield, Zap, Heart, Wallet, Wrench,
  TrendingUp, Award, MapPin, Clock,
} from "lucide-react";
import { OnyxLogo } from "@/components/OnyxLogo";
import { GlobalFooter } from "@/components/GlobalFooter";

const GOLD = "#C9A227";

function SplashHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#050508", position: "relative", overflow: "hidden",
      padding: "60px 24px 40px",
    }}>
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600,
        background: `radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        textAlign: "center", maxWidth: 700, position: "relative", zIndex: 2,
      }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <OnyxLogo size={72} />
        </div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(36px, 8vw, 72px)",
          fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.01em",
          textTransform: "uppercase", color: "#fff",
          margin: "0 0 24px",
        }}>
          We Handle<br />
          <span style={{ color: GOLD }}>Everything.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2.5vw, 19px)", color: "rgba(255,255,255,0.5)",
          lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px", fontWeight: 400,
        }}>
          Buying a car. Selling a car. Parts &amp; accessories. Financing. Insurance. Plates. Delivery.
          We coordinate the entire deal so you don't have to.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/join">
            <button style={{
              padding: "16px 36px", borderRadius: 16,
              background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
              border: "none", color: "#000", fontWeight: 900, fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              letterSpacing: "0.04em", boxShadow: `0 8px 40px rgba(201,162,39,0.3)`,
              fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase",
            }}>
              Get Started <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/login">
            <button style={{
              padding: "16px 28px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 15,
              cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
            }}>
              Sign In
            </button>
          </Link>
        </div>

        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase" }}>See how it works</span>
          <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.2)", animation: "neural-float 2s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

const AUDIENCES = [
  {
    id: "consumer", icon: Car, color: "#3B82F6",
    title: "I Own or Want a Car",
    who: "Consumer · Enthusiast · First-time Buyer",
    lines: [
      "Tell us what you want — we find it, finance it, insure it, and deliver it.",
      "Need parts or accessories? We source and ship them straight to you.",
      "Already own a car? Track service, warranty, value — all in one place.",
      "No haggling. No runaround. One person handles your entire deal.",
    ],
    perks: [
      { icon: Car, text: "AI-matched vehicle search" },
      { icon: Wrench, text: "Parts & accessories delivered" },
      { icon: DollarSign, text: "Financing handled for you" },
      { icon: Shield, text: "Insurance + warranty in one tap" },
      { icon: MapPin, text: "Delivered to your door" },
    ],
    cta: "Join Free",
  },
  {
    id: "specialist", icon: UserCheck, color: GOLD,
    title: "I Work in Automotive",
    who: "Sales · F&I · Service · BDC · Tech · Appraiser · Runner",
    lines: [
      "Every deal you touch, you earn on. 3% platform commission split across everyone who contributes.",
      "Your CRM, your leads, your wallet — all connected. No more juggling 6 different apps.",
      "Whoever opens the door eats first. Bottom-up attribution, period.",
    ],
    perks: [
      { icon: Wallet, text: "Dynasty Wallet — instant payouts" },
      { icon: TrendingUp, text: "Lead management + CRM sync" },
      { icon: Users, text: "Referral network that pays" },
      { icon: Award, text: "Founding member slice — locked forever" },
    ],
    cta: "Claim Your Slice",
    highlight: true,
  },
  {
    id: "business", icon: Briefcase, color: "#10B981",
    title: "I Run a Dealership",
    who: "Dealer Principal · GM · OEM · Lender · Vendor",
    lines: [
      "Plug into a network of verified professionals, AI-powered deal flow, and real-time analytics.",
      "Compatible with VinSolutions, DealerTrack, RouteOne, and 6 more CRM platforms.",
      "90-day free pilot. No credit card. See it work before you commit.",
    ],
    perks: [
      { icon: Zap, text: "9 CRM platform integrations" },
      { icon: TrendingUp, text: "Real-time pipeline analytics" },
      { icon: Users, text: "Verified professional network" },
      { icon: Clock, text: "90-day free pilot program" },
    ],
    cta: "Activate Portal",
  },
];

function FrontDoor() {
  const [selected, setSelected] = useState<string | null>(null);
  const pick = AUDIENCES.find(a => a.id === selected);

  return (
    <div style={{
      padding: "80px 24px 100px",
      background: "linear-gradient(180deg, #050508 0%, #0a0a0f 100%)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.3em", color: GOLD,
            fontWeight: 700, marginBottom: 12, textTransform: "uppercase",
          }}>One door for everyone</p>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900,
            color: "#fff", textTransform: "uppercase", lineHeight: 1,
            marginBottom: 10,
          }}>
            Who Are You?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", maxWidth: 480, margin: "0 auto" }}>
            Choose your path. Same platform, built for everyone.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {AUDIENCES.map(a => {
            const Icon = a.icon;
            const active = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(active ? null : a.id)}
                style={{
                  textAlign: "left", padding: 28, borderRadius: 24,
                  border: `2px solid ${active ? a.color : "rgba(255,255,255,0.06)"}`,
                  background: active ? `${a.color}08` : "rgba(255,255,255,0.02)",
                  cursor: "pointer", transition: "all 0.3s",
                  transform: active ? "scale(1.02)" : "scale(1)",
                  position: "relative", color: "#fff",
                }}>
                {a.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: GOLD, color: "#000",
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.15em",
                    padding: "3px 14px", borderRadius: 20, textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>
                    Founding Slice Available
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    padding: 12, borderRadius: 14,
                    background: `${a.color}15`, border: `1px solid ${a.color}25`,
                  }}>
                    <Icon size={20} style={{ color: a.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: a.color, fontFamily: "monospace", marginTop: 2 }}>{a.who}</div>
                  </div>
                </div>

                {!active && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, margin: 0 }}>
                    {a.lines[0]}
                  </p>
                )}

                {active && (
                  <div style={{ animation: "slideUp 0.3s ease" }}>
                    {a.lines.map((line, i) => (
                      <p key={i} style={{
                        fontSize: 13, color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.7, marginBottom: i < a.lines.length - 1 ? 12 : 20,
                      }}>
                        {line}
                      </p>
                    ))}

                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                      marginBottom: 20,
                    }}>
                      {a.perks.map(p => {
                        const PIcon = p.icon;
                        return (
                          <div key={p.text} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: 11, color: "rgba(255,255,255,0.5)",
                          }}>
                            <PIcon size={13} style={{ color: a.color, flexShrink: 0 }} />
                            {p.text}
                          </div>
                        );
                      })}
                    </div>

                    <Link href="/join">
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "12px 24px", borderRadius: 14,
                        background: a.color, color: a.id === "specialist" ? "#000" : "#fff",
                        fontWeight: 800, fontSize: 14, cursor: "pointer",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: "0.04em",
                      }}>
                        {a.cta} <ArrowRight size={15} />
                      </div>
                    </Link>
                  </div>
                )}

                {!active && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 12, fontWeight: 700, color: a.color, marginTop: 12,
                  }}>
                    Learn more <ArrowRight size={13} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const STEPS = [
    {
      num: "01", title: "Tell us what you need",
      desc: "Type it like a text message. \"I want a 2024 Honda Civic under $30K\" or \"I need brake pads for my F-150.\" Our AI understands.",
      color: GOLD,
    },
    {
      num: "02", title: "We coordinate everything",
      desc: "Financing, insurance, trade-in, plates, delivery — all handled behind the scenes. You just confirm.",
      color: "#60A5FA",
    },
    {
      num: "03", title: "You get the deal",
      desc: "Every step tracked. Every document signed digitally. Every person who helped gets paid automatically.",
      color: "#34D399",
    },
  ];

  return (
    <div style={{
      padding: "80px 24px", maxWidth: 900, margin: "0 auto",
    }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
          How it works
        </p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900,
          textTransform: "uppercase", lineHeight: 1, color: "#fff",
        }}>
          Three steps. That's it.
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s.num} style={{
            display: "flex", gap: 24, alignItems: "flex-start",
            padding: "32px 0",
            borderBottom: i < STEPS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 48, fontWeight: 900, color: `${s.color}20`,
              lineHeight: 1, minWidth: 60,
            }}>
              {s.num}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{s.title}</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustStrip() {
  const POINTS = [
    "Bank-grade encryption",
    "Every transaction tracked",
    "Real people, verified",
    "No hidden fees",
    "Your data stays yours",
  ];
  return (
    <div style={{
      padding: "28px 24px",
      borderTop: "1px solid rgba(255,255,255,0.04)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(255,255,255,0.01)",
    }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 20,
        justifyContent: "center", alignItems: "center",
      }}>
        {POINTS.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={12} style={{ color: "#34D399" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FounderQuote() {
  return (
    <div style={{
      padding: "80px 24px",
      background: "linear-gradient(180deg, #0a0a0f 0%, #050508 100%)",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <Crown size={24} style={{ color: GOLD, marginBottom: 20 }} />
        <blockquote style={{
          fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 600,
          color: "rgba(255,255,255,0.7)", lineHeight: 1.8,
          margin: "0 0 24px", fontStyle: "italic",
        }}>
          "I built this for the person on the floor. The one who opens the door,
          shakes the hand, stays late, and gets paid last. That ends here.
          Whoever opens the door eats first."
        </blockquote>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          — <strong style={{ color: "rgba(255,255,255,0.6)" }}>Ron</strong> · Founder ·{" "}
          <span style={{ color: GOLD }}>CUXTOMCANDYCLUB LLC</span>
        </div>
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <div style={{
      padding: "80px 24px 100px", textAlign: "center",
      maxWidth: 600, margin: "0 auto",
    }}>
      <p style={{
        fontSize: 10, letterSpacing: "0.3em", color: GOLD,
        fontWeight: 700, marginBottom: 16, textTransform: "uppercase",
      }}>
        Ready?
      </p>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 900,
        textTransform: "uppercase", lineHeight: 1,
        marginBottom: 12, color: "#fff",
      }}>
        Your Move.
      </h2>
      <p style={{
        fontSize: 14, color: "rgba(255,255,255,0.35)",
        marginBottom: 36, lineHeight: 1.7,
      }}>
        No credit card. No contract. Founding member pricing locked forever.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/join">
          <button style={{
            padding: "16px 36px", borderRadius: 16,
            background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
            border: "none", color: "#000", fontWeight: 900, fontSize: 15,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            letterSpacing: "0.06em",
            boxShadow: `0 8px 40px rgba(201,162,39,0.25)`,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            Get Started <ArrowRight size={16} />
          </button>
        </Link>
        <Link href="/login">
          <button style={{
            padding: "16px 28px", borderRadius: 16,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: 15,
            cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            Sign In
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes neural-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
      <SplashHero />
      <TrustStrip />
      <FrontDoor />
      <HowItWorks />
      <FounderQuote />
      <FinalCTA />
      <GlobalFooter />
    </div>
  );
}
