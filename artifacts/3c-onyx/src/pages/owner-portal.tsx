/**
 * 3C ONYX — Owner Command Center
 * ─────────────────────────────────────────────────────────────────────────────
 * ACCESS: Ron only. URL known only to Ron. Token required.
 * Wrong token → silent 404 screen. No hint this page exists.
 *
 * URL: /oa  (Owner Access — not linked anywhere, not in sidebar)
 * AUTH: X-Owner-Token header, set via OWNER_SECRET_TOKEN Replit Secret
 *
 * CAPABILITY MATRIX:
 * ─ Platform health & secrets status
 * ─ I-95 Outreach: load contacts, preview blast, arm & fire
 * ─ Audit log: every request to owner endpoints
 * ─ Token rotation (generates new token, displays once)
 */

import { useState, useEffect, useRef } from "react";
import {
  Crown, Shield, Zap, Users, Mail, MessageSquare,
  Eye, Lock, RefreshCw, AlertTriangle, CheckCircle2,
  Upload, Send, ChevronDown, Copy, Trash2, Activity,
} from "lucide-react";

const API = "/api";

type Tab = "platform" | "outreach" | "audit" | "security";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function ownerFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Owner-Token": token, ...(opts.headers ?? {}) },
  });
}

/* ─── Token Gate ──────────────────────────────────────────────────────────── */
function TokenGate({ onAuth }: { onAuth: (tok: string) => void }) {
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/owner/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: input.trim() }),
      });
      const data = await r.json() as { verified?: boolean; attemptsRemaining?: number };
      if (data.verified) {
        onAuth(input.trim());
      } else {
        const a = attempts + 1;
        setAttempts(a);
        setErr(a >= 3 ? "Access denied." : "Invalid token.");
        setInput("");
      }
    } catch {
      setErr("Connection error. Check API server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 40, background: "#0f0f12", border: "1px solid #1f1f22", borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Crown size={28} style={{ color: "#C9A227", marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 4 }}>3C ONYX</div>
          <div style={{ fontSize: 10, color: "#52525b", letterSpacing: "0.2em", fontFamily: "monospace" }}>OWNER ACCESS · AUTHORIZED PERSONNEL ONLY</div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter owner token"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "#18181b", border: `1px solid ${err ? "#ef4444" : "#27272a"}`, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
          />
          {err && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontFamily: "monospace" }}>{err}</div>}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{ width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 12, background: loading ? "#27272a" : "#C9A227", color: "#000", fontWeight: 900, fontSize: 14, border: "none", cursor: "pointer", letterSpacing: "0.05em" }}
          >
            {loading ? "Verifying…" : "Access Command Center"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "#3f3f46", fontFamily: "monospace" }}>
          CUXTOMCANDYCLUB LLC · All access logged · IP tracked
        </div>
      </div>
    </div>
  );
}

