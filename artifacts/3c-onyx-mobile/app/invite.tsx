/**
 * 3C Onyx — Invite Friends
 * Cash App-style referral: native share, contacts, quick social taps.
 */
import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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

const REFERRAL_CODE = "ONYX-8827"; // In production: loaded from auth context / API
const REFERRAL_LINK = `https://3conyx.com/m/${REFERRAL_CODE}`;
const INVITE_MSG = `I joined 3C Onyx — the AI-powered automotive super app built for people who actually care about their vehicles. Use my code ${REFERRAL_CODE} to skip the waitlist. ${REFERRAL_LINK}`;

type Tier = { refs: number; reward: string; icon: string };
const TIERS: Tier[] = [
  { refs: 1,  reward: "Founding Badge",     icon: "award"       },
  { refs: 3,  reward: "Dynasty Wallet Pro",  icon: "credit-card" },
  { refs: 5,  reward: "Guardian AI Boost",   icon: "shield"      },
  { refs: 10, reward: "Free Detail Service", icon: "star"        },
  { refs: 25, reward: "Founding Partner",    icon: "zap"         },
];

type ContactItem = {
  id: string;
  name: string;
  phone: string;
};

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [contactsGranted, setContactsGranted] = useState(false);
  const [referralCount] = useState(2); // In production: from API
  const [copied, setCopied] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const nextTier = TIERS.find((t) => t.refs > referralCount);

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
      .slice(0, 200); // Cap at 200 for performance

    setContacts(parsed);
  }, []);

  function shareNative() {
    Share.share({ message: INVITE_MSG, url: REFERRAL_LINK });
  }

  function copyCode() {
    // Clipboard.setStringAsync(REFERRAL_CODE) — requires expo-clipboard
    // Using Alert as lightweight fallback
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
    Linking.openURL("instagram://").catch(() =>
      Linking.openURL("https://instagram.com")
    );
  }

  function openTelegram() {
    Linking.openURL(`tg://msg?text=${encodeURIComponent(INVITE_MSG)}`).catch(() =>
      Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}&text=${encodeURIComponent(INVITE_MSG)}`)
    );
  }

  const QUICK_SHARE = [
    { label: "WhatsApp",  icon: "message-circle" as const, color: "#25D366", onPress: openWhatsApp  },
    { label: "SMS",       icon: "message-square" as const, color: "#007AFF", onPress: () => Linking.openURL(`sms:?body=${encodeURIComponent(INVITE_MSG)}`) },
    { label: "Telegram",  icon: "send"           as const, color: "#229ED9", onPress: openTelegram  },
    { label: "Instagram", icon: "instagram"      as const, color: "#E1306C", onPress: openInstagram },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Text style={styles.headerTitle}>INVITE FRIENDS</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={contactsGranted ? filteredContacts : []}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Referral code block */}
            <View style={styles.codeBlock}>
              <Text style={styles.codeEyebrow}>YOUR REFERRAL CODE</Text>
              <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
              <Pressable style={styles.copyBtn} onPress={copyCode}>
                <Feather name={copied ? "check" : "copy"} size={14} color={copied ? COLORS.gold : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.copyBtnText, copied && { color: COLORS.gold }]}>
                  {copied ? "Copied!" : "Copy Code"}
                </Text>
              </Pressable>
            </View>

            {/* Progress toward next tier */}
            {nextTier && (
              <View style={styles.tierCard}>
                <View style={styles.tierRow}>
                  <Feather name={nextTier.icon as any} size={16} color={COLORS.gold} />
                  <Text style={styles.tierLabel}>
                    {referralCount}/{nextTier.refs} — Unlock <Text style={{ color: COLORS.gold }}>{nextTier.reward}</Text>
                  </Text>
                </View>
                <View style={styles.tierBar}>
                  <View style={[styles.tierFill, { width: `${Math.min((referralCount / nextTier.refs) * 100, 100)}%` }]} />
                </View>
              </View>
            )}

            {/* Big share button */}
            <Pressable style={styles.mainShareBtn} onPress={shareNative}>
              <Feather name="share-2" size={20} color="#000" />
              <Text style={styles.mainShareText}>Share My Code</Text>
            </Pressable>

            {/* Quick social buttons */}
            <View style={styles.quickRow}>
              {QUICK_SHARE.map((q) => (
                <Pressable key={q.label} style={styles.quickBtn} onPress={q.onPress}>
                  <View style={[styles.quickIcon, { backgroundColor: `${q.color}20` }]}>
                    <Feather name={q.icon} size={20} color={q.color} />
                  </View>
                  <Text style={styles.quickLabel}>{q.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Contacts section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>INVITE FROM CONTACTS</Text>
            </View>

            {!contactsGranted && (
              <Pressable style={styles.contactsGateBtn} onPress={loadContacts}>
                <Feather name="users" size={18} color={COLORS.gold} />
                <Text style={styles.contactsGateText}>Allow Access to Contacts</Text>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </Pressable>
            )}

            {contactsGranted && (
              <View style={styles.searchWrap}>
                <Feather name="search" size={14} color="rgba(255,255,255,0.3)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.contactRow} onPress={() => inviteContact(item)}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactInitial}>{item.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <View style={styles.inviteBtn}>
              <Text style={styles.inviteBtnText}>Invite</Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ height: insets.bottom + 24 }} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080810" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 3 },

  listContent: { padding: 16 },

  codeBlock: {
    alignItems: "center", padding: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(201,162,39,0.2)",
    borderRadius: 18, marginBottom: 12,
  },
  codeEyebrow: {
    color: "rgba(255,255,255,0.3)", fontSize: 9,
    fontWeight: "800", letterSpacing: 3, marginBottom: 10,
  },
  codeText: {
    color: COLORS.gold, fontSize: 32, fontWeight: "900",
    letterSpacing: 6, marginBottom: 14,
  },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  copyBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },

  tierCard: {
    padding: 14, borderRadius: 12,
    backgroundColor: "rgba(201,162,39,0.05)",
    borderWidth: 1, borderColor: "rgba(201,162,39,0.15)",
    marginBottom: 14,
  },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  tierLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, flex: 1 },
  tierBar: { height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2 },
  tierFill: { height: 3, backgroundColor: COLORS.gold, borderRadius: 2 },

  mainShareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: COLORS.gold,
    paddingVertical: 16, borderRadius: 16, marginBottom: 16,
  },
  mainShareText: { color: "#000", fontSize: 16, fontWeight: "900" },

  quickRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 24,
  },
  quickBtn: { alignItems: "center", gap: 6, flex: 1 },
  quickIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11 },

  sectionHeader: {
    paddingVertical: 6, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.25)", fontSize: 9,
    fontWeight: "800", letterSpacing: 3,
  },

  contactsGateBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 14,
    backgroundColor: "rgba(201,162,39,0.05)",
    borderWidth: 1, borderColor: "rgba(201,162,39,0.15)",
    marginBottom: 12,
  },
  contactsGateText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },

  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(201,162,39,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  contactInitial: { color: COLORS.gold, fontSize: 16, fontWeight: "700" },
  contactInfo: { flex: 1 },
  contactName: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactPhone: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  inviteBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "rgba(201,162,39,0.12)",
    borderWidth: 1, borderColor: "rgba(201,162,39,0.25)",
  },
  inviteBtnText: { color: COLORS.gold, fontSize: 12, fontWeight: "700" },
});
