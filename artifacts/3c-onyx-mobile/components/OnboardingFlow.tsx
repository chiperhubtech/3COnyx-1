/**
 * 3C Onyx Mobile — Role-First Onboarding
 * ─────────────────────────────────────────────────────────────────────
 * Bottom-up flywheel: capture every individual automotive professional
 * first. A BDC rep joins free → tells their team → team tells the GM
 * → GM pays for the dealer tier → dealer customers join as consumers.
 *
 * 16 specific automotive roles across 4 categories.
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Dimensions, Animated, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import Svg, { Circle, Line } from "react-native-svg";

const { width: SW } = Dimensions.get("window");

const GOLD   = "#C9A227";
const DARK   = "#050505";
const CARD   = "#0A0A0A";
const BORDER = "rgba(255,255,255,0.08)";
const EMERALD = "#34D399";
const BLUE    = "#60A5FA";
const PURPLE  = "#A78BFA";
const ORANGE  = "#F97316";
const PINK    = "#F472B6";

const ONBOARDING_KEY = "3c_onboarding_complete";
const ROLE_KEY       = "3c_user_role_detail";
const TOKEN_KEY      = "3c_auth_token";
const USER_KEY       = "3c_auth_user";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

function roleToApiRole(roleId: string): "Member" | "Dealer" | "Runner" | "Specialist" {
  if (["dealer_principal", "dealer_gm", "sales_manager", "sales_consultant", "finance_manager", "service_advisor", "bdc_rep", "parts_specialist"].includes(roleId)) return "Dealer";
  if (["transport_driver", "runner_owner_op"].includes(roleId)) return "Runner";
  if (["independent_mechanic", "detailer", "mobile_tech", "body_shop"].includes(roleId)) return "Specialist";
  return "Member";
}

// ─── Types & Role Data ────────────────────────────────────────────────────────

type RoleCategory = "consumer" | "dealership" | "independent" | "transport";

interface RoleOption {
  id: string;
  category: RoleCategory;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  tools: string;
  prompts: string[];
}

const ROLES: RoleOption[] = [
  // Consumer
  { id: "vehicle_owner",    category: "consumer",    title: "Vehicle Owner / Enthusiast", subtitle: "I own or plan to buy a vehicle",         emoji: "🚗", color: GOLD,    tools: "Marketplace · Garage · Racing Hub · ONYX Points · Transport · Finance",        prompts: ["Find me a BMW M3 under $75K", "What is my car worth today?", "Book a Runner for pickup", "Get me insurance quotes"] },
  { id: "fleet_owner",      category: "consumer",    title: "Fleet Owner / Manager",      subtitle: "I manage multiple vehicles",             emoji: "🏢", color: BLUE,    tools: "Fleet tracking · Multi-vehicle garage · Bulk transport · Maintenance",           prompts: ["Vehicles due for service", "Renew fleet registrations", "Bulk transport pricing", "Fleet insurance comparison"] },
  // Dealership
  { id: "bdc_rep",          category: "dealership",  title: "BDC Representative",         subtitle: "Internet leads · Appointments · Follow-ups", emoji: "📞", color: BLUE,    tools: "Lead management · Response tracking · Appointment setting · CRM sync",         prompts: ["Leads with no response in 24h", "Which leads are hottest?", "Generate follow-up for a lead", "My appointment-to-show rate"] },
  { id: "sales_consultant", category: "dealership",  title: "Sales Consultant",           subtitle: "Vehicle sales · Customer management",    emoji: "🤝", color: GOLD,    tools: "Live inventory · Deal tracking · Customer history · Lead scoring",              prompts: ["Show my open deals", "Vehicles matching customer needs", "Pencil a deal at $649/mo", "Today's follow-up list"] },
  { id: "finance_manager",  category: "dealership",  title: "Finance Manager (F&I)",      subtitle: "Deal structuring · Financing · Insurance", emoji: "💳", color: EMERALD, tools: "Lender programs · Deal desking · Insurance products · Back-end gross",           prompts: ["Lenders for 660 credit score", "Average back-end gross", "Deals waiting on approval", "Payment calc: $42K at 7.9%"] },
  { id: "service_advisor",  category: "dealership",  title: "Service Advisor",            subtitle: "Service appointments · Customer updates", emoji: "🔧", color: PURPLE,  tools: "Repair orders · Parts availability · Customer comms · CSI tracking",            prompts: ["ROs open 3+ days", "Send status to waiting customers", "Parts for 2022 BMW M3", "My CSI score this week"] },
  { id: "sales_manager",    category: "dealership",  title: "Sales Manager",              subtitle: "Team performance · Inventory · Deals",   emoji: "📊", color: ORANGE,  tools: "Team dashboards · Turn rates · Gross tracking · Appraisals",                     prompts: ["Team gross per unit today", "Vehicles aged 60+ days", "Appraise this trade-in VIN", "Manager log this week"] },
  { id: "dealer_gm",        category: "dealership",  title: "Dealer Principal / GM",      subtitle: "Full dealership command",                emoji: "🏆", color: GOLD,    tools: "Full CRM · KPIs · P&L · Staff performance · Multi-rooftop",                      prompts: ["This month vs last month P&L", "Top 5 performers", "CRM leads that converted", "Inventory days supply"] },
  { id: "parts_specialist", category: "dealership",  title: "Parts Specialist",           subtitle: "Parts ordering · Inventory · Sourcing",  emoji: "📦", color: PINK,    tools: "OEM + aftermarket · Inventory control · Supplier pricing · VIN decode",          prompts: ["Brake pads in stock for Camry", "OEM bumper price for RS7", "Parts on backorder", "Reorder level alerts"] },
  // Independent
  { id: "body_shop_tech",   category: "independent", title: "Body Shop Technician",       subtitle: "Collision repair · Refinishing",         emoji: "🎨", color: ORANGE,  tools: "Repair estimates · OEM parts · Insurance approvals · Job progress",              prompts: ["Parts for 2023 Audi RS7 panel", "Insurance approval for RO #4421", "Estimate front-end damage", "Order supplies local"] },
  { id: "master_tech",      category: "independent", title: "Master Technician / Mechanic",subtitle: "Diagnostics · Repair · Service",        emoji: "⚙️", color: BLUE,    tools: "Live diagnostics · Repair history · Parts sourcing · TSBs",                      prompts: ["TSBs for 2021 F-150 5.0L", "Labor time: timing chain", "Best parts supplier near me", "Decode: P0420, P0430"] },
  { id: "shop_foreman",     category: "independent", title: "Shop Foreman / Lead Tech",   subtitle: "Team scheduling · Quality control",      emoji: "📋", color: PURPLE,  tools: "Job board · Tech productivity · Quality gates · Workflow",                       prompts: ["Jobs waiting for parts", "Tech productivity this week", "Jobs with no update in 4h", "Schedule tomorrow"] },
  { id: "shop_owner",       category: "independent", title: "Shop Owner / Manager",       subtitle: "Business analytics · Staff · Revenue",   emoji: "📈", color: EMERALD, tools: "Revenue tracking · Staff management · Customer retention · Marketing",            prompts: ["Revenue vs last month", "Top customers this quarter", "Average RO value trend", "Maintenance outreach list"] },
  { id: "mobile_tech",      category: "independent", title: "Mobile Technician",          subtitle: "Field service · On-site diagnostics",    emoji: "🚐", color: PINK,    tools: "Job routing · Field diagnostics · Mobile invoicing · Van parts",                 prompts: ["My jobs mapped today", "Invoice customer for service", "Order part to my location", "Nearest parts supplier"] },
  // Transport
  { id: "transport_driver", category: "transport",   title: "Transport Driver (Runner)",  subtitle: "Vehicle pickups · Deliveries · Routes",  emoji: "🚚", color: EMERALD, tools: "Route management · Pickup/delivery jobs · Earnings tracking · Status",           prompts: ["Available jobs near me", "Navigate to next pickup", "Mark delivery complete", "My earnings this week"] },
  { id: "auto_inspector",   category: "transport",   title: "Auto Inspector / Appraiser", subtitle: "Condition reports · Valuations",         emoji: "🔍", color: BLUE,    tools: "Inspection reports · Photo capture · ONYX Certified badge · Appraisals",         prompts: ["Start condition report", "Submit photos for ONYX cert", "Market value Cayenne S", "Inspections this month"] },
];

const CATEGORIES: { id: RoleCategory; label: string; emoji: string; color: string; desc: string }[] = [
  { id: "consumer",    label: "Consumer",               emoji: "🚗", color: GOLD,    desc: "I own, buy, or explore vehicles" },
  { id: "dealership",  label: "Dealership Professional",emoji: "🏢", color: BLUE,    desc: "I work at a dealership" },
  { id: "independent", label: "Independent Specialist", emoji: "🔧", color: PURPLE,  desc: "I run or work at a shop" },
  { id: "transport",   label: "Transport & Inspection", emoji: "🚛", color: EMERALD, desc: "I move or inspect vehicles" },
];

// ─── Peace Sign Logo (inline SVG) ────────────────────────────────────────────
function OnyxLogoSmall() {
  return (
    <Svg width={40} height={40} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={31} stroke={GOLD} strokeWidth={5} fill="none" />
      <Line x1={50} y1={19} x2={50} y2={81} stroke={GOLD} strokeWidth={5} />
      <Line x1={50} y1={81} x2={23} y2={54} stroke={GOLD} strokeWidth={5} />
      <Line x1={50} y1={81} x2={77} y2={54} stroke={GOLD} strokeWidth={5} />
      <Circle cx={50} cy={50} r={4} fill={GOLD} />
    </Svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface OnboardingFlowProps { onComplete: () => void; }

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep]             = useState(0); // 0=intro, 1=category, 2=role, 3=preview, 4=account
  const [category, setCategory]     = useState<RoleCategory | null>(null);
  const [role, setRole]             = useState<RoleOption | null>(null);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]   = useState("");

  // ── Ghost Gate (Golden Key) ──────────────────────────────────────
  const [ghostUnlocked, setGhostUnlocked] = useState(false);
  const [keyCode, setKeyCode]             = useState("");
  const [keyLoading, setKeyLoading]       = useState(false);
  const [keyError, setKeyError]           = useState("");
  const [inviterName, setInviterName]     = useState("");

  async function validateGoldenKey() {
    const trimmed = keyCode.trim().toUpperCase();
    if (!trimmed) { setKeyError("Enter your Golden Key code."); return; }
    setKeyLoading(true);
    setKeyError("");
    try {
      const res  = await fetch(`${BASE}/auth/validate-code?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json() as { valid?: boolean; inviterName?: string; error?: string };
      if (!res.ok || !data.valid) {
        setKeyError(data.error ?? "Invalid code. Get a Golden Key from an existing 3C ONYX member.");
        return;
      }
      setInviterName(data.inviterName ?? "a member");
      setGhostUnlocked(true);
    } catch {
      setKeyError("Could not reach the server. Check your connection.");
    } finally {
      setKeyLoading(false);
    }
  }

  const filteredRoles = category ? ROLES.filter(r => r.category === category) : [];

  async function createAccount() {
    setAuthError("");
    if (!name.trim()) { setAuthError("Enter your full name."); return; }
    if (!email.trim() || !email.includes("@")) { setAuthError("Enter a valid email address."); return; }
    if (password.length < 8) { setAuthError("Password must be at least 8 characters."); return; }
    setAuthLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     name.trim(),
          email:    email.toLowerCase().trim(),
          password,
          role:     role ? roleToApiRole(role.id) : "Member",
          phone:    null,
        }),
      });
      const data = await res.json() as { token?: string; user?: unknown; error?: string };
      if (!res.ok) {
        setAuthError(data.error ?? "Registration failed. Please try again.");
        return;
      }
      if (data.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      }
      await finish();
    } catch {
      setAuthError("Could not connect to server. Check your connection.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    if (role) await AsyncStorage.setItem(ROLE_KEY, role.id);
    onComplete();
  }

  // ── Ghost Gate: Golden Key (blocks all of onboarding) ───────────
  if (!ghostUnlocked) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.introWrap} keyboardShouldPersistTaps="handled">
            <View style={s.ghostLockIcon}>
              <Text style={s.ghostLockEmoji}>🔑</Text>
            </View>
            <Text style={s.introWordmark}>3C ONYX</Text>
            <Text style={s.introTagline}>INVITE-ONLY ACCESS</Text>

            <View style={s.introDivider} />

            <Text style={s.introHeadline}>Enter Your Golden Key</Text>
            <Text style={s.introSub}>
              3C ONYX is invite-only. You need a referral code from an existing member to enter. Your code is your key — every person inside has vouched for the next.
            </Text>

            <TextInput
              style={[s.input, { textAlign: "center", letterSpacing: 4, fontSize: 20, color: GOLD, fontWeight: "700" }]}
              placeholder="e.g.  RON-2KF4"
              placeholderTextColor="rgba(201,162,39,0.35)"
              value={keyCode}
              onChangeText={v => { setKeyCode(v.toUpperCase()); setKeyError(""); }}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => void validateGoldenKey()}
            />

            {!!keyError && (
              <View style={s.ghostError}>
                <Text style={s.ghostErrorText}>{keyError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, keyLoading && { opacity: 0.6 }]}
              onPress={() => void validateGoldenKey()}
              disabled={keyLoading}
            >
              <Text style={s.primaryBtnText}>
                {keyLoading ? "VERIFYING…" : "UNLOCK WITH GOLDEN KEY  →"}
              </Text>
            </TouchableOpacity>

            <Text style={[s.introTagline, { marginTop: 20, color: "rgba(255,255,255,0.2)", fontSize: 10 }]}>
              Don't have a code? Ask an existing ONYX member to share theirs from their Invite & Earn tab.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 0: Intro ───────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <View style={s.introWrap}>
          <OnyxLogoSmall />
          <Text style={s.introWordmark}>3C ONYX</Text>
          <Text style={s.introTagline}>POWERED BY CUXTOMCANDYCLUB LLC</Text>

          <View style={s.introDivider} />

          <Text style={s.introHeadline}>The Automotive Super App</Text>
          {inviterName ? (
            <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={[s.introTagline, { color: `${GOLD}CC`, fontSize: 11, letterSpacing: 1 }]}>
                Vouched for by {inviterName.toUpperCase()}. Welcome home.
              </Text>
            </View>
          ) : null}
          <Text style={s.introSub}>
            Free for everyone. Forever. Built for consumers and every automotive professional — from BDC reps to shop owners to transport drivers.
          </Text>

          <View style={s.introStats}>
            {[
              { num: "16",   label: "Specialist Roles" },
              { num: "9",    label: "CRM Platforms"    },
              { num: "Free", label: "Always"           },
            ].map(stat => (
              <View key={stat.label} style={s.introStat}>
                <Text style={s.introStatNum}>{stat.num}</Text>
                <Text style={s.introStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep(1)}>
            <Text style={s.primaryBtnText}>GET STARTED  →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 1: Category ────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <ScrollView contentContainerStyle={s.stepWrap} showsVerticalScrollIndicator={false}>
          <StepHeader current={1} total={4} />
          <Text style={s.stepTitle}>Which world are you in?</Text>
          <Text style={s.stepSub}>Your role unlocks tools built for how you actually work. Free for everyone.</Text>

          <View style={s.gap16} />

          {CATEGORIES.map(cat => {
            const sel = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catCard, sel && { borderColor: cat.color, backgroundColor: cat.color + "10" }]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.catLabel, sel && { color: "#fff" }]}>{cat.label}</Text>
                  <Text style={s.catDesc}>{cat.desc}</Text>
                  <Text style={[s.catCount, { color: cat.color }]}>
                    {ROLES.filter(r => r.category === cat.id).length} specific roles
                  </Text>
                </View>
                {sel && <Text style={{ fontSize: 18, color: cat.color }}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <View style={s.gap16} />
          <NavButtons
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextDisabled={!category}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Specific Role ────────────────────────────────────────
  if (step === 2 && category) {
    const catMeta = CATEGORIES.find(c => c.id === category)!;
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <ScrollView contentContainerStyle={s.stepWrap} showsVerticalScrollIndicator={false}>
          <StepHeader current={2} total={4} />
          <View style={s.row}>
            <Text style={{ fontSize: 20 }}>{catMeta.emoji}</Text>
            <Text style={[s.stepTitle, { marginLeft: 8 }]}>What is your role?</Text>
          </View>
          <Text style={s.stepSub}>ONYX AI and your dashboard are tailored to exactly how you work every day.</Text>

          <View style={s.gap16} />

          {filteredRoles.map(r => {
            const sel = role?.id === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[s.roleCard, sel && { borderColor: r.color, backgroundColor: r.color + "0D" }]}
                onPress={() => setRole(r)}
                activeOpacity={0.7}
              >
                <View style={[s.roleEmoji, { backgroundColor: r.color + "15" }]}>
                  <Text style={{ fontSize: 18 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.roleTitle, sel && { color: "#fff" }]}>{r.title}</Text>
                  <Text style={s.roleSub}>{r.subtitle}</Text>
                  {sel && <Text style={[s.roleTools, { color: r.color }]}>{r.tools}</Text>}
                </View>
                {sel && <Text style={{ fontSize: 16, color: r.color }}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <View style={s.gap16} />
          <NavButtons
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextDisabled={!role}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 3: ONYX AI Preview ─────────────────────────────────────
  if (step === 3 && role) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <ScrollView contentContainerStyle={s.stepWrap} showsVerticalScrollIndicator={false}>
          <StepHeader current={3} total={4} />
          <Text style={s.stepTitle}>Meet ONYX — your AI</Text>
          <Text style={s.stepSub}>
            ONYX knows you are a <Text style={{ color: role.color, fontWeight: "800" }}>{role.title}</Text>. Every prompt and insight is built around your workflow.
          </Text>

          {/* AI chat bubble */}
          <View style={[s.aiBubbleWrap, { borderColor: GOLD + "25" }]}>
            <View style={s.aiAvatar}>
              <Text style={{ fontSize: 14 }}>✦</Text>
            </View>
            <View style={s.aiBubble}>
              <Text style={s.aiBubbleText}>
                Hey — I'm ONYX. I know you're a {role.title.toLowerCase()}. I track your pipeline, your numbers, your customers. Ask me anything the way you'd ask a colleague.
              </Text>
            </View>
          </View>

          {/* Example prompts */}
          <Text style={s.sectionLabel}>THINGS YOU CAN ASK</Text>
          <View style={s.promptGrid}>
            {role.prompts.map(p => (
              <View key={p} style={[s.promptChip, { borderColor: role.color + "25", backgroundColor: role.color + "08" }]}>
                <Text style={s.promptText}>"{p}"</Text>
              </View>
            ))}
          </View>

          {/* Tools unlocked */}
          <View style={[s.toolsCard, { borderColor: role.color + "20" }]}>
            <Text style={s.sectionLabel}>YOUR TOOLS UNLOCKED</Text>
            <Text style={[s.toolsText, { color: "rgba(255,255,255,0.5)" }]}>{role.tools}</Text>
          </View>

          {/* Platform free note */}
          <View style={[s.freeCard]}>
            <Text style={s.freeText}>
              <Text style={{ color: GOLD, fontWeight: "800" }}>100% free. </Text>
              No subscription, no credit card. The platform is funded by the automotive industry — not by you.
            </Text>
          </View>

          <View style={s.gap16} />

          {/* Final CTA → goes to account creation */}
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: EMERALD }]} onPress={() => setStep(4)}>
            <Text style={[s.primaryBtnText, { color: "#000" }]}>CREATE MY FREE ACCOUNT  →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => setStep(2)}>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 4: Account Creation ────────────────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: DARK }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.stepWrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <StepHeader current={4} total={4} />
            <Text style={s.stepTitle}>Create your account</Text>
            <Text style={s.stepSub}>
              Your profile is saved securely. Free forever — no credit card needed.
              {role ? `\nYou're joining as a ${role.title}.` : ""}
            </Text>

            <View style={s.gap16} />

            <View style={s.authField}>
              <Text style={s.authLabel}>FULL NAME</Text>
              <TextInput
                style={s.authInput}
                placeholder="Ron Williams"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={s.authField}>
              <Text style={s.authLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={s.authInput}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={s.authField}>
              <Text style={s.authLabel}>PASSWORD</Text>
              <TextInput
                style={s.authInput}
                placeholder="8+ characters"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {!!authError && (
              <View style={s.authErrBox}>
                <Text style={s.authErrText}>{authError}</Text>
              </View>
            )}

            <View style={s.gap16} />

            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: GOLD }, authLoading && { opacity: 0.6 }]}
              onPress={() => void createAccount()}
              disabled={authLoading}
            >
              {authLoading
                ? <ActivityIndicator color="#000" />
                : <Text style={s.primaryBtnText}>ENTER THE PLATFORM  →</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16, alignItems: "center" }} onPress={() => void finish()}>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Skip for now — continue without an account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setStep(3)}>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.stepHeader}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            s.stepDot,
            i < current   && { backgroundColor: EMERALD },
            i === current - 1 && { backgroundColor: GOLD    },
          ]}
        />
      ))}
      <Text style={s.stepCount}>STEP {current} OF {total}</Text>
    </View>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <View style={s.navRow}>
      {onBack && (
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[s.nextBtn, nextDisabled && s.nextBtnDisabled]}
        onPress={onNext}
        disabled={nextDisabled}
      >
        <Text style={[s.nextBtnText, nextDisabled && { color: "rgba(255,255,255,0.2)" }]}>
          Continue →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1 },
  introWrap:     { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 32, paddingTop: 60 },
  ghostLockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${GOLD}15`, borderWidth: 1.5, borderColor: `${GOLD}40`, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  ghostLockEmoji:{ fontSize: 36 },
  ghostError:    { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.35)", padding: 12, marginBottom: 16, width: "100%" },
  ghostErrorText:{ color: "#F87171", fontSize: 13, textAlign: "center", lineHeight: 19 },
  introWordmark: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: 8, marginTop: 16, fontFamily: "Inter_700Bold" },
  introTagline:  { fontSize: 9, color: GOLD + "80", letterSpacing: 3, marginTop: 4, textAlign: "center" },
  introDivider:  { width: 60, height: 1, backgroundColor: GOLD + "30", marginVertical: 28 },
  introHeadline: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 12, fontFamily: "Inter_700Bold" },
  introSub:      { fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  introStats:    { flexDirection: "row", gap: 24, marginBottom: 40 },
  introStat:     { alignItems: "center" },
  introStatNum:  { fontSize: 22, fontWeight: "900", color: GOLD, fontFamily: "Inter_700Bold" },
  introStatLabel:{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, letterSpacing: 1 },

  stepWrap:  { padding: 24, paddingBottom: 60 },
  stepHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  stepDot:   { width: 28, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" },
  stepCount: { fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginLeft: 8 },
  stepTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 6, fontFamily: "Inter_700Bold" },
  stepSub:   { fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 20, marginBottom: 4 },
  gap16:     { height: 16 },
  row:       { flexDirection: "row", alignItems: "center" },

  catCard:   { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 14, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  catEmoji:  { fontSize: 28, width: 36, textAlign: "center" },
  catLabel:  { fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.85)", fontFamily: "Inter_700Bold" },
  catDesc:   { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  catCount:  { fontSize: 10, fontWeight: "700", marginTop: 4 },

  roleCard:  { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginBottom: 8 },
  roleEmoji: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  roleTitle: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.8)", fontFamily: "Inter_700Bold" },
  roleSub:   { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  roleTools: { fontSize: 10, marginTop: 5, lineHeight: 16 },

  aiBubbleWrap:  { flexDirection: "row", gap: 12, padding: 16, borderRadius: 14, backgroundColor: GOLD + "07", borderWidth: 1, marginTop: 20, marginBottom: 20 },
  aiAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD + "15", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  aiBubble:      { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12 },
  aiBubbleText:  { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20 },

  sectionLabel:  { fontSize: 9, fontWeight: "800", letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 10 },
  promptGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  promptChip:    { padding: 10, borderRadius: 10, borderWidth: 1, maxWidth: (SW - 48 - 8) / 2 },
  promptText:    { fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 16 },

  toolsCard:     { padding: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, marginBottom: 12 },
  toolsText:     { fontSize: 12, lineHeight: 20 },

  freeCard:      { padding: 14, borderRadius: 12, backgroundColor: GOLD + "08", borderWidth: 1, borderColor: GOLD + "18", marginBottom: 12 },
  freeText:      { fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 18 },

  navRow:        { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  backBtn:       { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  backBtnText:   { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  nextBtn:       { flex: 1, padding: 14, borderRadius: 12, backgroundColor: GOLD, alignItems: "center" },
  nextBtnDisabled:{ backgroundColor: "rgba(255,255,255,0.06)" },
  nextBtnText:   { fontSize: 13, fontWeight: "900", color: "#000", letterSpacing: 1, fontFamily: "Inter_700Bold" },

  primaryBtn:    { width: "100%", padding: 17, borderRadius: 14, backgroundColor: GOLD, alignItems: "center", marginTop: 8 },
  primaryBtnText:{ fontSize: 14, fontWeight: "900", color: "#000", letterSpacing: 2, fontFamily: "Inter_700Bold" },

  input:         { width: "100%", backgroundColor: CARD, borderWidth: 1, borderColor: `${GOLD}30`, borderRadius: 12, padding: 15, color: "#fff", fontSize: 15, marginBottom: 16 },
  authField:     { marginBottom: 16 },
  authLabel:     { fontSize: 9, fontWeight: "700", letterSpacing: 2, color: "rgba(255,255,255,0.3)", marginBottom: 8 },
  authInput:     { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 15, color: "#fff", fontSize: 15 },
  authErrBox:    { padding: 12, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", marginTop: 4 },
  authErrText:   { color: "#F87171", fontSize: 13, lineHeight: 18 },
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export async function checkOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === "true";
}
