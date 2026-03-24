/**
 * 3C Onyx — Global Footer
 * Applied to all public-facing pages.
 * "3C Onyx — Powered by CUXTOMCANDYCLUB LLC"
 */
import { Link } from "wouter";
import { Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function GlobalFooter() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  const bg = isDark ? "#05050a" : "#EDE7DC";
  const border = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const textMuted = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.30)";
  const textDim = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)";
  const textFg = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";

  const FOOTER_LINKS = [
    { labelKey: "footer.links.technology", href: "/technology" },
    { labelKey: "footer.links.sdvLayer",   href: "/sdv" },
    { labelKey: "footer.links.trustLayer", href: "/landing" },
    { labelKey: "footer.links.join",       href: "/join" },
    { labelKey: "footer.links.privacy",    href: "/legal/privacy" },
    { labelKey: "footer.links.terms",      href: "/legal/terms" },
  ];

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}`, padding: "48px 24px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #C9A227 0%, #5B3A00 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(201,162,39,0.2)",
                flexShrink: 0,
              }}>
                <Shield size={15} style={{ color: "#000" }} />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', system-ui, sans-serif",
                  fontSize: 20, fontWeight: 900,
                  color: isDark ? "#fff" : "#0A0A0A",
                  letterSpacing: "0.1em", lineHeight: 1,
                }}>3C ONYX</div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", color: "#C9A227", marginTop: 2 }}>
                  {t("nav.poweredBy")}
                </div>
              </div>
            </div>
            <p style={{ color: textMuted, fontSize: 12, maxWidth: 280, lineHeight: 1.6, fontStyle: "italic" }}>
              {t("footer.tagline")}
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <div style={{
                  padding: "5px 12px", borderRadius: 8,
                  fontSize: 11, fontWeight: 600, color: textFg,
                  cursor: "pointer", letterSpacing: "0.04em",
                  border: `1px solid ${border}`,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.color = "#C9A227";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,162,39,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.color = textFg;
                    (e.currentTarget as HTMLDivElement).style.borderColor = border;
                  }}
                >
                  {t(link.labelKey)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ color: textDim, fontSize: 10, letterSpacing: "0.08em" }}>
              © 2026 CUXTOMCANDYCLUB LLC. {t("footer.allRights")}
            </p>
            <p style={{ color: textDim, fontSize: 9, letterSpacing: "0.08em", marginTop: 3 }}>
              {t("footer.founded")}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 9, color: textDim, letterSpacing: "0.14em" }}>{t("footer.aes")}</span>
            <span style={{ fontSize: 9, color: textDim, letterSpacing: "0.14em" }}>{t("footer.soc2")}</span>
            <span style={{ fontSize: 9, color: textDim, letterSpacing: "0.14em" }}>{t("footer.blockchain")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
