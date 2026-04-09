import React from "react";

interface OnyxLogoProps {
  size?: number;
  variant?: "gold" | "white" | "dark" | "app-icon";
  className?: string;
}

export function OnyxLogo({ size = 40, variant = "gold", className }: OnyxLogoProps) {
  const gold  = "#C9A227";
  const gold2 = "#E8B830";
  const gold3 = "#D4AF37";
  const white = "#FFFFFF";
  const dark  = "#050505";
  const black = "#000000";

  const isAppIcon = variant === "app-icon";
  const isDark = variant === "dark";
  const isWhite = variant === "white";

  const ringStroke = isWhite ? white : "url(#oringGrad)";
  const glyphStroke = isWhite ? white : "url(#ogoldGrad)";
  const textFill = isDark ? dark : isWhite ? white : "url(#ogoldGrad)";

  const cx = 50, cy = 50, r = 32;
  const sw = 2.8;

  const forkTopY = cy - r + 2;
  const forkBotY = cy + r - 2;
  const forkAngle = Math.PI / 5.5;
  const forkLen = r * 0.85;
  const upLx = cx - forkLen * Math.sin(forkAngle);
  const upLy = cy - forkLen * Math.cos(forkAngle);
  const upRx = cx + forkLen * Math.sin(forkAngle);
  const upRy = cy - forkLen * Math.cos(forkAngle);

  const crossY = cy + 2;
  const crossHalf = r * 0.55;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="3C ONYX Logo"
    >
      <defs>
        <radialGradient id="oglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={gold}  stopOpacity="0.15" />
          <stop offset="100%" stopColor={gold}  stopOpacity="0"   />
        </radialGradient>
        <linearGradient id="ogoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={gold2} />
          <stop offset="50%"  stopColor={gold3} />
          <stop offset="100%" stopColor={gold}  />
        </linearGradient>
        <linearGradient id="oringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={gold2} stopOpacity="1" />
          <stop offset="35%"  stopColor={gold}  stopOpacity="0.7" />
          <stop offset="65%"  stopColor={gold3} stopOpacity="0.9" />
          <stop offset="100%" stopColor={gold2} stopOpacity="1" />
        </linearGradient>
        <linearGradient id="oshineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={gold2} stopOpacity="0" />
          <stop offset="50%"  stopColor={gold2} stopOpacity="0.4" />
          <stop offset="100%" stopColor={gold2} stopOpacity="0" />
        </linearGradient>
      </defs>

      {isAppIcon && (
        <>
          <rect x="0" y="0" width="100" height="100" rx="22" fill={black} />
          <rect x="1" y="1" width="98" height="98" rx="21" fill="none" stroke={gold} strokeWidth="0.5" strokeOpacity="0.3" />
        </>
      )}

      <circle cx={cx} cy={cy} r={44} fill="url(#oglow)" />

      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={isWhite ? white : gold} strokeWidth="0.5" strokeOpacity="0.15" />

      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ringStroke} strokeWidth={sw} strokeLinecap="round" />

      <line x1={cx} y1={forkTopY} x2={cx} y2={forkBotY}
        stroke={glyphStroke} strokeWidth={sw * 0.9} strokeLinecap="round" />

      <line x1={cx} y1={cy} x2={upLx} y2={upLy}
        stroke={glyphStroke} strokeWidth={sw * 0.9} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={upRx} y2={upRy}
        stroke={glyphStroke} strokeWidth={sw * 0.9} strokeLinecap="round" />

      <line x1={cx - crossHalf} y1={crossY} x2={cx + crossHalf} y2={crossY}
        stroke={glyphStroke} strokeWidth={sw * 0.7} strokeLinecap="round" />

      <text
        x={22} y={cy + 16}
        fontSize="15" fontWeight="900"
        fill={textFill}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Barlow Condensed', 'Inter', 'Helvetica', sans-serif"
        letterSpacing="0.5"
      >3</text>
      <text
        x={78} y={cy + 16}
        fontSize="15" fontWeight="900"
        fill={textFill}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Barlow Condensed', 'Inter', 'Helvetica', sans-serif"
        letterSpacing="0.5"
      >C</text>

      {!isAppIcon && (
        <line x1={cx - 18} y1={cy + 28} x2={cx + 18} y2={cy + 28}
          stroke="url(#oshineGrad)" strokeWidth="0.5" />
      )}
    </svg>
  );
}

export default OnyxLogo;
