/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * ONYX Source — Sovereign Procurement Engine
 * ──────────────────────────────────────────
 * Concepts from PERSUIT + JusticeBid + Theorem + Lawcadia
 * translated into the 3C ONYX member experience.
 *
 * Member describes what they need.
 * ONYX sends it anonymously to the vetted network.
 * Vendors compete. ONYX AI scores every bid.
 * Member confirms one winner. Platform captures its fee.
 * Member never negotiates. Not even once.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gavel, Plus, Shield, ChevronRight, Clock, DollarSign,
  Star, CheckCircle2, XCircle, Lock, Eye, TrendingDown,
  FileText, Award, ArrowRight, Loader2, X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────
interface SourceRequest {
  id: number;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  budgetMinCents: number;
  budgetMaxCents: number;
  feeStructurePref: string;
  isAnonymous: boolean;
  deadline: string;
  status: "OPEN" | "IN_REVIEW" | "AWARDED" | "CLOSED";
  awardedBidId: number | null;
  platformFeeCents: number | null;
  aiTopBidId: number | null;
  aiSummary: string | null;
  bidCount: number;
  createdAt: string;
}

interface SourceBid {
  id: number;
  vendorName: string;
  proposalText: string;
  priceCents: number;
  feeStructure: string;
  deliveryDays: number;
  credentials: string | null;
  aiScore: number;
  aiReasoning: string;
  status: "PENDING" | "SHORTLISTED" | "AWARDED" | "REJECTED";
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);

const STATUS_COLORS: Record<string, string> = {
  OPEN:      "#10B981",
  IN_REVIEW: "#C9A227",
  AWARDED:   "#8B5CF6",
  CLOSED:    "rgba(255,255,255,0.3)",
};

const CATEGORIES = [
  { value: "VEHICLE_PURCHASE",   label: "Vehicle Purchase" },
  { value: "VEHICLE_TRANSPORT",  label: "Vehicle Transport" },
  { value: "VEHICLE_SERVICE",    label: "Vehicle Service" },
  { value: "VEHICLE_INSURANCE",  label: "Vehicle Insurance" },
  { value: "LEGAL_SERVICES",     label: "Legal Services" },
  { value: "FINANCIAL_SERVICES", label: "Financial Services" },
  { value: "CONCIERGE",          label: "Concierge" },
  { value: "OTHER",              label: "Other" },
];

