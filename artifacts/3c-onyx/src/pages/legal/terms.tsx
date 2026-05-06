import { Scale, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const EFFECTIVE = "March 29, 2026";

const S = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</h2>
    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.9 }}>{children}</div>
  </div>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)", borderRadius: 8, padding: "12px 16px", marginTop: 10, marginBottom: 10, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
    {children}
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
        Effective: {EFFECTIVE} &nbsp;|&nbsp; CUXTOMCANDYCLUB LLC &nbsp;|&nbsp;
        <a href="/legal/privacy" style={{ color: "#C9A227", textDecoration: "none" }}>Privacy Policy →</a>
      </p>

      <S title="1. Acceptance of Terms">
        <p>By accessing or using the 3C ONYX platform ("Platform"), including the mobile application, web application, and any associated services operated by CUXTOMCANDYCLUB LLC ("Company," "we," "our," "us"), you ("Member," "User," "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Platform. These Terms constitute a legally binding agreement.</p>
      </S>

      <S title="2. Description of Services">
        <p>3C ONYX is a technology-enabled luxury Automotive Ecosystem OS providing: (a) a peer-to-peer vehicle marketplace connecting buyers and sellers; (b) a logistics network ("Runner Network") for vehicle transport by independent contractors; (c) AI-powered vehicle inspection and valuation tools; (d) blockchain-based chain-of-custody records; (e) Dynasty Wallet financial transaction tools; (f) procurement services (ONYX Source); and (g) related concierge and advisory services.</p>
      </S>

      <S title="3. Technology Marketplace — Not a Licensed Dealer or Broker">
        <Highlight>
          <strong style={{ color: "#C9A227" }}>IMPORTANT:</strong> 3C ONYX is a technology platform and marketplace facilitator only. CUXTOMCANDYCLUB LLC is NOT a licensed automotive dealer, broker, auctioneer, or agent in any state or jurisdiction. The Company does not buy, sell, own, or hold title to any vehicle listed on the Platform. All vehicle transactions are conducted directly between Members (buyers and sellers). Members are solely responsible for ensuring their vehicle transactions comply with all applicable state and local laws, including dealer licensing requirements, title transfer procedures, and motor vehicle regulations in their jurisdiction.
        </Highlight>
        <p>By listing or purchasing a vehicle through the Platform, you represent that you are acting in compliance with the laws of your jurisdiction, including any applicable dealer licensing laws if you are selling multiple vehicles.</p>
      </S>

      <S title="4. Insurance Services — Not a Licensed Insurance Provider">
        <Highlight>
          <strong style={{ color: "#C9A227" }}>IMPORTANT:</strong> 3C ONYX is NOT a licensed insurance agent, broker, insurer, or underwriter in any state. Any insurance-related content, tools, or third-party referrals on the Platform are provided for informational purposes only and do not constitute insurance advice or an insurance solicitation. For actual insurance coverage, you must work with a licensed insurance professional in your jurisdiction. The Company earns no compensation from insurance referrals unless separately disclosed in a licensed arrangement.
        </Highlight>
      </S>

      <S title="5. Payments, Dynasty Wallet & Financial Instruments">
        <p>All payment processing on the Platform is handled exclusively by Stripe, Inc., a licensed payment processor. CUXTOMCANDYCLUB LLC does not store, hold, or transmit payment card data. Your card data is governed by Stripe's Privacy Policy and Terms of Service.</p>
        <p style={{ marginTop: 10 }}>The Dynasty Wallet is a platform accounting tool that tracks your transaction credits, referral earnings, and platform balances. It is NOT a bank account, checking account, savings account, or deposit account. Funds displayed in the Dynasty Wallet do not earn interest and are not insured by the FDIC or any government agency. The Company is not a licensed money transmitter, bank, or financial institution. Withdrawal or transfer of Dynasty Wallet balances is subject to applicable terms and may require identity verification.</p>
        <p style={{ marginTop: 10 }}>The Platform charges a service fee on completed transactions as disclosed at checkout. All fees are non-refundable except as required by law.</p>
      </S>

      <S title="6. Eligibility & Account Registration">
        <p>You must be at least 18 years of age, a legal resident of the United States, and legally permitted to enter binding contracts in your jurisdiction. You agree to provide accurate, current, and complete information during registration and to update such information promptly. You are responsible for all activity under your account. Sharing your account credentials is prohibited.</p>
      </S>

      <S title="7. Runner Network — Independent Contractors">
        <p>Runners are independent contractors, not employees, agents, or representatives of CUXTOMCANDYCLUB LLC. The Company provides technology tools and matching services only. Runners must pass identity and background verification and must carry applicable commercial insurance. CUXTOMCANDYCLUB LLC is not liable for acts or omissions of Runners. Disputes between Runners and Members are subject to arbitration as described in Section 15.</p>
      </S>

      <S title="8. AI Services, Automated Decisions & ONYX Concierge">
        <Highlight>
          <strong style={{ color: "#C9A227" }}>AI DISCLOSURE:</strong> The ONYX Concierge, Guardian, ONYX Source bid scoring, vehicle valuation tools, route optimization, and other features are powered by artificial intelligence and automated systems. These systems make recommendations, take preparatory actions, and surface options on your behalf. No automated action on this Platform is taken without your explicit confirmation. AI-generated results are probabilistic and should not be the sole basis for major financial decisions. The Company disclaims liability for AI-generated content to the fullest extent permitted by law.
        </Highlight>
        <p>By using AI-powered features, you acknowledge and consent to automated processing of your data to deliver these services, as further described in our Privacy Policy.</p>
      </S>

      <S title="9. Communications Consent (TCPA)">
        <Highlight>
          <strong style={{ color: "#C9A227" }}>IMPORTANT — PLEASE READ:</strong> By creating an account and providing your phone number, you expressly consent to receive automated text messages (SMS) and WhatsApp messages from CUXTOMCANDYCLUB LLC and 3C ONYX at the phone number you provide. These messages may include: account notifications, transaction confirmations, security alerts, service updates, and — only if you separately opt in — marketing and promotional messages. Message and data rates may apply. Message frequency varies. You may opt out of marketing messages at any time by texting STOP to any message or updating your notification preferences in your account settings. Opting out of marketing messages does not affect service-essential notifications (security alerts, transaction confirmations). Consent to receive marketing messages is not a condition of purchase or membership.
        </Highlight>
      </S>

      <S title="10. Telematics & Location Data Consent">
        <p>Certain features of the Platform (Guardian V2X, Runner tracking, delivery logistics) use GPS and telematics data from your device or your vehicle. By enabling these features, you consent to the collection, processing, and use of your precise location and vehicle telematics data as described in our Privacy Policy. You may disable location permissions at any time through your device settings, though this may limit certain features. Location data collected for Runner tasks is retained for 90 days and then anonymized.</p>
      </S>

      <S title="11. Prohibited Conduct">
        <p>You agree not to: (a) use the Platform for any unlawful purpose; (b) submit false vehicle information, odometer fraud, or misrepresent a vehicle's condition; (c) manipulate reviews, ratings, or AI scoring systems; (d) reverse-engineer, decompile, or attempt to access Platform source code; (e) access other Members' accounts without authorization; (f) engage in money laundering, structuring, or financial fraud through Dynasty Wallet; (g) violate any federal, state, or local motor vehicle law; (h) probe, scan, or attack Platform security systems; (i) use the Platform to compete with or copy the business of CUXTOMCANDYCLUB LLC.</p>
      </S>

      <S title="12. Blockchain & Chain-of-Custody Records">
        <p>Chain-of-custody records written to the blockchain are immutable. The Company cannot reverse, delete, or modify confirmed records. Members are responsible for ensuring the accuracy of information submitted before confirmation. Blockchain records are NOT legal title documents and do not substitute for proper title transfer under applicable state law.</p>
      </S>

      <S title="13. Intellectual Property">
        <p>The 3C ONYX name, ONYX logo, 3C Spin Studio™, ONYX Concierge, Guardian V2X, Dynasty Wallet, ONYX Source, the platform architecture, all source code, design elements, and proprietary AI models are exclusively owned by CUXTOMCANDYCLUB LLC (founder: Ronald Antonio Cadet). Unauthorized reproduction, distribution, reverse-engineering, or creation of derivative works is strictly prohibited and constitutes willful infringement subject to statutory damages under 17 U.S.C. § 504 and the Defend Trade Secrets Act (18 U.S.C. § 1836).</p>
      </S>

      <S title="14. Privacy & Data">
        <p>Our Privacy Policy, incorporated herein by reference, describes how we collect, use, share, and protect your information, including your rights under CCPA, GDPR, and other applicable laws. By using the Platform, you consent to the data practices described therein.</p>
      </S>

      <S title="15. Disclaimer of Warranties">
        <p>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. THE COMPANY DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. USE OF THE PLATFORM IS AT YOUR SOLE RISK.</p>
      </S>

      <S title="16. Limitation of Liability">
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CUXTOMCANDYCLUB LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF $100 OR THE AMOUNT YOU PAID US IN THE PRECEDING 12 MONTHS.</p>
      </S>

      <S title="17. Arbitration & Dispute Resolution">
        <p>Any dispute arising from these Terms or use of the Platform shall be resolved by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. The arbitration shall be conducted in English. <strong style={{ color: "#fff" }}>CLASS ACTION WAIVER: You waive your right to participate in any class action lawsuit or class-wide arbitration.</strong> This waiver is a material part of this agreement. Notwithstanding the foregoing, either party may seek injunctive or equitable relief in a court of competent jurisdiction to protect intellectual property rights.</p>
      </S>

      <S title="18. Governing Law">
        <p>These Terms are governed by the laws of the State of Florida, USA, without regard to conflict-of-law principles. Any court proceedings not subject to arbitration shall be brought exclusively in the state or federal courts located in Miami-Dade County, Florida.</p>
      </S>

      <S title="19. Changes to Terms">
        <p>We may update these Terms at any time. Material changes will be communicated via email and in-app notification at least 30 days before taking effect. Continued use after the effective date constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Platform.</p>
      </S>

      <S title="20. Contact">
        <p>For legal inquiries: <a href="mailto:legal@3conyx.ai" style={{ color: "#C9A227" }}>legal@3conyx.ai</a><br />
        CUXTOMCANDYCLUB LLC — 3C ONYX Platform<br />
        State of Florida, USA</p>
      </S>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>CUXTOMCANDYCLUB LLC — 3C ONYX — All rights reserved © 2026</span>
      </div>
    </div>
  );
}
