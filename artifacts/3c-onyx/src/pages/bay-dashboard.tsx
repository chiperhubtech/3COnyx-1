/**
 * 3C Onyx Web — Smart Bay Traffic Dashboard
 * Real-time visibility into bay slots, Pay-at-the-Bay QR transactions,
 * runner dividends, and rush request queue.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, DollarSign,
  Layers, QrCode, RefreshCw, Shield, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Slot = {
  id: string;
  shopId: string;
  bayNumber: string;
  vehicleVin: string | null;
  technicianId: string | null;
  status: "available" | "in_progress" | "ready" | "closed";
  rushApproved: boolean;
  estimatedCompletionAt: string | null;
  notes: string | null;
  createdAt: string;
};

type Transaction = {
  id: string;
  qrCode: string;
  serviceType: string;
  serviceLabel: string;
  grossAmountCents: number;
  feeCents: number;
  netCents: number;
  dividendCents: number;
  status: "pending" | "paid" | "failed";
  customerName: string;
  vehicleVin: string | null;
  createdAt: string;
};

function statusColor(s: Slot["status"]) {
  return {
    available:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    in_progress: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    ready:       "text-blue-400 bg-blue-400/10 border-blue-400/20",
    closed:      "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  }[s] ?? "text-zinc-400";
}

function txStatusColor(s: Transaction["status"]) {
  return {
    paid:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    failed:  "text-red-400 bg-red-400/10 border-red-400/20",
  }[s] ?? "";
}

function cents(c: number) { return `$${(c / 100).toFixed(2)}`; }

function StatTile({ icon: Icon, label, value, sub, color }: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-5">
      <div className={cn("rounded-xl p-2.5", color)}>
        <Icon size={18} className="opacity-90" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function BayDashboard() {
  const [filter, setFilter] = useState<Slot["status"] | "all">("all");

  const {
    data: slots = [],
    isLoading: slotsLoading,
    refetch: refetchSlots,
    dataUpdatedAt: slotsUpdated,
  } = useQuery<Slot[]>({
    queryKey: ["bay-slots"],
    queryFn:  () => fetch(`${BASE}/api/bay/slots`, { credentials: "include" }).then(r => r.json()),
    refetchInterval: 20_000,
  });

  const {
    data: transactions = [],
    isLoading: txLoading,
  } = useQuery<Transaction[]>({
    queryKey: ["bay-transactions"],
    queryFn:  () => fetch(`${BASE}/api/bay/qr/all`, { credentials: "include" }).then(r => r.json()).catch(() => []),
    refetchInterval: 20_000,
  });

  const filteredSlots = filter === "all" ? slots : slots.filter(s => s.status === filter);

  const totalGross    = transactions.filter(t => t.status === "paid").reduce((a, t) => a + t.grossAmountCents, 0);
  const totalFees     = transactions.filter(t => t.status === "paid").reduce((a, t) => a + t.feeCents, 0);
  const totalDividend = transactions.filter(t => t.status === "paid").reduce((a, t) => a + t.dividendCents, 0);
  const rushCount     = slots.filter(s => s.rushApproved).length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-20">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 flex items-center justify-between sticky top-0 bg-[#0A0A0B]/90 backdrop-blur-lg z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={16} className="text-[#C9A227]" />
            <span className="text-xs text-[#C9A227] font-bold tracking-widest uppercase">Smart Bay</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Bay Traffic Dashboard</h1>
          {slotsUpdated > 0 && (
            <p className="text-xs text-zinc-600 mt-1">
              Last updated {new Date(slotsUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => { void refetchSlots(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all"
        >
          <RefreshCw size={13} className={slotsLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={Layers}     label="Active Bays"     value={String(slots.filter(s => s.status === "in_progress").length)} sub={`${slots.length} total slots`}      color="bg-yellow-400/10 text-yellow-400" />
          <StatTile icon={DollarSign} label="Volume (Paid)"   value={cents(totalGross)}                                                sub="pay-at-the-bay"                   color="bg-emerald-400/10 text-emerald-400" />
          <StatTile icon={QrCode}     label="3% Fee Collected" value={cents(totalFees)}                                               sub={`${cents(totalDividend)} to runners`} color="bg-[#C9A227]/10 text-[#C9A227]" />
          <StatTile icon={Zap}        label="Rush Queue"       value={String(rushCount)}                                               sub="manager-approved"                  color="bg-red-400/10 text-red-400" />
        </div>

        {/* Bay Slots */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Bay Slots</h2>
            <div className="flex gap-2">
              {(["all", "available", "in_progress", "ready", "closed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    filter === f
                      ? "bg-[#C9A227] text-black"
                      : "bg-white/5 text-zinc-500 hover:text-white",
                  )}
                >
                  {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {slotsLoading ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <Activity size={24} className="mx-auto text-zinc-600 animate-pulse" />
              <p className="text-sm text-zinc-600 mt-3">Loading bay data…</p>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
              <CheckCircle2 size={24} className="mx-auto text-zinc-600" />
              <p className="text-sm text-zinc-600 mt-3">No slots matching this filter.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {["Bay", "VIN", "Status", "Rush", "ETA", "Notes"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.map((slot, i) => (
                    <tr key={slot.id} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "" : "bg-white/[0.01]")}>
                      <td className="px-4 py-3 font-bold text-white">{slot.bayNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{slot.vehicleVin ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-lg border", statusColor(slot.status))}>
                          {slot.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {slot.rushApproved
                          ? <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><Zap size={12} /> RUSH</span>
                          : <span className="text-zinc-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {slot.estimatedCompletionAt
                          ? new Date(slot.estimatedCompletionAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 max-w-[200px] truncate">{slot.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Transactions */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Pay-at-the-Bay Transactions</h2>
          {txLoading ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
              <QrCode size={24} className="mx-auto text-zinc-600 animate-pulse" />
              <p className="text-sm text-zinc-600 mt-3">Loading transactions…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center">
              <QrCode size={24} className="mx-auto text-zinc-600" />
              <p className="text-sm text-zinc-600 mt-3">No pay-at-the-bay transactions yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Generate your first QR code in the mobile app → Wallet → Pay at the Bay.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {["Code", "Service", "Customer", "Gross", "Fee (3%)", "Net", "Runner Div.", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={tx.id} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "" : "bg-white/[0.01]")}>
                      <td className="px-4 py-3 font-mono text-xs text-[#C9A227]">{tx.qrCode}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{tx.serviceLabel}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{tx.customerName}</td>
                      <td className="px-4 py-3 font-bold text-white">{cents(tx.grossAmountCents)}</td>
                      <td className="px-4 py-3 text-yellow-400 text-xs font-semibold">{cents(tx.feeCents)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{cents(tx.netCents)}</td>
                      <td className="px-4 py-3 text-purple-400 text-xs font-semibold">{cents(tx.dividendCents)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-lg border", txStatusColor(tx.status))}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Fee breakdown reminder */}
        <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/5 p-5 flex items-start gap-4">
          <Shield size={18} className="text-[#C9A227] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#C9A227] mb-1">3% Technology Fee — Automatic Split</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Every Pay-at-the-Bay transaction automatically deducts a 3% platform fee.
              25% of that fee (0.75% of gross) is distributed as a dividend to the referring Runner.
              All splits are cryptographically recorded and immutable.
            </p>
          </div>
        </div>

        {/* Rush queue alert if any */}
        {rushCount > 0 && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 flex items-start gap-4">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">{rushCount} Rush Request{rushCount > 1 ? "s" : ""} Active</p>
              <p className="text-xs text-zinc-500">
                Rush requests require prior vehicle READY status confirmed by a technician. Verify each slot above.
              </p>
            </div>
          </div>
        )}

        {/* Last refresh */}
        <p className="text-xs text-zinc-700 text-center">
          <Clock size={11} className="inline mr-1" />
          Bay data auto-refreshes every 20 seconds
        </p>
      </div>
    </div>
  );
}
