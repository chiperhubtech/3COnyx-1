import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingBag, BadgeCheck, Fuel, Gauge, Calendar, MapPin,
  SlidersHorizontal, Loader2, Car, X, CheckCircle2,
  ChevronDown, Zap, Bookmark, BookmarkCheck, BrainCircuit,
  TrendingDown, Search, Shield, DollarSign, Activity,
  Sparkles, Tag, ChevronRight, Info, BarChart3, Store,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SpinViewer } from "@/components/SpinViewer";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketListing {
  id: string;
  heading: string;
  price: number;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  exterior_color?: string;
  fuel_type?: string;
  city?: string;
  state?: string;
  dom?: number;
  vin: string;
  media?: { photo_links?: string[] };
  seller?: { name?: string };
  // Wholesale Engine enrichment
  market_avg?: number;
  guardian_health_score?: number;
  dealer_discount?: number;
  platform_fee?: number;
  club_price?: number;
  savings_vs_retail?: number;
  wholesale_potential?: boolean;
}

interface WholesaleStats {
  totalCount: number;
  totalSavings: number;
  avgSavings: number;
  avgGuardianScore: number;
}

interface SearchFilters {
  make: string;
  price_max: string;
  miles_max: string;
  year: string;
}

const MAKES = [
  { value: "", label: "All Makes" },
  { value: "Rolls-Royce", label: "Rolls-Royce" },
  { value: "Bentley", label: "Bentley" },
  { value: "Lamborghini", label: "Lamborghini" },
  { value: "Ferrari", label: "Ferrari" },
  { value: "Porsche", label: "Porsche" },
  { value: "McLaren", label: "McLaren" },
  { value: "Aston Martin", label: "Aston Martin" },
  { value: "Maserati", label: "Maserati" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "BMW", label: "BMW" },
];

