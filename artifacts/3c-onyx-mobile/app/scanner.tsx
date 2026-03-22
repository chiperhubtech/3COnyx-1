/**
 * 3C Runner — 360° Vehicle Scanner
 * Captures 8 angular positions around the vehicle.
 * Used by Runners to document vehicle condition pre-delivery.
 */
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// 8 scan positions (0° = front, clockwise)
const POSITIONS = [
  { label: "Front",          angle: 0,   shortLabel: "F"    },
  { label: "Front-Right 45°", angle: 45,  shortLabel: "FR"   },
  { label: "Right Side",     angle: 90,  shortLabel: "R"    },
  { label: "Rear-Right 45°", angle: 135, shortLabel: "RR"   },
  { label: "Rear",           angle: 180, shortLabel: "B"    },
  { label: "Rear-Left 45°",  angle: 225, shortLabel: "RL"   },
  { label: "Left Side",      angle: 270, shortLabel: "L"    },
  { label: "Front-Left 45°", angle: 315, shortLabel: "FL"   },
];

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&q=80",
  "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=600&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
];

function RadarDot({ angle, captured, active, onPress }: {
  angle: number; captured: boolean; active: boolean; onPress: () => void;
}) {
  const RADIUS = 100;
  const rad = (angle - 90) * (Math.PI / 180);
  const x = RADIUS * Math.cos(rad);
  const y = RADIUS * Math.sin(rad);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [active]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.radarDot, { left: 100 + x - 16, top: 100 + y - 16 }]}
    >
      <Animated.View style={[
        styles.radarDotInner,
        { transform: [{ scale: pulseAnim }] },
        captured ? styles.radarDotCaptured : active ? styles.radarDotActive : styles.radarDotEmpty,
      ]}>
        {captured
          ? <Feather name="check" size={10} color="#000" />
          : active
          ? <Feather name="camera" size={10} color="#000" />
          : <View style={styles.radarDotPip} />
        }
      </Animated.View>
    </Pressable>
  );
}

