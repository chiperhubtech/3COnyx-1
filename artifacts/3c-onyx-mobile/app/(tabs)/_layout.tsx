import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/theme";

function TabIcon({
  icon,
  label,
  focused,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.tabItem}>
      {focused && <View style={styles.activeIndicator} />}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        {icon}
      </View>
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : theme.tabBg,
          borderTopWidth: 1,
          borderTopColor: theme.tabBorder,
          elevation: 0,
          height: isWeb ? 84 : 68,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: theme.tabBg }]}
            />
          ),
      }}
    >
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
              label={t("tabs.home", "Home")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={<MaterialCommunityIcons name="car-multiple" size={20} color={color} />}
              label={t("tabs.market", "Market")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={<MaterialCommunityIcons name={focused ? "garage-open" : "garage"} size={20} color={color} />}
              label={t("tabs.garage", "Garage")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <Ionicons name={focused ? "wallet" : "wallet-outline"} size={20} color={color} />
              }
              label={t("tabs.wallet", "Wallet")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                isIOS
                  ? <Ionicons name={focused ? "notifications" : "notifications-outline"} size={20} color={color} />
                  : <Feather name="bell" size={20} color={color} />
              }
              label={t("tabs.alerts", "Alerts")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="runner"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <Ionicons name={focused ? "car" : "car-outline"} size={20} color={color} />
              }
              label={t("tabs.tasks", "Tasks")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={<MaterialCommunityIcons name="radar" size={20} color={color} />}
              label={t("tabs.command", "Command")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="carplay"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={
                <Ionicons
                  name={focused ? "car-sport" : "car-sport-outline"}
                  size={20}
                  color={color}
                />
              }
              label={t("tabs.inVehicle", "In-Vehicle")}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    minWidth: 44,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -12,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#C9A227",
  },
  iconWrap: {
    width: 36,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: "rgba(201,162,39,0.10)",
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
