import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck, Search, Filter, Download, RefreshCw,
  AlertTriangle, Info, AlertCircle, ChevronDown, Loader2,
  Database, CreditCard, Truck, QrCode, Settings, Activity,
  CheckCircle2, XCircle, Clock, Hash, User,
} from "lucide-react";

type EventType = "ALL" | "AUTH" | "DB_CHANGE" | "API_CALL" | "PAYOUT" | "DELIVERY" | "ADMIN" | "SYSTEM";
type Severity = "ALL" | "INFO" | "WARN" | "CRIT";

interface AuditLog {
  id: number;
  eventType: string;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  resourceType: string | null;
  resourceId: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  severity: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  sha256Hash: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  AUTH:      { label: "Auth",     icon: User,       color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20" },
  DB_CHANGE: { label: "DB Change",icon: Database,   color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
  API_CALL:  { label: "API Call", icon: Activity,   color: "text-white/40",   bg: "bg-white/5 border-white/10" },
  PAYOUT:    { label: "Payout",   icon: CreditCard, color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/20" },
  DELIVERY:  { label: "Delivery", icon: QrCode,     color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20" },
  ADMIN:     { label: "Admin",    icon: Settings,   color: "text-rose-400",   bg: "bg-rose-400/10 border-rose-400/20" },
  SYSTEM:    { label: "System",   icon: Settings,   color: "text-slate-400",  bg: "bg-slate-400/10 border-slate-400/20" },
};

const SEV_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  INFO: { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/25" },
  WARN: { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/25" },
  CRIT: { icon: XCircle,       color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/25" },
};

function fmtTs(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function AuditRow({ log, expanded, onToggle }: { log: AuditLog; expanded: boolean; onToggle: () => void }) {
  const sev = SEV_CONFIG[log.severity] ?? SEV_CONFIG.INFO;
  const SevIcon = sev.icon;
  const evt = EVENT_CONFIG[log.eventType] ?? EVENT_CONFIG.API_CALL;
  const EvtIcon = evt.icon;
  const { date, time } = fmtTs(log.createdAt);

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-white/[0.06] cursor-pointer transition-colors ${
          expanded ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
        }`}
      >
        {/* Timestamp */}
        <td className="px-4 py-3 whitespace-nowrap">
          <p className="text-[11px] font-mono text-white/50">{date}</p>
          <p className="text-[11px] font-mono text-white/25">{time}</p>
        </td>

        {/* Severity */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${sev.bg} ${sev.color}`}>
            <SevIcon className="w-2.5 h-2.5" />
            {log.severity}
          </span>
        </td>

        {/* Event type */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-medium ${evt.bg} ${evt.color}`}>
            <EvtIcon className="w-2.5 h-2.5" />
            {evt.label}
          </span>
        </td>

        {/* Action */}
        <td className="px-3 py-3">
          <p className="text-xs font-mono font-medium text-white/80">{log.action}</p>
        </td>

        {/* Actor */}
        <td className="px-3 py-3">
          <p className="text-[11px] font-mono text-white/40">{log.actorId ?? "—"}</p>
          {log.actorRole && (
            <p className="text-[10px] text-white/20">{log.actorRole}</p>
          )}
        </td>

        {/* Resource */}
        <td className="px-3 py-3">
          <p className="text-[11px] text-white/40">{log.resourceType ?? "—"}</p>
          {log.resourceId && <p className="text-[10px] font-mono text-white/20">{log.resourceId}</p>}
        </td>

        {/* Status */}
        <td className="px-3 py-3">
          {log.statusCode ? (
            <span className={`text-[11px] font-mono font-bold ${
              log.statusCode < 300 ? "text-emerald-400" :
              log.statusCode < 500 ? "text-amber-400" : "text-rose-400"
            }`}>
              {log.statusCode}
            </span>
          ) : <span className="text-white/15">—</span>}
        </td>

        {/* Expand toggle */}
        <td className="px-3 py-3 text-right">
          <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-white/[0.02] border-b border-white/[0.06]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-6 text-[11px]">
              {/* Hash */}
              {log.sha256Hash && (
                <div className="col-span-3 flex items-start gap-2">
                  <Hash className="w-3 h-3 text-amber-400/50 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-white/25 mb-0.5 uppercase tracking-wider text-[9px]">SHA-256 Tamper Hash</p>
                    <p className="font-mono text-amber-400/50 break-all leading-relaxed">{log.sha256Hash}</p>
                  </div>
                </div>
              )}
              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="col-span-2">
                  <p className="text-white/25 mb-1.5 uppercase tracking-wider text-[9px]">Metadata</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(log.metadata).map(([k, v]) => (
                      <span key={k} className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">
                        <span className="text-white/30">{k}:</span>
                        <span className="text-white/60 font-mono">{JSON.stringify(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Network */}
              <div>
                <p className="text-white/25 mb-1.5 uppercase tracking-wider text-[9px]">Network</p>
                <p className="text-white/40 font-mono">{log.ipAddress ?? "—"}</p>
                {log.path && (
                  <p className="text-white/25 mt-1 font-mono">{log.method} {log.path}</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditVaultPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [eventType, setEventType] = useState<EventType>("ALL");
  const [severity, setSeverity] = useState<Severity>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (opts?: { reset?: boolean }) => {
    setLoading(true);
    const currentPage = opts?.reset ? 0 : page;
    if (opts?.reset) setPage(0);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(currentPage * PAGE_SIZE),
    });
    if (eventType !== "ALL") params.set("eventType", eventType);
    if (severity !== "ALL") params.set("severity", severity);
    if (search.trim()) params.set("search", search.trim());

    const [logsRes, statsRes] = await Promise.all([
      fetch(`/api/audit/logs?${params}`),
      fetch("/api/audit/stats"),
    ]);

    if (logsRes.ok) {
      const data = await logsRes.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    }
    if (statsRes.ok) setStats(await statsRes.json());
    setLoading(false);
  }, [eventType, severity, search, page]);

  useEffect(() => { fetchLogs({ reset: true }); }, [eventType, severity]);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchLogs({ reset: true }), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);
  useEffect(() => { fetchLogs(); }, [page]);

  const handleSeed = async () => {
    setSeeding(true);
    await fetch("/api/audit/seed", { method: "POST" });
    await fetchLogs({ reset: true });
    setSeeding(false);
  };

  const exportCsv = () => {
    const header = "id,timestamp,severity,eventType,action,actorId,actorRole,resourceType,resourceId,statusCode,ip,sha256\n";
    const rows = logs.map((l) =>
      [l.id, l.createdAt, l.severity, l.eventType, l.action, l.actorId ?? "",
       l.actorRole ?? "", l.resourceType ?? "", l.resourceId ?? "",
       l.statusCode ?? "", l.ipAddress ?? "", l.sha256Hash ?? ""].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3c-onyx-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Audit Vault</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-500/25 bg-rose-500/10 text-xs font-semibold text-rose-400">
              <ShieldCheck className="w-3 h-3" />
              ADMIN ONLY
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/25 bg-amber-500/10 text-xs font-medium text-amber-400">
              SOC2 Type 1
            </span>
          </div>
          <p className="text-white/40 text-sm ml-[52px]">
            Immutable tamper-evident log of all system events — no raw PII stored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs({ reset: true })}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 text-white/30 hover:text-white/60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {total === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {seeding ? "Loading…" : "Load SOC2 Audit Trail"}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-6 gap-3 mb-5">
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Total Records</p>
            <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
            <p className="text-[10px] text-white/20 mt-0.5">Across all event categories</p>
          </div>
          {(["INFO", "WARN", "CRIT"] as const).map((s) => {
            const cfg = SEV_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className={`rounded-xl border p-4 ${cfg.bg}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">{s}</p>
                </div>
                <p className={`text-2xl font-bold ${cfg.color}`}>{(stats.bySeverity[s] ?? 0).toLocaleString()}</p>
              </div>
            );
          })}
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">By Category</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byType).map(([k, v]) => {
                const cfg = EVENT_CONFIG[k] ?? EVENT_CONFIG.API_CALL;
                return (
                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label} {v}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            placeholder="Search action, actor, resource…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/30"
          />
        </div>

        {/* Event type filter */}
        <div className="flex items-center gap-1">
          {(["ALL", "AUTH", "DB_CHANGE", "PAYOUT", "DELIVERY", "ADMIN", "SYSTEM"] as EventType[]).map((t) => (
            <button
              key={t}
              onClick={() => setEventType(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                eventType === t
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-white/10 text-white/30 hover:text-white/50"
              }`}
            >
              {t === "ALL" ? "All Types" : (EVENT_CONFIG[t]?.label ?? t)}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-1 ml-auto">
          {(["ALL", "INFO", "WARN", "CRIT"] as Severity[]).map((s) => {
            const cfg = s !== "ALL" ? SEV_CONFIG[s] : null;
            return (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                  severity === s
                    ? cfg
                      ? `${cfg.bg} ${cfg.color}`
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-white/10 text-white/30 hover:text-white/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* PII banner */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <p className="text-[11px] text-emerald-400/60">
          <span className="font-semibold text-emerald-400">PII Compliance Active</span> — all actor IDs, resource IDs, and IP addresses are masked. Raw PII is never written to this log. Each record is SHA-256 hashed for tamper evidence.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
          <p className="text-[11px] text-white/30 font-medium">
            {loading ? "Loading…" : `${total.toLocaleString()} records ${total !== logs.length ? `(showing ${logs.length})` : ""}`}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-white/20">
            <Clock className="w-3 h-3" />
            Ordered by newest first
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-white/15 animate-spin mx-auto mb-2" />
            <p className="text-xs text-white/20">Loading audit trail…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Database className="w-7 h-7 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/25 mb-1">No audit records yet</p>
            <p className="text-xs text-white/15">Click "Load SOC2 Audit Trail" to import evidence records</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["Timestamp", "Severity", "Category", "Action", "Actor (masked)", "Resource", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[9px] font-semibold text-white/20 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <AuditRow
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                />
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
            <p className="text-[11px] text-white/25">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 disabled:opacity-30 hover:text-white/70 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 disabled:opacity-30 hover:text-white/70 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
