/**
 * 3C Onyx — Worker Dashboard ("My Money")
 *
 * For every Runner, body tech, clerk, and specialist in the platform.
 * Shows real earnings, tier progress, job history, leaderboard, and
 * personalized recommendations — from the ground up.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign, Trophy, Star, Truck, Wrench, TrendingUp,
  Users, Zap, Target, Gift, Shield, ChevronRight, Clock,
  BarChart2, Award, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useTranslation } from "react-i18next";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const fmtUsd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}K`
  : `$${Math.round(n).toLocaleString()}`;

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck, zap: Zap, shield: Shield, star: Star,
  trophy: Trophy, target: Target, gift: Gift, user: Users,
};

// ─── Tier Ring ────────────────────────────────────────────────────────────────
function TierRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>{label}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}20`,
      borderRadius: 16, padding: "18px 20px",
    }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecoCard({ card }: { card: any }) {
  const Icon = ICON_MAP[card.icon] ?? Zap;
  const priorityColors: Record<string, string> = { urgent: "#EF4444", high: "#F59E0B", medium: "#8B5CF6", low: "#6B7280" };
  const pc = priorityColors[card.priority] ?? "#6B7280";

  return (
    <div style={{
      background: `${card.color}06`, border: `1px solid ${card.color}20`,
      borderRadius: 14, padding: 16, display: "flex", gap: 14, alignItems: "flex-start",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: `${card.color}15`,
        border: `1px solid ${card.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: card.color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            background: `${pc}18`, color: pc, border: `1px solid ${pc}30`,
            padding: "1px 7px", borderRadius: 5, fontSize: 8, fontWeight: 800, letterSpacing: 1,
          }}>{card.priority.toUpperCase()}</span>
          {card.estimatedValue && (
            <span style={{ color: card.color, fontSize: 10, fontWeight: 700 }}>{card.estimatedValue}</span>
          )}
        </div>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{card.title}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.6, marginBottom: 6 }}>{card.body}</div>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8, padding: "6px 10px", marginBottom: 10,
        }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700 }}>WHY THIS: </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{card.why}</span>
        </div>
        <a href={card.ctaRoute} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          color: card.color, fontSize: 11, fontWeight: 800, textDecoration: "none",
        }}>
          {card.cta} <ArrowRight size={12} />
        </a>
      </div>
    </div>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
function LeaderRow({ entry, isYou }: { entry: any; isYou?: boolean }) {
  const rankColors = ["#F59E0B", "#9CA3AF", "#CD7C32"];
  const rc = rankColors[entry.rank - 1] ?? "rgba(255,255,255,0.2)";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      background: isYou ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.01)",
      border: `1px solid ${isYou ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.04)"}`,
      borderRadius: 10,
    }}>
      <span style={{ color: rc, fontSize: 13, fontWeight: 900, width: 24, textAlign: "center" }}>
        {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
      </span>
      <div style={{ flex: 1 }}>
        <span style={{ color: isYou ? "#C9A227" : "#fff", fontSize: 12, fontWeight: 700 }}>
          {entry.maskedName}{isYou ? " (You)" : ""}
        </span>
        <span style={{
          marginLeft: 8, background: `${entry.tierColor}18`, color: entry.tierColor,
          border: `1px solid ${entry.tierColor}30`, padding: "1px 6px", borderRadius: 4, fontSize: 8, fontWeight: 800,
        }}>{entry.tier}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#10B981", fontSize: 13, fontWeight: 900 }}>{fmtUsd(entry.lifetimeUsd)}</div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{entry.jobsCount} jobs</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkerDashboard() {
  const [tab, setTab] = useState<"overview" | "recommendations" | "leaderboard">("overview");
  const { t } = useTranslation();

  const { data: dashboard, isLoading: dLoading } = useQuery({
    queryKey: ["worker-dashboard"],
    queryFn: () =>
      fetch(`${API}/worker/dashboard`, { credentials: "include" }).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: recoData, isLoading: rLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      fetch(`${API}/recommendations`, { credentials: "include" }).then(r => r.json()),
    enabled: tab === "recommendations",
  });

  const { data: leaderData, isLoading: lLoading } = useQuery({
    queryKey: ["worker-leaderboard"],
    queryFn: () =>
      fetch(`${API}/worker/leaderboard`, { credentials: "include" }).then(r => r.json()),
    enabled: tab === "leaderboard",
  });

  const { data: impactData } = useQuery({
    queryKey: ["worker-impact"],
    queryFn: () => fetch(`${API}/worker/impact`).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const tier = dashboard?.tier;
  const earnings = dashboard?.earnings;
  const isDemo = dashboard?.isDemo;

  const tabs = ["overview", "recommendations", "leaderboard"] as const;
  const tabLabels = { overview: "Overview", recommendations: "My Opportunities", leaderboard: "Leaderboard" };
  const tabColors = { overview: "#10B981", recommendations: "#F59E0B", leaderboard: "#C9A227" };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <PageHeader
        icon={DollarSign}
        title="My Earnings"
        accent="#10B981"
        badge={
          isDemo ? (
            <span style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800 }}>
              ● DEMO PREVIEW
            </span>
          ) : (
            <span style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800 }}>
              ● LIVE
            </span>
          )
        }
        subtitle={`${dashboard?.worker?.role ?? "Worker"} earnings, tier, and opportunities — transparent, real-time, yours.`}
      />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 16px" }}>
        {/* Platform-wide impact banner */}
        {impactData && (
          <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))",
            border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "14px 20px",
            display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 24, alignItems: "center",
          }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ color: "#10B981", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                PLATFORM-WIDE WORKER IMPACT
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                {impactData.totalWorkers?.toLocaleString()} workers · {fmtUsd(impactData.totalPayoutsUsd)} paid out · {impactData.jobsCompleted?.toLocaleString()} jobs completed
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#10B981", fontSize: 16, fontWeight: 900 }}>{fmtUsd(impactData.avgRunnerEarningsPerMonth ?? 0)}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>AVG RUNNER/MO</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#3B82F6", fontSize: 16, fontWeight: 900 }}>{fmtUsd(impactData.avgSpecialistEarningsPerMonth ?? 0)}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>AVG TECH/MO</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#F59E0B", fontSize: 16, fontWeight: 900 }}>{impactData.instantPayoutAdoption ? `${Math.round(impactData.instantPayoutAdoption * 100)}%` : "--"}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>INSTANT PAYOUT</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, transition: "all 0.2s",
              background: tab === t ? `${tabColors[t]}18` : "transparent",
              color: tab === t ? tabColors[t] : "rgba(255,255,255,0.3)",
              outline: tab === t ? `1px solid ${tabColors[t]}30` : "none",
            }}>{tabLabels[t]}</button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {dLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                Loading your dashboard…
              </div>
            ) : (
              <>
                {/* Tier + earnings hero */}
                <div style={{
                  display: "grid", gridTemplateColumns: "auto 1fr", gap: 24,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 20, padding: 24, alignItems: "center",
                }}>
                  <TierRing
                    pct={tier?.progressPct ?? 0}
                    color={tier?.color ?? "#9CA3AF"}
                    label={tier?.label ?? "ROOKIE"}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        background: `${tier?.color ?? "#9CA3AF"}18`,
                        color: tier?.color ?? "#9CA3AF",
                        border: `1px solid ${tier?.color ?? "#9CA3AF"}30`,
                        padding: "3px 10px", borderRadius: 7, fontSize: 10, fontWeight: 900, letterSpacing: 1,
                      }}>{tier?.tier ?? "ROOKIE"} TIER</span>
                      {isDemo && (
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>
                          Preview based on platform averages — your real data will appear after your first completed job.
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
                      {fmtUsd(earnings?.lifetime ?? 0)}
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 500, marginLeft: 6 }}>lifetime</span>
                    </div>
                    {tier?.nextTier && (
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                        {fmtUsd((tier.nextThresholdUsd ?? 0) - (earnings?.lifetime ?? 0))} more to unlock <span style={{ color: tier.color, fontWeight: 800 }}>{tier.nextTier}</span> tier
                      </div>
                    )}
                  </div>
                </div>

                {/* Earnings grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <StatCard label="TODAY" value={fmtUsd(earnings?.today ?? 0)} color="#10B981" />
                  <StatCard label="THIS WEEK" value={fmtUsd(earnings?.thisWeek ?? 0)} color="#3B82F6" />
                  <StatCard label="THIS MONTH" value={fmtUsd(earnings?.thisMonth ?? 0)} color="#8B5CF6" />
                </div>

                {/* Platform contribution */}
                {dashboard?.platformValue && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>YOUR PLATFORM CONTRIBUTION</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                      <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 12, padding: 14 }}>
                        <Award size={16} style={{ color: "#10B981", marginBottom: 6 }} />
                        <div style={{ color: "#10B981", fontSize: 18, fontWeight: 900 }}>{dashboard.platformValue.jobsCompleted?.toLocaleString()}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>JOBS COMPLETED</div>
                      </div>
                      <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 12, padding: 14 }}>
                        <TrendingUp size={16} style={{ color: "#F59E0B", marginBottom: 6 }} />
                        <div style={{ color: "#F59E0B", fontSize: 18, fontWeight: 900 }}>{fmtUsd(dashboard.platformValue.estimatedMemberSavings ?? 0)}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>MEMBER SAVINGS ENABLED</div>
                      </div>
                      <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 12, padding: 14 }}>
                        <BarChart2 size={16} style={{ color: "#8B5CF6", marginBottom: 6 }} />
                        <div style={{ color: "#8B5CF6", fontSize: 18, fontWeight: 900 }}>#{dashboard.platformValue.communityRank}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>COMMUNITY RANK</div>
                      </div>
                      <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 12, padding: 14 }}>
                        <DollarSign size={16} style={{ color: "#3B82F6", marginBottom: 6 }} />
                        <div style={{ color: "#3B82F6", fontSize: 18, fontWeight: 900 }}>{fmtUsd(dashboard.platformValue.platformFeesPaid ?? 0)}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700 }}>PLATFORM FEES CONTRIBUTED</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent ledger entries */}
                {dashboard?.recentEntries?.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>RECENT TRANSACTIONS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {dashboard.recentEntries.slice(0, 5).map((entry: any) => (
                        <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DollarSign size={14} style={{ color: "#10B981" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{entry.entryType}</div>
                            {entry.note && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{entry.note}</div>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#10B981", fontSize: 13, fontWeight: 900 }}>+${parseFloat(entry.amountUsd ?? "0").toFixed(2)}</div>
                            <div style={{ color: entry.status === "Paid" ? "#10B981" : "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700 }}>{entry.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "View Available Tasks", icon: Truck, href: "/runner-tasks", color: "#10B981" },
                    { label: "Smart Bay Dashboard", icon: Wrench, href: "/bay-dashboard", color: "#3B82F6" },
                    { label: "My Referral Earnings", icon: Gift, href: "/impact", color: "#EC4899" },
                    { label: "Reputation Score", icon: Star, href: "/reputation", color: "#F59E0B" },
                  ].map(item => (
                    <a key={item.href} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                      background: `${item.color}08`, border: `1px solid ${item.color}20`,
                      borderRadius: 12, textDecoration: "none", transition: "all 0.2s",
                    }}>
                      <item.icon size={16} style={{ color: item.color }} />
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, flex: 1 }}>{item.label}</span>
                      <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Recommendations Tab ── */}
        {tab === "recommendations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Loading recommendations…</div>
            ) : recoData?.cards?.length > 0 ? (
              <>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 }}>
                  {recoData.total} personalized opportunities — engine: {recoData.engineVersion} — {recoData.note}
                </div>
                {recoData.cards.map((card: any) => (
                  <RecoCard key={card.id} card={card} />
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>
                No recommendations right now. Check back after completing your first job.
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ── */}
        {tab === "leaderboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Loading leaderboard…</div>
            ) : (
              <>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 8 }}>
                  Top earners across all worker roles — names are privacy-masked
                </div>
                {leaderData?.leaderboard?.map((entry: any) => (
                  <LeaderRow key={entry.rank} entry={entry} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
