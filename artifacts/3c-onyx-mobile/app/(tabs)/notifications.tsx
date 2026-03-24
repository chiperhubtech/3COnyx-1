import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  created_at?: string;
};

function getNotifIcon(type: string): React.ReactNode {
  const t = type?.toUpperCase();
  switch (t) {
    case "DELIVERY": case "RUNNER":
      return <Feather name="navigation" size={16} color="#3B9EFF" />;
    case "ALERT":
      return <Ionicons name="warning" size={16} color={COLORS.red} />;
    case "PAYOUT": case "PAYMENT":
      return <Feather name="dollar-sign" size={16} color={COLORS.emerald} />;
    case "SYSTEM": case "BGC":
      return <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.gold} />;
    default:
      return <Feather name="bell" size={16} color={COLORS.whiteDim} />;
  }
}

function getNotifIconBg(type: string): string {
  const t = type?.toUpperCase();
  switch (t) {
    case "DELIVERY": case "RUNNER": return "#3B9EFF18";
    case "ALERT": return `${COLORS.red}18`;
    case "PAYOUT": case "PAYMENT": return `${COLORS.emerald}18`;
    case "SYSTEM": case "BGC": return `${COLORS.gold}18`;
    default: return COLORS.muted;
  }
}

function getNotifIconBorder(type: string): string {
  const t = type?.toUpperCase();
  switch (t) {
    case "DELIVERY": case "RUNNER": return "#3B9EFF30";
    case "ALERT": return `${COLORS.red}30`;
    case "PAYOUT": case "PAYMENT": return `${COLORS.emerald}30`;
    case "SYSTEM": case "BGC": return `${COLORS.gold}30`;
    default: return COLORS.cardBorder;
  }
}

function timeAgo(item: Notification): string {
  const dateStr = item.createdAt || item.created_at;
  if (!dateStr) return "recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "recently";
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotifItem({ item, onPress }: { item: Notification; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Animated.View
        style={[
          styles.notifItem,
          !item.read && styles.notifUnread,
          { transform: [{ scale }] },
        ]}
      >
        <View
          style={[
            styles.notifIcon,
            {
              backgroundColor: getNotifIconBg(item.type),
              borderColor: getNotifIconBorder(item.type),
            },
          ]}
        >
          {getNotifIcon(item.type)}
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.notifTime}>{timeAgo(item)}</Text>
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </Animated.View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const qc = useQueryClient();

  const { data: notifData, isLoading } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => apiFetch<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
  });

  const notifications = notifData?.notifications;

  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-list"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unread = (notifications ?? []).filter((n) => !n.read);
  const read = (notifications ?? []).filter((n) => n.read);

  const sections = [
    ...(unread.length > 0 ? [{ title: "UNREAD", data: unread }] : []),
    ...(read.length > 0 ? [{ title: "EARLIER", data: read }] : []),
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="notifications" size={20} color={COLORS.amber} />
          <Text style={styles.title}>NOTIFICATIONS</Text>
          {unread.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{unread.length}</Text>
            </View>
          )}
        </View>
        {unread.length > 0 && (
          <Pressable
            style={styles.markAllBtn}
            onPress={() => markAllMutation.mutate()}
          >
            {markAllMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <>
                <Feather name="check-square" size={13} color={COLORS.gold} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (notifications ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off" size={32} color={COLORS.whiteDim} />
          </View>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySubText}>No new notifications right now</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 90, paddingTop: 12 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <NotifItem
              item={item}
              onPress={() => !item.read && markReadMutation.mutate(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: COLORS.white,
    letterSpacing: 2,
  },
  countBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countText: { fontFamily: "Inter_700Bold", fontSize: 11, color: COLORS.black },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${COLORS.gold}15`,
    borderWidth: 1,
    borderColor: `${COLORS.gold}25`,
  },
  markAllText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: COLORS.gold,
  },
  sectionHeader: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: COLORS.whiteDim,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 14,
    position: "relative",
  },
  notifUnread: {
    backgroundColor: "#141414",
    borderColor: "rgba(255,255,255,0.10)",
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  notifTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.white,
    flex: 1,
  },
  notifTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: COLORS.whiteDim,
    flexShrink: 0,
  },
  notifBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.whiteDim,
    lineHeight: 17,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.whiteDim },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: COLORS.white },
  emptySubText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.whiteDim },
});
