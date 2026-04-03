import { useState, useEffect } from "react";
import { Radar, Search, MapPin, Users, ExternalLink, Send, Filter, Globe, Zap } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface RadarEvent {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  organizerName: string;
  organizerContact: string | null;
  organizerSocial: string | null;
  location: string;
  region: string;
  date: string;
  estimatedAttendees: number | null;
  vehicleTypes: string[];
  tags: string[];
  relevanceScore: number;
  contactable: boolean;
  status: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  car_meet: "Car Meet", bike_night: "Bike Night", motorcycle_rally: "Motorcycle Rally",
  car_show: "Car Show", drag_race: "Drag Race", drift_event: "Drift Event",
  gumball_rally: "Rally", cruise: "Cruise", charity_ride: "Charity Ride",
  crypto_conference: "Crypto Conference", affiliate_summit: "Affiliate Summit",
  skate_competition: "Skate Competition", surf_competition: "Surf Competition",
  boat_show: "Boat Show", lowrider_show: "Lowrider Show", streetwear_drop: "Streetwear",
  influencer_meetup: "Influencer Meetup", swap_meet: "Swap Meet",
};

function scoreColor(score: number) {
  if (score >= 90) return "#4ade80";
  if (score >= 75) return "#D4AF37";
  if (score >= 60) return "#f59e0b";
  return "#666";
}

export default function EventRadarPage() {
  const [events, setEvents] = useState<RadarEvent[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [outreachSent, setOutreachSent] = useState<Set<string>>(new Set());

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (region) params.set("region", region);

    fetch(`${API}/event-radar/radar?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || []);
        setCategories(data.categories || []);
        setRegions(data.regions || []);
      })
      .finally(() => setLoading(false));
  }, [query, category, region]);

  async function handleOutreach(eventId: string) {
    if (!token) return;
    await fetch(`${API}/event-radar/radar/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId, channel: "email" }),
    });
    setOutreachSent(prev => new Set([...prev, eventId]));
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Radar size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Event Intelligence Radar</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>Every event on the planet — car meets, crypto conferences, affiliate summits, bike rallies, surf competitions. From 2-car crews to Gumball 3000. Find them, contact them, bring them into the network.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#666" }} />
          <input
            placeholder="Search events, organizers, locations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", boxSizing: "border-box" }}
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c.replace(/_/g, " ")}</option>)}
        </select>
        <select value={region} onChange={e => setRegion(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }}>
          <option value="">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#777", fontSize: 13 }}>{events.length} events detected</span>
        <span style={{ color: "#D4AF37", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Globe size={14} /> Live Intelligence Feed</span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Scanning the globe...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <h3 style={{ color: "#fff", margin: 0, fontSize: 16 }}>{ev.title}</h3>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#1a1a1a", color: "#aaa", border: "1px solid #333" }}>{CATEGORY_LABELS[ev.category] || ev.category}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#1a1400", color: scoreColor(ev.relevanceScore), fontWeight: 700 }}>{ev.relevanceScore}% match</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: ev.status === "live" ? "#0a2e0a" : ev.status === "upcoming" ? "#1a1400" : "#111", color: ev.status === "live" ? "#4ade80" : "#D4AF37" }}>{ev.status}</span>
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#777", marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {ev.location}</span>
                    <span>{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {ev.estimatedAttendees && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> ~{ev.estimatedAttendees.toLocaleString()}</span>}
                    <span style={{ color: "#555" }}>{ev.region}</span>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#D4AF37" }}>Organizer: </span>
                    <span style={{ fontSize: 12, color: "#ccc" }}>{ev.organizerName}</span>
                    {ev.organizerContact && <span style={{ fontSize: 11, color: "#777", marginLeft: 8 }}>{ev.organizerContact}</span>}
                    {ev.organizerSocial && <span style={{ fontSize: 11, color: "#60a5fa", marginLeft: 8 }}>{ev.organizerSocial}</span>}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ev.tags.map(t => (
                      <span key={t} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#1a1a1a", color: "#888" }}>#{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 100 }}>
                  {ev.sourceUrl && (
                    <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #333", background: "transparent", color: "#ccc", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}><ExternalLink size={12} /> Source</a>
                  )}
                  {ev.contactable && !outreachSent.has(ev.id) ? (
                    <button onClick={() => handleOutreach(ev.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#D4AF37", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}><Send size={12} /> Contact</button>
                  ) : outreachSent.has(ev.id) ? (
                    <span style={{ fontSize: 11, color: "#4ade80", textAlign: "center" }}>Outreach Sent</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
