/**
 * 3C Onyx — Invite & Earn Tab
 * Tiered referral rewards: Bronze → Silver → Gold → Platinum
 * Powered by CUXTOMCANDYCLUB LLC.
 */
import { Feather } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import React, { useCallback, useState } from "react";
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
const INVITE_MSG = `I joined 3C Onyx — the AI-powered automotive super app. Use my code ${REFERRAL_CODE} to skip the waitlist. ${REFERRAL_LINK}`;

type TierMeta = {
  refs:        number;
  name:        string;
  reward:      string;
  icon:        keyof typeof Feather.glyphMap;
  color:       string;
  colorDim:    string;
  colorBorder: string;
  label:       string;
};

const TIERS: TierMeta[] = [
  { refs: 1,  name: "BRONZE",   reward: "Founding Badge",                    icon: "award",       color: "#CD7F32", colorDim: "rgba(205,127,50,0.10)", colorBorder: "rgba(205,127,50,0.25)", label: "Entry"  },
  { refs: 3,  name: "SILVER",   reward: "Dynasty Wallet Pro",                 icon: "credit-card", color: "#A8A9AD", colorDim: "rgba(168,169,173,0.10)", colorBorder: "rgba(168,169,173,0.25)", label: "Rising" },
  { refs: 10, name: "GOLD",     reward: "Guardian AI Boost + Free Detail",    icon: "star",        color: "#C9A227", colorDim: "rgba(201,162,39,0.12)",  colorBorder: "rgba(201,162,39,0.30)", label: "Elite"  },
  { refs: 25, name: "PLATINUM", reward: "Founding Partner Status",            icon: "zap",         color: "#E5E4E2", colorDim: "rgba(229,228,226,0.08)", colorBorder: "rgba(229,228,226,0.25)", label: "Legend" },
];

type ContactItem = { id: string; name: string; phone: string };

function TierCard({ tier, referralCount }: { tier: TierMeta; referralCount: number }) {
  const { theme } = useTheme();
  const completed = referralCount >= tier.refs;
  const idx = TIERS.indexOf(tier);
  const active = !completed && (idx === 0 || referralCount >= TIERS[idx - 1]!.refs);
  const progress = Math.min((referralCount / tier.refs) * 100, 100);

  return (
    <View style={[styles.tierCard, { backgroundColor: tier.colorDim, borderColor: tier.colorBorder, borderWidth: active ? 1.5 : 1, opacity: completed ? 0.72 : 1 }]}>
      {completed && (
        <View style={[styles.tierBadge, { backgroundColor: tier.colorDim }]}>
          <Feather name="check" size={8} color={tier.color} />
          <Text style={[styles.tierBadgeText, { color: tier.color }]}>EARNED</Text>
        </View>
      )}
      {active && !completed && (
        <View style={[styles.tierBadge, { backgroundColor: tier.colorDim }]}>
          <Text style={[styles.tierBadgeText, { color: tier.color }]}>CURRENT</Text>
        </View>
      )}
      <View style={styles.tierRow}>
        <View style={[styles.tierIcon, { backgroundColor: tier.colorDim, borderColor: tier.colorBorder }]}>
          <Feather name={tier.icon} size={18} color={tier.color} />
        </View>
        <View style={styles.tierMeta}>
          <View style={styles.tierNameRow}>
            <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
            <Text style={[styles.tierLabel, { color: tier.color, opacity: 0.6 }]}>{tier.label}</Text>
          </View>
          <Text style={[styles.tierReward, { color: theme.text }]}>{tier.reward}</Text>
          <Text style={[styles.tierRequirement, { color: theme.textMuted }]}>{tier.refs} referral{tier.refs !== 1 ? "s" : ""} required</Text>
        </View>
      </View>
      <View style={styles.tierProgressRow}>
        <View style={[styles.tierBar, { backgroundColor: theme.cardBorder }]}>
          <Animated.View style={[styles.tierFill, { backgroundColor: tier.color, width: `${progress}%` as `${number}%` }]} />
        </View>
        <Text style={[styles.tierProgressText, { color: tier.color }]}>{Math.min(referralCount, tier.refs)}/{tier.refs}</Text>
      </View>
    </View>
  );
}

