/**
 * 3C Spin Studio™ — Proprietary 360° Vehicle Visualization Engine
 *
 * Built entirely in-house. Zero external licensing.
 *
 * Modes (auto-selected based on available frames):
 *   MULTI_FRAME — 2+ images: drag / swipe to cycle through real photo frames
 *   CANVAS_SIM  — 1 image:   canvas perspective-transform simulation
 *   PENDING     — 0 images:  "Capture Scheduled" state with grid overlay
 *
 * Controls:
 *   Mouse drag left/right  → rotate
 *   Touch swipe            → rotate
 *   Auto-spin toggle       → animates continuously until user touches
 *   Fullscreen             → native browser fullscreen
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCcw, Maximize2, Minimize2, Play, Pause,
  Camera, ChevronLeft, ChevronRight,
} from "lucide-react";

export interface SpinViewerProps {
  frames: string[];
  vehicleName?: string;
  height?: number;
  autoSpin?: boolean;
  compact?: boolean;
  onCaptureClick?: () => void;
}

type ViewerMode = "multi" | "canvas" | "pending";

// ─── Canvas Simulation Engine ─────────────────────────────────────────────────
// Draws a single vehicle image with perspective X-axis compression to simulate
// 3D rotation. As the viewer rotates 0→2π the image squeezes horizontally
// (simulating the car turning to show its edge) then expands again (rear view).
function CanvasSpinEngine({
  src,
  angle,
  width,
  height,
}: {
  src: string;
  angle: number;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      loadedRef.current = true;
      renderFrame();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !loadedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Perspective X-scale: at angle=0 → full width; at angle=π/2 → near 0 (edge)
    const scaleX    = Math.max(0.02, Math.abs(Math.cos(angle)));
    const isFlipped = Math.cos(angle) < 0;

    // Fit image into canvas
    const ratio  = Math.min(W / img.width, H / img.height);
    const dw     = img.width  * ratio;
    const dh     = img.height * ratio;
    const dx     = (W - dw) / 2;
    const dy     = (H - dh) / 2;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    if (isFlipped) ctx.scale(-1, 1);
    ctx.scale(scaleX, 1);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    // Subtle edge vignette to sell the depth illusion
    const edgeAlpha = 1 - scaleX;
    if (edgeAlpha > 0.05) {
      const vGrad = ctx.createLinearGradient(0, 0, W, 0);
      vGrad.addColorStop(0, `rgba(4,4,10,${edgeAlpha * 0.5})`);
      vGrad.addColorStop(0.2, "rgba(4,4,10,0)");
      vGrad.addColorStop(0.8, "rgba(4,4,10,0)");
      vGrad.addColorStop(1,   `rgba(4,4,10,${edgeAlpha * 0.5})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, W, H);
    }
  }, [angle]);

  useEffect(() => { renderFrame(); }, [angle, renderFrame]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = width; canvas.height = height; renderFrame(); }
  }, [width, height, renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

// ─── Main SpinViewer ──────────────────────────────────────────────────────────
export function SpinViewer({
  frames,
  vehicleName = "Vehicle",
  height = 240,
  autoSpin = true,
  compact = false,
  onCaptureClick,
}: SpinViewerProps) {
  const mode: ViewerMode =
    frames.length >= 2 ? "multi" :
    frames.length === 1 ? "canvas" :
    "pending";

  // Multi-frame state
  const [frameIdx, setFrameIdx]     = useState(0);
  // Canvas simulation angle (radians)
  const [angle, setAngle]           = useState(0);
  // Interaction
  const [spinning, setSpinning]     = useState(autoSpin);
  const [dragging, setDragging]     = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded]         = useState(mode === "canvas" || mode === "pending");
  const [viewerW, setViewerW]       = useState(600);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX   = useRef(0);
  const dragStartIdx = useRef(0);
  const dragStartAngle = useRef(0);
  const frameRef     = useRef<number>(0);
  const angleRef     = useRef(angle);
  angleRef.current   = angle;
  const frameIdxRef  = useRef(frameIdx);
  frameIdxRef.current = frameIdx;

  // Measure container width for canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewerW(el.clientWidth));
    ro.observe(el);
    setViewerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Auto-spin animation
  useEffect(() => {
    if (!spinning || dragging) { cancelAnimationFrame(frameRef.current); return; }
    let lastT = 0;
    const loop = (t: number) => {
      if (t - lastT > 50) {
        lastT = t;
        if (mode === "multi") {
          setFrameIdx((i) => (i + 1) % frames.length);
        } else if (mode === "canvas") {
          setAngle((a) => (a + 0.04) % (Math.PI * 2));
        }
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [spinning, dragging, mode, frames.length]);

  // Hide drag hint after 3s
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const SENSITIVITY_MULTI  = 8;   // px per frame
  const SENSITIVITY_CANVAS = 180; // px per full rotation

  const onPointerDown = useCallback((clientX: number) => {
    setDragging(true);
    setSpinning(false);
    setHintVisible(false);
    dragStartX.current = clientX;
    dragStartIdx.current = frameIdxRef.current;
    dragStartAngle.current = angleRef.current;
  }, []);

  const onPointerMove = useCallback((clientX: number) => {
    if (!dragging) return;
    const delta = clientX - dragStartX.current;

    if (mode === "multi" && frames.length > 0) {
      const shift = Math.floor(delta / -SENSITIVITY_MULTI);
      const next  = ((dragStartIdx.current + shift) % frames.length + frames.length) % frames.length;
      setFrameIdx(next);
    } else if (mode === "canvas") {
      const deltaAngle = (delta / -SENSITIVITY_CANVAS) * Math.PI * 2;
      setAngle((dragStartAngle.current + deltaAngle) % (Math.PI * 2));
    }
  }, [dragging, mode, frames.length]);

  const onPointerUp = useCallback(() => { setDragging(false); }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); onPointerDown(e.clientX); };
  const onMouseMove = (e: React.MouseEvent) => { onPointerMove(e.clientX); };
  const onMouseUp   = () => onPointerUp();
  const onMouseLeave = () => { if (dragging) onPointerUp(); };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => { onPointerDown(e.touches[0].clientX); };
  const onTouchMove  = (e: React.TouchEvent) => { e.preventDefault(); onPointerMove(e.touches[0].clientX); };
  const onTouchEnd   = () => onPointerUp();

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!fullscreen) { el.requestFullscreen?.(); setFullscreen(true); }
    else { document.exitFullscreen?.(); setFullscreen(false); }
  };

  const prevFrame = () => { setFrameIdx((i) => (i - 1 + frames.length) % frames.length); setSpinning(false); };
  const nextFrame = () => { setFrameIdx((i) => (i + 1) % frames.length); setSpinning(false); };

  const H = fullscreen ? window.innerHeight : height;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: H,
        background: "#060608",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : (mode === "pending" ? "default" : "grab"),
        userSelect: "none",
        borderRadius: fullscreen ? 0 : undefined,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── MULTI-FRAME mode ─────────────────────────────────────────────── */}
      {mode === "multi" && (
        <>
          <img
            src={frames[frameIdx]}
            alt={vehicleName}
            draggable={false}
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: "block", pointerEvents: "none",
              opacity: loaded ? 1 : 0, transition: "opacity 0.3s",
            }}
          />
          {/* Preload adjacent frames */}
          {frames.slice(0, Math.min(frames.length, 6)).map((src, i) => (
            <img key={i} src={src} alt="" style={{ display: "none" }} />
          ))}
        </>
      )}

      {/* ── CANVAS-SIMULATION mode ───────────────────────────────────────── */}
      {mode === "canvas" && (
        <CanvasSpinEngine
          src={frames[0]}
          angle={angle}
          width={viewerW}
          height={H}
        />
      )}

      {/* ── PENDING mode ─────────────────────────────────────────────────── */}
      {mode === "pending" && (
        <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          {/* AR grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(201,162,39,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <Camera size={18} style={{ color: "#C9A227" }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(201,162,39,0.7)", letterSpacing: "0.12em", position: "relative", zIndex: 1 }}>
            3C SPIN CAPTURE — SCHEDULED
          </p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", position: "relative", zIndex: 1 }}>Runner assigned · 36-frame capture pending</p>
          {onCaptureClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onCaptureClick(); }}
              style={{ marginTop: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", color: "#C9A227", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", position: "relative", zIndex: 1 }}
            >
              OPEN CAPTURE GUIDE
            </button>
          )}
        </div>
      )}

      {/* ── Bottom gradient overlay ───────────────────────────────────────── */}
      {mode !== "pending" && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,6,8,0.55) 0%, transparent 50%)", pointerEvents: "none" }} />
      )}

      {/* ── 3C 360° badge ────────────────────────────────────────────────── */}
      {mode !== "pending" && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          padding: "3px 8px", borderRadius: 6,
          background: "rgba(6,6,10,0.75)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(201,162,39,0.35)",
          display: "flex", alignItems: "center", gap: 5,
          pointerEvents: "none",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A227" }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: "#C9A227", letterSpacing: "0.12em" }}>
            3C 360°
          </span>
          {mode === "canvas" && (
            <span style={{ fontSize: 8, color: "rgba(201,162,39,0.5)", marginLeft: 2 }}>SIM</span>
          )}
        </div>
      )}

      {/* ── Frame counter (multi-frame) ───────────────────────────────────── */}
      {mode === "multi" && !compact && (
        <div style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {frames.map((_, i) => (
            <div key={i} style={{
              width: i === frameIdx ? 16 : 4, height: 4, borderRadius: 3,
              background: i === frameIdx ? "#C9A227" : "rgba(255,255,255,0.25)",
              transition: "width 0.2s, background 0.2s",
            }} />
          ))}
        </div>
      )}

      {/* ── Drag hint ────────────────────────────────────────────────────── */}
      {mode !== "pending" && hintVisible && !dragging && (
        <div style={{
          position: "absolute", bottom: compact ? 8 : 30, left: "50%", transform: "translateX(-50%)",
          padding: "3px 10px", borderRadius: 12,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em",
          pointerEvents: "none",
          animation: "fadeInOut 3.5s ease forwards",
        }}>
          ← DRAG TO SPIN →
        </div>
      )}

      {/* ── Controls (non-compact) ───────────────────────────────────────── */}
      {!compact && mode !== "pending" && (
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          {mode === "multi" && (
            <>
              <ControlBtn onClick={prevFrame} title="Previous frame"><ChevronLeft size={12} /></ControlBtn>
              <ControlBtn onClick={nextFrame} title="Next frame"><ChevronRight size={12} /></ControlBtn>
            </>
          )}
          <ControlBtn onClick={() => setSpinning((s) => !s)} title={spinning ? "Pause" : "Auto-spin"}>
            {spinning ? <Pause size={12} /> : <Play size={12} />}
          </ControlBtn>
          <ControlBtn onClick={() => { setAngle(0); setFrameIdx(0); }} title="Reset">
            <RotateCcw size={12} />
          </ControlBtn>
          <ControlBtn onClick={toggleFullscreen} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </ControlBtn>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ControlBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      style={{
        width: 26, height: 26, borderRadius: 7,
        background: "rgba(6,6,10,0.7)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.7)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,162,39,0.15)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,162,39,0.3)";
        (e.currentTarget as HTMLButtonElement).style.color = "#C9A227";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,6,10,0.7)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
      }}
    >
      {children}
    </button>
  );
}

