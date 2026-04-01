import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Car, Wrench, Shield, HeartPulse, HelpCircle,
  ArrowRight, Check, Loader2, Share2, Copy,
  CheckCircle2, Clock, Search, Phone, User,
  Sparkles, X, ChevronLeft,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FLOW_CONFIG: Record<string, {
  icon: any; title: string; subtitle: string;
  placeholder: string; department: string; intakeTitle: string;
  steps: string[];
}> = {
  buy: {
    icon: Car,
    title: "Buy a Car",
    subtitle: "Tell us what you're looking for and we'll find the perfect match",
    placeholder: "e.g., Black Ram 1500, under $40k, low miles...",
    department: "Sales",
    intakeTitle: "Vehicle Purchase Request",
    steps: [
      "Request received",
      "Finding the best options",
      "Matching you with a specialist",
      "We'll reach out shortly",
    ],
  },
  fix: {
    icon: Wrench,
    title: "Fix My Car",
    subtitle: "Describe the issue and we'll connect you with the right help",
    placeholder: "e.g., Flat tire on I-95, engine light on, need oil change...",
    department: "Service",
    intakeTitle: "Vehicle Repair / Service Request",
    steps: [
      "Request received",
      "Finding the best local option",
      "Coordinating your service",
      "Help is on the way",
    ],
  },
  insurance: {
    icon: Shield,
    title: "Insurance",
    subtitle: "Get a quote or manage your policy — we'll handle the comparison",
    placeholder: "e.g., Need full coverage for my 2024 Civic, best rate...",
    department: "F_And_I",
    intakeTitle: "Insurance Quote Request",
    steps: [
      "Request received",
      "Comparing top providers",
      "Building your quote",
      "Results coming soon",
    ],
  },
  service: {
    icon: HeartPulse,
    title: "Service",
    subtitle: "Schedule maintenance, inspections, or any automotive service",
    placeholder: "e.g., Need an oil change, brake inspection, annual service...",
    department: "Service",
    intakeTitle: "Service Appointment Request",
    steps: [
      "Request received",
      "Finding available appointments",
      "Booking your slot",
      "Confirmation on the way",
    ],
  },
  other: {
    icon: HelpCircle,
    title: "Something Else",
    subtitle: "Tell us what you need — we can help with anything automotive",
    placeholder: "Describe what you need help with...",
    department: "Sales",
    intakeTitle: "General Assistance Request",
    steps: [
      "Request received",
      "Routing to the right team",
      "A specialist will assist you",
      "We'll be in touch shortly",
    ],
  },
};

type FlowStage = "input" | "submitting" | "tracking" | "referral";

