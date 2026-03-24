/**
 * 3C Onyx Mobile — Runner Tasks
 * Full task loop on mobile: view jobs → accept → QR confirm → payout
 */
import { Feather, Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface RunnerTask {
  id: string;
  type: string;
  title: string;
  vehicle: string;
  pickupCity: string;
  dropoffCity: string;
  distanceMiles: number;
  payout: number;
  netPayout: number;
  urgency: "standard" | "priority" | "express";
  status: string;
  estimatedHours: number;
  buyerName: string;
  specialInstructions?: string | null;
}

const URGENCY_COLOR: Record<string, string> = {
  express:  "#EF4444",
  priority: "#F97316",
  standard: "#34D399",
};

function TaskCard({ task, onAccept, onComplete, myTask }: {
  task: RunnerTask;
  onAccept?: (id: string) => void;
  onComplete?: (task: RunnerTask) => void;
  myTask?: boolean;
}) {
  const isMine = task.status === "accepted" || task.status === "completed";
  const urgencyColor = URGENCY_COLOR[task.urgency] ?? "#60A5FA";

  return (
    <View style={[styles.card, { borderColor: isMine ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.07)" }]}>
      <View style={[styles.cardAccent, { backgroundColor: urgencyColor }]} />
      <View style={styles.cardBody}>
        {/* Header */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <View style={[styles.badge, { backgroundColor: urgencyColor + "20" }]}>
                <Text style={[styles.badgeText, { color: urgencyColor }]}>{task.urgency.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.05)", marginLeft: 6 }]}>
                <Text style={[styles.badgeText, { color: "rgba(255,255,255,0.4)" }]}>{task.type.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskVehicle}>{task.vehicle}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.payout}>${task.netPayout}</Text>
            <Text style={styles.payoutLabel}>NET</Text>
          </View>
        </View>

        {/* Route */}
        {task.distanceMiles > 0 && (
          <View style={styles.route}>
            <Ionicons name="location-outline" size={11} color="#60A5FA" />
            <Text style={styles.routeText}>{task.pickupCity}</Text>
            <Feather name="arrow-right" size={10} color="rgba(255,255,255,0.25)" />
            <Text style={styles.routeText}>{task.dropoffCity}</Text>
            <Text style={styles.routeDist}>{task.distanceMiles} mi</Text>
          </View>
        )}

        {/* Special instructions */}
        {task.specialInstructions && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>📋 {task.specialInstructions}</Text>
          </View>
        )}

        {/* CTA */}
        {!isMine && onAccept && (
          <Pressable onPress={() => onAccept(task.id)} style={styles.primaryBtn}>
            <Ionicons name="flash" size={13} color="#000" />
            <Text style={styles.primaryBtnText}>Accept — ${task.netPayout}</Text>
          </Pressable>
        )}
        {isMine && task.status === "accepted" && onComplete && (
          <View style={styles.row}>
            <Pressable style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="navigate-outline" size={12} color="#60A5FA" />
              <Text style={[styles.secondaryBtnText, { color: "#60A5FA" }]}>Navigate</Text>
            </Pressable>
            <Pressable onPress={() => onComplete(task)} style={[styles.successBtn, { flex: 2 }]}>
              <Ionicons name="qr-code-outline" size={12} color="#000" />
              <Text style={styles.primaryBtnText}>Confirm Delivery</Text>
            </Pressable>
          </View>
        )}
        {isMine && task.status === "completed" && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#34D399" />
            <Text style={{ fontSize: 12, color: "#34D399", fontWeight: "700", marginLeft: 6 }}>Completed — ${task.netPayout} paid</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RunnerScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [view, setView] = useState<"available" | "mine">("available");
  const [completingTask, setCompletingTask] = useState<RunnerTask | null>(null);
  const [deliveryCode, setDeliveryCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const { data: available = [], isLoading: loadingAvail, refetch: refetchAvail } = useQuery({
    queryKey: ["runner-tasks"],
    queryFn: () => apiFetch<{ tasks: RunnerTask[] }>("/runner/tasks").then(d => d.tasks),
    refetchInterval: 30000,
  });

  const { data: mine = [], refetch: refetchMine } = useQuery({
    queryKey: ["runner-tasks-mine"],
    queryFn: () => apiFetch<{ tasks: RunnerTask[] }>("/runner/tasks/mine").then(d => d.tasks),
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/runner/tasks/${id}/accept`, { method: "POST" }),
    onSuccess: () => { refetchAvail(); refetchMine(); setView("mine"); },
    onError: () => Alert.alert("Error", "Could not accept task. Try again."),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      apiFetch(`/runner/tasks/${id}/complete`, { method: "POST", body: JSON.stringify({ deliveryCode: code }) }),
    onSuccess: () => {
      setCompletingTask(null);
      setDeliveryCode("");
      refetchMine();
      Alert.alert("Delivered!", "Payout processing via Stripe Connect.", [{ text: "Great" }]);
    },
    onError: (err: Error) => setCodeError(err.message),
  });

  const total = mine.filter(t => t.status === "completed").reduce((s, t) => s + t.netPayout, 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>RUNNER TASKS</Text>
          <Text style={styles.headerSub}>DISPATCH NETWORK</Text>
        </View>
        <View style={styles.earningsChip}>
          <Text style={styles.earningsVal}>${total}</Text>
          <Text style={styles.earningsLabel}>earned</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["available", "mine"] as const).map((v) => (
          <Pressable key={v} onPress={() => setView(v)} style={[styles.tab, view === v && styles.tabActive]}>
            <Text style={[styles.tabText, view === v && styles.tabTextActive]}>
              {v === "available" ? `Available (${available.length})` : `My Tasks (${mine.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Task list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={loadingAvail} onRefresh={() => { refetchAvail(); refetchMine(); }} tintColor={COLORS.gold} />}
      >
        {view === "available" && (available.length > 0 ? available.map(t => (
          <TaskCard key={t.id} task={t} onAccept={(id) => acceptMutation.mutate(id)} />
        )) : (
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={40} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>No tasks available right now</Text>
          </View>
        ))}
        {view === "mine" && (mine.length > 0 ? mine.map(t => (
          <TaskCard key={t.id} task={t} myTask onComplete={setCompletingTask} />
        )) : (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={40} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Accept a task to start earning</Text>
          </View>
        ))}
      </ScrollView>

      {/* Delivery Code Modal */}
      <Modal visible={!!completingTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.goldBar} />
            <View style={styles.modalContent}>
              <Ionicons name="qr-code-outline" size={36} color={COLORS.gold} style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>Confirm Delivery</Text>
              <Text style={styles.modalSub}>Ask the recipient for their delivery code from the 3C app.</Text>
              <TextInput
                value={deliveryCode}
                onChangeText={v => { setDeliveryCode(v.toUpperCase()); setCodeError(""); }}
                placeholder="XXXXXXXX"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={8}
                style={styles.codeInput}
                autoCapitalize="characters"
              />
              {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
              <View style={styles.modalBtns}>
                <Pressable onPress={() => { setCompletingTask(null); setDeliveryCode(""); setCodeError(""); }} style={styles.modalCancelBtn}>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => completeMutation.mutate({ id: completingTask!.id, code: deliveryCode })}
                  disabled={deliveryCode.length < 6}
                  style={[styles.modalConfirmBtn, deliveryCode.length < 6 && { opacity: 0.4 }]}
                >
                  <Text style={{ color: "#000", fontSize: 13, fontWeight: "800" }}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 12, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  headerSub: { fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginTop: 2 },
  earningsChip: { alignItems: "flex-end", backgroundColor: "rgba(52,211,153,0.1)", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "rgba(52,211,153,0.2)" },
  earningsVal: { fontSize: 18, fontWeight: "900", color: "#34D399" },
  earningsLabel: { fontSize: 9, color: "rgba(52,211,153,0.6)", letterSpacing: 1 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center" },
  tabActive: { backgroundColor: "rgba(201,162,39,0.12)", borderColor: "rgba(201,162,39,0.25)" },
  tabText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  tabTextActive: { color: "#C9A227" },
  card: { borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardAccent: { height: 3 },
  cardBody: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  taskTitle: { fontSize: 14, fontWeight: "800", color: "#fff", marginTop: 6, lineHeight: 18 },
  taskVehicle: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  payout: { fontSize: 28, fontWeight: "900", color: "#34D399", lineHeight: 30 },
  payoutLabel: { fontSize: 9, color: "rgba(52,211,153,0.5)", letterSpacing: 1 },
  route: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, padding: 8, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8 },
  routeText: { fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1 },
  routeDist: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  instructions: { marginTop: 8, padding: 8, backgroundColor: "rgba(201,162,39,0.05)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(201,162,39,0.15)" },
  instructionsText: { fontSize: 10, color: "rgba(201,162,39,0.8)", lineHeight: 15 },
  primaryBtn: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#C9A227", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  primaryBtnText: { fontSize: 13, fontWeight: "800", color: "#000" },
  secondaryBtn: { padding: 10, borderRadius: 10, backgroundColor: "rgba(96,165,250,0.1)", borderWidth: 1, borderColor: "rgba(96,165,250,0.2)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  secondaryBtnText: { fontSize: 12, fontWeight: "700" },
  successBtn: { padding: 10, borderRadius: 10, backgroundColor: "#34D399", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  completedBadge: { marginTop: 10, flexDirection: "row", alignItems: "center", padding: 8, backgroundColor: "rgba(52,211,153,0.07)", borderRadius: 8 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#08080e", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  goldBar: { height: 3, backgroundColor: "#C9A227" },
  modalContent: { padding: 28, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 8 },
  modalSub: { fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 24, lineHeight: 19 },
  codeInput: { width: "100%", padding: 16, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 24, fontFamily: "monospace", fontWeight: "700", letterSpacing: 8, textAlign: "center", marginBottom: 8 },
  codeError: { fontSize: 11, color: "#EF4444", marginBottom: 16 },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%", marginTop: 8 },
  modalCancelBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
  modalConfirmBtn: { flex: 2, padding: 12, borderRadius: 12, backgroundColor: "#34D399", alignItems: "center" },
});
