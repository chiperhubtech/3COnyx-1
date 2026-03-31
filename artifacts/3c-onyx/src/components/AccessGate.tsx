/**
 * 3C ONYX — Platform Access Gate
 * ─────────────────────────────────────────────────────────────────────────────
 * Locks the entire platform behind a passphrase.
 * Set VITE_PREVIEW_KEY in Replit Secrets to change the passphrase.
 * Defaults to "ONYX3C" if no env variable is set.
 *
 * Remove this component (or set VITE_PREVIEW_KEY="") when ready to open access.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { OnyxLogo } from "./OnyxLogo";

const ACCESS_KEY = import.meta.env.VITE_PREVIEW_KEY || "ONYX3C";
const STORAGE_KEY = "3c_access_granted";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted]   = useState<boolean>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) === ACCESS_KEY; } catch { return false; }
  });
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);
  const [shake, setShake]       = useState(false);
  const [hover, setHover]       = useState(false);
  const [pressed, setPressed]   = useState(false);
  const [pulse, setPulse]       = useState<{ agents: number; uptime: string } | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!granted) setTimeout(() => inputRef.current?.focus(), 300);
  }, [granted]);

  const fetchPulse = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/genesis/pulse`);
      if (r.ok) {
        const d = await r.json() as { agentMesh?: { totalAgents?: number }; uptime?: string };
        setPulse({ agents: d.agentMesh?.totalAgents ?? 0, uptime: d.uptime ?? "—" });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (granted) return;
    fetchPulse();
    const iv = setInterval(fetchPulse, 30_000);
    return () => clearInterval(iv);
  }, [granted, fetchPulse]);

  const attempt = () => {
    if (input.toUpperCase() === ACCESS_KEY.toUpperCase()) {
      try { sessionStorage.setItem(STORAGE_KEY, ACCESS_KEY); } catch {}
      setGranted(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => { setError(false); setShake(false); }, 700);
    }
  };

  if (granted) return <>{children}</>;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#050505",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 99999,
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
    }}>
      {/* Subtle background grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(201,162,39,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,162,39,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Radial gold ambient glow behind card */}
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,162,39,0.07) 0%, rgba(201,162,39,0.02) 40%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(40px)",
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0,
        padding: "48px 44px 40px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(201,162,39,0.35)",
        boxShadow:
          "0 0 120px rgba(201,162,39,0.08), " +
          "0 0 60px rgba(201,162,39,0.05), " +
          "inset 0 1px 0 rgba(201,162,39,0.1), " +
          "0 24px 80px rgba(0,0,0,0.7)",
        width: 360,
        maxWidth: "90vw",
        animation: "gate-breathe 4s ease-in-out infinite",
      }}>
        {/* Logo */}
        <OnyxLogo size={90} variant="app-icon" />

        {/* Brand */}
        <div style={{ marginTop: 20, marginBottom: 0, textAlign: "center" }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: "0.15em",
            color: "#fff", lineHeight: 1,
          }}>3C ONYX</div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.3em",
            color: "rgba(201,162,39,0.55)", marginTop: 6,
          }}>POWERED BY CUXTOMCANDYCLUB LLC</div>
        </div>

        {/* Platform identity tagline */}
        <div style={{
          marginTop: 14,
          fontSize: 8, fontWeight: 800, letterSpacing: "0.35em",
          color: "rgba(201,162,39,0.40)",
          textAlign: "center",
        }}>AUTOMOTIVE ECOSYSTEM OS</div>

        {/* Genesis pulse indicator */}
        {pulse && (
          <div style={{
            marginTop: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 7, fontWeight: 700, letterSpacing: "0.2em",
            color: "rgba(201,162,39,0.30)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                animation: "gate-breathe 2s ease-in-out infinite",
              }} />
              GENESIS ACTIVE
            </span>
            <span>{pulse.agents} AGENTS</span>
            <span>UP {pulse.uptime}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ width: 48, height: 1, background: "rgba(201,162,39,0.3)", margin: "18px 0" }} />

        {/* Lock label */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.45)", marginBottom: 20,
        }}>AUTHORIZED PLATFORM ACCESS</div>

        {/* Input */}
        <div style={{
          animation: shake ? "gate-shake 0.55s ease" : "none",
          width: "100%",
        }}>
          <input
            ref={inputRef}
            type="password"
            placeholder="SOVEREIGN ACCESS KEY"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            autoComplete="off"
            style={{
              width: "100%",
              padding: "14px 18px",
              fontSize: 14,
              fontFamily: "'Barlow Condensed', system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.1em",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(239,68,68,0.6)" : "rgba(201,162,39,0.25)"}`,
              borderRadius: 12,
              color: error ? "#EF4444" : "#fff",
              outline: "none",
              boxSizing: "border-box",
              textAlign: "center",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          />
          {error && (
            <div style={{
              textAlign: "center", marginTop: 8,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.2em",
              color: "#EF4444",
            }}>INCORRECT ACCESS KEY</div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={attempt}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => { setHover(false); setPressed(false); }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "15px",
            fontSize: 12,
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontWeight: 900,
            letterSpacing: "0.25em",
            background: "linear-gradient(135deg, #C9A227 0%, #9B7B1A 100%)",
            border: "none",
            borderRadius: 12,
            color: "#050505",
            cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: hover
              ? "0 6px 24px rgba(201,162,39,0.35), 0 2px 8px rgba(201,162,39,0.2), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 4px 16px rgba(201,162,39,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
            transform: pressed
              ? "scale(0.98)"
              : hover
                ? "translateY(-1px)"
                : "none",
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
        >
          ACCESS PLATFORM
        </button>

        {/* Footer */}
        <div style={{
          marginTop: 22,
          fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.28)", textAlign: "center",
          lineHeight: 1.8,
        }}>
          3C ONYX · GENESIS v1.0 · CUXTOMCANDYCLUB LLC<br/>
          SOVEREIGN PLATFORM · NOT FOR PUBLIC DISTRIBUTION
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes gate-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes gate-breathe {
          0%, 100% { border-color: rgba(201,162,39,0.35); }
          50%      { border-color: rgba(201,162,39,0.20); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.2);
          font-weight: 700;
          letter-spacing: 0.2em;
          font-size: 11px;
        }
        input:focus {
          border-color: rgba(201,162,39,0.5) !important;
          box-shadow: 0 0 20px rgba(201,162,39,0.08);
        }
      `}</style>
    </div>
  );
}
