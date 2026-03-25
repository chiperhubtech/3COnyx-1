import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Flame, CircleDot, Disc3, Settings2, Wind,
  Triangle, UserCircle2, Sun, Volume2, Cpu, Car, Star,
  ChevronRight, X, CheckCircle2, ShoppingCart, Zap, Eye,
  ArrowRight, Package, Truck, Shield, RefreshCw, SlidersHorizontal,
  BadgeCheck, Layers, Globe, ExternalLink, Plus, Minus, Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ProductOption {
  id: string;
  label: string;
  type: string;
  choices: { value: string; label: string; priceAdj?: number; hex?: string }[];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  supplierName: string;
  supplierId: string;
  category: string;
  subcategory: string;
  price: number;
  salePrice?: number;
  source: "sema" | "api2cart" | "apexx";
  platform?: string;
  imageColor: string;
  categoryIcon: string;
  description: string;
  longDescription: string;
  specs: Record<string, string>;
  options: ProductOption[];
  inStock: boolean;
  leadTime: string;
  arEnabled: boolean;
  installTime: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  weight: string;
  warranty: string;
  fitmentConfirmed: boolean | null;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  count: number;
  color: string;
}

interface Supplier {
  id: string;
  name: string;
  source: "sema" | "api2cart" | "apexx";
  platform?: string;
  category: string[];
  productsCount: number;
  rating: number;
  leadTime: string;
  marginRange: string;
  verified: boolean;
  semaShowYear?: number;
  apexxTier?: string;
  tagline: string;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const VEHICLES = [
  { id: "", label: "All Vehicles" },
  { id: "v1", label: "2021 BMW M5" },
  { id: "v2", label: "2019 Mercedes S580" },
  { id: "v3", label: "2023 Porsche 911 GT3" },
];

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sema:     { label: "SEMA VERIFIED", color: "#C9A227", bg: "#C9A22710", border: "#C9A22730" },
  api2cart: { label: "API2CART",      color: "#3B82F6", bg: "#3B82F610", border: "#3B82F630" },
  apexx:    { label: "APEXX NETWORK", color: "#8B5CF6", bg: "#8B5CF610", border: "#8B5CF630" },
};

/* ─── Icon helper ────────────────────────────────────────────────────────── */

function CategoryIcon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const props = { size, color: color ?? "currentColor" };
  switch (name) {
    case "flame":    return <Flame {...props} />;
    case "circle":   return <CircleDot {...props} />;
    case "disc":     return <Disc3 {...props} />;
    case "settings": return <Settings2 {...props} />;
    case "wind":     return <Wind {...props} />;
    case "triangle": return <Triangle {...props} />;
    case "user":     return <UserCircle2 {...props} />;
    case "sun":      return <Sun {...props} />;
    case "volume-2": return <Volume2 {...props} />;
    case "cpu":      return <Cpu {...props} />;
    default:         return <ShoppingBag {...props} />;
  }
}

/* ─── Source badge ───────────────────────────────────────────────────────── */

function SourceBadge({ source }: { source: "sema" | "api2cart" | "apexx" }) {
  const cfg = SOURCE_CONFIG[source];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wider border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <BadgeCheck size={8} />
      {cfg.label}
    </span>
  );
}

/* ─── AR Try-On view ─────────────────────────────────────────────────────── */

