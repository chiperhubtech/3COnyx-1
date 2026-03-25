import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/i18n";
import { DARK, ThemeProvider, useTheme } from "@/src/theme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemedStack() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function BrandedLoader() {
  return (
    <View style={styles.loaderWrap}>
      <View style={styles.loaderLogoRing}>
        <Text style={styles.loaderMark}>◆</Text>
      </View>
      <Text style={styles.loaderWordmark}>3C ONYX</Text>
      <Text style={styles.loaderTagline}>POWERED BY CUXTOMCANDYCLUB LLC</Text>
      <ActivityIndicator color={DARK.gold} style={styles.loaderSpinner} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <BrandedLoader />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ThemedStack />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: DARK.bgDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  loaderLogoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: DARK.goldBorder,
    backgroundColor: DARK.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loaderMark: {
    color: DARK.gold,
    fontSize: 28,
  },
  loaderWordmark: {
    color: DARK.gold,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 8,
    marginBottom: 6,
  },
  loaderTagline: {
    color: DARK.textMuted,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 2,
  },
  loaderSpinner: {
    marginTop: 36,
  },
});
