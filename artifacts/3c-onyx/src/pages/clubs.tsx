import { useState, useEffect } from "react";
import { Users, Shield, Crown, Plus, ChevronRight, Star, Zap, Trophy } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Club {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  tier: string;
  status: string;
  vehicleTypes: string[];
  city: string | null;
  state: string | null;
  memberCount: number;
  verified: boolean;
  referralCode: string | null;
  createdAt: string;
}

interface Membership {
  membershipId: number;
  role: string;
  earningsCents: number;
  clubName: string;
  clubSlug: string;
  clubTier: string;
  clubMemberCount: number;
  clubVehicleTypes: string[];
  joinedAt: string;
}

const VEHICLE_EMOJI: Record<string, string> = {
  car: "\u{1F697}", motorcycle: "\u{1F3CD}", scooter: "\u{1F6F5}", atv: "\u{1F6F5}",
  rv: "\u{1F69B}", boat: "\u{26F5}", truck: "\u{1F69A}", suv: "\u{1F699}",
};

const TIER_COLORS: Record<string, string> = {
  Crew: "#4ade80", Chapter: "#60a5fa", Organization: "#a78bfa", International: "#fbbf24",
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [tab, setTab] = useState<"discover" | "my">("discover");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClub, setNewClub] = useState({ name: "", description: "", city: "", state: "" });
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/clubs`).then(r => r.json()),
      token ? fetch(`${API}/clubs/my/memberships`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()) : Promise.resolve({ memberships: [] }),
    ]).then(([clubsData, memData]) => {
      setClubs(clubsData.clubs || []);
      setMyMemberships(memData.memberships || []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newClub.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/clubs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newClub),
      });
      const data = await res.json();
      if (data.club) {
        setClubs(prev => [data.club, ...prev]);
        setShowCreate(false);
        setNewClub({ name: "", description: "", city: "", state: "" });
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(slug: string) {
    const res = await fetch(`${API}/clubs/${slug}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      const updated = await fetch(`${API}/clubs/my/memberships`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setMyMemberships(updated.memberships || []);
    }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading network nodes...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Users size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Club Nodes</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>Master Nodes earning from all member transactions. Bottom-up — whoever opens the door eats first.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab("discover")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === "discover" ? "#D4AF37" : "#1a1a1a", color: tab === "discover" ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer" }}>Discover</button>
        <button onClick={() => setTab("my")} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === "my" ? "#D4AF37" : "#1a1a1a", color: tab === "my" ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer" }}>My Clubs ({myMemberships.length})</button>
        <button onClick={() => setShowCreate(true)} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "1px solid #D4AF37", background: "transparent", color: "#D4AF37", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Start a Club</button>
      </div>

      {showCreate && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: "#D4AF37", margin: "0 0 16px" }}>Start Your Club Node</h3>
          <input placeholder="Club name" value={newClub.name} onChange={e => setNewClub(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <input placeholder="Description" value={newClub.description} onChange={e => setNewClub(p => ({ ...p, description: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff", marginBottom: 10, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <input placeholder="City" value={newClub.city} onChange={e => setNewClub(p => ({ ...p, city: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
            <input placeholder="State" value={newClub.state} onChange={e => setNewClub(p => ({ ...p, state: e.target.value }))} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #333", background: "#0a0a0a", color: "#fff" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCreate} disabled={creating} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer" }}>{creating ? "Creating..." : "Launch Club"}</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#999", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {tab === "discover" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clubs.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>No clubs yet. Be the first to start one.</p>}
          {clubs.map(club => {
            const isMember = myMemberships.some(m => m.clubSlug === club.slug);
            return (
              <div key={club.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ color: "#fff", margin: 0, fontSize: 18 }}>{club.name}</h3>
                      {club.verified && <Shield size={14} color="#4ade80" />}
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: TIER_COLORS[club.tier] || "#666", color: "#000", fontWeight: 700 }}>{club.tier}</span>
                    </div>
                    {club.description && <p style={{ color: "#999", fontSize: 13, margin: "4px 0" }}>{club.description}</p>}
                    <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "#777" }}>
                      <span><Users size={12} /> {club.memberCount} members</span>
                      {club.city && <span>{club.city}, {club.state}</span>}
                      <span>{(club.vehicleTypes || []).map(v => VEHICLE_EMOJI[v] || v).join(" ")}</span>
                    </div>
                  </div>
                  {!isMember ? (
                    <button onClick={() => handleJoin(club.slug)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Join</button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Member</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myMemberships.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 40 }}>You haven't joined any clubs yet.</p>}
          {myMemberships.map(m => (
            <div key={m.membershipId} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ color: "#fff", margin: 0 }}>{m.clubName}</h3>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "#999" }}>
                    <span style={{ color: "#D4AF37" }}>{m.role}</span>
                    <span>{m.clubMemberCount} members</span>
                    <span>${(m.earningsCents / 100).toFixed(2)} earned</span>
                  </div>
                </div>
                <ChevronRight size={20} color="#666" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
