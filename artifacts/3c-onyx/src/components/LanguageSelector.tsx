import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const RTL_LANGS = new Set(["ar"]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("onyx-lang", lang);
    const dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.dir = dir;
  };

  if (compact) {
    return (
      <select
        value={current.code}
        onChange={handleChange}
        aria-label="Select language"
        style={{
          background: "transparent",
          border: "1px solid var(--onyx-border-line)",
          color: "var(--onyx-text-primary)",
          fontSize: "0.7rem",
          padding: "2px 4px",
          borderRadius: "4px",
          cursor: "pointer",
          outline: "none",
          fontFamily: "inherit",
          letterSpacing: "0.05em",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: "var(--onyx-surface)", color: "var(--onyx-text-primary)" }}>
            {lang.flag} {lang.code.toUpperCase()}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "0.65rem", color: "var(--onyx-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {current.flag}
      </span>
      <select
        value={current.code}
        onChange={handleChange}
        aria-label="Select language"
        style={{
          background: "transparent",
          border: "1px solid var(--onyx-border-line)",
          color: "var(--onyx-text-primary)",
          fontSize: "0.7rem",
          padding: "3px 6px",
          borderRadius: "4px",
          cursor: "pointer",
          outline: "none",
          fontFamily: "inherit",
          letterSpacing: "0.05em",
          minWidth: "60px",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: "var(--onyx-surface)", color: "var(--onyx-text-primary)" }}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
