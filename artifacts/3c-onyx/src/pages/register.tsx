import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Shield, Car, Truck, Wrench, Building2, CheckCircle2, Loader2, AlertCircle, ChevronRight } from "lucide-react";

const ROLES = [
  { id: "Member",     label: "Member",     icon: Shield,    desc: "Buy, sell, and track luxury vehicles",       color: "#C9A227" },
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
  const { register, loading, error, clearError } = useAuth();
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
    } catch {
      // error shown via context
    }
  };

  return (
    <div className="public-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>3C ONYX</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 6 }}>Create your account</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? "#C9A227" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Step 3 — Success */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <CheckCircle2 size={52} style={{ color: "#34D399", margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", textTransform: "uppercase", marginBottom: 8 }}>WELCOME TO 3C ONYX</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Account created. Redirecting to your dashboard...</p>
          </div>
        )}

        {/* Step 1 — Role Selection */}
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
          </div>
        )}

        {/* Step 2 — Profile Info */}
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
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
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
          Already have an account?{" "}
          <a href="/login" style={{ color: "#C9A227", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
