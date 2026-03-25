/**
 * 3C Onyx — Automotive Business Finder
 * Powered by Google Maps Places API.
 * Find ANY automotive business: dealers, repair shops, gas, EV charging, detailing,
 * towing, insurance, auctions, parts stores, smog, wraps, and more.
 */
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";

type Category = {
  id:         string;
  label:      string;
  icon:       keyof typeof Feather.glyphMap;
  color:      string;
  googleType: string;
  emoji:      string;
};

type Place = {
  placeId:     string;
  name:        string;
  address:     string;
  rating?:     number;
  reviewCount?: number;
  distance?:   number;
  lat:         number;
  lng:         number;
  open?:       boolean;
  phone?:      string;
  category:    string;
  icon:        string;
  priceLevel?: number;
};

type PlacesResponse = {
  places:   Place[];
  category: Category;
  source:   string;
  status:   string;
};

const CATEGORIES: Category[] = [
  { id: "dealer",      label: "Dealers",          icon: "shopping-bag",  color: COLORS.gold,  googleType: "car_dealer",     emoji: "🚗" },
  { id: "repair",      label: "Auto Repair",      icon: "tool",          color: "#F97316",    googleType: "car_repair",     emoji: "🔧" },
  { id: "detail",      label: "Detailing",        icon: "droplet",       color: "#06B6D4",    googleType: "car_wash",       emoji: "✨" },
  { id: "rental",      label: "Rental",           icon: "key",           color: "#3B82F6",    googleType: "car_rental",     emoji: "🔑" },
  { id: "gas",         label: "Gas",              icon: "zap",           color: "#EAB308",    googleType: "gas_station",    emoji: "⛽" },
  { id: "parking",     label: "Parking",          icon: "map-pin",       color: "#8B5CF6",    googleType: "parking",        emoji: "🅿️" },
  { id: "parts",       label: "Parts",            icon: "package",       color: "#64748B",    googleType: "auto_parts_store", emoji: "🔩" },
  { id: "insurance",   label: "Insurance",        icon: "shield",        color: COLORS.emerald, googleType: "insurance_agency", emoji: "🛡️" },
  { id: "ev_charging", label: "EV Charging",      icon: "battery",       color: "#10B981",    googleType: "electric_vehicle_charging_station", emoji: "⚡" },
  { id: "towing",      label: "Towing",           icon: "truck",         color: "#EF4444",    googleType: "towing_service", emoji: "🚛" },
  { id: "auction",     label: "Auctions",         icon: "award",         color: "#F59E0B",    googleType: "auction_house",  emoji: "🏆" },
  { id: "smog",        label: "Smog",             icon: "check-circle",  color: "#10B981",    googleType: "car_inspection_station", emoji: "✅" },
];

function RatingStars({ rating, count }: { rating: number; count?: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.ratingRow}>
      <Feather name="star" size={11} color={COLORS.gold} />
      <Text style={[styles.ratingText, { color: theme.text }]}>{rating.toFixed(1)}</Text>
      {count !== undefined && <Text style={[styles.ratingCount, { color: theme.textMuted }]}>({count.toLocaleString()})</Text>}
    </View>
  );
}

