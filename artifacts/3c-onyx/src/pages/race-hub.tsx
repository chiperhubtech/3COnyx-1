import { useState, useEffect } from "react";
import {
  Flag, Zap, Radio, Award, Trophy, Timer, Users, TrendingUp,
  Activity, ChevronRight, Flame, Star, Circle, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface LiveSession {
  series: string; seriesLabel: string; eventId: string; eventName: string;
  circuit: string; city: string; sessionType: string; status: string;
  description: string; broadcast?: string[]; countdown?: { days: number; hours: number; minutes: number };
  keyStats?: { fastestET: string; fastestMPH: string; leader: string; runsCompleted: number };
}

interface LiveData { live: LiveSession[]; liveCount: number; hasLiveAction: boolean; nhraRuns: NHRARun[] }

interface NHRARun { round: string; driver: string; car?: string; team?: string; et: string; mph: string; result: string; reactionTime: string }

interface F1Driver {
  pos: number;
  driver: { number: string; name: string; shortName: string; team: string; teamColor: string; points: number; wins: number };
  gap: string; streak?: string;
}

interface NASCARDriver {
  pos: number;
  driver: { number: string; name: string; shortName: string; team: string; teamColor: string; points: number; wins: number };
  gap: string;
}

interface Challenge {
  id: string; type: string; title: string; description: string; points: number;
  bonusPoints?: number; color: string; progress: number; target: number;
  completed: boolean; expiresIn: string; racingInspired?: string; difficulty: string;
}

interface FeedItem {
  id: string; series: string; headline: string; detail: string;
  timestamp: string; urgency: string; icon: string;
}

interface Profile {
  driverNumber: string; points: number; totalSaved: number; weeklyStreak: number;
  tier: { label: string; subtitle: string; color: string; badge: string };
  nextTier: { label: string; minPoints: number } | null;
  progressToNext: number; pointsToNext: number; achievementCount: number;
}

interface LeaderboardEntry {
  rank: number; username: string; driverNumber: string;
  tier: string; points: number; totalSaved: number; wins: number; isYou?: boolean; badge?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

function useFetch<T>(url: string, interval?: number) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const load = () => fetch(url).then(r => r.json() as Promise<T>).then(setData).catch(() => {});
    load();
    if (interval) {
      const id = setInterval(load, interval);
      return () => clearInterval(id);
    }
    return undefined;
  }, [url]);
  return data;
}

