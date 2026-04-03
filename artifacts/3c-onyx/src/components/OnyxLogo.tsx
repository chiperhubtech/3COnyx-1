/**
 * 3C ONYX — Logo Mark
 * Peace sign (fork facing UP to the sky) with 3 on left, C on right underneath
 */

import React from "react";

interface OnyxLogoProps {
  size?: number;
  variant?: "gold" | "white" | "dark" | "app-icon";
  className?: string;
}

export function OnyxLogo({ size = 40, variant = "gold", className }: OnyxLogoProps) {
  const gold  = "#C9A227";
  const gold2 = "#E8B830";
  const white = "#FFFFFF";
  const dark  = "#050505";

  const glyphColor = variant === "white" ? white : gold2;
  const ringColor  = variant === "white" ? white : gold;
  const threeColor = variant === "dark"  ? dark  : gold;
  const cColor     = variant === "dark"  ? dark  : white;

  const cx = 50, cy = 42, r = 28;
  const sw = 3.2;

  const forkAngle = Math.PI / 4;
  const top = { x: cx, y: cy - r };
  const bot = { x: cx, y: cy + r };
  const upL = { x: cx - r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };
  const upR = { x: cx + r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };

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
        <radialGradient id="oglow" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor={gold}  stopOpacity="0.2" />
          <stop offset="100%" stopColor={gold}  stopOpacity="0"   />
        </radialGradient>
        <linearGradient id="ogoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={gold2} />
          <stop offset="100%" stopColor={gold}  />
        </linearGradient>
        <linearGradient id="oringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={gold2} stopOpacity="1" />
          <stop offset="50%"  stopColor={gold}  stopOpacity="0.8" />
          <stop offset="100%" stopColor={gold2} stopOpacity="1" />
        </linearGradient>
      </defs>

      {variant === "app-icon" && <circle cx={50} cy={50} r={50} fill={dark} />}

      <circle cx={cx} cy={cy} r={42} fill="url(#oglow)" />

      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#oringGrad)" strokeWidth={sw} strokeLinecap="round" />

      <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx}    y1={cy}    x2={upL.x} y2={upL.y} stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx}    y1={cy}    x2={upR.x} y2={upR.y} stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />

      <text
        x="35" y="88"
        fontSize="16" fontWeight="900"
        fill="url(#ogoldGrad)"
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', 'Helvetica', sans-serif"
      >3</text>
      <text
        x="65" y="88"
        fontSize="16" fontWeight="900"
        fill={cColor}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Inter', 'Helvetica', sans-serif"
      >C</text>
    </svg>
  );
}

export default OnyxLogo;
