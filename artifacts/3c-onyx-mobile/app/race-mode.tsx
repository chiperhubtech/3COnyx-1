/**
 * 3C ONYX — Race Mode
 * ─────────────────────────────────────────────────────────────────────────────
 * Formula 1 × NASCAR × NHRA drag racing — the automotive world, live.
 * Pokémon GO for motorsport: always alive, always happening, always engaging.
 */

import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";
import { COLORS } from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface LiveSession {
  series: string;
  seriesLabel: string;
  eventId: string;
  eventName: string;
  circuit: string;
  city: string;
  sessionType: string;
  status: "live" | "upcoming";
  description: string;
  broadcast?: string[];
  countdown?: { days: number; hours: number; minutes: number };
  keyStats?: { fastestET: string; fastestMPH: string; leader: string; runsCompleted: number };
}

interface LiveData {
  live: LiveSession[];
  liveCount: number;
  hasLiveAction: boolean;
  nhraRuns: Array<{ round: string; driver: string; car: string; team?: string; et: string; mph: string; result: string; reactionTime: string }>;
}

interface F1Standing {
  pos: number;
  driver: { number: string; name: string; shortName: string; team: string; teamColor: string; points: number; wins: number };
  gap: string;
  streak?: string;
}

interface F1Data {
  drivers: F1Standing[];
  racesCompleted: number;
  totalRaces: number;
}

interface NASCARDriver {
  pos: number;
  driver: { number: string; name: string; shortName: string; team: string; teamColor: string; points: number; wins: number };
  gap: string;
}

interface NASCARData {
  drivers: NASCARDriver[];
  racesCompleted: number;
}

interface Challenge {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  bonusPoints?: number;
  icon: string;
  color: string;
  progress: number;
  target: number;
  completed: boolean;
  expiresIn: string;
  racingInspired?: string;
}

interface ChallengesData {
  daily: Challenge[];
  weekly: Challenge[];
  totalPoints: number;
  completedToday: number;
}

interface FeedItem {
  id: string;
  series: string;
  type: string;
  headline: string;
  detail: string;
  timestamp: string;
  urgency: string;
  icon: string;
}

interface FeedData { feed: FeedItem[]; hasLive: boolean }

/* ─── NHRA Christmas Tree (drag racing start lights) ────────────────────── */

