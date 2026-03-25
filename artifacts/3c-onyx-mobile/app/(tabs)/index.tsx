import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
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

/* ─── Types ──────────────────────────────────────────────────────────────── */

type AlertPriority = "critical" | "high" | "medium" | "low";
type AlertCategory = "insurance" | "service" | "market" | "savings" | "safety" | "finance";
type CardState = "idle" | "loading" | "handled" | "dismissed";

interface ProactiveAlert {
  id: string;
  priority: AlertPriority;
  category: AlertCategory;
  headline: string;
  detail: string;
  reasoning: string;
  saving: number;
  savingLabel: string;
  action: { label: string; type: "chat" | "route"; payload: string };
  createdAt: string;
  dismissed?: boolean;
}

interface SavingsData {
  totalIdentified: number;
  lifetimeSavings: number;
  weekSavings: number;
  alertsResolved: number;
  breakdown: { label: string; amount: number; date: string }[];
}

interface DigestHighlight {
  icon: string;
  label: string;
  value: string;
  impact: string;
}

interface WeeklyDigest {
  weekOf: string;
  headline: string;
  summary: string;
  highlights: DigestHighlight[];
  totalOpportunity: number;
  callToAction: string;
}

interface FeedMeta {
  totalAlerts: number;
  totalOpportunity: number;
  lifetimeSavings: number;
  weekSavings: number;
  alertsResolved: number;
}

interface FeedData {
  alerts: ProactiveAlert[];
  savings: SavingsData;
  digest: WeeklyDigest;
  meta: FeedMeta;
  ts: string;
}

/* ─── Color maps ─────────────────────────────────────────────────────────── */

const PRIORITY_COLOR: Record<AlertPriority, string> = {
  critical: "#EF4444",
  high:     COLORS.gold,
  medium:   "#3B82F6",
  low:      COLORS.emerald,
};

const CATEGORY_COLOR: Record<AlertCategory, string> = {
  insurance: "#8B5CF6",
  service:   "#F97316",
  market:    COLORS.gold,
  savings:   COLORS.emerald,
  safety:    "#10B981",
  finance:   "#3B82F6",
};

const CATEGORY_ICON: Record<AlertCategory, keyof typeof Feather.glyphMap> = {
  insurance: "shield",
  service:   "tool",
  market:    "trending-up",
  savings:   "dollar-sign",
  safety:    "check-circle",
  finance:   "percent",
};

/* ─── Pulse dot ───────────────────────────────────────────────────────────── */

function PulseDot({ color = COLORS.emerald }: { color?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity }} />;
}

/* ─── Theme toggle ────────────────────────────────────────────────────────── */

function ThemeToggle() {
  const { mode, isDark, setMode } = useTheme();
  const cycle = () => setMode(mode === "dark" ? "light" : mode === "light" ? "auto" : "dark");
  const icon: keyof typeof Feather.glyphMap = mode === "auto" ? "smartphone" : isDark ? "moon" : "sun";
  return (
    <Pressable onPress={cycle} style={styles.themeToggle}>
      <Feather name={icon} size={15} color={COLORS.gold} />
    </Pressable>
  );
}

/* ─── Animated savings counter ────────────────────────────────────────────── */

