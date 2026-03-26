/**
 * 3C Onyx — Login Screen
 * For returning members who already have an account.
 * Role-first design: ONYX knows who you are the moment you sign back in.
 */
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/lib/authStore";
import type { AuthUser } from "@/lib/authStore";

const GOLD    = "#C9A227";
const DARK    = "#050505";
const CARD    = "#0A0A0A";
const BORDER  = "rgba(255,255,255,0.10)";
const EMERALD = "#34D399";
const MUTED   = "rgba(255,255,255,0.35)";
const BASE    = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Required", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok || !data.token || !data.user) {
        Alert.alert("Login Failed", data.error ?? "Invalid email or password.");
        return;
      }
      await login(data.token, data.user);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoRow}>
            <View style={s.logoRing}>
              <Text style={s.logoMark}>◆</Text>
            </View>
          </View>
          <Text style={s.wordmark}>3C ONYX</Text>
          <Text style={s.tagline}>POWERED BY CUXTOMCANDYCLUB LLC</Text>

          <View style={s.divider} />

          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in to access your dashboard, AI, and member benefits.</Text>

          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>PASSWORD</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={() => void handleLogin()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnText}>SIGN IN  →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>New here? Create an account during onboarding →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: DARK },
  scroll:    { flexGrow: 1, padding: 28 },
  logoRow:   { alignItems: "center", marginTop: 20, marginBottom: 16 },
  logoRing:  { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: GOLD + "50", alignItems: "center", justifyContent: "center", backgroundColor: GOLD + "12" },
  logoMark:  { color: GOLD, fontSize: 24 },
  wordmark:  { textAlign: "center", color: GOLD, fontSize: 18, fontWeight: "900", letterSpacing: 8 },
  tagline:   { textAlign: "center", color: MUTED, fontSize: 7, fontWeight: "700", letterSpacing: 2, marginTop: 4 },
  divider:   { height: 1, backgroundColor: BORDER, marginVertical: 28 },
  title:     { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  sub:       { color: MUTED, fontSize: 13, lineHeight: 20, marginBottom: 28 },
  field:     { marginBottom: 16 },
  label:     { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  input:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, color: "#fff", fontSize: 15 },
  btn:       { backgroundColor: EMERALD, borderRadius: 12, padding: 17, alignItems: "center", marginTop: 8 },
  btnText:   { color: "#000", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  back:      { marginTop: 24, alignItems: "center" },
  backText:  { color: MUTED, fontSize: 12 },
});
