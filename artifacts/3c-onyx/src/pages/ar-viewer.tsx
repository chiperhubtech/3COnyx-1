import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  Eye, Shield, Wrench, Navigation, Radio, Zap, AlertTriangle,
  CheckCircle2, X, ChevronRight, MapPin, Cpu, Activity,
  RotateCcw, Layers, Target, Gauge, Thermometer, Battery,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Mode = "guardian" | "repair" | "nav";

const STATUS_CFG = {
  CRITICAL: { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", glow: "0 0 12px rgba(248,113,113,0.4)" },
  WARNING:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  glow: "0 0 12px rgba(245,158,11,0.3)"  },
  OK:       { color: "#34D399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  glow: "0 0 12px rgba(52,211,153,0.3)"  },
};

// ─── Guardian HUD Canvas ─────────────────────────────────────────────────────
function GuardianHUD({ alerts, obd }: { alerts: any[]; obd: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const tickRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      tickRef.current++;
      const t = tickRef.current;

      ctx.clearRect(0, 0, W, H);

      // ── Background ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "rgba(3,4,12,1)");
      bgGrad.addColorStop(0.38, "rgba(4,6,16,1)");
      bgGrad.addColorStop(0.38, "rgba(6,6,8,1)");
      bgGrad.addColorStop(1, "rgba(4,4,6,1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const VP = { x: W * 0.5, y: H * 0.36 };

      // ── Horizon glow ──
      const horizGlow = ctx.createLinearGradient(0, VP.y - 30, 0, VP.y + 30);
      horizGlow.addColorStop(0, "rgba(201,162,39,0)");
      horizGlow.addColorStop(0.5, "rgba(201,162,39,0.08)");
      horizGlow.addColorStop(1, "rgba(201,162,39,0)");
      ctx.fillStyle = horizGlow;
      ctx.fillRect(0, VP.y - 30, W, 60);

      // ── Perspective grid (road surface) ──
      ctx.save();
      ctx.globalAlpha = 0.28;
      // Lateral lines
      const GRID_COUNT = 16;
      for (let i = 0; i <= GRID_COUNT; i++) {
        const ratio = Math.pow(i / GRID_COUNT, 0.65);
        const y = VP.y + (H - VP.y) * ratio;
        const hw = ((y - VP.y) / (H - VP.y)) * W * 0.72;
        const alpha = Math.min(1, ratio * 2.2);
        ctx.strokeStyle = `rgba(201,162,39,${(0.12 + ratio * 0.22) * alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(VP.x - hw, y); ctx.lineTo(VP.x + hw, y); ctx.stroke();
      }
      // Radial lines from vanishing point
      const radialCount = 10;
      for (let i = 0; i <= radialCount; i++) {
        const t2 = (i / radialCount) - 0.5;
        const xBase = VP.x + t2 * W * 1.4;
        ctx.strokeStyle = "rgba(201,162,39,0.15)";
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(VP.x, VP.y); ctx.lineTo(xBase, H + 20); ctx.stroke();
      }
      ctx.restore();

      // ── Lane markers (gold center lane) ──
      ctx.save();
      ctx.setLineDash([20, 14]);
      ctx.lineDashOffset = -(t * 1.8) % 34;
      const laneGrad = ctx.createLinearGradient(0, VP.y, 0, H);
      laneGrad.addColorStop(0, "rgba(201,162,39,0)");
      laneGrad.addColorStop(1, "rgba(201,162,39,0.55)");
      ctx.strokeStyle = laneGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(VP.x - 8, VP.y + 20); ctx.lineTo(W * 0.28, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(VP.x + 8, VP.y + 20); ctx.lineTo(W * 0.72, H); ctx.stroke();
      ctx.restore();

      // ── Lane guard rails (green) ──
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(VP.x, VP.y + 2); ctx.lineTo(W * 0.08, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(VP.x, VP.y + 2); ctx.lineTo(W * 0.92, H); ctx.stroke();
      ctx.restore();

      // ── ADAS Vehicle Detection Boxes ──
      const targets = [
        { x: W * 0.5,  y: VP.y + (H - VP.y) * 0.32, w: W * 0.11, h: (H - VP.y) * 0.22, color: "#34D399", label: "VEH-001", dist: "48m", safe: true },
        { x: W * 0.36, y: VP.y + (H - VP.y) * 0.55, w: W * 0.09, h: (H - VP.y) * 0.18, color: "#C9A227", label: "VEH-002", dist: "22m", safe: true },
        { x: W * 0.62, y: VP.y + (H - VP.y) * 0.72, w: W * 0.07, h: (H - VP.y) * 0.12, color: "#F87171", label: "HAZARD",  dist: "11m", safe: false },
      ];
      targets.forEach((tgt) => {
        const pulse = tgt.safe ? 1 : 0.5 + 0.5 * Math.sin(t * 0.12);
        ctx.save();
        ctx.globalAlpha = 0.65 + pulse * 0.2;
        ctx.strokeStyle = tgt.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tgt.x - tgt.w / 2, tgt.y - tgt.h, tgt.w, tgt.h);
        // Corner accents
        const c = 10;
        ctx.lineWidth = 3;
        const x0 = tgt.x - tgt.w / 2, y0 = tgt.y - tgt.h;
        const x1 = tgt.x + tgt.w / 2, y1 = tgt.y;
        const drawCorner = (ax: number, ay: number, dx: number, dy: number) => {
          ctx.beginPath(); ctx.moveTo(ax, ay + dy * c); ctx.lineTo(ax, ay); ctx.lineTo(ax + dx * c, ay); ctx.stroke();
        };
        drawCorner(x0, y0, 1, 1); drawCorner(x1, y0, -1, 1);
        drawCorner(x0, y1, 1, -1); drawCorner(x1, y1, -1, -1);
        // Label
        ctx.font = `bold 9px 'Courier New'`;
        ctx.fillStyle = tgt.color;
        ctx.fillText(tgt.label, x0 + 2, y0 - 6);
        ctx.fillText(tgt.dist, x1 - 28, y0 - 6);
        ctx.restore();
      });

      // ── Alert Banner (top) if CRITICAL alerts ──
      const critCount = alerts.filter((a: any) => a.severity === "CRITICAL").length;
      if (critCount > 0) {
        const bannerAlpha = 0.6 + 0.4 * Math.sin(t * 0.18);
        ctx.save();
        ctx.globalAlpha = bannerAlpha * 0.9;
        const bannerGrad = ctx.createLinearGradient(0, 0, W, 0);
        bannerGrad.addColorStop(0, "rgba(248,113,113,0)");
        bannerGrad.addColorStop(0.5, "rgba(248,113,113,0.18)");
        bannerGrad.addColorStop(1, "rgba(248,113,113,0)");
        ctx.fillStyle = bannerGrad;
        ctx.fillRect(0, 0, W, 42);
        ctx.font = "bold 12px 'Courier New'";
        ctx.fillStyle = `rgba(248,113,113,${bannerAlpha})`;
        ctx.textAlign = "center";
        ctx.fillText(`⚠ GUARDIAN ALERT — ${critCount} CRITICAL FAULT${critCount > 1 ? "S" : ""} DETECTED — RUNNER DISPATCHED`, W / 2, 26);
        ctx.textAlign = "left";
        ctx.restore();
      }

      // ── HUD Readouts ──
      const hud = (x: number, y: number, label: string, val: string, color = "#C9A227", right = false) => {
        ctx.save();
        ctx.font = "700 8px 'Courier New'";
        ctx.fillStyle = "rgba(201,162,39,0.4)";
        if (right) { ctx.textAlign = "right"; ctx.fillText(label, x, y); ctx.font = "700 15px 'Courier New'"; ctx.fillStyle = color; ctx.fillText(val, x, y + 16); }
        else        { ctx.fillText(label, x, y); ctx.font = "700 15px 'Courier New'"; ctx.fillStyle = color; ctx.fillText(val, x, y + 16); }
        ctx.restore();
      };
      hud(18, 60, "SPEED", `${obd?.speedMph ?? 0} MPH`);
      hud(18, 96, "HEADING", `${obd?.headingDeg ?? 274}°`);
      hud(W - 18, 60, "BATTERY", `${obd?.batteryVoltage ?? 11.8}V`, obd?.batteryVoltage < 12 ? "#F87171" : "#34D399", true);
      hud(W - 18, 96, "ENG TEMP", `${obd?.engineTemp ?? 208}°F`, obd?.engineTemp > 220 ? "#F87171" : "#C9A227", true);
      hud(18, H - 40, "OIL PRESS", `${obd?.oilPressure ?? 41} PSI`);
      hud(W - 18, H - 40, "FUEL", `${obd?.fuelLevel ?? 68}%`, "#34D399", true);

      // ── Compass heading arc ──
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "rgba(201,162,39,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.06, 40, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      const headingRad = ((obd?.headingDeg ?? 274) * Math.PI) / 180 - Math.PI / 2;
      ctx.strokeStyle = "#C9A227";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, H * 0.06);
      ctx.lineTo(W / 2 + Math.cos(headingRad) * 14, H * 0.06 + Math.sin(headingRad) * 14);
      ctx.stroke();
      ctx.font = "bold 9px 'Courier New'";
      ctx.fillStyle = "#C9A227";
      ctx.textAlign = "center";
      ctx.fillText("W", W / 2, H * 0.06 + 5);
      ctx.restore();

      // ── Scan line ──
      const scanY = VP.y + ((t * 2.2) % (H - VP.y));
      ctx.save();
      const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
      scanGrad.addColorStop(0, "rgba(201,162,39,0)");
      scanGrad.addColorStop(0.5, "rgba(201,162,39,0.12)");
      scanGrad.addColorStop(1, "rgba(201,162,39,0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 4, W, 8);
      ctx.restore();

      // ── V2X Ping dots ──
      [[18, H - 20], [W - 18, H - 20]].forEach(([px, py], i) => {
        const pingAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.09 + i * 1.5));
        ctx.save();
        ctx.globalAlpha = pingAlpha;
        ctx.fillStyle = "#4FC3F7";
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#4FC3F7";
        ctx.lineWidth = 1;
        ctx.globalAlpha = pingAlpha * 0.4;
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });

      // ── Rocksolid brand watermark ──
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.font = "700 11px 'Courier New'";
      ctx.fillStyle = "#C9A227";
      ctx.textAlign = "right";
      ctx.fillText("ROCKSOLID AR · BASEMARK · LATENCY 4ms", W - 14, H - 8);
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect(); };
  }, [alerts, obd]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", background: "transparent" }}
    />
  );
}

// ─── Repair Mode Vehicle Schematic ───────────────────────────────────────────
function RepairMode({ components, vehicleLabel }: { components: any[]; vehicleLabel: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);

  const sel = selected ? components.find((c) => c.id === selected) : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* AR Studio header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#34D399", letterSpacing: "0.1em" }}>REPAIR MODE ACTIVE — {vehicleLabel}</span>
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>ROCKSOLID AR STUDIO</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, flex: 1 }}>
        {/* Vehicle Schematic */}
        <div style={{ position: "relative", borderRadius: 14, border: "1px solid rgba(201,162,39,0.18)", background: "rgba(8,8,12,0.9)", overflow: "hidden" }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(201,162,39,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          <div style={{ padding: "20px 24px", position: "relative" }}>
            {/* Car SVG */}
            <svg viewBox="0 0 700 220" style={{ width: "100%", maxHeight: 200 }}>
              <defs>
                <filter id="goldGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Shadow */}
              <ellipse cx="347" cy="212" rx="305" ry="10" fill="rgba(0,0,0,0.6)" />
              {/* Underbody */}
              <rect x="100" y="178" width="500" height="8" rx="4" fill="rgba(20,20,25,0.8)" />
              {/* Main body */}
              <path d="M62,178 L48,162 L54,144 L75,124 L130,108 L195,93 L228,68 L290,62 L460,61 L540,70 L578,95 L612,120 L630,144 L636,163 L638,178 L558,178 A36,36 0 0,0 486,178 L210,178 A36,36 0 0,0 138,178 Z"
                fill="rgba(10,10,16,0.97)" stroke="#C9A227" strokeWidth="1.8" />
              {/* Roof */}
              <path d="M230,70 L274,62 L290,62 L460,61 L540,70 L574,95 L600,118 L568,108 L230,108 Z"
                fill="rgba(12,14,22,0.95)" stroke="rgba(201,162,39,0.5)" strokeWidth="1" />
              {/* Windshield */}
              <path d="M230,106 L274,62 L290,62 L355,62 L355,108 Z"
                fill="rgba(20,40,80,0.45)" stroke="rgba(100,160,255,0.25)" strokeWidth="0.8" />
              {/* Rear window */}
              <path d="M460,61 L540,71 L572,95 L570,108 L460,108 Z"
                fill="rgba(20,40,80,0.35)" stroke="rgba(100,160,255,0.2)" strokeWidth="0.8" />
              {/* Door lines */}
              <line x1="355" y1="62" x2="355" y2="175" stroke="rgba(201,162,39,0.22)" strokeWidth="1" />
              <line x1="465" y1="62" x2="465" y2="175" stroke="rgba(201,162,39,0.22)" strokeWidth="1" />
              {/* Door handles */}
              <rect x="295" y="128" width="26" height="7" rx="3.5" fill="rgba(201,162,39,0.35)" />
              <rect x="410" y="128" width="26" height="7" rx="3.5" fill="rgba(201,162,39,0.35)" />
              {/* Headlights */}
              <path d="M64,144 L80,128 L115,122 L78,150 Z" fill="rgba(120,200,255,0.25)" stroke="rgba(120,200,255,0.5)" strokeWidth="0.8" />
              {/* Taillights */}
              <path d="M616,122 L634,145 L636,162 L606,148 Z" fill="rgba(255,50,50,0.35)" stroke="rgba(255,80,80,0.5)" strokeWidth="0.8" />
              {/* Wheel arches */}
              <circle cx="168" cy="178" r="36" fill="rgba(6,6,10,0.98)" stroke="#C9A227" strokeWidth="1.8" />
              <circle cx="522" cy="178" r="36" fill="rgba(6,6,10,0.98)" stroke="#C9A227" strokeWidth="1.8" />
              {/* Tires */}
              <circle cx="168" cy="178" r="27" fill="rgba(14,14,18,0.95)" stroke="rgba(201,162,39,0.4)" strokeWidth="1.2" />
              <circle cx="522" cy="178" r="27" fill="rgba(14,14,18,0.95)" stroke="rgba(201,162,39,0.4)" strokeWidth="1.2" />
              {/* Wheel hubs */}
              <circle cx="168" cy="178" r="9" fill="rgba(201,162,39,0.8)" />
              <circle cx="522" cy="178" r="9" fill="rgba(201,162,39,0.8)" />
              {/* Logo */}
              <text x="345" y="118" textAnchor="middle" fill="rgba(201,162,39,0.14)" fontSize="18" fontWeight="900" fontFamily="monospace">3C ONYX</text>
            </svg>

            {/* Component markers overlaid on SVG */}
            {components.map((comp) => {
              const cfg = STATUS_CFG[comp.status as keyof typeof STATUS_CFG];
              const isHov = hovering === comp.id;
              const isSel = selected === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelected(isSel ? null : comp.id)}
                  onMouseEnter={() => setHovering(comp.id)}
                  onMouseLeave={() => setHovering(null)}
                  style={{
                    position: "absolute",
                    left: `${comp.x}%`,
                    top: `${comp.y}%`,
                    transform: "translate(-50%,-50%)",
                    cursor: "pointer",
                    zIndex: isSel || isHov ? 20 : 10,
                  }}
                >
                  {/* Outer ring */}
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${cfg.color}`,
                    background: cfg.bg,
                    boxShadow: (isSel || isHov) ? cfg.glow : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                    animation: comp.status !== "OK" ? "arPulse 1.8s ease-in-out infinite" : undefined,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                  </div>
                  {/* Floating label on hover */}
                  {isHov && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                      transform: "translateX(-50%)",
                      whiteSpace: "nowrap",
                      background: "rgba(8,8,14,0.95)",
                      border: `1px solid ${cfg.border}`,
                      borderRadius: 6, padding: "3px 8px",
                      fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: "0.07em",
                      pointerEvents: "none",
                    }}>
                      {comp.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: "8px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 16 }}>
            {(["CRITICAL","WARNING","OK"] as const).map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_CFG[s].color }} />
                <span style={{ fontSize: 9, color: STATUS_CFG[s].color, fontWeight: 700, letterSpacing: "0.08em" }}>{s}</span>
              </div>
            ))}
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>Click component for AR window</span>
          </div>
        </div>

        {/* AR Floating Windows Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", marginBottom: 2 }}>
            AR FLOATING WINDOWS — {components.filter((c) => c.status !== "OK").length} ACTIVE
          </p>
          {sel ? (
            <ARWindow comp={sel} onClose={() => setSelected(null)} />
          ) : (
            components.filter((c) => c.status !== "OK").map((comp) => (
              <ARWindowMini key={comp.id} comp={comp} onClick={() => setSelected(comp.id)} />
            ))
          )}
          {!sel && components.filter((c) => c.status !== "OK").length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "rgba(52,211,153,0.6)", fontSize: 12 }}>
              <CheckCircle2 size={24} style={{ marginBottom: 8, color: "#34D399" }} />
              <p>All systems nominal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ARWindow({ comp, onClose }: { comp: any; onClose: () => void }) {
  const cfg = STATUS_CFG[comp.status as keyof typeof STATUS_CFG];
  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${cfg.border}`,
      background: "rgba(8,8,14,0.97)", overflow: "hidden",
      boxShadow: cfg.glow,
    }}>
      <div style={{ padding: "8px 12px", background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.08em" }}>{comp.status}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
          <X size={12} />
        </button>
      </div>
      <div style={{ padding: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{comp.label}</p>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: "0.06em" }}>
          {comp.systemGroup} {comp.safetyCritical && "· SAFETY CRITICAL"}
        </p>
        {comp.dtcCode && (
          <div style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 10 }}>
            <span style={{ fontSize: 9, color: "#F87171", fontFamily: "monospace", fontWeight: 700 }}>DTC: {comp.dtcCode}</span>
          </div>
        )}
        {[
          { label: "TORQUE SPEC", value: comp.torqueSpec },
          { label: "OEM PART #", value: comp.partNumber },
          { label: "WHOLESALE", value: `$${comp.wholesaleUsd.toLocaleString()}` },
          { label: "RETAIL EST.", value: `$${Math.round(comp.wholesaleUsd * 2.4).toLocaleString()}` },
          { label: "3C SAVINGS", value: `$${Math.round(comp.wholesaleUsd * 1.4).toLocaleString()}`, color: "#34D399" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: color || cfg.color, fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.18)", fontSize: 9, color: "rgba(201,162,39,0.7)" }}>
          3C Runner on standby · MarketCheck part sourced · Mission Agent ready
        </div>
      </div>
    </div>
  );
}

function ARWindowMini({ comp, onClick }: { comp: any; onClick: () => void }) {
  const cfg = STATUS_CFG[comp.status as keyof typeof STATUS_CFG];
  return (
    <button onClick={onClick} style={{
      padding: "9px 12px", borderRadius: 10, border: `1px solid ${cfg.border}`,
      background: cfg.bg, cursor: "pointer", textAlign: "left", width: "100%",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{comp.label}</p>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {comp.torqueSpec.split("(")[0].trim()}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>${comp.wholesaleUsd.toLocaleString()}</p>
        <span style={{ fontSize: 8, color: cfg.color, fontWeight: 700, letterSpacing: "0.1em" }}>{comp.status}</span>
      </div>
    </button>
  );
}

// ─── Nav Overlay Canvas ───────────────────────────────────────────────────────
function NavOverlay({ navData }: { navData: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const tickRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) { canvas.width = rect.width; canvas.height = rect.height; }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      tickRef.current++;
      const t = tickRef.current;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "rgba(4,5,12,1)";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.save();
      ctx.strokeStyle = "rgba(201,162,39,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();

      // Route line (animated dashes)
      ctx.save();
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -(t * 1.2) % 20;
      ctx.strokeStyle = "#C9A227";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#C9A227";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(W * 0.18, H * 0.78);
      ctx.bezierCurveTo(W * 0.3, H * 0.5, W * 0.5, H * 0.4, W * 0.78, H * 0.22);
      ctx.stroke();
      ctx.restore();

      // Waypoints
      const waypoints = [
        { x: W * 0.18, y: H * 0.78, color: "#34D399", label: "YOU",         ring: true  },
        { x: W * 0.78, y: H * 0.22, color: "#C9A227", label: "SERVICE",     ring: false },
        { x: W * 0.48, y: H * 0.48, color: "#F59E0B", label: "HAZARD",      ring: true  },
        { x: W * 0.60, y: H * 0.35, color: "#A78BFA", label: "GEMINI ROUTE",ring: false },
      ];
      waypoints.forEach((wp) => {
        ctx.save();
        if (wp.ring) {
          const ringAlpha = 0.2 + 0.3 * Math.abs(Math.sin(t * 0.08));
          ctx.strokeStyle = wp.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = ringAlpha;
          ctx.beginPath(); ctx.arc(wp.x, wp.y, 18 + Math.sin(t * 0.08) * 4, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = wp.color;
        ctx.shadowColor = wp.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(wp.x, wp.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.font = "700 9px 'Courier New'";
        ctx.fillStyle = wp.color;
        ctx.shadowBlur = 0;
        ctx.fillText(wp.label, wp.x + 12, wp.y + 4);
        ctx.restore();
      });

      // Heading indicator (center top)
      ctx.save();
      const hdg = navData?.adas?.laneKeepAssist === "ACTIVE" ? 274 : 274;
      ctx.font = "700 11px 'Courier New'";
      ctx.fillStyle = "#C9A227";
      ctx.textAlign = "center";
      ctx.fillText(`${hdg}° W — ${navData?.route?.trafficCondition ?? "MODERATE"} TRAFFIC`, W / 2, 22);
      ctx.restore();

      // Watermark
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.font = "700 10px 'Courier New'";
      ctx.fillStyle = "#C9A227";
      ctx.textAlign = "right";
      ctx.fillText("ROCKSOLID NAV · GOOGLE MAPS OVERLAY · GEMINI AI", W - 12, H - 8);
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect(); };
  }, [navData]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ARViewer() {
  const [mode, setMode] = useState<Mode>("guardian");
  const [statusVisible, setStatusVisible] = useState(true);

  const { data: statusData }  = useQuery({ queryKey: ["rocksolid-status"],  queryFn: () => fetch(`${BASE}/api/rocksolid/status`).then((r) => r.json()), refetchInterval: 6000 });
  const { data: hudData }     = useQuery({ queryKey: ["rocksolid-hud"],     queryFn: () => fetch(`${BASE}/api/rocksolid/hud-state`).then((r) => r.json()), refetchInterval: 3000 });
  const { data: repairData }  = useQuery({ queryKey: ["rocksolid-repair"],  queryFn: () => fetch(`${BASE}/api/rocksolid/repair-mode/veh-001`).then((r) => r.json()), enabled: mode === "repair" });
  const { data: navData }     = useQuery({ queryKey: ["rocksolid-nav"],     queryFn: () => fetch(`${BASE}/api/rocksolid/nav-overlay`).then((r) => r.json()), enabled: mode === "nav" });

  const emitEvent = useMutation({
    mutationFn: (payload: { type: string; layer: string; priority: string }) =>
      fetch(`${BASE}/api/rocksolid/render-event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
  });

  const MODES: { id: Mode; label: string; icon: any; color: string; desc: string }[] = [
    { id: "guardian", label: "Guardian HUD",  icon: Shield,     color: "#34D399", desc: "ADAS · V2X · Fault Overlay" },
    { id: "repair",   label: "Repair Mode",   icon: Wrench,     color: "#F59E0B", desc: "Technician · Torque Specs · Parts AR" },
    { id: "nav",      label: "Nav Overlay",   icon: Navigation, color: "#A78BFA", desc: "Route · Gemini AI · Google Maps" },
  ];

  const alerts     = hudData?.activeAlerts ?? [];
  const obd        = hudData?.obd ?? {};
  const components = repairData?.components ?? [];

  const STAT_ROWS = [
    { label: "Runtime",      value: statusData?.runtime ?? "ROCKSOLID_AR_CORE", color: "#C9A227" },
    { label: "Build",        value: statusData?.build ?? "v4.2.1-onyx", color: "rgba(255,255,255,0.5)" },
    { label: "Latency",      value: `${statusData?.latencyMs ?? 4}ms`, color: "#34D399" },
    { label: "Render FPS",   value: `${statusData?.renderFps ?? 60}`, color: "#34D399" },
    { label: "Agent Mesh",   value: statusData?.agentMesh ?? "7/7 ONLINE", color: "#34D399" },
    { label: "V2X Link",     value: statusData?.v2xLink ?? "CONNECTED", color: "#34D399" },
    { label: "Gemini Anchor",value: statusData?.geminiAnchor ?? "CALIBRATED", color: "#A78BFA" },
    { label: "Google Maps",  value: statusData?.googleMapsIntegration ?? "CONNECTED", color: "#4FC3F7" },
    { label: "Uptime",       value: statusData?.uptimeSec ? `${statusData.uptimeSec}s` : "—", color: "rgba(255,255,255,0.4)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #04040a 0%, #060609 100%)", display: "flex", flexDirection: "column" }}>
      <PageHeader
        icon={Eye}
        title="SPATIAL AR OS"
        accent="#C9A227"
        subtitle="Rocksolid AR · Basemark Engine · 7-Agent Mesh · Onyx & Gold HUD"
        badge={<span className="neural-badge-gold">ROCKSOLID v4.2.1</span>}
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#34D399", letterSpacing: "0.1em" }}>AR LIVE</span>
            </div>
            <button
              onClick={() => emitEvent.mutate({ type: "MANUAL_RENDER_EVENT", layer: "guardian_hud", priority: "HIGH" })}
              style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", color: "#C9A227", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}
            >
              EMIT EVENT
            </button>
          </div>
        }
      />

      <div style={{ padding: "0 28px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Mode Selector + Runtime Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
          {/* Mode tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                    background: active ? `${m.color}10` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${active ? m.color + "35" : "rgba(255,255,255,0.08)"}`,
                    textAlign: "left", transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <m.icon size={13} style={{ color: active ? m.color : "rgba(255,255,255,0.3)" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? m.color : "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>{m.label}</span>
                    {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, animation: "pulse 1.5s infinite", marginLeft: "auto" }} />}
                  </div>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0 }}>{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* OBD Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, minWidth: 240 }}>
            {[
              { icon: Battery,     label: "Battery",   value: `${obd.batteryVoltage ?? 11.8}V`, warn: (obd.batteryVoltage ?? 11.8) < 12 },
              { icon: Thermometer, label: "Eng Temp",  value: `${obd.engineTemp ?? 208}°F`,     warn: (obd.engineTemp ?? 208) > 220 },
              { icon: Gauge,       label: "Oil Press",  value: `${obd.oilPressure ?? 41} PSI`,   warn: false },
              { icon: Activity,    label: "V2X Ping",   value: `${statusData?.latencyMs ?? 4}ms`, warn: false },
            ].map(({ icon: Ic, label, value, warn }) => (
              <div key={label} style={{ padding: "7px 10px", borderRadius: 8, background: warn ? "rgba(248,113,113,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${warn ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <Ic size={9} style={{ color: warn ? "#F87171" : "#C9A227" }} />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>{label}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: warn ? "#F87171" : "#fff", margin: 0, fontFamily: "monospace" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main AR Viewport */}
        <div style={{
          flex: 1, minHeight: mode === "repair" ? 420 : 460,
          borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(201,162,39,0.2)",
          background: "#04040a",
          position: "relative",
        }}>
          {/* AR corner brackets */}
          {["tl","tr","bl","br"].map((pos) => (
            <div key={pos} style={{
              position: "absolute", zIndex: 10,
              width: 20, height: 20,
              borderTop:    (pos.startsWith("t")) ? "2px solid rgba(201,162,39,0.5)" : undefined,
              borderBottom: (pos.startsWith("b")) ? "2px solid rgba(201,162,39,0.5)" : undefined,
              borderLeft:   (pos.endsWith("l")) ? "2px solid rgba(201,162,39,0.5)" : undefined,
              borderRight:  (pos.endsWith("r")) ? "2px solid rgba(201,162,39,0.5)" : undefined,
              top:    pos.startsWith("t") ? 8 : undefined,
              bottom: pos.startsWith("b") ? 8 : undefined,
              left:   pos.endsWith("l") ? 8 : undefined,
              right:  pos.endsWith("r") ? 8 : undefined,
            }} />
          ))}

          {mode === "guardian" && (
            <GuardianHUD alerts={alerts} obd={obd} />
          )}
          {mode === "repair" && (
            <div style={{ padding: 20, height: "100%", boxSizing: "border-box" }}>
              <RepairMode
                components={components}
                vehicleLabel={repairData?.vehicle ?? "2022 Porsche 911 Carrera S"}
              />
            </div>
          )}
          {mode === "nav" && (
            <NavOverlay navData={navData} />
          )}
        </div>

        {/* Bottom info strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {/* Runtime Status */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 8 }}>ROCKSOLID RUNTIME</p>
            {STAT_ROWS.slice(0, 5).map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Layer Status */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 8 }}>AR LAYERS</p>
            {[
              { name: "Guardian HUD",  status: "LIVE",    color: "#34D399" },
              { name: "Repair Studio", status: mode === "repair" ? "ACTIVE" : "STANDBY", color: mode === "repair" ? "#F59E0B" : "#9CA3AF" },
              { name: "Nav Overlay",   status: mode === "nav" ? "ACTIVE" : "LIVE",       color: "#A78BFA" },
              { name: "ADAS Mesh",     status: "LIVE",    color: "#34D399" },
              { name: "Parts AR Feed", status: "LIVE",    color: "#4FC3F7" },
            ].map(({ name, status, color }) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{name}</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: "0.08em" }}>{status}</span>
              </div>
            ))}
          </div>

          {/* Integrations */}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginBottom: 8 }}>INTEGRATIONS</p>
            {STAT_ROWS.slice(5).map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "5px 8px", borderRadius: 6, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)" }}>
              <p style={{ fontSize: 8, color: "rgba(201,162,39,0.6)", margin: 0, lineHeight: 1.4 }}>
                C++ FFI bridge ready. Production: IPC socket at /var/run/rocksolid.sock
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes arPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          50%       { transform: translate(-50%,-50%) scale(1.3); opacity: 0.7; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
