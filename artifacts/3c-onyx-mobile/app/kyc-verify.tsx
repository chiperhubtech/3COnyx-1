/**
 * 3C Onyx — KYC Verification Screen
 * Stripe Identity integration — required before Dynasty Wallet high-ticket
 * B2B transactions or financial underwriting.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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

type KycStatus = {
  status:         "NOT_STARTED" | "PENDING" | "REQUIRES_INPUT" | "VERIFIED" | "FAILED";
  verified:       boolean;
  documentType?:  string;
  issuingCountry?:string;
  verifiedAt?:    string;
  failureReason?: string;
};

type KycSession = {
  alreadyVerified?: boolean;
  sessionId?:       string;
  clientSecret?:    string;
  simulated?:       boolean;
  status?:          string;
  url?:             string;
};

const STATUS_CONFIG = {
  NOT_STARTED:    { icon: "user-check" as const, color: COLORS.gold,     label: "Identity Not Verified",   sub: "Complete verification to unlock full Dynasty Wallet access." },
  PENDING:        { icon: "clock"      as const, color: "#F59E0B",        label: "Verification In Progress", sub: "Stripe is reviewing your documents. Usually takes 1-2 minutes." },
  REQUIRES_INPUT: { icon: "alert-circle" as const, color: "#EF4444",     label: "Action Required",          sub: "Additional information needed. Tap below to continue." },
  VERIFIED:       { icon: "shield"     as const, color: COLORS.emerald,   label: "Identity Verified",        sub: "Your identity is confirmed. Full Dynasty Wallet access granted." },
  FAILED:         { icon: "x-circle"  as const, color: "#EF4444",        label: "Verification Failed",      sub: "We could not verify your identity. Contact support@cuxtomcandyclub.ai." },
};

export default function KycVerifyScreen() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const [loading, setLoading]   = useState(false);
  const [status,  setStatus]    = useState<KycStatus | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    setFetching(true);
    try {
      const s = await apiFetch<KycStatus>("/kyc/status");
      setStatus(s);
    } catch { /* not authenticated or no status */ }
    finally { setFetching(false); }
  }

  async function startVerification() {
    setLoading(true);
    try {
      const session = await apiFetch<KycSession>("/kyc/session", { method: "POST" });

      if (session.alreadyVerified) {
        Alert.alert("Already Verified", "Your identity is confirmed. ✓");
        void loadStatus();
        return;
      }

      if (session.simulated) {
        Alert.alert(
          "Simulated Mode",
          "Stripe Identity is not yet configured. In production, the Stripe Identity flow will open here. Your session ID has been recorded.",
          [{ text: "OK", onPress: () => void loadStatus() }],
        );
        return;
      }

      // Open Stripe Identity web flow
      if (session.url) {
        await Linking.openURL(session.url);
      } else {
        Alert.alert("KYC Session", `Session created: ${session.sessionId ?? "unknown"}. In production, the native Stripe Identity SDK would open here.`);
      }
      void loadStatus();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not start KYC verification.");
    } finally {
      setLoading(false);
    }
  }

  const cfg = STATUS_CONFIG[status?.status ?? "NOT_STARTED"];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Identity Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Status card */}
        {fetching ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading status…</Text>
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}30` }]}>
            <View style={[styles.statusIcon, { backgroundColor: `${cfg.color}20` }]}>
              <Feather name={cfg.icon} size={32} color={cfg.color} />
            </View>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={[styles.statusSub, { color: theme.textMuted }]}>{cfg.sub}</Text>
            {status?.verifiedAt && (
              <Text style={[styles.verifiedAt, { color: theme.textFaint }]}>
                Verified {new Date(status.verifiedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Why KYC */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: COLORS.gold }]}>◆  WHY KYC IS REQUIRED</Text>
          {[
            { icon: "dollar-sign", text: "Transactions above $600/year require identity verification per IRS/FinCEN regulations." },
            { icon: "shield",      text: "KYC protects the platform and all 132M members from fraud and money laundering." },
            { icon: "lock",        text: "Your document data is processed exclusively by Stripe Identity — never stored by 3C ONYX." },
            { icon: "award",       text: "Verified members unlock full Dynasty Wallet access and B2B underwriting." },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Feather name={item.icon as never} size={14} color={COLORS.gold} style={{ marginTop: 1 }} />
              <Text style={[styles.infoText, { color: theme.textMuted }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* What Stripe needs */}
        <View style={[styles.docsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: theme.textMuted }]}>ACCEPTED DOCUMENTS</Text>
          {[
            { doc: "Driver's License", flag: "🇺🇸" },
            { doc: "Passport",         flag: "🌍" },
            { doc: "Government ID",    flag: "🪪" },
          ].map(d => (
            <View key={d.doc} style={styles.docRow}>
              <Text style={styles.docFlag}>{d.flag}</Text>
              <Text style={[styles.docLabel, { color: theme.text }]}>{d.doc}</Text>
              <Feather name="check" size={14} color={COLORS.emerald} />
            </View>
          ))}
        </View>

        {/* CTA */}
        {!fetching && status?.status !== "VERIFIED" && (
          <Pressable
            style={[styles.ctaBtn, { backgroundColor: COLORS.gold, opacity: loading ? 0.7 : 1 }]}
            onPress={() => void startVerification()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <>
                  <Feather name="user-check" size={16} color="#000" />
                  <Text style={styles.ctaBtnText}>
                    {status?.status === "PENDING" ? "CHECK STATUS" : "START VERIFICATION"}
                  </Text>
                </>
            }
          </Pressable>
        )}

        <Text style={[styles.footerNote, { color: theme.textFaint }]}>
          Powered by Stripe Identity · CCPA / GDPR compliant · Documents never stored by 3C ONYX
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSpacer: { width: 28 },
  content:      { paddingHorizontal: 16, paddingTop: 20 },
  loadingBox:   { alignItems: "center", gap: 12, paddingVertical: 40 },
  loadingText:  { fontSize: 13, fontFamily: "Inter_400Regular" },
  statusCard:   { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", marginBottom: 20 },
  statusIcon:   { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  statusLabel:  { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  statusSub:    { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center" },
  verifiedAt:   { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8 },
  infoCard:     { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 16 },
  infoTitle:    { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 14 },
  infoRow:      { flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "flex-start" },
  infoText:     { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  docsCard:     { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 20 },
  docRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  docFlag:      { fontSize: 20 },
  docLabel:     { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  ctaBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 17, marginBottom: 16 },
  ctaBtnText:   { fontSize: 14, fontFamily: "Inter_700Bold", color: "#000", letterSpacing: 1.5 },
  footerNote:   { fontSize: 11, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 18 },
});
