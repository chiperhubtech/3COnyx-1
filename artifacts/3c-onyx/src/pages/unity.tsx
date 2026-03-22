import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Sparkles, Scan, Zap, Star, MapPin, AlertTriangle, CheckCircle,
  Building2, User, TrendingUp, ArrowRight, Shield, RefreshCw,
  MessageSquare, Car, Award, ChevronRight, Send, Wifi, BarChart3,
  DollarSign, Truck, Activity, FlameKindling,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const CORRIDOR_STOPS = [
  "Hunts Point", "Manhattan", "Jersey City", "Newark",
  "Philadelphia", "Wilmington", "Baltimore", "DC",
  "Stamford", "New Haven", "Providence", "Boston",
];

const MEMBER_TAGS = ["Lightning Fast", "White Glove", "Premium Grade", "Communicative", "Punctual", "Trustworthy"];
const SHOP_TAGS   = ["Respectful", "On Time", "Diagnostic Precision", "Fair Pricing", "Certified Work", "Best-In-Class"];

const SIGNUP_NAMES = ["M. Harrington", "D. Castillo", "P. Rao", "A. Chen", "N. Osei", "B. Kovacs", "T. Santos", "K. Walsh", "R. Pierce", "J. Nakamura"];

const SEV_COLOR: Record<string, string> = { CRITICAL: "#EF4444", WARNING: "#F59E0B", INFO: "#3B82F6" };
const BADGE_COLOR: Record<string, string> = { platinum: "#E5E7EB", gold: "#C9A227", silver: "#9CA3AF" };

type Tab = "scan" | "split" | "mesh" | "concierge";

