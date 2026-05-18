import { useState, useRef, useEffect, useCallback } from "react";
import { OnyxLogo } from "./OnyxLogo";

const ACCESS_KEY = import.meta.env.VITE_PREVIEW_KEY || "ONYX3C";
const STORAGE_KEY = "3c_access_granted";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// ── Public Door Allowlist ────────────────────────────────────────────────
// Routes that bypass the access gate entirely — anyone on Earth can walk
// through these doors, no code, no reading, no friction. (RAC3C vision:
// "a person who cannot read can join.") Add new public paths here.
const PUBLIC_DOOR_PATHS = ["/door", "/start", "/begin", "/kilocorn", "/manifesto", "/trillion", "/standard", "/protocol", "/3cx", "/dot", "/cvo", "/ops", "/status", "/amplify", "/marketing", "/axon", "/people", "/choice", "/revenue", "/streams", "/money", "/lines", "/everything", "/onyx", "/infinity", "/omnia", "/one", "/forever", "/government", "/fleet", "/public", "/sovereign-fleet", "/municipal", "/b2g", "/access", "/everyone", "/universal", "/all", "/123", "/abc", "/easy", "/welcome", "/velocity", "/faster", "/speed", "/clock", "/seconds", "/vs", "/icons", "/athletes", "/celebrities", "/celebs", "/stars", "/teams", "/agents", "/concierge", "/vip", "/sourcing", "/source", "/wholesale", "/factory", "/canton", "/oem", "/parts", "/manufacturers", "/utility", "/maas", "/coordination", "/civil", "/grid", "/congestion", "/savings", "/sovereignty", "/blitz", "/ignition", "/launch", "/wildfire", "/growth-doctrine", "/lean", "/scale", "/gtm", "/builders", "/build", "/tuners", "/customs", "/restomod", "/shops", "/garages", "/hardening", "/trust", "/security", "/audit", "/soc2", "/posture", "/grade", "/manifest.json", "/sw.js", "/favicon.svg", "/opengraph.jpg"];

function isPublicDoor(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname.replace(BASE, "") || "/";
  return PUBLIC_DOOR_PATHS.some((d) => p === d || p.startsWith(d + "/"));
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [granted, setGranted]   = useState<boolean>(() => {
    if (isPublicDoor()) return true;
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
      background: "#050508",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 99999,
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(255,45,154,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at center, rgba(201,168,93,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 80%, rgba(255,45,154,0.05) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 90%, rgba(201,168,93,0.04) 0%, transparent 50%)
        `,
      }} />

      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "52px 44px 44px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,45,154,0.12)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,45,154,0.02), 0 0 60px rgba(255,45,154,0.04)",
        width: 380,
        maxWidth: "90vw",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit",
          background: "linear-gradient(135deg, rgba(201,168,93,0.03) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />
        <OnyxLogo size={80} variant="app-icon" />

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <h1 style={{
            fontSize: 32, fontWeight: 900, color: "#fff",
            margin: 0, lineHeight: 1.1,
          }}>Welcome to 3C ONYX</h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.4)",
            marginTop: 8, lineHeight: 1.5,
          }}>Members only. Enter your access code.</p>
        </div>

        {pulse && (
          <div style={{
            marginTop: 12,
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "rgba(255,255,255,0.3)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.6)",
            }} />
            <span>Online and ready</span>
          </div>
        )}

        <div style={{
          width: 60, height: 1, margin: "24px 0",
          background: "linear-gradient(90deg, transparent, rgba(201,168,93,0.2), transparent)",
        }} />

        <div style={{
          animation: shake ? "gate-shake 0.55s ease" : "none",
          width: "100%",
        }}>
          <input
            ref={inputRef}
            type="password"
            placeholder="Enter access code"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            autoComplete="off"
            style={{
              width: "100%",
              padding: "16px 20px",
              fontSize: 16,
              fontWeight: 500,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 14,
              color: error ? "#EF4444" : "#fff",
              outline: "none",
              boxSizing: "border-box",
              textAlign: "center",
              transition: "border-color 0.2s",
              fontFamily: "system-ui, sans-serif",
            }}
          />
          {error && (
            <p style={{
              textAlign: "center", marginTop: 10,
              fontSize: 13, fontWeight: 600,
              color: "#EF4444",
            }}>That code didn't work. Try again.</p>
          )}
        </div>

        <button
          onClick={attempt}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => { setHover(false); setPressed(false); }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 800,
            background: "linear-gradient(135deg, #FF2D9A, #C9A85D)",
            border: "none",
            borderRadius: 14,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: 1,
            boxShadow: hover
              ? "0 6px 24px rgba(255,45,154,0.4), 0 0 40px rgba(255,45,154,0.15)"
              : "0 4px 16px rgba(255,45,154,0.2)",
            transform: pressed ? "scale(0.98)" : hover ? "translateY(-1px)" : "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Continue
        </button>

        <p style={{
          marginTop: 28,
          fontSize: 12, color: "rgba(255,255,255,0.2)",
          textAlign: "center",
        }}>
          3C ONYX · CUXTOMCANDYCLUB LLC
        </p>
      </div>

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
        input::placeholder {
          color: rgba(255,255,255,0.25);
          font-weight: 400;
          font-size: 15px;
        }
        input:focus {
          border-color: rgba(255,45,154,0.35) !important;
          box-shadow: 0 0 24px rgba(255,45,154,0.1), inset 0 0 12px rgba(255,45,154,0.02);
        }
      `}</style>
    </div>
  );
}
