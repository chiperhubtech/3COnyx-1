/**
 * 3C Onyx — Invite & Earn
 * Luxury referral experience: tiered rewards with Bronze → Platinum progression,
 * native share, contacts integration, social quick-tap row.
 * Powered by CUXTOMCANDYCLUB LLC.
 */
import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useTheme } from "@/src/theme";

const REFERRAL_CODE = "ONYX-8827";
const REFERRAL_LINK = `https://3conyx.com/m/${REFERRAL_CODE}`;
const INVITE_MSG = `I joined 3C Onyx — the AI-powered automotive super app built for people who care about their vehicles. Use my code ${REFERRAL_CODE} to skip the waitlist. ${REFERRAL_LINK}`;

// ─── Tier definitions (Bronze → Silver → Gold → Platinum) ──────────────────────

type TierMeta = {
  refs:       number;
  name:       string;
  reward:     string;
  icon:       keyof typeof Feather.glyphMap;
  color:      string;
  colorDim:   string;
  colorBorder:string;
  label:      string;
};

const TIERS: TierMeta[] = [
  {
    refs: 1,
    name: "BRONZE",
    reward: "Founding Badge",
    icon: "award",
    color:       "#CD7F32",
    colorDim:    "rgba(205,127,50,0.10)",
    colorBorder: "rgba(205,127,50,0.25)",
    label: "Entry",
  },
  {
    refs: 3,
    name: "SILVER",
    reward: "Dynasty Wallet Pro",
    icon: "credit-card",
    color:       "#A8A9AD",
    colorDim:    "rgba(168,169,173,0.10)",
    colorBorder: "rgba(168,169,173,0.25)",
    label: "Rising",
  },
  {
    refs: 10,
    name: "GOLD",
    reward: "Guardian AI Boost + Free Detail",
    icon: "star",
    color:       "#C9A227",
    colorDim:    "rgba(201,162,39,0.12)",
    colorBorder: "rgba(201,162,39,0.30)",
    label: "Elite",
  },
  {
    refs: 25,
    name: "PLATINUM",
    reward: "Founding Partner Status",
    icon: "zap",
    color:       "#E5E4E2",
    colorDim:    "rgba(229,228,226,0.08)",
    colorBorder: "rgba(229,228,226,0.25)",
    label: "Legend",
  },
];

type ContactItem = { id: string; name: string; phone: string };

// ─── Tier Card Component ────────────────────────────────────────────────────────