function ShutterRing({ capturing }: { capturing: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (capturing) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1.5, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [capturing]);

  return (
    <Animated.View style={[styles.shutterRing, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]} />
  );
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ vehicleId?: string; vehicleName?: string }>();
  const vehicleId = params.vehicleId ?? "task-001";
  const vehicleName = params.vehicleName ?? "2023 Rolls-Royce Ghost Extended";

  const [captured, setCaptured] = useState<boolean[]>(new Array(8).fill(false));
  const [activeIdx, setActiveIdx] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scanHash, setScanHash] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const capturedCount = captured.filter(Boolean).length;
  const allCaptured = capturedCount === 8;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: capturedCount / 8,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [capturedCount]);

  const triggerCapture = useCallback(async (idx: number) => {
    if (captured[idx] || capturing) return;
    setCapturing(true);

    // Flash effect
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    // Simulate capture delay
    await new Promise((r) => setTimeout(r, 400));

    const newCaptured = [...captured];
    newCaptured[idx] = true;
    setCaptured(newCaptured);

    // Submit position to API
    try {
      await apiFetch(`/api/dropship/scan/submit`, {
        method: "POST",
        body: JSON.stringify({
          vehicleId,
          positionIndex: idx,
          imageUrl: DEMO_IMAGES[idx],
        }),
      });
    } catch {
      // Network unavailable in demo — continue
    }

    setCapturing(false);

    // Auto-advance to next uncaptured position
    const next = newCaptured.findIndex((c, i) => !c && i > idx);
    if (next !== -1) setActiveIdx(next);
    else {
      const firstMissing = newCaptured.findIndex((c) => !c);
      if (firstMissing !== -1) setActiveIdx(firstMissing);
    }
  }, [captured, capturing, vehicleId]);

  const submitScan = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/dropship/scan/submit`, {
        method: "POST",
        body: JSON.stringify({ vehicleId, positionIndex: -1 }),
      });
      const data = await res.json();
      setScanHash(data.scan?.sha256Hash ?? "scan_completed_" + Date.now().toString(16));
    } catch {
      setScanHash("scan_completed_" + Date.now().toString(16));
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={48} color={COLORS.gold} />
          </View>
          <Text style={styles.successTitle}>Scan Submitted!</Text>
          <Text style={styles.successSub}>All 8 positions captured</Text>
          <Text style={styles.successVehicle}>{vehicleName}</Text>

          {scanHash && (
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>SCAN HASH</Text>
              <Text style={styles.hashValue} numberOfLines={2}>{scanHash}</Text>
            </View>
          )}

          <View style={styles.successStats}>
            {[
              { label: "Positions", value: "8/8" },
              { label: "Quality", value: "✓ High" },
              { label: "AR Ready", value: "Yes" },
            ].map(({ label, value }) => (
              <View key={label} style={styles.successStat}>
                <Text style={styles.successStatValue}>{value}</Text>
                <Text style={styles.successStatLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => router.back()} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, { opacity: flashAnim }]} pointerEvents="none" />

      {/* Simulated camera background */}
      <View style={styles.cameraView}>
        <View style={styles.cameraBg}>
          {/* Scan grid */}
          <View style={styles.scanGrid} />
          {/* Corner brackets */}
          {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((cornerStyle, i) => (
            <View key={i} style={cornerStyle} />
          ))}
          {/* Center crosshair */}
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
        </View>

        {/* Position label */}
        <View style={styles.positionLabel}>
          <View style={styles.positionLabelDot} />
          <Text style={styles.positionLabelText}>{POSITIONS[activeIdx].label}</Text>
          <Text style={styles.positionAngle}>{POSITIONS[activeIdx].angle}°</Text>
        </View>

        {/* Instruction */}
        <View style={styles.instructionBox}>
          <Feather name="rotate-cw" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.instructionText}>
            Walk to the <Text style={{ color: COLORS.gold, fontWeight: "700" }}>{POSITIONS[activeIdx].label}</Text> position
          </Text>
        </View>
      </View>

      {/* Top header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>360° SCANNER</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{vehicleName}</Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.headerBadgeText}>RUNNER</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }]} />
        </View>
        <Text style={styles.progressText}>{capturedCount}/8 captured</Text>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>

        {/* Radar dial */}
        <View style={styles.radarContainer}>
          {/* Outer ring */}
          <View style={styles.radarRing} />
          {/* Inner ring */}
          <View style={styles.radarInnerRing} />
          {/* Center */}
          <View style={styles.radarCenter}>
            <Text style={styles.radarCenterText}>{capturedCount}</Text>
            <Text style={styles.radarCenterSub}>/ 8</Text>
          </View>
          {/* Dots */}
          {POSITIONS.map((pos, idx) => (
            <RadarDot
              key={idx}
              angle={pos.angle}
              captured={captured[idx]}
              active={activeIdx === idx}
              onPress={() => setActiveIdx(idx)}
            />
          ))}
        </View>

        {/* Position quick-select */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.positionScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {POSITIONS.map((pos, idx) => (
            <Pressable
              key={idx}
              onPress={() => setActiveIdx(idx)}
              style={[
                styles.positionChip,
                activeIdx === idx && styles.positionChipActive,
                captured[idx] && styles.positionChipDone,
              ]}
            >
              {captured[idx] && <Feather name="check" size={10} color={COLORS.gold} style={{ marginRight: 3 }} />}
              <Text style={[
                styles.positionChipText,
                activeIdx === idx && styles.positionChipTextActive,
                captured[idx] && styles.positionChipTextDone,
              ]}>
                {pos.shortLabel}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Capture button */}
        <View style={styles.captureRow}>
          {allCaptured ? (
            <Pressable
              onPress={submitScan}
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? (
                <Feather name="loader" size={20} color="#000" />
              ) : (
                <>
                  <Feather name="upload-cloud" size={20} color="#000" />
                  <Text style={styles.submitBtnText}>Submit 360° Scan</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => triggerCapture(activeIdx)}
              disabled={capturing || captured[activeIdx]}
              style={[styles.captureBtn, (capturing || captured[activeIdx]) && styles.captureBtnDisabled]}
            >
              <ShutterRing capturing={capturing} />
              <View style={styles.captureBtnInner}>
                {captured[activeIdx] ? (
                  <Feather name="check" size={24} color={COLORS.gold} />
                ) : (
                  <Feather name="camera" size={24} color="#fff" />
                )}
              </View>
            </Pressable>
          )}
        </View>

        {!allCaptured && (
          <Text style={styles.captureHint}>
            {captured[activeIdx]
              ? `${POSITIONS[activeIdx].label} captured ✓ — tap another position`
              : `Tap to capture ${POSITIONS[activeIdx].label}`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080810" },

  flashOverlay: {
    position: "absolute", inset: 0,
    backgroundColor: "#fff", zIndex: 100,
  },

  cameraView: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: SCREEN_H * 0.55,
    backgroundColor: "#0a1a0a",
    overflow: "hidden",
  },
  cameraBg: {
    flex: 1,
    backgroundColor: "#0d180d",
    alignItems: "center",
    justifyContent: "center",
  },
  scanGrid: {
    position: "absolute", inset: 0,
    borderColor: "rgba(255,255,255,0.04)",
  },
  cornerTL: { position: "absolute", top: 40, left: 20, width: 32, height: 32, borderTopWidth: 2, borderLeftWidth: 2, borderColor: "rgba(201,162,39,0.6)" },
  cornerTR: { position: "absolute", top: 40, right: 20, width: 32, height: 32, borderTopWidth: 2, borderRightWidth: 2, borderColor: "rgba(201,162,39,0.6)" },
  cornerBL: { position: "absolute", bottom: 0, left: 20, width: 32, height: 32, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: "rgba(201,162,39,0.6)" },
  cornerBR: { position: "absolute", bottom: 0, right: 20, width: 32, height: 32, borderBottomWidth: 2, borderRightWidth: 2, borderColor: "rgba(201,162,39,0.6)" },
  crosshairH: { position: "absolute", left: "30%", right: "30%", height: 1, backgroundColor: "rgba(201,162,39,0.25)", top: "50%" },
  crosshairV: { position: "absolute", top: "30%", bottom: "30%", width: 1, backgroundColor: "rgba(201,162,39,0.25)", left: "50%" },

  positionLabel: {
    position: "absolute", bottom: 60, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  positionLabelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  positionLabelText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  positionAngle: { color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  instructionBox: {
    position: "absolute", bottom: 28, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  instructionText: { color: "rgba(255,255,255,0.5)", fontSize: 12 },

  header: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "rgba(8,8,16,0.85)",
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  headerSub: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(201,162,39,0.1)", borderWidth: 1, borderColor: "rgba(201,162,39,0.2)",
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.gold },
  headerBadgeText: { color: COLORS.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },

  progressContainer: {
    position: "absolute",
    top: SCREEN_H * 0.55,
    left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#080810",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)" },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: COLORS.gold },
  progressText: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600" },

  bottomPanel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#080810",
    paddingTop: 16,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
    top: SCREEN_H * 0.55 + 38,
  },

  radarContainer: {
    width: 216, height: 216,
    alignSelf: "center",
    position: "relative",
    marginBottom: 12,
  },
  radarRing: {
    position: "absolute", inset: 0,
    borderRadius: 108, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  radarInnerRing: {
    position: "absolute", inset: 40,
    borderRadius: 68, borderWidth: 1,
    borderColor: "rgba(201,162,39,0.12)",
    borderStyle: "dashed",
  },
  radarCenter: {
    position: "absolute",
    top: 108 - 28, left: 108 - 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(201,162,39,0.08)",
    borderWidth: 1, borderColor: "rgba(201,162,39,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  radarCenterText: { color: COLORS.gold, fontSize: 18, fontWeight: "800" },
  radarCenterSub: { color: "rgba(255,255,255,0.3)", fontSize: 10 },

  radarDot: {
    position: "absolute", width: 32, height: 32,
    alignItems: "center", justifyContent: "center",
  },
  radarDotInner: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  radarDotCaptured: { backgroundColor: COLORS.gold },
  radarDotActive: { backgroundColor: "#fff" },
  radarDotEmpty: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  radarDotPip: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.3)" },

  positionScroll: { flexGrow: 0, marginBottom: 12 },
  positionChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  positionChipActive: { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" },
  positionChipDone: { backgroundColor: "rgba(201,162,39,0.08)", borderColor: "rgba(201,162,39,0.2)" },
  positionChipText: { color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "600" },
  positionChipTextActive: { color: "#fff" },
  positionChipTextDone: { color: COLORS.gold },

  captureRow: { alignItems: "center", marginBottom: 8 },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  shutterRing: {
    position: "absolute", width: 76, height: 76, borderRadius: 38,
    borderWidth: 2, borderColor: COLORS.gold,
    opacity: 0,
  },
  captureHint: {
    textAlign: "center", color: "rgba(255,255,255,0.25)",
    fontSize: 11, marginTop: 2,
  },

  submitBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.gold, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16,
  },
  submitBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },

  // Success screen
  successContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32,
  },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(201,162,39,0.1)", borderWidth: 2, borderColor: "rgba(201,162,39,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  successSub: { color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 4 },
  successVehicle: { color: COLORS.gold, fontSize: 13, fontWeight: "600", marginBottom: 20, textAlign: "center" },
  hashBox: {
    width: "100%", padding: 12, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  hashLabel: { color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  hashValue: {
    color: "rgba(52,211,153,0.7)", fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 16,
  },
  successStats: { flexDirection: "row", gap: 24, marginBottom: 32 },
  successStat: { alignItems: "center" },
  successStatValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  successStatLabel: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 },
  doneBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 14, width: "100%", alignItems: "center",
  },
  doneBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
});
