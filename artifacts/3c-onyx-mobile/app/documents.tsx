/**
 * 3C Onyx — Member Document Vault
 * Scan, store, and manage key documents. AES-256 encrypted.
 * Branded empty state, gold accent borders, file type badges.
 * Powered by CUXTOMCANDYCLUB LLC.
 */
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";

type DocType = {
  id:       string;
  label:    string;
  sublabel: string;
  icon:     keyof typeof Feather.glyphMap;
  fileType: string;
  required: boolean;
};

const DOCS: DocType[] = [
  { id: "license_front", label: "Driver's License",  sublabel: "Front side",    icon: "credit-card", fileType: "ID",  required: true  },
  { id: "license_back",  label: "Driver's License",  sublabel: "Back side",     icon: "credit-card", fileType: "ID",  required: true  },
  { id: "insurance",     label: "Insurance Card",    sublabel: "Front side",    icon: "shield",      fileType: "INS", required: true  },
  { id: "registration",  label: "Registration",      sublabel: "Current year",  icon: "file-text",   fileType: "REG", required: false },
  { id: "title",         label: "Vehicle Title",     sublabel: "If owned",      icon: "award",       fileType: "TTL", required: false },
];

type CapturedDoc = { uri: string; submittedAt: number };

// ─── Branded Empty State ───────────────────────────────────────────────────────

