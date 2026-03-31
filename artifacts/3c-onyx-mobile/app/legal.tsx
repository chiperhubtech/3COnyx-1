/**
 * 3C Onyx — Legal Screen
 * Privacy Policy + Terms of Service
 * Required for App Store and Google Play submission.
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/src/theme";

type Tab = "privacy" | "terms";

const PRIVACY_POLICY = `
PRIVACY POLICY
Effective Date: January 1, 2025
Last Updated: January 1, 2025

CUXTOMCANDYCLUB LLC ("Company," "we," "us," or "our") operates the 3C Onyx mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.

1. INFORMATION WE COLLECT

a) Information You Provide
• Account information: name, email address, phone number, and professional role.
• Vehicle information: VIN numbers, make, model, year, and condition data you enter.
• Documents: photos and files you upload to your secure vault.
• Communications: messages and referrals you send through the App.

b) Information Collected Automatically
• Device information: device model, operating system, and unique device identifiers.
• Usage data: features accessed, time spent, and interaction logs.
• Location data: when you use location-based features (nearby businesses, roadside assistance), we collect your approximate or precise location. You may disable location in your device settings.
• Log data: IP address, app version, crash reports, and performance data.

c) Information from Third Parties
• Automotive data providers (MarketCheck) for vehicle valuations and market data.
• Roadside assistance providers for service dispatch.
• Payment processors (Stripe) for payout and billing — we do not store full payment card details.

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
• Provide, operate, and improve the App and its features.
• Process transactions and send related notifications.
• Personalize your experience and deliver relevant content.
• Connect you with automotive businesses and service providers.
• Communicate with you about updates, offers, and support.
• Detect, prevent, and address fraud and security issues.
• Comply with legal obligations.

3. HOW WE SHARE YOUR INFORMATION

We do not sell your personal information. We may share information with:
• Service providers who assist us in operating the App (hosting, analytics, payment processing).
• Automotive professionals and businesses you connect with through the App.
• Law enforcement or government agencies when required by law.
• Successor entities in the event of a merger, acquisition, or asset sale.

4. DATA SECURITY

We implement AES-256 encryption and industry-standard security measures to protect your information. No method of electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.

5. YOUR RIGHTS AND CHOICES

Depending on your location, you may have the right to:
• Access, correct, or delete your personal information.
• Opt out of certain data uses.
• Withdraw consent where processing is based on consent.
• Lodge a complaint with a supervisory authority.

To exercise these rights, contact us at: privacy@cuxtomcandyclub.ai

6. CHILDREN'S PRIVACY

The App is not directed to individuals under 18. We do not knowingly collect personal information from children under 18.

7. CALIFORNIA RESIDENTS

California residents may have additional rights under the California Consumer Privacy Act (CCPA). To submit a verifiable consumer request, contact us at privacy@cuxtomcandyclub.ai.

8. CHANGES TO THIS POLICY

We may update this Privacy Policy periodically. We will notify you of material changes by updating the "Last Updated" date and providing notice through the App.

9. CONTACT US

CUXTOMCANDYCLUB LLC
Privacy Team
Email: privacy@cuxtomcandyclub.ai
Website: https://cuxtomcandyclub.ai/privacy
`;

const TERMS_OF_SERVICE = `
TERMS OF SERVICE
Effective Date: January 1, 2025

Please read these Terms of Service ("Terms") carefully before using the 3C Onyx mobile application operated by CUXTOMCANDYCLUB LLC ("Company," "we," "us," or "our").

1. ACCEPTANCE OF TERMS

By downloading or using the App, you agree to be bound by these Terms. If you disagree with any part, you may not use the App.

2. DESCRIPTION OF SERVICE

3C Onyx is an Automotive Ecosystem OS that provides vehicle management, market intelligence, roadside assistance coordination, document management, and connections to automotive businesses and professionals.

3. ELIGIBILITY

You must be at least 18 years old and legally capable of entering into binding contracts to use the App.

4. USER ACCOUNTS

• You are responsible for maintaining the confidentiality of your account credentials.
• You are responsible for all activity that occurs under your account.
• You must provide accurate and complete information.
• You may not use another person's account without permission.

5. ACCEPTABLE USE

You agree not to:
• Use the App for any unlawful purpose or in violation of these Terms.
• Impersonate any person or entity or misrepresent your affiliation.
• Transmit harmful, offensive, or objectionable content.
• Attempt to gain unauthorized access to the App or its systems.
• Interfere with or disrupt the integrity or performance of the App.
• Collect or harvest user data without consent.

6. THIRD-PARTY SERVICES

The App integrates with third-party services for roadside assistance, vehicle rentals, location services, vehicle telemetry, and payment processing. Your use of these services is subject to their respective terms and privacy policies.

7. PAYMENTS AND SUBSCRIPTIONS

• Subscription fees are billed through the applicable platform (Apple App Store or Google Play Store).
• All purchases are final unless otherwise required by law.
• To restore previously purchased subscriptions, use the "Restore Purchases" option in Settings.
• Subscription pricing and terms are displayed clearly before purchase.

8. INTELLECTUAL PROPERTY

All content, features, and functionality of the App are owned by CUXTOMCANDYCLUB LLC and are protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.

9. DISCLAIMER OF WARRANTIES

THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.

10. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CUXTOMCANDYCLUB LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.

11. GOVERNING LAW

These Terms shall be governed by the laws of the State of Delaware, without regard to conflict of law principles.

12. CHANGES TO TERMS

We reserve the right to modify these Terms at any time. We will notify you of material changes through the App. Continued use after changes constitutes acceptance.

13. CONTACT

CUXTOMCANDYCLUB LLC
Email: legal@cuxtomcandyclub.ai
Website: https://cuxtomcandyclub.ai/terms
`;

export default function LegalScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("privacy");

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Legal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        {(["privacy", "terms"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: COLORS.gold, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? COLORS.gold : theme.textMuted },
            ]}>
              {tab === "privacy" ? "Privacy Policy" : "Terms of Service"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.legalText, { color: theme.textSub }]}>
          {activeTab === "privacy" ? PRIVACY_POLICY : TERMS_OF_SERVICE}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:      { padding: 4, marginRight: 8 },
  headerTitle:  { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  headerSpacer: { width: 28 },
  tabs:         { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab:          { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText:      { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  scroll:       { flex: 1 },
  scrollContent:{ paddingHorizontal: 20, paddingTop: 24 },
  legalText:    { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22, letterSpacing: 0.1 },
});
