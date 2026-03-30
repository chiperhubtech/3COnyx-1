/**
 * 3C ONYX — Deal Status Screen
 * Live transport timeline + broker deal details
 * Pulls from Transporter Agent (PAT-08) via /api/transport
 */
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShipmentStatus {
  shipmentId:    string;
  status:        string;
  vehicle:       string;
  vin:           string;
  origin:        string;
  destination:   string;
  carrier:       string;
  carrierDot:    string;
  transportType: string;
  totalMiles:    number;
  etaDays:       number;
  totalCostUsd:  number;
  currentCity?:  string;
  lastPing?:     string;
  dealValue?:    number;
  guardianActive?: boolean;
  confirmedAt?:  string;
}

interface ActiveShipments {
  active: ShipmentStatus[];
  total:  number;
}

// ─── Timeline step map ────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: "created",   label: "Deal Created",    icon: "file-text"     as const },
  { key: "quoted",    label: "Pricing Locked",  icon: "lock"          as const },
  { key: "confirmed", label: "Vehicle Secured", icon: "check-circle"  as const },
  { key: "transit",   label: "En Route",        icon: "truck"         as const },
  { key: "delivered", label: "Delivered",       icon: "home"          as const },
];

// Map API status strings → timeline index
function statusToStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("complete")) return 4;
  if (s.includes("transit") || s.includes("route") || s.includes("pickup")) return 3;
  if (s.includes("confirm") || s.includes("scheduled") || s.includes("assigned")) return 2;
  if (s.includes("quoted") || s.includes("quote") || s.includes("locked")) return 1;
  return 0;
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────
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
  return (
    <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity }} />
  );
}

