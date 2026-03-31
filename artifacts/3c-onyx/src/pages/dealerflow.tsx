import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Camera, Check, CheckCircle2, Clock, DollarSign, FileText,
  Filter, Gauge, Inbox, Layers, MessageSquare, Plus, RefreshCw,
  Route, ScanLine, Send, Shield, Target, ThumbsUp, TrendingUp, Users, X, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("onyxToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res;
}

type DFTask = {
  id: number;
  title: string;
  description: string | null;
  department: string;
  priority: string;
  status: string;
  intakeType: string;
  vin: string | null;
  routedByAgent: string | null;
  routingConfidence: string | null;
  slaMinutes: number;
  slaDueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  metadata: any;
  slaBreached?: boolean;
  minutesOverdue?: number;
  queuePosition?: number;
  ageMinutes?: number;
};

type Ticket = {
  id: number;
  subject: string;
  description: string | null;
  status: string;
  channel: string;
  category: string;
  customerName: string | null;
  customerPhone: string | null;
  autoResponse: string | null;
  lastMessage: string | null;
  createdAt: string;
};

type DeptPulse = {
  department: string;
  pulse: string;
  health: string;
  active: number;
  overdue: number;
};

type DashboardStats = {
  tasks: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    escalated: number;
    waiting: number;
    completedToday: number;
    completedThisWeek: number;
    overdueSla: number;
    critical: number;
    avgResolutionMinutes: number;
    pendingApprovals: number;
  };
  tickets: {
    total: number;
    newTickets: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResponseMinutes: number;
  };
  scans: {
    total: number;
    routed: number;
    todayScans: number;
  };
  departments: Array<{
    department: string;
    total: number;
    open: number;
    inProgress: number;
    overdue: number;
    completed: number;
  }>;
  departmentPulses: DeptPulse[];
};

type PerformanceData = {
  period: string;
  weekly: {
    totalCreated: number;
    completed: number;
    escalated: number;
    avgResolutionMinutes: number;
    slaComplianceRate: number;
    avgResolutionFormatted: string;
  };
  monthly: {
    totalCreated: number;
    completed: number;
    avgResolutionMinutes: number;
  };
  departmentPerformance: Array<{
    department: string;
    totalCreated: number;
    completed: number;
    avgResolutionMinutes: number;
    avgResolutionFormatted: string;
    escalated: number;
    completionRate: number;
  }>;
  tickets: {
    totalCreated: number;
    resolved: number;
    avgResponseMinutes: number;
  };
  scans: {
    totalScans: number;
    routed: number;
  };
  techFees: {
    totalFees: number;
    pendingFees: number;
  };
  impact: {
    hoursSaved: number;
    efficiency: number;
    paperworkEliminated: number;
    customerResponseImprovement: string;
  };
};

const DEPARTMENTS = ["DMV", "Parts", "Service", "Finance", "Logistics", "Sales", "Customer_Service", "General"];
const STATUSES = ["Open", "In_Progress", "Waiting", "Pending_Approval", "Completed", "Escalated", "Cancelled"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

function deptColor(dept: string) {
  const map: Record<string, string> = {
    DMV: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    Parts: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    Service: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    Finance: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    Logistics: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    Sales: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    Customer_Service: "text-pink-400 bg-pink-400/10 border-pink-400/30",
    General: "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
  };
  return map[dept] || map.General;
}

function deptIcon(dept: string) {
  const map: Record<string, string> = {
    DMV: "📋", Parts: "🔧", Service: "🛠️", Finance: "💰",
    Logistics: "🚛", Sales: "🤝", Customer_Service: "📞", General: "📁",
  };
  return map[dept] || "📁";
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Open: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    In_Progress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Waiting: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Pending_Approval: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    Completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Escalated: "bg-red-500/20 text-red-300 border-red-500/30",
    Cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    New: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    Resolved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Closed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return map[s] || map.Open;
}

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    Critical: "bg-red-600/30 text-red-300",
    High: "bg-orange-500/20 text-orange-300",
    Medium: "bg-yellow-500/20 text-yellow-300",
    Low: "bg-zinc-500/20 text-zinc-400",
  };
  return map[p] || map.Medium;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function slaStatus(slaDueAt: string | null, status: string) {
  if (!slaDueAt || status === "Completed" || status === "Cancelled" || status === "Pending_Approval") return null;
  const remaining = new Date(slaDueAt).getTime() - Date.now();
  if (remaining < 0) return { label: "OVERDUE", color: "text-red-400 animate-pulse" };
  const mins = Math.floor(remaining / 60000);
  if (mins < 60) return { label: `${mins}m left`, color: "text-orange-400" };
  const hrs = Math.floor(mins / 60);
  return { label: `${hrs}h left`, color: hrs <= 2 ? "text-yellow-400" : "text-zinc-400" };
}

