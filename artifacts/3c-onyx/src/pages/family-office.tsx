/**
 * 3C ONYX — Family Office Governance Engine
 * AI-powered charter alignment, trust structure recommendations,
 * and asset integration for sovereign wealth governance.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Building2, ShieldCheck, TrendingUp, Layers, Zap,
  Plus, Trash2, ChevronRight, AlertTriangle, CheckCircle2,
  Landmark, RefreshCw, PenLine, Save, X, FileText,
  DollarSign, BarChart3, Lock
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMission {
  id: number;
  familyName: string;
  missionStatement: string;
  pillarOne?: string; pillarOneDesc?: string;
  pillarTwo?: string; pillarTwoDesc?: string;
  pillarThree?: string; pillarThreeDesc?: string;
  coreValues?: string;
}

interface TrustStructure {
  recommendation: string;
  rationale: string;
  taxAdvantage: string;
}

interface GovernanceAnalysis {
  analysisId: number;
  alignmentScore: number;
  alignmentRationale: string;
  charterConflicts: string[];
  trustGuardrail: string;
  charterIntegration: string;
  trustStructure: TrustStructure;
  officeExecutionSteps: string[];
  provider: string;
}

interface StoredAnalysis {
  id: number;
  proposedAction: string;
  assetName?: string;
  assetType?: string;
  alignmentScore?: string;
  trustStructure?: string;
  analyzedAt: string;
}

interface FamilyAsset {
  id: number;
  name: string;
  assetType: string;
  estimatedValue?: string;
  trustStructure?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 8) return "#34D399";
  if (s >= 5) return "#C9A227";
  return "#F87171";
}

function scoreLabel(s: number): string {
  if (s >= 9) return "ALIGNED";
  if (s >= 7) return "STRONG";
  if (s >= 5) return "MODERATE";
  if (s >= 3) return "CAUTION";
  return "CONFLICT";
}

function fmtMoney(v?: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (isNaN(n)) return v;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const ASSET_TYPES = [
  { value: "real_estate",  label: "Real Estate" },
  { value: "business",     label: "Business / Startup" },
  { value: "investment",   label: "Investment / Securities" },
  { value: "vehicle",      label: "Vehicle / Automotive" },
  { value: "art",          label: "Art / Collectibles" },
  { value: "crypto",       label: "Digital Assets" },
  { value: "other",        label: "Other" },
];

const TRUST_COLORS: Record<string, string> = {
  "Dynasty Trust":      "#C9A227",
  "Irrevocable Trust":  "#60A5FA",
  "LLC":                "#8B5CF6",
  "GRAT":               "#34D399",
  "S-Corp":             "#F97316",
  "FLP":                "#EC4899",
};

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const fill = (score / 10) * circ;
  const color = scoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color, lineHeight: 1 }}>{score}</span>
        <span className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>/ 10</span>
        <span className="text-[8px] font-black tracking-widest mt-1" style={{ color }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ["Governance Engine", "Asset Registry", "Analysis History"] as const;
type Tab = typeof TABS[number];

export default function FamilyOfficePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Governance Engine");
  const [mission, setMission] = useState<FamilyMission | null>(null);
  const [editingMission, setEditingMission] = useState(false);
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [assets, setAssets] = useState<FamilyAsset[]>([]);
  const [missionDraft, setMissionDraft] = useState<Partial<FamilyMission>>({});
  const [analysis, setAnalysis] = useState<GovernanceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savingMission, setSavingMission] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);

  // Governance form
  const [proposedAction, setProposedAction] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("real_estate");
  const [assetValue, setAssetValue] = useState("");

  // Asset form
  const [newAsset, setNewAsset] = useState<Partial<FamilyAsset>>({ assetType: "real_estate", status: "active" });

  const fetchMission = useCallback(async () => {
    const r = await fetch(`${BASE}api/family-office/mission`);
    const data = await r.json() as { mission: FamilyMission | null };
    setMission(data.mission);
    if (data.mission) setMissionDraft(data.mission);
  }, []);

  const fetchAnalyses = useCallback(async () => {
    const r = await fetch(`${BASE}api/family-office/analyses`);
    const data = await r.json() as { analyses: StoredAnalysis[] };
    setAnalyses(data.analyses);
  }, []);

  const fetchAssets = useCallback(async () => {
    const r = await fetch(`${BASE}api/family-office/assets`);
    const data = await r.json() as { assets: FamilyAsset[] };
    setAssets(data.assets);
  }, []);

  useEffect(() => {
    fetchMission();
    fetchAnalyses();
    fetchAssets();
  }, [fetchMission, fetchAnalyses, fetchAssets]);

  async function saveMission() {
    setSavingMission(true);
    const token = localStorage.getItem("onyxToken");
    await fetch(`${BASE}api/family-office/mission`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(missionDraft),
    });
    await fetchMission();
    setEditingMission(false);
    setSavingMission(false);
  }

  async function runAnalysis() {
    if (!proposedAction.trim()) return;
    if (!mission?.missionStatement.trim()) {
      setAnalysisError("Please save your Family Mission Statement first.");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisError(null);
    const token = localStorage.getItem("onyxToken");
    try {
      const r = await fetch(`${BASE}api/family-office/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          missionStatement: mission.missionStatement,
          proposedAction,
          assetName:   assetName   || undefined,
          assetType:   assetType   || undefined,
          assetValue:  assetValue  || undefined,
          missionId:   mission.id,
        }),
      });
      const data = await r.json() as GovernanceAnalysis & { error?: string };
      if (!r.ok || data.error) throw new Error(data.error ?? "Analysis failed.");
      setAnalysis(data);
      fetchAnalyses();
    } catch (e) {
      setAnalysisError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function addAsset() {
    if (!newAsset.name?.trim()) return;
    const token = localStorage.getItem("onyxToken");
    await fetch(`${BASE}api/family-office/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(newAsset),
    });
    setNewAsset({ assetType: "real_estate", status: "active" });
    setAddingAsset(false);
    fetchAssets();
  }

  async function removeAsset(id: number) {
    const token = localStorage.getItem("onyxToken");
    await fetch(`${BASE}api/family-office/assets/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setAssets(prev => prev.filter(a => a.id !== id));
  }

  const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.estimatedValue ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ── Hero Header ── */}
      <div
        className="relative px-6 pt-10 pb-8 border-b border-white/5"
        style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.07) 0%, rgba(0,0,0,0) 60%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)" }}>
                  <Building2 className="w-5 h-5 text-[#C9A227]" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.25em] text-[#C9A227] opacity-70 uppercase">3C ONYX · SOVEREIGN WEALTH</p>
                  <h1 className="text-2xl font-black tracking-tight">
                    {mission?.familyName ?? "Family Office"}{" "}
                    <span className="text-[#C9A227]">Governance Engine</span>
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-400 max-w-xl">
                AI-powered charter alignment · Dynasty Trust structuring · Multi-generational asset protection
              </p>
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "ASSETS", value: assets.length, icon: <Landmark className="w-3.5 h-3.5" />, color: "#C9A227" },
                { label: "TOTAL VALUE", value: fmtMoney(String(totalAssetValue)), icon: <DollarSign className="w-3.5 h-3.5" />, color: "#34D399" },
                { label: "ANALYSES", value: analyses.length, icon: <BarChart3 className="w-3.5 h-3.5" />, color: "#60A5FA" },
              ].map(s => (
                <div key={s.label} className="text-center px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: s.color }}>
                    {s.icon}
                    <span className="text-sm font-black">{s.value}</span>
                  </div>
                  <p className="text-[9px] font-bold tracking-widest text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Mission Statement Card ── */}
        <div className="rounded-2xl border border-[#C9A227]/20 bg-[#C9A227]/[0.03] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C9A227]" />
              <h2 className="text-sm font-black tracking-widest text-[#C9A227] uppercase">Family Charter</h2>
            </div>
            <button
              onClick={() => { setEditingMission(!editingMission); if (!editingMission && mission) setMissionDraft(mission); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#C9A227" }}
            >
              {editingMission ? <><X className="w-3 h-3" />Cancel</> : <><PenLine className="w-3 h-3" />Edit Charter</>}
            </button>
          </div>

          {editingMission ? (
            <div className="space-y-4">
              <input
                value={missionDraft.familyName ?? ""}
                onChange={e => setMissionDraft(p => ({ ...p, familyName: e.target.value }))}
                placeholder="Family / Office Name (e.g. The Johnson Family Office)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50"
              />
              <textarea
                value={missionDraft.missionStatement ?? ""}
                onChange={e => setMissionDraft(p => ({ ...p, missionStatement: e.target.value }))}
                placeholder="Family Mission Statement — e.g. 'We build generational wealth through disciplined stewardship, sovereign asset structures, and purpose-aligned investments that honor our legacy and protect our dynasty.'"
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50 resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["One", "Two", "Three"] as const).map((n, i) => (
                  <div key={n} className="space-y-2">
                    <input
                      value={(missionDraft as Record<string, string>)[`pillar${n}`] ?? ""}
                      onChange={e => setMissionDraft(p => ({ ...p, [`pillar${n}`]: e.target.value }))}
                      placeholder={`Pillar ${i + 1} Name (e.g. Preservation)`}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50"
                    />
                    <textarea
                      value={(missionDraft as Record<string, string>)[`pillar${n}Desc`] ?? ""}
                      onChange={e => setMissionDraft(p => ({ ...p, [`pillar${n}Desc`]: e.target.value }))}
                      placeholder={`Describe this pillar...`}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50 resize-none"
                    />
                  </div>
                ))}
              </div>
              <input
                value={missionDraft.coreValues ?? ""}
                onChange={e => setMissionDraft(p => ({ ...p, coreValues: e.target.value }))}
                placeholder="Core Values (comma-separated: Stewardship, Sovereignty, Growth, Legacy, Privacy)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50"
              />
              <button
                onClick={saveMission}
                disabled={savingMission || !missionDraft.missionStatement?.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "#C9A227", color: "#000" }}
              >
                <Save className="w-4 h-4" />
                {savingMission ? "Saving…" : "Save Charter"}
              </button>
            </div>
          ) : mission ? (
            <div className="space-y-5">
              <p className="text-base text-gray-200 leading-relaxed italic border-l-2 border-[#C9A227]/40 pl-4">
                "{mission.missionStatement}"
              </p>
              {(mission.pillarOne || mission.pillarTwo || mission.pillarThree) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: mission.pillarOne, desc: mission.pillarOneDesc, color: "#C9A227" },
                    { name: mission.pillarTwo, desc: mission.pillarTwoDesc, color: "#60A5FA" },
                    { name: mission.pillarThree, desc: mission.pillarThreeDesc, color: "#34D399" },
                  ].filter(p => p.name).map((p, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                        <p className="text-xs font-black tracking-wider" style={{ color: p.color }}>{p.name}</p>
                      </div>
                      {p.desc && <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>}
                    </div>
                  ))}
                </div>
              )}
              {mission.coreValues && (
                <div className="flex flex-wrap gap-2">
                  {mission.coreValues.split(",").map(v => v.trim()).filter(Boolean).map(v => (
                    <span key={v} className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider" style={{ background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.18)", color: "#C9A227" }}>{v}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No family charter yet.</p>
              <p className="text-gray-600 text-xs mt-1">Click "Edit Charter" to define your mission statement and three pillars.</p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.02]">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-xs font-bold tracking-wide rounded-lg transition-all"
              style={activeTab === tab
                ? { background: "#C9A227", color: "#000" }
                : { color: "rgba(255,255,255,0.4)" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1 — Governance Engine
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Governance Engine" && (
          <div className="space-y-6">

            {/* Analysis Form */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C9A227]" />
                <h3 className="text-sm font-black tracking-widest text-[#C9A227] uppercase">Governance Analysis</h3>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposed Action or Decision</label>
                <textarea
                  value={proposedAction}
                  onChange={e => setProposedAction(e.target.value)}
                  placeholder="Describe the proposed action or investment decision... e.g. 'Acquire a 12-unit commercial apartment building in Atlanta, GA for $4.2M using DSCR financing, to be managed by a third-party property management company.'"
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50 resize-none"
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Asset Details (Optional — enables Trust Structure recommendation)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                    placeholder="Asset Name"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50"
                  />
                  <select
                    value={assetType}
                    onChange={e => setAssetType(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227]/50"
                  >
                    {ASSET_TYPES.map(t => <option key={t.value} value={t.value} className="bg-black">{t.label}</option>)}
                  </select>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="number"
                      value={assetValue}
                      onChange={e => setAssetValue(e.target.value)}
                      placeholder="Estimated Value"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50"
                    />
                  </div>
                </div>
              </div>

              {analysisError && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {analysisError}
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={analyzing || !proposedAction.trim() || !mission}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wider transition-all disabled:opacity-40"
                style={{ background: analyzing ? "rgba(201,162,39,0.2)" : "#C9A227", color: "#000" }}
              >
                {analyzing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />ONYX Neural Analyzing…</>
                ) : (
                  <><Zap className="w-4 h-4" />RUN GOVERNANCE ANALYSIS</>
                )}
              </button>
              {!mission && (
                <p className="text-xs text-yellow-500/70">↑ Save your Family Charter first to enable AI analysis.</p>
              )}
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-4 animate-in fade-in duration-500">

                {/* Score + Summary */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex-shrink-0">
                      <ScoreRing score={analysis.alignmentScore} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-black tracking-widest text-gray-500 uppercase mb-1">Alignment Score</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{analysis.alignmentRationale}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: scoreColor(analysis.alignmentScore) }} />
                        <span className="text-xs font-bold" style={{ color: scoreColor(analysis.alignmentScore) }}>
                          {scoreLabel(analysis.alignmentScore)} CHARTER ALIGNMENT
                        </span>
                        <span className="text-[10px] text-gray-600 ml-2">Powered by ONYX Neural ({analysis.provider})</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Charter Conflicts */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <p className="text-xs font-black tracking-widest text-yellow-500 uppercase">Charter Conflicts</p>
                    </div>
                    {analysis.charterConflicts.length === 0 ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">No charter conflicts identified.</span>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {analysis.charterConflicts.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-yellow-500 font-bold flex-shrink-0">↳</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Trust Guardrail */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#60A5FA]" />
                      <p className="text-xs font-black tracking-widest text-[#60A5FA] uppercase">Trust Guardrail</p>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{analysis.trustGuardrail}</p>
                    <p className="text-[10px] text-gray-500">Add this condition to your Trust document to reduce risk.</p>
                  </div>

                  {/* Charter Integration */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                      <p className="text-xs font-black tracking-widest text-[#34D399] uppercase">Charter Integration</p>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{analysis.charterIntegration}</p>
                  </div>

                  {/* Trust Structure */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#C9A227]" />
                      <p className="text-xs font-black tracking-widest text-[#C9A227] uppercase">Recommended Structure</p>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-black tracking-wider"
                        style={{
                          background: `${TRUST_COLORS[analysis.trustStructure.recommendation] ?? "#C9A227"}15`,
                          border: `1px solid ${TRUST_COLORS[analysis.trustStructure.recommendation] ?? "#C9A227"}40`,
                          color: TRUST_COLORS[analysis.trustStructure.recommendation] ?? "#C9A227",
                        }}
                      >
                        {analysis.trustStructure.recommendation}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{analysis.trustStructure.rationale}</p>
                    {analysis.trustStructure.taxAdvantage && (
                      <div className="flex items-start gap-1.5 text-xs text-emerald-400/80 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5">
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {analysis.trustStructure.taxAdvantage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Office Execution Steps */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#A78BFA]" />
                    <p className="text-xs font-black tracking-widest text-[#A78BFA] uppercase">Office Execution — First 3 Steps</p>
                  </div>
                  <div className="space-y-3">
                    {analysis.officeExecutionSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#A78BFA" }}>
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save to Asset Registry CTA */}
                {assetName && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("onyxToken");
                      await fetch(`${BASE}api/family-office/assets`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({
                          name: assetName,
                          assetType,
                          estimatedValue: assetValue || undefined,
                          trustStructure: analysis.trustStructure.recommendation,
                          analysisId: analysis.analysisId,
                        }),
                      });
                      fetchAssets();
                      setActiveTab("Asset Registry");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border"
                    style={{ borderColor: "rgba(201,162,39,0.25)", color: "#C9A227", background: "rgba(201,162,39,0.05)" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add "{assetName}" to Asset Registry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2 — Asset Registry
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Asset Registry" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black tracking-widest text-[#C9A227] uppercase">Sovereign Asset Registry</h3>
              <button
                onClick={() => setAddingAsset(!addingAsset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.25)", color: "#C9A227" }}
              >
                {addingAsset ? <><X className="w-3 h-3" />Cancel</> : <><Plus className="w-3 h-3" />Add Asset</>}
              </button>
            </div>

            {addingAsset && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <p className="text-xs font-black tracking-widest text-gray-400 uppercase">New Asset</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={newAsset.name ?? ""} onChange={e => setNewAsset(p => ({ ...p, name: e.target.value }))} placeholder="Asset Name *" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50" />
                  <select value={newAsset.assetType ?? "real_estate"} onChange={e => setNewAsset(p => ({ ...p, assetType: e.target.value }))} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227]/50">
                    {ASSET_TYPES.map(t => <option key={t.value} value={t.value} className="bg-black">{t.label}</option>)}
                  </select>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="number" value={newAsset.estimatedValue ?? ""} onChange={e => setNewAsset(p => ({ ...p, estimatedValue: e.target.value }))} placeholder="Estimated Value" className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50" />
                  </div>
                  <input value={newAsset.trustStructure ?? ""} onChange={e => setNewAsset(p => ({ ...p, trustStructure: e.target.value }))} placeholder="Trust Structure (e.g. Dynasty Trust)" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50" />
                  <input value={newAsset.notes ?? ""} onChange={e => setNewAsset(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="sm:col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/50" />
                </div>
                <button onClick={addAsset} disabled={!newAsset.name?.trim()} className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: "#C9A227", color: "#000" }}>
                  Add to Registry
                </button>
              </div>
            )}

            {assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Landmark className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-400 text-sm">No assets in your registry yet.</p>
                <p className="text-gray-600 text-xs mt-1">Add assets manually or let the Governance Engine add them after analysis.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map(asset => {
                  const tc = TRUST_COLORS[asset.trustStructure ?? ""] ?? "#C9A227";
                  return (
                    <div key={asset.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${tc}12`, border: `1px solid ${tc}25` }}>
                        <Landmark className="w-4 h-4" style={{ color: tc }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">{asset.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: tc, borderColor: `${tc}40`, background: `${tc}10` }}>
                            {asset.trustStructure ?? ASSET_TYPES.find(t => t.value === asset.assetType)?.label ?? asset.assetType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{ASSET_TYPES.find(t => t.value === asset.assetType)?.label ?? asset.assetType}</span>
                          {asset.estimatedValue && <span className="text-xs font-bold text-emerald-400">{fmtMoney(asset.estimatedValue)}</span>}
                          {asset.notes && <span className="text-xs text-gray-500 truncate max-w-48">{asset.notes}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeAsset(asset.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-gray-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-xs text-gray-500 font-medium">{assets.length} assets · Total Portfolio</span>
                  <span className="text-sm font-black text-emerald-400">{fmtMoney(String(totalAssetValue))}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 3 — Analysis History
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "Analysis History" && (
          <div className="space-y-3">
            <h3 className="text-sm font-black tracking-widest text-[#C9A227] uppercase">Governance Analysis History</h3>
            {analyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-400 text-sm">No analyses yet.</p>
                <p className="text-gray-600 text-xs mt-1">Run your first governance analysis in the Governance Engine tab.</p>
              </div>
            ) : (
              analyses.map(a => {
                const score = Number(a.alignmentScore ?? 0);
                const tc = TRUST_COLORS[a.trustStructure ?? ""] ?? "#C9A227";
                return (
                  <div key={a.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black" style={{ background: `${scoreColor(score)}12`, border: `1px solid ${scoreColor(score)}30`, color: scoreColor(score) }}>
                        {score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {a.assetName && <span className="text-xs font-bold text-white">{a.assetName}</span>}
                          {a.trustStructure && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border" style={{ color: tc, borderColor: `${tc}40`, background: `${tc}10` }}>
                              {a.trustStructure}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-600 ml-auto">
                            {new Date(a.analyzedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{a.proposedAction}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
