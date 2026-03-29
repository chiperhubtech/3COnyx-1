/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * Pre-Launch Readiness Dashboard
 * ───────────────────────────────
 * Everything that must be done before the platform goes live.
 * Three categories: Accounts you must set up yourself,
 * legal items already built in the platform, and
 * items that require an attorney before launch.
 */

import { CheckCircle2, Circle, AlertTriangle, ExternalLink, CreditCard, Smartphone, Globe, Shield, Scale, FileText, Building2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Status = "done" | "pending-you" | "needs-attorney" | "pending-vendor";

interface CheckItem {
  title:       string;
  detail:      string;
  status:      Status;
  link?:       string;
  linkLabel?:  string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.FC<{className?: string}> }> = {
  "done":           { label: "Done",            color: "text-green-400",  bg: "bg-green-900/30 border-green-800",  icon: CheckCircle2 },
  "pending-you":    { label: "You Must Do This", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800", icon: Circle },
  "needs-attorney": { label: "Attorney Required", color: "text-red-400",   bg: "bg-red-900/20 border-red-800",      icon: AlertTriangle },
  "pending-vendor": { label: "Pending Vendor",   color: "text-blue-400",  bg: "bg-blue-900/20 border-blue-800",    icon: Circle },
};

interface Section {
  title: string;
  icon:  React.FC<{className?: string}>;
  items: CheckItem[];
}

const SECTIONS: Section[] = [
  {
    title: "Account Setup — You Must Do These",
    icon: CreditCard,
    items: [
      {
        title: "Stripe Account — Connect Business Bank Account",
        detail: "Create a Stripe account at stripe.com using your business email. Under Settings → Bank Accounts, add your CUXTOMCANDYCLUB LLC business checking account (routing + account number). Then go to Developers → API Keys and copy your Secret Key and Publishable Key — give these to your developer to add to the platform. Also set up a Webhook endpoint for payment events.",
        status: "pending-you",
        link: "https://dashboard.stripe.com/register",
        linkLabel: "Open Stripe →",
      },
      {
        title: "Apple Developer Program — $99/year",
        detail: "Go to developer.apple.com and enroll as an organization (not individual) using your CUXTOMCANDYCLUB LLC business details. You will need a DUNS number — apply at dnb.com first if you don't have one (takes 1-2 weeks). Once enrolled, you will get an App Store Connect account where the 3C ONYX iOS app will be submitted. Required before any iOS deployment.",
        status: "pending-you",
        link: "https://developer.apple.com/programs/enroll/",
        linkLabel: "Enroll Apple →",
      },
      {
        title: "Google Play Developer Account — $25 one-time",
        detail: "Go to play.google.com/console and create a developer account using your business Google account. Pay the $25 one-time registration fee. Set up your developer profile with CUXTOMCANDYCLUB LLC business details. This is required before the Android app can be submitted. Much faster than Apple — usually approved same day.",
        status: "pending-you",
        link: "https://play.google.com/console/signup",
        linkLabel: "Enroll Google →",
      },
      {
        title: "Business Domain & Email — 3conyx.com",
        detail: "Register the domain 3conyx.com (or your preferred domain) through a registrar like Cloudflare, Google Domains, or GoDaddy. Then set up business email addresses: legal@3conyx.com, privacy@3conyx.com, gdpr@3conyx.com, and support@3conyx.com. These are referenced in the Terms of Service and Privacy Policy and must be active before launch.",
        status: "pending-you",
        link: "https://www.cloudflare.com/products/registrar/",
        linkLabel: "Cloudflare Registrar →",
      },
      {
        title: "Twilio Account — SMS & WhatsApp Business",
        detail: "Create a Twilio account at twilio.com. Purchase a phone number for SMS. Apply for WhatsApp Business API access through Twilio — this requires Facebook Business Manager verification (takes 1-4 weeks). Once approved, configure your WhatsApp sender. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to your platform secrets.",
        status: "pending-you",
        link: "https://www.twilio.com/try-twilio",
        linkLabel: "Open Twilio →",
      },
      {
        title: "Set Platform Secrets (JWT_SECRET, ENCRYPTION_KEY)",
        detail: "Generate a strong JWT_SECRET (minimum 64 characters, cryptographically random) and ENCRYPTION_KEY (32 bytes, used for data encryption at rest). These must be set in the platform environment before launch. Without these, the auth system runs in development mode only.",
        status: "pending-you",
      },
    ],
  },
  {
    title: "Legal Compliance — Built Into the Platform",
    icon: Shield,
    items: [
      {
        title: "Terms of Service — Complete",
        detail: "Terms of Service covers: technology marketplace disclaimer (not a dealer/broker), insurance disclaimer, AI disclosure, TCPA consent language, telematics consent, Dynasty Wallet disclaimer (not a bank), arbitration clause, class action waiver, governing law (Florida), IP protection, and prohibited conduct.",
        status: "done",
      },
      {
        title: "Privacy Policy — Complete",
        detail: "Privacy policy covers: CCPA (California), GDPR (EU/UK), telematics and GPS data disclosure, marketing communications opt-in/out, legal basis for processing, data retention schedule, security measures, and all required contact email addresses.",
        status: "done",
      },
      {
        title: "TCPA Consent — Built Into Join Form",
        detail: "The founding member join form now requires explicit terms acceptance (required checkbox) and includes an optional SMS/WhatsApp marketing consent checkbox with proper opt-out instructions. The submit button is disabled until terms are accepted.",
        status: "done",
      },
      {
        title: "AI Disclosure — Built Into Platform",
        detail: "Terms of Service section 8 explicitly discloses that ONYX Concierge, Guardian, bid scoring, valuation tools, and other features are AI-powered. The platform requires member confirmation before any automated action is taken.",
        status: "done",
      },
      {
        title: "Member Covenant — Digital Legal Instrument",
        detail: "Every member who activates their account signs a digital covenant recorded with IP address, device fingerprint, timestamp, and SHA-256 hash. Stored permanently in the database. Cannot be unsigned.",
        status: "done",
      },
      {
        title: "Sovereignty & IP Protection",
        detail: "Honey token fingerprint embedded in codebase, 9 sovereignty headers on every API response, HTML meta tags, boot-time sovereignty declaration, and machine-readable /api/sovereignty endpoint. Platform is forensically fingerprinted at every layer.",
        status: "done",
      },
      {
        title: "IP Guard & Security",
        detail: "Autonomous IP ban system active. Failed auth attempts, scanner probes, and rate-limit violations trigger progressive bans. Permanent bans for automated scanners. 10 security layers active simultaneously.",
        status: "done",
      },
      {
        title: "Marketplace Disclaimer — Visible on Regulated Pages",
        detail: "Legal disclaimers are displayed on the marketplace, insurance, and wallet pages informing members that 3C ONYX is not a licensed dealer, insurance provider, or bank.",
        status: "done",
      },
    ],
  },
  {
    title: "Requires Attorney Before Launch",
    icon: Scale,
    items: [
      {
        title: "Automotive Marketplace Licensing — State by State",
        detail: "Before the vehicle marketplace goes live and transactions occur, an attorney licensed in your primary launch states must confirm whether you need an automotive dealer license, broker license, or whether your technology platform model qualifies for an exemption. This varies by state. Florida, Texas, and California have the most complex rules. Budget 4-8 weeks and $3,000-$8,000 for this review.",
        status: "needs-attorney",
      },
      {
        title: "Money Transmitter License or Exemption Opinion",
        detail: "The Dynasty Wallet holds transaction balances and moves money between parties. Even with Stripe processing payments, you need a legal opinion confirming that your specific wallet model qualifies for an exemption from state money transmitter licensing. This must be done before the wallet goes live with real member funds. Each state has its own rules — 50-state analysis is standard.",
        status: "needs-attorney",
      },
      {
        title: "Insurance Referral Compliance Review",
        detail: "Before the insurance section connects members to any insurance product, even through referrals, an attorney must confirm the compensation structure does not require an insurance producer license in your launch states. Some states prohibit any fee for insurance referrals without a license.",
        status: "needs-attorney",
      },
      {
        title: "ONYX Source Legal Services Category",
        detail: "ONYX Source allows members to procure legal services from vendors. An attorney must confirm that the platform's facilitation of legal services procurement does not constitute the unauthorized practice of law or require any legal services license. Standard for legal tech platforms.",
        status: "needs-attorney",
      },
      {
        title: "Governing State Consistency Review",
        detail: "The platform Terms reference Florida as the governing state. The LLC needs to be properly registered (or registered as a foreign LLC) in Florida if that is the governing jurisdiction. Attorney should confirm the entity structure is optimized for the platform's home state.",
        status: "needs-attorney",
      },
    ],
  },
  {
    title: "Third-Party Vendors — Awaiting Agreements",
    icon: Building2,
    items: [
      {
        title: "Checkr — Background Check Agreement",
        detail: "Checkr powers identity verification for Runners and Specialists. Before conducting background checks on real users, a signed Customer Agreement must be in place. Apply at checkr.com. Required before Runner Network goes live.",
        status: "pending-vendor",
        link: "https://checkr.com",
        linkLabel: "Checkr →",
      },
      {
        title: "MarketCheck API — Vehicle Data Agreement",
        detail: "MarketCheck provides vehicle market data, valuations, and inventory feeds. API key is in your secrets list. Confirm usage terms for commercial use before launch — particularly for displaying vehicle pricing data to members.",
        status: "pending-vendor",
      },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.bg} ${cfg.color} border text-xs gap-1`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

export default function PreLaunchReadiness() {
  const allItems = SECTIONS.flatMap((s) => s.items);
  const done       = allItems.filter((i) => i.status === "done").length;
  const total      = allItems.length;
  const pct        = Math.round((done / total) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs tracking-[0.3em] text-[#C9A84C] uppercase font-mono">
            Founder Command Only
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">
          PRE-LAUNCH <span className="text-[#C9A84C]">READINESS</span>
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Every item that must be completed before 3C ONYX goes live.
        </p>
      </div>

      {/* Progress bar */}
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-300 font-semibold">Overall Readiness</span>
            <span className="text-2xl font-black text-[#C9A84C]">{pct}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-[#C9A227] to-[#8B6914] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-6 mt-4">
            {(["done", "pending-you", "needs-attorney", "pending-vendor"] as Status[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const count = allItems.filter((i) => i.status === s).length;
              return (
                <div key={s} className="text-center">
                  <div className={`text-lg font-black ${cfg.color}`}>{count}</div>
                  <div className="text-xs text-zinc-600">{cfg.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title} className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-300 uppercase tracking-widest">
                <Icon className="w-4 h-4 text-[#C9A84C]" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 bg-zinc-950 rounded-lg border border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-white leading-tight">{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.detail}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#C9A84C] hover:text-yellow-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {item.linkLabel ?? item.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="text-center text-xs text-zinc-700 font-mono mt-8">
        CUXTOMCANDYCLUB LLC — 3C ONYX — SOVEREIGN ACTIVE
      </div>
    </div>
  );
}
