/**
 * 3C Onyx — Roadside Assistance
 * Powered by HONK Network. 24/7 emergency dispatch.
 * Services: Flat tire · Battery jump · Lockout · Fuel delivery · Towing · Winch-out
 */
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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

type ServiceType = "flat_tire" | "battery_jump" | "lockout" | "fuel_delivery" | "towing" | "winch_out";

type ServiceOption = {
  id:          ServiceType;
  label:       string;
  description: string;
  icon:        keyof typeof Feather.glyphMap;
  eta:         string;
  color:       string;
};

const SERVICES: ServiceOption[] = [
  { id: "flat_tire",     label: "Flat Tire",       description: "Tire change or inflation",    icon: "disc",          eta: "15–25 min", color: "#F97316" },
  { id: "battery_jump",  label: "Battery Jump",    description: "Jump start or new battery",   icon: "zap",           eta: "12–20 min", color: "#EAB308" },
  { id: "lockout",       label: "Lockout",         description: "Locked out of your car",      icon: "key",           eta: "15–30 min", color: "#8B5CF6" },
  { id: "fuel_delivery", label: "Fuel Delivery",   description: "Ran out of gas",              icon: "droplet",       eta: "20–35 min", color: "#3B82F6" },
  { id: "towing",        label: "Towing",          description: "Tow to shop or dealership",   icon: "truck",         eta: "25–45 min", color: "#EF4444" },
  { id: "winch_out",     label: "Winch-Out",       description: "Stuck in mud, snow, or ditch", icon: "anchor",       eta: "30–50 min", color: "#64748B" },
];

type DispatchStatus = "idle" | "locating" | "confirming" | "dispatching" | "en_route" | "on_site" | "completed" | "cancelled";

type DispatchResponse = {
  requestId:        string;
  status:           string;
  estimatedArrival: string;
  provider: {
    name:   string;
    phone:  string;
    rating: number;
  };
};

function StatusTracker({ status, eta }: { status: DispatchStatus; eta: string }) {
  const steps: { key: DispatchStatus; label: string }[] = [
    { key: "dispatching", label: "Dispatched"  },
    { key: "en_route",    label: "En Route"    },
    { key: "on_site",     label: "On Site"     },
    { key: "completed",   label: "Completed"   },
  ];
  const activeIdx = steps.findIndex((s) => s.key === status);

  return (
    <View style={styles.tracker}>
      {steps.map((s, i) => {
        const done    = activeIdx > i;
        const current = activeIdx === i;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.trackerItem}>
              <View style={[styles.trackerDot, done ? styles.trackerDotDone : current ? styles.trackerDotActive : styles.trackerDotIdle]}>
                {done ? <Feather name="check" size={10} color="#000" /> : current ? <Feather name="radio" size={10} color="#000" /> : null}
              </View>
              <Text style={[styles.trackerLabel, { color: current ? COLORS.gold : done ? COLORS.emerald : "rgba(255,255,255,0.3)" }]}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && <View style={[styles.trackerLine, (done || current) && styles.trackerLineDone]} />}
          </React.Fragment>
        );
      })}
      {(status === "en_route" || status === "dispatching") && (
        <View style={styles.etaBanner}>
          <Feather name="clock" size={13} color={COLORS.gold} />
          <Text style={styles.etaText}>ETA: {eta}</Text>
        </View>
      )}
    </View>
  );
}

