import { useState, useRef, useEffect } from "react";
import { Palette, Gift, Calendar } from "lucide-react";
import { useSeasonalTheme, THEME_OPTIONS, type ThemeOption } from "@/context/SeasonalThemeContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const THEME_COLORS: Record<string, { bg: string; accent: string; border: string }> = {
  dark:           { bg: "#080810", accent: "#C9A227", border: "rgba(201,162,39,0.3)" },
  light:          { bg: "#F8F4ED", accent: "#A07B1A", border: "rgba(160,123,26,0.3)" },
  christmas:      { bg: "#0a0808", accent: "#C41E3A", border: "rgba(196,30,58,0.3)" },
  halloween:      { bg: "#0a0806", accent: "#FF6600", border: "rgba(255,102,0,0.3)" },
  july4th:        { bg: "#060810", accent: "#002868", border: "rgba(0,40,104,0.3)" },
  thanksgiving:   { bg: "#0a0806", accent: "#B8660D", border: "rgba(184,102,13,0.3)" },
  easter:         { bg: "#F0E8F5", accent: "#9B59B6", border: "rgba(155,89,182,0.3)" },
  valentines:     { bg: "#0a0608", accent: "#E91E63", border: "rgba(233,30,99,0.3)" },
  stpatricks:     { bg: "#060a06", accent: "#2E7D32", border: "rgba(46,125,50,0.3)" },
  cincodemayo:    { bg: "#0a0806", accent: "#E65100", border: "rgba(230,81,0,0.3)" },
  chinesenewyear: { bg: "#0a0606", accent: "#D32F2F", border: "rgba(211,47,47,0.3)" },
  newyears:       { bg: "#080810", accent: "#FFD700", border: "rgba(255,215,0,0.3)" },
  mardigras:      { bg: "#08060a", accent: "#7B1FA2", border: "rgba(123,31,162,0.3)" },
  diwali:         { bg: "#0a0806", accent: "#FF8F00", border: "rgba(255,143,0,0.3)" },
  birthday:       { bg: "#0a0610", accent: "#E040FB", border: "rgba(224,64,251,0.3)" },
};

interface ThemeSelectorProps {
  size?: "sm" | "md";
}

