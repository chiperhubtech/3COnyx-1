/**
 * 3C Onyx — Upgrade / Subscription Tiers
 * Consumer Pro · Specialist · Business · Dealer
 * Connects to Stripe checkout via /api/subscription/checkout
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/lib/authStore";
import { apiFetch } from "@/lib/api";

const GOLD    = "#C9A227";
const DARK    = "#050505";
const CARD    = "#0D0D0D";
const BORDER  = "rgba(255,255,255,0.08)";
const MUTED   = "rgba(255,255,255,0.35)";
const EMERALD = "#34D399";
const BLUE    = "#60A5FA";
const PURPLE  = "#A78BFA";
const ORANGE  = "#F97316";

interface Tier {
  id:        string;
  name:      string;
  price:     string;
  period:    string;
  color:     string;
  gradient:  [string, string];
  badge:     string;
  tagline:   string;
  features:  string[];
  cta:       string;
  popular:   boolean;
}

const TIERS: Tier[] = [
  {
    id:       "free",
    name:     "Member Free",
    price:    "$0",
    period:   "forever",
    color:    MUTED,
    gradient: ["#1a1a1a", "#0D0D0D"],
    badge:    "FREE",
    tagline:  "Full platform access. No credit card. No catch.",
    features: [
      "16-role AI assistant",
      "Marketplace browse",
      "Vehicle Garage",
      "Referral rewards",
      "Roadside Assistance",
      "Transport booking",
    ],
    cta:     "Your current plan",
    popular: false,
  },
  {
    id:       "pro",
    name:     "Consumer Pro",
    price:    "$9",
    period:   "mo",
    color:    EMERALD,
    gradient: ["#0f2922", "#0A0A0A"],
    badge:    "PRO",
    tagline:  "Priority AI, price alerts, and dealer negotiation tools.",
    features: [
      "Everything in Free",
      "ONYX Neural Brain (unlimited queries)",
      "Real-time price alerts",
      "Dealer negotiation scripts",
      "Vehicle history reports",
      "Priority roadside dispatch",
      "Concierge transport",
    ],
    cta:     "Upgrade to Pro",
    popular: false,
  },
  {
    id:       "specialist",
    name:     "Specialist",
    price:    "$49",
    period:   "mo",
    color:    BLUE,
    gradient: ["#0f1f3a", "#0A0A0A"],
    badge:    "SPECIALIST",
    tagline:  "For mechanics, detailers, and mobile specialists earning on-platform.",
    features: [
      "Everything in Pro",
      "Specialist listing & verification badge",
      "Gig task marketplace (receive jobs)",
      "Member Wallet + same-day payouts",
      "Stripe Connect integration",
      "Background check (Checkr-powered)",
      "Booking calendar",
    ],
    cta:     "Go Specialist",
    popular: true,
  },
  {
    id:       "business",
    name:     "Business",
    price:    "$299",
    period:   "mo",
    color:    PURPLE,
    gradient: ["#1a0f3a", "#0A0A0A"],
    badge:    "BUSINESS",
    tagline:  "For shops, fleets, and independent operators scaling their operation.",
    features: [
      "Everything in Specialist",
      "Multi-seat team access (up to 10)",
      "CRM Hub (9 platforms synced)",
      "Fleet management dashboard",
      "Bulk transport pricing",
      "Inventory management",
      "White-label vehicle descriptions (AI)",
    ],
    cta:     "Go Business",
    popular: false,
  },
  {
    id:       "dealer",
    name:     "Dealer Platform",
    price:    "$999",
    period:   "mo",
    color:    GOLD,
    gradient: ["#2a1f00", "#0A0A0A"],
    badge:    "DEALER",
    tagline:  "The full 3C ONYX dealership command center — built for rooftops.",
    features: [
      "Everything in Business",
      "Unlimited seats",
      "Live inventory syndication",
      "Lead routing + scoring (AI)",
      "F&I deal desking tools",
      "I-95 Outreach Engine access",
      "Founding Member pricing (locked)",
      "Dedicated success rep",
    ],
    cta:     "Become a Dealer Partner",
    popular: false,
  },
];

export default function UpgradeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(tier: Tier) {
    if (tier.id === "free") return;
    setLoading(tier.id);
    try {
      const res = await apiFetch<{ url?: string; sessionUrl?: string; error?: string }>(
        "/subscription/checkout",
        {
          method: "POST",
          body:   JSON.stringify({
            planId:   tier.id,
            planName: tier.name,
            amount:   parseInt(tier.price.replace("$", ""), 10) * 100,
            memberId: String(user?.id ?? "guest"),
            email:    user?.email,
          }),
        },
      );
      const url = res.url ?? res.sessionUrl;
      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Coming Soon", "Secure checkout is being set up. Check back shortly.");
      }
    } catch {
      Alert.alert("Error", "Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const currentTier = user?.subscriptionTier ?? "free";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>MEMBERSHIP TIERS</Text>
          <View style={{ width: 36 }} />
        </View>

        <Text style={s.heroTitle}>Choose your level</Text>
        <Text style={s.heroSub}>
          Every role. Every tool. One platform.{"\n"}
          Upgrade when you're ready — downgrade anytime.
        </Text>

        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id || (tier.id === "free" && !currentTier);
          const isLoading = loading === tier.id;

          return (
            <LinearGradient
              key={tier.id}
              colors={tier.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.card, { borderColor: tier.popular ? tier.color : BORDER }, isCurrent && { borderColor: tier.color + "60" }]}
            >
              {tier.popular && (
                <View style={[s.popularBadge, { backgroundColor: tier.color }]}>
                  <Text style={s.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={s.cardTop}>
                <View>
                  <View style={[s.badge, { backgroundColor: tier.color + "20" }]}>
                    <Text style={[s.badgeText, { color: tier.color }]}>{tier.badge}</Text>
                  </View>
                  <Text style={s.tierName}>{tier.name}</Text>
                  <Text style={s.tierTagline}>{tier.tagline}</Text>
                </View>
                <View style={s.priceCol}>
                  <Text style={[s.price, { color: tier.color }]}>{tier.price}</Text>
                  <Text style={s.period}>/{tier.period}</Text>
                </View>
              </View>

              <View style={[s.divider, { backgroundColor: tier.color + "15" }]} />

              {tier.features.map(f => (
                <View key={f} style={s.featureRow}>
                  <Feather name="check" size={13} color={tier.color} style={{ marginTop: 2 }} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  s.ctaBtn,
                  { backgroundColor: isCurrent ? CARD : tier.color },
                  isCurrent && { borderWidth: 1, borderColor: tier.color + "40" },
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={() => { if (!isCurrent) void handleUpgrade(tier); }}
                disabled={isCurrent || isLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={[s.ctaText, { color: isCurrent ? tier.color : "#000" }]}>
                      {isCurrent ? "✓  Current Plan" : tier.cta}
                    </Text>
                }
              </TouchableOpacity>
            </LinearGradient>
          );
        })}

        <Text style={s.footer}>
          All plans include SSL, encrypted data storage, and 24/7 uptime monitoring.{"\n"}
          Cancel or change your plan anytime. Founding Dealer pricing locked at $999/mo forever.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: DARK },
  scroll:        { padding: 20, paddingBottom: 48 },
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: "center", justifyContent: "center" },
  headerTitle:   { color: MUTED, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  heroTitle:     { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 10 },
  heroSub:       { color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 28 },
  card:          { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16, overflow: "hidden" },
  popularBadge:  { position: "absolute", top: 0, right: 20, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  popularText:   { color: "#000", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  cardTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: "flex-start", marginBottom: 8 },
  badgeText:     { fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  tierName:      { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  tierTagline:   { color: MUTED, fontSize: 12, lineHeight: 17, maxWidth: 200 },
  priceCol:      { alignItems: "flex-end" },
  price:         { fontSize: 32, fontWeight: "900" },
  period:        { color: MUTED, fontSize: 12, marginTop: -4 },
  divider:       { height: 1, marginBottom: 16 },
  featureRow:    { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  featureText:   { color: "rgba(255,255,255,0.65)", fontSize: 13, flex: 1, lineHeight: 18 },
  ctaBtn:        { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 20 },
  ctaText:       { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  footer:        { color: MUTED, fontSize: 11, textAlign: "center", lineHeight: 18, marginTop: 12 },
});
