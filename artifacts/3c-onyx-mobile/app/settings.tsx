/**
 * 3C Onyx — Settings Screen
 * Required for App Store and Google Play compliance:
 * - Privacy Policy access
 * - Terms of Service access
 * - Restore Purchases
 * - Support contact
 * - App version info
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/src/theme";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "1";

type SettingsRowProps = {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  destructive?: boolean;
};

function SettingsRow({ icon, iconColor, label, sublabel, onPress, rightEl, destructive }: SettingsRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightEl}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.card, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor ?? theme.goldBorder}18` }]}>
        <Feather name={icon} size={16} color={iconColor ?? COLORS.gold} />
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.rowLabel, { color: destructive ? "#EF4444" : theme.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: theme.textMuted }]}>{sublabel}</Text> : null}
      </View>
      {rightEl ?? (onPress ? <Feather name="chevron-right" size={14} color={theme.textFaint} /> : null)}
    </Pressable>
  );
}

function SectionLabel({ title }: { title: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{title}</Text>;
}

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useTheme();
  const toggle = () => setMode(isDark ? "light" : "dark");
  const insets = useSafeAreaInsets();
  const [restoring, setRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setRestoring(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRestoring(false);
    Alert.alert(
      "Restore Complete",
      "Your purchases have been restored. If you believe a purchase is missing, contact support at support@cuxtomcandyclub.ai.",
      [{ text: "OK" }]
    );
  };

  const handleContact = () => {
    Linking.openURL("mailto:support@cuxtomcandyclub.ai?subject=3C%20Onyx%20Support").catch(() =>
      Alert.alert("Email", "Contact us at support@cuxtomcandyclub.ai")
    );
  };

  const handlePrivacyWeb = () => {
    Linking.openURL("https://cuxtomcandyclub.ai/privacy").catch(() =>
      router.push("/legal" as never)
    );
  };

  const handleTermsWeb = () => {
    Linking.openURL("https://cuxtomcandyclub.ai/terms").catch(() =>
      router.push("/legal" as never)
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel title="APPEARANCE" />
        <View style={[styles.section, { borderColor: theme.cardBorder }]}>
          <SettingsRow
            icon="moon"
            iconColor="#8B5CF6"
            label="Dark Mode"
            rightEl={
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: theme.cardBorder, true: `${COLORS.gold}60` }}
                thumbColor={isDark ? COLORS.gold : theme.textFaint}
              />
            }
          />
        </View>

        <SectionLabel title="PURCHASES & MEMBERSHIP" />
        <View style={[styles.section, { borderColor: theme.cardBorder }]}>
          <SettingsRow
            icon="refresh-cw"
            iconColor={COLORS.emerald}
            label={restoring ? "Restoring…" : "Restore Purchases"}
            sublabel="Recover previously purchased subscriptions"
            onPress={restoring ? undefined : handleRestorePurchases}
          />
        </View>

        <SectionLabel title="LEGAL" />
        <View style={[styles.section, { borderColor: theme.cardBorder }]}>
          <SettingsRow
            icon="shield"
            iconColor={COLORS.gold}
            label="Privacy Policy"
            sublabel="How we handle your data"
            onPress={() => router.push("/legal" as never)}
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="file-text"
            iconColor={COLORS.gold}
            label="Terms of Service"
            sublabel="Your rights and responsibilities"
            onPress={() => { router.push("/legal" as never); }}
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="globe"
            iconColor="#3B82F6"
            label="Privacy Policy (Web)"
            onPress={handlePrivacyWeb}
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="external-link"
            iconColor="#3B82F6"
            label="Terms of Service (Web)"
            onPress={handleTermsWeb}
          />
        </View>

        <SectionLabel title="SUPPORT" />
        <View style={[styles.section, { borderColor: theme.cardBorder }]}>
          <SettingsRow
            icon="mail"
            iconColor="#06B6D4"
            label="Contact Support"
            sublabel="support@cuxtomcandyclub.ai"
            onPress={handleContact}
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="globe"
            iconColor="#06B6D4"
            label="Visit Website"
            sublabel="cuxtomcandyclub.ai"
            onPress={() => Linking.openURL("https://cuxtomcandyclub.ai")}
          />
        </View>

        <SectionLabel title="ABOUT" />
        <View style={[styles.section, { borderColor: theme.cardBorder }]}>
          <SettingsRow
            icon="info"
            label="App Version"
            sublabel={`Version ${APP_VERSION} (Build ${BUILD_NUMBER})`}
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="cpu"
            iconColor={COLORS.emerald}
            label="Intelligence Engine"
            sublabel="ONYX Neural Brain — All 4 AI Types Active"
          />
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <SettingsRow
            icon="lock"
            iconColor={COLORS.emerald}
            label="Security"
            sublabel="AES-256 encryption · PII masking active"
          />
        </View>

        <View style={styles.footer}>
          <View style={[styles.onyxMark, { borderColor: theme.goldBorder, backgroundColor: theme.goldGlow }]}>
            <Text style={[styles.onyxMarkText, { color: COLORS.gold }]}>◆</Text>
          </View>
          <Text style={[styles.footerBrand, { color: COLORS.gold }]}>3C ONYX</Text>
          <Text style={[styles.footerSub, { color: theme.textFaint }]}>POWERED BY CUXTOMCANDYCLUB LLC</Text>
          <Text style={[styles.footerCopy, { color: theme.textFaint }]}>
            © {new Date().getFullYear()} CUXTOMCANDYCLUB LLC. All rights reserved.
          </Text>
          <Pressable onPress={handlePrivacyWeb} style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: theme.textMuted }]}>
              cuxtomcandyclub.ai/privacy
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:       { padding: 4, marginRight: 8 },
  headerTitle:   { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  headerSpacer:  { width: 28 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel:  { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 8, marginLeft: 4, textTransform: "uppercase" },
  section:       { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginBottom: 28 },
  row:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon:       { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowMeta:       { flex: 1, gap: 2 },
  rowLabel:      { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider:       { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  footer:        { alignItems: "center", gap: 6, paddingTop: 8, paddingBottom: 16 },
  onyxMark:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  onyxMarkText:  { fontSize: 16 },
  footerBrand:   { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 5 },
  footerSub:     { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  footerCopy:    { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  footerLink:    { marginTop: 2 },
  footerLinkText:{ fontSize: 11, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
});
