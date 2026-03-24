/**
 * 3C Onyx — Vehicle Purchase Checkout Modal
 * Stripe-powered escrow purchase flow.
 * Price breakdown → escrow explanation → confirm → success
 */
import { useState } from "react";
import {
  X, Shield, Lock, CheckCircle2, CreditCard, ArrowRight,
  Loader2, DollarSign, Zap, Truck, AlertCircle,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Vehicle {
  id: string;
  heading: string;
  price: number;
  year: number;
  make: string;
  model: string;
  vin: string;
  club_price?: number;
  savings_vs_retail?: number;
  platform_fee?: number;
}

interface CheckoutModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

type Step = "review" | "payment" | "confirming" | "success" | "error";

export function CheckoutModal({ vehicle, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>("review");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderRef, setOrderRef] = useState("");

  const price      = vehicle.club_price ?? vehicle.price;
  const platformFee = vehicle.platform_fee ?? Math.round(price * 0.015);
  const savings    = vehicle.savings_vs_retail ?? (vehicle.price - price);
  const escrowAmt  = price + platformFee;

  async function handleConfirm() {
    setStep("confirming");
    try {
      const token = localStorage.getItem("3c_auth_token");
      const res = await fetch(`${BASE}/api/checkout/vehicle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vehicleId:   vehicle.id,
          vin:         vehicle.vin,
          vehicleName: vehicle.heading,
          price,
          platformFee,
          totalAmount: escrowAmt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      setOrderRef(data.orderId ?? `3C-${Date.now().toString(36).toUpperCase()}`);
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, borderRadius: 22, background: "#08080e", border: "1px solid rgba(201,162,39,0.2)", overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #C9A227, #34D399)" }} />

        {/* Header */}
        <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} style={{ color: "#C9A227" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#C9A227", letterSpacing: "0.12em" }}>3C SECURE CHECKOUT</span>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
            <X size={16} />
          </button>
        </div>

        {/* ── STEP: Review ── */}
        {step === "review" && (
          <div style={{ padding: "22px 26px 24px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>YOU'RE PURCHASING</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.3 }}>{vehicle.heading}</p>

            {/* Price breakdown */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              {[
                { label: "Vehicle Price",        value: `$${price.toLocaleString()}`,       color: "#fff"     },
                { label: "Platform Fee (1.5%)",  value: `$${platformFee.toLocaleString()}`, color: "rgba(255,255,255,0.5)" },
                { label: "Escrow Total",         value: `$${escrowAmt.toLocaleString()}`,   color: "#C9A227", bold: true },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 500, color: row.color, fontFamily: "'Barlow Condensed', sans-serif" }}>{row.value}</span>
                </div>
              ))}
              {savings > 0 && (
                <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.15)", display: "flex", alignItems: "center", gap: 7 }}>
                  <DollarSign size={11} style={{ color: "#34D399" }} />
                  <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600 }}>You're saving ${savings.toLocaleString()} vs. retail</span>
                </div>
              )}
            </div>

            {/* Escrow explanation */}
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em", marginBottom: 8 }}>HOW ESCROW PROTECTS YOU</p>
              {["Funds held securely until vehicle delivered", "Released only on your signed QR confirmation", "Full refund if delivery fails or vehicle misrepresented"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                  <CheckCircle2 size={10} style={{ color: "#60A5FA", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setStep("payment")} style={{ flex: 2, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg,#C9A227,#8B6914)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                Continue to Payment <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Payment ── */}
        {step === "payment" && (
          <div style={{ padding: "22px 26px 24px" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Payment Method</p>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.18)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <CreditCard size={14} style={{ color: "#C9A227" }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A227" }}>Dynasty Wallet — Stripe Secured</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Card on file or add new payment method via Stripe</p>
              </div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>CARD NUMBER</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>•••• •••• •••• 4242</p>
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 20, textAlign: "center" }}>
              Production: Stripe Checkout will open. Sandbox environment active.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("review")} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Back</button>
              <button onClick={handleConfirm} style={{ flex: 2, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Lock size={13} />Confirm & Open Escrow
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Confirming ── */}
        {step === "confirming" && (
          <div style={{ padding: "48px 26px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(201,162,39,0.2)", borderTop: "2px solid #C9A227", animation: "slow-spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Opening Escrow</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Securing funds via Stripe. This takes a moment...</p>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === "success" && (
          <div style={{ padding: "36px 26px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <CheckCircle2 size={26} style={{ color: "#34D399" }} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Escrow Open</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.6 }}>
              Funds secured. A Runner has been dispatched. You'll receive QR delivery confirmation when your vehicle arrives.
            </p>
            <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 22 }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 3 }}>ORDER REFERENCE</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#C9A227", fontFamily: "monospace" }}>{orderRef}</p>
            </div>
            {[
              { icon: Truck,       text: "Runner dispatched — ETA 2-4 hours",            color: "#A78BFA" },
              { icon: Lock,        text: "Funds in escrow until delivery confirmed",      color: "#60A5FA" },
              { icon: Shield,      text: "Blockchain custody record initiated",           color: "#34D399" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Icon size={11} style={{ color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "left" }}>{text}</span>
              </div>
            ))}
            <button onClick={onClose} style={{ marginTop: 22, width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              Track My Delivery
            </button>
          </div>
        )}

        {/* ── STEP: Error ── */}
        {step === "error" && (
          <div style={{ padding: "36px 26px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <AlertCircle size={26} style={{ color: "#EF4444" }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Something went wrong</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 22 }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Close</button>
              <button onClick={() => setStep("review")} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
