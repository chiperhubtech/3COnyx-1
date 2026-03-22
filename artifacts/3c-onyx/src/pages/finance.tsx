import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wifi,
  CreditCard,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Account = {
  id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
  balances: { available: number | null; current: number; limit: number | null; currency: string };
  institution: string;
  verified: boolean;
};

type Transaction = {
  id: string;
  date: string;
  name: string;
  amount: number;
  category: string;
  account_id: string;
  status: string;
};

type NetWorth = {
  net_worth: number;
  assets: number;
  liabilities: number;
  monthly_cash_flow: number;
  linked_accounts: number;
  simulated: boolean;
};

const ACCOUNT_COLORS: Record<string, string> = {
  depository: "#34D399",
  credit: "#F87171",
  investment: "#818CF8",
  loan: "#FBBF24",
};

const ACCOUNT_ICONS: Record<string, typeof Landmark> = {
  depository: Landmark,
  credit: CreditCard,
  investment: TrendingUp,
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function Finance() {
  const [linking, setLinking] = useState(false);

  const { data: netWorth, isLoading: nwLoading } = useQuery<NetWorth>({
    queryKey: ["plaid-net-worth"],
    queryFn: () => fetch(`${BASE}/api/plaid/net-worth`).then((r) => r.json()),
    refetchInterval: 60000,
  });

  const { data: accountsData, isLoading: acLoading } = useQuery<{ accounts: Account[]; total_assets: number }>({
    queryKey: ["plaid-accounts"],
    queryFn: () => fetch(`${BASE}/api/plaid/accounts`).then((r) => r.json()),
  });

  const { data: txData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["plaid-transactions"],
    queryFn: () => fetch(`${BASE}/api/plaid/transactions`).then((r) => r.json()),
  });

  const accounts = accountsData?.accounts ?? [];
  const transactions = txData?.transactions ?? [];

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: "linear-gradient(135deg, #06060a 0%, #0a0810 100%)" }}>
      <PageHeader
        icon={Landmark}
        accent="#4FC3F7"
        title="FINANCE HUB"
        badge={<span className="neural-badge">PLAID CONNECTED</span>}
        actions={
          <button
            onClick={() => setLinking(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(79,195,247,0.12)", border: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7" }}
          >
            <Wifi className="w-3.5 h-3.5" />
            {linking ? "Opening Plaid…" : "Link Account"}
          </button>
        }
      />

      {/* Net Worth Hero */}
      <div className="ai-card neural-glow-blue relative overflow-hidden p-6">
        <div className="neural-grid-overlay" />
        <div className="scan-line-overlay" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4FC3F7" }} />
            <span style={{ fontSize: "11px", color: "rgba(79,195,247,0.7)", fontWeight: 700, letterSpacing: "0.2em" }}>REAL-TIME NET WORTH</span>
          </div>
          {nwLoading ? (
            <div className="skeleton-line h-12 w-48 rounded-xl mt-2" />
          ) : (
            <p className="font-display text-5xl font-black mt-1" style={{ color: "#4FC3F7", letterSpacing: "-0.02em" }}>
              {fmt(netWorth?.net_worth ?? 0)}
            </p>
          )}
          <div className="flex gap-6 mt-4">
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>TOTAL ASSETS</p>
              <p style={{ color: "#34D399", fontWeight: 700, fontSize: "18px" }}>{fmt(netWorth?.assets ?? 0)}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>LIABILITIES</p>
              <p style={{ color: "#F87171", fontWeight: 700, fontSize: "18px" }}>{fmt(netWorth?.liabilities ?? 0)}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>MONTHLY FLOW</p>
              <p style={{ color: "#C9A227", fontWeight: 700, fontSize: "18px" }}>{fmt(netWorth?.monthly_cash_flow ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <Zap className="w-3 h-3" style={{ color: "#10B981" }} />
            <span style={{ fontSize: "9px", color: "#10B981", fontWeight: 700, letterSpacing: "0.15em" }}>PLAID LIVE</span>
          </div>
      </div>

      {/* Accounts Grid */}
      <div>
        <h2 className="section-label mb-3">LINKED ACCOUNTS</h2>
        {acLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((k) => <div key={k} className="skeleton-line h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const Icon = ACCOUNT_ICONS[acc.type] || Landmark;
              const color = ACCOUNT_COLORS[acc.type] || "#C9A227";
              const displayBalance = acc.type === "credit" ? Math.abs(acc.balances.current) : (acc.balances.available ?? acc.balances.current);
              return (
                <div key={acc.id} className="ai-card holographic-card p-5 group cursor-pointer transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{acc.institution}</p>
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>••••{acc.mask}</p>
                      </div>
                    </div>
                    {acc.verified && <ShieldCheck className="w-4 h-4" style={{ color: "#34D399" }} />}
                  </div>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: "4px" }}>
                    {acc.type === "credit" ? "BALANCE DUE" : acc.type === "investment" ? "PORTFOLIO VALUE" : "AVAILABLE"}
                  </p>
                  <p style={{ fontSize: "22px", fontWeight: 800, color, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmt(displayBalance)}
                  </p>
                  {acc.balances.limit && (
                    <div className="mt-2">
                      <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(Math.abs(acc.balances.current) / acc.balances.limit) * 100}%`, background: color, borderRadius: "2px" }} />
                      </div>
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "4px" }}>
                        {fmt(acc.balances.limit - Math.abs(acc.balances.current))} of {fmt(acc.balances.limit)} remaining
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", marginTop: "6px", textTransform: "capitalize" }}>
                    {acc.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">RECENT TRANSACTIONS</h2>
          <button className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="ai-card divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {transactions.map((tx) => {
            const isCredit = tx.amount < 0;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isCredit ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${isCredit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                  {isCredit ? <ArrowDownLeft className="w-4 h-4" style={{ color: "#34D399" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#F87171" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }} className="truncate">{tx.name}</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{tx.date} · {tx.category}</p>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: isCredit ? "#34D399" : "#F87171", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>
                  {isCredit ? "+" : "-"}{fmt(Math.abs(tx.amount))}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
