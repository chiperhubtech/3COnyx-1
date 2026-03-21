import { useState } from "react";
import { Wallet, TrendingUp, Users, DollarSign, ArrowUpRight, Copy, CheckCircle2, ChevronRight, Clock, Share2 } from "lucide-react";
import { maskBankAccount } from "@/lib/piiMask";
import { PageHeader } from "@/components/PageHeader";

const payouts = [
  { id: "P-0041", referral: "Alexander Harrington", date: "Mar 18, 2026", vehicle: "Rolls-Royce Ghost Extended", amount: 5890, bankAccount: "4532123456789012", status: "Paid" },
  { id: "P-0039", referral: "Natasha Worthington", date: "Mar 15, 2026", vehicle: "Ferrari Purosangue", amount: 6190, bankAccount: "5500005555555559", status: "Paid" },
  { id: "P-0037", referral: "Vivienne Moreau", date: "Mar 12, 2026", vehicle: "Bentley Continental GT", amount: 2749, bankAccount: "378282246310005", status: "Paid" },
  { id: "P-0035", referral: "Marcus Bellamy", date: "Mar 8, 2026", vehicle: "McLaren Artura", amount: 2790, bankAccount: "3530111333300000", status: "Paid" },
  { id: "P-0043", referral: "Damien Castillo", date: "Mar 25, 2026", vehicle: "Lamborghini Urus", amount: 2699, bankAccount: "6011111111111117", status: "Pending" },
  { id: "P-0044", referral: "Jordan St. Claire", date: "Mar 27, 2026", vehicle: "Porsche 911 GT3 RS", amount: 1789, bankAccount: "4111111111111111", status: "Pending" },
];

const stats = [
  { label: "Total Earned", value: "$21,107", sub: "All time", icon: DollarSign, trend: "+18.2%", color: "text-amber-400" },
  { label: "This Month", value: "$9,639", sub: "Mar 2026", icon: TrendingUp, trend: "+12.4%", color: "text-emerald-400" },
  { label: "Referrals", value: "6", sub: "Total clients", icon: Users, trend: "+2 this month", color: "text-white" },
];

const REFERRAL_CODE = "3CONYX-AH2026";

export default function ReferralWallet() {
  const [copied, setCopied] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<string | null>(null);

  const copyCode = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pending = payouts.filter((p) => p.status === "Pending");
  const paid = payouts.filter((p) => p.status === "Paid");

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Wallet}
        accent="#C9A227"
        title="REFERRAL REWARDS"
        subtitle="1% commission on every closed deal you refer"
        badge={<span className="neural-badge neural-badge-gold">STRIPE CONNECT</span>}
        actions={
          <button
            onClick={copyCode}
            className="ai-btn-ghost"
          >
            <Share2 className="w-4 h-4" />
            Share Code
          </button>
        }
      />
      <div className="p-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="ai-stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                {s.trend}
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral code */}
      <div className="ai-insight-card mb-6" style={{ borderColor: "rgba(201,162,39,0.3)" }}>
        <p className="text-xs text-amber-400/70 uppercase tracking-wider font-medium mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <p className="font-mono text-lg text-white font-semibold tracking-widest flex-1">{REFERRAL_CODE}</p>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-white/25 mt-2">Share this code — earn 1% commission on every closed deal.</p>
      </div>

      {/* Pending payouts */}
      {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider">Pending ({pending.length})</h2>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPayout(selectedPayout === p.id ? null : p.id)}
                className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4 hover:bg-amber-500/[0.06] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 text-xs font-semibold shrink-0">
                    {p.referral.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{p.referral}</p>
                    <p className="text-xs text-white/30 truncate">{p.vehicle} · {p.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-400">${p.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-amber-400/40">Awaiting approval</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${selectedPayout === p.id ? "rotate-90" : ""}`} />
                </div>
                {selectedPayout === p.id && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Payout Account</p>
                      <p className="text-xs font-mono text-white/40">{maskBankAccount(p.bankAccount)}</p>
                    </div>
                    <p className="text-[10px] font-mono text-white/20">{p.id}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider">Paid Out ({paid.length})</h2>
        </div>
        <div className="space-y-2">
          {paid.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPayout(selectedPayout === p.id ? null : p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs font-semibold shrink-0">
                  {p.referral.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">{p.referral}</p>
                  <p className="text-xs text-white/25 truncate">{p.vehicle} · {p.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white/70">${p.amount.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-400/60 font-medium">Paid</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-white/15 transition-transform shrink-0 ${selectedPayout === p.id ? "rotate-90" : ""}`} />
              </div>
              {selectedPayout === p.id && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Payout Account</p>
                    <p className="text-xs font-mono text-white/35">{maskBankAccount(p.bankAccount)}</p>
                  </div>
                  <p className="text-[10px] font-mono text-white/15">{p.id}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
