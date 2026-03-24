import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  size?: "sm" | "md";
}

export function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ width: size === "sm" ? 28 : 32, height: size === "sm" ? 28 : 32 }} />;

  const isDark = theme === "dark";
  const dim = size === "sm" ? 28 : 32;
  const iconSize = size === "sm" ? 13 : 15;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: dim, height: dim,
        borderRadius: 9,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(201,162,39,0.12)" : "rgba(201,162,39,0.10)";
        (e.currentTarget as HTMLButtonElement).style.color = "#C9A227";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
      }}
    >
      {isDark
        ? <Sun size={iconSize} />
        : <Moon size={iconSize} />
      }
    </button>
  );
}
