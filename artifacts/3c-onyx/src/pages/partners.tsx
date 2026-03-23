import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Star, Shield, MapPin, Clock, Zap, TrendingUp,
  CheckCircle, Award, Activity, Lock, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Professional {
  id: string; name: string; shop: string;
  city: string; state: string; corridor: string;
  specialties: string[]; makes: string[];
  verified: boolean; licenseType: "independent" | "freelancer" | "dealer";
  reputationScore: number; aiAccuracyScore: number; memberSatisfaction: number;
  responseTimeMins: number; routingWeight: number;
  jobsCompleted: number; jobsThisMonth: number; totalPlatformRevenue: number;
  badgeLevel: "platinum" | "gold" | "silver" | "bronze";
  joinedAt: string;
}

interface MemberProfile {
  memberId: string; displayName: string;
  paymentSpeedScore: number; dataAccuracyScore: number; overallScore: number;
  trustTier: "Priority Runner" | "Member" | "Provisional";
  memberSliceMultiplier: number; jobHistory: number; totalMemberSliceEarned: number;
}

interface LedgerEntry {
  id: string; type: string; professionalId: string;
  before: number; after: number; delta: number;
  reason: string; aiVerified: boolean; hash: string; timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const BADGE_COLORS = {
  platinum: { bg: "rgba(229,231,235,0.08)", border: "rgba(229,231,235,0.25)", text: "#E5E7EB" },
  gold: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#F59E0B" },
  silver: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)", text: "#9CA3AF" },
  bronze: { bg: "rgba(180,83,9,0.08)", border: "rgba(180,83,9,0.25)", text: "#B45309" },
};

