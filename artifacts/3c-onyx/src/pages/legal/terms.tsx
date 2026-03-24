import { Scale, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const EFFECTIVE = "March 24, 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.9 }}>{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader
        title="TERMS OF SERVICE"
        badge={<span style={{ fontSize: 10, fontWeight: 700, color: "#C9A227", letterSpacing: "0.1em" }}>LEGAL</span>}
        icon={Scale}
        accent="#C9A227"
      />

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 40 }}>
        Effective: {EFFECTIVE} &nbsp;|&nbsp; 3C Onyx, Inc. &nbsp;|&nbsp;
        <a href="/legal/privacy" style={{ color: "#C9A227", textDecoration: "none" }}>Privacy Policy →</a>
      </p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using the 3C Onyx platform ("Platform"), including the mobile application, web application, and any associated services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Platform.</p>
      </Section>

      <Section title="2. Description of Services">
        <p>3C Onyx is a luxury automotive super-application providing: (a) a peer-to-peer marketplace for buying, selling, and consigning vehicles; (b) a gig logistics network ("Runner Network") for vehicle transport; (c) AI-powered vehicle inspection and valuation services; (d) blockchain-based chain-of-custody provenance records; (e) Dynasty Wallet financial services; and (f) related concierge and professional services.</p>
      </Section>

      <Section title="3. Eligibility & Account Registration">
        <p>You must be at least 18 years of age and legally permitted to enter binding contracts in your jurisdiction to use this Platform. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for all activity under your account.</p>
      </Section>

      <Section title="4. Marketplace Transactions">
        <p>3C Onyx facilitates transactions between buyers and sellers but is not a party to any vehicle purchase agreement. Buyers and sellers are responsible for performing their own due diligence. All vehicle purchases are final unless otherwise agreed in writing between the parties. Stripe processes all payments; your card data is never stored on 3C Onyx servers.</p>
        <p style={{ marginTop: 10 }}>The Dynasty Wallet holds transaction escrow and may be subject to separate financial services agreements. 3C Onyx charges a platform fee on completed transactions as disclosed at checkout.</p>
      </Section>

      <Section title="5. Runner Network">
        <p>Runners are independent contractors, not employees of 3C Onyx. 3C Onyx provides tools and matching services only. Runners must pass identity verification and carry applicable commercial vehicle insurance. Disputes between Runners and vehicle owners are subject to arbitration as described in Section 12.</p>
      </Section>

      <Section title="6. AI Services & ONYX Concierge">
        <p>AI-powered features, including the ONYX AI Concierge, Guardian V2X, and valuation tools, are provided for informational purposes only. Results are probabilistic and should not be the sole basis for major financial decisions. 3C Onyx disclaims liability for AI-generated content.</p>
      </Section>

      <Section title="7. Prohibited Conduct">
        <p>You agree not to: (a) use the Platform for any unlawful purpose; (b) submit false vehicle information or odometer fraud; (c) manipulate reviews or ratings; (d) reverse-engineer the Platform; (e) access other users' accounts without authorization; (f) engage in money laundering or structuring through Dynasty Wallet; (g) violate any local, state, or federal motor vehicle laws.</p>
      </Section>

      <Section title="8. Blockchain Records">
        <p>Chain-of-custody records written to the blockchain are immutable. 3C Onyx cannot reverse, delete, or modify records once confirmed. Users are responsible for ensuring information submitted is accurate before submission. Blockchain records are not legal title documents.</p>
      </Section>

      <Section title="9. Privacy & Data">
        <p>Our Privacy Policy, incorporated herein by reference, describes how we collect, use, and protect your information. By using the Platform, you consent to the data practices described therein.</p>
      </Section>

      <Section title="10. Intellectual Property">
        <p>The 3C Onyx name, logo, 3C Spin Studio™, ONYX Concierge, Guardian V2X, and all Platform content are proprietary to 3C Onyx, Inc. You may not reproduce, distribute, or create derivative works without written permission.</p>
      </Section>

      <Section title="11. Disclaimer of Warranties">
        <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 3C ONYX DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.</p>
      </Section>

      <Section title="12. Arbitration & Dispute Resolution">
        <p>Any dispute arising from these Terms or use of the Platform shall be resolved by binding arbitration under the American Arbitration Association Commercial Rules. The arbitration shall take place in Delaware. Class action waiver: you waive the right to participate in a class action lawsuit or class-wide arbitration.</p>
      </Section>

      <Section title="13. Governing Law">
        <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law principles.</p>
      </Section>

      <Section title="14. Changes to Terms">
        <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via email or in-app notification with 30 days' notice.</p>
      </Section>

      <Section title="15. Contact">
        <p>For legal inquiries: <a href="mailto:legal@3conyx.com" style={{ color: "#C9A227" }}>legal@3conyx.com</a> &nbsp;|&nbsp; 3C Onyx, Inc., 2261 Market Street #4668, San Francisco, CA 94114.</p>
      </Section>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>3C Onyx, Inc. — All rights reserved © 2026</span>
      </div>
    </div>
  );
}
