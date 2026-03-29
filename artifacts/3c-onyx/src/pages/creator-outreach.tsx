/**
 * /creator-outreach — Creator Outreach Hub
 * ───────────────────────────────────────────────────────────────────────
 * Social Blade + SHOUT + ONYX AI Agent powered creator discovery &
 * outreach system. Discover automotive creators, run campaigns, fire
 * personalized AI messages via I-95 engine or SHOUT.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Youtube, Instagram, Twitch, Globe, Search, Plus, Send,
  Users, MessageSquare, CheckCircle,
  RefreshCw, Eye, Edit3, X, Loader2, AlertCircle, Settings,
  Radio, Target, BarChart3, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Creator {
  id: number;
  platform: string;
  handle: string;
  followerCount: number;
  grade: string;
  sbRank: number | null;
  niche: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  outreachStatus: string;
  referralCode: string | null;
  campaignId: number | null;
  discoveredAt: string;
}

interface Campaign {
  id: number;
  name: string;
  briefText: string | null;
  targetPlatforms: string | null;
  targetMinGrade: string | null;
  commissionPct: string | null;
  launchDate: string | null;
  talkingPoints: string | null;
  memberBenefits: string | null;
  status: string;
  createdAt: string;
}

interface LogEntry {
  log: {
    id: number;
    creatorId: number;
    campaignId: number | null;
    aiMessage: string;
    deliveryChannel: string;
    sentAt: string;
    responseStatus: string;
  };
  creator: {
    handle: string;
    platform: string;
    grade: string;
  } | null;
}

interface Stats {
  creators: { totalDiscovered: number; notContacted: number; messaged: number; responded: number; converted: number };
  outreach: { totalSent: number };
  campaigns: { total: number; active: number };
  integrations: { socialBlade: boolean; shout: boolean; sendgrid: boolean; twilio: boolean };
  ts: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube:   <Youtube   size={13} style={{ color: "#FF0000" }} />,
  tiktok:    <Radio     size={13} style={{ color: "#69C9D0" }} />,
  instagram: <Instagram size={13} style={{ color: "#E1306C" }} />,
  twitch:    <Twitch    size={13} style={{ color: "#9146FF" }} />,
  facebook:  <Globe     size={13} style={{ color: "#1877F2" }} />,
};

function getPlatformIcon(platform: string) {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? <Globe size={13} style={{ color: "#71717a" }} />;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#10B981", "A": "#10B981", "A-": "#34D399",
  "B+": "#C9A227", "B": "#C9A227", "B-": "#F59E0B",
  "C+": "#F97316", "C": "#F97316", "C-": "#FB923C",
  "D+": "#EF4444", "D": "#EF4444", "D-": "#F87171",
};

function gradeColor(grade: string) {
  return GRADE_COLORS[grade] ?? "#71717a";
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_contacted: { label: "Not Contacted", color: "#52525b" },
  messaged:      { label: "Messaged",      color: "#C9A227" },
  responded:     { label: "Responded",     color: "#60A5FA" },
  converted:     { label: "Converted",     color: "#34D399" },
};

// ─── Setup Banner ────────────────────────────────────────────────────────────
function SetupBanner({ integrations }: { integrations: Stats["integrations"] }) {
  const missing = [];
  if (!integrations.socialBlade) missing.push("SOCIALBLADE_API_KEY");
  if (!integrations.shout)       missing.push("SHOUT_API_KEY (optional)");
  if (!integrations.sendgrid)    missing.push("SENDGRID_API_KEY");

  if (!missing.length) return null;

  return (
    <div style={{
      padding: "14px 20px", borderRadius: 12, marginBottom: 24,
      background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <AlertCircle size={14} style={{ color: "#F97316", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>API Setup Required</span>
      </div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        Add these to your environment secrets to enable full functionality:
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {missing.map((k) => (
          <span key={k} style={{
            fontSize: 10, fontFamily: "monospace", padding: "3px 8px",
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 5, color: "#FB923C",
          }}>{k}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Row ───────────────────────────────────────────────────────────────
function StatsRow({ stats }: { stats: Stats }) {
  const items = [
    { label: "DISCOVERED",  value: stats.creators.totalDiscovered, color: "#C9A227",  icon: Users },
    { label: "MESSAGED",    value: stats.outreach.totalSent,        color: "#60A5FA",  icon: Send },
    { label: "RESPONDED",   value: stats.creators.responded,        color: "#A78BFA",  icon: MessageSquare },
    { label: "CONVERTED",   value: stats.creators.converted,        color: "#34D399",  icon: CheckCircle },
    { label: "CAMPAIGNS",   value: stats.campaigns.active,          color: "#F97316",  icon: Target },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
      {items.map(({ label, value, color, icon: Icon }) => (
        <div key={label} style={{
          padding: "16px 18px", borderRadius: 12,
          background: "rgba(255,255,255,0.02)", border: `1px solid ${color}18`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={11} style={{ color }} />
            </div>
            <span style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>{label}</span>
          </div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({
  creator, onSelect, onSend, selectedId,
}: {
  creator: Creator;
  onSelect: (c: Creator) => void;
  onSend: (c: Creator) => void;
  selectedId: number | null;
}) {
  const status = STATUS_CONFIG[creator.outreachStatus] ?? STATUS_CONFIG.not_contacted;
  const isSelected = selectedId === creator.id;

  return (
    <div
      onClick={() => onSelect(creator)}
      style={{
        padding: "14px 16px", borderRadius: 12, cursor: "pointer",
        background: isSelected ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isSelected ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.06)"}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {getPlatformIcon(creator.platform)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            @{creator.handle}
          </p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
            {creator.platform.toUpperCase()} · {creator.niche ?? "Automotive"}
          </p>
        </div>
        <div style={{
          padding: "2px 8px", borderRadius: 20,
          background: `${gradeColor(creator.grade)}18`,
          border: `1px solid ${gradeColor(creator.grade)}30`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: gradeColor(creator.grade), fontFamily: "'Barlow Condensed', sans-serif" }}>
            {creator.grade}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontWeight: 700 }}>FOLLOWERS</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, color: "#C9A227", lineHeight: 1 }}>
              {fmtFollowers(creator.followerCount)}
            </p>
          </div>
          {creator.sbRank && (
            <div>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontWeight: 700 }}>SB RANK</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.6)", lineHeight: 1 }}>
                #{creator.sbRank.toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            padding: "3px 8px", borderRadius: 6,
            background: `${status.color}12`, border: `1px solid ${status.color}25`,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: status.color }}>{status.label}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSend(creator); }}
            style={{
              padding: "5px 10px", borderRadius: 7,
              background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)",
              color: "#C9A227", fontSize: 10, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <Send size={9} /> Reach Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Outreach Modal ───────────────────────────────────────────────────────────
function OutreachModal({
  creator, campaigns, onClose, onSent, token,
}: {
  creator: Creator;
  campaigns: Campaign[];
  onClose: () => void;
  onSent: () => void;
  token: string | null;
}) {
  const [campaignId, setCampaignId]     = useState<number | null>(campaigns[0]?.id ?? null);
  const [channel, setChannel]           = useState<"email" | "sms" | "shout">("email");
  const [aiMessage, setAiMessage]       = useState("");
  const [previewing, setPreviewing]     = useState(false);
  const [sending, setSending]           = useState(false);
  const [err, setErr]                   = useState("");
  const [sentSuccess, setSentSuccess]   = useState(false);

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function generatePreview() {
    setPreviewing(true);
    setErr("");
    try {
      const res = await fetch(`${API}/creator-outreach/preview-message`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ creatorId: creator.id, campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate message");
      setAiMessage(data.aiMessage);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPreviewing(false);
    }
  }

  async function send() {
    setSending(true);
    setErr("");
    try {
      const res = await fetch(`${API}/creator-outreach/outreach/${creator.id}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ campaignId, channel, editedMessage: aiMessage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSentSuccess(true);
      setTimeout(() => { onSent(); onClose(); }, 1500);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "#0d0d10", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto",
        padding: "28px 28px",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 3 }}>CREATOR AGENT</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, color: "#fff" }}>
              Reach Out to @{creator.handle}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Creator summary */}
        <div style={{
          padding: "12px 14px", borderRadius: 10, marginBottom: 20,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {getPlatformIcon(creator.platform)}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>@{creator.handle}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>
              {fmtFollowers(creator.followerCount)} followers · Grade {creator.grade}
            </span>
          </div>
          <div style={{ padding: "2px 8px", borderRadius: 20, background: `${gradeColor(creator.grade)}18` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: gradeColor(creator.grade) }}>{creator.grade}</span>
          </div>
        </div>

        {/* Campaign select */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>CAMPAIGN (OPTIONAL)</label>
          <select
            value={campaignId ?? ""}
            onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 8,
              background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 12, outline: "none",
            }}
          >
            <option value="">No Campaign (use defaults)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.commissionPct}% commission</option>
            ))}
          </select>
        </div>

        {/* Channel */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>DELIVERY CHANNEL</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["email", "sms", "shout"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                  background: channel === ch ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${channel === ch ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: channel === ch ? "#C9A227" : "rgba(255,255,255,0.4)",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                }}
              >{ch.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* AI Message Preview */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.12em" }}>AI-GENERATED MESSAGE</label>
            <button
              onClick={generatePreview}
              disabled={previewing}
              style={{
                padding: "5px 12px", borderRadius: 7, cursor: "pointer",
                background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
                color: "#60A5FA", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {previewing ? <Loader2 size={10} className="animate-spin" /> : <Eye size={10} />}
              {previewing ? "Generating..." : "Preview with AI"}
            </button>
          </div>
          <textarea
            value={aiMessage}
            onChange={(e) => setAiMessage(e.target.value)}
            placeholder="Click 'Preview with AI' to generate a personalized message, or write your own..."
            rows={9}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e4e4e7", fontSize: 12, lineHeight: 1.7, outline: "none",
              resize: "vertical", fontFamily: "'Inter', sans-serif",
            }}
          />
          {aiMessage && (
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
              <Edit3 size={8} style={{ display: "inline", marginRight: 4 }} />
              Edit the message above before sending.
            </p>
          )}
        </div>

        {err && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize: 11, color: "#EF4444" }}>{err}</p>
          </div>
        )}

        {sentSuccess && (
          <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <p style={{ fontSize: 11, color: "#34D399" }}>Outreach sent successfully! Creator status updated to Messaged.</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 9, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
            }}
          >Cancel</button>
          <button
            onClick={send}
            disabled={sending || !aiMessage.trim()}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 9, cursor: "pointer",
              background: aiMessage.trim() ? "linear-gradient(135deg,#C9A227,#8B6914)" : "rgba(255,255,255,0.05)",
              border: "none",
              color: aiMessage.trim() ? "#000" : "rgba(255,255,255,0.2)",
              fontSize: 12, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {sending ? "Sending..." : `Send via ${channel.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Creator Form ─────────────────────────────────────────────────────────
function AddCreatorForm({ onAdded, token }: { onAdded: () => void; token: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    platform: "youtube", handle: "", followerCount: "", grade: "B",
    niche: "automotive", contactEmail: "", contactPhone: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function add() {
    if (!form.handle || !form.platform) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API}/creator-outreach/creators`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          followerCount: Number(form.followerCount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add creator");
      setOpen(false);
      setForm({ platform: "youtube", handle: "", followerCount: "", grade: "B", niche: "automotive", contactEmail: "", contactPhone: "" });
      onAdded();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "9px 16px", borderRadius: 9, cursor: "pointer",
          background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
          color: "#34D399", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <Plus size={12} /> Add Creator
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div style={{
          marginTop: 12, padding: "20px 20px", borderRadius: 14,
          background: "#0d0d10", border: "1px solid rgba(255,255,255,0.1)", zIndex: 5, position: "relative",
        }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 16 }}>ADD CREATOR MANUALLY</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>PLATFORM</label>
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 12, outline: "none" }}>
                {["youtube", "tiktok", "instagram", "twitch", "facebook"].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            {[
              { key: "handle", label: "Handle*", ph: "automotivejay" },
              { key: "followerCount", label: "Follower Count", ph: "125000" },
              { key: "grade", label: "Grade", ph: "B" },
              { key: "niche", label: "Niche", ph: "automotive" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{label.toUpperCase()}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 12, outline: "none" }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>CONTACT EMAIL</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="creator@gmail.com"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 12, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>CONTACT PHONE (SMS)</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="+12125551234"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 12, outline: "none" }}
              />
            </div>
          </div>
          {err && (
            <div style={{ padding: "8px 12px", borderRadius: 7, marginBottom: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: 11, color: "#EF4444" }}>{err}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>Cancel</button>
            <button onClick={add} disabled={loading || !form.handle} style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              background: form.handle ? "linear-gradient(135deg,#34D399,#059669)" : "rgba(255,255,255,0.05)",
              border: "none", color: form.handle ? "#000" : "rgba(255,255,255,0.2)",
              fontSize: 11, fontWeight: 900,
            }}>
              {loading ? "Adding..." : "Add Creator"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Campaign Form ────────────────────────────────────────────────────────────
function CampaignForm({ onCreated, token }: { onCreated: () => void; token: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", briefText: "", targetPlatforms: "youtube,tiktok,instagram",
    targetMinGrade: "B", commissionPct: "10", launchDate: "",
    talkingPoints: "", memberBenefits: "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function create() {
    if (!form.name) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/creator-outreach/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, commissionPct: Number(form.commissionPct) }),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      setOpen(false);
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "9px 16px", borderRadius: 9, cursor: "pointer",
          background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)",
          color: "#C9A227", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <Plus size={12} /> New Campaign
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div style={{
          marginTop: 12, padding: "20px 20px", borderRadius: 14,
          background: "#0d0d10", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 16 }}>CREATE CAMPAIGN</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { key: "name", label: "Campaign Name*", ph: "Launch Ambassador Wave 1" },
              { key: "commissionPct", label: "Commission %", ph: "10" },
              { key: "targetMinGrade", label: "Min Grade", ph: "B" },
              { key: "launchDate", label: "Launch Date", ph: "Q1 2026" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{label.toUpperCase()}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={ph}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 7,
                    background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: 12, outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
          {[
            { key: "briefText", label: "Campaign Brief", ph: "Build 3C ONYX's launch ambassador network — automotive creators spreading the word about founding member access before our public launch." },
            { key: "talkingPoints", label: "Talking Points", ph: "AI-powered automotive concierge · Luxury services for underserved communities · Dynasty Wallet revenue sharing" },
            { key: "memberBenefits", label: "Member Benefits (for creator's audience)", ph: "Founding member pricing locked forever · Dynasty Wallet · Guardian V2X priority · ONYX AI concierge" },
          ].map(({ key, label, ph }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{label.toUpperCase()}</label>
              <textarea
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={ph}
                rows={3}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 7,
                  background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)",
                  color: "#fff", fontSize: 12, outline: "none", resize: "vertical",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>Cancel</button>
            <button onClick={create} disabled={loading || !form.name} style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              background: form.name ? "linear-gradient(135deg,#C9A227,#8B6914)" : "rgba(255,255,255,0.05)",
              border: "none", color: form.name ? "#000" : "rgba(255,255,255,0.2)",
              fontSize: 11, fontWeight: 900,
            }}>
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreatorOutreachHub() {
  const { token } = useAuth();
  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  const [stats, setStats]                   = useState<Stats | null>(null);
  const [creators, setCreators]             = useState<Creator[]>([]);
  const [campaigns, setCampaigns]           = useState<Campaign[]>([]);
  const [log, setLog]                       = useState<LogEntry[]>([]);
  const [discoverResults, setDiscoverResults] = useState<any[]>([]);

  const [tab, setTab]             = useState<"discover" | "creators" | "log">("creators");
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [outreachTarget, setOutreachTarget]   = useState<Creator | null>(null);

  // Discovery filters
  const [keyword, setKeyword]     = useState("automotive");
  const [platform, setPlatform]   = useState("youtube");
  const [minGrade, setMinGrade]   = useState("B");
  const [minFollowers, setMinFollowers] = useState("1000");
  const [maxFollowers, setMaxFollowers] = useState("10000000");
  const [discovering, setDiscovering]   = useState(false);
  const [discoverErr, setDiscoverErr]   = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving]             = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    const headers = authHeaders();
    const [statsRes, creatorsRes, campaignsRes, logRes] = await Promise.allSettled([
      fetch(`${API}/creator-outreach/stats`,    { headers }).then((r) => r.json()),
      fetch(`${API}/creator-outreach/creators`, { headers }).then((r) => r.json()),
      fetch(`${API}/creator-outreach/campaigns`,{ headers }).then((r) => r.json()),
      fetch(`${API}/creator-outreach/log`,      { headers }).then((r) => r.json()),
    ]);

    if (statsRes.status    === "fulfilled") setStats(statsRes.value);
    if (creatorsRes.status === "fulfilled") setCreators(creatorsRes.value.creators ?? []);
    if (campaignsRes.status === "fulfilled") setCampaigns(campaignsRes.value.campaigns ?? []);
    if (logRes.status      === "fulfilled") setLog(logRes.value.log ?? []);
  }, [token, authHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  async function discover() {
    setDiscovering(true);
    setDiscoverErr("");
    try {
      const params = new URLSearchParams({ keyword, platform, minGrade, minFollowers, maxFollowers });
      const res = await fetch(`${API}/creator-outreach/discover?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.setupRequired) {
        setDiscoverErr(data.message + "\n\nInstructions:\n" + data.instructions.join("\n"));
        setDiscoverResults([]);
      } else if (!res.ok) {
        setDiscoverErr(data.error || "Discovery failed");
      } else {
        setDiscoverResults(data.creators ?? []);
      }
    } catch (e: any) {
      setDiscoverErr(e.message);
    } finally {
      setDiscovering(false);
    }
  }

  async function saveCreator(c: any) {
    setSaving(c.sbRank ?? Math.random());
    try {
      const res = await fetch(`${API}/creator-outreach/creators`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(c),
      });
      if (res.ok) {
        await loadData();
        setTab("creators");
      }
    } finally {
      setSaving(null);
    }
  }

  const filteredCreators = statusFilter
    ? creators.filter((c) => c.outreachStatus === statusFilter)
    : creators;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea, input, select { box-sizing: border-box; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.15); border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(5,5,8,0.9)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", fontWeight: 700, marginBottom: 3 }}>3C ONYX</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>
            CREATOR OUTREACH HUB
          </h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
            Social Blade · SHOUT · ONYX AI Agent
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadData} style={{
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <RefreshCw size={11} /> Refresh
          </button>
          <CampaignForm onCreated={loadData} token={token} />
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px" }}>
        {/* Setup banner */}
        {stats && <SetupBanner integrations={stats.integrations} />}

        {/* Stats row */}
        {stats && <StatsRow stats={stats} />}

        {/* Integration status */}
        {stats && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {Object.entries(stats.integrations).map(([key, ok]) => (
              <div key={key} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                background: ok ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${ok ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: ok ? "#34D399" : "#EF4444",
                letterSpacing: "0.08em",
              }}>
                <Settings size={8} style={{ display: "inline", marginRight: 4 }} />
                {key.replace(/([A-Z])/g, " $1").toUpperCase()} {ok ? "✓" : "✗"}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 1 }}>
          {(["discover", "creators", "log"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "9px 18px", borderRadius: "8px 8px 0 0", cursor: "pointer",
                background: tab === t ? "rgba(201,162,39,0.1)" : "transparent",
                border: tab === t ? "1px solid rgba(201,162,39,0.2)" : "1px solid transparent",
                borderBottom: tab === t ? "1px solid #050508" : "1px solid transparent",
                color: tab === t ? "#C9A227" : "rgba(255,255,255,0.35)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              }}
            >
              {t === "discover" ? "🔍 Discover" : t === "creators" ? `👥 Creators (${creators.length})` : `📋 Activity Log (${log.length})`}
            </button>
          ))}
        </div>

        {/* ── Discover Tab ─────────────────────────────────────── */}
        {tab === "discover" && (
          <div>
            {/* Filters */}
            <div style={{
              padding: "20px 22px", borderRadius: 14, marginBottom: 20,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 16 }}>
                SEARCH FILTERS
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
                {[
                  { key: "keyword", label: "KEYWORD", value: keyword, set: setKeyword, ph: "automotive" },
                  { key: "minFollowers", label: "MIN FOLLOWERS", value: minFollowers, set: setMinFollowers, ph: "1000" },
                  { key: "maxFollowers", label: "MAX FOLLOWERS", value: maxFollowers, set: setMaxFollowers, ph: "10000000" },
                  { key: "minGrade", label: "MIN GRADE", value: minGrade, set: setMinGrade, ph: "B" },
                ].map(({ key, label, value, set: setter, ph }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>{label}</label>
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={ph}
                      style={{
                        width: "100%", padding: "9px 11px", borderRadius: 8,
                        background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)",
                        color: "#fff", fontSize: 12, outline: "none",
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>PLATFORM</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{
                    width: "100%", padding: "9px 11px", borderRadius: 8,
                    background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.09)",
                    color: "#fff", fontSize: 12, outline: "none",
                  }}>
                    {["youtube", "tiktok", "instagram", "twitch", "facebook"].map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 8, color: "transparent", marginBottom: 5 }}>-</label>
                  <button
                    onClick={discover}
                    disabled={discovering}
                    style={{
                      padding: "9px 20px", borderRadius: 8, cursor: "pointer",
                      background: "linear-gradient(135deg,#C9A227,#8B6914)",
                      border: "none", color: "#000", fontSize: 11, fontWeight: 900,
                      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                    }}
                  >
                    {discovering ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                    {discovering ? "Searching..." : "Search Social Blade"}
                  </button>
                </div>
              </div>
            </div>

            {discoverErr && (
              <div style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <pre style={{ fontSize: 11, color: "#F97316", whiteSpace: "pre-wrap", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{discoverErr}</pre>
              </div>
            )}

            {discoverResults.length > 0 && (
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>
                  Found {discoverResults.length} creators — click "Save" to add to your list
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {discoverResults.map((c: any, i: number) => (
                    <div key={i} style={{
                      padding: "14px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        {getPlatformIcon(c.platform)}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>@{c.handle}</p>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{c.niche}</p>
                        </div>
                        <div style={{ padding: "2px 8px", borderRadius: 20, background: `${gradeColor(c.grade)}18` }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: gradeColor(c.grade) }}>{c.grade}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, color: "#C9A227" }}>
                          {fmtFollowers(c.followerCount)} <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>followers</span>
                        </p>
                        <button
                          onClick={() => saveCreator(c)}
                          disabled={saving !== null}
                          style={{
                            padding: "6px 12px", borderRadius: 7, cursor: "pointer",
                            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                            color: "#34D399", fontSize: 10, fontWeight: 700,
                          }}
                        >
                          + Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!discovering && discoverResults.length === 0 && !discoverErr && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)" }}>
                <Search size={32} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13 }}>Set your filters and click Search to discover creators</p>
                <p style={{ fontSize: 10, marginTop: 4 }}>Requires SOCIALBLADE_API_KEY in your environment secrets</p>
              </div>
            )}
          </div>
        )}

        {/* ── Creators Tab ─────────────────────────────────────── */}
        {tab === "creators" && (
          <div>
            {/* Toolbar: Add Creator + Status filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <AddCreatorForm onAdded={loadData} token={token} />
            </div>
            {/* Status filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <Filter size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", fontWeight: 700 }}>FILTER:</span>
              {["", "not_contacted", "messaged", "responded", "converted"].map((s) => {
                const cfg = s ? (STATUS_CONFIG[s] ?? { label: s, color: "#fff" }) : { label: "All", color: "#C9A227" };
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontSize: 9, fontWeight: 700,
                      background: statusFilter === s ? `${cfg.color}18` : "transparent",
                      border: `1px solid ${statusFilter === s ? `${cfg.color}35` : "rgba(255,255,255,0.07)"}`,
                      color: statusFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                    }}
                  >{cfg.label}</button>
                );
              })}
            </div>

            {filteredCreators.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)" }}>
                <Users size={32} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13 }}>No creators saved yet</p>
                <p style={{ fontSize: 10, marginTop: 4 }}>Use the Discover tab to find automotive creators via Social Blade</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {filteredCreators.map((c) => (
                  <CreatorCard
                    key={c.id}
                    creator={c}
                    onSelect={setSelectedCreator}
                    onSend={setOutreachTarget}
                    selectedId={selectedCreator?.id ?? null}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Activity Log Tab ──────────────────────────────────── */}
        {tab === "log" && (
          <div>
            {log.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.15)" }}>
                <BarChart3 size={32} style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 13 }}>No outreach sent yet</p>
                <p style={{ fontSize: 10, marginTop: 4 }}>All outreach messages will appear here for attribution and tracking</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {log.map(({ log: entry, creator }) => (
                  <div key={entry.id} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ flexShrink: 0 }}>
                        {creator && getPlatformIcon(creator.platform)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          @{creator?.handle ?? `Creator #${entry.creatorId}`}
                        </span>
                        {creator?.grade && (
                          <span style={{
                            marginLeft: 8, fontSize: 9, fontWeight: 800,
                            color: gradeColor(creator.grade),
                          }}>{creator.grade}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                          background: "rgba(96,165,250,0.1)", color: "#60A5FA",
                        }}>{entry.deliveryChannel.toUpperCase()}</span>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                          background: entry.responseStatus === "awaiting"
                            ? "rgba(201,162,39,0.1)" : "rgba(52,211,153,0.1)",
                          color: entry.responseStatus === "awaiting" ? "#C9A227" : "#34D399",
                        }}>{entry.responseStatus.toUpperCase()}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                          {new Date(entry.sentAt).toLocaleDateString()} {new Date(entry.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {entry.aiMessage.length > 300 ? entry.aiMessage.slice(0, 300) + "…" : entry.aiMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaigns section at bottom */}
        {campaigns.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 12 }}>
              ACTIVE CAMPAIGNS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {campaigns.map((c) => (
                <div key={c.id} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.name}</p>
                    <span style={{
                      padding: "2px 8px", borderRadius: 20, fontSize: 8, fontWeight: 700,
                      background: c.status === "active" ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
                      color: c.status === "active" ? "#34D399" : "rgba(255,255,255,0.3)",
                    }}>{c.status.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                    {c.briefText ? (c.briefText.length > 80 ? c.briefText.slice(0, 80) + "…" : c.briefText) : "No brief"}
                  </p>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 9, color: "#C9A227", fontWeight: 700 }}>{c.commissionPct}% commission</span>
                    {c.launchDate && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Launch: {c.launchDate}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Outreach Modal */}
      {outreachTarget && (
        <OutreachModal
          creator={outreachTarget}
          campaigns={campaigns}
          onClose={() => setOutreachTarget(null)}
          onSent={() => { setOutreachTarget(null); loadData(); }}
          token={token}
        />
      )}
    </div>
  );
}
