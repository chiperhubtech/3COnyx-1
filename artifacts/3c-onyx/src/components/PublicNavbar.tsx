/**
 * 3C Onyx — Public Navbar
 * Used on: landing, join, sdv, technology, waitlist
 * Sticky · blur backdrop · dual theme
 */
import { Link } from "wouter";
import { ThemeSelector } from "./ThemeSelector";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import { OnyxLogo } from "./OnyxLogo";

export function PublicNavbar() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = !mounted || theme === "dark";

  const navBg = scrolled
    ? isDark
      ? "rgba(8,8,16,0.92)"
      : "rgba(248,244,237,0.92)"
    : "transparent";

  const borderColor = scrolled
    ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"
    : "transparent";

  const textColor = isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: `1px solid ${borderColor}`,
      transition: "all 0.3s ease",
    }}>
      <div className={`sovereign-topbar-rule${scrolled ? " visible" : ""}`} />
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 24px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Brand */}
        <Link href="/landing">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }}>
            <OnyxLogo size={36} variant={isDark ? "gold" : "dark"} />
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', system-ui, sans-serif",
                fontSize: 17, fontWeight: 900,
                color: isDark ? "#fff" : "#0A0A0A",
                letterSpacing: "0.08em", lineHeight: 1,
              }}>3C ONYX</div>
              <div style={{
                fontSize: 8, fontWeight: 700, letterSpacing: "0.2em",
                color: "#C9A227", lineHeight: 1, marginTop: 2,
              }}>{t("nav.poweredBy")}</div>
            </div>
          </div>
        </Link>

        {/* Nav links — hidden on mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
          {[
            { key: "nav.home", href: "/landing" },
            { key: "nav.technology", href: "/technology" },
            { key: "nav.sdvLayer", href: "/sdv" },
            { key: "nav.join", href: "/join" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="sovereign-link" style={{
                padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: textColor,
                letterSpacing: "0.03em", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.color = "#C9A227";
                  (e.currentTarget as HTMLDivElement).style.background = isDark ? "rgba(201,162,39,0.07)" : "rgba(201,162,39,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.color = textColor;
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {t(link.key)}
              </div>
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageSelector compact />
          <ThemeSelector size="sm" />
          <Link href="/join">
            <div className="sovereign-cta" style={{
              padding: "7px 16px",
              fontSize: 12,
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              borderRadius: 9,
            }}>
              {t("nav.joinNow")}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
