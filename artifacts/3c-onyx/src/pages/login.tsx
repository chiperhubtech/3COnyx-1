import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, AlertCircle, Fingerprint, ScanFace } from "lucide-react";
import {
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  useEffect(() => {
    setBiometricSupported(browserSupportsWebAuthn());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate("/");
    } catch {
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricError("");
    setBiometricLoading(true);
    try {
      const optRes = await fetch(`${BASE}/api/webauthn/authenticate/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        setBiometricError(data.error || "No biometric credentials found");
        setBiometricLoading(false);
        return;
      }

      const options = await optRes.json();
      const { sessionId, ...optionsJSON } = options;

      const authResp = await startAuthentication({ optionsJSON });

      const verifyRes = await fetch(`${BASE}/api/webauthn/authenticate/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp, sessionId }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setBiometricError(data.error || "Biometric verification failed");
        setBiometricLoading(false);
        return;
      }

      const { token, user } = await verifyRes.json();
      localStorage.setItem("onyxToken", token);
      localStorage.setItem("3c_auth_token", token);
      window.location.href = "/";
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setBiometricError("Authentication was cancelled");
      } else {
        setBiometricError(err.message || "Biometric authentication failed");
      }
    }
    setBiometricLoading(false);
  };

  return (
    <div className="public-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))",
            border: "1px solid rgba(201,162,39,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 32px rgba(201,162,39,0.1)",
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#C9A227", fontFamily: "'Barlow Condensed', sans-serif" }}>3C</span>
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 32, fontWeight: 900, color: "#fff",
            margin: "0 0 8px",
          }}>
            Welcome back
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.5 }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 32,
          display: "flex", flexDirection: "column", gap: 20,
        }}>

          {(error || biometricError) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
              <p style={{ fontSize: 14, color: "#EF4444", margin: 0 }}>{error || biometricError}</p>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: "100%", padding: "14px 48px 14px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "16px", borderRadius: 14, marginTop: 4,
              background: "linear-gradient(135deg, #C9A227, #A68B1B)",
              border: "none", color: "#000", fontWeight: 800, fontSize: 16,
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 20px rgba(201,162,39,0.3)",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {biometricSupported && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                style={{
                  padding: "16px", borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(201,162,39,0.2)",
                  color: "#C9A227", fontWeight: 700, fontSize: 15,
                  cursor: biometricLoading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  opacity: biometricLoading ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                {biometricLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Fingerprint size={20} />
                )}
                {biometricLoading ? "Verifying..." : "Sign in with Face ID / Fingerprint"}
              </button>
            </>
          )}

          <div style={{ textAlign: "center", paddingTop: 4 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              Don't have an account?{" "}
              <a href="/register" style={{ color: "#C9A227", textDecoration: "none", fontWeight: 600 }}>
                Get started
              </a>
            </p>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          <a href="/landing" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Learn more about 3C ONYX →</a>
        </p>
      </div>
    </div>
  );
}
