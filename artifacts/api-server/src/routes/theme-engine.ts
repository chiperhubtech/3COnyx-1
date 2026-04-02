import { Router, Request, Response } from "express";
import { db, userThemePrefsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

interface OnyxTheme {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  premium: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    gradient: string[];
  };
  darkMode: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
  };
  effects: {
    glassmorphism: boolean;
    neonGlow: boolean;
    particlesBg: boolean;
    scanlines: boolean;
    grain: boolean;
    chrome: boolean;
    flames: boolean;
  };
}

const ONYX_THEMES: OnyxTheme[] = [
  {
    id: "onyx-default",
    name: "ONYX Black & Gold",
    icon: "crown",
    category: "Signature",
    description: "The original. Black obsidian with liquid gold accents. Pure CUXTOMCANDYCLUB DNA.",
    premium: false,
    colors: {
      primary: "#C9A85D",
      secondary: "#1A1A1A",
      accent: "#D4AF37",
      background: "#000000",
      surface: "#111111",
      text: "#FFFFFF",
      textSecondary: "#A0A0A0",
      border: "#2A2A2A",
      success: "#22C55E",
      warning: "#F59E0B",
      error: "#EF4444",
      gradient: ["#C9A85D", "#D4AF37", "#B8860B"],
    },
    darkMode: { background: "#000000", surface: "#111111", text: "#FFFFFF", textSecondary: "#A0A0A0", border: "#2A2A2A" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: false },
  },
  {
    id: "midnight-motorsport",
    name: "Midnight Motorsport",
    icon: "racing-flag",
    category: "Motorsport",
    description: "Le Mans at midnight. Carbon fiber darkness with racing stripe neon. For those who live at 200mph.",
    premium: false,
    colors: {
      primary: "#FF3E3E",
      secondary: "#0D0D0D",
      accent: "#FF6B35",
      background: "#050505",
      surface: "#0F0F0F",
      text: "#F0F0F0",
      textSecondary: "#888888",
      border: "#1F1F1F",
      success: "#00FF87",
      warning: "#FFD600",
      error: "#FF1744",
      gradient: ["#FF3E3E", "#FF6B35", "#FF8C00"],
    },
    darkMode: { background: "#050505", surface: "#0F0F0F", text: "#F0F0F0", textSecondary: "#888888", border: "#1F1F1F" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: true, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: true },
  },
  {
    id: "neon-drift",
    name: "Neon Drift",
    icon: "bolt",
    category: "Street Racing",
    description: "Tokyo drift underground. Neon purple and cyan bleeding through the dark. Illegal street racing energy.",
    premium: false,
    colors: {
      primary: "#A855F7",
      secondary: "#06B6D4",
      accent: "#E879F9",
      background: "#0A0118",
      surface: "#150A2E",
      text: "#F0E7FF",
      textSecondary: "#9D8EC4",
      border: "#2D1B69",
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F43F5E",
      gradient: ["#A855F7", "#E879F9", "#06B6D4"],
    },
    darkMode: { background: "#0A0118", surface: "#150A2E", text: "#F0E7FF", textSecondary: "#9D8EC4", border: "#2D1B69" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: true, particlesBg: true, scanlines: false, grain: false, chrome: false, flames: false },
  },
  {
    id: "gta-vice",
    name: "GTA Vice City",
    icon: "sunset",
    category: "GTA",
    description: "Vice City nights. Hot pink on teal. Palm trees and bass drops. The city is yours.",
    premium: false,
    colors: {
      primary: "#FF1493",
      secondary: "#00CED1",
      accent: "#FF69B4",
      background: "#0D001A",
      surface: "#1A0033",
      text: "#FFE4F0",
      textSecondary: "#CC99CC",
      border: "#330066",
      success: "#00FF7F",
      warning: "#FFD700",
      error: "#FF4500",
      gradient: ["#FF1493", "#FF69B4", "#00CED1"],
    },
    darkMode: { background: "#0D001A", surface: "#1A0033", text: "#FFE4F0", textSecondary: "#CC99CC", border: "#330066" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: true, particlesBg: true, scanlines: true, grain: false, chrome: false, flames: false },
  },
  {
    id: "gta-san-andreas",
    name: "GTA San Andreas",
    icon: "grove",
    category: "GTA",
    description: "Grove Street. Families. Green on black. OG Los Santos energy. All you had to do was follow the damn train.",
    premium: false,
    colors: {
      primary: "#00C853",
      secondary: "#1B5E20",
      accent: "#69F0AE",
      background: "#0A0A0A",
      surface: "#121812",
      text: "#E8F5E9",
      textSecondary: "#81C784",
      border: "#1B3A1B",
      success: "#00E676",
      warning: "#FFB300",
      error: "#FF3D00",
      gradient: ["#00C853", "#69F0AE", "#1B5E20"],
    },
    darkMode: { background: "#0A0A0A", surface: "#121812", text: "#E8F5E9", textSecondary: "#81C784", border: "#1B3A1B" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: false },
  },
  {
    id: "navy-seal",
    name: "Navy SEAL Ops",
    icon: "anchor",
    category: "Military",
    description: "Silent. Lethal. Precision. Tactical navy with steel blue. Every mission accomplished, no excuses.",
    premium: false,
    colors: {
      primary: "#1E3A5F",
      secondary: "#4A90D9",
      accent: "#7FB3E0",
      background: "#0A1628",
      surface: "#0E1F38",
      text: "#D4E4F7",
      textSecondary: "#7FA3C9",
      border: "#1A3050",
      success: "#4ADE80",
      warning: "#EAB308",
      error: "#DC2626",
      gradient: ["#1E3A5F", "#4A90D9", "#7FB3E0"],
    },
    darkMode: { background: "#0A1628", surface: "#0E1F38", text: "#D4E4F7", textSecondary: "#7FA3C9", border: "#1A3050" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: true, grain: true, chrome: false, flames: false },
  },
  {
    id: "army-ranger",
    name: "Army Ranger",
    icon: "shield",
    category: "Military",
    description: "Rangers lead the way. Olive drab, tactical tan, and mission black. Built for operators.",
    premium: false,
    colors: {
      primary: "#556B2F",
      secondary: "#8B7355",
      accent: "#9ACD32",
      background: "#0C0E08",
      surface: "#141A0E",
      text: "#E8E8D0",
      textSecondary: "#A0A080",
      border: "#2A3218",
      success: "#32CD32",
      warning: "#DAA520",
      error: "#B22222",
      gradient: ["#556B2F", "#8B7355", "#9ACD32"],
    },
    darkMode: { background: "#0C0E08", surface: "#141A0E", text: "#E8E8D0", textSecondary: "#A0A080", border: "#2A3218" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: false },
  },
  {
    id: "dub-magazine",
    name: "DUB Show",
    icon: "star",
    category: "Car Culture",
    description: "Chrome everything. 30-inch rims. Candy paint. DUB Magazine lifestyle — if it ain't big, it ain't right.",
    premium: false,
    colors: {
      primary: "#C0C0C0",
      secondary: "#FFD700",
      accent: "#E8E8E8",
      background: "#0A0A0A",
      surface: "#1A1A1A",
      text: "#FFFFFF",
      textSecondary: "#C0C0C0",
      border: "#333333",
      success: "#50C878",
      warning: "#FFD700",
      error: "#FF2400",
      gradient: ["#C0C0C0", "#FFD700", "#E8E8E8"],
    },
    darkMode: { background: "#0A0A0A", surface: "#1A1A1A", text: "#FFFFFF", textSecondary: "#C0C0C0", border: "#333333" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: false, grain: false, chrome: true, flames: false },
  },
  {
    id: "nypd-blue",
    name: "NYPD Pursuit",
    icon: "siren",
    category: "Emergency",
    description: "Code 3. Lights and sirens. NYPD blue with emergency white. The city that never sleeps.",
    premium: false,
    colors: {
      primary: "#003399",
      secondary: "#FFFFFF",
      accent: "#4169E1",
      background: "#000814",
      surface: "#001D3D",
      text: "#E0E7FF",
      textSecondary: "#8DA4C8",
      border: "#003566",
      success: "#06D6A0",
      warning: "#FFD166",
      error: "#EF233C",
      gradient: ["#003399", "#4169E1", "#1E90FF"],
    },
    darkMode: { background: "#000814", surface: "#001D3D", text: "#E0E7FF", textSecondary: "#8DA4C8", border: "#003566" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: false },
  },
  {
    id: "fdny-inferno",
    name: "FDNY Inferno",
    icon: "fire",
    category: "Emergency",
    description: "Five alarm. FDNY red on smoke black. Bravest in the world. Every second counts.",
    premium: false,
    colors: {
      primary: "#CC0000",
      secondary: "#FF4500",
      accent: "#FF6347",
      background: "#0A0000",
      surface: "#1A0505",
      text: "#FFE0D0",
      textSecondary: "#CC8866",
      border: "#3A0A0A",
      success: "#00CC44",
      warning: "#FF8C00",
      error: "#FF0000",
      gradient: ["#CC0000", "#FF4500", "#FF6347"],
    },
    darkMode: { background: "#0A0000", surface: "#1A0505", text: "#FFE0D0", textSecondary: "#CC8866", border: "#3A0A0A" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: true, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: true },
  },
  {
    id: "monster-truck",
    name: "Monster Truck Rally",
    icon: "truck",
    category: "Motorsport",
    description: "GRAVE DIGGER ENERGY. Mud, diesel, and destruction. Orange flames on matte black. SUNDAY SUNDAY SUNDAY.",
    premium: false,
    colors: {
      primary: "#FF6600",
      secondary: "#8B4513",
      accent: "#FFD700",
      background: "#0A0800",
      surface: "#1A1408",
      text: "#FFE8CC",
      textSecondary: "#CC9944",
      border: "#332200",
      success: "#44CC00",
      warning: "#FFAA00",
      error: "#FF2200",
      gradient: ["#FF6600", "#FFD700", "#FF2200"],
    },
    darkMode: { background: "#0A0800", surface: "#1A1408", text: "#FFE8CC", textSecondary: "#CC9944", border: "#332200" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: true },
  },
  {
    id: "rodeo-rust",
    name: "Rodeo Circuit",
    icon: "lasso",
    category: "Motorsport",
    description: "8 seconds of glory. Dusty leather brown, rodeo gold, arena sand. Bull riding meets car culture.",
    premium: false,
    colors: {
      primary: "#8B6914",
      secondary: "#A0522D",
      accent: "#DAA520",
      background: "#0E0A04",
      surface: "#1A140A",
      text: "#F5DEB3",
      textSecondary: "#BDB76B",
      border: "#3A2A10",
      success: "#6B8E23",
      warning: "#CD853F",
      error: "#B22222",
      gradient: ["#8B6914", "#DAA520", "#A0522D"],
    },
    darkMode: { background: "#0E0A04", surface: "#1A140A", text: "#F5DEB3", textSecondary: "#BDB76B", border: "#3A2A10" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: false },
  },
  {
    id: "formula-1",
    name: "Formula 1",
    icon: "trophy",
    category: "Motorsport",
    description: "Pole position. Carbon black with Ferrari red highlights. 1.6 second pit stops. Maximum attack.",
    premium: false,
    colors: {
      primary: "#E10600",
      secondary: "#15151E",
      accent: "#FF1801",
      background: "#070707",
      surface: "#15151E",
      text: "#F1F1F1",
      textSecondary: "#909090",
      border: "#2A2A30",
      success: "#00D2BE",
      warning: "#FFF200",
      error: "#E10600",
      gradient: ["#E10600", "#FF1801", "#15151E"],
    },
    darkMode: { background: "#070707", surface: "#15151E", text: "#F1F1F1", textSecondary: "#909090", border: "#2A2A30" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: false, grain: false, chrome: true, flames: false },
  },
  {
    id: "nycha-concrete",
    name: "NYCHA Projects",
    icon: "building",
    category: "Urban",
    description: "Concrete jungle. Project hallway green and brick red. Where legends are made. From the block to the boardroom.",
    premium: false,
    colors: {
      primary: "#4A6741",
      secondary: "#8B4513",
      accent: "#CD853F",
      background: "#0A0A08",
      surface: "#151512",
      text: "#D4D4C8",
      textSecondary: "#8A8A7A",
      border: "#2A2A22",
      success: "#2E8B57",
      warning: "#CD853F",
      error: "#CD5C5C",
      gradient: ["#4A6741", "#8B4513", "#CD853F"],
    },
    darkMode: { background: "#0A0A08", surface: "#151512", text: "#D4D4C8", textSecondary: "#8A8A7A", border: "#2A2A22" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: false },
  },
  {
    id: "lowrider-candy",
    name: "Lowrider Candy Paint",
    icon: "sparkle",
    category: "Car Culture",
    description: "Candy apple red, metal flake, three-wheel motion. Hydraulics hitting switches. CUXTOMCANDYCLUB roots.",
    premium: false,
    colors: {
      primary: "#DC143C",
      secondary: "#FFD700",
      accent: "#FF69B4",
      background: "#0A0005",
      surface: "#1A050F",
      text: "#FFE0EC",
      textSecondary: "#CC7799",
      border: "#3A0A1A",
      success: "#00FF7F",
      warning: "#FFD700",
      error: "#FF1744",
      gradient: ["#DC143C", "#FFD700", "#FF69B4"],
    },
    darkMode: { background: "#0A0005", surface: "#1A050F", text: "#FFE0EC", textSecondary: "#CC7799", border: "#3A0A1A" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: true, particlesBg: false, scanlines: false, grain: false, chrome: true, flames: false },
  },
  {
    id: "drag-strip",
    name: "Drag Strip",
    icon: "lightning",
    category: "Motorsport",
    description: "Quarter mile. Burnout smoke and nitrous blue flames. Christmas tree green-yellow-red. 0-60 in 1.9 seconds.",
    premium: false,
    colors: {
      primary: "#39FF14",
      secondary: "#FFD700",
      accent: "#FF4500",
      background: "#050505",
      surface: "#101010",
      text: "#E0FFE0",
      textSecondary: "#88CC88",
      border: "#1A2A1A",
      success: "#39FF14",
      warning: "#FFD700",
      error: "#FF0000",
      gradient: ["#39FF14", "#FFD700", "#FF0000"],
    },
    darkMode: { background: "#050505", surface: "#101010", text: "#E0FFE0", textSecondary: "#88CC88", border: "#1A2A1A" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: true, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: true },
  },
  {
    id: "off-road-baja",
    name: "Baja Off-Road",
    icon: "compass",
    category: "Motorsport",
    description: "1000 miles of desert. Dust clouds, cactus green, and sunset orange. Baja 1000 endurance.",
    premium: false,
    colors: {
      primary: "#E2703A",
      secondary: "#546747",
      accent: "#F5C542",
      background: "#0C0A06",
      surface: "#1A1610",
      text: "#F5E6D3",
      textSecondary: "#B8A088",
      border: "#2E2618",
      success: "#6B8E23",
      warning: "#F5C542",
      error: "#CD5C5C",
      gradient: ["#E2703A", "#F5C542", "#546747"],
    },
    darkMode: { background: "#0C0A06", surface: "#1A1610", text: "#F5E6D3", textSecondary: "#B8A088", border: "#2E2618" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: false, particlesBg: false, scanlines: false, grain: true, chrome: false, flames: false },
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    icon: "flame",
    category: "Street Racing",
    description: "Red line. Flat out. Hellcat energy with supercharger whine. Devil's in the details.",
    premium: false,
    colors: {
      primary: "#FF0000",
      secondary: "#1A1A1A",
      accent: "#FF4444",
      background: "#080000",
      surface: "#140000",
      text: "#FFD0D0",
      textSecondary: "#AA5555",
      border: "#330000",
      success: "#00CC00",
      warning: "#FF8800",
      error: "#FF0000",
      gradient: ["#FF0000", "#FF4444", "#880000"],
    },
    darkMode: { background: "#080000", surface: "#140000", text: "#FFD0D0", textSecondary: "#AA5555", border: "#330000" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: false, neonGlow: true, particlesBg: false, scanlines: false, grain: false, chrome: false, flames: true },
  },
  {
    id: "luxury-platinum",
    name: "Platinum VIP",
    icon: "gem",
    category: "Luxury",
    description: "Rolls Royce Phantom energy. Platinum on midnight. Champagne accents. The 1% experience.",
    premium: true,
    colors: {
      primary: "#E5E4E2",
      secondary: "#C4B7A6",
      accent: "#B8A88A",
      background: "#080808",
      surface: "#121212",
      text: "#F5F5F5",
      textSecondary: "#B0B0B0",
      border: "#252525",
      success: "#90EE90",
      warning: "#C4B7A6",
      error: "#CD5C5C",
      gradient: ["#E5E4E2", "#C4B7A6", "#B8A88A"],
    },
    darkMode: { background: "#080808", surface: "#121212", text: "#F5F5F5", textSecondary: "#B0B0B0", border: "#252525" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: false, particlesBg: false, scanlines: false, grain: false, chrome: true, flames: false },
  },
  {
    id: "electric-future",
    name: "Electric Future",
    icon: "zap",
    category: "EV",
    description: "Tesla Cybertruck meets Tron. Electric blue on matte black. The future is now.",
    premium: false,
    colors: {
      primary: "#00D4FF",
      secondary: "#0066FF",
      accent: "#00FFCC",
      background: "#000A14",
      surface: "#001428",
      text: "#E0F7FF",
      textSecondary: "#66B2CC",
      border: "#002244",
      success: "#00FFCC",
      warning: "#FFD700",
      error: "#FF3366",
      gradient: ["#00D4FF", "#0066FF", "#00FFCC"],
    },
    darkMode: { background: "#000A14", surface: "#001428", text: "#E0F7FF", textSecondary: "#66B2CC", border: "#002244" },
    typography: { headingFont: "Barlow Condensed", bodyFont: "Inter", monoFont: "JetBrains Mono" },
    effects: { glassmorphism: true, neonGlow: true, particlesBg: true, scanlines: true, grain: false, chrome: false, flames: false },
  },
];

