import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import {
  Users, DollarSign, Activity, Shield, Loader2, CheckCircle2,
  XCircle, Clock, BarChart3, Settings, List, AlertTriangle,
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

type Tab = "overview" | "users" | "transactions" | "waitlist";

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
  const [loading, setLoading] = useState(false);

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

  const toggleUserActive = async (id: number, current: boolean) => {
    await fetch(`${BASE}/api/admin/users/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ isActive: !current }),
    });
    setUsers((us) => us.map((u) => u.id === id ? { ...u, isActive: !current } : u));
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",     label: "Overview",     icon: BarChart3 },
    { id: "users",        label: "Users",        icon: Users     },
    { id: "transactions", label: "Transactions", icon: DollarSign },
    { id: "waitlist",     label: "Waitlist",     icon: List      },
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
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "8px 16px", borderRadius: 10, background: tab === id ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === id ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`, color: tab === id ? "#EF4444" : "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            <Icon size={13} />{label.toUpperCase()}
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
    </div>
  );
}
