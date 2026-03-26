/**
 * 3C Onyx — VIN Digital Passport
 * Point at any VIN → get vehicle's complete digital history, AI summary
 * in English and Spanish, and chain-of-custody link.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/src/theme";

type VinPassport = {
  vin: string;
  make:       string | null;
  model:      string | null;
  year:       number | null;
  trim:       string | null;
  bodyClass:  string | null;
  driveType:  string | null;
  engineType: string | null;
  fuelType:   string | null;
  doors:      number | null;
  aiSummaryEn: string | null;
  aiSummaryEs: string | null;
  recallCount: number | null;
  hasOpenRecalls: boolean | null;
  blockchainHash: string | null;
};

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const { theme } = useTheme();
  if (!value) return null;
  return (
    <View style={fieldStyles.row}>
      <Text style={[fieldStyles.label, { color: theme.textFaint }]}>{label.toUpperCase()}</Text>
      <Text style={[fieldStyles.value, { color: theme.text }]}>{String(value)}</Text>
    </View>
  );
}
const fieldStyles = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  label: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, flex: 1 },
  value: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 2, textAlign: "right" },
});

export default function VinPassportScreen() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const [vin,     setVin]     = useState("");
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState<VinPassport | null>(null);
  const [lang,    setLang]    = useState<"en" | "es">("en");

  async function lookup() {
    const clean = vin.trim().toUpperCase();
    if (clean.length !== 17) {
      Alert.alert("Invalid VIN", "A VIN must be exactly 17 characters. Check the sticker on the driver-side door jamb or windshield.");
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const passport = await apiFetch<VinPassport>("/vin/passport", {
        method: "POST",
        body: JSON.stringify({ vin: clean }),
      });
      setData(passport);
    } catch (err) {
      Alert.alert("Lookup Failed", err instanceof Error ? err.message : "Could not decode this VIN.");
    } finally {
      setLoading(false);
    }
  }

  async function sharePassport() {
    if (!data) return;
    const summary = lang === "es" ? data.aiSummaryEs : data.aiSummaryEn;
    await Share.share({
      message: `🔑 3C ONYX — VIN Digital Passport\n\n${data.year} ${data.make} ${data.model}\nVIN: ${data.vin}\n\n${summary ?? ""}\n\nVerified by 3C ONYX Blockchain`,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>VIN Digital Passport</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={[styles.infoCard, { backgroundColor: `${COLORS.gold}10`, borderColor: `${COLORS.gold}25` }]}>
            <Text style={[styles.infoTitle, { color: COLORS.gold }]}>◆  ONYX Neural Decoder</Text>
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Enter any 17-character VIN. ONYX decodes it via the National Highway Traffic Safety Administration database, enriches it with AI summaries in English and Spanish, and anchors it to the immutable Chain-of-Custody ledger.
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>VEHICLE IDENTIFICATION NUMBER</Text>
          <View style={styles.vinRow}>
            <TextInput
              style={[styles.vinInput, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
              placeholder="1HGCM82633A123456"
              placeholderTextColor={theme.textFaint}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
              value={vin}
              onChangeText={v => setVin(v.toUpperCase())}
              onSubmitEditing={() => void lookup()}
              returnKeyType="search"
            />
            <Pressable
              style={[styles.lookupBtn, { backgroundColor: COLORS.gold, opacity: loading ? 0.7 : 1 }]}
              onPress={() => void lookup()}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#000" size="small" />
                : <Feather name="search" size={18} color="#000" />
              }
            </Pressable>
          </View>
          {vin.length > 0 && (
            <Text style={[styles.vinCounter, { color: vin.length === 17 ? COLORS.emerald : theme.textFaint }]}>
              {vin.length}/17 characters {vin.length === 17 ? "✓" : ""}
            </Text>
          )}

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.gold} size="large" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>Decoding VIN via NHTSA + ONYX Neural…</Text>
            </View>
          )}

          {data && !loading && (
            <>
              <View style={[styles.passportCard, { backgroundColor: theme.card, borderColor: COLORS.gold }]}>
                <View style={styles.passportHeader}>
                  <View>
                    <Text style={[styles.vehicleTitle, { color: theme.text }]}>
                      {data.year} {data.make} {data.model}
                    </Text>
                    {data.trim ? <Text style={[styles.vehicleTrim, { color: theme.textMuted }]}>{data.trim}</Text> : null}
                  </View>
                  {data.hasOpenRecalls ? (
                    <View style={[styles.recallBadge, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                      <Feather name="alert-triangle" size={12} color="#EF4444" />
                      <Text style={styles.recallText}>RECALL</Text>
                    </View>
                  ) : (
                    <View style={[styles.recallBadge, { backgroundColor: "rgba(52,211,153,0.12)" }]}>
                      <Feather name="check-circle" size={12} color={COLORS.emerald} />
                      <Text style={[styles.recallText, { color: COLORS.emerald }]}>CLEAN</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                <Field label="VIN"         value={data.vin} />
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <Field label="Body Class"  value={data.bodyClass} />
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <Field label="Engine"      value={data.engineType} />
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <Field label="Fuel"        value={data.fuelType} />
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <Field label="Drive"       value={data.driveType} />
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <Field label="Doors"       value={data.doors} />
              </View>

              {(data.aiSummaryEn || data.aiSummaryEs) && (
                <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: `${COLORS.gold}30` }]}>
                  <View style={styles.langRow}>
                    <Text style={[styles.aiLabel, { color: COLORS.gold }]}>◆  ONYX AI SUMMARY</Text>
                    <View style={styles.langToggle}>
                      {(["en", "es"] as const).map(l => (
                        <Pressable
                          key={l}
                          style={[styles.langBtn, { backgroundColor: lang === l ? `${COLORS.gold}22` : "transparent", borderColor: lang === l ? COLORS.gold : theme.cardBorder }]}
                          onPress={() => setLang(l)}
                        >
                          <Text style={[styles.langBtnText, { color: lang === l ? COLORS.gold : theme.textFaint }]}>{l.toUpperCase()}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.aiText, { color: theme.textMuted }]}>
                    {lang === "es" ? (data.aiSummaryEs ?? data.aiSummaryEn) : (data.aiSummaryEn ?? data.aiSummaryEs)}
                  </Text>
                </View>
              )}

              {data.blockchainHash && (
                <View style={[styles.ledgerCard, { backgroundColor: theme.card, borderColor: `${COLORS.emerald}30` }]}>
                  <Feather name="shield" size={14} color={COLORS.emerald} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ledgerTitle, { color: COLORS.emerald }]}>Chain-of-Custody Anchored</Text>
                    <Text style={[styles.ledgerHash, { color: theme.textFaint }]} numberOfLines={1}>
                      {data.blockchainHash.slice(0, 32)}…
                    </Text>
                  </View>
                </View>
              )}

              <Pressable style={[styles.shareBtn, { backgroundColor: COLORS.gold }]} onPress={() => void sharePassport()}>
                <Feather name="share-2" size={16} color="#000" />
                <Text style={styles.shareBtnText}>SHARE PASSPORT</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:       { padding: 4, marginRight: 8 },
  headerTitle:   { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSpacer:  { width: 28 },
  content:       { paddingHorizontal: 16, paddingTop: 20 },
  infoCard:      { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  infoTitle:     { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 8 },
  infoText:      { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },
  sectionLabel:  { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 8 },
  vinRow:        { flexDirection: "row", gap: 10, marginBottom: 6 },
  vinInput:      { flex: 1, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, fontSize: 15, fontFamily: "Inter_500Medium", letterSpacing: 2 },
  lookupBtn:     { width: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  vinCounter:    { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 20 },
  loadingBox:    { alignItems: "center", gap: 12, paddingVertical: 40 },
  loadingText:   { fontSize: 13, fontFamily: "Inter_400Regular" },
  passportCard:  { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  passportHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  vehicleTitle:  { fontSize: 20, fontFamily: "Inter_700Bold" },
  vehicleTrim:   { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  recallBadge:   { flexDirection: "row", gap: 4, alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recallText:    { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5, color: "#EF4444" },
  divider:       { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  aiCard:        { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  langRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  aiLabel:       { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  langToggle:    { flexDirection: "row", gap: 6 },
  langBtn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  langBtnText:   { fontSize: 10, fontFamily: "Inter_700Bold" },
  aiText:        { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },
  ledgerCard:    { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  ledgerTitle:   { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  ledgerHash:    { fontSize: 10, fontFamily: "Inter_400Regular" },
  shareBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 17, marginBottom: 12 },
  shareBtnText:  { fontSize: 14, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 1.5 },
});