function ThemeOptionRow({ opt, isActive, colors, onSelect }: {
  opt: ThemeOption; isActive: boolean; colors: { bg: string; accent: string; border: string }; onSelect: () => void;
}) {
  return (
    <button
      role="menuitem"
      aria-label={opt.label}
      data-testid={`theme-option-${opt.id}`}
      onClick={onSelect}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "6px 8px",
        borderRadius: 9,
        border: isActive ? `1px solid ${colors.border}` : "1px solid transparent",
        background: isActive ? `${colors.accent}12` : "transparent",
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: 1,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "var(--onyx-surface-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: colors.bg,
        border: `2px solid ${colors.accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, flexShrink: 0,
      }}>
        {opt.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 11, fontWeight: 600,
          color: isActive ? colors.accent : "var(--onyx-text-primary)",
          margin: 0, lineHeight: 1.2,
        }}>{opt.label}</p>
        <p style={{
          fontSize: 8, color: "var(--onyx-text-muted)",
          margin: 0, marginTop: 1, letterSpacing: "0.04em",
        }}>{opt.description}</p>
      </div>
      {isActive && (
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: colors.accent,
          boxShadow: `0 0 8px ${colors.accent}`,
          flexShrink: 0,
        }} />
      )}
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 8, fontWeight: 700, letterSpacing: "0.16em",
      color: "var(--onyx-text-dim)",
      fontFamily: "'Barlow Condensed', sans-serif",
      margin: "6px 8px 3px",
    }}>{label}</p>
  );
}

export function ThemeSelector({ size = "md" }: ThemeSelectorProps) {
  const { activeThemeId, setFullTheme, isBirthday, userBirthday, setUserBirthday } = useSeasonalTheme();
  const [open, setOpen] = useState(false);
  const [showBdayInput, setShowBdayInput] = useState(false);
  const [bdayValue, setBdayValue] = useState(userBirthday || "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const dim = size === "sm" ? 28 : 32;
  const activeOption = THEME_OPTIONS.find(t => t.id === activeThemeId) || THEME_OPTIONS[0];

  const coreThemes = THEME_OPTIONS.filter(t => t.group === "core");
  const holidayThemes = THEME_OPTIONS.filter(t => t.group === "holiday");
  const specialThemes = THEME_OPTIONS.filter(t => t.group === "special");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        title="Theme & Seasonal Modes"
        aria-label="Theme & Seasonal Modes"
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="theme-selector-trigger"
        style={{
          width: dim, height: dim,
          borderRadius: 9,
          border: "1px solid var(--onyx-border-line)",
          background: "var(--onyx-surface)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
          color: "var(--onyx-text-secondary)",
          flexShrink: 0,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--onyx-border-accent)";
          e.currentTarget.style.color = "var(--onyx-gold)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--onyx-border-line)";
          e.currentTarget.style.color = "var(--onyx-text-secondary)";
        }}
      >
        <span style={{ fontSize: size === "sm" ? 13 : 15, lineHeight: 1 }}>{activeOption.icon}</span>
      </button>

      {open && (
        <div role="menu" aria-label="Theme options" style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          right: 0,
          width: 250,
          borderRadius: 14,
          border: "1px solid var(--onyx-border-line)",
          background: "var(--onyx-page-bg)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          overflow: "hidden",
          zIndex: 9999,
          animation: "data-stream 0.15s ease",
          display: "flex",
          flexDirection: "column",
          maxHeight: 420,
        }}>
          <div style={{
            padding: "8px 12px 5px",
            borderBottom: "1px solid var(--onyx-border-line)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Palette size={11} style={{ color: "var(--onyx-gold)" }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                color: "var(--onyx-text-muted)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>APPEARANCE</span>
            </div>
          </div>

          <div style={{
            padding: "4px 5px",
            overflowY: "auto",
            flex: 1,
          }}>
            {isBirthday && (
              <>
                <div style={{
                  margin: "4px 6px 6px",
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(224,64,251,0.1), rgba(255,215,0,0.08))",
                  border: "1px solid rgba(224,64,251,0.2)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Gift size={12} style={{ color: "#E040FB" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#E040FB", letterSpacing: "0.06em" }}>
                    HAPPY BIRTHDAY! 🎉
                  </span>
                </div>
              </>
            )}

            <SectionLabel label="MODE" />
            {coreThemes.map((opt) => (
              <ThemeOptionRow
                key={opt.id}
                opt={opt}
                isActive={activeThemeId === opt.id}
                colors={THEME_COLORS[opt.id]}
                onSelect={() => { setFullTheme(opt.id); setOpen(false); }}
              />
            ))}

            <SectionLabel label="HOLIDAYS & SEASONS" />
            {holidayThemes.map((opt) => (
              <ThemeOptionRow
                key={opt.id}
                opt={opt}
                isActive={activeThemeId === opt.id}
                colors={THEME_COLORS[opt.id]}
                onSelect={() => { setFullTheme(opt.id); setOpen(false); }}
              />
            ))}

            <SectionLabel label="SPECIAL" />
            {specialThemes.map((opt) => (
              <ThemeOptionRow
                key={opt.id}
                opt={opt}
                isActive={activeThemeId === opt.id}
                colors={THEME_COLORS[opt.id]}
                onSelect={() => {
                  if (opt.id === "birthday" && !userBirthday) {
                    setShowBdayInput(true);
                    return;
                  }
                  setFullTheme(opt.id);
                  setOpen(false);
                }}
              />
            ))}

            {showBdayInput && (
              <div style={{
                margin: "4px 6px 4px",
                padding: "8px",
                borderRadius: 8,
                background: "var(--onyx-surface)",
                border: "1px solid var(--onyx-border-line)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <Calendar size={10} style={{ color: "var(--onyx-text-muted)" }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: "var(--onyx-text-muted)", letterSpacing: "0.1em" }}>
                    SET YOUR BIRTHDAY
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    type="date"
                    value={bdayValue}
                    onChange={(e) => setBdayValue(e.target.value)}
                    style={{
                      flex: 1, padding: "5px 8px", borderRadius: 6,
                      border: "1px solid var(--onyx-border-line)",
                      background: "var(--onyx-page-bg)",
                      color: "var(--onyx-text-primary)",
                      fontSize: 11,
                    }}
                  />
                  <button
                    onClick={() => {
                      if (bdayValue) {
                        setUserBirthday(bdayValue);
                        const token = localStorage.getItem("3c_auth_token");
                        if (token) {
                          fetch(`${BASE}/api/users/profile`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ birthday: bdayValue }),
                          }).catch(() => {});
                        }
                        setShowBdayInput(false);
                        setFullTheme("birthday");
                        setOpen(false);
                      }
                    }}
                    style={{
                      padding: "5px 10px", borderRadius: 6,
                      background: "#E040FB", color: "#fff",
                      border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: 700,
                    }}
                  >Save</button>
                </div>
              </div>
            )}

            {userBirthday && (
              <div style={{
                margin: "2px 8px 4px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Calendar size={9} style={{ color: "var(--onyx-text-dim)" }} />
                <span style={{ fontSize: 7, color: "var(--onyx-text-dim)", letterSpacing: "0.04em" }}>
                  Birthday: {new Date(userBirthday + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
          </div>

          <div style={{
            padding: "5px 12px 8px",
            borderTop: "1px solid var(--onyx-border-line)",
            flexShrink: 0,
          }}>
            <p style={{
              fontSize: 7, color: "var(--onyx-text-dim)",
              letterSpacing: "0.06em", margin: 0, textAlign: "center",
            }}>
              YOUR PREFERENCE IS SAVED AUTOMATICALLY
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
