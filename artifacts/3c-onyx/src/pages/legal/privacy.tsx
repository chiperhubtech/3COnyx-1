import { Lock, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const EFFECTIVE = "March 29, 2026";

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
        Effective: {EFFECTIVE} &nbsp;|&nbsp; CUXTOMCANDYCLUB LLC &nbsp;|&nbsp;
        <a href="/legal/terms" style={{ color: "#C9A227", textDecoration: "none" }}>Terms of Service →</a>
      </p>

      <S title="1. Who We Are">
        <p>CUXTOMCANDYCLUB LLC ("Company," "we," "our," "us"), operator of the 3C ONYX platform, is the data controller for all personal information processed under this Privacy Policy. We are headquartered in the State of Florida, USA. For all privacy inquiries: <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a>.</p>
      </S>

      <S title="2. Information We Collect">
        <p><strong style={{ color: "#fff" }}>Account Information:</strong> Name, email address, phone number, role, and hashed password. We never store your plaintext password.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Identity Verification (KYC):</strong> Government-issued ID, selfie images, and background check data processed by our partner Checkr, Inc. under their own privacy policy. Retained only as required by law or active account status.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Vehicle Data:</strong> VIN numbers, vehicle photos (including 3C Spin Studio™ captures), odometer readings, inspection reports, service history, and telematics data.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Financial Data:</strong> All payment card data is processed directly by Stripe, Inc. We do not store raw card numbers. We store transaction records (amount, type, status, timestamp) for accounting and fraud prevention.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Location & Telematics Data:</strong> Precise GPS coordinates, driving patterns, speed, acceleration, and vehicle sensor data collected through the Guardian and Runner Network features. This data is collected only when you enable these features and consent to location access in your device settings. See Section 6 for full details.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Communications Data:</strong> Messages sent through the Platform's WhatsApp hub, in-app messaging, and concierge system. Content may be stored for service delivery and safety purposes.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>AI Interaction Data:</strong> Queries and conversations with ONYX AI Concierge are logged to improve model quality. No conversations are sold to third parties.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Usage Data:</strong> IP address, device type, browser, OS, pages visited, features used, and interaction timestamps — collected via server logs and analytics.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Member Covenant Record:</strong> When you complete membership activation, your IP address, device fingerprint, user agent, and timestamp are recorded as part of your signed Member Covenant.</p>
      </S>

      <S title="3. How We Use Your Information">
        <p>(a) Create and manage your account and membership; (b) process transactions and prevent fraud; (c) match Runners with vehicle owners; (d) deliver AI-powered valuations, inspection, and concierge services; (e) maintain blockchain chain-of-custody records; (f) send essential service notifications (security alerts, transaction confirmations — cannot be opted out); (g) send marketing communications (only with your explicit consent, which you may revoke at any time); (h) comply with legal obligations including KYC/AML requirements; (i) improve the Platform through aggregate analytics; (j) enforce our Terms of Service and Member Covenant.</p>
      </S>

      <S title="4. Legal Basis for Processing (GDPR)">
        <p>For Members in the European Economic Area (EEA), UK, or other GDPR-covered jurisdictions, we process your personal data under the following legal bases:</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Contract Performance:</strong> Processing necessary to deliver the services you signed up for (account management, transactions, logistics).</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Legitimate Interests:</strong> Fraud prevention, security, platform improvement, and legal defense.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Consent:</strong> Marketing communications, telematics data collection, AI conversation logging. You may withdraw consent at any time without affecting the lawfulness of prior processing.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Legal Obligation:</strong> KYC/AML compliance, tax records, and responses to lawful government requests.</p>
      </S>

      <S title="5. Information Sharing">
        <p><strong style={{ color: "#fff" }}>Service Providers:</strong> Stripe (payments), Checkr (background checks), MarketCheck (vehicle data), Google (AI services), HyperTrack (logistics tracking), Twilio (SMS/WhatsApp), and other vendors under strict data processing agreements (DPAs). These vendors may only use your data to provide services to us.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Transaction Counterparties:</strong> When you complete a vehicle transaction, limited contact information is shared with the other party solely to complete the deal.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Legal Requirements:</strong> We may disclose information when required by law, valid court order, subpoena, or government authority, or to protect the rights and safety of our Members.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>Business Transfers:</strong> In the event of a merger, acquisition, or sale of substantially all assets, your data may be transferred to the acquiring entity, subject to the same privacy protections.</p>
        <p style={{ marginTop: 10 }}><strong style={{ color: "#fff" }}>We do not sell your personal data to advertisers, data brokers, or any third party for their own marketing purposes.</strong></p>
      </S>

      <S title="6. Telematics & GPS Data — Special Disclosure">
        <p>The Guardian V2X and Runner Network features collect sensitive telematics data including real-time GPS location, speed, acceleration, braking patterns, and vehicle sensor readings. This data is used exclusively to: (a) provide safety features (crash detection, SOS); (b) verify Runner task completion; (c) improve route optimization; (d) generate your Drive Score.</p>
        <p style={{ marginTop: 10 }}>You consent to this collection by enabling Guardian or accepting a Runner task. You may revoke consent at any time by disabling location permissions in your device settings or deactivating Guardian in your account settings. Revocation does not affect data already collected.</p>
        <p style={{ marginTop: 10 }}>Telematics data is retained for 90 days in identifiable form, then anonymized and aggregated for platform safety analytics. We do not share identifiable telematics data with insurers, employers, or government agencies except as required by law.</p>
      </S>

      <S title="7. Marketing Communications & TCPA">
        <p>We send two types of messages:</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Essential Service Messages:</strong> Security alerts, transaction confirmations, account notifications. These are sent to all Members and cannot be opted out of while your account is active.</p>
        <p style={{ marginTop: 8 }}><strong style={{ color: "#fff" }}>Marketing Messages:</strong> Promotions, new features, and offers. These are sent only to Members who have explicitly opted in during registration or account settings. You may opt out at any time by: (a) texting STOP to any SMS; (b) tapping "Unsubscribe" in any email; (c) updating Notification Preferences in your account. Opt-out is processed within 10 business days. Consent to marketing messages is never a condition of membership or purchase.</p>
      </S>

      <S title="8. Data Retention">
        <p>Account data: Duration of your account plus 7 years (tax law requirement). Background check data: 5 years post-check or account deletion, whichever is sooner. AI conversation logs: 90 days, then anonymized. Telematics data: 90 days identifiable, then anonymized. Blockchain records: Permanent by design — these cannot be deleted. Financial transaction records: 7 years minimum. Member Covenant records: Permanent.</p>
      </S>

      <S title="9. Security">
        <p>We implement: AES-256 encryption at rest; TLS 1.3 in transit; bcrypt password hashing (cost factor 12); JWT-based session management with token blacklisting; automated IP reputation tracking and banning; rate limiting and anomaly detection; multi-layer input sanitization; and sovereignty headers on all API responses. No transmission method is 100% secure. We will notify affected Members within 72 hours of a confirmed data breach as required by applicable law.</p>
      </S>

      <S title="10. Your Rights — All Members">
        <p>Depending on your jurisdiction, you may have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion ("right to be forgotten") — except for data we are legally required to retain; (d) port your data to another service in a machine-readable format; (e) opt out of marketing communications; (f) object to automated decision-making. To exercise any right, email <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a>. We respond within 30 days.</p>
      </S>

      <S title="11. California Residents (CCPA/CPRA)">
        <p>California residents have the right to: know what personal information is collected and how it is used; request deletion; correct inaccurate information; opt out of sale or sharing (we do not sell or share your data); limit use of sensitive personal information; and not be discriminated against for exercising these rights.</p>
        <p style={{ marginTop: 8 }}>To submit a verifiable consumer request: email <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a> with subject line "CCPA Request." We will verify your identity before processing. Authorized agents may submit requests with written permission.</p>
      </S>

      <S title="12. EEA, UK & GDPR Rights">
        <p>If you are located in the European Economic Area or the United Kingdom, you have the following additional rights under GDPR/UK GDPR: right to be informed; right to access; right to rectification; right to erasure; right to restrict processing; right to data portability; right to object; and rights related to automated decision-making and profiling.</p>
        <p style={{ marginTop: 8 }}>You also have the right to lodge a complaint with your national data protection authority (e.g., ICO in the UK, CNIL in France). Our EU/UK representative for GDPR purposes: <a href="mailto:gdpr@3conyx.com" style={{ color: "#C9A227" }}>gdpr@3conyx.com</a>.</p>
        <p style={{ marginTop: 8 }}>Data transfers outside the EEA/UK are conducted using EU Standard Contractual Clauses or equivalent safeguards.</p>
      </S>

      <S title="13. Children's Privacy">
        <p>The Platform is not directed at individuals under 18. We do not knowingly collect personal data from minors. If you believe we have collected data from a minor, contact <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a> immediately and we will delete it promptly.</p>
      </S>

      <S title="14. Cookies & Tracking">
        <p>We use essential cookies for authentication and session management (cannot be disabled without breaking the Platform). We use anonymized analytics cookies to understand Platform usage. We do not use third-party advertising cookies or tracking pixels. You may disable non-essential cookies via your browser settings.</p>
      </S>

      <S title="15. Changes to This Policy">
        <p>We may update this Privacy Policy periodically. Material changes will be communicated via email and in-app notification at least 30 days before taking effect. Continued use after the effective date constitutes acceptance. The current effective date is always shown at the top of this page.</p>
      </S>

      <S title="16. Contact & Data Controller">
        <p>CUXTOMCANDYCLUB LLC is the data controller for all personal information processed under this Policy.<br />
          Privacy inquiries: <a href="mailto:privacy@3conyx.com" style={{ color: "#C9A227" }}>privacy@3conyx.com</a><br />
          GDPR/UK inquiries: <a href="mailto:gdpr@3conyx.com" style={{ color: "#C9A227" }}>gdpr@3conyx.com</a><br />
          Legal inquiries: <a href="mailto:legal@3conyx.com" style={{ color: "#C9A227" }}>legal@3conyx.com</a><br />
          State of Florida, USA
        </p>
      </S>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>CUXTOMCANDYCLUB LLC — 3C ONYX — All rights reserved © 2026</span>
      </div>
    </div>
  );
}
