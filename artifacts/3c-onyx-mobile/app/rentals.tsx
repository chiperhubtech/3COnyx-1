/**
 * 3C Onyx — Car Rentals
 * Powered by CarCrawler — 30+ rental providers aggregated in one search.
 * Enterprise, Hertz, Avis, Budget, National, Sixt, and more.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

type VehicleClass = "economy" | "compact" | "midsize" | "fullsize" | "suv" | "luxury" | "van";

const VEHICLE_CLASSES: { id: VehicleClass; label: string; icon: string; color: string }[] = [
  { id: "economy",  label: "Economy",   icon: "💰", color: "#10B981" },
  { id: "compact",  label: "Compact",   icon: "🚗", color: "#3B82F6" },
  { id: "midsize",  label: "Midsize",   icon: "🚙", color: COLORS.gold },
  { id: "fullsize", label: "Full-Size", icon: "🛻", color: "#F97316" },
  { id: "suv",      label: "SUV",       icon: "🚐", color: "#8B5CF6" },
  { id: "luxury",   label: "Luxury",    icon: "✨", color: "#EC4899" },
  { id: "van",      label: "Van",       icon: "🚌", color: "#64748B" },
];

type RentalCar = {
  id:           string;
  provider:     string;
  vehicleClass: string;
  make:         string;
  model:        string;
  year:         number;
  pricePerDay:  number;
  totalPrice:   number;
  mileage:      string;
  transmission: string;
  seats:        number;
  bags:         number;
  deepLink:     string;
  days:         number;
  currency:     string;
};

type SearchResult = {
  results:        RentalCar[];
  location:       string;
  pickupDate:     string;
  dropoffDate:    string;
  days:           number;
  totalProviders: number;
  source:         string;
};

const PROVIDER_COLORS: Record<string, string> = {
  Enterprise: "#007B5E", Hertz: "#FFB800", Budget: "#D31F2A",
  Avis:       "#BE0000", National: "#007B5E", Alamo: "#0066CC",
  Dollar:     "#D31F2A", Sixt:   "#FF6600",
};

function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0]!;
}

function CarCard({ car, onBook }: { car: RentalCar; onBook: (car: RentalCar) => void }) {
  const { theme } = useTheme();
  const providerColor = PROVIDER_COLORS[car.provider] ?? COLORS.gold;
  const cls = VEHICLE_CLASSES.find((v) => v.id === car.vehicleClass);

  return (
    <View style={[styles.carCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Provider badge */}
      <View style={[styles.providerBadge, { backgroundColor: `${providerColor}15`, borderColor: `${providerColor}30` }]}>
        <Text style={[styles.providerName, { color: providerColor }]}>{car.provider}</Text>
      </View>

      {/* Vehicle info */}
      <View style={styles.carMain}>
        <View style={styles.carInfo}>
          <Text style={[styles.carName, { color: theme.text }]}>{car.year} {car.make} {car.model}</Text>
          <Text style={[styles.carClass, { color: theme.textMuted }]}>{cls?.label ?? car.vehicleClass} · {car.transmission}</Text>
          <View style={styles.carSpecs}>
            <View style={styles.carSpec}>
              <Feather name="users" size={10} color={theme.textMuted} />
              <Text style={[styles.carSpecText, { color: theme.textMuted }]}>{car.seats} seats</Text>
            </View>
            <View style={styles.carSpec}>
              <Feather name="briefcase" size={10} color={theme.textMuted} />
              <Text style={[styles.carSpecText, { color: theme.textMuted }]}>{car.bags} bags</Text>
            </View>
            <View style={styles.carSpec}>
              <Feather name="activity" size={10} color={theme.textMuted} />
              <Text style={[styles.carSpecText, { color: theme.textMuted }]}>{car.mileage}</Text>
            </View>
          </View>
        </View>
        <View style={styles.carPricing}>
          <Text style={[styles.pricePerDay, { color: theme.gold }]}>${car.pricePerDay}</Text>
          <Text style={[styles.priceLabel, { color: theme.textMuted }]}>/day</Text>
          <Text style={[styles.totalPrice, { color: theme.textSub }]}>${car.totalPrice} total</Text>
        </View>
      </View>

      <Pressable style={[styles.bookBtn, { backgroundColor: providerColor }]} onPress={() => onBook(car)}>
        <Feather name="external-link" size={13} color="#fff" />
        <Text style={styles.bookBtnText}>Book on {car.provider}</Text>
      </Pressable>
    </View>
  );
}

