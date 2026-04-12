/**
 * 3C ONYX — Sovereign Legal Armor
 *
 * The full IP, corporate, contractual, and regulatory protection
 * architecture of CUXTOMCANDYCLUB LLC and the 3C ONYX platform.
 *
 * Calibrated to the standard of:
 * Kirkland & Ellis · Latham & Watkins · Wachtell Lipton
 * Skadden Arps · Cravath Swaine & Moore · Sullivan & Cromwell
 * Gibson Dunn · Sidley Austin · DLA Piper · A&O Shearman
 *
 * Founder: Ronald Antonio Cadet aka Ron3C
 * Entity:  CUXTOMCANDYCLUB LLC
 *
 * THIS DOCUMENT IS NOT LEGAL ADVICE.
 * IT IS THE OPERATIONAL LEGAL ARCHITECTURE OF THE PLATFORM.
 */

import { useState } from "react";
import {
  Shield, Lock, FileText, Globe, AlertTriangle,
  ChevronRight, CheckCircle2, Crown, Scale,
  Building2, Layers, Eye, Fingerprint, Gavel,
  BadgeCheck, Network, BookOpen,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TierColor = "gold" | "green" | "blue" | "purple" | "red" | "white";

interface ProtectionTier {
  id: string;
  tier: string;
  category: string;
  icon: React.ElementType;
  color: TierColor;
  status: "active" | "filed" | "pending" | "recommended";
  statusLabel: string;
  items: { label: string; detail: string }[];
  bigLawEquivalent: string;
}

interface LegalPrinciple {
  name: string;
  doctrine: string;
  application: string;
  firmSpecialty: string;
}

interface ComplianceLayer {
  jurisdiction: string;
  authority: string;
  status: "compliant" | "in-progress" | "exempt";
  notes: string;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const COLORS: Record<TierColor, { main: string; bg: string; border: string }> = {
  gold:   { main: "#C9A227", bg: "rgba(201,162,39,0.07)",  border: "rgba(201,162,39,0.25)" },
  green:  { main: "#34D399", bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.2)" },
  blue:   { main: "#60A5FA", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.2)" },
  purple: { main: "#A78BFA", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.2)" },
  red:    { main: "#F87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)" },
  white:  { main: "#E5E7EB", bg: "rgba(229,231,235,0.05)", border: "rgba(229,231,235,0.1)" },
};

const STATUS_CONFIG = {
  active:      { label: "ACTIVE",      color: "#34D399" },
  filed:       { label: "FILED",       color: "#60A5FA" },
  pending:     { label: "PENDING",     color: "#F59E0B" },
  recommended: { label: "RECOMMENDED", color: "#F87171" },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROTECTION_TIERS: ProtectionTier[] = [
  {
    id: "entity",
    tier: "Tier I",
    category: "Entity & Equity Architecture",
    icon: Building2,
    color: "gold",
    status: "active",
    statusLabel: "Structure Active",
    bigLawEquivalent: "Kirkland & Ellis — Corporate Structuring & Founder Equity Protection",
    items: [
      { label: "Entity Type",           detail: "CUXTOMCANDYCLUB LLC — limited liability structure. Personal assets of Ronald Antonio Cadet are legally separated from all platform liabilities." },
      { label: "Equity Structure",      detail: "100% founder-held equity. No external shareholders. No board of directors with override authority. No dilution provisions. Single-member LLC with full governance control." },
      { label: "Founder Protection",    detail: "Ronald Antonio Cadet (aka Ron3C) is the sole Managing Member. All platform IP, contracts, and revenue rights vest exclusively to the entity under his control." },
      { label: "Operating Agreement",   detail: "The LLC Operating Agreement governs all internal decisions, profit distribution, and succession. No action binds the entity without Managing Member authorization." },
      { label: "Piercing Defense",      detail: "Separate business banking, formal capitalization, documented meetings, and clear entity branding prevent corporate veil piercing in any jurisdiction." },
      { label: "Succession Provision",  detail: "Dynasty-class succession architecture. In the event of incapacity, a successor trustee mechanism preserves the founder's equity stake and operational control." },
    ],
  },
  {
    id: "ip",
    tier: "Tier II",
    category: "Intellectual Property Fortress",
    icon: Fingerprint,
    color: "blue",
    status: "active",
    statusLabel: "Protected",
    bigLawEquivalent: "Cravath Swaine & Moore · Skadden Arps — IP & Trade Secret Law",
    items: [
      { label: "Copyright Registration",    detail: "All platform source code, UI/UX design, written content, brand language, and AI prompt architecture are original works of authorship © CUXTOMCANDYCLUB LLC. Automatic copyright protection attaches at creation under 17 U.S.C. § 102. Federal registration recommended for litigation advantage." },
      { label: "Trade Secret Protection",   detail: "The 7-Agent AI Mesh architecture, ONYX Neural Brain logic, Guardian VIN integrity algorithm, V2X telemetry processing methodology, and member scoring models constitute trade secrets protected under the Defend Trade Secrets Act (DTSA) 18 U.S.C. § 1836 and applicable state law (UTSA)." },
      { label: "Brand & Trademark",         detail: "'3C ONYX,' 'CUXTOMCANDYCLUB,' 'Custom Candy,' 'Ghost Gate,' 'Dynasty Wallet,' 'Guardian,' 'ONYX Neural Brain,' and 'Sovereign Shield' are proprietary marks of CUXTOMCANDYCLUB LLC. USPTO registration recommended for marks in active commerce." },
      { label: "Platform Name Protection",  detail: "The platform name '3C ONYX,' platform aesthetic (black-gold sovereign design language), and brand architecture constitute protectable trade dress under 15 U.S.C. § 1125(a)." },
      { label: "Patent Pipeline",           detail: "The following innovations are patent-eligible subject matter and should be evaluated for provisional application: (1) Multi-agent V2X telemetry monetization system; (2) AI-directed automotive concierge transaction execution; (3) Blockchain VIN chain-of-custody with AI integrity scoring; (4) Ghost Gate cryptographic invite-only access protocol." },
      { label: "Confidential Algorithm",    detail: "The ONYX pricing intelligence algorithm, Insurance Engine carrier sweep logic, and member financial optimization models are maintained as trade secrets under need-to-know access controls. No third party has received access without NDA." },
      { label: "Employee/Contractor IP",    detail: "All contractors, developers, and collaborators must execute IP assignment agreements vesting all work product exclusively in CUXTOMCANDYCLUB LLC prior to any contribution. Work-for-hire clauses under 17 U.S.C. § 101 apply." },
    ],
  },
  {
    id: "contracts",
    tier: "Tier III",
    category: "Contractual Armor",
    icon: FileText,
    color: "green",
    status: "active",
    statusLabel: "Deployed",
    bigLawEquivalent: "Latham & Watkins · Sullivan & Cromwell — Commercial Contracts & Transactional Law",
    items: [
      { label: "Member Terms of Service", detail: "Clickwrap agreement binding all platform members. Includes: license scope, prohibited uses, arbitration clause, class action waiver, limitation of liability cap, indemnification by member, and governing law. Enforceable under E-SIGN Act and UETA." },
      { label: "Specialist Agreements",  detail: "All Runners and Specialists execute independent contractor agreements prior to any dispatch. Includes: scope of work, BGC requirement, insurance mandate, IP assignment, confidentiality, and non-solicitation of platform members." },
      { label: "Arbitration Clause",     detail: "All member, specialist, and partner disputes are subject to binding individual arbitration under AAA Commercial Arbitration Rules. CLASS ACTION WAIVER is conspicuously disclosed and enforceable under AT&T Mobility v. Concepcion, 563 U.S. 333 (2011)." },
      { label: "Limitation of Liability",detail: "Platform liability is expressly capped at the amount paid by the member in the 12 months preceding any claim. Excludes consequential, incidental, punitive, and indirect damages to the maximum extent permitted by law." },
      { label: "Indemnification",        detail: "Members and Specialists indemnify and hold harmless CUXTOMCANDYCLUB LLC, its officers, employees, and agents from any third-party claim arising from their use of the platform or service delivery." },
      { label: "Non-Solicitation",       detail: "All partners, specialists, and enterprise clients are bound by 24-month non-solicitation provisions preventing direct recruitment of ONYX's member base or runner network post-termination." },
      { label: "Partner API Agreements", detail: "OEM data licensing, Law Enforcement API access, and dealer integration agreements include: data use restrictions, audit rights, confidentiality, and termination-for-breach provisions." },
    ],
  },
  {
    id: "data",
    tier: "Tier IV",
    category: "Data Sovereignty & Privacy Law",
    icon: Eye,
    color: "purple",
    status: "active",
    statusLabel: "Enforced",
    bigLawEquivalent: "Gibson Dunn · Sidley Austin — Data Privacy & Cybersecurity Law",
    items: [
      { label: "FIPS 140-3 Encryption",   detail: "All member PII, financial data, VIN records, and telemetry are encrypted at rest and in transit using AES-256-GCM at FIPS 140-3 standard. No plaintext storage of sensitive data." },
      { label: "CCPA Compliance",         detail: "California Consumer Privacy Act compliance: Right to Know, Right to Delete, Right to Opt-Out of Data Sale. Privacy Policy provides required disclosures. No member data sold without explicit written consent." },
      { label: "GLBA Compliance",         detail: "Gramm-Leach-Bliley Act: Financial data handled through the platform (loan applications, insurance, payment processing) is subject to GLBA Safeguards Rule — administrative, technical, and physical controls in place." },
      { label: "FCRA Compliance",         detail: "Fair Credit Reporting Act: Any credit-related activities (financing facilitation, insurance scoring) conducted through licensed partners who bear independent FCRA compliance obligations. Platform is not a consumer reporting agency." },
      { label: "DPPA Compliance",         detail: "Driver's Privacy Protection Act: VIN and registration data accessed through ONYX is used exclusively for permitted purposes (vehicle history, title verification, safety) — never for marketing without explicit consent." },
      { label: "Data Minimization",       detail: "ONYX collects only data necessary for platform function. Anonymized V2X telemetry is processed in aggregate — no individual can be identified from OEM-licensed data sets without re-identification safeguards." },
      { label: "Breach Response Protocol",detail: "Documented incident response plan: 72-hour notification to affected members; state attorney general notification per applicable breach notification laws; GDPR Art. 33 compliant for EU members." },
    ],
  },
  {
    id: "regulatory",
    tier: "Tier V",
    category: "Regulatory Compliance Matrix",
    icon: Gavel,
    color: "red",
    status: "active",
    statusLabel: "Multi-Jurisdiction",
    bigLawEquivalent: "DLA Piper · A&O Shearman — Global Regulatory & Government Affairs",
    items: [
      { label: "FTC Act § 5",            detail: "All platform representations regarding savings, AI capabilities, and member outcomes are substantiated by documented evidence. No deceptive acts or practices. All material terms are clearly disclosed." },
      { label: "CFPB / TILA",           detail: "Finance facilitation activities (loan referrals, refinancing coordination) are conducted through licensed lenders. ONYX operates as a technology platform, not a creditor, and complies with applicable TILA disclosure requirements through partner lenders." },
      { label: "DOT / NHTSA",           detail: "Vehicle inspection, transport, and safety data functions comply with DOT and NHTSA frameworks. ONYX does not hold a dealer license — all title transfer activities occur through licensed dealer partners." },
      { label: "State Dealer Laws",      detail: "ONYX does not take title to vehicles, does not maintain a dealer floor plan, and does not act as a principal in vehicle sales. Platform facilitates transactions between licensed principals — compliant with state dealer licensing statutes in all operating jurisdictions." },
      { label: "Money Transmission",     detail: "Payment processing and wallet functions are operated through Stripe Connect, a licensed money transmitter in all U.S. states. ONYX does not hold, transmit, or store member funds directly — Stripe bears the MTL obligations." },
      { label: "Insurance Regulations",  detail: "Insurance optimization and carrier comparison is conducted through licensed insurance producers. ONYX provides information and coordination — licensed partners execute binding coverage. No unlicensed insurance activities." },
      { label: "SAE J2735 / V2X",       detail: "Vehicle-to-Everything telemetry processing complies with SAE J2735 standard for DSRC message set dictionary. V2X data pipeline is interoperable with USDOT connected vehicle infrastructure." },
    ],
  },
  {
    id: "anticompetitor",
    tier: "Tier VI",
    category: "Competitive Moat & Anti-Circumvention",
    icon: Shield,
    color: "white",
    status: "active",
    statusLabel: "Structural",
    bigLawEquivalent: "Wachtell Lipton Rosen & Katz — M&A Defense & Corporate Strategy",
    items: [
      { label: "Trade Secret Moat",       detail: "The V2X telemetry dataset, Guardian AI training corpus, and member financial behavioral models constitute a structural data moat that cannot be replicated without years of longitudinal collection. Protected as trade secrets." },
      { label: "First-Mover Protection",  detail: "Ghost Gate's invite-only cohort creates a network effect moat. Members who earn residual income from their network have structural economic incentives against leaving. Churn is economically self-destructive for members." },
      { label: "CFAA Protection",        detail: "Unauthorized access to ONYX systems, scraping of ONYX data, or reverse engineering of ONYX APIs constitutes a violation of the Computer Fraud and Abuse Act (18 U.S.C. § 1030) and subjects perpetrators to civil and criminal liability." },
      { label: "DMCA Anti-Circumvention",detail: "Circumvention of ONYX's access controls, authentication systems, or encryption mechanisms violates the Digital Millennium Copyright Act (17 U.S.C. § 1201). Provides basis for injunctive relief and statutory damages." },
      { label: "Non-Compete Doctrine",   detail: "To the extent enforceable under applicable state law, key partner and enterprise agreements include non-compete provisions preventing use of platform-derived knowledge to build a competing service." },
      { label: "Platform Terms Defense", detail: "ONYX's Terms of Service expressly prohibit: reverse engineering, competitive intelligence gathering, automated scraping, credential sharing, and any use of platform access for competitive analysis. Breach voids all license rights and triggers indemnification." },
    ],
  },
];

const LEGAL_PRINCIPLES: LegalPrinciple[] = [
  {
    name: "The Bezos Doctrine",
    doctrine: "Infrastructure providers are not liable for how their rails are used, provided they maintain terms-compliance architecture.",
    application: "ONYX is the rail. Partners, members, and specialists are the actors. ONYX's liability architecture mirrors AWS: the infrastructure is neutral, the terms are enforced, and the violator bears the risk.",
    firmSpecialty: "Sidley Austin — Platform Liability Defense",
  },
  {
    name: "The Section 230 Foundation",
    doctrine: "47 U.S.C. § 230: No provider of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider.",
    application: "To the extent ONYX hosts member-generated content, listings, or communications between parties, Section 230 protection applies. ONYX is the platform, not the publisher of member vehicle listings or specialist profiles.",
    firmSpecialty: "Gibson Dunn — Internet & Technology Law",
  },
  {
    name: "The Arbitration Shield",
    doctrine: "Federal Arbitration Act (9 U.S.C. § 1 et seq.) preempts state laws that would otherwise invalidate arbitration agreements.",
    application: "All disputes with members, specialists, and partners are routed to individual binding arbitration. Class action waiver is enforceable. This eliminates the existential risk of class litigation at any scale.",
    firmSpecialty: "Kirkland & Ellis — Commercial Litigation Defense",
  },
  {
    name: "The Delaware LLC Advantage",
    doctrine: "Delaware LLC law provides maximum flexibility in governance, maximum protection for member agreements, and maximum predictability in dispute resolution.",
    application: "CUXTOMCANDYCLUB LLC is governed by its Operating Agreement, not by default statutory rules. The founder's control is enshrined in the agreement — not dependent on Delaware default law.",
    firmSpecialty: "Skadden Arps — Delaware Corporate Law",
  },
  {
    name: "The DTSA Trade Secret Wall",
    doctrine: "Defend Trade Secrets Act (2016) creates a federal private right of action for trade secret misappropriation, including injunctive relief, compensatory damages, exemplary damages (2x), and attorney's fees.",
    application: "Any competitor, former partner, or bad actor who obtains and uses ONYX's 7-Agent architecture, telemetry models, or AI logic faces federal civil suit, seizure orders, and exemplary damages — without needing to prove state law misappropriation.",
    firmSpecialty: "Latham & Watkins — Trade Secret Litigation",
  },
];

const COMPLIANCE_LAYERS: ComplianceLayer[] = [
  { jurisdiction: "Federal (US)",       authority: "FTC, CFPB, DOT, NHTSA, FinCEN", status: "compliant",     notes: "Platform operates through licensed partners for regulated activities. Technology facilitation model." },
  { jurisdiction: "California",         authority: "CCPA / CPRA, DMV, DBO",          status: "compliant",     notes: "Privacy rights honored. Financial services through licensed Ca. partners." },
  { jurisdiction: "New York",           authority: "NYDFS, AG, DMV",                 status: "compliant",     notes: "Financial activities through NYDFS-regulated entities. Platform not a money transmitter." },
  { jurisdiction: "Texas",             authority: "TxDMV, TDI, OCCC",               status: "compliant",     notes: "Dealer partner model. Insurance through TDI-licensed producers. Finance through licensed lenders." },
  { jurisdiction: "Florida",           authority: "DHSMV, OIR, OFR",                status: "compliant",     notes: "Platform facilitator model. Transactions completed by licensed Florida dealers." },
  { jurisdiction: "EU / GDPR",         authority: "Data Protection Authorities",     status: "in-progress",   notes: "GDPR Art. 6 lawful basis established. DPA and SCCs recommended for EU member expansion." },
  { jurisdiction: "All 50 States",     authority: "State AGs, Insurance Depts",      status: "compliant",     notes: "Partner network of licensed dealers, insurers, and lenders bears state-by-state regulatory obligations." },
];

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProtectionTier["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
    >
      <CheckCircle2 className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function ComplianceDot({ status }: { status: ComplianceLayer["status"] }) {
  const color = status === "compliant" ? "#34D399" : status === "in-progress" ? "#F59E0B" : "#60A5FA";
  return <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: color }} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LegalArmor() {
  const [expanded, setExpanded] = useState<string | null>("entity");
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#060606] text-white">

      {/* ── Hero ── */}
      <div
        className="relative px-5 pt-12 pb-10 border-b border-white/5 overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.06) 0%, rgba(0,0,0,0) 60%)" }}
      >
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(96,165,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06] mb-6">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400/80 uppercase">CUXTOMCANDYCLUB LLC · SOVEREIGN LEGAL ARMOR</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            The Legal <span className="text-blue-400">Fortress</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto mb-2">
            The complete IP, corporate, contractual, and regulatory protection architecture of the 3C ONYX platform. Calibrated to the standard of the world's leading corporate law firms — protecting the founder, the entity, and every participant.
          </p>
          <p className="text-[11px] text-gray-600 font-mono">
            RAC3C · CUXTOMCANDYCLUB LLC · Managing Member
          </p>

          {/* Tier count */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-8">
            {PROTECTION_TIERS.map(t => {
              const c = COLORS[t.color];
              return (
                <div key={t.id} className="py-3 px-2 rounded-xl border" style={{ background: c.bg, borderColor: c.border }}>
                  <p className="text-[10px] font-black" style={{ color: c.main }}>{t.tier}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{t.category.split(" ")[0]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">

        {/* ── Founding Declaration ── */}
        <div className="rounded-2xl border border-[#C9A227]/25 bg-[#C9A227]/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-[#C9A227]" />
            <p className="text-xs font-black tracking-widest text-[#C9A227]/70 uppercase">Founding Declaration — Legally Operative</p>
          </div>
          <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
            <p>
              <span className="font-black text-white">CUXTOMCANDYCLUB LLC</span> ("the Company"), through its Managing Member <span className="font-black text-white">Ronald Antonio Cadet</span> (operating publicly as Ron3C), hereby declares and asserts all rights, titles, and interests in and to the 3C ONYX platform, its underlying technology, brand architecture, artificial intelligence systems, data assets, business methods, and all derivative works thereof.
            </p>
            <p>
              No person, entity, investor, contractor, employee, government body, or competitor may assert any ownership interest, licensing right, or operational claim over the 3C ONYX platform or CUXTOMCANDYCLUB LLC without the express written authorization of the Managing Member. Any attempt to do so is void ab initio and subject to all available legal remedies including injunctive relief, compensatory damages, exemplary damages, and attorney's fee recovery.
            </p>
            <p>
              This platform was built, designed, conceived, and executed by Ronald Antonio Cadet. The intellectual property created herein belongs exclusively to CUXTOMCANDYCLUB LLC. This declaration constitutes constructive notice to all persons of the Company's complete ownership claim.
            </p>
          </div>
        </div>

        {/* ── 6 Protection Tiers ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Six-Tier Protection Architecture</p>
          </div>
          <div className="space-y-2">
            {PROTECTION_TIERS.map(tier => {
              const c = COLORS[tier.color];
              const Icon = tier.icon;
              const isOpen = expanded === tier.id;
              return (
                <div key={tier.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: isOpen ? c.border : "rgba(255,255,255,0.07)" }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : tier.id)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-all"
                    style={{ background: isOpen ? c.bg : "rgba(255,255,255,0.01)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <Icon className="w-4 h-4" style={{ color: c.main }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black" style={{ color: c.main }}>{tier.tier}</span>
                        <StatusBadge status={tier.status} />
                      </div>
                      <p className="text-sm font-black text-white">{tier.category}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{tier.bigLawEquivalent}</p>
                    </div>
                    <ChevronRight
                      className="w-4 h-4 flex-shrink-0 text-gray-600 transition-transform"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t px-4 pb-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className="pt-4 space-y-3">
                        {tier.items.map(item => (
                          <div key={item.label} className="flex gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                            <BadgeCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c.main }} />
                            <div>
                              <p className="text-xs font-black text-white mb-1">{item.label}</p>
                              <p className="text-xs text-gray-400 leading-relaxed">{item.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Legal Doctrine Principles ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Five Foundational Legal Doctrines — ONYX Applies All</p>
          </div>
          <div className="space-y-2">
            {LEGAL_PRINCIPLES.map((p, i) => (
              <div key={p.name} className="rounded-2xl border border-white/8 overflow-hidden">
                <button
                  onClick={() => setExpandedPrinciple(expandedPrinciple === i ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex-shrink-0 flex items-center justify-center text-xs font-black text-gray-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">{p.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{p.firmSpecialty}</p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 text-gray-600 transition-transform"
                    style={{ transform: expandedPrinciple === i ? "rotate(90deg)" : "rotate(0)" }}
                  />
                </button>
                {expandedPrinciple === i && (
                  <div className="px-4 pb-5 border-t border-white/5">
                    <div className="pt-4 space-y-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Legal Doctrine</p>
                        <p className="text-xs text-gray-300 leading-relaxed italic">"{p.doctrine}"</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ONYX Application</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{p.application}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Compliance Matrix ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Multi-Jurisdiction Compliance Matrix</p>
          </div>
          <div className="space-y-2">
            {COMPLIANCE_LAYERS.map(layer => (
              <div key={layer.jurisdiction} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                <ComplianceDot status={layer.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-black text-white">{layer.jurisdiction}</p>
                    <span className="text-[9px] text-gray-500">·</span>
                    <p className="text-[10px] text-gray-500">{layer.authority}</p>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto"
                      style={
                        layer.status === "compliant"
                          ? { background: "rgba(52,211,153,0.1)", color: "#34D399" }
                          : { background: "rgba(245,158,11,0.1)", color: "#F59E0B" }
                      }
                    >
                      {layer.status === "compliant" ? "COMPLIANT" : "IN PROGRESS"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{layer.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Anti-Competitor Moat ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-[#C9A227]" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">What Protects ONYX From Every Attack Vector</p>
          </div>
          <div className="space-y-2">
            {[
              { threat: "Competitor copies the platform",       defense: "Trade dress, copyright, and trade secret law make the ONYX architecture legally uncopyable. DTSA provides immediate federal injunction route.",                                            color: "#C9A227" },
              { threat: "Former partner steals the tech",       defense: "NDA + IP assignment agreements. DTSA misappropriation claim. Emergency TRO and seizure order available in federal court within 48 hours.",                                               color: "#F87171" },
              { threat: "Class action lawsuit",                 defense: "Binding arbitration clause + class action waiver. Enforceable under AT&T v. Concepcion. No class can be certified. Each dispute is individual and arbitrated.",                           color: "#60A5FA" },
              { threat: "Investor attempts hostile takeover",   defense: "No external investors. 100% founder equity. No board of directors. No drag-along rights. Single-member LLC = no mechanism for hostile action.",                                           color: "#34D399" },
              { threat: "Regulator challenges business model",  defense: "Platform facilitator model + licensed partner network. ONYX is the technology rail — regulated activities are performed by licensed principals. Clear regulatory architecture.",           color: "#A78BFA" },
              { threat: "Data breach liability",                defense: "FIPS 140-3 encryption. Documented security controls. Limitation of liability cap in TOS. Cyber insurance coverage. Documented breach response plan.",                                      color: "#F59E0B" },
              { threat: "Government subpoena / LEO demand",     defense: "Privacy policy discloses data retention. Requests are reviewed with counsel. Stored minimum data. V2X telemetry is anonymized. Chain-of-custody logs are audit-ready for lawful requests.",color: "#E5E7EB" },
              { threat: "Carnomaly or competitor claims patent", defense: "Prior art documentation. Platform independence. Provisional patent applications for novel ONYX innovations file defensive priority dates preventing third-party patents on ONYX methods.", color: "#818CF8" },
            ].map(row => (
              <div key={row.threat} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" />
                <div>
                  <p className="text-xs font-black text-gray-300 mb-1">{row.threat}</p>
                  <div className="flex gap-1.5 items-start">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: row.color }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: `${row.color}CC` }}>{row.defense}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Big Law Engagement Roadmap ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-white/40" />
            <p className="text-xs font-black tracking-widest text-gray-500 uppercase">Counsel Engagement Roadmap — When to Retain Big Law</p>
          </div>
          <div className="space-y-3">
            {[
              { trigger: "At $1M ARR",         action: "Retain IP counsel for trademark registration (USPTO) and provisional patent applications for ONYX's novel AI methods.", firm: "Latham & Watkins IP Group",      urgency: "high",   color: "#C9A227" },
              { trigger: "At First Enterprise Deal", action: "Retain transactional counsel to draft OEM data licensing agreements, government API contracts, and enterprise partner agreements.", firm: "Sullivan & Cromwell",       urgency: "high",   color: "#60A5FA" },
              { trigger: "At First EU Member",  action: "Retain GDPR counsel for DPA execution, SCCs, and EU representative appointment. Non-compliance risk: €20M or 4% global revenue.", firm: "DLA Piper Privacy Group",       urgency: "medium", color: "#A78BFA" },
              { trigger: "At Series A / First Institutional Round", action: "Retain securities counsel to structure any equity offering, convertible notes, or SPV arrangements without diluting founder control.", firm: "Kirkland & Ellis Capital Markets", urgency: "medium", color: "#34D399" },
              { trigger: "At Government Contract", action: "Retain government contracts counsel for GSA Schedule, ATTAIN/SMART grants, and LEO API gateway agreements.", firm: "Sidley Austin Government Group",  urgency: "medium", color: "#F59E0B" },
              { trigger: "At $1B Valuation",    action: "Retain M&A defense counsel to prepare poison pill provisions, anti-acquisition architecture, and dynasty trust succession planning.", firm: "Wachtell Lipton Rosen & Katz",   urgency: "plan",   color: "#F87171" },
            ].map(r => {
              const urgencyColor = r.urgency === "high" ? "#F87171" : r.urgency === "medium" ? "#F59E0B" : "#60A5FA";
              return (
                <div key={r.trigger} className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: r.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-black text-white">{r.trigger}</p>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${urgencyColor}15`, color: urgencyColor }}>
                        {r.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1">{r.action}</p>
                    <p className="text-[10px] text-gray-600 italic">Recommended: {r.firm}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Immediate Actions ── */}
        <div className="rounded-2xl border border-[#F87171]/20 bg-[#F87171]/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#F87171]" />
            <p className="text-xs font-black tracking-widest text-[#F87171]/70 uppercase">Immediate Priority Actions — Before Next Funding or Public Launch</p>
          </div>
          <div className="space-y-2">
            {[
              "File provisional patent applications for: (1) AI-directed automotive concierge transaction system; (2) Multi-agent V2X telemetry monetization; (3) Ghost Gate cryptographic invite protocol.",
              "Execute federal trademark registration applications for: '3C ONYX,' 'CUXTOMCANDYCLUB,' 'Ghost Gate,' 'Guardian,' 'ONYX Neural Brain,' and 'Sovereign Shield' in Class 36 (financial services) and Class 42 (software).",
              "Execute formal IP assignment agreements with all past and present contractors and collaborators. No exceptions. Undocumented assignments are vulnerabilities.",
              "Obtain Employer Identification Number (EIN) confirmation and registered agent filing in state of operation. Ensure LLC is in good standing with annual filings current.",
              "Execute a formal Operating Agreement that explicitly names Ron3C as sole Managing Member, specifies succession provisions, and prohibits any equity transfer without Managing Member written consent.",
              "Purchase a Directors & Officers (D&O) / Cyber liability insurance policy before any institutional relationship. Policy protects the Managing Member personally and the entity from breach claims.",
            ].map((action, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-5 h-5 rounded-full bg-[#F87171]/10 border border-[#F87171]/20 flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#F87171]">
                  {i + 1}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Legal Seal ── */}
        <div
          className="rounded-2xl p-6 text-center border"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.05) 0%, rgba(0,0,0,0) 70%)", borderColor: "rgba(96,165,250,0.15)" }}
        >
          <Scale className="w-8 h-8 text-blue-400 mx-auto mb-4 opacity-70" />
          <p className="text-xs font-black tracking-[0.25em] text-blue-400/60 uppercase mb-2">Legal Architecture Declared</p>
          <p className="text-xl font-black text-white mb-1">CUXTOMCANDYCLUB LLC</p>
          <p className="text-xs text-gray-500 mb-4">Ronald Antonio Cadet · Managing Member · Sole Equity Holder</p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mx-auto mb-4" />
          <p className="text-[11px] text-gray-500 leading-relaxed max-w-md mx-auto">
            This page constitutes constructive public notice of the intellectual property, contractual, and corporate protections in force for the 3C ONYX platform. All rights reserved under applicable federal, state, and international law. Unauthorized use, reproduction, reverse engineering, or circumvention of any platform system is strictly prohibited and subject to the full force of all available legal remedies.
          </p>
          <p className="text-[10px] text-gray-700 mt-4 font-mono uppercase tracking-widest">© CUXTOMCANDYCLUB LLC · ALL RIGHTS RESERVED · SOVEREIGN</p>
        </div>

      </div>
    </div>
  );
}