// ─── Guardian Health Score Ring ───────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? "#34D399" : score >= 70 ? "#C9A227" : "#F87171";
  const label = score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : "FAIR";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle
            cx="22" cy="22" r={r} fill="none"
            stroke={color} strokeWidth="3.5"
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-[8px] font-bold tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Savings Badge ────────────────────────────────────────────────────────────
function SavingsBadge({ amount }: { amount: number }) {
  return (
    <div
      className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md"
      style={{
        background: "linear-gradient(135deg, rgba(201,162,39,0.9) 0%, rgba(180,130,10,0.95) 100%)",
        border: "1px solid rgba(255,220,100,0.4)",
        boxShadow: "0 0 12px rgba(201,162,39,0.4)",
      }}
    >
      <Tag className="w-2.5 h-2.5 text-black" />
      <span className="text-[10px] font-black text-black tracking-wide">
        SAVE ${amount.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Price Breakdown Tooltip ──────────────────────────────────────────────────
function PriceBreakdown({
  price, marketAvg, dealerDiscount, platformFee, clubPrice,
}: {
  price: number; marketAvg: number; dealerDiscount: number;
  platformFee: number; clubPrice: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-1 text-white/25 hover:text-amber-400/70 transition-colors"
        title="3C Club Price breakdown"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-6 right-0 z-20 w-56 rounded-xl border border-amber-500/20 p-3 text-xs shadow-2xl"
            style={{ background: "var(--onyx-surface)" }}
          >
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Price Breakdown</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-white/50">
                <span>Listed price</span>
                <span className="font-mono">${price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400/80">
                <span>− 3% dealer discount</span>
                <span className="font-mono">−${dealerDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-400/60">
                <span>+ 1.2% 3C fee</span>
                <span className="font-mono">+${platformFee.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between text-white font-semibold">
                <span>3C Club Price</span>
                <span className="font-mono text-amber-300">${clubPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Local retail avg</span>
                <span className="font-mono">${marketAvg.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Wholesale Car Card ────────────────────────────────────────────────────────
function WholesaleCard({
  car, onConcierge, onWatch, watched,
}: {
  car: MarketListing;
  onConcierge: (c: MarketListing) => void;
  onWatch: (c: MarketListing) => void;
  watched: boolean;
}) {
  const location = [car.city, car.state].filter(Boolean).join(", ");
  const maskedVin = car.vin
    ? "•".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4)
    : "N/A";
  const isElectric = car.fuel_type?.toLowerCase().includes("electric");
  const isHybrid = car.fuel_type?.toLowerCase().includes("hybrid");

  const hasWholesale = car.wholesale_potential && car.club_price != null;

  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: hasWholesale
          ? "linear-gradient(160deg, rgba(14,14,20,0.98) 0%, rgba(10,10,16,1) 100%)"
          : "rgba(10,10,16,0.98)",
        border: hasWholesale
          ? "1px solid rgba(201,162,39,0.22)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: hasWholesale
          ? "0 0 0 1px rgba(201,162,39,0.04), 0 8px 32px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* 3C Spin Studio™ — 360° Viewer */}
      <div className="relative overflow-hidden shrink-0 rounded-t-2xl">
        <SpinViewer
          frames={car.media?.photo_links ?? []}
          vehicleName={car.heading}
          height={192}
          autoSpin={false}
          compact
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* 3C Certified */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40">
          <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-300 tracking-wide">3C Certified</span>
        </div>

        {/* Savings badge — gold, top-right */}
        {hasWholesale && car.savings_vs_retail != null && car.savings_vs_retail > 0 && (
          <SavingsBadge amount={car.savings_vs_retail} />
        )}

        {/* EV/Hybrid badge if no savings badge */}
        {!hasWholesale && (isElectric || isHybrid) && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-medium">{isElectric ? "EV" : "Hybrid"}</span>
          </div>
        )}

        {/* Days listed */}
        {car.dom != null && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-white/50">{car.dom}d listed</span>
          </div>
        )}

        {/* Wholesale potential pill */}
        {hasWholesale && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
            <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-300 tracking-wider">WHOLESALE</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Title + Health Score */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
              {car.heading}
            </h3>
            {car.exterior_color && (
              <p className="text-xs text-white/30 mt-0.5">{car.exterior_color}</p>
            )}
          </div>
          {car.guardian_health_score != null && (
            <div className="shrink-0">
              <HealthRing score={car.guardian_health_score} />
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Gauge className="w-3 h-3 text-white/20 shrink-0" />
            {car.miles != null ? `${car.miles.toLocaleString()} mi` : "—"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Calendar className="w-3 h-3 text-white/20 shrink-0" />
            {car.year}
          </div>
          {car.fuel_type && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Fuel className="w-3 h-3 text-white/20 shrink-0" />
              {car.fuel_type}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <MapPin className="w-3 h-3 text-white/20 shrink-0" />
              {location}
            </div>
          )}
        </div>

        {/* Seller + VIN */}
        <div className="flex items-center justify-between">
          {car.seller?.name && (
            <div className="flex items-center gap-1">
              <Store className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[10px] text-white/25 truncate max-w-[140px]">{car.seller.name}</span>
            </div>
          )}
          <p className="text-[9px] font-mono text-white/15 tracking-widest ml-auto">VIN {maskedVin}</p>
        </div>

        {/* Wholesale pricing block */}
        {hasWholesale && car.club_price != null ? (
          <div
            className="rounded-xl p-3 mt-auto"
            style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(6,6,10,0.9) 100%)",
              border: "1px solid rgba(201,162,39,0.15)",
            }}
          >
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest">3C Club Price</span>
                  <PriceBreakdown
                    price={car.price}
                    marketAvg={car.market_avg ?? 0}
                    dealerDiscount={car.dealer_discount ?? 0}
                    platformFee={car.platform_fee ?? 0}
                    clubPrice={car.club_price}
                  />
                </div>
                <p className="text-xl font-black text-amber-300">
                  ${car.club_price.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/25 uppercase tracking-wider">Retail avg</p>
                <p className="text-sm text-white/35 line-through">
                  ${(car.market_avg ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((car.savings_vs_retail ?? 0) / (car.market_avg ?? 1)) * 100 * 4)}%`,
                    background: "linear-gradient(90deg, #C9A227, #FFD700)",
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-emerald-400">
                {car.market_avg
                  ? `${Math.round(((car.market_avg - car.club_price) / car.market_avg) * 100)}% below retail`
                  : ""}
              </span>
            </div>
          </div>
        ) : (
          /* Standard pricing for non-wholesale */
          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-white">
              {car.price != null ? `$${car.price.toLocaleString()}` : "Call"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onWatch(car)}
            title={watched ? "On watchlist" : "Add to watchlist"}
            className={`p-2 rounded-lg border transition-all ${
              watched
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : "border-white/10 bg-white/5 text-white/30 hover:text-amber-400 hover:border-amber-500/30"
            }`}
          >
            {watched ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onConcierge(car)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-black text-xs font-black transition-all cursor-pointer"
            style={{
              background: hasWholesale
                ? "linear-gradient(135deg, #C9A227 0%, #E8B800 100%)"
                : "linear-gradient(135deg, #B8941F 0%, #C9A227 100%)",
              boxShadow: hasWholesale ? "0 0 16px rgba(201,162,39,0.3)" : "none",
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {hasWholesale ? "Claim Club Price" : "Buy via Concierge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Concierge Modal ─────────────────────────────────────────────────────────
type ModalState = "form" | "submitting" | "success";

function ConciergeModal({ car, onClose }: { car: MarketListing; onClose: () => void }) {
  const [state, setState] = useState<ModalState>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const maskedVin = car.vin
    ? "•".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4)
    : "N/A";

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;
    setState("submitting");
    setTimeout(() => setState("success"), 1500);
  };

  const isWholesale = car.wholesale_potential && car.club_price != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={state !== "submitting" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[var(--onyx-surface)] shadow-2xl overflow-hidden">
        {state === "success" ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">
              {isWholesale ? "Wholesale Request Locked In" : "Request Submitted"}
            </h2>
            <p className="text-white/40 text-sm mb-2">
              ONYX is coordinating your acquisition now.{" "}
              <span className="text-white/60 font-medium">Inspection, financing, and white-glove delivery</span> are handled — no follow-up needed from you.
            </p>
            {isWholesale && car.savings_vs_retail != null && (
              <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">
                  You're saving ${car.savings_vs_retail.toLocaleString()} vs local retail
                </span>
              </div>
            )}
            <p className="text-xs text-white/25 font-mono mb-6">Ref: 3C-{Date.now().toString().slice(-6)}</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isWholesale ? (
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                ) : (
                  <BadgeCheck className="w-5 h-5 text-amber-400" />
                )}
                <h2 className="text-white font-semibold">
                  {isWholesale ? "Claim Wholesale Price" : "Buy via Concierge"}
                </h2>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Vehicle summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-5">
                {car.media?.photo_links?.[0] && (
                  <img src={car.media.photo_links[0]} alt="" className="w-full h-28 object-cover rounded-lg mb-3" />
                )}
                <p className="text-sm font-medium text-white leading-snug">{car.heading}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs font-mono text-white/25">VIN {maskedVin}</p>
                  <div className="text-right">
                    {isWholesale && car.club_price != null ? (
                      <>
                        <p className="text-[10px] text-white/30 line-through">${car.price.toLocaleString()}</p>
                        <p className="text-base font-black text-amber-300">${car.club_price.toLocaleString()}</p>
                      </>
                    ) : (
                      <p className="text-base font-bold text-amber-400">
                        {car.price != null ? `$${car.price.toLocaleString()}` : "Call"}
                      </p>
                    )}
                  </div>
                </div>
                {isWholesale && car.savings_vs_retail != null && (
                  <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">
                      Saving ${car.savings_vs_retail.toLocaleString()} vs local retail avg
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (000) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-white/30 mb-4">
                A dedicated 3C Concierge specialist will contact you to arrange financing, inspection, and white-glove delivery.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !phone.trim() || state === "submitting"}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {state === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {state === "submitting" ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Wholesale Stats Bar ──────────────────────────────────────────────────────
function WholesaleStatsBar({ stats }: { stats: WholesaleStats }) {
  const items = [
    {
      icon: TrendingDown,
      label: "Wholesale Deals",
      value: String(stats.totalCount),
      color: "text-emerald-400",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
    },
    {
      icon: Tag,
      label: "Total Available Savings",
      value: `$${(stats.totalSavings / 1000).toFixed(0)}K`,
      color: "text-amber-300",
      bg: "rgba(201,162,39,0.08)",
      border: "rgba(201,162,39,0.2)",
    },
    {
      icon: DollarSign,
      label: "Avg Savings / Vehicle",
      value: `$${stats.avgSavings.toLocaleString()}`,
      color: "text-amber-300",
      bg: "rgba(201,162,39,0.08)",
      border: "rgba(201,162,39,0.2)",
    },
    {
      icon: Activity,
      label: "Avg Guardian Score",
      value: String(stats.avgGuardianScore),
      color: "text-emerald-400",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(({ icon: Icon, label, value, color, bg, border }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-base font-black ${color}`}>{value}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider leading-tight">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "all" | "wholesale";

export default function Marketplace() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<SearchFilters>({
    make: "", price_max: "", miles_max: "", year: "",
  });
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedCar, setSelectedCar] = useState<MarketListing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [watchedVins, setWatchedVins] = useState<Set<string>>(new Set());
  const [wholesaleStats, setWholesaleStats] = useState<WholesaleStats | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch wholesale stats on mount
  useEffect(() => {
    fetch(`${BASE}/api/marketcheck/wholesale`)
      .then((r) => r.json())
      .then((d) => {
        setWholesaleStats({
          totalCount: d.totalCount,
          totalSavings: d.totalSavings,
          avgSavings: d.avgSavings,
          avgGuardianScore: d.avgGuardianScore,
        });
      })
      .catch(() => {});
  }, []);

  const handleWatch = useCallback(async (car: MarketListing) => {
    if (watchedVins.has(car.id)) return;
    const maskedVin = car.vin ? "•".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4) : "N/A";
    await fetch(`${BASE}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vinMasked: maskedVin,
        heading: car.heading,
        make: car.make,
        model: car.model,
        year: car.year,
        listedPrice: car.price ?? null,
        targetPrice: car.club_price ?? (car.price ? Math.round(car.price * 0.95) : null),
      }),
    });
    setWatchedVins((prev) => new Set([...prev, car.id]));
  }, [watchedVins]);

  const fetchListings = useCallback(async (f: SearchFilters, q: string, t: Tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.make) params.set("make", f.make);
      if (f.price_max) params.set("price_max", f.price_max);
      if (f.miles_max) params.set("miles_max", f.miles_max);
      if (f.year) params.set("year", f.year);
      if (q) params.set("search", q);
      if (t === "wholesale") params.set("wholesale_only", "true");
      params.set("rows", "24");
      const res = await fetch(`${BASE}/api/marketcheck/search?${params}`);
      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.totalCount ?? data.listings?.length ?? 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(filters, search, tab); }, [tab]);

  const applyFilters = () => { fetchListings(filters, search, tab); setShowFilters(false); };
  const clearFilters = () => {
    const empty = { make: "", price_max: "", miles_max: "", year: "" };
    setFilters(empty);
    setSearch("");
    fetchListings(empty, "", tab);
    setShowFilters(false);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchListings(filters, val, tab), 350);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);
  const wholesaleCount = listings.filter((l) => l.wholesale_potential).length;

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={ShoppingBag}
        accent="#C9A227"
        title={t("marketplace.title")}
        subtitle={t("marketplace.subtitle")}
        badge={<span className="neural-badge neural-badge-gold"><span className="ai-live-dot-gold mr-1" />MARKETCHECK</span>}
        actions={
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeFilterCount > 0
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        }
      />
      <div className="p-6">

        {/* ── Tab switcher ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-5">
          <button
            onClick={() => { setTab("all"); fetchListings(filters, search, "all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "all"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            All Inventory
          </button>
          <button
            onClick={() => { setTab("wholesale"); fetchListings(filters, search, "wholesale"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === "wholesale"
                ? "text-amber-300"
                : "text-white/40 hover:text-white/70"
            }`}
            style={tab === "wholesale" ? {
              background: "linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(201,162,39,0.05) 100%)",
              border: "1px solid rgba(201,162,39,0.25)",
            } : {}}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Wholesale Engine
            {wholesaleStats && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-black">
                {wholesaleStats.totalCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Wholesale Stats Bar ──────────────────────────────────────────── */}
        {tab === "wholesale" && wholesaleStats && (
          <>
            <WholesaleStatsBar stats={wholesaleStats} />

            {/* Explanation banner */}
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(201,162,39,0.06) 0%, rgba(6,6,10,0.95) 100%)",
                border: "1px solid rgba(201,162,39,0.15)",
              }}
            >
              <BrainCircuit className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300 mb-0.5">How Wholesale Pricing Works</p>
                <p className="text-[11px] text-white/35 leading-relaxed">
                  The 3C Marketplace Agent scans national listings and flags vehicles priced{" "}
                  <span className="text-amber-400/70">below local market average</span>.
                  We apply a{" "}
                  <span className="text-emerald-400/70">3% negotiated dealer discount</span>{" "}
                  and add a 1.2% concierge coordination fee, producing your{" "}
                  <span className="text-amber-300 font-semibold">3C Club Price</span>.
                  Every vehicle includes an AI{" "}
                  <span className="text-white/60">Guardian Health Score</span>{" "}
                  derived from VIN history, mileage, and market velocity.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              placeholder={tab === "wholesale"
                ? "Search wholesale deals — make, model, color, city…"
                : "Search all inventory…"}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* ── Filter panel ─────────────────────────────────────────────────── */}
        {showFilters && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Make</label>
                <select
                  value={filters.make}
                  onChange={(e) => setFilters((p) => ({ ...p, make: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                >
                  {MAKES.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[var(--onyx-surface)]">{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Max Price</label>
                <select
                  value={filters.price_max}
                  onChange={(e) => setFilters((p) => ({ ...p, price_max: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="" className="bg-[var(--onyx-surface)]">Any Price</option>
                  <option value="150000" className="bg-[var(--onyx-surface)]">Under $150K</option>
                  <option value="200000" className="bg-[var(--onyx-surface)]">Under $200K</option>
                  <option value="250000" className="bg-[var(--onyx-surface)]">Under $250K</option>
                  <option value="350000" className="bg-[var(--onyx-surface)]">Under $350K</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Max Miles</label>
                <select
                  value={filters.miles_max}
                  onChange={(e) => setFilters((p) => ({ ...p, miles_max: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="" className="bg-[var(--onyx-surface)]">Any Mileage</option>
                  <option value="5000" className="bg-[var(--onyx-surface)]">Under 5,000 mi</option>
                  <option value="10000" className="bg-[var(--onyx-surface)]">Under 10,000 mi</option>
                  <option value="20000" className="bg-[var(--onyx-surface)]">Under 20,000 mi</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="" className="bg-[var(--onyx-surface)]">Any Year</option>
                  <option value="2023" className="bg-[var(--onyx-surface)]">2023</option>
                  <option value="2022" className="bg-[var(--onyx-surface)]">2022</option>
                  <option value="2021" className="bg-[var(--onyx-surface)]">2021</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors">
                Apply Filters
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors">
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Count bar ────────────────────────────────────────────────────── */}
        {!loading && (
          <p className="text-xs text-white/25 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {total} {tab === "wholesale" ? "wholesale" : "certified"}{" "}
            {total === 1 ? "listing" : "listings"} available
            {tab === "all" && wholesaleCount > 0 && (
              <>
                {" "}·{" "}
                <span
                  className="text-amber-400 cursor-pointer hover:text-amber-300 transition-colors"
                  onClick={() => { setTab("wholesale"); fetchListings(filters, search, "wholesale"); }}
                >
                  {wholesaleCount} below market average ↗
                </span>
              </>
            )}
          </p>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/5 ml-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="h-3 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded" />
                  </div>
                  <div className="h-16 bg-white/5 rounded-xl" />
                  <div className="h-9 bg-white/5 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Car className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No listings match your filters.</p>
            <button onClick={clearFilters} className="mt-3 text-amber-400/70 text-sm hover:text-amber-400 transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((car) => (
              <WholesaleCard
                key={car.id}
                car={car}
                onConcierge={setSelectedCar}
                onWatch={handleWatch}
                watched={watchedVins.has(car.id)}
              />
            ))}
          </div>
        )}

        {selectedCar && <ConciergeModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
      </div>
    </div>
  );
}