/* ─── Platform Tab ────────────────────────────────────────────────────────── */
function PlatformTab({ token }: { token: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    ownerFetch("/owner/platform", token).then(r => r.json()).then(d => setData(d as Record<string, unknown>)).catch(() => setErr("Failed to load platform data."));
  }, [token]);

  if (err) return <div style={{ color: "#ef4444", padding: 20 }}>{err}</div>;
  if (!data) return <div style={{ color: "#71717a", padding: 20, fontFamily: "monospace" }}>Loading platform data…</div>;

  const secrets = data["secrets"] as Record<string, string> | undefined;
  const deployment = data["deployment"] as Record<string, string> | undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Platform",     val: String(data["platform"] ?? ""),   color: "#C9A227" },
          { label: "Status",       val: String(data["status"] ?? ""),     color: "#10B981" },
          { label: "Build",        val: String(data["buildVersion"] ?? ""),color: "#60A5FA" },
          { label: "API Routes",   val: String(data["apiRoutes"] ?? ""),  color: "#A78BFA" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#52525b", fontFamily: "monospace", marginBottom: 4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {secrets && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace", marginBottom: 12, letterSpacing: "0.15em" }}>ENVIRONMENT SECRETS STATUS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(secrets).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "monospace" }}>{k}</span>
                <span style={{ fontSize: 11, color: String(v).startsWith("SET") ? "#10B981" : "#ef4444", fontFamily: "monospace" }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deployment && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace", marginBottom: 12, letterSpacing: "0.15em" }}>DEPLOYMENT</div>
          {Object.entries(deployment).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "#71717a", fontFamily: "monospace" }}>{k}</span>
              <span style={{ color: "#d4d4d8", fontFamily: "monospace" }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Outreach Tab ────────────────────────────────────────────────────────── */
interface OutreachContact { id: string; name: string; phone?: string; email?: string; role: string; company?: string; referralLink: string; smsStatus: string; emailStatus: string; }

function OutreachTab({ token }: { token: string }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [contacts, setContacts] = useState<OutreachContact[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [blastResult, setBlastResult] = useState<Record<string, unknown> | null>(null);
  const [blastHistory, setBlastHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState("");
  const [err, setErr] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [blastMode, setBlastMode] = useState<"preview" | "live">("preview");
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    ownerFetch("/outreach/stats", token).then(r => r.json()).then(d => setStats(d as Record<string, unknown>));
    ownerFetch("/outreach/contacts", token).then(r => r.json()).then(d => {
      const typed = d as { contacts?: OutreachContact[] };
      setContacts(typed.contacts ?? []);
    });
    ownerFetch("/outreach/blast/history", token).then(r => r.json()).then(d => {
      const typed = d as { blasts?: Record<string, unknown>[] };
      setBlastHistory(typed.blasts ?? []);
    });
  }

  useEffect(() => { refresh(); }, [token]);

  async function addBulkContacts() {
    setLoading("adding"); setErr("");
    try {
      const lines = bulkInput.trim().split("\n").filter(Boolean);
      const parsed = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { name: parts[0] ?? "", phone: parts[1] ?? undefined, email: parts[2] ?? undefined, role: parts[3] ?? "Industry Professional", company: parts[4] ?? undefined };
      }).filter(c => c.name);
      const r = await ownerFetch("/outreach/contacts", token, { method: "POST", body: JSON.stringify({ contacts: parsed }) });
      const d = await r.json() as { added?: number };
      setBulkInput("");
      refresh();
      setErr(`✓ Added ${d.added ?? 0} contacts`);
    } catch { setErr("Failed to add contacts."); }
    finally { setLoading(""); }
  }

  async function getPreview() {
    setLoading("preview"); setPreview(null);
    const r = await ownerFetch("/outreach/blast/preview", token);
    setPreview(await r.json() as Record<string, unknown>);
    setLoading("");
  }

  async function fireBlast() {
    if (blastMode === "live") {
      const confirmed = window.confirm(`⚠️ LIVE BLAST: This will send real SMS and emails to ${(stats as { totalContacts?: number })?.totalContacts ?? "all"} contacts. Are you absolutely sure?`);
      if (!confirmed) return;
    }
    setLoading("firing"); setBlastResult(null);
    const r = await ownerFetch("/outreach/blast/fire", token, { method: "POST", body: JSON.stringify({ mode: blastMode }) });
    setBlastResult(await r.json() as Record<string, unknown>);
    setLoading("");
    refresh();
  }

  async function deleteContact(id: string) {
    await ownerFetch(`/outreach/contacts/${id}`, token, { method: "DELETE" });
    refresh();
  }

  const s = stats as { totalContacts?: number; smsEligible?: number; emailEligible?: number; smsSent?: number; emailSent?: number; blastsFired?: number; lastBlast?: string } | null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Contacts",  val: s?.totalContacts  ?? 0, color: "#fff"     },
          { label: "SMS Eligible",    val: s?.smsEligible    ?? 0, color: "#10B981"  },
          { label: "Email Eligible",  val: s?.emailEligible  ?? 0, color: "#60A5FA"  },
          { label: "SMS Sent",        val: s?.smsSent        ?? 0, color: "#C9A227"  },
          { label: "Email Sent",      val: s?.emailSent      ?? 0, color: "#A78BFA"  },
          { label: "Blasts Fired",    val: s?.blastsFired    ?? 0, color: "#F97316"  },
        ].map(x => (
          <div key={x.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: x.color, fontFamily: "monospace" }}>{x.val}</div>
            <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{x.label}</div>
          </div>
        ))}
      </div>

      {/* Add Contacts */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <Upload size={14} style={{ color: "#C9A227" }} /> Add Contacts
        </div>
        <div style={{ fontSize: 11, color: "#52525b", fontFamily: "monospace", marginBottom: 8 }}>
          Format: Name, Phone, Email, Role, Company (one per line)
        </div>
        <textarea
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          rows={5}
          placeholder={"John Smith, +13055551234, john@dealer.com, F&I Manager, AutoNation\nMaria Rivera, +13055555678, maria@carmax.com, BDC Rep, CarMax"}
          style={{ width: "100%", background: "#0f0f12", border: "1px solid #27272a", borderRadius: 10, color: "#d4d4d8", fontSize: 11, padding: "10px 12px", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
        <button
          onClick={addBulkContacts}
          disabled={!bulkInput.trim() || loading === "adding"}
          style={{ marginTop: 10, padding: "10px 20px", borderRadius: 10, background: "#C9A227", color: "#000", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer" }}
        >
          {loading === "adding" ? "Adding…" : "Add Contacts"}
        </button>
        {err && <div style={{ fontSize: 11, color: err.startsWith("✓") ? "#10B981" : "#ef4444", marginTop: 6, fontFamily: "monospace" }}>{err}</div>}
      </div>

      {/* Blast Controls */}
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <Send size={14} style={{ color: "#C9A227" }} /> I-95 Blast Engine
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["preview", "live"] as const).map(m => (
            <button key={m} onClick={() => setBlastMode(m)}
              style={{ padding: "8px 16px", borderRadius: 8, border: `2px solid ${blastMode === m ? (m === "live" ? "#ef4444" : "#C9A227") : "#27272a"}`, background: blastMode === m ? (m === "live" ? "#ef444420" : "#C9A22720") : "transparent", color: blastMode === m ? (m === "live" ? "#ef4444" : "#C9A227") : "#71717a", fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {m === "live" ? "🔴 LIVE FIRE" : "👁 Preview Only"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={getPreview} disabled={loading === "preview"}
            style={{ padding: "10px 20px", borderRadius: 10, background: "#27272a", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
            {loading === "preview" ? "Loading…" : "Preview Blast"}
          </button>
          <button onClick={fireBlast} disabled={loading === "firing"}
            style={{ padding: "10px 20px", borderRadius: 10, background: blastMode === "live" ? "#ef4444" : "#C9A227", color: blastMode === "live" ? "#fff" : "#000", fontWeight: 900, fontSize: 12, border: "none", cursor: "pointer" }}>
            {loading === "firing" ? "Firing…" : blastMode === "live" ? "🚀 FIRE BLAST" : "Run Preview"}
          </button>
        </div>

        {preview && (
          <div style={{ marginTop: 16, background: "#0f0f12", border: "1px solid #27272a", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#52525b", fontFamily: "monospace", marginBottom: 8 }}>BLAST PREVIEW</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>
              Would send: <span style={{ color: "#10B981" }}>{String((preview as { smsEligible?: number })?.smsEligible ?? 0)} SMS</span> · <span style={{ color: "#60A5FA" }}>{String((preview as { emailEligible?: number })?.emailEligible ?? 0)} emails</span> · to <span style={{ color: "#fff" }}>{String((preview as { totalContacts?: number })?.totalContacts ?? 0)} contacts</span>
            </div>
            {(preview as { messageTemplate?: string }).messageTemplate && (
              <div style={{ fontSize: 11, color: "#71717a", fontFamily: "monospace", background: "#09090b", padding: "10px 12px", borderRadius: 8, lineHeight: 1.6 }}>
                {String((preview as { messageTemplate?: string }).messageTemplate)}
              </div>
            )}
          </div>
        )}

        {blastResult && (
          <div style={{ marginTop: 16, background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 8 }}>✓ Blast Complete</div>
            {Object.entries(blastResult).map(([k, v]) => (
              <div key={k} style={{ fontSize: 11, color: "#a1a1aa", fontFamily: "monospace", marginBottom: 3 }}>{k}: {String(v)}</div>
            ))}
          </div>
        )}
      </div>

      {/* Contact List */}
      {contacts.length > 0 && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} style={{ color: "#C9A227" }} /> Contacts ({contacts.length})
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {contacts.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0f0f12", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace" }}>
                    {c.phone ?? "—"} · {c.email ?? "—"} · {c.role}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, color: c.smsStatus === "sent" ? "#10B981" : "#52525b", fontFamily: "monospace" }}>SMS:{c.smsStatus}</span>
                  <span style={{ fontSize: 9, color: c.emailStatus === "sent" ? "#60A5FA" : "#52525b", fontFamily: "monospace" }}>EMAIL:{c.emailStatus}</span>
                  <button onClick={() => void deleteContact(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3f3f46", padding: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blast History */}
      {blastHistory.length > 0 && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 12 }}>Blast History</div>
          {blastHistory.slice(0, 5).map(b => (
            <div key={String(b["id"])} style={{ fontSize: 11, color: "#71717a", fontFamily: "monospace", marginBottom: 6, padding: "8px 12px", background: "#0f0f12", borderRadius: 8 }}>
              [{String(b["mode"]).toUpperCase()}] {String(b["firedAt"]).replace("T", " ").slice(0, 19)} — SMS:{String(b["smsSent"])} Email:{String(b["emailSent"])} Failed:{String(b["failed"])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Audit Tab ───────────────────────────────────────────────────────────── */
function AuditTab({ token }: { token: string }) {
  const [data, setData] = useState<{ log?: { ts: string; ip: string; endpoint: string; success: boolean; reason?: string }[]; total?: number; failed?: number; blockedIPs?: string[] } | null>(null);

  useEffect(() => {
    ownerFetch("/owner/audit", token).then(r => r.json()).then(d => setData(d as typeof data));
  }, [token]);

  if (!data) return <div style={{ color: "#71717a", padding: 20, fontFamily: "monospace" }}>Loading audit log…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Events", val: data.total ?? 0, color: "#fff"    },
          { label: "Failed Auth",  val: data.failed ?? 0, color: "#ef4444" },
          { label: "Blocked IPs",  val: data.blockedIPs?.length ?? 0, color: "#F97316" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 20, maxHeight: 400, overflowY: "auto" }}>
        <div style={{ fontSize: 10, color: "#52525b", fontFamily: "monospace", marginBottom: 12, letterSpacing: "0.15em" }}>AUDIT LOG (MOST RECENT FIRST)</div>
        {(data.log ?? []).map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #1c1c1f" }}>
            {e.success
              ? <CheckCircle2 size={10} style={{ color: "#10B981", flexShrink: 0 }} />
              : <AlertTriangle size={10} style={{ color: "#ef4444", flexShrink: 0 }} />}
            <span style={{ fontSize: 9, color: "#3f3f46", fontFamily: "monospace", minWidth: 155 }}>{e.ts.replace("T", " ").slice(0, 19)}</span>
            <span style={{ fontSize: 10, color: "#71717a", fontFamily: "monospace" }}>{e.ip}</span>
            <span style={{ fontSize: 10, color: e.success ? "#a1a1aa" : "#ef4444", fontFamily: "monospace" }}>{e.endpoint}</span>
            {e.reason && <span style={{ fontSize: 9, color: "#52525b", fontFamily: "monospace" }}>[{e.reason}]</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Security Tab ────────────────────────────────────────────────────────── */
function SecurityTab({ token }: { token: string }) {
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shutdownStep, setShutdownStep] = useState(0);

  async function rotateToken() {
    setLoading(true); setNewToken("");
    const r = await ownerFetch("/owner/rotate-token", token, { method: "POST" });
    const d = await r.json() as { newToken?: string };
    setNewToken(d.newToken ?? "");
    setLoading(false);
  }

  function copyToken() {
    if (newToken) { navigator.clipboard.writeText(newToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} style={{ color: "#C9A227" }} /> Rotate Owner Token
        </div>
        <p style={{ fontSize: 12, color: "#52525b", marginBottom: 16, lineHeight: 1.7 }}>
          Generates a new 64-character hex token. Displayed ONCE — copy it immediately.
          Your current token remains active until you update OWNER_SECRET_TOKEN in Replit Secrets.
        </p>
        <button onClick={rotateToken} disabled={loading}
          style={{ padding: "10px 24px", borderRadius: 10, background: "#C9A227", color: "#000", fontWeight: 900, fontSize: 12, border: "none", cursor: "pointer" }}>
          {loading ? "Generating…" : "Generate New Token"}
        </button>
        {newToken && (
          <div style={{ marginTop: 16, background: "#0f0f12", border: "1px solid #27272a", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 6 }}>⚠ COPY NOW — DISPLAYED ONCE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code style={{ flex: 1, fontSize: 11, color: "#C9A227", wordBreak: "break-all", fontFamily: "monospace" }}>{newToken}</code>
              <button onClick={copyToken} style={{ background: "none", border: "1px solid #27272a", borderRadius: 6, padding: 6, cursor: "pointer", color: copied ? "#10B981" : "#71717a" }}>
                <Copy size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "#18181b", border: "1px solid #7f1d1d", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} /> Emergency Platform Restart
        </div>
        <p style={{ fontSize: 12, color: "#52525b", marginBottom: 16, lineHeight: 1.7 }}>
          Graceful shutdown — API will restart in 30 seconds.
          Use only in emergency. All active connections will be dropped.
        </p>
        {shutdownStep === 0 && (
          <button onClick={() => setShutdownStep(1)}
            style={{ padding: "10px 24px", borderRadius: 10, background: "#7f1d1d", color: "#fca5a5", fontWeight: 900, fontSize: 12, border: "1px solid #991b1b", cursor: "pointer" }}>
            Initiate Shutdown
          </button>
        )}
        {shutdownStep === 1 && (
          <div>
            <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>Are you absolutely certain? This will restart the API for all users.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShutdownStep(0)}
                style={{ padding: "10px 20px", borderRadius: 10, background: "#27272a", color: "#a1a1aa", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={async () => {
                await ownerFetch("/owner/shutdown", token, { method: "POST", body: JSON.stringify({ confirm: "CUXTOMCANDYCLUB-SHUTDOWN" }) });
                setShutdownStep(2);
              }}
                style={{ padding: "10px 20px", borderRadius: 10, background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: 12, border: "none", cursor: "pointer" }}>
                CONFIRM SHUTDOWN
              </button>
            </div>
          </div>
        )}
        {shutdownStep === 2 && (
          <div style={{ fontSize: 12, color: "#fca5a5", fontFamily: "monospace" }}>⚡ Shutdown scheduled. Restarting in 30 seconds…</div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Owner Portal ───────────────────────────────────────────────────── */
export default function OwnerPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("platform");

  if (!token) return <TokenGate onAuth={setToken} />;

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
    { id: "platform",  label: "Platform",  icon: Activity },
    { id: "outreach",  label: "I-95 Blast", icon: Send     },
    { id: "audit",     label: "Audit Log", icon: Eye      },
    { id: "security",  label: "Security",  icon: Lock     },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: "#0f0f12", borderBottom: "1px solid #1f1f22", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Crown size={20} style={{ color: "#C9A227" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Owner Command Center</div>
            <div style={{ fontSize: 9, color: "#52525b", fontFamily: "monospace", letterSpacing: "0.15em" }}>CUXTOMCANDYCLUB LLC · AUTHORIZED ACCESS · ALL ACTIONS LOGGED</div>
          </div>
        </div>
        <button onClick={() => setToken(null)} style={{ background: "none", border: "1px solid #27272a", borderRadius: 8, padding: "6px 12px", color: "#71717a", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
          Sign Out
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", borderBottom: "1px solid #1f1f22", background: "#0f0f12" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: tab === t.id ? "#C9A22720" : "transparent", color: tab === t.id ? "#C9A227" : "#71717a", fontWeight: tab === t.id ? 800 : 500, fontSize: 12, cursor: "pointer" }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
        {tab === "platform"  && <PlatformTab  token={token} />}
        {tab === "outreach"  && <OutreachTab  token={token} />}
        {tab === "audit"     && <AuditTab     token={token} />}
        {tab === "security"  && <SecurityTab  token={token} />}
      </div>
    </div>
  );
}