function TierCard({
  tier,
  referralCount,
  active,
  completed,
}: {
  tier:          TierMeta;
  referralCount: number;
  active:        boolean;
  completed:     boolean;
}) {
  const progress = Math.min((referralCount / tier.refs) * 100, 100);

  return (
    <View
      style={[
        styles.tierCard,
        {
          backgroundColor: tier.colorDim,
          borderColor:     tier.colorBorder,
          borderWidth:     active ? 1.5 : 1,
          opacity:         completed ? 0.7 : 1,
        },
      ]}
    >
      {completed && (
        <View style={[styles.tierCompleteBadge, { backgroundColor: tier.colorDim }]}>
          <Feather name="check" size={8} color={tier.color} />
          <Text style={[styles.tierCompleteBadgeText, { color: tier.color }]}>EARNED</Text>
        </View>
      )}
      {active && !completed && (
        <View style={[styles.tierActiveBadge, { backgroundColor: tier.colorDim }]}>
          <Text style={[styles.tierActiveBadgeText, { color: tier.color }]}>CURRENT</Text>
        </View>
      )}

      <View style={styles.tierRow}>
        <View style={[styles.tierIconCircle, { backgroundColor: tier.colorDim, borderColor: tier.colorBorder }]}>
          <Feather name={tier.icon} size={18} color={tier.color} />
        </View>
        <View style={styles.tierMeta}>
          <View style={styles.tierNameRow}>
            <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
            <Text style={[styles.tierLabel, { color: tier.color, opacity: 0.6 }]}>{tier.label}</Text>
          </View>
          <Text style={styles.tierReward}>{tier.reward}</Text>
          <Text style={styles.tierRequirement}>{tier.refs} referral{tier.refs !== 1 ? "s" : ""} required</Text>
        </View>
      </View>

      <View style={styles.tierProgressWrap}>
        <View style={[styles.tierBar, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
          <Animated.View
            style={[
              styles.tierFill,
              {
                backgroundColor: tier.color,
                width: `${progress}%` as any,
              },
            ]}
          />
        </View>
        <Text style={[styles.tierProgressText, { color: tier.color }]}>
          {Math.min(referralCount, tier.refs)}/{tier.refs}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [contactsGranted, setContactsGranted] = useState(false);
  const [referralCount] = useState(2);
  const [copied, setCopied] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const loadContacts = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Contacts Access", "Enable contacts in Settings to invite friends directly.");
      return;
    }
    setContactsGranted(true);
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });
    const parsed: ContactItem[] = data
      .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
      .map((c) => ({
        id: c.id ?? Math.random().toString(),
        name: c.name!,
        phone: c.phoneNumbers![0].number ?? "",
      }))
      .slice(0, 200);
    setContacts(parsed);
  }, []);

  function shareNative() {
    Share.share({ message: INVITE_MSG, url: REFERRAL_LINK });
  }

  function copyCode() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function inviteContact(contact: ContactItem) {
    const encoded = encodeURIComponent(INVITE_MSG);
    const phone = contact.phone.replace(/\D/g, "");
    Linking.openURL(`sms:${phone}&body=${encoded}`).catch(() =>
      Linking.openURL(`sms:${phone}?body=${encoded}`)
    );
  }

  function openWhatsApp() {
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(INVITE_MSG)}`).catch(() =>
      Alert.alert("WhatsApp not installed")
    );
  }
  function openInstagram() {
    Linking.openURL("instagram://").catch(() => Linking.openURL("https://instagram.com"));
  }
  function openTelegram() {
    Linking.openURL(`tg://msg?text=${encodeURIComponent(INVITE_MSG)}`).catch(() =>
      Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}&text=${encodeURIComponent(INVITE_MSG)}`)
    );
  }

  const QUICK_SHARE = [
    { label: "WhatsApp",  icon: "message-circle" as const, color: "#25D366", onPress: openWhatsApp },
    { label: "SMS",       icon: "message-square" as const, color: "#007AFF", onPress: () => Linking.openURL(`sms:?body=${encodeURIComponent(INVITE_MSG)}`) },
    { label: "Telegram",  icon: "send"           as const, color: "#229ED9", onPress: openTelegram },
    { label: "Instagram", icon: "instagram"      as const, color: "#E1306C", onPress: openInstagram },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.cardAlt }]}>
          <Feather name="arrow-left" size={18} color={theme.textSub} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>3C ONYX — INVITE & EARN</Text>
          <Text style={[styles.headerSub, { color: theme.gold }]}>CUXTOMCANDYCLUB LLC</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={contactsGranted ? filteredContacts : []}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: 16 }}>
            {/* ── Referral Code Block ──────────────────────────── */}
            <View style={[styles.codeBlock, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]}>
              <Text style={[styles.codeEyebrow, { color: theme.textMuted }]}>YOUR REFERRAL CODE</Text>
              <Text style={[styles.codeText, { color: theme.gold }]}>{REFERRAL_CODE}</Text>
              <Text style={[styles.codeLink, { color: theme.textMuted }]}>{REFERRAL_LINK}</Text>
              <View style={styles.codeActions}>
                <Pressable style={[styles.copyBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={copyCode}>
                  <Feather name={copied ? "check" : "copy"} size={13} color={copied ? COLORS.gold : theme.textMuted} />
                  <Text style={[styles.copyBtnText, { color: copied ? COLORS.gold : theme.textMuted }]}>
                    {copied ? "Copied!" : "Copy Code"}
                  </Text>
                </Pressable>
                <Pressable style={styles.shareBtn} onPress={shareNative}>
                  <Feather name="share-2" size={13} color="#000" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </Pressable>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: theme.gold }]}>{referralCount}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Referred</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: theme.gold }]}>$0</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Earned</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statPill}>
                  <Text style={[styles.statNum, { color: COLORS.emerald }]}>GOLD</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Next Tier</Text>
                </View>
              </View>
            </View>

            {/* ── Quick Share ──────────────────────────────────── */}
            <View style={styles.quickRow}>
              {QUICK_SHARE.map((q) => (
                <Pressable key={q.label} style={styles.quickBtn} onPress={q.onPress}>
                  <View style={[styles.quickIcon, { backgroundColor: `${q.color}18`, borderWidth: 1, borderColor: `${q.color}30` }]}>
                    <Feather name={q.icon} size={20} color={q.color} />
                  </View>
                  <Text style={[styles.quickLabel, { color: theme.textMuted }]}>{q.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ── Reward Tiers ─────────────────────────────────── */}
            <View style={styles.tiersSection}>
              <Text style={[styles.tiersSectionTitle, { color: theme.textMuted }]}>
                REWARD TIERS
              </Text>
              {TIERS.map((tier) => {
                const completed = referralCount >= tier.refs;
                const active =
                  !completed &&
                  (TIERS.indexOf(tier) === 0 ||
                    referralCount >= TIERS[TIERS.indexOf(tier) - 1]!.refs);
                return (
                  <TierCard
                    key={tier.name}
                    tier={tier}
                    referralCount={referralCount}
                    active={active}
                    completed={completed}
                  />
                );
              })}
            </View>

            {/* ── Contacts Gate ────────────────────────────────── */}
            <View style={styles.contactsSection}>
              <Text style={[styles.tiersSectionTitle, { color: theme.textMuted }]}>
                INVITE FROM CONTACTS
              </Text>
              {!contactsGranted && (
                <Pressable
                  style={[styles.contactsGateBtn, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]}
                  onPress={loadContacts}
                >
                  <View style={[styles.contactsGateIcon, { backgroundColor: theme.goldMuted }]}>
                    <Feather name="users" size={18} color={COLORS.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactsGateTitle, { color: theme.text }]}>
                      Access Your Contacts
                    </Text>
                    <Text style={[styles.contactsGateSub, { color: theme.textMuted }]}>
                      Invite friends directly via SMS
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={COLORS.gold} />
                </Pressable>
              )}
              {contactsGranted && (
                <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Feather name="search" size={14} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search contacts…"
                    placeholderTextColor={theme.textFaint}
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.contactRow, { borderBottomColor: theme.cardBorder }]}
            onPress={() => inviteContact(item)}
          >
            <View style={[styles.contactAvatar, { backgroundColor: theme.goldMuted }]}>
              <Text style={[styles.contactInitial, { color: COLORS.gold }]}>
                {item.name[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.contactPhone, { color: theme.textMuted }]}>{item.phone}</Text>
            </View>
            <View style={[styles.inviteBtn, { backgroundColor: theme.goldMuted, borderColor: theme.goldBorder }]}>
              <Text style={[styles.inviteBtnText, { color: COLORS.gold }]}>Invite</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={{ paddingBottom: insets.bottom + 32 }}>
            <Text style={[styles.footerBranding, { color: theme.textFaint }]}>
              3C Onyx — Powered by CUXTOMCANDYCLUB LLC
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 2.5 },
  headerSub: { fontSize: 8, fontWeight: "700", letterSpacing: 2, marginTop: 2 },

  // Code block
  codeBlock: {
    alignItems: "center",
    padding: 22,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 14,
  },
  codeEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 3, marginBottom: 10 },
  codeText: { fontSize: 34, fontWeight: "900", letterSpacing: 6, marginBottom: 4 },
  codeLink: { fontSize: 10, marginBottom: 14 },
  codeActions: { flexDirection: "row", gap: 10, marginBottom: 18 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  copyBtnText: { fontSize: 12, fontWeight: "600" },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.gold,
  },
  shareBtnText: { color: "#000", fontSize: 12, fontWeight: "800" },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center" },
  statPill: { alignItems: "center", paddingHorizontal: 20 },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 8, fontWeight: "600", letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 28 },

  // Quick share
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickBtn: { alignItems: "center", gap: 7, flex: 1 },
  quickIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontSize: 10, fontWeight: "500" },

  // Tier cards
  tiersSection: { marginBottom: 24 },
  tiersSectionTitle: {
    fontSize: 9, fontWeight: "800", letterSpacing: 2.5,
    marginBottom: 12,
  },
  tierCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    position: "relative",
  },
  tierCompleteBadge: {
    position: "absolute", top: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  tierCompleteBadgeText: { fontSize: 7, fontWeight: "800", letterSpacing: 1 },
  tierActiveBadge: {
    position: "absolute", top: 12, right: 12,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  tierActiveBadgeText: { fontSize: 7, fontWeight: "800", letterSpacing: 1 },
  tierRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tierIconCircle: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  tierMeta: { flex: 1 },
  tierNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  tierName: { fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  tierLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  tierReward: { color: "rgba(255,255,255,0.80)", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  tierRequirement: { color: "rgba(255,255,255,0.35)", fontSize: 10 },
  tierProgressWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  tierFill: { height: 4, borderRadius: 2 },
  tierProgressText: { fontSize: 10, fontWeight: "700", minWidth: 32, textAlign: "right" },

  // Contacts
  contactsSection: { marginBottom: 16 },
  contactsGateBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  contactsGateIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  contactsGateTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactsGateSub: { fontSize: 11 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Contact row
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  contactInitial: { fontSize: 16, fontWeight: "700" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactPhone: { fontSize: 12 },
  inviteBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  inviteBtnText: { fontSize: 12, fontWeight: "700" },

  // Footer
  footerBranding: {
    textAlign: "center", fontSize: 9, fontWeight: "600", letterSpacing: 1.5,
    paddingTop: 16,
  },
});
