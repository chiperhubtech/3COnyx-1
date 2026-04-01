import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useTheme } from "next-themes";

export type SeasonalMode =
  | "none"
  | "christmas"
  | "halloween"
  | "july4th"
  | "thanksgiving"
  | "easter"
  | "valentines"
  | "stpatricks"
  | "cincodemayo"
  | "chinesenewyear"
  | "newyears"
  | "mardigras"
  | "diwali"
  | "birthday";

export type BaseMode = "dark" | "light";

export interface ThemeOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  base: BaseMode;
  season: SeasonalMode;
  group: "core" | "holiday" | "special";
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "dark",           label: "Dark Mode",        icon: "🌙",  description: "Deep Onyx — Classic",        base: "dark",  season: "none",           group: "core" },
  { id: "light",          label: "Light Mode",       icon: "☀️",  description: "Warm Champagne",             base: "light", season: "none",           group: "core" },

  { id: "christmas",      label: "Christmas",        icon: "🎄",  description: "Festive Red & Green",        base: "dark",  season: "christmas",      group: "holiday" },
  { id: "halloween",      label: "Halloween",        icon: "🎃",  description: "Spooky Orange & Purple",     base: "dark",  season: "halloween",      group: "holiday" },
  { id: "july4th",        label: "4th of July",      icon: "🇺🇸", description: "Red, White & Blue",          base: "dark",  season: "july4th",        group: "holiday" },
  { id: "thanksgiving",   label: "Thanksgiving",     icon: "🦃",  description: "Warm Harvest Amber",         base: "dark",  season: "thanksgiving",   group: "holiday" },
  { id: "easter",         label: "Easter",           icon: "🐣",  description: "Pastel Spring",              base: "light", season: "easter",         group: "holiday" },
  { id: "valentines",     label: "Valentine's Day",  icon: "💕",  description: "Rose Pink & Red",            base: "dark",  season: "valentines",     group: "holiday" },
  { id: "stpatricks",     label: "St. Patrick's Day",icon: "☘️",  description: "Lucky Emerald Green",        base: "dark",  season: "stpatricks",     group: "holiday" },
  { id: "cincodemayo",    label: "Cinco de Mayo",    icon: "🪅",  description: "Vibrant Fiesta Colors",      base: "dark",  season: "cincodemayo",    group: "holiday" },
  { id: "chinesenewyear", label: "Chinese New Year", icon: "🧧",  description: "Imperial Red & Gold",        base: "dark",  season: "chinesenewyear", group: "holiday" },
  { id: "newyears",       label: "New Year's Eve",   icon: "🎆",  description: "Midnight Gold Sparkle",      base: "dark",  season: "newyears",       group: "holiday" },
  { id: "mardigras",      label: "Mardi Gras",       icon: "🎭",  description: "Purple, Gold & Green",       base: "dark",  season: "mardigras",      group: "holiday" },
  { id: "diwali",         label: "Diwali",           icon: "🪔",  description: "Festival of Lights",         base: "dark",  season: "diwali",         group: "holiday" },

  { id: "birthday",       label: "Birthday",         icon: "🎂",  description: "It's your special day!",     base: "dark",  season: "birthday",       group: "special" },
];

const ALL_SEASON_CLASSES = THEME_OPTIONS
  .filter(t => t.season !== "none")
  .map(t => `season-${t.season}`);

interface SeasonalThemeContextType {
  season: SeasonalMode;
  activeThemeId: string;
  isBirthday: boolean;
  userBirthday: string | null;
  setSeason: (season: SeasonalMode) => void;
  setFullTheme: (themeId: string) => void;
  setUserBirthday: (date: string | null) => void;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | null>(null);

const STORAGE_KEY = "onyx-seasonal-theme";
const BIRTHDAY_STORAGE_KEY = "onyx-user-birthday";

function checkIsBirthday(birthday: string | null): boolean {
  if (!birthday) return false;
  try {
    const today = new Date();
    const bday = new Date(birthday + "T00:00:00");
    return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
  } catch {
    return false;
  }
}

export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();

  const [userBirthday, setUserBirthdayState] = useState<string | null>(() => {
    try { return localStorage.getItem(BIRTHDAY_STORAGE_KEY); } catch { return null; }
  });

  const isBirthday = checkIsBirthday(userBirthday);

  const [season, setSeasonState] = useState<SeasonalMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.season || "none";
      }
    } catch {}
    return "none";
  });

  const [activeThemeId, setActiveThemeId] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.themeId || "dark";
      }
    } catch {}
    return "dark";
  });

  useEffect(() => {
    if (isBirthday && activeThemeId !== "birthday") {
      let alreadyDismissed = false;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) alreadyDismissed = JSON.parse(stored).birthdayDismissed === new Date().toDateString();
      } catch {}
      if (!alreadyDismissed) {
        setSeasonState("birthday");
        setActiveThemeId("birthday");
        setTheme("dark");
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ themeId: "birthday", season: "birthday" }));
      }
    }
  }, [isBirthday]);

  const applySeasonClass = useCallback((s: SeasonalMode) => {
    const html = document.documentElement;
    ALL_SEASON_CLASSES.forEach(c => html.classList.remove(c));
    if (s !== "none") {
      html.classList.add(`season-${s}`);
    }
  }, []);

  useEffect(() => {
    applySeasonClass(season);
  }, [season, applySeasonClass]);

  const setSeason = useCallback((s: SeasonalMode) => {
    setSeasonState(s);
  }, []);

  const setFullTheme = useCallback((themeId: string) => {
    const option = THEME_OPTIONS.find(t => t.id === themeId);
    if (!option) return;

    setTheme(option.base);
    const s = option.season;
    setSeasonState(s);
    setActiveThemeId(themeId);

    const store: Record<string, unknown> = { themeId, season: s };
    if (isBirthday && themeId !== "birthday") {
      store.birthdayDismissed = new Date().toDateString();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [setTheme, isBirthday]);

  const setUserBirthday = useCallback((date: string | null) => {
    setUserBirthdayState(date);
    if (date) {
      localStorage.setItem(BIRTHDAY_STORAGE_KEY, date);
    } else {
      localStorage.removeItem(BIRTHDAY_STORAGE_KEY);
    }
  }, []);

  return (
    <SeasonalThemeContext.Provider value={{ season, activeThemeId, isBirthday, userBirthday, setSeason, setFullTheme, setUserBirthday }}>
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  const ctx = useContext(SeasonalThemeContext);
  if (!ctx) throw new Error("useSeasonalTheme must be used within SeasonalThemeProvider");
  return ctx;
}
