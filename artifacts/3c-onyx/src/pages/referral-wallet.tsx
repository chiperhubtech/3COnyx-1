import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet, TrendingUp, Users, DollarSign, ArrowUpRight,
  Copy, CheckCircle2, ChevronRight, Clock, Share2,
  Zap, X, Bell, Car, BarChart3, Sparkles,
} from "lucide-react";
import { maskBankAccount } from "@/lib/piiMask";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PassiveIncomeAlert {
  id: string;
  transactionId: string;
  referrerId: string;
  vehicle: string;
  amount: number;
  salePrice: number;
  splitPct: number;
  read: boolean;
  createdAt: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const payouts = [
  { id: "P-0041", referral: "Alexander Harrington", date: "Mar 18, 2026", vehicle: "Rolls-Royce Ghost Extended", amount: 5_890, bankAccount: "4532123456789012", status: "Paid" },
  { id: "P-0039", referral: "Natasha Worthington",  date: "Mar 15, 2026", vehicle: "Ferrari Purosangue",        amount: 6_190, bankAccount: "5500005555555559", status: "Paid" },
  { id: "P-0037", referral: "Vivienne Moreau",      date: "Mar 12, 2026", vehicle: "Bentley Continental GT",   amount: 2_749, bankAccount: "378282246310005",  status: "Paid" },
  { id: "P-0035", referral: "Marcus Bellamy",       date: "Mar 8, 2026",  vehicle: "McLaren Artura",           amount: 2_790, bankAccount: "3530111333300000", status: "Paid" },
  { id: "P-0043", referral: "Damien Castillo",      date: "Mar 25, 2026", vehicle: "Lamborghini Urus",         amount: 2_699, bankAccount: "6011111111111117", status: "Pending" },
  { id: "P-0044", referral: "Jordan St. Claire",    date: "Mar 27, 2026", vehicle: "Porsche 911 GT3 RS",       amount: 1_789, bankAccount: "4111111111111111", status: "Pending" },
];

const REFERRAL_CODE = "3CONYX-AH2026";
const REFERRER_ID   = "mem-001"; // Demo: Alexander Harrington

// ─── Passive Income Alert Toast ────────────────────────────────────────────────
function PassiveIncomeToast({
  alert,
  onDismiss,
}: {
  alert: PassiveIncomeAlert;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mount with animation
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] transition-all duration-350 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="w-80 rounded-2xl border border-amber-500/40 bg-[#0f0e09] shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 40px rgba(201,162,39,0.2), 0 8px 32px rgba(0,0,0,0.6)" }}>
        {/* Gold shimmer top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Passive Income Received</p>
                <button onClick={() => { setVisible(false); setTimeout(onDismiss, 350); }} className="text-white/20 hover:text-white/50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-2xl font-black text-white mb-0.5">
                +${alert.amount.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 truncate">{alert.vehicle}</p>
              <p className="text-[10px] text-amber-400/50 mt-1">
                20% of 3C profit · Sale: ${alert.salePrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Animated progress drain */}
          <div className="mt-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-amber-400/60 animate-[drain_8s_linear_forwards]"
              style={{ animation: "width 8s linear forwards", width: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Passive Income Alert Banner ───────────────────────────────────────────────
function PassiveIncomeBanner({ alerts, onDismissAll }: {
  alerts: PassiveIncomeAlert[];
  onDismissAll: () => void;
}) {
  if (alerts.length === 0) return null;
  const total = alerts.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/8 to-amber-600/4 p-4 mb-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-8 rounded-full bg-amber-400/10 blur-xl" />
      </div>

      <div className="flex items-center gap-4 relative">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-amber-300">
              {alerts.length === 1 ? "New Passive Income!" : `${alerts.length} Passive Income Alerts!`}
            </p>
            <span className="neural-badge neural-badge-gold">LIVE</span>
          </div>
          <p className="text-xs text-white/50">
            <span className="text-emerald-400 font-bold text-base">${total.toLocaleString()}</span>
            {" "}credited from{" "}
            {alerts.length === 1
              ? alerts[0].vehicle
              : `${alerts.length} vehicle sales`}
            {" "}— 20% of 3C profit split
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onDismissAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-500/15 space-y-1.5">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <Car className="w-3 h-3 text-amber-400/50 shrink-0" />
              <p className="text-xs text-white/40 flex-1 truncate">{a.vehicle}</p>
              <p className="text-xs font-bold text-amber-400 shrink-0">+${a.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReferralWallet() {
  const [copied, setCopied] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
  const [passiveAlerts, setPassiveAlerts] = useState<PassiveIncomeAlert[]>([]);
  const [toastAlert, setToastAlert] = useState<PassiveIncomeAlert | null>(null);
  const [totalPassive, setTotalPassive] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pending = payouts.filter((p) => p.status === "Pending");
  const paid    = payouts.filter((p) => p.status === "Paid");

  const copyCode = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Passive income polling (5s interval) ──
  const pollPassiveIncome = useCallback(async () => {
    try {
      const res = await fetch(`/api/dynasty/passive-income/${REFERRER_ID}`);
      if (!res.ok) return;
      const data: { alerts: PassiveIncomeAlert[]; count: number } = await res.json();
      if (data.count > 0) {
        setPassiveAlerts((prev) => [...data.alerts, ...prev]);
        setTotalPassive((t) => t + data.alerts.reduce((s, a) => s + a.amount, 0));
        // Show the last/newest alert as a toast
        setToastAlert(data.alerts[data.alerts.length - 1]);
      }
    } catch {
      // Network error — ignore
    }
  }, []);

  useEffect(() => {
    pollPassiveIncome(); // immediate first check
    pollRef.current = setInterval(pollPassiveIncome, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollPassiveIncome]);

  const dismissAllAlerts = () => setPassiveAlerts([]);

  const stats = [
    {
      label: "Total Earned",
      value: `$${(21_107 + totalPassive).toLocaleString()}`,
      sub: "All time",
      icon: DollarSign,
      trend: "+18.2%",
      color: "text-amber-400",
    },
    {
      label: "Passive Income",
      value: `$${totalPassive > 0 ? totalPassive.toLocaleString() : "0"}`,
      sub: "From Dynasty splits",
      icon: Sparkles,
      trend: totalPassive > 0 ? `+$${totalPassive.toLocaleString()}` : "Awaiting sales",
      color: totalPassive > 0 ? "text-emerald-400" : "text-white/30",
    },
    {
      label: "This Month",
      value: "$9,639",
      sub: "Mar 2026",
      icon: TrendingUp,
      trend: "+12.4%",
      color: "text-emerald-400",
    },
    {
      label: "Referrals",
      value: "6",
      sub: "Total clients",
      icon: Users,
      trend: "+2 this month",
      color: "text-white",
    },
  ];

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Wallet}
        accent="#C9A227"
        title="REFERRAL REWARDS"
        subtitle="1% commission + 20% Dynasty passive income on every closed deal"
        badge={
          <span className="neural-badge neural-badge-gold">
            {passiveAlerts.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black mr-1">
                {passiveAlerts.length}
              </span>
            )}
            STRIPE CONNECT
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {passiveAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">{passiveAlerts.length} alert{passiveAlerts.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            <button onClick={copyCode} className="ai-btn-ghost">
              <Share2 className="w-4 h-4" />
              Share Code
            </button>
          </div>
        }
      />
      <div className="p-6">

        {/* Passive income banner — shows when alerts arrive */}
        <PassiveIncomeBanner alerts={passiveAlerts} onDismissAll={dismissAllAlerts} />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
              <p className="text-[9px] text-white/20 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Dynasty passive income info */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">Dynasty Passive Income</p>
              <p className="text-xs text-white/40">
                As the original referrer, you automatically receive <span className="text-amber-400 font-bold">20% of 3C's profit</span> on every vehicle sale you referred — routed instantly via Stripe Connect. 
                Go to the <span className="text-amber-300 font-medium">Dynasty Wallet</span> to trigger a vehicle purchase and watch your Dynasty income arrive in real time.
              </p>
            </div>
          </div>
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
          <p className="text-xs text-white/25 mt-2">Share this code — earn 1% commission + 20% Dynasty passive income.</p>
        </div>

        {/* Passive income history */}
        {passiveAlerts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider">Passive Income — This Session ({passiveAlerts.length})</h2>
            </div>
            <div className="space-y-2">
              {passiveAlerts.map((a) => (
                <div key={a.id} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.vehicle}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      Sale: ${a.salePrice.toLocaleString()} · {new Date(a.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-400">+${a.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-400">20% of profit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Floating passive income toast */}
      {toastAlert && (
        <PassiveIncomeToast
          alert={toastAlert}
          onDismiss={() => setToastAlert(null)}
        />
      )}
    </div>
  );
}
