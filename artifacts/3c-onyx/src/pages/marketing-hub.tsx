import { useState, useEffect } from "react";
import { Mail, MessageSquare, Layout, Zap, BarChart3, Send, Plus, Clock, Users, MousePointer, TrendingUp, FileText } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  stages: number;
  automatable: boolean;
}

interface SmsTemplate {
  id: string;
  name: string;
  description: string;
}

interface LandingTemplate {
  id: string;
  name: string;
  description: string;
}

export default function MarketingHubPage() {
  const [tab, setTab] = useState<"email" | "sms" | "pages" | "automations" | "analytics">("email");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [landingTemplates, setLandingTemplates] = useState<LandingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/marketing/capabilities`).then(r => r.json()).then(data => {
      setEmailTemplates(data.emailCampaigns || []);
      setSmsTemplates(data.smsCampaigns || []);
      setLandingTemplates(data.landingPages || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#999" }}>Loading Marketing Hub...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Mail size={28} color="#D4AF37" />
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>Marketing Hub</h1>
      </div>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Email campaigns, SMS blasts, landing pages, and automated drip sequences — all powered by 3C ONYX.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["email", "sms", "pages", "automations", "analytics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + (tab === t ? "#D4AF37" : "#333"), background: tab === t ? "#D4AF37" : "transparent", color: tab === t ? "#000" : "#ccc", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontSize: 13 }}>{t === "pages" ? "Landing Pages" : t}</button>
        ))}
      </div>

      {tab === "email" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Email Campaigns</h2>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Plus size={14} /> New Campaign</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {emailTemplates.map(t => (
              <div key={t.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {t.automatable && <Zap size={12} color="#D4AF37" />}
                    <span style={{ padding: "2px 8px", borderRadius: 4, background: "#1a2a1a", color: "#4ade80", fontSize: 10, fontWeight: 700 }}>{t.stages} steps</span>
                  </div>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>{t.description}</p>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#222", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Send size={12} /> Launch</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "sms" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>SMS Campaigns</h2>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Plus size={14} /> New SMS</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {smsTemplates.map(t => (
              <div key={t.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <MessageSquare size={16} color="#60a5fa" />
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>{t.description}</p>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#222", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Send Campaign</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "pages" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Landing Pages</h2>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13 }}><Plus size={14} /> Create Page</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {landingTemplates.map(t => (
              <div key={t.id} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Layout size={16} color="#a78bfa" />
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>{t.description}</p>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#222", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><FileText size={12} /> Use Template</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Marketing Automations</h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>Set triggers. The platform handles the rest — emails, SMS, landing pages, all on autopilot.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { trigger: "New Member Joins", actions: "Welcome email \u2192 Wait 2 days \u2192 Referral SMS \u2192 Follow-up email", icon: Users },
              { trigger: "Purchase Completed", actions: "Receipt email \u2192 Review request \u2192 Cross-sell recommendations", icon: TrendingUp },
              { trigger: "Birthday Detected", actions: "Birthday reward email \u2192 Special discount code", icon: Zap },
              { trigger: "Inactive 30 Days", actions: "Re-engagement email \u2192 Exclusive deal SMS \u2192 Final nudge", icon: Clock },
            ].map(({ trigger, actions, icon: Icon }) => (
              <div key={trigger} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon size={16} color="#D4AF37" />
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>When: {trigger}</div>
                </div>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>{actions}</p>
                <button style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #D4AF37", background: "transparent", color: "#D4AF37", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Activate</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Marketing Analytics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {[
              { label: "Emails Sent", value: "0", color: "#D4AF37" },
              { label: "Open Rate", value: "0%", color: "#60a5fa" },
              { label: "Click Rate", value: "0%", color: "#4ade80" },
              { label: "SMS Delivered", value: "0", color: "#a78bfa" },
              { label: "Page Views", value: "0", color: "#f59e0b" },
              { label: "Conversions", value: "0", color: "#f87171" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value}</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
