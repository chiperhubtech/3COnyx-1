/**
 * 3C ONYX — Wisdom Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * The Business Canon + LeanSpark Continuous Innovation Command Center.
 *
 * 15 foundational books. 7-dimension business model stress test.
 * PDCA sprint cycles. AI-powered wisdom queries.
 * Built for the next 1,000 years.
 *
 * CUXTOMCANDYCLUB LLC
 */

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen, Brain, Zap, Target, TrendingUp, Shield, Clock, Star,
  ChevronRight, RefreshCw, Send, CheckCircle2, AlertCircle, Circle,
  BarChart3, Lightbulb, Crown, Flame, ArrowRight, Activity,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookSummary {
  id: string;
  title: string;
  author: string;
  year: number;
  category: string;
  tagline: string;
  coreInsight: string;
  onyxApplication: string;
  color: string;
  principleCount: number;
}

interface DimensionScore {
  dimension: string;
  label: string;
  score: number;
  rating: "critical" | "weak" | "moderate" | "strong" | "exceptional";
  rationale: string;
  gaps: string[];
  evidence: string[];
}

interface StressTestResult {
  overallScore: number;
  overallRating: string;
  dimensions: DimensionScore[];
  topRisks: string[];
  nextActions: string[];
  generatedAt: string;
}

interface Sprint {
  id: string;
  cycleNumber: number;
  sprintNumber: number;
  assumption: string;
  successCriteria: string;
  experiment: string;
  status: "planning" | "running" | "checking" | "acting" | "complete";
  startDate: string;
  endDate: string;
  evidence: string[];
  outcome?: string;
  learnings?: string;
}

