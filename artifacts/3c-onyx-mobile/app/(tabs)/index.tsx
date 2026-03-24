import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";

type WatchlistItem = { id: number };
type GigTask = { id: number; status: string };

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.emerald, opacity }}
    />
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  sub: string;
  route: string;
  accent: string;
};

function QuickActionCard({ action }: { action: QuickAction }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => router.push(action.route as never)}
    >
      <Animated.View style={[styles.quickCard, { transform: [{ scale }] }]}>
        <View style={[styles.quickIconBox, { backgroundColor: `${action.accent}18`, borderColor: `${action.accent}25` }]}>
          {action.icon}
        </View>
        <Text style={styles.quickLabel}>{action.label}</Text>
        <Text style={styles.quickSub}>{action.sub}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<{ unreadCount: number; notifications: unknown[] }>("/notifications"),
  });

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => apiFetch<{ watchlist: WatchlistItem[] }>("/watchlist"),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiFetch<{ tasks: GigTask[] }>("/delivery/tasks"),
  });

  const tasks = tasksData?.tasks ?? [];
  const watchlist = watchlistData?.watchlist ?? [];
  const activeDeliveries = tasks.filter((t) => t.status === "In Progress" || t.status === "Claimed").length;
  const watchlistCount = watchlist.length;
  const unreadCount = notifications?.unreadCount ?? 0;
  const walletTotal = 21200;

  const quickActions: QuickAction[] = [
    {
      icon: <MaterialCommunityIcons name="car-multiple" size={22} color={COLORS.gold} />,
      label: "Marketplace",
      sub: "Shop certified vehicles",
      route: "/(tabs)/marketplace",
      accent: COLORS.gold,
    },
    {
      icon: <MaterialCommunityIcons name="garage-open" size={22} color={COLORS.emerald} />,
      label: "My Garage",
      sub: "Live telematics",
      route: "/(tabs)/garage",
      accent: COLORS.emerald,
    },
    {
      icon: <Feather name="shield" size={20} color={COLORS.gold} />,
      label: "Document Vault",
      sub: "Scan ID & insurance",
      route: "/documents",
      accent: COLORS.gold,
    },
    {
      icon: <Feather name="users" size={20} color="#3B9EFF" />,
      label: "Invite Friends",
      sub: "Earn rewards",
      route: "/invite",
      accent: "#3B9EFF",
    },
    {
      icon: <Feather name="bell" size={20} color={COLORS.amber} />,
      label: "Notifications",
      sub: `${unreadCount} unread alerts`,
      route: "/(tabs)/notifications",
      accent: COLORS.amber,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>3C ONYX</Text>
            </View>
            <Text style={styles.brandSub}>SECURE PLATFORM</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.securityBadge}>
              <PulseDot />
              <Text style={styles.securityText}>PII MASKED</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/notifications" as never)} style={styles.bellBtn}>
              <Ionicons name="notifications" size={20} color={COLORS.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>GOOD MORNING, MEMBER</Text>
          <Text style={styles.heroLine1}>YOUR FLEET,</Text>
          <Text style={styles.heroLine2}>YOUR RULES.</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroSub}>
            White-glove automotive services, certified luxury vehicles, and real-time delivery.
          </Text>
        </View>

        {/* Stat Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            label="WALLET BALANCE"
            value={`$${Math.round(walletTotal).toLocaleString()}`}
            sub="After 5% Member Slice"
            color={COLORS.emerald}
          />
          <StatCard
            label="ACTIVE DELIVERIES"
            value={String(activeDeliveries)}
            sub="In transit now"
            color={COLORS.gold}
          />
          <StatCard
            label="WATCHLIST"
            value={String(watchlistCount)}
            sub="Vehicles tracked"
            color="#3B9EFF"
          />
          <StatCard
            label="NOTIFICATIONS"
            value={String(unreadCount)}
            sub="Unread alerts"
            color={COLORS.amber}
          />
        </ScrollView>

        {/* Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <QuickActionCard key={action.label} action={action} />
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PLATFORM STATUS</Text>
        </View>

        <View style={styles.statusCard}>
          {[
            { label: "MCP Server", status: "ONLINE", color: COLORS.emerald },
            { label: "Stripe Connect", status: "LIVE", color: COLORS.emerald },
            { label: "PII Protection", status: "ACTIVE", color: COLORS.gold },
            { label: "SOC2 Audit Vault", status: "LOGGING", color: "#3B9EFF" },
          ].map((item, i) => (
            <View key={item.label} style={[styles.statusRow, i < 3 && styles.statusBorder]}>
              <Text style={styles.statusLabel}>{item.label}</Text>
              <View style={styles.statusRight}>
                <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                <Text style={[styles.statusValue, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  brandName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: COLORS.white,
    letterSpacing: 2,
  },
  brandSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: COLORS.whiteDim,
    letterSpacing: 2,
    marginTop: 1,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${COLORS.emerald}15`,
    borderWidth: 1,
    borderColor: `${COLORS.emerald}20`,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  securityText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: COLORS.emerald,
    letterSpacing: 1,
  },
  bellBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: COLORS.black },
  hero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  greeting: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  heroLine1: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: COLORS.white,
    letterSpacing: -1,
    lineHeight: 50,
  },
  heroLine2: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: COLORS.gold,
    letterSpacing: -1,
    lineHeight: 52,
  },
  heroDivider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
    marginTop: 12,
    marginBottom: 12,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.whiteDim,
    lineHeight: 20,
    maxWidth: 300,
  },
  statsRow: { paddingLeft: 20, paddingRight: 8, gap: 10, paddingBottom: 8 },
  statCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    minWidth: 140,
  },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: COLORS.whiteDim,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 30,
  },
  statSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: COLORS.whiteDim,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: COLORS.whiteDim,
    letterSpacing: 2,
  },
  quickGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 16,
    width: "47%",
    minWidth: 155,
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 2,
  },
  quickSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: COLORS.whiteDim,
  },
  statusCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  statusBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: COLORS.whiteDim,
  },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
});
