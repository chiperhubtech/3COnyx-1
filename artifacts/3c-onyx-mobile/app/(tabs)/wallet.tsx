/**
 * 3C Onyx Mobile — Dynasty Wallet
 * Triple-split transactions, earning slices, Stripe Connect status
 */
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface WalletData {
  memberId: string;
  connectStatus: string;
  bankLast4: string | null;
  pendingBalance: number;
  lifetimeEarnings: number;
  sliceTransactions: {
    id: string;
    taskTitle: string;
    vehicle: string;
    memberSlice: number;
    slicePct: number;
    status: string;
    createdAt: string;
  }[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "20" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<WalletData>("/wallet/member"),
    staleTime: 30000,
  });

  const pending = data?.pendingBalance ?? 0;
  const lifetime = data?.lifetimeEarnings ?? 0;
  const connected = data?.connectStatus === "connected";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>DYNASTY WALLET</Text>
          <Text style={styles.headerSub}>TRIPLE-SPLIT ENGINE</Text>
        </View>
        <View style={[styles.connectBadge, connected ? styles.connectBadgeOn : styles.connectBadgeOff]}>
          <View style={[styles.dot, { backgroundColor: connected ? "#34D399" : "rgba(255,255,255,0.3)" }]} />
          <Text style={[styles.connectText, { color: connected ? "#34D399" : "rgba(255,255,255,0.4)" }]}>
            {connected ? "CONNECTED" : "SETUP NEEDED"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.gold} />}
      >
        {/* Balance cards */}
        <View style={styles.statsGrid}>
          <StatCard label="PENDING" value={`$${pending.toLocaleString()}`} sub="Processing" color="#C9A227" />
          <StatCard label="LIFETIME" value={`$${lifetime.toLocaleString()}`} sub="All time" color="#34D399" />
        </View>

        {/* Triple-split explainer */}
        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>HOW THE SPLIT WORKS</Text>
          {[
            { pct: "85%", label: "To Seller / Dealer",    color: "#60A5FA" },
            { pct: "5%",  label: "Member Slice (You)",    color: "#C9A227" },
            { pct: "2.5%",label: "Runner / Logistics",   color: "#A78BFA" },
            { pct: "7.5%",label: "3C Platform",          color: "#34D399" },
          ].map(({ pct, label, color }) => (
            <View key={label} style={styles.splitRow}>
              <Text style={[styles.splitPct, { color }]}>{pct}</Text>
              <Text style={styles.splitLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Connect CTA if not connected */}
        {!connected && (
          <View style={styles.connectCta}>
            <Ionicons name="card-outline" size={20} color="#C9A227" style={{ marginBottom: 10 }} />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800", marginBottom: 6 }}>Connect Your Bank</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 16 }}>
              Link your bank account via Stripe to receive your Member Slice on every transaction.
            </Text>
            <View style={{ padding: 10, paddingHorizontal: 20, backgroundColor: "#C9A227", borderRadius: 12 }}>
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>Connect via Stripe</Text>
            </View>
          </View>
        )}

        {/* Transaction history */}
        <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
        {!data || data.sliceTransactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={32} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Transactions appear as deals close</Text>
          </View>
        ) : (
          data.sliceTransactions.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{tx.taskTitle}</Text>
                <Text style={styles.txVehicle}>{tx.vehicle}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.txAmount, { color: tx.status === "paid" ? "#34D399" : "#C9A227" }]}>
                  +${tx.memberSlice}
                </Text>
                <Text style={styles.txPct}>{tx.slicePct}% slice</Text>
                <View style={[styles.txStatus, { backgroundColor: tx.status === "paid" ? "rgba(52,211,153,0.1)" : "rgba(201,162,39,0.1)" }]}>
                  <Text style={{ fontSize: 8, fontWeight: "800", color: tx.status === "paid" ? "#34D399" : "#C9A227", letterSpacing: 1 }}>
                    {tx.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  headerSub: { fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginTop: 2 },
  connectBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  connectBadgeOn: { backgroundColor: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.2)" },
  connectBadgeOff: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connectText: { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statCard: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1 },
  statValue: { fontSize: 28, fontWeight: "900", lineHeight: 30 },
  statLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: 1 },
  statSub: { fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 },
  splitCard: { padding: 18, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 14 },
  splitTitle: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 14 },
  splitRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  splitPct: { fontSize: 20, fontWeight: "900", width: 56 },
  splitLabel: { fontSize: 13, color: "rgba(255,255,255,0.5)", flex: 1 },
  connectCta: { padding: 24, borderRadius: 16, backgroundColor: "rgba(201,162,39,0.05)", borderWidth: 1, borderColor: "rgba(201,162,39,0.15)", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.25)", letterSpacing: 2, marginBottom: 12 },
  txCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 8 },
  txTitle: { fontSize: 13, fontWeight: "700", color: "#fff" },
  txVehicle: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  txDate: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 },
  txAmount: { fontSize: 20, fontWeight: "900" },
  txPct: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 },
  txStatus: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 10 },
});