function PlaceCard({ place, onCall, onDirections }: { place: Place; onCall: () => void; onDirections: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.placeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.placeTop}>
        <View style={[styles.placeIconWrap, { backgroundColor: `${COLORS.gold}12` }]}>
          <Feather name={place.icon as keyof typeof Feather.glyphMap} size={20} color={COLORS.gold} />
        </View>
        <View style={styles.placeInfo}>
          <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
          <Text style={[styles.placeAddress, { color: theme.textMuted }]} numberOfLines={1}>{place.address}</Text>
          <View style={styles.placeMeta}>
            {place.rating !== undefined && <RatingStars rating={place.rating} count={place.reviewCount} />}
            {place.distance !== undefined && (
              <Text style={[styles.placeDistance, { color: theme.textMuted }]}>{place.distance} mi</Text>
            )}
            {place.open !== undefined && (
              <View style={[styles.openBadge, { backgroundColor: place.open ? "#10B98118" : "#EF444418", borderColor: place.open ? "#10B98130" : "#EF444430" }]}>
                <Text style={[styles.openText, { color: place.open ? "#10B981" : "#EF4444" }]}>{place.open ? "Open" : "Closed"}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={[styles.placeActions, { borderTopColor: theme.cardBorder }]}>
        <Pressable style={styles.placeAction} onPress={onDirections}>
          <Feather name="navigation" size={14} color={COLORS.gold} />
          <Text style={[styles.placeActionText, { color: COLORS.gold }]}>Directions</Text>
        </Pressable>
        {place.phone && (
          <Pressable style={styles.placeAction} onPress={onCall}>
            <Feather name="phone" size={14} color={COLORS.emerald} />
            <Text style={[styles.placeActionText, { color: COLORS.emerald }]}>Call</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function NearbyScreen() {
  const insets      = useSafeAreaInsets();
  const { theme }   = useTheme();
  const params      = useLocalSearchParams<{ category?: string; q?: string }>();

  const [selectedCat, setSelectedCat] = useState<string>(params.category ?? "repair");
  const [query, setQuery]             = useState(params.q ?? "");
  const [places, setPlaces]           = useState<Place[]>([]);
  const [loading, setLoading]         = useState(false);
  const [userLoc, setUserLoc]         = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  }, []);

  const search = useCallback(async (cat: string, q?: string) => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    try {
      let loc = userLoc;
      if (!loc) loc = await getLocation() ?? { lat: 34.0522, lng: -118.2437 };
      const endpoint = q
        ? `/places/search?q=${encodeURIComponent(q)}&lat=${loc.lat}&lng=${loc.lng}`
        : `/places/nearby?lat=${loc.lat}&lng=${loc.lng}&category=${cat}`;
      const data = await apiFetch<PlacesResponse>(endpoint);
      setPlaces(data.places ?? []);
    } catch (e) {
      setError("Could not load businesses. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [userLoc, getLocation]);

  useEffect(() => {
    void search(selectedCat, params.q);
  }, []);

  function onDirections(place: Place) {
    Linking.openURL(`https://maps.apple.com/?daddr=${place.lat},${place.lng}`);
  }

  function onCall(place: Place) {
    if (place.phone) Linking.openURL(`tel:${place.phone}`);
  }

  const activeCat = CATEGORIES.find((c) => c.id === selectedCat) ?? CATEGORIES[0]!;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>FIND AUTOMOTIVE</Text>
          <Text style={[styles.headerSub, { color: theme.gold }]}>POWERED BY GOOGLE MAPS</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Feather name="search" size={15} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search any automotive business…"
          placeholderTextColor={theme.textFaint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => search(selectedCat, query)}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(""); search(selectedCat); }}>
            <Feather name="x" size={14} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => { setSelectedCat(c.id); setQuery(""); search(c.id); }}
            style={[
              styles.catChip,
              { borderColor: theme.cardBorder, backgroundColor: theme.cardAlt },
              selectedCat === c.id && { backgroundColor: `${c.color}18`, borderColor: `${c.color}40` },
            ]}
          >
            <Text style={styles.catEmoji}>{c.emoji}</Text>
            <Text style={[styles.catLabel, { color: selectedCat === c.id ? c.color : theme.textMuted }]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Finding {activeCat.label.toLowerCase()} near you…</Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorWrap, { backgroundColor: "#EF444412", borderColor: "#EF444425" }]}>
            <Feather name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && places.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{activeCat.emoji}</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Find {activeCat.label}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Browse {activeCat.label.toLowerCase()} businesses near your current location
            </Text>
            <Pressable style={styles.findBtn} onPress={() => search(selectedCat, query)}>
              <Feather name="search" size={16} color="#000" />
              <Text style={styles.findBtnText}>Search Nearby</Text>
            </Pressable>
          </View>
        )}

        {places.map((place) => (
          <PlaceCard
            key={place.placeId}
            place={place}
            onCall={() => onCall(place)}
            onDirections={() => onDirections(place)}
          />
        ))}

        {places.length > 0 && (
          <View style={[styles.footerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Results via Google Maps Places · {places.length} businesses found
            </Text>
          </View>
        )}

        <Text style={[styles.tagline, { color: theme.textFaint }]}>
          3C Onyx connects you to every automotive business — no matter the size, location, or specialty.{"\n"}
          Powered by CUXTOMCANDYCLUB LLC
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:         { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:    { flex: 1, alignItems: "center" },
  headerTitle:     { fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  headerSub:       { fontSize: 8, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  searchBar:       { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput:     { flex: 1, fontSize: 13 },
  catScroll:       { flexGrow: 0, marginBottom: 4 },
  catChip:         { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catEmoji:        { fontSize: 14 },
  catLabel:        { fontSize: 11, fontWeight: "600" },
  scroll:          { flex: 1 },
  placeCard:       { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  placeTop:        { flexDirection: "row", gap: 12, padding: 13 },
  placeIconWrap:   { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  placeInfo:       { flex: 1 },
  placeName:       { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  placeAddress:    { fontSize: 11, marginBottom: 6 },
  placeMeta:       { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  ratingRow:       { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText:      { fontSize: 11, fontWeight: "600" },
  ratingCount:     { fontSize: 10 },
  placeDistance:   { fontSize: 10, fontWeight: "600" },
  openBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 0.5 },
  openText:        { fontSize: 9, fontWeight: "700" },
  placeActions:    { flexDirection: "row", borderTopWidth: 0.5 },
  placeAction:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  placeActionText: { fontSize: 12, fontWeight: "700" },
  loadingWrap:     { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText:     { fontSize: 13 },
  errorWrap:       { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  errorText:       { flex: 1, color: "#EF4444", fontSize: 12 },
  emptyWrap:       { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyEmoji:      { fontSize: 48 },
  emptyTitle:      { fontSize: 20, fontWeight: "800" },
  emptySub:        { fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  findBtn:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.gold, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14, marginTop: 4 },
  findBtnText:     { color: "#000", fontSize: 14, fontWeight: "800" },
  footerCard:      { borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center" },
  footerText:      { fontSize: 10, textAlign: "center" },
  tagline:         { textAlign: "center", fontSize: 10, lineHeight: 16, paddingHorizontal: 20, marginTop: 8 },
});