function formatMinutes(mins: number) {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Tab = "dashboard" | "tasks" | "intake" | "tickets" | "queue" | "performance" | "vault" | "velocity";

export default function DealerFlowOS() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [queueDept, setQueueDept] = useState("DMV");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Command Center", icon: <Activity className="w-4 h-4" /> },
    { id: "tasks", label: "Task Board", icon: <Layers className="w-4 h-4" /> },
    { id: "queue", label: "Dept Queue", icon: <Users className="w-4 h-4" /> },
    { id: "intake", label: "Scan & Route", icon: <ScanLine className="w-4 h-4" /> },
    { id: "tickets", label: "Inbox", icon: <Inbox className="w-4 h-4" /> },
    { id: "vault", label: "Bank Vault", icon: <DollarSign className="w-4 h-4" /> },
    { id: "performance", label: "Performance", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "velocity", label: "GM View", icon: <Gauge className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">DealerFlow OS</h1>
              <p className="text-xs text-zinc-500">Industrial Sovereign Build &mdash; 3C ONYX</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-zinc-900/80 rounded-lg p-1 border border-zinc-800 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all",
                tab === t.id ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              {t.icon}
              <span className="hidden lg:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {tab === "dashboard" && <CommandCenter onNavigate={setTab} onSelectDept={(d) => { setQueueDept(d); setTab("queue"); }} />}
      {tab === "tasks" && <TaskBoard deptFilter={deptFilter} setDeptFilter={setDeptFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />}
      {tab === "intake" && <IntakeScanner />}
      {tab === "tickets" && <TicketInbox />}
      {tab === "queue" && <DeptQueue department={queueDept} setDepartment={setQueueDept} />}
      {tab === "vault" && <BankVault />}
      {tab === "performance" && <PerformanceReport />}
      {tab === "velocity" && <GMVelocityDashboard />}
    </div>
  );
}

function CommandCenter({ onNavigate, onSelectDept }: { onNavigate: (t: Tab) => void; onSelectDept: (d: string) => void }) {
  const qc = useQueryClient();
  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["dealerflow-dashboard"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/dashboard`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const escalate = useMutation({
    mutationFn: () =>
      authFetch(`${BASE}/api/dealerflow/escalate`, { method: "POST", headers: { "Content-Type": "application/json" } }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const s = stats?.tasks || { total: 0, open: 0, inProgress: 0, completed: 0, escalated: 0, waiting: 0, completedToday: 0, completedThisWeek: 0, overdueSla: 0, critical: 0, avgResolutionMinutes: 0, pendingApprovals: 0 };
  const t = stats?.tickets || { total: 0, newTickets: 0, open: 0, inProgress: 0, resolved: 0, avgResponseMinutes: 0 };
  const sc = stats?.scans || { total: 0, routed: 0, todayScans: 0 };

  const metrics = [
    { label: "Open Tasks", value: s.open, icon: <Layers className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "In Progress", value: s.inProgress, icon: <Activity className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Completed Today", value: s.completedToday, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "SLA Overdue", value: s.overdueSla, icon: <AlertTriangle className="w-5 h-5" />, color: s.overdueSla > 0 ? "text-red-400" : "text-zinc-500", bg: s.overdueSla > 0 ? "bg-red-500/10 border-red-500/20 animate-pulse" : "bg-zinc-800 border-zinc-700" },
    { label: "Critical", value: s.critical, icon: <Zap className="w-5 h-5" />, color: s.critical > 0 ? "text-red-400" : "text-zinc-500", bg: s.critical > 0 ? "bg-red-500/10 border-red-500/20" : "bg-zinc-800 border-zinc-700" },
    { label: "Awaiting Approval", value: s.pendingApprovals, icon: <ThumbsUp className="w-5 h-5" />, color: s.pendingApprovals > 0 ? "text-violet-400" : "text-zinc-500", bg: s.pendingApprovals > 0 ? "bg-violet-500/10 border-violet-500/20 animate-pulse" : "bg-zinc-800 border-zinc-700" },
    { label: "New Tickets", value: t.newTickets, icon: <MessageSquare className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { label: "Scans Today", value: sc.todayScans, icon: <ScanLine className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Avg Resolution", value: formatMinutes(s.avgResolutionMinutes), icon: <Clock className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "This Week", value: s.completedThisWeek, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Escalated", value: s.escalated, icon: <AlertTriangle className="w-5 h-5" />, color: s.escalated > 0 ? "text-orange-400" : "text-zinc-500", bg: s.escalated > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-zinc-800 border-zinc-700" },
    { label: "Total Resolved", value: s.completed, icon: <Target className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total Scanned", value: sc.total, icon: <FileText className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button onClick={() => onNavigate("tasks")} className="col-span-1 bg-gradient-to-br from-amber-600/20 to-amber-700/10 border border-amber-500/30 rounded-xl p-5 text-left hover:border-amber-500/50 transition group">
          <Plus className="w-7 h-7 text-amber-400 mb-2 group-hover:scale-110 transition" />
          <p className="text-sm font-bold text-white">New Task</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Create & auto-route</p>
        </button>
        <button onClick={() => onNavigate("intake")} className="col-span-1 bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 border border-cyan-500/30 rounded-xl p-5 text-left hover:border-cyan-500/50 transition group">
          <ScanLine className="w-7 h-7 text-cyan-400 mb-2 group-hover:scale-110 transition" />
          <p className="text-sm font-bold text-white">Scan Document</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">OCR intake gateway</p>
        </button>
        <button onClick={() => onNavigate("tickets")} className="col-span-1 bg-gradient-to-br from-indigo-600/20 to-indigo-700/10 border border-indigo-500/30 rounded-xl p-5 text-left hover:border-indigo-500/50 transition group">
          <Inbox className="w-7 h-7 text-indigo-400 mb-2 group-hover:scale-110 transition" />
          <p className="text-sm font-bold text-white">Customer Inbox</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{t.newTickets} new message{t.newTickets !== 1 ? "s" : ""}</p>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={cn("rounded-xl border p-3.5", m.bg)}>
            <div className={cn("mb-1.5", m.color)}>{m.icon}</div>
            <p className="text-xl font-bold text-white">{m.value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <ApprovalQueue />

      {(stats?.departmentPulses?.length ?? 0) > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Route className="w-4 h-4 text-amber-400" /> Departmental Pulses
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats!.departmentPulses.map((d) => (
              <button
                key={d.department}
                onClick={() => onSelectDept(d.department)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left hover:border-opacity-70 transition cursor-pointer",
                  deptColor(d.department),
                  d.health === "warning" ? "ring-1 ring-red-500/30" : ""
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{deptIcon(d.department)}</span>
                  {d.health === "warning" && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                </div>
                <p className="text-sm font-bold">{d.active} Active</p>
                <p className="text-[10px] mt-0.5">{d.department.replace("_", " ")}</p>
                {d.overdue > 0 && <p className="text-[10px] text-red-400 mt-0.5">{d.overdue} overdue</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {s.overdueSla > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-red-300">{s.overdueSla} Task{s.overdueSla !== 1 ? "s" : ""} Past SLA Deadline</p>
              <p className="text-[10px] text-zinc-500">Auto-escalation will flag these for manager review</p>
            </div>
          </div>
          <button
            onClick={() => escalate.mutate()}
            disabled={escalate.isPending}
            className="bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
          >
            {escalate.isPending ? "Escalating..." : "Escalate All"}
          </button>
        </div>
      )}

      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-zinc-500">
          DealerFlow OS v2.0 &mdash; Industrial Sovereign Build &mdash; Architected by Ronald Antonio Cadet
        </span>
        <button onClick={() => refetch()} className="ml-auto text-zinc-500 hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TaskBoard({ deptFilter, setDeptFilter, statusFilter, setStatusFilter }: {
  deptFilter: string; setDeptFilter: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const qc = useQueryClient();

  const qs = new URLSearchParams();
  if (deptFilter) qs.set("department", deptFilter);
  if (statusFilter) qs.set("status", statusFilter);

  const { data, isLoading } = useQuery<{ tasks: DFTask[] }>({
    queryKey: ["dealerflow-tasks", deptFilter, statusFilter],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/tasks?${qs}`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; priority?: string; department?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-approvals"] });
    },
  });

  const tasks = data?.tasks || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500" />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 border border-zinc-700">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 border border-zinc-700">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button onClick={() => setShowCreate(!showCreate)} className="ml-auto flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-amber-500/30 transition">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {showCreate && <CreateTaskForm onClose={() => setShowCreate(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tasks found. Create one or adjust filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const sla = slaStatus(task.slaDueAt, task.status);
            const expanded = expandedTask === task.id;
            const meta = task.metadata || {};
            return (
              <div key={task.id} className={cn("bg-zinc-900/60 rounded-xl border p-4 transition cursor-pointer", task.slaBreached ? "border-red-500/30" : "border-zinc-800 hover:border-zinc-700")} onClick={() => setExpandedTask(expanded ? null : task.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", deptColor(task.department))}>
                        {deptIcon(task.department)} {task.department.replace("_", " ")}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", statusBadge(task.status))}>
                        {task.status.replace("_", " ")}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", priorityBadge(task.priority))}>
                        {task.priority}
                      </span>
                      {task.routedByAgent && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Route className="w-3 h-3" /> {task.routedByAgent}
                        </span>
                      )}
                      {meta.bankReady && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Bank Ready
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                    {task.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                      <span>#{task.id}</span>
                      {task.vin && <span className="text-zinc-500 font-mono">VIN: {task.vin}</span>}
                      <span>{timeAgo(task.createdAt)}</span>
                      {sla && <span className={sla.color}><Clock className="w-3 h-3 inline mr-0.5" />{sla.label}</span>}
                      {task.slaBreached && <span className="text-red-400 font-bold animate-pulse">SLA BREACHED ({task.minutesOverdue}m)</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    {task.status === "Open" && (
                      <button onClick={() => updateTask.mutate({ id: task.id, status: "In_Progress" })} className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded hover:bg-yellow-500/30 transition">
                        Start
                      </button>
                    )}
                    {task.status === "In_Progress" && (
                      <button onClick={() => updateTask.mutate({ id: task.id, status: "Completed" })} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/30 transition">
                        Complete
                      </button>
                    )}
                    {(task.status === "Open" || task.status === "In_Progress") && (
                      <RequestApprovalButton taskId={task.id} department={task.department} />
                    )}
                    {task.status === "Pending_Approval" && (
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-1 rounded flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Awaiting
                      </span>
                    )}
                    {(task.status === "Open" || task.status === "In_Progress") && (
                      <button onClick={() => updateTask.mutate({ id: task.id, status: "Escalated" })} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30 transition">
                        Escalate
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-zinc-800/80 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-zinc-500 uppercase">Intake Type</p>
                        <p className="text-xs font-semibold text-white">{task.intakeType}</p>
                      </div>
                      <div className="bg-zinc-800/80 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-zinc-500 uppercase">SLA Window</p>
                        <p className="text-xs font-semibold text-white">{formatMinutes(task.slaMinutes)}</p>
                      </div>
                      <div className="bg-zinc-800/80 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-zinc-500 uppercase">Confidence</p>
                        <p className="text-xs font-semibold text-white">{Math.round(parseFloat(task.routingConfidence || "0") * 100)}%</p>
                      </div>
                      <div className="bg-zinc-800/80 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-zinc-500 uppercase">Created</p>
                        <p className="text-xs font-semibold text-white">{new Date(task.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {task.vin && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-4 py-3">
                        <p className="text-[10px] text-purple-400 uppercase font-medium mb-1">VIN-Linked Vehicle</p>
                        <p className="text-sm font-mono text-white">{task.vin}</p>
                      </div>
                    )}
                    {meta.extractedCustomerName && (
                      <div className="text-xs text-zinc-400">Customer: <span className="text-white">{meta.extractedCustomerName}</span></div>
                    )}
                    {meta.matchedKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meta.matchedKeywords.map((kw: string) => (
                          <span key={kw} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                    {meta.bankReadySignals?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {meta.bankReadySignals.map((sig: string) => (
                          <span key={sig} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">{sig}</span>
                        ))}
                      </div>
                    )}
                    {meta.notifications?.length > 0 && (
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-indigo-400 uppercase font-medium mb-1">Communication Log ({meta.notifications.length})</p>
                        {meta.notifications.slice(-3).map((n: any, i: number) => (
                          <div key={i} className="text-[10px] text-zinc-400 flex items-center gap-2 mt-1">
                            <Send className="w-3 h-3 text-indigo-400" />
                            <span className="text-zinc-500">{n.channel}</span>
                            <span className="text-white truncate flex-1">{n.message}</span>
                            <span className="text-zinc-600">{new Date(n.sentAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <PipelineJourney metadata={meta} />
                    {meta.lastApprovalDecision && (
                      <div className={cn("rounded-lg px-3 py-2 border text-[10px]",
                        meta.lastApprovalDecision.decision === "Approved" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-red-500/5 border-red-500/20 text-red-300"
                      )}>
                        <span className="font-semibold">{meta.lastApprovalDecision.decision}</span>
                        {meta.lastApprovalDecision.decisionNote && <span className="text-zinc-400 ml-2">"{meta.lastApprovalDecision.decisionNote}"</span>}
                        <span className="text-zinc-600 ml-2">{new Date(meta.lastApprovalDecision.decidedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <NextStepSuggestions
                      taskId={task.id}
                      department={task.department}
                      status={task.status}
                      metadata={meta}
                      onRoute={(dept) => updateTask.mutate({ id: task.id, department: dept })}
                    />
                    <NotifyCustomerButton taskId={task.id} customerName={meta.extractedCustomerName} phone={meta.extractedPhone} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RequestApprovalButton({ taskId, department }: { taskId: number; department: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [targetDept, setTargetDept] = useState("");
  const qc = useQueryClient();

  const request = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${taskId}/request-approval`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      setOpen(false);
      setNote("");
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-approvals"] });
    },
  });

  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-1 rounded hover:bg-violet-500/30 transition flex items-center gap-1">
        <ThumbsUp className="w-3 h-3" /> Approval
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 space-y-2 min-w-[200px]">
      <p className="text-[10px] font-semibold text-violet-300">Request Manager Approval</p>
      <select value={targetDept} onChange={(e) => setTargetDept(e.target.value)} className="w-full bg-zinc-800 text-zinc-300 text-[10px] rounded px-2 py-1 border border-zinc-700">
        <option value="">Target Dept (optional)</option>
        {DEPARTMENTS.filter((d) => d !== department).map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
      </select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Approval note (e.g., repair cost $2,400)" className="w-full bg-zinc-800 text-zinc-200 text-[10px] rounded px-2 py-1 border border-zinc-700 resize-none h-12" />
      <div className="flex gap-1">
        <button
          onClick={() => request.mutate({ approvalNote: note || undefined, targetDepartment: targetDept || undefined })}
          disabled={request.isPending}
          className="flex-1 text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 py-1 rounded font-semibold hover:bg-violet-500/30 transition disabled:opacity-50"
        >
          {request.isPending ? "Sending..." : "Send for Approval"}
        </button>
        <button onClick={() => setOpen(false)} className="text-[10px] text-zinc-500 px-2 py-1 hover:text-white transition">Cancel</button>
      </div>
    </div>
  );
}

function ApprovalQueue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ approvals: DFTask[]; count: number }>({
    queryKey: ["dealerflow-approvals"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/approvals`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, decisionNote }: { id: number; decision: string; decisionNote?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, decisionNote }) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-approvals"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const approvals = data?.approvals || [];
  if (isLoading || approvals.length === 0) return null;

  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-violet-300 mb-4 flex items-center gap-2">
        <ThumbsUp className="w-4 h-4" /> Approval Queue ({approvals.length})
      </h3>
      <div className="space-y-2">
        {approvals.map((task) => {
          const meta = (task.metadata || {}) as any;
          return (
            <div key={task.id} className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", deptColor(task.department))}>
                    {deptIcon(task.department)} {task.department.replace("_", " ")}
                  </span>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", priorityBadge(task.priority))}>
                    {task.priority}
                  </span>
                  {meta.pendingApproval?.fromDepartment && meta.pendingApproval.fromDepartment !== task.department && (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> from {meta.pendingApproval.fromDepartment}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                {meta.pendingApproval?.note && (
                  <p className="text-xs text-zinc-400 mt-1 italic">"{meta.pendingApproval.note}"</p>
                )}
                <p className="text-[10px] text-zinc-600 mt-1">#{task.id} · {timeAgo(task.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => decide.mutate({ id: task.id, decision: "Approved" })}
                  disabled={decide.isPending}
                  className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => decide.mutate({ id: task.id, decision: "Rejected" })}
                  disabled={decide.isPending}
                  className="flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineJourney({ metadata }: { metadata: any }) {
  const history = metadata?.departmentHistory;
  if (!Array.isArray(history) || history.length === 0) return null;

  const original = metadata?.originalDepartment || history[0]?.from;
  const steps = [original, ...history.map((h: any) => h.to)];

  return (
    <div className="bg-zinc-800/60 rounded-lg px-4 py-3">
      <p className="text-[10px] text-zinc-500 uppercase font-medium mb-2">Pipeline Journey</p>
      <div className="flex items-center gap-1 flex-wrap">
        {steps.map((dept: string, i: number) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <ArrowRight className="w-3 h-3 text-zinc-600" />}
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", deptColor(dept))}>
              {deptIcon(dept)} {dept.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600 mt-1.5">{history.length} reroute{history.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

function NextStepSuggestions({ taskId, department, status, metadata, onRoute }: {
  taskId: number; department: string; status: string; metadata: any;
  onRoute: (dept: string) => void;
}) {
  const { data } = useQuery<{ suggestions: Array<{ nextDept: string; action: string; reason: string; confidence: string }>; needsApproval: boolean; approvalHint: string | null }>({
    queryKey: ["dealerflow-suggest", taskId],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/tasks/${taskId}/suggest`).then((r) => r.json()),
    staleTime: 30000,
    enabled: status !== "Completed" && status !== "Cancelled",
  });

  if (!data?.suggestions?.length) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
      <p className="text-[10px] text-amber-400 uppercase font-medium mb-2 flex items-center gap-1">
        <Zap className="w-3 h-3" /> Suggested Next Steps
      </p>
      {data.needsApproval && data.approvalHint && (
        <p className="text-[10px] text-violet-400 mb-2 flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" /> {data.approvalHint}
        </p>
      )}
      <div className="space-y-1.5">
        {data.suggestions.slice(0, 3).map((s, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onRoute(s.nextDept); }}
            className="w-full flex items-center gap-2 text-left bg-zinc-900/60 rounded-lg px-3 py-2 hover:bg-zinc-800 transition group"
          >
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0", deptColor(s.nextDept))}>
              {deptIcon(s.nextDept)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white">{s.action}</p>
              <p className="text-[10px] text-zinc-500 truncate">{s.reason}</p>
            </div>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded shrink-0",
              s.confidence === "high" ? "bg-emerald-500/20 text-emerald-400" :
              s.confidence === "low" ? "bg-zinc-600/20 text-zinc-500" :
              "bg-amber-500/20 text-amber-400"
            )}>
              {s.confidence}
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function NotifyCustomerButton({ taskId, customerName, phone }: { taskId: number; customerName?: string; phone?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("App");
  const [sent, setSent] = useState<any>(null);
  const qc = useQueryClient();

  const notify = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${taskId}/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      setSent(data);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
    },
  });

  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="flex items-center gap-1.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded hover:bg-indigo-500/30 transition mt-2">
        <MessageSquare className="w-3 h-3" />
        Notify Customer{customerName ? ` (${customerName})` : ""}
      </button>
    );
  }

  return (
    <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-lg p-3 mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-indigo-300 uppercase font-medium">Send Customer Update</p>
        <button onClick={() => { setOpen(false); setSent(null); }} className="text-[10px] text-zinc-500 hover:text-white">Close</button>
      </div>
      {customerName && <p className="text-[10px] text-zinc-400">To: <span className="text-white">{customerName}</span>{phone ? ` (${phone})` : ""}</p>}
      <select value={channel} onChange={(e) => setChannel(e.target.value)} className="bg-zinc-800 text-zinc-300 text-[10px] rounded px-2 py-1 border border-zinc-700 w-full">
        <option value="App">In-App</option>
        <option value="SMS">SMS</option>
        <option value="Email">Email</option>
        <option value="WhatsApp">WhatsApp</option>
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`e.g., "Your ${customerName ? customerName + "'s " : ""}registration is being processed..."`}
        rows={2}
        className="w-full bg-zinc-800 text-white text-xs rounded px-3 py-2 border border-zinc-700 outline-none resize-none"
      />
      <button
        onClick={() => notify.mutate({ message, channel })}
        disabled={!message.trim() || notify.isPending}
        className="flex items-center gap-1.5 text-[10px] bg-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded hover:bg-indigo-500/40 transition disabled:opacity-50"
      >
        <Send className="w-3 h-3" />
        {notify.isPending ? "Sending..." : "Send Update"}
      </button>
      {sent && (
        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Notification sent via {sent.channel}
          {sent.note && <span className="text-zinc-500 ml-1">— {sent.note}</span>}
        </p>
      )}
    </div>
  );
}

function CreateTaskForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dept, setDept] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [vin, setVin] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      onClose();
    },
  });

  return (
    <div className="bg-zinc-900 rounded-xl border border-amber-500/30 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Create New Task
      </h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title (e.g., DMV Title Transfer for 2024 Ram)" className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 focus:border-amber-500/50 outline-none" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description — Smart Router will auto-detect department..." rows={3} className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 focus:border-amber-500/50 outline-none resize-none" />
      <div className="grid grid-cols-3 gap-3">
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 border border-zinc-700">
          <option value="">Auto-Route</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 border border-zinc-700">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN (optional)" className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition">Cancel</button>
        <button onClick={() => create.mutate({ title, description: desc || undefined, department: dept || undefined, priority, vin: vin || undefined })} disabled={!title || create.isPending} className="text-sm bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-amber-400 transition disabled:opacity-50">
          {create.isPending ? "Creating..." : "Create & Route"}
        </button>
      </div>
    </div>
  );
}

function IntakeScanner() {
  const [rawText, setRawText] = useState("");
  const [docType, setDocType] = useState("Other");
  const [result, setResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const DOC_TYPES = ["Invoice", "DMV_Form", "Title", "Registration", "Mopar_Sheet", "Parts_Order", "Warranty_Claim", "Insurance_Doc", "Bill_of_Sale", "Other"];

  const scan = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/intake`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const visionScan = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/intake/vision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      setResult(data);
      setImagePreview(null);
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-cyan-400" /> Universal Intake Gateway
        </h3>
        <p className="text-xs text-zinc-500">
          Paste document text, OCR output, SMS, or email content — or snap a photo of any dealership document. AI Vision will extract and route automatically.
        </p>
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 border border-zinc-700 w-full sm:w-auto">
          {DOC_TYPES.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
        </select>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition"
          >
            <Camera className="w-4 h-4" />
            Snap / Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreview && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Image loaded
            </span>
          )}
        </div>

        {imagePreview && (
          <div className="space-y-3">
            <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-purple-500/30">
              <img src={imagePreview} alt="Document preview" className="w-full h-auto max-h-48 object-contain bg-zinc-800" />
            </div>
            <button
              onClick={() => visionScan.mutate({ imageBase64: imagePreview, documentType: docType })}
              disabled={visionScan.isPending}
              className="flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {visionScan.isPending ? "AI Vision Processing..." : "AI Vision Scan & Route"}
            </button>
            <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-zinc-500 hover:text-white transition">
              Clear image
            </button>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <p className="text-[10px] text-zinc-600 uppercase mb-2">Or paste text directly</p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste invoice text, DMV form content, SMS message, or email body here...

Example: 'Customer: John Smith needs title transfer for VIN 1C4RJFBG5LC123456. Sticker and plates required. Rush delivery to zip 55014.'"
            rows={5}
            className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-3 border border-zinc-700 focus:border-cyan-500/50 outline-none resize-none font-mono"
          />
          <button
            onClick={() => scan.mutate({ rawText, documentType: docType })}
            disabled={!rawText.trim() || scan.isPending}
            className="mt-2 flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition disabled:opacity-50"
          >
            <Route className="w-4 h-4" />
            {scan.isPending ? "Processing..." : "Scan & Route"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-zinc-900/60 rounded-xl border border-emerald-500/30 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Routing Complete
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Department</p>
              <p className="text-sm font-semibold text-white">{result.routing?.department || "N/A"}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Agent</p>
              <p className="text-sm font-semibold text-white">{result.routing?.agent || "N/A"}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Confidence</p>
              <p className="text-sm font-semibold text-white">{Math.round((result.routing?.confidence || 0) * 100)}%</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Task ID</p>
              <p className="text-sm font-semibold text-amber-300">#{result.task?.id || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Priority</p>
              <p className={cn("text-sm font-semibold", result.routing?.suggestedPriority === "Critical" ? "text-red-300" : "text-white")}>{result.routing?.suggestedPriority || "Medium"}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">SLA</p>
              <p className="text-sm font-semibold text-white">{formatMinutes(result.routing?.slaMinutes || 0)}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Urgency</p>
              <p className="text-sm font-semibold text-white">{result.routing?.urgencyScore || 0}</p>
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase">Bank Ready</p>
              <p className={cn("text-sm font-semibold", result.routing?.bankReady ? "text-emerald-300" : "text-zinc-500")}>{result.routing?.bankReady ? "Yes" : "No"}</p>
            </div>
          </div>
          {result.scan?.extractedVin && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Shield className="w-3 h-3 text-purple-400" /> Extracted VIN: <span className="text-white font-mono">{result.scan.extractedVin}</span>
            </div>
          )}
          {result.routing?.matchedKeywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {result.routing.matchedKeywords.map((kw: string) => (
                <span key={kw} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          )}
          {result.routing?.matchedPhrases?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.routing.matchedPhrases.map((ph: string) => (
                <span key={ph} className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">{ph}</span>
              ))}
            </div>
          )}
          {result.routing?.bankReadySignals?.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 mt-2">
              <p className="text-[10px] text-emerald-400 uppercase font-medium mb-1">Bank-Ready Signals Detected</p>
              <div className="flex flex-wrap gap-1">
                {result.routing.bankReadySignals.map((s: string) => (
                  <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeptQueue({ department, setDepartment }: { department: string; setDepartment: (d: string) => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ queue: DFTask[]; count: number }>({
    queryKey: ["dealerflow-queue", department],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/queue?department=${department}`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-queue"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const queue = data?.queue || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" /> Department Queue
        </h3>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 border border-zinc-700">
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{deptIcon(d)} {d.replace("_", " ")}</option>)}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">{queue.length} in queue</span>
      </div>

      <div className={cn("bg-zinc-900/40 rounded-xl border p-4", deptColor(department))}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{deptIcon(department)}</span>
          <div>
            <p className="text-lg font-bold text-white">{department.replace("_", " ")} Queue</p>
            <p className="text-xs text-zinc-500">Sorted by priority then age (oldest first)</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Queue is clear. All {department.replace("_", " ")} tasks are resolved.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((task) => (
            <div key={task.id} className={cn("bg-zinc-900/60 rounded-xl border p-4", task.slaBreached ? "border-red-500/30" : "border-zinc-800")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] bg-zinc-700 text-white font-bold px-2 py-0.5 rounded">#{task.queuePosition}</span>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", statusBadge(task.status))}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", priorityBadge(task.priority))}>
                      {task.priority}
                    </span>
                    {task.slaBreached && <span className="text-[10px] text-red-400 font-bold animate-pulse">SLA BREACHED</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                    <span>#{task.id}</span>
                    {task.vin && <span className="text-zinc-500 font-mono">VIN: {task.vin}</span>}
                    <span>Age: {formatMinutes(task.ageMinutes || 0)}</span>
                    {task.minutesOverdue && task.minutesOverdue > 0 && <span className="text-red-400">{formatMinutes(task.minutesOverdue)} overdue</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {task.status === "Open" && (
                    <button onClick={() => updateTask.mutate({ id: task.id, status: "In_Progress" })} className="text-[10px] bg-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded hover:bg-yellow-500/30 transition font-medium">
                      Start
                    </button>
                  )}
                  {task.status === "In_Progress" && (
                    <button onClick={() => updateTask.mutate({ id: task.id, status: "Completed" })} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded hover:bg-emerald-500/30 transition font-medium">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BankVault() {
  const { data, isLoading } = useQuery<{ vaultItems: DFTask[]; count: number }>({
    queryKey: ["dealerflow-vault"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/bank-vault`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const items = data?.vaultItems || [];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/10 rounded-xl border border-emerald-500/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bank-Ready Vault</h3>
            <p className="text-xs text-zinc-500">Completed tasks that fulfill funding requirements — ready for bank submission</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-emerald-300">{items.length}</p>
            <p className="text-[10px] text-zinc-500">Funding Ready</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No bank-ready documents yet. Complete finance/DMV tasks with funding signals to populate the vault.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="bg-zinc-900/60 rounded-xl border border-emerald-500/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", deptColor(item.department))}>
                      {item.department}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Bank Ready</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  {item.vin && <p className="text-xs text-zinc-500 font-mono mt-1">VIN: {item.vin}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                    <span>#{item.id}</span>
                    <span>Resolved: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : "—"}</span>
                  </div>
                  {item.fundingSignals?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.fundingSignals.map((s: string) => (
                        <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerformanceReport() {
  const { data, isLoading, refetch } = useQuery<PerformanceData>({
    queryKey: ["dealerflow-performance"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/performance`).then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const w = data?.weekly || { totalCreated: 0, completed: 0, escalated: 0, avgResolutionMinutes: 0, slaComplianceRate: 0, avgResolutionFormatted: "—" };
  const m = data?.monthly || { totalCreated: 0, completed: 0, avgResolutionMinutes: 0 };
  const impact = data?.impact || { hoursSaved: 0, efficiency: 0, paperworkEliminated: 0, customerResponseImprovement: "—" };
  const fees = data?.techFees || { totalFees: 0, pendingFees: 0 };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-900/20 to-zinc-900 rounded-xl border border-amber-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">DealerFlow Performance Report</h3>
              <p className="text-xs text-zinc-500">{data?.period || "Last 7 Days"} — Manager Dashboard</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="text-zinc-500 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Hours Saved</p>
          <p className="text-2xl font-bold text-emerald-300">{impact.hoursSaved}h</p>
          <p className="text-[10px] text-zinc-500 mt-1">This week</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Efficiency</p>
          <p className="text-2xl font-bold text-amber-300">{impact.efficiency}%</p>
          <p className="text-[10px] text-zinc-500 mt-1">Completion rate</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Paperwork Cut</p>
          <p className="text-2xl font-bold text-cyan-300">{impact.paperworkEliminated}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Documents auto-routed</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Avg Response</p>
          <p className="text-2xl font-bold text-indigo-300">{impact.customerResponseImprovement}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Customer tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4">Weekly Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Tasks Created</span><span className="text-white font-semibold">{w.totalCreated}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Tasks Completed</span><span className="text-emerald-300 font-semibold">{w.completed}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Escalated</span><span className="text-red-300 font-semibold">{w.escalated}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Avg Resolution</span><span className="text-amber-300 font-semibold">{w.avgResolutionFormatted}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">SLA Compliance</span><span className="text-white font-semibold">{Math.round(Number(w.slaComplianceRate))}%</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4">Revenue Impact</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">3% Tech Fees (Total)</span><span className="text-emerald-300 font-semibold">${Number(fees.totalFees).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Pending Settlement</span><span className="text-yellow-300 font-semibold">${Number(fees.pendingFees).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Monthly Tasks</span><span className="text-white font-semibold">{m.totalCreated}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Monthly Completed</span><span className="text-emerald-300 font-semibold">{m.completed}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Tickets Resolved</span><span className="text-indigo-300 font-semibold">{data?.tickets?.resolved || 0}</span></div>
          </div>
        </div>
      </div>

      {(data?.departmentPerformance?.length ?? 0) > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4">Department Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium text-center">Created</th>
                  <th className="pb-2 font-medium text-center">Completed</th>
                  <th className="pb-2 font-medium text-center">Rate</th>
                  <th className="pb-2 font-medium text-center">Avg Time</th>
                  <th className="pb-2 font-medium text-center">Escalated</th>
                </tr>
              </thead>
              <tbody>
                {data!.departmentPerformance.map((d) => (
                  <tr key={d.department} className="border-b border-zinc-800/50">
                    <td className="py-2.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", deptColor(d.department))}>
                        {deptIcon(d.department)} {d.department.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-white">{d.totalCreated}</td>
                    <td className="py-2.5 text-center text-emerald-300">{d.completed}</td>
                    <td className="py-2.5 text-center">
                      <span className={cn("font-semibold", d.completionRate >= 80 ? "text-emerald-300" : d.completionRate >= 50 ? "text-yellow-300" : "text-red-300")}>
                        {d.completionRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-zinc-300">{d.avgResolutionFormatted}</td>
                    <td className="py-2.5 text-center text-red-300">{d.escalated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 p-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs text-zinc-500">
          Performance Report — 3C ONYX DealerFlow OS — Architected by Ronald Antonio Cadet
        </span>
      </div>
    </div>
  );
}

function TicketInbox() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ["dealerflow-tickets"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/tickets`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dealerflow-tickets"] }),
  });

  const tickets = data?.tickets || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" /> Customer Ticket Inbox
        </h3>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-indigo-500/30 transition">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {showCreate && <CreateTicketForm onClose={() => setShowCreate(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tickets yet. When customers reach out, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((tk) => (
            <div key={tk.id} className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", statusBadge(tk.status))}>
                      {tk.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] bg-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded">{tk.channel}</span>
                    <span className="text-[10px] bg-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded">{tk.category.replace("_", " ")}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{tk.subject}</h4>
                  {tk.customerName && <p className="text-xs text-zinc-500 mt-0.5">{tk.customerName} {tk.customerPhone ? `• ${tk.customerPhone}` : ""}</p>}
                  {tk.lastMessage && <p className="text-xs text-zinc-400 mt-1 line-clamp-2 italic">"{tk.lastMessage}"</p>}
                  {tk.autoResponse && (
                    <div className="mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-emerald-500 uppercase font-medium mb-0.5">Auto-Response Sent</p>
                      <p className="text-xs text-emerald-300">{tk.autoResponse}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-2">#{tk.id} • {timeAgo(tk.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {tk.status === "New" && (
                    <button onClick={() => updateTicket.mutate({ id: tk.id, status: "Open" })} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30 transition">
                      Acknowledge
                    </button>
                  )}
                  {(tk.status === "Open" || tk.status === "In_Progress") && (
                    <button onClick={() => updateTicket.mutate({ id: tk.id, status: "Resolved" })} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/30 transition">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTicketForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("App");
  const qc = useQueryClient();

  const CHANNELS = ["SMS", "Email", "Phone", "Walk_In", "App", "WhatsApp"];

  const create = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tickets"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      onClose();
    },
  });

  return (
    <div className="bg-zinc-900 rounded-xl border border-indigo-500/30 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> New Customer Ticket
      </h3>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g., Where is my registration?)" className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Customer's message..." rows={3} className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none resize-none" />
      <div className="grid grid-cols-3 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none" />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 border border-zinc-700">
          {CHANNELS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition">Cancel</button>
        <button onClick={() => create.mutate({ subject, description: desc || undefined, customerName: name || undefined, customerPhone: phone || undefined, channel })} disabled={!subject || create.isPending} className="text-sm bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-400 transition disabled:opacity-50">
          {create.isPending ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </div>
  );
}

function GMVelocityDashboard() {
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["dealerflow-velocity"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/velocity`).then((r) => r.json()),
    refetchInterval: 60000,
  });

  const { data: referrals } = useQuery<any>({
    queryKey: ["dealerflow-referrals"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/referrals`).then((r) => r.json()),
    refetchInterval: 120000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const v = data?.dealershipVelocity || {};
  const bottlenecks = data?.bottlenecks || [];
  const daily = data?.dailyThroughput || [];
  const fees = referrals?.techFees || {};
  const crossDept = referrals?.crossDepartmentReferrals || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-zinc-900 rounded-xl border border-orange-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Dealership Velocity — GM View</h3>
              <p className="text-xs text-zinc-500">{data?.period || "Last 7 Days"} — Zero-Memory Dependency Dashboard</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="text-zinc-500 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Avg Time to Resolution</p>
          <p className="text-2xl font-bold text-amber-300">{v.avgTimeToResolution || "—"}</p>
          <p className="text-[10px] text-zinc-500 mt-1">All completed tasks</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Fastest Resolution</p>
          <p className="text-2xl font-bold text-emerald-300">{v.fastestResolution || "—"}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Best turnaround</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">SLA Compliance</p>
          <p className="text-2xl font-bold text-white">{v.slaComplianceRate || 0}%</p>
          <p className="text-[10px] text-zinc-500 mt-1">On-time completions</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Open Backlog</p>
          <p className={cn("text-2xl font-bold", (v.openBacklog || 0) > 10 ? "text-red-300" : "text-cyan-300")}>{v.openBacklog || 0}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Pending tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Total Tasks</p>
          <p className="text-xl font-bold text-white">{v.totalTasks || 0}</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Completed</p>
          <p className="text-xl font-bold text-emerald-300">{v.totalCompleted || 0}</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Escalation Rate</p>
          <p className={cn("text-xl font-bold", (v.escalationRate || 0) > 15 ? "text-red-300" : "text-yellow-300")}>{v.escalationRate || 0}%</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <p className="text-[10px] text-zinc-500 uppercase mb-1">Slowest Resolution</p>
          <p className="text-xl font-bold text-orange-300">{v.slowestResolution || "—"}</p>
        </div>
      </div>

      {bottlenecks.length > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" /> Bottleneck Detection
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium text-center">Open</th>
                  <th className="pb-2 font-medium text-center">Escalated</th>
                  <th className="pb-2 font-medium text-center">SLA Breaches</th>
                  <th className="pb-2 font-medium text-center">Avg Time</th>
                  <th className="pb-2 font-medium text-center">Severity</th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map((b: any) => (
                  <tr key={b.department} className="border-b border-zinc-800/50">
                    <td className="py-2.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", deptColor(b.department))}>
                        {deptIcon(b.department)} {b.department.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-white">{b.openTasks}</td>
                    <td className="py-2.5 text-center text-red-300">{b.escalatedTasks}</td>
                    <td className="py-2.5 text-center text-orange-300">{b.slaBreaches}</td>
                    <td className="py-2.5 text-center text-zinc-300">{b.avgResolutionFormatted}</td>
                    <td className="py-2.5 text-center">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded",
                        b.severity === "Critical" ? "bg-red-500/20 text-red-300" :
                        b.severity === "High" ? "bg-orange-500/20 text-orange-300" :
                        "bg-zinc-700/50 text-zinc-400"
                      )}>{b.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {daily.length > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Daily Throughput
          </h4>
          <div className="space-y-2">
            {daily.map((d: any) => {
              const maxVal = Math.max(...daily.map((x: any) => Number(x.created) || 1));
              const pct = Math.max((Number(d.created) / maxVal) * 100, 5);
              const completePct = Number(d.created) > 0 ? Math.round((Number(d.completed) / Number(d.created)) * 100) : 0;
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 w-20 shrink-0">{new Date(d.day).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/60 to-amber-400/30 h-full rounded-full flex items-center px-2" style={{ width: `${pct}%` }}>
                      <span className="text-[9px] text-white font-bold whitespace-nowrap">{d.created} / {d.completed}</span>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-semibold w-10 text-right", completePct >= 80 ? "text-emerald-300" : completePct >= 50 ? "text-yellow-300" : "text-red-300")}>
                    {completePct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 rounded-xl border border-amber-500/20 p-5">
          <h4 className="text-sm font-semibold text-amber-300 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Bird-Dog Monetization Ledger
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-zinc-500">3% Tech Fees (This Week)</span><span className="text-emerald-300 font-semibold">${Number(fees.weeklyTotal || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Fee Entries</span><span className="text-white font-semibold">{fees.weeklyEntries || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Global Rate</span><span className="text-amber-300 font-semibold">{fees.globalRate || "3%"}</span></div>
          </div>
        </div>

        {crossDept.length > 0 && (
          <div className="bg-zinc-900/60 rounded-xl border border-purple-500/20 p-5">
            <h4 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <Route className="w-4 h-4" /> Cross-Department Referrals
            </h4>
            <div className="space-y-2">
              {crossDept.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">{r.fromDepartment}</span>
                    <span className="text-zinc-600">&rarr;</span>
                    <span className="text-white">{r.toDepartment}</span>
                  </div>
                  <span className="text-amber-300 font-semibold">{r.taskCount} referrals</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-zinc-700 pt-4 border-t border-zinc-900">
        3C ONYX &mdash; DealerFlow OS GM View &mdash; Architect: Ronald Antonio Cadet &mdash; CUXTOMCANDYCLUB LLC
      </div>
    </div>
  );
}