const THEME_CATEGORIES = [...new Set(ONYX_THEMES.map(t => t.category))];

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Theme Engine",
    version: "1.0.0",
    description: "20 culture-driven themes — motorsport, military, GTA, car club, urban, luxury — pure CUXTOMCANDYCLUB energy",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    totalThemes: ONYX_THEMES.length,
    categories: THEME_CATEGORIES,
    defaultTheme: "onyx-default",
    features: {
      darkModeToggle: true,
      perUserPersistence: true,
      cssVariableExport: true,
      visualEffects: ["glassmorphism", "neonGlow", "particlesBg", "scanlines", "grain", "chrome", "flames"],
    },
  });
});

router.get("/list", (req: Request, res: Response) => {
  const category = req.query.category as string;
  let themes = ONYX_THEMES;
  if (category) {
    themes = themes.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  res.json({
    themes: themes.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      category: t.category,
      description: t.description,
      premium: t.premium,
      primaryColor: t.colors.primary,
      gradient: t.colors.gradient,
    })),
    categories: THEME_CATEGORIES,
    totalThemes: themes.length,
  });
});

router.get("/theme/:themeId", (req: Request, res: Response) => {
  const theme = ONYX_THEMES.find(t => t.id === req.params.themeId);
  if (!theme) {
    res.status(404).json({ error: "Theme not found", available: ONYX_THEMES.map(t => t.id) });
    return;
  }
  res.json({ theme });
});

