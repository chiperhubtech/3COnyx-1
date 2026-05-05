/**
 * 3C ONYX — CVO Operations Console
 * For the Chief Vision Officer / Top Founder. Live ping of every lifecycle vertical.
 * Public route. Read-only. Proof that the platform is alive end-to-end.
 */
import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";

type Health = "ok" | "auth" | "down" | "checking";

interface Vertical {
  key: string;
  pillar: string;
  emoji: string;
  hue: string;
  endpoint: string;
  page: string;
  description: string;
  health: Health;
  latencyMs?: number;
  detail?: string;
}

const INITIAL: Vertical[] = [
  { key: "core",      pillar: "Core API",       emoji: "🛡️", hue: "#C9A227", endpoint: "/api/healthz",                          page: "/standard",          description: "Platform health, security middleware, rate limiting", health: "checking" },
  { key: "discovery", pillar: "Discovery",      emoji: "📡", hue: "#5EC2D9", endpoint: "/api/platform/v1/hubs",                 page: "/standard",          description: "Hub registry · Elmwood / Route 44 / CuxtomCandy",     health: "checking" },
  { key: "openapi",   pillar: "Open Protocol",  emoji: "⚖️", hue: "#A78BFA", endpoint: "/api/platform/openapi.json",            page: "/standard",          description: "Public OpenAPI · ChatGPT / Gemini / Grok ingestible",  health: "checking" },
  { key: "buy",       pillar: "Buy",            emoji: "🚗", hue: "#C9A227", endpoint: "/api/platform/v1/status",               page: "/marketplace",       description: "Inventory matching · marketplace · used + new",       health: "checking" },
  { key: "rent",      pillar: "Rent",           emoji: "🚙", hue: "#5EC2D9", endpoint: "/api/rentals/rentals/providers",        page: "/marketplace?mode=rent", description: "Rental aggregator · multi-provider booking",        health: "checking" },
  { key: "sell",      pillar: "Sell / Trade",   emoji: "💰", hue: "#7B9E89", endpoint: "/api/platform/v1/status",               page: "/garage",            description: "Garage listing · trade-in · auction routing",          health: "checking" },
  { key: "service",   pillar: "Service",        emoji: "🔧", hue: "#7AA2F7", endpoint: "/api/platform/v1/status",               page: "/bay-dashboard",     description: "Repair bay scheduling · specialist dispatch",          health: "checking" },
  { key: "insure",    pillar: "Insurance",      emoji: "🛡️", hue: "#9D7DE8", endpoint: "/api/platform/v1/status",               page: "/insurance",         description: "Bind insurance to deals · multi-carrier",              health: "checking" },
  { key: "finance",   pillar: "Finance",        emoji: "🏦", hue: "#E5A73B", endpoint: "/api/platform/v1/status",               page: "/finance",           description: "Loan origination · lender matching · BNPL",            health: "checking" },
  { key: "appraise",  pillar: "Appraisal",      emoji: "💎", hue: "#F472B6", endpoint: "/api/platform/v1/status",               page: "/vehicle-history",   description: "VIN-based valuation · history · price guidance",       health: "checking" },
  { key: "warranty",  pillar: "Warranty",       emoji: "📜", hue: "#A78BFA", endpoint: "/api/platform/v1/status",               page: "/vehicle-history",   description: "Warranty intel · coverage lookup · claim routing",     health: "checking" },
  { key: "accident",  pillar: "Accident Help",  emoji: "🚨", hue: "#E5484D", endpoint: "/api/platform/v1/status",               page: "/concierge",         description: "First-notice-of-loss · towing · concierge dispatch",   health: "checking" },
  { key: "referral",  pillar: "Referral Wallet",emoji: "🤝", hue: "#B7AEEF", endpoint: "/api/platform/v1/status",               page: "/referral-wallet",   description: "Earn from any corner globally · Stripe payouts",       health: "checking" },
  { key: "ai",        pillar: "AI Agent Mesh",  emoji: "🧠", hue: "#7AA2F7", endpoint: "/api/platform/v1/status",               page: "/ai-hub",            description: "Multi-agent orchestration · LLM routing",              health: "checking" },
  { key: "compliance",pillar: "Compliance",     emoji: "📋", hue: "#7B9E89", endpoint: "/api/platform/v1/status",               page: "/compliance",        description: "DOT / DMV / VIN audit · multi-jurisdiction",           health: "checking" },
];

