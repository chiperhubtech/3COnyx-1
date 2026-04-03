import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { router } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme";
import { COLORS } from "@/constants/colors";

/* ─── Pulse ring (FAB ambient glow animation) ────────────────────────────── */

function PulseRing({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.5,  duration: 1400, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,    duration: 1400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,    duration: 1400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5,  duration: 1400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position:     "absolute",
        width:        48,
        height:       48,
        borderRadius: 24,
        borderWidth:  1,
        borderColor:  color,
        transform:    [{ scale }],
        opacity,
      }}
    />
  );
}

/* ─── Floating "Ask ONYX" FAB ────────────────────────────────────────────── */

function AskOnyxFAB() {
  const { theme } = useTheme();
  const scale     = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.90, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => router.push("/(tabs)/command" as never)}
        accessibilityLabel="Ask ONYX AI"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.fabOuter, { transform: [{ scale }] }]}>
          <PulseRing color={COLORS.gold} />
          <View
            style={[
              styles.fabPill,
              {
                backgroundColor: theme.card,
                borderColor:     theme.goldBorder,
                shadowColor:     COLORS.gold,
              },
            ]}
          >
            <Feather name="zap" size={15} color={COLORS.gold} />
            <Text style={[styles.fabText, { color: COLORS.gold }]}>Ask ONYX</Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

/* ─── Custom Tab Icon ─────────────────────────────────────────────────────── */

function TabIcon({
  icon,
  label,
  focused,
  color,
  isAI = false,
}: {
  icon:    React.ReactNode;
  label:   string;
  focused: boolean;
  color:   string;
  isAI?:   boolean;
}) {
  if (isAI) {
    return (
      <View style={styles.aiTabWrap}>
        <View
          style={[
            styles.aiTabBtn,
            {
              backgroundColor: focused ? `${COLORS.gold}20` : `${COLORS.gold}10`,
              borderColor:     focused ?  COLORS.gold        : `${COLORS.gold}45`,
            },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.aiTabLabel, { color }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabItem}>
      {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{icon}</View>
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const isIOS = Platform.OS === "ios";

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown:             false,
          tabBarActiveTintColor:   theme.gold,
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarShowLabel:         false,
          tabBarStyle: {
            position:        "absolute",
            backgroundColor: isIOS ? "transparent" : theme.tabBg,
            borderTopWidth:  1,
            borderTopColor:  theme.tabBorder,
            elevation:       0,
            height:          68,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.tabBg }]} />
            ),
        }}
      >
        {/* ── Tab 1: Home ──────────────────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  isIOS
                    ? <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
                    : <Feather name="home" size={20} color={color} />
                }
                label="Home"
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        {/* ── Tab 2: Vault ─────────────────────────────────────── */}
        <Tabs.Screen
          name="vault"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  <Ionicons
                    name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
                    size={20}
                    color={color}
                  />
                }
                label="Vault"
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        {/* ── Tab 3: AI — CENTER ─────────────────────────────── */}
        <Tabs.Screen
          name="command"
          options={{
            tabBarActiveTintColor:   COLORS.gold,
            tabBarInactiveTintColor: `${COLORS.gold}80`,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<Feather name="zap" size={22} color={color} />}
                label="AI"
                focused={focused}
                color={color}
                isAI
              />
            ),
          }}
        />

        {/* ── Tab 4: Invite ────────────────────────────────────── */}
        <Tabs.Screen
          name="referral"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  isIOS
                    ? <Ionicons name={focused ? "people" : "people-outline"} size={20} color={color} />
                    : <Feather name="users" size={20} color={color} />
                }
                label="Invite"
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        {/* ── Tab 5: Scan ──────────────────────────────────────── */}
        <Tabs.Screen
          name="scan"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  <MaterialCommunityIcons
                    name={focused ? "camera-iris" : "camera-outline"}
                    size={20}
                    color={color}
                  />
                }
                label="Scan"
                focused={focused}
                color={color}
              />
            ),
          }}
        />

        {/* ── Hidden screens (router.push only) ─────────────────── */}
        <Tabs.Screen name="marketplace"   options={{ href: null }} />
        <Tabs.Screen name="garage"        options={{ href: null }} />
        <Tabs.Screen name="wallet"        options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="runner"        options={{ href: null }} />
        <Tabs.Screen name="carplay"       options={{ href: null }} />
        <Tabs.Screen name="upgrade"       options={{ href: null }} />
      </Tabs>

      {/* ── Floating "Ask ONYX" AI button (above tab bar, every screen) ── */}
      <AskOnyxFAB />
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  // Standard tab item
  tabItem: {
    alignItems:     "center",
    justifyContent: "flex-end",
    paddingBottom:  2,
    minWidth:       60,
    position:       "relative",
  },
  activeIndicator: {
    position:     "absolute",
    top:          -12,
    width:        28,
    height:       2.5,
    borderRadius: 1.5,
  },
  iconWrap: {
    width:          38,
    height:         32,
    alignItems:     "center",
    justifyContent: "center",
    borderRadius:   10,
  },
  iconWrapActive: {
    backgroundColor: "rgba(201,162,39,0.12)",
  },
  tabLabel: {
    fontSize:      10,
    fontWeight:    "600",
    letterSpacing: 0.3,
    marginTop:     1,
  },

  // AI center tab
  aiTabWrap: {
    alignItems:     "center",
    justifyContent: "flex-end",
    paddingBottom:  2,
    minWidth:       60,
  },
  aiTabBtn: {
    width:          42,
    height:         34,
    borderRadius:   12,
    borderWidth:    1,
    alignItems:     "center",
    justifyContent: "center",
  },
  aiTabLabel: {
    fontSize:      10,
    fontWeight:    "800",
    letterSpacing: 0.8,
    marginTop:     1,
  },

  // FAB
  fabContainer: {
    position:       "absolute",
    bottom:         82,
    right:          16,
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         999,
  },
  fabOuter: {
    alignItems:     "center",
    justifyContent: "center",
    position:       "relative",
  },
  fabPill: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            6,
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderRadius:   24,
    borderWidth:    1,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.35,
    shadowRadius:   14,
    elevation:      10,
  },
  fabText: {
    fontSize:      12,
    fontWeight:    "800",
    letterSpacing: 0.5,
  },
});
