import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Paintbrush, CircleDot, Armchair, Truck, Lightbulb, Speaker,
  Gauge, ShoppingCart, X, Check, ChevronRight, Loader2,
  Sparkles, Building2, Plus, Minus, AlertTriangle, Zap,
  ArrowLeft, FileText, Star, Search, Package,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A227";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  priceRange: { min: number; max: number };
  laborEstimate: string;
  popular: boolean;
  fleetAvailable: boolean;
}

interface QuoteResult {
  quoteNumber: string;
  vehicleCount: number;
  lineItems: any[];
  subtotal: number;
  platformFee: number;
  total: number;
  fleetDiscount: string | null;
  estimatedTimeline: string;
}

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("3c_auth_token");
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers as Record<string, string> ?? {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

const CATEGORY_META: Record<string, { icon: typeof Paintbrush; color: string; tagline: string }> = {
  "Wraps & Graphics": { icon: Paintbrush, color: "#A78BFA", tagline: "Color change, PPF, fleet branding" },
  "Wheels & Tires": { icon: CircleDot, color: "#F59E0B", tagline: "Custom wheels, off-road, performance" },
  "Interior": { icon: Armchair, color: "#C9A227", tagline: "Leather, heated seats, carbon trim" },
  "Exterior": { icon: Truck, color: "#60A5FA", tagline: "Side steps, grilles, bed liners" },
  "Lighting": { icon: Lightbulb, color: "#34D399", tagline: "LED, light bars, accent lighting" },
  "Audio & Electronics": { icon: Speaker, color: "#EC4899", tagline: "Sound systems, CarPlay, dash cams" },
  "Performance": { icon: Gauge, color: "#EF4444", tagline: "Exhaust, intake, suspension, brakes" },
};

function ProductCard({ product, selected, onToggle }: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[product.category];
  const avgPrice = Math.round((product.priceRange.min + product.priceRange.max) / 2);

  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%", textAlign: "left", padding: 16, borderRadius: 16,
        background: selected ? `${meta?.color || GOLD}08` : "rgba(255,255,255,0.02)",
        border: `2px solid ${selected ? `${meta?.color || GOLD}30` : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer", transition: "all 0.2s", color: "#fff",
        marginBottom: 8, position: "relative",
      }}
    >
      {product.popular && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", alignItems: "center", gap: 3,
          padding: "2px 8px", borderRadius: 6,
          background: `${GOLD}15`, fontSize: 8, fontWeight: 800, color: GOLD,
          letterSpacing: "0.08em",
        }}>
          <Star size={8} fill={GOLD} /> POPULAR
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: selected ? `${meta?.color || GOLD}20` : "rgba(255,255,255,0.04)",
              border: `1px solid ${selected ? `${meta?.color || GOLD}40` : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {selected ? (
                <Check size={12} style={{ color: meta?.color || GOLD }} />
              ) : (
                <Plus size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
              )}
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{product.name}</span>
          </div>

          <p style={{
            fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "6px 0 8px",
            lineHeight: 1.5, maxWidth: 400,
          }}>
            {product.description}
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)",
            }}>
              {product.subcategory}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
              {product.laborEstimate}
            </span>
            {product.fleetAvailable && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                background: "rgba(96,165,250,0.1)", color: "#60A5FA",
              }}>
                FLEET
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{
            fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 2px",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}>
            ${product.priceRange.min.toLocaleString()}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            to ${product.priceRange.max.toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}

function QuoteModal({ quote, onClose }: { quote: QuoteResult; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 520, maxHeight: "90vh",
        background: "#0c0c12", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "auto",
      }}>
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.15em" }}>YOUR CUSTOMIZATION QUOTE</span>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0", fontFamily: "monospace" }}>
              {quote.quoteNumber}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "16px 24px" }}>
          {quote.fleetDiscount && (
            <div style={{
              padding: "10px 14px", borderRadius: 12, marginBottom: 16,
              background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Building2 size={14} style={{ color: "#60A5FA" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA" }}>
                {quote.fleetDiscount} Fleet Discount Applied — {quote.vehicleCount} vehicles
              </span>
            </div>
          )}

          {quote.lineItems.map((item: any) => (
            <div key={item.productId} style={{
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>{item.name}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  {item.category} · {item.laborEstimate}
                  {item.discount && ` · ${item.discount}`}
                </p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                ${item.totalPrice.toLocaleString()}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: 16, padding: "16px 0",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Subtotal</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>${quote.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Platform fee (3%)</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>${quote.platformFee.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>TOTAL</span>
              <span style={{
                fontSize: 24, fontWeight: 900, color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
                ${quote.total.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 12, marginTop: 8,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between",
          }}>
            <div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>ESTIMATED TIMELINE</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "2px 0 0" }}>{quote.estimatedTimeline}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>VALID FOR</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "2px 0 0" }}>30 days</p>
            </div>
          </div>

          <button style={{
            width: "100%", padding: 16, borderRadius: 14, marginTop: 16,
            background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
            border: "none", color: "#000", fontWeight: 900, fontSize: 15,
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.06em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Zap size={16} />
            BOOK THIS CUSTOMIZATION
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehicleCustomize() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isFleet, setIsFleet] = useState(false);
  const [fleetSize, setFleetSize] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catParam = activeCategory === "all" ? "" : activeCategory;
      const data = await apiFetch(
        `/customize/catalog?category=${encodeURIComponent(catParam)}&search=${encodeURIComponent(searchQuery)}&fleet=${isFleet}`
      );
      const items = data.items || [];
      setProducts(items);
      if (activeCategory === "all" && !searchQuery) {
        setAllProducts(items);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load catalog");
    }
    setLoading(false);
  }, [activeCategory, searchQuery, isFleet]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const generateQuote = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setQuoteLoading(true);
    try {
      const data = await apiFetch("/customize/quote", {
        method: "POST",
        body: JSON.stringify({
          items: Array.from(selectedIds),
          vehicleInfo: vehicleMake ? { make: vehicleMake, model: vehicleModel } : undefined,
          isFleet,
          fleetSize: isFleet ? fleetSize : 1,
        }),
      });
      setQuote(data);
    } catch (err: any) {
      alert(err.message);
    }
    setQuoteLoading(false);
  }, [selectedIds, isFleet, fleetSize, vehicleMake, vehicleModel]);

  const categories = Object.keys(CATEGORY_META);
  const lookupSource = allProducts.length > 0 ? allProducts : products;
  const selectedTotal = Array.from(selectedIds)
    .map(id => lookupSource.find(p => p.id === id))
    .filter(Boolean)
    .reduce((sum, p) => sum + Math.round((p!.priceRange.min + p!.priceRange.max) / 2), 0);

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff", paddingBottom: 120 }}>
      {quote && <QuoteModal quote={quote} onClose={() => setQuote(null)} />}

      <div style={{
        background: "linear-gradient(180deg, rgba(167,139,250,0.05) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "20px 20px 0",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Sparkles size={18} style={{ color: GOLD }} />
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "-0.01em",
            }}>
              Customize Your Vehicle
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
            Wraps, wheels, leather, side steps, audio, performance — everything in one place.
            {" "}Business fleet? We do volume pricing.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{
              position: "relative", flex: 1, minWidth: 200,
            }}>
              <Search size={14} style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.2)",
              }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search upgrades..."
                style={{
                  width: "100%", padding: "10px 14px 10px 34px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={() => setIsFleet(!isFleet)}
              style={{
                padding: "10px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: isFleet ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isFleet ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: isFleet ? "#60A5FA" : "rgba(255,255,255,0.4)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Building2 size={14} />
              {isFleet ? "FLEET MODE ON" : "FLEET"}
            </button>
          </div>

          {isFleet && (
            <div style={{
              padding: "12px 16px", borderRadius: 14, marginBottom: 14,
              background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.12)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <Building2 size={16} style={{ color: "#60A5FA" }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>Fleet Customization</span>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                  Volume pricing: 3+ vehicles = 5% off · 5+ = 10% off · 10+ = 15% off
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setFleetSize(Math.max(1, fleetSize - 1))} style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                }}>
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", minWidth: 30, textAlign: "center" }}>
                  {fleetSize}
                </span>
                <button onClick={() => setFleetSize(fleetSize + 1)} style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          <div style={{
            display: "flex", gap: 4, overflow: "auto", paddingBottom: 0,
          }}>
            <button
              onClick={() => setActiveCategory("all")}
              style={{
                padding: "10px 14px", borderRadius: "10px 10px 0 0",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: activeCategory === "all" ? "rgba(255,255,255,0.04)" : "transparent",
                border: "none",
                borderBottom: activeCategory === "all" ? `2px solid ${GOLD}` : "2px solid transparent",
                color: activeCategory === "all" ? GOLD : "rgba(255,255,255,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              All
            </button>
            {categories.map(cat => {
              const meta = CATEGORY_META[cat];
              const active = activeCategory === cat;
              const CatIcon = meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "10px 12px", borderRadius: "10px 10px 0 0",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: active ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "none",
                    borderBottom: active ? `2px solid ${meta.color}` : "2px solid transparent",
                    color: active ? meta.color : "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                  }}
                >
                  <CatIcon size={12} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 20px" }}>
        {activeCategory !== "all" && CATEGORY_META[activeCategory] && (
          <div style={{
            padding: "14px 18px", borderRadius: 16, marginBottom: 16,
            background: `${CATEGORY_META[activeCategory].color}06`,
            border: `1px solid ${CATEGORY_META[activeCategory].color}15`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {(() => { const Icon = CATEGORY_META[activeCategory].icon; return <Icon size={20} style={{ color: CATEGORY_META[activeCategory].color }} />; })()}
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{activeCategory}</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
                {CATEGORY_META[activeCategory].tagline}
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div style={{
            textAlign: "center", padding: 40,
            background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 16,
          }}>
            <AlertTriangle size={28} style={{ color: "#EF4444", marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: "#EF4444", fontWeight: 700 }}>{error}</p>
            <button onClick={loadProducts} style={{
              marginTop: 12, padding: "8px 20px", borderRadius: 10,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Package size={32} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>
              {searchQuery ? "No products match your search" : "No products in this category"}
            </p>
          </div>
        ) : (
          products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              onToggle={() => toggleProduct(p.id)}
            />
          ))
        )}
      </div>

      {selectedIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "linear-gradient(180deg, transparent 0%, #0c0c12 20%)",
          padding: "24px 20px 20px",
        }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            padding: "14px 20px", borderRadius: 20,
            background: "rgba(15,15,25,0.95)",
            border: `1px solid ${GOLD}25`,
            backdropFilter: "blur(20px)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={16} style={{ color: GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
                  {selectedIds.size} upgrade{selectedIds.size > 1 ? "s" : ""} selected
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                Est. ~${(selectedTotal * (isFleet ? fleetSize : 1)).toLocaleString()}
                {isFleet && fleetSize > 1 ? ` for ${fleetSize} vehicles` : ""}
              </p>
            </div>
            <button
              onClick={generateQuote}
              disabled={quoteLoading}
              style={{
                padding: "12px 24px", borderRadius: 14,
                background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
                border: "none", color: "#000", fontWeight: 900, fontSize: 14,
                cursor: quoteLoading ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.06em",
                opacity: quoteLoading ? 0.6 : 1,
              }}
            >
              {quoteLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {quoteLoading ? "BUILDING..." : "GET QUOTE"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
