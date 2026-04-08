import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Shield, Car, Truck, Wrench, Building2, CheckCircle2, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const GOLD = "#C9A227";

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.42-3.74 4.25z"/>
    </svg>
  );
}

const ROLES = [
  { id: "Member",     label: "Member",     icon: Shield,    desc: "Buy, sell, and track luxury vehicles",       color: GOLD },
  { id: "Runner",     label: "Runner",     icon: Truck,     desc: "Transport vehicles, earn per delivery",       color: "#34D399" },
  { id: "Specialist", label: "Specialist", icon: Wrench,    desc: "Inspect and service vehicles professionally", color: "#60A5FA" },
  { id: "Dealer",     label: "Dealer",     icon: Building2, desc: "List inventory and access wholesale network", color: "#A78BFA" },
];

function getInitialRole(): { role: string; skipToStep2: boolean } {
  try {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    if (r && ROLES.some((x) => x.id === r)) return { role: r, skipToStep2: true };
  } catch {}
  return { role: "Member", skipToStep2: false };
}

export default function RegisterPage() {
  const { register, socialLogin, loading, error, clearError } = useAuth();
  const [, navigate] = useLocation();

  const initial = getInitialRole();
  const [step, setStep]         = useState<1 | 2 | 3>(initial.skipToStep2 ? 2 : 1);
  const [role, setRole]         = useState(initial.role);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [pwError, setPwError]   = useState("");
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (password !== confirm) { setPwError("Passwords do not match"); return; }
    if (password.length < 8)  { setPwError("Password must be at least 8 characters"); return; }
    setPwError("");
    try {
      await register({ name, email, password, role, phone: phone || undefined });
      setStep(3);
      setTimeout(() => navigate("/"), 2000);
    } catch {}
  };

  const handleGoogleSignup = useCallback(async () => {
    setSocialLoading("google");
    clearError();
    try {
      if (!window.google?.accounts?.id) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        await new Promise((resolve) => { script.onload = resolve; document.head.appendChild(script); });
        await new Promise(r => setTimeout(r, 500));
      }
      window.google.accounts.id.initialize({
        client_id: (window as any).__GOOGLE_CLIENT_ID || "placeholder",
        callback: async (response: any) => {
          try {
            await socialLogin("google", response.credential);
            setStep(3);
            setTimeout(() => navigate("/"), 1500);
          } catch { setSocialLoading(null); }
        },
      });
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const container = document.getElementById("google-reg-btn");
          if (container) {
            window.google.accounts.id.renderButton(container, { theme: "filled_black", size: "large", width: 360 });
            const btn = container.querySelector("div[role=button]") as HTMLElement;
            if (btn) btn.click();
            else setSocialLoading(null);
          } else {
            setSocialLoading(null);
          }
        }
      });
    } catch { setSocialLoading(null); }
  }, [socialLogin, navigate, clearError]);

  const handleAppleSignup = useCallback(async () => {
    setSocialLoading("apple");
    clearError();
    try {
      if (!window.AppleID) {
        const script = document.createElement("script");
        script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
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
        setStep(3);
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err: any) {
      if (err?.error !== "popup_closed_by_user") {
        setPwError(err.message || "Apple sign-up failed");
      }
    }
    setSocialLoading(null);
  }, [socialLogin, navigate, clearError]);

  const socialBtnStyle = (bg: string, border: string): React.CSSProperties => ({
    flex: 1, padding: "12px 14px", borderRadius: 12,
    background: bg, border: `1px solid ${border}`,
    color: "#fff", fontWeight: 700, fontSize: 12,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8, transition: "all 0.2s",
  });

  return (
    <div className="public-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        <div id="google-reg-btn" style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>3C ONYX</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 }}>You've been invited. Claim your spot.</p>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? GOLD : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
          ))}
        </div>

        {step === 3 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <CheckCircle2 size={52} style={{ color: "#34D399", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", textTransform: "uppercase", marginBottom: 8 }}>YOU'RE IN.</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Welcome to the network. Redirecting to your dashboard...</p>
          </div>
        )}

        {step === 1 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 16 }}>SELECT YOUR ROLE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {ROLES.map(({ id, label, icon: Icon, desc, color }) => (
                <button key={id} onClick={() => setRole(id)} style={{ padding: "16px 14px", borderRadius: 12, background: role === id ? `${color}14` : "rgba(255,255,255,0.03)", border: `1px solid ${role === id ? `${color}50` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                  <Icon size={18} style={{ color: role === id ? color : "rgba(255,255,255,0.3)", marginBottom: 8 }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: role === id ? "#fff" : "rgba(255,255,255,0.6)", margin: "0 0 4px" }}>{label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4 }}>{desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: 13, borderRadius: 12, background: "rgba(201,162,39,0.9)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              CONTINUE <ChevronRight size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 16px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase" }}>or sign up with</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleGoogleSignup} disabled={socialLoading === "google"} style={socialBtnStyle("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)")}>
                {socialLoading === "google" ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
                Google
              </button>
              <button onClick={handleAppleSignup} disabled={socialLoading === "apple"} style={socialBtnStyle("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)")}>
                {socialLoading === "apple" ? <Loader2 size={14} className="animate-spin" /> : <AppleIcon />}
                Apple
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", margin: 0 }}>YOUR INFORMATION</p>

            {(error || pwError) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{error ?? pwError}</p>
              </div>
            )}

            {[
              { label: "FULL NAME", value: name,  setValue: setName,  type: "text",     placeholder: "Marcus Webb",            required: true  },
              { label: "EMAIL",     value: email, setValue: setEmail, type: "email",    placeholder: "marcus@example.com",     required: true  },
              { label: "PHONE",     value: phone, setValue: setPhone, type: "tel",      placeholder: "+1 (555) 000-0000",      required: false },
              { label: "PASSWORD",  value: password, setValue: setPassword, type: "password", placeholder: "Min. 8 characters", required: true },
              { label: "CONFIRM PASSWORD", value: confirm, setValue: setConfirm, type: "password", placeholder: "Re-enter password", required: true },
            ].map(({ label, value, setValue, type, placeholder, required }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>{label}{required && " *"}</label>
                <input type={type} value={value} onChange={(e) => setValue(e.target.value)} required={required} placeholder={placeholder}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                BACK
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, borderRadius: 12, background: "rgba(201,162,39,0.9)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: "0.06em", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "SECURING YOUR SPOT..." : "JOIN THE NETWORK"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, textTransform: "uppercase" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleGoogleSignup} disabled={socialLoading === "google"} style={socialBtnStyle("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)")}>
                {socialLoading === "google" ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
                Google
              </button>
              <button type="button" onClick={handleAppleSignup} disabled={socialLoading === "apple"} style={socialBtnStyle("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)")}>
                {socialLoading === "apple" ? <Loader2 size={14} className="animate-spin" /> : <AppleIcon />}
                Apple
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              By creating an account you agree to our{" "}
              <a href="/legal/terms" style={{ color: "rgba(201,162,39,0.5)", textDecoration: "none" }}>Terms</a> and{" "}
              <a href="/legal/privacy" style={{ color: "rgba(201,162,39,0.5)", textDecoration: "none" }}>Privacy Policy</a>
            </p>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
          Already a member?{" "}
          <a href="/login" style={{ color: GOLD, textDecoration: "none", fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
