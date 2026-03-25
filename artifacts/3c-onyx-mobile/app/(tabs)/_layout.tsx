import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme";

// ─── Custom Tab Icon ───────────────────────────────────────────────────────────

function TabIcon({
  icon,
  label,
  focused,
  color,
}: {
  icon:    React.ReactNode;
  label:   string;
  focused: boolean;
  color:   string;
}) {
  return (
    <View style={styles.tabItem}>
      {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{icon}</View>
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   theme.gold,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarShowLabel:         false,
        tabBarStyle: {
          position:         "absolute",
          backgroundColor:  isIOS ? "transparent" : theme.tabBg,
          borderTopWidth:   1,
          borderTopColor:   theme.tabBorder,
          elevation:        0,
          height:           68,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.tabBg }]} />
          ),
      }}
    >
      {/* ── Tab 1: Home ──────────────────────────────────────────── */}
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

      {/* ── Tab 2: Vault ─────────────────────────────────────────── */}
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

      {/* ── Tab 3: Invite ────────────────────────────────────────── */}
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

      {/* ── Tab 4: Scan ──────────────────────────────────────────── */}
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

      {/* ── Hidden screens (accessible via router.push, not tab bar) ── */}
      <Tabs.Screen name="marketplace"   options={{ href: null }} />
      <Tabs.Screen name="garage"        options={{ href: null }} />
      <Tabs.Screen name="wallet"        options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="runner"        options={{ href: null }} />
      <Tabs.Screen name="command"       options={{ href: null }} />
      <Tabs.Screen name="carplay"       options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    minWidth: 60,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -12,
    width: 28,
    height: 2.5,
    borderRadius: 1.5,
  },
  iconWrap: {
    width: 38,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: "rgba(201,162,39,0.12)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 1,
  },
});