router.get("/theme/:themeId/css", (req: Request, res: Response) => {
  const theme = ONYX_THEMES.find(t => t.id === req.params.themeId);
  if (!theme) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }

  const darkMode = req.query.darkMode !== "false";
  const bg = darkMode ? theme.darkMode : theme.colors;

  const css = `:root {
  --onyx-primary: ${theme.colors.primary};
  --onyx-secondary: ${theme.colors.secondary};
  --onyx-accent: ${theme.colors.accent};
  --onyx-bg: ${darkMode ? theme.darkMode.background : theme.colors.background};
  --onyx-surface: ${darkMode ? theme.darkMode.surface : theme.colors.surface};
  --onyx-text: ${darkMode ? theme.darkMode.text : theme.colors.text};
  --onyx-text-secondary: ${darkMode ? theme.darkMode.textSecondary : theme.colors.textSecondary};
  --onyx-border: ${darkMode ? theme.darkMode.border : theme.colors.border};
  --onyx-success: ${theme.colors.success};
  --onyx-warning: ${theme.colors.warning};
  --onyx-error: ${theme.colors.error};
  --onyx-gradient: linear-gradient(135deg, ${theme.colors.gradient.join(", ")});
  --onyx-heading-font: '${theme.typography.headingFont}', sans-serif;
  --onyx-body-font: '${theme.typography.bodyFont}', sans-serif;
  --onyx-mono-font: '${theme.typography.monoFont}', monospace;
}`;

  res.setHeader("Content-Type", "text/css");
  res.send(css);
});