const LICENSE_LABELS = { independent: "Independent", freelancer: "Freelancer", dealer: "Dealer" };

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const color = score >= 90 ? "#E5E7EB" : score >= 80 ? "#F59E0B" : score >= 70 ? "#10B981" : "#9CA3AF";
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: size > 50 ? 14 : 11, fontWeight: 900, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────
function ProCard({ pro }: { pro: Professional }) {
  const [expanded, setExpanded] = useState(false);
  const badge = BADGE_COLORS[pro.badgeLevel];
  const isPriority = pro.routingWeight > 100;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${isPriority ? "rgba(229,231,235,0.1)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <ScoreRing score={pro.reputationScore} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text, padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>
              {pro.badgeLevel.toUpperCase()}
            </span>
            {isPriority && (
              <span style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B", padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 800 }}>
                +20% ROUTING
              </span>
            )}
            {pro.verified && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#10B981", fontSize: 9, fontWeight: 700 }}>
                <CheckCircle size={10} /> BGC VERIFIED
              </span>
            )}
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{LICENSE_LABELS[pro.licenseType]}</span>
          </div>

          <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginBottom: 1 }}>{pro.name}</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6 }}>{pro.shop}</p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <MapPin size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{pro.city}, {pro.state} · {pro.corridor}</span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>AI ACCURACY</div>
              <div style={{ color: "#8B5CF6", fontSize: 13, fontWeight: 800 }}>{pro.aiAccuracyScore}/100</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>SATISFACTION</div>
              <div style={{ color: "#10B981", fontSize: 13, fontWeight: 800 }}>{pro.memberSatisfaction}/100</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>RESPONSE</div>
              <div style={{ color: "#F59E0B", fontSize: 13, fontWeight: 800 }}>{pro.responseTimeMins}m</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>JOBS</div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{pro.jobsCompleted}</div>
            </div>
          </div>
        </div>

        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {/* AI score breakdown */}
          <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <p style={{ color: "#8B5CF6", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TWO-WAY INTEGRITY MESH — AI VERIFIED</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "AI Diagnosis Accuracy", value: `${pro.aiAccuracyScore}%`, color: "#8B5CF6" },
                { label: "Member Satisfaction", value: `${pro.memberSatisfaction}/100`, color: "#10B981" },
                { label: "Avg Response Time", value: `${pro.responseTimeMins} min`, color: "#F59E0B" },
                { label: "Jobs This Month", value: pro.jobsThisMonth.toString(), color: "#3B82F6" },
                { label: "Total Platform Revenue", value: fmt(pro.totalPlatformRevenue), color: "#E5E7EB" },
                { label: "Routing Weight", value: pro.routingWeight > 100 ? `${pro.routingWeight} (+20%)` : "Standard", color: pro.routingWeight > 100 ? "#F59E0B" : "rgba(255,255,255,0.4)" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: 12, fontWeight: 800 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Makes + specialties */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, marginBottom: 6 }}>CERTIFIED MAKES</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {pro.makes.map(m => (
                  <span key={m} style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{m}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, marginBottom: 6 }}>SPECIALTIES</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {pro.specialties.map(s => (
                  <span key={s} style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", color: "#60A5FA", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stripe connect status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, padding: "8px 12px" }}>
            <Lock size={11} style={{ color: "#10B981" }} />
            <span style={{ color: "#10B981", fontSize: 10, fontWeight: 700 }}>Stripe Connect Active</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>· Instant settlement · Dynasty multi-split ready</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Member Trust Card ────────────────────────────────────────────────────────
function MemberCard({ member }: { member: MemberProfile }) {
  const tierColor = member.trustTier === "Priority Runner" ? "#F59E0B"
    : member.trustTier === "Member" ? "#10B981" : "#9CA3AF";

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
      <ScoreRing score={member.overallScore} size={52} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{member.displayName}</span>
          <span style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}30`, color: tierColor, padding: "2px 7px", borderRadius: 6, fontSize: 9, fontWeight: 800 }}>
            {member.trustTier.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>PAYMENT SPEED</div>
            <div style={{ color: "#10B981", fontSize: 12, fontWeight: 800 }}>{member.paymentSpeedScore}/100</div>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>DATA ACCURACY</div>
            <div style={{ color: "#3B82F6", fontSize: 12, fontWeight: 800 }}>{member.dataAccuracyScore}/100</div>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>SLICE MULTIPLIER</div>
            <div style={{ color: "#F59E0B", fontSize: 12, fontWeight: 800 }}>{member.memberSliceMultiplier.toFixed(2)}x</div>
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700 }}>SLICE EARNED</div>
            <div style={{ color: "#E5E7EB", fontSize: 12, fontWeight: 800 }}>{fmt(member.totalMemberSliceEarned)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ledger Entry ─────────────────────────────────────────────────────────────
function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const deltaColor = entry.delta > 0 ? "#10B981" : entry.delta < 0 ? "#EF4444" : "rgba(255,255,255,0.4)";
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: entry.aiVerified ? "#10B981" : "#F59E0B", marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700, textTransform: "uppercase" }}>{entry.type.replace(/_/g, " ")}</span>
          {entry.aiVerified && <span style={{ color: "#10B981", fontSize: 8, fontWeight: 700 }}>AI VERIFIED</span>}
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, marginLeft: "auto" }}>{timeAgo(entry.timestamp)}</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, lineHeight: 1.5, marginBottom: 3 }}>{entry.reason}</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: deltaColor, fontSize: 11, fontWeight: 800 }}>
            {entry.delta > 0 ? "+" : ""}{entry.delta} pts
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{entry.before} → {entry.after}</span>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: 8, fontFamily: "monospace" }}>{entry.hash.slice(0, 14)}…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "directory" | "members" | "leaderboard" | "ledger";

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("directory");
  const [corridorFilter, setCorridorFilter] = useState("All");
  const [badgeFilter, setBadgeFilter] = useState("All");

  const { data: proData } = useQuery({
    queryKey: ["reputation-professionals"],
    queryFn: () => fetch("/api/reputation/professionals").then(r => r.json()),
    refetchInterval: 60_000,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["reputation-leaderboard"],
    queryFn: () => fetch("/api/reputation/leaderboard").then(r => r.json()),
    enabled: activeTab === "leaderboard",
  });

  const { data: membersData } = useQuery({
    queryKey: ["reputation-members"],
    queryFn: () => fetch("/api/reputation/members").then(r => r.json()),
    enabled: activeTab === "members",
  });

  const { data: auditData } = useQuery({
    queryKey: ["reputation-audit"],
    queryFn: () => fetch("/api/reputation/audit").then(r => r.json()),
    enabled: activeTab === "ledger",
  });

  const professionals: Professional[] = proData?.professionals ?? [];
  const stats = proData?.stats ?? { total: 0, verified: 0, platinum: 0, avgScore: 0 };
  const corridors = ["All", ...new Set(professionals.map(p => p.corridor))];

  const filtered = professionals.filter(p => {
    if (corridorFilter !== "All" && p.corridor !== corridorFilter) return false;
    if (badgeFilter !== "All" && p.badgeLevel !== badgeFilter.toLowerCase()) return false;
    return true;
  }).sort((a, b) => b.reputationScore - a.reputationScore);

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "directory", label: "Partner Directory", badge: stats.total },
    { id: "members", label: "Member Trust", badge: membersData?.stats?.priorityRunners },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "ledger", label: "Integrity Ledger", badge: auditData?.total },
  ];

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Users}
        title="Partner Network"
        subtitle="I-95 Spine · Two-Way Integrity Mesh · AI-Verified Reputation"
        accent="#E5E7EB"
        badge={stats.platinum > 0 ? `${stats.platinum} PLATINUM` : undefined}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "5px 10px" }}>
              <Activity size={10} style={{ color: "#10B981" }} />
              <span style={{ color: "#10B981", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>I-95 LIVE</span>
            </div>
          </div>
        }
      />

      <div className="p-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12, marginBottom: 24 }}>
          {[
            { label: "VERIFIED PARTNERS", value: stats.verified, color: "#10B981" },
            { label: "PLATINUM TIER", value: stats.platinum, color: "#E5E7EB" },
            { label: "AVG REPUTATION", value: stats.avgScore, color: "#F59E0B" },
            { label: "I-95 CORRIDORS", value: proData?.stats?.corridors?.length ?? 0, color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
              background: activeTab === t.id ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeTab === t.id ? "rgba(229,231,235,0.2)" : "rgba(255,255,255,0.06)"}`,
              color: activeTab === t.id ? "#E5E7EB" : "rgba(255,255,255,0.4)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
            }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{ background: "rgba(229,231,235,0.15)", color: "#E5E7EB", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 900 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── DIRECTORY ─────────────────────────────────────────────────────── */}
        {activeTab === "directory" && (
          <div>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, alignSelf: "center" }}>CORRIDOR</span>
                {corridors.map(c => (
                  <button key={c} onClick={() => setCorridorFilter(c)} style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
                    background: corridorFilter === c ? "rgba(229,231,235,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${corridorFilter === c ? "rgba(229,231,235,0.2)" : "rgba(255,255,255,0.06)"}`,
                    color: corridorFilter === c ? "#E5E7EB" : "rgba(255,255,255,0.4)",
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                {["All", "Platinum", "Gold", "Silver"].map(b => (
                  <button key={b} onClick={() => setBadgeFilter(b)} style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
                    background: badgeFilter === b ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${badgeFilter === b ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`,
                    color: badgeFilter === b ? "#F59E0B" : "rgba(255,255,255,0.4)",
                  }}>{b}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(p => <ProCard key={p.id} pro={p} />)}
            </div>
          </div>
        )}

        {/* ── MEMBER TRUST ──────────────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div>
            {/* Trust tier explainer */}
            <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ color: "#F59E0B", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>TWO-WAY INTEGRITY MESH — MEMBER SCORING</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { tier: "Priority Runner", score: "85+", slice: "1.25x Member Slice", color: "#F59E0B" },
                  { tier: "Member", score: "60–84", slice: "1.0–1.1x Member Slice", color: "#10B981" },
                  { tier: "Provisional", score: "<60", slice: "1.0x Member Slice", color: "#9CA3AF" },
                ].map(t => (
                  <div key={t.tier} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ color: t.color, fontSize: 10, fontWeight: 800 }}>{t.tier}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>Score {t.score}</div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700 }}>{t.slice}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(membersData?.members ?? []).map((m: MemberProfile) => <MemberCard key={m.memberId} member={m} />)}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ───────────────────────────────────────────────────── */}
        {activeTab === "leaderboard" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "36px 1fr 80px 80px 80px 100px", gap: 8 }}>
                {["#", "Professional", "Score", "AI Acc.", "Jobs", "Revenue"].map(h => (
                  <span key={h} style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: 0.8 }}>{h}</span>
                ))}
              </div>
              {(leaderboard?.leaderboard ?? []).map((p: Professional, i: number) => {
                const medal = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.3)";
                return (
                  <div key={p.id} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "grid", gridTemplateColumns: "36px 1fr 80px 80px 80px 100px", gap: 8, alignItems: "center" }}>
                    <span style={{ color: medal, fontSize: 14, fontWeight: 900 }}>{i + 1}</span>
                    <div>
                      <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{p.shop} · {p.city}</div>
                    </div>
                    <span style={{ color: p.reputationScore >= 90 ? "#E5E7EB" : "#F59E0B", fontSize: 14, fontWeight: 900 }}>{p.reputationScore}</span>
                    <span style={{ color: "#8B5CF6", fontSize: 12, fontWeight: 700 }}>{p.aiAccuracyScore}%</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>{p.jobsCompleted}</span>
                    <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700 }}>{fmt(p.totalPlatformRevenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── INTEGRITY LEDGER ──────────────────────────────────────────────── */}
        {activeTab === "ledger" && (
          <div>
            {/* Head hash */}
            <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Lock size={12} style={{ color: "#10B981" }} />
              <span style={{ color: "#10B981", fontSize: 10, fontWeight: 700 }}>NIST-MCP 2026 Compliant · Append-Only Ledger</span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, marginLeft: "auto", fontFamily: "monospace" }}>HEAD: {auditData?.headHash}</span>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 20px" }}>
              {(auditData?.ledger ?? []).map((e: LedgerEntry) => <LedgerRow key={e.id} entry={e} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
