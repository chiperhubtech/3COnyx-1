/**
 * 3C Onyx — Ecosystem Hub
 * The automotive super-app marketplace. Every service. Every provider.
 * From roadside emergencies to car rentals to finding any shop in America.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/src/theme";

type EcoCategory = {
  id:    string;
  label: string;
  sub:   string;
  icon:  keyof typeof Feather.glyphMap;
  color: string;
  route: string;
  badge?: string;
};

type EcoPartner = {
  name:    string;
  logo:    string;
  tier:    "FOUNDING" | "PREMIER" | "PARTNER";
  domain:  string;
};

const CATEGORIES: EcoCategory[] = [
  // ─── Emergency ─────────────────────────────────────────────────────────────
  { id: "roadside",     label: "Roadside Assistance",    sub: "3C Roadside · 50 States",            icon: "alert-triangle", color: "#EF4444", route: "/roadside",  badge: "24/7" },
  { id: "towing",       label: "Towing Services",         sub: "Find tow companies near you",        icon: "truck",          color: "#F97316", route: "/nearby?category=towing" },
  // ─── Mobility ──────────────────────────────────────────────────────────────
  { id: "rentals",      label: "Car Rentals",             sub: "30+ providers · Best rates",          icon: "key",            color: "#3B82F6", route: "/rentals",   badge: "NEW" },
  // ─── Maintenance & Repair ──────────────────────────────────────────────────
  { id: "repair",       label: "Auto Repair",             sub: "Find trusted shops near you",         icon: "tool",           color: COLORS.gold, route: "/nearby?category=repair" },
  { id: "detail",       label: "Detailing & Wash",        sub: "Mobile & in-bay services",            icon: "droplet",        color: "#06B6D4", route: "/nearby?category=detail" },
  { id: "smog",         label: "Smog & Inspections",      sub: "Pass or pre-check",                   icon: "check-circle",   color: "#10B981", route: "/nearby?category=smog" },
  // ─── Buying & Selling ──────────────────────────────────────────────────────
  { id: "dealer",       label: "New & Used Dealers",      sub: "Franchise & independent",             icon: "shopping-bag",   color: COLORS.gold, route: "/(tabs)/marketplace" },
  { id: "auction",      label: "Auto Auctions",           sub: "Live & simulcast auctions",           icon: "award",          color: "#F59E0B", route: "/nearby?category=auction" },
  { id: "parts",        label: "Auto Parts",              sub: "AutoZone, O'Reilly & more",           icon: "package",        color: "#64748B", route: "/nearby?category=parts" },
  // ─── Insurance & Finance ───────────────────────────────────────────────────
  { id: "insurance",    label: "Auto Insurance",          sub: "Compare rates instantly",             icon: "shield",         color: COLORS.emerald, route: "/nearby?category=insurance" },
  // ─── Fuel & Charging ───────────────────────────────────────────────────────
  { id: "gas",          label: "Gas Stations",            sub: "Find cheapest nearby",                icon: "zap",            color: "#F59E0B", route: "/nearby?category=gas" },
  { id: "ev_charging",  label: "EV Charging",             sub: "Tesla, ChargePoint, EVgo",            icon: "battery",        color: "#10B981", route: "/nearby?category=ev_charging" },
  // ─── Specialty ─────────────────────────────────────────────────────────────
  { id: "wrap_tint",    label: "Wraps & Tint",            sub: "Visual customization studios",        icon: "layers",         color: "#EC4899", route: "/nearby?category=repair" },
  { id: "aftermarket",  label: "Audio & Electronics",     sub: "Installation & upgrade shops",        icon: "headphones",     color: "#A78BFA", route: "/aftermarket" },
];

const PARTNERS: EcoPartner[] = [
  { name: "3C Roadside",     logo: "🚨", tier: "FOUNDING", domain: "3conyx.com/roadside"  },
  { name: "3C Rentals",      logo: "🔑", tier: "FOUNDING", domain: "3conyx.com/rentals"   },
  { name: "3C Locate",       logo: "📍", tier: "FOUNDING", domain: "3conyx.com/locate"    },
  { name: "3C Connected",    logo: "🚗", tier: "PREMIER",  domain: "3conyx.com/connected" },
  { name: "3C Market Intel",  logo: "📊", tier: "PREMIER",  domain: "3conyx.com/search"    },
  { name: "3C Pay",           logo: "💳", tier: "PREMIER",  domain: "3conyx.com/pay"       },
];

function CategoryCard({ cat }: { cat: EcoCategory }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => router.push(cat.route as never)}
      style={({ pressed }) => [
        styles.catCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={[styles.catIconWrap, { backgroundColor: `${cat.color}15` }]}>
        <Feather name={cat.icon} size={20} color={cat.color} />
      </View>
      <View style={styles.catMeta}>
        <Text style={[styles.catLabel, { color: theme.text }]}>{cat.label}</Text>
        <Text style={[styles.catSub, { color: theme.textMuted }]}>{cat.sub}</Text>
      </View>
      {cat.badge && (
        <View style={[styles.catBadge, { backgroundColor: `${cat.color}18`, borderColor: `${cat.color}30` }]}>
          <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={14} color={theme.textFaint} />
    </Pressable>
  );
}

function PartnerBadge({ p }: { p: EcoPartner }) {
  const { theme } = useTheme();
  const tierColor = p.tier === "FOUNDING" ? COLORS.gold : p.tier === "PREMIER" ? COLORS.emerald : theme.textMuted;
  return (
    <Pressable
      onPress={() => Linking.openURL(`https://${p.domain}`)}
      style={[styles.partnerBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
    >
      <Text style={styles.partnerLogo}>{p.logo}</Text>
      <View>
        <Text style={[styles.partnerName, { color: theme.text }]}>{p.name}</Text>
        <Text style={[styles.partnerTier, { color: tierColor }]}>{p.tier}</Text>
      </View>
    </Pressable>
  );
}

export default function EcosystemScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>3C ECOSYSTEM</Text>
          <Text style={[styles.headerSub, { color: theme.gold }]}>EVERY AUTOMOTIVE SERVICE</Text>
        </View>
        <Pressable onPress={() => router.push("/nearby" as never)} style={[styles.searchBtn, { backgroundColor: theme.goldMuted }]}>
          <Feather name="search" size={16} color={theme.gold} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]}>
          <View style={styles.heroLeft}>
            <Text style={[styles.heroEyebrow, { color: theme.gold }]}>POWERED BY CUXTOMCANDYCLUB LLC</Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Every Automotive Service.{"\n"}One Platform.
            </Text>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>
              Roadside • Rentals • Business Locator • Dealer Connect • Insurance • Parts & More
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: theme.goldMuted }]}>
            <Text style={styles.heroEmoji}>🌐</Text>
          </View>
        </View>

        {/* Emergency strip */}
        <Pressable
          onPress={() => router.push("/roadside" as never)}
          style={[styles.emergencyStrip, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}
        >
          <View style={[styles.emergencyIcon, { backgroundColor: "#EF444420" }]}>
            <Feather name="alert-triangle" size={20} color="#EF4444" />
          </View>
          <View style={styles.emergencyText}>
            <Text style={styles.emergencyTitle}>Need Roadside Help Right Now?</Text>
            <Text style={styles.emergencySub}>3C Roadside — Flat tire, battery, towing, lockout, fuel • 24/7</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#EF4444" />
        </Pressable>

        {/* Category grid */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ALL SERVICES</Text>
        <View style={styles.catList}>
          {CATEGORIES.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
        </View>

        {/* Technology partners */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TECHNOLOGY PARTNERS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
          {PARTNERS.map((p) => <PartnerBadge key={p.name} p={p} />)}
        </ScrollView>

        {/* Business CTA */}
        <View style={[styles.bizCta, { backgroundColor: theme.card, borderColor: theme.goldBorder }]}>
          <View style={styles.bizCtaLeft}>
            <Text style={[styles.bizCtaTitle, { color: theme.text }]}>Are you an automotive business?</Text>
            <Text style={[styles.bizCtaSub, { color: theme.textMuted }]}>
              Any size. Any specialty. Any location. Join the 3C Ecosystem and connect with our consumer network.
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL("https://3conyx.com/business")}
            style={[styles.bizCtaBtn, { backgroundColor: COLORS.gold }]}
          >
            <Text style={styles.bizCtaBtnText}>Join</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: theme.textFaint }]}>
          3C Onyx · Powered by CUXTOMCANDYCLUB LLC · All automotive partners independently operated
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  scroll:           { flex: 1 },
  header:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  backBtn:          { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter:     { flex: 1, alignItems: "center" },
  headerTitle:      { fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  headerSub:        { fontSize: 8, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  searchBtn:        { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroBanner:       { margin: 16, borderRadius: 20, padding: 20, borderWidth: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroLeft:         { flex: 1 },
  heroEyebrow:      { fontSize: 7, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  heroTitle:        { fontSize: 20, fontWeight: "800", marginBottom: 8, lineHeight: 26 },
  heroSub:          { fontSize: 11, lineHeight: 17 },
  heroIcon:         { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  heroEmoji:        { fontSize: 26 },
  emergencyStrip:   { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emergencyText:    { flex: 1 },
  emergencyTitle:   { color: "#EF4444", fontSize: 13, fontWeight: "700", marginBottom: 2 },
  emergencySub:     { color: "rgba(239,68,68,0.65)", fontSize: 10, lineHeight: 14 },
  sectionLabel:     { fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  catList:          { paddingHorizontal: 16, gap: 8 },
  catCard:          { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 13, gap: 12 },
  catIconWrap:      { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  catMeta:          { flex: 1 },
  catLabel:         { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  catSub:           { fontSize: 11 },
  catBadge:         { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  catBadgeText:     { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  partnerBadge:     { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  partnerLogo:      { fontSize: 22 },
  partnerName:      { fontSize: 12, fontWeight: "700" },
  partnerTier:      { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  bizCta:           { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  bizCtaLeft:       { flex: 1 },
  bizCtaTitle:      { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  bizCtaSub:        { fontSize: 11, lineHeight: 16 },
  bizCtaBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  bizCtaBtnText:    { color: "#000", fontWeight: "800", fontSize: 13 },
  footer:           { textAlign: "center", fontSize: 9, fontWeight: "600", letterSpacing: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, lineHeight: 14 },
});
