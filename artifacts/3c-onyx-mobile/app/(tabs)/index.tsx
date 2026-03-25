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
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/theme";

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

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Text style={[styles.statLabel, { color: theme.textSub }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statSub, { color: theme.textSub }]}>{sub}</Text>
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
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => router.push(action.route as never)}
      style={{ width: "48%" }}
    >
      <Animated.View
        style={[
          styles.quickCard,
          {
            transform: [{ scale }],
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.quickIconBox,
            {
              backgroundColor: `${action.accent}18`,
              borderColor: `${action.accent}25`,
            },
          ]}
        >
          {action.icon}
        </View>
        <Text style={[styles.quickLabel, { color: theme.text }]}>{action.label}</Text>
        <Text style={[styles.quickSub, { color: theme.textSub }]}>{action.sub}</Text>
        <View style={[styles.quickChevron, { borderColor: `${action.accent}30` }]}>
          <Feather name="chevron-right" size={10} color={action.accent} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function ThemeToggle() {
  const { mode, isDark, setMode } = useTheme();
  const cycle = () => {
    const next = mode === "dark" ? "light" : mode === "light" ? "auto" : "dark";
    setMode(next);
  };
  const icon: keyof typeof Feather.glyphMap = mode === "auto" ? "smartphone" : isDark ? "moon" : "sun";
  return (
    <Pressable onPress={cycle} style={styles.themeToggle}>
      <Feather name={icon} size={15} color={COLORS.gold} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const h = new Date().getHours();
  const greeting =
    h < 12 ? t("greeting.morning") : h < 17 ? t("greeting.afternoon") : t("greeting.evening");

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
  const activeDeliveries = tasks.filter(
    (t) => t.status === "In Progress" || t.status === "Claimed"
  ).length;
  const watchlistCount = watchlist.length;
  const unreadCount = notifications?.unreadCount ?? 0;
  const walletTotal = 21200;

  const quickActions: QuickAction[] = [
    {
      icon: <MaterialCommunityIcons name="car-multiple" size={22} color={COLORS.gold} />,
      label: t("nav.marketplace"),
      sub: t("home.actions.marketplaceSub"),
      route: "/(tabs)/marketplace",
      accent: COLORS.gold,
    },
    {
      icon: <MaterialCommunityIcons name="garage-open" size={22} color={COLORS.emerald} />,
      label: t("nav.garage"),
      sub: t("home.actions.garageSub"),
      route: "/(tabs)/garage",
      accent: COLORS.emerald,
    },
    {
      icon: <Feather name="shield" size={20} color={COLORS.gold} />,
      label: t("home.actions.documentVault"),
      sub: t("home.actions.documentVaultSub"),
      route: "/documents",
      accent: COLORS.gold,
    },
    {
      icon: <Feather name="users" size={20} color="#3B9EFF" />,
      label: t("home.actions.inviteFriends"),
      sub: t("home.actions.inviteFriendsSub"),
      route: "/invite",
      accent: "#3B9EFF",
    },
    {
      icon: <Feather name="bell" size={20} color={COLORS.amber} />,
      label: t("home.actions.notificationsLabel"),
      sub: t("home.actions.unreadAlerts", { count: unreadCount }),
      route: "/(tabs)/notifications",
      accent: COLORS.amber,
    },
    {
      icon: <Feather name="cpu" size={20} color="#A78BFA" />,
      label: t("home.actions.inVehicle"),
      sub: t("home.actions.inVehicleSub"),
      route: "/(tabs)/carplay",
      accent: "#A78BFA",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Branded Header ─────────────────────────────────────────── */}
      <View style={[styles.headerBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          {/* Logo diamond */}
          <View style={[styles.logoMark, { borderColor: theme.goldBorder, backgroundColor: theme.goldGlow }]}>
            <Text style={[styles.logoGlyph, { color: theme.gold }]}>◆</Text>
          </View>
          <View>
            <Text style={[styles.brandWordmark, { color: theme.text }]}>3C ONYX</Text>
            <Text style={[styles.brandTagline, { color: theme.gold }]}>
              POWERED BY CUXTOMCANDYCLUB LLC
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={[styles.securityBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}22` }]}>
            <PulseDot />
            <Text style={[styles.securityText, { color: COLORS.emerald }]}>
              {t("home.piiMasked")}
            </Text>
          </View>
          <ThemeToggle />
          <Pressable
            onPress={() => router.push("/(tabs)/notifications" as never)}
            style={[styles.bellBtn, { backgroundColor: theme.goldMuted }]}
          >
            <Ionicons name="notifications" size={18} color={theme.gold} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: theme.gold }]}>
            {greeting} — {t("home.heroGreeting")}
          </Text>
          <Text style={[styles.heroLine1, { color: theme.text }]}>{t("home.heroLine1")}</Text>
          <Text style={[styles.heroLine2, { color: theme.gold }]}>{t("home.heroLine2")}</Text>
          <View style={[styles.heroDivider, { backgroundColor: theme.gold }]} />
          <Text style={[styles.heroSub, { color: theme.textSub }]}>{t("home.heroSub")}</Text>
        </View>

        {/* ── Stat Cards ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard
            label={t("home.walletBalance")}
            value={`$${Math.round(walletTotal).toLocaleString()}`}
            sub={t("home.walletSub")}
            color={COLORS.emerald}
          />
          <StatCard
            label={t("home.activeDeliveries")}
            value={String(activeDeliveries)}
            sub={t("home.inTransit")}
            color={COLORS.gold}
          />
          <StatCard
            label={t("home.watchlistLabel")}
            value={String(watchlistCount)}
            sub={t("home.vehiclesTracked")}
            color="#3B9EFF"
          />
          <StatCard
            label={t("home.notificationsLabel")}
            value={String(unreadCount)}
            sub={t("home.unreadAlerts")}
            color={COLORS.amber}
          />
        </ScrollView>

        {/* ── Quick Access ───────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            {t("home.quickAccess")}
          </Text>
          <View style={[styles.sectionLine, { backgroundColor: theme.cardBorder }]} />
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <QuickActionCard key={action.label} action={action} />
          ))}
        </View>

        {/* ── Ecosystem ──────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ECOSYSTEM</Text>
          <View style={[styles.sectionLine, { backgroundColor: theme.cardBorder }]} />
          <Pressable onPress={() => router.push("/ecosystem" as never)}>
            <Text style={[styles.sectionSeeAll, { color: theme.gold }]}>All →</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ecoRow}
        >
          {/* Roadside */}
          <Pressable
            onPress={() => router.push("/roadside" as never)}
            style={[styles.ecoCard, { backgroundColor: "#EF444412", borderColor: "#EF444428" }]}
          >
            <View style={[styles.ecoIconWrap, { backgroundColor: "#EF444420" }]}>
              <Feather name="alert-triangle" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.ecoLabel, { color: theme.text }]}>Roadside</Text>
            <Text style={[styles.ecoSub, { color: theme.textMuted }]}>HONK Network</Text>
            <View style={[styles.ecoBadge, { backgroundColor: "#EF444418", borderColor: "#EF444430" }]}>
              <Text style={[styles.ecoBadgeText, { color: "#EF4444" }]}>24/7</Text>
            </View>
          </Pressable>

          {/* Rentals */}
          <Pressable
            onPress={() => router.push("/rentals" as never)}
            style={[styles.ecoCard, { backgroundColor: `${COLORS.gold}0E`, borderColor: `${COLORS.gold}28` }]}
          >
            <View style={[styles.ecoIconWrap, { backgroundColor: `${COLORS.gold}18` }]}>
              <Feather name="key" size={22} color={COLORS.gold} />
            </View>
            <Text style={[styles.ecoLabel, { color: theme.text }]}>Rentals</Text>
            <Text style={[styles.ecoSub, { color: theme.textMuted }]}>CarCrawler</Text>
            <View style={[styles.ecoBadge, { backgroundColor: `${COLORS.gold}15`, borderColor: `${COLORS.gold}30` }]}>
              <Text style={[styles.ecoBadgeText, { color: COLORS.gold }]}>30+ Partners</Text>
            </View>
          </Pressable>

          {/* Nearby */}
          <Pressable
            onPress={() => router.push("/nearby" as never)}
            style={[styles.ecoCard, { backgroundColor: "#3B82F612", borderColor: "#3B82F628" }]}
          >
            <View style={[styles.ecoIconWrap, { backgroundColor: "#3B82F620" }]}>
              <Feather name="map-pin" size={22} color="#3B82F6" />
            </View>
            <Text style={[styles.ecoLabel, { color: theme.text }]}>Find Auto</Text>
            <Text style={[styles.ecoSub, { color: theme.textMuted }]}>Google Maps</Text>
            <View style={[styles.ecoBadge, { backgroundColor: "#3B82F615", borderColor: "#3B82F630" }]}>
              <Text style={[styles.ecoBadgeText, { color: "#3B82F6" }]}>Any Business</Text>
            </View>
          </Pressable>

          {/* Ecosystem Hub */}
          <Pressable
            onPress={() => router.push("/ecosystem" as never)}
            style={[styles.ecoCard, { backgroundColor: `${COLORS.emerald}0E`, borderColor: `${COLORS.emerald}28` }]}
          >
            <View style={[styles.ecoIconWrap, { backgroundColor: `${COLORS.emerald}18` }]}>
              <Feather name="globe" size={22} color={COLORS.emerald} />
            </View>
            <Text style={[styles.ecoLabel, { color: theme.text }]}>Ecosystem</Text>
            <Text style={[styles.ecoSub, { color: theme.textMuted }]}>All Services</Text>
            <View style={[styles.ecoBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}30` }]}>
              <Text style={[styles.ecoBadgeText, { color: COLORS.emerald }]}>Explore All</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* ── Platform Status ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            {t("home.platformStatus")}
          </Text>
          <View style={[styles.sectionLine, { backgroundColor: theme.cardBorder }]} />
        </View>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
          ]}
        >
          {[
            { label: t("home.status.mcpServer"),    status: t("home.status.online"),   color: COLORS.emerald },
            { label: t("home.status.stripeConnect"), status: t("home.status.live"),     color: COLORS.emerald },
            { label: t("home.status.blockchainOta"), status: t("home.status.stamping"), color: "#A78BFA" },
            { label: t("home.status.piiProtection"), status: t("home.status.active"),   color: COLORS.gold },
            { label: t("home.status.soc2AuditVault"),status: t("home.status.logging"),  color: "#3B9EFF" },
          ].map((item, i) => (
            <View
              key={item.label}
              style={[
                styles.statusRow,
                i < 4 && { borderBottomWidth: 1, borderBottomColor: theme.textFaint },
              ]}
            >
              <Text style={[styles.statusLabel, { color: theme.textSub }]}>{item.label}</Text>
              <View style={styles.statusRight}>
                <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                <Text style={[styles.statusValue, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Footer ────────────────────────────────────────────── */}
        <View style={styles.footerBranding}>
          <Text style={[styles.footerText, { color: theme.textFaint }]}>
            3C ONYX · CUXTOMCANDYCLUB LLC · AES-256
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlyph: { fontSize: 14 },
  brandWordmark: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
  },
  brandTagline: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  securityText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(201,162,39,0.10)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtn: {
    position: "relative",
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 8, fontWeight: "800", color: "#000" },

  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16 },
  greeting: { fontSize: 9, fontWeight: "700", letterSpacing: 2.5, marginBottom: 8 },
  heroLine1: { fontSize: 44, fontWeight: "900", letterSpacing: -1, lineHeight: 46 },
  heroLine2: { fontSize: 44, fontWeight: "900", letterSpacing: -1, lineHeight: 48 },
  heroDivider: { width: 36, height: 2, borderRadius: 1, marginTop: 14, marginBottom: 12 },
  heroSub: { fontSize: 13, fontWeight: "400", lineHeight: 20, maxWidth: 300 },

  // Stats
  statsRow: { paddingLeft: 16, paddingRight: 8, gap: 10, paddingBottom: 4, paddingTop: 4 },
  statCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minWidth: 138,
  },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: "800", lineHeight: 28 },
  statSub: { fontSize: 10, fontWeight: "400", marginTop: 4 },

  // Section headers
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: { fontSize: 9, fontWeight: "800", letterSpacing: 2.5 },
  sectionLine: { flex: 1, height: 1 },

  // Quick actions grid
  quickGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    position: "relative",
  },
  quickIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickLabel: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  quickSub: { fontSize: 10, fontWeight: "400" },
  quickChevron: {
    position: "absolute",
    top: 14,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Status card
  statusCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 18,
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
  statusLabel: { fontSize: 13, fontWeight: "500" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // Ecosystem section
  sectionSeeAll: { fontSize: 10, fontWeight: "700" },
  ecoRow: { paddingLeft: 16, paddingRight: 8, gap: 10, paddingBottom: 4 },
  ecoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    width: 128,
    alignItems: "flex-start",
    gap: 4,
  },
  ecoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  ecoLabel: { fontSize: 13, fontWeight: "700" },
  ecoSub:   { fontSize: 10, fontWeight: "500" },
  ecoBadge: { marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  ecoBadgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },

  // Footer
  footerBranding: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: { fontSize: 9, fontWeight: "600", letterSpacing: 1.5 },
});
