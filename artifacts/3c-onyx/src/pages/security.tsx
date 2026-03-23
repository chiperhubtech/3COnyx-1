import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, Lock, Eye, EyeOff, Key, AlertTriangle, CheckCircle2,
  Cpu, RefreshCw, Download, Hash, Clock, X, ChevronRight,
  Loader2, Terminal, Zap, ShieldAlert, Link2, Bot, User,
  FileCheck, GitBranch, Layers, Unlock, RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PiiField {
  fieldId: string;
  label: string;
  piiType: "vin" | "ssn" | "address" | "name" | "email" | "phone";
  displayMasked: string;
  algorithm: string;
  keyVersion: string;
  encryptedAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
}

interface ShieldStats {
  totalFields: number;
  byType: Record<string, number>;
  totalDecryptions: number;
  algorithm: string;
  keyVersion: string;
  nistCompliance: string;
}

interface AuditEntry {
  id: string;
  seq: number;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentType: string;
  action: string;
  decision: string;
  reasoning: string;
  alternativesConsidered: string[];
  outcomeType: "accepted" | "overridden" | "flagged" | "deferred";
  vehicleIdMasked: string | null;
  ownerVisible: false;
  prevHash: string;
  hash: string;
}

interface TransientToken {
  token: string;
  agentId: string;
  agentName: string;
  agentType: string;
  vehicleId: string;
  vehicleName: string;
  purpose: string;
  grantedAt: string;
  expiresAt: string;
  used: boolean;
  secondsRemaining: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const AGENT_CONFIGS: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  valuation_model:  { color: "text-amber-400",   bg: "bg-amber-400/8",   border: "border-amber-400/20",   icon: "◈", label: "Valuation Model" },
  part_sourcing:    { color: "text-blue-400",     bg: "bg-blue-400/8",    border: "border-blue-400/20",    icon: "◎", label: "Part Sourcing" },
  risk_assessment:  { color: "text-red-400",      bg: "bg-red-400/8",     border: "border-red-400/20",     icon: "◬", label: "Risk Assessment" },
  concierge:        { color: "text-violet-400",   bg: "bg-violet-400/8",  border: "border-violet-400/20",  icon: "◉", label: "Concierge" },
  finance_routing:  { color: "text-emerald-400",  bg: "bg-emerald-400/8", border: "border-emerald-400/20", icon: "◇", label: "Finance Routing" },
  inspection_ai:    { color: "text-teal-400",     bg: "bg-teal-400/8",    border: "border-teal-400/20",    icon: "◆", label: "Inspection AI" },
  market_timing:    { color: "text-sky-400",      bg: "bg-sky-400/8",     border: "border-sky-400/20",     icon: "◁", label: "Market Timing" },
  compliance_scan:  { color: "text-lime-400",     bg: "bg-lime-400/8",    border: "border-lime-400/20",    icon: "◼", label: "Compliance Scan" },
};

const OUTCOME_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  accepted:   { label: "ACCEPTED",   color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/20" },
  overridden: { label: "OVERRIDDEN", color: "text-amber-400",   bg: "bg-amber-500/8",   border: "border-amber-500/20"   },
  flagged:    { label: "FLAGGED",    color: "text-red-400",      bg: "bg-red-500/8",     border: "border-red-500/20"     },
  deferred:   { label: "DEFERRED",   color: "text-sky-400",      bg: "bg-sky-500/8",     border: "border-sky-500/20"     },
};

const PII_COLORS: Record<string, string> = {
  vin:     "text-blue-400",
  ssn:     "text-red-400",
  address: "text-amber-400",
  name:    "text-violet-400",
  email:   "text-emerald-400",
  phone:   "text-sky-400",
};

// ─── Typing terminal text ──────────────────────────────────────────────────────
function TypingText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <>{displayed}<span className="animate-pulse">_</span></>;
}

