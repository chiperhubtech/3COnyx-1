import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Car, Wrench, Shield, HeartPulse, HelpCircle,
  MessageCircle, ArrowRight, ChevronRight,
  Send, X, Loader2, CheckCircle2,
  Clock, MapPin, Sparkles,
  Gift, Share2, Users, DollarSign, Copy,
  Zap, TrendingUp, Award, Network, Star, Heart,
  AlertTriangle, Repeat, Mic, ChevronLeft,
  Check, Phone, User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("onyxToken");
  return fetch(url, {
    ...opts,
    headers: { ...opts.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getFirstName(token: string | null): string {
  if (!token) return "";
  const payload = parseJwt(token);
  if (!payload?.name) return "";
  return payload.name.split(" ")[0];
}

const DEAL_STATUS_LABELS: Record<string, string> = {
  "New": "We're getting started",
  "Intake": "We're reviewing your info",
  "Credit_Pull": "We're checking financing options",
  "Financing": "We're finalizing your financing",
  "F&I_Pending": "We're finalizing your financing",
  "Insurance": "We're setting up your coverage",
  "DMV_Processing": "We're getting your plates ready",
  "Vehicle_Prep": "We're preparing your vehicle",
  "Quality_Check": "Almost there — final checks",
  "Funded": "Your deal is funded",
  "Delivered": "Enjoy your new ride!",
  "In_Progress": "We're working on your deal",
};

const DEAL_STEPS = [
  "Started", "Financing", "Insurance", "Plates", "Prep", "Ready",
];

function getDealProgress(status: string): number {
  const map: Record<string, number> = {
    "New": 10, "Intake": 15, "Credit_Pull": 25, "Financing": 40,
    "F&I_Pending": 45, "Insurance": 55, "DMV_Processing": 65,
    "Vehicle_Prep": 75, "Quality_Check": 85, "Funded": 95, "Delivered": 100,
    "In_Progress": 35,
  };
  return map[status] ?? 20;
}

function OnyxLogo({ size = 64 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #1a1a1a 0%, #0a0a0a 50%, #000 100%)",
      border: "2px solid rgba(201,162,39,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      boxShadow: "0 0 40px rgba(201,162,39,0.15), inset 0 0 20px rgba(201,162,39,0.05)",
    }}>
      <div style={{
        position: "absolute", inset: 3, borderRadius: "50%",
        border: "1px solid rgba(201,162,39,0.2)",
      }} />
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: size * 0.35, fontWeight: 900,
        background: "linear-gradient(160deg, #D4AF37, #C9A227, #B8941F, #D4AF37)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: 1,
      }}>
        3C
      </span>
    </div>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(onComplete, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#000000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: phase === "exit" ? 0 : 1,
      transition: "opacity 0.6s ease",
    }}>
      <div style={{
        opacity: phase === "enter" ? 0 : 1,
        transform: phase === "enter" ? "scale(0.8)" : "scale(1)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        textAlign: "center",
      }}>
        <OnyxLogo size={80} />
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 36, fontWeight: 900, color: "#fff",
          margin: "24px 0 8px", letterSpacing: 4, textTransform: "uppercase",
        }}>
          3C ONYX
        </h1>
        <p style={{
          fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.5)",
          margin: "0 0 6px", fontStyle: "italic",
        }}>
          We handle everything.
        </p>
        <p style={{
          fontSize: 9, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
          color: "rgba(201,162,39,0.4)", margin: 0,
        }}>
          Powered by CUXTOMCANDYCLUB
        </p>
      </div>
    </div>
  );
}

type ServiceCategory = "buy" | "sell" | "service" | "insurance" | "emergency";

