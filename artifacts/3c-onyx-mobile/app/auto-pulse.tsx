import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";
import { COLORS } from "@/constants/colors";

interface PulseItem {
  id: string;
  title: string;
  summary?: string;
  source: string;
  sourceType: "news" | "reddit" | "nhtsa" | "rss" | "youtube";
  url: string;
  publishedAt: string;
  category?: string;
}

interface PulseData {
  items: PulseItem[];
  trending: string[];
  total: number;
}

const TABS = [
  { key: "all",     label: "For You",  icon: "zap"         as const },
  { key: "news",    label: "News",     icon: "globe"       as const },
  { key: "rss",     label: "Reviews",  icon: "book-open"   as const },
  { key: "nhtsa",   label: "Recalls",  icon: "alert-circle" as const },
  { key: "youtube", label: "Video",    icon: "play-circle" as const },
];

function sourceIcon(type: string) {
  switch (type) {
    case "news":    return <Feather name="globe" size={10} color="#60A5FA" />;
    case "nhtsa":   return <Feather name="alert-triangle" size={10} color="#EF4444" />;
    case "rss":     return <Feather name="book-open" size={10} color="#A78BFA" />;
    case "youtube": return <Feather name="play-circle" size={10} color="#EF4444" />;
    case "reddit":  return <Feather name="message-circle" size={10} color="#F97316" />;
    default:        return <Feather name="file-text" size={10} color={COLORS.whiteDim} />;
  }
}

function sourceColor(type: string) {
  switch (type) {
    case "news":    return "#60A5FA";
    case "nhtsa":   return "#EF4444";
    case "rss":     return "#A78BFA";
    case "youtube": return "#EF4444";
    case "reddit":  return "#F97316";
    default:        return COLORS.whiteDim;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AutoPulseScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["auto-pulse", activeTab, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("category", activeTab);
      if (search) params.set("search", search);
      return apiFetch<PulseData>(`/auto-pulse/feed?${params.toString()}`);
    },
    staleTime: 60_000,
    retry: 2,
  });

  const items = data?.items || [];
  const trending = data?.trending || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="radio" size={14} color={COLORS.gold} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Auto Pulse</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: theme.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderColor: theme.cardBorder }]}>
          <Feather name="search" size={14} color={COLORS.whiteDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search automotive news..."
            placeholderTextColor={COLORS.whiteDim}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={14} color={COLORS.whiteDim} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip} contentContainerStyle={styles.tabStripContent}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === tab.key ? `${COLORS.gold}15` : "transparent",
                borderColor: activeTab === tab.key ? `${COLORS.gold}40` : "transparent",
              },
            ]}
          >
            <Feather name={tab.icon} size={12} color={activeTab === tab.key ? COLORS.gold : COLORS.whiteDim} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? COLORS.gold : COLORS.whiteDim }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.gold} />}
      >
        {trending.length > 0 && (
          <View style={[styles.trendingBox, { backgroundColor: isDark ? "rgba(201,162,39,0.04)" : "rgba(201,162,39,0.06)", borderColor: `${COLORS.gold}15` }]}>
            <View style={styles.trendingHeader}>
              <Feather name="trending-up" size={12} color={COLORS.gold} />
              <Text style={[styles.trendingTitle, { color: COLORS.gold }]}>TRENDING</Text>
            </View>
            <View style={styles.trendingTags}>
              {trending.slice(0, 6).map((tag, i) => (
                <View key={i} style={[styles.trendingTag, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
                  <Text style={[styles.trendingTagText, { color: theme.textSub }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={[styles.loadingText, { color: COLORS.whiteDim }]}>Loading automotive feed...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="radio" size={40} color={COLORS.whiteDim} />
            <Text style={[styles.emptyText, { color: COLORS.whiteDim }]}>
              {search ? "No results match your search" : "No stories available right now"}
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => item.url && Linking.openURL(item.url)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isDark ? (pressed ? "rgba(255,255,255,0.04)" : theme.card) : (pressed ? "rgba(0,0,0,0.04)" : theme.card),
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.sourceBadge, { backgroundColor: `${sourceColor(item.sourceType)}10`, borderColor: `${sourceColor(item.sourceType)}25` }]}>
                  {sourceIcon(item.sourceType)}
                  <Text style={[styles.sourceText, { color: sourceColor(item.sourceType) }]}>
                    {item.source}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: COLORS.whiteDim }]}>
                  {timeAgo(item.publishedAt)}
                </Text>
              </View>

              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={3}>
                {item.title}
              </Text>

              {item.summary && (
                <Text style={[styles.cardSummary, { color: theme.textSub }]} numberOfLines={2}>
                  {item.summary}
                </Text>
              )}

              <View style={styles.cardFooter}>
                {item.sourceType === "nhtsa" && (
                  <View style={[styles.recallBadge]}>
                    <Feather name="alert-triangle" size={9} color="#EF4444" />
                    <Text style={styles.recallText}>SAFETY RECALL</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <Feather name="external-link" size={12} color={COLORS.whiteDim} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  tabStrip: { maxHeight: 44, borderBottomWidth: 0 },
  tabStripContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  tabLabel: { fontSize: 12, fontWeight: "700" },
  feed: { flex: 1, paddingHorizontal: 16 },
  trendingBox: {
    marginTop: 12, padding: 12, borderRadius: 14, borderWidth: 1,
  },
  trendingHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  trendingTitle: { fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  trendingTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  trendingTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trendingTagText: { fontSize: 11, fontWeight: "600" },
  loadingWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  card: {
    marginTop: 10, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
  },
  sourceBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  sourceText: { fontSize: 9, fontWeight: "700" },
  timeText: { fontSize: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4 },
  cardSummary: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center" },
  recallBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  recallText: { fontSize: 8, fontWeight: "800", color: "#EF4444", letterSpacing: 0.5 },
});
