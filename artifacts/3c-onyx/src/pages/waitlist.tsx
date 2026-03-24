import { useState } from "react";
import { Shield, Truck, Wrench, Building2, Users, CheckCircle2, Loader2, ArrowRight, Lock, Zap, Star } from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { GlobalFooter } from "@/components/GlobalFooter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ROLES = [
  { id: "Member",     label: "Member",      icon: Shield,    color: "#C9A227", desc: "Priority marketplace access" },
  { id: "Runner",     label: "Runner",      icon: Truck,     color: "#34D399", desc: "Gig delivery network" },
  { id: "Specialist", label: "Specialist",  icon: Wrench,    color: "#60A5FA", desc: "Professional services" },
  { id: "Dealer",     label: "Dealer",      icon: Building2, color: "#A78BFA", desc: "Wholesale network" },
  { id: "Investor",   label: "Investor",    icon: Star,      color: "#F59E0B", desc: "Equity & partnership" },
];

const PERKS = [
  { icon: Lock,  text: "Founding member pricing — locked for life" },
  { icon: Zap,   text: "First access to ONYX AI Concierge" },
  { icon: Users, text: "Priority Runner matching at launch" },
  { icon: Star,  text: "3C Gold status from day one" },
];

export default function WaitlistPage() {
  const [email, setEmail]   = useState("");
  const [name, setName]     = useState("");
  const [role, setRole]     = useState("Member");
  const [city, setCity]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [position, setPos]  = useState<number | null>(null);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE}/api/waitlist/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role, city: city.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setPos(data.position);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page" style={{ background: "#06060A", color: "#fff" }}>
      <PublicNavbar />

      {/* Hero */}
      <div style={{ padding: "80px 24px 60px", textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)", fontSize: 11, fontWeight: 700, color: "#C9A227", letterSpacing: "0.12em", marginBottom: 24 }}>
          PRIVATE LAUNCH — INVITE ONLY
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1, margin: "0 0 20px" }}>
          THE FUTURE OF<br />
          <span style={{ color: "#C9A227" }}>AUTOMOTIVE</span><br />
          IS HERE
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 48px" }}>
          3C Onyx is the first AI-powered automotive super app for luxury vehicles. Get early access before we open to the public.
        </p>

        {/* Perks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 60, maxWidth: 500, margin: "0 auto 60px" }}>
          {PERKS.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "left" }}>
              <Icon size={14} style={{ color: "#C9A227", marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 24px 80px" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "40px 32px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20 }}>
            <CheckCircle2 size={48} style={{ color: "#34D399", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>YOU'RE ON THE LIST</h2>
            {position && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>You are <strong style={{ color: "#C9A227" }}>#{position}</strong> on the 3C Onyx launch list.</p>}
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>We will notify you with your invite code before launch.</p>
            <a href="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", borderRadius: 10, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", color: "#C9A227", fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}>
              EXPLORE PLATFORM →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", margin: 0 }}>JOIN THE LAUNCH LIST</p>

            {error && <p style={{ fontSize: 13, color: "#EF4444", margin: 0, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>NAME</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marcus Webb" style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>CITY</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>EMAIL *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="marcus@example.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 8 }}>I AM A...</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {ROLES.map(({ id, label, icon: Icon, color }) => (
                  <button key={id} type="button" onClick={() => setRole(id)} style={{ padding: "10px 4px", borderRadius: 10, background: role === id ? `${color}14` : "rgba(255,255,255,0.03)", border: `1px solid ${role === id ? `${color}50` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <Icon size={14} style={{ color: role === id ? color : "rgba(255,255,255,0.3)" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: role === id ? "#fff" : "rgba(255,255,255,0.4)" }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ padding: 14, borderRadius: 12, background: "linear-gradient(135deg, #C9A227, #B8901A)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? "JOINING..." : "SECURE MY SPOT"}
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
              No spam. Invite only. Cancel anytime.
            </p>
          </form>
        )}
      </div>
      <GlobalFooter />
    </div>
  );
}