interface WisdomQueryResult {
  question: string;
  answer: string;
  principlesUsed: { id: string; title: string; bookId: string }[];
  provider: string;
  model: string;
  durationMs: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RATING_COLOR: Record<string, string> = {
  exceptional: "#C9A227",
  strong:      "#34D399",
  moderate:    "#60A5FA",
  weak:        "#F87171",
  critical:    "#EF4444",
};

const RATING_LABEL: Record<string, string> = {
  exceptional: "Exceptional",
  strong:      "Strong",
  moderate:    "Moderate",
  weak:        "Weak",
  critical:    "Critical",
};

const STATUS_ICON = {
  planning: <Circle size={14} className="text-gray-400" />,
  running:  <Activity size={14} className="text-yellow-400 animate-pulse" />,
  checking: <CheckCircle2 size={14} className="text-blue-400" />,
  acting:   <Zap size={14} className="text-onyx-gold" />,
  complete: <CheckCircle2 size={14} className="text-green-400" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  "Finance": "#C9A227",
  "Customer Relations": "#60A5FA",
  "Growth & Leadership": "#34D399",
  "Innovation": "#F87171",
  "Operations": "#F97316",
  "Management": "#A78BFA",
  "Strategy": "#7C3AED",
  "Product & Growth": "#10B981",
  "Innovation & Monopoly": "#EC4899",
  "Brand & Perseverance": "#EF4444",
  "Financial Literacy": "#14B8A6",
  "Success Psychology": "#F59E0B",
  "Business Model Validation": "#8B5CF6",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  const color =
    score >= 9 ? "#C9A227" :
    score >= 7 ? "#34D399" :
    score >= 5 ? "#60A5FA" :
    "#F87171";
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="#1a1a2e" strokeWidth={8} />
      <circle
        cx={45} cy={45} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 45 45)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x={45} y={49} textAnchor="middle" fill={color} fontSize={18} fontWeight={700}>
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

function DimensionCard({ dim }: { dim: DimensionScore }) {
  const [open, setOpen] = useState(false);
  const color = RATING_COLOR[dim.rating] ?? "#999";
  return (
    <div
      className="rounded-xl border cursor-pointer transition-all"
      style={{ borderColor: `${color}33`, background: "#0d0d1a" }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center gap-3 p-4">
        <ScoreArc score={dim.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{dim.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}22`, color }}>
              {RATING_LABEL[dim.rating]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{dim.rationale}</p>
        </div>
        <ChevronRight size={16} className="text-gray-500 shrink-0" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: `${color}22` }}>
          {dim.evidence.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1.5">Evidence</p>
              <ul className="space-y-1">
                {dim.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {dim.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1.5">Gaps to Close</p>
              <ul className="space-y-1">
                {dim.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookCard({ book }: { book: BookSummary }) {
  const [open, setOpen] = useState(false);
  const catColor = CATEGORY_COLOR[book.category] ?? "#C9A227";
  return (
    <div
      className="rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
      style={{ borderColor: `${book.color}55`, background: "#0d0d1a" }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: catColor }}>{book.category} · {book.year}</p>
            <h3 className="text-white font-bold text-sm leading-snug">{book.title}</h3>
            <p className="text-xs text-gray-400">{book.author}</p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${book.color}33` }}>
            <BookOpen size={18} style={{ color: catColor }} />
          </div>
        </div>
        <p className="text-xs text-gray-300 italic">"{book.tagline}"</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{book.principleCount} principles encoded</span>
          <ChevronRight size={14} className="text-gray-500" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>
      {open && (
        <div className="border-t p-4 space-y-3" style={{ borderColor: `${book.color}33` }}>
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-1">Core Insight</p>
            <p className="text-xs text-gray-400 leading-relaxed">{book.coreInsight}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: catColor }}>ONYX Application</p>
            <p className="text-xs text-gray-400 leading-relaxed">{book.onyxApplication}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SprintCard({ sprint }: { sprint: Sprint }) {
  const statusColor = {
    planning: "#9CA3AF",
    running: "#FCD34D",
    checking: "#60A5FA",
    acting: "#C9A227",
    complete: "#34D399",
  }[sprint.status] ?? "#9CA3AF";

  const daysLeft = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#2a2a4a", background: "#0d0d1a" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">SPRINT {sprint.sprintNumber}</span>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
            style={{ background: `${statusColor}22`, color: statusColor }}>
            {STATUS_ICON[sprint.status]}
            {sprint.status}
          </span>
        </div>
        <span className="text-xs text-gray-500">{daysLeft} days left</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-300 mb-1">Assumption Being Tested</p>
        <p className="text-xs text-gray-400 leading-relaxed">{sprint.assumption}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-green-400 mb-1">Success Criteria</p>
        <p className="text-xs text-gray-400">{sprint.successCriteria}</p>
      </div>
      {sprint.evidence.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-onyx-gold mb-1">Evidence Logged ({sprint.evidence.length})</p>
          <ul className="space-y-1">
            {sprint.evidence.map((e, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" /> {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WisdomEngine() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"stress-test" | "canon" | "sprints" | "query">("stress-test");
  const [question, setQuestion] = useState("");
  const [queryResult, setQueryResult] = useState<WisdomQueryResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const authHeaders = { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" };

  const { data: stressTest, isLoading: stLoading } = useQuery<StressTestResult>({
    queryKey: ["wisdom-stress-test"],
    queryFn: () => fetch(`${BASE}/api/wisdom/stress-test`).then(r => r.json()),
  });

  const { data: canon } = useQuery<{ books: BookSummary[]; totalBooks: number; totalPrinciples: number }>({
    queryKey: ["wisdom-canon"],
    queryFn: () => fetch(`${BASE}/api/wisdom/canon`).then(r => r.json()),
  });

  const { data: sprintsData } = useQuery<{ sprints: Sprint[]; cycleNumber: number }>({
    queryKey: ["wisdom-sprints"],
    queryFn: () => fetch(`${BASE}/api/wisdom/sprints`).then(r => r.json()),
  });

  const queryMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch(`${BASE}/api/wisdom/query`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ question: q }),
      });
      return res.json() as Promise<WisdomQueryResult>;
    },
    onSuccess: (data) => setQueryResult(data),
  });

  const categories = canon?.books
    ? ["All", ...new Set(canon.books.map(b => b.category))]
    : ["All"];

  const filteredBooks = canon?.books.filter(b =>
    selectedCategory === "All" || b.category === selectedCategory
  ) ?? [];

  type TabId = "stress-test" | "canon" | "sprints" | "query";
  interface TabConfig {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
  const TABS: TabConfig[] = [
    { id: "stress-test", label: "7-Dimension Score",   icon: BarChart3 },
    { id: "canon",       label: "Business Canon",       icon: BookOpen  },
    { id: "sprints",     label: "Validation Sprints",   icon: Target    },
    { id: "query",       label: "Ask Wisdom Engine",    icon: Brain     },
  ];

  return (
    <div className="min-h-screen bg-[#080810] text-white pb-20">
      <PageHeader
        title="Wisdom Engine"
        subtitle="Business Canon · LeanSpark Continuous Innovation · Built for 1,000 Years"
        icon={Brain}
      />

      {/* Summary Banner */}
      <div className="px-4 mb-6">
        <div className="rounded-2xl border p-5" style={{ borderColor: "#2a1a5a", background: "linear-gradient(135deg, #0d0d2a 0%, #1a0d3a 100%)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Crown size={20} className="text-onyx-gold" />
            <div>
              <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">ONYX Intelligence Foundation</p>
              <p className="text-white font-bold">15 Books · 50+ Principles · 7 Validation Dimensions</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: "#12122a" }}>
              <p className="text-2xl font-black text-onyx-gold">15</p>
              <p className="text-xs text-gray-400">Books Encoded</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "#12122a" }}>
              <p className="text-2xl font-black" style={{ color: stressTest?.overallScore && stressTest.overallScore >= 8 ? "#34D399" : "#F87171" }}>
                {stressTest?.overallScore?.toFixed(1) ?? "—"}
              </p>
              <p className="text-xs text-gray-400">Model Score /10</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: "#12122a" }}>
              <p className="text-2xl font-black text-blue-400">
                {sprintsData?.sprints.filter(s => s.status === "running" || s.status === "planning").length ?? 0}
              </p>
              <p className="text-xs text-gray-400">Active Sprints</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shrink-0"
              style={activeTab === tab.id
                ? { background: "#C9A22722", color: "#C9A227", border: "1px solid #C9A22744" }
                : { background: "#12122a", color: "#9CA3AF", border: "1px solid #2a2a4a" }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stress Test Tab ──────────────────────────────────────────────────── */}
      {activeTab === "stress-test" && (
        <div className="px-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={18} className="text-onyx-gold" />
            <div>
              <h2 className="font-bold text-white">LeanSpark 7-Dimension Business Model Stress Test</h2>
              <p className="text-xs text-gray-400">Live assessment of 3C ONYX's business model health</p>
            </div>
          </div>

          {stLoading ? (
            <div className="text-center py-12">
              <RefreshCw size={24} className="text-onyx-gold animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Computing stress test…</p>
            </div>
          ) : stressTest ? (
            <>
              {/* Overall */}
              <div className="rounded-2xl border p-5 flex items-center gap-5" style={{ borderColor: "#C9A22733", background: "#0d0d1a" }}>
                <ScoreArc score={stressTest.overallScore} />
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Overall Score</p>
                  <p className="text-3xl font-black text-onyx-gold">{stressTest.overallScore.toFixed(1)} <span className="text-base font-normal text-gray-400">/ 10</span></p>
                  <p className="text-sm font-semibold" style={{ color: RATING_COLOR[stressTest.overallRating] ?? "#C9A227" }}>
                    {RATING_LABEL[stressTest.overallRating] ?? stressTest.overallRating}
                  </p>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                {stressTest.dimensions.map(dim => (
                  <DimensionCard key={dim.dimension} dim={dim} />
                ))}
              </div>

              {/* Top Risks */}
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#EF444433", background: "#0d0d1a" }}>
                <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle size={15} /> Top Risks
                </p>
                <ul className="space-y-1.5">
                  {stressTest.topRisks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-red-400 font-bold shrink-0">{i + 1}.</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Actions */}
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#34D39933", background: "#0d0d1a" }}>
                <p className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <Zap size={15} /> Next Actions
                </p>
                <ul className="space-y-1.5">
                  {stressTest.nextActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <ArrowRight size={12} className="text-green-400 mt-0.5 shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Assessment generated {new Date(stressTest.generatedAt).toLocaleString()} · LeanSpark Continuous Innovation Framework
              </p>
            </>
          ) : null}
        </div>
      )}

      {/* ── Business Canon Tab ────────────────────────────────────────────────── */}
      {activeTab === "canon" && (
        <div className="px-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={18} className="text-onyx-gold" />
            <div>
              <h2 className="font-bold text-white">The Business Canon</h2>
              <p className="text-xs text-gray-400">
                {canon?.totalBooks ?? 15} books · {canon?.totalPrinciples ?? "50+"} principles encoded into every AI agent decision
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                style={selectedCategory === cat
                  ? { background: "#C9A22722", color: "#C9A227", border: "1px solid #C9A22744" }
                  : { background: "#12122a", color: "#9CA3AF", border: "1px solid #2a2a4a" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading Business Canon…</p>
            </div>
          )}
        </div>
      )}

      {/* ── Sprints Tab ───────────────────────────────────────────────────────── */}
      {activeTab === "sprints" && (
        <div className="px-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} className="text-onyx-gold" />
            <div>
              <h2 className="font-bold text-white">Validation Sprint Cycles</h2>
              <p className="text-xs text-gray-400">Cycle 1 · 90 days · 6 sprints of 14 days each · PDCA methodology</p>
            </div>
          </div>

          {/* PDCA Legend */}
          <div className="rounded-xl border p-4" style={{ borderColor: "#2a2a4a", background: "#0d0d1a" }}>
            <p className="text-xs font-bold text-gray-300 mb-3">PDCA Sprint Cycle</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { letter: "P", label: "Plan", desc: "Identify riskiest assumption, design experiment", color: "#9CA3AF" },
                { letter: "D", label: "Do", desc: "Run the experiment, gather evidence", color: "#FCD34D" },
                { letter: "C", label: "Check", desc: "Analyze results vs. success criteria", color: "#60A5FA" },
                { letter: "A", label: "Act", desc: "Persevere, Pivot, or Pause", color: "#C9A227" },
              ].map(step => (
                <div key={step.letter} className="rounded-lg p-2" style={{ background: "#12122a" }}>
                  <p className="text-xl font-black" style={{ color: step.color }}>{step.letter}</p>
                  <p className="text-xs font-bold text-gray-300">{step.label}</p>
                  <p className="text-xs text-gray-500 hidden sm:block">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint Cards */}
          {sprintsData?.sprints.map(sprint => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}

          {!sprintsData && (
            <div className="text-center py-12">
              <RefreshCw size={24} className="text-onyx-gold animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading validation sprints…</p>
            </div>
          )}
        </div>
      )}

      {/* ── Ask the Wisdom Engine Tab ─────────────────────────────────────────── */}
      {activeTab === "query" && (
        <div className="px-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={18} className="text-onyx-gold" />
            <div>
              <h2 className="font-bold text-white">Ask the Wisdom Engine</h2>
              <p className="text-xs text-gray-400">
                AI-powered answers grounded in 15 foundational business books and applied to 3C ONYX
              </p>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {[
                "How should ONYX position itself against CarMax?",
                "What is ONYX's riskiest assumption right now?",
                "How do we maximize the K-Factor flywheel?",
                "How should Ron approach creator outreach conversations?",
                "What does Blue Ocean Strategy say about ONYX's positioning?",
                "How do we build trust with underserved communities first?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ background: "#12122a", color: "#9CA3AF", border: "1px solid #2a2a4a" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input */}
          <div className="rounded-xl border p-4" style={{ borderColor: "#C9A22733", background: "#0d0d1a" }}>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the Wisdom Engine anything about 3C ONYX strategy, growth, operations, or positioning…"
              rows={3}
              className="w-full bg-transparent text-white text-sm resize-none outline-none placeholder:text-gray-600"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#2a2a4a" }}>
              <p className="text-xs text-gray-500">Powered by 15 foundational books + AI reasoning</p>
              <button
                onClick={() => question.trim().length >= 5 && queryMutation.mutate(question.trim())}
                disabled={queryMutation.isPending || question.trim().length < 5}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: question.trim().length >= 5 ? "#C9A22722" : "#1a1a2e",
                  color: question.trim().length >= 5 ? "#C9A227" : "#4a4a6a",
                  border: "1px solid",
                  borderColor: question.trim().length >= 5 ? "#C9A22744" : "#2a2a4a",
                }}
              >
                {queryMutation.isPending ? (
                  <><RefreshCw size={14} className="animate-spin" /> Thinking…</>
                ) : (
                  <><Send size={14} /> Ask</>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          {queryResult && (
            <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: "#C9A22733", background: "#0d0d1a" }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-onyx-gold" />
                <p className="text-sm font-bold text-white">Wisdom Engine Response</p>
                <span className="text-xs text-gray-500 ml-auto">{queryResult.provider} · {queryResult.durationMs}ms</span>
              </div>
              <p className="text-xs text-gray-400 italic border-l-2 pl-3" style={{ borderColor: "#C9A227" }}>"{queryResult.question}"</p>
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{queryResult.answer}</div>
              {queryResult.principlesUsed.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1">
                    <BookOpen size={11} /> Principles referenced
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {queryResult.principlesUsed.map(p => (
                      <span key={p.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1a1a2e", color: "#C9A227", border: "1px solid #C9A22733" }}>
                        {p.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {queryMutation.isError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
              Wisdom Engine query failed. Ensure you are logged in.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
