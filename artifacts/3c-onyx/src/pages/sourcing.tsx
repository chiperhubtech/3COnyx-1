import { Link } from "wouter";

const CATEGORIES = [
  { e: "🔩", t: "OEM & Aftermarket Parts",
    items: "Brake systems · suspension · drivetrain · electrical · body panels · glass · tires · filters · fluids · diagnostics tools",
    sources: "Canton (China) · Detroit · Stuttgart · Tokyo · Seoul · Pune · Querétaro · Bursa",
    moq: "From 50 units (specialty) up to container loads (10,000+)",
    save: "30–60% vs. local distributor markup" },
  { e: "🔌", t: "EV Charging Infrastructure",
    items: "Level 2 wall chargers · DC fast-chargers (50–350 kW) · grid-balancing inverters · cable assemblies · payment terminals · canopy structures",
    sources: "Germany · Netherlands · Shenzhen · California · South Korea",
    moq: "1 unit (commercial) up to municipal procurement lots",
    save: "20–45% vs. retail + transparent install partner network" },
  { e: "🚚", t: "Fleet Wholesale (New + Off-Lease)",
    items: "Sedans · pickups · cargo vans · refrigerated trucks · school bus chassis · sanitation chassis · electric delivery vans",
    sources: "Direct from OEM fleet desks · ex-rental disposition · off-lease auctions · sovereign-fleet retirements",
    moq: "1 unit (small biz) up to 500+ unit municipal/corporate orders",
    save: "Bypass dealer holdback · transparent invoice + holdback visibility" },
  { e: "🏭", t: "Workshop & Garage Equipment",
    items: "Lifts · alignment racks · tire machines · scan tools · paint booths · welding · A/C recovery · battery testers",
    sources: "Italy · Germany · China · USA · Brazil",
    moq: "1 unit",
    save: "Independent shops get fleet pricing — closes the gap with dealer service bays" },
  { e: "🏗️", t: "Heavy-Duty & Specialty",
    items: "Tow trucks · municipal sanitation rigs · construction-fleet trucks · forklifts · port logistics equipment · mining trucks",
    sources: "USA · Sweden · Germany · Japan · China",
    moq: "1 unit (specialty) up to fleet orders",
    save: "Direct factory routing skips 2–3 layers of brokers" },
  { e: "🔋", t: "Battery & Energy Storage",
    items: "EV traction battery packs · stationary storage · BMS modules · cell test rigs · battery recycling equipment",
    sources: "Korea · China · Japan · Germany · USA",
    moq: "Cell-level (R&D) up to GWh-scale commercial",
    save: "Critical for fleet electrification — currently a market with massive opacity" },
];

const HOW_IT_WORKS = [
  { n: "1", t: "Post your need",     p: "Buyer (shop · dealer · fleet · government · DIY) describes intent in their language. AI parses spec, quantity, delivery window, budget." },
  { n: "2", t: "AI matches sources", p: "Crawler aggregates listings across 60+ source countries. Verified manufacturers + wholesalers respond in < 24h with sealed quotes." },
  { n: "3", t: "Stripe-escrowed milestone payments", p: "Buyer funds escrow. Released on production milestones · pre-shipment inspection · delivery confirmation. Zero counterparty risk." },
  { n: "4", t: "Logistics + customs", p: "Multi-modal shipping (sea · air · rail · road). Duty calc, customs broker, delivered-duty-paid pricing visible upfront." },
  { n: "5", t: "Connector earns",    p: "If a Connector introduced the source or buyer, they earn a Connector wallet payout — automatically — out of the 3–5% protocol fee." },
];

const WHO_BENEFITS = [
  { e: "🔧", t: "Independent shops",       p: "Get fleet-tier parts pricing your local distributor would never offer. Compete with dealer service bays on margin." },
  { e: "🚛", t: "Fleet operators",         p: "Skip dealer holdback. Direct factory orders for 50–5,000 unit fleets. Sovereign-fleet pricing for everyone." },
  { e: "🏛️", t: "Governments",            p: "Public procurement compliance built in. Vendor-neutral. Transparent. Audit-ready every transaction." },
  { e: "🏗️", t: "Contractors",            p: "Equipment + vehicles + parts in one place. Trade pricing without 'who do you know' gatekeeping." },
  { e: "🌍", t: "Manufacturers globally",  p: "60+ source countries get global market access without paying broker spread or running their own export desk." },
  { e: "🤝", t: "Connectors",              p: "Introduce a Chinese parts factory to a US shop chain. Earn % of every transaction in your introduced corridor — for life." },
];

