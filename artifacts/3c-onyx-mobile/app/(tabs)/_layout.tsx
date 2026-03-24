import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: "rgba(255,255,255,0.3)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#0F0F0F",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: "rgba(255,255,255,0.06)",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0F0F0F" }]} />
          ) : null,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <Ionicons name="home" size={size} color={color} />
            ) : (
              <Feather name="home" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="car-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="garage-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="runner"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
          tabBarLabel: t("tabs.tasks"),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
          tabBarLabel: t("tabs.wallet"),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <Ionicons name="notifications" size={size} color={color} />
            ) : (
              <Feather name="bell" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="radar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="carplay"
        options={{
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <Ionicons name="car-sport-outline" size={size} color={color} />
            ) : (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
          tabBarLabel: t("tabs.inVehicle"),
        }}
      />
    </Tabs>
  );
}