const SERVICE_CONFIG: Record<ServiceCategory, {
  icon: any; label: string; description: string; accent: string;
  department: string; intakeTitle: string;
  chips: string[];
  processingSteps: string[];
  resultMessage: string;
}> = {
  buy: {
    icon: Car, label: "Buy a Car", description: "We'll find the perfect match",
    accent: "#C9A227", department: "Sales", intakeTitle: "Vehicle Purchase Request",
    chips: ["SUV", "Sedan", "Truck", "Luxury", "Under $30k", "Under $50k"],
    processingSteps: [
      "Analyzing your preferences...",
      "Searching local inventory...",
      "Comparing pricing across dealers...",
      "Matching you with the best options...",
    ],
    resultMessage: "We've found options matching your criteria. A specialist is being assigned to get you the best deal.",
  },
  sell: {
    icon: Repeat, label: "Sell / Trade", description: "Get top value instantly",
    accent: "#34D399", department: "Sales", intakeTitle: "Vehicle Sell/Trade Request",
    chips: ["Get Instant Offer", "Trade for Upgrade", "Sell Outright", "Free Appraisal"],
    processingSteps: [
      "Analyzing market conditions...",
      "Pulling comparable sales data...",
      "Calculating your vehicle's value...",
      "Preparing your personalized offer...",
    ],
    resultMessage: "Your vehicle valuation is being prepared. A specialist will present your offer within minutes.",
  },
  service: {
    icon: Wrench, label: "Service / Repair", description: "Repairs, maintenance, everything",
    accent: "#60A5FA", department: "Service", intakeTitle: "Vehicle Service/Repair Request",
    chips: ["Oil Change", "Brake Check", "Engine Issue", "Body Work", "Tire Service", "Diagnostic"],
    processingSteps: [
      "Understanding the issue...",
      "Finding certified specialists nearby...",
      "Checking availability...",
      "Coordinating your service...",
    ],
    resultMessage: "A certified specialist is being assigned. We're coordinating everything — you don't need to do a thing.",
  },
  insurance: {
    icon: Shield, label: "Insurance", description: "Best rates, zero hassle",
    accent: "#A78BFA", department: "F_And_I", intakeTitle: "Insurance Request",
    chips: ["New Quote", "Compare Rates", "Add Vehicle", "Lower My Premium", "Full Coverage"],
    processingSteps: [
      "Analyzing your profile...",
      "Comparing rates from top providers...",
      "Building your personalized quote...",
      "Securing the best pricing...",
    ],
    resultMessage: "We're comparing rates from multiple providers. Your personalized options are being prepared now.",
  },
  emergency: {
    icon: AlertTriangle, label: "Emergency", description: "Immediate help dispatched",
    accent: "#EF4444", department: "Service", intakeTitle: "Emergency Roadside Request",
    chips: ["Tow Truck", "Flat Tire", "Lockout", "Dead Battery", "Accident", "Fuel Delivery"],
    processingSteps: [
      "Emergency received — prioritizing...",
      "Locating nearest available help...",
      "Dispatching assistance...",
      "Help is on the way...",
    ],
    resultMessage: "Help is being dispatched to your location. A specialist will contact you momentarily.",
  },
};

type FlowPhase = "idle" | "chips" | "details" | "processing" | "result" | "error";

