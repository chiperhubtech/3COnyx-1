import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight, CheckCircle2,
  Users, DollarSign,
  ChevronDown, Star,
  Car, UserCheck, Briefcase, Crown,
  Shield, Zap, Heart, Wallet, Wrench,
  TrendingUp, Award, MapPin, Clock,
  Globe, Bot, ShoppingCart, Package,
  FileText, Phone, Share2, Shirt, QrCode,
} from "lucide-react";
import { OnyxLogo } from "@/components/OnyxLogo";
import { GlobalFooter } from "@/components/GlobalFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import LanguageSelector from "@/components/LanguageSelector";

const GOLD = "#C9A227";

function SplashHero() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="sovereign-bg" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#050508", position: "relative", overflow: "hidden",
      padding: "80px 24px 40px",
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
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 18px", borderRadius: 50,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 28,
        }}>
          <Globe size={14} style={{ color: GOLD }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            Choose your language
          </span>
          <LanguageSelector compact />
        </div>

        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <OnyxLogo size={72} />
        </div>

        <div className="sovereign-eyebrow sovereign-reveal" style={{ marginBottom: 14 }}>
          <span className="sovereign-glyph" style={{ marginRight: 8 }} />
          Sovereign Command · Automotive OS
        </div>

        <h1 className="sovereign-headline sovereign-reveal-2" style={{
          fontSize: "clamp(36px, 8vw, 72px)",
          color: "#fff",
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
            <button className="sovereign-pulse" style={{
              padding: "18px 40px", borderRadius: 16,
              background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
              border: "none", color: "#000", fontWeight: 900, fontSize: 17,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              letterSpacing: "0.04em",
              fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase",
              minHeight: 52,
            }}>
              Get Started <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/login">
            <button style={{
              padding: "18px 32px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 16,
              cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
              minHeight: 52,
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
      padding: "20px 24px 28px",
      borderTop: "1px solid rgba(255,255,255,0.04)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      background: "rgba(255,255,255,0.01)",
    }}>
      <div className="sovereign-divider-animated" style={{ maxWidth: 900, margin: "0 auto 16px" }} />
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 20,
        justifyContent: "center", alignItems: "center",
      }}>
        {POINTS.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
            <CheckCircle2 size={14} style={{ color: "#34D399" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const AUDIENCES = [
  {
    id: "consumer", icon: Car, color: "#3B82F6",
    title: "I Want to Buy, Sell, or Fix a Car",
    subtitle: "Tap here to see what we do for you",
    who: "Car owners, buyers, and enthusiasts",
    lines: [
      "Tell us what car you want — we find it, get your financing, set up insurance, and deliver it to your door.",
      "Need parts or accessories? We find them and ship them straight to you.",
      "Already own a car? Keep track of your service, warranty, and car value — all in one place.",
      "No haggling. No runaround. One person handles your entire deal from start to finish.",
    ],
    perks: [
      { icon: Car, text: "We find your perfect car" },
      { icon: Wrench, text: "Parts delivered to you" },
      { icon: DollarSign, text: "Financing taken care of" },
      { icon: Shield, text: "Insurance in one tap" },
      { icon: MapPin, text: "Delivered to your door" },
    ],
    cta: "Join Free — It's Easy",
  },
  {
    id: "specialist", icon: UserCheck, color: GOLD,
    title: "I Work in the Car Business",
    subtitle: "Tap here to learn how you earn more",
    who: "Sales reps, finance managers, service techs, and more",
    lines: [
      "Every deal you help with, you earn on. We split 3% across everyone who contributes.",
      "Your leads, your customers, your earnings — all in one dashboard. No more juggling six different apps.",
      "Whoever opens the door eats first. The person who does the work gets paid first.",
    ],
    perks: [
      { icon: Wallet, text: "Get paid instantly" },
      { icon: TrendingUp, text: "Manage all your leads" },
      { icon: Users, text: "Earn from referrals" },
      { icon: Award, text: "Lock in founder pricing forever" },
    ],
    cta: "Claim Your Spot",
    highlight: true,
  },
  {
    id: "business", icon: Briefcase, color: "#10B981",
    title: "I Run a Dealership or Business",
    subtitle: "Tap here to see how we help your business",
    who: "Dealer owners, GMs, lenders, and vendors",
    lines: [
      "Connect to a network of verified pros, AI-powered deal flow, and real-time reports.",
      "Works with VinSolutions, DealerTrack, RouteOne, and 6 more platforms you already use.",
      "Try it free for 90 days. No credit card needed. See it work before you commit.",
    ],
    perks: [
      { icon: Zap, text: "Connects with 9 platforms" },
      { icon: TrendingUp, text: "Real-time reports" },
      { icon: Users, text: "Verified professionals" },
      { icon: Clock, text: "90-day free trial" },
    ],
    cta: "Start Free Trial",
  },
];

function FrontDoor() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div style={{
      padding: "80px 24px 100px",
      background: "linear-gradient(180deg, #050508 0%, #0a0a0f 100%)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.3em", color: GOLD,
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
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto" }}>
            Pick the one that sounds like you. Same platform, built for everyone.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {AUDIENCES.map(a => {
            const Icon = a.icon;
            const active = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(active ? null : a.id)}
                style={{
                  textAlign: "left", padding: 32, borderRadius: 24,
                  border: `2px solid ${active ? a.color : "rgba(255,255,255,0.06)"}`,
                  background: active ? `${a.color}08` : "rgba(255,255,255,0.02)",
                  cursor: "pointer", transition: "all 0.3s",
                  transform: active ? "scale(1.02)" : "scale(1)",
                  position: "relative", color: "#fff",
                  minHeight: 200,
                }}>
                {a.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: GOLD, color: "#000",
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.15em",
                    padding: "4px 16px", borderRadius: 20, textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>
                    Founding Slice Available
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <div style={{
                    padding: 16, borderRadius: 16,
                    background: `${a.color}15`, border: `1px solid ${a.color}25`,
                  }}>
                    <Icon size={28} style={{ color: a.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{a.who}</div>
                  </div>
                </div>

                {!active && (
                  <>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 12px" }}>
                      {a.lines[0]}
                    </p>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 13, fontWeight: 700, color: a.color,
                      padding: "10px 0", minHeight: 44,
                    }}>
                      {a.subtitle} <ArrowRight size={14} />
                    </div>
                  </>
                )}

                {active && (
                  <div style={{ animation: "slideUp 0.3s ease" }}>
                    {a.lines.map((line, i) => (
                      <p key={i} style={{
                        fontSize: 14, color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.7, marginBottom: i < a.lines.length - 1 ? 12 : 20,
                      }}>
                        {line}
                      </p>
                    ))}

                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                      marginBottom: 24,
                    }}>
                      {a.perks.map(p => {
                        const PIcon = p.icon;
                        return (
                          <div key={p.text} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: 13, color: "rgba(255,255,255,0.5)",
                            minHeight: 44,
                          }}>
                            <PIcon size={16} style={{ color: a.color, flexShrink: 0 }} />
                            {p.text}
                          </div>
                        );
                      })}
                    </div>

                    <Link href="/join">
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "14px 28px", borderRadius: 14,
                        background: a.color, color: a.id === "specialist" ? "#000" : "#fff",
                        fontWeight: 800, fontSize: 15, cursor: "pointer",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: "0.04em",
                        minHeight: 48,
                      }}>
                        {a.cta} <ArrowRight size={16} />
                      </div>
                    </Link>
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

const FEATURES = [
  {
    icon: Bot, title: "AI Concierge",
    desc: "Ask for anything — our AI assistant helps you find cars, parts, and answers instantly.",
    href: "/concierge", color: "#60A5FA",
  },
  {
    icon: ShoppingCart, title: "Vehicle Marketplace",
    desc: "Browse thousands of cars. We handle financing, insurance, and delivery for you.",
    href: "/marketplace", color: "#3B82F6",
  },
  {
    icon: Package, title: "Parts & Accessories",
    desc: "Find the right parts for your car. We source them and ship them to your door.",
    href: "/aftermarket", color: "#F59E0B",
  },
  {
    icon: Shield, title: "Insurance",
    desc: "Get covered in minutes. We compare rates and set up your policy — no paperwork headaches.",
    href: "/insurance", color: "#10B981",
  },
  {
    icon: DollarSign, title: "Financing",
    desc: "Get approved fast. We shop lenders so you get the best rate without hurting your credit.",
    href: "/finance", color: "#8B5CF6",
  },
  {
    icon: Phone, title: "Emergency Roadside",
    desc: "Flat tire? Dead battery? Tap one button and help is on the way, 24/7.",
    href: "/safety-shield", color: "#EF4444",
  },
  {
    icon: Users, title: "Referral Income",
    desc: "Share your link with friends. When they join or buy, you earn real money in your wallet.",
    href: "/referral-wallet", color: GOLD,
  },
  {
    icon: Shirt, title: "Apparel Shop",
    desc: "Exclusive 3C Onyx gear — hoodies, hats, and more. Show off your membership.",
    href: "/apparel", color: "#EC4899",
  },
  {
    icon: QrCode, title: "QR Code Sharing",
    desc: "Your personal QR code. Anyone who scans it can join, buy, or connect with you instantly.",
    href: "/my-qr", color: "#14B8A6",
  },
];

function FeatureShowcase() {
  return (
    <div style={{
      padding: "80px 24px 100px",
      background: "linear-gradient(180deg, #0a0a0f 0%, #050508 100%)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.3em", color: GOLD,
            fontWeight: 700, marginBottom: 12, textTransform: "uppercase",
          }}>Everything in one place</p>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900,
            color: "#fff", textTransform: "uppercase", lineHeight: 1,
            marginBottom: 12,
          }}>
            What You Can Do
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 520, margin: "0 auto" }}>
            Every tool you need for buying, selling, and owning a car — plus ways to earn money while you're at it.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}>
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <Link key={f.title} href={f.href}>
                <div className="sovereign-card sovereign-corner-frame" style={{
                  padding: 28, borderRadius: 20,
                  cursor: "pointer",
                  minHeight: 160,
                  display: "flex", flexDirection: "column", gap: 12,
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `${f.color}08`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "";
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${f.color}12`,
                    border: `1px solid ${f.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={24} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 6,
                      fontFamily: "'Barlow Condensed', sans-serif",
                    }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      {f.desc}
                    </p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: f.color,
                    marginTop: "auto",
                    minHeight: 44,
                  }}>
                    Learn more <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
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
      desc: "Type it like a text message. \"I want a 2024 Honda Civic under $30K\" or \"I need brake pads for my F-150.\" Our AI understands plain English.",
      color: GOLD,
    },
    {
      num: "02", title: "We take care of everything",
      desc: "Financing, insurance, trade-in, plates, delivery — all handled behind the scenes by real people and smart technology. You just say yes or no.",
      color: "#60A5FA",
    },
    {
      num: "03", title: "You get the deal",
      desc: "Every step tracked. Every document signed on your phone. Every person who helped gets paid automatically. No surprises.",
      color: "#34D399",
    },
  ];

  return (
    <div style={{
      padding: "80px 24px", maxWidth: 900, margin: "0 auto",
    }}>
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
          How it works
        </p>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900,
          textTransform: "uppercase", lineHeight: 1, color: "#fff",
        }}>
          Three Steps. That's It.
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.num}
            className={`sovereign-card sovereign-reveal${i === 1 ? "-2" : i === 2 ? "-3" : ""}`}
            style={{
              display: "flex", gap: 24, alignItems: "flex-start",
              padding: "28px 28px 28px 32px",
              minHeight: 100,
            }}
          >
            <div className="sovereign-stat" style={{
              fontSize: 56, color: s.color, lineHeight: 1, minWidth: 80,
              opacity: 0.95,
            }}>
              {s.num}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 10,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.01em",
              }}>{s.title}</p>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="sovereign-divider" style={{ marginTop: 32 }} />
    </div>
  );
}

