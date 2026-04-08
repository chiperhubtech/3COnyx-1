import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  priceRange: { min: number; max: number };
  laborEstimate: string;
  popular: boolean;
  fleetAvailable: boolean;
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "Wraps & Graphics": { icon: "edit-3",      color: "#A78BFA" },
  "Wheels & Tires":   { icon: "disc",         color: "#F59E0B" },
  "Interior":         { icon: "box",          color: "#C9A227" },
  "Exterior":         { icon: "truck",        color: "#60A5FA" },
  "Lighting":         { icon: "sun",          color: "#34D399" },
  "Audio & Electronics": { icon: "speaker", color: "#EC4899" },
  "Performance":      { icon: "activity",     color: "#EF4444" },
};

const CATEGORIES = ["all", ...Object.keys(CATEGORY_META)];

export default function CustomizeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFleet, setIsFleet] = useState(false);
  const [fleetSize, setFleetSize] = useState(1);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["customize-catalog", activeCategory, search, isFleet],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (search) params.set("search", search);
      if (isFleet) params.set("fleet", "true");
      return apiFetch<{ items: Product[]; total: number }>(`/customize/catalog?${params.toString()}`);
    },
    staleTime: 60_000,
    retry: 2,
  });

  const products = data?.items || [];

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateQuote = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setQuoteLoading(true);
    try {
      const data = await apiFetch<any>("/customize/quote", {
        method: "POST",
        body: JSON.stringify({
          items: Array.from(selectedIds),
          isFleet,
          fleetSize: isFleet ? fleetSize : 1,
        }),
      });
      Alert.alert(
        `Quote ${data.quoteNumber}`,
        `${data.lineItems.length} upgrade${data.lineItems.length > 1 ? "s" : ""}\n` +
        `${isFleet && fleetSize > 1 ? `${fleetSize} vehicles\n` : ""}` +
        `${data.fleetDiscount ? `Fleet Discount: ${data.fleetDiscount}\n` : ""}` +
        `Subtotal: $${data.subtotal.toLocaleString()}\n` +
        `Platform Fee (3%): $${data.platformFee.toLocaleString()}\n` +
        `Total: $${data.total.toLocaleString()}\n\n` +
        `Timeline: ${data.estimatedTimeline}\nValid for 30 days`,
        [
          { text: "Book Now", style: "default" },
          { text: "Close", style: "cancel" },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to generate quote");
    }
    setQuoteLoading(false);
  }, [selectedIds, isFleet, fleetSize]);

  const selectedCount = selectedIds.size;
  const estimatedTotal = Array.from(selectedIds)
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)
    .reduce((sum, p) => sum + Math.round((p!.priceRange.min + p!.priceRange.max) / 2), 0)
    * (isFleet ? fleetSize : 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="star" size={14} color="#A78BFA" />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Customize</Text>
        </View>
        <Pressable
          onPress={() => setIsFleet(!isFleet)}
          style={[
            styles.fleetToggle,
            {
              backgroundColor: isFleet ? "rgba(96,165,250,0.1)" : "transparent",
              borderColor: isFleet ? "rgba(96,165,250,0.3)" : theme.cardBorder,
            },
          ]}
        >
          <Feather name="layers" size={12} color={isFleet ? "#60A5FA" : COLORS.whiteDim} />
          <Text style={{ fontSize: 9, fontWeight: "800", color: isFleet ? "#60A5FA" : COLORS.whiteDim }}>
            {isFleet ? "FLEET" : "FLEET"}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: theme.cardBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderColor: theme.cardBorder }]}>
          <Feather name="search" size={14} color={COLORS.whiteDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search wraps, wheels, leather..."
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

      {isFleet && (
        <View style={[styles.fleetBar, { backgroundColor: isDark ? "rgba(96,165,250,0.04)" : "rgba(96,165,250,0.06)", borderBottomColor: theme.cardBorder }]}>
          <Feather name="layers" size={14} color="#60A5FA" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.fleetLabel, { color: "#60A5FA" }]}>Fleet Customization</Text>
            <Text style={[styles.fleetDesc, { color: theme.textSub }]}>3+ = 5% off · 5+ = 10% off · 10+ = 15% off</Text>
          </View>
          <View style={styles.fleetCounter}>
            <Pressable onPress={() => setFleetSize(Math.max(1, fleetSize - 1))} style={[styles.counterBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
              <Feather name="minus" size={14} color={theme.text} />
            </Pressable>
            <Text style={[styles.counterNum, { color: theme.text }]}>{fleetSize}</Text>
            <Pressable onPress={() => setFleetSize(fleetSize + 1)} style={[styles.counterBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
              <Feather name="plus" size={14} color={theme.text} />
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip} contentContainerStyle={styles.tabStripContent}>
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          const active = activeCategory === cat;
          const color = meta?.color || COLORS.gold;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? `${color}15` : "transparent",
                  borderColor: active ? `${color}40` : "transparent",
                },
              ]}
            >
              {meta && <Feather name={meta.icon as any} size={11} color={active ? color : COLORS.whiteDim} />}
              <Text style={[styles.tabLabel, { color: active ? color : COLORS.whiteDim }]} numberOfLines={1}>
                {cat === "all" ? "All" : cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={{ paddingBottom: selectedCount > 0 ? 120 : 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.gold} />}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={[styles.loadingText, { color: COLORS.whiteDim }]}>Loading catalog...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="package" size={36} color={COLORS.whiteDim} />
            <Text style={[styles.emptyText, { color: COLORS.whiteDim }]}>
              {search ? "No products match your search" : "No products in this category"}
            </Text>
          </View>
        ) : (
          products.map(product => {
            const selected = selectedIds.has(product.id);
            const meta = CATEGORY_META[product.category];
            const color = meta?.color || COLORS.gold;

            return (
              <Pressable
                key={product.id}
                onPress={() => toggleProduct(product.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: selected
                      ? (isDark ? `${color}08` : `${color}06`)
                      : (pressed ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : theme.card),
                    borderColor: selected ? `${color}30` : theme.cardBorder,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  <View style={[
                    styles.checkCircle,
                    {
                      backgroundColor: selected ? `${color}20` : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                      borderColor: selected ? `${color}50` : theme.cardBorder,
                    },
                  ]}>
                    {selected ? (
                      <Feather name="check" size={12} color={color} />
                    ) : (
                      <Feather name="plus" size={10} color={COLORS.whiteDim} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
                      {product.popular && (
                        <View style={[styles.popularBadge, { backgroundColor: `${COLORS.gold}12` }]}>
                          <Feather name="star" size={8} color={COLORS.gold} />
                          <Text style={styles.popularText}>HOT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardDesc, { color: theme.textSub }]} numberOfLines={2}>
                      {product.description}
                    </Text>
                    <View style={styles.cardMeta}>
                      <View style={[styles.metaTag, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
                        <Text style={[styles.metaText, { color: theme.textSub }]}>{product.subcategory}</Text>
                      </View>
                      <Text style={[styles.metaText, { color: theme.textSub }]}>{product.laborEstimate}</Text>
                      {product.fleetAvailable && (
                        <View style={[styles.metaTag, { backgroundColor: "rgba(96,165,250,0.08)" }]}>
                          <Text style={[styles.metaText, { color: "#60A5FA" }]}>FLEET</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.priceMain, { color: theme.text }]}>
                      ${product.priceRange.min.toLocaleString()}
                    </Text>
                    <Text style={[styles.priceSub, { color: COLORS.whiteDim }]}>
                      to ${product.priceRange.max.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {selectedCount > 0 && (
        <View style={[styles.quoteBar, { backgroundColor: isDark ? "rgba(12,12,18,0.95)" : "rgba(255,255,255,0.95)", borderTopColor: `${COLORS.gold}25` }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quoteCount, { color: theme.text }]}>
              {selectedCount} upgrade{selectedCount > 1 ? "s" : ""} selected
            </Text>
            <Text style={[styles.quoteEst, { color: COLORS.whiteDim }]}>
              Est. ~${estimatedTotal.toLocaleString()}
              {isFleet && fleetSize > 1 ? ` for ${fleetSize} vehicles` : ""}
            </Text>
          </View>
          <Pressable
            onPress={generateQuote}
            disabled={quoteLoading}
            style={[styles.quoteBtn, { opacity: quoteLoading ? 0.6 : 1 }]}
          >
            {quoteLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Feather name="file-text" size={14} color="#000" />
            )}
            <Text style={styles.quoteBtnText}>{quoteLoading ? "BUILDING..." : "GET QUOTE"}</Text>
          </Pressable>
        </View>
      )}
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
  fleetToggle: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  fleetBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  fleetLabel: { fontSize: 12, fontWeight: "700" },
  fleetDesc: { fontSize: 10 },
  fleetCounter: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterBtn: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  counterNum: { fontSize: 18, fontWeight: "900", minWidth: 24, textAlign: "center" },
  tabStrip: { maxHeight: 44 },
  tabStripContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  tabLabel: { fontSize: 11, fontWeight: "700" },
  feed: { flex: 1, paddingHorizontal: 16 },
  loadingWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  card: { marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center",
    borderWidth: 1, marginTop: 2,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  popularBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  popularText: { fontSize: 7, fontWeight: "900", color: COLORS.gold, letterSpacing: 0.5 },
  cardDesc: { fontSize: 11, lineHeight: 16, marginBottom: 6 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  metaText: { fontSize: 9, fontWeight: "600" },
  priceCol: { alignItems: "flex-end", flexShrink: 0 },
  priceMain: { fontSize: 16, fontWeight: "900" },
  priceSub: { fontSize: 9 },
  quoteBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 34,
    borderTopWidth: 1,
  },
  quoteCount: { fontSize: 13, fontWeight: "800" },
  quoteEst: { fontSize: 11, marginTop: 1 },
  quoteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
    backgroundColor: COLORS.gold,
  },
  quoteBtnText: { fontSize: 13, fontWeight: "900", color: "#000", letterSpacing: 0.5 },
});