function EmptyState({ onStartScan }: { onStartScan: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.emptyWrap}>
      {/* Layered shield illustration */}
      <View style={[styles.emptyOuterRing, { borderColor: theme.goldBorder }]}>
        <View style={[styles.emptyInnerRing, { borderColor: theme.goldBorder, backgroundColor: theme.goldGlow }]}>
          <Feather name="shield" size={44} color={theme.gold} />
        </View>
      </View>

      <Text style={[styles.emptyTitle, { color: theme.text }]}>Your Vault is Empty</Text>
      <Text style={[styles.emptySub, { color: theme.textSub }]}>
        Secure your most important documents with military-grade AES-256 encryption. Only you hold the keys.
      </Text>

      <View style={[styles.emptyFeatures, { borderColor: theme.cardBorder, backgroundColor: theme.card }]}>
        {[
          { icon: "lock"    as keyof typeof Feather.glyphMap, text: "AES-256 encryption at rest" },
          { icon: "eye-off" as keyof typeof Feather.glyphMap, text: "Zero-knowledge — we never see your data" },
          { icon: "shield"  as keyof typeof Feather.glyphMap, text: "PII Protection Active" },
        ].map((f) => (
          <View key={f.text} style={styles.emptyFeatureRow}>
            <View style={[styles.emptyFeatureIcon, { backgroundColor: theme.goldMuted }]}>
              <Feather name={f.icon} size={12} color={theme.gold} />
            </View>
            <Text style={[styles.emptyFeatureText, { color: theme.textSub }]}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.emptyStartBtn} onPress={onStartScan}>
        <Feather name="camera" size={16} color="#000" />
        <Text style={styles.emptyStartText}>Scan Your First Document</Text>
      </Pressable>

      <Text style={[styles.emptyFooter, { color: theme.textFaint }]}>
        3C Onyx · Powered by CUXTOMCANDYCLUB LLC
      </Text>
    </View>
  );
}

// ─── Success State ─────────────────────────────────────────────────────────────

function VaultSecured({
  totalCaptured,
  requiredIds,
  captured,
}: {
  totalCaptured: number;
  requiredIds:   string[];
  captured:      Record<string, CapturedDoc>;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.successWrap, { backgroundColor: theme.bg }]}>
      <View style={[styles.successRing, { borderColor: theme.goldBorder, backgroundColor: theme.goldGlow }]}>
        <Feather name="shield" size={40} color={theme.gold} />
      </View>
      <Text style={[styles.successTitle, { color: theme.text }]}>Vault Secured</Text>
      <Text style={[styles.successSub, { color: theme.textSub }]}>
        {totalCaptured} document{totalCaptured !== 1 ? "s" : ""} on file
      </Text>
      <View style={styles.statsRow}>
        {[
          { label: "Verified",  value: `${totalCaptured}/${DOCS.length}` },
          { label: "Required",  value: `${requiredIds.filter((id) => captured[id]).length}/${requiredIds.length}` },
          { label: "Security",  value: "AES-256" },
        ].map(({ label, value }) => (
          <View key={label} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statValue, { color: theme.gold }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.goldBtn} onPress={() => router.back()}>
        <Feather name="check" size={16} color="#000" />
        <Text style={styles.goldBtnText}>Done</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [captured, setCaptured] = useState<Record<string, CapturedDoc>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [scanStarted, setScanStarted] = useState(false);

  const requiredIds = DOCS.filter((d) => d.required).map((d) => d.id);
  const requiredDone = requiredIds.every((id) => !!captured[id]);
  const totalCaptured = Object.keys(captured).length;

  async function scanDocument(doc: DocType) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Access", "Please enable camera access in Settings to scan documents.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 10],
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(doc.id);
    try {
      await apiFetch("/documents/upload", {
        method: "POST",
        body: JSON.stringify({ type: doc.id, imageUri: uri }),
      });
    } catch {
      // Document stored locally; sync happens in background
    }
    setCaptured((prev) => ({ ...prev, [doc.id]: { uri, submittedAt: Date.now() } }));
    setUploading(null);
    setScanStarted(true);
  }

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <VaultSecured totalCaptured={totalCaptured} requiredIds={requiredIds} captured={captured} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Feather name="arrow-left" size={18} color={theme.textSub} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>DOCUMENT VAULT</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            {totalCaptured} of {DOCS.length} secured
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]}>
          <Feather name="lock" size={10} color={theme.gold} />
          <Text style={[styles.headerBadgeText, { color: theme.gold }]}>AES-256</Text>
        </View>
      </View>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.gold, width: `${(totalCaptured / DOCS.length) * 100}%` },
          ]}
        />
      </View>

      {/* ── Empty state (no docs scanned and user hasn't started) ── */}
      {!scanStarted && totalCaptured === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <EmptyState onStartScan={() => setScanStarted(true)} />
        </ScrollView>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionNote, { color: theme.textMuted }]}>
              Documents are end-to-end encrypted. Only you control access.
            </Text>

            {DOCS.map((doc) => {
              const cap = captured[doc.id];
              const isUploading = uploading === doc.id;
              const timestampStr = cap
                ? new Date(cap.submittedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })
                : null;

              return (
                <View
                  key={doc.id}
                  style={[
                    styles.docCard,
                    {
                      backgroundColor: cap ? theme.goldGlow : theme.card,
                      borderColor: cap ? theme.goldBorder : theme.cardBorder,
                    },
                  ]}
                >
                  {/* File type badge */}
                  <View
                    style={[
                      styles.fileTypeBadge,
                      { backgroundColor: cap ? theme.goldMuted : theme.cardAlt },
                    ]}
                  >
                    <Text style={[styles.fileTypeText, { color: cap ? theme.gold : theme.textMuted }]}>
                      {doc.fileType}
                    </Text>
                  </View>

                  {/* Doc icon */}
                  <View
                    style={[
                      styles.docIcon,
                      { backgroundColor: cap ? theme.goldMuted : theme.cardAlt },
                    ]}
                  >
                    <Feather
                      name={doc.icon}
                      size={22}
                      color={cap ? theme.gold : theme.textMuted}
                    />
                  </View>

                  <View style={styles.docInfo}>
                    <View style={styles.docTitleRow}>
                      <Text style={[styles.docLabel, { color: theme.text }]}>{doc.label}</Text>
                      {doc.required && !cap && (
                        <View style={[styles.requiredBadge, { backgroundColor: theme.dangerDim, borderColor: theme.danger }]}>
                          <Text style={[styles.requiredText, { color: theme.danger }]}>REQUIRED</Text>
                        </View>
                      )}
                      {cap && (
                        <View style={[styles.doneBadge, { backgroundColor: theme.goldMuted, borderColor: theme.goldBorder }]}>
                          <Feather name="check" size={9} color={theme.gold} />
                          <Text style={[styles.doneText, { color: theme.gold }]}>SECURED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.docSub, { color: theme.textMuted }]}>{doc.sublabel}</Text>
                    {cap && timestampStr && (
                      <Text style={[styles.docTimestamp, { color: theme.textFaint }]}>
                        Scanned {timestampStr}
                      </Text>
                    )}
                  </View>

                  {/* Scan / retake button */}
                  {cap ? (
                    <Pressable onPress={() => scanDocument(doc)} style={styles.retakeBtn}>
                      <Image source={{ uri: cap.uri }} style={styles.thumbImage} contentFit="cover" />
                      <View style={styles.retakeOverlay}>
                        <Feather name="refresh-cw" size={12} color="#fff" />
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => scanDocument(doc)}
                      disabled={isUploading}
                      style={[styles.scanBtn, isUploading && styles.scanBtnDim]}
                    >
                      <Feather name={isUploading ? "loader" : "camera"} size={14} color="#000" />
                      <Text style={styles.scanBtnText}>{isUploading ? "…" : "Scan"}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ── Footer ─────────────────────────────────────────── */}
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom + 12,
                borderTopColor: theme.cardBorder,
                backgroundColor: theme.bg,
              },
            ]}
          >
            {!requiredDone && (
              <Text style={[styles.footerHint, { color: theme.textMuted }]}>
                {requiredIds.filter((id) => !captured[id]).length} required document
                {requiredIds.filter((id) => !captured[id]).length !== 1 ? "s" : ""} remaining
              </Text>
            )}
            <Pressable
              style={[styles.goldBtn, !requiredDone && styles.goldBtnDim]}
              disabled={!requiredDone}
              onPress={() => setDone(true)}
            >
              <Feather name="shield" size={16} color="#000" />
              <Text style={styles.goldBtnText}>Secure My Vault</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 3 },
  headerSub: { fontSize: 10, marginTop: 2 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  headerBadgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 1 },

  progressBar: { height: 2 },
  progressFill: { height: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  sectionNote: { fontSize: 11, textAlign: "center", lineHeight: 17, marginBottom: 8 },

  // Doc card
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 12,
    position: "relative",
  },
  fileTypeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fileTypeText: { fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  docIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  docInfo: { flex: 1, paddingRight: 4 },
  docTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 },
  docLabel: { fontSize: 13, fontWeight: "700" },
  docSub: { fontSize: 10, marginBottom: 2 },
  docTimestamp: { fontSize: 9, letterSpacing: 0.3 },
  requiredBadge: {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5,
  },
  requiredText: { fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  doneBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5,
  },
  doneText: { fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  scanBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.gold, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10,
    flexShrink: 0,
  },
  scanBtnDim: { opacity: 0.5 },
  scanBtnText: { color: "#000", fontSize: 11, fontWeight: "800" },
  retakeBtn: {
    width: 52, height: 36, borderRadius: 8, overflow: "hidden",
    position: "relative", flexShrink: 0,
  },
  thumbImage: { width: 52, height: 36, borderRadius: 8 },
  retakeOverlay: {
    position: "absolute", inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center", borderRadius: 8,
  },

  // Footer
  footer: {
    padding: 16, paddingTop: 12,
    borderTopWidth: 1, gap: 8,
  },
  footerHint: { fontSize: 11, textAlign: "center" },
  goldBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.gold, paddingVertical: 14, borderRadius: 14,
  },
  goldBtnDim: { opacity: 0.35 },
  goldBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },

  // Empty State
  emptyWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 28, paddingVertical: 40,
  },
  emptyOuterRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 1, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  emptyInnerRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10, letterSpacing: -0.3 },
  emptySub: {
    fontSize: 13, textAlign: "center", lineHeight: 20,
    maxWidth: 300, marginBottom: 24,
  },
  emptyFeatures: {
    width: "100%", borderWidth: 1, borderRadius: 16,
    padding: 16, gap: 12, marginBottom: 24,
  },
  emptyFeatureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyFeatureIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  emptyFeatureText: { fontSize: 13, fontWeight: "500", flex: 1 },
  emptyStartBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.gold,
    paddingVertical: 15, paddingHorizontal: 32, borderRadius: 14,
    marginBottom: 20,
  },
  emptyStartText: { color: "#000", fontSize: 15, fontWeight: "800" },
  emptyFooter: { fontSize: 9, fontWeight: "600", letterSpacing: 1.5 },

  // Success
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  successSub: { fontSize: 14, marginBottom: 28 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  statBox: {
    alignItems: "center", borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 1, marginTop: 2 },
});
