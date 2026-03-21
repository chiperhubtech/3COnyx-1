import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, BadgeCheck, Fuel, Gauge, Calendar, MapPin,
  SlidersHorizontal, Loader2, Car, X, CheckCircle2,
  ChevronDown, Zap, Bookmark, BookmarkCheck,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

function CarCard({ car, onConcierge, onWatch, watched }: {
  car: MarketListing;
  onConcierge: (c: MarketListing) => void;
  onWatch: (c: MarketListing) => void;
  watched: boolean;
}) {
  const photo = car.media?.photo_links?.[0];
  const location = [car.city, car.state].filter(Boolean).join(", ");
  const maskedVin = car.vin
    ? "•".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4)
    : "N/A";
  const isElectric = car.fuel_type?.toLowerCase().includes("electric");
  const isHybrid = car.fuel_type?.toLowerCase().includes("hybrid");

  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-amber-500/25 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden shrink-0">
        {photo ? (
          <img
            src={photo}
            alt={car.heading}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* 3C Certified badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40">
          <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-300 tracking-wide">3C Certified</span>
        </div>

        {/* Fuel type */}
        {(isElectric || isHybrid) && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-medium">{isElectric ? "EV" : "Hybrid"}</span>
          </div>
        )}

        {/* Days listed */}
        {car.dom != null && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-white/50">{car.dom}d listed</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        <div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
            {car.heading}
          </h3>
          {car.exterior_color && (
            <p className="text-xs text-white/35 mt-0.5">{car.exterior_color}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-white/45">
            <Gauge className="w-3 h-3 text-white/20 shrink-0" />
            {car.miles != null ? `${car.miles.toLocaleString()} mi` : "—"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/45">
            <Calendar className="w-3 h-3 text-white/20 shrink-0" />
            {car.year}
          </div>
          {car.fuel_type && (
            <div className="flex items-center gap-1.5 text-xs text-white/45">
              <Fuel className="w-3 h-3 text-white/20 shrink-0" />
              {car.fuel_type}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-white/45">
              <MapPin className="w-3 h-3 text-white/20 shrink-0" />
              {location}
            </div>
          )}
        </div>

        <p className="text-[10px] font-mono text-white/15 tracking-widest">VIN {maskedVin}</p>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-white">
            {car.price != null ? `$${car.price.toLocaleString()}` : "Call"}
          </p>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Buy via Concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={state !== "submitting" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f13] shadow-2xl overflow-hidden">
        {state === "success" ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Request Submitted</h2>
            <p className="text-white/40 text-sm mb-2">
              Your 3C Concierge will reach out within <span className="text-white/60 font-medium">2 business hours</span> to arrange inspection, financing, and white-glove delivery.
            </p>
            <p className="text-xs text-white/25 font-mono mb-6">Ref: 3C-{Date.now().toString().slice(-6)}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-white font-semibold">Buy via Concierge</h2>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Vehicle summary */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 mb-5">
                {car.media?.photo_links?.[0] && (
                  <img src={car.media.photo_links[0]} alt="" className="w-full h-28 object-cover rounded-md mb-3" />
                )}
                <p className="text-sm font-medium text-white leading-snug">{car.heading}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-mono text-white/25">VIN {maskedVin}</p>
                  <p className="text-base font-bold text-amber-400">
                    {car.price != null ? `$${car.price.toLocaleString()}` : "Call"}
                  </p>
                </div>
              </div>

              {/* Form */}
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

export default function Marketplace() {
  const [filters, setFilters] = useState<SearchFilters>({
    make: "", price_max: "", miles_max: "", year: "",
  });
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedCar, setSelectedCar] = useState<MarketListing | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [watchedVins, setWatchedVins] = useState<Set<string>>(new Set());
  const [watchSuccess, setWatchSuccess] = useState<string | null>(null);

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
        targetPrice: car.price ? Math.round(car.price * 0.95) : null,
      }),
    });
    setWatchedVins((prev) => new Set([...prev, car.id]));
    setWatchSuccess(car.id);
    setTimeout(() => setWatchSuccess(null), 2000);
  }, [watchedVins]);

  const fetchListings = useCallback(async (f: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.make) params.set("make", f.make);
      if (f.price_max) params.set("price_max", f.price_max);
      if (f.miles_max) params.set("miles_max", f.miles_max);
      if (f.year) params.set("year", f.year);
      params.set("rows", "12");
      const res = await fetch(`/api/marketcheck/search?${params}`);
      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.totalCount ?? data.listings?.length ?? 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(filters); }, []);

  const applyFilters = () => { fetchListings(filters); setShowFilters(false); };
  const clearFilters = () => {
    const empty = { make: "", price_max: "", miles_max: "", year: "" };
    setFilters(empty);
    fetchListings(empty);
    setShowFilters(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>Marketplace</h1>
          </div>
          <p className="text-white/35 text-sm ml-[52px]">
            Live luxury listings — every vehicle is{" "}
            <span className="text-amber-400/70 font-medium">3C Certified</span>
          </p>
        </div>

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
      </div>

      {/* Filter panel */}
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
                  <option key={m.value} value={m.value} className="bg-[#1a1a1f]">{m.label}</option>
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
                <option value="" className="bg-[#1a1a1f]">Any Price</option>
                <option value="150000" className="bg-[#1a1a1f]">Under $150K</option>
                <option value="200000" className="bg-[#1a1a1f]">Under $200K</option>
                <option value="250000" className="bg-[#1a1a1f]">Under $250K</option>
                <option value="350000" className="bg-[#1a1a1f]">Under $350K</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Max Miles</label>
              <select
                value={filters.miles_max}
                onChange={(e) => setFilters((p) => ({ ...p, miles_max: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
              >
                <option value="" className="bg-[#1a1a1f]">Any Mileage</option>
                <option value="5000" className="bg-[#1a1a1f]">Under 5,000 mi</option>
                <option value="10000" className="bg-[#1a1a1f]">Under 10,000 mi</option>
                <option value="20000" className="bg-[#1a1a1f]">Under 20,000 mi</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
              >
                <option value="" className="bg-[#1a1a1f]">Any Year</option>
                <option value="2023" className="bg-[#1a1a1f]">2023</option>
                <option value="2022" className="bg-[#1a1a1f]">2022</option>
                <option value="2021" className="bg-[#1a1a1f]">2021</option>
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

      {/* Count bar */}
      {!loading && (
        <p className="text-xs text-white/25 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          {total} certified {total === 1 ? "listing" : "listings"} available
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden animate-pulse">
              <div className="h-48 bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <div className="h-5 bg-white/5 rounded w-20" />
                  <div className="h-8 bg-white/5 rounded w-32" />
                </div>
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
            <CarCard key={car.id} car={car} onConcierge={setSelectedCar} onWatch={handleWatch} watched={watchedVins.has(car.id)} />
          ))}
        </div>
      )}

      {selectedCar && <ConciergeModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
}
