import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  Car, Wrench, Shield, HeartPulse, HelpCircle,
  MessageCircle, ArrowRight, ChevronRight,
  Send, X, Loader2, CheckCircle2,
  Clock, MapPin, Sparkles,
  Gift, Share2, Users, DollarSign, Copy,
  Zap, TrendingUp, Award, Network, Star, Heart,
  AlertTriangle, Repeat, Mic, ChevronLeft,
  Check, Phone, User, Camera, ScanLine, Timer,
  Building2, Truck, UserPlus, Paintbrush,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NerveCenter } from "@/components/NerveCenter";

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
  const cx = 50, cy = 50, r = 30, sw = 3.2;
  const forkAngle = Math.PI / 5;
  const topCenter = { x: cx, y: cy - r };
  const bot = { x: cx, y: cy + r };
  const upL = { x: cx - r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };
  const upR = { x: cx + r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A227" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="splashRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8B830" stopOpacity="1" />
            <stop offset="50%" stopColor="#C9A227" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E8B830" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="splashGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8B830" />
            <stop offset="100%" stopColor="#C9A227" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={42} fill="url(#splashGlow)" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#splashRing)" strokeWidth={sw} strokeLinecap="round" />
        <line x1={topCenter.x} y1={topCenter.y} x2={bot.x} y2={bot.y} stroke="#E8B830" strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={upL.x} y2={upL.y} stroke="#E8B830" strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={upR.x} y2={upR.y} stroke="#E8B830" strokeWidth={sw} strokeLinecap="round" />
        <text x={30} y={cy + 14} fontSize="14" fontWeight="900" fill="url(#splashGold)" textAnchor="middle" dominantBaseline="middle" fontFamily="'Inter','Helvetica',sans-serif">3</text>
        <text x={70} y={cy + 14} fontSize="14" fontWeight="900" fill="#FFFFFF" textAnchor="middle" dominantBaseline="middle" fontFamily="'Inter','Helvetica',sans-serif">C</text>
      </svg>
    </div>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "swing" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("swing"), 200);
    const t2 = setTimeout(() => setPhase("text"), 1400);
    const t3 = setTimeout(() => setPhase("exit"), 2800);
    const t4 = setTimeout(onComplete, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const logoTransform = (() => {
    switch (phase) {
      case "logo": return "scale(0.3) rotateY(180deg) rotateZ(45deg)";
      case "swing": return "scale(1.15) rotateY(0deg) rotateZ(-5deg)";
      case "text": return "scale(1) rotateY(0deg) rotateZ(0deg)";
      case "exit": return "scale(0.9) rotateY(0deg) rotateZ(0deg)";
    }
  })();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#000000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      perspective: "1200px",
      opacity: phase === "exit" ? 0 : 1,
      transition: "opacity 0.6s ease",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: phase === "logo"
          ? "radial-gradient(circle at 50% 50%, rgba(201,162,39,0) 0%, #000 100%)"
          : "radial-gradient(circle at 50% 50%, rgba(201,162,39,0.08) 0%, #000 70%)",
        transition: "all 1.2s ease",
      }} />

      <div style={{
        position: "relative", zIndex: 2,
        textAlign: "center",
      }}>
        <div style={{
          opacity: phase === "logo" ? 0 : 1,
          transform: logoTransform,
          transition: phase === "swing"
            ? "all 1.0s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d",
          display: "inline-block",
        }}>
          <OnyxLogo size={100} />
        </div>

        <div style={{
          opacity: phase === "text" || phase === "exit" ? 1 : 0,
          transform: phase === "text" || phase === "exit" ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900, color: "#fff",
            margin: "20px 0 8px", letterSpacing: 6, textTransform: "uppercase",
          }}>
            3C ONYX
          </h1>
          <p style={{
            fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.5)",
            margin: "0 0 6px", fontStyle: "italic",
          }}>
            Xtraordinary for the ordinary.
          </p>
          <p style={{
            fontSize: 9, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(201,162,39,0.4)", margin: 0,
          }}>
            Powered by CUXTOMCANDYCLUB
          </p>
        </div>
      </div>

      <div style={{
        position: "absolute",
        width: 2, height: phase === "logo" ? "0%" : "100%",
        background: "linear-gradient(180deg, transparent, #FF2D9A, #C9A85D, transparent)",
        left: "50%", top: 0,
        transition: "height 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: phase === "exit" ? 0 : 0.6,
        boxShadow: "0 0 20px rgba(255,45,154,0.3), 0 0 40px rgba(255,45,154,0.1)",
      }} />
      <div style={{
        position: "absolute", bottom: "25%", left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(255,45,154,0.06) 0%, transparent 60%)",
        opacity: phase === "text" || phase === "exit" ? 1 : 0,
        transition: "opacity 1s ease",
      }} />
    </div>
  );
}

type ServiceCategory = "buy" | "sell" | "service" | "customize" | "insurance" | "emergency" | "parts";