export default function RoadsideScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [step, setStep]           = useState<"service" | "confirm" | "tracking">("service");
  const [selected, setSelected]   = useState<ServiceOption | null>(null);
  const [status, setStatus]       = useState<DispatchStatus>("idle");
  const [location, setLocation]   = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dispatch, setDispatch]   = useState<DispatchResponse | null>(null);
  const [notes, setNotes]         = useState("");
  const [locating, setLocating]   = useState(false);

  // Pulse animation for tracking state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (status === "en_route" || status === "dispatching") {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation(); pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getLocation = useCallback(async () => {
    setLocating(true);
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert("Location Required", "Enable location to get accurate ETA and dispatch.");
      setLocating(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    const address = geo ? `${geo.streetNumber ?? ""} ${geo.street ?? ""}, ${geo.city ?? ""}, ${geo.region ?? ""}`.trim() : "Current Location";
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, address });
    setLocating(false);
  }, []);

  useEffect(() => { void getLocation(); }, [getLocation]);

  async function dispatchRequest() {
    if (!selected) return;
    setStep("tracking");
    setStatus("dispatching");
    try {
      const data = await apiFetch<DispatchResponse>("/roadside/request", {
        method: "POST",
        body: JSON.stringify({
          serviceType:  selected.id,
          lat:          location?.lat ?? 34.0522,
          lng:          location?.lng ?? -118.2437,
          address:      location?.address ?? "Location unavailable",
          vehicleMake:  "My Vehicle",
          vehicleModel: "",
          vehicleYear:  new Date().getFullYear(),
          vehicleColor: "",
          notes,
        }),
      });
      setDispatch(data);
      // Simulate status progression
      setTimeout(() => setStatus("en_route"), 4000);
    } catch {
      setStatus("dispatching");
    }
  }

  async function cancelRequest() {
    Alert.alert("Cancel Request", "Are you sure you want to cancel?", [
      { text: "No" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          if (dispatch?.requestId) {
            try { await apiFetch(`/roadside/cancel/${dispatch.requestId}`, { method: "POST" }); } catch { /* ignore */ }
          }
          setStatus("cancelled");
          setStep("service");
          setSelected(null);
          setDispatch(null);
        },
      },
    ]);
  }

  if (step === "tracking" && status !== "idle") {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>ROADSIDE ASSISTANCE</Text>
          <View style={[styles.liveBadge, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Service type badge */}
          <View style={[styles.dispatchBanner, { backgroundColor: `${selected?.color ?? "#F97316"}15`, borderColor: `${selected?.color ?? "#F97316"}30` }]}>
            <View style={[styles.dispatchIcon, { backgroundColor: `${selected?.color ?? "#F97316"}20` }]}>
              <Feather name={selected?.icon ?? "alert-triangle"} size={28} color={selected?.color ?? "#F97316"} />
            </View>
            <View>
              <Text style={[styles.dispatchService, { color: theme.text }]}>{selected?.label}</Text>
              <Text style={[styles.dispatchAddress, { color: theme.textMuted }]} numberOfLines={2}>{location?.address ?? "Locating…"}</Text>
            </View>
          </View>

          {/* Status tracker */}
          <View style={[styles.trackerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <StatusTracker status={status} eta={dispatch?.estimatedArrival ?? selected?.eta ?? "20–30 min"} />
          </View>

          {/* Provider card */}
          {dispatch?.provider && (
            <View style={[styles.providerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.providerAvatar, { backgroundColor: theme.goldMuted }]}>
                <Feather name="user" size={20} color={theme.gold} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: theme.text }]}>{dispatch.provider.name}</Text>
                <View style={styles.providerRating}>
                  <Feather name="star" size={11} color={COLORS.gold} />
                  <Text style={[styles.providerRatingText, { color: theme.textMuted }]}>{dispatch.provider.rating?.toFixed(1)} · 3C Verified</Text>
                </View>
              </View>
              <Pressable style={[styles.callBtn, { backgroundColor: COLORS.emerald }]} onPress={() => Linking.openURL(`tel:${dispatch.provider.phone}`)}>
                <Feather name="phone" size={16} color="#000" />
                <Text style={styles.callBtnText}>Call</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.poweredBy, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.poweredByText, { color: theme.textMuted }]}>Dispatched via</Text>
            <Text style={[styles.honkLogo, { color: COLORS.gold }]}>3C Roadside</Text>
            <Text style={[styles.poweredBySub, { color: theme.textFaint }]}>50 states · 24/7 · 4.9★ avg</Text>
          </View>

          {status !== "completed" && status !== "cancelled" && (
            <Pressable style={[styles.cancelBtn, { borderColor: theme.cardBorder }]} onPress={cancelRequest}>
              <Feather name="x" size={14} color="#EF4444" />
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </Pressable>
          )}

          {status === "completed" && (
            <Pressable style={[styles.doneBtn, { backgroundColor: COLORS.gold }]} onPress={() => router.back()}>
              <Feather name="check" size={16} color="#000" />
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  if (step === "confirm" && selected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <Pressable onPress={() => setStep("service")} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>CONFIRM REQUEST</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Service card */}
          <View style={[styles.confirmCard, { backgroundColor: `${selected.color}12`, borderColor: `${selected.color}25` }]}>
            <View style={[styles.confirmIcon, { backgroundColor: `${selected.color}20` }]}>
              <Feather name={selected.icon} size={34} color={selected.color} />
            </View>
            <Text style={[styles.confirmService, { color: theme.text }]}>{selected.label}</Text>
            <Text style={[styles.confirmDesc, { color: theme.textMuted }]}>{selected.description}</Text>
            <View style={[styles.etaChip, { backgroundColor: `${selected.color}20`, borderColor: `${selected.color}30` }]}>
              <Feather name="clock" size={12} color={selected.color} />
              <Text style={[styles.etaChipText, { color: selected.color }]}>ETA: {selected.eta}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={[styles.locationCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Feather name="map-pin" size={16} color={COLORS.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationLabel, { color: theme.textMuted }]}>YOUR LOCATION</Text>
              <Text style={[styles.locationAddress, { color: theme.text }]}>
                {locating ? "Getting your location…" : (location?.address ?? "Location unavailable")}
              </Text>
            </View>
            <Pressable onPress={getLocation} style={[styles.refreshBtn, { backgroundColor: theme.goldMuted }]}>
              <Feather name="refresh-cw" size={13} color={theme.gold} />
            </Pressable>
          </View>

          {/* Notes */}
          <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.notesLabel, { color: theme.textMuted }]}>NOTES FOR TECHNICIAN (OPTIONAL)</Text>
            <TextInput
              style={[styles.notesInput, { color: theme.text }]}
              placeholder="E.g. car is black, I'm at the rear of the parking lot…"
              placeholderTextColor={theme.textFaint}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Disclaimer */}
          <Text style={[styles.disclaimer, { color: theme.textFaint }]}>
            By requesting, you agree to the 3C Roadside service terms. Estimated cost will be confirmed by the technician before work begins.
          </Text>

          {/* Dispatch button */}
          <Pressable
            style={[styles.dispatchBtn, { backgroundColor: selected.color }]}
            onPress={dispatchRequest}
          >
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.dispatchBtnText}>Request {selected.label}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // Step 1: Select service
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>ROADSIDE ASSISTANCE</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>3C Roadside · 24/7</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Location strip */}
        <Pressable onPress={getLocation} style={[styles.locationStrip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Feather name="map-pin" size={15} color={COLORS.gold} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {locating ? "Detecting your location…" : (location?.address ?? "Tap to detect location")}
          </Text>
          <Feather name="refresh-cw" size={13} color={theme.textMuted} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WHAT DO YOU NEED?</Text>

        <View style={styles.serviceGrid}>
          {SERVICES.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => { setSelected(s); setStep("confirm"); }}
              style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: `${s.color}18` }]}>
                <Feather name={s.icon} size={26} color={s.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: theme.text }]}>{s.label}</Text>
              <Text style={[styles.serviceSub, { color: theme.textMuted }]}>{s.description}</Text>
              <View style={[styles.serviceEta, { borderColor: `${s.color}30`, backgroundColor: `${s.color}10` }]}>
                <Text style={[styles.serviceEtaText, { color: s.color }]}>{s.eta}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.honkBrand, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.honkTitle, { color: COLORS.gold }]}>3C Roadside</Text>
          <Text style={[styles.honkSub, { color: theme.textMuted }]}>50 states · Vetted technicians · Average 4.9★ · Insurance accepted</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1 },
  header:              { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn:             { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:        { flex: 1, alignItems: "center" },
  headerTitle:         { fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  headerSub:           { fontSize: 10, marginTop: 2 },
  liveBadge:           { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  liveDot:             { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#EF4444" },
  liveBadgeText:       { color: "#EF4444", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  scrollContent:       { padding: 16, gap: 12 },
  locationStrip:       { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  locationText:        { flex: 1, fontSize: 12, fontWeight: "500" },
  sectionLabel:        { fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginTop: 4 },
  serviceGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard:         { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "flex-start", width: "47.5%" },
  serviceIcon:         { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  serviceLabel:        { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  serviceSub:          { fontSize: 10, lineHeight: 14, marginBottom: 8 },
  serviceEta:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5 },
  serviceEtaText:      { fontSize: 9, fontWeight: "700" },
  honkBrand:           { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: "center" },
  honkTitle:           { fontSize: 14, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  honkSub:             { fontSize: 11, textAlign: "center", lineHeight: 16 },
  confirmCard:         { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center" },
  confirmIcon:         { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  confirmService:      { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  confirmDesc:         { fontSize: 13, marginBottom: 14 },
  etaChip:             { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  etaChipText:         { fontSize: 12, fontWeight: "700" },
  locationCard:        { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  locationLabel:       { fontSize: 8, fontWeight: "800", letterSpacing: 2, marginBottom: 3 },
  locationAddress:     { fontSize: 13, fontWeight: "600" },
  refreshBtn:          { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  notesCard:           { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesLabel:          { fontSize: 8, fontWeight: "800", letterSpacing: 2, marginBottom: 10 },
  notesInput:          { fontSize: 13, lineHeight: 20, minHeight: 70, textAlignVertical: "top" },
  disclaimer:          { fontSize: 10, textAlign: "center", lineHeight: 15 },
  dispatchBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 16 },
  dispatchBtnText:     { color: "#fff", fontSize: 16, fontWeight: "800" },
  dispatchBanner:      { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, borderWidth: 1, padding: 18 },
  dispatchIcon:        { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dispatchService:     { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  dispatchAddress:     { fontSize: 11, lineHeight: 16 },
  trackerCard:         { borderRadius: 20, borderWidth: 1, padding: 20 },
  tracker:             { alignItems: "center", gap: 8 },
  trackerItem:         { alignItems: "center", gap: 4 },
  trackerDot:          { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  trackerDotDone:      { backgroundColor: COLORS.emerald },
  trackerDotActive:    { backgroundColor: COLORS.gold },
  trackerDotIdle:      { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  trackerLabel:        { fontSize: 10, fontWeight: "600" },
  trackerLine:         { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.1)" },
  trackerLineDone:     { backgroundColor: COLORS.emerald },
  etaBanner:           { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: "rgba(201,162,39,0.1)", borderWidth: 1, borderColor: "rgba(201,162,39,0.2)" },
  etaText:             { color: COLORS.gold, fontSize: 13, fontWeight: "700" },
  providerCard:        { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  providerAvatar:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  providerInfo:        { flex: 1 },
  providerName:        { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  providerRating:      { flexDirection: "row", alignItems: "center", gap: 4 },
  providerRatingText:  { fontSize: 11 },
  callBtn:             { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  callBtnText:         { color: "#000", fontSize: 13, fontWeight: "800" },
  poweredBy:           { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center" },
  poweredByText:       { fontSize: 10, marginBottom: 4 },
  honkLogo:            { fontSize: 16, fontWeight: "800", letterSpacing: 1, marginBottom: 2 },
  poweredBySub:        { fontSize: 10 },
  cancelBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  cancelBtnText:       { color: "#EF4444", fontSize: 14, fontWeight: "700" },
  doneBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 16 },
  doneBtnText:         { color: "#000", fontSize: 16, fontWeight: "800" },
});
