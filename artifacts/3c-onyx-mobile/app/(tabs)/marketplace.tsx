import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import {
  Animated,
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

type Listing = {
  id: string;
  heading: string;
  price: number;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim: string;
  exterior_color: string;
  fuel_type: string;
  city: string;
  state: string;
  dom: number;
  vin: string;
  media: { photo_links: string[] };
  seller: { name: string };
};

type SearchResult = {
  listings: Listing[];
  totalCount: number;
  source: string;
};

const FILTERS = ["ALL", "PORSCHE", "FERRARI", "BENTLEY", "LAMBORGHINI", "ROLLS-ROYCE"];

function maskVin(vin: string) {
  if (!vin || vin.length < 4) return "•••••••••••••••";
  return "•••••••••••" + vin.slice(-4);
}

function ListingCard({ item, index }: { item: Listing; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [bookmarked, setBookmarked] = useState(false);
  const imgUrl = item.media?.photo_links?.[0];

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

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

          {/* Cert badge */}
          <View style={styles.certBadge}>
            <MaterialCommunityIcons name="shield-check" size={10} color={COLORS.gold} />
            <Text style={styles.certText}>3C CERTIFIED</Text>
          </View>

          {/* DOM badge */}
          <View style={styles.domBadge}>
            <Text style={styles.domText}>{item.dom}d listed</Text>
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
            <Text style={styles.vinText}>VIN {maskVin(item.vin)}</Text>
            <View style={styles.locationPill}>
              <Feather name="map-pin" size={9} color={COLORS.whiteDim} />
              <Text style={styles.locationText}>{item.city}, {item.state}</Text>
            </View>
          </View>

          <Text style={styles.vehicleName} numberOfLines={2}>{item.heading}</Text>
          <Text style={styles.vehicleSub}>{item.exterior_color} · {item.fuel_type}</Text>

          <View style={styles.milesRow}>
            <MaterialCommunityIcons name="speedometer" size={12} color={COLORS.whiteDim} />
            <Text style={styles.milesText}>{item.miles.toLocaleString()} mi</Text>
            <View style={styles.dot} />
            <Text style={styles.sellerText}>{item.seller?.name}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price.toLocaleString()}</Text>
            <Pressable style={styles.conciergeBtn}>
              <MaterialCommunityIcons name="robot" size={13} color={COLORS.black} />
              <Text style={styles.conciergeBtnText}>Via Concierge</Text>
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
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const [search, setSearch] = useState("");
  const [activeMake, setActiveMake] = useState("ALL");

  const makeParam = activeMake !== "ALL" ? activeMake.toLowerCase().replace(/-/g, " ") : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", makeParam],
    queryFn: () => {
      const params = new URLSearchParams();
      if (makeParam) params.set("make", makeParam);
      return apiFetch<SearchResult>(`/marketcheck/search?${params.toString()}`);
    },
  });

  const filtered = (data?.listings ?? []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.heading?.toLowerCase().includes(q) ||
      l.make?.toLowerCase().includes(q) ||
      l.model?.toLowerCase().includes(q) ||
      String(l.year).includes(q)
    );
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="car-multiple" size={20} color={COLORS.gold} />
          <Text style={styles.title}>MARKETPLACE</Text>
        </View>
        <Text style={styles.subtitle}>
          {data ? `${data.totalCount} certified listings` : "Loading inventory..."}
        </Text>
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
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: bottomPad + 90 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-off" size={36} color={COLORS.whiteDim} />
              <Text style={styles.emptyTitle}>No vehicles found</Text>
              <Text style={styles.emptySub}>Try a different filter</Text>
            </View>
          }
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
  skeletonLine: { height: 11, borderRadius: 6, backgroundColor: "#1E1E1E" },
});