const SERVICE_CONFIG: Record<ServiceCategory, {
  icon: any; label: string; description: string; accent: string;
  department: string; intakeTitle: string;
  chips: string[];
  processingSteps: string[];
  resultMessage: string;
  confirmLabel: string;
  confirmSummary: string;
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
    confirmLabel: "Confirm — Find My Vehicle",
    confirmSummary: "ONYX will match you with the best options from our network and assign a specialist.",
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
    confirmLabel: "Confirm — Get My Offer",
    confirmSummary: "ONYX will pull market data and prepare your personalized valuation instantly.",
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
    confirmLabel: "Confirm — Handle My Service",
    confirmSummary: "ONYX will find the best specialist, schedule everything, and coordinate on your behalf.",
  },
  customize: {
    icon: Paintbrush, label: "Customize", description: "Wraps, wheels, leather & more",
    accent: "#A78BFA", department: "Parts", intakeTitle: "Vehicle Customization Request",
    chips: ["Full Wrap", "Wheels & Tires", "Leather Interior", "Side Steps", "Fleet Branding", "Window Tint"],
    processingSteps: [
      "Reviewing your customization request...",
      "Matching with specialist installers...",
      "Building your personalized quote...",
      "Your customization plan is ready...",
    ],
    resultMessage: "Your customization quote is being prepared. A specialist will walk you through every option.",
    confirmLabel: "Confirm — Build My Quote",
    confirmSummary: "ONYX will match you with certified installers and build a detailed customization quote.",
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
    confirmLabel: "Confirm — Get My Best Rate",
    confirmSummary: "ONYX will compare rates across multiple providers and secure your best pricing.",
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
    confirmLabel: "Dispatch Help Now",
    confirmSummary: "ONYX will locate and dispatch the nearest available assistance immediately.",
  },
  parts: {
    icon: Truck, label: "Parts & Accessories", description: "OEM, aftermarket & performance",
    accent: "#F59E0B", department: "Parts", intakeTitle: "Parts & Accessories Request",
    chips: ["OEM Parts", "Aftermarket", "Performance", "Wheels & Tires", "Interior", "Lighting"],
    processingSteps: [
      "Searching parts catalogs...",
      "Checking availability across suppliers...",
      "Comparing pricing and fitment...",
      "Preparing your options...",
    ],
    resultMessage: "We've located matching parts from our supplier network. Best pricing and fastest delivery options are ready.",
    confirmLabel: "Confirm — Find My Parts",
    confirmSummary: "ONYX will search our global supplier network for the best price, fitment, and fastest delivery.",
  },
};

