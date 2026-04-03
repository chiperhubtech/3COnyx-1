import { useState, useEffect } from "react";
import { Zap, Wrench, Car, ShoppingBag, Shield, ChevronRight, Check, X, Bell, TrendingUp } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Promotion {
  id: string;
  type: string;
  title: string;
  message: string;
  urgency: string;
  estimatedSavingsUsd: number | null;
  actionLabel: string;
  declineLabel: string;
  vehicleContext: string | null;
  tags: string[];
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#D4AF37",
  low: "#4ade80",
};

const TYPE_ICONS: Record<string, any> = {
  vehicle_upgrade: Car,
  maintenance: Wrench,
  accessory: ShoppingBag,
  part: Wrench,
  apparel: ShoppingBag,
  insurance: Shield,
};

export default function SmartDealsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [responded, setResponded] = useState<Record<string, string>>({});
  const [vehicleCount, setVehicleCount] = useState(0);

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/smart-promotions/feed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setPromotions(data.promotions || []);
        setVehicleCount(data.vehicleCount || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRespond(promoId: string, response: "accepted" | "declined") {
    if (!token) return;
    await fetch(`${API}/smart-promotions/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ promotionId: promoId, response }),
    });
    setResponded(prev => ({ ...prev, [promoId]: response }));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Analyzing your vehicles...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Zap size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Smart Deals</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 8 }}>Personalized for you. Maintenance alerts, upgrade opportunities, parts you need before you know you need them. One tap — yes or no.</p>
      <p style={{ color: "#555", fontSize: 12, marginBottom: 24 }}>{vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""} tracked | {promotions.length} active recommendation{promotions.length !== 1 ? "s" : ""}</p>

      {promotions.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#666" }}>
          <Bell size={40} color="#333" style={{ marginBottom: 12 }} />
          <p>No recommendations right now. Add a vehicle to your garage to get personalized deals.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {promotions.map(p => {
          const IconComponent = TYPE_ICONS[p.type] || Zap;
          const isResponded = responded[p.id];
          return (
            <div key={p.id} style={{
              background: "#111",
              border: `1px solid ${isResponded ? "#222" : URGENCY_COLORS[p.urgency] + "44"}`,
              borderRadius: 12,
              padding: 18,
              opacity: isResponded ? 0.6 : 1,
              transition: "opacity 0.3s",
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: URGENCY_COLORS[p.urgency] + "15",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <IconComponent size={22} color={URGENCY_COLORS[p.urgency]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <h3 style={{ color: "#fff", margin: 0, fontSize: 16 }}>{p.title}</h3>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4,
                      background: URGENCY_COLORS[p.urgency] + "22",
                      color: URGENCY_COLORS[p.urgency],
                      fontWeight: 700, textTransform: "uppercase",
                    }}>{p.urgency}</span>
                  </div>
                  <p style={{ color: "#bbb", fontSize: 13, margin: "6px 0 10px", lineHeight: 1.5 }}>{p.message}</p>
                  {p.vehicleContext && <p style={{ color: "#777", fontSize: 11, margin: "0 0 8px" }}>Vehicle: {p.vehicleContext}</p>}
                  {p.estimatedSavingsUsd && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <TrendingUp size={14} color="#4ade80" />
                      <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 600 }}>Estimated savings: ${p.estimatedSavingsUsd.toLocaleString()}/yr</span>
                    </div>
                  )}

                  {!isResponded ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => handleRespond(p.id, "accepted")}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                      ><Check size={16} /> {p.actionLabel}</button>
                      <button
                        onClick={() => handleRespond(p.id, "declined")}
                        style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#999", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                      ><X size={16} /> {p.declineLabel}</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: isResponded === "accepted" ? "#4ade80" : "#777" }}>
                      {isResponded === "accepted" ? "Great choice. We're on it." : "No problem. We'll check back later."}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