function SavingsCounter({ target }: { target: number }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    Animated.timing(anim, {
      toValue: target,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [target, anim]);

  return (
    <Text style={[styles.counterAmount, { color: theme.gold }]}>
      ${display.toLocaleString()}
    </Text>
  );
}

/* ─── Savings hero ────────────────────────────────────────────────────────── */

function SavingsHero({ meta, isLoading }: { meta: FeedMeta | null; isLoading: boolean }) {
  const { theme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmer.setValue(1);
    }
  }, [isLoading, shimmer]);

  const totalOpportunity = meta?.totalOpportunity ?? 0;
  const weekSavings      = meta?.weekSavings ?? 0;
  const alertsResolved   = meta?.alertsResolved ?? 0;
  const totalAlerts      = meta?.totalAlerts ?? 0;

  return (
    <View style={[styles.savingsHero, { backgroundColor: theme.card, borderColor: theme.goldBorder }]}>
      <View style={[styles.savingsHeroBg, { backgroundColor: theme.goldGlow }]} />

      <View style={styles.savingsTopRow}>
        <View style={[styles.savingsLiveBadge, { backgroundColor: `${COLORS.emerald}18`, borderColor: `${COLORS.emerald}30` }]}>
          <PulseDot />
          <Text style={[styles.savingsLiveText, { color: COLORS.emerald }]}>LIVE</Text>
        </View>
        <Text style={[styles.savingsLabel, { color: theme.textMuted }]}>3C IDENTIFIED</Text>
      </View>

      <SavingsCounter target={totalOpportunity} />
      <Text style={[styles.savingsSubLabel, { color: theme.gold }]}>IN TOTAL OPPORTUNITIES</Text>

      <View style={[styles.savingsDivider, { backgroundColor: theme.goldBorder }]} />

      <View style={styles.savingsStatsRow}>
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatValue, { color: COLORS.emerald }]}>
            ${weekSavings.toLocaleString()}
          </Text>
          <Text style={[styles.savingsStatLabel, { color: theme.textMuted }]}>this week</Text>
        </View>
        <View style={[styles.savingsStatDivider, { backgroundColor: theme.cardBorder }]} />
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatValue, { color: theme.gold }]}>{totalAlerts}</Text>
          <Text style={[styles.savingsStatLabel, { color: theme.textMuted }]}>insights ready</Text>
        </View>
        <View style={[styles.savingsStatDivider, { backgroundColor: theme.cardBorder }]} />
        <View style={styles.savingsStat}>
          <Text style={[styles.savingsStatValue, { color: "#3B82F6" }]}>{alertsResolved}</Text>
          <Text style={[styles.savingsStatLabel, { color: theme.textMuted }]}>actions done</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Weekly digest card ──────────────────────────────────────────────────── */

