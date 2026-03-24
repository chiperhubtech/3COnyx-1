import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

type GarageVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
  fuelPercent: number | null;
  batteryPercent: number | null;
  fuelType: "gasoline" | "electric" | "hybrid";
  lastSync: string;
  color: string;
};

function maskVin(vin: string) {
  if (!vin || vin.length < 4) return "•••••••••••••••";
  return "•••••••••••" + vin.slice(-4);
}

function formatLastSync(isoString: string): string {
  try {
    const d = new Date(isoString);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  } catch {
    return "recently";
  }
}

function GaugeCircle({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit?: string }) {
  const SIZE = 80;
  const RADIUS = 32;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const pct = Math.min(1, Math.max(0, value / max));
  const dashOffset = CIRCUMFERENCE * (1 - pct);
  const displayValue = value > 999 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}${unit ?? ""}`;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke="rgba(255,255,255,0.06)" strokeWidth={7} fill="transparent"
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={color} strokeWidth={7} fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color }]}>{displayValue}</Text>
        </View>
      </View>
      <Text style={styles.gaugeLabel}>{label}</Text>
    </View>
  );
}

function VehicleCard({ vehicle }: { vehicle: GarageVehicle }) {
  const needsService = vehicle.odometer > 50000;
  const isElectric = vehicle.fuelType === "electric";

  return (
    <View style={[styles.card, needsService && styles.cardAlert]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.vehicleIconBox}>
          <MaterialCommunityIcons
            name={isElectric ? "car-electric" : "car-side"}
            size={18}
            color={COLORS.gold}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
          <Text style={styles.vinText}>VIN {maskVin(vehicle.vin)}</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Gauges */}
      <View style={styles.gaugesRow}>
        <GaugeCircle
          value={vehicle.odometer}
          max={100000}
          color="rgba(255,255,255,0.4)"
          label="Odometer"
        />
        {vehicle.fuelPercent != null && (
          <GaugeCircle
            value={vehicle.fuelPercent}
            max={100}
            color={COLORS.gold}
            label="Fuel"
            unit="%"
          />
        )}
        {vehicle.batteryPercent != null && (
          <GaugeCircle
            value={vehicle.batteryPercent}
            max={100}
            color={COLORS.emerald}
            label="Battery"
            unit="%"
          />
        )}
      </View>

      {/* Sync */}
      <View style={styles.syncRow}>
        <Feather name="clock" size={10} color={COLORS.whiteDim} />
        <Text style={styles.syncText}>Last synced {formatLastSync(vehicle.lastSync)}</Text>
      </View>

      {/* Service Alert */}
      {needsService && (
        <>
          <View style={styles.alertBox}>
            <MaterialCommunityIcons name="alert" size={14} color={COLORS.red} />
            <Text style={styles.alertText}>
              Odometer reads {vehicle.odometer.toLocaleString()} mi — exceeds 50,000 mi service threshold.
            </Text>
          </View>
          <Pressable style={styles.specialistBtn}>
            <MaterialCommunityIcons name="tools" size={14} color={COLORS.black} />
            <Text style={styles.specialistBtnText}>Request a 3C Specialist</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function GarageScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { data, isLoading } = useQuery({
    queryKey: ["garage"],
    queryFn: () => apiFetch<{ vehicles: GarageVehicle[] }>("/garage/vehicles"),
  });

  const vehicles = data?.vehicles ?? [];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="garage-open" size={20} color={COLORS.emerald} />
          <Text style={styles.title}>MY GARAGE</Text>
        </View>
        <Pressable style={styles.connectBtn}>
          <Feather name="plus" size={13} color={COLORS.black} />
          <Text style={styles.connectBtnText}>Connect</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Live telematics via Smartcar Connect</Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 90, gap: 14, paddingTop: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          [1, 2].map((k) => (
            <View key={k} style={styles.skeletonCard}>
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonGauges} />
            </View>
          ))
        ) : (
          vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)
        )}

        {/* Smartcar Banner */}
        <View style={styles.smartcarBanner}>
          <MaterialCommunityIcons name="shield-link-variant" size={18} color={COLORS.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Smartcar Connected</Text>
            <Text style={styles.bannerSub}>End-to-end encrypted · OAuth 2.0</Text>
          </View>
          <Feather name="chevron-right" size={16} color={COLORS.whiteDim} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 2,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: COLORS.white, letterSpacing: 2 },
  subtitle: {
    fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim,
    paddingHorizontal: 20, paddingBottom: 4, marginLeft: 28,
  },
  connectBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.gold, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  connectBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: COLORS.black },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  cardAlert: {
    borderColor: "rgba(255,59,48,0.25)",
    backgroundColor: "#180E0E",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  vehicleIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: `${COLORS.gold}15`, borderWidth: 1, borderColor: `${COLORS.gold}20`,
    alignItems: "center", justifyContent: "center",
  },
  vehicleName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.white, lineHeight: 17 },
  vinText: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.whiteDim, marginTop: 1 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${COLORS.emerald}15`, borderWidth: 1, borderColor: `${COLORS.emerald}25`,
    borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.emerald },
  liveText: { fontFamily: "Inter_700Bold", fontSize: 9, color: COLORS.emerald, letterSpacing: 1 },
  gaugesRow: { flexDirection: "row", justifyContent: "space-around" },
  gaugeCenter: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  gaugeValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  gaugeLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.whiteDim },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  syncText: { fontFamily: "Inter_400Regular", fontSize: 10, color: COLORS.whiteDim },
  alertBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(255,59,48,0.08)", borderWidth: 1, borderColor: "rgba(255,59,48,0.2)",
    borderRadius: 10, padding: 10,
  },
  alertText: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.red, flex: 1, lineHeight: 17 },
  specialistBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLORS.red, borderRadius: 12, paddingVertical: 12,
  },
  specialistBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: COLORS.black },
  smartcarBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 16, padding: 14,
  },
  bannerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.white },
  bannerSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.whiteDim, marginTop: 1 },
  skeletonCard: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 20, padding: 16, gap: 16,
  },
  skeletonRow: { height: 38, borderRadius: 8, backgroundColor: "#1E1E1E" },
  skeletonGauges: { height: 90, borderRadius: 8, backgroundColor: "#1A1A1A" },
});
