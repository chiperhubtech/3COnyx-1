/**
 * 3C Onyx — Founding Member Join Page
 * ─────────────────────────────────────────────────────────────
 * Standalone conversion page. No auth required. Shareable link.
 * $99 one-time · Stripe Checkout · Founding member for life.
 *
 * Lean Startup: minimum viable payment capture.
 * Blitzscaling: viral loop built in from day one.
 */
import { useState, useEffect, useRef } from "react";
import { Shield, Users, Zap, Lock, Star, TrendingUp, ChevronRight, CheckCircle, ArrowRight, Eye, Clock, Flame } from "lucide-react";
import { GlobalFooter } from "@/components/GlobalFooter";
import { PublicNavbar } from "@/components/PublicNavbar";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const BENEFITS = [
  { icon: Star,       label: "Founding Member Badge",      detail: "Permanently stamped on your account — for life" },
  { icon: Lock,       label: "$99 Price Lock — Forever",   detail: "Never pay more. Future members pay market rate" },
  { icon: Zap,        label: "Early Access — Everything",  detail: "First into every feature before public launch" },
  { icon: Shield,     label: "Guardian V2X Included",      detail: "Predictive vehicle safety & V2X network access" },
  { icon: TrendingUp, label: "Priority AI Concierge",      detail: "ONYX AI concierge at the front of every queue" },
  { icon: Users,      label: "Dynasty Wallet Activated",   detail: "Revenue sharing on every deal you refer" },
];

const SOCIAL_PROOF = [
  { name: "Member #1",  note: "First member — my wife. The platform is real." },
  { name: "Dealers",    note: "Luxury dealers across 3 states already in network" },
  { name: "Coverage",   note: "Certified runners in 12 major metro areas" },
];

function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const step = target / (duration / 16);
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setValue(Math.floor(current));
      if (current >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return <>{value.toLocaleString()}</>;
}

