import { Lock, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const EFFECTIVE = "March 24, 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.9 }}>{children}</div>
  </div>
);

export default function PrivacyPage() {
  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader
        title="PRIVACY POLICY"
        badge={<span style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em" }}>LEGAL</span>}
        icon={Lock}
        accent="#60A5FA"
      />

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 40 }}>
        Effective: {EFFECTIVE} &nbsp;|&nbsp; 3C Onyx, Inc. &nbsp;|&nbsp;
        <a href="/legal/terms" style={{ color: "#C9A227", textDecoration: "none" }}>Terms of Service →</a>
      </p>

      <Section title="1. Introduction">
        <p>3C Onyx, Inc. ("3C Onyx," "we," "our," "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Platform, including web and mobile applications and related services.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong style={{ color: "#fff" }}>Account Information:</strong> Name, email address, phone number, role, and password (stored as a hashed value — we never store your plaintext password).</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Identity Verification:</strong> Government-issued ID, selfie images, and background check data processed by our partner Checkr, Inc. This data is retained only as long as required by law or active account status.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Vehicle Data:</strong> VIN numbers, vehicle photos (including 3C Spin Studio™ 360° captures), odometer readings, inspection reports, service history, and location data for transport tasks.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Financial Data:</strong> Payment information is processed directly by Stripe, Inc. We do not store raw card numbers. Transaction records (amount, type, status) are stored in our system for accounting and fraud prevention.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Usage Data:</strong> IP address, device type, browser, OS, pages visited, features used, and interaction timestamps — collected via server logs and analytics.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>AI Interaction Data:</strong> Conversations with the ONYX AI Concierge are logged to improve model quality. No conversations are sold to third parties.</p>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use personal information to: (a) create and manage your account; (b) process transactions and prevent fraud; (c) match Runners with vehicle owners; (d) provide AI-powered valuations and inspection services; (e) maintain blockchain chain-of-custody records; (f) send service notifications and platform updates; (g) comply with legal obligations; (h) improve the Platform through aggregate analytics.</p>
      </Section>

      <Section title="4. Information Sharing">
        <p><strong style={{ color: "#fff" }}>Service Providers:</strong> We share data with Stripe (payments), Checkr (background checks), MarketCheck (vehicle data), Google (AI services), HyperTrack (logistics), and other vendors under strict data processing agreements.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Marketplace Counterparties:</strong> When you complete a transaction, limited information (name, contact for delivery coordination) is shared with the other party as needed to complete the deal.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Legal Requirements:</strong> We may disclose information if required by law, court order, or government authority, or when necessary to protect the rights and safety of our users.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>We do not sell your personal data to advertisers or data brokers.</strong></p>
      </Section>

      <Section title="5. Data Retention">
        <p>Account data is retained for the duration of your account plus 7 years for financial records (as required by tax law). Background check data is retained for 5 years post-check or until account deletion, whichever is sooner. AI conversation logs are retained for 90 days then anonymized. Blockchain records are permanent by design and cannot be deleted.</p>
      </Section>

      <Section title="6. Security">
        <p>We implement industry-standard security measures including: AES-256 encryption at rest; TLS 1.3 in transit; bcrypt password hashing (cost factor 12); JWT-based authentication with 7-day expiry; rate limiting and anomaly detection; SOC 2-aligned access controls. No method of transmission over the Internet is 100% secure. We notify affected users within 72 hours of a confirmed data breach.</p>
      </Section>

      <Section title="7. Your Rights">
        <p>Depending on your jurisdiction, you may have the right to: access your personal data; correct inaccurate data; request deletion ("right to be forgotten"); port your data to another service; opt out of marketing communications; object to automated decision-making. To exercise any of these rights, email <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a>. We respond within 30 days.</p>
      </Section>

      <Section title="8. California Residents (CCPA/CPRA)">
        <p>California residents have the right to know what personal information is collected, request deletion, and opt out of sale. As noted above, we do not sell personal data. To submit a verifiable consumer request, contact <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a> or call 1-800-3C-ONYX (if available).</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>The Platform is not directed at individuals under 18. We do not knowingly collect personal data from minors. If we discover we have collected data from a minor, we will delete it promptly.</p>
      </Section>

      <Section title="10. Cookies & Tracking">
        <p>We use essential cookies for authentication and session management. Analytics cookies (anonymized) help us understand Platform usage. You may disable non-essential cookies via your browser settings. We do not use third-party advertising cookies.</p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification at least 30 days before they take effect. Continued use after the effective date constitutes acceptance.</p>
      </Section>

      <Section title="12. Contact & Data Controller">
        <p>3C Onyx, Inc. is the data controller for all personal information processed under this Policy.<br />
          Email: <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a><br />
          Address: 2261 Market Street #4668, San Francisco, CA 94114, USA
        </p>
      </Section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>3C Onyx, Inc. — All rights reserved © 2026</span>
      </div>
    </div>
  );
}
