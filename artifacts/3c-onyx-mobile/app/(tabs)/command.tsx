import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { COLORS } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pulse {
  kFactor: { current: number; delta: number; trend: string; weeklyReferrals: number; weeklyConversions: number };
  memberSlices: { totalPaid: number; thisWeek: number; activeRecipients: number };
  missions: { active: number; inTransit: number; guardianActive: number; arrivingToday: number; totalDealValue: number };
  killSwitch: { flaggedCount: number; totalOnHold: number; highestRiskScore: number };
  revenue: { todayGmv: number; weekGmv: number; platformProfit: number };
  unackedAlerts: number;
  timestamp: string;
}

interface FlaggedTxn {
  id: string; txnId: string; type: string; amount: number;
  riskScore: number; aiReasoning: string; flaggedAt: string;
  resolvedAt: string | null; resolution: string | null;
  from: string; to: string; holdUntil: string;
  riskReasons: string[];
}

interface Mission {
  id: string; vehicle: string; status: string; route: { from: string; to: string };
  carrier: string; dayOfTotal: string; etaHours: number; dealValue: number;
  guardianActive: boolean; lastPingMinutesAgo: number; currentCity: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString()}`;

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const RISK_REASON_LABELS: Record<string, string> = {
  aml_velocity: "AML Velocity",
  new_account_large_sum: "New Account / Large Sum",
  k_factor_anomaly: "K-Factor Anomaly",
  geo_mismatch: "Geo Mismatch",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  in_transit:      { label: "IN TRANSIT",    color: "#60A5FA" },
  pickup_pending:  { label: "PICKUP PENDING", color: "#FBBF24" },
  guardian_active: { label: "GUARDIAN",      color: "#34D399" },
  arriving_today:  { label: "ARRIVING",      color: "#A78BFA" },
};

// ─── Mission Card ─────────────────────────────────────────────────────────────
function MissionCard({ m }: { m: Mission }) {
  const sc = STATUS_MAP[m.status] ?? { label: m.status.toUpperCase(), color: "#ffffff40" };
  return (
    <View style={styles.missionCard}>
      <View style={styles.missionRow}>
        <View style={styles.missionIconWrap}>
          <MaterialCommunityIcons name="truck-delivery" size={16} color="rgba(255,255,255,0.3)" />
          {m.guardianActive && (
            <View style={styles.guardianDot}>
              <Ionicons name="shield-checkmark" size={8} color="#000" />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.missionVehicle} numberOfLines={1}>{m.vehicle}</Text>
          <Text style={styles.missionCity} numberOfLines={1}>
            {m.currentCity} → {m.route.to}
          </Text>
          <View style={styles.missionMeta}>
            <Text style={[styles.missionStatus, { color: sc.color }]}>{sc.label}</Text>
            <Text style={styles.missionMetaDot}>·</Text>
            <Text style={styles.missionCarrier}>{m.carrier}</Text>
            <Text style={styles.missionMetaDot}>·</Text>
            <Text style={styles.missionCarrier}>Day {m.dayOfTotal}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.dealValue}>{fmt(m.dealValue)}</Text>
          <View style={styles.pingRow}>
            <View style={[styles.pingDot, {
              backgroundColor: m.lastPingMinutesAgo <= 5 ? "#34D399" : m.lastPingMinutesAgo <= 15 ? "#FBBF24" : "#EF4444"
            }]} />
            <Text style={styles.pingText}>{m.lastPingMinutesAgo}m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Kill Switch Card ─────────────────────────────────────────────────────────
function KillSwitchCard({ txn, onAction }: {
  txn: FlaggedTxn;
  onAction: (id: string, action: "approved" | "rejected") => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState<"approved" | "rejected" | null>(null);
  const resolved = !!txn.resolvedAt;

  const handle = async (action: "approved" | "rejected") => {
    setActing(action);
    await onAction(txn.id, action);
    setActing(null);
  };

  const riskColor = txn.riskScore >= 80 ? "#EF4444" : txn.riskScore >= 60 ? "#FBBF24" : "#FACC15";
  const borderColor = txn.riskScore >= 80 ? "rgba(239,68,68,0.2)" : txn.riskScore >= 60 ? "rgba(251,191,36,0.2)" : "rgba(250,204,21,0.15)";

  return (
    <View style={[styles.killCard, { borderColor: resolved ? "rgba(255,255,255,0.06)" : borderColor }]}>
      <TouchableOpacity onPress={() => !resolved && setExpanded(v => !v)} activeOpacity={0.7}>
        <View style={styles.killCardHeader}>
          <View style={[styles.killIcon, { borderColor, backgroundColor: resolved ? "rgba(255,255,255,0.04)" : `${riskColor}12` }]}>
            {resolved ? (
              txn.resolution === "approved"
                ? <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                : <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
            ) : (
              <Ionicons name="warning" size={18} color={riskColor} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={styles.txnId}>{txn.txnId}</Text>
              {resolved && (
                <Text style={[styles.resolvedTag, { color: txn.resolution === "approved" ? "#34D399" : "rgba(255,255,255,0.3)" }]}>
                  {txn.resolution?.toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={[styles.txnAmount, { color: resolved ? "rgba(255,255,255,0.3)" : "#fff" }]}>
              {fmt(txn.amount)}
            </Text>
            {/* Risk bar */}
            <View style={styles.riskBarWrap}>
              <View style={styles.riskBg}>
                <View style={[styles.riskFill, { width: `${txn.riskScore}%` as any, backgroundColor: riskColor }]} />
              </View>
              <Text style={[styles.riskScore, { color: riskColor }]}>{txn.riskScore}</Text>
            </View>
          </View>
          {!resolved && (
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14} color="rgba(255,255,255,0.2)"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded */}
      {expanded && !resolved && (
        <View style={styles.killExpanded}>
          <Text style={styles.killSectionLabel}>AI Risk Analysis</Text>
          <Text style={styles.killReasoning}>{txn.aiReasoning}</Text>

          <View style={styles.killTagRow}>
            {txn.riskReasons.map(r => (
              <View key={r} style={[styles.killTag, { borderColor }]}>
                <Text style={[styles.killTagText, { color: riskColor }]}>{RISK_REASON_LABELS[r] ?? r}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.killTimestamp}>
            Flagged {timeAgo(txn.flaggedAt)}
          </Text>

          <View style={styles.killButtons}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handle("rejected")}
              disabled={!!acting}
              activeOpacity={0.7}
            >
              {acting === "rejected"
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <Ionicons name="close-circle" size={16} color="#EF4444" />
              }
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handle("approved")}
              disabled={!!acting}
              activeOpacity={0.7}
            >
              {acting === "approved"
                ? <ActivityIndicator size="small" color="#34D399" />
                : <Ionicons name="checkmark-circle" size={16} color="#34D399" />
              }
              <Text style={styles.approveText}>APPROVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CommandScreen() {
  const insets = useSafeAreaInsets();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [flagged, setFlagged] = useState<FlaggedTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<"pulse" | "missions" | "killswitch">("pulse");

  const fetchAll = useCallback(async () => {
    try {
      const [p, m, f] = await Promise.all([
        apiFetch<Pulse>("/command/pulse"),
        apiFetch<{ missions: Mission[] }>("/command/missions"),
        apiFetch<{ flagged: FlaggedTxn[] }>("/command/flagged"),
      ]);
      setPulse(p);
      setMissions(m.missions ?? []);
      setFlagged(f.flagged ?? []);
    } catch (e) {
      console.error("Command fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleOverride = async (id: string, action: "approved" | "rejected") => {
    await apiFetch(`/command/override/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    await fetchAll();
  };

  const unresolvedFlagged = flagged.filter(t => !t.resolvedAt);
  const kTrend = pulse?.kFactor.trend ?? "healthy";
  const kColor = kTrend === "viral" ? "#34D399" : kTrend === "healthy" ? "#FBBF24" : "#EF4444";

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Loading Command Center…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="radar" size={18} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.headerTitle}>COMMAND CENTER</Text>
            <Text style={styles.headerSub}>Founder Access · National Mesh</Text>
          </View>
        </View>
        {unresolvedFlagged.length > 0 && (
          <TouchableOpacity
            style={styles.alertPill}
            onPress={() => setActiveSection("killswitch")}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={styles.alertPillText}>{unresolvedFlagged.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section tabs */}
      <View style={styles.tabRow}>
        {([
          { id: "pulse" as const,      label: "Pulse",      badge: pulse?.unackedAlerts },
          { id: "missions" as const,   label: "Missions",   badge: missions.filter(m => m.status !== "delivered").length },
          { id: "killswitch" as const, label: "Kill-Switch", badge: unresolvedFlagged.length, danger: true },
        ] as const).map(({ id, label, badge, danger }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, activeSection === id && styles.tabActive]}
            onPress={() => setActiveSection(id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeSection === id && styles.tabTextActive]}>{label}</Text>
            {badge !== undefined && badge > 0 && (
              <View style={[styles.tabBadge, danger && styles.tabBadgeDanger]}>
                <Text style={styles.tabBadgeText}>{badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PULSE ─────────────────────────────────────────────── */}
        {activeSection === "pulse" && pulse && (
          <View style={{ gap: 12 }}>
            {/* K-Factor hero card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>LIVE K-FACTOR</Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroValue, { color: kColor }]}>{pulse.kFactor.current.toFixed(2)}</Text>
                <View style={styles.heroBadge}>
                  <Text style={[styles.heroBadgeText, { color: kColor }]}>{kTrend.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.heroSub}>
                {pulse.kFactor.delta > 0 ? "+" : ""}{pulse.kFactor.delta.toFixed(2)} vs yesterday
              </Text>
              <View style={styles.heroStatRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Referrals (7d)</Text>
                  <Text style={styles.heroStatValue}>{pulse.kFactor.weeklyReferrals.toLocaleString()}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Conversions</Text>
                  <Text style={styles.heroStatValue}>{pulse.kFactor.weeklyConversions.toLocaleString()}</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Rate</Text>
                  <Text style={styles.heroStatValue}>
                    {Math.round((pulse.kFactor.weeklyConversions / Math.max(1, pulse.kFactor.weeklyReferrals)) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* 2-col metric grid */}
            <View style={styles.metricGrid}>
              <MetricCard
                label="Member Slices" icon="currency-usd" iconColor="#A78BFA"
                value={fmt(pulse.memberSlices.totalPaid)}
                sub={`${fmt(pulse.memberSlices.thisWeek)} this week`}
              />
              <MetricCard
                label="Active Missions" icon="truck-fast" iconColor="#60A5FA"
                value={String(pulse.missions.active)}
                sub={`${fmt(pulse.missions.totalDealValue)} at risk`}
              />
              <MetricCard
                label="Today GMV" icon="chart-line" iconColor="#34D399"
                value={fmt(pulse.revenue.todayGmv)}
                sub={`${fmt(pulse.revenue.platformProfit)} profit`}
              />
              <MetricCard
                label="Guardian Active" icon="shield-check" iconColor="#34D399"
                value={String(pulse.missions.guardianActive)}
                sub={`${pulse.missions.arrivingToday} arriving today`}
              />
            </View>

            {/* Kill-switch summary if flagged */}
            {unresolvedFlagged.length > 0 && (
              <TouchableOpacity style={styles.ksAlert} onPress={() => setActiveSection("killswitch")} activeOpacity={0.8}>
                <Ionicons name="warning" size={18} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ksAlertTitle}>{unresolvedFlagged.length} Transaction{unresolvedFlagged.length > 1 ? "s" : ""} Need Your Decision</Text>
                  <Text style={styles.ksAlertSub}>
                    {fmt(unresolvedFlagged.reduce((s, t) => s + t.amount, 0))} on hold · Highest risk: {Math.max(...unresolvedFlagged.map(t => t.riskScore))}/100
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(239,68,68,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── MISSIONS ──────────────────────────────────────────── */}
        {activeSection === "missions" && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>{missions.filter(m => m.status !== "delivered").length} active vehicles on the Mesh</Text>
            {missions.filter(m => m.status !== "delivered").map(m => <MissionCard key={m.id} m={m} />)}
          </View>
        )}

        {/* ── KILL-SWITCH ───────────────────────────────────────── */}
        {activeSection === "killswitch" && (
          <View style={{ gap: 12 }}>
            {unresolvedFlagged.length > 0 && (
              <View style={styles.ksHeader}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.ksHeaderText}>
                  {unresolvedFlagged.length} awaiting founder override · {fmt(unresolvedFlagged.reduce((s, t) => s + t.amount, 0))} on hold
                </Text>
              </View>
            )}
            {flagged.map(t => <KillSwitchCard key={t.id} txn={t} onAction={handleOverride} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, icon, iconColor, value, sub }: {
  label: string; icon: string; iconColor: string; value: string; sub: string;
}) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} style={{ marginBottom: 8 }} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07070b" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  headerSub: { color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 1 },
  alertPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EF4444", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  alertPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  tabRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 6,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 8, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" },
  tabText: { color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  tabBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  tabBadgeDanger: { backgroundColor: "#EF4444" },
  tabBadgeText: { color: "#fff", fontSize: 8, fontWeight: "900" },

  // Hero K-Factor card
  heroCard: {
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)", padding: 20,
  },
  heroLabel: { color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  heroRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 4 },
  heroValue: { fontSize: 48, fontWeight: "900", letterSpacing: -1 },
  heroBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  heroBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  heroSub: { color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 16 },
  heroStatRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12, gap: 0 },
  heroStat: { flex: 1 },
  heroStatLabel: { color: "rgba(255,255,255,0.2)", fontSize: 9, marginBottom: 2 },
  heroStatValue: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // 2-col metric grid
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: {
    flex: 1, minWidth: "45%",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)", padding: 14,
  },
  metricLabel: { color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 2 },
  metricSub: { color: "rgba(255,255,255,0.25)", fontSize: 9 },

  // Kill-switch alert strip
  ksAlert: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  ksAlertTitle: { color: "#EF4444", fontSize: 12, fontWeight: "700", marginBottom: 2 },
  ksAlertSub: { color: "rgba(255,255,255,0.3)", fontSize: 10 },
  ksHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  ksHeaderText: { color: "rgba(239,68,68,0.8)", fontSize: 11, fontWeight: "600", flex: 1 },

  // Mission card
  missionCard: {
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)", padding: 12,
  },
  missionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  missionIconWrap: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  guardianDot: {
    position: "absolute", bottom: -3, right: -3, width: 14, height: 14,
    borderRadius: 7, backgroundColor: "#34D399", borderWidth: 1.5, borderColor: "#07070b",
    alignItems: "center", justifyContent: "center",
  },
  missionVehicle: { color: "#fff", fontSize: 11, fontWeight: "600", marginBottom: 2 },
  missionCity: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginBottom: 4 },
  missionMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  missionStatus: { fontSize: 9, fontWeight: "800" },
  missionMetaDot: { color: "rgba(255,255,255,0.15)", fontSize: 9 },
  missionCarrier: { color: "rgba(255,255,255,0.25)", fontSize: 9 },
  dealValue: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "right" },
  pingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  pingDot: { width: 6, height: 6, borderRadius: 3 },
  pingText: { color: "rgba(255,255,255,0.2)", fontSize: 9 },

  // Kill-switch card
  killCard: {
    borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.02)", overflow: "hidden",
  },
  killCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  killIcon: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  txnId: { color: "#fff", fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"], marginBottom: 2 },
  txnAmount: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
  riskBarWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskBg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)" },
  riskFill: { height: "100%", borderRadius: 2 },
  riskScore: { fontSize: 10, fontWeight: "800", width: 24, textAlign: "right" },
  resolvedTag: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  killExpanded: {
    padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
  },
  killSectionLabel: {
    color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: "700",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 12,
  },
  killReasoning: {
    color: "rgba(255,255,255,0.45)", fontSize: 10, lineHeight: 16,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 10,
  },
  killTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  killTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  killTagText: { fontSize: 9, fontWeight: "700" },
  killTimestamp: { color: "rgba(255,255,255,0.2)", fontSize: 10, marginBottom: 12 },
  killButtons: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.08)",
  },
  rejectText: { color: "#EF4444", fontSize: 11, fontWeight: "800" },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)", backgroundColor: "rgba(52,211,153,0.08)",
  },
  approveText: { color: "#34D399", fontSize: 11, fontWeight: "800" },

  sectionLabel: { color: "rgba(255,255,255,0.25)", fontSize: 11, marginBottom: 4 },
});
