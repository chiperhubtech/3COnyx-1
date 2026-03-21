import { Wallet, TrendingUp, Users, DollarSign, ArrowUpRight } from "lucide-react";
import { maskBankAccount } from "@/lib/piiMask";

const payouts = [
  {
    referral: "Alexander Harrington",
    date: "Mar 18, 2026",
    vehicle: "Rolls-Royce Phantom",
    amount: 5890,
    bankAccount: "4532123456789012",
    status: "Paid",
  },
  {
    referral: "Vivienne Moreau",
    date: "Mar 12, 2026",
    vehicle: "Bentley Continental GT",
    amount: 2749,
    bankAccount: "378282246310005",
    status: "Paid",
  },
  {
    referral: "Damien Castillo",
    date: "Mar 25, 2026",
    vehicle: "Lamborghini Urus",
    amount: 2699,
    bankAccount: "6011111111111117",
    status: "Pending",
  },
];

const stats = [
  { label: "Total Earned", value: "$11,338", icon: DollarSign, trend: "+12.4%" },
  { label: "Referrals This Month", value: "3", icon: Users, trend: "+1" },
  { label: "Avg. Commission", value: "$3,779", icon: TrendingUp, trend: "+8.1%" },
];

export default function ReferralWallet() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Referral Wallet</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">Commission earnings and payout history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <p className="text-xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payout history */}
      <div>
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">Payout History</h2>
        <div className="grid gap-3">
          {payouts.map((p) => (
            <div
              key={p.referral + p.date}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-semibold shrink-0">
                {p.referral.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{p.referral}</p>
                <p className="text-xs text-white/30">{p.vehicle} · {p.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">${p.amount.toLocaleString()}</p>
                <p className="text-xs font-mono text-white/25">{maskBankAccount(p.bankAccount)}</p>
              </div>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                  p.status === "Paid"
                    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                    : "text-amber-400 bg-amber-400/10 border-amber-400/30"
                }`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