function FounderQuote() {
  return (
    <div style={{
      padding: "80px 24px",
      background: "linear-gradient(180deg, #0a0a0f 0%, #050508 100%)",
    }}>
      <div className="sovereign-frame sovereign-corner-frame" style={{
        maxWidth: 720, margin: "0 auto", textAlign: "center",
        padding: "48px 40px",
      }}>
        <span className="sovereign-ring" style={{ display: "inline-flex", marginBottom: 24 }}>
          <Crown size={28} style={{ color: GOLD }} />
        </span>
        <div className="sovereign-eyebrow" style={{ marginBottom: 20 }}>
          <span className="sovereign-glyph" style={{ marginRight: 8 }} />
          Founder's Word
        </div>
        <blockquote style={{
          fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 600,
          color: "rgba(255,255,255,0.85)", lineHeight: 1.7,
          margin: "0 0 28px", fontStyle: "italic",
          letterSpacing: "-0.005em",
        }}>
          "I built this for the person on the floor. The one who opens the door,
          shakes the hand, stays late, and gets paid last. That ends here.
          Whoever opens the door eats first."
        </blockquote>
        <div className="sovereign-divider" style={{ margin: "0 auto 16px", maxWidth: 240 }} />
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
          — <strong className="sovereign-text-gradient" style={{ fontWeight: 900 }}>RAC3C</strong>
          {" "}· Founder ·{" "}
          <span style={{ color: GOLD, fontWeight: 700 }}>CUXTOMCANDYCLUB LLC</span>
        </div>
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <div className="sovereign-bg" style={{
      padding: "100px 24px 120px", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div className="sovereign-orb" style={{ width: 500, height: 500, top: "-10%", left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
        <div className="sovereign-eyebrow sovereign-reveal" style={{ marginBottom: 16 }}>
          <span className="sovereign-glyph" style={{ marginRight: 8 }} />
          Ready When You Are
        </div>
        <h2 className="sovereign-headline sovereign-reveal-2" style={{
          fontSize: "clamp(32px, 6vw, 52px)",
          marginBottom: 14, color: "#fff",
        }}>
          Your <span className="sovereign-text-gradient">Move.</span>
        </h2>
        <p className="sovereign-reveal-3" style={{
          fontSize: 15, color: "rgba(255,255,255,0.55)",
          marginBottom: 36, lineHeight: 1.7,
        }}>
          No credit card. No contract. Founding member pricing locked forever.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/join">
            <button className="sovereign-cta sovereign-pulse" style={{
              padding: "18px 40px",
              fontSize: 16,
              display: "flex", alignItems: "center", gap: 8,
              minHeight: 52,
            }}>
              Get Started <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/login">
            <button className="sovereign-link" style={{
              padding: "18px 32px", borderRadius: 14,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 16,
              cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.04em", textTransform: "uppercase",
              minHeight: 52,
            }}>
              Sign In
            </button>
          </Link>
        </div>
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
      <PublicNavbar />
      <SplashHero />
      <TrustStrip />
      <FrontDoor />
      <FeatureShowcase />
      <HowItWorks />
      <FounderQuote />
      <FinalCTA />
      <GlobalFooter />
    </div>
  );
}
