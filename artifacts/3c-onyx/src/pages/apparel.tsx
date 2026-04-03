import { useState, useEffect } from "react";
import { ShoppingBag, Music, Headphones, Radio, Tag, Star, ChevronRight, Zap } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface ApparelProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  priceUsd: number;
  sizes: string[];
  colors: string[];
  tags: string[];
  dropship: boolean;
  inStock: boolean;
}

interface EntertainmentProduct {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number | null;
  trialDays: number;
  features: string[];
  logoColor: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  "Spotify": "\u{1F3B5}",
  "Apple Music": "\u{1F34E}",
  "Pandora": "\u{1F4FB}",
  "SiriusXM": "\u{1F4E1}",
};

export default function ApparelPage() {
  const [tab, setTab] = useState<"apparel" | "music">("apparel");
  const [products, setProducts] = useState<ApparelProduct[]>([]);
  const [entertainment, setEntertainment] = useState<EntertainmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/apparel/catalog`).then(r => r.json()),
      fetch(`${API}/entertainment/catalog`).then(r => r.json()),
    ]).then(([appData, entData]) => {
      setProducts(appData.products || []);
      setEntertainment(entData.products || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading store...</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <ShoppingBag size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>ONYX Store</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>Motorsport-inspired apparel + music subscriptions. Dropship direct. 3% commission on every sale through the network.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab("apparel")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: tab === "apparel" ? "#D4AF37" : "#1a1a1a", color: tab === "apparel" ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Tag size={16} /> Apparel ({products.length})</button>
        <button onClick={() => setTab("music")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: tab === "music" ? "#D4AF37" : "#1a1a1a", color: tab === "music" ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Music size={16} /> Music & Radio ({entertainment.length})</button>
      </div>

      {tab === "apparel" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 120, background: "#0a0a0a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: "1px solid #1a1a1a" }}>
                <ShoppingBag size={32} color="#333" />
              </div>
              <h3 style={{ color: "#fff", margin: "0 0 6px", fontSize: 15 }}>{p.name}</h3>
              <p style={{ color: "#999", fontSize: 12, margin: "0 0 10px", flex: 1, lineHeight: 1.4 }}>{p.description}</p>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {p.colors.map(c => (
                  <span key={c} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#1a1a1a", color: "#aaa" }}>{c}</span>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#D4AF37" }}>${p.priceUsd.toFixed(2)}</span>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Add to Cart</button>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {p.sizes.map(s => (
                  <span key={s} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#0a0a0a", color: "#666", border: "1px solid #222" }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "music" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {entertainment.map(p => (
            <div key={p.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{PROVIDER_ICONS[p.provider] || "\u{1F3B6}"}</span>
                    <h3 style={{ color: "#fff", margin: 0, fontSize: 16 }}>{p.name}</h3>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: p.logoColor + "22", color: p.logoColor, fontWeight: 600 }}>{p.provider}</span>
                  </div>
                  <p style={{ color: "#999", fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 }}>{p.description}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {p.features.slice(0, 4).map(f => (
                      <span key={f} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#1a1a1a", color: "#aaa" }}>{f}</span>
                    ))}
                  </div>
                  {p.trialDays > 0 && <span style={{ fontSize: 11, color: "#4ade80" }}>{p.trialDays}-day free trial</span>}
                </div>
                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#D4AF37" }}>${p.monthlyPriceUsd}<span style={{ fontSize: 12, color: "#777" }}>/mo</span></div>
                  {p.annualPriceUsd && <div style={{ fontSize: 11, color: "#777" }}>${p.annualPriceUsd}/yr (save {Math.round((1 - p.annualPriceUsd / (p.monthlyPriceUsd * 12)) * 100)}%)</div>}
                  <button style={{ marginTop: 10, padding: "8px 20px", borderRadius: 8, border: "none", background: p.logoColor, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, width: "100%" }}>Subscribe</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
