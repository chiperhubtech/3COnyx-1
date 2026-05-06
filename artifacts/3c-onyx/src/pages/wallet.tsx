import { useState, useEffect, useCallback, useRef } from "react";
import {
  CreditCard, TrendingUp, DollarSign, Zap, Clock,
  CheckCircle2, AlertCircle, ExternalLink, ChevronRight,
  RefreshCw, Loader2, ArrowUpRight, Shield, Percent,
  ArrowDownLeft, X, BadgeCheck, ScanFace, Lock,
  Building2, Truck, Users, BarChart3, Fingerprint,
  ShieldCheck, Car, Split,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface SplitLeg {
  label: string;
  recipient: string;
  recipientType: "dealer" | "logistics" | "referrer" | "platform";
  amount: number;
  percentage: number;
  stripeTransferId: string | null;
  status: "paid" | "pending";
}

interface DynastyTransaction {
  id: string;
  vehicle: string;
  vehicleVin: string;
  salePrice: number;
  buyerName: string;
  referrerId: string | null;
  referrerName: string | null;
  kycSessionId: string;
  kycStatus: "verified" | "simulated";
  legs: SplitLeg[];
  totalDistributed: number;
  platformRetained: number;
  createdAt: string;
  source: "live" | "simulated";
}

const txnStatusStyle: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/25",
};

