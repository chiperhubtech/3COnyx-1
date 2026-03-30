import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import {
  Users, DollarSign, Activity, Shield, Loader2, CheckCircle2,
  XCircle, Clock, BarChart3, Settings, List, AlertTriangle,
  Brain, MessageSquare, RefreshCw, ChevronRight, Zap,
  Globe, Mail, Palette, Building2, Link2, Copy, ExternalLink,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PlatformStats {
  users: number; transactions: number; vehicles: number;
  gigTasks: number; waitlist: number; totalRevenue: string;
  roleBreakdown: { role: string; count: number }[];
  ts: string;
}

interface AdminUser {
  id: number; name: string; email: string; role: string;
  isActive: boolean; isVerified: boolean; createdAt: string; lastLoginAt: string | null;
}

type Tab = "overview" | "users" | "transactions" | "waitlist" | "escalation" | "company";

interface DomainInfo {
  name: string;
  status: "active" | "expired" | "expiring_soon" | "unknown";
  expiresOn: string | null;
  createdOn: string | null;
  autoRenew: boolean;
  whoisGuard: boolean;
  nameservers: string[];
}

interface CompanyAlert {
  level: "warning" | "info";
  title: string;
  detail: string;
  action: string;
  link: string;
}

interface CompanyOverview {
  entity: {
    name: string; founder: string; formed: string; state: string;
    entityId: string; registrar: string; ein: string; status: string;
    services: string[];
    alerts: CompanyAlert[];
  };
  domains: DomainInfo[];
  apiConnected: boolean;
  emails: Record<string, string>;
  brandKit: {
    colors: { name: string; hex: string; role: string }[];
    typography: { name: string; role: string; weights: string[] }[];
    logoVariants: string[];
  };
  dns: { onyxIp: string | null; verifyTxt: string | null; onyxDomain: string | null; setupComplete: boolean; note: string };
}

interface Escalation {
  id: string;
  sessionId: string;
  userId: string;
  reason: string;
  priority: string;
  vehiclePrice?: number;
  transcript: { role: string; content: string }[];
  status: "pending" | "active" | "resolved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  supervisorId?: string;
  resolution?: string;
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const [, navigate]    = useLocation();

  useEffect(() => {
    if (user && user.role !== "Admin") navigate("/");
  }, [user, navigate]);

  const [tab, setTab]       = useState<Tab>("overview");
  const [stats, setStats]   = useState<PlatformStats | null>(null);
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [waitlist, setWL]   = useState<{ email: string; name: string | null; role: string; isInvited: boolean; createdAt: string }[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [expandedEscalation, setExpandedEscalation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyOverview | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BASE}/api/admin/stats`, { headers: authHeaders })
      .then((r) => r.json()).then(setStats).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || tab !== "users") return;
    fetch(`${BASE}/api/admin/users?limit=50`, { headers: authHeaders })
      .then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  useEffect(() => {
    if (!token || tab !== "waitlist") return;
    fetch(`${BASE}/api/admin/waitlist`, { headers: authHeaders })
      .then((r) => r.json()).then((d) => setWL(d.entries ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  useEffect(() => {
    if (!token || tab !== "company") return;
    if (company) return;
    setCompanyLoading(true);
    fetch(`${BASE}/api/company/overview`, { headers: authHeaders })
      .then((r) => r.json()).then(setCompany).finally(() => setCompanyLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmail(key);
      setTimeout(() => setCopiedEmail(null), 1800);
    });
  };

  const fetchEscalations = useCallback(() => {
    if (!token) return;
    fetch(`${BASE}/api/escalation/queue`, { headers: authHeaders })
      .then((r) => r.json())
      .then((d) => setEscalations(d.queue ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (tab === "escalation") fetchEscalations();
  }, [tab, fetchEscalations]);

  async function resolveEscalation(id: string, resolution: string) {
    await fetch(`${BASE}/api/escalation/${id}/resolve`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ resolution, supervisorId: user?.id }),
    });
    fetchEscalations();
  }

  const toggleUserActive = async (id: number, current: boolean) => {
    await fetch(`${BASE}/api/admin/users/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ isActive: !current }),
    });
    setUsers((us) => us.map((u) => u.id === id ? { ...u, isActive: !current } : u));
  };

  const pendingEscalations = escalations.filter(e => e.status === "pending").length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "overview",    label: "Overview",    icon: BarChart3  },
    { id: "users",       label: "Users",       icon: Users      },
    { id: "transactions",label: "Transactions",icon: DollarSign },
    { id: "waitlist",    label: "Waitlist",    icon: List       },
    { id: "escalation",  label: "Escalations", icon: Brain, badge: pendingEscalations || undefined },
    { id: "company",     label: "Company Hub", icon: Building2  },
  ];

  return (
    <div style={{ padding: "0 0 60px" }}>
      <PageHeader
        title="ADMIN CONSOLE"
        badge={<span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", letterSpacing: "0.1em" }}>RESTRICTED</span>}
        icon={Settings}
        accent="#EF4444"
      />

      {loading && !stats && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: "#C9A227" }} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "0 0 24px", overflowX: "auto" }}>
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 16px", borderRadius: 10, background: tab === id ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === id ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`, color: tab === id ? "#EF4444" : "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap", position: "relative" }}>
            <Icon size={13} />{label.toUpperCase()}
            {badge ? <span style={{ minWidth: 16, height: 16, borderRadius: 8, background: "#F97316", color: "#000", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "TOTAL USERS",      value: stats.users,        icon: Users,      color: "#C9A227" },
              { label: "TRANSACTIONS",     value: stats.transactions,  icon: DollarSign, color: "#34D399" },
              { label: "VEHICLES",         value: stats.vehicles,      icon: Activity,   color: "#60A5FA" },
              { label: "GIG TASKS",        value: stats.gigTasks,      icon: Clock,      color: "#A78BFA" },
              { label: "WAITLIST",         value: stats.waitlist,      icon: List,       color: "#F59E0B" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ padding: "18px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Icon size={16} style={{ color, marginBottom: 10 }} />
                <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 4px", fontFamily: "'Barlow Condensed', sans-serif" }}>{value.toLocaleString()}</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", margin: 0 }}>{label}</p>
              </div>
            ))}
            <div style={{ padding: "18px 16px", borderRadius: 14, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <DollarSign size={16} style={{ color: "#34D399", marginBottom: 10 }} />
              <p style={{ fontSize: 22, fontWeight: 800, color: "#34D399", margin: "0 0 4px", fontFamily: "'Barlow Condensed', sans-serif" }}>{stats.totalRevenue}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", margin: 0 }}>TOTAL REVENUE</p>
            </div>
          </div>

          {/* Role breakdown */}
          <div style={{ padding: "20px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 16 }}>ROLE BREAKDOWN</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {stats.roleBreakdown.map(({ role: r, count }) => (
                <div key={r} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginRight: 6 }}>{count}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{r}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {users.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No users yet</div>
          ) : users.map((u, i) => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "14px 18px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{u.name}</p>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#C9A227", fontWeight: 700, letterSpacing: "0.06em" }}>{u.role.toUpperCase()}</span>
                  {u.isVerified && <CheckCircle2 size={12} style={{ color: "#34D399" }} />}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{u.email}</p>
              </div>
              <button onClick={() => toggleUserActive(u.id, u.isActive)} style={{ padding: "5px 12px", borderRadius: 8, background: u.isActive ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${u.isActive ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`, color: u.isActive ? "#34D399" : "#EF4444", fontSize: 10, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {u.isActive ? <><CheckCircle2 size={10} />ACTIVE</> : <><XCircle size={10} />SUSPENDED</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Waitlist */}
      {tab === "waitlist" && (
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {waitlist.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No waitlist entries yet</div>
          ) : waitlist.map((e, i) => (
            <div key={e.email} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 12, padding: "12px 18px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", minWidth: 28, textAlign: "right" }}>#{i + 1}</span>
              <div>
                <p style={{ fontSize: 13, color: "#fff", margin: 0 }}>{e.name ?? "—"}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{e.email}</p>
              </div>
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "rgba(201,162,39,0.08)", color: "#C9A227", fontWeight: 700 }}>{e.role.toUpperCase()}</span>
              {e.isInvited ? <CheckCircle2 size={14} style={{ color: "#34D399" }} /> : <AlertTriangle size={14} style={{ color: "rgba(255,255,255,0.2)" }} />}
            </div>
          ))}
        </div>
      )}

      {tab === "transactions" && (
        <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          <DollarSign size={32} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          Transaction ledger populates as payments process through Stripe.
        </div>
      )}

      {/* ── Company Hub ── */}
      {tab === "company" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {companyLoading && !company && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
              <Loader2 size={22} className="animate-spin" style={{ color: "#C9A227" }} />
            </div>
          )}

          {company && (
            <>
              {/* ─ Business Alerts ─ */}
              {company.entity.alerts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {company.entity.alerts.map((alert, i) => (
                    <div key={i} style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: alert.level === "warning" ? "rgba(239,68,68,0.05)" : "rgba(96,165,250,0.05)",
                      border: `1px solid ${alert.level === "warning" ? "rgba(239,68,68,0.2)" : "rgba(96,165,250,0.2)"}`,
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}>
                      <AlertTriangle size={16} style={{ color: alert.level === "warning" ? "#EF4444" : "#60A5FA", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: alert.level === "warning" ? "#EF4444" : "#60A5FA", margin: "0 0 4px" }}>{alert.title}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: "0 0 10px" }}>{alert.detail}</p>
                        <a href={alert.link} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: alert.level === "warning" ? "#EF4444" : "#60A5FA", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                          {alert.action} <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─ Entity Info ─ */}
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Building2 size={15} style={{ color: "#C9A227" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>BUSINESS ENTITY</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, color: "#34D399", letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>ACTIVE</span>
                </div>
                <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "NAME AND SUFFIX",  value: company.entity.name      },
                    { label: "STATE",            value: company.entity.state      },
                    { label: "FORMED ON",        value: company.entity.formed     },
                    { label: "ENTITY ID",        value: company.entity.entityId   },
                    { label: "FOUNDER",          value: company.entity.founder    },
                    { label: "REGISTRAR",        value: company.entity.registrar  },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", margin: "0 0 4px" }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {company.entity.services.map((s) => (
                    <span key={s} style={{ fontSize: 9, fontWeight: 700, color: "#C9A227", padding: "3px 10px", borderRadius: 20, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.15)", letterSpacing: "0.05em" }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* ─ Domains ─ */}
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Globe size={15} style={{ color: "#60A5FA" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>OWNED DOMAINS</span>
                  {!company.apiConnected && (
                    <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,165,0,0.8)", padding: "2px 8px", borderRadius: 20, background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
                      API key needed for live status
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {company.domains.map((d, i) => {
                    const statusColor = d.status === "active" ? "#34D399" : d.status === "expiring_soon" ? "#F97316" : d.status === "expired" ? "#EF4444" : "rgba(255,255,255,0.3)";
                    const statusLabel = d.status === "active" ? "ACTIVE" : d.status === "expiring_soon" ? "EXPIRING SOON" : d.status === "expired" ? "EXPIRED" : "UNKNOWN";
                    return (
                      <div key={d.name} style={{ padding: "14px 20px", borderBottom: i < company.domains.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0, boxShadow: d.status === "active" ? `0 0 6px ${statusColor}` : "none" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{d.name}</span>
                            <span style={{ fontSize: 8, fontWeight: 800, color: statusColor, letterSpacing: "0.12em" }}>{statusLabel}</span>
                          </div>
                          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                            {d.expiresOn && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Expires: {new Date(d.expiresOn).toLocaleDateString()}</span>}
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Formed: {d.createdOn ?? "Dec 2025"}</span>
                            {d.autoRenew && <span style={{ fontSize: 9, color: "#34D399", fontWeight: 600 }}>Auto-renew ON</span>}
                            {d.whoisGuard && <span style={{ fontSize: 9, color: "#60A5FA", fontWeight: 600 }}>WhoisGuard ON</span>}
                          </div>
                        </div>
                        <a href={`https://${d.name}`} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, textDecoration: "none" }}>
                          <ExternalLink size={10} />Visit
                        </a>
                      </div>
                    );
                  })}
                </div>
                {/* DNS Setup Wizard */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(201,162,39,0.03)" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#C9A227", letterSpacing: "0.14em", margin: "0 0 6px" }}>DNS SETUP WIZARD</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 10px" }}>
                    {company.dns.setupComplete
                      ? "All domains are connected to 3C ONYX."
                      : company.dns.note}
                  </p>
                  {!company.dns.setupComplete && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { step: "1", text: "Publish the platform (button at top of page)" },
                        { step: "2", text: "Go to Replit deployment settings → Add Custom Domain" },
                        { step: "3", text: "Copy the A record IP and TXT verification string Replit gives you" },
                        { step: "4", text: "In Namecheap → Advanced DNS, add A record (@), TXT record (_replit-challenge), and CNAME (www)" },
                        { step: "5", text: "Repeat for all 4 domains. SSL is automatic." },
                      ].map(({ step, text }) => (
                        <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)", color: "#C9A227", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{step}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ─ Professional Email ─ */}
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Mail size={15} style={{ color: "#A78BFA" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>PROFESSIONAL EMAIL</span>
                </div>
                <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(company.emails).map(([key, address]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <Mail size={12} style={{ color: "#A78BFA", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#fff", fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{address}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{key}</span>
                      <button
                        onClick={() => copyToClipboard(address, key)}
                        style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: copiedEmail === key ? "#34D399" : "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 9 }}>
                        <Copy size={9} />{copiedEmail === key ? "COPIED" : "COPY"}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "10px 20px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <a href="https://www.namecheap.com/hosting/email/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#A78BFA", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", fontWeight: 600 }}>
                    Manage email hosting in Namecheap <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* ─ Brand Kit ─ */}
              <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Palette size={15} style={{ color: "#F59E0B" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>BRAND KIT</span>
                  <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Established via Tailor Brands — Dec 2025</span>
                </div>
                {/* Colors */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", margin: "0 0 12px" }}>COLOR PALETTE</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {company.brandKit.colors.map((c) => (
                      <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: c.hex, border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#fff", margin: 0 }}>{c.name}</p>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{c.hex}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(c.hex, c.hex)}
                          style={{ padding: "3px 6px", borderRadius: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: copiedEmail === c.hex ? "#34D399" : "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 8 }}>
                          {copiedEmail === c.hex ? "✓" : <Copy size={8} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Typography */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", margin: "0 0 12px" }}>TYPOGRAPHY</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {company.brandKit.typography.map((t) => (
                      <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: t.name.includes("Mono") ? "'JetBrains Mono', monospace" : t.name.includes("Barlow") ? "'Barlow Condensed', sans-serif" : "'Inter', sans-serif" }}>{t.name}</span>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", letterSpacing: "0.06em" }}>{t.role}</p>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {t.weights.map((w) => (
                            <span key={w} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{w}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Quick links */}
                <div style={{ padding: "14px 20px", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href="https://studio.tailorbrands.com" target="_blank" rel="noopener noreferrer"
                    style={{ padding: "7px 14px", borderRadius: 10, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", color: "#C9A227", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <ExternalLink size={10} />Open Tailor Brands
                  </a>
                  <a href="https://www.namecheap.com/myaccount/login/" target="_blank" rel="noopener noreferrer"
                    style={{ padding: "7px 14px", borderRadius: 10, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60A5FA", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <ExternalLink size={10} />Open Namecheap
                  </a>
                </div>
              </div>

              {/* ─ Connect Namecheap API ─ */}
              {!company.apiConnected && (
                <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(201,162,39,0.04)", border: "1px solid rgba(201,162,39,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Link2 size={15} style={{ color: "#C9A227" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A227", letterSpacing: "0.1em" }}>CONNECT NAMECHEAP API</span>
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: "0 0 14px" }}>
                    Connect your Namecheap account to see live domain expiry dates, manage DNS records, and set up email forwarding directly from this dashboard.<br />
                    To get your API key: Namecheap → Profile → Tools → API Access → Enable + copy API key. Whitelist the Replit deployment IP.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href="https://ap.www.namecheap.com/settings/tools/apiaccess/" target="_blank" rel="noopener noreferrer"
                      style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)", color: "#C9A227", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                      <ExternalLink size={10} />Get API Key
                    </a>
                    <span style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
                      Add NAMECHEAP_API_USER + NAMECHEAP_API_KEY + NAMECHEAP_CLIENT_IP to Replit Secrets
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Escalation Queue ── */}
      {tab === "escalation" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{escalations.length} total · {pendingEscalations} pending supervisor review</p>
            </div>
            <button onClick={fetchEscalations} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <RefreshCw size={11} />Refresh
            </button>
          </div>

          {escalations.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <Brain size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>No escalations yet</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 6 }}>Cases escalate automatically for HIGH_VALUE, LOW_CONFIDENCE, or COMPLEX interactions</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {escalations.map((e) => {
                const isExpanded = expandedEscalation === e.id;
                const PRIORITY_COLOR: Record<string, string> = {
                  CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#C9A227", LOW: "#60A5FA",
                };
                const STATUS_COLOR: Record<string, string> = {
                  pending: "#F97316", active: "#60A5FA", resolved: "#34D399", rejected: "#EF4444",
                };
                const pColor = PRIORITY_COLOR[e.priority] ?? "#C9A227";
                const sColor = STATUS_COLOR[e.status] ?? "#60A5FA";

                return (
                  <div key={e.id} style={{ borderRadius: 16, background: "rgba(255,255,255,0.025)", border: `1px solid ${e.status === "pending" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.07)"}`, overflow: "hidden" }}>
                    {/* Card header */}
                    <div
                      onClick={() => setExpandedEscalation(isExpanded ? null : e.id)}
                      style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${pColor}12`, border: `1px solid ${pColor}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertTriangle size={14} style={{ color: pColor }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 8, fontWeight: 800, color: pColor, letterSpacing: "0.15em", padding: "2px 8px", borderRadius: 20, background: `${pColor}15` }}>{e.priority}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: sColor, letterSpacing: "0.1em", padding: "2px 8px", borderRadius: 20, background: `${sColor}12` }}>{e.status.toUpperCase()}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{new Date(e.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{e.reason.replace(/_/g, " ")}</p>
                        {e.vehiclePrice && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Vehicle value: ${e.vehiclePrice.toLocaleString()}</p>}
                      </div>
                      <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        {/* Transcript */}
                        {e.transcript.length > 0 && (
                          <div style={{ marginTop: 14, marginBottom: 14 }}>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginBottom: 10 }}>CONVERSATION TRANSCRIPT</p>
                            <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                              {e.transcript.slice(-6).map((m, i) => (
                                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: m.role === "user" ? "rgba(96,165,250,0.07)" : "rgba(201,162,39,0.07)", border: `1px solid ${m.role === "user" ? "rgba(96,165,250,0.15)" : "rgba(201,162,39,0.15)"}` }}>
                                  <p style={{ fontSize: 9, color: m.role === "user" ? "#60A5FA" : "#C9A227", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.role}</p>
                                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{m.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {e.status === "pending" && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => resolveEscalation(e.id, "Approved by supervisor")} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34D399", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <CheckCircle2 size={12} />Approve
                            </button>
                            <button onClick={() => resolveEscalation(e.id, "Escalate to senior specialist")} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#A78BFA", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <Zap size={12} />Escalate Up
                            </button>
                            <button onClick={() => resolveEscalation(e.id, "Rejected")} style={{ flex: 1, padding: "9px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <XCircle size={12} />Reject
                            </button>
                          </div>
                        )}
                        {e.status === "resolved" && e.resolution && (
                          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                            <p style={{ fontSize: 10, color: "#34D399" }}>Resolution: {e.resolution}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
