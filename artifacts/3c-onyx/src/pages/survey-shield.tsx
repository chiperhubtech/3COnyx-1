import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Smartphone, BarChart3, Car, Users, Zap, ChevronRight, Clock, Star, Lock } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface SentimentStage {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface OemManufacturer {
  id: string;
  name: string;
  brands: string[];
  apps: string[];
}

export default function SurveyShieldPage() {
  const [tab, setTab] = useState<"shield" | "oem" | "monitor" | "analytics">("shield");
  const [stages, setStages] = useState<SentimentStage[]>([]);
  const [manufacturers, setManufacturers] = useState<OemManufacturer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/survey-shield/stages`).then(r => r.json()),
      fetch(`${API}/survey-shield/oem-manufacturers`).then(r => r.json()),
    ]).then(([sData, mData]) => {
      setStages(sData.stages || []);
      setManufacturers(mData.manufacturers || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading Survey Shield...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Shield size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Survey Shield & OEM Bridge</h1>
      </div>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Income protection for your salespeople. Perfect survey scores mathematically guaranteed. OEM app registration automated.</p>

      <div style={{ background: "linear-gradient(135deg, #1a0a00 0%, #0a0a0a 100%)", border: "1px solid #D4AF37", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Lock size={18} color="#D4AF37" />
          <span style={{ color: "#D4AF37", fontWeight: 700, fontSize: 16 }}>COMMISSION PROTECTION ACTIVE</span>
        </div>
        <p style={{ color: "#ccc", fontSize: 13, margin: 0 }}>Deal completion is blocked until sentiment score reaches 10/10 or a manager override is documented with cryptographic proof. No more failed OEM surveys stealing commissions.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["shield", "oem", "monitor", "analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (tab === t ? "#D4AF37" : "#333"), background: tab === t ? "#D4AF37" : "transparent", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            {t === "shield" ? "Sentiment Stages" : t === "oem" ? "OEM Bridge" : t === "monitor" ? "Live Monitor" : "Analytics"}
          </button>
        ))}
      </div>

      {tab === "shield" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Customer Journey Checkpoints</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>8 sentiment checkpoints across the deal lifecycle. Score each 0-10. Below 10 triggers Red Alert for manager intervention before the OEM survey arrives.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {stages.map((s, i) => (
              <div key={s.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{s.name}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 4, background: "#1a1a2a", color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>{Math.round(s.weight * 100)}% weight</span>
                  </div>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{s.description}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Star size={14} color="#666" />
                  <span style={{ color: "#666", fontSize: 13 }}>--/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "oem" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>OEM App Bridge</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>One-tap auto-registration. Upon deal completion, the customer is automatically registered for their manufacturer app. No begging. No manual work. The OEM gets their data, your salesperson keeps their dignity.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {manufacturers.map(m => (
              <div key={m.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Smartphone size={20} color="#D4AF37" />
                  <div>
                    <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                    <div style={{ color: "#666", fontSize: 11 }}>{m.brands.join(" \u00B7 ")}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 6 }}>Auto-Provisioned Apps:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {m.apps.map(app => (
                      <span key={app} style={{ padding: "3px 8px", borderRadius: 4, background: "#0a1a0a", color: "#4ade80", fontSize: 11, fontWeight: 600 }}>{app}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#4ade80", fontSize: 12 }}>
                  <CheckCircle size={12} />
                  <span>Bridge Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "monitor" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Live Deal Monitor</h2>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <Shield size={48} color="#333" style={{ marginBottom: 12 }} />
            <div style={{ color: "#888", fontSize: 15, marginBottom: 8 }}>No active deals being monitored</div>
            <p style={{ color: "#666", fontSize: 13 }}>When deals are in progress, you'll see real-time sentiment tracking with Red Alerts for any score below 10/10.</p>
          </div>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Red Alert Protocol</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[
                { level: "CRITICAL", color: "#f87171", bg: "#2a0a0a", desc: "Score below 7/10. Manager must intervene immediately. Deal completion blocked." },
                { level: "WARNING", color: "#f59e0b", bg: "#2a1a0a", desc: "Score 7-9.4/10. Proactive manager contact recommended. Recovery possible." },
                { level: "PERFECT", color: "#4ade80", bg: "#0a2a0a", desc: "Score 9.5-10/10. Deal safe to complete. OEM survey will reflect excellence." },
              ].map(({ level, color, bg, desc }) => (
                <div key={level} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {level === "CRITICAL" ? <AlertTriangle size={14} color={color} /> : level === "WARNING" ? <Clock size={14} color={color} /> : <CheckCircle size={14} color={color} />}
                    <span style={{ color, fontWeight: 700, fontSize: 13 }}>{level}</span>
                  </div>
                  <p style={{ color: "#ccc", fontSize: 12, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Survey Shield Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {[
              { label: "Deals Monitored", value: "0", color: "#D4AF37" },
              { label: "Perfect Score Rate", value: "0%", color: "#4ade80" },
              { label: "Red Alerts", value: "0", color: "#f87171" },
              { label: "Alerts Resolved", value: "0", color: "#60a5fa" },
              { label: "Manager Overrides", value: "0", color: "#a78bfa" },
              { label: "Commissions Protected", value: "$0", color: "#f59e0b" },
              { label: "OEM Bridges Done", value: "0", color: "#D4AF37" },
              { label: "Avg Sentiment", value: "0/10", color: "#4ade80" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ color, fontSize: 24, fontWeight: 700 }}>{value}</div>
                <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
