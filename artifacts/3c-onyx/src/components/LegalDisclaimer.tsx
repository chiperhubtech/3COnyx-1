/**
 * LegalDisclaimer — Reusable compliance banner
 * Place on Marketplace, Insurance, Wallet, and any regulated feature page.
 */

import { AlertTriangle } from "lucide-react";

type DisclaimerType = "marketplace" | "insurance" | "wallet" | "ai" | "telematics";

interface LegalDisclaimerProps {
  type: DisclaimerType;
}

const CONTENT: Record<DisclaimerType, { title: string; body: string }> = {
  marketplace: {
    title: "Technology Marketplace — Not a Licensed Dealer",
    body: "3C ONYX is a technology platform connecting buyers and sellers. CUXTOMCANDYCLUB LLC is not a licensed automotive dealer, broker, or agent. All vehicle transactions are conducted directly between Members. You are responsible for complying with all applicable motor vehicle laws in your jurisdiction, including title transfer requirements.",
  },
  insurance: {
    title: "Not a Licensed Insurance Provider",
    body: "3C ONYX is not a licensed insurance agent, broker, insurer, or underwriter. Insurance-related content is provided for informational purposes only and does not constitute insurance advice or a solicitation for insurance. For actual coverage, work with a licensed insurance professional.",
  },
  wallet: {
    title: "Dynasty Wallet — Not a Bank Account",
    body: "The Dynasty Wallet is a platform accounting tool, not a bank account or deposit account. Balances are not FDIC-insured. CUXTOMCANDYCLUB LLC is not a licensed bank or money transmitter. All payment processing is handled by Stripe, Inc.",
  },
  ai: {
    title: "AI-Powered Feature",
    body: "This feature is powered by artificial intelligence. Results are probabilistic and for informational purposes only. ONYX will always require your confirmation before any action is taken. AI recommendations should not be the sole basis for major financial decisions.",
  },
  telematics: {
    title: "Location & Telematics Data Collection",
    body: "This feature collects your precise GPS location and vehicle data. By enabling it, you consent to this collection as described in our Privacy Policy. You may disable location access in your device settings at any time. Telematics data is retained for 90 days then anonymized.",
  },
};

export function LegalDisclaimer({ type }: LegalDisclaimerProps) {
  const { title, body } = CONTENT[type];

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(201,162,39,0.04)",
        border: "1px solid rgba(201,162,39,0.15)",
        marginBottom: 20,
      }}
    >
      <AlertTriangle
        size={15}
        style={{ color: "#C9A84C", flexShrink: 0, marginTop: 2 }}
      />
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>
          {title}
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>
          {body}{" "}
          <a href="/legal/terms" style={{ color: "#C9A227", textDecoration: "none" }}>
            Full Terms →
          </a>
        </p>
      </div>
    </div>
  );
}