function WeeklyDigestCard({ digest }: { digest: WeeklyDigest }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.digestCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.digestStrip, { backgroundColor: "#8B5CF6" }]} />
      <View style={styles.digestContent}>
        <View style={styles.digestHeaderRow}>
          <View style={[styles.digestIconBox, { backgroundColor: "#8B5CF620" }]}>
            <Feather name="cpu" size={16} color="#8B5CF6" />
          </View>
          <View style={styles.digestHeaderText}>
            <Text style={[styles.digestBadge, { color: "#8B5CF6" }]}>WEEKLY DIGEST</Text>
            <Text style={[styles.digestHeadline, { color: theme.text }]}>{digest.headline}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.digestHighlights}>
            {digest.highlights.map((h, i) => (
              <View key={i} style={[styles.digestHighlightRow, { borderTopColor: theme.textFaint }]}>
                <Text style={[styles.digestHighlightLabel, { color: theme.textMuted }]}>{h.label}</Text>
                <Text style={[styles.digestHighlightImpact, { color: COLORS.emerald }]}>{h.impact}</Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={[styles.digestToggle, { borderColor: theme.cardBorder }]}
        >
          <Text style={[styles.digestToggleText, { color: theme.textSub }]}>
            {expanded ? "Show less" : `View ${digest.highlights.length} highlights`}
          </Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={12} color={theme.textSub} />
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Feed card ───────────────────────────────────────────────────────────── */

function FeedCard({
  alert,
  index,
  cardState,
  onHandle,
  onDismiss,
}: {
  alert: ProactiveAlert;
  index: number;
  cardState: CardState;
  onHandle: () => void;
  onDismiss: () => void;
}) {
  const { theme } = useTheme();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const scale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true }).start();

  if (cardState === "dismissed") return null;

  const priorityColor  = PRIORITY_COLOR[alert.priority];
  const categoryColor  = CATEGORY_COLOR[alert.category];
  const categoryIcon   = CATEGORY_ICON[alert.category];
  const isHandled      = cardState === "handled";
  const isLoading      = cardState === "loading";
  const hasSaving      = alert.saving > 0;

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale }] },
      ]}
    >
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[styles.feedCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={[styles.feedCardStrip, { backgroundColor: priorityColor }]} />

          <View style={styles.feedCardContent}>
            {/* Header row */}
            <View style={styles.feedCardHeader}>
              <View style={[styles.feedCategoryBadge, { backgroundColor: `${categoryColor}18`, borderColor: `${categoryColor}28` }]}>
                <Feather name={categoryIcon} size={10} color={categoryColor} />
                <Text style={[styles.feedCategoryText, { color: categoryColor }]}>
                  {alert.category.toUpperCase()}
                </Text>
              </View>

              {hasSaving && (
                <View style={[styles.feedSavingBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}28` }]}>
                  <Text style={[styles.feedSavingText, { color: COLORS.emerald }]}>
                    +${alert.saving.toLocaleString()}
                  </Text>
                </View>
              )}

              <Pressable onPress={onDismiss} style={styles.feedDismissBtn} hitSlop={8}>
                <Feather name="x" size={12} color={theme.textFaint} />
              </Pressable>
            </View>

            {/* Headline */}
            <Text style={[styles.feedHeadline, { color: theme.text }]} numberOfLines={2}>
              {alert.headline}
            </Text>

            {/* Saving label */}
            {hasSaving && (
              <Text style={[styles.feedSavingLabel, { color: theme.textMuted }]}>
                {alert.savingLabel}
              </Text>
            )}

            {/* Detail */}
            <Text style={[styles.feedDetail, { color: theme.textSub }]} numberOfLines={3}>
              {alert.detail}
            </Text>

            {/* CTA */}
            {isHandled ? (
              <View style={[styles.feedHandledRow, { backgroundColor: `${COLORS.emerald}12`, borderColor: `${COLORS.emerald}25` }]}>
                <Feather name="check-circle" size={14} color={COLORS.emerald} />
                <Text style={[styles.feedHandledText, { color: COLORS.emerald }]}>
                  ONYX AI is handling this
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={onHandle}
                style={[
                  styles.feedHandleBtn,
                  { backgroundColor: isLoading ? theme.goldGlow : theme.goldMuted, borderColor: theme.goldBorder },
                ]}
              >
                {isLoading ? (
                  <>
                    <Animated.View style={styles.feedBtnLoader}>
                      <PulseDot color={COLORS.gold} />
                    </Animated.View>
                    <Text style={[styles.feedHandleBtnText, { color: theme.gold }]}>
                      Sending to ONYX AI...
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={13} color={theme.gold} />
                    <Text style={[styles.feedHandleBtnText, { color: theme.gold }]}>
                      {alert.action.label}
                    </Text>
                    <Feather name="arrow-right" size={12} color={theme.gold} />
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ─── Quick action rail ───────────────────────────────────────────────────── */

type QuickItem = { icon: React.ReactNode; label: string; route: string; color: string };

function QuickRail({ actions }: { actions: QuickItem[] }) {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRailRow}
    >
      {actions.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => router.push(a.route as never)}
          style={[styles.quickRailItem, { backgroundColor: `${a.color}12`, borderColor: `${a.color}25` }]}
        >
          <View style={[styles.quickRailIcon, { backgroundColor: `${a.color}20` }]}>{a.icon}</View>
          <Text style={[styles.quickRailLabel, { color: theme.textSub }]}>{a.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/* ─── Section header ──────────────────────────────────────────────────────── */

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: theme.cardBorder }]} />
      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text style={[styles.sectionAction, { color: theme.gold }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ─── Main HomeScreen ─────────────────────────────────────────────────────── */

export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const isWeb    = Platform.OS === "web";
  const topPad   = isWeb ? 67 : insets.top;
  const botPad   = isWeb ? 34 : insets.bottom;
  const { t }    = useTranslation();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const h = new Date().getHours();
  const greeting = h < 12 ? t("greeting.morning") : h < 17 ? t("greeting.afternoon") : t("greeting.evening");

  // ── Feed data (alerts + savings + digest in one call) ──────────────────
  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ["intelligence-feed"],
    queryFn:  () => apiFetch<FeedData>("/intelligence/feed"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Notifications (for bell badge) ────────────────────────────────────
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn:  () => apiFetch<{ unreadCount: number }>("/notifications"),
    staleTime: 30_000,
  });

  const unreadCount = notifications?.unreadCount ?? 0;
  const alerts      = feedData?.alerts ?? [];
  const meta        = feedData?.meta ?? null;
  const digest      = feedData?.digest ?? null;

  // ── Card states ────────────────────────────────────────────────────────
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const setCardState = useCallback((id: string, state: CardState) => {
    setCardStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  // ── Dismiss mutation ───────────────────────────────────────────────────
  const dismissMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/intelligence/dismiss-public/${alertId}`, { method: "POST" }),
    onSuccess: (_data, alertId) => {
      setCardState(alertId, "dismissed");
      queryClient.invalidateQueries({ queryKey: ["intelligence-feed"] });
    },
  });

  // ── Handle one-tap action ──────────────────────────────────────────────
  const handleAction = useCallback((alert: ProactiveAlert) => {
    setCardState(alert.id, "loading");

    setTimeout(() => {
      setCardState(alert.id, "handled");

      if (alert.action.type === "route") {
        router.push(alert.action.payload as never);
      }
    }, 1200);
  }, [setCardState]);

  // ── Quick access rail items ────────────────────────────────────────────
  const quickItems: QuickItem[] = [
    { icon: <MaterialCommunityIcons name="car-multiple" size={18} color={COLORS.gold}    />, label: "Market",    route: "/(tabs)/marketplace",  color: COLORS.gold    },
    { icon: <MaterialCommunityIcons name="garage-open"  size={18} color={COLORS.emerald} />, label: "Garage",    route: "/(tabs)/garage",       color: COLORS.emerald },
    { icon: <Feather name="shield"     size={16} color={COLORS.gold}    />,                 label: "Vault",     route: "/documents",           color: COLORS.gold    },
    { icon: <Feather name="users"      size={16} color="#3B9EFF"        />,                 label: "Invite",    route: "/invite",              color: "#3B9EFF"      },
    { icon: <Feather name="globe"      size={16} color={COLORS.emerald} />,                 label: "Ecosystem", route: "/ecosystem",           color: COLORS.emerald },
    { icon: <Feather name="bell"       size={16} color={COLORS.amber}   />,                 label: "Alerts",    route: "/(tabs)/notifications",color: COLORS.amber   },
  ];

  const visibleAlerts = alerts.filter((a) => cardStates[a.id] !== "dismissed");

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── Branded header ──────────────────────────────────────────────── */}
      <View style={[styles.headerBar, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoMark, { borderColor: theme.goldBorder, backgroundColor: theme.goldGlow }]}>
            <Text style={[styles.logoGlyph, { color: theme.gold }]}>◆</Text>
          </View>
          <View>
            <Text style={[styles.brandWordmark, { color: theme.text }]}>3C ONYX</Text>
            <Text style={[styles.brandTagline, { color: theme.gold }]}>POWERED BY CUXTOMCANDYCLUB LLC</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.securityBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}22` }]}>
            <PulseDot />
            <Text style={[styles.securityText, { color: COLORS.emerald }]}>{t("home.piiMasked")}</Text>
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
        contentContainerStyle={{ paddingBottom: botPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting strip ──────────────────────────────────────────── */}
        <View style={styles.greetingStrip}>
          <Text style={[styles.greetingText, { color: theme.gold }]}>
            {greeting} — {t("home.heroGreeting")}
          </Text>
          <View style={[styles.greetingDot, { backgroundColor: theme.goldBorder }]} />
          <Text style={[styles.greetingDate, { color: theme.textFaint }]}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </Text>
        </View>

        {/* ── Savings hero ────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <SavingsHero meta={meta} isLoading={feedLoading} />
        </View>

        {/* ── Quick access rail ────────────────────────────────────────── */}
        <SectionHeader title={t("home.quickAccess")} />
        <QuickRail actions={quickItems} />

        {/* ── Intelligence feed ────────────────────────────────────────── */}
        <SectionHeader
          title="INTELLIGENCE FEED"
          action={visibleAlerts.length > 0 ? `${visibleAlerts.length} insights` : undefined}
        />

        {feedLoading && (
          <View style={[styles.feedLoading, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <PulseDot color={COLORS.gold} />
            <Text style={[styles.feedLoadingText, { color: theme.textMuted }]}>
              ONYX scanning for opportunities...
            </Text>
          </View>
        )}

        {!feedLoading && visibleAlerts.length === 0 && (
          <View style={[styles.feedEmpty, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Feather name="check-circle" size={24} color={COLORS.emerald} />
            <Text style={[styles.feedEmptyTitle, { color: theme.text }]}>All clear</Text>
            <Text style={[styles.feedEmptyText,  { color: theme.textMuted }]}>
              No open opportunities right now. ONYX is monitoring.
            </Text>
          </View>
        )}

        {visibleAlerts.map((alert, i) => (
          <View key={alert.id} style={styles.feedCardWrap}>
            <FeedCard
              alert={alert}
              index={i}
              cardState={cardStates[alert.id] ?? "idle"}
              onHandle={() => handleAction(alert)}
              onDismiss={() => dismissMutation.mutate(alert.id)}
            />
          </View>
        ))}

        {/* ── Weekly digest ────────────────────────────────────────────── */}
        {digest && (
          <>
            <SectionHeader title="THIS WEEK" />
            <View style={styles.digestWrap}>
              <WeeklyDigestCard digest={digest} />
            </View>
          </>
        )}

        {/* ── Ecosystem rail ──────────────────────────────────────────── */}
        <SectionHeader
          title="ECOSYSTEM"
          action="All →"
          onAction={() => router.push("/ecosystem" as never)}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ecoRow}
        >
          {[
            { label: "Roadside",  sub: "HONK Network",   route: "/roadside",  icon: <Feather name="alert-triangle" size={20} color="#EF4444" />, bg: "#EF444412", border: "#EF444428", badge: "24/7",         bColor: "#EF4444" },
            { label: "Rentals",   sub: "CarCrawler",     route: "/rentals",   icon: <Feather name="key"            size={20} color={COLORS.gold} />, bg: `${COLORS.gold}0E`, border: `${COLORS.gold}28`, badge: "30+ Partners", bColor: COLORS.gold },
            { label: "Find Auto", sub: "Google Maps",    route: "/nearby",    icon: <Feather name="map-pin"        size={20} color="#3B82F6" />, bg: "#3B82F612", border: "#3B82F628", badge: "Any Business", bColor: "#3B82F6" },
            { label: "Ecosystem", sub: "All Services",   route: "/ecosystem", icon: <Feather name="globe"          size={20} color={COLORS.emerald} />, bg: `${COLORS.emerald}0E`, border: `${COLORS.emerald}28`, badge: "Explore All", bColor: COLORS.emerald },
          ].map((e) => (
            <Pressable
              key={e.label}
              onPress={() => router.push(e.route as never)}
              style={[styles.ecoCard, { backgroundColor: e.bg, borderColor: e.border }]}
            >
              <View style={[styles.ecoIconWrap, { backgroundColor: `${e.bColor}20` }]}>{e.icon}</View>
              <Text style={[styles.ecoLabel, { color: theme.text }]}>{e.label}</Text>
              <Text style={[styles.ecoSub, { color: theme.textMuted }]}>{e.sub}</Text>
              <View style={[styles.ecoBadge, { backgroundColor: `${e.bColor}15`, borderColor: `${e.bColor}30` }]}>
                <Text style={[styles.ecoBadgeText, { color: e.bColor }]}>{e.badge}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Platform status ──────────────────────────────────────────── */}
        <SectionHeader title={t("home.platformStatus")} />
        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {[
            { label: t("home.status.mcpServer"),     status: t("home.status.online"),   color: COLORS.emerald },
            { label: t("home.status.stripeConnect"), status: t("home.status.live"),     color: COLORS.emerald },
            { label: t("home.status.blockchainOta"), status: t("home.status.stamping"), color: "#A78BFA" },
            { label: t("home.status.piiProtection"), status: t("home.status.active"),   color: COLORS.gold },
            { label: "Intelligence Engine",          status: "LIVE",                    color: COLORS.emerald },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[styles.statusRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.textFaint }]}
            >
              <Text style={[styles.statusLabel, { color: theme.textSub }]}>{item.label}</Text>
              <View style={styles.statusRight}>
                <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                <Text style={[styles.statusValue, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textFaint }]}>
            3C ONYX · CUXTOMCANDYCLUB LLC · AES-256 · INTELLIGENCE ENGINE ACTIVE
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { flex: 1 },

  // Header
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  logoGlyph: { fontSize: 14 },
  brandWordmark: { fontSize: 13, fontWeight: "900", letterSpacing: 3 },
  brandTagline:  { fontSize: 7, fontWeight: "700", letterSpacing: 1.5, marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  securityBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  securityText:  { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  themeToggle:   { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(201,162,39,0.10)", borderWidth: 1, borderColor: "rgba(201,162,39,0.20)", alignItems: "center", justifyContent: "center" },
  bellBtn:       { position: "relative", width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badge:         { position: "absolute", top: -2, right: -2, backgroundColor: COLORS.gold, borderRadius: 8, minWidth: 15, height: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 2 },
  badgeText:     { fontSize: 8, fontWeight: "800", color: "#000" },

  // Greeting
  greetingStrip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greetingText:  { fontSize: 9, fontWeight: "700", letterSpacing: 2 },
  greetingDot:   { width: 3, height: 3, borderRadius: 2 },
  greetingDate:  { fontSize: 9, fontWeight: "500", letterSpacing: 0.5 },

  // Savings hero
  heroWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  savingsHero: { borderWidth: 1, borderRadius: 22, padding: 20, overflow: "hidden", position: "relative" },
  savingsHeroBg: { position: "absolute", top: 0, right: 0, width: "60%", height: "100%", borderRadius: 22, opacity: 0.35 },
  savingsTopRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  savingsLiveBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  savingsLiveText:  { fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  savingsLabel:     { fontSize: 9, fontWeight: "700", letterSpacing: 2 },
  counterAmount:    { fontSize: 52, fontWeight: "900", letterSpacing: -2, lineHeight: 56 },
  savingsSubLabel:  { fontSize: 9, fontWeight: "700", letterSpacing: 2.5, marginTop: 2, marginBottom: 16 },
  savingsDivider:   { height: 1, marginBottom: 14 },
  savingsStatsRow:  { flexDirection: "row", alignItems: "center" },
  savingsStat:      { flex: 1, alignItems: "center" },
  savingsStatDivider: { width: 1, height: 32 },
  savingsStatValue:   { fontSize: 20, fontWeight: "800" },
  savingsStatLabel:   { fontSize: 9, fontWeight: "500", letterSpacing: 0.5, marginTop: 2 },

  // Section header
  sectionHeader: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle:  { fontSize: 9, fontWeight: "800", letterSpacing: 2.5 },
  sectionLine:   { flex: 1, height: 1 },
  sectionAction: { fontSize: 10, fontWeight: "700" },

  // Quick rail
  quickRailRow:  { paddingLeft: 16, paddingRight: 8, gap: 8 },
  quickRailItem: { alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  quickRailIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickRailLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  // Feed
  feedCardWrap: { paddingHorizontal: 16, marginBottom: 10 },
  feedCard:     { borderWidth: 1, borderRadius: 18, flexDirection: "row", overflow: "hidden" },
  feedCardStrip: { width: 4 },
  feedCardContent: { flex: 1, padding: 14, gap: 8 },
  feedCardHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  feedCategoryBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  feedCategoryText:  { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  feedSavingBadge:   { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  feedSavingText:    { fontSize: 9, fontWeight: "800" },
  feedDismissBtn:    { marginLeft: "auto" as never, padding: 4 },
  feedHeadline:      { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  feedSavingLabel:   { fontSize: 9, fontWeight: "500", letterSpacing: 0.3 },
  feedDetail:        { fontSize: 12, fontWeight: "400", lineHeight: 17 },
  feedHandleBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 2 },
  feedHandleBtnText: { fontSize: 12, fontWeight: "700" },
  feedBtnLoader:     { marginRight: 4 },
  feedHandledRow:    { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 2 },
  feedHandledText:   { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  feedLoading:       { marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  feedLoadingText:   { fontSize: 12, fontWeight: "500" },
  feedEmpty:         { marginHorizontal: 16, alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 18, paddingVertical: 28, paddingHorizontal: 20 },
  feedEmptyTitle:    { fontSize: 15, fontWeight: "700" },
  feedEmptyText:     { fontSize: 12, fontWeight: "400", textAlign: "center", lineHeight: 18 },

  // Weekly digest
  digestWrap: { paddingHorizontal: 16, marginBottom: 4 },
  digestCard: { borderWidth: 1, borderRadius: 18, flexDirection: "row", overflow: "hidden" },
  digestStrip: { width: 4 },
  digestContent: { flex: 1, padding: 14, gap: 10 },
  digestHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  digestIconBox:   { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  digestHeaderText: { flex: 1, gap: 3 },
  digestBadge:     { fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  digestHeadline:  { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  digestHighlights: { gap: 0 },
  digestHighlightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1 },
  digestHighlightLabel: { fontSize: 11, fontWeight: "500" },
  digestHighlightImpact: { fontSize: 11, fontWeight: "700" },
  digestToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 8 },
  digestToggleText: { fontSize: 11, fontWeight: "600" },

  // Ecosystem
  ecoRow:     { paddingLeft: 16, paddingRight: 8, gap: 10, paddingBottom: 4 },
  ecoCard:    { borderWidth: 1, borderRadius: 18, padding: 14, width: 128, alignItems: "flex-start", gap: 4 },
  ecoIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  ecoLabel:   { fontSize: 13, fontWeight: "700" },
  ecoSub:     { fontSize: 10, fontWeight: "500" },
  ecoBadge:   { marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  ecoBadgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },

  // Status
  statusCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, overflow: "hidden", marginBottom: 8 },
  statusRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  statusLabel: { fontSize: 13, fontWeight: "500" },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot:   { width: 5, height: 5, borderRadius: 3 },
  statusValue: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // Footer
  footer:     { alignItems: "center", paddingVertical: 20 },
  footerText: { fontSize: 9, fontWeight: "600", letterSpacing: 1.5 },
});