type FlowPhase = "idle" | "chips" | "details" | "confirm" | "processing" | "result" | "error";

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
  const [resolutionMs, setResolutionMs] = useState(0);
  const [scanActive, setScanActive] = useState(false);
  const submitOk = useRef(false);
  const startTimeRef = useRef(0);
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

  const handleProceedToConfirm = () => {
    setPhase("confirm");
  };

  const handleConfirmAndSubmit = async () => {
    startTimeRef.current = Date.now();
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
        setResolutionMs(Date.now() - startTimeRef.current);
        submitOk.current = true;
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  };

  const handleScanDocument = () => {
    setScanActive(true);
    setTimeout(() => {
      setScanActive(false);
      setFreeText((prev) => prev ? prev + "\n[Document scan ready for upload]" : "[Document scan ready for upload]");
    }, 1500);
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

          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              onClick={handleScanDocument}
              disabled={scanActive}
              style={{
                flex: "0 0 auto", padding: "14px 18px", borderRadius: 14,
                background: scanActive ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${scanActive ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: scanActive ? "#C9A227" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {scanActive ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {scanActive ? "Scanning..." : "Scan VIN / License / Insurance"}
            </button>
          </div>

          <button
            onClick={category === "emergency" ? handleConfirmAndSubmit : handleProceedToConfirm}
            style={{
              width: "100%", padding: "18px", borderRadius: 16,
              background: `linear-gradient(135deg, ${config.accent}, ${config.accent}CC)`,
              border: "none", color: "#000", fontWeight: 800, fontSize: 16,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 24px ${config.accent}30`,
            }}
          >
            {category === "emergency" ? "Dispatch Help Now" : "Continue"} <ArrowRight size={18} />
          </button>

          <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
            Lightning doesn't wait. Neither do we. Join us.
          </p>
        </div>
      )}

      {phase === "confirm" && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{
            background: `linear-gradient(160deg, ${config.accent}08, ${config.accent}03)`,
            border: `1px solid ${config.accent}15`,
            borderRadius: 20, padding: "32px 24px",
            textAlign: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `${config.accent}12`,
              border: `1px solid ${config.accent}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Icon size={30} style={{ color: config.accent }} />
            </div>

            <p style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)",
              margin: "0 0 8px", letterSpacing: 2, textTransform: "uppercase",
            }}>
              Ready to go
            </p>

            {selectedChips.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16,
              }}>
                {selectedChips.map((chip) => (
                  <span key={chip} style={{
                    padding: "5px 12px", borderRadius: 8,
                    background: `${config.accent}10`,
                    border: `1px solid ${config.accent}20`,
                    color: config.accent, fontSize: 11, fontWeight: 600,
                  }}>
                    {chip}
                  </span>
                ))}
              </div>
            )}

            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              margin: "0 0 28px", maxWidth: 320, marginLeft: "auto", marginRight: "auto",
            }}>
              {config.confirmSummary}
            </p>

            <button
              onClick={handleConfirmAndSubmit}
              style={{
                width: "100%", padding: "22px", borderRadius: 18,
                background: `linear-gradient(135deg, ${config.accent}, ${config.accent}DD, ${config.accent})`,
                border: "none", color: "#000", fontWeight: 900, fontSize: 17,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: `0 8px 40px ${config.accent}40, 0 0 0 1px ${config.accent}60`,
                letterSpacing: 0.5,
                transition: "all 0.2s",
              }}
            >
              <Check size={20} strokeWidth={3} /> {config.confirmLabel}
            </button>

            <p style={{
              textAlign: "center", marginTop: 16, fontSize: 10,
              color: "rgba(255,255,255,0.2)", lineHeight: 1.5,
            }}>
              One tap. ONYX handles the rest.
            </p>
          </div>
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
              {category === "emergency" ? "Help is on the way" : "Done. Everything is handled."}
            </h3>
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6,
              margin: "0 0 20px", maxWidth: 320, marginLeft: "auto", marginRight: "auto",
            }}>
              {config.resultMessage}
            </p>

            {resolutionMs > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.15)",
                marginBottom: 16,
              }}>
                <Timer size={13} style={{ color: "#34D399" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#34D399" }}>
                  Handled in {resolutionMs < 1000 ? `${resolutionMs}ms` : `${(resolutionMs / 1000).toFixed(1)}s`}
                </span>
              </div>
            )}

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
            Xtraordinary for the ordinary.<br />Lightning doesn't wait. Neither do we. Join us.
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
      {focused && (
        <div style={{
          position: "absolute", inset: -8, borderRadius: 26, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, rgba(255,45,154,0.08) 0%, transparent 70%)",
          animation: "ambientPulse 3s ease-in-out infinite",
        }} />
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 6px 6px 20px",
        borderRadius: 18,
        background: focused
          ? "linear-gradient(135deg, rgba(255,45,154,0.06), rgba(201,168,93,0.04))"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${focused ? "rgba(255,45,154,0.3)" : "rgba(255,255,255,0.08)"}`,
        transition: "all 0.3s",
        boxShadow: focused
          ? "0 0 30px rgba(255,45,154,0.1), 0 0 60px rgba(201,168,93,0.05), inset 0 0 30px rgba(255,45,154,0.03)"
          : "0 2px 8px rgba(0,0,0,0.15)",
        position: "relative",
      }}>
        <Sparkles size={16} style={{
          color: focused ? "#FF2D9A" : "rgba(255,255,255,0.2)",
          flexShrink: 0, transition: "all 0.3s",
          filter: focused ? "drop-shadow(0 0 6px rgba(255,45,154,0.6))" : "none",
        }} />
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask 3C anything..."
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
            background: message.trim()
              ? "linear-gradient(135deg, #FF2D9A, #C9A85D)"
              : "rgba(255,255,255,0.04)",
            border: "none", cursor: message.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
            boxShadow: message.trim() ? "0 0 20px rgba(255,45,154,0.3)" : "none",
          }}
        >
          <Send size={18} style={{ color: message.trim() ? "#fff" : "rgba(255,255,255,0.12)" }} />
        </button>
      </div>
    </div>
  );
}

const JOIN_ROLES = [
  {
    id: "Member",
    icon: Shield,
    label: "Join as Member",
    description: "Access the full automotive ecosystem — buy, sell, trade, insure, and earn",
    accent: "#C9A227",
    perks: ["Bird-Dog referral commissions", "AI-powered vehicle matching", "Full concierge service"],
  },
  {
    id: "Runner",
    icon: Truck,
    label: "Become a Runner",
    description: "Transport and deliver vehicles — earn per trip with flexible scheduling",
    accent: "#34D399",
    perks: ["Earn per delivery", "Flexible schedule", "Tier-based pay increases"],
  },
  {
    id: "Dealer",
    icon: Building2,
    label: "Dealer Partner",
    description: "List inventory, access wholesale, and tap into our buyer network",
    accent: "#A78BFA",
    perks: ["DealerFlow OS access", "Wholesale network", "AI lead routing"],
  },
  {
    id: "Specialist",
    icon: Wrench,
    label: "Certified Specialist",
    description: "Inspections, service, and repair — get matched with jobs near you",
    accent: "#60A5FA",
    perks: ["Job matching", "Inspection assignments", "Professional dashboard"],
  },
];

function JoinPlatformSection() {
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingLeft: 4 }}>
        <UserPlus size={14} style={{ color: "#C9A227" }} />
        <p style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.12em", margin: 0, textTransform: "uppercase",
        }}>
          Join the Platform
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {JOIN_ROLES.map((role) => {
          const Icon = role.icon;
          const isPressed = pressed === role.id;

          return (
            <a
              key={role.id}
              href={`/register?role=${role.id}`}
              onMouseDown={() => setPressed(role.id)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              style={{
                width: "100%",
                padding: "18px 18px",
                borderRadius: 16,
                background: isPressed ? `${role.accent}0A` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isPressed ? `${role.accent}30` : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: 14,
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${role.accent}0D`,
                border: `1px solid ${role.accent}1A`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} style={{ color: role.accent }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 2px", lineHeight: 1.2 }}>{role.label}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{role.description}</p>
              </div>
              <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
            </a>
          );
        })}
      </div>

      <p style={{
        textAlign: "center", marginTop: 12, fontSize: 11,
        color: "rgba(255,255,255,0.2)",
      }}>
        Already a member?{" "}
        <a href="/login" style={{ color: "#C9A227", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
      </p>
    </div>
  );
}

