/**
 * /m/:code — Viral Member Profile Page
 * ───────────────────────────────────────────────────────────────────────
 * THE core growth mechanic. Every founding member shares this link.
 * Personalized invite page: shows inviter's name, member #, reward tier,
 * live counter (FOMO), and a single $99 CTA.
 *
 * K-factor target: 1.25+  →  100M members in 32 cycles.
 * "We move like water."
 */
import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Shield, Zap, Star, TrendingUp, Users, Lock, Copy, CheckCircle } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface MemberData {
  firstName:     string;
  memberNumber:  number;
  referralCode:  string;
  referredCount: number;
  totalMembers:  number;
  rewards: {
    unlocked: { id: string; threshold: number; label: string; description: string; icon: string }[];
    next:     { id: string; threshold: number; label: string; description: string; icon: string } | null;
    referredCount: number;
  };
  memberSince: string;
}

const TIER_ICONS: Record<string, typeof Shield> = {
  dynasty_wallet: TrendingUp,
  guardian_v2x:  Shield,
  ai_priority:   Zap,
  concierge_line: Star,
  revenue_share:  TrendingUp,
};

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const step = target / 60;
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

/** Track growth events (fire-and-forget, never blocks UX) */
function track(event: string, referralCode?: string, payload?: Record<string, unknown>) {
  fetch(`${API}/growth/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, referralCode, payload }),
  }).catch(() => {});
}

export default function MemberProfilePage() {
  const [, params] = useRoute("/m/:code");
  const code = params?.code ?? "";

  const [member, setMember]   = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (!code) { setLoading(false); setError(true); return; }
    fetch(`${API}/growth/member/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(true); return; }
        setMember(d);
        if (!tracked.current) {
          tracked.current = true;
          track("referral_page_view", code, { memberNumber: d.memberNumber });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  const joinUrl  = `${window.location.origin}/join?ref=${code}`;
  const joinPath = `/join?ref=${code}`;

  function handleJoin() {
    track("checkout_started", code, { source: "member_profile_cta" });
    window.location.href = joinPath;
  }

  if (loading) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(201,162,39,0.2)", borderTopColor: "#C9A227", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !member) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>This invite link is no longer valid.</p>
      <button onClick={() => window.location.href = "/join"} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
        Join as Founding Member →
      </button>
    </div>
  );

  const nextThreshold  = member.rewards.next?.threshold ?? 999;
  const progressPct    = member.rewards.next
    ? Math.min((member.referredCount / nextThreshold) * 100, 100)
    : 100;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(201,162,39,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(5,5,8,0.92)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#C9A227,#8B6914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#000", fontFamily: "'Barlow Condensed', sans-serif" }}>3C</span>
          </div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>ONYX</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#34D399", fontWeight: 700, letterSpacing: "0.1em" }}>
            <AnimatedCounter target={member.totalMembers} /> MEMBERS
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 100px", position: "relative", zIndex: 1 }}>

        {/* Inviter identity block */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {(member as any).avatarUrl ? (
            <img
              src={(member as any).avatarUrl}
              alt={member.firstName}
              style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
                objectFit: "cover",
                border: "3px solid #C9A227",
                boxShadow: "0 0 40px rgba(201,162,39,0.3), 0 0 80px rgba(201,162,39,0.1)",
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
              background: "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#000",
              fontFamily: "'Barlow Condensed', sans-serif",
              boxShadow: "0 0 40px rgba(201,162,39,0.3), 0 0 80px rgba(201,162,39,0.1)",
            }}>
              {member.firstName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 8 }}>
            YOU WERE PERSONALLY INVITED BY
          </p>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(40px,8vw,64px)",
            fontWeight: 900, color: "#fff", textTransform: "uppercase",
            lineHeight: 0.95, marginBottom: 12,
          }}>
            {member.firstName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)",
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#C9A227", letterSpacing: "0.14em" }}>
                FOUNDING MEMBER #{member.memberNumber}
              </span>
            </div>
            {member.referredCount > 0 && (
              <div style={{
                padding: "4px 12px", borderRadius: 20,
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", letterSpacing: "0.1em" }}>
                  {member.referredCount} REFERRED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FOMO counter */}
        <div style={{
          padding: "20px 24px", borderRadius: 16, marginBottom: 28,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 8 }}>
            MEMBERS WHO SECURED THEIR SPOT BEFORE YOU
          </p>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(52px, 12vw, 88px)",
            fontWeight: 900, color: "#fff", lineHeight: 1,
          }}>
            <AnimatedCounter target={member.totalMembers} />
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
            Your founding member number will be #{member.totalMembers + 1}
          </p>
        </div>

        {/* What they've unlocked — social proof */}
        {member.rewards.unlocked.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 12 }}>
              {member.firstName.toUpperCase()}'S UNLOCKED REWARDS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {member.rewards.unlocked.map((reward) => {
                const Icon = TIER_ICONS[reward.id] ?? Star;
                return (
                  <div key={reward.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10,
                    background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.15)",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={13} style={{ color: "#C9A227" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A227" }}>{reward.label}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{reward.description}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <CheckCircle size={14} style={{ color: "#34D399" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reward progression — next unlock */}
        {member.rewards.next && (
          <div style={{
            padding: "16px 20px", borderRadius: 14, marginBottom: 32,
            background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "#60A5FA", fontWeight: 700 }}>
                {member.firstName}'s next unlock: {member.rewards.next.label}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                {member.referredCount}/{member.rewards.next.threshold}
              </p>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 1s ease",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
              }} />
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
              {member.rewards.next.description}
            </p>
          </div>
        )}

        {/* PRIMARY CTA — the only thing that matters */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(201,162,39,0.25)",
          boxShadow: "0 0 60px rgba(201,162,39,0.06), 0 20px 60px rgba(0,0,0,0.5)",
          marginBottom: 24,
        }}>
          <div style={{
            padding: "24px 28px 20px",
            background: "linear-gradient(180deg, rgba(201,162,39,0.07) 0%, rgba(201,162,39,0.02) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 6 }}>
              {member.firstName.toUpperCase()} SAVED YOU A SPOT
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1 }}>$99</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>one-time · locked forever</span>
            </div>
          </div>

          <div style={{ padding: "20px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                "Founding Member badge — permanent",
                "$99 price lock for life (market rate: $299+)",
                "Early access to every feature before launch",
                "Dynasty Wallet revenue sharing activated",
                "Guardian V2X safety network included",
              ].map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <CheckCircle size={12} style={{ color: "#34D399", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{b}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleJoin}
              style={{
                width: "100%", padding: "15px 20px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #C9A227, #8B6914)",
                cursor: "pointer", color: "#000",
                fontWeight: 900, fontSize: 16, letterSpacing: "0.06em",
                fontFamily: "'Barlow Condensed', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 28px rgba(201,162,39,0.35)",
              }}
            >
              <Lock size={14} /> SECURE MY FOUNDING SPOT — $99
            </button>
          </div>

          <div style={{
            padding: "12px 28px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "rgba(52,211,153,0.7)", fontWeight: 600 }}>
              <AnimatedCounter target={member.totalMembers} /> founding members secured · yours is next
            </span>
          </div>
        </div>

        {/* Trust */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {[
            { icon: Shield,  text: "256-bit SSL" },
            { icon: Lock,    text: "Stripe · PCI L1" },
            { icon: Users,   text: "Refundable pre-launch" },
          ].map((t) => (
            <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <t.icon size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