export default function Unity() {
  const [tab, setTab] = useState<Tab>("scan");

  // ── Ticker ────────────────────────────────────────────────────────────────────
  const [tickerMrr, setTickerMrr]         = useState(847800);
  const [tickerSignups, setTickerSignups] = useState(8564);
  const [tickerFlash, setTickerFlash]     = useState(false);
  const [lastSignup, setLastSignup]       = useState("");

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerMrr(p => p + 99);
      setTickerSignups(p => p + 1);
      setLastSignup(SIGNUP_NAMES[Math.floor(Math.random() * SIGNUP_NAMES.length)]);
      setTickerFlash(true);
      setTimeout(() => setTickerFlash(false), 1400);
    }, 9000);
    return () => clearInterval(iv);
  }, []);

  const arr           = tickerMrr * 12;
  const hectocornPct  = ((arr / 100_000_000) * 100).toFixed(3);

  // ── Scan ──────────────────────────────────────────────────────────────────────
  const [scanning, setScanning]           = useState(false);
  const [scanResult, setScanResult]       = useState<any>(null);
  const [scanStep, setScanStep]           = useState(0);
  const [deployingMesh, setDeployingMesh] = useState(false);
  const [meshDeployed, setMeshDeployed]   = useState(false);

  const SCAN_STEPS = ["Connecting V2X mesh…", "Reading OBD telemetry…", "Running Gemini AI diagnostics…", "Matching wholesale specialist…", "Calculating Ignorance Tax…"];

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    setMeshDeployed(false);
    setScanStep(0);
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStep(i);
      await new Promise(r => setTimeout(r, 420));
    }
    try {
      const res  = await fetch(`${BASE}/api/unity/scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setScanResult(data);
    } catch { /* fallback shown */ }
    setScanning(false);
  };

  const deployMesh = async () => {
    setDeployingMesh(true);
    await new Promise(r => setTimeout(r, 2400));
    setDeployingMesh(false);
    setMeshDeployed(true);
    setTimeout(() => setTab("split"), 1200);
  };

  // ── Split ─────────────────────────────────────────────────────────────────────
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnResult, setTxnResult]   = useState<any>(null);
  const [splitStep, setSplitStep]   = useState(0);

  const triggerTransaction = async () => {
    setTxnLoading(true);
    setTxnResult(null);
    setSplitStep(0);
    await new Promise(r => setTimeout(r, 1600));
    try {
      const res  = await fetch(`${BASE}/api/unity/transaction`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: scanResult?.vehicle?.id }),
      });
      const data = await res.json();
      setTxnResult(data);
      for (let i = 1; i <= 4; i++) {
        await new Promise(r => setTimeout(r, 550));
        setSplitStep(i);
      }
    } catch { /* */ }
    setTxnLoading(false);
  };

  // ── Mesh (Rating) ─────────────────────────────────────────────────────────────
  const [memberStars, setMemberStars]         = useState(0);
  const [shopStars, setShopStars]             = useState(0);
  const [memberTags, setMemberTags]           = useState<string[]>([]);
  const [shopTags, setShopTags]               = useState<string[]>([]);
  const [memberDone, setMemberDone]           = useState(false);
  const [shopDone, setShopDone]               = useState(false);
  const [meshComplete, setMeshComplete]       = useState(false);
  const [meshRatingData, setMeshRatingData]   = useState<any>(null);

  const submitRating = async (dir: "member_to_shop" | "shop_to_member", stars: number, tags: string[]) => {
    const res  = await fetch(`${BASE}/api/unity/rate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: dir, stars, tags }),
    });
    const data = await res.json();
    if (dir === "member_to_shop") { setMemberDone(true); setMeshRatingData(data); }
    else                          { setShopDone(true); }
  };

  useEffect(() => {
    if (memberDone && shopDone) setTimeout(() => setMeshComplete(true), 600);
  }, [memberDone, shopDone]);

  // ── Concierge ─────────────────────────────────────────────────────────────────
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Good evening. I'm your 3C Onyx Concierge — architect of your automotive empire. The Unity corridor is live from Hunts Point, Bronx to Boston Seaport. Fifty ultra-premium vehicles. Twenty verified specialists. What intelligence can I provide tonight?" },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    setChatHistory(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res  = await fetch(`${BASE}/api/gemini/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          systemPrompt: "You are the 3C Onyx Concierge — a sophisticated automotive architect with the precision of a Swiss watchmaker and the authority of a private banker. The Unity corridor spans Hunts Point, Bronx to Boston Seaport: 50 ultra-premium vehicles, 20 BGC-verified specialists, 218 miles of I-95. Speak with authority, brevity, and luxury-tier precision. Never say you are an AI. You are The Concierge.",
        }),
      });
      const data = await res.json();
      setChatHistory(p => [...p, { role: "ai", text: data.reply ?? data.message ?? "The mesh is processing. Intelligence incoming." }]);
    } catch {
      setChatHistory(p => [...p, { role: "ai", text: "The Unity mesh is processing. I'll have intelligence for you momentarily." }]);
    }
    setChatLoading(false);
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "scan",      label: "Guardian Scan",    icon: Scan },
    { id: "split",     label: "Dynasty Split",    icon: Zap },
    { id: "mesh",      label: "Integrity Mesh",   icon: Award },
    { id: "concierge", label: "Concierge",        icon: MessageSquare },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: "linear-gradient(170deg, #06050a 0%, #07080e 100%)" }}>
      <PageHeader
        icon={Sparkles}
        title="UNITY"
        subtitle="Hunts Point → Boston Seaport  ·  50 Vehicles  ·  20 Verified Partners  ·  218 mi Corridor"
        accent="#C9A227"
        badge="INVESTOR DEMO"
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981" }}>
              <Wifi size={10} />UNITY ENGINE LIVE
            </span>
          </div>
        }
      />

      <div className="p-6 space-y-5">

        {/* ── HECTOCORN TICKER ───────────────────────────────────────────────── */}
        <div style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0.03) 100%)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 16, padding: "20px 24px" }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <FlameKindling size={18} style={{ color: "#C9A227" }} />
              <span style={{ color: "rgba(201,162,39,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em" }}>HECTOCORN TICKER</span>
              {lastSignup && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)", opacity: tickerFlash ? 1 : 0, transition: "opacity 0.4s" }}>
                  +$99 · {lastSignup} joined
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
              <Activity size={10} />LIVE · UPDATES EVERY 9s
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            {[
              { label: "MONTHLY RECURRING", value: fmt(tickerMrr), color: "#C9A227", sub: `${tickerSignups.toLocaleString()} subscribers × $99` },
              { label: "ANNUAL RUN RATE",   value: fmt(arr),       color: "#FBBF24", sub: "ARR projected" },
              { label: "HECTOCORN PROGRESS", value: `${hectocornPct}%`, color: "#10B981", sub: "toward $100M ARR" },
              { label: "CORRIDOR GMV",       value: "$32.8M+",     color: "#fff",    sub: "Unity corridor volume" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 26, fontWeight: 900, lineHeight: 1, transition: "color 0.3s", fontFamily: "'Barlow Condensed', sans-serif" }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, parseFloat(hectocornPct))}%`, background: "linear-gradient(90deg, #C9A227, #FBBF24)", borderRadius: 999, transition: "width 0.8s ease" }} />
            </div>
          </div>
        </div>

        {/* ── CORRIDOR STRIP ─────────────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 20px", overflowX: "auto" }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 12 }}>I-95 SPINE CORRIDOR · 12 STOPS · 7 STATES</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: "max-content" }}>
            {CORRIDOR_STOPS.map((stop, i) => (
              <div key={stop} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "rgba(201,162,39,0.2)" : i === 11 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 0 ? "rgba(201,162,39,0.5)" : i === 11 ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "#C9A227" : i === 11 ? "#10B981" : "rgba(255,255,255,0.3)" }} />
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 600, textAlign: "center", maxWidth: 52, lineHeight: 1.2 }}>{stop}</div>
                </div>
                {i < CORRIDOR_STOPS.length - 1 && (
                  <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 2px", marginBottom: 16 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION TABS ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12,
                background: active ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(201,162,39,0.35)" : "rgba(255,255,255,0.07)"}`,
                color: active ? "#C9A227" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, transition: "all 0.2s",
              }}>
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: GUARDIAN SCAN
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "scan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Scan trigger */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 28, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 16 }}>V2X PREDICTIVE INTELLIGENCE — 7-AGENT GUARDIAN MESH</div>

              {scanning ? (
                <div style={{ padding: "24px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(201,162,39,0.3)", borderTopColor: "#C9A227", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                  <div style={{ color: "#C9A227", fontSize: 13, fontWeight: 700 }}>{SCAN_STEPS[scanStep]}</div>
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 6 }}>
                    {SCAN_STEPS.map((_, i) => (
                      <div key={i} style={{ width: i <= scanStep ? 20 : 6, height: 3, borderRadius: 999, background: i <= scanStep ? "#C9A227" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={runScan} style={{
                  display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px",
                  background: "linear-gradient(135deg, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.08) 100%)",
                  border: "1px solid rgba(201,162,39,0.4)", borderRadius: 14,
                  color: "#C9A227", fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 1,
                }}>
                  <Scan size={18} />
                  RUN GUARDIAN SCAN
                </button>
              )}
              <div style={{ marginTop: 12, color: "rgba(255,255,255,0.15)", fontSize: 10 }}>
                Pulls a random vehicle from the Unity corridor · AI-diagnoses issues · Returns Ignorance Tax vs 3C Wholesale
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && !scanning && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Vehicle + Location */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", marginBottom: 4 }}>VEHICLE SCANNED</div>
                      <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{scanResult.vehicle.year} {scanResult.vehicle.make} {scanResult.vehicle.model}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{scanResult.vehicle.color} · {scanResult.vehicle.mileage.toLocaleString()} mi · {scanResult.vehicle.condition}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                        <MapPin size={11} style={{ color: "#C9A227" }} />
                        <span style={{ color: "#C9A227", fontSize: 11, fontWeight: 700 }}>{scanResult.corridorStop?.name}, {scanResult.corridorStop?.state}</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 2 }}>Stop {scanResult.vehicle.corridorStop} · I-95 Corridor</div>
                    </div>
                  </div>
                </div>

                {/* Alert */}
                <div style={{ background: `rgba(${scanResult.alert.severity === "CRITICAL" ? "239,68,68" : "245,158,11"},0.06)`, border: `1px solid rgba(${scanResult.alert.severity === "CRITICAL" ? "239,68,68" : "245,158,11"},0.2)`, borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ display: "flex", items: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <AlertTriangle size={15} style={{ color: SEV_COLOR[scanResult.alert.severity] }} />
                      <span style={{ color: SEV_COLOR[scanResult.alert.severity], fontSize: 10, fontWeight: 900, letterSpacing: "0.14em" }}>{scanResult.alert.severity}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>·</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{scanResult.alert.category}</span>
                    </div>
                  </div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{scanResult.alert.issue}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>{scanResult.alert.urgency}</div>
                  {scanResult.alert.predictedFailureMiles > 0 && (
                    <div style={{ color: SEV_COLOR[scanResult.alert.severity], fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                      ⚡ Predicted failure in {scanResult.alert.predictedFailureMiles.toLocaleString()} miles
                    </div>
                  )}
                </div>

                {/* THE MONEY SHOT: Ignorance Tax vs 3C Wholesale */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Ignorance Tax */}
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "20px 20px" }}>
                    <div style={{ color: "rgba(239,68,68,0.7)", fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", marginBottom: 12 }}>IGNORANCE TAX</div>
                    <div style={{ color: "#EF4444", fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(scanResult.alert.retailCost)}</div>
                    <div style={{ color: "rgba(239,68,68,0.5)", fontSize: 10, marginTop: 6 }}>Standard dealer retail estimate</div>
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
                      <div style={{ color: "rgba(239,68,68,0.6)", fontSize: 9 }}>What you pay without 3C Onyx</div>
                    </div>
                  </div>

                  {/* 3C Wholesale */}
                  <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "20px 20px" }}>
                    <div style={{ color: "rgba(16,185,129,0.7)", fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", marginBottom: 12 }}>3C WHOLESALE</div>
                    <div style={{ color: "#10B981", fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(scanResult.alert.wholesaleCost)}</div>
                    <div style={{ color: "rgba(16,185,129,0.5)", fontSize: 10, marginTop: 6 }}>AI-matched specialist rate</div>
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(16,185,129,0.08)", borderRadius: 8 }}>
                      <div style={{ color: "rgba(16,185,129,0.7)", fontSize: 9 }}>
                        {scanResult.specialist.name} · {scanResult.specialist.aiAccuracy}% AI accuracy
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Banner */}
                <div style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.04) 100%)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 14, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ color: "rgba(201,162,39,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em" }}>MEMBER SAVES</div>
                    <div style={{ color: "#C9A227", fontSize: 32, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{fmt(scanResult.alert.savings)}</div>
                    <div style={{ color: "rgba(201,162,39,0.5)", fontSize: 11 }}>{scanResult.alert.savingsPct}% below dealer retail</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4 }}>ASSIGNED SPECIALIST</div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{scanResult.specialist.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{scanResult.specialist.shop}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                      <span style={{ background: BADGE_COLOR[scanResult.specialist.badge] + "20", color: BADGE_COLOR[scanResult.specialist.badge], fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 4, border: `1px solid ${BADGE_COLOR[scanResult.specialist.badge]}40` }}>
                        {scanResult.specialist.badge.toUpperCase()}
                      </span>
                      <span style={{ color: "rgba(16,185,129,0.7)", fontSize: 10 }}>Score {scanResult.specialist.reputationScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* 7-Agent Mesh nodes */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(scanResult.meshNodes as string[]).map((node, i) => (
                    <div key={node} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 600 }}>Agent {i + 1}: {node}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {!meshDeployed ? (
                  <button onClick={deployMesh} disabled={deployingMesh} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 0",
                    background: deployingMesh ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.35)", borderRadius: 14,
                    color: "#10B981", fontSize: 13, fontWeight: 900, cursor: deployingMesh ? "not-allowed" : "pointer", letterSpacing: 1,
                  }}>
                    {deployingMesh ? <><RefreshCw size={14} className="animate-spin" /> DEPLOYING 7-AGENT MESH…</> : <><Zap size={14} /> DEPLOY GUARDIAN MESH → DYNASTY SPLIT</>}
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, color: "#10B981", fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle size={16} /> Mesh deployed — switching to Dynasty Split…
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: DYNASTY SPLIT
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "split" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", marginBottom: 16 }}>STRIPE MULTI-SPLIT ENGINE — REAL-TIME ATOMIC SETTLEMENT</div>
              {scanResult && (
                <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, display: "inline-block" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Using scanned vehicle: </span>
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{scanResult.vehicle.year} {scanResult.vehicle.make} {scanResult.vehicle.model}</span>
                </div>
              )}
              {!txnResult ? (
                <div>
                  <button onClick={triggerTransaction} disabled={txnLoading} style={{
                    display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px",
                    background: txnLoading ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.4)", borderRadius: 14,
                    color: "#8B5CF6", fontSize: 14, fontWeight: 900, cursor: txnLoading ? "not-allowed" : "pointer",
                  }}>
                    {txnLoading ? <><RefreshCw size={14} className="animate-spin" /> Processing Stripe settlement…</> : <><Zap size={14} /> TRIGGER DYNASTY SPLIT</>}
                  </button>
                  <div style={{ marginTop: 12, color: "rgba(255,255,255,0.15)", fontSize: 10 }}>
                    Executes atomic multi-party Stripe settlement: Dealer 85% · Transport 2.5% · Member Slice · 3C Platform
                  </div>
                </div>
              ) : null}
            </div>

            {txnResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Transaction header */}
                <div style={{ display: "flex", items: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ color: "rgba(16,185,129,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em" }}>TRANSACTION SETTLED</div>
                    <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginTop: 2 }}>{txnResult.vehicle.year} {txnResult.vehicle.make} {txnResult.vehicle.model}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.12em" }}>TOTAL DEAL AMOUNT</div>
                    <div style={{ color: "#C9A227", fontSize: 28, fontWeight: 900, fontFamily: "'Barrow Condensed', sans-serif" }}>{fmt(txnResult.amount)}</div>
                  </div>
                </div>

                {/* Split breakdown animated */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em" }}>STRIPE MULTI-SPLIT BREAKDOWN</div>
                  {(txnResult.splits as any[]).map((split, i) => (
                    <div key={split.label} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                      background: splitStep > i ? `rgba(${split.color === "#10B981" ? "16,185,129" : split.color === "#3B82F6" ? "59,130,246" : split.color === "#C9A227" ? "201,162,39" : "139,92,246"},0.06)` : "rgba(255,255,255,0.01)",
                      border: `1px solid ${splitStep > i ? split.color + "30" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: 12, transition: "all 0.5s ease", opacity: splitStep > i ? 1 : 0.3,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: split.color + "15", flexShrink: 0 }}>
                        {i === 0 && <Building2 size={16} style={{ color: split.color }} />}
                        {i === 1 && <Truck size={16} style={{ color: split.color }} />}
                        {i === 2 && <User size={16} style={{ color: split.color }} />}
                        {i === 3 && <Zap size={16} style={{ color: split.color }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{split.label}</div>
                        {splitStep > i && (
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, fontFamily: "monospace", marginTop: 2 }}>{split.transferId}</div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: split.color, fontSize: 18, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>{splitStep > i ? fmt(split.amount) : "—"}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{split.pct}%</div>
                      </div>
                      <div style={{ width: 56, textAlign: "center" }}>
                        {splitStep > i ? (
                          <span style={{ color: "#10B981", fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.2)" }}>SENT</span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>PENDING</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metadata */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { label: "STRIPE PI", value: txnResult.stripePaymentIntentId.slice(0, 22) + "…", color: "#fff" },
                    { label: "AML STATUS", value: txnResult.amlCleared ? "CLEARED" : "REVIEW", color: "#10B981" },
                    { label: "KYC STATUS", value: txnResult.kycVerified ? "VERIFIED" : "PENDING", color: "#10B981" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ color: m.color, fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setTab("mesh")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)", borderRadius: 12, color: "#C9A227", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  <Award size={13} /> RATE THIS TRANSACTION — INTEGRITY MESH <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: INTEGRITY MESH
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "mesh" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em" }}>TWO-WAY INTEGRITY MESH — APPEND-ONLY SHA-256 REPUTATION LEDGER</div>

            {meshComplete ? (
              <div style={{ padding: 40, textAlign: "center", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16 }}>
                <CheckCircle size={48} style={{ color: "#10B981", margin: "0 auto 16px" }} />
                <div style={{ color: "#10B981", fontSize: 18, fontWeight: 800 }}>Integrity Mesh Complete</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>Both ratings committed to the NIST-MCP ledger</div>
                {meshRatingData && (
                  <div style={{ marginTop: 20, padding: "14px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 12, display: "inline-block", textAlign: "left" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: "0.12em", marginBottom: 8 }}>LEDGER ENTRY</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontFamily: "monospace" }}>{meshRatingData.ledgerHash?.slice(0, 40)}…</div>
                    <div style={{ color: "#10B981", fontSize: 10, fontWeight: 700, marginTop: 6 }}>Reputation Δ +{meshRatingData.reputationDelta}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Member rates Shop */}
                <RatingCard
                  title="MEMBER RATES SHOP"
                  subtitle={scanResult ? scanResult.specialist.shop : "Manhattan Euro Specialists"}
                  avatar="M"
                  avatarColor="#C9A227"
                  tags={MEMBER_TAGS}
                  stars={memberStars}
                  selectedTags={memberTags}
                  done={memberDone}
                  onStars={setMemberStars}
                  onTag={(t) => setMemberTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                  onSubmit={() => submitRating("member_to_shop", memberStars, memberTags)}
                />
                {/* Shop rates Member */}
                <RatingCard
                  title="SHOP RATES MEMBER"
                  subtitle="Alexander Harrington"
                  avatar="S"
                  avatarColor="#8B5CF6"
                  tags={SHOP_TAGS}
                  stars={shopStars}
                  selectedTags={shopTags}
                  done={shopDone}
                  onStars={setShopStars}
                  onTag={(t) => setShopTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                  onSubmit={() => submitRating("shop_to_member", shopStars, shopTags)}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: CONCIERGE
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "concierge" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em" }}>NATURAL CONCIERGE — SOPHISTICATED ARCHITECT PERSONA</div>

            {/* Chat history */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, minHeight: 320, maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "ai" && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Sparkles size={12} style={{ color: "#C9A227" }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "ai" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    background: msg.role === "ai" ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.05)",
                    border: msg.role === "ai" ? "1px solid rgba(201,162,39,0.15)" : "1px solid rgba(255,255,255,0.08)",
                    color: msg.role === "ai" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.65)",
                    fontSize: 13, lineHeight: 1.55,
                  }}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={12} style={{ color: "#C9A227" }} />
                  </div>
                  <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.15)", borderRadius: "4px 14px 14px 14px" }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A227", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested prompts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                "What vehicles are available in Boston Seaport?",
                "Show me the top-rated specialist in DC",
                "Explain the Dynasty multi-split",
                "What's our Hectocorn timeline?",
              ].map(prompt => (
                <button key={prompt} onClick={() => { setChatInput(prompt); }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask your Concierge anything about the Unity corridor…"
                style={{ flex: 1, padding: "13px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif" }}
              />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ padding: "13px 18px", background: chatInput.trim() ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${chatInput.trim() ? "rgba(201,162,39,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, color: chatInput.trim() ? "#C9A227" : "rgba(255,255,255,0.2)", cursor: chatInput.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}

// ── Rating Card Sub-Component ──────────────────────────────────────────────────
function RatingCard({
  title, subtitle, avatar, avatarColor, tags, stars, selectedTags, done,
  onStars, onTag, onSubmit,
}: {
  title: string; subtitle: string; avatar: string; avatarColor: string;
  tags: string[]; stars: number; selectedTags: string[]; done: boolean;
  onStars: (n: number) => void; onTag: (t: string) => void; onSubmit: () => void;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 18px" }}>
      {done ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <CheckCircle size={32} style={{ color: "#10B981", margin: "0 auto 10px" }} />
          <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700 }}>Rating submitted</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4 }}>Committed to ledger</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: avatarColor + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: avatarColor, fontSize: 14, fontWeight: 900 }}>{avatar}</span>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em" }}>{title}</div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{subtitle}</div>
            </div>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => onStars(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Star size={22} style={{ color: n <= stars ? "#C9A227" : "rgba(255,255,255,0.15)", fill: n <= stars ? "#C9A227" : "transparent", transition: "all 0.15s" }} />
              </button>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {tags.map(tag => (
              <button key={tag} onClick={() => onTag(tag)} style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 9, fontWeight: 700, cursor: "pointer",
                background: selectedTags.includes(tag) ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedTags.includes(tag) ? "rgba(201,162,39,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: selectedTags.includes(tag) ? "#C9A227" : "rgba(255,255,255,0.35)", transition: "all 0.15s",
              }}>
                {tag}
              </button>
            ))}
          </div>

          <button onClick={onSubmit} disabled={stars === 0} style={{
            width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 11, fontWeight: 800,
            background: stars > 0 ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${stars > 0 ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.06)"}`,
            color: stars > 0 ? "#C9A227" : "rgba(255,255,255,0.2)", cursor: stars > 0 ? "pointer" : "not-allowed",
          }}>
            {stars === 0 ? "Select a rating first" : `SUBMIT ${stars}★ RATING`}
          </button>
        </>
      )}
    </div>
  );
}