function PulseDot({ color = "#EF4444" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
}

const SERIES_COLORS: Record<string, string> = { f1: "#E8002D", nascar: "#1E3A8A", nhra: "#FF6B00", indycar: "#212F5F" };

/* ─── Components ─────────────────────────────────────────────────────────── */

function LiveEventHero({ session }: { session: LiveSession }) {
  const color = SERIES_COLORS[session.series] ?? "#C9A227";
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: session.status === "live" ? color : "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-3 px-5 py-3 text-white" style={{ backgroundColor: color }}>
        {session.status === "live" ? <PulseDot color="#fff" /> : <Timer size={12} />}
        <span className="text-[10px] font-black tracking-widest">{session.status === "live" ? "LIVE NOW" : "UPCOMING"}</span>
        <span className="text-[10px] font-bold opacity-70">·</span>
        <span className="text-[10px] font-bold opacity-80">{session.seriesLabel.toUpperCase()}</span>
        <span className="ml-auto text-[9px] font-black tracking-widest opacity-80">{session.sessionType.toUpperCase()}</span>
      </div>
      <div className="p-6 space-y-4" style={{ background: `linear-gradient(135deg, ${color}10 0%, rgba(0,0,0,0) 100%)` }}>
        <div>
          <h3 className="text-2xl font-black leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>{session.eventName}</h3>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{session.circuit} · {session.city}</p>
        </div>

        {session.keyStats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "BEST ET", value: session.keyStats.fastestET, color: "#A855F7" },
              { label: "TRAP SPEED", value: session.keyStats.fastestMPH, color: "#3B82F6" },
              { label: "LEADER", value: session.keyStats.leader, color: "#10B981" },
            ].map(s => (
              <div key={s.label} className="text-center px-3 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] font-bold tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {session.countdown && (
          <div className="flex items-center gap-6">
            {[
              { val: session.countdown.days, label: "DAYS" },
              { val: session.countdown.hours, label: "HRS" },
              { val: session.countdown.minutes, label: "MIN" },
            ].map(c => (
              <div key={c.label} className="text-center">
                <div className="text-4xl font-black" style={{ color }}>{String(c.val).padStart(2, "0")}</div>
                <div className="text-[9px] font-black tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{session.description}</p>
        {session.broadcast && (
          <div className="flex gap-2">
            {session.broadcast.map(b => (
              <span key={b} className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>{b}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function F1TimingRow({ entry, idx }: { entry: F1Driver; idx: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
    >
      <span className="w-6 text-center text-sm font-black" style={{ color: idx < 3 ? "#C9A227" : "rgba(255,255,255,0.4)" }}>{entry.pos}</span>
      <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ backgroundColor: entry.driver.teamColor }} />
      <span className="text-xs font-black w-5" style={{ color: entry.driver.teamColor }}>{entry.driver.number}</span>
      <span className="text-sm font-bold flex-1" style={{ color: "rgba(255,255,255,0.9)" }}>{entry.driver.shortName}</span>
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{entry.driver.team.split(" ").slice(0,2).join(" ")}</span>
      <div className="text-right">
        <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.9)" }}>{entry.driver.points}</div>
        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.gap}</div>
      </div>
      {entry.driver.wins > 0 && <span className="text-xs ml-1">{"⚑".repeat(Math.min(entry.driver.wins, 3))}</span>}
    </div>
  );
}

function NHRARow({ run, idx }: { run: NHRARun; idx: number }) {
  const etNum = parseFloat(run.et);
  const etColor = etNum < 3.64 ? "#A855F7" : etNum < 3.65 ? "#10B981" : "#EF4444";
  return (
    <div className="flex items-center gap-4 px-4 py-3" style={{ backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{run.driver}</div>
        <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{run.team}</div>
      </div>
      <div className="text-center">
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>R/T</div>
        <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{run.reactionTime}</div>
      </div>
      <div className="text-center min-w-16">
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>E.T.</div>
        <div className="text-lg font-black" style={{ color: etColor }}>{run.et}s</div>
      </div>
      <div className="text-center min-w-20">
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>TRAP</div>
        <div className="text-base font-black" style={{ color: "#3B82F6" }}>{run.mph}</div>
      </div>
    </div>
  );
}

function ChallengeBar({ c, onComplete }: { c: Challenge; onComplete: (id: string) => void }) {
  const pct = Math.min(100, (c.progress / c.target) * 100);
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: c.completed ? c.color : "rgba(255,255,255,0.07)", backgroundColor: "rgba(0,0,0,0)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-wider" style={{ color: c.color }}>{c.title}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${c.color}15`, color: c.color }}>+{c.points + (c.bonusPoints ?? 0)} pts</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{c.description}</p>
          {c.racingInspired && <p className="text-[10px] italic mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>"{c.racingInspired}"</p>}
        </div>
        {!c.completed ? (
          <button onClick={() => onComplete(c.id)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all hover:opacity-90" style={{ backgroundColor: c.color, color: "#000" }}>GO</button>
        ) : (
          <span className="text-[10px] font-black" style={{ color: "#10B981" }}>✓ DONE</span>
        )}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
      </div>
      <div className="flex justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        <span>⏱ {c.expiresIn}</span>
        <span>{c.progress}/{c.target}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const tierColors: Record<string, string> = {
    apex: "#C9A227", f1: "#EF4444", supercup: "#F97316", gt: "#F59E0B",
    pro: "#A78BFA", "semi-pro": "#60A5FA", amateur: "#34D399", rookie: "#9CA3AF",
  };
  const color = tierColors[entry.tier] ?? "#9CA3AF";
  return (
    <div className={`flex items-center gap-4 px-5 py-3.5`} style={{ backgroundColor: entry.isYou ? "rgba(201,162,39,0.06)" : "transparent", border: entry.isYou ? "1px solid rgba(201,162,39,0.2)" : undefined }}>
      <span className="w-7 text-sm font-black text-center" style={{ color: entry.rank <= 3 ? "#C9A227" : "rgba(255,255,255,0.4)" }}>
        {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank-1] : entry.rank}
      </span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
        {entry.driverNumber}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold" style={{ color: entry.isYou ? "#C9A227" : "rgba(255,255,255,0.9)" }}>
          {entry.username} {entry.isYou && <span className="text-[10px] opacity-60">(you)</span>} {entry.badge}
        </div>
        <div className="text-[10px] mt-0.5 font-bold tracking-wider" style={{ color }}>{entry.tier.toUpperCase()}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.9)" }}>{entry.points.toLocaleString()}</div>
        <div className="text-[10px]" style={{ color: "#10B981" }}>${entry.totalSaved.toLocaleString()} saved</div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

const TABS = [
  { id: "live", label: "🔴 LIVE" },
  { id: "f1", label: "F1" },
  { id: "nascar", label: "NASCAR" },
  { id: "nhra", label: "NHRA" },
  { id: "challenges", label: "⚡ CHALLENGES" },
  { id: "leaderboard", label: "🏆 LEADERBOARD" },
] as const;

type Tab = typeof TABS[number]["id"];

export default function RaceHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  const liveData = useFetch<LiveData>(`${API}/api/racing/live`, 30000);
  const f1Raw = useFetch<{ drivers: F1Driver[]; racesCompleted: number; totalRaces: number }>(`${API}/api/racing/standings/f1`);
  const nascarRaw = useFetch<{ drivers: NASCARDriver[] }>(`${API}/api/racing/standings/nascar`);
  const challengesRaw = useFetch<{ daily: Challenge[]; weekly: Challenge[]; totalPoints: number }>(`${API}/api/gamification/challenges`);
  const leaderboardRaw = useFetch<{ board: LeaderboardEntry[] }>(`${API}/api/gamification/leaderboard`);
  const profileRaw = useFetch<Profile>(`${API}/api/gamification/profile/demo-user`);
  const feedRaw = useFetch<{ feed: FeedItem[] }>(`${API}/api/racing/feed`, 60000);

  const hasLive = liveData?.hasLiveAction ?? false;
  const liveSessions = liveData?.live ?? [];
  const nhraRuns = liveData?.nhraRuns ?? [];

  const handleCompleteChallenge = async (id: string) => {
    setCompletedChallenges(prev => new Set([...prev, id]));
    await fetch(`${API}/api/gamification/challenges/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: id }),
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505", color: "#fff" }}>
      <PageHeader
        title="Race Hub"
        subtitle="F1 × NASCAR × NHRA — Live Motorsport Universe"
        icon={Flag}
        badge={hasLive && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "#EF444415", border: "1px solid #EF444430" }}>
            <PulseDot color="#EF4444" />
            <span className="text-[10px] font-black tracking-widest text-red-500">LIVE</span>
          </div>
        )}
      />

      {/* Driver profile strip */}
      {profileRaw && (
        <div className="px-6 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(201,162,39,0.06) 0%, transparent 60%)" }}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border" style={{ backgroundColor: `${profileRaw.tier.color}15`, borderColor: `${profileRaw.tier.color}30`, color: profileRaw.tier.color }}>
                {profileRaw.driverNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest" style={{ color: profileRaw.tier.color }}>{profileRaw.tier.badge} {profileRaw.tier.label}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${profileRaw.tier.color}18`, color: profileRaw.tier.color }}>{profileRaw.tier.subtitle}</span>
                </div>
                {profileRaw.nextTier && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)", width: 80 }}>
                      <div className="h-full rounded-full" style={{ width: `${profileRaw.progressToNext}%`, backgroundColor: profileRaw.tier.color }} />
                    </div>
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{profileRaw.pointsToNext} pts to {profileRaw.nextTier.label}</span>
                  </div>
                )}
              </div>
            </div>
            {[
              { label: "ONYX PTS", value: profileRaw.points.toLocaleString(), color: "#C9A227" },
              { label: "TOTAL SAVED", value: `$${profileRaw.totalSaved.toLocaleString()}`, color: "#10B981" },
              { label: "SEASON RANK", value: `#8`, color: "#8B5CF6" },
              { label: "STREAK", value: `${profileRaw.weeklyStreak}W`, color: "#F97316" },
            ].map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="text-[9px] font-bold tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
                <span className="text-base font-black" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-[11px] font-black tracking-wider transition-all whitespace-nowrap border-b-2"
              style={{
                borderColor: activeTab === tab.id ? "#C9A227" : "transparent",
                color: activeTab === tab.id ? "#C9A227" : "rgba(255,255,255,0.45)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* LIVE tab */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              {liveSessions.map(s => <LiveEventHero key={s.eventId + s.sessionType} session={s} />)}
            </div>
            <div className="space-y-5">
              {/* NHRA runs */}
              {nhraRuns.length > 0 && (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,107,0,0.3)", backgroundColor: "#0A0A0A" }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,107,0,0.2)", background: "linear-gradient(90deg, rgba(255,107,0,0.12) 0%, transparent)" }}>
                    <PulseDot color="#FF6B00" />
                    <div>
                      <div className="text-xs font-black tracking-widest" style={{ color: "#FF6B00" }}>NHRA GATORNATIONALS — Q1 RESULTS</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Top Fuel — Gainesville Raceway</div>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex border-b text-[9px] font-bold tracking-wider" style={{ borderColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                    <span className="flex-1">DRIVER</span>
                    <span className="w-16 text-right">R/T</span>
                    <span className="w-20 text-right text-yellow-500">ELAPSED TIME</span>
                    <span className="w-20 text-right text-blue-400">TRAP SPEED</span>
                  </div>
                  {nhraRuns.map((run, i) => <NHRARow key={i} run={run} idx={i} />)}
                  <div className="px-5 py-4 text-xs" style={{ backgroundColor: "rgba(255,107,0,0.05)", color: "rgba(255,255,255,0.4)" }}>
                    ⚡ A Top Fuel dragster produces 11,000+ HP and covers the quarter mile in under 4 seconds — the fastest accelerating vehicles on earth.
                  </div>
                </div>
              )}

              {/* Latest feed items */}
              {feedRaw?.feed.slice(0, 4).map(item => (
                <div key={item.id} className="flex gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: item.urgency === "live" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)", backgroundColor: "#0D0D0D" }}>
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-sm font-bold leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{item.headline}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{item.detail}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {item.urgency === "live" && <PulseDot color="#EF4444" />}
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{item.series.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F1 tab */}
        {activeTab === "f1" && f1Raw && (
          <div className="space-y-6">
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {f1Raw.racesCompleted} of {f1Raw.totalRaces} rounds completed · Next: Australian GP — Melbourne
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0A0A0A" }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(232,0,45,0.1) 0%, transparent)" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E8002D" }} />
                <div className="text-xs font-black tracking-widest" style={{ color: "#E8002D" }}>FORMULA 1 — WORLD DRIVERS' CHAMPIONSHIP</div>
              </div>
              <div className="px-4 py-2 flex gap-3 border-b text-[9px] font-bold tracking-wider" style={{ borderColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}>
                <span className="w-6 text-center">P</span><span className="w-1" />
                <span className="w-5" /><span className="flex-1">DRIVER</span>
                <span>TEAM</span><span className="ml-auto text-right w-20">PTS / GAP</span>
              </div>
              {f1Raw.drivers.map((entry, idx) => <F1TimingRow key={entry.driver.shortName} entry={entry} idx={idx} />)}
            </div>
            <div className="px-5 py-4 rounded-xl border text-sm" style={{ borderColor: "rgba(232,0,45,0.2)", backgroundColor: "rgba(232,0,45,0.05)", color: "rgba(255,255,255,0.5)" }}>
              🏁 Max Verstappen leads Lando Norris by just 6 points — the tightest championship fight heading into Melbourne since 2021.
            </div>
          </div>
        )}

        {/* NASCAR tab */}
        {activeTab === "nascar" && nascarRaw && (
          <div className="space-y-6">
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0A0A0A" }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "linear-gradient(90deg, rgba(30,58,138,0.15) 0%, transparent)" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1E3A8A" }} />
                <div className="text-xs font-black tracking-widest" style={{ color: "#4A90D9" }}>NASCAR CUP SERIES — 2026 STANDINGS</div>
              </div>
              {nascarRaw.drivers.map((entry, idx) => (
                <div key={entry.driver.shortName} className="flex items-center gap-4 px-5 py-3" style={{ backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                  <span className="w-6 text-center text-sm font-black" style={{ color: idx < 3 ? "#C9A227" : "rgba(255,255,255,0.4)" }}>{entry.pos}</span>
                  <div className="w-1 h-7 rounded-full" style={{ backgroundColor: entry.driver.teamColor }} />
                  <span className="text-xs font-black" style={{ color: entry.driver.teamColor }}>#{entry.driver.number}</span>
                  <span className="text-sm font-bold flex-1" style={{ color: "rgba(255,255,255,0.9)" }}>{entry.driver.shortName}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{entry.driver.team.split(" ").slice(0,2).join(" ")}</span>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: "rgba(255,255,255,0.9)" }}>{entry.driver.points}</div>
                    <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.gap}</div>
                  </div>
                  {entry.driver.wins > 0 && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black" style={{ backgroundColor: "#C9A22715", color: "#C9A227" }}>
                      {entry.driver.wins}W
                    </span>
                  )}
                </div>
              ))}
              <div className="mx-5 my-3 border-t border-dashed flex items-center justify-center py-2 text-[9px] font-black tracking-widest" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
                — PLAYOFF CUTLINE — TOP 16 ADVANCE —
              </div>
            </div>
            <div className="px-5 py-4 rounded-xl border text-sm" style={{ borderColor: "rgba(30,58,138,0.3)", backgroundColor: "rgba(30,58,138,0.07)", color: "rgba(255,255,255,0.5)" }}>
              🏁 Next: Bristol Motor Speedway — Food City 500. Kyle Larson starts from pole on the 0.533-mile bullring. 500 laps. Chaos guaranteed.
            </div>
          </div>
        )}

        {/* Challenges tab */}
        {activeTab === "challenges" && challengesRaw && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>⚡ DAILY PIT STOPS</h3>
                <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "#C9A22715", color: "#C9A227" }}>{challengesRaw.totalPoints} pts available</span>
              </div>
              {challengesRaw.daily.map(c => (
                <ChallengeBar key={c.id} c={{ ...c, completed: completedChallenges.has(c.id) || c.completed }} onComplete={handleCompleteChallenge} />
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-black tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>🏆 WEEKLY CHAMPIONSHIP</h3>
              {challengesRaw.weekly.map(c => (
                <ChallengeBar key={c.id} c={{ ...c, completed: completedChallenges.has(c.id) || c.completed }} onComplete={handleCompleteChallenge} />
              ))}
              <div className="px-5 py-4 rounded-xl border text-sm space-y-2" style={{ borderColor: "rgba(201,162,39,0.2)", backgroundColor: "rgba(201,162,39,0.05)" }}>
                <div className="font-black text-xs tracking-wider" style={{ color: "#C9A227" }}>WHY CHALLENGES?</div>
                <p style={{ color: "rgba(255,255,255,0.45)" }}>Every F1 race earns drivers championship points. Every action on 3C ONYX earns you ONYX points — building toward your driver tier and unlocking premium platform features.</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard tab */}
        {activeTab === "leaderboard" && leaderboardRaw && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>🏆 2026 SEASON CHAMPIONSHIP</h3>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Week 13 · {leaderboardRaw.board.length} drivers</span>
            </div>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0A0A0A" }}>
              {leaderboardRaw.board.map(entry => <LeaderboardRow key={entry.rank} entry={entry} />)}
            </div>
            <div className="px-5 py-4 rounded-xl border text-sm" style={{ borderColor: "rgba(201,162,39,0.2)", backgroundColor: "rgba(201,162,39,0.05)", color: "rgba(255,255,255,0.45)" }}>
              🏎️ You're ranked #8 globally. Complete daily challenges and save through the platform to climb the leaderboard. Top 3 earn APEX exclusive rewards.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
