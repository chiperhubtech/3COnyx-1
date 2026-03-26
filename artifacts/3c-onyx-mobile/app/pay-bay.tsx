/**
 * 3C Onyx — Pay at the Bay
 * Specialists generate a QR code for on-site payments.
 * Platform auto-deducts 3% technology fee; 25% of fee routes to referring Runner.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
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
import { useAuth } from "@/lib/authStore";
import { useTheme } from "@/src/theme";

const SERVICES = [
  { id: "full_wrap",       label: "Full Vehicle Wrap",         emoji: "🎨" },
  { id: "partial_wrap",    label: "Partial Wrap",              emoji: "✏️" },
  { id: "ppf",             label: "Paint Protection Film",     emoji: "🛡️" },
  { id: "detail_basic",    label: "Basic Detail",              emoji: "🪣" },
  { id: "detail_full",     label: "Full Detail",               emoji: "✨" },
  { id: "ceramic",         label: "Ceramic Coating",           emoji: "💎" },
  { id: "tint",            label: "Window Tint",               emoji: "🪟" },
  { id: "fleet",           label: "Fleet Service",             emoji: "🚛" },
  { id: "custom",          label: "Custom Service",            emoji: "⚡" },
];

type BayQrResponse = {
  qrCode: string;
  stripePaymentUrl: string;
  grossAmountCents: number;
  feeSummary: { gross: string; fee: string; net: string; dividend: string };
  qrPayload: string;
};

export default function PayBayScreen() {
  const { theme } = useTheme();
  const { user }  = useAuth();
  const insets    = useSafeAreaInsets();

  const [serviceId,    setServiceId]    = useState("");
  const [amountStr,    setAmountStr]    = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicleVin,   setVehicleVin]   = useState("");
  const [notes,        setNotes]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<BayQrResponse | null>(null);

  const selectedService = SERVICES.find(s => s.id === serviceId);
  const grossCents      = Math.round(parseFloat(amountStr || "0") * 100);
  const feeCents        = Math.round(grossCents * 0.03);
  const netCents        = grossCents - feeCents;
  const divCents        = Math.round(feeCents * 0.25);

  async function generateQR() {
    if (!serviceId)         { Alert.alert("Select a Service", "Choose the service type first."); return; }
    if (grossCents < 100)   { Alert.alert("Amount Required", "Enter an amount of at least $1.00."); return; }
    if (!customerName.trim()){ Alert.alert("Customer Name", "Enter the customer's name."); return; }
    setLoading(true);
    try {
      const data = await apiFetch<BayQrResponse>("/bay/qr", {
        method: "POST",
        body: JSON.stringify({
          serviceType:      serviceId,
          serviceLabel:     selectedService?.label ?? serviceId,
          grossAmountCents: grossCents,
          vehicleVin:       vehicleVin.trim().toUpperCase() || undefined,
          customerName:     customerName.trim(),
          notes:            notes.trim() || undefined,
        }),
      });
      setResult(data);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not generate QR code.");
    } finally {
      setLoading(false);
    }
  }

  async function sharePayment() {
    if (!result) return;
    await Share.share({
      message: `Pay ${result.feeSummary.gross} for your ${selectedService?.label ?? "service"} at 3C ONYX.\n\nTap to pay securely:\n${result.stripePaymentUrl}`,
      url:     result.stripePaymentUrl,
    });
  }

  function reset() { setResult(null); setAmountStr(""); setCustomerName(""); setVehicleVin(""); setNotes(""); }

  if (result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>QR Ready</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.qrCard, { backgroundColor: "#fff", borderColor: theme.goldBorder }]}>
            <QRCode
              value={result.stripePaymentUrl}
              size={220}
              color="#000"
              backgroundColor="#fff"
              logo={undefined}
            />
          </View>

          <View style={[styles.codeBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.codeLabel, { color: theme.textFaint }]}>TRANSACTION CODE</Text>
            <Text style={[styles.codeValue, { color: COLORS.gold }]}>{result.qrCode}</Text>
          </View>

          <View style={[styles.feeCard, { backgroundColor: theme.card, borderColor: theme.goldBorder }]}>
            <Text style={[styles.feeTitle, { color: COLORS.gold }]}>3% TECHNOLOGY FEE BREAKDOWN</Text>
            {[
              { label: "Service Total",   value: result.feeSummary.gross,    color: theme.text },
              { label: "Platform Fee (3%)",value: result.feeSummary.fee,    color: "#F59E0B" },
              { label: "Your Net",         value: result.feeSummary.net,    color: COLORS.emerald },
              { label: "Runner Dividend",  value: result.feeSummary.dividend,color: "#8B5CF6" },
            ].map(row => (
              <View key={row.label} style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textMuted }]}>{row.label}</Text>
                <Text style={[styles.feeValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          <Pressable style={[styles.shareBtn, { backgroundColor: COLORS.gold }]} onPress={() => void sharePayment()}>
            <Feather name="share-2" size={16} color="#000" />
            <Text style={styles.shareBtnText}>SHARE PAYMENT LINK</Text>
          </Pressable>

          <Pressable style={[styles.resetBtn, { borderColor: theme.cardBorder }]} onPress={reset}>
            <Text style={[styles.resetBtnText, { color: theme.textMuted }]}>Generate New QR</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Pay at the Bay</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.infoCard, { backgroundColor: `${COLORS.gold}12`, borderColor: `${COLORS.gold}30` }]}>
            <Feather name="zap" size={14} color={COLORS.gold} />
            <Text style={[styles.infoText, { color: COLORS.gold }]}>
              Platform deducts 3% automatically. 25% of the fee flows to your referring Runner as a dividend. Zero friction — scan, pay, done.
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SERVICE TYPE</Text>
          <View style={[styles.serviceGrid, { gap: 8 }]}>
            {SERVICES.map(svc => (
              <Pressable
                key={svc.id}
                style={[
                  styles.serviceChip,
                  { backgroundColor: theme.card, borderColor: serviceId === svc.id ? COLORS.gold : theme.cardBorder },
                ]}
                onPress={() => setServiceId(svc.id)}
              >
                <Text style={styles.serviceEmoji}>{svc.emoji}</Text>
                <Text style={[styles.serviceLabel, { color: serviceId === svc.id ? COLORS.gold : theme.text }]}>{svc.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SERVICE TOTAL ($)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            placeholder="0.00"
            placeholderTextColor={theme.textFaint}
            keyboardType="decimal-pad"
            value={amountStr}
            onChangeText={setAmountStr}
          />

          {grossCents >= 100 && (
            <View style={[styles.previewCard, { backgroundColor: `${COLORS.emerald}10`, borderColor: `${COLORS.emerald}25` }]}>
              <Text style={[styles.previewText, { color: COLORS.emerald }]}>
                You receive: ${(netCents / 100).toFixed(2)}  ·  Fee: ${(feeCents / 100).toFixed(2)}  ·  Runner gets: ${(divCents / 100).toFixed(2)}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>CUSTOMER NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            placeholder="John Smith"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="words"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>VEHICLE VIN (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }]}
            placeholder="1HGCM82633A123456"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            value={vehicleVin}
            onChangeText={v => setVehicleVin(v.toUpperCase())}
          />

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NOTES (optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text, minHeight: 80 }]}
            placeholder="e.g. Full wrap Mustang GT — delivery by Thursday"
            placeholderTextColor={theme.textFaint}
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <Pressable
            style={[styles.generateBtn, { backgroundColor: COLORS.gold, opacity: loading ? 0.7 : 1 }]}
            onPress={() => void generateQR()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <>
                  <Feather name="grid" size={16} color="#000" />
                  <Text style={styles.generateBtnText}>GENERATE QR CODE</Text>
                </>
            }
          </Pressable>

          <Text style={[styles.footerNote, { color: theme.textFaint }]}>
            Signed in as {user?.name ?? "Specialist"} · Payments powered by 3C Platform Services
          </Text>
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
  infoCard:      { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 24, alignItems: "flex-start" },
  infoText:      { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_500Medium" },
  sectionLabel:  { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  serviceGrid:   { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  serviceChip:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  serviceEmoji:  { fontSize: 16 },
  serviceLabel:  { fontSize: 13, fontFamily: "Inter_500Medium" },
  input:         { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16 },
  previewCard:   { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  previewText:   { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  generateBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 17, marginTop: 8 },
  generateBtnText:{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 1.5 },
  footerNote:    { fontSize: 11, textAlign: "center", marginTop: 16, fontFamily: "Inter_400Regular" },
  qrCard:        { alignSelf: "center", padding: 24, borderRadius: 20, borderWidth: 1.5, marginBottom: 20, marginTop: 8 },
  codeBox:       { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 16, alignItems: "center" },
  codeLabel:     { fontSize: 10, letterSpacing: 1.5, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  codeValue:     { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  feeCard:       { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  feeTitle:      { fontSize: 10, letterSpacing: 1.5, fontFamily: "Inter_700Bold", marginBottom: 12, textAlign: "center" },
  feeRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  feeLabel:      { fontSize: 14, fontFamily: "Inter_400Regular" },
  feeValue:      { fontSize: 14, fontFamily: "Inter_700Bold" },
  shareBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 17, marginBottom: 12 },
  shareBtnText:  { fontSize: 14, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 1.5 },
  resetBtn:      { borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  resetBtnText:  { fontSize: 14, fontFamily: "Inter_500Medium" },
});
