import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowRight, BarChart3, Camera, Check, CheckCircle2, Clock, DollarSign,
  Gauge, Inbox, Layers, Lock, Plus, RefreshCw,
  ScanLine, Send, Shield, ShieldAlert, ThumbsUp, Users, X, Zap,
  Search, Car, Store, Home, MoreHorizontal, UserPlus
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
  taskScope: string;
  vin: string | null;
  routedByAgent: string | null;
  routingConfidence: string | null;
  slaMinutes: number;
  slaDueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  metadata: any;
  dependsOnTaskId?: number | null;
  predecessorTitle?: string | null;
  predecessorStatus?: string | null;
  blockerName?: string | null;
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
    pendingExternal: number;
    externalTotal: number;
    internalTotal: number;
    externalActive: number;
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getUserFirstName(): string {
  try {
    const token = localStorage.getItem("onyxToken");
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.name || payload.email || "";
    return name.split(" ")[0] || name;
  } catch { return ""; }
}

const DEPARTMENTS = ["DMV", "Parts", "Service", "Finance", "Logistics", "Sales", "Customer_Service", "General"];
const STATUSES = ["Open", "In_Progress", "Waiting", "Pending_Approval", "Pending_External", "Completed", "Escalated", "Cancelled", "Blocked"];
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

function statusIndicator(status: string): { dot: string; label: string } {
  if (status === "Completed" || status === "Resolved" || status === "Delivered" || status === "Funded") return { dot: "bg-emerald-400", label: "Done" };
  if (status === "In_Progress") return { dot: "bg-emerald-400 animate-pulse", label: "On Track" };
  if (status === "Open") return { dot: "bg-blue-400", label: "Ready" };
  if (status === "Waiting" || status === "Pending_Approval" || status === "Pending_External" || status === "Pending_Finance" || status === "Pending_Insurance" || status === "Pending_DMV" || status === "Pending_Recon") return { dot: "bg-yellow-400 animate-pulse", label: "Waiting" };
  if (status === "Escalated" || status === "Blocked") return { dot: "bg-red-400 animate-pulse", label: "Blocked" };
  if (status === "Cancelled") return { dot: "bg-zinc-500", label: "Cancelled" };
  return { dot: "bg-zinc-400", label: status.replace(/_/g, " ") };
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Open: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    In_Progress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Waiting: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Pending_Approval: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    Pending_External: "bg-amber-600/20 text-amber-300 border-amber-600/30",
    Completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Escalated: "bg-red-500/20 text-red-300 border-red-500/30",
    Blocked: "bg-red-600/20 text-red-300 border-red-600/30",
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
  if (!slaDueAt || status === "Completed" || status === "Cancelled" || status === "Pending_Approval" || status === "Pending_External" || status === "Blocked") return null;
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

function dealStatusColor(s: string) {
  const map: Record<string, string> = {
    Open: "bg-blue-500/20 text-blue-300",
    In_Progress: "bg-yellow-500/20 text-yellow-300",
    Pending_Finance: "bg-violet-500/20 text-violet-300",
    Pending_Insurance: "bg-amber-500/20 text-amber-300",
    Pending_DMV: "bg-purple-500/20 text-purple-300",
    Pending_Recon: "bg-cyan-500/20 text-cyan-300",
    Funded: "bg-emerald-500/20 text-emerald-300",
    Delivered: "bg-green-500/20 text-green-300",
    Unwound: "bg-red-500/20 text-red-300",
    Cancelled: "bg-zinc-500/20 text-zinc-400",
  };
  return map[s] || "bg-zinc-600/20 text-zinc-300";
}

function commissionColor(s: string) {
  if (s === "Paid") return "text-emerald-400";
  if (s === "Approved") return "text-blue-400";
  if (s === "Held" || s === "On_Hold") return "text-orange-400";
  return "text-yellow-400";
}

function formatUsd(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === "") return "$0";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "$0";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function friendlyStatus(status: string): string {
  const map: Record<string, string> = {
    Open: "Getting started",
    In_Progress: "Working on it",
    Pending_Finance: "Getting your financing ready",
    Pending_Insurance: "Getting your insurance ready",
    Pending_DMV: "Processing your registration",
    Pending_Recon: "Preparing your vehicle",
    Funded: "Financing approved!",
    Delivered: "Your car is ready!",
    Pending_Approval: "Awaiting manager review",
    Pending_External: "Waiting on external party",
    Completed: "All done!",
    Escalated: "Getting expert help",
    Waiting: "Waiting for next step",
    Blocked: "Needs attention",
  };
  return map[status] || status.replace(/_/g, " ");
}

type View = "feed" | "deals" | "scan" | "more";

export default function DealerFlowOS() {
  const [view, setView] = useState<View>("feed");
  const [fabOpen, setFabOpen] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [expandedDealId, setExpandedDealId] = useState<number | null>(null);
  const [moreSection, setMoreSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 relative">
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
              {getGreeting()}{getUserFirstName() ? `, ${getUserFirstName()}` : ""}
            </h1>
            <PulseSubtext />
          </div>
          <QuickStats />
        </div>
      </header>

      <main className="px-4 pt-4">
        {view === "feed" && (
          <ActivityFeed
            onOpenDeal={(id) => { setExpandedDealId(id); setView("deals"); }}
          />
        )}
        {view === "deals" && (
          <DealsView
            expandedDealId={expandedDealId}
            setExpandedDealId={setExpandedDealId}
            showCreateDeal={showCreateDeal}
            setShowCreateDeal={setShowCreateDeal}
          />
        )}
        {view === "scan" && <ScanView />}
        {view === "more" && <MoreView section={moreSection} setSection={setMoreSection} />}
      </main>

      {showCreateTask && (
        <BottomSheet onClose={() => setShowCreateTask(false)} title="New Task">
          <CreateTaskForm onClose={() => setShowCreateTask(false)} />
        </BottomSheet>
      )}

      {fabOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setFabOpen(false)} />
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10">
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Quick Actions</p>
              </div>
              <button
                onClick={() => { setFabOpen(false); setView("scan"); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition active:bg-zinc-800"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Scan Document</p>
                  <p className="text-xs text-zinc-500">Photo or paste — AI routes automatically</p>
                </div>
              </button>
              <button
                onClick={() => { setFabOpen(false); setShowCreateDeal(true); setView("deals"); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition active:bg-zinc-800"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Start Deal</p>
                  <p className="text-xs text-zinc-500">Launch the 7-Agent Lifecycle Engine</p>
                </div>
              </button>
              <button
                onClick={() => { setFabOpen(false); setShowCreateTask(true); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition active:bg-zinc-800 border-t border-zinc-800/50"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Add Task</p>
                  <p className="text-xs text-zinc-500">Create and auto-route a new task</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800/50">
        <div className="flex items-center justify-around relative max-w-lg mx-auto">
          <NavTab icon={<Home className="w-5 h-5" />} label="Feed" active={view === "feed"} onClick={() => setView("feed")} />
          <NavTab icon={<Car className="w-5 h-5" />} label="Deals" active={view === "deals"} onClick={() => setView("deals")} />

          <button
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              "absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
              fabOpen
                ? "bg-zinc-700 rotate-45 shadow-zinc-500/20"
                : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95"
            )}
          >
            <Plus className="w-7 h-7 text-white" />
          </button>
          <div className="w-14" />

          <NavTab icon={<ScanLine className="w-5 h-5" />} label="Scan" active={view === "scan"} onClick={() => setView("scan")} />
          <NavTab icon={<MoreHorizontal className="w-5 h-5" />} label="More" active={view === "more"} onClick={() => setView("more")} />
        </div>
      </div>
    </div>
  );
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-0.5 py-2.5 px-4 transition-all", active ? "text-amber-400" : "text-zinc-500 active:text-zinc-300")}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function PulseSubtext() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dealerflow-dashboard"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/dashboard`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const { data: dealsData } = useQuery<{ deals: any[] }>({
    queryKey: ["deals"],
    queryFn: () => authFetch(`${BASE}/api/deals`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const s = stats?.tasks;
  const activeDeals = (dealsData?.deals || []).filter((d: any) => d.status !== "Delivered" && d.status !== "Cancelled" && d.status !== "Unwound");
  const urgentCount = s ? (s.overdueSla || 0) + (s.escalated || 0) : 0;

  const parts: string[] = [];
  if (activeDeals.length > 0) parts.push(`${activeDeals.length} deal${activeDeals.length !== 1 ? "s" : ""} in progress`);
  if (urgentCount > 0) parts.push(`${urgentCount} need${urgentCount !== 1 ? "" : "s"} attention`);
  if (parts.length === 0 && s) parts.push("All clear — nothing needs attention");

  return (
    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
      {urgentCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
      {urgentCount === 0 && parts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
      {parts.join(" · ")}
    </p>
  );
}

function QuickStats() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dealerflow-dashboard"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/dashboard`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const s = stats?.tasks;
  if (!s) return null;

  const urgentCount = (s.overdueSla || 0) + (s.critical || 0) + (s.escalated || 0);

  return (
    <div className="flex items-center gap-2">
      {urgentCount > 0 && (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-red-300">{urgentCount}</span>
        </div>
      )}
      {(s.pendingApprovals || 0) > 0 && (
        <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1">
          <ThumbsUp className="w-3 h-3 text-violet-400" />
          <span className="text-[11px] font-semibold text-violet-300">{s.pendingApprovals}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
        <span className="text-[11px] font-semibold text-emerald-300">{s.completedToday || 0}</span>
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
    </div>
  );
}

function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        <div className="px-5 pb-8">
          {children}
        </div>
      </div>
    </>
  );
}


function ActivityFeed({ onOpenDeal }: { onOpenDeal: (id: number) => void }) {
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dealerflow-dashboard"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/dashboard`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery<{ tasks: DFTask[] }>({
    queryKey: ["dealerflow-tasks-feed"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/tasks?limit=20`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const { data: dealsData } = useQuery<{ deals: any[] }>({
    queryKey: ["deals"],
    queryFn: () => authFetch(`${BASE}/api/deals`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const { data: approvalsData } = useQuery<{ approvals: DFTask[]; count: number }>({
    queryKey: ["dealerflow-approvals"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/approvals`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const escalate = useMutation({
    mutationFn: () =>
      authFetch(`${BASE}/api/dealerflow/escalate`, { method: "POST", headers: { "Content-Type": "application/json" } }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...body }: { id: number; status?: string; priority?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-approvals"] });
    },
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-approvals"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  if (statsLoading || tasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm text-zinc-500">Loading your workspace...</p>
      </div>
    );
  }

  const s = stats?.tasks || { total: 0, open: 0, inProgress: 0, completed: 0, escalated: 0, waiting: 0, completedToday: 0, completedThisWeek: 0, overdueSla: 0, critical: 0, avgResolutionMinutes: 0, pendingApprovals: 0, pendingExternal: 0, externalTotal: 0, internalTotal: 0, externalActive: 0 };
  const tasks = tasksData?.tasks || [];
  const approvals = approvalsData?.approvals || [];
  const deals = dealsData?.deals || [];

  const activeTasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const activeDeals = deals.filter((d: any) => d.status !== "Delivered" && d.status !== "Cancelled" && d.status !== "Unwound");

  const feedItems: Array<{ type: string; priority: number; data: any }> = [];

  if (s.overdueSla > 0) {
    feedItems.push({ type: "alert-overdue", priority: 0, data: { count: s.overdueSla } });
  }

  approvals.forEach((a) => feedItems.push({ type: "approval", priority: 1, data: a }));

  activeTasks.filter((t) => t.status === "Escalated").forEach((t) => feedItems.push({ type: "escalated", priority: 2, data: t }));

  activeTasks.filter((t) => t.priority === "Critical" && t.status !== "Escalated").slice(0, 3).forEach((t) => feedItems.push({ type: "critical", priority: 3, data: t }));

  activeDeals.slice(0, 3).forEach((d: any) => feedItems.push({ type: "deal", priority: 4, data: d }));

  activeTasks.filter((t) => t.status === "In_Progress").slice(0, 5).forEach((t) => feedItems.push({ type: "in-progress", priority: 5, data: t }));

  activeTasks.filter((t) => t.status === "Open").slice(0, 5).forEach((t) => feedItems.push({ type: "ready", priority: 6, data: t }));

  feedItems.sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-4 pb-4">
      {feedItems.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-20 h-20 mx-auto mb-5 text-emerald-500/20" />
          <p className="text-xl font-bold text-white">All clear</p>
          <p className="text-sm text-zinc-500 mt-2">Nothing needs your attention right now</p>
        </div>
      ) : (
        feedItems.map((item, i) => {
          if (item.type === "alert-overdue") {
            return (
              <div key={`alert-${i}`} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-red-300">{item.data.count} task{item.data.count !== 1 ? "s" : ""} overdue</p>
                    <p className="text-xs text-zinc-500">Needs immediate attention</p>
                  </div>
                </div>
                <button
                  onClick={() => escalate.mutate()}
                  disabled={escalate.isPending}
                  className="w-full py-4 bg-red-500/20 text-red-200 border border-red-500/30 rounded-2xl text-base font-bold active:bg-red-500/30 transition"
                >
                  Escalate All
                </button>
              </div>
            );
          }

          if (item.type === "approval") {
            const task = item.data as DFTask;
            return (
              <div key={`appr-${task.id}`} className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-violet-400 uppercase font-bold tracking-wider">Needs Your Approval</p>
                    <h4 className="text-base font-bold text-white mt-1 leading-snug">{task.title}</h4>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded border mt-1.5 inline-block", deptColor(task.department))}>{deptIcon(task.department)} {task.department.replace("_", " ")}</span>
                  </div>
                </div>
                <button
                  onClick={() => decide.mutate({ id: task.id, decision: "Approved" })}
                  disabled={decide.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 py-4 rounded-2xl text-base font-bold active:bg-emerald-500/30 transition mb-2"
                >
                  <Check className="w-5 h-5" /> Approve
                </button>
                <button
                  onClick={() => decide.mutate({ id: task.id, decision: "Rejected" })}
                  disabled={decide.isPending}
                  className="w-full text-center text-sm text-zinc-500 py-2 active:text-red-300 transition"
                >
                  Reject
                </button>
              </div>
            );
          }

          if (item.type === "deal") {
            const deal = item.data as any;
            const si = statusIndicator(deal.status);
            const progressPct = deal.status === "Delivered" ? 100 : deal.status === "Funded" ? 85 : deal.status === "In_Progress" ? 50 : 20;
            return (
              <button key={`deal-${deal.id}`} onClick={() => onOpenDeal(deal.id)} className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-left active:bg-zinc-800/60 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-3.5 h-3.5 rounded-full shrink-0", si.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{deal.vehicleLabel || "Vehicle"} — {deal.customerName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{friendlyStatus(deal.status)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-zinc-400">{progressPct}%</span>
                </div>
              </button>
            );
          }

          const task = item.data as DFTask;
          const si = statusIndicator(task.status);
          const sla = slaStatus(task.slaDueAt, task.status);

          const nextAction = task.status === "Open" ? () => updateTask.mutate({ id: task.id, status: "In_Progress" })
            : task.status === "In_Progress" ? () => updateTask.mutate({ id: task.id, status: "Completed" })
            : null;

          return (
            <div key={`task-${task.id}-${item.type}`} className={cn(
              "bg-zinc-900/60 border rounded-2xl p-5 transition",
              item.type === "escalated" ? "border-red-500/20" : item.type === "critical" ? "border-orange-500/20" : "border-zinc-800"
            )}>
              <div className="flex items-center gap-3 mb-1">
                <div className={cn("w-3.5 h-3.5 rounded-full shrink-0", si.dot)} />
                <p className="text-base font-bold text-white leading-snug flex-1">{task.title}</p>
              </div>
              <div className="flex items-center gap-2 ml-[26px] flex-wrap">
                <span className={cn("text-[10px] px-2 py-0.5 rounded border", deptColor(task.department))}>{deptIcon(task.department)} {task.department.replace("_", " ")}</span>
                <span className="text-[10px] text-zinc-500">{si.label}</span>
                {sla && <span className={cn("text-[10px] font-medium", sla.color)}>{sla.label}</span>}
                {task.slaBreached && <span className="text-[10px] text-red-400 font-bold">OVERDUE</span>}
              </div>
              {nextAction && (
                <button
                  onClick={nextAction}
                  disabled={updateTask.isPending}
                  className="w-full mt-4 py-4 rounded-2xl text-base font-bold transition active:scale-[0.98] bg-gradient-to-r from-amber-500 to-orange-600 text-black"
                >
                  Continue
                </button>
              )}
            </div>
          );
        })
      )}

      <div className="pt-2">
        <div className="flex items-center gap-2 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-500">
            DealerFlow OS · Architected by Ronald Antonio Cadet
          </span>
        </div>
      </div>
    </div>
  );
}


function DealsView({ expandedDealId, setExpandedDealId, showCreateDeal, setShowCreateDeal }: {
  expandedDealId: number | null; setExpandedDealId: (id: number | null) => void;
  showCreateDeal: boolean; setShowCreateDeal: (v: boolean) => void;
}) {
  const qc = useQueryClient();

  const { data: myDealsData, isLoading: myLoading } = useQuery<{ salesperson: any; recentDeals: any[]; blockedDeals: any[] }>({
    queryKey: ["my-deals"],
    queryFn: () => authFetch(`${BASE}/api/deals/dashboard/my-deals`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery<{ deals: any[] }>({
    queryKey: ["deals"],
    queryFn: () => authFetch(`${BASE}/api/deals`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: any }) =>
      authFetch(`${BASE}/api/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["my-deals"] });
    },
  });

  if (myLoading || dealsLoading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const sp = myDealsData?.salesperson || {};
  const deals = dealsData?.deals || [];
  const blockedDeals = myDealsData?.blockedDeals || [];

  if (expandedDealId) {
    const deal = deals.find((d: any) => d.id === expandedDealId);
    return (
      <div className="space-y-4 pb-4">
        <button onClick={() => setExpandedDealId(null)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition py-1">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Deals
        </button>
        {deal && <DealDetailCard deal={deal} updateDeal={updateDeal} />}
        <DealDetail dealId={expandedDealId} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl border border-amber-500/20 p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{formatUsd(sp.totalCommission)}</p>
          <p className="text-[10px] text-zinc-500 uppercase mt-1">Total Earned</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{sp.deliveredDeals || 0}</p>
          <p className="text-[10px] text-zinc-500 uppercase mt-1">Delivered</p>
        </div>
      </div>

      {blockedDeals.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold text-red-300">{blockedDeals.length} deal{blockedDeals.length !== 1 ? "s" : ""} blocked</p>
          </div>
          {blockedDeals.map((bd: any) => (
            <button key={bd.dealId} onClick={() => setExpandedDealId(bd.dealId)} className="w-full flex items-center justify-between bg-red-500/5 rounded-xl p-3 mb-1.5 text-left active:bg-red-500/10 transition">
              <div>
                <p className="text-sm text-white font-medium">{bd.customerName}</p>
                <p className="text-[10px] text-zinc-500">{bd.vehicleLabel}</p>
              </div>
              <div className="text-right">
                {bd.commissionAmount && <p className="text-xs text-emerald-400 font-semibold">{formatUsd(bd.commissionAmount)}</p>}
                <p className="text-[10px] text-red-300">{bd.missingSteps?.length || 0} step{bd.missingSteps?.length !== 1 ? "s" : ""} remaining</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">All Deals</h3>
        <button onClick={() => setShowCreateDeal(true)} className="flex items-center gap-1.5 text-xs text-amber-400 font-medium active:text-amber-300">
          <Plus className="w-3.5 h-3.5" /> New Deal
        </button>
      </div>

      {showCreateDeal && <CreateDealForm onClose={() => setShowCreateDeal(false)} />}

      {deals.length === 0 ? (
        <div className="text-center py-16">
          <Car className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm text-zinc-500">No deals yet. Start one to launch the lifecycle engine.</p>
        </div>
      ) : (
        deals.map((deal: any) => {
          const si = statusIndicator(deal.status);
          const nextAction = deal.status === "Open" ? { label: "Start", fn: () => updateDeal.mutate({ id: deal.id, status: "In_Progress" }) }
            : deal.status === "Funded" ? { label: "Deliver", fn: () => updateDeal.mutate({ id: deal.id, status: "Delivered" }) }
            : null;

          return (
            <button
              key={deal.id}
              onClick={() => setExpandedDealId(deal.id)}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left active:bg-zinc-800/60 transition mb-2"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full shrink-0", si.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{deal.customerName}</p>
                    <span className="text-[10px] text-amber-400 font-mono">{deal.dealNumber}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{deal.vehicleLabel || "No vehicle"}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-zinc-400">{friendlyStatus(deal.status)}</span>
                    {deal.salePrice && <span className="text-[10px] text-emerald-400 font-semibold">{formatUsd(deal.salePrice)}</span>}
                    {deal.commissionAmount && (
                      <span className={cn("text-[10px] font-semibold", commissionColor(deal.commissionStatus))}>
                        {formatUsd(deal.commissionAmount)}
                      </span>
                    )}
                  </div>
                </div>
                {nextAction ? (
                  <div onClick={(e) => { e.stopPropagation(); nextAction.fn(); }} className={cn(
                    "shrink-0 px-3 py-2 rounded-xl text-xs font-semibold",
                    deal.status === "Funded" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  )}>
                    {nextAction.label}
                  </div>
                ) : (
                  <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </div>
            </button>
          );
        })
      )}

      <div className="text-center text-[10px] text-zinc-700 pt-4">
        3C ONYX &mdash; Ronald Antonio Cadet &mdash; CUXTOMCANDYCLUB LLC
      </div>
    </div>
  );
}

function DealDetailCard({ deal, updateDeal }: { deal: any; updateDeal: any }) {
  const primaryAction = deal.status === "Open" ? { label: "Start This Deal", fn: () => updateDeal.mutate({ id: deal.id, status: "In_Progress" }), style: "bg-gradient-to-r from-amber-500 to-orange-600 text-black" }
    : deal.status === "Funded" ? { label: "Mark as Delivered", fn: () => updateDeal.mutate({ id: deal.id, status: "Delivered" }), style: "bg-gradient-to-r from-emerald-500 to-green-600 text-white" }
    : deal.commissionStatus === "Pending" ? { label: "Approve Commission", fn: () => updateDeal.mutate({ id: deal.id, commissionStatus: "Approved" }), style: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" }
    : deal.commissionStatus === "Approved" ? { label: "Mark Commission Paid", fn: () => updateDeal.mutate({ id: deal.id, commissionStatus: "Paid" }), style: "bg-gradient-to-r from-emerald-500 to-green-600 text-white" }
    : null;

  const dealStages = [
    { key: "Open", label: "Deal Created" },
    { key: "In_Progress", label: "In Progress" },
    { key: "Pending_Finance", label: "Financing" },
    { key: "Pending_Insurance", label: "Insurance" },
    { key: "Pending_DMV", label: "Registration" },
    { key: "Pending_Recon", label: "Vehicle Prep" },
    { key: "Funded", label: "Funded" },
    { key: "Delivered", label: "Delivered" },
  ];

  const currentIdx = dealStages.findIndex((st) => st.key === deal.status);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <div>
        <p className="text-xl font-extrabold text-white">{deal.vehicleLabel || "Vehicle"}</p>
        <p className="text-sm text-zinc-400 mt-0.5">{deal.customerName} {deal.vin && <span className="font-mono text-zinc-600">· {deal.vin}</span>}</p>
      </div>

      <div className="space-y-0">
        {dealStages.map((stage, idx) => {
          const isDone = idx < currentIdx || deal.status === "Delivered";
          const isCurrent = idx === currentIdx && deal.status !== "Delivered";
          return (
            <div key={stage.key} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isDone ? "bg-emerald-500/20 text-emerald-400" :
                  isCurrent ? "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40" :
                  "bg-zinc-800 text-zinc-600"
                )}>
                  {isDone ? "✓" : isCurrent ? "●" : "○"}
                </div>
                {idx < dealStages.length - 1 && (
                  <div className={cn("w-0.5 h-6", isDone ? "bg-emerald-500/40" : "bg-zinc-800")} />
                )}
              </div>
              <p className={cn(
                "text-sm font-semibold pt-1.5",
                isDone ? "text-emerald-400" : isCurrent ? "text-amber-300" : "text-zinc-600"
              )}>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      {primaryAction && (
        <button
          onClick={primaryAction.fn}
          disabled={updateDeal.isPending}
          className={cn("w-full py-5 rounded-2xl text-lg font-extrabold transition active:scale-[0.98] disabled:opacity-50", primaryAction.style)}
        >
          {updateDeal.isPending ? "Processing..." : primaryAction.label}
        </button>
      )}
    </div>
  );
}


function ScanView() {
  const [mode, setMode] = useState<"scan" | "submit" | "track">("scan");
  const [rawText, setRawText] = useState("");
  const [docType, setDocType] = useState("Other");
  const [result, setResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const [trackingCode, setTrackingCode] = useState("");
  const [form, setForm] = useState({ title: "", description: "", intakeType: "Walk_In", department: "Sales", urgency: "Medium", photos: [] as string[], contactName: "", contactPhone: "", contactEmail: "" });
  const [submitted, setSubmitted] = useState<{ trackingCode: string; id: number } | null>(null);

  const DOC_TYPES = ["Invoice", "DMV_Form", "Title", "Registration", "Mopar_Sheet", "Parts_Order", "Warranty_Claim", "Insurance_Doc", "Bill_of_Sale", "Other"];

  const scan = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/intake`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      setResult(data);
      setRawText("");
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const visionScan = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/intake/vision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (data) => {
      setResult(data);
      setImagePreview(null);
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const submitMut = useMutation({
    mutationFn: (data: typeof form) =>
      authFetch(`${BASE}/api/omni-node/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (data: any) => {
      if (data.trackingCode) {
        setSubmitted({ trackingCode: data.trackingCode, id: data.task?.id || 0 });
        setForm({ title: "", description: "", intakeType: "Walk_In", department: "Sales", urgency: "Medium", photos: [], contactName: "", contactPhone: "", contactEmail: "" });
      }
    },
  });

  const trackQuery = useQuery({
    queryKey: ["omni-track", trackingCode],
    queryFn: () => fetch(`${BASE}/api/omni-node/track/${trackingCode}`).then((r) => r.json()),
    enabled: mode === "track" && trackingCode.length > 5,
    refetchInterval: 10000,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const intakeTypes = ["Walk_In", "Phone_Call", "Email", "Text_Message", "Service_Drive", "Omni_Node"];
  const departments = ["Sales", "Finance", "Service", "Parts", "BDC", "Detailing", "Reconditioning", "Title_Clerk", "Management"];
  const urgencies = ["Low", "Medium", "High", "Critical"];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        {[
          { id: "scan" as const, label: "Scan", icon: <Camera className="w-3.5 h-3.5" /> },
          { id: "submit" as const, label: "Submit Issue", icon: <Send className="w-3.5 h-3.5" /> },
          { id: "track" as const, label: "Track", icon: <Search className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setMode(tab.id)} className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all",
            mode === tab.id ? "bg-amber-500/20 text-amber-300" : "text-zinc-500 active:text-white"
          )}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {mode === "scan" && (
        <div className="space-y-4">
          {result ? (
            <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Document Routed</p>
                  <p className="text-xs text-zinc-500">AI extracted and classified automatically</p>
                </div>
              </div>

              <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2">
                {result.scan?.extractedVin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">VIN</span>
                    <span className="text-sm font-mono text-white">{result.scan.extractedVin}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Department</span>
                  <span className={cn("text-sm font-semibold px-2 py-0.5 rounded", deptColor(result.routing?.department))}>{result.routing?.department || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Priority</span>
                  <span className="text-sm text-white">{result.routing?.suggestedPriority || "Medium"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">AI Confidence</span>
                  <span className="text-sm text-emerald-400 font-semibold">{Math.round((result.routing?.confidence || 0) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Task Created</span>
                  <span className="text-sm text-amber-300 font-mono">#{result.task?.id || "—"}</span>
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-2xl text-sm active:scale-[0.98] transition"
              >
                Confirm & Done
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-dashed border-purple-500/30 rounded-2xl p-8 flex flex-col items-center gap-3 active:bg-purple-500/10 transition"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white">Snap or Upload Document</p>
                  <p className="text-xs text-zinc-500 mt-1">Invoice, DMV form, title, insurance — AI reads it</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />

              {imagePreview && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-purple-500/30">
                    <img src={imagePreview} alt="Document preview" className="w-full h-auto max-h-52 object-contain bg-zinc-800" />
                    <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full bg-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-3 border border-zinc-700">
                    {DOC_TYPES.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
                  </select>
                  <button
                    onClick={() => visionScan.mutate({ imageBase64: imagePreview, documentType: docType })}
                    disabled={visionScan.isPending}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {visionScan.isPending ? "AI Vision Processing..." : "Scan & Auto-Route"}
                  </button>
                </div>
              )}

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-zinc-400">Or paste text</p>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste invoice, DMV form, SMS, or email..."
                  rows={3}
                  className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 focus:border-cyan-500/50 outline-none resize-none"
                />
                <button
                  onClick={() => scan.mutate({ rawText, documentType: docType })}
                  disabled={!rawText.trim() || scan.isPending}
                  className="w-full py-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-sm font-semibold active:bg-cyan-500/30 transition disabled:opacity-40"
                >
                  {scan.isPending ? "Processing..." : "Scan & Route"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {mode === "submit" && (
        <div className="space-y-4">
          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-base font-bold text-white">Submitted Successfully</p>
              <div className="bg-zinc-900 rounded-xl px-4 py-3">
                <p className="text-[10px] text-zinc-500 uppercase mb-1">Your Tracking Code</p>
                <code className="text-lg text-amber-300 font-mono font-bold">{submitted.trackingCode}</code>
              </div>
              <p className="text-xs text-zinc-500">Save this code to check your status anytime</p>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(submitted.trackingCode)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl text-sm font-medium active:bg-zinc-700 transition">Copy Code</button>
                <button onClick={() => { setTrackingCode(submitted.trackingCode); setMode("track"); setSubmitted(null); }} className="flex-1 py-3 bg-amber-500/20 text-amber-300 rounded-xl text-sm font-medium active:bg-amber-500/30 transition">Track It</button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs attention?" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add details (helps with routing accuracy)" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white">
                  {departments.map((d) => <option key={d} value={d}>{d.replace(/_/g, " ")}</option>)}
                </select>
                <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white">
                  {urgencies.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="Contact email (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none" />
              <button
                onClick={() => { if (form.title.trim()) submitMut.mutate(form); }}
                disabled={!form.title.trim() || submitMut.isPending}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-2xl text-sm active:scale-[0.98] transition disabled:opacity-40"
              >
                {submitMut.isPending ? "Submitting..." : "Submit Request"}
              </button>
              {submitMut.isError && <p className="text-red-400 text-xs text-center">Submission failed — please try again</p>}
            </div>
          )}
        </div>
      )}

      {mode === "track" && (
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex gap-2">
              <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Enter tracking code" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none" />
              <button onClick={() => qc.invalidateQueries({ queryKey: ["omni-track", trackingCode] })} className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 active:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {trackQuery.data?.status && !trackQuery.data?.error && (
            <CustomerTracker data={trackQuery.data} />
          )}
        </div>
      )}
    </div>
  );
}

function CustomerTracker({ data }: { data: any }) {
  const si = statusIndicator(data.status);
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 text-center">
        <div className={cn("w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center", si.dot.includes("emerald") ? "bg-emerald-500/20" : si.dot.includes("yellow") ? "bg-amber-500/20" : si.dot.includes("red") ? "bg-red-500/20" : "bg-blue-500/20")}>
          {si.dot.includes("emerald") ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> :
           si.dot.includes("red") ? <AlertTriangle className="w-8 h-8 text-red-400" /> :
           <Clock className="w-8 h-8 text-amber-400" />}
        </div>
        <p className="text-2xl font-extrabold text-white">{friendlyStatus(data.status)}</p>
        {data.statusMessage && <p className="text-sm text-zinc-400 mt-2">{data.statusMessage}</p>}
      </div>

      {data.timeline && data.timeline.length > 0 && (
        <div className="px-6 py-5">
          <div className="space-y-0">
            {data.timeline.map((entry: any, i: number) => {
              const isFirst = i === 0;
              const isLast = i === data.timeline.length - 1;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0",
                      isFirst ? "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30" : "bg-zinc-800 text-zinc-600"
                    )}>
                      {isFirst ? "●" : "✓"}
                    </div>
                    {!isLast && <div className={cn("w-0.5 h-5", isFirst ? "bg-amber-500/30" : "bg-zinc-800")} />}
                  </div>
                  <div className="pt-0.5">
                    <p className={cn("text-sm font-medium", isFirst ? "text-white" : "text-zinc-500")}>{friendlyStatus(entry.status || entry.action)}</p>
                    <p className="text-[10px] text-zinc-600">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-6 pb-6">
        <p className="text-sm text-zinc-500 text-center">We're handling everything for you.</p>
      </div>
    </div>
  );
}


function MoreView({ section, setSection }: { section: string | null; setSection: (s: string | null) => void }) {
  if (section === "tasks") return <MoreWrapper title="All Tasks" onBack={() => setSection(null)}><TaskBoardCompact /></MoreWrapper>;
  if (section === "queue") return <MoreWrapper title="Department Queues" onBack={() => setSection(null)}><DeptQueueCompact /></MoreWrapper>;
  if (section === "vault") return <MoreWrapper title="Bank Vault" onBack={() => setSection(null)}><BankVault /></MoreWrapper>;
  if (section === "performance") return <MoreWrapper title="Performance Report" onBack={() => setSection(null)}><PerformanceReport /></MoreWrapper>;
  if (section === "store") return <MoreWrapper title="Store P&L" onBack={() => setSection(null)}><StorePerformanceDashboard /></MoreWrapper>;
  if (section === "velocity") return <MoreWrapper title="GM Velocity" onBack={() => setSection(null)}><GMVelocityDashboard /></MoreWrapper>;
  if (section === "tickets") return <MoreWrapper title="Customer Inbox" onBack={() => setSection(null)}><TicketInbox /></MoreWrapper>;
  if (section === "trust") return <MoreWrapper title="Trust Network" onBack={() => setSection(null)}><TrustDashboard /></MoreWrapper>;
  if (section === "search") return <MoreWrapper title="Global Search" onBack={() => setSection(null)}><GlobalSearchBar /></MoreWrapper>;
  if (section === "referral") return <MoreWrapper title="Refer Someone" onBack={() => setSection(null)}><ReferralLoop /></MoreWrapper>;

  const items = [
    { id: "tasks", icon: <Layers className="w-5 h-5 text-blue-400" />, label: "All Tasks", desc: "Full task board with filters" },
    { id: "queue", icon: <Users className="w-5 h-5 text-purple-400" />, label: "Department Queues", desc: "View tasks by department" },
    { id: "tickets", icon: <Inbox className="w-5 h-5 text-indigo-400" />, label: "Customer Inbox", desc: "Support tickets and messages" },
    { id: "vault", icon: <DollarSign className="w-5 h-5 text-emerald-400" />, label: "Bank Vault", desc: "Bank-ready completed tasks" },
    { id: "performance", icon: <BarChart3 className="w-5 h-5 text-amber-400" />, label: "Ops Report", desc: "SLA compliance and efficiency" },
    { id: "store", icon: <Store className="w-5 h-5 text-cyan-400" />, label: "Store P&L", desc: "Revenue and profit overview" },
    { id: "velocity", icon: <Gauge className="w-5 h-5 text-orange-400" />, label: "GM Velocity", desc: "Dealership throughput metrics" },
    { id: "trust", icon: <Shield className="w-5 h-5 text-amber-400" />, label: "Trust Network", desc: "Global trust scores and leaderboard" },
    { id: "search", icon: <Search className="w-5 h-5 text-zinc-400" />, label: "Global Search", desc: "Search deals and tasks" },
  ];

  return (
    <div className="space-y-3 pb-4">
      <button onClick={() => setSection("referral")} className="w-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5 text-left active:bg-amber-500/10 transition">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-white">Know someone who needs help?</p>
            <p className="text-xs text-zinc-500">Refer them and get notified when they move forward</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
        </div>
      </button>

      {items.map((item) => (
        <button key={item.id} onClick={() => setSection(item.id)} className="w-full flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-left active:bg-zinc-800/60 transition">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">{item.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{item.label}</p>
            <p className="text-xs text-zinc-500">{item.desc}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
        </button>
      ))}
      <div className="text-center text-[10px] text-zinc-700 pt-6 space-y-0.5">
        <p>3C ONYX — Automotive Ecosystem OS</p>
        <p>Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC</p>
        <p className="text-zinc-800">Sovereign Platform · Not for Public Distribution</p>
      </div>
    </div>
  );
}

function MoreWrapper({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="pb-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition py-2 mb-3">
        <ArrowRight className="w-4 h-4 rotate-180" /> {title}
      </button>
      {children}
    </div>
  );
}


function TaskBoardCompact() {
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
    mutationFn: ({ id, ...body }: { id: number; status?: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
    },
  });

  const tasks = data?.tasks || [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="flex-1 bg-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 border border-zinc-700">
          <option value="">All Depts</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 bg-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 border border-zinc-700">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-zinc-500"><p className="text-sm">No tasks found</p></div>
      ) : (
        tasks.map((task) => {
          const si = statusIndicator(task.status);
          const sla = slaStatus(task.slaDueAt, task.status);
          const nextAction = task.status === "Open" ? "Start" : task.status === "In_Progress" ? "Complete" : null;
          return (
            <div key={task.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", si.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded border", deptColor(task.department))}>{task.department.replace("_", " ")}</span>
                    <span className="text-[10px] text-zinc-500">{si.label}</span>
                    {sla && <span className={cn("text-[10px]", sla.color)}>{sla.label}</span>}
                  </div>
                </div>
                {nextAction && (
                  <button
                    onClick={() => updateTask.mutate({ id: task.id, status: nextAction === "Start" ? "In_Progress" : "Completed" })}
                    className={cn("shrink-0 px-3 py-2 rounded-xl text-xs font-semibold",
                      nextAction === "Start" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                    )}
                  >
                    {nextAction}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


function DeptQueueCompact() {
  const [dept, setDept] = useState("DMV");
  const { data, isLoading } = useQuery<{ queue: DFTask[]; count: number }>({
    queryKey: ["dept-queue", dept],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/queue?department=${dept}`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DEPARTMENTS.map((d) => (
          <button key={d} onClick={() => setDept(d)} className={cn(
            "shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition",
            dept === d ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-zinc-800 text-zinc-500 active:text-white"
          )}>
            {deptIcon(d)} {d.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : (data?.queue || []).length === 0 ? (
        <div className="text-center py-8 text-zinc-500"><p className="text-sm">Queue is empty</p></div>
      ) : (
        (data?.queue || []).map((task) => {
          const si = statusIndicator(task.status);
          return (
            <div key={task.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full shrink-0", si.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{task.title}</p>
                <p className="text-[10px] text-zinc-500">{si.label} · #{task.queuePosition} · {timeAgo(task.createdAt)}</p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded", priorityBadge(task.priority))}>{task.priority}</span>
            </div>
          );
        })
      )}
    </div>
  );
}


function BankVault() {
  const { data, isLoading } = useQuery<{ vaultItems: DFTask[]; count: number }>({
    queryKey: ["bank-vault"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/bank-vault`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>;

  const tasks = data?.vaultItems || [];

  return (
    <div className="space-y-3">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
        <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-emerald-300">{tasks.length}</p>
        <p className="text-xs text-zinc-500">Bank-Ready Tasks</p>
      </div>
      {tasks.map((task) => (
        <div key={task.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{task.title}</p>
            <p className="text-[10px] text-zinc-500">{task.department} · {timeAgo(task.createdAt)}</p>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Ready</span>
        </div>
      ))}
    </div>
  );
}


function PerformanceReport() {
  const { data, isLoading } = useQuery<PerformanceData>({
    queryKey: ["dealerflow-performance"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/performance`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{data.impact.hoursSaved}</p>
          <p className="text-[10px] text-zinc-500">Hours Saved</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{data.impact.efficiency}%</p>
          <p className="text-[10px] text-zinc-500">Efficiency</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{data.weekly.slaComplianceRate}%</p>
          <p className="text-[10px] text-zinc-500">SLA Compliance</p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-400">{data.weekly.avgResolutionFormatted}</p>
          <p className="text-[10px] text-zinc-500">Avg Resolution</p>
        </div>
      </div>

      {data.departmentPerformance.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-zinc-400 font-semibold">By Department</p>
          {data.departmentPerformance.map((d) => (
            <div key={d.department} className="flex items-center justify-between py-1.5">
              <span className={cn("text-xs px-2 py-0.5 rounded", deptColor(d.department))}>{d.department.replace("_", " ")}</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-zinc-400">{d.completed}/{d.totalCreated}</span>
                <span className="text-emerald-400">{d.completionRate}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TicketInbox() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ["dealerflow-tickets"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/tickets`).then((r) => r.json()),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>;

  const tickets = data?.tickets || [];

  return (
    <div className="space-y-3">
      <button onClick={() => setShowCreate(!showCreate)} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium active:bg-indigo-500/30 transition">
        <Plus className="w-4 h-4" /> New Ticket
      </button>
      {showCreate && <CreateTicketForm onClose={() => setShowCreate(false)} />}
      {tickets.length === 0 ? (
        <div className="text-center py-8 text-zinc-500"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No tickets</p></div>
      ) : (
        tickets.map((t) => {
          const si = statusIndicator(t.status);
          return (
            <div key={t.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", si.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{t.subject}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.customerName || "Anonymous"} · {t.channel} · {timeAgo(t.createdAt)}</p>
                  {t.lastMessage && <p className="text-xs text-zinc-400 mt-1 line-clamp-2 italic">"{t.lastMessage}"</p>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function CreateTicketForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/dealerflow/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealerflow-tickets"] });
      onClose();
    },
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-indigo-500/30 p-5 space-y-3">
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={2} className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none resize-none" />
      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 text-sm text-zinc-400 hover:text-white transition">Cancel</button>
        <button onClick={() => create.mutate({ subject, description: desc, customerName: name, customerPhone: phone })} disabled={!subject || create.isPending} className="flex-1 py-2.5 bg-indigo-500/30 text-indigo-200 rounded-xl text-sm font-medium disabled:opacity-50">
          {create.isPending ? "..." : "Create"}
        </button>
      </div>
    </div>
  );
}


function GMVelocityDashboard() {
  const { data, isLoading } = useQuery<{ dealershipVelocity: any; bottlenecks: any[] }>({
    queryKey: ["gm-velocity"],
    queryFn: () => authFetch(`${BASE}/api/dealerflow/velocity`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>;

  const v = data?.dealershipVelocity || {};
  const bottlenecks = data?.bottlenecks || [];
  const topBottleneck = bottlenecks[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{v.totalCompleted || 0}</p>
          <p className="text-[10px] text-zinc-500">Completed (7d)</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{v.slaComplianceRate || 0}%</p>
          <p className="text-[10px] text-zinc-500">SLA Compliance</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{v.avgTimeToResolution || "—"}</p>
          <p className="text-[10px] text-zinc-500">Avg Resolution</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{topBottleneck?.department || "None"}</p>
          <p className="text-[10px] text-zinc-500">Top Bottleneck</p>
        </div>
      </div>
      {bottlenecks.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-zinc-400 font-semibold">Department Bottlenecks</p>
          {bottlenecks.map((b: any) => (
            <div key={b.department} className="flex items-center justify-between py-1.5">
              <span className={cn("text-xs px-2 py-0.5 rounded", deptColor(b.department))}>{b.department.replace("_", " ")}</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-zinc-400">{b.openTasks} open</span>
                {b.escalatedTasks > 0 && <span className="text-red-400">{b.escalatedTasks} escalated</span>}
                <span className="text-zinc-500">{b.avgResolutionFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function StorePerformanceDashboard() {
  const { data, isLoading } = useQuery<{ store: any; dealsByStatus: any[]; dealsByType: any[] }>({
    queryKey: ["store-performance"],
    queryFn: () => authFetch(`${BASE}/api/deals/dashboard/store-performance`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-amber-400 animate-spin" /></div>;

  const s = data?.store || {};

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{formatUsd(s.totalRevenue)}</p>
          <p className="text-[10px] text-zinc-500">Revenue</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{formatUsd(s.totalGross)}</p>
          <p className="text-[10px] text-zinc-500">Gross Profit</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{s.totalDeals || 0}</p>
          <p className="text-[10px] text-zinc-500">Total Deals</p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-400">{formatUsd(s.avgGrossPerDeal)}</p>
          <p className="text-[10px] text-zinc-500">Avg / Deal</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{formatUsd(s.totalCommissionsOwed)}</p>
          <p className="text-[10px] text-zinc-500">Comm. Owed</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{formatUsd(s.totalCommissionsPaid)}</p>
          <p className="text-[10px] text-zinc-500">Comm. Paid</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{s.pendingApprovals || 0}</p>
          <p className="text-[10px] text-zinc-500">Pending</p>
        </div>
      </div>
    </div>
  );
}


function TrustDashboard() {
  const [verifyForm, setVerifyForm] = useState({ fullName: "", phone: "", email: "", governmentIdType: "drivers_license", governmentIdLast4: "", selfieConfirmation: false });
  const qc = useQueryClient();

  const trustProfileQuery = useQuery({
    queryKey: ["trust-profile"],
    queryFn: () => authFetch(`${BASE}/api/trust/profile`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const leaderboardQuery = useQuery({
    queryKey: ["trust-leaderboard"],
    queryFn: () => fetch(`${BASE}/api/trust/leaderboard`).then((r) => r.json()),
  });

  const verifyMut = useMutation({
    mutationFn: (data: typeof verifyForm) =>
      authFetch(`${BASE}/api/trust/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trust-profile"] }); },
  });

  const profile = trustProfileQuery.data?.profile;
  const leaderboard = leaderboardQuery.data?.leaderboard || [];

  return (
    <div className="space-y-4">
      {profile ? (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase">Trust Score</p>
              <p className="text-4xl font-bold text-amber-400">{Number(profile.trustScore).toFixed(1)}</p>
            </div>
            <div className="text-right">
              <span className={cn("text-xs px-3 py-1 rounded-full font-semibold",
                profile.tier === "Keyholder" ? "bg-amber-500/30 text-amber-300" :
                profile.tier === "Trusted_Node" ? "bg-emerald-500/20 text-emerald-300" :
                profile.tier === "Verified_Node" ? "bg-blue-500/20 text-blue-300" :
                profile.tier === "Contributor" ? "bg-violet-500/20 text-violet-300" :
                "bg-zinc-700 text-zinc-400"
              )}>
                {profile.tier?.replace(/_/g, " ")}
              </span>
              {profile.isVerified && <p className="text-[10px] text-emerald-400 mt-1 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-800/50 rounded-xl p-2">
              <p className="text-lg font-bold text-white">{profile.totalSubmissions}</p>
              <p className="text-[10px] text-zinc-500">Submitted</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-2">
              <p className="text-lg font-bold text-emerald-400">{profile.acceptedSubmissions}</p>
              <p className="text-[10px] text-zinc-500">Accepted</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-2">
              <p className="text-lg font-bold text-red-400">{profile.rejectedSubmissions}</p>
              <p className="text-[10px] text-zinc-500">Rejected</p>
            </div>
          </div>

          {!profile.isVerified && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 mt-2">
              <p className="text-xs text-amber-400 font-semibold">Verify your identity (+10 trust points)</p>
              <input value={verifyForm.fullName} onChange={(e) => setVerifyForm({ ...verifyForm, fullName: e.target.value })} placeholder="Full name" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
              <input value={verifyForm.email} onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })} placeholder="Email" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
              <input value={verifyForm.governmentIdLast4} onChange={(e) => setVerifyForm({ ...verifyForm, governmentIdLast4: e.target.value })} placeholder="Last 4 of ID" maxLength={4} className="w-full bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" checked={verifyForm.selfieConfirmation} onChange={(e) => setVerifyForm({ ...verifyForm, selfieConfirmation: e.target.checked })} className="rounded" />
                I confirm this is my identity
              </label>
              <button
                onClick={() => verifyMut.mutate(verifyForm)}
                disabled={!verifyForm.fullName || !verifyForm.governmentIdLast4 || !verifyForm.selfieConfirmation || verifyMut.isPending}
                className="w-full py-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                {verifyMut.isPending ? "Verifying..." : "Verify Identity"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center">
          <Shield className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Log in to view your trust profile</p>
        </div>
      )}

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
        <p className="text-xs text-zinc-400 font-semibold mb-3">Network Leaderboard</p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-4">No trust data yet</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((node: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className={cn("text-xs font-bold w-5 text-center", i < 3 ? "text-amber-400" : "text-zinc-600")}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{node.displayName || "Anonymous"}</p>
                  <p className="text-[10px] text-zinc-600">{node.tier?.replace(/_/g, " ")}</p>
                </div>
                <span className="text-sm font-bold text-amber-300">{Number(node.trustScore).toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function ReferralLoop() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: (body: { referralName: string; referralPhone: string }) =>
      authFetch(`${BASE}/api/omni-node/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Referral: ${body.referralName}`, description: `Referred contact: ${body.referralName}, Phone: ${body.referralPhone}`, intakeType: "Walk_In", department: "Sales", urgency: "Medium" }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setSent(true);
      setName("");
      setPhone("");
    },
  });

  if (sent) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <p className="text-xl font-extrabold text-white">Sent!</p>
        <p className="text-sm text-zinc-500">You'll be notified if they move forward.</p>
        <button onClick={() => setSent(false)} className="text-sm text-amber-400 font-medium mt-4">Refer someone else</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-10 h-10 text-amber-400" />
        </div>
        <p className="text-xl font-extrabold text-white">Know someone who needs help?</p>
        <p className="text-sm text-zinc-500 mt-2">Send their info and we'll take care of the rest</p>
      </div>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Their name"
          className="w-full bg-zinc-800 text-white text-base rounded-2xl px-5 py-4 border border-zinc-700 focus:border-amber-500/50 outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Their phone number"
          type="tel"
          className="w-full bg-zinc-800 text-white text-base rounded-2xl px-5 py-4 border border-zinc-700 focus:border-amber-500/50 outline-none"
        />
      </div>

      <button
        onClick={() => { if (name.trim() && phone.trim()) submit.mutate({ referralName: name, referralPhone: phone }); }}
        disabled={!name.trim() || !phone.trim() || submit.isPending}
        className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-lg font-extrabold rounded-2xl active:scale-[0.98] transition disabled:opacity-40"
      >
        {submit.isPending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}


function GlobalSearchBar() {
  const [q, setQ] = useState("");
  const { data } = useQuery<{ results: { deals: any[]; tasks: any[]; totalResults: number } }>({
    queryKey: ["global-search", q],
    queryFn: () => authFetch(`${BASE}/api/deals/search/global?q=${encodeURIComponent(q)}`).then((r) => r.json()),
    enabled: q.length >= 2,
  });

  const allResults = [...(data?.results?.deals || []), ...(data?.results?.tasks || [])];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search deals, tasks, VINs, customers..."
          className="w-full bg-zinc-800 text-white text-sm rounded-xl pl-11 pr-4 py-3.5 border border-zinc-700 outline-none focus:border-amber-500/50"
          autoFocus
        />
      </div>
      {allResults.map((r: any, i: number) => (
        <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded uppercase">{r.type || "item"}</span>
            <span className="text-sm text-white">{r.title || r.customerName || r.subject || "—"}</span>
          </div>
          {r.vin && <p className="text-[10px] text-zinc-500 font-mono mt-1">{r.vin}</p>}
        </div>
      ))}
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
      qc.invalidateQueries({ queryKey: ["dealerflow-tasks-feed"] });
      qc.invalidateQueries({ queryKey: ["dealerflow-dashboard"] });
      onClose();
    },
  });

  return (
    <div className="space-y-4 pt-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to happen?" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3.5 border border-zinc-700 focus:border-amber-500/50 outline-none" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add details — AI will auto-detect the department" rows={2} className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 focus:border-amber-500/50 outline-none resize-none" />
      <div className="grid grid-cols-2 gap-3">
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 border border-zinc-700">
          <option value="">Auto-Route</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 border border-zinc-700">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN (optional)" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none font-mono" />
      <button
        onClick={() => create.mutate({ title, description: desc || undefined, department: dept || undefined, priority, vin: vin || undefined })}
        disabled={!title || create.isPending}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-2xl text-sm active:scale-[0.98] transition disabled:opacity-50"
      >
        {create.isPending ? "Creating..." : "Create & Route"}
      </button>
    </div>
  );
}


function CreateDealForm({ onClose }: { onClose: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [dealType, setDealType] = useState("Used_Sale");
  const [salePrice, setSalePrice] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (body: any) =>
      authFetch(`${BASE}/api/deals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["my-deals"] });
      onClose();
    },
  });

  return (
    <div className="bg-zinc-900 rounded-2xl border border-emerald-500/30 p-5 space-y-3 mb-4">
      <p className="text-base font-bold text-white">Start New Deal</p>
      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
        <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" className="bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
      </div>
      <input value={vehicleLabel} onChange={(e) => setVehicleLabel(e.target.value)} placeholder="Vehicle (e.g., 2024 Ram 1500)" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none" />
      <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN" className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 outline-none font-mono" />
      <div className="grid grid-cols-2 gap-2">
        <select value={dealType} onChange={(e) => setDealType(e.target.value)} className="bg-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 border border-zinc-700">
          {["New_Sale", "Used_Sale", "Lease", "Wholesale", "Trade_In"].map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Sale price" className="bg-zinc-800 text-white text-sm rounded-xl px-3 py-2.5 border border-zinc-700 outline-none" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-3 text-sm text-zinc-400">Cancel</button>
        <button
          onClick={() => create.mutate({ customerName, customerPhone, customerEmail, vin: vin || undefined, vehicleLabel, dealType, salePrice: salePrice ? parseFloat(salePrice) : undefined })}
          disabled={!customerName || create.isPending}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 active:scale-[0.98] transition"
        >
          {create.isPending ? "Creating..." : "Launch Deal"}
        </button>
      </div>
    </div>
  );
}


function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    pct >= 75 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono", color)}>{pct}%</span>;
}

function ExecutionModeBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    "AI-Autonomous": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Escalated": "bg-red-500/10 text-red-400 border-red-500/20",
    "Human-Assisted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Auto-Resumed": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", styles[mode] || "bg-zinc-700 text-zinc-400")}>{mode}</span>;
}

function DealDetail({ dealId }: { dealId: number }) {
  const [resolveTaskId, setResolveTaskId] = useState<number | null>(null);
  const [resolution, setResolution] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ deal: any; tasks: any[]; progress: any }>({
    queryKey: ["deal-detail", dealId],
    queryFn: () => authFetch(`${BASE}/api/deals/${dealId}`).then((r) => r.json()),
  });

  const resolveEscalation = useMutation({
    mutationFn: ({ taskId, resolution }: { taskId: number; resolution: string }) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${taskId}/resolve-escalation`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolution }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal-detail", dealId] });
      setResolveTaskId(null);
      setResolution("");
    },
  });

  const retryTask = useMutation({
    mutationFn: (taskId: number) =>
      authFetch(`${BASE}/api/dealerflow/tasks/${taskId}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal-detail", dealId] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-amber-400 animate-spin" /></div>;
  if (!data) return null;

  const { tasks, progress } = data;
  const nextTask = tasks.find((t: any) => t.id === progress.nextActionTaskId);
  const escalatedTasks = tasks.filter((t: any) => t.status === "Escalated");

  return (
    <div className="space-y-4">
      {nextTask && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5">
          <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-2">Next Step</p>
          <h4 className="text-base font-bold text-white mb-2">{nextTask.title.replace(/\[.*?\]\s*/, "")}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded", deptColor(nextTask.department))}>{nextTask.department}</span>
            {nextTask.aiConfidence !== undefined && <ConfidenceBadge confidence={nextTask.aiConfidence} />}
            {nextTask.executionMode && <ExecutionModeBadge mode={nextTask.executionMode} />}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all rounded-full" style={{ width: `${progress.percentage}%` }} />
        </div>
        <span className="text-sm font-bold text-amber-300">{progress.percentage}%</span>
      </div>

      {escalatedTasks.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-red-400 font-bold uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Needs Expert Help ({escalatedTasks.length})
          </p>
          {escalatedTasks.map((et: any) => (
            <div key={et.id} className="bg-red-500/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{et.title.replace(/\[.*?\]\s*/, "")}</span>
                <button onClick={() => setResolveTaskId(resolveTaskId === et.id ? null : et.id)} className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg active:bg-blue-500/30">Resolve</button>
              </div>
              {resolveTaskId === et.id && (
                <div className="flex gap-2">
                  <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe resolution..." className="flex-1 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 border border-zinc-700 outline-none" />
                  <button onClick={() => resolution.trim() && resolveEscalation.mutate({ taskId: et.id, resolution })} disabled={!resolution.trim()} className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-2 rounded-lg disabled:opacity-50">Resume</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs text-zinc-500 font-semibold mb-2">All Steps</p>
        {tasks.map((t: any) => {
          const isNext = progress.nextActionTaskId === t.id;
          const isBlocked = t.status === "Blocked";
          const isComplete = t.status === "Completed";
          const isEscalated = t.status === "Escalated";
          return (
            <div key={t.id} className={cn(
              "flex items-center gap-3 py-2 px-3 rounded-xl",
              isNext ? "bg-amber-500/10 border border-amber-500/30" : isEscalated ? "bg-red-500/5" : "bg-zinc-800/30",
              isBlocked ? "opacity-50" : ""
            )}>
              {isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
                isEscalated ? <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" /> :
                isBlocked ? <Lock className="w-4 h-4 text-red-400 shrink-0" /> :
                isNext ? <Zap className="w-4 h-4 text-amber-400 shrink-0" /> :
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{t.title.replace(/\[.*?\]\s*/, "")}</p>
                <p className="text-[10px] text-zinc-600">{t.department} {isBlocked && t.predecessorTitle ? `· Waiting on: ${t.predecessorTitle}` : ""}</p>
              </div>
              {isNext && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold shrink-0">NEXT</span>}
              {t.aiConfidence !== undefined && <ConfidenceBadge confidence={t.aiConfidence} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
