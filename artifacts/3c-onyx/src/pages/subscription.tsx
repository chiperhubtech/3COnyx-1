import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Zap, CheckCircle, Lock, Star, ArrowRight, CreditCard, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubStatus {
  active: boolean; bypass: boolean; plan: string | null;
  amount: number; currentPeriodEnd: string;
  stripeSubId: string | null; cancelAtPeriodEnd: boolean;
  features: string[];
}

const FEATURES = [
  { icon: "🔍", label: "ONYX Price Intelligence Engine", desc: "Live wholesale pricing across 50 states" },
  { icon: "🤖", label: "ONYX Neural Concierge — Unlimited", desc: "White-glove intelligence, always on" },
  { icon: "🛡️", label: "Guardian Predictive Layer (V2X)", desc: "90-day failure forecasting via OBD-II" },
  { icon: "💰", label: "Dynasty Wallet — Triple-Split", desc: "Automated 85/2.5/12.5 deal settlements" },
  { icon: "📦", label: "Dropship Coordinator", desc: "360° scans, AR previews, Runner dispatch" },
  { icon: "📡", label: "Live Delivery Tracking", desc: "ONYX Logistics Guardian for every vehicle" },
  { icon: "🏛️", label: "SOC2 Audit Vault", desc: "Immutable ledger, tamper-proof records" },
  { icon: "🔐", label: "NIST-MCP 2026 Security", desc: "AES-256 PII encryption, agent audit trail" },
  { icon: "📊", label: "Founder's Command Center", desc: "K-Factor, Hectocorn ticker, kill-switch" },
  { icon: "✍️", label: "QR Proof of Delivery", desc: "Cryptographic handshake on every transfer" },
  { icon: "🎯", label: "Referral Rewards — 20% Member Slice", desc: "Viral growth engine built in" },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = useQuery<SubStatus>({
    queryKey: ["sub-status"],
    queryFn: () => fetch("/api/subscription/status").then(r => r.json()),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        successUrl: `${window.location.origin}/`,
        cancelUrl: `${window.location.origin}/subscribe`,
      }),
    }).then(r => r.json()),
    onSuccess: (data: { url: string }) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => fetch("/api/subscription/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: `${window.location.origin}/subscribe` }),
    }).then(r => r.json()),
    onSuccess: (data: { url: string }) => {
      if (data.url) window.location.href = data.url;
    },
  });

  if (isLoading) {
    return (
      <div className="h-full page-bg flex items-center justify-center">
        <RefreshCw size={20} style={{ color: "#C9A227", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const isActive = status?.active ?? false;
  const periodEnd = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="h-full overflow-y-auto page-bg">
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <Star size={12} style={{ color: "#C9A227" }} />
            <span style={{ color: "#C9A227", fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>FOUNDING MEMBER ACCESS</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 42, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
            The Onyx Platform.<br />
            <span style={{ color: "#C9A227" }}>One Membership.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
            Gain full access to every feature — from AI-powered wholesale intelligence to real-time Guardian monitoring and Dynasty settlements.
          </p>
        </div>

        {/* Active status banner */}
        {isActive && (
          <div style={{
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 16, padding: "16px 24px", marginBottom: 32,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={20} style={{ color: "#10B981" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#10B981", fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
                {status?.plan ?? "3C Onyx — Active"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                {status?.bypass ? "Development access — all features unlocked" : `Renews ${periodEnd} · $${((status?.amount ?? 9900) / 100).toFixed(0)}/mo`}
              </p>
            </div>
            {!status?.bypass && (
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >
                Manage Billing
              </button>
            )}
          </div>
        )}

        {/* Pricing card */}
        {!isActive && (
          <div style={{
            background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(0,0,0,0) 100%)",
            border: "1px solid rgba(201,162,39,0.2)", borderRadius: 20, padding: 32, marginBottom: 32,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ color: "#C9A227", fontSize: 48, fontWeight: 900 }}>$99</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>/month</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Cancel anytime. No contracts.</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)", borderRadius: 8, padding: "4px 10px", marginBottom: 4 }}>
                  <span style={{ color: "#C9A227", fontSize: 9, fontWeight: 800 }}>FOUNDING RATE</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>Price locks at signup</p>
              </div>
            </div>

            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              style={{
                width: "100%", padding: "14px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, #C9A227, #A87E1A)",
                border: "none", color: "#000", fontSize: 13, fontWeight: 900,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: checkoutMutation.isPending ? 0.7 : 1,
              }}
            >
              {checkoutMutation.isPending ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CreditCard size={14} />}
              {checkoutMutation.isPending ? "Redirecting to Stripe…" : "Activate Founding Membership"}
              {!checkoutMutation.isPending && <ArrowRight size={14} />}
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
              <Lock size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Secured by Stripe · TLS 1.3 · AES-256</span>
            </div>
          </div>
        )}

        {/* Feature grid */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 16 }}>EVERYTHING INCLUDED</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "12px 14px",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <p style={{ color: isActive ? "#C9A227" : "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    {isActive && <CheckCircle size={10} style={{ color: "#10B981" }} />}
                    {f.label}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: Shield, label: "SOC2 Compliant" },
            { icon: Lock, label: "NIST-MCP 2026" },
            { icon: Zap, label: "99.99% Uptime SLA" },
            { icon: Star, label: "Founding Rate Locked" },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
              <b.icon size={12} style={{ color: "#C9A227" }} />
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
