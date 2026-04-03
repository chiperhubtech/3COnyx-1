import { useState, useEffect } from "react";
import { Store, Package, BarChart3, TrendingUp, Layers, Globe, ShoppingCart, Zap, Upload, Plus, ArrowRight, DollarSign } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  impact: string;
  automatable: boolean;
}

const CHANNEL_ICONS: Record<string, string> = {
  amazon: "\u{1F4E6}",
  ebay: "\u{1F3F7}\uFE0F",
  etsy: "\u{1F3A8}",
  facebook_marketplace: "\u{1F30D}",
  google_shopping: "\u{1F50D}",
  walmart: "\u{1F6D2}",
  shopify: "\u{1F6CD}\uFE0F",
  woocommerce: "\u{1F4BB}",
  bigcommerce: "\u{1F4CA}",
  tiktok_shop: "\u{1F3B5}",
  instagram_shop: "\u{1F4F8}",
  pinterest_shop: "\u{1F4CC}",
  mercari: "\u{1F4B0}",
  poshmark: "\u{1F45C}",
  offer_up: "\u{1F4F1}",
  craigslist: "\u{1F4CB}",
  bonanza: "\u{2B50}",
  newegg: "\u{1F5A5}\uFE0F",
};

export default function MarketplaceChannelsPage() {
  const [tab, setTab] = useState<"channels" | "strategies" | "listings" | "analytics">("channels");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/marketplace-hub/channels`).then(r => r.json()),
      fetch(`${API}/marketplace-hub/strategies`).then(r => r.json()),
    ]).then(([cData, sData]) => {
      setChannels(cData.channels || []);
      setStrategies(sData.strategies || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading Marketplace Hub...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Store size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Marketplace Hub</h1>
      </div>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>One product, every marketplace. List across {channels.length}+ channels instantly. Inventory syncs in real-time.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["channels", "strategies", "listings", "analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (tab === t ? "#D4AF37" : "#333"), background: tab === t ? "#D4AF37" : "transparent", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontSize: 13 }}>{t}</button>
        ))}
      </div>

      {tab === "channels" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Marketplace Channels</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {channels.map(c => (
              <div key={c.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{CHANNEL_ICONS[c.id] || "\u{1F6D2}"}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ color: "#666", fontSize: 11, textTransform: "capitalize" }}>{c.type.replace("_", " ")}</div>
                  </div>
                </div>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #D4AF37", background: "transparent", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Connect</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "strategies" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Growth Strategies</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {strategies.map(s => (
              <div key={s.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{s.name}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 4, background: s.impact === "critical" ? "#3a1a1a" : s.impact === "high" ? "#1a3a1a" : "#1a1a3a", color: s.impact === "critical" ? "#f87171" : s.impact === "high" ? "#4ade80" : "#60a5fa", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{s.impact}</span>
                    {s.automatable && <Zap size={12} color="#D4AF37" />}
                  </div>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{s.description}</p>
                </div>
                <ArrowRight size={16} color="#666" style={{ marginLeft: 12, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "listings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Product Listings</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#ccc", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Upload size={14} /> Bulk Upload</button>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Plus size={14} /> List Product</button>
            </div>
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <Package size={48} color="#333" style={{ marginBottom: 12 }} />
            <div style={{ color: "#888", fontSize: 15, marginBottom: 8 }}>No products listed yet</div>
            <p style={{ color: "#666", fontSize: 13 }}>Add your first product and it will auto-list across all connected marketplaces.</p>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Multichannel Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "Connected Channels", value: "0", icon: Globe, color: "#D4AF37" },
              { label: "Active Listings", value: "0", icon: Layers, color: "#60a5fa" },
              { label: "Total Orders", value: "0", icon: ShoppingCart, color: "#4ade80" },
              { label: "Revenue", value: "$0", icon: DollarSign, color: "#f59e0b" },
              { label: "Commission Earned", value: "$0", icon: TrendingUp, color: "#a78bfa" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <Icon size={24} color={color} style={{ marginBottom: 8 }} />
                <div style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{value}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