// ─── Hash Chain Visualizer ─────────────────────────────────────────────────────
function HashChainLink({ entry, isFirst }: { entry: AuditEntry; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const agentCfg = AGENT_CONFIGS[entry.agentType] ?? AGENT_CONFIGS.compliance_scan;
  const outcomeCfg = OUTCOME_CONFIG[entry.outcomeType];

  return (
    <div className="relative">
      {/* Chain link connector */}
      {!isFirst && (
        <div className="absolute left-5 -top-3 h-3 flex flex-col items-center gap-0.5">
          {[0,1,2].map((i) => (
            <div key={i} className="w-0.5 h-0.5 rounded-full bg-emerald-500/30" />
          ))}
        </div>
      )}

      <div className={`rounded-xl border transition-all ${expanded ? "border-emerald-500/25 bg-emerald-500/[0.03]" : "border-white/6 bg-white/[0.02] hover:border-white/10"}`}>
        {/* Collapsed row */}
        <button
          className="w-full p-3.5 flex items-start gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Agent icon + seq */}
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${agentCfg.bg} ${agentCfg.border}`}>
              <span className={`text-sm font-black ${agentCfg.color}`}>{agentCfg.icon}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#07070b] border border-white/10 flex items-center justify-center">
              <span className="text-[7px] text-white/30 font-mono">#{entry.seq}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[10px] font-bold ${agentCfg.color}`}>{entry.agentName}</span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/30 font-mono">{entry.action}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ml-auto ${outcomeCfg.color} ${outcomeCfg.bg} ${outcomeCfg.border}`}>
                {outcomeCfg.label}
              </span>
            </div>
            <p className="text-xs text-white/70 leading-5 line-clamp-2">{entry.decision}</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[9px] text-white/20">
                {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              {entry.vehicleIdMasked && (
                <span className="text-[9px] text-white/20 font-mono">{entry.vehicleIdMasked}</span>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[8px] font-mono text-emerald-400/30">{entry.hash.slice(0, 8)}…</span>
                <Link2 className="w-2.5 h-2.5 text-emerald-400/20" />
              </div>
            </div>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-white/15 shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
            {/* Reasoning */}
            <div>
              <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 font-medium">Agent Reasoning</p>
              <p className="text-xs text-white/50 leading-5 bg-white/[0.02] rounded-lg p-3 border border-white/5 font-mono">
                <TypingText text={entry.reasoning} speed={8} />
              </p>
            </div>

            {/* Alternatives */}
            {entry.alternativesConsidered.length > 0 && (
              <div>
                <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 font-medium">Alternatives Considered & Rejected</p>
                <div className="space-y-1">
                  {entry.alternativesConsidered.map((alt) => (
                    <div key={alt} className="flex items-center gap-2 text-xs text-white/30 bg-red-500/[0.03] border border-red-500/10 rounded-lg px-3 py-1.5">
                      <X className="w-3 h-3 text-red-400/40 shrink-0" />
                      {alt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hash chain */}
            <div className="rounded-lg bg-black/30 border border-white/6 p-3 space-y-1.5">
              <p className="text-[9px] text-white/15 uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> Immutable Hash Chain
              </p>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-white/20 shrink-0">PREV</span>
                <span className="text-white/25 truncate flex-1">{entry.prevHash}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono">
                <span className="text-emerald-400/40 shrink-0">THIS</span>
                <span className="text-emerald-400/60 truncate flex-1">{entry.hash}</span>
              </div>
            </div>

            {/* Owner visible indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/15">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-400/80 font-medium">
                Owner PII was NOT visible to this agent — NIST-MCP §4.3.2(a)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Decrypt Modal ─────────────────────────────────────────────────────────────
function DecryptModal({ field, onClose }: { field: PiiField; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const { toast } = useToast();

  const handleDecrypt = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/security/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: field.fieldId, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.plaintext);
        toast({ title: "Decrypted — Access Logged", description: "This access has been added to the Agent Audit Trail." });
      } else {
        const err = await res.json();
        toast({ title: "Decryption Failed", description: err.error, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-emerald-500/20 bg-[#07070b] overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(16,185,129,0.08)" }}>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Unlock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Decrypt PII Field</p>
              <p className="text-[10px] text-emerald-400/60">Access logged to Agent Audit Trail</p>
            </div>
          </div>
          <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/8">
            <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Field</p>
            <p className="text-xs font-medium text-white">{field.label}</p>
            <p className="text-[10px] text-white/30 font-mono mt-1">{field.displayMasked}</p>
          </div>
          {!result ? (
            <>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Access Reason (Required)</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/20 resize-none outline-none focus:border-emerald-500/40 mb-4"
                rows={3}
                placeholder="e.g., KYC verification for transaction #TXN-44821"
              />
              <button
                onClick={handleDecrypt}
                disabled={!reason.trim() || loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {loading ? "Decrypting…" : "Decrypt with AES-256-GCM"}
              </button>
            </>
          ) : (
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Plaintext Value</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20">
                <p className="flex-1 text-sm font-mono text-emerald-300">
                  {showValue ? result : "•".repeat(Math.min(result.length, 16))}
                </p>
                <button onClick={() => setShowValue((v) => !v)} className="text-white/30 hover:text-white/60">
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-3 p-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/15">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-400/70">This access has been permanently logged. Do not screenshot or share.</p>
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 text-white/20 hover:text-white/50">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Transient Access Panel ────────────────────────────────────────────────────
const AGENT_PRESETS = [
  { agentId: "agent-val-001",  agentName: "Valuation_Model", agentType: "valuation_model",  purpose: "Price the vehicle against current comps" },
  { agentId: "agent-risk-001", agentName: "Risk_Assessment",  agentType: "risk_assessment",  purpose: "Assess flood, lien, and recall risk" },
  { agentId: "agent-fin-001",  agentName: "Finance_Routing",  agentType: "finance_routing",  purpose: "Route buyer to optimal lender" },
  { agentId: "agent-insp-001", agentName: "Inspection_AI",    agentType: "inspection_ai",    purpose: "Analyse 360° scan for condition scoring" },
  { agentId: "agent-conc-001", agentName: "Concierge",        agentType: "concierge",        purpose: "Answer buyer questions about the vehicle" },
];

const VEHICLE_PRESETS = [
  { id: "task-001", name: "2023 Rolls-Royce Ghost Extended" },
  { id: "task-002", name: "2023 Ferrari Roma Coupe" },
];

function TransientAccessPanel() {
  const [selectedAgent, setSelectedAgent] = useState(AGENT_PRESETS[0]);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_PRESETS[0]);
  const [activeTokens, setActiveTokens] = useState<TransientToken[]>([]);
  const [granting, setGranting] = useState(false);
  const [vitals, setVitals] = useState<Record<string, unknown> | null>(null);
  const [grantedToken, setGrantedToken] = useState<string | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const { toast } = useToast();

  const fetchActiveTokens = useCallback(async () => {
    const res = await fetch("/api/security/transient-access/active");
    if (res.ok) {
      const d = await res.json();
      setActiveTokens(d.tokens ?? []);
    }
  }, []);

  useEffect(() => { fetchActiveTokens(); }, [fetchActiveTokens]);

  const grantToken = async () => {
    setGranting(true);
    setVitals(null);
    setGrantedToken(null);
    try {
      const res = await fetch("/api/security/transient-access/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedAgent,
          vehicleId: selectedVehicle.id,
          purpose: selectedAgent.purpose,
        }),
      });
      const d = await res.json();
      setGrantedToken(d.token);
      await fetchActiveTokens();
      toast({ title: "Transient Token Issued", description: `15-min access granted to ${selectedAgent.agentName}` });
    } finally {
      setGranting(false);
    }
  };

  const loadVitals = async (token: string) => {
    setLoadingVitals(true);
    setVitals(null);
    try {
      const res = await fetch(`/api/security/transient-access/${token}/vitals`);
      if (res.ok) {
        const d = await res.json();
        setVitals(d.vitals);
      } else {
        const err = await res.json();
        toast({ title: "Access Denied", description: err.error, variant: "destructive" });
      }
    } finally {
      setLoadingVitals(false);
    }
  };

  const ttlBar = (sec: number) => Math.min(100, (sec / 900) * 100);

  return (
    <div className="space-y-5">
      {/* Grant token form */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/6">
          <div className="flex items-center gap-2 mb-0.5">
            <Key className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Grant Transient Agent Token</p>
          </div>
          <p className="text-[10px] text-white/30">15-minute TTL · PII-stripped vitals only · auto-logs to audit trail</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Agent selector */}
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">AI Agent</p>
              <div className="space-y-1.5">
                {AGENT_PRESETS.map((a) => {
                  const cfg = AGENT_CONFIGS[a.agentType];
                  return (
                    <button
                      key={a.agentId}
                      onClick={() => setSelectedAgent(a)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all text-xs ${
                        selectedAgent.agentId === a.agentId
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : "border-white/6 bg-transparent text-white/40 hover:text-white/60"
                      }`}
                    >
                      <span className="shrink-0">{cfg.icon}</span>
                      <span className="font-medium">{a.agentName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle selector */}
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Vehicle</p>
              <div className="space-y-1.5 mb-3">
                {VEHICLE_PRESETS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`w-full px-2.5 py-2 rounded-xl border text-left text-xs transition-all ${
                      selectedVehicle.id === v.id
                        ? "border-amber-500/30 bg-amber-500/8 text-amber-400"
                        : "border-white/6 text-white/40 hover:text-white/60"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>

              {/* What agent CAN vs CANNOT see */}
              <div className="rounded-xl bg-black/30 border border-white/6 p-2.5 text-[9px] space-y-1.5">
                <p className="text-white/20 uppercase tracking-wider mb-2 font-medium">Access Policy</p>
                {[
                  { key: "Make / Model / Year", can: true },
                  { key: "Condition Score", can: true },
                  { key: "Odometer", can: true },
                  { key: "Color / Spec", can: true },
                  { key: "VIN (masked)", can: true },
                  { key: "Owner Name", can: false },
                  { key: "Home Address", can: false },
                  { key: "SSN / Tax ID", can: false },
                  { key: "Email / Phone", can: false },
                ].map(({ key, can }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    {can
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      : <X className="w-3 h-3 text-red-400 shrink-0" />
                    }
                    <span className={can ? "text-white/50" : "text-white/20 line-through"}>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={grantToken}
            disabled={granting}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {granting ? "Issuing token…" : `Grant 15-min Access to ${selectedAgent.agentName}`}
          </button>
        </div>
      </div>

      {/* Active tokens */}
      {activeTokens.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="p-4 border-b border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Active Tokens</p>
            </div>
            <button onClick={fetchActiveTokens} className="text-white/20 hover:text-white/50">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {activeTokens.map((t) => {
              const agentCfg = AGENT_CONFIGS[t.agentType] ?? AGENT_CONFIGS.compliance_scan;
              return (
                <div key={t.token} className="p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`text-sm ${agentCfg.color}`}>{agentCfg.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${agentCfg.color}`}>{t.agentName}</p>
                      <p className="text-[10px] text-white/25">{t.vehicleName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-amber-400 font-mono">{t.secondsRemaining}s</p>
                      <p className="text-[9px] text-white/20">remaining</p>
                    </div>
                  </div>
                  {/* TTL progress bar */}
                  <div className="h-1 rounded-full bg-white/6 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${ttlBar(t.secondsRemaining)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => loadVitals(t.token.replace("…", ""))}
                    disabled={loadingVitals}
                    className="w-full py-1.5 rounded-lg bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] text-white/40 text-[11px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loadingVitals ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    Use Token → Agent Vitals View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vitals result */}
      {vitals && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] overflow-hidden">
          <div className="p-4 border-b border-emerald-500/10 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Agent-Visible Vitals</p>
            <span className="ml-auto text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 font-bold">PII STRIPPED</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(vitals).map(([k, v]) => {
                const isRedacted = typeof v === "string" && v.includes("AGENT REDACTED");
                return (
                  <div key={k} className={`p-2.5 rounded-xl border text-xs ${isRedacted ? "border-red-500/10 bg-red-500/[0.03]" : "border-white/6 bg-white/[0.02]"}`}>
                    <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">{k}</p>
                    <p className={`font-medium ${isRedacted ? "text-red-400/50 text-[9px]" : "text-white/70"}`}>
                      {isRedacted ? "⛔ " + (v as string).replace("[", "").replace("]", "") : String(v)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Encryption Shield Panel ───────────────────────────────────────────────────
function EncryptionShield() {
  const [fields, setFields] = useState<PiiField[]>([]);
  const [stats, setStats] = useState<ShieldStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [encryptModal, setEncryptModal] = useState(false);
  const [decryptField, setDecryptField] = useState<PiiField | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<string>("vin");
  const [newLabel, setNewLabel] = useState("");
  const [encrypting, setEncrypting] = useState(false);
  const [encryptResult, setEncryptResult] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/security/shield");
    if (res.ok) {
      const d = await res.json();
      setFields(d.fields ?? []);
      setStats(d.stats ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEncrypt = async () => {
    if (!newValue.trim()) return;
    setEncrypting(true);
    setEncryptResult(null);
    const res = await fetch("/api/security/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: newValue, piiType: newType, label: newLabel || undefined }),
    });
    if (res.ok) {
      const d = await res.json();
      setEncryptResult(`IV: ${d.iv} · ${d.ciphertextLength} bytes ct · AES-256-GCM`);
      setNewValue("");
      setNewLabel("");
      fetchData();
      toast({ title: "Field Encrypted", description: "AES-256-GCM — now stored in the PII registry." });
    }
    setEncrypting(false);
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Encrypted Fields", value: stats?.totalFields ?? 0, color: "text-emerald-400", icon: Shield },
          { label: "Total Decryptions", value: stats?.totalDecryptions ?? 0, color: "text-amber-400", icon: Unlock },
          { label: "Algorithm", value: stats?.algorithm ?? "AES-256-GCM", color: "text-blue-400", icon: Lock },
          { label: "Compliance", value: stats?.nistCompliance ?? "NIST-MCP 2026", color: "text-violet-400", icon: FileCheck },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[9px] text-white/25 uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* PII field table */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden mb-5">
        <div className="p-4 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-white">PII Field Registry</p>
          </div>
          <button
            onClick={() => setEncryptModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
          >
            <Lock className="w-3 h-3" />
            Encrypt New Field
          </button>
        </div>
        {loading ? (
          <div className="p-6 space-y-2">
            {[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {fields.map((f) => {
              const typeColor = PII_COLORS[f.piiType] ?? "text-white/40";
              return (
                <div key={f.fieldId} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                  {/* Type pill */}
                  <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0`}>
                    <Lock className={`w-3.5 h-3.5 ${typeColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] uppercase font-bold ${typeColor}`}>{f.piiType}</span>
                      <span className="text-[9px] text-white/20">·</span>
                      <span className="text-[9px] font-mono text-white/25">{f.displayMasked}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 font-bold">{f.algorithm}</span>
                    <p className="text-[9px] text-white/20 mt-1">{f.accessCount}× accessed</p>
                  </div>
                  <button
                    onClick={() => setDecryptField(f)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 hover:bg-white/[0.07] text-white/30 text-[11px] transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    Decrypt
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Encrypt new field modal */}
      {encryptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEncryptModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-emerald-500/20 bg-[#07070b] p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <Lock className="w-4 h-4 text-emerald-400" />
              <p className="text-white font-semibold text-sm">Encrypt New PII Field</p>
              <button onClick={() => setEncryptModal(false)} className="ml-auto text-white/20 hover:text-white/50"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Label (optional)</p>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/40" placeholder="e.g., VIN — 2024 Ferrari SF90" />
              </div>
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">PII Type</p>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none">
                  {["vin","ssn","address","name","email","phone"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Plaintext Value</p>
                <input value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500/40" placeholder="Enter the value to encrypt…" />
              </div>
              {encryptResult && (
                <div className="p-2.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 text-[9px] font-mono text-emerald-400/70">{encryptResult}</div>
              )}
              <button onClick={handleEncrypt} disabled={encrypting || !newValue.trim()} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2">
                {encrypting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {encrypting ? "Encrypting…" : "Encrypt with AES-256-GCM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {decryptField && <DecryptModal field={decryptField} onClose={() => { setDecryptField(null); fetchData(); }} />}
    </>
  );
}

// ─── Agent Audit Trail Panel ───────────────────────────────────────────────────
function AgentAuditTrailPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [genesisHash, setGenesisHash] = useState("");
  const [latestHash, setLatestHash] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ chainValid: boolean; entriesChecked: number; verifiedAt: string } | null>(null);
  const { toast } = useToast();

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/security/agent-audit");
    if (res.ok) {
      const d = await res.json();
      setEntries(d.entries ?? []);
      setGenesisHash(d.genesisHash ?? "");
      setLatestHash(d.latestHash ?? "");
      setTotal(d.total ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const verifyChain = async () => {
    setVerifying(true);
    setVerifyResult(null);
    await new Promise((r) => setTimeout(r, 800)); // dramatic pause
    const res = await fetch("/api/security/agent-audit/verify");
    if (res.ok) {
      const d = await res.json();
      setVerifyResult(d);
      toast({
        title: d.chainValid ? "Chain Integrity: VALID ✓" : "⚠ Tamper Detected!",
        description: d.chainValid ? `${d.entriesChecked} entries verified — no tampering detected.` : `Tamper found at entry #${d.tamperDetectedAt}`,
        variant: d.chainValid ? "default" : "destructive",
      });
    }
    setVerifying(false);
  };

  return (
    <div className="space-y-5">
      {/* Chain stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Decisions", value: total, color: "text-white" },
          { label: "Genesis Hash", value: genesisHash.slice(0, 12) + "…", color: "text-violet-400", mono: true },
          { label: "Latest Hash",  value: latestHash.slice(0, 12) + "…", color: "text-emerald-400", mono: true },
        ].map(({ label, value, color, mono }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
            <p className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3 h-3" />{label}
            </p>
            <p className={`text-sm font-bold ${color} ${mono ? "font-mono" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Verify + Export */}
      <div className="flex items-center gap-3">
        <button
          onClick={verifyChain}
          disabled={verifying}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
        >
          {verifying
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying chain…</>
            : <><ShieldAlert className="w-3.5 h-3.5" /> Verify Hash Chain Integrity</>
          }
        </button>
        <a href="/api/security/agent-audit/export" download className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/8 text-white/40 text-xs font-semibold hover:bg-white/[0.06] transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export Ledger
        </a>
        <button onClick={fetchAudit} className="ml-auto text-white/20 hover:text-white/50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Verify result */}
      {verifyResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${verifyResult.chainValid ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-red-500/20 bg-red-500/[0.05]"}`}>
          {verifyResult.chainValid
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          }
          <div>
            <p className={`text-sm font-bold ${verifyResult.chainValid ? "text-emerald-400" : "text-red-400"}`}>
              {verifyResult.chainValid ? "Chain Integrity: VERIFIED ✓" : "TAMPER DETECTED ⚠"}
            </p>
            <p className="text-[10px] text-white/30">
              {verifyResult.entriesChecked} entries checked · {new Date(verifyResult.verifiedAt).toLocaleTimeString()} · NIST-MCP 2026 §7.1
            </p>
          </div>
        </div>
      )}

      {/* NIST info bar */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-500/15 bg-violet-500/[0.04]">
        <Terminal className="w-4 h-4 text-violet-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-violet-400">Decision Transparency — 2026 Legal Requirement</p>
          <p className="text-[10px] text-white/30">Every AI decision is hashed into this immutable chain. Each entry links to the previous, making retroactive modification cryptographically detectable. Owner PII is never accessible to any agent.</p>
        </div>
      </div>

      {/* Chain entries */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/6 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <HashChainLink key={entry.id} entry={entry} isFirst={idx === entries.length - 1} />
          ))}
          {/* Genesis block */}
          <div className="relative">
            <div className="absolute left-5 -top-3 h-3 flex flex-col items-center gap-0.5">
              {[0,1,2].map((i) => <div key={i} className="w-0.5 h-0.5 rounded-full bg-violet-500/30" />)}
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-500/15 bg-violet-500/[0.03]">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <GitBranch className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-400">Genesis Block</p>
                <p className="text-[9px] font-mono text-violet-400/40">{genesisHash}</p>
                <p className="text-[9px] text-white/20">NIST-MCP 2026 Chain Origin · 3C-ONYX-NIST-MCP-2026-GENESIS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
type Tab = "shield" | "transient" | "audit";

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>("shield");

  const tabs: { id: Tab; label: string; icon: React.ComponentType<any>; accent: string }[] = [
    { id: "shield",   label: "Encryption Shield",  icon: Lock,        accent: "text-emerald-400" },
    { id: "transient",label: "Transient Access",   icon: Key,         accent: "text-amber-400"   },
    { id: "audit",    label: "Agent Audit Trail",  icon: Terminal,    accent: "text-violet-400"  },
  ];

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Shield}
        accent="#10B981"
        title="NIST-MCP 2026 SECURITY LAYER"
        subtitle="AES-256-GCM · Transient Agent Access · Immutable Decision Ledger"
        badge={
          <div className="flex items-center gap-2">
            <span className="neural-badge neural-badge-green">NIST-MCP 2026 COMPLIANT</span>
            <span className="neural-badge neural-badge-violet">DECISION TRANSPARENCY ACT</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold">ENCRYPTION ACTIVE</span>
            </div>
          </div>
        }
      />

      <div className="p-6">
        {/* Security alert bar */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] mb-6">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-white/50">
            All PII is encrypted at rest with <span className="text-emerald-400 font-semibold">AES-256-GCM</span>.
            AI Agents operate under <span className="text-amber-400 font-semibold">Transient Access Tokens (15-min TTL)</span> and may never read owner identity.
            Every agent decision is chained into an <span className="text-violet-400 font-semibold">immutable SHA-256 audit ledger</span> per 2026 Decision Transparency requirements.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/6 mb-6 w-fit">
          {tabs.map(({ id, label, icon: Icon, accent }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === id ? "bg-white/8 text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab === id ? accent : ""}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "shield"    && <EncryptionShield />}
        {tab === "transient" && <TransientAccessPanel />}
        {tab === "audit"     && <AgentAuditTrailPanel />}
      </div>
    </div>
  );
}
