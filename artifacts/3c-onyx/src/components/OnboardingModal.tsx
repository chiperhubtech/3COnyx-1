// @ts-nocheck
/**
 * 3C Onyx — First-Time Onboarding Modal
 * Shown once after registration. 3 steps:
 *   1. Welcome + role confirmation
 *   2. Connect payment method (Stripe Connect)
 *   3. Meet ONYX AI — your first interaction
 *
 * Marked complete in localStorage + API.
 */
import { useState } from "react";
import {
  Shield, Brain, CreditCard, CheckCircle2, ArrowRight,
  User, Truck, Wrench, Sparkles, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ONBOARDING_KEY = "3c_onboarding_complete";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ROLE_OPTIONS = [
  { value: "Member",     icon: User,    label: "Member",     desc: "Buy, sell, track — full platform access",           color: "#C9A227" },
  { value: "Runner",     icon: Truck,   label: "Runner",     desc: "Deliver vehicles and earn per task",                color: "#34D399" },
  { value: "Specialist", icon: Wrench,  label: "Specialist", desc: "Inspections, repairs, certified services",          color: "#A78BFA" },
];

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(user?.role ?? "Member");
  const [loading, setLoading] = useState(false);

  const STEPS = [
    { number: 1, label: "Welcome"  },
    { number: 2, label: "Payment"  },
    { number: 3, label: "Meet ONYX"},
  ];

  async function finish() {
    setLoading(true);
    localStorage.setItem(ONBOARDING_KEY, "true");
    try {
      const token = localStorage.getItem("3c_auth_token");
      await fetch(`${BASE}/api/auth/onboarding-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch { /* non-blocking */ }
    setLoading(false);
    onComplete();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        borderRadius: 24,
        background: "#08080e",
        border: "1px solid rgba(201,162,39,0.2)",
        boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,162,39,0.08)",
        overflow: "hidden",
      }}>
        {/* Gold top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #C9A227, #60A5FA, #A78BFA)" }} />

        {/* Header */}
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#C9A227,#8B6914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={16} style={{ color: "#000" }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "0.06em" }}>3C ONYX</p>
                <p style={{ fontSize: 9, color: "rgba(201,162,39,0.5)", letterSpacing: "0.2em" }}>PLATFORM SETUP</p>
              </div>
            </div>
            {/* Step progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {STEPS.map((s) => (
                <div key={s.number} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: step > s.number ? "#34D399" : step === s.number ? "#C9A227" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${step >= s.number ? "transparent" : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {step > s.number
                      ? <CheckCircle2 size={12} style={{ color: "#000" }} />
                      : <span style={{ fontSize: 9, fontWeight: 700, color: step === s.number ? "#000" : "rgba(255,255,255,0.3)" }}>{s.number}</span>
                    }
                  </div>
                  {s.number < STEPS.length && (
                    <div style={{ width: 16, height: 1, background: step > s.number ? "#34D399" : "rgba(255,255,255,0.08)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div style={{ padding: "28px 32px 24px" }}>

          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. 👋
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 24 }}>
                You're now inside the automotive intelligence layer. Before we begin, confirm how you'll use the platform.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon;
                  const selected = selectedRole === r.value;
                  return (
                    <button key={r.value} onClick={() => setSelectedRole(r.value)} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14,
                      background: selected ? `${r.color}10` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selected ? r.color + "35" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${r.color}14`, border: `1px solid ${r.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={16} style={{ color: r.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{r.label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r.desc}</p>
                      </div>
                      {selected && <CheckCircle2 size={16} style={{ color: r.color, marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Connect Your Wallet</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 24 }}>
                Dynasty Wallet powers your triple-split payouts, escrow protection, and the 5% Member Slice on every transaction.
              </p>
              <div style={{ padding: "20px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <CreditCard size={14} style={{ color: "#34D399" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#34D399", letterSpacing: "0.08em" }}>STRIPE CONNECT — BANK GRADE</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Your payment information is secured by Stripe. 3C never stores card data. Instant payouts available after identity verification.
                </p>
              </div>
              {[
                { icon: Shield, text: "Escrow protection on every purchase", color: "#34D399" },
                { icon: Sparkles, text: "5% Member Slice on all platform transactions", color: "#C9A227" },
                { icon: CheckCircle2, text: "Instant ACH payouts — no waiting", color: "#60A5FA" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <Icon size={12} style={{ color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</span>
                </div>
              ))}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 16, textAlign: "center" }}>
                Payment setup can be completed later from Dynasty Wallet → Connect Account
              </p>
            </div>
          )}

          {/* ── STEP 3: Meet ONYX ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Meet ONYX AI</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 20 }}>
                ONYX is your Master AI Concierge. It coordinates 12 specialized agents to handle any automotive need — in plain language.
              </p>
              <div style={{ padding: "18px 18px", borderRadius: 14, background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.18)", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(201,162,39,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Brain size={14} style={{ color: "#C9A227" }} />
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px 12px 12px 4px", padding: "10px 14px" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                      Hey — I'm ONYX. Tell me what you need. I'll compare prices, dispatch specialists, book Runners, and handle everything. Just talk to me like a person.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  "Find me a car under $80k",
                  "My car makes a noise",
                  "I need insurance quotes",
                  "Book a Runner for pickup",
                ].map((prompt) => (
                  <div key={prompt} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                    "{prompt}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: "0 32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: "10px 18px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} style={{ padding: "11px 24px", borderRadius: 12, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, letterSpacing: "0.04em" }}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={finish} disabled={loading} style={{ padding: "11px 24px", borderRadius: 12, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Setting up..." : "Enter the Platform"} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const complete = typeof window !== "undefined" && localStorage.getItem("3c_onboarding_complete") === "true";
  return { needsOnboarding: !complete };
}
