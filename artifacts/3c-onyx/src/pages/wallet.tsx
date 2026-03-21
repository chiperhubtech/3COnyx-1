import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, TrendingUp, DollarSign, Zap, Clock,
  CheckCircle2, AlertCircle, ExternalLink, ChevronRight,
  RefreshCw, Loader2, ArrowUpRight, Shield, Percent,
  ArrowDownLeft, X, BadgeCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  stripeConnectId: string | null;
  connectStatus: "connected" | "pending" | "not_connected";
  bankLast4: string | null;
}

interface SliceTransaction {
  id: string;
  taskId: string;
  taskTitle: string;
  vehicle: string;
  taskPayout: number;
  memberSlice: number;
  slicePct: number;
  status: "paid" | "pending" | "processing";
  createdAt: string;
  paidAt: string | null;
  stripeTransferId: string | null;
  runnerName: string;
}

interface Wallet {
  memberId: string;
  totalEarned: number;
  pendingAmount: number;
  availableForPayout: number;
  lastPayoutAt: string | null;
  transactions: SliceTransaction[];
}

const txnStatusStyle: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/25",
};

// ─── Simulate Payout Modal ─────────────────────────────────────────────────────
function SimulatePayoutModal({
  member,
  onClose,
  onSuccess,
}: {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ memberSlice: number; stripeTransferId: string | null } | null>(null);

  const DEMO_TASKS = [
    { taskId: "task-demo-1", taskTitle: "Dealer Swap", vehicle: "2024 Porsche 911 GT3", taskPayout: 38000, runnerName: "Marcus Webb" },
    { taskId: "task-demo-2", taskTitle: "Client Delivery", vehicle: "2024 Bentley Flying Spur", taskPayout: 55000, runnerName: "Priya Rao" },
    { taskId: "task-demo-3", taskTitle: "Auction Transport", vehicle: "2023 McLaren Artura", taskPayout: 72000, runnerName: "Nikolai Petrov" },
  ];

  const [selected, setSelected] = useState(DEMO_TASKS[0]);

  const trigger = async () => {
    setSubmitting(true);
    const res = await fetch("/api/wallet/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...selected, referrerId: member.id }),
    });
    const data = await res.json();
    setResult(data);
    setDone(true);
    setSubmitting(false);
    setTimeout(onSuccess, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl overflow-hidden">
        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Member Slice Sent!</h3>
            <p className="text-white/40 text-sm mb-1">
              <span className="text-emerald-400 font-bold text-base">${result?.memberSlice.toLocaleString()}</span> (5%) transferred instantly
            </p>
            {result?.stripeTransferId && (
              <p className="text-xs font-mono text-white/20 mb-4">{result.stripeTransferId}</p>
            )}
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <p className="text-white font-semibold text-sm">Trigger Member Slice</p>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-white/30 mb-3">Select a completed GigTask to trigger the 5% payout to {member.name.split(" ")[0]}:</p>
              <div className="space-y-2 mb-4">
                {DEMO_TASKS.map((t) => (
                  <button
                    key={t.taskId}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                      selected.taskId === t.taskId
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="font-medium text-white text-xs">{t.vehicle}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-white/35">{t.taskTitle} · {t.runnerName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-white/35">Payout: ${t.taskPayout.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-400">→ ${(t.taskPayout * 0.05).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                <Percent className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-400/70">
                  5% Member Slice of <span className="font-bold text-amber-300">${selected.taskPayout.toLocaleString()}</span> = <span className="font-bold text-amber-300">${(selected.taskPayout * 0.05).toLocaleString()}</span> transferred instantly via Stripe Connect.
                </p>
              </div>
              <button
                onClick={trigger}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Processing…" : "Send Member Slice Now"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Connect Stripe Modal ──────────────────────────────────────────────────────
function ConnectStripeModal({
  member,
  onClose,
  onConnected,
}: {
  member: Member;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [step, setStep] = useState<"intro" | "onboarding" | "done">("intro");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const res = await fetch("/api/wallet/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id }),
    });
    const data = await res.json();

    if (data.onboardingUrl) {
      window.open(data.onboardingUrl, "_blank");
      setStep("onboarding");
    } else {
      // Simulated — skip to done
      setStep("onboarding");
      setTimeout(async () => {
        await fetch("/api/wallet/connect/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id }),
        });
        setStep("done");
        setTimeout(onConnected, 1200);
      }, 2200);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={step === "intro" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#635bff] flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white font-semibold text-sm">Connect with Stripe</p>
          </div>
          {step === "intro" && <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>}
        </div>
        <div className="p-5">
          {step === "intro" && (
            <>
              <div className="space-y-3 mb-5">
                {[
                  { icon: Zap, text: "Instant payouts — 5% Member Slice lands in your account the moment a task is completed" },
                  { icon: Shield, text: "Bank-grade security via Stripe Express — 3C Onyx never stores your bank details" },
                  { icon: BadgeCheck, text: "Supports direct deposit, debit cards, and international transfers" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-xs text-white/50 mt-1">{text}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#635bff] hover:bg-[#7a72ff] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {loading ? "Opening Stripe…" : "Continue with Stripe"}
              </button>
              <p className="text-[10px] text-white/20 text-center mt-3">Powered by Stripe Connect Express · 256-bit TLS</p>
            </>
          )}

          {step === "onboarding" && (
            <div className="py-6 text-center">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#635bff]/20 border-t-[#635bff] animate-spin" />
                <CreditCard className="w-5 h-5 text-[#635bff] absolute inset-0 m-auto" />
              </div>
              <p className="text-white font-medium text-sm mb-1">Setting up your account…</p>
              <p className="text-white/30 text-xs">Connecting to Stripe Express</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Stripe Connected!</p>
              <p className="text-white/35 text-xs mt-1">You'll receive instant payouts on every completed task.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({
  member,
  wallet,
  isActive,
  onClick,
}: {
  member: Member;
  wallet: Wallet;
  isActive: boolean;
  onClick: () => void;
}) {
  const connectColor =
    member.connectStatus === "connected"
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"
      : member.connectStatus === "pending"
      ? "text-amber-400 bg-amber-400/10 border-amber-400/25"
      : "text-white/30 bg-white/5 border-white/10";

  const connectLabel =
    member.connectStatus === "connected" ? "Stripe Connected"
    : member.connectStatus === "pending" ? "Onboarding"
    : "Not Connected";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
        isActive
          ? "border-amber-500/30 bg-amber-500/[0.06]"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-semibold text-xs shrink-0">
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${connectColor}`}>
            {connectLabel}
          </span>
          <p className="text-[10px] text-emerald-400/70 font-medium">${wallet.totalEarned.toLocaleString()} earned</p>
        </div>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${isActive ? "text-amber-400 rotate-90" : "text-white/15"}`} />
    </button>
  );
}

// ─── Wallet Detail ─────────────────────────────────────────────────────────────
function WalletDetail({
  member: initialMember,
  wallet: initialWallet,
  stripeMode,
  onRefresh,
}: {
  member: Member;
  wallet: Wallet;
  stripeMode: "live" | "demo";
  onRefresh: () => void;
}) {
  const [member, setMember] = useState(initialMember);
  const [wallet, setWallet] = useState(initialWallet);
  const [showConnect, setShowConnect] = useState(false);
  const [showPayout, setShowPayout] = useState(false);

  useEffect(() => { setMember(initialMember); setWallet(initialWallet); }, [initialMember, initialWallet]);

  const handleConnected = async () => {
    setShowConnect(false);
    // Refetch member state
    const res = await fetch(`/api/wallet/${member.id}`);
    if (res.ok) {
      const data = await res.json();
      setMember(data.member);
      setWallet(data.wallet);
    }
  };

  const handlePayoutSuccess = async () => {
    setShowPayout(false);
    const res = await fetch(`/api/wallet/${member.id}`);
    if (res.ok) {
      const data = await res.json();
      setMember(data.member);
      setWallet(data.wallet);
    }
    onRefresh();
  };

  const isConnected = member.connectStatus === "connected";

  return (
    <div className="flex-1 min-w-0">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Earned</p>
          </div>
          <p className="text-2xl font-bold text-white">${wallet.totalEarned.toLocaleString()}</p>
          <p className="text-[10px] text-white/25 mt-0.5">All time (5% slices)</p>
        </div>
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">${wallet.pendingAmount.toLocaleString()}</p>
          <p className="text-[10px] text-white/25 mt-0.5">Awaiting confirmation</p>
        </div>
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Available</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${wallet.availableForPayout.toLocaleString()}</p>
          <p className="text-[10px] text-white/25 mt-0.5">
            {wallet.lastPayoutAt
              ? `Last: ${new Date(wallet.lastPayoutAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "No payouts yet"}
          </p>
        </div>
      </div>

      {/* Stripe Connect status + actions */}
      <div className={`rounded-xl border p-4 mb-5 flex items-center gap-3 ${
        isConnected
          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : "border-amber-500/20 bg-amber-500/[0.04]"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isConnected ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#635bff]/10 border border-[#635bff]/20"
        }`}>
          <CreditCard className={`w-5 h-5 ${isConnected ? "text-emerald-400" : "text-[#9c95ff]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white">
              {isConnected ? "Stripe Connect Active" : "Connect Stripe for Instant Payouts"}
            </p>
            {stripeMode === "demo" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">DEMO</span>
            )}
          </div>
          {isConnected ? (
            <p className="text-xs text-emerald-400/60">
              {member.bankLast4
                ? `Account ending ••••${member.bankLast4}`
                : "Connected account active"} — instant transfers enabled
            </p>
          ) : (
            <p className="text-xs text-white/35">
              {member.connectStatus === "pending"
                ? "Onboarding in progress — complete Stripe verification to receive payouts"
                : "Link your bank account to receive 5% Member Slices automatically"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <button
              onClick={() => setShowPayout(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Trigger Slice
            </button>
          ) : (
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#635bff] hover:bg-[#7a72ff] text-white font-semibold text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {member.connectStatus === "pending" ? "Resume Onboarding" : "Connect Stripe"}
            </button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Transaction History</p>
          {wallet.transactions.length > 0 && (
            <p className="text-[10px] text-white/20">{wallet.transactions.length} records</p>
          )}
        </div>

        {wallet.transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <DollarSign className="w-6 h-6 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/25">No transactions yet</p>
            <p className="text-[11px] text-white/15 mt-0.5">Member Slices appear here when GigTasks complete</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((txn) => (
              <div key={txn.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    txn.status === "paid"
                      ? "bg-emerald-400/10 border border-emerald-400/20"
                      : "bg-amber-400/10 border border-amber-400/20"
                  }`}>
                    {txn.status === "paid"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <Clock className="w-4 h-4 text-amber-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{txn.vehicle}</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          {txn.taskTitle} · {txn.runnerName} · {txn.slicePct}% slice
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-emerald-400">+${txn.memberSlice.toLocaleString()}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${txnStatusStyle[txn.status]}`}>
                          {txn.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] text-white/20">
                        Task payout: ${txn.taskPayout.toLocaleString()} ·{" "}
                        {new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      {txn.stripeTransferId && (
                        <div className="flex items-center gap-1 text-[10px] text-white/20">
                          <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400/50" />
                          <span className="font-mono">{txn.stripeTransferId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConnect && <ConnectStripeModal member={member} onClose={() => setShowConnect(false)} onConnected={handleConnected} />}
      {showPayout && <SimulatePayoutModal member={member} onClose={() => setShowPayout(false)} onSuccess={handlePayoutSuccess} />}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [activeMemberId, setActiveMemberId] = useState<string>("mem-001");
  const [loading, setLoading] = useState(true);
  const [stripeMode, setStripeMode] = useState<"live" | "demo">("demo");

  const fetchAll = useCallback(async () => {
    try {
      const [membersRes, stripeRes] = await Promise.all([
        fetch("/api/wallet/members"),
        fetch("/api/wallet/stripe/status"),
      ]);
      const membersData = await membersRes.json();
      const stripeData = await stripeRes.json();
      const mems: Member[] = membersData.members ?? [];
      setMembers(mems);
      setStripeMode(stripeData.mode ?? "demo");

      // Fetch each member's wallet in parallel
      const walletEntries = await Promise.all(
        mems.map(async (m) => {
          const r = await fetch(`/api/wallet/${m.id}`);
          if (r.ok) {
            const d = await r.json();
            return [m.id, d.wallet] as const;
          }
          return [m.id, { memberId: m.id, totalEarned: 0, pendingAmount: 0, availableForPayout: 0, lastPayoutAt: null, transactions: [] }] as const;
        })
      );
      setWallets(Object.fromEntries(walletEntries));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeMember = members.find((m) => m.id === activeMemberId);
  const activeWallet = wallets[activeMemberId] ?? {
    memberId: activeMemberId, totalEarned: 0, pendingAmount: 0,
    availableForPayout: 0, lastPayoutAt: null, transactions: [],
  };

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={CreditCard}
        accent="#34D399"
        title="MEMBER WALLET"
        subtitle="5% Member Slice — instant Stripe Connect payouts on every GigTask"
        badge={
          <span className={`neural-badge ${stripeMode === "live" ? "neural-badge-green" : "neural-badge-gold"}`}>
            <span className={`${stripeMode === "live" ? "ai-live-dot" : "ai-live-dot-gold"} mr-1`} />
            {stripeMode === "live" ? "STRIPE LIVE" : "DEMO MODE"}
          </span>
        }
        actions={
          <button onClick={fetchAll} className="ai-btn-ghost">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />
      <div className="p-6">

      {/* Info banner — demo mode */}
      {stripeMode === "demo" && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 mb-5 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">Stripe Connect — Demo Mode</p>
            <p className="text-xs text-amber-400/50">
              Connect your Stripe account to enable real instant transfers. All payout logic, 5% calculations, and transfer IDs are fully built — payouts will execute in real time the moment your Stripe key is added.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-white/[0.03] border border-white/8" />)}
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Member list */}
          <div className="w-64 shrink-0 space-y-2">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Members</p>
            {members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                wallet={wallets[m.id] ?? { memberId: m.id, totalEarned: 0, pendingAmount: 0, availableForPayout: 0, lastPayoutAt: null, transactions: [] }}
                isActive={m.id === activeMemberId}
                onClick={() => setActiveMemberId(m.id)}
              />
            ))}
          </div>

          {/* Wallet detail */}
          {activeMember && (
            <WalletDetail
              key={activeMemberId}
              member={activeMember}
              wallet={activeWallet}
              stripeMode={stripeMode}
              onRefresh={fetchAll}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