function ARTryOn({ product, vehicle }: { product: Product; vehicle: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#C9A22730", background: "linear-gradient(135deg, #0D0D0D 0%, #1A1200 100%)" }}>
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="w-full flex items-center justify-center gap-3 py-8 transition-all hover:opacity-90"
        >
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold" style={{ borderColor: "#C9A22740", background: "#C9A22715", color: "#C9A227" }}>
            <Eye size={16} />
            Virtual Try-On — View on Your Car
          </div>
        </button>
      ) : (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest" style={{ color: "#C9A227" }}>VIRTUAL TRY-ON ACTIVE</span>
            </div>
            <button onClick={() => setActive(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
          </div>

          {/* Car silhouette view */}
          <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg, #0A0A14 0%, #0A120A 100%)", minHeight: 220 }}>
            {/* Grid lines */}
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(201,162,39,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            {/* Car silhouette SVG */}
            <div className="flex items-center justify-center h-52">
              <svg viewBox="0 0 400 160" className="w-full max-w-sm opacity-80" fill="none">
                {/* Body */}
                <path d="M30 100 L30 80 Q30 60 50 55 L120 40 Q160 25 200 25 Q240 25 260 35 L340 55 Q360 60 370 80 L370 100" fill="#1A1A2A" stroke="#C9A227" strokeWidth="1.5"/>
                {/* Roof */}
                <path d="M120 55 Q160 30 200 28 Q240 28 265 40 L310 55" fill="#111122" stroke="#C9A227" strokeWidth="1"/>
                {/* Windows */}
                <path d="M130 55 Q165 35 200 33 Q230 33 248 42 L272 55" fill="#1E3A5F" stroke="#3B82F6" strokeWidth="0.8" opacity="0.7"/>
                {/* Bottom rail */}
                <rect x="30" y="100" width="340" height="12" rx="4" fill="#0D0D1A" stroke="#C9A227" strokeWidth="1"/>
                {/* Front wheel */}
                <circle cx="95" cy="112" r="28" fill="#111" stroke="#C9A227" strokeWidth="2"/>
                <circle cx="95" cy="112" r="16" fill="#1A1A1A" stroke="#888" strokeWidth="1.5"/>
                <circle cx="95" cy="112" r="6" fill="#C9A227"/>
                {/* Rear wheel */}
                <circle cx="305" cy="112" r="28" fill="#111" stroke="#C9A227" strokeWidth="2"/>
                <circle cx="305" cy="112" r="16" fill="#1A1A1A" stroke="#888" strokeWidth="1.5"/>
                <circle cx="305" cy="112" r="6" fill="#C9A227"/>
                {/* Headlight */}
                <ellipse cx="45" cy="78" rx="10" ry="6" fill="#FCD34D" opacity="0.4"/>
                {/* Taillight */}
                <ellipse cx="355" cy="78" rx="8" ry="5" fill="#EF4444" opacity="0.5"/>
              </svg>
            </div>

            {/* Product overlay indicator */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${product.imageColor}40`, borderColor: `${product.imageColor}60`, border: "1px solid", color: "#fff" }}>
              <CategoryIcon name={product.categoryIcon} size={10} /> {product.brand}
            </div>
          </div>

          {/* Customization hint */}
          <p className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Viewing {vehicle || "your vehicle"} with {product.name}
          </p>

          {/* Color options if applicable */}
          {product.options.filter(o => o.type === "color").map(opt => (
            <div key={opt.id} className="mt-3">
              <p className="text-[9px] font-bold tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{opt.label.toUpperCase()}</p>
              <div className="flex gap-2">
                {opt.choices.filter(c => c.hex).map(c => (
                  <div key={c.value} className="w-6 h-6 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c.hex, borderColor: "rgba(255,255,255,0.3)" }} title={c.label} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Product card ───────────────────────────────────────────────────────── */

function ProductCard({ product, vehicleId, onSelect }: { product: Product; vehicleId: string; onSelect: (p: Product) => void }) {
  const price = product.salePrice ?? product.price;

  return (
    <button
      onClick={() => onSelect(product)}
      className="text-left rounded-2xl border overflow-hidden transition-all hover:border-yellow-600/50 hover:translate-y-[-2px] group"
      style={{ backgroundColor: "#0D0D0D", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 140, background: `linear-gradient(135deg, ${product.imageColor}22 0%, #0A0A0A 100%)` }}
      >
        <div className="flex flex-col items-center gap-2 opacity-60 group-hover:opacity-90 transition-opacity">
          <CategoryIcon name={product.categoryIcon} size={36} color={product.imageColor} />
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: product.imageColor }}>{product.subcategory}</span>
        </div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          <SourceBadge source={product.source} />
          {product.arEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wider border" style={{ color: "#10B981", backgroundColor: "#10B98110", borderColor: "#10B98130" }}>
              <Eye size={8} /> AR READY
            </span>
          )}
        </div>

        {/* Fitment */}
        {vehicleId && product.fitmentConfirmed !== null && (
          <div className="absolute bottom-2.5 right-2.5">
            {product.fitmentConfirmed ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#10B98120", color: "#10B981" }}>
                <CheckCircle2 size={8} /> Fits
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#EF444420", color: "#EF4444" }}>
                <X size={8} /> No fitment
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div>
          <p className="text-[10px] font-bold tracking-wider" style={{ color: "#C9A227" }}>{product.brand.toUpperCase()}</p>
          <p className="text-sm font-semibold leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.9)" }}>{product.name}</p>
        </div>

        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>{product.description}</p>

        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={9} className={i < Math.floor(product.rating) ? "fill-yellow-500 text-yellow-500" : "text-gray-700"} />
          ))}
          <span className="text-[9px] ml-1" style={{ color: "rgba(255,255,255,0.4)" }}>({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xl font-black" style={{ color: "rgba(255,255,255,0.95)" }}>
              ${price.toLocaleString()}
            </span>
            {product.salePrice && (
              <span className="text-xs line-through ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>${product.price.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold group-hover:opacity-100 transition-all" style={{ backgroundColor: "#C9A22715", color: "#C9A227", border: "1px solid #C9A22730" }}>
            <ArrowRight size={11} />
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Truck size={9} />
          {product.leadTime}
        </div>
      </div>
    </button>
  );
}

/* ─── Product detail drawer ──────────────────────────────────────────────── */

function ProductDrawer({
  product,
  vehicleId,
  onClose,
  onAddToCart,
}: {
  product: Product;
  vehicleId: string;
  onClose: () => void;
  onAddToCart: (p: Product, opts: Record<string, string>) => void;
}) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const vehicleLabel = VEHICLES.find((v) => v.id === vehicleId)?.label ?? "";

  const finalPrice = (product.salePrice ?? product.price) + Object.values(selectedOptions).reduce((adj, val) => {
    for (const opt of product.options) {
      const choice = opt.choices.find((c) => c.value === val);
      if (choice?.priceAdj) return adj + choice.priceAdj;
    }
    return adj;
  }, 0);

  const handleAdd = async () => {
    setAdding(true);
    await new Promise(r => setTimeout(r, 900));
    setAdding(false);
    setAdded(true);
    onAddToCart(product, selectedOptions);
    setTimeout(() => setAdded(false), 3000);
  };

  const srcCfg = SOURCE_CONFIG[product.source];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="relative w-full max-w-lg h-full overflow-y-auto"
        style={{ backgroundColor: "#0A0A0A", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0A0A0A" }}>
          <div className="flex items-center gap-2">
            <SourceBadge source={product.source} />
            {product.arEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black tracking-wider border" style={{ color: "#10B981", backgroundColor: "#10B98110", borderColor: "#10B98130" }}>
                <Eye size={8} /> AR READY
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-white/5"><X size={18} style={{ color: "rgba(255,255,255,0.5)" }} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product hero */}
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${product.imageColor}18 0%, #0A0A0A 100%)`, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-center h-48">
              <CategoryIcon name={product.categoryIcon} size={64} color={product.imageColor} />
            </div>
          </div>

          {/* Brand + name */}
          <div>
            <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: srcCfg.color }}>{product.brand.toUpperCase()} · {product.supplierName}</p>
            <h2 className="text-2xl font-black leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>{product.name}</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{product.longDescription}</p>
          </div>

          {/* Fitment */}
          {vehicleId && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${product.fitmentConfirmed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
              {product.fitmentConfirmed ? <CheckCircle2 size={16} /> : <X size={16} />}
              {product.fitmentConfirmed ? `✓ Confirmed fitment for ${vehicleLabel}` : `No fitment data for ${vehicleLabel}`}
            </div>
          )}

          {/* AR Try-On */}
          {product.arEnabled && (
            <ARTryOn product={product} vehicle={vehicleLabel} />
          )}

          {/* Options */}
          {product.options.map((opt) => (
            <div key={opt.id}>
              <p className="text-xs font-bold tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>{opt.label.toUpperCase()}</p>
              <div className="flex flex-wrap gap-2">
                {opt.choices.map((choice) => {
                  const isSelected = selectedOptions[opt.id] === choice.value;
                  return (
                    <button
                      key={choice.value}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.id]: choice.value }))}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                      style={{
                        borderColor: isSelected ? "#C9A227" : "rgba(255,255,255,0.1)",
                        backgroundColor: isSelected ? "#C9A22718" : "transparent",
                        color: isSelected ? "#C9A227" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {choice.hex && <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: choice.hex }} />}
                      {choice.label}
                      {choice.priceAdj && choice.priceAdj > 0 && (
                        <span className="text-[10px] opacity-60">+${choice.priceAdj}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Specs */}
          <div>
            <p className="text-xs font-bold tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>SPECIFICATIONS</p>
            <div className="space-y-0 rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {Object.entries(product.specs).map(([key, val], i) => (
                <div
                  key={key}
                  className="flex items-start justify-between px-4 py-3 gap-4"
                  style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
                >
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{key}</span>
                  <span className="text-xs font-bold text-right" style={{ color: "rgba(255,255,255,0.8)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info pills */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Truck size={12} />, label: "Lead Time", value: product.leadTime, color: "#3B82F6" },
              { icon: <Settings2 size={12} />, label: "Install Time", value: product.installTime, color: "#10B981" },
              { icon: <Shield size={12} />, label: "Warranty", value: product.warranty, color: "#8B5CF6" },
              { icon: <Package size={12} />, label: "Weight", value: product.weight, color: "#F97316" },
            ].map((info) => (
              <div key={info.label} className="px-4 py-3 rounded-xl border" style={{ borderColor: `${info.color}25`, backgroundColor: `${info.color}08` }}>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: info.color }}>{info.icon}<span className="text-[10px] font-bold tracking-wider">{info.label}</span></div>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{info.value}</p>
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="sticky bottom-0 pt-6 pb-2" style={{ background: "linear-gradient(0deg, #0A0A0A 70%, transparent)" }}>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black" style={{ color: "#fff" }}>${finalPrice.toLocaleString()}</span>
              {product.salePrice && <span className="text-lg line-through" style={{ color: "rgba(255,255,255,0.3)" }}>${product.price.toLocaleString()}</span>}
              <span className="text-xs ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>+ $24.99 dropship fee</span>
            </div>

            <button
              onClick={handleAdd}
              disabled={adding || added || !product.inStock}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all"
              style={{
                backgroundColor: added ? "#10B981" : product.inStock ? "#C9A227" : "#333",
                color: added ? "#fff" : product.inStock ? "#000" : "#666",
              }}
            >
              {added ? (
                <><CheckCircle2 size={16} /> Added to Cart</>
              ) : adding ? (
                <><RefreshCw size={16} className="animate-spin" /> Adding…</>
              ) : product.inStock ? (
                <><ShoppingCart size={16} /> Add to Dropship Cart</>
              ) : (
                "Out of Stock — Order to Manufacture"
              )}
            </button>

            <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Ships from {product.supplierName} · 3C ONYX dropship coordination
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Cart summary bar ───────────────────────────────────────────────────── */

function CartBar({ count, total, onClear }: { count: number; total: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl" style={{ backgroundColor: "#C9A227", color: "#000" }}>
      <ShoppingCart size={18} />
      <span className="font-bold">{count} item{count !== 1 ? "s" : ""}</span>
      <span className="w-px h-5 bg-black/20" />
      <span className="font-black text-lg">${total.toLocaleString()}</span>
      <button onClick={onClear} className="ml-2 text-xs font-bold underline opacity-60 hover:opacity-100">Clear</button>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function AftermarketPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<{ product: Product; opts: Record<string, string> }[]>([]);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const cartTotal = cartItems.reduce((s, i) => s + (i.product.salePrice ?? i.product.price), 0) + (cartItems.length > 0 ? 24.99 : 0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedVehicle) params.set("vehicleId", selectedVehicle);
      if (selectedSource) params.set("source", selectedSource);
      if (searchQ) params.set("q", searchQ);
      const res = await fetch(`${API_BASE}/api/aftermarket/products?${params}`);
      const data = await res.json() as { products: Product[] };
      setProducts(data.products ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [selectedCategory, selectedVehicle, selectedSource, searchQ]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/aftermarket/categories`).then(r => r.json() as Promise<{ categories: Category[] }>),
      fetch(`${API_BASE}/api/aftermarket/suppliers`).then(r => r.json() as Promise<{ suppliers: Supplier[] }>),
    ]).then(([catData, supData]) => {
      setCategories(catData.categories ?? []);
      setSuppliers(supData.suppliers ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalProducts = products.length;
  const arReadyCount = products.filter(p => p.arEnabled).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#070707", color: "#fff" }}>
      <PageHeader
        title="Aftermarket Marketplace"
        subtitle="SEMA Verified · API2Cart Connected · APEXX Supplier Network"
        icon={ShoppingBag}
      />

      {/* Network status bar */}
      <div className="border-b px-6 py-3" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#0A0A0A" }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6">
          {[
            { color: "#C9A227", dot: true, label: "SEMA Data Co-op", value: "CONNECTED", icon: <BadgeCheck size={10} /> },
            { color: "#3B82F6", dot: true, label: "API2Cart", value: "LIVE", icon: <Globe size={10} /> },
            { color: "#8B5CF6", dot: true, label: "APEXX Network", value: "ACTIVE", icon: <Layers size={10} /> },
            { color: "#10B981", dot: false, label: "Verified Suppliers", value: `${suppliers.length}+` },
            { color: "#F97316", dot: false, label: "AR-Ready Products", value: `${arReadyCount}` },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              {s.dot && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color }} />}
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
              <span className="text-[10px] font-black" style={{ color: s.color }}>{s.value}</span>
              {s.icon && <span style={{ color: s.color }}>{s.icon}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Vehicle selector + search */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)" }}>
            <Car size={14} style={{ color: "#C9A227" }} />
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              {VEHICLES.map((v) => <option key={v.id} value={v.id} style={{ backgroundColor: "#1A1A1A" }}>{v.label}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-48 flex items-center gap-2 px-4 py-2.5 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)" }}>
            <SlidersHorizontal size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search Borla, Vossen, Brembo…"
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: "rgba(255,255,255,0.9)" }}
            />
          </div>

          {/* Source filter */}
          {["", "sema", "api2cart", "apexx"].map((src) => {
            const labels: Record<string, string> = { "": "All Sources", sema: "SEMA", api2cart: "API2Cart", apexx: "APEXX" };
            const colors: Record<string, string> = { "": "#fff", sema: "#C9A227", api2cart: "#3B82F6", apexx: "#8B5CF6" };
            const isSelected = selectedSource === src;
            return (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className="px-3 py-2 rounded-xl border text-[11px] font-bold transition-all"
                style={{
                  borderColor: isSelected ? colors[src] : "rgba(255,255,255,0.1)",
                  backgroundColor: isSelected ? `${colors[src]}15` : "transparent",
                  color: isSelected ? colors[src] : "rgba(255,255,255,0.5)",
                }}
              >
                {labels[src]}
              </button>
            );
          })}

          <button
            onClick={() => setShowSuppliers(!showSuppliers)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <ExternalLink size={12} /> Suppliers
          </button>
        </div>

        {/* Supplier directory (toggle) */}
        {showSuppliers && (
          <div className="mb-8 rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#0D0D0D" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold text-sm">Verified Supplier Network</h3>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{suppliers.length} suppliers connected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              {suppliers.map((s) => {
                const srcCfg = SOURCE_CONFIG[s.source];
                return (
                  <div key={s.id} className="px-5 py-4 space-y-2" style={{ backgroundColor: "#0D0D0D" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{s.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.tagline}</p>
                      </div>
                      <SourceBadge source={s.source} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{s.productsCount.toLocaleString()} products</span>
                      <span style={{ color: srcCfg.color }}>⭐ {s.rating}</span>
                      <span style={{ color: "#10B981" }}>{s.marginRange} margin</span>
                    </div>
                    {s.semaShowYear && (
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#C9A22712", color: "#C9A227", border: "1px solid #C9A22730" }}>
                        SEMA Member since {s.semaShowYear}
                      </span>
                    )}
                    {s.apexxTier && (
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded ml-2" style={{ backgroundColor: "#8B5CF612", color: "#8B5CF6", border: "1px solid #8B5CF630" }}>
                        APEXX {s.apexxTier.toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Category sidebar */}
          <div className="w-52 flex-shrink-0 space-y-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: selectedCategory === "all" ? "#C9A22715" : "transparent",
                color: selectedCategory === "all" ? "#C9A227" : "rgba(255,255,255,0.5)",
                border: selectedCategory === "all" ? "1px solid #C9A22730" : "1px solid transparent",
              }}
            >
              <span>All Products</span>
              <span className="text-[10px]">{categories.reduce((s, c) => s + c.count, 0)}</span>
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    backgroundColor: isSelected ? `${cat.color}15` : "transparent",
                    color: isSelected ? cat.color : "rgba(255,255,255,0.5)",
                    border: isSelected ? `1px solid ${cat.color}30` : "1px solid transparent",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon name={cat.icon} size={13} color={isSelected ? cat.color : "currentColor"} />
                    <span className="font-semibold">{cat.label}</span>
                  </span>
                  <span className="text-[10px]">{cat.count}</span>
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {loading ? "Loading…" : `${totalProducts} products`}
                {selectedVehicle && !loading && ` · filtered for ${VEHICLES.find(v => v.id === selectedVehicle)?.label}`}
              </p>
              {selectedVehicle && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "#10B981" }}>
                  <CheckCircle2 size={12} />
                  Smart Fitment Active
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ backgroundColor: "#111" }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>No products found</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} vehicleId={selectedVehicle} onSelect={setActiveProduct} />
                ))}
              </div>
            )}

            {/* SEMA + API2Cart callout */}
            {!loading && (
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { color: "#C9A227", icon: <BadgeCheck size={20} />, title: "SEMA Data Co-op", body: "Every SEMA-badged product comes from verified SEMA Show exhibitors — the gold standard in automotive aftermarket excellence." },
                  { color: "#3B82F6", icon: <Globe size={20} />, title: "API2Cart Connected", body: "Products pulled live from supplier Shopify, WooCommerce, and Magento stores via API2Cart's unified commerce platform." },
                  { color: "#8B5CF6", icon: <Sparkles size={20} />, title: "APEXX Supplier Network", body: "APEXX Elite and Platinum tier suppliers are curated for quality, lead time, and dropship reliability. Every order tracked end-to-end." },
                ].map((info) => (
                  <div key={info.title} className="px-5 py-5 rounded-2xl border space-y-2" style={{ borderColor: `${info.color}20`, backgroundColor: `${info.color}06` }}>
                    <div style={{ color: info.color }}>{info.icon}</div>
                    <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{info.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{info.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product detail drawer */}
      {activeProduct && (
        <ProductDrawer
          product={activeProduct}
          vehicleId={selectedVehicle}
          onClose={() => setActiveProduct(null)}
          onAddToCart={(p, opts) => setCartItems(prev => [...prev, { product: p, opts }])}
        />
      )}

      {/* Cart bar */}
      <CartBar count={cartItems.length} total={cartTotal} onClear={() => setCartItems([])} />
    </div>
  );
}
