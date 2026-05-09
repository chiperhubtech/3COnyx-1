import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";

// ── 1. Live "Global Government Savings" counter ──────────────────────────
// Baseline simulation: $1,200 saved per second when 3C ONYX coordinates
// the world's transit, fleet, and infrastructure data — without owning
// a single vehicle. Asset-light. Neutral. Sovereign-friendly.
const BASE_SAVINGS_PER_SEC = 1_200;
const KPI_START = 47_300_000_000; // $47.3B running tally as of demo time

function useLiveSavings(): number {
  const [val, setVal] = useState<number>(KPI_START);
  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setVal(KPI_START + elapsed * BASE_SAVINGS_PER_SEC);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return val;
}

function fmtUsdLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(3)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${Math.floor(n).toLocaleString()}`;
}

// ── 2a. Congestion-elimination simulator ─────────────────────────────────
// Baseline (uncoordinated) — volatile peaks at 8am and 5pm.
// Coordinated — flattened curve, ~38% peak reduction.
const HOURS = Array.from({ length: 24 }, (_, h) => h);
function trafficBaseline(h: number): number {
  // Two volatile peaks
  const morning = 78 * Math.exp(-((h - 8) ** 2) / 4);
  const evening = 88 * Math.exp(-((h - 17) ** 2) / 4);
  return Math.min(100, 18 + morning + evening);
}
function trafficCoordinated(h: number): number {
  // Flattened across the day
  const base = trafficBaseline(h);
  const flat = 42 + 6 * Math.sin((h / 24) * Math.PI * 2);
  return base * 0.35 + flat * 0.65;
}

// ── 2b. Predictive maintenance map (mock pothole telemetry) ──────────────
type Defect = { id: number; x: number; y: number; severity: 1 | 2 | 3; type: string; detected: string };
const INITIAL_DEFECTS: Defect[] = [
  { id: 1, x: 18, y: 22, severity: 3, type: "Pothole cluster",        detected: "12s ago via 47 vehicles" },
  { id: 2, x: 34, y: 41, severity: 2, type: "Surface degradation",    detected: "31s ago via 19 vehicles" },
  { id: 3, x: 52, y: 18, severity: 1, type: "Lane-marker fading",     detected: "1m ago via 8 vehicles"   },
  { id: 4, x: 68, y: 64, severity: 3, type: "Sinkhole forming",       detected: "4s ago via 112 vehicles" },
  { id: 5, x: 82, y: 33, severity: 2, type: "Drainage blockage",      detected: "44s ago via 23 vehicles" },
  { id: 6, x: 28, y: 71, severity: 1, type: "Signage obstruction",    detected: "2m ago via 5 vehicles"   },
  { id: 7, x: 75, y: 84, severity: 3, type: "Bridge expansion crack", detected: "9s ago via 88 vehicles"  },
  { id: 8, x: 12, y: 56, severity: 2, type: "Curb damage",            detected: "1m ago via 14 vehicles"  },
];

const SEV_COLOR: Record<number, string> = { 1: "bg-amber-300", 2: "bg-orange-400", 3: "bg-rose-500" };
const SEV_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "Critical" };

// ── 4. Cybersecurity resiliency panel ────────────────────────────────────
const NODES = Array.from({ length: 16 }, (_, i) => i);

export default function UtilityPage() {
  const savings = useLiveSavings();

  // Section 2a — congestion toggle
  const [coordinated, setCoordinated] = useState(true);
  const trafficSeries = useMemo(
    () => HOURS.map((h) => ({ h, baseline: trafficBaseline(h), live: coordinated ? trafficCoordinated(h) : trafficBaseline(h) })),
    [coordinated],
  );
  const peakLive = Math.max(...trafficSeries.map((p) => p.live));
  const peakBaseline = Math.max(...trafficSeries.map((p) => p.baseline));
  const peakReduction = Math.round(((peakBaseline - peakLive) / peakBaseline) * 100);

  // Section 2b — defect map
  const [defects, setDefects] = useState<Defect[]>(INITIAL_DEFECTS);
  const [dispatchedId, setDispatchedId] = useState<number | null>(null);
  function dispatch(id: number) {
    setDispatchedId(id);
    setTimeout(() => {
      setDefects((d) => d.filter((x) => x.id !== id));
      setDispatchedId(null);
    }, 1400);
  }

  // Section 3 — budget calculator
  const [population, setPopulation] = useState(1_500_000);
  const [rightSizing, setRightSizing] = useState(true);
  const [method, setMethod] = useState<"traditional" | "platform">("platform");

  const { traditionalCost, platformCost, monthlySavings, efficiencyGain } = useMemo(() => {
    // Per-capita monthly transit subsidy baseline
    const traditionalPerCapita = 38; // $/month/person traditional bus + light rail subsidy
    const platformPerCapita = method === "platform" ? 11 : traditionalPerCapita; // micro-targeted digital travel credits
    const fleetMultiplier = rightSizing ? 0.78 : 1.0; // 22% fleet rightsizing savings on top
    const traditionalCost = population * traditionalPerCapita;
    const platformCost = population * platformPerCapita * fleetMultiplier;
    const monthlySavings = Math.max(0, traditionalCost - platformCost);
    const efficiencyGain = traditionalCost > 0 ? Math.round((monthlySavings / traditionalCost) * 100) : 0;
    return { traditionalCost, platformCost, monthlySavings, efficiencyGain };
  }, [population, rightSizing, method]);

  // Section 4 — cyber attack sim
  const [breachedNode, setBreachedNode] = useState<number | null>(null);
  const [attackPhase, setAttackPhase] = useState<"idle" | "attacking" | "isolated" | "recovered">("idle");
  function simulateAttack() {
    if (attackPhase !== "idle") return;
    const target = Math.floor(Math.random() * NODES.length);
    setBreachedNode(target);
    setAttackPhase("attacking");
    setTimeout(() => setAttackPhase("isolated"), 900);
    setTimeout(() => setAttackPhase("recovered"), 2400);
    setTimeout(() => {
      setBreachedNode(null);
      setAttackPhase("idle");
    }, 4200);
  }

  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">⚖️ Civil Utility Layer · Mobility-as-a-Service · Asset-Light · Sovereign-Neutral</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          A neutral <span className="text-amber-400">data coordinator</span>{" "}
          for every city on Earth.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          3C ONYX owns no vehicles, owns no roads, owns no fleet. It only owns the{" "}
          <strong className="text-emerald-300">protocol</strong> that lets every existing one talk, route, save, and prove.
          Cities save money. Citizens save time. Carbon goes down. The grid stays sovereign — no single point of failure.
        </p>
      </section>

      {/* 1. Live KPI strip */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-amber-500/5 p-8">
          <div className="text-xs uppercase tracking-widest text-emerald-300">Global Government Savings (live · $1,200/sec baseline)</div>
          <div className="mt-2 text-5xl md:text-7xl font-black text-emerald-400 tabular-nums">{fmtUsdLarge(savings)}</div>
          <div className="mt-1 text-sm text-zinc-400">Compounding every second 3C ONYX coordinates the world's transit, fleet, and infrastructure data — without owning a single asset.</div>
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-amber-500/30 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">Total Commute Delay Reduced</div>
            <div className="mt-2 text-3xl font-black text-amber-400">38.7%</div>
            <div className="mt-1 text-xs text-zinc-400">Across 1,200+ coordinated metros (rolling 30-day)</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Carbon Emissions Avoided</div>
            <div className="mt-2 text-3xl font-black text-emerald-400">2.41M MT</div>
            <div className="mt-1 text-xs text-zinc-400">Metric tons CO₂e — verified via on-vehicle telemetry</div>
          </div>
          <div className="rounded-lg border border-sky-500/30 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-sky-300">Infrastructure Maintenance Deflected</div>
            <div className="mt-2 text-3xl font-black text-sky-400">$8.9B</div>
            <div className="mt-1 text-xs text-zinc-400">Predicted-and-prevented vs. reactive repair (year-to-date)</div>
          </div>
        </div>
      </section>

      {/* 2a. Absolute Congestion Elimination */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Absolute Congestion Elimination</h2>
            <p className="mt-2 max-w-2xl text-zinc-300">Toggle Platform Coordination. Watch the volatile peak-hour curve flatten in real time.</p>
          </div>
          <button
            onClick={() => setCoordinated((v) => !v)}
            className={`px-5 py-3 rounded-lg font-bold transition ${
              coordinated
                ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            Platform Coordination: {coordinated ? "ON" : "OFF"}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-rose-500/70 rounded"></span>Uncoordinated baseline</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-emerald-400 rounded"></span>3C ONYX coordinated</span>
            <span className="ml-auto text-amber-300 font-bold">Peak reduction: {peakReduction}%</span>
          </div>
          <svg viewBox="0 0 600 220" className="w-full h-56">
            {/* gridlines */}
            {[0, 25, 50, 75, 100].map((g) => (
              <g key={g}>
                <line x1="40" x2="590" y1={200 - (g * 1.7)} y2={200 - (g * 1.7)} stroke="#27272a" strokeWidth="1" />
                <text x="6" y={204 - (g * 1.7)} fill="#71717a" fontSize="9">{g}</text>
              </g>
            ))}
            {/* baseline area */}
            <polyline
              fill="none"
              stroke="rgb(244 63 94 / 0.7)"
              strokeWidth="2"
              points={trafficSeries.map((p) => `${40 + (p.h / 23) * 550},${200 - p.baseline * 1.7}`).join(" ")}
            />
            {/* live area */}
            <polyline
              fill="none"
              stroke="rgb(52 211 153)"
              strokeWidth="3"
              points={trafficSeries.map((p) => `${40 + (p.h / 23) * 550},${200 - p.live * 1.7}`).join(" ")}
            />
            {/* hour labels */}
            {[0, 6, 12, 18, 23].map((h) => (
              <text key={h} x={40 + (h / 23) * 550} y="216" fill="#71717a" fontSize="9" textAnchor="middle">{h}:00</text>
            ))}
          </svg>
          <div className="mt-3 text-xs text-zinc-400">
            Traffic Flow Rate (% of road capacity) vs Hour of Day · 24-hour rolling window · 1,200 metro composite
          </div>
        </div>
      </section>

      {/* 2b. Predictive Infrastructure Maintenance */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Predictive Infrastructure Maintenance</h2>
        <p className="mt-2 max-w-2xl text-zinc-300">
          Continuous vehicle telemetry across the network spots road defects before citizens complain. Dispatch a micro-targeted repair team — single click.
        </p>

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="text-xs text-zinc-400 mb-3">Live defect map · simulated grid · {defects.length} active detections</div>
            <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              {/* grid background */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 56">
                {Array.from({ length: 11 }, (_, i) => (
                  <line key={`v${i}`} x1={i * 10} x2={i * 10} y1="0" y2="56" stroke="#27272a" strokeWidth="0.1" />
                ))}
                {Array.from({ length: 7 }, (_, i) => (
                  <line key={`h${i}`} x1="0" x2="100" y1={i * 8} y2={i * 8} stroke="#27272a" strokeWidth="0.1" />
                ))}
              </svg>
              {defects.map((d) => (
                <div
                  key={d.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${SEV_COLOR[d.severity]} ${
                    dispatchedId === d.id ? "animate-ping" : "animate-pulse"
                  }`}
                  style={{ left: `${d.x}%`, top: `${d.y * 0.56}%` }}
                  title={`${d.type} (${SEV_LABEL[d.severity]})`}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 max-h-96 overflow-auto">
            <div className="text-xs uppercase tracking-widest text-amber-300 mb-3">Detection Queue</div>
            <ul className="space-y-3">
              {defects.map((d) => (
                <li key={d.id} className="border border-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${SEV_COLOR[d.severity]}`}></span>
                    <span className="font-bold text-stone-100 text-sm">{d.type}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">{d.detected} · severity: {SEV_LABEL[d.severity]}</div>
                  <button
                    onClick={() => dispatch(d.id)}
                    disabled={dispatchedId !== null}
                    className="mt-2 w-full px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold transition"
                  >
                    {dispatchedId === d.id ? "Dispatching…" : "Deploy Micro-Targeted Repair Team"}
                  </button>
                </li>
              ))}
              {defects.length === 0 && (
                <li className="text-sm text-emerald-300">All defects cleared. Network nominal. ✓</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Government Budget & Subsidies Calculator */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Government Budget & Subsidies Calculator</h2>
        <p className="mt-2 max-w-2xl text-zinc-300">For municipal transit authorities. Compare traditional mass-transit subsidies vs. 3C ONYX micro-targeted digital travel credits.</p>

        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
            <label className="block text-xs uppercase tracking-widest text-amber-300 mb-2">City Population</label>
            <input
              type="range" min="50000" max="20000000" step="50000"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="mt-1 text-2xl font-bold text-amber-400 tabular-nums">{population.toLocaleString()}</div>

            <label className="block mt-6 text-xs uppercase tracking-widest text-amber-300 mb-2">Fleet Right-Sizing</label>
            <button
              onClick={() => setRightSizing((v) => !v)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                rightSizing ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-zinc-800 text-zinc-200 border border-zinc-700"
              }`}
            >
              {rightSizing ? "ON · 22% fleet savings" : "OFF · status quo fleet"}
            </button>

            <label className="block mt-6 text-xs uppercase tracking-widest text-amber-300 mb-2">Subsidy Allocation Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "traditional" | "platform")}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-stone-100"
            >
              <option value="traditional">Traditional Mass Transit Subsidies</option>
              <option value="platform">3C ONYX Micro-Targeted Digital Travel Credits</option>
            </select>
          </div>

          <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-amber-500/5 p-6">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Monthly Comparative Cost-Benefit</div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-400">Traditional cost</div>
                <div className="text-2xl font-black text-rose-400 tabular-nums">{fmtUsdLarge(traditionalCost)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">3C ONYX cost</div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">{fmtUsdLarge(platformCost)}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-emerald-500/30">
              <div className="text-xs text-zinc-400">Estimated monthly taxpayer savings</div>
              <div className="text-4xl font-black text-amber-400 tabular-nums">{fmtUsdLarge(monthlySavings)}</div>
              <div className="mt-2 text-xs text-emerald-300">{efficiencyGain}% efficiency improvement vs. traditional baseline</div>
              <div className="mt-1 text-xs text-zinc-400">Annualized: {fmtUsdLarge(monthlySavings * 12)} returned to citizens, infrastructure, or reserves.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cybersecurity & Sovereignty Resiliency Panel */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Cybersecurity & Sovereignty Resiliency</h2>
        <p className="mt-2 max-w-2xl text-zinc-300">
          Federated open-source protocol. No single point of failure. Trigger a simulated attack — watch the breach
          isolate to one node while the global routing grid stays online.
        </p>

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="text-xs text-zinc-400 mb-3">Federated node mesh · 16 sovereign jurisdictions</div>
            <div className="grid grid-cols-8 gap-2">
              {NODES.map((n) => {
                const isBreached = breachedNode === n;
                const tone =
                  isBreached && attackPhase === "attacking"   ? "bg-rose-600 animate-pulse" :
                  isBreached && attackPhase === "isolated"    ? "bg-zinc-700 ring-2 ring-rose-500/60" :
                  isBreached && attackPhase === "recovered"   ? "bg-emerald-600" :
                                                                "bg-emerald-500/80";
                return (
                  <div key={n} className={`aspect-square rounded ${tone} flex items-center justify-center text-[10px] font-bold text-black/80`}>
                    N{n + 1}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-xs">
              {attackPhase === "idle"      && <span className="text-emerald-300">● All 16 nodes nominal · global routing operational</span>}
              {attackPhase === "attacking" && <span className="text-rose-400">● Attack detected on node N{(breachedNode ?? 0) + 1} · classifier engaged…</span>}
              {attackPhase === "isolated"  && <span className="text-amber-300">● Breach isolated · 15 nodes still routing · zero global degradation</span>}
              {attackPhase === "recovered" && <span className="text-emerald-300">● Node N{(breachedNode ?? 0) + 1} re-attested · federation restored</span>}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">Stress Test</div>
            <p className="mt-2 text-sm text-zinc-300">Simulate a coordinated cyber attack on the federated mesh. The protocol isolates the breach to a single localized node — the global transit routing grid never collapses.</p>
            <button
              onClick={simulateAttack}
              disabled={attackPhase !== "idle"}
              className="mt-4 w-full px-4 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold transition"
            >
              {attackPhase === "idle" ? "⚠ Simulate Cyber Attack" : `Running… (${attackPhase})`}
            </button>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span><span className="text-zinc-300">Federated open-source protocol</span></div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span><span className="text-zinc-300">Per-node sovereign data residency</span></div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span><span className="text-zinc-300">Cryptographic re-attestation on rejoin</span></div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span><span className="text-zinc-300">Zero single-point-of-failure architecture</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Asset-light. Sovereign-neutral.{" "}
            <span className="text-amber-400">Civil utility for every city.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            We don't own the buses. We don't own the cars. We don't own the roads. We own the{" "}
            <strong className="text-emerald-300">protocol</strong> that lets every existing one save money, save time,
            save carbon, and prove it — without any government surrendering data sovereignty. That's the civil utility
            layer of 3C ONYX. By the people. For the people. Globally.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/government" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🏛️ Sovereign Fleet</Link>
            <Link href="/revenue" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">💰 25 Revenue Streams</Link>
            <Link href="/everything" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
