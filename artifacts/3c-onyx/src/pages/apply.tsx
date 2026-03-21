import { useState, useRef, useEffect } from "react";
import {
  Shield, CheckCircle2, AlertTriangle, ChevronRight, Eye, EyeOff,
  FileText, User, Lock, Loader2, BadgeCheck, AlertCircle, ArrowLeft,
  Car, Zap, Clock, X,
} from "lucide-react";

type BgcStatus = "pending" | "clear" | "consider" | null;
type Step = "welcome" | "privacy" | "personal" | "ssn" | "submitting" | "done";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const PRIVACY_NOTICE = `3C Onyx — SOC2 Type 1 Data Privacy Notice
Effective Date: March 21, 2026

1. DATA COLLECTED AT SUBMISSION
   When you apply to become a 3C Specialist, we collect your legal name,
   email address, driver's license state, and Social Security Number (SSN).

2. HOW YOUR SSN IS HANDLED
   Your SSN is transmitted using TLS 1.3 encryption directly to Checkr Inc.,
   our licensed Consumer Reporting Agency (CRA). Your SSN is:
   • NEVER written to 3C Onyx databases
   • NEVER logged in plaintext in our audit trail
   • NEVER stored on 3C Onyx servers at any point
   Checkr processes your SSN under their own Privacy Policy
   (checkr.com/privacy) and applicable FCRA regulations.

3. DRIVER'S LICENSE NUMBER
   Your driver's license number is transmitted directly to Checkr for identity
   verification. Only your license state (not number) is retained by 3C Onyx.

4. WHAT 3C ONYX RETAINS
   We store only: your name, masked email, DL state, Checkr's reference ID
   (a non-reversible token), and your BGC status (Pending / Clear / Consider).
   No raw PII (SSN, DL number) is retained on our infrastructure.

5. YOUR RIGHTS UNDER FCRA
   You have the right to:
   • Receive a copy of your background check report
   • Dispute inaccurate information with Checkr directly
   • Receive pre-adverse and adverse action notices before any employment
     decision is made based on your report

6. DATA RETENTION
   Your application record (name, status, Checkr ID) is retained for 7 years
   per FCRA requirements. You may request deletion of non-FCRA-required data
   by emailing privacy@3conyx.com.

7. THIRD-PARTY SHARING
   Your data is shared only with Checkr Inc. for background screening. It is
   not sold, rented, or shared with any marketing entity.

8. SOC2 COMPLIANCE
   All data flows are audited and logged in our tamper-evident Audit Vault.
   Audit records are SHA-256 hashed. No PII appears in audit logs.

By clicking "I Understand and Agree" below, you consent to this data
handling and authorize 3C Onyx to initiate a background check through
Checkr on your behalf.`;

