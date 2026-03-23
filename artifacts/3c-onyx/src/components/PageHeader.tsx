import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, accent = "#C9A227", badge, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: "16px 20px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        flexShrink: 0,
      }}
    >
      {/* Left: icon + title block (can shrink) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "11px",
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`,
            border: `1px solid ${accent}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Title row — badge floats right of title, collapses to new line if needed */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(19px, 5vw, 26px)",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.03em",
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
              marginTop: "3px",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions (never shrinks) */}
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
