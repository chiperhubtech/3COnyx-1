import { useState } from "react";
import { useLocation } from "wouter";

const GOLD = "#D4A017";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Founder account recovery — requires the private setup key (Replit Secret). */
export default function FounderResetPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (password !== confirm) {
      setStatus({ kind: "error", msg: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${BASE}/api/auth/founder-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword: password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Reset failed.");
      setStatus({ kind: "success", msg: "Password updated. Taking you to sign in…" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Reset failed." });
    } finally {
      setBusy(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "13px 15px", borderRadius: 10, border: "1px solid #2a2a2a",
    background: "#141414", color: "#fff", fontSize: 15, marginBottom: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase", textAlign: "center", marginBottom: 6 }}>
          Founder Access
        </h1>
        <p style={{ color: "#888", fontSize: 13.5, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
          Enter your private setup key to reset the founder password.
        </p>

        <label style={{ fontSize: 12.5, color: "#999", display: "block", marginBottom: 6 }}>Setup key</label>
        <input style={input} type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" required />

        <label style={{ fontSize: 12.5, color: "#999", display: "block", marginBottom: 6 }}>New password</label>
        <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />

        <label style={{ fontSize: 12.5, color: "#999", display: "block", marginBottom: 6 }}>Confirm new password</label>
        <input style={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required minLength={8} />

        <p style={{ color: "#666", fontSize: 12, margin: "0 0 18px" }}>At least 8 characters with an uppercase letter and a number.</p>

        {status && (
          <div style={{
            padding: "11px 14px", borderRadius: 10, fontSize: 13.5, marginBottom: 16,
            background: status.kind === "error" ? "#2a1212" : "#122a17",
            border: `1px solid ${status.kind === "error" ? "#5c2626" : "#265c33"}`,
            color: status.kind === "error" ? "#f0a0a0" : "#9fe6ad",
          }}>
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={busy} style={{
          width: "100%", background: GOLD, color: "#000", border: "none", borderRadius: 10,
          padding: "14px", fontWeight: 800, fontSize: 15, letterSpacing: "0.05em",
          cursor: "pointer", opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "Updating…" : "Reset Founder Password"}
        </button>
      </form>
    </div>
  );
}
