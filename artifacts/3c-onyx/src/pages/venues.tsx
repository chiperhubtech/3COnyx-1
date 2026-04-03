import { useState, useEffect } from "react";
import { MapPin, Building, Clock, Shield, Plus, Star, DollarSign } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Venue {
  id: number;
  name: string;
  slug: string;
  type: string;
  businessName: string | null;
  address: string;
  city: string;
  state: string;
  capacity: number | null;
  hourlyRateCents: number | null;
  afterHoursAvailable: boolean;
  afterHoursStart: string | null;
  afterHoursEnd: string | null;
  amenities: string[] | null;
  verified: boolean;
  totalEventsHosted: number;
}

const VENUE_LABELS: Record<string, string> = {
  parking_lot: "Parking Lot", dealership: "Dealership", warehouse: "Warehouse",
  track: "Track", park: "Park", fairgrounds: "Fairgrounds", mall_lot: "Mall Lot",
  private_property: "Private Property", public_space: "Public Space", garage: "Garage",
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [tab, setTab] = useState<"browse" | "my" | "register">("browse");
  const [afterHours, setAfterHours] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myVenues, setMyVenues] = useState<any[]>([]);
  const [newVenue, setNewVenue] = useState({ name: "", type: "parking_lot", address: "", city: "", state: "", capacity: "", afterHoursAvailable: false });
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/venues${afterHours ? "?afterHours=true" : ""}`).then(r => r.json()),
      token ? fetch(`${API}/venues/my/listings`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve({ venues: [] }),
    ]).then(([vData, myData]) => {
      setVenues(vData.venues || []);
      setMyVenues(myData.venues || []);
    }).finally(() => setLoading(false));
  }, [afterHours]);

  async function handleRegister() {
    if (!newVenue.name.trim() || !newVenue.address.trim() || !newVenue.city.trim() || !newVenue.state.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newVenue, capacity: newVenue.capacity ? parseInt(newVenue.capacity) : null }),
      });
      const data = await res.json();
      if (data.venue) {
        setMyVenues(prev => [data.venue, ...prev]);
        setTab("my");
        setNewVenue({ name: "", type: "parking_lot", address: "", city: "", state: "", capacity: "", afterHoursAvailable: false });
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading venues...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Building size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Venue Partnerships</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>After-hours lot rentals, mall partnerships, dealership lots. Register a venue — whoever opens the door gets the 3%.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["browse", "my", "register"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "#D4AF37" : "#1a1a1a", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t === "my" ? `My Venues (${myVenues.length})` : t === "register" ? "+ Register Venue" : "Browse"}</button>
        ))}
        {tab === "browse" && (
          <button onClick={() => setAfterHours(!afterHours)} style={{ padding: "8px 16px", borderRadius: 8, border: afterHours ? "1px solid #D4AF37" : "1px solid #333", background: afterHours ? "#1a1400" : "transparent", color: afterHours ? "#D4AF37" : "#999", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><Clock size={14} /> After Hours Only</button>
        )}
      </div>

      {tab === "browse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {venues.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>No venues registered yet. Be the first — whoever opens the door eats first.</p>}
          {venues.map(v => (
            <div key={v.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ color: "#fff", margin: 0 }}>{v.name}</h3>
                    {v.verified && <Shield size={14} color="#4ade80" />}
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#222", color: "#aaa" }}>{VENUE_LABELS[v.type] || v.type}</span>
                  </div>
                  {v.businessName && <p style={{ color: "#D4AF37", fontSize: 12, margin: "2px 0" }}>{v.businessName}</p>}
                  <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, color: "#777", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {v.city}, {v.state}</span>
                    {v.capacity && <span>{v.capacity} capacity</span>}
                    {v.hourlyRateCents && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={12} />${(v.hourlyRateCents / 100).toFixed(0)}/hr</span>}
                    {v.afterHoursAvailable && <span style={{ color: "#D4AF37" }}><Clock size={12} /> After Hours: {v.afterHoursStart}–{v.afterHoursEnd}</span>}
                    <span>{v.totalEventsHosted} events hosted</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myVenues.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>You haven't registered any venues yet.</p>}
          {myVenues.map((v: any) => (
            <div key={v.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <h3 style={{ color: "#fff", margin: "0 0 4px" }}>{v.name}</h3>
              <p style={{ color: "#999", fontSize: 12, margin: 0 }}>{v.address}, {v.city}, {v.state}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "register" && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 8px" }}>Register a Venue</h3>
          <p style={{ color: "#777", fontSize: 13, marginBottom: 16 }}>Got permission to use a lot, a garage, a space? Register it. You opened the door — you get the 3%.</p>
          <input placeholder="Venue name" value={newVenue.name} onChange={e => setNewVenue(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <select value={newVenue.type} onChange={e => setNewVenue(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10 }}>
            {Object.entries(VENUE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input placeholder="Street address" value={newVenue.address} onChange={e => setNewVenue(p => ({ ...p, address: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder="City" value={newVenue.city} onChange={e => setNewVenue(p => ({ ...p, city: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
            <input placeholder="State" value={newVenue.state} onChange={e => setNewVenue(p => ({ ...p, state: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
          </div>
          <input placeholder="Capacity (optional)" value={newVenue.capacity} onChange={e => setNewVenue(p => ({ ...p, capacity: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#ccc", fontSize: 14, marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={newVenue.afterHoursAvailable} onChange={e => setNewVenue(p => ({ ...p, afterHoursAvailable: e.target.checked }))} />
            Available after business hours
          </label>
          <button onClick={handleRegister} disabled={creating} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer" }}>{creating ? "Registering..." : "Register Venue"}</button>
        </div>
      )}
    </div>
  );
}