// ─── SpinCaptureGuide — Runner Capture Workflow ───────────────────────────────
// Shows a 360° capture guide for Runners to capture the vehicle at 36 positions.
export interface SpinCaptureGuideProps {
  vehicleId: string;
  vehicleName?: string;
  onComplete?: (frameUrls: string[]) => void;
}

const CAPTURE_POSITIONS = Array.from({ length: 18 }, (_, i) => ({
  id:    i,
  angle: i * 20,
  label: getPositionLabel(i * 20),
}));

function getPositionLabel(deg: number): string {
  const map: Record<number, string> = {
    0: "Front Center", 20: "Front Right", 40: "Front-Right Quarter",
    60: "Right Side A", 80: "Right Side B", 100: "Rear-Right Quarter",
    120: "Rear Right", 140: "Rear Center", 160: "Rear Left",
    180: "Rear-Left Quarter", 200: "Left Side A", 220: "Left Side B",
    240: "Front-Left Quarter", 260: "Front Left", 280: "Front Center Alt",
    300: "Hood", 320: "Interior Front", 340: "Interior Rear",
  };
  return map[deg] ?? `${deg}°`;
}

export function SpinCaptureGuide({ vehicleId, vehicleName = "Vehicle", onComplete }: SpinCaptureGuideProps) {
  const [captured, setCaptured] = useState<Set<number>>(new Set());
  const [active, setActive]     = useState(0);

  const markCaptured = (id: number) => {
    setCaptured((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (active === id && id < CAPTURE_POSITIONS.length - 1) setActive(id + 1);
  };

  const progress = (captured.size / CAPTURE_POSITIONS.length) * 100;

  return (
    <div style={{ background: "rgba(6,6,10,0.98)", borderRadius: 16, border: "1px solid rgba(201,162,39,0.18)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", letterSpacing: "0.12em", marginBottom: 2 }}>3C SPIN STUDIO™ — CAPTURE GUIDE</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{vehicleName} · {captured.size}/{CAPTURE_POSITIONS.length} frames</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: captured.size === CAPTURE_POSITIONS.length ? "#34D399" : "#C9A227" }}>{Math.round(progress)}%</p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>COMPLETE</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #C9A227, #34D399)", transition: "width 0.4s ease" }} />
      </div>

      <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top-down vehicle diagram */}
        <div style={{ position: "relative", height: 220 }}>
          <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
            {/* Vehicle top-down silhouette */}
            <ellipse cx="100" cy="100" rx="30" ry="52" fill="rgba(201,162,39,0.08)" stroke="rgba(201,162,39,0.3)" strokeWidth="1" />
            <text x="100" y="104" textAnchor="middle" fontSize="10" fill="rgba(201,162,39,0.5)" fontWeight="700">TOP</text>

            {/* Capture position dots */}
            {CAPTURE_POSITIONS.map(({ id, angle }) => {
              const rad  = (angle - 90) * (Math.PI / 180);
              const r    = 76;
              const cx   = 100 + r * Math.cos(rad);
              const cy   = 100 + r * Math.sin(rad);
              const done = captured.has(id);
              const curr = active === id;

              return (
                <g key={id} onClick={() => setActive(id)} style={{ cursor: "pointer" }}>
                  <circle cx={cx} cy={cy} r={curr ? 10 : 7}
                    fill={done ? "rgba(52,211,153,0.3)" : curr ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.06)"}
                    stroke={done ? "#34D399" : curr ? "#C9A227" : "rgba(255,255,255,0.15)"}
                    strokeWidth={curr ? 2 : 1}
                  />
                  <text x={cx} y={cy + 4} textAnchor="middle"
                    fontSize={curr ? 7 : 6}
                    fill={done ? "#34D399" : curr ? "#C9A227" : "rgba(255,255,255,0.3)"}
                    fontWeight="700"
                  >
                    {id + 1}
                  </text>
                </g>
              );
            })}

            {/* Direction arrow */}
            {(() => {
              const pos = CAPTURE_POSITIONS[active];
              const rad = (pos.angle - 90) * (Math.PI / 180);
              const r1  = 42, r2 = 65;
              const x1  = 100 + r1 * Math.cos(rad);
              const y1  = 100 + r1 * Math.sin(rad);
              const x2  = 100 + r2 * Math.cos(rad);
              const y2  = 100 + r2 * Math.sin(rad);
              return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A227" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arrow)" />;
            })()}
            <defs>
              <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 Z" fill="#C9A227" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Active position panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.2)" }}>
            <p style={{ fontSize: 9, color: "rgba(201,162,39,0.6)", letterSpacing: "0.1em", marginBottom: 4 }}>POSITION {active + 1} OF {CAPTURE_POSITIONS.length}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{CAPTURE_POSITIONS[active].label}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{CAPTURE_POSITIONS[active].angle}° · 10–12 ft distance · door-handle height</p>
          </div>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, padding: "0 2px" }}>
            <p>• Stand at the marked angle</p>
            <p>• Center vehicle in frame</p>
            <p>• Keep horizon level</p>
            <p>• Consistent lighting preferred</p>
          </div>

          <button
            onClick={() => markCaptured(active)}
            disabled={captured.has(active)}
            style={{
              padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 11,
              letterSpacing: "0.08em", cursor: captured.has(active) ? "default" : "pointer",
              background: captured.has(active) ? "rgba(52,211,153,0.1)" : "rgba(201,162,39,0.12)",
              border: `1px solid ${captured.has(active) ? "rgba(52,211,153,0.3)" : "rgba(201,162,39,0.3)"}`,
              color: captured.has(active) ? "#34D399" : "#C9A227",
              transition: "all 0.2s",
            }}
          >
            {captured.has(active) ? "✓ CAPTURED" : "MARK AS CAPTURED"}
          </button>

          {captured.size === CAPTURE_POSITIONS.length && (
            <button
              onClick={() => onComplete?.([])}
              style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", cursor: "pointer", background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))", border: "1px solid rgba(52,211,153,0.35)", color: "#34D399" }}
            >
              SUBMIT SPIN SESSION →
            </button>
          )}
        </div>
      </div>

      {/* Position grid */}
      <div style={{ padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
        {CAPTURE_POSITIONS.map(({ id }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              padding: "5px 2px", borderRadius: 6, fontSize: 9, fontWeight: 700,
              cursor: "pointer", border: "1px solid",
              background: captured.has(id) ? "rgba(52,211,153,0.1)" : active === id ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: captured.has(id) ? "rgba(52,211,153,0.25)" : active === id ? "rgba(201,162,39,0.35)" : "rgba(255,255,255,0.06)",
              color: captured.has(id) ? "#34D399" : active === id ? "#C9A227" : "rgba(255,255,255,0.3)",
            }}
          >
            {id + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
