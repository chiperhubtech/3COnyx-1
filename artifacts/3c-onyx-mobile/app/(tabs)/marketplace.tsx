import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

type Listing = {
  id: string;
  heading: string;
  price: number;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  exterior_color?: string;
  fuel_type?: string;
  city?: string;
  state?: string;
  dom?: number;
  vin?: string;
  media?: { photo_links?: string[] };
  seller?: { name?: string; phone?: string; contact_phone?: string; website?: string; url?: string };
};

type SearchResult = {
  listings: Listing[];
  totalCount: number;
  mode: "live" | "demo" | "unavailable";
  sourceLabel: string;
  hasMore: boolean;
  nextStart?: number;
  message?: string;
  source?: string;
  pagination?: { nextStart: number | null };
};

const FILTERS = ["ALL", "PORSCHE", "FERRARI", "BENTLEY", "LAMBORGHINI", "ROLLS-ROYCE"];

function maskVin(vin: string) {
  if (!vin || vin.length < 4) return "•••••••••••••••";
  return "•••••••••••" + vin.slice(-4);
}

function ListingCard({ item, index }: { item: Listing; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [bookmarked, setBookmarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imgUrl = item.media?.photo_links?.[0];

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  const requestAvailability = () => {
    Alert.alert(
      "Request availability",
      `Ask the ONYX concierge to confirm ${item.heading} with the seller? This does not reserve the vehicle or guarantee its price.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit request",
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiFetch("/source", {
                method: "POST",
                body: JSON.stringify({
                  category: "VEHICLE_PURCHASE",
                  title: `Availability inquiry — ${item.heading}`.slice(0, 200),
                  description: [
                    `Please confirm availability and acquisition options for ${item.heading}.`,
                    `Market listing ID: ${item.id}.`,
                    item.vin ? `VIN: ${item.vin}.` : "",
                    item.seller?.name ? `Seller: ${item.seller.name}.` : "",
                  ].filter(Boolean).join(" "),
                  budgetMinCents: 0,
                  budgetMaxCents: Math.max(100, Math.round((item.price || 1) * 100)),
                  feeStructurePref: "ANY",
                  deadlineDays: 7,
                  isAnonymous: true,
                }),
              });
              Alert.alert("Request submitted", "Your vehicle request is now tracked by ONYX Source.");
            } catch (error) {
              Alert.alert("Could not submit request", error instanceof Error ? error.message : "Please try again.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.vehicleImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="car" size={40} color={COLORS.muted} />
            </View>
          )}
          <View style={styles.imageOverlay} />

          {/* Provider provenance badge */}
          <View style={styles.certBadge}>
            <MaterialCommunityIcons name="storefront-outline" size={10} color={COLORS.gold} />
            <Text style={styles.certText}>DEALER LISTING</Text>
          </View>

          {/* DOM badge */}
          <View style={styles.domBadge}>
            <Text style={styles.domText}>{item.dom ?? "—"}d listed</Text>
          </View>

          {/* Bookmark */}
          <Pressable
            style={styles.bookmarkBtn}
            onPress={() => setBookmarked((v) => !v)}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={bookmarked ? COLORS.gold : COLORS.white}
            />
          </Pressable>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.vinRow}>
            <Text style={styles.vinText}>VIN {maskVin(item.vin ?? "")}</Text>
            <View style={styles.locationPill}>
              <Feather name="map-pin" size={9} color={COLORS.whiteDim} />
              <Text style={styles.locationText}>{[item.city, item.state].filter(Boolean).join(", ") || "Location unavailable"}</Text>
            </View>
          </View>

          <Text style={styles.vehicleName} numberOfLines={2}>{item.heading}</Text>
          <Text style={styles.vehicleSub}>{[item.exterior_color, item.fuel_type].filter(Boolean).join(" · ") || "Details unavailable"}</Text>

          <View style={styles.milesRow}>
            <MaterialCommunityIcons name="speedometer" size={12} color={COLORS.whiteDim} />
            <Text style={styles.milesText}>{item.miles?.toLocaleString?.() ?? "—"} mi</Text>
            <View style={styles.dot} />
            <Text style={styles.sellerText}>{item.seller?.name}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price.toLocaleString()}</Text>
            <Pressable
              style={[styles.conciergeBtn, submitting && { opacity: 0.65 }]}
              onPress={requestAvailability}
              disabled={submitting}
            >
              <MaterialCommunityIcons name="robot" size={13} color={COLORS.black} />
              <Text style={styles.conciergeBtnText}>{submitting ? "Submitting…" : "Via Concierge"}</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.imageContainer, { backgroundColor: "#1A1A1A" }]} />
      <View style={{ padding: 14, gap: 8 }}>
        <View style={[styles.skeletonLine, { width: "40%" }]} />
        <View style={[styles.skeletonLine, { width: "80%" }]} />
        <View style={[styles.skeletonLine, { width: "50%" }]} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const [search, setSearch] = useState("");
  const [activeMake, setActiveMake] = useState("ALL");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const makeParam = activeMake !== "ALL" ? activeMake.toLowerCase().replace(/-/g, " ") : undefined;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["marketplace", makeParam, debouncedSearch, zip, radius],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams();
      if (makeParam) params.set("make", makeParam);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (zip.trim()) params.set("zip", zip.trim());
      if (radius) params.set("radius", radius);
      params.set("rows", "20");
      params.set("start", String(pageParam));
      return apiFetch<SearchResult>(`/marketcheck/search?${params.toString()}`, { signal });
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.mode !== "unavailable" && (lastPage.hasMore || lastPage.pagination?.nextStart != null)
        ? (lastPage.nextStart ?? lastPage.pagination?.nextStart ?? Number(lastPageParam) + lastPage.listings.length)
        : undefined,
  });

  const latest = data?.pages[0];
  const listings = useMemo(() => data?.pages.flatMap((page) => page.mode === "unavailable" ? [] : page.listings) ?? [], [data]);
  const mode = latest?.mode ?? "unavailable";

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="car-multiple" size={20} color={COLORS.gold} />
          <Text style={styles.title}>{t("marketplace.title")}</Text>
        </View>
        <Text style={styles.subtitle}>
           {latest ? `${mode === "demo" ? "DEMO · " : mode === "unavailable" ? "UNAVAILABLE · " : ""}${latest.sourceLabel || (latest.source === "marketcheck" ? "MarketCheck" : "Inventory")} · ${latest.totalCount} listings` : t("common.loading")}
        </Text>
      </View>
      <View style={styles.locationFilters}>
        <TextInput style={styles.locationInput} value={zip} onChangeText={setZip} placeholder="ZIP code" placeholderTextColor={COLORS.whiteDim} keyboardType="numeric" />
        <Pressable style={styles.radiusChip} onPress={() => setRadius(radius === "50" ? "100" : radius === "100" ? "" : "50")}>
          <Text style={styles.radiusText}>{radius ? `${radius} mi` : "Any radius"}</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={COLORS.whiteDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, year..."
            placeholderTextColor={COLORS.whiteDim}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={COLORS.whiteDim} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Make filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterChip, activeMake === item && styles.filterChipActive]}
            onPress={() => setActiveMake(item)}
          >
            <Text style={[styles.filterText, activeMake === item && styles.filterTextActive]}>
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Listings */}
      {isLoading ? (
        <FlatList
          data={Array.from({ length: 3 })}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: bottomPad + 90 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: bottomPad + 90 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-off" size={36} color={COLORS.whiteDim} />
              <Text style={styles.emptyTitle}>{mode === "unavailable" ? "Live inventory unavailable" : "No vehicles found"}</Text>
              <Text style={styles.emptySub}>{mode === "unavailable" ? (latest?.message || "The provider is not configured or cannot be reached. No inventory is shown as live.") : "Try a different filter"}</Text>
            </View>
          }
          ListHeaderComponent={mode === "demo" ? <View style={styles.demoBanner}><Text style={styles.demoText}>DEMO INVENTORY — Sample listings only. This is not a live provider feed.</Text></View> : null}
          ListFooterComponent={hasNextPage ? <Pressable style={styles.loadMore} onPress={() => fetchNextPage()} disabled={isFetchingNextPage}><Text style={styles.loadMoreText}>{isFetchingNextPage ? "Loading…" : "Load more listings"}</Text></Pressable> : null}
          renderItem={({ item, index }) => <ListingCard item={item} index={index} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.white, letterSpacing: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim, paddingLeft: 28 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.white },
  locationFilters: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  locationInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.white, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  radiusChip: { justifyContent: "center", paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  radiusText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.gold },
  filterRow: { paddingLeft: 16, paddingRight: 8, paddingBottom: 10, gap: 6 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: { backgroundColor: `${COLORS.gold}18`, borderColor: `${COLORS.gold}40` },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: COLORS.whiteDim, letterSpacing: 0.5 },
  filterTextActive: { color: COLORS.gold },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    overflow: "hidden",
  },
  imageContainer: { height: 190 },
  vehicleImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A1A" },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  certBadge: {
    position: "absolute", top: 10, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1, borderColor: `${COLORS.gold}35`,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  certText: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: COLORS.gold, letterSpacing: 0.8 },
  domBadge: {
    position: "absolute", bottom: 10, right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  domText: { fontFamily: "Inter_500Medium", fontSize: 10, color: COLORS.whiteDim },
  bookmarkBtn: {
    position: "absolute", top: 8, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  cardInfo: { padding: 14, gap: 4 },
  vinRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  vinText: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.whiteDim, letterSpacing: 0.3 },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.whiteDim },
  vehicleName: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.white, lineHeight: 20 },
  vehicleSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim },
  milesRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  milesText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.whiteDim },
  sellerText: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim, flex: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  price: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.white },
  conciergeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.gold, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  conciergeBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: COLORS.black },
  emptyState: { paddingTop: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.white },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.whiteDim },
  demoBanner: { marginBottom: 12, borderWidth: 1, borderColor: `${COLORS.gold}55`, backgroundColor: `${COLORS.gold}18`, borderRadius: 10, padding: 10 },
  demoText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: COLORS.gold, lineHeight: 16 },
  loadMore: { marginVertical: 16, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: `${COLORS.gold}66`, backgroundColor: `${COLORS.gold}18` },
  loadMoreText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: COLORS.gold },
  skeletonLine: { height: 11, borderRadius: 6, backgroundColor: "#1E1E1E" },
});