// ─── BGC Result Card ──────────────────────────────────────────────────────────
function BgcResultCard({
  status,
  applicationId,
  candidateId,
  invitationUrl,
  simulated,
  name,
}: {
  status: BgcStatus;
  applicationId: number;
  candidateId: string;
  invitationUrl: string | null;
  simulated: boolean;
  name: string;
}) {
  const cfg = {
    clear: {
      icon: BadgeCheck,
      color: "text-emerald-400",
      bg: "border-emerald-500/30 bg-emerald-500/[0.06]",
      badge: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400",
      label: "BGC Clear",
      headline: "You're approved to join 3C!",
      sub: "Your background check came back clear. Welcome to the 3C Specialist network.",
    },
    consider: {
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "border-amber-500/30 bg-amber-500/[0.06]",
      badge: "bg-amber-400/10 border-amber-400/25 text-amber-400",
      label: "BGC Review",
      headline: "Under Review",
      sub: "Our compliance team will review your report and contact you within 2 business days. You have the right to dispute any findings.",
    },
    pending: {
      icon: Clock,
      color: "text-white/50",
      bg: "border-white/10 bg-white/[0.03]",
      badge: "bg-white/5 border-white/15 text-white/40",
      label: "BGC Pending",
      headline: "Background check in progress",
      sub: "Checkr is processing your report. Results typically arrive in 24–72 hours. We'll email you when complete.",
    },
  }[status ?? "pending"];

  const StatusIcon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-6 ${cfg.bg}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${cfg.badge} shrink-0`}>
          <StatusIcon className={`w-7 h-7 ${cfg.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">{cfg.headline}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-white/45">{cfg.sub}</p>
        </div>
      </div>

      {/* Application details */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Applicant</span>
          <span className="text-xs font-medium text-white">{name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Application ID</span>
          <span className="text-xs font-mono text-white/60">3C-{String(applicationId).padStart(6, "0")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Checkr Reference</span>
          <span className="text-xs font-mono text-white/40">***{candidateId.slice(-8)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Submitted</span>
          <span className="text-xs text-white/60">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      {/* Privacy confirmation */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 mb-4 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-400 mb-0.5">Zero-Storage Guarantee</p>
          <p className="text-[11px] text-emerald-400/60">
            Your SSN and DL number were transmitted directly to Checkr via TLS 1.3 and were never written to any 3C Onyx database or log.
          </p>
        </div>
      </div>

      {simulated && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 mb-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-400/60">
            <span className="font-semibold text-amber-400">Simulated result</span> — Add a Checkr API key to enable live background screening.
          </p>
        </div>
      )}

      {invitationUrl && status === "pending" && (
        <a
          href={invitationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
        >
          Complete Checkr Profile
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ─── Privacy Scroll Notice ────────────────────────────────────────────────────
function PrivacyNoticeStep({ onAccept }: { onAccept: (ts: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    if (atBottom) setScrolledToBottom(true);
  };

  const handleAccept = () => {
    if (!scrolledToBottom) return;
    setAccepted(true);
    setTimeout(() => onAccept(new Date().toISOString()), 400);
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">SOC2 Data Privacy Notice</h2>
          <p className="text-xs text-white/35">Read fully before continuing — scroll to the bottom to enable acceptance</p>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4 text-[11px] font-mono text-white/45 leading-relaxed whitespace-pre-wrap scrollbar-thin"
      >
        {PRIVACY_NOTICE}
      </div>

      {!scrolledToBottom && (
        <p className="text-[10px] text-amber-400/60 text-center mb-3 flex items-center justify-center gap-1">
          <ChevronRight className="w-3 h-3 rotate-90" />
          Scroll to the bottom to enable acceptance
        </p>
      )}

      <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all mb-4 ${
        scrolledToBottom
          ? accepted
            ? "border-emerald-500/30 bg-emerald-500/[0.05]"
            : "border-white/15 hover:border-white/25 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
      }`}>
        <input
          type="checkbox"
          disabled={!scrolledToBottom}
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 accent-amber-500"
        />
        <p className="text-xs text-white/60">
          I have read and understood the 3C Onyx SOC2 Data Privacy Notice. I consent to the collection and processing of my personal data as described, including the transmission of my SSN directly to Checkr Inc. for background screening purposes.
        </p>
      </label>

      <button
        onClick={handleAccept}
        disabled={!scrolledToBottom || !accepted}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          scrolledToBottom && accepted
            ? "bg-amber-500 hover:bg-amber-400 text-black"
            : "bg-white/5 text-white/20 cursor-not-allowed"
        }`}
      >
        {accepted ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        I Understand and Agree — Continue
      </button>
    </div>
  );
}

// ─── Personal Info Step ───────────────────────────────────────────────────────
function PersonalInfoStep({
  onNext,
  initial,
}: {
  onNext: (data: { firstName: string; lastName: string; email: string; dlNumber: string; dlState: string }) => void;
  initial: { firstName: string; lastName: string; email: string; dlNumber: string; dlState: string };
}) {
  const [form, setForm] = useState(initial);
  const [showDl, setShowDl] = useState(false);

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.dlNumber.trim().length >= 4 &&
    form.dlState;

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Personal Information</h2>
          <p className="text-xs text-white/35">Your DL number is sent to Checkr only — never stored here</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "First Name", key: "firstName", placeholder: "Alexander" },
            { label: "Last Name", key: "lastName", placeholder: "Harrington" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">{label}</label>
              <input
                type="text"
                value={form[key as keyof typeof form]}
                onChange={f(key)}
                placeholder={placeholder}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={f("email")}
            placeholder="you@example.com"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Driver's License Number</label>
            <div className="relative">
              <input
                type={showDl ? "text" : "password"}
                value={form.dlNumber}
                onChange={f("dlNumber")}
                placeholder="••••••••••"
                autoComplete="off"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 pr-10 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-amber-500/30 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowDl((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
              >
                {showDl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">State</label>
            <select
              value={form.dlState}
              onChange={f("dlState")}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30 transition-colors"
            >
              <option value="">—</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/8 text-[10px] text-white/30">
          <Shield className="w-3 h-3 text-amber-400/50 shrink-0 mt-0.5" />
          Your DL number is transmitted to Checkr via TLS 1.3. Only your DL state is retained by 3C Onyx. The DL number itself is never written to our databases.
        </div>
      </div>

      <button
        onClick={() => valid && onNext(form)}
        disabled={!valid}
        className={`mt-5 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          valid
            ? "bg-amber-500 hover:bg-amber-400 text-black"
            : "bg-white/5 text-white/20 cursor-not-allowed"
        }`}
      >
        Continue to SSN Entry
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── SSN Entry Step ───────────────────────────────────────────────────────────
function SsnStep({ onSubmit, loading }: { onSubmit: (ssn: string) => void; loading: boolean }) {
  const [ssn, setSsn] = useState("");
  const [showSsn, setShowSsn] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const ssnDigits = ssn.replace(/\D/g, "");
  const formatted = ssnDigits.length > 5
    ? `${ssnDigits.slice(0, 3)}-${ssnDigits.slice(3, 5)}-${ssnDigits.slice(5, 9)}`
    : ssnDigits.length > 3
    ? `${ssnDigits.slice(0, 3)}-${ssnDigits.slice(3)}`
    : ssnDigits;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
    setSsn(raw);
  };

  const valid = ssnDigits.length === 9 && agreed;

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Social Security Number</h2>
          <p className="text-xs text-white/35">Required by Checkr for FCRA-compliant background screening</p>
        </div>
      </div>

      {/* Zero-storage guarantee box */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-400">Zero-Storage Guarantee</p>
        </div>
        <div className="space-y-1.5">
          {[
            "Transmitted to Checkr only — over TLS 1.3 end-to-end",
            "Never written to any 3C Onyx database",
            "Never appears in our audit logs or server logs",
            "Not visible to any 3C Onyx employee",
            "Processed under FCRA and Checkr's privacy policy",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0" />
              <p className="text-[11px] text-emerald-400/60">{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SSN input */}
      <div className="mb-4">
        <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">
          Social Security Number
        </label>
        <div className="relative">
          <input
            type={showSsn ? "text" : "password"}
            value={showSsn ? formatted : ssnDigits.replace(/./g, "•").slice(0, Math.min(ssnDigits.length, 9))}
            onChange={handleChange}
            placeholder="•••-••-••••"
            autoComplete="off"
            data-form-type="other"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 pr-12 py-3.5 text-lg text-white placeholder-white/15 focus:outline-none focus:border-rose-500/30 transition-colors font-mono tracking-[0.2em] text-center"
          />
          <button
            type="button"
            onClick={() => setShowSsn((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
          >
            {showSsn ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {ssnDigits.length > 0 && ssnDigits.length < 9 && (
          <p className="text-[10px] text-amber-400/60 mt-1 ml-1">{9 - ssnDigits.length} more digits needed</p>
        )}
        {ssnDigits.length === 9 && (
          <p className="text-[10px] text-emerald-400/60 mt-1 ml-1 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> 9 digits entered
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer hover:border-white/20 transition-colors mb-5">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-amber-500"
        />
        <p className="text-[11px] text-white/50">
          I authorize 3C Onyx to submit my SSN to Checkr Inc. for the sole purpose of running a background check. I understand my SSN will not be stored by 3C Onyx.
        </p>
      </label>

      <button
        onClick={() => valid && onSubmit(ssnDigits)}
        disabled={!valid || loading}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          valid && !loading
            ? "bg-amber-500 hover:bg-amber-400 text-black"
            : "bg-white/5 text-white/20 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting to Checkr…
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Submit Application
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [privacyTs, setPrivacyTs] = useState("");
  const [personalData, setPersonalData] = useState({
    firstName: "", lastName: "", email: "", dlNumber: "", dlState: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    applicationId: number;
    candidateId: string;
    bgcStatus: BgcStatus;
    invitationUrl: string | null;
    simulated: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (ssn: string) => {
    setSubmitting(true);
    setStep("submitting");
    setError("");
    try {
      const res = await fetch("/api/specialists/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...personalData,
          ssn,
          privacyConsentAt: privacyTs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setResult({
        applicationId: data.applicationId,
        candidateId: data.checkrCandidateId,
        bgcStatus: data.bgcStatus,
        invitationUrl: data.invitationUrl,
        simulated: data.simulated,
      });
      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "An error occurred");
      setStep("ssn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Apply to be a 3C Specialist</h1>
          </div>
          <p className="text-white/40 text-sm ml-[52px]">Join the gig-workforce powering luxury automotive delivery</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["welcome", "privacy", "personal", "ssn"] as const).map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                step === s
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : ["done", "submitting"].includes(step) || ["welcome", "privacy", "personal", "ssn"].indexOf(step) > i
                  ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400"
                  : "border-white/10 text-white/20"
              }`}
            >
              {(["done", "submitting"].includes(step) || ["welcome", "privacy", "personal", "ssn"].indexOf(step) > i)
                ? <CheckCircle2 className="w-2.5 h-2.5" />
                : <span>{i + 1}</span>
              }
              {s === "welcome" ? "Intro" : s === "privacy" ? "Privacy" : s === "personal" ? "Info" : "SSN"}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        {/* ── WELCOME ── */}
        {step === "welcome" && (
          <div className="w-full max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-5">
              <h2 className="text-xl font-bold text-white mb-3">What is a 3C Specialist?</h2>
              <div className="space-y-3 mb-5">
                {[
                  { icon: Car,       text: "Deliver and transport ultra-premium vehicles — Rolls-Royce, Bentley, Ferrari, Lamborghini" },
                  { icon: Zap,       text: "Earn instantly — 95% of task payouts land in your account the moment you complete a delivery" },
                  { icon: BadgeCheck,text: "Work verified — all Specialists carry a Checkr BGC badge displayed to dealers and clients" },
                  { icon: Shield,    text: "SOC2 privacy — your SSN goes straight to Checkr. 3C Onyx never stores it." },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm text-white/55 mt-1">{text}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5 text-xs text-amber-400/70 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>You must be 21+ with a valid US driver's license. A federal background check is required under FCRA. Results are usually ready in 24–72 hours.</span>
              </div>
            </div>
            <button
              onClick={() => setStep("privacy")}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Begin Application
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── PRIVACY NOTICE ── */}
        {step === "privacy" && (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setStep("welcome")}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 mb-5 self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <PrivacyNoticeStep onAccept={(ts) => { setPrivacyTs(ts); setStep("personal"); }} />
          </div>
        )}

        {/* ── PERSONAL INFO ── */}
        {step === "personal" && (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setStep("privacy")}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 mb-5 self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <PersonalInfoStep
              initial={personalData}
              onNext={(data) => { setPersonalData(data); setStep("ssn"); }}
            />
          </div>
        )}

        {/* ── SSN ── */}
        {step === "ssn" && (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setStep("personal")}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 mb-5 self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            {error && (
              <div className="w-full max-w-lg mb-4 p-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}
            <SsnStep onSubmit={handleSubmit} loading={submitting} />
          </div>
        )}

        {/* ── SUBMITTING ── */}
        {step === "submitting" && (
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="w-16 h-16 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <Shield className="w-7 h-7 text-amber-400 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Submitting to Checkr…</h3>
            <p className="text-white/30 text-sm">Encrypting and transmitting your data securely</p>
            <div className="mt-4 space-y-1.5 text-left max-w-xs mx-auto">
              {["Validating identity documents", "Establishing TLS 1.3 connection to Checkr", "Transmitting credentials — not storing", "Initiating background screening"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-[11px] text-white/30">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400/50" style={{ animationDelay: `${i * 150}ms` }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && result && (
          <div className="w-full max-w-lg">
            <BgcResultCard
              status={result.bgcStatus}
              applicationId={result.applicationId}
              candidateId={result.candidateId}
              invitationUrl={result.invitationUrl}
              simulated={result.simulated}
              name={`${personalData.firstName} ${personalData.lastName}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
