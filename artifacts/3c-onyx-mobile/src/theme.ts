/**
 * 3C Onyx — Design Token System
 * Single source of truth for colors, spacing, typography, and shadows.
 * Apple × GTA luxury aesthetic. Security First.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";

// ─── Color Palettes ────────────────────────────────────────────────────────────

export const DARK = {
  // Backgrounds
  bg:          "#080810",
  bgDeep:      "#050508",
  surface:     "#0F0F18",
  card:        "#14141F",
  cardAlt:     "#1A1A27",
  cardBorder:  "rgba(255,255,255,0.07)",
  overlay:     "rgba(0,0,0,0.85)",

  // Gold system
  gold:        "#C9A227",
  goldBright:  "#E2B832",
  goldDim:     "rgba(201,162,39,0.60)",
  goldMuted:   "rgba(201,162,39,0.12)",
  goldBorder:  "rgba(201,162,39,0.20)",
  goldGlow:    "rgba(201,162,39,0.08)",

  // Text
  text:        "#FFFFFF",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.30)",
  textFaint:   "rgba(255,255,255,0.12)",

  // Status
  success:     "#00C853",
  successDim:  "rgba(0,200,83,0.12)",
  warning:     "#FFA726",
  warningDim:  "rgba(255,167,38,0.12)",
  danger:      "#FF3B30",
  dangerDim:   "rgba(255,59,48,0.12)",
  info:        "#007AFF",
  infoDim:     "rgba(0,122,255,0.12)",

  // Tier colors
  bronze:      "#CD7F32",
  bronzeDim:   "rgba(205,127,50,0.12)",
  silver:      "#A8A9AD",
  silverDim:   "rgba(168,169,173,0.12)",
  platinum:    "#E5E4E2",
  platinumDim: "rgba(229,228,226,0.10)",

  // Tab bar
  tabBg:       "#080810",
  tabActive:   "#C9A227",
  tabInactive: "rgba(255,255,255,0.28)",
  tabBorder:   "rgba(255,255,255,0.06)",
} as const;

export const LIGHT = {
  bg:          "#F6F2EC",
  bgDeep:      "#EDE8E0",
  surface:     "#FFFFFF",
  card:        "#FFFFFF",
  cardAlt:     "#F9F6F0",
  cardBorder:  "rgba(0,0,0,0.08)",
  overlay:     "rgba(255,255,255,0.92)",

  gold:        "#B8920E",
  goldBright:  "#C9A227",
  goldDim:     "rgba(184,146,14,0.60)",
  goldMuted:   "rgba(184,146,14,0.10)",
  goldBorder:  "rgba(184,146,14,0.25)",
  goldGlow:    "rgba(184,146,14,0.06)",

  text:        "#0A0A0F",
  textSub:     "rgba(10,10,15,0.55)",
  textMuted:   "rgba(10,10,15,0.38)",
  textFaint:   "rgba(10,10,15,0.12)",

  success:     "#00A040",
  successDim:  "rgba(0,160,64,0.10)",
  warning:     "#E07B00",
  warningDim:  "rgba(224,123,0,0.10)",
  danger:      "#D32F2F",
  dangerDim:   "rgba(211,47,47,0.10)",
  info:        "#0066CC",
  infoDim:     "rgba(0,102,204,0.10)",

  bronze:      "#B8660A",
  bronzeDim:   "rgba(184,102,10,0.10)",
  silver:      "#707070",
  silverDim:   "rgba(112,112,112,0.10)",
  platinum:    "#4A4A52",
  platinumDim: "rgba(74,74,82,0.08)",

  tabBg:       "#FFFFFF",
  tabActive:   "#B8920E",
  tabInactive: "rgba(10,10,15,0.35)",
  tabBorder:   "rgba(0,0,0,0.08)",
} as const;

export type Theme = typeof DARK | typeof LIGHT;

// ─── Spacing Scale (8-pt grid) ─────────────────────────────────────────────────

export const SPACE = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

// ─── Border Radii ──────────────────────────────────────────────────────────────

export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────

export const TYPE = {
  eyebrow: { fontSize: 9,  fontWeight: "800" as const, letterSpacing: 3  },
  label:   { fontSize: 10, fontWeight: "700" as const, letterSpacing: 2  },
  caption: { fontSize: 11, fontWeight: "500" as const, letterSpacing: 0.2 },
  body:    { fontSize: 14, fontWeight: "400" as const, letterSpacing: 0  },
  bodySm:  { fontSize: 13, fontWeight: "400" as const, letterSpacing: 0  },
  bodyMd:  { fontSize: 15, fontWeight: "500" as const, letterSpacing: 0  },
  heading: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3 },
  title:   { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5 },
  hero:    { fontSize: 34, fontWeight: "900" as const, letterSpacing: -1  },
  wordmark:{ fontSize: 18, fontWeight: "900" as const, letterSpacing: 4  },
} as const;

// ─── Shadow tokens ─────────────────────────────────────────────────────────────

export const SHADOW = {
  gold: {
    shadowColor:   "#C9A227",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius:  12,
    elevation:     6,
  },
  card: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius:  8,
    elevation:     4,
  },
} as const;

// ─── Theme Context ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "@3conyx:colorScheme";

type ThemeMode = "dark" | "light" | "auto";

interface ThemeContextValue {
  theme:   Theme;
  mode:    ThemeMode;
  isDark:  boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:   DARK,
  mode:    "dark",
  isDark:  true,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("auto");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "dark" || saved === "light" || saved === "auto") {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resolvedDark = mode === "auto" ? systemScheme !== "light" : mode === "dark";
  const theme = resolvedDark ? DARK : LIGHT;

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, mode, isDark: resolvedDark, setMode } },
    children
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