// ── Score Color ────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#C9A227";
  return "#EF4444";
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OnyxSource() {
  const [view, setView]           = useState<"list" | "create" | "detail">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm]           = useState({
    category: "VEHICLE_PURCHASE", title: "", description: "",
    budgetMinCents: 0, budgetMaxCents: 0,
    feeStructurePref: "ANY", deadlineDays: 7, isAnonymous: true,
  });
  const qc      = useQueryClient();
  const { toast } = useToast();

  // Fetch all requests
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["source-requests"],
    queryFn: () => fetch("/api/source").then((r) => r.json()),
  });

  // Fetch single request with bids
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["source-detail", selectedId],
    queryFn: () => fetch(`/api/source/${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
  });

  // Create request
  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, budgetMinCents: body.budgetMinCents * 100, budgetMaxCents: body.budgetMaxCents * 100 }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["source-requests"] });
      setView("list");
      toast({ title: "Request sent to vetted network", description: "Vendors are now competing for your business." });
    },
  });

  // Award a bid
  const awardMutation = useMutation({
    mutationFn: ({ requestId, bidId }: { requestId: number; bidId: number }) =>
      fetch(`/api/source/${requestId}/award/${bidId}`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["source-requests"] });
      qc.invalidateQueries({ queryKey: ["source-detail", selectedId] });
      toast({
        title: "Vendor awarded",
        description: `Platform fee: ${fmt(data.platformFeeCents)} (3% — ONYX earned).`,
      });
    },
  });

  // ── List View ────────────────────────────────────────────────────────────
  if (view === "list") return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Gavel}
        accent="#C9A227"
        title="ONYX SOURCE"
        subtitle="Sovereign Procurement Engine · Vendors Compete · ONYX Recommends · You Confirm"
        badge={<span className="neural-badge neural-badge-orange">MEMBER ONLY</span>}
        actions={
          <button
            onClick={() => setView("create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-black text-xs font-black uppercase tracking-wider"
            style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)" }}
          >
            <Plus className="w-3.5 h-3.5" /> New Request
          </button>
        }
      />

      <div className="p-6">
        {/* How it works */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: FileText,    color: "#C9A227", label: "1. Describe",   desc: "Tell ONYX what you need" },
            { icon: Lock,        color: "#8B5CF6", label: "2. Anonymous",  desc: "Identity protected until you award" },
            { icon: TrendingDown,color: "#10B981", label: "3. Vendors Bid",desc: "Network competes for your business" },
            { icon: Award,       color: "#EF4444", label: "4. You Confirm",desc: "One tap. ONYX handles the rest." },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <p className="text-[11px] font-black text-white uppercase tracking-wider">{label}</p>
              <p className="text-[10px] text-white/35 mt-1">{desc}</p>
            </div>
          ))}
        </div>

        {/* Requests list */}
        <h2 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-3">Your Requests</h2>

        {listLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-white/30" />
          </div>
        )}

        {!listLoading && (!listData?.requests || listData.requests.length === 0) && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-12 text-center">
            <Gavel className="w-10 h-10 text-white/15 mx-auto mb-4" />
            <p className="text-sm font-bold text-white/40">No requests yet</p>
            <p className="text-xs text-white/20 mt-1 mb-5">Create your first sourcing request and let vendors compete for your business.</p>
            <button
              onClick={() => setView("create")}
              className="px-5 py-2.5 rounded-xl text-black text-xs font-black uppercase tracking-wider"
              style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)" }}
            >
              Create First Request
            </button>
          </div>
        )}

        <div className="space-y-3">
          {listData?.requests?.map((r: SourceRequest) => (
            <button
              key={r.id}
              onClick={() => { setSelectedId(r.id); setView("detail"); }}
              className="w-full text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5 rounded-full">{r.categoryLabel}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ color: STATUS_COLORS[r.status], border: `1px solid ${STATUS_COLORS[r.status]}40`, background: `${STATUS_COLORS[r.status]}10` }}>
                      {r.status.replace("_", " ")}
                    </span>
                    {r.isAnonymous && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 border border-violet-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> ANON
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white truncate">{r.title}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Budget: {fmt(r.budgetMaxCents)}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {r.bidCount} bid{r.bidCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(r.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Create View ──────────────────────────────────────────────────────────
  if (view === "create") return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Plus}
        accent="#C9A227"
        title="NEW SOURCE REQUEST"
        subtitle="Describe what you need — ONYX handles the rest"
        actions={
          <button onClick={() => setView("list")} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/50 text-xs font-bold">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        }
      />
      <div className="p-6 max-w-2xl mx-auto space-y-5">

        {/* Category */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                className="p-2.5 rounded-xl border text-[10px] font-bold text-center transition-all"
                style={{
                  borderColor: form.category === c.value ? "#C9A227" : "rgba(255,255,255,0.08)",
                  background:  form.category === c.value ? "rgba(201,162,39,0.1)" : "rgba(255,255,255,0.02)",
                  color:       form.category === c.value ? "#C9A227" : "rgba(255,255,255,0.5)",
                }}
              >{c.label}</button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Request Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Transport my 2024 Porsche 911 from Miami to LA"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-600/60"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Full Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            placeholder="Describe exactly what you need, any specific requirements, timeline, and preferences. The more detail, the better the bids you'll receive."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-600/60 resize-none"
          />
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Budget Floor ($)</label>
            <input
              type="number" min={0}
              value={form.budgetMinCents || ""}
              onChange={(e) => setForm((f) => ({ ...f, budgetMinCents: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-600/60"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Budget Ceiling ($)</label>
            <input
              type="number" min={1}
              value={form.budgetMaxCents || ""}
              onChange={(e) => setForm((f) => ({ ...f, budgetMaxCents: parseInt(e.target.value) || 0 }))}
              placeholder="10,000"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-600/60"
            />
          </div>
        </div>

        {/* Fee structure + Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Fee Structure Preference</label>
            <select
              value={form.feeStructurePref}
              onChange={(e) => setForm((f) => ({ ...f, feeStructurePref: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-yellow-600/60"
            >
              <option value="ANY">Any</option>
              <option value="FIXED">Fixed Price</option>
              <option value="HOURLY">Hourly</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Bid Deadline (Days)</label>
            <select
              value={form.deadlineDays}
              onChange={(e) => setForm((f) => ({ ...f, deadlineDays: parseInt(e.target.value) }))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-yellow-600/60"
            >
              {[1, 2, 3, 5, 7, 10, 14, 21, 30].map((d) => (
                <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-violet-400" /> Anonymous Request</p>
            <p className="text-[10px] text-white/40 mt-1">Vendors see your request but not your identity until you award a bid. Inspired by Theorem's anonymous bidding protocol.</p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, isAnonymous: !f.isAnonymous }))}
            className="w-12 h-6 rounded-full transition-all shrink-0"
            style={{ background: form.isAnonymous ? "#8B5CF6" : "rgba(255,255,255,0.1)" }}
          >
            <div className="w-4 h-4 rounded-full bg-white mx-1 transition-all"
              style={{ transform: form.isAnonymous ? "translateX(100%)" : "translateX(0)" }} />
          </button>
        </div>

        {/* Platform fee notice */}
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-yellow-500/60 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-white/60">ONYX Platform Fee: 3% on Award</p>
            <p className="text-[10px] text-white/30 mt-0.5">When you confirm a vendor, ONYX collects 3% of the winning bid. Members receive the best price. The platform is sustained. Ronald Cadet's family benefits. Always.</p>
          </div>
        </div>

        <button
          onClick={() => createMutation.mutate(form)}
          disabled={createMutation.isPending || !form.title || !form.description || !form.budgetMaxCents}
          className="w-full py-4 rounded-2xl text-black text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)", opacity: createMutation.isPending ? 0.6 : 1 }}
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Send to Vetted Network
        </button>
      </div>
    </div>
  );

  // ── Detail View — Side-by-Side Bid Comparison ────────────────────────────
  const req  = detailData?.request as SourceRequest | undefined;
  const bids = (detailData?.bids ?? []) as SourceBid[];
  const topBid = bids.find((b) => b.id === req?.aiTopBidId) ?? bids[0];

  return (
    <div className="h-full overflow-y-auto page-bg">
      <PageHeader
        icon={Gavel}
        accent="#C9A227"
        title={req?.title ?? "Loading…"}
        subtitle={req ? `${req.categoryLabel} · ${req.status.replace("_", " ")} · ${bids.length} bid${bids.length !== 1 ? "s" : ""}` : ""}
        actions={
          <button onClick={() => { setView("list"); setSelectedId(null); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/50 text-xs font-bold">
            <X className="w-3.5 h-3.5" /> Back
          </button>
        }
      />

      {detailLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      )}

      {!detailLoading && req && (
        <div className="p-6 space-y-6">

          {/* Request summary */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Budget Range</p>
              <p className="text-sm font-black text-white">{fmt(req.budgetMinCents)} — {fmt(req.budgetMaxCents)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Fee Preference</p>
              <p className="text-sm font-black text-white">{req.feeStructurePref}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Deadline</p>
              <p className="text-sm font-black text-white">{new Date(req.deadline).toLocaleDateString()}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Description</p>
              <p className="text-sm text-white/60 leading-relaxed">{req.description}</p>
            </div>
          </div>

          {/* ONYX AI Recommendation */}
          {topBid && req.status !== "CLOSED" && req.status !== "AWARDED" && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <p className="text-xs font-black text-yellow-400 uppercase tracking-wider">ONYX AI Recommends</p>
              </div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-black text-white">{topBid.vendorName}</p>
                  <p className="text-xs text-white/50 mt-1">{topBid.aiReasoning}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-black" style={{ color: scoreColor(topBid.aiScore) }}>{topBid.aiScore}</p>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">AI Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{fmt(topBid.priceCents)}</p>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">{topBid.feeStructure}</p>
                  </div>
                </div>
              </div>
              {req.status === "IN_REVIEW" && (
                <button
                  onClick={() => awardMutation.mutate({ requestId: req.id, bidId: topBid.id })}
                  disabled={awardMutation.isPending}
                  className="mt-4 w-full py-3 rounded-xl text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#C9A227,#8B6914)" }}
                >
                  {awardMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm This Vendor — ONYX Recommended
                </button>
              )}
            </div>
          )}

          {/* Awarded badge */}
          {req.status === "AWARDED" && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 flex items-center gap-3">
              <Award className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-sm font-black text-white">Vendor Awarded</p>
                <p className="text-[10px] text-white/40">Platform fee collected: {fmt(req.platformFeeCents ?? 0)} — ONYX earned.</p>
              </div>
            </div>
          )}

          {/* All Bids — Side by Side (PERSUIT concept) */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
              All Bids — Side by Side Comparison
              {req.isAnonymous && req.status !== "AWARDED" && (
                <span className="ml-2 text-violet-400/60">(Vendor identities protected until award)</span>
              )}
            </h2>

            {bids.length === 0 && (
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-10 text-center">
                <Clock className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/30">Waiting for bids from the vetted network</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bids.map((bid) => (
                <div key={bid.id}
                  className="rounded-2xl border p-4 flex flex-col"
                  style={{
                    borderColor: bid.id === req.awardedBidId ? "#8B5CF6" : bid.id === req.aiTopBidId ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.08)",
                    background:  bid.id === req.awardedBidId ? "rgba(139,92,246,0.05)" : bid.id === req.aiTopBidId ? "rgba(201,162,39,0.04)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Score badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/40">{bid.vendorName}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: `${scoreColor(bid.aiScore)}18`, color: scoreColor(bid.aiScore), border: `1px solid ${scoreColor(bid.aiScore)}40` }}>
                        {bid.aiScore}
                      </div>
                      {bid.id === req.aiTopBidId && <Star className="w-3 h-3 text-yellow-400" />}
                      {bid.id === req.awardedBidId && <CheckCircle2 className="w-3 h-3 text-violet-400" />}
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-xl font-black text-white mb-1">{fmt(bid.priceCents)}</p>
                  <p className="text-[10px] text-white/35 mb-3">{bid.feeStructure} · {bid.deliveryDays} day{bid.deliveryDays !== 1 ? "s" : ""}</p>

                  {/* Proposal preview */}
                  <p className="text-[11px] text-white/50 leading-relaxed flex-1 mb-3 line-clamp-4">{bid.proposalText}</p>

                  {/* AI reasoning */}
                  <p className="text-[10px] text-white/25 italic mb-4 line-clamp-2">{bid.aiReasoning}</p>

                  {/* Award button */}
                  {req.status === "IN_REVIEW" && bid.id !== req.awardedBidId && (
                    <button
                      onClick={() => awardMutation.mutate({ requestId: req.id, bidId: bid.id })}
                      disabled={awardMutation.isPending}
                      className="w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Select This Vendor
                    </button>
                  )}

                  {bid.id === req.awardedBidId && (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-violet-400"
                      style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
                      <Award className="w-3 h-3" /> Awarded
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
