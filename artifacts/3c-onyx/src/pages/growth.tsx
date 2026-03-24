/**
 * /growth — Founder Ops Dashboard
 * ───────────────────────────────────────────────────────────────────────
 * Real-time command center: member count, revenue, K-factor, runway,
 * daily signups chart, and the viral referral leaderboard.
 *
 * Visible to: authenticated users (founder access checks done server-side).
 * Target: 100M members. Track every metric that gets you there.
 */
import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, Zap, Shield, Star, ArrowUp, Clock, Target, Activity } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface GrowthStats {
  members: { active: number; pending: number; total: number };
  revenue: { gross: number; net: number; perMember: number };
  growth: {
    kFactor: number;
    conversionRate: number;
    avgReferralsPerMember: number;
    projectedM12Members: number;
  };
  runway: { monthsRemaining: number; monthlyBurnUsd: number; breakEvenMembers: number };
  dailySignups: { day: string; count: number }[];
  topReferrers: {
    firstName: string;
    memberNumber: number;
    referralCode: string;
    referredCount: number;
    rewards: {
      unlocked: { id: string; label: string; icon: string }[];
      next: { label: string; threshold: number } | null;
    };
  }[];
  ts: string;
}

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDollars(dollars: number) {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000)     return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function KFactorGauge({ k }: { k: number }) {
  const pct   = Math.min(k / 2, 1) * 100;
  const color = k >= 1.0 ? "#34D399" : k >= 0.5 ? "#F59E0B" : "#EF4444";
  const label = k >= 1.25 ? "VIRAL" : k >= 1.0 ? "GROWING" : k >= 0.5 ? "SUB-VIRAL" : "SEED";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", fontWeight: 700 }}>K-FACTOR (VIRAL COEFFICIENT)</span>
        <span style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 6 }}>
        <div style={{
          height: "100%", borderRadius: 3, width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 1.2s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{k.toFixed(3)}</span>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.4 }}>K &gt; 1.0 = viral growth</p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>K = 1.25 → 100M in 32 cycles</p>
        </div>
      </div>
    </div>
  );
}

