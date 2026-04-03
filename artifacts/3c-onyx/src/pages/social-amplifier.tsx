import { useState, useEffect } from "react";
import { Share2, Instagram, Twitter, Youtube, Linkedin, Globe, Zap, BarChart3, Calendar, Play, Settings, Plus, TrendingUp, Users, Eye, MousePointer } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface Platform {
  id: string;
  name: string;
  contentTypes: string[];
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "\u{1F4F8}",
  tiktok: "\u{1F3B5}",
  facebook: "\u{1F30D}",
  twitter: "\u{1D54F}",
  youtube: "\u{1F3AC}",
  linkedin: "\u{1F4BC}",
  pinterest: "\u{1F4CC}",
  snapchat: "\u{1F47B}",
  threads: "\u{1F9F5}",
};

export default function SocialAmplifierPage() {
  const [tab, setTab] = useState<"platforms" | "campaigns" | "auto" | "analytics">("platforms");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/social-amplifier/platforms`).then(r => r.json()),
      fetch(`${API}/social-amplifier/templates`).then(r => r.json()),
    ]).then(([pData, tData]) => {
      setPlatforms(pData.platforms || []);
      setTemplates(tData.templates || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading Social Hub...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Share2 size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Social Amplifier</h1>
      </div>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Auto-post campaigns, content, and product promos across every social channel. You sleep, the platform works.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["platforms", "campaigns", "auto", "analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (tab === t ? "#D4AF37" : "#333"), background: tab === t ? "#D4AF37" : "transparent", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontSize: 13 }}>{t === "auto" ? "Auto-Promote" : t}</button>
        ))}
      </div>

      {tab === "platforms" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Connect Your Social Accounts</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {platforms.map(p => (
              <div key={p.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{PLATFORM_ICONS[p.id] || "\u{1F310}"}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>{p.contentTypes.join(" \u00B7 ")}</div>
                  </div>
                </div>
                <button style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #D4AF37", background: "transparent", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Connect Account</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Campaign Templates</h2>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Plus size={14} /> Custom Campaign</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {templates.map(t => (
              <div key={t.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: t.type === "product" ? "#1a3a1a" : "#1a1a3a", color: t.type === "product" ? "#4ade80" : "#60a5fa", fontSize: 11, fontWeight: 600 }}>{t.type}</span>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>{t.description}</p>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#222", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Launch Campaign</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "auto" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Auto-Promote Settings</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>Turn this on and the platform automatically creates and posts content across all your connected social channels. Products, events, milestones — all on autopilot.</p>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Auto-Promote</div>
                <div style={{ color: "#888", fontSize: 13 }}>Automatically post content on your behalf</div>
              </div>
              <div style={{ width: 48, height: 28, borderRadius: 14, background: "#D4AF37", position: "relative", cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", position: "absolute", top: 3, right: 3 }} />
              </div>
            </div>
            {[{ label: "Frequency", value: "Daily", icon: Calendar },
              { label: "Content Types", value: "Products, Events, Achievements", icon: Zap },
              { label: "Platforms", value: "All Connected", icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #222" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={16} color="#888" />
                  <span style={{ color: "#ccc", fontSize: 14 }}>{label}</span>
                </div>
                <span style={{ color: "#D4AF37", fontSize: 14, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Campaign Performance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "Total Campaigns", value: "0", icon: Play, color: "#D4AF37" },
              { label: "Total Posts", value: "0", icon: Share2, color: "#60a5fa" },
              { label: "Impressions", value: "0", icon: Eye, color: "#a78bfa" },
              { label: "Clicks", value: "0", icon: MousePointer, color: "#4ade80" },
              { label: "Conversions", value: "0", icon: TrendingUp, color: "#f59e0b" },
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
