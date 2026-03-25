/**
 * 3C ONYX — Web Logo Mark (pure SVG, zero dependencies)
 * Peace symbol + 3C mark — works as favicon, header, og:image
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

  const ringColor  = variant === "white" ? white : gold;
  const glyphColor = variant === "white" ? white : gold;
  const threeColor = variant === "dark"  ? dark  : gold;
  const cColor     = variant === "dark"  ? dark  : white;

  const RAD = Math.PI / 180;
  const cx = 50, cy = 50, r = 31;

  const top  = { x: cx,                         y: cy - r };
  const bot  = { x: cx,                         y: cy + r };
  const botL = { x: cx + r * Math.cos(210*RAD), y: cy + r * Math.sin(210*RAD) };
  const botR = { x: cx + r * Math.cos(330*RAD), y: cy + r * Math.sin(330*RAD) };

  const sw = 2.8;

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
          <stop offset="0%"   stopColor={gold}  stopOpacity="0.2" />
          <stop offset="100%" stopColor={gold}  stopOpacity="0"   />
        </radialGradient>
        <linearGradient id="ogoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={gold2} />
          <stop offset="100%" stopColor={gold}  />
        </linearGradient>
        <linearGradient id="oringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={gold2} stopOpacity="0.9" />
          <stop offset="50%"  stopColor={gold}  stopOpacity="0.6" />
          <stop offset="100%" stopColor={gold2} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Background for app-icon */}
      {variant === "app-icon" && <circle cx={cx} cy={cy} r={50} fill={dark} />}

      {/* Ambient glow */}
      <circle cx={cx} cy={cy} r={48} fill="url(#oglow)" />

      {/* Outer decorative ring */}
      <circle cx={cx} cy={cy} r={46} fill="none" stroke={ringColor} strokeWidth="0.6" strokeOpacity="0.35" />
      <circle cx={cx} cy={cy} r={43.5} fill="none" stroke={ringColor} strokeWidth="0.3" strokeOpacity="0.18" />

      {/* Peace sign ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#oringGrad)" strokeWidth={sw} strokeLinecap="round" />

      {/* Peace sign lines */}
      <line x1={top.x}  y1={top.y}  x2={bot.x}  y2={bot.y}  stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx}     y1={cy}     x2={botL.x} y2={botL.y} stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx}     y1={cy}     x2={botR.x} y2={botR.y} stroke={glyphColor} strokeWidth={sw} strokeLinecap="round" />

      {/* "3C" mark */}
      <text
        x="37" y="50"
        fontSize="16" fontWeight="900"
        fill="url(#ogoldGrad)"
        textAnchor="middle" dominantBaseline="middle"
      >3</text>
      <text
        x="63" y="50"
        fontSize="16" fontWeight="900"
        fill={cColor}
        textAnchor="middle" dominantBaseline="middle"
      >C</text>
    </svg>
  );
}

export default OnyxLogo;
