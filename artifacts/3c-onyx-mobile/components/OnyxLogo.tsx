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

  const cx = 50, cy = 50, r = 30;

  const forkAngle = Math.PI / 5;
  const topCenter = { x: cx, y: cy - r };
  const bot = { x: cx, y: cy + r };
  const upL = { x: cx - r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };
  const upR = { x: cx + r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };

  const strokeW = variant === "app-icon" ? 3.2 : 2.6;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={gold}  stopOpacity={0.22} />
          <Stop offset="100%" stopColor={gold}  stopOpacity={0}    />
        </RadialGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={gold2} />
          <Stop offset="100%" stopColor={gold}  />
        </LinearGradient>
        <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor={gold2} stopOpacity={0.9} />
          <Stop offset="50%"  stopColor={gold}  stopOpacity={0.6} />
          <Stop offset="100%" stopColor={gold2} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      {(variant === "app-icon" || variant === "dark") && (
        <Circle cx={cx} cy={cy} r={50} fill={dark} />
      )}

      <Circle cx={cx} cy={cy} r={48} fill="url(#glow)" />

      <Circle cx={cx} cy={cy} r={46} fill="none" stroke={ringColor} strokeWidth={0.6} strokeOpacity={0.35} />
      <Circle cx={cx} cy={cy} r={43.5} fill="none" stroke={ringColor} strokeWidth={0.3} strokeOpacity={0.18} />

      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={strokeW} strokeLinecap="round" />

      <Line x1={topCenter.x} y1={topCenter.y} x2={bot.x} y2={bot.y} stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round" />
      <Line x1={cx} y1={cy} x2={upL.x} y2={upL.y} stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round" />
      <Line x1={cx} y1={cy} x2={upR.x} y2={upR.y} stroke={glyphColor} strokeWidth={strokeW} strokeLinecap="round" />

      <SvgText x={30} y={cy + 14} fontSize={14} fontWeight="900" fill="url(#goldGrad)" textAnchor="middle">3</SvgText>
      <SvgText x={70} y={cy + 14} fontSize={14} fontWeight="900" fill={cColor} textAnchor="middle">C</SvgText>

      {variant === "app-icon" && (
        <>
          <Circle cx={topCenter.x} cy={topCenter.y} r={1.5} fill={gold2} />
          <Circle cx={bot.x} cy={bot.y} r={1.5} fill={gold2} />
          <Circle cx={upL.x} cy={upL.y} r={1.5} fill={gold2} />
          <Circle cx={upR.x} cy={upR.y} r={1.5} fill={gold2} />
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
