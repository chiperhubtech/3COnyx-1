/**
 * 3C ONYX — Alibaba ICBU Dropshipping Catalog
 * Browse automobile parts imported from Alibaba (1-piece MOQ, Trade Assurance)
 */

import { useState, useEffect, useCallback } from "react";
import { Package, RefreshCw, ExternalLink, Trash2, ShieldCheck, AlertCircle, Info } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlibabaProduct {
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

interface AuthStatus {
  configured: boolean;
  authenticated: boolean;
  tokenActive: boolean;
  authorizeUrl: string | null;
  setupInstructions: string[] | null;
}

interface ImportResult {
  ok: boolean;
  totalFromApi?: number;
  returned?: number;
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

function priceRange(p: AlibabaProduct): string {
  if (p.priceMin && p.priceMax && p.priceMin !== p.priceMax) {
    return `$${p.priceMin} – $${p.priceMax}`;
  }
  return p.priceUsd ? `$${p.priceUsd}` : p.priceMin ? `$${p.priceMin}` : "—";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlibabaDropship() {
  const [products, setProducts] = useState<AlibabaProduct[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "trade">("all");
  const [keywords, setKeywords] = useState("automobile parts accessories");

  const fetchAuthStatus = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}api/alibaba/auth/status`);
      const data = (await r.json()) as AuthStatus;
      setAuthStatus(data);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "trade" ? "?tradeAssurance=true" : "";
      const r = await fetch(`${BASE}api/alibaba/products${qs}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { products: AlibabaProduct[] };
      setProducts(data.products);
    } catch {
      setError("Could not load products. Check API server connection.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function runImport() {
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const token = localStorage.getItem("onyxToken");
      const r = await fetch(`${BASE}api/alibaba/products/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          keywords,
          pageSize: 20,
          requireTradeAssurance: true,
          maxMoq: 1,
        }),
      });
      const data = (await r.json()) as ImportResult;
      setImportResult(data);
      if (data.ok) fetchProducts();
    } catch {
      setError("Import request failed. Check your session and try again.");
    } finally {
      setImporting(false);
    }
  }

  async function deleteProduct(id: number) {
    const token = localStorage.getItem("onyxToken");
    await fetch(`${BASE}api/alibaba/products/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const tradeCount = products.filter((p) => p.hasTradeAssurance).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Package className="w-7 h-7 text-[#C9A227]" />
            <h1 className="text-2xl font-bold tracking-tight">
              Alibaba ICBU <span className="text-[#C9A227]">Dropship Catalog</span>
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-10">
            Automobile parts · 1-piece MOQ · Trade Assurance · IOP-signed API
          </p>
        </div>

        {/* Auth status pill */}
        {authStatus && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start sm:self-auto ${
            authStatus.configured && authStatus.tokenActive
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : authStatus.configured
              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              authStatus.configured && authStatus.tokenActive
                ? "bg-green-400"
                : authStatus.configured
                ? "bg-yellow-400 animate-pulse"
                : "bg-red-400"
            }`} />
            {authStatus.configured && authStatus.tokenActive
              ? "API Active"
              : authStatus.configured
              ? "Credentials Set — Token Needed"
              : "Setup Required"}
          </div>
        )}
      </div>

      {/* Setup Banner */}
      {authStatus && !authStatus.configured && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-yellow-400">
              Setup Required — Alibaba Open Platform
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-3 ml-6">
            Get your credentials from the{" "}
            <a
              href="https://developer.alibaba.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A227] underline"
            >
              Alibaba Open Platform
            </a>{" "}
            console, then add them as Replit Secrets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
            {(authStatus.setupInstructions ?? []).map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="text-[#C9A227] font-bold mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          {authStatus.authorizeUrl && (
            <p className="text-xs text-gray-500 mt-3 ml-6">
              OAuth URL:{" "}
              <code className="text-yellow-300/80 break-all text-[10px]">
                {authStatus.authorizeUrl}
              </code>
            </p>
          )}
        </div>
      )}

      {/* Import Control Bar */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords (e.g. brake pads, car audio, suspension)"
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50 min-w-0"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Filter tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 transition-colors ${
                filter === "all"
                  ? "bg-[#C9A227] text-black font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilter("trade")}
              className={`px-3 py-1.5 transition-colors ${
                filter === "trade"
                  ? "bg-[#C9A227] text-black font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Trade Assured ({tradeCount})
            </button>
          </div>

          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={runImport}
            disabled={importing}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              importing
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-[#C9A227] text-black hover:bg-[#D4A828] active:scale-95"
            }`}
          >
            {importing ? "Importing…" : "Import from Alibaba"}
          </button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`mb-5 p-4 rounded-xl border text-sm ${
          importResult.ok
            ? "border-green-500/30 bg-green-500/5 text-green-300"
            : importResult.setupRequired
            ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-300"
            : "border-red-500/30 bg-red-500/5 text-red-300"
        }`}>
          {importResult.ok ? (
            <>
              <span className="font-semibold">Import complete.</span>{" "}
              API returned {importResult.totalFromApi} products → {importResult.afterFilter} matched
              filters (1-piece MOQ + Trade Assurance) → {importResult.inserted} new,{" "}
              {importResult.updated} updated.
            </>
          ) : importResult.setupRequired ? (
            <>
              <span className="font-semibold">Credentials missing.</span>{" "}
              Add <code className="bg-black/30 px-1 rounded">ALIBABA_APP_KEY</code> and{" "}
              <code className="bg-black/30 px-1 rounded">ALIBABA_APP_SECRET</code> to Replit
              Secrets.
            </>
          ) : (
            <>
              <span className="font-semibold">Import error:</span> {importResult.error}
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-white/[0.03] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-400 text-sm">No products in catalog yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Enter keywords above and click "Import from Alibaba" to search the ICBU catalog.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={deleteProduct}
              />
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center mt-8">
            {products.length} products · Sourced via alibaba.icbu.product.list (IOP gateway)
          </p>
        </>
      )}

      {/* IOP Info Panel */}
      <div className="mt-12 p-4 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-gray-500">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-400">IOP Integration Details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
          <span>
            Gateway:{" "}
            <code className="text-gray-300">https://api.taobao.com/router/rest</code>
          </span>
          <span>
            Method:{" "}
            <code className="text-gray-300">alibaba.icbu.product.list</code>
          </span>
          <span>
            Sign method: <code className="text-gray-300">HMAC-SHA256</code>
          </span>
          <span>
            OAuth:{" "}
            <code className="text-gray-300">https://oauth.alibaba.com/token</code>
          </span>
          <span>
            Filter:{" "}
            <code className="text-gray-300">MOQ ≤ 1 · Trade Assurance = true</code>
          </span>
          <span>
            Storage:{" "}
            <code className="text-gray-300">PostgreSQL alibaba_products</code>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: AlibabaProduct;
  onDelete: (id: number) => Promise<void>;
}

function ProductCard({ product: p, onDelete }: ProductCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(p.id);
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#C9A227]/30 hover:bg-white/[0.05] transition-all overflow-hidden">
      {/* Image */}
      <div className="relative h-44 bg-black/30 overflow-hidden flex-shrink-0">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">
            🔩
          </div>
        )}

        {/* Trade Assurance Badge */}
        {p.hasTradeAssurance && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/90 text-black text-[10px] font-bold rounded">
            <ShieldCheck className="w-2.5 h-2.5" />
            TRADE
          </div>
        )}

        {/* MOQ Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 border border-white/20 text-white text-[10px] rounded">
          MOQ: {p.moq ?? 1}pc
        </div>

        {/* Delete on hover */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/80 hover:bg-red-500 rounded text-white disabled:opacity-40"
          title="Remove from catalog"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-medium text-white leading-tight line-clamp-2">
          {p.title}
        </p>

        <p className="text-sm font-bold text-[#C9A227]">{priceRange(p)}</p>

        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span>{flagEmoji(p.supplierCountry)}</span>
          <span className="truncate">{p.supplierName ?? "Unknown Supplier"}</span>
        </div>

        {p.category && (
          <span className="self-start px-1.5 py-0.5 bg-white/5 border border-white/10 text-[10px] text-gray-400 rounded">
            {p.category}
          </span>
        )}

        {p.ordersCount && p.ordersCount > 0 ? (
          <p className="text-[10px] text-gray-500">
            {p.ordersCount.toLocaleString()} orders
          </p>
        ) : null}

        <div className="mt-auto pt-2">
          {p.detailUrl && (
            <a
              href={p.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] text-xs font-medium hover:bg-[#C9A227]/20 transition-colors w-full"
            >
              <ExternalLink className="w-3 h-3" />
              View on Alibaba
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