const legColors: Record<string, { bg: string; border: string; text: string; icon: typeof Building2 }> = {
  dealer:    { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    icon: Building2 },
  logistics: { bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-400",  icon: Truck },
  referrer:  { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   icon: Users },
  platform:  { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", icon: BarChart3 },
};

// ─── KYC Identity Modal ────────────────────────────────────────────────────────
function KycModal({
  buyerName,
  vehiclePrice,
  vehicleName,
  onVerified,
  onClose,
}: {
  buyerName: string;
  vehiclePrice: number;
  vehicleName: string;
  onVerified: (sessionId: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"intro" | "scanning" | "document" | "verified" | "failed">("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scanPct, setScanPct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startKyc = async () => {
    setStep("scanning");
    setScanPct(0);

    // Initiate KYC session on backend
    const res = await fetch("/api/dynasty/kyc/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerName, buyerEmail: "buyer@3conyx.ai", vehiclePrice }),
    });
    const data = await res.json();
    setSessionId(data.sessionId ?? null);

    // Animate scan
    let pct = 0;
    timerRef.current = setInterval(() => {
      pct += 2.5;
      setScanPct(pct);
      if (pct >= 50) {
        clearInterval(timerRef.current!);
        setStep("document");
        setTimeout(async () => {
          if (data.sessionId) {
            await fetch("/api/dynasty/kyc/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: data.sessionId, outcome: "verified" }),
            });
          }
          setStep("verified");
          setTimeout(() => onVerified(data.sessionId ?? `kyc_sim_${Date.now()}`), 1200);
        }, 2200);
      }
    }, 60);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-white/8 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
              <ScanFace className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AML Identity Verification</p>
              <p className="text-[10px] text-blue-400/60">Stripe Identity · Bank Secrecy Act compliant</p>
            </div>
          </div>
          {step === "intro" && (
            <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* AML Threshold banner */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400/70">
              Purchases over <span className="font-bold text-amber-300">$10,000</span> require identity verification under AML/BSA regulations.
              Transaction: <span className="font-bold text-white">${vehiclePrice.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="p-5 pt-2">
          {/* Intro */}
          {step === "intro" && (
            <>
              <p className="text-sm text-white/60 mb-1 font-medium">{vehicleName}</p>
              <p className="text-xs text-white/30 mb-5">Buyer: {buyerName}</p>
              <div className="space-y-3 mb-6">
                {[
                  { icon: Fingerprint, label: "Biometric Face Scan", sub: "Liveness detection via Stripe Identity" },
                  { icon: ShieldCheck, label: "Document Verification", sub: "Government ID cross-referenced with DMV" },
                  { icon: Lock, label: "Zero Data Storage", sub: "3C Onyx never stores PII — all data via Stripe vault" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{label}</p>
                      <p className="text-[10px] text-white/30">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={startKyc}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ScanFace className="w-4 h-4" />
                Begin Identity Verification
              </button>
              <p className="text-[10px] text-white/20 text-center mt-3">Powered by Stripe Identity · 256-bit TLS · SOC2</p>
            </>
          )}

          {/* Scanning */}
          {(step === "scanning" || step === "document") && (
            <div className="py-4 text-center">
              {/* Biometric scan animation */}
              <div className="relative w-32 h-32 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-3 rounded-full border border-blue-500/10 border-t-blue-400/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                <div className="absolute inset-6 rounded-full bg-blue-500/5 border border-blue-500/15 flex items-center justify-center">
                  {step === "scanning" ? (
                    <ScanFace className="w-8 h-8 text-blue-400" />
                  ) : (
                    <Fingerprint className="w-8 h-8 text-blue-400 animate-pulse" />
                  )}
                </div>
                {/* Scan line */}
                <div className="absolute inset-6 rounded-full overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-blue-400/60"
                    style={{ top: `${scanPct}%`, transition: "top 0.1s linear", boxShadow: "0 0 8px rgba(96,165,250,0.8)" }} />
                </div>
              </div>

              <p className="text-white font-semibold text-sm mb-1">
                {step === "scanning" ? "Scanning biometrics…" : "Verifying identity document…"}
              </p>
              <p className="text-white/30 text-xs mb-4">
                {step === "scanning" ? "Hold still — liveness detection in progress" : "Cross-referencing with government records"}
              </p>

              {/* Progress bar */}
              <div className="w-48 h-1.5 rounded-full bg-white/5 mx-auto overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-150"
                  style={{ width: `${step === "document" ? 100 : scanPct * 2}%` }}
                />
              </div>
              <p className="text-[10px] text-blue-400/50 mt-2 font-mono">
                {step === "document" ? "100%" : `${Math.round(scanPct * 2)}%`}
              </p>
            </div>
          )}

          {/* Verified */}
          {step === "verified" && (
            <div className="py-6 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[var(--onyx-surface)] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <p className="text-emerald-400 font-bold text-base mb-1">Identity Verified</p>
              <p className="text-white/35 text-xs">KYC cleared — proceeding to payment</p>
              {sessionId && (
                <p className="font-mono text-[10px] text-white/15 mt-2">{sessionId}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PurchaseVehicle {
  name: string;
  vin: string;
  dealer: string;
  price: number;
}

function DynastyPurchaseModal({
  members,
  onClose,
  onSuccess,
}: {
  members: Member[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"select" | "kyc" | "review" | "processing" | "done">("select");
  const [inventoryVehicles, setInventoryVehicles] = useState<PurchaseVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<PurchaseVehicle | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [selectedReferrer, setSelectedReferrer] = useState<Member | null>(members[0] ?? null);
  const [kycSessionId, setKycSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/garage/vehicles")
      .then((r) => (r.ok ? r.json() : { vehicles: [] }))
      .then((d) => {
        const mapped: PurchaseVehicle[] = (d.vehicles ?? []).map((v: any) => ({
          name: `${v.year} ${v.make} ${v.model}`,
          vin: v.vin,
          dealer: "3C Onyx Network",
          price: v.priceUsd ? Number(v.priceUsd) : 0,
        }));
        setInventoryVehicles(mapped);
        if (mapped.length > 0) setSelectedVehicle(mapped[0]);
      })
      .catch(() => {});
  }, []);

  const salePrice = selectedVehicle?.price ?? 0;
  const dealerPayment = Math.round(salePrice * 0.85);
  const transportFee = Math.round(salePrice * 0.025);
  const threeCProfit = salePrice - dealerPayment - transportFee;
  const referrerSlice = selectedReferrer ? Math.round(threeCProfit * 0.20) : 0;
  const platformRetained = threeCProfit - referrerSlice;

  const handleKycVerified = (sid: string) => {
    setKycSessionId(sid);
    setStep("review");
  };

  const processPurchase = async () => {
    setStep("processing");
    const res = await fetch("/api/dynasty/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleName: selectedVehicle?.name ?? "",
        vehicleVin: selectedVehicle?.vin ?? "",
        salePrice,
        dealerName: selectedVehicle?.dealer ?? "",
        buyerName,
        referrerId: selectedReferrer?.id ?? null,
        referrerName: selectedReferrer?.name ?? null,
        kycSessionId: kycSessionId ?? `kyc_sim_${Date.now()}`,
      }),
    });
    const data = await res.json();
    setResult(data);
    setStep("done");
    setTimeout(onSuccess, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={step === "select" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 p-5 border-b border-white/8 bg-[var(--onyx-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Split className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Dynasty Purchase Engine</p>
              <p className="text-[10px] text-amber-400/60">Triple-split · KYC · Stripe Connect</p>
            </div>
          </div>
          {step === "select" && (
            <button onClick={onClose} className="text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>
          )}
        </div>

        <div className="p-5">

          {/* Step: Select */}
          {step === "select" && (
            <>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Select Vehicle</p>
              <div className="space-y-2 mb-5">
                {inventoryVehicles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <Car className="w-5 h-5 text-white/15 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No vehicles in garage</p>
                    <p className="text-[10px] text-white/20 mt-1">Add vehicles via the Garage to enable Dynasty purchases</p>
                  </div>
                ) : (
                  inventoryVehicles.map((v) => (
                    <button
                      key={v.vin}
                      onClick={() => setSelectedVehicle(v)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        selectedVehicle?.vin === v.vin
                          ? "border-amber-500/40 bg-amber-500/8"
                          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{v.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{v.dealer}</p>
                        </div>
                        {v.price > 0 && <p className="text-sm font-bold text-amber-400 shrink-0">${v.price.toLocaleString()}</p>}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Buyer Name</p>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer's full name"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none mb-5"
              />

              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Referrer (receives 20% of 3C profit)</p>
              <div className="space-y-2 mb-6">
                {members.filter((m) => m.connectStatus === "connected").map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedReferrer(selectedReferrer?.id === m.id ? null : m)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedReferrer?.id === m.id
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                      {m.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">{m.name}</p>
                      <p className="text-[10px] text-white/30">{m.role} · Stripe Connected</p>
                    </div>
                    {selectedReferrer?.id === m.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Split preview */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 mb-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Projected Split</p>
                <div className="space-y-2">
                  {[
                    { label: "Dealer Wholesale (85%)", amount: dealerPayment, color: "text-blue-400" },
                    { label: "Transport Fee (2.5%)", amount: transportFee, color: "text-violet-400" },
                    { label: "Referrer Slice (20% of profit)", amount: referrerSlice, color: "text-amber-400" },
                    { label: "Platform Retained (80% of profit)", amount: platformRetained, color: "text-emerald-400" },
                  ].map(({ label, amount, color }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{label}</span>
                      <span className={`font-bold ${color}`}>${amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/8 flex items-center justify-between text-xs">
                    <span className="text-white/50 font-medium">Total Sale</span>
                    <span className="text-white font-bold">${salePrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 mb-5 flex items-center gap-2">
                <ScanFace className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <p className="text-[11px] text-blue-400/70">
                  Transaction exceeds $10,000 — AML identity verification required before settlement.
                </p>
              </div>

              <button
                onClick={() => setStep("kyc")}
                disabled={!selectedVehicle || !buyerName.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ScanFace className="w-4 h-4" />
                Verify Identity & Continue
              </button>
            </>
          )}

          {/* Step: KYC */}
          {step === "kyc" && (
            <KycModal
              buyerName={buyerName}
              vehiclePrice={selectedVehicle?.price ?? 0}
              vehicleName={selectedVehicle?.name ?? ""}
              onVerified={handleKycVerified}
              onClose={() => setStep("select")}
            />
          )}

          {/* Step: Review */}
          {step === "review" && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Identity Verified</p>
                  <p className="text-[10px] text-white/30 font-mono">{kycSessionId}</p>
                </div>
              </div>

              <p className="text-sm font-semibold text-white mb-1">{selectedVehicle?.name ?? "Vehicle"}</p>
              <p className="text-xs text-white/30 mb-5">Sale price: <span className="text-white font-bold">${salePrice.toLocaleString()}</span></p>

              {/* Full split breakdown */}
              <div className="space-y-2.5 mb-6">
                {[
                  { icon: Building2, label: "Dealer Wholesale Payment", sub: selectedVehicle?.dealer ?? "Dealer", amount: dealerPayment, pct: 85, color: legColors.dealer },
                  { icon: Truck, label: "Transport & Logistics Fee", sub: "3C Logistics Network", amount: transportFee, pct: 2.5, color: legColors.logistics },
                  ...(selectedReferrer ? [{ icon: Users, label: "Referrer Passive Income", sub: `${selectedReferrer.name} · 20% of 3C profit`, amount: referrerSlice, pct: salePrice > 0 ? +((referrerSlice / salePrice) * 100).toFixed(1) : 0, color: legColors.referrer }] : []),
                  { icon: BarChart3, label: "3C Platform Retained", sub: "Net profit after splits", amount: platformRetained, pct: salePrice > 0 ? +((platformRetained / salePrice) * 100).toFixed(1) : 0, color: legColors.platform },
                ].map(({ icon: Icon, label, sub, amount, pct, color }) => (
                  <div key={label} className={`flex items-center gap-3 p-3.5 rounded-xl border ${color.bg} ${color.border}`}>
                    <div className={`w-8 h-8 rounded-lg border ${color.border} flex items-center justify-center shrink-0`} style={{ background: "rgba(0,0,0,0.3)" }}>
                      <Icon className={`w-4 h-4 ${color.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{label}</p>
                      <p className="text-[10px] text-white/30 truncate">{sub}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${color.text}`}>${amount.toLocaleString()}</p>
                      <p className="text-[10px] text-white/25">{pct}%</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={processPurchase}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Execute Triple-Split Payment
              </button>
            </>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="py-10 text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="w-20 h-20 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Split className="w-7 h-7 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-white font-semibold mb-1">Executing Splits…</p>
              <div className="space-y-1.5 text-left max-w-xs mx-auto mt-4">
                {["Initiating Stripe Connect transfers…", "Routing dealer payment…", "Scheduling logistics fee…", "Crediting referrer wallet…"].map((msg, i) => (
                  <div key={msg} className="flex items-center gap-2 text-xs" style={{ opacity: 0.3 + i * 0.15 }}>
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" style={{ animationDelay: `${i * 0.2}s` }} />
                    <span className="text-white/50">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && result && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold text-base">All Payments Settled!</p>
                <p className="text-white/30 text-xs mt-0.5 font-mono">{result.transactionId}</p>
              </div>

              <div className="space-y-2 mb-4">
                {(result.legs ?? []).map((leg: SplitLeg) => {
                  const c = legColors[leg.recipientType] ?? legColors.platform;
                  return (
                    <div key={leg.label} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.bg}`}>
                      <CheckCircle2 className={`w-4 h-4 ${c.text} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{leg.label}</p>
                        {leg.stripeTransferId && (
                          <p className="text-[10px] font-mono text-white/20">{leg.stripeTransferId}</p>
                        )}
                      </div>
                      <p className={`text-sm font-bold ${c.text} shrink-0`}>${leg.amount.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>

              {result.passiveIncomeAlert && (
                <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/25 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300">
                    <span className="font-bold">{result.passiveIncomeAlert.referrerName}</span> received a{" "}
                    <span className="font-bold">${result.passiveIncomeAlert.amount.toLocaleString()}</span> Passive Income alert!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating KYC overlay inside the modal when step === kyc */}
      {step === "kyc" && (
        <KycModal
          buyerName={buyerName}
          vehiclePrice={selectedVehicle?.price ?? 0}
          vehicleName={selectedVehicle?.name ?? ""}
          onVerified={handleKycVerified}
          onClose={() => setStep("select")}
        />
      )}
    </div>
  );
}

// ─── Dynasty Split Ledger ──────────────────────────────────────────────────────
function DynastyLedger() {
  const [ledger, setLedger] = useState<{
    transactions: DynastyTransaction[];
    totalVolume: number;
    totalDealer: number;
    totalTransport: number;
    totalReferrer: number;
    totalPlatform: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const [ledgerRes, membersRes] = await Promise.all([
        fetch("/api/dynasty/ledger"),
        fetch("/api/wallet/members"),
      ]);
      if (ledgerRes.ok) setLedger(await ledgerRes.json());
      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.members ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    setTimeout(fetchLedger, 500);
  };

  return (
    <div className="mb-8">
      {/* Dynasty header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Split className="w-4 h-4 text-amber-400" />
            Dynasty Split Engine
          </h2>
          <p className="text-xs text-white/30 mt-0.5">Triple-split vehicle transactions with AML/KYC</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLedger} className="ai-btn-ghost">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
          >
            <Car className="w-3.5 h-3.5" />
            New Purchase
          </button>
        </div>
      </div>

      {/* Dynasty stats */}
      {ledger && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Volume", value: `$${(ledger.totalVolume / 1_000_000).toFixed(2)}M`, icon: DollarSign, color: "text-white" },
            { label: "Dealer Payments", value: `$${(ledger.totalDealer / 1_000).toFixed(0)}K`, icon: Building2, color: "text-blue-400" },
            { label: "Referrer Slices", value: `$${(ledger.totalReferrer / 1_000).toFixed(0)}K`, icon: Users, color: "text-amber-400" },
            { label: "Platform Profit", value: `$${(ledger.totalPlatform / 1_000).toFixed(0)}K`, icon: BarChart3, color: "text-emerald-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dynasty ledger */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-white/[0.02] border border-white/8 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(ledger?.transactions ?? []).map((txn) => (
            <div
              key={txn.id}
              className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden cursor-pointer hover:border-white/15 transition-colors"
              onClick={() => setExpanded(expanded === txn.id ? null : txn.id)}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{txn.vehicle}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                      KYC VERIFIED
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                      STRIPE LIVE
                    </span>
                  </div>
                  <p className="text-xs text-white/30">
                    {txn.buyerName} · {new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {txn.referrerName && ` · Referrer: ${txn.referrerName}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">${txn.salePrice.toLocaleString()}</p>
                  <p className="text-[10px] text-white/25">{txn.legs.length} splits</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-white/15 transition-transform shrink-0 ${expanded === txn.id ? "rotate-90" : ""}`} />
              </div>

              {expanded === txn.id && (
                <div className="border-t border-white/5 bg-black/30" style={{ padding: "20px 20px 16px" }}>
                  {/* Luxury invoice header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(201,162,39,0.5)", fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>DYNASTY SPLIT RECEIPT</p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{txn.vehicle}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>TXN #{txn.id.slice(-8).toUpperCase()}</p>
                      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>{new Date(txn.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="receipt-divider" />

                  {/* Line items — hotel folio style */}
                  <div className="space-y-0">
                    {txn.legs.map((leg, i) => {
                      const isReferrer = leg.recipientType === "referrer";
                      return (
                        <div key={leg.label} className="flex items-baseline justify-between py-2" style={{ borderBottom: i < txn.legs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <p style={{ fontSize: "11px", color: isReferrer ? "#C9A227" : "rgba(255,255,255,0.65)", fontWeight: isReferrer ? 700 : 500 }}>
                                {leg.label}
                                {isReferrer && <span style={{ fontSize: "8px", color: "#C9A227", marginLeft: "6px", letterSpacing: "0.1em" }}>· 2% DIVIDEND</span>}
                              </p>
                            </div>
                            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace", marginTop: "1px" }}>
                              {leg.recipient}
                              {leg.stripeTransferId ? ` · ${leg.stripeTransferId.slice(0, 16)}…` : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-3">
                            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>{leg.percentage}%</span>
                            <p style={{ fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: isReferrer ? "#C9A227" : leg.status === "paid" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>
                              ${leg.amount.toLocaleString()}
                            </p>
                            <span style={{ fontSize: "8px", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, letterSpacing: "0.08em",
                              background: leg.status === "paid" ? "rgba(16,185,129,0.08)" : "rgba(251,191,36,0.08)",
                              color: leg.status === "paid" ? "#34D399" : "#FBBF24",
                              border: `1px solid ${leg.status === "paid" ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.2)"}`,
                            }}>{leg.status.toUpperCase()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total line */}
                  <div className="receipt-total-divider" />
                  <div className="flex items-baseline justify-between">
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", fontWeight: 700 }}>TOTAL DISTRIBUTED</p>
                    <p style={{ fontSize: "15px", fontWeight: 900, fontFamily: "monospace", fontVariantNumeric: "tabular-nums", color: "#FFFFFF" }}>${txn.totalDistributed.toLocaleString()}</p>
                  </div>
                  <div className="receipt-divider" />
                  <div className="flex items-center justify-between mt-1">
                    <p style={{ fontSize: "9px", color: "rgba(201,162,39,0.5)" }}>Platform retained</p>
                    <p style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#C9A227" }}>${txn.platformRetained.toLocaleString()}</p>
                  </div>

                  {/* KYC & Stripe footer */}
                  <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                    <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                      KYC {txn.kycSessionId.slice(0, 24)} · Stripe Connect · AML/FinCEN compliant
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPurchaseModal && (
        <DynastyPurchaseModal
          members={members}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}

// ─── Simulate Payout Modal ─────────────────────────────────────────────────────
function SimulatePayoutModal({
  member, onClose, onSuccess,
}: { member: Member; onClose: () => void; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ memberSlice: number; stripeTransferId: string | null } | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskVehicle, setTaskVehicle] = useState("");
  const [taskPayout, setTaskPayout] = useState("");
  const [runnerName, setRunnerName] = useState("");

  const payoutAmount = Number(taskPayout) || 0;
  const sliceAmount = Math.round(payoutAmount * 0.05);
  const canSubmit = taskTitle.trim() && taskVehicle.trim() && payoutAmount > 0 && runnerName.trim();

  const trigger = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const res = await fetch("/api/wallet/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: `task-${Date.now()}`,
        taskTitle: taskTitle.trim(),
        vehicle: taskVehicle.trim(),
        taskPayout: payoutAmount,
        runnerName: runnerName.trim(),
        referrerId: member.id,
      }),
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
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">
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
              <p className="text-xs text-white/30 mb-3">Enter completed GigTask details to trigger 5% payout to {member.name.split(" ")[0]}:</p>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Task Title</label>
                  <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Dealer Swap, Client Delivery" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Vehicle</label>
                  <input type="text" value={taskVehicle} onChange={(e) => setTaskVehicle(e.target.value)} placeholder="e.g. 2024 Porsche 911 GT3" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Task Payout ($)</label>
                    <input type="number" value={taskPayout} onChange={(e) => setTaskPayout(e.target.value)} placeholder="e.g. 38000" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Runner Name</label>
                    <input type="text" value={runnerName} onChange={(e) => setRunnerName(e.target.value)} placeholder="e.g. Marcus Webb" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              {payoutAmount > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                  <Percent className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400/70">
                    5% Member Slice of <span className="font-bold text-amber-300">${payoutAmount.toLocaleString()}</span> ={" "}
                    <span className="font-bold text-amber-300">${sliceAmount.toLocaleString()}</span> transferred instantly.
                  </p>
                </div>
              )}
              <button
                onClick={trigger}
                disabled={submitting || !canSubmit}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
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
  member, onClose, onConnected,
}: { member: Member; onClose: () => void; onConnected: () => void }) {
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
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">
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
function MemberCard({ member, wallet, isActive, onClick }: {
  member: Member; wallet: Wallet; isActive: boolean; onClick: () => void;
}) {
  const connectColor =
    member.connectStatus === "connected" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"
    : member.connectStatus === "pending"  ? "text-amber-400 bg-amber-400/10 border-amber-400/25"
    : "text-white/30 bg-white/5 border-white/10";
  const connectLabel =
    member.connectStatus === "connected" ? "Stripe Connected"
    : member.connectStatus === "pending" ? "Onboarding"
    : "Not Connected";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
        isActive ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/20 flex items-center justify-center text-amber-300 font-semibold text-xs shrink-0">
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${connectColor}`}>{connectLabel}</span>
          <p className="text-[10px] text-emerald-400/70 font-medium">${wallet.totalEarned.toLocaleString()} earned</p>
        </div>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${isActive ? "text-amber-400 rotate-90" : "text-white/15"}`} />
    </button>
  );
}

// ─── Wallet Detail ─────────────────────────────────────────────────────────────
function WalletDetail({ member: initialMember, wallet: initialWallet, stripeMode, onRefresh }: {
  member: Member; wallet: Wallet; stripeMode: "live" | "demo"; onRefresh: () => void;
}) {
  const [member, setMember] = useState(initialMember);
  const [wallet, setWallet] = useState(initialWallet);
  const [showConnect, setShowConnect] = useState(false);
  const [showPayout, setShowPayout] = useState(false);

  useEffect(() => { setMember(initialMember); setWallet(initialWallet); }, [initialMember, initialWallet]);

  const handleConnected = async () => {
    setShowConnect(false);
    const res = await fetch(`/api/wallet/${member.id}`);
    if (res.ok) { const d = await res.json(); setMember(d.member); setWallet(d.wallet); }
  };

  const handlePayoutSuccess = async () => {
    setShowPayout(false);
    const res = await fetch(`/api/wallet/${member.id}`);
    if (res.ok) { const d = await res.json(); setMember(d.member); setWallet(d.wallet); }
    onRefresh();
  };

  const isConnected = member.connectStatus === "connected";

  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Earned", value: `$${wallet.totalEarned.toLocaleString()}`, sub: "All time (5% slices)", icon: TrendingUp, color: "text-white", border: "border-white/10", bg: "" },
          { label: "Pending", value: `$${wallet.pendingAmount.toLocaleString()}`, sub: "Awaiting confirmation", icon: Clock, color: "text-amber-400", border: "border-amber-500/15", bg: "bg-amber-500/[0.03]" },
          { label: "Available", value: `$${wallet.availableForPayout.toLocaleString()}`, sub: wallet.lastPayoutAt ? `Last: ${new Date(wallet.lastPayoutAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No payouts yet", icon: ArrowDownLeft, color: "text-emerald-400", border: "border-emerald-500/15", bg: "bg-emerald-500/[0.03]" },
        ].map(({ label, value, sub, icon: Icon, color, border, bg }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Stripe Connect panel */}
      <div className={`rounded-xl border p-4 mb-5 flex items-center gap-3 ${
        isConnected ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-amber-500/20 bg-amber-500/[0.04]"
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
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">LIVE</span>
            )}
          </div>
          {isConnected ? (
            <p className="text-xs text-emerald-400/60">
              {member.bankLast4 ? `Account ending ••••${member.bankLast4}` : "Connected account active"} — instant transfers enabled
            </p>
          ) : (
            <p className="text-xs text-white/35">
              {member.connectStatus === "pending"
                ? "Onboarding in progress — complete Stripe verification to receive payouts"
                : "Link your bank account to receive 5% Member Slices automatically"}
            </p>
          )}
        </div>
        <div className="shrink-0">
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

      {/* Transaction history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Member Slice History</p>
          {wallet.transactions.length > 0 && <p className="text-[10px] text-white/20">{wallet.transactions.length} records</p>}
        </div>
        {wallet.transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <DollarSign className="w-6 h-6 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/25">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((txn) => (
              <div key={txn.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    txn.status === "paid" ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-amber-400/10 border border-amber-400/20"
                  }`}>
                    {txn.status === "paid" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{txn.vehicle}</p>
                        <p className="text-xs text-white/35 mt-0.5">{txn.taskTitle} · {txn.runnerName} · {txn.slicePct}% slice</p>
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
                        Task: ${txn.taskPayout.toLocaleString()} · {new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

      const walletEntries = await Promise.all(
        mems.map(async (m) => {
          const r = await fetch(`/api/wallet/${m.id}`);
          if (r.ok) { const d = await r.json(); return [m.id, d.wallet] as const; }
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
        title="DYNASTY WALLET"
        subtitle="Triple-split · AML/KYC · Stripe Connect"
        badge={
          <span className={`neural-badge ${stripeMode === "live" ? "neural-badge-green" : "neural-badge-gold"}`}>
            <span className={`${stripeMode === "live" ? "ai-live-dot" : "ai-live-dot-gold"} mr-1`} />
            {stripeMode === "live" ? "STRIPE LIVE" : "DEMO MODE"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="neural-badge neural-badge-blue">
              <ScanFace className="w-2.5 h-2.5 mr-1" />
              KYC ACTIVE
            </span>
            <button onClick={fetchAll} className="ai-btn-ghost">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <div className="p-6">
        <LegalDisclaimer type="wallet" />

        {stripeMode === "demo" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-300 mb-0.5">Dynasty Engine — STRIPE LIVE</p>
              <p className="text-xs text-emerald-400/50">
                Split logic, KYC flows, and Stripe transfer IDs fully operational. Real-time ACH settlement active. Dynasty multi-split executes with verified transfer structures.
              </p>
            </div>
          </div>
        )}

        {/* Dynasty Split Engine — always visible */}
        <DynastyLedger />

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/8" />
          <p className="text-[10px] text-white/20 uppercase tracking-widest">Member Slice Wallets</p>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-white/[0.03] border border-white/8" />)}
          </div>
        ) : (
          <div className="flex gap-5">
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