function ChristmasTree({ active }: { active: boolean }) {
  const [stage, setStage] = useState(0);
  const amber1 = useRef(new Animated.Value(0)).current;
  const amber2 = useRef(new Animated.Value(0)).current;
  const amber3 = useRef(new Animated.Value(0)).current;
  const green  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const seq = Animated.sequence([
      Animated.delay(500),
      Animated.timing(amber1, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(amber2, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(amber3, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(amber1, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(amber2, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(amber3, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(green,  { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.timing(green, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    seq.start(() => { if (active) seq.start(); });
    return () => seq.stop();
  }, [active]);

  const dot = (anim: Animated.Value, color: string, size = 14) => (
    <Animated.View style={[styles.treeDot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: anim }]} />
  );

  return (
    <View style={styles.christmasTree}>
      <View style={styles.treeColumn}>
        {dot(amber1, "#FF8C00", 10)}
        {dot(amber2, "#FF8C00", 12)}
        {dot(amber3, "#FFA500", 14)}
        {dot(green,  "#00FF00", 16)}
      </View>
      <View style={styles.treeColumn}>
        {dot(amber1, "#FF8C00", 10)}
        {dot(amber2, "#FF8C00", 12)}
        {dot(amber3, "#FFA500", 14)}
        {dot(green,  "#00FF00", 16)}
      </View>
    </View>
  );
}

/* ─── Live pulse dot ─────────────────────────────────────────────────────── */

function PulseLive({ color = "#EF4444" }: { color?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: color, opacity: 0.3, transform: [{ scale: pulse }] }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

/* ─── Sector color ───────────────────────────────────────────────────────── */

function sectorBadge(s?: string) {
  if (!s) return null;
  const val = parseFloat(s);
  const color = val < 21.2 ? "#A855F7" : val < 21.6 ? "#10B981" : "#EF4444";
  return <Text style={[styles.sectorVal, { color }]}>{s}</Text>;
}

/* ─── F1 Timing Tower ────────────────────────────────────────────────────── */

function F1TimingTower({ standings }: { standings: F1Standing[] }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.timingTower, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.timingHeader}>
        <View style={[styles.seriesDot, { backgroundColor: "#E8002D" }]} />
        <Text style={[styles.timingTitle, { color: theme.text }]}>FORMULA 1 — WDC STANDINGS</Text>
        <Text style={[styles.timingSubtitle, { color: theme.textFaint }]}>2026 Season</Text>
      </View>
      {standings.slice(0, 8).map((entry, idx) => (
        <View key={entry.driver.shortName} style={[styles.timingRow, { backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.timingPos, { color: idx < 3 ? COLORS.gold : theme.textFaint }]}>{entry.pos}</Text>
          <View style={[styles.timingTeamBar, { backgroundColor: entry.driver.teamColor }]} />
          <View style={styles.timingDriverInfo}>
            <Text style={[styles.timingNum, { color: entry.driver.teamColor }]}>{entry.driver.number}</Text>
            <Text style={[styles.timingName, { color: theme.text }]}>{entry.driver.shortName}</Text>
          </View>
          <Text style={[styles.timingTeam, { color: theme.textFaint }]} numberOfLines={1}>{entry.driver.team.split(" ").slice(0, 2).join(" ")}</Text>
          <View style={styles.timingRight}>
            <Text style={[styles.timingPoints, { color: theme.text }]}>{entry.driver.points}</Text>
            <Text style={[styles.timingGap, { color: theme.textFaint }]}>{entry.gap}</Text>
          </View>
          {entry.driver.wins > 0 && <Text style={styles.winBadge}>{"⚑".repeat(Math.min(entry.driver.wins, 4))}</Text>}
        </View>
      ))}
    </View>
  );
}

/* ─── NASCAR Scoring Pylon ───────────────────────────────────────────────── */

function NASCARPylon({ standings }: { standings: NASCARDriver[] }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.timingTower, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.timingHeader}>
        <View style={[styles.seriesDot, { backgroundColor: "#1E3A8A" }]} />
        <Text style={[styles.timingTitle, { color: theme.text }]}>NASCAR CUP SERIES</Text>
        <Text style={[styles.timingSubtitle, { color: theme.textFaint }]}>Playoff Points</Text>
      </View>
      {standings.slice(0, 6).map((entry, idx) => (
        <View key={entry.driver.shortName} style={[styles.timingRow, { backgroundColor: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.timingPos, { color: idx < 3 ? COLORS.gold : theme.textFaint }]}>{entry.pos}</Text>
          <View style={[styles.timingTeamBar, { backgroundColor: entry.driver.teamColor }]} />
          <View style={styles.timingDriverInfo}>
            <Text style={[styles.timingNum, { color: entry.driver.teamColor }]}>#{entry.driver.number}</Text>
            <Text style={[styles.timingName, { color: theme.text }]}>{entry.driver.shortName}</Text>
          </View>
          <Text style={[styles.timingTeam, { color: theme.textFaint }]} numberOfLines={1}>{entry.driver.team.split(" ").slice(0, 2).join(" ")}</Text>
          <View style={styles.timingRight}>
            <Text style={[styles.timingPoints, { color: theme.text }]}>{entry.driver.points}</Text>
            <Text style={[styles.timingGap, { color: theme.textFaint }]}>{entry.gap}</Text>
          </View>
        </View>
      ))}
      <View style={[styles.playoffCutline, { borderTopColor: "#EF4444" }]}>
        <Text style={styles.playoffCutlineText}>— PLAYOFF CUTLINE —</Text>
      </View>
    </View>
  );
}

/* ─── NHRA Run list ──────────────────────────────────────────────────────── */

function NHRARunList({ runs }: { runs: LiveData["nhraRuns"] }) {
  const { theme } = useTheme();
  const [treeActive, setTreeActive] = useState(false);

  return (
    <View style={[styles.timingTower, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.timingHeader}>
        <View style={[styles.seriesDot, { backgroundColor: "#EF4444" }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.timingTitle, { color: theme.text }]}>NHRA GATORNATIONALS</Text>
          <Text style={[styles.timingSubtitle, { color: theme.textFaint }]}>Top Fuel — Q1 Results</Text>
        </View>
        <Pressable onPress={() => setTreeActive(a => !a)} style={[styles.treeBtn, { backgroundColor: treeActive ? "#00FF0018" : "rgba(255,255,255,0.05)", borderColor: treeActive ? "#00FF00" : theme.cardBorder }]}>
          <Text style={[styles.treeBtnText, { color: treeActive ? "#00FF00" : theme.textFaint }]}>START</Text>
        </Pressable>
      </View>

      {treeActive && (
        <View style={styles.treeContainer}>
          <ChristmasTree active={treeActive} />
          <Text style={[styles.treeLabel, { color: theme.textFaint }]}>NHRA CHRISTMAS TREE — Staging lights active</Text>
        </View>
      )}

      {/* Column headers */}
      <View style={[styles.nhraHeaders, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.nhraHeaderText, { color: theme.textFaint, flex: 2 }]}>DRIVER</Text>
        <Text style={[styles.nhraHeaderText, { color: theme.textFaint }]}>R/T</Text>
        <Text style={[styles.nhraHeaderText, { color: COLORS.gold }]}>ET</Text>
        <Text style={[styles.nhraHeaderText, { color: "#3B82F6" }]}>MPH</Text>
      </View>

      {runs.map((run, i) => {
        const etNum = parseFloat(run.et);
        const etColor = etNum < 3.64 ? "#A855F7" : etNum < 3.65 ? "#10B981" : "#EF4444";
        return (
          <View key={i} style={[styles.nhraRow, { backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTopColor: theme.cardBorder }]}>
            <View style={{ flex: 2 }}>
              <Text style={[styles.nhraDriver, { color: theme.text }]}>{run.driver}</Text>
              <Text style={[styles.nhraTeam, { color: theme.textFaint }]}>{run.team}</Text>
            </View>
            <Text style={[styles.nhraRT, { color: theme.textSub }]}>{run.reactionTime}</Text>
            <Text style={[styles.nhraET, { color: etColor }]}>{run.et}s</Text>
            <Text style={[styles.nhraMPH, { color: "#3B82F6" }]}>{run.mph}</Text>
          </View>
        );
      })}

      <View style={[styles.dragFact, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }]}>
        <Text style={styles.dragFactIcon}>⚡</Text>
        <Text style={[styles.dragFactText, { color: theme.textSub }]}>
          A Top Fuel dragster accelerates from 0-330 mph in 3.7 seconds — producing 11,000+ horsepower from nitromethane fuel.
        </Text>
      </View>
    </View>
  );
}

/* ─── Challenge card ─────────────────────────────────────────────────────── */

function ChallengeCard({ challenge, onComplete }: { challenge: Challenge; onComplete: (id: string) => void }) {
  const { theme } = useTheme();
  const progressPct = Math.min(100, (challenge.progress / challenge.target) * 100);

  const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
    timer: "clock", activity: "activity", zap: "zap", users: "users",
    radio: "radio", flag: "flag", "dollar-sign": "dollar-sign", "user-plus": "user-plus", trophy: "award",
  };

  return (
    <View style={[styles.challengeCard, { backgroundColor: theme.card, borderColor: challenge.completed ? challenge.color : theme.cardBorder }]}>
      <View style={styles.challengeTop}>
        <View style={[styles.challengeIcon, { backgroundColor: `${challenge.color}18`, borderColor: `${challenge.color}30` }]}>
          <Feather name={iconMap[challenge.icon] ?? "star"} size={16} color={challenge.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.challengeTitleRow}>
            <Text style={[styles.challengeTitle, { color: theme.text }]}>{challenge.title}</Text>
            <Text style={[styles.challengePoints, { color: challenge.color }]}>+{challenge.points + (challenge.bonusPoints ?? 0)} pts</Text>
          </View>
          <Text style={[styles.challengeDesc, { color: theme.textSub }]}>{challenge.description}</Text>
          {challenge.racingInspired && (
            <Text style={[styles.challengeRacing, { color: theme.textFaint }]}>"{challenge.racingInspired}"</Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: challenge.color }]} />
      </View>
      <View style={styles.challengeBottom}>
        <Text style={[styles.challengeExpiry, { color: theme.textFaint }]}>⏱ {challenge.expiresIn}</Text>
        <Text style={[styles.progressText, { color: theme.textFaint }]}>{challenge.progress}/{challenge.target}</Text>
      </View>

      {!challenge.completed && progressPct < 100 && (
        <Pressable
          onPress={() => onComplete(challenge.id)}
          style={[styles.completeBtn, { backgroundColor: `${challenge.color}18`, borderColor: `${challenge.color}30` }]}
        >
          <Text style={[styles.completeBtnText, { color: challenge.color }]}>START CHALLENGE →</Text>
        </Pressable>
      )}
      {challenge.completed && (
        <View style={[styles.completedBadge, { backgroundColor: `${COLORS.emerald}15` }]}>
          <Feather name="check-circle" size={12} color={COLORS.emerald} />
          <Text style={[styles.completedText, { color: COLORS.emerald }]}>COMPLETED — POINTS AWARDED</Text>
        </View>
      )}
    </View>
  );
}

/* ─── Live event hero card ───────────────────────────────────────────────── */

function LiveEventCard({ session }: { session: LiveSession }) {
  const { theme } = useTheme();
  const seriesColors: Record<string, string> = {
    f1: "#E8002D", nascar: "#1E3A8A", nhra: "#FF6B00", indycar: "#212F5F", wec: "#009A44",
  };
  const color = seriesColors[session.series] ?? "#C9A227";

  return (
    <View style={[styles.liveCard, { borderColor: session.status === "live" ? color : theme.cardBorder }]}>
      <View style={{ overflow: "hidden", borderRadius: 20 }}>
        {/* Top gradient bar */}
        <View style={[styles.liveCardBar, { backgroundColor: color }]}>
          <View style={styles.liveCardBarLeft}>
            {session.status === "live" ? <PulseLive color="#fff" /> : <Feather name="clock" size={10} color="rgba(255,255,255,0.8)" />}
            <Text style={styles.liveCardStatus}>{session.status === "live" ? "LIVE NOW" : "UPCOMING"}</Text>
            <Text style={styles.liveCardSeries}>{session.seriesLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.liveCardSession}>{session.sessionType.toUpperCase()}</Text>
        </View>

        {/* Body */}
        <View style={[styles.liveCardBody, { backgroundColor: `${color}10` }]}>
          <Text style={[styles.liveCardEvent, { color: theme.text }]}>{session.eventName}</Text>
          <Text style={[styles.liveCardCircuit, { color: theme.textSub }]}>{session.circuit}</Text>
          <Text style={[styles.liveCardCity, { color: theme.textFaint }]}>{session.city}</Text>

          {session.status === "live" && session.keyStats && (
            <View style={styles.liveStats}>
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatVal, { color: COLORS.gold }]}>{session.keyStats.fastestET}</Text>
                <Text style={[styles.liveStatLabel, { color: theme.textFaint }]}>Best ET</Text>
              </View>
              <View style={styles.liveStatDiv} />
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatVal, { color: "#3B82F6" }]}>{session.keyStats.fastestMPH}</Text>
                <Text style={[styles.liveStatLabel, { color: theme.textFaint }]}>Trap Speed</Text>
              </View>
              <View style={styles.liveStatDiv} />
              <View style={styles.liveStat}>
                <Text style={[styles.liveStatVal, { color: COLORS.emerald }]}>{session.keyStats.leader}</Text>
                <Text style={[styles.liveStatLabel, { color: theme.textFaint }]}>Leader</Text>
              </View>
            </View>
          )}

          {session.status === "upcoming" && session.countdown && (
            <View style={styles.countdown}>
              {[
                { val: session.countdown.days, label: "DAYS" },
                { val: session.countdown.hours, label: "HRS" },
                { val: session.countdown.minutes, label: "MIN" },
              ].map((c, i) => (
                <View key={i} style={styles.countdownBlock}>
                  <Text style={[styles.countdownNum, { color }]}>{String(c.val).padStart(2, "0")}</Text>
                  <Text style={[styles.countdownLabel, { color: theme.textFaint }]}>{c.label}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.liveDesc, { color: theme.textSub }]}>{session.description}</Text>

          {session.broadcast && (
            <View style={styles.broadcastRow}>
              {session.broadcast.map(b => (
                <View key={b} style={[styles.broadcastChip, { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" }]}>
                  <Text style={[styles.broadcastText, { color: theme.textSub }]}>{b}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/* ─── Race Feed item ─────────────────────────────────────────────────────── */

function FeedCard({ item }: { item: FeedItem }) {
  const { theme } = useTheme();
  const urgencyColor = item.urgency === "live" ? "#EF4444" : item.urgency === "upcoming" ? "#F59E0B" : theme.textFaint;
  const mins = Math.round((Date.now() - new Date(item.timestamp).getTime()) / 60000);

  return (
    <View style={[styles.feedCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderLeftColor: urgencyColor, borderLeftWidth: 3 }]}>
      <View style={styles.feedTop}>
        <Text style={styles.feedIcon}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feedHeadline, { color: theme.text }]}>{item.headline}</Text>
          <Text style={[styles.feedDetail, { color: theme.textSub }]}>{item.detail}</Text>
        </View>
      </View>
      <View style={styles.feedMeta}>
        {item.urgency === "live" && <PulseLive color="#EF4444" />}
        <Text style={[styles.feedTime, { color: urgencyColor }]}>
          {item.urgency === "live" ? "LIVE" : `${mins}m ago`}
        </Text>
        <View style={[styles.seriesChip, { backgroundColor: `${urgencyColor}15`, borderColor: `${urgencyColor}25` }]}>
          <Text style={[styles.seriesChipText, { color: urgencyColor }]}>{item.series.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────────────────────────── */

export default function RaceModeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"live" | "f1" | "nascar" | "nhra" | "challenges" | "feed">("live");

  const { data: liveData } = useQuery({
    queryKey: ["racing-live"],
    queryFn: () => apiFetch<LiveData>("/racing/live"),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { data: f1Data } = useQuery({
    queryKey: ["racing-f1"],
    queryFn: () => apiFetch<F1Data>("/racing/standings/f1"),
    staleTime: 60_000,
  });

  const { data: nascarData } = useQuery({
    queryKey: ["racing-nascar"],
    queryFn: () => apiFetch<NASCARData>("/racing/standings/nascar"),
    staleTime: 60_000,
  });

  const { data: challengeData } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => apiFetch<ChallengesData>("/gamification/challenges"),
    staleTime: 60_000,
  });

  const { data: feedData } = useQuery({
    queryKey: ["racing-feed"],
    queryFn: () => apiFetch<FeedData>("/racing/feed"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const hasLive = liveData?.hasLiveAction ?? false;
  const liveSessions = liveData?.live ?? [];
  const nhraRuns = liveData?.nhraRuns ?? [];

  const TABS: { id: typeof activeTab; label: string; color?: string }[] = [
    { id: "live",       label: "🔴 LIVE" },
    { id: "f1",         label: "F1" },
    { id: "nascar",     label: "NASCAR" },
    { id: "nhra",       label: "NHRA" },
    { id: "challenges", label: "⚡ PITS" },
    { id: "feed",       label: "📡 FEED" },
  ];

  const handleCompleteChallenge = (_id: string) => {
    router.push("/aftermarket");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: "#050505" }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            {hasLive && <PulseLive color="#EF4444" />}
            <Text style={styles.headerTitle}>RACE MODE</Text>
          </View>
          <Text style={styles.headerSub}>F1 · NASCAR · NHRA · Live Motorsport Universe</Text>
        </View>
        <View style={[styles.headerLiveBadge, { backgroundColor: hasLive ? "#EF444418" : "transparent", borderColor: hasLive ? "#EF444430" : "transparent" }]}>
          {hasLive && <Text style={styles.headerLiveText}>LIVE</Text>}
        </View>
      </View>

      {/* ── Series tabs ─────────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, {
                backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                borderColor: isActive ? COLORS.gold : "rgba(255,255,255,0.08)",
              }]}
            >
              <Text style={[styles.tabText, { color: isActive ? COLORS.gold : "rgba(255,255,255,0.45)" }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* LIVE tab */}
        {activeTab === "live" && (
          <>
            {/* Live events */}
            {liveSessions.map(session => (
              <LiveEventCard key={session.eventId + session.sessionType} session={session} />
            ))}

            {/* NHRA runs if live */}
            {nhraRuns.length > 0 && <NHRARunList runs={nhraRuns} />}

            {/* Quick access */}
            <View style={styles.quickGrid}>
              {[
                { label: "F1 Standings", tab: "f1" as const, color: "#E8002D", icon: "award" },
                { label: "NASCAR Pylon", tab: "nascar" as const, color: "#1E3A8A", icon: "disc" },
                { label: "Pit Stop Challenges", tab: "challenges" as const, color: "#C9A227", icon: "zap" },
                { label: "Race Feed", tab: "feed" as const, color: "#8B5CF6", icon: "radio" },
              ].map(item => (
                <Pressable key={item.tab} onPress={() => setActiveTab(item.tab)} style={[styles.quickBtn, { backgroundColor: `${item.color}10`, borderColor: `${item.color}25` }]}>
                  <Feather name={item.icon as keyof typeof Feather.glyphMap} size={20} color={item.color} />
                  <Text style={[styles.quickBtnText, { color: item.color }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Racing fact strip */}
            <View style={[styles.factStrip, { backgroundColor: "rgba(201,162,39,0.06)", borderColor: "rgba(201,162,39,0.15)" }]}>
              <Text style={styles.factStripIcon}>🏎️</Text>
              <Text style={[styles.factStripText, { color: "rgba(255,255,255,0.55)" }]}>
                The fastest objects in motorsport, ranked: NHRA Top Fuel (334 mph) · IndyCar (237 mph) · Formula 1 (233 mph) · NASCAR (203 mph)
              </Text>
            </View>
          </>
        )}

        {/* F1 tab */}
        {activeTab === "f1" && f1Data && (
          <>
            <View style={[styles.sectionHeader, { borderColor: "#E8002D30" }]}>
              <Text style={[styles.sectionTitle, { color: "#E8002D" }]}>◆ FORMULA 1 — 2026 WORLD CHAMPIONSHIP</Text>
              <Text style={[styles.sectionSub, { color: "rgba(255,255,255,0.4)" }]}>{f1Data.racesCompleted} of {f1Data.totalRaces} rounds completed</Text>
            </View>
            <F1TimingTower standings={f1Data.drivers} />
            <View style={[styles.factStrip, { backgroundColor: "rgba(232,0,45,0.06)", borderColor: "rgba(232,0,45,0.15)" }]}>
              <Text style={styles.factStripIcon}>🏁</Text>
              <Text style={[styles.factStripText, { color: "rgba(255,255,255,0.55)" }]}>
                F1 cars generate up to 5.5G in cornering force. A driver experiences more G-force in 1 lap than a fighter pilot in combat.
              </Text>
            </View>
          </>
        )}

        {/* NASCAR tab */}
        {activeTab === "nascar" && nascarData && (
          <>
            <View style={[styles.sectionHeader, { borderColor: "#1E3A8A30" }]}>
              <Text style={[styles.sectionTitle, { color: "#4A90D9" }]}>◆ NASCAR CUP SERIES — 2026</Text>
              <Text style={[styles.sectionSub, { color: "rgba(255,255,255,0.4)" }]}>{nascarData.racesCompleted} races complete · Bristol Motor Speedway next</Text>
            </View>
            <NASCARPylon standings={nascarData.drivers} />
            <View style={[styles.factStrip, { backgroundColor: "rgba(30,58,138,0.08)", borderColor: "rgba(74,144,217,0.2)" }]}>
              <Text style={styles.factStripIcon}>🏁</Text>
              <Text style={[styles.factStripText, { color: "rgba(255,255,255,0.55)" }]}>
                At Bristol Motor Speedway, drivers run 500 laps on a 0.533-mile oval — 500 laps × 0.533 miles = 266 miles of pure short-track intensity.
              </Text>
            </View>
          </>
        )}

        {/* NHRA tab */}
        {activeTab === "nhra" && (
          <>
            <View style={[styles.sectionHeader, { borderColor: "#FF6B0030" }]}>
              <Text style={[styles.sectionTitle, { color: "#FF6B00" }]}>◆ NHRA GATORNATIONALS — GAINESVILLE</Text>
              <Text style={[styles.sectionSub, { color: "rgba(255,255,255,0.4)" }]}>Q1 Complete · Q2 at 14:00 ET · Race Day Sunday</Text>
            </View>
            <NHRARunList runs={nhraRuns} />
            <View style={[styles.factStrip, { backgroundColor: "rgba(255,107,0,0.06)", borderColor: "rgba(255,107,0,0.2)" }]}>
              <Text style={styles.factStripIcon}>⚡</Text>
              <Text style={[styles.factStripText, { color: "rgba(255,255,255,0.55)" }]}>
                NHRA Top Fuel dragsters consume 15 gallons of nitromethane per run. Each pass costs approximately $1,000 in fuel alone.
              </Text>
            </View>
          </>
        )}

        {/* Challenges tab */}
        {activeTab === "challenges" && challengeData && (
          <>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeHeaderTop}>
                <Text style={styles.challengeHeaderTitle}>⚡ PIT STOP CHALLENGES</Text>
                <View style={[styles.pointsBadge, { backgroundColor: `${COLORS.gold}18`, borderColor: `${COLORS.gold}30` }]}>
                  <Text style={[styles.pointsBadgeText, { color: COLORS.gold }]}>{challengeData.totalPoints} pts available</Text>
                </View>
              </View>
              <Text style={[styles.challengeHeaderSub, { color: "rgba(255,255,255,0.4)" }]}>
                Racing-inspired goals. Every action earns ONYX points toward your driver tier.
              </Text>
            </View>

            <Text style={[styles.groupTitle, { color: "rgba(255,255,255,0.5)" }]}>DAILY — EXPIRES IN {challengeData.daily[0]?.expiresIn ?? "12h"}</Text>
            {challengeData.daily.map(c => <ChallengeCard key={c.id} challenge={c} onComplete={handleCompleteChallenge} />)}

            <Text style={[styles.groupTitle, { color: "rgba(255,255,255,0.5)", marginTop: 20 }]}>WEEKLY CHALLENGES</Text>
            {challengeData.weekly.map(c => <ChallengeCard key={c.id} challenge={c} onComplete={handleCompleteChallenge} />)}
          </>
        )}

        {/* Feed tab */}
        {activeTab === "feed" && feedData && (
          <>
            <View style={[styles.sectionHeader, { borderColor: "#8B5CF630" }]}>
              <Text style={[styles.sectionTitle, { color: "#8B5CF6" }]}>◆ RACING INTELLIGENCE FEED</Text>
              <View style={styles.feedLiveBadge}>
                {feedData.hasLive && <PulseLive color="#EF4444" />}
                <Text style={[styles.sectionSub, { color: "#EF4444" }]}>{feedData.hasLive ? "LIVE events active" : "Latest updates"}</Text>
              </View>
            </View>
            {feedData.feed.map(item => <FeedCard key={item.id} item={item} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: "900", letterSpacing: 3, color: "#fff" },
  headerSub: { fontSize: 8, fontWeight: "600", letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  headerLiveBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  headerLiveText: { fontSize: 8, fontWeight: "900", color: "#EF4444", letterSpacing: 2 },

  // Tabs
  tabScroll: { flexShrink: 0, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  tabRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  // Section header
  sectionHeader: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  sectionSub: { fontSize: 10, fontWeight: "500" },

  // Live card
  liveCard: { borderWidth: 1.5, borderRadius: 20, overflow: "hidden" },
  liveCardBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  liveCardBarLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveCardStatus: { fontSize: 9, fontWeight: "900", letterSpacing: 2, color: "#fff" },
  liveCardSeries: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  liveCardSession: { fontSize: 8, fontWeight: "800", color: "rgba(255,255,255,0.8)", letterSpacing: 1 },
  liveCardBody: { padding: 16, gap: 10 },
  liveCardEvent: { fontSize: 18, fontWeight: "900", lineHeight: 22 },
  liveCardCircuit: { fontSize: 12, fontWeight: "600" },
  liveCardCity: { fontSize: 10 },
  liveStats: { flexDirection: "row", alignItems: "center", gap: 0, marginTop: 4 },
  liveStat: { flex: 1, alignItems: "center" },
  liveStatVal: { fontSize: 16, fontWeight: "900" },
  liveStatLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  liveStatDiv: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.1)" },
  countdown: { flexDirection: "row", gap: 12, marginTop: 4 },
  countdownBlock: { alignItems: "center" },
  countdownNum: { fontSize: 32, fontWeight: "900", lineHeight: 36 },
  countdownLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  liveDesc: { fontSize: 11, lineHeight: 16 },
  broadcastRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  broadcastChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  broadcastText: { fontSize: 9, fontWeight: "700" },

  // Timing tower
  timingTower: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  timingHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  timingTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 2, flex: 1 },
  timingSubtitle: { fontSize: 9, fontWeight: "600" },
  seriesDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  timingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  timingPos: { width: 20, fontSize: 11, fontWeight: "900", textAlign: "center" },
  timingTeamBar: { width: 3, height: 26, borderRadius: 2 },
  timingDriverInfo: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  timingNum: { fontSize: 9, fontWeight: "900" },
  timingName: { fontSize: 12, fontWeight: "800" },
  timingTeam: { flex: 1, fontSize: 9 },
  timingRight: { alignItems: "flex-end" },
  timingPoints: { fontSize: 13, fontWeight: "900" },
  timingGap: { fontSize: 9, fontWeight: "500" },
  winBadge: { fontSize: 10 },
  playoffCutline: { borderTopWidth: 1.5, borderStyle: "dashed", paddingTop: 8, marginHorizontal: 12, marginBottom: 8 },
  playoffCutlineText: { fontSize: 8, fontWeight: "800", color: "#EF4444", textAlign: "center", letterSpacing: 2 },
  sectorVal: { fontSize: 10, fontWeight: "700" },

  // NHRA
  nhraHeaders: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, gap: 8 },
  nhraHeaderText: { fontSize: 8, fontWeight: "800", letterSpacing: 1, textAlign: "right", minWidth: 40 },
  nhraRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  nhraDriver: { fontSize: 11, fontWeight: "800" },
  nhraTeam: { fontSize: 9, fontWeight: "500", marginTop: 1 },
  nhraRT: { fontSize: 11, fontWeight: "600", textAlign: "right", minWidth: 40 },
  nhraET: { fontSize: 13, fontWeight: "900", textAlign: "right", minWidth: 50 },
  nhraMPH: { fontSize: 11, fontWeight: "700", textAlign: "right", minWidth: 50 },
  treeBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  treeBtnText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  treeContainer: { alignItems: "center", paddingVertical: 12, gap: 8 },
  christmasTree: { flexDirection: "row", gap: 16, alignItems: "flex-end" },
  treeColumn: { alignItems: "center", gap: 6 },
  treeDot: { shadowColor: "#00FF00", shadowRadius: 6, shadowOpacity: 0.8 },
  treeLabel: { fontSize: 9, letterSpacing: 1 },
  dragFact: { margin: 12, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", gap: 8 },
  dragFactIcon: { fontSize: 14 },
  dragFactText: { fontSize: 11, lineHeight: 16, flex: 1 },

  // Challenges
  challengeHeader: { gap: 6, marginBottom: 4 },
  challengeHeaderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  challengeHeaderTitle: { fontSize: 12, fontWeight: "900", letterSpacing: 2, color: "#fff" },
  pointsBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pointsBadgeText: { fontSize: 10, fontWeight: "800" },
  challengeHeaderSub: { fontSize: 11, lineHeight: 16 },
  groupTitle: { fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  challengeCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  challengeTop: { flexDirection: "row", gap: 12 },
  challengeIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  challengeTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  challengeTitle: { fontSize: 12, fontWeight: "900", flex: 1 },
  challengePoints: { fontSize: 11, fontWeight: "800" },
  challengeDesc: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  challengeRacing: { fontSize: 10, fontStyle: "italic", marginTop: 4, lineHeight: 14 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  challengeBottom: { flexDirection: "row", justifyContent: "space-between" },
  challengeExpiry: { fontSize: 9, fontWeight: "600" },
  progressText: { fontSize: 9, fontWeight: "700" },
  completeBtn: { borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  completeBtnText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10 },
  completedText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  // Feed
  feedCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  feedTop: { flexDirection: "row", gap: 10 },
  feedIcon: { fontSize: 18 },
  feedHeadline: { fontSize: 12, fontWeight: "800", lineHeight: 16 },
  feedDetail: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  feedMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedTime: { fontSize: 9, fontWeight: "700" },
  feedLiveBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  seriesChip: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  seriesChipText: { fontSize: 7, fontWeight: "900", letterSpacing: 1 },

  // Quick grid
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: { width: (SCREEN_W - 44) / 2, borderWidth: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 8 },
  quickBtnText: { fontSize: 11, fontWeight: "800", textAlign: "center" },

  // Fact strip
  factStrip: { flexDirection: "row", borderWidth: 1, borderRadius: 14, padding: 12, gap: 10, marginTop: 4 },
  factStripIcon: { fontSize: 18 },
  factStripText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