function SparklineChart({ data }: { data: { day: string; count: number }[] }) {
  if (!data.length) return (
    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>No signups yet — share your link</span>
    </div>
  );
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
      {data.slice(-30).map((d, i) => {
        const h = Math.max((d.count / max) * 80, 2);
        return (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div
              title={`${d.day}: ${d.count} member${d.count !== 1 ? "s" : ""}`}
              style={{
                width: "100%", height: h, borderRadius: "2px 2px 0 0",
                background: i === data.length - 1
                  ? "linear-gradient(180deg, #C9A227, #8B6914)"
                  : "rgba(201,162,39,0.3)",
                cursor: "default",
                transition: "background 0.2s",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color = "#C9A227", highlight = false,
}: {
  icon: typeof TrendingUp; label: string; value: string; sub?: string; color?: string; highlight?: boolean;
}) {
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 14,
      background: highlight ? "rgba(201,162,39,0.05)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${highlight ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.06)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: `${color}14`, border: `1px solid ${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={12} style={{ color }} />
        </div>
        <span style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>{label}</span>
      </div>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

const TIER_ICONS: Record<string, string> = {
  dynasty_wallet: "💎",
  guardian_v2x:  "🛡️",
  ai_priority:   "⚡",
  concierge_line: "👑",
  revenue_share:  "📈",
};

export default function GrowthDashboard() {
  const [stats, setStats]       = useState<GrowthStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  function load() {
    fetch(`${API}/growth/stats`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLastUpdated(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  if (loading) return (
    <div style={{ background: "#050508", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(201,162,39,0.2)", borderTopColor: "#C9A227", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Loading growth dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const s = stats;
  const active           = s?.members.active ?? 0;
  const grossRev         = s?.revenue.gross ?? 0;
  const netRev           = s?.revenue.net ?? 0;
  const kFactor          = s?.growth.kFactor ?? 0;
  const runway           = s?.runway.monthsRemaining ?? 0;
  const breakEven        = s?.runway.breakEvenMembers ?? 0;
  const projM12          = s?.growth.projectedM12Members ?? 0;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(5,5,8,0.9)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 3 }}>3C ONYX</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>
            GROWTH OPS COMMAND
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer",
              fontWeight: 600, fontFamily: "'Inter', sans-serif",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px" }}>

        {/* Break-even alert */}
        {active < breakEven && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, marginBottom: 24,
            background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Target size={14} style={{ color: "#F97316", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#F97316" }}>
              Break-even at <strong>{breakEven.toLocaleString()}</strong> active members
              ({(breakEven - active).toLocaleString()} to go). Monthly burn: ${(s?.runway.monthlyBurnUsd ?? 0).toLocaleString()}/mo.
            </span>
          </div>
        )}
        {active >= breakEven && active > 0 && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, marginBottom: 24,
            background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Activity size={14} style={{ color: "#34D399", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#34D399" }}>
              <strong>Cash-flow positive.</strong> Revenue covers burn. Net positive: {fmtDollars(netRev - (s?.runway.monthlyBurnUsd ?? 0))} over burn.
            </span>
          </div>
        )}

        {/* Top stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard icon={Users}      label="ACTIVE MEMBERS"    value={fmt(active)}             sub={`${s?.members.pending ?? 0} pending`}            highlight />
          <StatCard icon={DollarSign} label="GROSS REVENUE"     value={fmtDollars(grossRev)}    sub={`${fmtDollars(netRev)} net (after Stripe)`} />
          <StatCard icon={Clock}      label="RUNWAY"            value={`${runway}mo`}           sub={`At $${((s?.runway.monthlyBurnUsd ?? 0) / 1000).toFixed(0)}K/mo burn`} />
          <StatCard icon={TrendingUp} label="M12 PROJECTION"    value={fmt(projM12)}            sub="at current K-factor" />
        </div>

        {/* K-Factor + Daily signups */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div style={{
            padding: "22px 24px", borderRadius: 16,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <KFactorGauge k={kFactor} />
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3 }}>AVG REFERRALS/MEMBER</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>{s?.growth.avgReferralsPerMember.toFixed(2) ?? "0.00"}</p>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 3 }}>REFERRAL CONVERSION</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>{s?.growth.conversionRate.toFixed(1) ?? "0.0"}%</p>
              </div>
            </div>
          </div>

          <div style={{
            padding: "22px 24px", borderRadius: 16,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
                DAILY SIGNUPS (30 DAYS)
              </p>
              <Activity size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <SparklineChart data={s?.dailySignups ?? []} />
            {(s?.dailySignups ?? []).length > 0 && (
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>
                Total: {(s?.dailySignups ?? []).reduce((a, d) => a + d.count, 0)} members in last 30 days
              </p>
            )}
          </div>
        </div>

        {/* Revenue breakdown */}
        <div style={{
          padding: "22px 24px", borderRadius: 16, marginBottom: 24,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 16 }}>
            FINANCIAL PROJECTION (FOUNDING MEMBER CAPITAL)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { label: "100K Members Gross", value: "$9.9M", note: "Pre-Stripe" },
              { label: "100K Members Net",   value: "$9.58M", note: "After 2.9%+$0.30" },
              { label: "Setup Costs",        value: "$396K",  note: "One-time" },
              { label: "12-Mo Operating",    value: "$2.0M",  note: "167K/mo × 12" },
              { label: "Reserve",            value: "$7.18M", note: "VC leverage" },
            ].map((r) => (
              <div key={r.label}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>{r.label.toUpperCase()}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: "#C9A227", lineHeight: 1 }}>{r.value}</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Month-by-month projection */}
        <div style={{
          padding: "22px 24px", borderRadius: 16, marginBottom: 24,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700, marginBottom: 16 }}>
            POST-LAUNCH REVENUE TRAJECTORY (CONSERVATIVE)
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["Month", "Members", "Subscriptions", "Dealer Network", "AI Concierge", "Total Revenue", "Net Cash Flow"].map((h) => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { mo: "Launch", mem: "100K", sub: "$0",       dealer: "$0",       ai: "$0",       rev: "$0",         ncf: "-$167K" },
                  { mo: "M3",     mem: "103K", sub: "$250K",     dealer: "$125K",    ai: "$75K",     rev: "$450K",      ncf: "+$250K" },
                  { mo: "M6",     mem: "115K", sub: "$600K",     dealer: "$250K",    ai: "$500K",    rev: "$1.49M",     ncf: "+$1.21M" },
                  { mo: "M9",     mem: "140K", sub: "$900K",     dealer: "$500K",    ai: "$750K",    rev: "$2.3M",      ncf: "+$1.97M" },
                  { mo: "M12",    mem: "200K", sub: "$1.4M",     dealer: "$800K",    ai: "$900K",    rev: "$3.73M",     ncf: "+$3.31M" },
                  { mo: "Y2",     mem: "500K", sub: "$3.5M",     dealer: "$2M",      ai: "$2M",      rev: "$8M+",       ncf: "+$7.4M" },
                ].map((r, i) => (
                  <tr key={r.mo} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    {[r.mo, r.mem, r.sub, r.dealer, r.ai, r.rev].map((v, j) => (
                      <td key={j} style={{ padding: "8px 10px", color: j === 0 ? "#C9A227" : "rgba(255,255,255,0.5)", fontWeight: j === 0 ? 700 : 400 }}>{v}</td>
                    ))}
                    <td style={{
                      padding: "8px 10px", fontWeight: 800,
                      color: r.ncf.startsWith("+") ? "#34D399" : "#EF4444",
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
                    }}>{r.ncf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{
          padding: "22px 24px", borderRadius: 16,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
              TOP REFERRERS — VIRAL GROWTH LEADERS
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, color: "#34D399", fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {(!s?.topReferrers.length || s.topReferrers.every((r) => r.referredCount === 0)) ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>No referrals tracked yet.</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", marginTop: 4 }}>Share your /m/[code] link to start the leaderboard.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.topReferrers.filter((r) => r.referredCount > 0).map((r, i) => (
                <div key={r.memberNumber} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10,
                  background: i === 0 ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${i === 0 ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "linear-gradient(135deg,#C9A227,#8B6914)" : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 900,
                    color: i === 0 ? "#000" : "rgba(255,255,255,0.4)",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{r.firstName ?? "Member"}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>#{r.memberNumber}</span>
                      {r.rewards.unlocked.map((rw) => (
                        <span key={rw.id} title={rw.label} style={{ fontSize: 12 }}>{TIER_ICONS[rw.id] ?? "⭐"}</span>
                      ))}
                    </div>
                    {r.rewards.next && (
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
                        Next: {r.rewards.next.label} at {r.rewards.next.threshold} referrals
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "#C9A227", lineHeight: 1 }}>{r.referredCount}</p>
                    <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>REFERRED</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scale to 100M callout */}
        <div style={{
          marginTop: 24, padding: "20px 24px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(201,162,39,0.05) 0%, rgba(96,165,250,0.03) 100%)",
          border: "1px solid rgba(201,162,39,0.1)",
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 10 }}>
            PATH TO 100M MEMBERS
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { phase: "Phase 1",  target: "100K",  timing: "Day 1–90",   driver: "Founding member campaign" },
              { phase: "Phase 2",  target: "1M",    timing: "Mo 3–9",     driver: "Viral K-factor > 1.25" },
              { phase: "Phase 3",  target: "10M",   timing: "Mo 9–18",    driver: "Dealer network + iOS/Android" },
              { phase: "Phase 4",  target: "100M",  timing: "Year 2–3",   driver: "International expansion + V2X" },
            ].map((p) => (
              <div key={p.phase} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontWeight: 700 }}>{p.phase.toUpperCase()}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#C9A227", lineHeight: 1, margin: "4px 0" }}>{p.target}</p>
                <p style={{ fontSize: 9, color: "#60A5FA", fontWeight: 600 }}>{p.timing}</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 3, lineHeight: 1.4 }}>{p.driver}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="grid-template-columns: 1fr 1fr"]        { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(5, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
