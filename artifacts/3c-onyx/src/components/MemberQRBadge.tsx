import { useRef, useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  Member: "CLUB MEMBER",
  Dealer: "DEALER PARTNER",
  Runner: "CERTIFIED RUNNER",
  Specialist: "SPECIALIST",
  Admin: "PLATFORM ADMIN",
};

const ROLE_ACCENTS: Record<string, string> = {
  Member: "#C9A227",
  Dealer: "#F59E0B",
  Runner: "#8B5CF6",
  Specialist: "#4FC3F7",
  Admin: "#EF4444",
};

interface MemberQRBadgeProps {
  size?: number;
  showName?: boolean;
  showRole?: boolean;
  showDownload?: boolean;
  variant?: "full" | "compact";
}

export function MemberQRBadge({
  size = 260,
  showName = true,
  showRole = true,
  showDownload = false,
  variant = "full",
}: MemberQRBadgeProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const profileUrl = (() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const code = user?.referralCode || `user-${user?.id || 0}`;
    return `${origin}${base}/m/${code}`;
  })();

  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const accent = ROLE_ACCENTS[user?.role || "Member"] || "#C9A227";
  const roleLabel = ROLE_LABELS[user?.role || "Member"] || "MEMBER";

  const onboardingLabel = user?.onboardingRole
    ? user.onboardingRole.replace(/_/g, " ").toUpperCase()
    : null;

  const logoSize = Math.round(size * 0.24);
  const borderWidth = Math.round(logoSize * 0.08);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    setDownloading(true);
    try {
      const svgEl = containerRef.current.querySelector("svg");
      if (!svgEl) return;

      const canvas = document.createElement("canvas");
      const padding = 40;
      const totalSize = size + padding * 2;
      const nameExtra = showName ? 80 : 0;
      canvas.width = totalSize;
      canvas.height = totalSize + nameExtra;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#111118";
      ctx.beginPath();
      ctx.roundRect(padding / 2, padding / 2, size + padding, size + padding, 20);
      ctx.fill();
      ctx.strokeStyle = `${accent}40`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(padding / 2, padding / 2, size + padding, size + padding, 20);
      ctx.stroke();

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      ctx.drawImage(img, padding, padding, size, size);
      URL.revokeObjectURL(url);

      const cx = padding + size / 2;
      const cy = padding + size / 2;
      const r = logoSize / 2;

      ctx.fillStyle = "#0a0a0f";
      ctx.beginPath();
      ctx.arc(cx, cy, r + borderWidth + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = accent;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(cx, cy, r + borderWidth / 2, 0, Math.PI * 2);
      ctx.stroke();

      if (user?.avatarUrl) {
        const avatarImg = new Image();
        avatarImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          avatarImg.onload = () => resolve();
          avatarImg.onerror = () => resolve();
          avatarImg.src = user.avatarUrl!;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, "#8B6914");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.font = `bold ${Math.round(r * 0.8)}px "Barlow Condensed", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials, cx, cy + 1);
      }

      if (showName && user?.name) {
        const nameY = totalSize + 10;
        ctx.fillStyle = "#fff";
        ctx.font = `800 16px "Barlow Condensed", sans-serif`;
        ctx.textAlign = "center";
        ctx.letterSpacing = "2px";
        ctx.fillText(user.name.toUpperCase(), canvas.width / 2, nameY);

        ctx.fillStyle = accent;
        ctx.font = `700 10px "Barlow Condensed", sans-serif`;
        ctx.fillText(roleLabel, canvas.width / 2, nameY + 20);

        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = `600 8px "Inter", sans-serif`;
        ctx.fillText("3C ONYX · CUXTOMCANDYCLUB LLC", canvas.width / 2, nameY + 40);
      }

      const link = document.createElement("a");
      link.download = `3C-ONYX-QR-${(user?.name || "member").replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("QR download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [user, size, accent, initials, logoSize, borderWidth, showName, roleLabel]);

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: variant === "compact" ? 8 : 16 }}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: 20,
          overflow: "hidden",
          background: "#fff",
          padding: Math.round(size * 0.05),
        }}
      >
        <QRCodeSVG
          value={profileUrl}
          size={size - Math.round(size * 0.1)}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
          style={{ display: "block" }}
        />

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: logoSize + borderWidth * 2 + 4,
            height: logoSize + borderWidth * 2 + 4,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: logoSize + borderWidth * 2,
              height: logoSize + borderWidth * 2,
              borderRadius: "50%",
              border: `${borderWidth}px solid ${accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                crossOrigin="anonymous"
              />
            ) : (
              <div
                style={{
                  width: logoSize,
                  height: logoSize,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${accent} 0%, #8B6914 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: Math.round(logoSize * 0.42),
                    fontWeight: 900,
                    color: "#000",
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showName && (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: variant === "compact" ? 14 : 18,
              fontWeight: 800,
              color: "var(--onyx-text-primary)",
              letterSpacing: "0.08em",
              lineHeight: 1.1,
            }}
          >
            {user.name.toUpperCase()}
          </p>
          {showRole && (
            <p
              style={{
                fontSize: variant === "compact" ? 9 : 11,
                fontWeight: 700,
                color: accent,
                letterSpacing: "0.14em",
                marginTop: 3,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {onboardingLabel || roleLabel}
            </p>
          )}
        </div>
      )}

      {showDownload && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: downloading
              ? "rgba(255,255,255,0.04)"
              : `linear-gradient(135deg, ${accent} 0%, #8B6914 100%)`,
            border: "none",
            color: downloading ? "rgba(255,255,255,0.3)" : "#000",
            fontSize: 12,
            fontWeight: 800,
            cursor: downloading ? "default" : "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.1em",
            transition: "all 0.15s",
          }}
        >
          {downloading ? "GENERATING..." : "DOWNLOAD QR BADGE"}
        </button>
      )}
    </div>
  );
}
