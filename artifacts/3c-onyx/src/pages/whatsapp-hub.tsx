/**
 * 3C ONYX — WhatsApp Business Hub
 *
 * The platform's main phone number — delivered through WhatsApp Business.
 * Members confirm ONYX actions, receive alerts, and chat with the concierge.
 * All through the world's most-used messaging app.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, CheckCircle2, AlertTriangle, Zap, Shield,
  Phone, Copy, ExternalLink, ChevronRight, Lock,
  Bell, Car, DollarSign, Activity, Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WAStatus {
  configured: boolean;
  mode: "live" | "simulation";
  from: string;
  templates: string[];
  webhookPath: string;
  setupSteps?: string[];
}

// ─── Static capability list ───────────────────────────────────────────────────

const CAPABILITIES = [
  {
    icon: <Car className="w-5 h-5" />,
    label: "Acquisition Confirmations",
    detail: "ONYX texts when a vehicle is secured. Reply CONFIRM. Done.",
    command: "CONFIRM",
    color: "#C9A227",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: "Insurance Activation",
    detail: "Savings locked. Reply ACTIVATE. ONYX switches your policy.",
    command: "ACTIVATE",
    color: "#34D399",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    label: "Finance & Refinance",
    detail: "Rate locked. Reply CONFIRM. ONYX handles all paperwork.",
    command: "CONFIRM",
    color: "#60A5FA",
  },
  {
    icon: <Activity className="w-5 h-5" />,
    label: "Emergency SOS",
    detail: "SOS triggers auto-dispatch. Reply SAFE if accidental.",
    command: "SAFE",
    color: "#F87171",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    label: "Weekly Digest",
    detail: "What ONYX did for you this week — delivered every Monday.",
    command: "SUMMARY",
    color: "#A78BFA",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "ONYX Concierge",
    detail: "Ask ONYX anything. Text freely — concierge always responds.",
    command: "Anything",
    color: "#F59E0B",
  },
];

const COMMANDS = [
  { cmd: "STATUS",  desc: "Your active items awaiting confirmation" },
  { cmd: "CONFIRM", desc: "Proceed with the pending ONYX action" },
  { cmd: "CANCEL",  desc: "Pause or dismiss the current action" },
  { cmd: "ACTIVATE",desc: "Activate insurance, finance, or service" },
  { cmd: "EXECUTE", desc: "Execute a pre-staged market strategy" },
  { cmd: "SUMMARY", desc: "Full weekly recap of what ONYX handled" },
  { cmd: "INFO",    desc: "How ONYX works via WhatsApp" },
  { cmd: "SAFE",    desc: "Cancel a false SOS alert" },
];

const SETUP_GUIDE = [
  { step: "1", title: "Create Twilio account", detail: "Go to twilio.com → sign up free. No credit card needed for sandbox.", link: "https://www.twilio.com/try-twilio" },
  { step: "2", title: "Get your credentials", detail: "Twilio Console → Account Info → copy Account SID and Auth Token." },
  { step: "3", title: "Buy a phone number", detail: "$1/month US number. Console → Phone Numbers → Buy a Number." },
  { step: "4", title: "Enable WhatsApp on the number", detail: "Console → Messaging → Senders → WhatsApp Senders → Enable." },
  { step: "5", title: "Set the webhook URL", detail: "Point it to: https://YOUR_DOMAIN/api/whatsapp/webhook" },
  { step: "6", title: "Add secrets to ONYX", detail: "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in Replit Secrets." },
  { step: "7", title: "Submit for Meta approval", detail: "Twilio submits on your behalf. Meta approves in 24–48 hours. Business profile goes live." },
];

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WhatsAppHub() {
  const [copied, setCopied] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testSent, setTestSent] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const { data: status, isLoading } = useQuery<WAStatus>({
    queryKey: ["whatsapp-status"],
    queryFn: () => fetch("/api/whatsapp/status").then(r => r.json()),
    refetchInterval: 30_000,
  });

  function handleCopy(text: string, key: string) {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function sendTest() {
    if (!testPhone.trim()) return;
    setTestSending(true);
    try {
      await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone.trim() }),
      });
      setTestSent(true);
    } finally {
      setTestSending(false);
    }
  }

  const isLive = status?.configured && status?.mode === "live";
  const phoneNumber = status?.from?.replace("whatsapp:", "") ?? "+1 (415) 523-8886";
  const displayNumber = isLive ? phoneNumber : "+1 (415) 523-8886";

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── Header ── */}
      <div
        className="px-5 pt-8 pb-6 border-b border-white/5"
        style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.05) 0%, transparent 50%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#25D366", boxShadow: "0 0 24px rgba(37,211,102,0.25)" }}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] text-[#25D366]/70 uppercase">3C ONYX · BUSINESS PLATFORM</p>
              <h1 className="text-2xl font-black tracking-tight">WhatsApp <span style={{ color: "#25D366" }}>Business</span></h1>
            </div>
          </div>
          <p className="text-xs text-gray-400 ml-15">The main platform phone number. Members confirm ONYX actions, receive alerts, and talk to the concierge — all through WhatsApp.</p>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
              style={isLive
                ? { background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }
                : { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }
              }
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isLive ? "#25D366" : "#F59E0B" }} />
              {isLoading ? "Checking…" : isLive ? "LIVE — WhatsApp Business Active" : "SETUP REQUIRED — Simulation Mode"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* ── Business Number Card ── */}
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.06) 0%, rgba(0,0,0,0) 100%)", borderColor: "rgba(37,211,102,0.2)" }}
        >
          <p className="text-[10px] font-black tracking-widest text-[#25D366]/60 uppercase mb-3">ONYX Business Number</p>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-3xl font-black text-white tracking-wider">{displayNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLive ? "Approved WhatsApp Business number" : "Twilio sandbox number (testing only)"}
              </p>
            </div>
            <button
              onClick={() => handleCopy(displayNumber, "number")}
              className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0"
              style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === "number" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://wa.me/${displayNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "#25D366", color: "#fff" }}
            >
              <MessageSquare className="w-4 h-4" />
              Open in WhatsApp
            </a>
            <button
              onClick={() => handleCopy(`https://wa.me/${displayNumber.replace(/\D/g, "")}`, "link")}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            >
              <ExternalLink className="w-4 h-4" />
              {copied === "link" ? "Copied!" : "Share Link"}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted by WhatsApp · All messages logged in ONYX CRM</span>
          </div>
        </div>

        {/* ── What members can do via WhatsApp ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">What Members Do Via This Number</p>
          <div className="space-y-3">
            {CAPABILITIES.map(c => (
              <div key={c.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${c.color}12`, color: c.color }}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{c.label}</p>
                    <code className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>
                      {c.command}
                    </code>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Command Reference ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">Member Command Reference</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMANDS.map(c => (
              <div key={c.cmd} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-white/5">
                <code className="text-[10px] font-black text-[#25D366] bg-[#25D366]/10 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">{c.cmd}</code>
                <p className="text-[11px] text-gray-400">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Any other text is routed to ONYX Concierge AI automatically.</p>
        </div>

        {/* ── Test Message (dev mode) ── */}
        {!isLive && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-[#C9A227]" />
              <p className="text-sm font-bold text-white">Send a Test Welcome Message</p>
            </div>
            <p className="text-xs text-gray-400 mb-4">Enter your WhatsApp number (with country code) to receive the ONYX welcome message. Requires sandbox credentials.</p>
            {testSent ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Message sent — check your WhatsApp
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="+1 555 000 0001"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#25D366]/40"
                />
                <button
                  onClick={sendTest}
                  disabled={!testPhone.trim() || testSending}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition-all"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  {testSending ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Setup Guide ── */}
        {!isLive && (
          <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/[0.03] p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#C9A227]" />
              <p className="text-sm font-bold text-white">Setup Required — 7 Steps · ~30 Minutes</p>
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-6">Follow these steps to get the ONYX WhatsApp Business number live for all members.</p>
            <div className="space-y-3">
              {SETUP_GUIDE.map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                    style={{ background: "rgba(201,162,39,0.15)", color: "#C9A227", border: "1px solid rgba(201,162,39,0.25)" }}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-[#25D366]">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl border border-white/5 bg-black/20">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Secrets to add to Replit</p>
              {["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"].map(key => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <code className="text-[11px] text-[#C9A227] font-bold">{key}</code>
                  <button onClick={() => handleCopy(key, key)} className="text-[9px] text-gray-500 hover:text-gray-300">
                    {copied === key ? "✓" : "copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How it connects to ONYX ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.01] p-5">
          <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-4">How WhatsApp Connects to ONYX</p>
          {[
            { from: "ONYX Intelligence Feed", to: "WhatsApp alert sent to member", icon: <Zap className="w-3.5 h-3.5" /> },
            { from: "Member replies CONFIRM", to: "ONYX executes the action", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { from: "SOS triggered on Safety Shield", to: "WhatsApp message to emergency contacts", icon: <Activity className="w-3.5 h-3.5" /> },
            { from: "Member texts anything", to: "ONYX Concierge AI responds", icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { from: "Service booked by ONYX", to: "WhatsApp confirmation with specialist details", icon: <Phone className="w-3.5 h-3.5" /> },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className="text-[#25D366]">{row.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{row.from}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">{row.to}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