function ConversationalFlow({
  category,
  onBack,
}: {
  category: ServiceCategory;
  onBack: () => void;
}) {
  const config = SERVICE_CONFIG[category];
  const Icon = config.icon;

  const [phase, setPhase] = useState<FlowPhase>("chips");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [trackingCode, setTrackingCode] = useState("");
  const [showAuthCta, setShowAuthCta] = useState(false);
  const submitOk = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleProceedToDetails = () => {
    setPhase("details");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSubmit = async () => {
    setPhase("processing");
    setProcessingStep(0);
    submitOk.current = false;

    const description = [
      `Service: ${config.label}`,
      selectedChips.length ? `Preferences: ${selectedChips.join(", ")}` : "",
      freeText.trim() ? `Details: ${freeText.trim()}` : "",
    ].filter(Boolean).join("\n");

    try {
      const referrerCode = sessionStorage.getItem("onyx_ref") || undefined;
      const res = await fetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.intakeTitle,
          description,
          department: config.department,
          initiatorTier: "Customer",
          initiatorName: contactName.trim() || "Guest",
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          referrerCode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrackingCode(data.trackingCode || "");
        submitOk.current = true;
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  };

  useEffect(() => {
    if (phase !== "processing") return;
    if (processingStep < config.processingSteps.length - 1) {
      const delays = category === "emergency" ? [800, 1200, 1500, 1000] : [1200, 2000, 2500, 1500];
      const delay = delays[processingStep] || 1500;
      const t = setTimeout(() => setProcessingStep((s) => s + 1), delay);
      return () => clearTimeout(t);
    }
    if (submitOk.current) {
      const t = setTimeout(() => setPhase("result"), 1200);
      return () => clearTimeout(t);
    }
    return;
  }, [phase, processingStep, config.processingSteps.length, category]);

  useEffect(() => {
    if (phase !== "result") { setShowAuthCta(false); return; }
    const t = setTimeout(() => setShowAuthCta(true), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none", color: "rgba(255,255,255,0.35)",
          fontSize: 13, cursor: "pointer", padding: "4px 0", marginBottom: 20,
          fontWeight: 500,
        }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: `${config.accent}15`,
          border: `1px solid ${config.accent}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={24} style={{ color: config.accent }} />
        </div>
        <div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2,
          }}>
            {config.label}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
            {config.description}
          </p>
        </div>
      </div>

      {phase === "chips" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            margin: "0 0 14px", letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            What are you looking for?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {config.chips.map((chip) => {
              const selected = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  style={{
                    padding: "14px 22px", borderRadius: 14,
                    background: selected ? `${config.accent}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selected ? config.accent + "40" : "rgba(255,255,255,0.08)"}`,
                    color: selected ? config.accent : "rgba(255,255,255,0.6)",
                    fontSize: 15, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleProceedToDetails}
            style={{
              width: "100%", padding: "18px", borderRadius: 16,
              background: selectedChips.length > 0
                ? `linear-gradient(135deg, ${config.accent}, ${config.accent}CC)`
                : "rgba(255,255,255,0.06)",
              border: selectedChips.length > 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: selectedChips.length > 0 ? "#000" : "rgba(255,255,255,0.5)",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            {selectedChips.length > 0 ? "Continue" : "Skip — tell us in your own words"}
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {phase === "details" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {selectedChips.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16,
            }}>
              {selectedChips.map((chip) => (
                <span key={chip} style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: `${config.accent}12`,
                  border: `1px solid ${config.accent}25`,
                  color: config.accent, fontSize: 12, fontWeight: 600,
                }}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          <textarea
            ref={inputRef}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            rows={3}
            style={{
              width: "100%", padding: "16px", borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff", fontSize: 15, outline: "none", resize: "none",
              boxSizing: "border-box", lineHeight: 1.5,
              fontFamily: "system-ui, sans-serif",
              marginBottom: 16,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = `${config.accent}40`}
            onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
          />

          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", margin: "0 0 10px", letterSpacing: 1.5, textTransform: "uppercase" }}>
            How can we reach you? (optional)
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <User size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} />
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "14px 14px 14px 38px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <Phone size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)" }} />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone"
                type="tel"
                style={{
                  width: "100%", padding: "14px 14px 14px 38px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%", padding: "18px", borderRadius: 16,
              background: `linear-gradient(135deg, ${config.accent}, ${config.accent}CC)`,
              border: "none", color: "#000", fontWeight: 800, fontSize: 16,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 24px ${config.accent}30`,
            }}
          >
            {category === "emergency" ? "Get Help Now" : "Find My Options"} <ArrowRight size={18} />
          </button>

          <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
            No account needed — we handle everything
          </p>
        </div>
      )}

      {phase === "processing" && (
        <div style={{ animation: "fadeIn 0.4s ease", padding: "20px 0" }}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20, padding: "28px 24px",
          }}>
            {config.processingSteps.map((step, i) => {
              const done = i < processingStep;
              const active = i === processingStep;
              return (
                <div key={i} style={{
                  display: "flex", gap: 14, marginBottom: i < config.processingSteps.length - 1 ? 0 : 0,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "#34D399" : active ? `linear-gradient(135deg, ${config.accent}, ${config.accent}CC)` : "rgba(255,255,255,0.04)",
                      transition: "all 0.5s",
                      boxShadow: active ? `0 0 16px ${config.accent}40` : "none",
                    }}>
                      {done ? <Check size={14} style={{ color: "#fff" }} /> :
                       active ? <Loader2 size={14} className="animate-spin" style={{ color: "#000" }} /> :
                       <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />}
                    </div>
                    {i < config.processingSteps.length - 1 && (
                      <div style={{
                        width: 2, height: 24,
                        background: done ? "#34D399" : "rgba(255,255,255,0.04)",
                        transition: "background 0.5s",
                      }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4, paddingBottom: i < config.processingSteps.length - 1 ? 8 : 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3,
                      color: done ? "#34D399" : active ? "#fff" : "rgba(255,255,255,0.2)",
                      transition: "color 0.5s",
                    }}>{step}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === "error" && (
        <div style={{ animation: "fadeIn 0.5s ease", padding: "12px 0" }}>
          <div style={{
            background: "linear-gradient(160deg, rgba(239,68,68,0.07), rgba(239,68,68,0.02))",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 20, padding: "32px 24px",
            textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <AlertTriangle size={28} style={{ color: "#ef4444" }} />
            </div>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px",
            }}>
              Something went wrong
            </h3>
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              margin: "0 0 20px",
            }}>
              We couldn't process your request right now. Please try again.
            </p>
            <button
              onClick={() => { setPhase("details"); }}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444", padding: "12px 28px", borderRadius: 14,
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              <Repeat size={14} style={{ marginRight: 8, verticalAlign: "middle" }} />
              Try Again
            </button>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div style={{ animation: "fadeIn 0.5s ease", padding: "12px 0" }}>
          <div style={{
            background: `linear-gradient(160deg, ${config.accent}12, ${config.accent}04)`,
            border: `1px solid ${config.accent}20`,
            borderRadius: 20, padding: "32px 24px",
            textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: `${config.accent}18`,
              border: `1px solid ${config.accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 size={28} style={{ color: config.accent }} />
            </div>

            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px",
            }}>
              {category === "emergency" ? "Help is on the way" : "We're on it"}
            </h3>
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              margin: "0 0 20px", maxWidth: 320, marginLeft: "auto", marginRight: "auto",
            }}>
              {config.resultMessage}
            </p>

            {trackingCode && (
              <div style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 12, padding: "14px 18px",
                display: "inline-flex", alignItems: "center", gap: 10,
                marginBottom: 20,
              }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", margin: "0 0 2px", letterSpacing: 1.5, textTransform: "uppercase" }}>Tracking Code</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: config.accent, fontFamily: "monospace", margin: 0 }}>{trackingCode}</p>
                </div>
              </div>
            )}

            <div style={{
              opacity: showAuthCta ? 1 : 0,
              transform: showAuthCta ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
              pointerEvents: showAuthCta ? "auto" : "none",
            }}>
              <button
                onClick={() => {
                  const loginUrl = `${window.location.origin}/login`;
                  window.location.href = loginUrl;
                }}
                style={{
                  width: "100%", padding: "18px", borderRadius: 16,
                  background: `linear-gradient(135deg, ${config.accent}, ${config.accent}CC)`,
                  border: "none", color: "#000", fontWeight: 800, fontSize: 15,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: `0 4px 24px ${config.accent}30`,
                  marginBottom: 10,
                }}
              >
                Create ONYX Profile to Track This
              </button>
            </div>

            <button
              onClick={onBack}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 13,
                cursor: "pointer",
              }}
            >
              Done — we'll reach out
            </button>
          </div>

          <p style={{
            textAlign: "center", marginTop: 20, fontSize: 11,
            color: "rgba(255,255,255,0.15)", lineHeight: 1.6,
          }}>
            No account required. We'll handle everything<br />and reach out to you directly.
          </p>
        </div>
      )}
    </div>
  );
}

function NeuralInput({ onSubmit }: { onSubmit: (message: string) => void }) {
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage("");
  };

  return (
    <div style={{
      position: "relative",
      marginBottom: 28,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 6px 6px 20px",
        borderRadius: 18,
        background: focused ? "rgba(201,162,39,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${focused ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.2s",
        boxShadow: focused ? "0 0 30px rgba(201,162,39,0.06)" : "none",
      }}>
        <Sparkles size={16} style={{ color: focused ? "#C9A227" : "rgba(255,255,255,0.15)", flexShrink: 0, transition: "color 0.2s" }} />
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Or just ask ONYX..."
          style={{
            flex: 1, padding: "14px 0", borderRadius: 0,
            background: "transparent",
            border: "none",
            color: "#fff", fontSize: 15, outline: "none",
            fontFamily: "system-ui, sans-serif",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: message.trim() ? "linear-gradient(135deg, #D4AF37, #C9A227)" : "rgba(255,255,255,0.04)",
            border: "none", cursor: message.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <Send size={18} style={{ color: message.trim() ? "#000" : "rgba(255,255,255,0.12)" }} />
        </button>
      </div>
    </div>
  );
}

function ServiceCard({ icon: Icon, label, description, accent, onClick }: {
  icon: any; label: string; description: string; accent: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: "100%",
        padding: "20px 20px",
        borderRadius: 16,
        background: pressed ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${pressed ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex", alignItems: "center", gap: 16,
        textAlign: "left",
        color: "#fff",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: `${accent}0D`,
        border: `1px solid ${accent}1A`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={22} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
    </button>
  );
}

function ActiveFlowCard({ deal }: { deal: any }) {
  const pct = getDealProgress(deal.status);
  const label = DEAL_STATUS_LABELS[deal.status] || "We're handling this for you";
  const stepIndex = Math.floor((pct / 100) * DEAL_STEPS.length);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(201,162,39,0.06), rgba(201,162,39,0.02))",
      border: "1px solid rgba(201,162,39,0.12)",
      borderRadius: 20, padding: "24px 24px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.05))",
          border: "1px solid rgba(201,162,39,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Car size={22} style={{ color: "#C9A227" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
            {deal.vehicleYear} {deal.vehicleMake} {deal.vehicleModel || ""}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
            {deal.customerName ? `For ${deal.customerName.split(" ")[0]}` : "Your vehicle"}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.5 }}>
        {label}
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${pct}%`,
            background: pct === 100
              ? "linear-gradient(90deg, #34D399, #10B981)"
              : "linear-gradient(90deg, #D4AF37, #C9A227)",
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {DEAL_STEPS.map((step, i) => (
            <span key={step} style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
              color: i <= stepIndex ? "#C9A227" : "rgba(255,255,255,0.15)",
            }}>{step}</span>
          ))}
        </div>
      </div>

      <Link href="/dealerflow">
        <button style={{
          width: "100%", padding: "16px", borderRadius: 14,
          background: "linear-gradient(135deg, #D4AF37, #C9A227, #A68B1B)",
          border: "none", color: "#000", fontWeight: 800, fontSize: 15,
          cursor: "pointer", letterSpacing: 0.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 24px rgba(201,162,39,0.3)",
        }}>
          Continue <ArrowRight size={18} />
        </button>
      </Link>
    </div>
  );
}

function AskOnyxSheet({ open, onClose, initialMessage }: { open: boolean; onClose: () => void; initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMessage(initialMessage || "");
      setSending(false);
      setSent(false);
      setSendError(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, initialMessage]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setSendError(false);
    try {
      const res = await authFetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Ask ONYX — Member Request",
          description: message.trim(),
          department: "Sales",
          initiatorTier: "Customer",
          initiatorName: "ONYX Member",
        }),
      });
      if (res.ok) { setSent(true); } else { setSendError(true); }
    } catch { setSendError(true); }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
      }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        background: "linear-gradient(180deg, #111114, #0A0A0C)",
        borderRadius: "24px 24px 0 0",
        border: "1px solid rgba(201,162,39,0.1)",
        borderBottom: "none",
        padding: "28px 24px 36px",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <OnyxLogo size={36} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Ask ONYX</p>
              <p style={{ fontSize: 11, color: "rgba(201,162,39,0.5)", margin: 0, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Command Center</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <CheckCircle2 size={48} style={{ color: "#34D399", marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Request received</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, maxWidth: 300, margin: "0 auto 24px" }}>
              We'll take care of this for you. You'll hear from us shortly.
            </p>
            <button onClick={onClose} style={{
              padding: "14px 40px", borderRadius: 12,
              background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)",
              color: "#C9A227", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              Done
            </button>
          </div>
        ) : sendError ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <X size={48} style={{ color: "#EF4444", marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Something went wrong</p>
            <button onClick={() => setSendError(false)} style={{
              padding: "14px 40px", borderRadius: 12,
              background: "linear-gradient(135deg, #D4AF37, #C9A227)",
              border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {["I want to buy a car", "I need roadside help", "Get me an insurance quote", "Schedule a service"].map((q) => (
                <button key={q} onClick={() => setMessage(q)} style={{
                  padding: "8px 14px", borderRadius: 20,
                  background: "rgba(201,162,39,0.06)",
                  border: "1px solid rgba(201,162,39,0.12)",
                  color: "#C9A227", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your request..."
                style={{
                  flex: 1, padding: "16px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 15, outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: message.trim() ? "linear-gradient(135deg, #D4AF37, #C9A227)" : "rgba(255,255,255,0.04)",
                  border: "none", cursor: message.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {sending ? <Loader2 size={20} className="animate-spin" style={{ color: "#000" }} /> : <Send size={20} style={{ color: message.trim() ? "#000" : "rgba(255,255,255,0.15)" }} />}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const ROLE_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  Member: { label: "ONYX Network Member", color: "#C9A227", icon: Star },
  Connector: { label: "ONYX Connector", color: "#34D399", icon: Network },
  Operator: { label: "ONYX Operator", color: "#60A5FA", icon: Zap },
};

const TIER_COLORS: Record<string, string> = {
  Starter: "rgba(255,255,255,0.3)",
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#FFD700",
  Platinum: "#E5E4E2",
};

function ImpactDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["community-profile"],
    queryFn: () => authFetch(`${BASE}/api/community/profile`).then((r) => r.ok ? r.json() : null),
    refetchInterval: 30_000,
  });

  const [copied, setCopied] = useState(false);

  const handleHelpSomeone = async () => {
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (navigator.share) {
          await navigator.share({
            title: "Join me on ONYX",
            text: "I'm part of a network changing how the automotive industry works. Join me.",
            url: d.referralLink,
          });
        } else if (d.referralLink) {
          navigator.clipboard.writeText(d.referralLink).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {}
  };

  if (isLoading || !data) return null;

  const badge = ROLE_BADGE[data.communityRole] || ROLE_BADGE.Member;
  const BadgeIcon = badge.icon;
  const tierColor = TIER_COLORS[data.impact?.networkTier] || TIER_COLORS.Starter;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        background: "linear-gradient(160deg, rgba(201,162,39,0.08), rgba(201,162,39,0.02), rgba(0,0,0,0))",
        border: "1px solid rgba(201,162,39,0.12)",
        borderRadius: 20, padding: "24px 20px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 160, height: 160,
          background: "radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `${badge.color}15`,
            border: `1px solid ${badge.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BadgeIcon size={20} style={{ color: badge.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)",
              margin: "0 0 4px", letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              Your Impact
            </p>
            <span style={{
              fontSize: 10, fontWeight: 800, color: badge.color,
              background: `${badge.color}12`, padding: "3px 8px", borderRadius: 6,
              letterSpacing: 1, textTransform: "uppercase",
            }}>
              {badge.label}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { value: data.impact?.peopleHelped || 0, label: "People Helped", color: "#34D399", icon: Heart },
            { value: `$${(data.impact?.totalEarnings || 0).toFixed(0)}`, label: "Total Earnings", color: "#C9A227", icon: DollarSign },
            { value: data.impact?.connections || 0, label: "Connections", color: tierColor, icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 14,
              padding: "14px 10px", textAlign: "center",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              <stat.icon size={16} style={{ color: stat.color, marginBottom: 6 }} />
              <p style={{ fontSize: 24, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "6px 0 0", fontWeight: 600, letterSpacing: 0.3 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {data.impact?.networkTier && data.impact.networkTier !== "Starter" && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginBottom: 16, padding: "6px 0",
          }}>
            <Award size={13} style={{ color: tierColor }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: tierColor, letterSpacing: 2, textTransform: "uppercase" }}>
              {data.impact.networkTier} Network
            </span>
          </div>
        )}

        <button
          onClick={handleHelpSomeone}
          style={{
            width: "100%", padding: "15px", borderRadius: 14,
            background: "linear-gradient(135deg, #34D399, #10B981)",
            border: "none", color: "#000", fontWeight: 800, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 20px rgba(52,211,153,0.2)",
          }}
        >
          {copied ? <><CheckCircle2 size={16} /> Link Copied!</> : <><Heart size={16} /> Help Someone</>}
        </button>
      </div>
    </div>
  );
}

function NetworkFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["network-feed"],
    queryFn: () => authFetch(`${BASE}/api/community/network-feed`).then((r) => r.ok ? r.json() : null),
    refetchInterval: 30_000,
  });

  if (isLoading || !data?.feed?.length) return null;

  const statusDotColor: Record<string, string> = {
    green: "#34D399", yellow: "#F59E0B", red: "#EF4444", blue: "#60A5FA",
  };

  return (
    <div style={{
      marginBottom: 20,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 16, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Network size={14} style={{ color: "#C9A227" }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>Your Network</p>
      </div>
      {data.feed.slice(0, 8).map((item: any, i: number) => (
        <div key={item.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 0",
          borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: statusDotColor[item.statusDot] || statusDotColor.blue,
            boxShadow: `0 0 6px ${statusDotColor[item.statusDot] || statusDotColor.blue}50`,
          }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.4 }}>
            {item.message}
          </p>
        </div>
      ))}
    </div>
  );
}

function CelebrationModal({ onClose }: { onClose: (celebrationId?: number) => void }) {
  const lastSeenId = sessionStorage.getItem("onyx_last_celebration_id") || "0";
  const { data } = useQuery({
    queryKey: ["celebration-check", lastSeenId],
    queryFn: () => authFetch(`${BASE}/api/community/celebration-check?lastSeenId=${lastSeenId}`).then((r) => r.ok ? r.json() : null),
  });

  const handleHelpAnother = async () => {
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (navigator.share) {
          await navigator.share({
            title: "Join the ONYX network",
            text: "I just helped someone through ONYX. Join the movement.",
            url: d.referralLink,
          });
        } else if (d.referralLink) {
          navigator.clipboard.writeText(d.referralLink).catch(() => {});
        }
      }
    } catch {}
    onClose();
  };

  if (!data?.hasCelebration) return null;
  const c = data.celebration;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={() => onClose(c.celebrationDbId)} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)",
      }} />
      <div style={{
        position: "relative", width: "90%", maxWidth: 380,
        background: "linear-gradient(180deg, #0F0F12, #08080A)",
        borderRadius: 24, padding: "40px 28px 32px",
        border: "1px solid rgba(201,162,39,0.15)",
        textAlign: "center",
        animation: "fadeIn 0.4s ease",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(201,162,39,0.06)",
      }}>
        <OnyxLogo size={56} />
        <div style={{ height: 24 }} />
        <h2 style={{
          fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          You made a difference
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "0 0 8px", lineHeight: 1.5 }}>
          You helped <span style={{ color: "#34D399", fontWeight: 700 }}>{c.personHelped}</span> solve their {c.serviceType} problem
        </p>
        {c.earned > 0 && (
          <p style={{
            fontSize: 32, fontWeight: 900,
            background: "linear-gradient(135deg, #D4AF37, #F5D76E, #C9A227)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            margin: "20px 0", fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            +${c.earned.toFixed(0)} earned
          </p>
        )}
        <button onClick={handleHelpAnother} style={{
          width: "100%", padding: "16px", borderRadius: 14,
          background: "linear-gradient(135deg, #34D399, #10B981)",
          border: "none", color: "#000", fontWeight: 800, fontSize: 15,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 10,
        }}>
          <Heart size={18} /> Help Someone Else
        </button>
        <button onClick={() => onClose(c.celebrationDbId)} style={{
          width: "100%", padding: "13px", borderRadius: 12,
          background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          Later
        </button>
      </div>
    </div>
  );
}

function ViralLoopPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed) return null;

  const handleShare = async () => {
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (navigator.share) {
          await navigator.share({
            title: "Join the ONYX network",
            text: "We handle everything automotive so people don't have to. Join the movement.",
            url: d.referralLink,
          });
        } else {
          navigator.clipboard.writeText(d.referralLink).catch(() => {});
        }
      }
    } catch {}
    setDismissed(true);
  };

  return (
    <div style={{
      marginBottom: 20,
      background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02))",
      border: "1px solid rgba(52,211,153,0.15)",
      borderRadius: 16, padding: "24px 20px", textAlign: "center",
      animation: "fadeIn 0.5s ease",
    }}>
      <Heart size={22} style={{ color: "#34D399", marginBottom: 12 }} />
      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
        You can help someone right now
      </h3>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px", lineHeight: 1.5 }}>
        Know someone struggling with anything automotive? Connect them to ONYX — you earn every time they're helped.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleShare} style={{
          flex: 1, padding: "14px", borderRadius: 12,
          background: "#34D399", border: "none",
          color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Heart size={14} /> Help Someone
        </button>
        <button onClick={() => setDismissed(true)} style={{
          padding: "14px 16px", borderRadius: 12,
          background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          Later
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { token } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [showAskOnyx, setShowAskOnyx] = useState(false);
  const [askOnyxMessage, setAskOnyxMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const firstName = getFirstName(token);
  const greeting = getGreeting();

  useEffect(() => {
    const seen = sessionStorage.getItem("onyx_splash_shown");
    if (!seen) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("onyx_splash_shown", "1");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("onyx_ref", ref);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const celebrationShown = sessionStorage.getItem("onyx_celebration_shown");
    if (celebrationShown) return;
    const timer = setTimeout(() => setShowCelebration(true), 2000);
    return () => clearTimeout(timer);
  }, [token]);

  const handleCloseCelebration = (celebrationId?: number) => {
    setShowCelebration(false);
    if (celebrationId) {
      sessionStorage.setItem("onyx_last_celebration_id", String(celebrationId));
    }
    sessionStorage.setItem("onyx_celebration_shown", "1");
  };

  const handleNeuralSubmit = (msg: string) => {
    setAskOnyxMessage(msg);
    setShowAskOnyx(true);
  };

  const { data: myDeals } = useQuery({
    queryKey: ["my-deals-home"],
    queryFn: () => authFetch(`${BASE}/api/deals/dashboard/my-deals`).then((r) => r.json()),
    refetchInterval: 15_000,
    enabled: !!token,
  });

  const activeDeal = myDeals?.recentDeals?.find(
    (d: any) => !["Delivered", "Cancelled", "Unwound"].includes(d.status)
  );

  return (
    <div style={{
      background: "#000000", minHeight: "100vh",
      display: "flex", flexDirection: "column",
    }}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <div style={{
        width: "100%", maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px",
        flex: 1,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "36px 0 0", textAlign: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <OnyxLogo size={52} />
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 26, fontWeight: 900, color: "#fff",
            margin: "0 0 3px", letterSpacing: 3, textTransform: "uppercase",
          }}>
            3C ONYX
          </h1>
          <p style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(201,162,39,0.4)", margin: 0,
          }}>
            Powered by CUXTOMCANDYCLUB LLC
          </p>
        </div>

        <div style={{
          borderTop: "1px solid rgba(201,162,39,0.1)",
          margin: "14px 0 22px",
          padding: "18px 0",
          textAlign: "center",
        }}>
          {token ? (
            <>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>
                {greeting}{firstName ? `, ${firstName}` : ""}
              </p>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2,
              }}>
                What do you need help with?
              </h2>
            </>
          ) : (
            <>
              <p style={{
                fontSize: 17, fontWeight: 300, color: "rgba(255,255,255,0.6)",
                margin: "0 0 4px", fontStyle: "italic",
              }}>
                Everything automotive. One place.
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "8px 0 0" }}>
                {greeting} — what do you need help with?
              </p>
            </>
          )}
        </div>

        {activeCategory ? (
          <ConversationalFlow
            category={activeCategory}
            onBack={() => setActiveCategory(null)}
          />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(Object.entries(SERVICE_CONFIG) as [ServiceCategory, typeof SERVICE_CONFIG[ServiceCategory]][]).map(([key, cfg]) => (
                <ServiceCard
                  key={key}
                  icon={cfg.icon}
                  label={cfg.label}
                  description={cfg.description}
                  accent={cfg.accent}
                  onClick={() => setActiveCategory(key)}
                />
              ))}
            </div>

            <NeuralInput onSubmit={handleNeuralSubmit} />

            {activeDeal && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Active Deal</p>
                <ActiveFlowCard deal={activeDeal} />
              </div>
            )}

            {token && <ImpactDashboard />}
            {token && <NetworkFeed />}

            {token && myDeals?.recentDeals?.some((d: any) => d.status === "Delivered" || d.status === "Funded") && (
              <ViralLoopPrompt />
            )}

            {!token && (
              <div style={{
                marginBottom: 20, padding: "16px", textAlign: "center",
                background: "rgba(201,162,39,0.03)", borderRadius: 14,
                border: "1px solid rgba(201,162,39,0.06)",
              }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
                  We handle everything automotive so people don't have to.
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      {!activeCategory && (
        <button
          onClick={() => { setAskOnyxMessage(""); setShowAskOnyx(true); }}
          style={{
            position: "fixed",
            bottom: 24, right: 24,
            width: 60, height: 60, borderRadius: 18,
            background: "linear-gradient(135deg, #D4AF37, #C9A227, #A68B1B)",
            border: "2px solid rgba(212,175,55,0.3)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(201,162,39,0.35), 0 0 60px rgba(201,162,39,0.1)",
            zIndex: 1000,
            transition: "transform 0.15s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageCircle size={24} style={{ color: "#000" }} />
        </button>
      )}

      <AskOnyxSheet
        open={showAskOnyx}
        onClose={() => { setShowAskOnyx(false); setAskOnyxMessage(""); }}
        initialMessage={askOnyxMessage}
      />

      {showCelebration && token && <CelebrationModal onClose={handleCloseCelebration} />}

      <div style={{
        padding: "24px 24px 36px", textAlign: "center",
        borderTop: "1px solid rgba(201,162,39,0.06)",
        background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.3))",
      }}>
        {!token && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>
            Already a member?{" "}
            <a href="/login" style={{ color: "#C9A227", textDecoration: "none", fontWeight: 700 }}>Sign in</a>
          </p>
        )}
        <p style={{
          fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.1)", margin: "0 0 6px",
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          Private Preview · Not for Public Distribution
        </p>
        <p style={{
          fontSize: 10, color: "rgba(255,255,255,0.08)", margin: 0, lineHeight: 1.6, letterSpacing: 0.5,
        }}>
          3C ONYX · CUXTOMCANDYCLUB LLC · Architect: Ronald Antonio Cadet
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