const FINANCIAL_NUMBERS = [
  { e: "💰", n: "$5–15B/yr", t: "Addressable take-rate (year 5)" },
  { e: "📈", n: "3–5%",      t: "Platform fee on factory-direct GMV" },
  { e: "🌐", n: "60+",        t: "Source countries · 200+ verified manufacturers" },
  { e: "🚛", n: "1 → 10K",    t: "Order range · single unit to container loads" },
  { e: "⚡", n: "< 24h",      t: "Quote turnaround (verified suppliers)" },
  { e: "🛡️", n: "100%",       t: "Stripe-escrowed · milestone payments · DDP pricing" },
];

export default function SourcingPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">🌐 Global Sourcing Hub · Canton Fair × Alibaba × Stripe Escrow — for Auto</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          The world's <span className="text-amber-400">factory floor</span>,{" "}
          one <span className="text-emerald-400">transparent</span> rail.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          Independent shops. Dealer groups. Municipal fleets. Construction crews. Sovereign governments. Now they can all
          source <strong className="text-amber-300">factory-direct</strong> across <strong className="text-amber-300">60+ countries</strong> —
          parts, EV chargers, fleet vehicles, garage equipment, batteries, heavy-duty rigs — at{" "}
          <strong className="text-emerald-300">3–5% protocol fee</strong>, with{" "}
          <strong className="text-emerald-300">Stripe-escrowed milestone payments</strong> and zero broker spread.
        </p>
        <p className="mt-4 max-w-3xl text-zinc-400 text-sm">
          This is the 25th revenue line, the bridge between manufacturers and every other constituency on 3C ONYX. By the people, for the people, globally — at industrial scale.
        </p>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FINANCIAL_NUMBERS.map((f) => (
            <div key={f.t} className="rounded-lg border border-amber-500/30 bg-zinc-950/60 p-5">
              <div className="text-2xl">{f.e}</div>
              <div className="mt-1 text-3xl font-black text-amber-400">{f.n}</div>
              <div className="mt-1 text-sm text-zinc-300">{f.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">What you can source — <span className="text-amber-400">factory-direct</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">Six initial categories, expanding as the protocol scales corridor by corridor.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {CATEGORIES.map((c) => (
            <div key={c.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-amber-500/40 transition">
              <div className="text-3xl">{c.e}</div>
              <div className="mt-1 font-bold text-amber-300 text-lg">{c.t}</div>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-zinc-300 font-semibold">What:</span> {c.items}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-zinc-300 font-semibold">Sources:</span> {c.sources}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-zinc-300 font-semibold">MOQ:</span> {c.moq}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-emerald-300 font-semibold">Buyer saves:</span> {c.save}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">How it works — <span className="text-amber-400">5 steps, every transaction</span></h2>
        <div className="mt-6 grid md:grid-cols-5 gap-3">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-5">
              <div className="text-4xl font-black text-amber-400">{s.n}</div>
              <div className="mt-2 text-sm font-bold text-amber-300">{s.t}</div>
              <p className="mt-2 text-xs text-zinc-300">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who benefits */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Who wins when sourcing is open</h2>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHO_BENEFITS.map((w) => (
            <div key={w.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-3xl">{w.e}</div>
              <div className="mt-1 font-bold text-amber-300">{w.t}</div>
              <p className="mt-2 text-sm text-zinc-300">{w.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Manufacturers are the <span className="text-amber-400">missing constituency</span>.{" "}
            Now they're <span className="text-emerald-400">in the bridge</span> too.
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            Hobos with valid IDs. Teens with permits. Truckers. Soldiers. Athletes. Governments. And now the factories
            themselves — in <strong className="text-amber-300">60+ source countries</strong> — sell directly to all of
            them on the same protocol, with <strong className="text-emerald-300">transparent pricing, escrowed payments,
            and a 3–5% fair-share platform fee</strong> instead of 15–35% broker stacks.{" "}
            <strong className="text-amber-300">That's how a Kilocorn gets built — not by extracting more from a few, but by
            opening fairer rails for everyone.</strong>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/revenue" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">💰 25 Revenue Streams</Link>
            <Link href="/government" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🏛️ Sovereign Fleet</Link>
            <Link href="/everything" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