export default function RentalsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [location, setLocation]       = useState("");
  const [pickupDate, setPickupDate]   = useState(today(1));
  const [dropoffDate, setDropoffDate] = useState(today(5));
  const [vehicleClass, setVehicleClass] = useState<VehicleClass | "">("");
  const [loading, setLoading]         = useState(false);
  const [results, setResults]         = useState<SearchResult | null>(null);
  const [error, setError]             = useState<string | null>(null);

  async function search() {
    if (!location.trim()) { setError("Enter a pickup location (city or airport code)"); return; }
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({
        pickupLocation: location.trim(),
        pickupDate,
        dropoffDate,
        ...(vehicleClass ? { vehicleClass } : {}),
      });
      const data = await apiFetch<SearchResult>(`/rentals/search?${params}`);
      setResults(data);
    } catch (e) {
      setError("Unable to fetch rental rates. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function book(car: RentalCar) {
    Linking.openURL(car.deepLink).catch(() => {});
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>CAR RENTALS</Text>
          <Text style={[styles.headerSub, { color: theme.gold }]}>POWERED BY CARCRAWLER</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search form */}
        <View style={[styles.searchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.formLabel, { color: theme.textMuted }]}>PICKUP LOCATION</Text>
          <View style={[styles.inputRow, { borderColor: theme.cardBorder, backgroundColor: theme.cardAlt }]}>
            <Feather name="map-pin" size={14} color={COLORS.gold} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="City or airport code (e.g. LAX, Miami)"
              placeholderTextColor={theme.textFaint}
              value={location}
              onChangeText={setLocation}
              autoCorrect={false}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, { color: theme.textMuted }]}>PICKUP DATE</Text>
              <View style={[styles.inputRow, { borderColor: theme.cardBorder, backgroundColor: theme.cardAlt }]}>
                <Feather name="calendar" size={14} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textFaint}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, { color: theme.textMuted }]}>RETURN DATE</Text>
              <View style={[styles.inputRow, { borderColor: theme.cardBorder, backgroundColor: theme.cardAlt }]}>
                <Feather name="calendar" size={14} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textFaint}
                  value={dropoffDate}
                  onChangeText={setDropoffDate}
                />
              </View>
            </View>
          </View>

          {/* Vehicle class filter */}
          <Text style={[styles.formLabel, { color: theme.textMuted }]}>VEHICLE CLASS (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {[{ id: "" as const, label: "All", icon: "🚗", color: theme.textMuted }, ...VEHICLE_CLASSES].map((v) => (
              <Pressable
                key={v.id}
                onPress={() => setVehicleClass(v.id as VehicleClass | "")}
                style={[styles.classChip, vehicleClass === v.id && { backgroundColor: COLORS.gold + "18", borderColor: COLORS.gold + "40" }, { borderColor: theme.cardBorder, backgroundColor: theme.cardAlt }]}
              >
                <Text style={styles.classIcon}>{v.icon}</Text>
                <Text style={[styles.classLabel, { color: vehicleClass === v.id ? COLORS.gold : theme.textMuted }]}>{v.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={[styles.searchBtn, loading && { opacity: 0.7 }]} onPress={search} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#000" /> : (
              <>
                <Feather name="search" size={16} color="#000" />
                <Text style={styles.searchBtnText}>Compare Rates</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {results && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: theme.text }]}>{results.results.length} cars found</Text>
              <Text style={[styles.resultsLocation, { color: theme.textMuted }]}>{results.location} · {results.days} days</Text>
            </View>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {results.results.map((car) => <CarCard key={car.id} car={car} onBook={book} />)}
            </View>
            <View style={[styles.poweredBy, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.poweredByText, { color: theme.textMuted }]}>Results via</Text>
              <Text style={[styles.poweredByBrand, { color: COLORS.gold }]}>CarCrawler Network</Text>
              <Text style={[styles.poweredBySub, { color: theme.textFaint }]}>{results.totalProviders}+ providers · Best available rates</Text>
            </View>
          </>
        )}

        {/* Provider logos */}
        {!results && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PROVIDER NETWORK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
              {["Enterprise", "Hertz", "Avis", "Budget", "National", "Alamo", "Dollar", "Sixt"].map((name) => (
                <View key={name} style={[styles.providerPill, { backgroundColor: `${PROVIDER_COLORS[name] ?? COLORS.gold}12`, borderColor: `${PROVIDER_COLORS[name] ?? COLORS.gold}25` }]}>
                  <Text style={[styles.providerPillText, { color: PROVIDER_COLORS[name] ?? COLORS.gold }]}>{name}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={[styles.tagline, { color: theme.textFaint }]}>Compare rates from 30+ providers · No booking fee · Instant confirmation</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  scroll:          { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:         { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:    { flex: 1, alignItems: "center" },
  headerTitle:     { fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  headerSub:       { fontSize: 8, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  searchCard:      { margin: 16, borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  formLabel:       { fontSize: 9, fontWeight: "800", letterSpacing: 2, marginBottom: -4 },
  inputRow:        { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  input:           { flex: 1, fontSize: 13 },
  dateRow:         { flexDirection: "row", gap: 10 },
  classChip:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  classIcon:       { fontSize: 14 },
  classLabel:      { fontSize: 11, fontWeight: "600" },
  errorText:       { color: "#EF4444", fontSize: 12, textAlign: "center" },
  searchBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 14 },
  searchBtnText:   { color: "#000", fontSize: 15, fontWeight: "800" },
  resultsHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  resultsCount:    { fontSize: 15, fontWeight: "700" },
  resultsLocation: { fontSize: 11 },
  carCard:         { borderRadius: 18, borderWidth: 1, padding: 14, position: "relative", gap: 10 },
  providerBadge:   { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 0.5 },
  providerName:    { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  carMain:         { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  carInfo:         { flex: 1 },
  carName:         { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  carClass:        { fontSize: 11, marginBottom: 8 },
  carSpecs:        { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  carSpec:         { flexDirection: "row", alignItems: "center", gap: 3 },
  carSpecText:     { fontSize: 10 },
  carPricing:      { alignItems: "flex-end" },
  pricePerDay:     { fontSize: 24, fontWeight: "800" },
  priceLabel:      { fontSize: 10, fontWeight: "600", marginTop: -4, marginBottom: 3 },
  totalPrice:      { fontSize: 11 },
  bookBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  bookBtnText:     { color: "#fff", fontSize: 13, fontWeight: "700" },
  poweredBy:       { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  poweredByText:   { fontSize: 10, marginBottom: 2 },
  poweredByBrand:  { fontSize: 16, fontWeight: "800", letterSpacing: 1, marginBottom: 2 },
  poweredBySub:    { fontSize: 10 },
  sectionLabel:    { fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  providerPill:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  providerPillText:{ fontSize: 12, fontWeight: "700" },
  tagline:         { textAlign: "center", fontSize: 10, paddingHorizontal: 32, marginTop: 16, lineHeight: 15 },
});