router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const [pref] = await db.select().from(userThemePrefsTable)
      .where(eq(userThemePrefsTable.userId, userId)).limit(1);

    const themeId = pref?.themeId || "onyx-default";
    const theme = ONYX_THEMES.find(t => t.id === themeId) || ONYX_THEMES[0];
    const darkMode = pref?.darkMode ?? true;

    res.json({
      userId,
      themeId,
      darkMode,
      theme,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch theme preference", detail: String(error) });
  }
});

router.post("/user/:userId/set", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { themeId, darkMode } = req.body;

    if (themeId && !ONYX_THEMES.find(t => t.id === themeId)) {
      res.status(400).json({ error: "Invalid theme ID", available: ONYX_THEMES.map(t => t.id) });
      return;
    }

    const [existing] = await db.select().from(userThemePrefsTable)
      .where(eq(userThemePrefsTable.userId, userId)).limit(1);

    if (existing) {
      const updates: any = { updatedAt: new Date() };
      if (themeId !== undefined) updates.themeId = themeId;
      if (darkMode !== undefined) updates.darkMode = darkMode;

      const [updated] = await db.update(userThemePrefsTable)
        .set(updates).where(eq(userThemePrefsTable.userId, userId)).returning();

      const theme = ONYX_THEMES.find(t => t.id === updated.themeId);
      res.json({ message: `Theme set to ${theme?.name}`, preference: updated, theme });
    } else {
      const [created] = await db.insert(userThemePrefsTable).values({
        userId,
        themeId: themeId || "onyx-default",
        darkMode: darkMode ?? true,
      }).returning();

      const theme = ONYX_THEMES.find(t => t.id === created.themeId);
      res.status(201).json({ message: `Theme set to ${theme?.name}`, preference: created, theme });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to set theme", detail: String(error) });
  }
});

router.get("/categories", (_req: Request, res: Response) => {
  const categories = THEME_CATEGORIES.map(cat => ({
    category: cat,
    themes: ONYX_THEMES.filter(t => t.category === cat).map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      primaryColor: t.colors.primary,
      premium: t.premium,
    })),
    count: ONYX_THEMES.filter(t => t.category === cat).length,
  }));

  res.json({ categories, totalCategories: categories.length, totalThemes: ONYX_THEMES.length });
});

export default router;
