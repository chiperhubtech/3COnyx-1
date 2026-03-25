/**
 * 3C ONYX — Official Logo Mark
 * ─────────────────────────────────────────────────────────────────────────────
 * Peace symbol integrated with "3C" mark, CUXTOMCANDYCLUB branding.
 * Designed for app icons, headers, and splash screens.
 *
 * Design language: Apple × GTA × Luxury Automotive
 * Colors: ONYX black, championship gold (#C9A227), arctic white
 * Shape: Peace sign (ND/CND movement) repurposed as the 3C brand mark
 */

import React from "react";
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  Path,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
} from "react-native-svg";

interface OnyxLogoProps {
  size?: number;
  variant?: "gold" | "white" | "dark" | "app-icon";
  showWordmark?: boolean;
}

export function OnyxLogo({ size = 48, variant = "gold", showWordmark = false }: OnyxLogoProps) {
  const gold  = "#C9A227";
  const gold2 = "#E8B830";
  const dark  = "#050505";
  const white = "#FFFFFF";

  const ringColor   = variant === "white" ? white  : gold;
  const glyphColor  = variant === "white" ? white  : gold;
  const threeColor  = variant === "dark"  ? dark   : gold;
  const cColor      = variant === "dark"  ? dark   : white;
  const bgColor     = variant === "app-icon" ? dark : "transparent";

  // Peace sign geometry — 100×100 viewBox, centered at (50,50)
  // Peace ring radius: 31
  const cx = 50, cy = 50, r = 31;
  const RAD = Math.PI / 180;

  // Peace sign line endpoints (from center outward to circle edge)
  const top  = { x: cx,                          y: cy - r };       // 90°  (up)
  const bot  = { x: cx,                          y: cy + r };       // 270° (down)
  const botL = { x: cx + r * Math.cos(210*RAD),  y: cy + r * Math.sin(210*RAD) }; // 210°
  const botR = { x: cx + r * Math.cos(330*RAD),  y: cy + r * Math.sin(330*RAD) }; // 330°

  const strokeW = variant === "app-icon" ? 3.2 : 2.6;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Gold radial glow behind the mark */}
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={gold}  stopOpacity={0.22} />
          <Stop offset="100%" stopColor={gold}  stopOpacity={0}    />
        </RadialGradient>
        {/* Gold linear gradient for the 3C text */}
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={gold2} />
          <Stop offset="100%" stopColor={gold}  />
        </LinearGradient>
        {/* Outer ring gradient */}
        <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor={gold2} stopOpacity={0.9} />
          <Stop offset="50%"  stopColor={gold}  stopOpacity={0.6} />
          <Stop offset="100%" stopColor={gold2} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {/* App-icon background */}
      {(variant === "app-icon" || variant === "dark") && (
        <Circle cx={cx} cy={cy} r={50} fill={dark} />
      )}

      {/* Radial glow — subtle ambient light */}
      <Circle cx={cx} cy={cy} r={48} fill="url(#glow)" />

      {/* ─── Outer decorative double ring ─────────────────────────────── */}
      <Circle
        cx={cx} cy={cy} r={46}
        fill="none"
        stroke={ringColor}
        strokeWidth={0.6}
        strokeOpacity={0.35}
      />
      <Circle
        cx={cx} cy={cy} r={43.5}
        fill="none"
        stroke={ringColor}
        strokeWidth={0.3}
        strokeOpacity={0.18}
      />

      {/* ─── Peace sign ring ───────────────────────────────────────────── */}
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* ─── Peace sign lines ─────────────────────────────────────────── */}
      {/* Vertical: top → bottom (full height through center) */}
      <Line
        x1={top.x} y1={top.y} x2={bot.x} y2={bot.y}
        stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round"
      />
      {/* Bottom-left diagonal: center → lower-left */}
      <Line
        x1={cx} y1={cy} x2={botL.x} y2={botL.y}
        stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round"
      />
      {/* Bottom-right diagonal: center → lower-right */}
      <Line
        x1={cx} y1={cy} x2={botR.x} y2={botR.y}
        stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round"
      />

      {/* ─── "3C" brand mark ──────────────────────────────────────────── */}
      {/* "3" — left of vertical line, top zone */}
      <SvgText
        x={38}
        y={55}
        fontSize={16}
        fontWeight="900"
        fill="url(#goldGrad)"
        textAnchor="middle"
      >
        3
      </SvgText>
      {/* "C" — right of vertical line, top zone */}
      <SvgText
        x={62}
        y={55}
        fontSize={16}
        fontWeight="900"
        fill={cColor}
        textAnchor="middle"
      >
        C
      </SvgText>

      {/* ─── App icon corner accents (dot at each line endpoint) ──────── */}
      {variant === "app-icon" && (
        <>
          <Circle cx={top.x}  cy={top.y}  r={1.5} fill={gold2} />
          <Circle cx={bot.x}  cy={bot.y}  r={1.5} fill={gold2} />
          <Circle cx={botL.x} cy={botL.y} r={1.5} fill={gold2} />
          <Circle cx={botR.x} cy={botR.y} r={1.5} fill={gold2} />
        </>
      )}
    </Svg>
  );
}

/* ─── Wordmark version (logo + text side-by-side) ───────────────────────── */
export function OnyxLogoWordmark({ logoSize = 36 }: { logoSize?: number }) {
  return (
    <OnyxLogo size={logoSize} variant="gold" />
  );
}

export default OnyxLogo;
