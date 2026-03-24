/**
 * 3C Onyx — Founding Member Success Page
 * ─────────────────────────────────────────────────────────────
 * Post-payment confirmation. Shows member number, referral link.
 * Blitzscaling: every member becomes a recruiter.
 */
import { useState, useEffect } from "react";
import { CheckCircle, Copy, Share2, Star, Users, ArrowRight, Zap } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface MemberData {
  memberNumber: number;
  name: string;
  email: string;
  referralCode: string;
  totalMembers: number;
}

export default function JoinSuccess() {
  const [member, setMember]     = useState<MemberData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);

  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session found. If you completed payment, please contact support.");
      setLoading(false);
      return;
    }

    fetch(`${API}/founding/verify/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setMember(d);
      })
      .catch(() => setError("Could not verify your payment. Please contact support."))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const referralUrl = member
    ? `${window.location.origin}/join?ref=${member.referralCode}`
    : "";

  function copyReferral() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  function shareReferral() {
    if (!referralUrl) return;
    if (navigator.share) {
      navigator.share({
        title: "Join me at 3C Onyx — Founding Member",
        text: `I just secured my founding member spot at 3C Onyx. $99 locks in your price forever. Here's my link:`,
        url: referralUrl,
      });
    } else {
      copyReferral();
    }
  }

  return (
    <div style={{
      background: "#050508", minHeight: "100vh", fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 32,
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "linear-gradient(135deg, #C9A227, #8B6914)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#000", fontFamily: "'Barlow Condensed', sans-serif" }}>3C</span>
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>
          ONYX
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "2px solid rgba(201,162,39,0.2)", borderTopColor: "#C9A227",
            animation: "spin 1s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>Confirming your membership…</p>
        </div>
      ) : error ? (
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize: 16, color: "#F87171", fontWeight: 600, marginBottom: 8 }}>Verification issue</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20 }}>{error}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              If your card was charged, you are a founding member. Email support@3conyx.com with your receipt and we'll confirm manually.
            </p>
          </div>
        </div>
      ) : member ? (
        <div style={{ maxWidth: 540, width: "100%" }}>

          {/* Success checkmark */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
              background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.05) 60%, transparent 100%)",
              border: "1px solid rgba(52,211,153,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(52,211,153,0.1)",
            }}>
              <CheckCircle size={32} style={{ color: "#34D399" }} />
            </div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(40px, 8vw, 64px)",
              fontWeight: 900, color: "#fff", lineHeight: 0.95,
              textTransform: "uppercase", marginBottom: 12,
            }}>
              YOU'RE IN.
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Welcome to 3C Onyx, {member.name.split(" ")[0]}. Your founding member status is locked — permanently.
            </p>
          </div>

          {/* Member card */}
          <div style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0.03) 100%)",
            border: "1px solid rgba(201,162,39,0.25)",
            padding: "28px 32px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -40, right: -40,
              width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,162,39,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 6 }}>
                  3C ONYX · FOUNDING MEMBER
                </p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                  {member.name}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{member.email}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 48, fontWeight: 900, lineHeight: 1,
                  background: "linear-gradient(135deg, #C9A227, #F59E0B)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  #{member.memberNumber}
                </div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginTop: 2 }}>MEMBER NUMBER</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { icon: Star,  label: "Status",        value: "FOUNDING" },
                { icon: Zap,   label: "Price Lock",     value: "$99 FOREVER" },
                { icon: Users, label: "Members Joined", value: `${member.totalMembers.toLocaleString()} total` },
              ].map((s) => (
                <div key={s.label}>
                  <s.icon size={11} style={{ color: "#C9A227", marginBottom: 5 }} />
                  <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", fontWeight: 700 }}>{s.label.toUpperCase()}</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 800, color: "#C9A227", marginTop: 2 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral section */}
          <div style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            padding: "24px 28px",
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 6 }}>
              YOUR REFERRAL LINK — SHARE THIS
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, marginBottom: 16 }}>
              Every founding member you bring in earns you credit in your Dynasty Wallet. Share your link — build your team.
            </p>

            <div style={{
              padding: "11px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12, color: "rgba(255,255,255,0.5)",
              wordBreak: "break-all", marginBottom: 12,
              fontFamily: "monospace",
            }}>
              {referralUrl}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={copyReferral}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10,
                  background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: copied ? "#34D399" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {copied ? <><CheckCircle size={12} /> COPIED!</> : <><Copy size={12} /> COPY LINK</>}
              </button>
              <button
                onClick={shareReferral}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10,
                  background: "linear-gradient(135deg, #C9A227, #8B6914)",
                  border: "none",
                  color: "#000", cursor: "pointer",
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  boxShadow: "0 4px 16px rgba(201,162,39,0.25)",
                }}
              >
                <Share2 size={12} /> SHARE NOW
              </button>
            </div>
          </div>

          {/* What's next */}
          <div style={{
            padding: "18px 22px", borderRadius: 14,
            background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <ArrowRight size={12} style={{ color: "#60A5FA" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#60A5FA", letterSpacing: "0.14em" }}>WHAT HAPPENS NEXT</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Your receipt is on its way to <strong style={{ color: "rgba(255,255,255,0.6)" }}>{member.email}</strong>. When 3C Onyx launches, you'll be the first notified — with full access activated immediately. Your founding member number <strong style={{ color: "#C9A227" }}>#{member.memberNumber}</strong> is permanent.
            </p>
          </div>
        </div>
      ) : null}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
