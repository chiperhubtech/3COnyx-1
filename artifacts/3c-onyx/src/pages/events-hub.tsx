import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Plus, Clock, Ticket, ChevronRight } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  status: string;
  city: string | null;
  state: string | null;
  startsAt: string;
  endsAt: string;
  maxAttendees: number | null;
  attendeeCount: number;
  entryFeeCents: number;
  vehicleTypes: string[];
  coverImageUrl: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  car_meet: "Car Meet", bike_night: "Bike Night", cruise: "Cruise",
  show_and_shine: "Show & Shine", swap_meet: "Swap Meet", drag_race: "Drag Race",
  track_day: "Track Day", charity_ride: "Charity Ride", auction: "Auction",
  pop_up_shop: "Pop-Up Shop", workshop: "Workshop", club_meeting: "Club Meeting", custom: "Custom",
};

export default function EventsHubPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [tab, setTab] = useState<"upcoming" | "my" | "create">("upcoming");
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", type: "car_meet", city: "", state: "", startsAt: "", endsAt: "" });
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/events?upcoming=true`).then(r => r.json()),
      token ? fetch(`${API}/events/my/registered`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve({ registrations: [] }),
    ]).then(([evData, myData]) => {
      setEvents(evData.events || []);
      setMyEvents(myData.registrations || []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newEvent.title.trim() || !newEvent.startsAt || !newEvent.endsAt) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.event) {
        setTab("upcoming");
        setEvents(prev => [data.event, ...prev]);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleRegister(slug: string) {
    const res = await fetch(`${API}/events/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      const updated = await fetch(`${API}/events/my/registered`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setMyEvents(updated.registrations || []);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading events...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Calendar size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Events</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>Create meets, register for events, connect with the network in person.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["upcoming", "my", "create"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "#D4AF37" : "#1a1a1a", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t === "my" ? `My Events (${myEvents.length})` : t === "create" ? "+ Create" : "Upcoming"}</button>
        ))}
      </div>

      {tab === "upcoming" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>No upcoming events. Be the first to create one.</p>}
          {events.map(ev => {
            const registered = myEvents.some(m => m.eventSlug === ev.slug);
            return (
              <div key={ev.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ color: "#fff", margin: 0, fontSize: 17 }}>{ev.title}</h3>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#222", color: "#D4AF37", fontWeight: 600 }}>{EVENT_LABELS[ev.type] || ev.type}</span>
                    </div>
                    {ev.description && <p style={{ color: "#999", fontSize: 13, margin: "4px 0 8px" }}>{ev.description}</p>}
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#777", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {formatDate(ev.startsAt)}</span>
                      {ev.city && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {ev.city}, {ev.state}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> {ev.attendeeCount}{ev.maxAttendees ? `/${ev.maxAttendees}` : ""}</span>
                      {ev.entryFeeCents > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Ticket size={12} /> ${(ev.entryFeeCents / 100).toFixed(2)}</span>}
                    </div>
                  </div>
                  {!registered ? (
                    <button onClick={() => handleRegister(ev.slug)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Register</button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Registered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myEvents.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>You haven't registered for any events yet.</p>}
          {myEvents.map((m: any) => (
            <div key={m.attendeeId} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ color: "#fff", margin: 0 }}>{m.eventTitle}</h3>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#999" }}>
                    <span>{formatDate(m.startsAt)}</span>
                    {m.city && <span>{m.city}, {m.state}</span>}
                    <span style={{ color: m.status === "checked_in" ? "#4ade80" : "#D4AF37" }}>{m.status}</span>
                    {m.ticketRef && <span>Ticket: {m.ticketRef}</span>}
                  </div>
                </div>
                <ChevronRight size={20} color="#666" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 16px" }}>Create an Event</h3>
          <input placeholder="Event title" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <input placeholder="Description" value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10 }}>
            {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input placeholder="City" value={newEvent.city} onChange={e => setNewEvent(p => ({ ...p, city: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
            <input placeholder="State" value={newEvent.state} onChange={e => setNewEvent(p => ({ ...p, state: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Starts</label>
              <input type="datetime-local" value={newEvent.startsAt} onChange={e => setNewEvent(p => ({ ...p, startsAt: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Ends</label>
              <input type="datetime-local" value={newEvent.endsAt} onChange={e => setNewEvent(p => ({ ...p, endsAt: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating} style={{ padding: "12px 28px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer" }}>{creating ? "Creating..." : "Launch Event"}</button>
        </div>
      )}
    </div>
  );
}
