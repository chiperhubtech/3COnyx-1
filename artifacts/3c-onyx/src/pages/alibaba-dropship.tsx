/**
 * 3C ONYX — ONYX Parts Catalog
 * Globally sourced automobile parts — 1-piece minimum, quality guaranteed.
 * Infrastructure: Alibaba ICBU IOP (internal, not member-visible)
 */

import { useState, useEffect, useCallback } from "react";
import { Package, RefreshCw, ShieldCheck, AlertCircle, Info, Trash2, CheckCircle2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnyxPart {
  id: number;
  alibabaProductId: string | null;
  title: string;
  priceUsd: string | null;
  priceMin: string | null;
  priceMax: string | null;
  imageUrl: string | null;
  detailUrl: string | null;
  supplierName: string | null;
  supplierCountry: string | null;
  moq: number | null;
  hasTradeAssurance: boolean;
  category: string | null;
  starRating: string | null;
  ordersCount: number | null;
  keywords: string | null;
  importedAt: string;
}

interface CatalogStatus {
  configured: boolean;
  authenticated: boolean;
  tokenActive: boolean;
}

interface SyncResult {
  ok: boolean;
  afterFilter?: number;
  inserted?: number;
  updated?: number;
  error?: string;
  setupRequired?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flagEmoji(country?: string | null): string {
  if (!country) return "🌐";
  const map: Record<string, string> = {
    CN: "🇨🇳", US: "🇺🇸", DE: "🇩🇪", JP: "🇯🇵", KR: "🇰🇷",
    TW: "🇹🇼", IN: "🇮🇳", TR: "🇹🇷", VN: "🇻🇳",
  };
  return map[country.toUpperCase()] ?? "🌐";
}

function priceRange(p: OnyxPart): string {
  if (p.priceMin && p.priceMax && p.priceMin !== p.priceMax) {
    return `$${p.priceMin} – $${p.priceMax}`;
  }
  return p.priceUsd ? `$${p.priceUsd}` : p.priceMin ? `$${p.priceMin}` : "Contact for price";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnyxPartsCatalog() {
  const [parts, setParts] = useState<OnyxPart[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "guaranteed">("all");
  const [keywords, setKeywords] = useState("automobile parts accessories");

  const fetchCatalogStatus = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}api/alibaba/auth/status`);
      const data = (await r.json()) as { configured: boolean; authenticated: boolean; tokenActive: boolean };
      setCatalogStatus(data);
    } catch {
      // silently ignore — catalog still displays
    }
  }, []);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "guaranteed" ? "?tradeAssurance=true" : "";
      const r = await fetch(`${BASE}api/alibaba/products${qs}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { products: OnyxPart[] };
      setParts(data.products);
    } catch {
      setError("Could not load catalog. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchCatalogStatus(); }, [fetchCatalogStatus]);
  useEffect(() => { fetchParts(); }, [fetchParts]);

  async function syncCatalog() {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const token = localStorage.getItem("onyxToken");
      const r = await fetch(`${BASE}api/alibaba/products/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ keywords, pageSize: 20, requireTradeAssurance: true, maxMoq: 1 }),
      });
      const data = (await r.json()) as SyncResult;
      setSyncResult(data);
      if (data.ok) fetchParts();
    } catch {
      setError("Catalog sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function removePart(id: number) {
    const token = localStorage.getItem("onyxToken");
    await fetch(`${BASE}api/alibaba/products/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setParts((prev) => prev.filter((p) => p.id !== id));
  }

  const guaranteedCount = parts.filter((p) => p.hasTradeAssurance).length;

  // Catalog live = credentials configured + token active
  const catalogLive = catalogStatus?.configured && catalogStatus?.tokenActive;
  const catalogReady = catalogStatus?.configured && !catalogStatus?.tokenActive;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Package className="w-7 h-7 text-[#C9A227]" />
            <h1 className="text-2xl font-bold tracking-tight">
              ONYX <span className="text-[#C9A227]">Parts Catalog</span>
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Globally sourced automobile parts · No minimums · ONYX Guaranteed quality
          </p>
        </div>

        {/* Catalog status indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start sm:self-auto ${
          catalogLive
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : catalogReady
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
            : "border-gray-500/40 bg-gray-500/10 text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            catalogLive ? "bg-green-400 animate-pulse" : catalogReady ? "bg-yellow-400" : "bg-gray-500"
          }`} />
          {catalogLive ? "Catalog Live" : catalogReady ? "Credentials Ready" : "Setup Pending"}
        </div>
      </div>

      {/* ── Admin Setup Notice (only shown when not configured) ── */}
      {catalogStatus && !catalogStatus.configured && (
        <div className="mb-6 p-4 rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/5">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#C9A227] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#C9A227] mb-1">ONYX Parts Sourcing — Admin Configuration Required</p>
              <p className="text-xs text-gray-400">
                The ONYX Parts Catalog requires sourcing credentials to be configured by an administrator.
                Contact your ONYX platform admin to enable live catalog syncing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search + Filter + Sync Bar ── */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Search parts (e.g. brake pads, suspension, lighting)"
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50 min-w-0"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 transition-colors ${
                filter === "all" ? "bg-[#C9A227] text-black font-medium" : "text-gray-400 hover:text-white"
              }`}
            >
              All ({parts.length})
            </button>
            <button
              onClick={() => setFilter("guaranteed")}
              className={`px-3 py-1.5 transition-colors ${
                filter === "guaranteed" ? "bg-[#C9A227] text-black font-medium" : "text-gray-400 hover:text-white"
              }`}
            >
              ONYX Guaranteed ({guaranteedCount})
            </button>
          </div>

          <button
            onClick={fetchParts}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
            title="Refresh catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={syncCatalog}
            disabled={syncing}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              syncing
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-[#C9A227] text-black hover:bg-[#D4A828] active:scale-95"
            }`}
          >
            {syncing ? "Syncing…" : "Sync ONYX Catalog"}
          </button>
        </div>
      </div>

      {/* ── Sync Result Banner ── */}
      {syncResult && (
        <div className={`mb-5 p-4 rounded-xl border text-sm flex items-start gap-2 ${
          syncResult.ok
            ? "border-green-500/30 bg-green-500/5 text-green-300"
            : syncResult.setupRequired
            ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-300"
            : "border-red-500/30 bg-red-500/5 text-red-300"
        }`}>
          {syncResult.ok
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          {syncResult.ok ? (
            <span>
              <span className="font-semibold">Catalog synced.</span>{" "}
              {syncResult.afterFilter} parts matched quality standards — {syncResult.inserted} new,{" "}
              {syncResult.updated} updated.
            </span>
          ) : syncResult.setupRequired ? (
            <span>
              <span className="font-semibold">Admin action required.</span>{" "}
              Sourcing credentials need to be configured. Contact your ONYX platform admin.
            </span>
          ) : (
            <span><span className="font-semibold">Sync error.</span> {syncResult.error}</span>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Parts Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-white/[0.03] border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-400 text-sm font-medium">No parts in catalog yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Enter a search term and click "Sync ONYX Catalog" to populate the catalog.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {parts.map((part) => (
              <PartCard key={part.id} part={part} onRemove={removePart} />
            ))}
          </div>
          <p className="text-xs text-gray-600 text-center mt-8">
            {parts.length} parts in ONYX catalog
          </p>
        </>
      )}

      {/* ── ONYX Parts Promise ── */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <ShieldCheck className="w-5 h-5" />, title: "ONYX Guaranteed", body: "Every guaranteed part is quality-verified before entering the ONYX catalog. No compromises on fitment or reliability." },
          { icon: <Package className="w-5 h-5" />, title: "No Minimum Orders", body: "Order one part or one hundred. ONYX Parts has no quantity minimums — perfect for custom builds and single-vehicle jobs." },
          { icon: <CheckCircle2 className="w-5 h-5" />, title: "Global Sourcing", body: "Parts sourced from verified suppliers worldwide, vetted by ONYX quality standards. Every order tracked end-to-end." },
        ].map((card) => (
          <div key={card.title} className="p-5 rounded-2xl border border-[#C9A227]/15 bg-[#C9A227]/5 space-y-2">
            <div className="text-[#C9A227]">{card.icon}</div>
            <p className="text-sm font-bold text-white">{card.title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Part Card ────────────────────────────────────────────────────────────────

interface PartCardProps {
  part: OnyxPart;
  onRemove: (id: number) => Promise<void>;
}

function PartCard({ part: p, onRemove }: PartCardProps) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await onRemove(p.id);
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#C9A227]/30 hover:bg-white/[0.05] transition-all overflow-hidden">
      {/* Image */}
      <div className="relative h-44 bg-black/30 overflow-hidden flex-shrink-0">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-full h-full object-contain p-3"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">
            🔩
          </div>
        )}

        {/* ONYX Guaranteed badge */}
        {p.hasTradeAssurance && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-[#C9A227] text-black text-[9px] font-black rounded tracking-wide">
            <ShieldCheck className="w-2.5 h-2.5" />
            ONYX GUARANTEED
          </div>
        )}

        {/* No minimum badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 border border-white/20 text-white text-[10px] rounded">
          Min: {p.moq ?? 1}pc
        </div>

        {/* Remove button (admin action) */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/80 hover:bg-red-500 rounded text-white disabled:opacity-40"
          title="Remove from catalog"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-medium text-white leading-tight line-clamp-2">{p.title}</p>

        <p className="text-sm font-bold text-[#C9A227]">{priceRange(p)}</p>

        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span>{flagEmoji(p.supplierCountry)}</span>
          <span className="truncate">Verified Supplier</span>
        </div>

        {p.category && (
          <span className="self-start px-1.5 py-0.5 bg-white/5 border border-white/10 text-[10px] text-gray-400 rounded">
            {p.category}
          </span>
        )}

        {p.ordersCount && p.ordersCount > 0 ? (
          <p className="text-[10px] text-gray-500">
            {p.ordersCount.toLocaleString()} orders fulfilled
          </p>
        ) : null}
      </div>
    </div>
  );
}