// ─── Single shipment detail view ──────────────────────────────────────────────
function ShipmentDetail({ s }: { s: ShipmentStatus }) {
  const { theme } = useTheme();
  const currentStep = statusToStep(s.status);
  const isLive      = currentStep === 3;

  return (
    <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

      {/* Vehicle header */}
      <View style={styles.vehicleHeader}>
        <View style={[styles.vehicleIconWrap, { backgroundColor: `${COLORS.gold}15`, borderColor: `${COLORS.gold}25` }]}>
          <MaterialCommunityIcons name="car-sports" size={22} color={COLORS.gold} />
          {s.guardianActive && (
            <View style={styles.guardianBadge}>
              <Ionicons name="shield-checkmark" size={9} color="#000" />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.vehicleLabel, { color: theme.text }]} numberOfLines={1}>
            {s.vehicle}
          </Text>
          <Text style={[styles.vehicleVin, { color: theme.textFaint }]}>VIN {s.vin}</Text>
        </View>
        {isLive && (
          <View style={[styles.liveBadge, { backgroundColor: `${COLORS.emerald}15`, borderColor: `${COLORS.emerald}28` }]}>
            <PulseDot />
            <Text style={[styles.liveText, { color: COLORS.emerald }]}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Route strip */}
      <View style={[styles.routeStrip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <View style={styles.routeEndpoint}>
          <Text style={[styles.routeCity, { color: theme.text }]}>{s.origin}</Text>
          <Text style={[styles.routeLabel, { color: theme.textFaint }]}>ORIGIN</Text>
        </View>
        <View style={styles.routeCenter}>
          <View style={[styles.routeLine, { backgroundColor: theme.cardBorder }]} />
          <View style={[styles.routeDot, { backgroundColor: COLORS.gold }]} />
          <Text style={[styles.routeMiles, { color: theme.gold }]}>{s.totalMiles.toLocaleString()} mi</Text>
        </View>
        <View style={[styles.routeEndpoint, { alignItems: "flex-end" }]}>
          <Text style={[styles.routeCity, { color: theme.text }]}>{s.destination}</Text>
          <Text style={[styles.routeLabel, { color: theme.textFaint }]}>DESTINATION</Text>
        </View>
      </View>

      {/* Status timeline */}
      <View style={styles.timelineWrap}>
        {TIMELINE_STEPS.map((step, idx) => {
          const done    = idx <= currentStep;
          const active  = idx === currentStep;
          const stepColor = done ? (active && isLive ? COLORS.gold : COLORS.emerald) : "rgba(255,255,255,0.12)";

          return (
            <View key={step.key} style={styles.timelineRow}>
              {/* Connector line above (skip first) */}
              {idx > 0 && (
                <View style={[styles.timelineConnector, {
                  backgroundColor: idx <= currentStep ? COLORS.emerald : "rgba(255,255,255,0.08)",
                }]} />
              )}

              {/* Step */}
              <View style={styles.timelineStep}>
                <View style={[
                  styles.timelineIcon,
                  { backgroundColor: `${stepColor}18`, borderColor: `${stepColor}40` },
                  active && styles.timelineIconActive,
                ]}>
                  {active && isLive
                    ? <PulseDot color={COLORS.gold} />
                    : done
                    ? <Feather name={step.icon} size={14} color={stepColor} />
                    : <View style={{ width: 14, height: 14 }} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timelineLabel, { color: done ? theme.text : theme.textFaint }]}>
                    {step.label}
                  </Text>
                  {active && s.currentCity && (
                    <Text style={[styles.timelineCity, { color: COLORS.gold }]}>
                      Currently in {s.currentCity}
                    </Text>
                  )}
                </View>
                {done && !active && (
                  <Feather name="check" size={12} color={COLORS.emerald} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Metrics row */}
      <View style={[styles.metricsRow, { borderTopColor: theme.cardBorder }]}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.gold }]}>{s.etaDays}d</Text>
          <Text style={[styles.metricLabel, { color: theme.textFaint }]}>ETA</Text>
        </View>
        <View style={[styles.metricDiv, { backgroundColor: theme.cardBorder }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            ${s.totalCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textFaint }]}>TRANSPORT</Text>
        </View>
        <View style={[styles.metricDiv, { backgroundColor: theme.cardBorder }]} />
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: COLORS.emerald }]} numberOfLines={1}>
            {s.transportType}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textFaint }]}>TYPE</Text>
        </View>
      </View>

      {/* Carrier row */}
      <View style={[styles.carrierRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <Feather name="shield" size={12} color={COLORS.emerald} />
        <Text style={[styles.carrierText, { color: theme.textMuted }]}>
          {s.carrier}
        </Text>
        <Text style={[styles.carrierDot, { color: theme.textFaint }]}>DOT {s.carrierDot}</Text>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ theme }: { theme: ReturnType<typeof useTheme>["theme"] }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <MaterialCommunityIcons name="truck-outline" size={36} color="rgba(255,255,255,0.1)" />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Active Deals</Text>
      <Text style={[styles.emptySub, { color: theme.textMuted }]}>
        Your confirmed transport orders will appear here with live status.
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DealScreen() {
  const { theme }           = useTheme();
  const insets              = useSafeAreaInsets();
  const params              = useLocalSearchParams<{ shipmentId?: string }>();
  const [data, setData]     = useState<ActiveShipments | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      if (params.shipmentId) {
        // Deep link to specific shipment
        const s = await apiFetch<ShipmentStatus>(`/transport/${params.shipmentId}`);
        setData({ active: [s], total: 1 });
      } else {
        const res = await apiFetch<ActiveShipments>("/transport/active");
        setData(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deal status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.shipmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const topPad = insets.top;
  const botPad = insets.bottom;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={theme.gold} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>ACTIVE DEALS</Text>
          <Text style={[styles.headerSub, { color: theme.textFaint }]}>Transporter Agent · Live</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshBtn} hitSlop={12}>
          <Feather name="refresh-cw" size={16} color={theme.textMuted} />
        </Pressable>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Querying Transporter Agent…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="warning-outline" size={32} color="rgba(239,68,68,0.5)" />
          <Text style={[styles.loadingText, { color: "rgba(239,68,68,0.7)" }]}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); fetchData(); }} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: COLORS.gold }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: botPad + 100, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary badge */}
          {data && data.total > 0 && (
            <View style={[styles.summaryBadge, { backgroundColor: `${COLORS.gold}10`, borderColor: `${COLORS.gold}20` }]}>
              <MaterialCommunityIcons name="truck-delivery" size={13} color={COLORS.gold} />
              <Text style={[styles.summaryText, { color: COLORS.gold }]}>
                {data.total} active shipment{data.total !== 1 ? "s" : ""} · PAT-08 Transporter Agent
              </Text>
            </View>
          )}

          {/* Shipments */}
          {data && data.active.length > 0
            ? data.active.map(s => <ShipmentDetail key={s.shipmentId} s={s} />)
            : <EmptyState theme={theme} />
          }

          {/* Actions */}
          {data && data.active.length > 0 && (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: `${COLORS.gold}12`, borderColor: `${COLORS.gold}28` }]}
                onPress={() => router.push("/(tabs)/command" as never)}
              >
                <Feather name="terminal" size={14} color={COLORS.gold} />
                <Text style={[styles.actionBtnText, { color: COLORS.gold }]}>Command</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.25)" }]}
                onPress={() => router.push("/(tabs)/vault" as never)}
              >
                <Feather name="lock" size={14} color="#3B82F6" />
                <Text style={[styles.actionBtnText, { color: "#3B82F6" }]}>Vault</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }]}
                onPress={() => router.push("/roadside" as never)}
              >
                <Feather name="alert-triangle" size={14} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>SOS</Text>
              </Pressable>
            </View>
          )}

          {/* 3C Footer */}
          <Text style={[styles.footer, { color: theme.textFaint }]}>
            3C ONYX · Transporter Agent PAT-08 · Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn:      { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  refreshBtn:   { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontSize: 13, fontWeight: "800", letterSpacing: 3 },
  headerSub:    { fontSize: 9, fontWeight: "500", letterSpacing: 1, marginTop: 2 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  loadingText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  retryBtn:    { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.gold}40` },
  retryText:   { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },

  summaryBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  summaryText:  { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

  // Detail card
  detailCard:    { borderWidth: 1, borderRadius: 20, overflow: "hidden", gap: 0 },
  vehicleHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 12 },
  vehicleIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  guardianBadge: { position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.emerald, alignItems: "center", justifyContent: "center" },
  vehicleLabel:  { fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
  vehicleVin:    { fontSize: 9, fontWeight: "600", letterSpacing: 1, marginTop: 2 },
  liveBadge:     { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  liveText:      { fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },

  // Route
  routeStrip:    { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  routeEndpoint: { flex: 1, gap: 3 },
  routeCity:     { fontSize: 13, fontWeight: "700" },
  routeLabel:    { fontSize: 8, fontWeight: "700", letterSpacing: 1.5 },
  routeCenter:   { flex: 1, alignItems: "center", gap: 3 },
  routeLine:     { width: "80%", height: 1 },
  routeDot:      { width: 6, height: 6, borderRadius: 3 },
  routeMiles:    { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  // Timeline
  timelineWrap:      { paddingHorizontal: 16, paddingVertical: 12, gap: 0 },
  timelineRow:       { gap: 0 },
  timelineConnector: { width: 2, height: 14, marginLeft: 17, borderRadius: 1 },
  timelineStep:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  timelineIcon:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  timelineIconActive: { borderWidth: 2 },
  timelineLabel:     { fontSize: 13, fontWeight: "600" },
  timelineCity:      { fontSize: 10, fontWeight: "500", marginTop: 2 },

  // Metrics
  metricsRow:  { flexDirection: "row", borderTopWidth: 1, paddingVertical: 14 },
  metric:      { flex: 1, alignItems: "center", gap: 3 },
  metricValue: { fontSize: 13, fontWeight: "800" },
  metricLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  metricDiv:   { width: 1, marginVertical: 4 },

  // Carrier
  carrierRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 14, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  carrierText: { flex: 1, fontSize: 11, fontWeight: "600" },
  carrierDot:  { fontSize: 9, fontWeight: "600", letterSpacing: 0.5 },

  // Empty
  emptyCard:  { borderWidth: 1, borderRadius: 20, padding: 36, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub:   { fontSize: 12, fontWeight: "400", textAlign: "center", lineHeight: 18 },

  // Actions
  actionsRow:    { flexDirection: "row", gap: 10 },
  actionBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderRadius: 14, paddingVertical: 13 },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

  footer: { textAlign: "center", fontSize: 9, fontWeight: "500", letterSpacing: 0.5, paddingTop: 8 },
});
