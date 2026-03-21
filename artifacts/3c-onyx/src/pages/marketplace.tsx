import { useState } from "react";
import {
  Search,
  ShoppingBag,
  BadgeCheck,
  Fuel,
  Gauge,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  Car,
} from "lucide-react";

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
  interior_color?: string;
  fuel_type?: string;
  city?: string;
  state?: string;
  seller?: { name?: string };
  media?: { photo_links?: string[] };
  dom?: number;
  vdp_url?: string;
  vin: string;
}

interface SearchFilters {
  make: string;
  model: string;
  price_max: string;
  miles_max: string;
  zip: string;
  year: string;
}

const LUXURY_MAKES = [
  "", "Rolls-Royce", "Bentley", "Lamborghini", "Ferrari",
  "Porsche", "Maserati", "Aston Martin", "McLaren", "Bugatti",
  "Mercedes-Benz", "BMW", "Audi", "Lexus", "Genesis",
];

function CarCard({ car, onConcierge }: { car: MarketListing; onConcierge: (car: MarketListing) => void }) {
  const photo = car.media?.photo_links?.[0];
  const location = [car.city, car.state].filter(Boolean).join(", ");
  const maskedVin = car.vin ? "*".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4) : "N/A";

  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-amber-500/20 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-white/5 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={car.heading}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-white/10" />
          </div>
        )}
        {/* 3C Certified badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-amber-400/40">
          <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-300 tracking-wide">3C Certified</span>
        </div>
        {/* Days on market */}
        {car.dom != null && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-white/50">{car.dom}d listed</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
            {car.heading || `${car.year} ${car.make} ${car.model}`}
          </h3>
          {car.trim && (
            <p className="text-xs text-white/40 mt-0.5">{car.trim}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Gauge className="w-3.5 h-3.5 text-white/25 shrink-0" />
            {car.miles != null ? `${car.miles.toLocaleString()} mi` : "—"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Calendar className="w-3.5 h-3.5 text-white/25 shrink-0" />
            {car.year}
          </div>
          {car.fuel_type && (
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Fuel className="w-3.5 h-3.5 text-white/25 shrink-0" />
              {car.fuel_type}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0" />
              {location}
            </div>
          )}
        </div>

        {/* VIN masked */}
        <div className="text-[10px] font-mono text-white/20 tracking-wide">
          VIN {maskedVin}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-white">
              {car.price != null ? `$${car.price.toLocaleString()}` : "Price TBD"}
            </p>
          </div>
          <button
            onClick={() => onConcierge(car)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Buy via Concierge
          </button>
        </div>
      </div>
    </div>
  );
}

function ConciergeModal({ car, onClose }: { car: MarketListing; onClose: () => void }) {
  const maskedVin = car.vin ? "*".repeat(Math.max(0, car.vin.length - 4)) + car.vin.slice(-4) : "N/A";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f13] p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <BadgeCheck className="w-5 h-5 text-amber-400" />
          <h2 className="text-white font-semibold">Request via Concierge</h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-5">
          <p className="text-sm font-medium text-white mb-1">{car.heading}</p>
          <p className="text-xs text-white/40">VIN {maskedVin}</p>
          {car.price != null && (
            <p className="text-lg font-bold text-amber-400 mt-2">${car.price.toLocaleString()}</p>
          )}
        </div>
        <p className="text-sm text-white/50 mb-5">
          A 3C Concierge will contact you to arrange financing, inspection, and white-glove delivery for this vehicle.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [filters, setFilters] = useState<SearchFilters>({
    make: "Porsche",
    model: "",
    price_max: "",
    miles_max: "",
    zip: "",
    year: "",
  });
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedCar, setSelectedCar] = useState<MarketListing | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.make) params.set("make", filters.make);
      if (filters.model) params.set("model", filters.model);
      if (filters.price_max) params.set("price_max", filters.price_max);
      if (filters.miles_max) params.set("miles_max", filters.miles_max);
      if (filters.zip) params.set("zip", filters.zip);
      if (filters.year) params.set("year", filters.year);
      params.set("rows", "12");

      const res = await fetch(`/api/marketcheck/search?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error ${res.status}`);
      }
      const data = await res.json();
      setListings(data.listings ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Search failed");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Marketplace</h1>
        </div>
        <p className="text-white/40 text-sm ml-[52px]">Live listings powered by MarketCheck — every result is 3C Certified</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-medium text-white">Search Filters</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Make</label>
            <select
              value={filters.make}
              onChange={(e) => updateFilter("make", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none"
            >
              {LUXURY_MAKES.map((m) => (
                <option key={m} value={m} className="bg-[#1a1a1f]">
                  {m || "Any Make"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Model</label>
            <input
              type="text"
              placeholder="e.g. 911, Cayenne"
              value={filters.model}
              onChange={(e) => updateFilter("model", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Year</label>
            <input
              type="text"
              placeholder="e.g. 2022"
              value={filters.year}
              onChange={(e) => updateFilter("year", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Max Price</label>
            <input
              type="text"
              placeholder="e.g. 150000"
              value={filters.price_max}
              onChange={(e) => updateFilter("price_max", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">Max Miles</label>
            <input
              type="text"
              placeholder="e.g. 30000"
              value={filters.miles_max}
              onChange={(e) => updateFilter("miles_max", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1">ZIP Code</label>
            <input
              type="text"
              placeholder="e.g. 90210"
              value={filters.zip}
              onChange={(e) => updateFilter("zip", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? "Searching..." : "Search Listings"}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-400/20 bg-red-400/5 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Search Failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && searched && listings.length === 0 && !error && (
        <div className="text-center py-16">
          <Car className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No listings found. Try adjusting your filters.</p>
        </div>
      )}

      {!searched && !loading && (
        <div className="text-center py-16">
          <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Select filters above and search to browse live listings.</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden animate-pulse">
              <div className="h-44 bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-8 bg-white/5 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <p className="text-xs text-white/30 mb-4">{listings.length} listings found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((car) => (
              <CarCard key={car.id} car={car} onConcierge={setSelectedCar} />
            ))}
          </div>
        </>
      )}

      {/* Concierge modal */}
      {selectedCar && (
        <ConciergeModal car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </div>
  );
}