function ServiceCard({ icon: Icon, label, description, accent, onClick }: {
  icon: any; label: string; description: string; accent: string; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      style={{
        width: "100%",
        padding: "18px 20px 18px 24px",
        borderRadius: 16,
        background: pressed
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(255,45,154,0.04) 50%, ${accent}08 100%)`
          : hovered
            ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,45,154,0.03) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid ${pressed ? `${accent}50` : hovered ? "rgba(255,45,154,0.25)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        display: "flex", alignItems: "center", gap: 16,
        textAlign: "left",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: pressed
          ? `inset 0 0 30px ${accent}10, 0 2px 8px rgba(0,0,0,0.4)`
          : hovered
            ? `0 4px 24px rgba(0,0,0,0.3), 0 0 30px ${accent}12, 0 0 60px rgba(255,45,154,0.06)`
            : "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{
        position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3,
        borderRadius: "0 3px 3px 0",
        background: hovered
          ? `linear-gradient(180deg, ${accent}, #FF2D9A, ${accent})`
          : `linear-gradient(180deg, ${accent}60, ${accent}30)`,
        boxShadow: hovered ? `0 0 12px ${accent}80, 0 0 24px rgba(255,45,154,0.3)` : `0 0 8px ${accent}40`,
        transition: "all 0.3s",
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 40%, rgba(255,45,154,0.02) 100%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}20, ${accent}0A)`,
        border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: hovered ? `0 0 20px ${accent}25, 0 0 40px ${accent}10` : `0 0 12px ${accent}10`,
        transition: "all 0.3s",
        position: "relative", zIndex: 1,
      }}>
        <Icon size={22} style={{ color: accent, filter: hovered ? `drop-shadow(0 0 6px ${accent})` : "none", transition: "filter 0.3s" }} />
      </div>
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.2, letterSpacing: 0.3 }}>{label}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      <ChevronRight size={16} style={{
        color: hovered ? "#FF2D9A" : "rgba(255,255,255,0.15)",
        flexShrink: 0, transition: "all 0.25s",
        transform: hovered ? "translateX(3px)" : "none",
        filter: hovered ? "drop-shadow(0 0 4px rgba(255,45,154,0.5))" : "none",
        position: "relative", zIndex: 1,
      }} />
    </button>
  );
}

function ActiveFlowCard({ deal }: { deal: any }) {
  const pct = getDealProgress(deal.status);
  const label = DEAL_STATUS_LABELS[deal.status] || "We're handling this for you";
  const stepIndex = Math.floor((pct / 100) * DEAL_STEPS.length);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(201,168,93,0.06), rgba(201,168,93,0.02))",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "0.5px solid rgba(201,168,93,0.18)",
      borderRadius: 20, padding: "24px 24px 20px",
      position: "relative", overflow: "hidden",
      boxShadow: "inset 0 0 30px rgba(201,168,93,0.03), 0 4px 24px rgba(0,0,0,0.2)",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        background: "linear-gradient(135deg, rgba(201,168,93,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(201,168,93,0.18), rgba(201,168,93,0.06))",
          border: "0.5px solid rgba(201,168,93,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(201,168,93,0.1)",
        }}>
          <Car size={22} style={{ color: "#C9A85D" }} />
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
  const [phase, setPhase] = useState<"input" | "processing" | "result" | "error">("input");
  const [result, setResult] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const PROCESSING_STEPS = [
    "Parsing your request...",
    "Classifying intent...",
    "Routing to Agent Mesh...",
    "Creating deal structure...",
    "Generating proof hash...",
  ];

  useEffect(() => {
    if (open) {
      setMessage(initialMessage || "");
      setSending(false);
      setPhase("input");
      setResult(null);
      setProcessingStep(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, initialMessage]);

  useEffect(() => {
    if (phase !== "processing") return;
    if (processingStep < PROCESSING_STEPS.length - 1) {
      const t = setTimeout(() => setProcessingStep((s) => s + 1), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, processingStep]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setPhase("processing");
    setProcessingStep(0);

    try {
      const dealRes = await fetch(`${BASE}/api/text-to-deal/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (dealRes.ok) {
        const dealData = await dealRes.json();

        let routingData = null;
        try {
          const routeRes = await fetch(`${BASE}/api/ask-onyx/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: message.trim() }),
          });
          if (routeRes.ok) routingData = await routeRes.json();
        } catch {}

        setResult({ deal: dealData, routing: routingData });
        setPhase("result");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
    setSending(false);
  };

  if (!open) return null;

  const INTENT_COLORS: Record<string, string> = {
    buy: "#34D399", sell: "#60A5FA", service: "#F59E0B",
    refer: "#A78BFA", assist: "#EC4899",
  };

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
        maxHeight: "85vh", overflowY: "auto",
        animation: "slideUp 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <OnyxLogo size={36} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Ask ONYX</p>
              <p style={{ fontSize: 11, color: "rgba(201,162,39,0.5)", margin: 0, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Text-to-Deal Engine</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
            <X size={18} />
          </button>
        </div>

        {phase === "processing" && (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Loader2 size={36} style={{ color: "#C9A227", marginBottom: 20, animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 16 }}>
              {PROCESSING_STEPS[processingStep]}
            </p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {PROCESSING_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i <= processingStep ? "#C9A227" : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>
              "{message}"
            </p>
          </div>
        )}

        {phase === "result" && result?.deal && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{
              background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
              borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center",
            }}>
              <CheckCircle2 size={36} style={{ color: "#34D399", marginBottom: 12 }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Deal Created</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {result.deal.deal?.dealId}
              </p>
            </div>

            {result.deal.entities && (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: 16, marginBottom: 12,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,162,39,0.5)", margin: "0 0 10px", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  Extracted Entities
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.deal.entities.vehicleMake && (
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
                      <p style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", margin: 0, fontWeight: 600 }}>VEHICLE</p>
                      <p style={{ fontSize: 14, color: "#fff", margin: "2px 0 0", fontWeight: 700 }}>
                        {result.deal.entities.vehicleYear ? `${result.deal.entities.vehicleYear} ` : ""}
                        {result.deal.entities.vehicleMake} {result.deal.entities.vehicleModel || ""}
                      </p>
                    </div>
                  )}
                  {(result.deal.entities.budget || result.deal.entities.maxBudget) && (
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <p style={{ fontSize: 10, color: "rgba(52,211,153,0.6)", margin: 0, fontWeight: 600 }}>BUDGET</p>
                      <p style={{ fontSize: 14, color: "#fff", margin: "2px 0 0", fontWeight: 700 }}>
                        ${Number(result.deal.entities.budget || result.deal.entities.maxBudget).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {result.deal.entities.customerName && result.deal.entities.customerName !== "Unknown" && (
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.15)" }}>
                      <p style={{ fontSize: 10, color: "rgba(201,162,39,0.6)", margin: 0, fontWeight: 600 }}>CUSTOMER</p>
                      <p style={{ fontSize: 14, color: "#fff", margin: "2px 0 0", fontWeight: 700 }}>
                        {result.deal.entities.customerName}
                      </p>
                    </div>
                  )}
                  {result.deal.entities.location && (
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.15)" }}>
                      <p style={{ fontSize: 10, color: "rgba(244,114,182,0.6)", margin: 0, fontWeight: 600 }}>LOCATION</p>
                      <p style={{ fontSize: 14, color: "#fff", margin: "2px 0 0", fontWeight: 700 }}>
                        {result.deal.entities.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(result.deal.deal?.intent || result.deal.deal?.type) && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                padding: "10px 14px", borderRadius: 10,
                background: `${INTENT_COLORS[result.deal.deal.intent || result.deal.deal.type] || "#C9A227"}10`,
                border: `1px solid ${INTENT_COLORS[result.deal.deal.intent || result.deal.deal.type] || "#C9A227"}25`,
              }}>
                <Zap size={14} style={{ color: INTENT_COLORS[result.deal.deal.intent || result.deal.deal.type] || "#C9A227" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: INTENT_COLORS[result.deal.deal.intent || result.deal.deal.type] || "#C9A227", textTransform: "uppercase", letterSpacing: 1 }}>
                  {result.deal.deal.intent || result.deal.deal.type} Intent Detected
                </span>
                {result.routing?.classification && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                    → {result.routing.classification.agent}
                  </span>
                )}
              </div>
            )}

            {result.deal.deal?.participants && result.deal.deal.participants.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: 16, marginBottom: 12,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,162,39,0.5)", margin: "0 0 10px", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  Participants & Splits
                </p>
                {result.deal.deal.participants.map((p: any, i: number) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0", borderBottom: i < result.deal.deal.participants.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{p.role}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#C9A227" }}>{p.splitPct ?? p.share}%</span>
                  </div>
                ))}
              </div>
            )}

            {result.deal.deal?.proofHash && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.1)",
                marginBottom: 16,
              }}>
                <Shield size={14} style={{ color: "rgba(201,162,39,0.5)" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  {result.deal.deal.proofHash.substring(0, 32)}...
                </span>
              </div>
            )}

            <button onClick={onClose} style={{
              width: "100%", padding: "16px", borderRadius: 14,
              background: "linear-gradient(135deg, #D4AF37, #C9A227)",
              border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>
              Done
            </button>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <X size={48} style={{ color: "#EF4444", marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Something went wrong</p>
            <button onClick={() => setPhase("input")} style={{
              padding: "14px 40px", borderRadius: 12,
              background: "linear-gradient(135deg, #D4AF37, #C9A227)",
              border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>
              Try Again
            </button>
          </div>
        )}

        {phase === "input" && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {[
                "Need a Jeep Cherokee under 25k",
                "Client wants BMW X5 in Miami",
                "Schedule oil change for my F-150",
                "I need roadside assistance now",
              ].map((q) => (
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
                placeholder="What do you need?"
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
                {sending ? <Loader2 size={20} style={{ color: "#000", animation: "spin 1s linear infinite" }} /> : <Send size={20} style={{ color: message.trim() ? "#000" : "rgba(255,255,255,0.15)" }} />}
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.12)", marginTop: 14, letterSpacing: 0.5 }}>
              Powered by ONYX Text-to-Deal Engine — NLP entity extraction, 7-Agent Mesh routing, instant proof hashing
            </p>
          </>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function VehicleVerifyPanel() {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleVerify = async () => {
    const cleaned = vin.trim().toUpperCase();
    if (cleaned.length < 11) { setError("VIN must be at least 11 characters"); return; }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${BASE}/api/vehicles/verify/${cleaned}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const e = await res.json().catch(() => null);
        setError(e?.error || "Verification failed");
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    "Unverified": { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
    "Basic": { color: "#60A5FA", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.15)" },
    "Verified": { color: "#34D399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.15)" },
    "ONYX Certified": { color: "#C9A227", bg: "rgba(201,162,39,0.06)", border: "rgba(201,162,39,0.15)" },
    "ONYX Sovereign": { color: "#D4AF37", bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.25)" },
  };

  const TIMELINE_ICONS: Record<string, any> = {
    vin_decoded: ScanLine, blockchain_anchored: Shield, warranty_verified: CheckCircle2,
    deal_recorded: DollarSign,
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderRadius: expanded ? "14px 14px 0 0" : 14,
          background: "rgba(201,162,39,0.03)",
          border: "1px solid rgba(201,162,39,0.08)",
          borderBottom: expanded ? "none" : "1px solid rgba(201,162,39,0.08)",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={16} style={{ color: "#C9A227" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Verify Any Vehicle</span>
        </div>
        <ChevronRight
          size={16}
          style={{
            color: "rgba(255,255,255,0.2)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {expanded && (
        <div style={{
          padding: "16px",
          background: "rgba(255,255,255,0.01)",
          border: "1px solid rgba(201,162,39,0.08)",
          borderTop: "none",
          borderRadius: "0 0 14px 14px",
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)"
              maxLength={17}
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 13, outline: "none",
                fontFamily: "monospace", letterSpacing: 1,
              }}
            />
            <button
              onClick={handleVerify}
              disabled={loading || vin.trim().length < 11}
              style={{
                padding: "12px 18px", borderRadius: 10, flexShrink: 0,
                background: vin.trim().length >= 11 ? "linear-gradient(135deg, #D4AF37, #C9A227)" : "rgba(255,255,255,0.04)",
                border: "none", color: vin.trim().length >= 11 ? "#000" : "rgba(255,255,255,0.2)",
                fontWeight: 700, fontSize: 12, cursor: vin.trim().length >= 11 ? "pointer" : "default",
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Verify"}
            </button>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 12px" }}>{error}</p>
          )}

          {data && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px",
                background: LEVEL_CONFIG[data.trustLevel]?.bg || "rgba(255,255,255,0.03)",
                border: `1px solid ${LEVEL_CONFIG[data.trustLevel]?.border || "rgba(255,255,255,0.08)"}`,
                borderRadius: 12, marginBottom: 12,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${LEVEL_CONFIG[data.trustLevel]?.color || "#C9A227"}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Shield size={22} style={{ color: LEVEL_CONFIG[data.trustLevel]?.color || "#C9A227" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 800, margin: "0 0 2px",
                    color: LEVEL_CONFIG[data.trustLevel]?.color || "#fff",
                  }}>
                    {data.trustLevel}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    Trust Score: {data.trustScore}/100
                  </p>
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 900,
                  color: LEVEL_CONFIG[data.trustLevel]?.color || "#C9A227",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>
                  {data.trustScore}
                </div>
              </div>

              {data.vehicle && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
                    {data.vehicle.year ? `${data.vehicle.year} ` : ""}{data.vehicle.make} {data.vehicle.model}
                    {data.vehicle.trim ? ` ${data.vehicle.trim}` : ""}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {data.vehicle.color && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{data.vehicle.color}</span>
                    )}
                    {data.vehicle.driveType && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{data.vehicle.driveType}</span>
                    )}
                    {data.vehicle.fuelType && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{data.vehicle.fuelType}</span>
                    )}
                    {data.vehicle.mileage && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{Number(data.vehicle.mileage).toLocaleString()} mi</span>
                    )}
                  </div>
                </div>
              )}

              {data.trustBreakdown && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,162,39,0.5)", margin: "0 0 10px", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Trust Breakdown
                  </p>
                  {Object.entries(data.trustBreakdown).map(([key, val]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min(100, ((val as number) / 30) * 100)}%`,
                            height: "100%", borderRadius: 2,
                            background: (val as number) > 0 ? "#C9A227" : "transparent",
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: (val as number) > 0 ? "#C9A227" : "rgba(255,255,255,0.15)", minWidth: 20, textAlign: "right" }}>
                          {val as number}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.blockchain && (
                <div style={{
                  display: "flex", gap: 8, marginBottom: 12,
                }}>
                  <div style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)",
                  }}>
                    <p style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", margin: "0 0 2px", fontWeight: 600 }}>CHAIN RECORDS</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#60A5FA", margin: 0 }}>{data.blockchain.totalRecords}</p>
                  </div>
                  <div style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: data.blockchain.chainIntegrity ? "rgba(52,211,153,0.04)" : "rgba(239,68,68,0.04)",
                    border: `1px solid ${data.blockchain.chainIntegrity ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)"}`,
                  }}>
                    <p style={{ fontSize: 10, color: data.blockchain.chainIntegrity ? "rgba(52,211,153,0.6)" : "rgba(239,68,68,0.6)", margin: "0 0 2px", fontWeight: 600 }}>INTEGRITY</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: data.blockchain.chainIntegrity ? "#34D399" : "#EF4444", margin: 0 }}>
                      {data.blockchain.chainIntegrity ? "Valid" : "Broken"}
                    </p>
                  </div>
                  <div style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.1)",
                  }}>
                    <p style={{ fontSize: 10, color: "rgba(201,162,39,0.6)", margin: "0 0 2px", fontWeight: 600 }}>DEALS</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#C9A227", margin: 0 }}>{data.dealHistory?.totalDeals ?? 0}</p>
                  </div>
                </div>
              )}

              {data.timeline && data.timeline.length > 0 && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(201,162,39,0.5)", margin: "0 0 12px", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Verification Timeline
                  </p>
                  {data.timeline.map((evt: any, i: number) => {
                    const Icon = TIMELINE_ICONS[evt.type] || Clock;
                    return (
                      <div key={i} style={{
                        display: "flex", gap: 10, marginBottom: i < data.timeline.length - 1 ? 12 : 0,
                        position: "relative",
                      }}>
                        {i < data.timeline.length - 1 && (
                          <div style={{
                            position: "absolute", left: 11, top: 24, bottom: -6,
                            width: 1, background: "rgba(201,162,39,0.1)",
                          }} />
                        )}
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: "rgba(201,162,39,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Icon size={12} style={{ color: "#C9A227" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 2px" }}>
                            {evt.label}
                          </p>
                          {evt.detail && (
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>{evt.detail}</p>
                          )}
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", margin: 0 }}>
                            {new Date(evt.timestamp).toLocaleDateString()} · {evt.actor}
                          </p>
                        </div>
                        {evt.proofHash && (
                          <span style={{
                            fontSize: 9, fontFamily: "monospace",
                            color: "rgba(201,162,39,0.3)",
                            alignSelf: "flex-start", marginTop: 2,
                          }}>
                            {evt.proofHash.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {data.verificationHash && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 8,
                  background: "rgba(201,162,39,0.03)",
                  border: "1px solid rgba(201,162,39,0.06)",
                }}>
                  <Shield size={10} style={{ color: "rgba(201,162,39,0.4)" }} />
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>
                    Proof: {data.verificationHash.substring(0, 24)}...
                  </span>
                </div>
              )}
            </div>
          )}

          {!data && !error && !loading && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0, textAlign: "center" }}>
              Enter any VIN to check its ONYX verification status, trust score, and proof chain
            </p>
          )}
        </div>
      )}
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
            title: `${d.referrerName || "A friend"} sent you ONYX`,
            text: d.shareText || "This handles everything automotive.",
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
            title: `${d.referrerName || "A friend"} sent you ONYX`,
            text: d.shareText || "This handles everything automotive.",
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
            title: `${d.referrerName || "A friend"} sent you ONYX`,
            text: d.shareText || "This handles everything automotive.",
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

function CompletionSharePrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed) return null;

  const handleSend = async () => {
    setSharing(true);
    try {
      const res = await authFetch(`${BASE}/api/referrals/generate-link`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (navigator.share) {
          await navigator.share({
            title: `${d.referrerName || "A friend"} sent you ONYX`,
            text: d.shareText || "This handles everything automotive.",
            url: d.referralLink,
          });
        } else if (d.referralLink) {
          navigator.clipboard.writeText(d.referralLink).catch(() => {});
        }
      }
    } catch {}
    setSharing(false);
    setDismissed(true);
  };

  return (
    <div style={{
      marginBottom: 20,
      background: "linear-gradient(160deg, rgba(52,211,153,0.06), rgba(0,0,0,0))",
      border: "1px solid rgba(52,211,153,0.12)",
      borderRadius: 20, padding: "32px 24px", textAlign: "center",
      animation: "fadeIn 0.8s ease",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: "rgba(52,211,153,0.1)",
        border: "1px solid rgba(52,211,153,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <CheckCircle2 size={28} style={{ color: "#34D399" }} />
      </div>
      <h3 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 8px",
      }}>
        Done. Everything is handled.
      </h3>
      <p style={{
        fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 24px",
        lineHeight: 1.6,
      }}>
        Want me to send this to someone who needs help?
      </p>
      <button
        onClick={handleSend}
        disabled={sharing}
        style={{
          width: "100%", padding: "18px", borderRadius: 16,
          background: "linear-gradient(135deg, #34D399, #10B981)",
          border: "none", color: "#000", fontWeight: 800, fontSize: 15,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 24px rgba(52,211,153,0.25)",
          opacity: sharing ? 0.7 : 1,
        }}
      >
        {sharing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Send via ONYX
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          marginTop: 12, background: "transparent", border: "none",
          color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Not now
      </button>
    </div>
  );
}