const SPOTS_TOTAL = 10_000;
const LAUNCH_DATE = new Date("2026-06-30T00:00:00Z");

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function tick() {
      const diff = LAUNCH_DATE.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

function useViewingNow() {
  const base = useRef(47 + Math.floor(Math.random() * 36));
  const [n, setN] = useState(base.current);
  useEffect(() => {
    const id = setInterval(() => {
      setN(base.current + Math.floor(Math.sin(Date.now() / 12000) * 8 + Math.random() * 5));
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return n;
}

export default function JoinPage() {
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [count, setCount]               = useState(1);
  const [spotsRemaining, setSpotsRemaining] = useState(SPOTS_TOTAL - 1);
  const [percentFilled, setPercentFilled]   = useState(0.01);
  const [joinedToday, setJoinedToday]       = useState(0);
  const [countLoaded, setCountLoaded]   = useState(false);

  const countdown    = useCountdown();
  const viewingNow   = useViewingNow();
  const referredBy   = new URLSearchParams(window.location.search).get("ref") ?? undefined;
  const cancelled    = new URLSearchParams(window.location.search).get("cancelled") === "1";

  useEffect(() => {
    fetch(`${API}/founding/count`)
      .then((r) => r.json())
      .then((d) => {
        setCount(Math.max(d.count ?? 1, 1));
        setSpotsRemaining(d.spotsRemaining ?? SPOTS_TOTAL - 1);
        setPercentFilled(d.percentFilled ?? 0.01);
        setJoinedToday(d.joinedToday ?? 0);
        setCountLoaded(true);
      })
      .catch(() => { setCount(1); setCountLoaded(true); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Please enter your full name and email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API}/founding/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), referredBy }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.code === "ALREADY_MEMBER") {
          setError("This email is already a founding member. Welcome back.");
          return;
        }
        setError(d.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = d.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "var(--onyx-page-bg)", minHeight: "100vh", overflowX: "hidden", fontFamily: "'Inter', sans-serif" }}>

      <PublicNavbar />

      {/* Progress bar — full width at very top, offset below fixed navbar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.04)", position: "relative", marginTop: 60 }}>
        <div style={{
          height: "100%",
          width: `${Math.max(percentFilled, 0.5)}%`,
          background: "linear-gradient(90deg, #C9A227, #F59E0B)",
          transition: "width 1.2s ease",
          boxShadow: "0 0 12px rgba(201,162,39,0.6)",
        }} />
      </div>

      {/* Urgency strip */}
      <div style={{
        background: "rgba(201,162,39,0.06)", borderBottom: "1px solid rgba(201,162,39,0.15)",
        padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Flame size={11} style={{ color: "#F59E0B" }} />
          <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700, letterSpacing: "0.08em" }}>
            {countLoaded ? spotsRemaining.toLocaleString() : "9,999"} SPOTS REMAINING OF 10,000
          </span>
        </div>
        <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Eye size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            {viewingNow} viewing right now
          </span>
        </div>
        {joinedToday > 0 && <>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <TrendingUp size={11} style={{ color: "#34D399" }} />
            <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600 }}>
              {joinedToday} joined today
            </span>
          </div>
        </>}
        <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Clock size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
            Founding price expires in {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </span>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "80px 32px 0",
        display: "grid", gridTemplateColumns: "1fr 420px", gap: 80,
        alignItems: "start",
      }}>

        {/* Left: Copy */}
        <div>
          {cancelled && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 24,
              background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)",
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "#F97316" }}>No worries — your spot is still available. Fill in your details and try again.</span>
            </div>
          )}

          {/* Pre-headline */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A227", letterSpacing: "0.18em" }}>
                FOUNDING MEMBER — LIMITED
              </span>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(52px, 7vw, 88px)",
            fontWeight: 900, lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#fff", textTransform: "uppercase",
            margin: "0 0 24px",
          }}>
            OWN YOUR<br />
            <span style={{
              background: "linear-gradient(90deg, #C9A227 0%, #F59E0B 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>SPOT.</span>
          </h1>

          <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #C9A227, transparent)", marginBottom: 20 }} />

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 460, marginBottom: 36 }}>
            One-time $99 locks in your founding member status — forever. When we launch, founding members never pay more than $99. Full stop.
          </p>

          {/* Member #1 social proof */}
          <div style={{
            padding: "16px 20px", borderRadius: 14,
            background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)",
            display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 40,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #C9A227, #8B6914)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13, fontWeight: 900, color: "#000",
            }}>
              #1
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 3 }}>Member #1 is real.</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                The first founding member paid today. Every member number after that is yours — first come, first locked.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 16 }}>
            WHAT YOUR $99 INCLUDES — FOREVER
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 48 }}>
            {BENEFITS.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
                  background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <b.icon size={12} style={{ color: "#C9A227" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 1 }}>{b.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{b.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* The math */}
          <div style={{
            padding: "20px 24px", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 12 }}>
              THE NUMBERS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Founding Price",    value: "$99",      sub: "One-time, forever" },
                { label: "Future Rate",       value: "$299+",    sub: "Public launch pricing" },
                { label: "Your Savings",      value: "$200+",    sub: "Locked in perpetuity" },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#C9A227", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginTop: 3, letterSpacing: "0.06em" }}>{s.label}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div style={{ position: "sticky", top: 90 }}>
          <div style={{
            borderRadius: 20,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(201,162,39,0.2)",
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(201,162,39,0.05), 0 40px 80px rgba(0,0,0,0.6)",
          }}>
            {/* Card header */}
            <div style={{
              padding: "24px 28px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "linear-gradient(180deg, rgba(201,162,39,0.06) 0%, transparent 100%)",
            }}>
              <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#C9A227", fontWeight: 700, marginBottom: 8 }}>
                SECURE YOUR FOUNDING MEMBERSHIP
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1,
                }}>$99</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>one-time · locked forever</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", display: "block", marginBottom: 6 }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: 14, outline: "none",
                      fontFamily: "'Inter', sans-serif",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,39,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", display: "block", marginBottom: 6 }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: 14, outline: "none",
                      fontFamily: "'Inter', sans-serif",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,162,39,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                  />
                </div>

                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    fontSize: 12, color: "#F87171",
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                    background: loading
                      ? "rgba(201,162,39,0.3)"
                      : "linear-gradient(135deg, #C9A227, #8B6914)",
                    cursor: loading ? "wait" : "pointer",
                    color: loading ? "#C9A227" : "#000",
                    fontWeight: 900, fontSize: 14, letterSpacing: "0.06em",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: loading ? "none" : "0 4px 24px rgba(201,162,39,0.3)",
                    transition: "all 0.2s",
                    marginTop: 4,
                  }}
                >
                  {loading ? (
                    "REDIRECTING TO CHECKOUT…"
                  ) : (
                    <><Lock size={14} /> SECURE MY SPOT — $99</>
                  )}
                </button>
              </div>

              {/* Trust signals */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: Shield,       text: "256-bit SSL encryption" },
                  { icon: CheckCircle,  text: "Secured by Stripe · PCI Level 1 compliant" },
                  { icon: ArrowRight,   text: "Full refund available before launch date" },
                ].map((t) => (
                  <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <t.icon size={11} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </form>

            {/* Live counter in card */}
            <div style={{
              padding: "14px 28px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              background: "rgba(52,211,153,0.04)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "rgba(52,211,153,0.8)", fontWeight: 600 }}>
                {countLoaded ? <><Counter target={count} /> founding members secured so far</> : "Counting founding members…"}
              </span>
            </div>
          </div>

          {/* Below form: referral note */}
          <p style={{
            textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)",
            lineHeight: 1.6, marginTop: 16,
          }}>
            After payment, you'll receive a personal referral link. Every person you bring in earns you credit in your Dynasty Wallet.
          </p>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        maxWidth: 1100, margin: "80px auto 0", padding: "0 32px 80px",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
      }}>
        {SOCIAL_PROOF.map((s) => (
          <div key={s.name} style={{
            padding: "20px 24px", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 9, letterSpacing: "0.16em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 6 }}>{s.name.toUpperCase()}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{s.note}</p>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 420px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <GlobalFooter />
    </div>
  );
}
