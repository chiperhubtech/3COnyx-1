/**
 * 3C ONYX — Automotive CRM Hub
 * Universal connector for every major automotive CRM platform.
 * VinSolutions · DealerSocket · Tekion · Reynolds & Reynolds ·
 * CDK Drive · Salesforce Automotive · elead · HubSpot · Generic REST
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Link2, RefreshCw, Plus, Trash2, CheckCircle2, XCircle,
  AlertCircle, Zap, Users, Car, TrendingUp, Webhook,
  Activity, BarChart3, ExternalLink,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const apiFetch = async <T = unknown>(path: string, opts?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
};

const GOLD    = "#C9A227";
const EMERALD = "#34D399";
const RED     = "#EF4444";
const BLUE    = "#60A5FA";
const PURPLE  = "#A78BFA";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Provider {
  id: string; name: string; vendor: string; category: string;
  marketShare: string; authType: string; webhookSupport: boolean;
  capabilities: string[]; logo: string; docsUrl: string; notes: string; baseUrl: string;
}
interface Connection {
  id: string; providerId: string; dealerName: string; status: string;
  leadsImported: number; dealsCreated: number; inventorySynced: number;
  lastSync: string; webhookUrl: string; syncInterval: number;
  provider: Provider | null;
}
interface Lead {
  id: string; source: string; firstName: string; lastName: string;
  email: string; phone: string; status: string; leadScore: number;
  vehicleInterest?: { year?: number; make?: string; model?: string; trim?: string; vin?: string };
  assignedTo: string; nextAction: string; createdAt: string; providerId: string;
}
interface Analytics {
  funnel: { leads: number; contacted: number; working: number; sold: number };
  conversionRate: number; avgLeadScore: number;
  topSources: { source: string; leads: number; conversions: number; rate: string }[];
  revenueGenerated: number; avgDealValue: number;
}
interface Summary {
  connectedCRMs: number; totalLeads: number; hotLeads: number;
  dealsClosed: number; revenueInfluenced: number; supportedProviders: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `$${(n/1_000).toFixed(0)}K`
  : `$${n}`;

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return `${Math.floor(diff/1440)}d ago`;
};

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: EMERALD, bg: `${EMERALD}15`, label: "LIVE" },
  error:   { color: RED,     bg: `${RED}15`,     label: "ERROR" },
  syncing: { color: GOLD,    bg: `${GOLD}12`,    label: "SYNCING" },
  pending: { color: BLUE,    bg: `${BLUE}12`,    label: "PENDING" },
};

const LEAD_STATUS_COLOR: Record<string, string> = {
  new: BLUE, contacted: GOLD, working: PURPLE, sold: EMERALD, lost: RED,
};

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = GOLD }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: "#0A0A0A", borderRadius: 14, padding: "18px 20px",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 140,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginTop: 3 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ProviderBadge({ logo, color = GOLD }: { logo: string; color?: string }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: color, letterSpacing: "0.05em" }}>{logo}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CRMHub() {
  const { t: _t } = useTranslation();

  const [tab, setTab]               = useState<"dashboard" | "connections" | "leads" | "providers" | "webhooks">("dashboard");
  const [providers, setProviders]   = useState<Provider[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addProviderId, setAddProviderId] = useState("");
  const [addDealerName, setAddDealerName] = useState("");
  const [addApiKey, setAddApiKey]   = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [prov, conn, ldz, ana, sum] = await Promise.all([
        apiFetch<{ providers: Provider[] }>("/crm/providers"),
        apiFetch<{ connections: Connection[] }>("/crm/connections"),
        apiFetch<{ leads: Lead[] }>("/crm/leads"),
        apiFetch<Analytics>("/crm/analytics"),
        apiFetch<Summary>("/crm/summary"),
      ]);
      setProviders(prov.providers);
      setConnections(conn.connections);
      setLeads(ldz.leads);
      setAnalytics(ana);
      setSummary(sum);
    } catch (e) { console.error("CRM fetch error:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchAll(); }, []);

  const syncConnection = async (id: string) => {
    await apiFetch(`/crm/connections/${id}/sync`, { method: "POST" });
    void fetchAll();
  };
  const removeConnection = async (id: string) => {
    if (!confirm("Remove this CRM connection?")) return;
    await apiFetch(`/crm/connections/${id}`, { method: "DELETE" });
    void fetchAll();
  };
  const addConnection = async () => {
    if (!addProviderId || !addDealerName) return;
    setAddLoading(true);
    try {
      await apiFetch("/crm/connections", { method: "POST", body: JSON.stringify({ providerId: addProviderId, dealerName: addDealerName, apiKey: addApiKey || undefined }) });
      setShowAddModal(false); setAddProviderId(""); setAddDealerName(""); setAddApiKey("");
      void fetchAll();
    } finally { setAddLoading(false); }
  };

  const TABS = [
    { id: "dashboard",   label: "DASHBOARD",   icon: BarChart3 },
    { id: "connections", label: "CONNECTIONS",  icon: Link2 },
    { id: "leads",       label: "LIVE LEADS",  icon: Users },
    { id: "providers",   label: "PROVIDERS",   icon: Activity },
    { id: "webhooks",    label: "WEBHOOKS",    icon: Webhook },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "#050505", padding: "28px 32px 80px", fontFamily: "'Barlow Condensed', system-ui, sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={18} color={GOLD} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "0.08em", margin: 0 }}>AUTOMOTIVE CRM HUB</h1>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.15em", fontWeight: 600 }}>UNIVERSAL CRM CONNECTOR · 9 PLATFORMS SUPPORTED</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginTop: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)} style={{
              padding: "10px 18px", borderRadius: "8px 8px 0 0",
              background: tab === id ? "rgba(201,162,39,0.1)" : "transparent",
              border: "none", borderBottom: tab === id ? `2px solid ${GOLD}` : "2px solid transparent",
              color: tab === id ? GOLD : "rgba(255,255,255,0.3)",
              fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
            }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => void fetchAll()} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, marginBottom: 2,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            <RefreshCw size={11} /> SYNC ALL
          </button>
          <button onClick={() => setShowAddModal(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, marginBottom: 2,
            background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
            color: GOLD, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Plus size={11} /> CONNECT CRM
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 80 }}>Loading CRM data…</div>}

      {!loading && (
        <>
          {/* ── DASHBOARD TAB ─────────────────────────────────────────── */}
          {tab === "dashboard" && summary && analytics && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary stats */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <StatCard icon={Link2}      label="Live CRM Connections" value={summary.connectedCRMs}                       sub={`of ${summary.supportedProviders} supported`} color={GOLD}    />
                <StatCard icon={Users}      label="Total Leads"          value={summary.totalLeads}                           sub="across all platforms"                          color={BLUE}    />
                <StatCard icon={Zap}        label="Hot Leads"            value={summary.hotLeads}                             sub="score ≥ 85, action needed"                     color="#FBBF24" />
                <StatCard icon={Car}        label="Deals Closed"         value={summary.dealsClosed}                          sub="via 3C platform"                               color={EMERALD} />
                <StatCard icon={TrendingUp} label="Revenue Influenced"   value={fmtMoney(summary.revenueInfluenced)}          sub="total deal value"                              color={PURPLE}  />
              </div>

              {/* Conversion funnel */}
              <div style={{ background: "#0A0A0A", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>CONVERSION FUNNEL</div>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                  {[
                    { label: "LEADS IN",   value: analytics.funnel.leads,     color: BLUE    },
                    { label: "CONTACTED",  value: analytics.funnel.contacted, color: GOLD    },
                    { label: "WORKING",    value: analytics.funnel.working,   color: PURPLE  },
                    { label: "CLOSED",     value: analytics.funnel.sold,      color: EMERALD },
                  ].map((stage, i) => {
                    const max = analytics.funnel.leads || 1;
                    const pct = Math.round((stage.value / max) * 100);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{stage.value}</div>
                        <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: stage.color }} />
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: stage.color }}>{stage.label}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 20 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Conversion Rate: <span style={{ color: GOLD, fontWeight: 800 }}>{analytics.conversionRate}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Avg Lead Score: <span style={{ color: GOLD, fontWeight: 800 }}>{analytics.avgLeadScore}/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    Avg Deal Value: <span style={{ color: GOLD, fontWeight: 800 }}>{fmtMoney(analytics.avgDealValue)}</span>
                  </div>
                </div>
              </div>

              {/* Top lead sources */}
              <div style={{ background: "#0A0A0A", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>TOP LEAD SOURCES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {analytics.topSources.map((src, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", width: 16 }}>#{i+1}</div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fff" }}>{src.source}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{src.leads} leads</div>
                      <div style={{ fontSize: 11, color: EMERALD, fontWeight: 800 }}>{src.conversions} closed</div>
                      <div style={{ width: 80 }}>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)" }}>
                          <div style={{ width: src.rate, height: "100%", borderRadius: 2, background: GOLD }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: GOLD, fontWeight: 800, width: 42, textAlign: "right" }}>{src.rate}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONNECTIONS TAB ───────────────────────────────────────── */}
          {tab === "connections" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {connections.length === 0 && (
                <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.25)" }}>
                  <Link2 size={32} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>No CRM connections yet</div>
                  <div style={{ fontSize: 11, marginTop: 6 }}>Click CONNECT CRM to add your first platform</div>
                </div>
              )}
              {connections.map(conn => {
                const st = STATUS_STYLE[conn.status] ?? STATUS_STYLE["pending"];
                return (
                  <div key={conn.id} style={{ background: "#0A0A0A", borderRadius: 14, padding: "18px 20px", border: `1px solid rgba(255,255,255,0.07)` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <ProviderBadge logo={conn.provider?.logo ?? "?"} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{conn.provider?.name ?? conn.providerId}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, background: st.bg, fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: st.color }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                          {conn.dealerName} · Syncs every {conn.syncInterval}min · Last: {timeAgo(conn.lastSync)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 24, marginRight: 16 }}>
                        {[
                          { label: "LEADS",     value: conn.leadsImported,  color: BLUE    },
                          { label: "DEALS",     value: conn.dealsCreated,   color: EMERALD },
                          { label: "INVENTORY", value: conn.inventorySynced, color: GOLD   },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: m.color }}>{m.value}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => void syncConnection(conn.id)} style={{ padding: "8px 14px", borderRadius: 8, background: `${GOLD}12`, border: `1px solid ${GOLD}25`, color: GOLD, fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
                          <RefreshCw size={10} /> SYNC
                        </button>
                        <button onClick={() => void removeConnection(conn.id)} style={{ padding: "8px 10px", borderRadius: 8, background: `${RED}08`, border: `1px solid ${RED}20`, color: RED, cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Webhook size={11} color="rgba(255,255,255,0.25)" />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{window.location.origin}{conn.webhookUrl}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIVE LEADS TAB ────────────────────────────────────────── */}
          {tab === "leads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leads.map(lead => (
                <div key={lead.id} style={{ background: "#0A0A0A", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Score badge */}
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: lead.leadScore >= 85 ? `${GOLD}15` : "rgba(255,255,255,0.04)", border: `1px solid ${lead.leadScore >= 85 ? GOLD : "rgba(255,255,255,0.08)"}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, flexDirection: "column" }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: lead.leadScore >= 85 ? GOLD : "rgba(255,255,255,0.5)", lineHeight: 1 }}>{lead.leadScore}</span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>SCORE</span>
                  </div>
                  {/* Lead info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{lead.firstName} {lead.lastName}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 5, background: `${LEAD_STATUS_COLOR[lead.status]}15`, fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", color: LEAD_STATUS_COLOR[lead.status] }}>{lead.status.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{lead.source}</span>
                    </div>
                    {lead.vehicleInterest && (
                      <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>
                        {lead.vehicleInterest.year} {lead.vehicleInterest.make} {lead.vehicleInterest.model} {lead.vehicleInterest.trim ?? ""}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      {lead.email} · {lead.phone} · {lead.assignedTo}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{lead.nextAction}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{timeAgo(lead.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PROVIDERS TAB ─────────────────────────────────────────── */}
          {tab === "providers" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {providers.map(p => {
                const isConnected = connections.some(c => c.providerId === p.id && c.status === "active");
                return (
                  <div key={p.id} style={{ background: "#0A0A0A", borderRadius: 14, padding: 20, border: `1px solid ${isConnected ? `${GOLD}30` : "rgba(255,255,255,0.07)"}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <ProviderBadge logo={p.logo} color={isConnected ? GOLD : "rgba(255,255,255,0.3)"} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{p.name}</span>
                          {isConnected && <span style={{ padding: "2px 6px", borderRadius: 4, background: `${EMERALD}15`, fontSize: 8, fontWeight: 800, color: EMERALD }}>CONNECTED</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{p.vendor} · {p.marketShare}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, lineHeight: 1.5 }}>{p.notes}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                      {p.capabilities.map(cap => (
                        <span key={cap} style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(255,255,255,0.04)", fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {cap.toUpperCase()}
                        </span>
                      ))}
                      {p.webhookSupport && (
                        <span style={{ padding: "2px 8px", borderRadius: 5, background: `${BLUE}10`, fontSize: 8, fontWeight: 700, color: BLUE, letterSpacing: "0.1em", border: `1px solid ${BLUE}20` }}>WEBHOOK</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setAddProviderId(p.id); setShowAddModal(true); }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: isConnected ? "rgba(255,255,255,0.03)" : `${GOLD}12`, border: `1px solid ${isConnected ? "rgba(255,255,255,0.06)" : `${GOLD}25`}`, color: isConnected ? "rgba(255,255,255,0.3)" : GOLD, fontSize: 10, fontWeight: 800, cursor: isConnected ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        {isConnected ? <CheckCircle2 size={11} /> : <Plus size={11} />}
                        {isConnected ? "CONNECTED" : "CONNECT"}
                      </button>
                      {p.docsUrl && (
                        <a href={p.docsUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center" }}>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── WEBHOOKS TAB ──────────────────────────────────────────── */}
          {tab === "webhooks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#0A0A0A", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>INBOUND WEBHOOK ENDPOINTS</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                  Configure your CRM to send events to these URLs. 3C ONYX will auto-process lead events in real-time.
                </div>
                {providers.map(p => (
                  <div key={p.id} style={{ padding: "12px 16px", marginBottom: 8, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 14 }}>
                    <ProviderBadge logo={p.logo} color="rgba(255,255,255,0.3)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: GOLD, fontFamily: "monospace" }}>
                        POST {window.location.origin}/api/crm/webhooks/{p.id}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {p.webhookSupport
                        ? <><CheckCircle2 size={12} color={EMERALD} /><span style={{ fontSize: 10, color: EMERALD, fontWeight: 700 }}>SUPPORTED</span></>
                        : <><XCircle size={12} color="rgba(255,255,255,0.2)" /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>POLLING ONLY</span></>
                      }
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#0A0A0A", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>SUPPORTED EVENT TYPES</div>
                {[
                  { event: "lead.created",     desc: "New lead entered the CRM",       color: BLUE    },
                  { event: "lead.updated",     desc: "Lead status changed in CRM",     color: GOLD    },
                  { event: "deal.created",     desc: "New opportunity opened",         color: PURPLE  },
                  { event: "deal.closed_won",  desc: "Vehicle sold — triggers ONYX reward", color: EMERALD },
                  { event: "deal.closed_lost", desc: "Deal lost — triggers re-engagement",  color: RED     },
                  { event: "inventory.updated",desc: "Vehicle added/removed from lot", color: GOLD    },
                  { event: "appointment.set",  desc: "Test drive or service scheduled", color: BLUE   },
                ].map(ev => (
                  <div key={ev.event} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ padding: "2px 10px", borderRadius: 5, background: `${ev.color}10`, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: ev.color, fontFamily: "monospace", flexShrink: 0 }}>{ev.event}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{ev.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ADD CONNECTION MODAL ──────────────────────────────────────── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{ background: "#0C0C0C", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 18, padding: 32, width: 420, maxWidth: "90vw", fontFamily: "inherit" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "0.1em", marginBottom: 6 }}>CONNECT A CRM</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>Add a new automotive CRM to start syncing leads and inventory.</div>

            {[
              { label: "CRM PLATFORM", field: (
                <select value={addProviderId} onChange={e => setAddProviderId(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: addProviderId ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                  <option value="">Select a CRM…</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name} — {p.vendor}</option>)}
                </select>
              )},
              { label: "DEALER / COMPANY NAME", field: (
                <input value={addDealerName} onChange={e => setAddDealerName(e.target.value)} placeholder="e.g. Premier Auto Group" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              )},
              { label: "API KEY / ACCESS TOKEN", field: (
                <input value={addApiKey} onChange={e => setAddApiKey(e.target.value)} placeholder="Paste your CRM API key here" type="password" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              )},
            ].map(({ label, field }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 7 }}>{label}</div>
                {field}
              </div>
            ))}

            {addProviderId && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: `${BLUE}08`, border: `1px solid ${BLUE}15`, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <AlertCircle size={12} color={BLUE} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: `${BLUE}CC`, lineHeight: 1.5 }}>
                    {providers.find(p => p.id === addProviderId)?.notes}
                    {providers.find(p => p.id === addProviderId)?.docsUrl && (
                      <span> · <a href={providers.find(p => p.id === addProviderId)?.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>View API docs <ExternalLink size={9} style={{ display: "inline" }} /></a></span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
              <button onClick={() => void addConnection()} disabled={!addProviderId || !addDealerName || addLoading} style={{ flex: 2, padding: 14, borderRadius: 10, background: addProviderId && addDealerName ? `${GOLD}15` : "rgba(255,255,255,0.03)", border: `1px solid ${addProviderId && addDealerName ? `${GOLD}30` : "rgba(255,255,255,0.06)"}`, color: addProviderId && addDealerName ? GOLD : "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 800, cursor: addProviderId && addDealerName ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {addLoading ? <RefreshCw size={12} /> : <Plus size={12} />}
                {addLoading ? "CONNECTING…" : "CONNECT CRM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