export default function Home() {
  const { token } = useAuth();
  const params = useParams<{ refCode?: string }>();
  const [showSplash, setShowSplash] = useState(false);
  const [showAskOnyx, setShowAskOnyx] = useState(false);
  const [askOnyxMessage, setAskOnyxMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
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
    if (params.refCode) {
      sessionStorage.setItem("onyx_ref", params.refCode);
      const sig = new URLSearchParams(window.location.search).get("s") || "";
      fetch(`${BASE}/api/referrals/resolve/${params.refCode}${sig ? `?s=${sig}` : ""}`)
        .then((r) => r.json())
        .then((d) => { if (d.valid) setReferrerName(d.referrerFirstName); })
        .catch(() => {});
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      sessionStorage.setItem("onyx_ref", ref);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [params.refCode]);

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
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
          width: "160%", height: "60%",
          background: "radial-gradient(ellipse at center, rgba(201,168,93,0.09) 0%, rgba(201,168,93,0.03) 35%, transparent 65%)",
          animation: "ambientPulse 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-15%", right: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(255,45,154,0.06) 0%, rgba(255,45,154,0.02) 40%, transparent 70%)",
          animation: "ambientDrift 10s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "-15%",
          width: 450, height: 450,
          background: "radial-gradient(circle, rgba(255,45,154,0.04) 0%, transparent 60%)",
          animation: "ambientDrift 14s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 300,
          background: "radial-gradient(ellipse at center, rgba(201,168,93,0.05) 0%, transparent 70%)",
          animation: "ambientPulse 12s ease-in-out infinite reverse",
        }} />
        {[...Array(16)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${8 + (i * 6.2) % 85}%`,
            top: `${5 + (i * 11.3) % 90}%`,
            width: i % 3 === 0 ? 2.5 : 1.5,
            height: i % 3 === 0 ? 2.5 : 1.5,
            borderRadius: "50%",
            background: i % 3 === 0 ? "rgba(255,45,154,0.35)" : i % 2 === 0 ? "rgba(201,168,93,0.3)" : "rgba(255,255,255,0.15)",
            animation: `particleFloat ${5 + (i % 4) * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            boxShadow: i % 3 === 0 ? "0 0 6px rgba(255,45,154,0.4)" : "none",
          }} />
        ))}
      </div>

      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <div style={{
        width: "100%", maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px",
        flex: 1,
        display: "flex", flexDirection: "column",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ padding: "36px 0 0", textAlign: "center", marginBottom: 6 }}>
          <div style={{
            display: "flex", justifyContent: "center", marginBottom: 16,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: -20,
              background: "radial-gradient(circle, rgba(255,45,154,0.06) 0%, rgba(201,168,93,0.06) 40%, transparent 60%)",
              animation: "logoPulse 4s ease-in-out infinite",
              pointerEvents: "none",
            }} />
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
          borderTop: "1px solid transparent",
          borderImage: "linear-gradient(90deg, transparent, rgba(255,45,154,0.2), rgba(201,168,93,0.15), rgba(255,45,154,0.2), transparent) 1",
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
          ) : referrerName ? (
            <>
              <p style={{
                fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,0.5)",
                margin: "0 0 6px", lineHeight: 1.5,
              }}>
                Welcome. <span style={{ color: "#34D399", fontWeight: 600 }}>{referrerName}</span> said you might need a hand with your car.
              </p>
              <p style={{
                fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.8)",
                margin: "8px 0 0",
              }}>
                What's going on?
              </p>
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
            <NerveCenter />

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

            {!token && <JoinPlatformSection />}

            <NeuralInput onSubmit={handleNeuralSubmit} />

            <VehicleVerifyPanel />

            {activeDeal && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Active Deal</p>
                <ActiveFlowCard deal={activeDeal} />
              </div>
            )}

            {token && <ImpactDashboard />}
            {token && <NetworkFeed />}

            {token && myDeals?.recentDeals?.some((d: any) => d.status === "Delivered" || d.status === "Funded") && (
              <CompletionSharePrompt />
            )}

            {token && <ViralLoopPrompt />}

            {!token && (
              <div style={{
                marginBottom: 20, padding: "16px", textAlign: "center",
                background: "rgba(201,162,39,0.03)", borderRadius: 14,
                border: "1px solid rgba(201,162,39,0.06)",
              }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
                  Xtraordinary for the ordinary. Lightning doesn't wait. Neither do we. Join us.
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
            background: "linear-gradient(135deg, #FF2D9A, #C9A85D)",
            border: "2px solid rgba(255,45,154,0.4)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(255,45,154,0.35), 0 0 60px rgba(255,45,154,0.15), 0 0 100px rgba(201,168,93,0.08)",
            zIndex: 1000,
            transition: "transform 0.15s",
            animation: "fabGlow 3s ease-in-out infinite",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageCircle size={24} style={{ color: "#fff" }} />
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
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
        }
        @keyframes ambientDrift {
          0%, 100% { transform: translate(0, 0); opacity: 0.5; }
          33% { transform: translate(30px, -20px); opacity: 0.8; }
          66% { transform: translate(-20px, 15px); opacity: 0.6; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.7; }
        }
        @keyframes logoPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes fabGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(255,45,154,0.35), 0 0 60px rgba(255,45,154,0.15), 0 0 100px rgba(201,168,93,0.08); }
          50% { box-shadow: 0 8px 40px rgba(255,45,154,0.5), 0 0 80px rgba(255,45,154,0.25), 0 0 120px rgba(201,168,93,0.12); }
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
