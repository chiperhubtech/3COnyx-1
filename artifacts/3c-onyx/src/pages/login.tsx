import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, AlertCircle, ScanFace } from "lucide-react";
import {
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A227";

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.42-3.74 4.25z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login, socialLogin, loading, error, clearError } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setBiometricSupported(browserSupportsWebAuthn());
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {}
  };

  const handleGoogleLogin = useCallback(async () => {
    setSocialLoading("google");
    setLocalError("");
    clearError();
    try {
      if (!window.google?.accounts?.id) {
        setLocalError("Google Sign-In is loading. Try again in a moment.");
        setSocialLoading(null);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: (window as any).__GOOGLE_CLIENT_ID || "placeholder",
        callback: async (response: any) => {
          try {
            await socialLogin("google", response.credential);
            navigate("/");
          } catch {
            setSocialLoading(null);
          }
        },
      });
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.google.accounts.id.renderButton(
            document.getElementById("google-btn-container")!,
            { theme: "filled_black", size: "large", width: 360 }
          );
          const btn = document.querySelector("#google-btn-container div[role=button]") as HTMLElement;
          if (btn) btn.click();
          else setSocialLoading(null);
        }
      });
    } catch (err: any) {
      setLocalError(err.message || "Google sign-in failed");
      setSocialLoading(null);
    }
  }, [socialLogin, navigate, clearError]);

  const handleAppleLogin = useCallback(async () => {
    setSocialLoading("apple");
    setLocalError("");
    clearError();
    try {
      if (!window.AppleID) {
        const script = document.createElement("script");
        script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      window.AppleID.auth.init({
        clientId: (window as any).__APPLE_CLIENT_ID || "com.cuxtomcandyclub.3conyx",
        scope: "name email",
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization?.id_token;
      const fullName = response.user ? `${response.user.name?.firstName || ""} ${response.user.name?.lastName || ""}`.trim() : undefined;
      if (idToken) {
        await socialLogin("apple", idToken, fullName);
        navigate("/");
      } else {
        setLocalError("Apple sign-in was cancelled");
      }
    } catch (err: any) {
      if (err?.error !== "popup_closed_by_user") {
        setLocalError(err.message || "Apple sign-in failed");
      }
    }
    setSocialLoading(null);
  }, [socialLogin, navigate, clearError]);

  const handleBiometricLogin = async () => {
    setLocalError("");
    setBiometricLoading(true);
    try {
      const optRes = await fetch(`${BASE}/api/webauthn/authenticate/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        setLocalError(data.error || "No biometric credentials found");
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
        setLocalError(data.error || "Biometric verification failed");
        setBiometricLoading(false);
        return;
      }

      const { token } = await verifyRes.json();
      localStorage.setItem("onyxToken", token);
      localStorage.setItem("3c_auth_token", token);
      window.location.href = "/";
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setLocalError("Authentication was cancelled");
      } else {
        setLocalError(err.message || "Biometric authentication failed");
      }
    }
    setBiometricLoading(false);
  };

  const displayError = error || localError;

  const socialBtnStyle = (bg: string, border: string): React.CSSProperties => ({
    width: "100%", padding: "14px 16px", borderRadius: 14,
    background: bg, border: `1px solid ${border}`,
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 12, transition: "all 0.2s",
  });

  return (
    <div className="public-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div id="google-btn-container" style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))",
            border: "1px solid rgba(201,162,39,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 32px rgba(201,162,39,0.1)",
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: GOLD, fontFamily: "'Barlow Condensed', sans-serif" }}>3C</span>
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 32, fontWeight: 900, color: "#fff", margin: "0 0 8px",
          }}>
            Welcome back
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.5 }}>
            Sign in to your account
          </p>
        </div>

        {displayError && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 20 }}>
            <AlertCircle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: "#EF4444", margin: 0 }}>{displayError}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {biometricSupported && (
            <button
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              style={{
                ...socialBtnStyle("linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.08))", "rgba(201,162,39,0.3)"),
                color: GOLD,
              }}
            >
              {biometricLoading ? <Loader2 size={18} className="animate-spin" /> : <ScanFace size={22} />}
              {biometricLoading ? "Verifying..." : "Sign in with Face ID"}
            </button>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={socialLoading === "google"}
            style={socialBtnStyle("rgba(255,255,255,0.06)", "rgba(255,255,255,0.12)")}
          >
            {socialLoading === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            {socialLoading === "google" ? "Connecting..." : "Continue with Google"}
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={socialLoading === "apple"}
            style={socialBtnStyle("rgba(255,255,255,0.06)", "rgba(255,255,255,0.12)")}
          >
            {socialLoading === "apple" ? <Loader2 size={18} className="animate-spin" /> : <AppleIcon />}
            {socialLoading === "apple" ? "Connecting..." : "Continue with Apple"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 24px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase" }}>or use email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: 28,
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Email</label>
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
              required placeholder="Enter your email"
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
                type={showPw ? "text" : "password"} value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(""); clearError(); }}
                required placeholder="Enter your password"
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
            type="submit" disabled={loading}
            style={{
              padding: "16px", borderRadius: 14, marginTop: 4,
              background: `linear-gradient(135deg, ${GOLD}, #A68B1B)`,
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

          <div style={{ textAlign: "center", paddingTop: 4 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              Not a member yet?{" "}
              <a href="/register" style={{ color: GOLD, textDecoration: "none", fontWeight: 600 }}>
                Get invited
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