export default function ReferralTab() {
  const safeInsets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [contactsGranted, setContactsGranted] = useState(false);
  const [referralCount] = useState(2);
  const [copied, setCopied] = useState(false);

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const loadContacts = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") { Alert.alert("Contacts Access", "Enable contacts in Settings to invite friends."); return; }
    setContactsGranted(true);
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers], sort: Contacts.SortTypes.FirstName });
    setContacts(data.filter((c) => c.name && c.phoneNumbers?.length).map((c) => ({ id: c.id ?? Math.random().toString(), name: c.name!, phone: c.phoneNumbers![0].number ?? "" })).slice(0, 200));
  }, []);

  function shareNative() { Share.share({ message: INVITE_MSG, url: REFERRAL_LINK }); }
  function copyCode() { setCopied(true); setTimeout(() => setCopied(false), 2500); }
  function inviteContact(c: ContactItem) {
    const encoded = encodeURIComponent(INVITE_MSG);
    const phone = c.phone.replace(/\D/g, "");
    Linking.openURL(`sms:${phone}&body=${encoded}`).catch(() => Linking.openURL(`sms:${phone}?body=${encoded}`));
  }

  const QUICK_SHARE = [
    { label: "WhatsApp",  icon: "message-circle" as const, color: "#25D366", onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(INVITE_MSG)}`).catch(() => Alert.alert("WhatsApp not installed")) },
    { label: "SMS",       icon: "message-square" as const, color: "#007AFF", onPress: () => Linking.openURL(`sms:?body=${encodeURIComponent(INVITE_MSG)}`) },
    { label: "Telegram",  icon: "send"           as const, color: "#229ED9", onPress: () => Linking.openURL(`tg://msg?text=${encodeURIComponent(INVITE_MSG)}`).catch(() => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}`)) },
    { label: "Instagram", icon: "instagram"      as const, color: "#E1306C", onPress: () => Linking.openURL("instagram://").catch(() => Linking.openURL("https://instagram.com")) },
  ];

  return (
    <View style={[styles.container, { paddingTop: safeInsets.top, backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>3C ONYX — INVITE & EARN</Text>
        <Text style={[styles.headerSub, { color: theme.gold }]}>CUXTOMCANDYCLUB LLC</Text>
      </View>

      <FlatList
        data={contactsGranted ? filtered : []}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: 16 }}>
            {/* Referral code */}
            <View style={[styles.codeBlock, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]}>
              <Text style={[styles.codeEyebrow, { color: theme.textMuted }]}>YOUR REFERRAL CODE</Text>
              <Text style={[styles.codeText, { color: theme.gold }]}>{REFERRAL_CODE}</Text>
              <Text style={[styles.codeLink, { color: theme.textMuted }]}>{REFERRAL_LINK}</Text>
              <View style={styles.codeActions}>
                <Pressable style={[styles.copyBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={copyCode}>
                  <Feather name={copied ? "check" : "copy"} size={13} color={copied ? COLORS.gold : theme.textMuted} />
                  <Text style={[styles.copyBtnText, { color: copied ? COLORS.gold : theme.textMuted }]}>{copied ? "Copied!" : "Copy Code"}</Text>
                </Pressable>
                <Pressable style={styles.shareBtn} onPress={shareNative}>
                  <Feather name="share-2" size={13} color="#000" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </Pressable>
              </View>
              <View style={styles.statsRow}>
                {[
                  { val: String(referralCount), lbl: "Referred" },
                  { val: "$0",                   lbl: "Earned"   },
                  { val: "GOLD",                 lbl: "Next Tier" },
                ].map((s, i) => (
                  <React.Fragment key={s.lbl}>
                    {i > 0 && <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />}
                    <View style={styles.statPill}>
                      <Text style={[styles.statNum, { color: theme.gold }]}>{s.val}</Text>
                      <Text style={[styles.statLbl, { color: theme.textMuted }]}>{s.lbl}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Quick share */}
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

            {/* Tiers */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>REWARD TIERS</Text>
            {TIERS.map((tier) => <TierCard key={tier.name} tier={tier} referralCount={referralCount} />)}

            {/* Contacts */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 24 }]}>INVITE FROM CONTACTS</Text>
            {!contactsGranted ? (
              <Pressable style={[styles.contactsGateBtn, { backgroundColor: theme.goldGlow, borderColor: theme.goldBorder }]} onPress={loadContacts}>
                <View style={[styles.contactsGateIcon, { backgroundColor: theme.goldMuted }]}>
                  <Feather name="users" size={18} color={COLORS.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactsGateTitle, { color: theme.text }]}>Access Your Contacts</Text>
                  <Text style={[styles.contactsGateSub, { color: theme.textMuted }]}>Invite friends directly via SMS</Text>
                </View>
                <Feather name="chevron-right" size={16} color={COLORS.gold} />
              </Pressable>
            ) : (
              <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Feather name="search" size={14} color={theme.textMuted} />
                <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Search contacts…" placeholderTextColor={theme.textFaint} value={search} onChangeText={setSearch} autoCorrect={false} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.contactRow, { borderBottomColor: theme.cardBorder }]} onPress={() => inviteContact(item)}>
            <View style={[styles.contactAvatar, { backgroundColor: theme.goldMuted }]}>
              <Text style={[styles.contactInitial, { color: COLORS.gold }]}>{item.name[0]?.toUpperCase()}</Text>
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
        ListFooterComponent={<View style={{ paddingBottom: safeInsets.bottom + 32 }}><Text style={[styles.footer, { color: theme.textFaint }]}>3C Onyx · Powered by CUXTOMCANDYCLUB LLC</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 14, alignItems: "center" },
  headerTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 2.5 },
  headerSub: { fontSize: 8, fontWeight: "700", letterSpacing: 2, marginTop: 2 },
  codeBlock: { alignItems: "center", padding: 22, borderWidth: 1, borderRadius: 20, marginBottom: 14 },
  codeEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 3, marginBottom: 10 },
  codeText: { fontSize: 34, fontWeight: "900", letterSpacing: 6, marginBottom: 4 },
  codeLink: { fontSize: 10, marginBottom: 14 },
  codeActions: { flexDirection: "row", gap: 10, marginBottom: 18 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  copyBtnText: { fontSize: 12, fontWeight: "600" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.gold },
  shareBtnText: { color: "#000", fontSize: 12, fontWeight: "800" },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center" },
  statPill: { alignItems: "center", paddingHorizontal: 20 },
  statNum: { fontSize: 18, fontWeight: "800" },
  statLbl: { fontSize: 8, fontWeight: "600", letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  quickBtn: { alignItems: "center", gap: 7, flex: 1 },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 10, fontWeight: "500" },
  sectionTitle: { fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginBottom: 12 },
  tierCard: { borderRadius: 16, padding: 16, marginBottom: 10, position: "relative" },
  tierBadge: { position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tierBadgeText: { fontSize: 7, fontWeight: "800", letterSpacing: 1 },
  tierRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tierIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tierMeta: { flex: 1 },
  tierNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  tierName: { fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  tierLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  tierReward: { color: "rgba(255,255,255,0.80)", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  tierRequirement: { color: "rgba(255,255,255,0.35)", fontSize: 10 },
  tierProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  tierFill: { height: 4, borderRadius: 2 },
  tierProgressText: { fontSize: 10, fontWeight: "700", minWidth: 32, textAlign: "right" },
  contactsGateBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  contactsGateIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contactsGateTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactsGateSub: { fontSize: 11 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contactInitial: { fontSize: 16, fontWeight: "700" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactPhone: { fontSize: 12 },
  inviteBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  inviteBtnText: { fontSize: 12, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 9, fontWeight: "600", letterSpacing: 1.5, paddingTop: 16 },
});