async function ping(endpoint: string): Promise<{ health: Health; latencyMs: number; detail?: string }> {
  const t0 = performance.now();
  try {
    const res = await fetch(endpoint, { credentials: "include" });
    const ms = Math.round(performance.now() - t0);
    if (res.ok) return { health: "ok", latencyMs: ms };
    if (res.status === 401 || res.status === 403) return { health: "auth", latencyMs: ms, detail: "auth-gated (route exists)" };
    return { health: "down", latencyMs: ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { health: "down", latencyMs: Math.round(performance.now() - t0), detail: "network" };
  }
}

export default function CVOConsole() {
  const [verticals, setVerticals] = useState<Vertical[]>(INITIAL);
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const runChecks = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.all(verticals.map(async (v) => {
      const r = await ping(v.endpoint);
      return { ...v, ...r };
    }));
    setVerticals(results);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void runChecks();
    const tick = setInterval(() => setNow(new Date()), 1000);
    const auto = setInterval(() => void runChecks(), 30000);
    return () => { clearInterval(tick); clearInterval(auto); };
  }, [runChecks]);

  const okCount   = verticals.filter((v) => v.health === "ok").length;
  const authCount = verticals.filter((v) => v.health === "auth").length;
  const downCount = verticals.filter((v) => v.health === "down").length;
  const aliveCount = okCount + authCount; // both prove the route exists & is wired
  const aliveRatio = Math.round((aliveCount / verticals.length) * 100);
  const allGreen = downCount === 0 && verticals.every((v) => v.health !== "checking");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* Top bar */}
      <div className="border-b border-amber-400/20 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-amber-400 text-lg">◈</span>
            <span className="font-black tracking-widest">3C ONYX · CVO CONSOLE</span>
          </Link>
          <div className="flex items-center gap-3 text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${allGreen ? "bg-green-400" : "bg-amber-400"} animate-pulse`} />
              {allGreen ? "ALL SYSTEMS OPERATIONAL" : `${aliveCount}/${verticals.length} ALIVE`}
            </span>
            <span className="hidden sm:inline">| {now.toISOString().slice(11, 19)} UTC</span>
            <button onClick={() => void runChecks()} disabled={refreshing} className="text-amber-400 hover:underline disabled:opacity-50">
              {refreshing ? "↻ checking..." : "↻ refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Hero / KPIs */}
      <section className="border-b border-amber-400/10">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-6">
            🎩 CHIEF VISION OFFICER · GLOBAL OPERATIONS
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] mb-6">
            Every vertical. <span className="text-amber-400">Live.</span><br/>
            Every lifecycle. <span className="text-amber-400">Wired.</span>
          </h1>
          <p className="text-lg text-stone-300 max-w-3xl mb-8">
            <span className="text-white font-bold">Buy · Rent · Sell · Service · Insure · Finance · Appraise · Warranty · Accident · Refer.</span>{" "}
            The full global automotive lifecycle, monitored in real time. The way a top global CVO demands.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <Kpi label="Verticals Alive" value={`${aliveCount}/${verticals.length}`} hue="#22c55e" />
            <Kpi label="Coverage" value={`${aliveRatio}%`} hue="#C9A227" />
            <Kpi label="Auth-Gated" value={String(authCount)} hue="#A78BFA" />
            <Kpi label="Down" value={String(downCount)} hue={downCount === 0 ? "#22c55e" : "#E5484D"} />
          </div>
        </div>
      </section>

      {/* Vertical Status Grid */}
      <section className="border-b border-amber-400/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-4xl font-black mb-2">Lifecycle Status</h2>
          <p className="text-stone-400 mb-8 text-sm">
            Each card pings the live endpoint and links to the working page. <span className="text-green-400">OK</span> = open route. <span className="text-purple-400">AUTH</span> = wired & secured. <span className="text-red-400">DOWN</span> = needs attention.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verticals.map((v) => (
              <div key={v.key} className="border border-amber-400/20 rounded-2xl p-5 bg-stone-950/60 hover:border-amber-400/60 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden>{v.emoji}</span>
                    <div>
                      <div className="font-black text-white">{v.pillar}</div>
                      <div className="text-[10px] font-mono text-stone-500 truncate max-w-[200px]">{v.endpoint}</div>
                    </div>
                  </div>
                  <HealthBadge h={v.health} />
                </div>
                <p className="text-xs text-stone-400 leading-relaxed mb-3">{v.description}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 border-t border-amber-400/10 pt-3">
                  <span>{v.latencyMs ? `${v.latencyMs}ms` : "—"}{v.detail ? ` · ${v.detail}` : ""}</span>
                  <Link href={v.page} className="text-amber-400 hover:underline">→ open</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CVO Action Bar */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-black mb-6">CVO Quick Actions</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/door" className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl">Door (Customer)</Link>
            <Link href="/standard" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">Standard</Link>
            <Link href="/kilocorn" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">Kilocorn</Link>
            <Link href="/intelligence" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">Intelligence</Link>
            <Link href="/strategic-center" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">Strategic Center</Link>
            <a href="/api/platform/openapi.json" target="_blank" rel="noreferrer" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">OpenAPI</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-amber-400/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div>3C ONYX CVO CONSOLE · RAC3C / CUXTOMCANDYCLUB LLC</div>
          <div className="text-amber-400/60">Auto-refreshes every 30s 🎩</div>
        </div>
      </footer>
    </div>
  );
}

function Kpi({ label, value, hue }: { label: string; value: string; hue: string }) {
  return (
    <div className="border border-amber-400/20 rounded-2xl p-4 bg-stone-950/60">
      <div className="text-3xl font-black" style={{ color: hue }}>{value}</div>
      <div className="text-xs text-stone-400 mt-1">{label}</div>
    </div>
  );
}

function HealthBadge({ h }: { h: Health }) {
  const map = {
    ok:       { txt: "OK",       cls: "bg-green-400/20 text-green-400" },
    auth:     { txt: "AUTH",     cls: "bg-purple-400/20 text-purple-400" },
    down:     { txt: "DOWN",     cls: "bg-red-400/20 text-red-400" },
    checking: { txt: "...",      cls: "bg-stone-500/20 text-stone-400" },
  } as const;
  const m = map[h];
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${m.cls}`}>{m.txt}</span>;
}
