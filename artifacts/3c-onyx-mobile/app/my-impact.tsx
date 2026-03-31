/**
 * ONYX Impact — Member Value Intelligence Screen
 *
 * "Here's exactly what 3C ONYX has done for you."
 * Total value: savings + earnings + referral bonuses.
 * Real data from DB — no mocks. Adapts to member role.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/authStore";

const GOLD    = "#C9A227";
const BLACK   = "#0A0A0B";
const CARD    = "#111113";
const BORDER  = "rgba(201,162,39,0.15)";
const MUTED   = "rgba(255,255,255,0.38)";
const TEXT    = "#FFFFFF";
const SUCCESS = "#22C55E";
const BLUE    = "#3B82F6";
const PURPLE  = "#A855F7";

// ─── API Types ────────────────────────────────────────────────────────────────

interface ImpactData {
  vehicleCount:  number;
  totalValue:    { cents: number; usd: string; label: string };
  savings:       { identifiedUsd: string; capturedUsd: string; captureRate: number };
  earnings:      { bayTotalUsd: string; platformCreditUsd: string; referralBonusUsd: string; pendingBayCount: number };
  tasks:         { total: number; active: number; completed: number; successRate: number; recent: RecentTask[] };
  referral:      { code: string | null; referralsCount: number; tier: string; tierColor: string; tierReward: string; nextMilestone: number | null };
}

interface RecentTask {
  id:          number;
  title:       string;
  taskType:    string;
  status:      string;
  payoutUsd:   string;
  completedAt: string | null;
  createdAt:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function taskStatusColor(status: string): string {
  switch (status) {
    case "Completed":   return SUCCESS;
    case "In Progress": return GOLD;
    case "Claimed":     return BLUE;
    case "Cancelled":   return "#EF4444";
    default:            return MUTED;
  }
}

function taskTypeIcon(type: string): keyof typeof Feather.glyphMap {
  const map: Record<string, keyof typeof Feather.glyphMap> = {
    Delivery:     "truck",
    Inspection:   "search",
    Photography:  "camera",
    Detailing:    "droplet",
    Transport:    "navigation",
    Concierge:    "star",
    Other:        "activity",
  };
  return map[type] ?? "activity";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = GOLD }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={[sc.metricCard, { borderColor: `${color}22` }]}>
      <Text style={[sc.metricValue, { color }]}>{value}</Text>
      <Text style={sc.metricLabel}>{label}</Text>
      {!!sub && <Text style={sc.metricSub}>{sub}</Text>}
    </View>
  );
}

function SectionHeader({ icon, title, color = GOLD }: { icon: keyof typeof Feather.glyphMap; title: string; color?: string }) {
  return (
    <View style={sc.sectionHeader}>
      <View style={[sc.sectionIconWrap, { backgroundColor: `${color}18` }]}>
        <Feather name={icon} size={13} color={color} />
      </View>
      <Text style={[sc.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function ProgressBar({ pct, color = GOLD }: { pct: number; color?: string }) {
  return (
    <View style={sc.progressTrack}>
      <View style={[sc.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function TaskRow({ task }: { task: RecentTask }) {
  const statusColor = taskStatusColor(task.status);
  return (
    <View style={sc.taskRow}>
      <View style={[sc.taskIconWrap, { backgroundColor: `${statusColor}18` }]}>
        <Feather name={taskTypeIcon(task.taskType)} size={14} color={statusColor} />
      </View>
      <View style={sc.taskInfo}>
        <Text style={sc.taskTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={sc.taskMeta}>{task.taskType} · {relativeTime(task.createdAt)}</Text>
      </View>
      <View style={sc.taskRight}>
        <Text style={[sc.taskStatus, { color: statusColor }]}>{task.status}</Text>
        {parseFloat(task.payoutUsd) > 0 && (
          <Text style={sc.taskPayout}>${parseFloat(task.payoutUsd).toFixed(0)}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyImpactScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp" });

  const { data, isLoading, refetch } = useQuery<ImpactData>({
    queryKey: ["impact", user?.id],
    queryFn:  () => apiFetch("/impact") as Promise<ImpactData>,
    enabled:  !!user,
    staleTime: 60_000,
  });

  const skelColor = "rgba(255,255,255,0.06)";

  return (
    <View style={[sc.root, { paddingTop: insets.top }]}>
      {/* Floating header bar (appears on scroll) */}
      <Animated.View style={[sc.floatingBar, { opacity: headerOpacity, paddingTop: insets.top }]}>
        <Text style={sc.floatingBarTitle}>ONYX IMPACT</Text>
      </Animated.View>

      {/* Back button */}
      <Pressable style={[sc.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={GOLD} />
      </Pressable>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Hero ── */}
        <View style={sc.hero}>
          <View style={sc.heroLabel}>
            <MaterialCommunityIcons name="diamond-stone" size={14} color={GOLD} />
            <Text style={sc.heroLabelText}>ONYX IMPACT  ·  MEMBER VALUE</Text>
          </View>

          {isLoading ? (
            <View style={[sc.heroValueSkeleton, { backgroundColor: skelColor }]} />
          ) : (
            <Text style={sc.heroValue}>{data?.totalValue.usd ?? "$0.00"}</Text>
          )}
          <Text style={sc.heroSub}>Total platform value generated for you</Text>

          {/* 3-column summary */}
          <View style={sc.heroStats}>
            {[
              { label: "SAVINGS",  value: data?.savings.capturedUsd  ?? "—", color: SUCCESS },
              { label: "EARNINGS", value: data?.earnings.bayTotalUsd ?? "—", color: GOLD   },
              { label: "REFERRALS",value: String(data?.referral.referralsCount ?? 0), color: BLUE  },
            ].map(s => (
              <View key={s.label} style={sc.heroStatBox}>
                <Text style={[sc.heroStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={sc.heroStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Savings Section ── */}
        <View style={sc.section}>
          <SectionHeader icon="trending-up" title="SAVINGS IDENTIFIED" color={SUCCESS} />
          <View style={sc.metricsRow}>
            <MetricCard label="Identified" value={data?.savings.identifiedUsd ?? "—"} color={SUCCESS} />
            <MetricCard label="Captured"   value={data?.savings.capturedUsd ?? "—"}   color={GOLD}    />
          </View>
          <View style={sc.progressSection}>
            <View style={sc.progressLabelRow}>
              <Text style={sc.progressLabel}>Capture Rate</Text>
              <Text style={[sc.progressPct, { color: SUCCESS }]}>{data?.savings.captureRate ?? 0}%</Text>
            </View>
            <ProgressBar pct={data?.savings.captureRate ?? 0} color={SUCCESS} />
            <Text style={sc.progressHint}>
              Every alert you act on captures more of your identified savings.
            </Text>
          </View>
        </View>

        {/* ── Earnings Section ── */}
        <View style={sc.section}>
          <SectionHeader icon="dollar-sign" title="YOUR EARNINGS" color={GOLD} />
          <View style={sc.earningsGrid}>
            {[
              { label: "Bay QR Payments",   value: data?.earnings.bayTotalUsd ?? "$0.00",       icon: "credit-card" as const, color: GOLD   },
              { label: "Platform Credits",  value: data?.earnings.platformCreditUsd ?? "$0.00", icon: "gift"        as const, color: BLUE   },
              { label: "Referral Bonuses",  value: data?.earnings.referralBonusUsd ?? "$0.00",  icon: "users"       as const, color: PURPLE },
              { label: "Pending Bay",       value: `${data?.earnings.pendingBayCount ?? 0} txn`,icon: "clock"       as const, color: MUTED  },
            ].map(e => (
              <View key={e.label} style={[sc.earningsCard, { borderColor: `${e.color}22` }]}>
                <Feather name={e.icon} size={16} color={e.color} />
                <Text style={[sc.earningsValue, { color: e.color }]}>{e.value}</Text>
                <Text style={sc.earningsLabel}>{e.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Task Activity ── */}
        <View style={sc.section}>
          <SectionHeader icon="activity" title="REQUESTS HANDLED" color={BLUE} />
          <View style={sc.metricsRow}>
            <MetricCard label="Active Now" value={String(data?.tasks.active ?? 0)}    color={GOLD}   />
            <MetricCard label="Completed"  value={String(data?.tasks.completed ?? 0)} color={SUCCESS} />
            <MetricCard label="Success"    value={`${data?.tasks.successRate ?? 0}%`}  color={BLUE}   />
          </View>

          {(data?.tasks.recent ?? []).length === 0 ? (
            <View style={sc.emptyState}>
              <Feather name="inbox" size={28} color={MUTED} />
              <Text style={sc.emptyText}>No requests yet.{"\n"}Tap "Handle this for me" on any alert.</Text>
            </View>
          ) : (
            <View style={sc.taskList}>
              {(data?.tasks.recent ?? []).map(t => <TaskRow key={t.id} task={t} />)}
            </View>
          )}
        </View>

        {/* ── Referral Network ── */}
        <View style={sc.section}>
          <SectionHeader icon="share-2" title="YOUR REFERRAL NETWORK" color={PURPLE} />
          <View style={[sc.referralCard, { borderColor: `${data?.referral.tierColor ?? PURPLE}30` }]}>
            <View style={sc.referralTop}>
              <View>
                <Text style={sc.referralCount}>{data?.referral.referralsCount ?? 0}</Text>
                <Text style={sc.referralCountLabel}>Members Invited</Text>
              </View>
              <View style={[sc.tierBadge, { backgroundColor: `${data?.referral.tierColor ?? "#555"}22`, borderColor: `${data?.referral.tierColor ?? "#555"}40` }]}>
                <Text style={[sc.tierBadgeText, { color: data?.referral.tierColor ?? MUTED }]}>
                  {data?.referral.tier ?? "NONE"}
                </Text>
              </View>
            </View>
            <Text style={sc.referralReward}>{data?.referral.tierReward ?? "Invite your first member to unlock rewards"}</Text>
            {data?.referral.nextMilestone && (
              <>
                <View style={sc.progressLabelRow}>
                  <Text style={sc.progressLabel}>Progress to next tier</Text>
                  <Text style={[sc.progressPct, { color: data.referral.tierColor }]}>
                    {data.referral.referralsCount} / {data.referral.nextMilestone}
                  </Text>
                </View>
                <ProgressBar
                  pct={(data.referral.referralsCount / data.referral.nextMilestone) * 100}
                  color={data.referral.tierColor}
                />
              </>
            )}
            {data?.referral.code && (
              <View style={sc.referralCodeRow}>
                <Feather name="key" size={12} color={GOLD} />
                <Text style={sc.referralCodeLabel}>YOUR CODE</Text>
                <Text style={[sc.referralCode, { color: GOLD }]}>{data.referral.code.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Vehicles ── */}
        {(data?.vehicleCount ?? 0) > 0 && (
          <View style={sc.section}>
            <SectionHeader icon="truck" title="YOUR GARAGE" color={GOLD} />
            <Pressable style={sc.garageCard} onPress={() => router.push("/garage" as never)}>
              <View style={sc.garageLeft}>
                <Text style={sc.garageCount}>{data?.vehicleCount}</Text>
                <Text style={sc.garageLabel}>Vehicle{(data?.vehicleCount ?? 0) !== 1 ? "s" : ""} tracked</Text>
              </View>
              <View style={sc.garageRight}>
                <Text style={sc.garageAction}>View Garage</Text>
                <Feather name="arrow-right" size={14} color={GOLD} />
              </View>
            </Pressable>
          </View>
        )}

        {/* ── Refresh ── */}
        <Pressable style={sc.refreshBtn} onPress={() => void refetch()}>
          <Feather name="refresh-cw" size={13} color={MUTED} />
          <Text style={sc.refreshText}>Refresh Impact Data</Text>
        </Pressable>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sc = StyleSheet.create({
  root:               { flex: 1, backgroundColor: BLACK },
  floatingBar:        { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: "rgba(10,10,11,0.92)", paddingBottom: 14, alignItems: "center", borderBottomWidth: 1, borderBottomColor: BORDER },
  floatingBarTitle:   { fontSize: 11, fontWeight: "800", letterSpacing: 3, color: GOLD },
  backBtn:            { position: "absolute", left: 16, zIndex: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },

  hero:               { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: BORDER },
  heroLabel:          { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  heroLabelText:      { fontSize: 9, fontWeight: "800", letterSpacing: 3, color: GOLD },
  heroValue:          { fontSize: 48, fontWeight: "900", color: TEXT, letterSpacing: -1.5, marginBottom: 4 },
  heroValueSkeleton:  { height: 56, width: 180, borderRadius: 10, marginBottom: 4 },
  heroSub:            { fontSize: 12, color: MUTED, marginBottom: 24 },
  heroStats:          { flexDirection: "row", gap: 0, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 20 },
  heroStatBox:        { flex: 1, alignItems: "center" },
  heroStatValue:      { fontSize: 20, fontWeight: "800" },
  heroStatLabel:      { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: MUTED, marginTop: 2 },

  section:            { marginTop: 28, paddingHorizontal: 20 },
  sectionHeader:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionIconWrap:    { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle:       { fontSize: 10, fontWeight: "800", letterSpacing: 2 },

  metricsRow:         { flexDirection: "row", gap: 10 },
  metricCard:         { flex: 1, backgroundColor: CARD, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center" },
  metricValue:        { fontSize: 22, fontWeight: "800" },
  metricLabel:        { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: MUTED, marginTop: 4 },
  metricSub:          { fontSize: 9, color: MUTED, marginTop: 2 },

  progressSection:    { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginTop: 10 },
  progressLabelRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel:      { fontSize: 11, color: MUTED, fontWeight: "600" },
  progressPct:        { fontSize: 13, fontWeight: "800" },
  progressTrack:      { height: 6, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" },
  progressFill:       { height: "100%", borderRadius: 3 },
  progressHint:       { fontSize: 10, color: MUTED, marginTop: 10, lineHeight: 15 },

  earningsGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  earningsCard:       { width: "47%", backgroundColor: CARD, borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  earningsValue:      { fontSize: 18, fontWeight: "800" },
  earningsLabel:      { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, color: MUTED },

  taskList:           { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, overflow: "hidden", marginTop: 10 },
  taskRow:            { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  taskIconWrap:       { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  taskInfo:           { flex: 1 },
  taskTitle:          { fontSize: 13, fontWeight: "600", color: TEXT },
  taskMeta:           { fontSize: 10, color: MUTED, marginTop: 2 },
  taskRight:          { alignItems: "flex-end", gap: 2 },
  taskStatus:         { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  taskPayout:         { fontSize: 11, fontWeight: "700", color: GOLD },

  emptyState:         { alignItems: "center", paddingVertical: 36, gap: 10 },
  emptyText:          { fontSize: 12, color: MUTED, textAlign: "center", lineHeight: 18 },

  referralCard:       { backgroundColor: CARD, borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 },
  referralTop:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  referralCount:      { fontSize: 36, fontWeight: "900", color: TEXT },
  referralCountLabel: { fontSize: 10, color: MUTED, fontWeight: "600", marginTop: 2 },
  tierBadge:          { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tierBadgeText:      { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  referralReward:     { fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 19 },
  referralCodeRow:    { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 14 },
  referralCodeLabel:  { fontSize: 8, fontWeight: "800", letterSpacing: 2, color: MUTED },
  referralCode:       { fontSize: 14, fontWeight: "900", letterSpacing: 2, marginLeft: 4 },

  garageCard:         { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  garageLeft:         { gap: 2 },
  garageCount:        { fontSize: 28, fontWeight: "900", color: TEXT },
  garageLabel:        { fontSize: 10, color: MUTED, fontWeight: "600" },
  garageRight:        { flexDirection: "row", alignItems: "center", gap: 6 },
  garageAction:       { fontSize: 12, fontWeight: "700", color: GOLD },

  refreshBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 32, marginBottom: 8 },
  refreshText:        { fontSize: 11, color: MUTED },
});
