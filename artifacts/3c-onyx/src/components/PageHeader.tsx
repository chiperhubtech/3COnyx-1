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
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`,
            border: `1px solid ${accent}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "28px",
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "4px", lineHeight: 1 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