function ProgressTracker({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div style={{ padding: "8px 0" }}>
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < steps.length - 1 ? 0 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#34D399" : active ? "linear-gradient(135deg, #C9A227, #A68B1B)" : "rgba(255,255,255,0.06)",
                border: active ? "none" : done ? "none" : "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.5s",
                boxShadow: active ? "0 0 16px rgba(201,162,39,0.3)" : "none",
              }}>
                {done ? <Check size={16} style={{ color: "#fff" }} /> :
                 active ? <Loader2 size={16} className="animate-spin" style={{ color: "#000" }} /> :
                 <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>{i + 1}</span>}
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 2, height: 32,
                  background: done ? "#34D399" : "rgba(255,255,255,0.06)",
                  transition: "background 0.5s",
                }} />
              )}
            </div>
            <div style={{ paddingTop: 5, paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
              <p style={{
                fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.3,
                color: done ? "#34D399" : active ? "#fff" : "rgba(255,255,255,0.3)",
                transition: "color 0.5s",
              }}>{step}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReferralModal({ onClose, onSubmit, sending }: {
  onClose: () => void; onSubmit: (name: string, phone: string) => void; sending: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shared, setShared] = useState(false);

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "3C ONYX",
          text: "I just used 3C ONYX — they handled everything for me. You should try it.",
          url: window.location.origin,
        });
        setShared(true);
      }
    } catch { /* user cancelled */ }
  };

  const handleSubmit = () => {
    if (name.trim() && phone.trim()) {
      onSubmit(name.trim(), phone.trim());
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(12px)",
        }}
      />
      <div style={{
        position: "relative", width: "100%", maxWidth: 420,
        background: "#111114",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "40px 28px 32px",
        animation: "scaleIn 0.3s ease",
        textAlign: "center",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.06)", border: "none",
          borderRadius: 10, padding: 8, cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
        }}>
          <X size={18} />
        </button>

        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
          background: "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.05))",
          border: "1px solid rgba(201,162,39,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={28} style={{ color: "#C9A227" }} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
          Know someone who<br />needs help like this?
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28, lineHeight: 1.5 }}>
          Share with a friend — when they use 3C ONYX, you both benefit.
        </p>

        {typeof navigator.share === "function" && (
          <button
            onClick={handleNativeShare}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, marginBottom: 16,
              background: shared ? "rgba(52,211,153,0.1)" : "linear-gradient(135deg, #C9A227, #A68B1B)",
              border: shared ? "1px solid rgba(52,211,153,0.3)" : "none",
              color: shared ? "#34D399" : "#000",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {shared ? <><Check size={18} /> Shared!</> : <><Share2 size={18} /> Share with a friend</>}
          </button>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or refer directly</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Their name"
              style={{
                width: "100%", padding: "14px 14px 14px 40px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Phone size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Their phone number"
              type="tel"
              style={{
                width: "100%", padding: "14px 14px 14px 40px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !phone.trim() || sending}
          style={{
            width: "100%", padding: "16px", borderRadius: 14,
            background: (name.trim() && phone.trim()) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: (name.trim() && phone.trim()) ? "#fff" : "rgba(255,255,255,0.25)",
            fontWeight: 700, fontSize: 15, cursor: (name.trim() && phone.trim()) ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : null}
          Send referral
        </button>

        <button
          onClick={onClose}
          style={{
            marginTop: 12, background: "none", border: "none",
            color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer",
            padding: 8,
          }}
        >
          Maybe later
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function GuestFlow() {
  const [location, navigate] = useLocation();
  const flowType = location.split("/flow/")[1]?.split("?")[0] || "other";
  const config = FLOW_CONFIG[flowType] || FLOW_CONFIG.other;

  const [stage, setStage] = useState<FlowStage>("input");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [showReferral, setShowReferral] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [referralSending, setReferralSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (stage === "input") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [stage]);

  useEffect(() => {
    if (stage !== "tracking") return undefined;
    if (currentStep < config.steps.length - 1) {
      const timers = [1500, 3000, 5000];
      const delay = currentStep < timers.length ? timers[currentStep] : 2000;
      const t = setTimeout(() => setCurrentStep((s) => Math.min(s + 1, config.steps.length - 1)), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowReferral(true), 2000);
    return () => clearTimeout(t);
  }, [stage, currentStep, config.steps.length]);

  const handleSubmit = async () => {
    if (!message.trim() && !contactPhone.trim()) return;
    setStage("submitting");
    try {
      const referrerCode = sessionStorage.getItem("onyx_ref") || undefined;
      const res = await fetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.intakeTitle,
          description: message.trim() || `Guest request: ${config.title}`,
          department: config.department,
          initiatorTier: "Customer",
          initiatorName: contactName.trim() || "Guest",
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          referrerCode,
        }),
      });
      if (!res.ok) {
        setSubmitError(true);
        setStage("input");
        return;
      }
      const data = await res.json();
      setTrackingCode(data.trackingCode || data.existingTaskId || "");
      setStage("tracking");
      setCurrentStep(0);
    } catch {
      setSubmitError(true);
      setStage("input");
    }
  };

  const handleReferralSubmit = async (name: string, phone: string) => {
    setReferralSending(true);
    try {
      await fetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Referral from satisfied customer",
          description: `Referred by ${contactName || "a guest user"}: ${name} (${phone})`,
          department: "Sales",
          initiatorTier: "Customer",
          initiatorName: name,
          contactName: name,
          contactPhone: phone,
        }),
      });
      setReferralSent(true);
      setTimeout(() => setShowReferral(false), 2000);
    } catch { /* silent */ }
    setReferralSending(false);
  };

  const handleCopyCode = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Icon = config.icon;

  return (
    <div style={{
      background: "#050508", minHeight: "100vh",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        margin: "0 auto",
        padding: "24px 24px 48px",
        flex: 1,
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: "rgba(255,255,255,0.4)",
            fontSize: 14, cursor: "pointer", padding: "8px 0", marginBottom: 24,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))",
            border: "1px solid rgba(201,162,39,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={26} style={{ color: "#C9A227" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              {config.title}
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", lineHeight: 1.4 }}>
              {config.subtitle}
            </p>
          </div>
        </div>

        {stage === "input" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              style={{
                width: "100%", padding: "18px", borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 16, outline: "none", resize: "none",
                boxSizing: "border-box", lineHeight: 1.5,
                fontFamily: "system-ui, sans-serif",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
            />

            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", margin: "24px 0 10px" }}>
              How can we reach you? (optional)
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} />
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%", padding: "14px 14px 14px 40px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone"
                  type="tel"
                  style={{
                    width: "100%", padding: "14px 14px 14px 40px", borderRadius: 12,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {submitError && (
              <div style={{
                padding: "12px 16px", borderRadius: 12, marginBottom: 16,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444", fontSize: 14, textAlign: "center",
              }}>
                Something went wrong. Please try again.
              </div>
            )}

            <button
              onClick={() => { setSubmitError(false); handleSubmit(); }}
              style={{
                width: "100%", padding: "18px", borderRadius: 16,
                background: "linear-gradient(135deg, #C9A227, #A68B1B)",
                border: "none", color: "#000", fontWeight: 800, fontSize: 17,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(201,162,39,0.3)",
              }}
            >
              Get Help Now <ArrowRight size={20} />
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              No account needed — we handle everything
            </p>
          </div>
        )}

        {stage === "submitting" && (
          <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeIn 0.3s ease" }}>
            <Loader2 size={48} className="animate-spin" style={{ color: "#C9A227", marginBottom: 20 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Sending your request...</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>This only takes a moment</p>
          </div>
        )}

        {stage === "tracking" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "28px 24px", marginBottom: 20,
            }}>
              <ProgressTracker steps={config.steps} currentStep={currentStep} />
            </div>

            {trackingCode && (
              <div style={{
                background: "rgba(201,162,39,0.05)",
                border: "1px solid rgba(201,162,39,0.15)",
                borderRadius: 16, padding: "18px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Your tracking code</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#C9A227", fontFamily: "monospace", margin: 0 }}>{trackingCode}</p>
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "8px 14px",
                    color: copied ? "#34D399" : "rgba(255,255,255,0.5)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            )}

            {currentStep === config.steps.length - 1 && (
              <div style={{
                background: "rgba(52,211,153,0.06)",
                border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 16, padding: "20px",
                textAlign: "center",
              }}>
                <CheckCircle2 size={36} style={{ color: "#34D399", marginBottom: 12 }} />
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6 }}>You're all set!</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  We're handling everything. You'll hear from us soon.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: "20px 24px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0, lineHeight: 1.6 }}>
          3C ONYX · CUXTOMCANDYCLUB LLC<br />
          Architect: Ronald Antonio Cadet
        </p>
      </div>

      {showReferral && !referralSent && (
        <ReferralModal
          onClose={() => setShowReferral(false)}
          onSubmit={handleReferralSubmit}
          sending={referralSending}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
