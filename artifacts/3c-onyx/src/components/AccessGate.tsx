/**
 * 3C ONYX — Platform Access Gate
 * ─────────────────────────────────────────────────────────────────────────────
 * Locks the entire platform behind a passphrase.
 * Set VITE_PREVIEW_KEY in Replit Secrets to change the passphrase.
 * Defaults to "ONYX3C" if no env variable is set.
 *
 * Remove this component (or set VITE_PREVIEW_KEY="") when ready to open access.
 */

import { useState, useRef, useEffect } from "react";
import { OnyxLogo } from "./OnyxLogo";

const ACCESS_KEY = import.meta.env.VITE_PREVIEW_KEY || "ONYX3C";
const STORAGE_KEY = "3c_access_granted";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted]   = useState<boolean>(() => {
    try { return sessionStorage.getItem(STORAGE_KEY) === ACCESS_KEY; } catch { return false; }
  });
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);
  const [shake, setShake]       = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!granted) setTimeout(() => inputRef.current?.focus(), 300);
  }, [granted]);

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

      {/* Card */}
      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0,
        padding: "48px 40px 40px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(201,162,39,0.12)",
        boxShadow: "0 0 80px rgba(201,162,39,0.06), 0 24px 64px rgba(0,0,0,0.6)",
        width: 340,
        maxWidth: "90vw",
      }}>
        {/* Logo */}
        <OnyxLogo size={72} variant="app-icon" />

        {/* Brand */}
        <div style={{ marginTop: 22, marginBottom: 6, textAlign: "center" }}>
          <div style={{
            fontSize: 26, fontWeight: 900, letterSpacing: "0.15em",
            color: "#fff", lineHeight: 1,
          }}>3C ONYX</div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.3em",
            color: "rgba(201,162,39,0.55)", marginTop: 6,
          }}>POWERED BY CUXTOMCANDYCLUB LLC</div>
        </div>

        {/* Divider */}
        <div style={{ width: 40, height: 1, background: "rgba(201,162,39,0.2)", margin: "20px 0" }} />

        {/* Lock label */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.25)", marginBottom: 20,
        }}>PRIVATE ACCESS ONLY</div>

        {/* Input */}
        <div style={{
          animation: shake ? "gate-shake 0.55s ease" : "none",
          width: "100%",
        }}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Enter access key"
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
              border: `1px solid ${error ? "rgba(239,68,68,0.6)" : "rgba(201,162,39,0.2)"}`,
              borderRadius: 12,
              color: error ? "#EF4444" : "#fff",
              outline: "none",
              boxSizing: "border-box",
              textAlign: "center",
              transition: "border-color 0.2s",
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
          style={{
            marginTop: 14,
            width: "100%",
            padding: "14px",
            fontSize: 12,
            fontFamily: "'Barlow Condensed', system-ui, sans-serif",
            fontWeight: 900,
            letterSpacing: "0.25em",
            background: "linear-gradient(135deg, #C9A227 0%, #8B6914 100%)",
            border: "none",
            borderRadius: 12,
            color: "#050505",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          ACCESS PLATFORM
        </button>

        {/* Footer */}
        <div style={{
          marginTop: 20,
          fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.1)", textAlign: "center",
        }}>
          3C ONYX · PRIVATE PREVIEW · NOT FOR PUBLIC DISTRIBUTION
        </div>
      </div>

      {/* Keyframe animation injected inline */}
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
      `}</style>
    </div>
  );
}
