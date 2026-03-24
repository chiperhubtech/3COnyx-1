/**
 * NeuralMesh — Animated AI brain visualization
 * Pure CSS/JS canvas. No external deps.
 * Renders a living network of nodes + connections
 * that responds to mouse proximity.
 */
import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  color: string;
  opacity: number;
}

const COLORS = [
  "201,162,39",   // gold
  "96,165,250",   // blue
  "167,139,250",  // violet
  "52,211,153",   // green
  "248,113,113",  // red
];

export function NeuralMesh({ height = 320, nodeCount = 42 }: { height?: number; nodeCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef  = useRef<Node[]>([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x:          Math.random() * W(),
      y:          Math.random() * H(),
      vx:         (Math.random() - 0.5) * 0.3,
      vy:         (Math.random() - 0.5) * 0.3,
      radius:     Math.random() * 2.2 + 1,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
      color:      COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity:    0.4 + Math.random() * 0.5,
    }));

    let t = 0;

    function draw() {
      if (!canvas || !ctx) return;
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);
      t++;

      const nodes = nodesRef.current;
      const mx    = mouseRef.current.x;
      const my    = mouseRef.current.y;

      // Update positions
      for (const n of nodes) {
        n.pulsePhase += n.pulseSpeed;

        // Mouse repulsion (gentle)
        const dx = n.x - mx;
        const dy = n.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.4;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        // Dampen velocity
        n.vx *= 0.98;
        n.vy *= 0.98;

        n.x += n.vx;
        n.y += n.vy;

        // Bounce
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
        if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx); }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
        if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy); }
      }

      // Draw connections
      const maxDist = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.25;
            const pulse = Math.sin(t * 0.018 + i * 0.4) * 0.5 + 0.5;
            const finalAlpha = alpha * (0.6 + pulse * 0.4);

            // Pick a mixed color between two nodes
            ctx.beginPath();
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(${a.color},${finalAlpha})`);
            grad.addColorStop(1, `rgba(${b.color},${finalAlpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 0.6;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(n.pulsePhase) * 0.4 + 0.6;
        const r     = n.radius * (0.8 + pulse * 0.4);

        // Outer glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
        grd.addColorStop(0, `rgba(${n.color},${n.opacity * pulse * 0.6})`);
        grd.addColorStop(1, `rgba(${n.color},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color},${n.opacity * pulse})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const onMouse = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
    };
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block", pointerEvents: "auto" }}
    />
  );
}
