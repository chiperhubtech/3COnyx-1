import { Link } from "wouter";

// ── Tycoon Doctrine → 3C ONYX Upgrade Play ────────────────────────────
type Status = "shipped" | "active" | "next";
const BADGE: Record<Status, string> = {
  shipped: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  active:  "bg-amber-500/20  text-amber-300  border-amber-500/40",
  next:    "bg-sky-500/20    text-sky-300    border-sky-500/40",
};
const STATUS_LABEL: Record<Status, string> = { shipped: "shipped", active: "in flight", next: "next play" };

type Titan = {
  name: string;
  e: string;
  title: string;
  doctrine: string;
  play: string;
  metric: { label: string; value: string };
  upgrades: { label: string; status: Status; detail: string }[];
};

const TITANS: Titan[] = [
  {
    name: "Elon Musk", e: "🚀", title: "First Principles · Vertical Integration",
    doctrine: "Reason from physics, not analogy. Own every layer of the stack so no supplier can tax your destiny. Iterate relentlessly in public.",
    play: "3C ONYX owns the entire automotive lifecycle as one vertical: source → build → finance → insure → deliver → service → resell. Every other player rents one link; we own the chain.",
    metric: { label: "Lifecycle links owned", value: "7 / 7" },
    upgrades: [
      { label: "Full-lifecycle vertical",  status: "shipped", detail: "Sourcing → Builders → Wallet → InsureMO → Logistics → Service → resale — every link is a route today" },
      { label: "First-principles pricing",  status: "active",  detail: "Cost-plus transparency engine: show the buyer the true unit economics, not a marked-up sticker" },
      { label: "Gigafactory for builds",    status: "next",    detail: "Standardized build-spec templates so any of the 23 elite shops can fulfill any order, anywhere" },
    ],
  },
  {
    name: "Jeff Bezos", e: "📦", title: "Customer Obsession · The Flywheel",
    doctrine: "Start from the customer and work backwards. Build a flywheel where every turn makes the next turn easier. 'Your margin is my opportunity.'",
    play: "The ONYX Flywheel: lower fees → more dealers → more inventory → more buyers → more data → lower costs → lower fees. Each turn compounds. We win by taking less, not more.",
    metric: { label: "Flywheel loops live", value: "6" },
    upgrades: [
      { label: "ONYX Flywheel engine",      status: "shipped", detail: "25-stream model is designed to take a thin slice across many turns, not a fat slice once" },
      { label: "Day-1 mandate",             status: "active",  detail: "Every feature ships behind a 'is this what the customer asked for?' gate — documented on /genius" },
      { label: "Sub-24h liquidity promise", status: "next",    detail: "Buy/sell any vehicle and settle through regulated rails in under a day — Prime-grade for cars" },
    ],
  },
  {
    name: "Mark Zuckerberg", e: "🕸️", title: "Network Effects · The Social Graph",
    doctrine: "The product is the network. Every new node makes the graph more valuable to every existing node. Own the graph and you own the category.",
    play: "The Golden Key invite graph IS the social graph. 3C ONYX is invite-only by design — every member vouches for the next, so the network is pre-vetted, high-trust, and self-policing.",
    metric: { label: "Vetted invite chain", value: "1 → ∞" },
    upgrades: [
      { label: "Golden Key invite graph",   status: "shipped", detail: "Invite-only onboarding · referral codes pinned to the proof engine · every member can invite" },
      { label: "Ambassador network effect", status: "active",  detail: "QR + Ambassador campaigns · opt-in only · 5-level attribution rewards the whole chain" },
      { label: "Member-to-member liquidity", status: "next",    detail: "Let members trade inventory peer-to-peer inside the graph — the network becomes the marketplace" },
    ],
  },
  {
    name: "Sam Altman", e: "🧠", title: "AI as the Platform · Exponential Scaling",
    doctrine: "Build the intelligence layer everyone else builds on top of. Scale capability exponentially while holding headcount flat. AGI for a vertical.",
    play: "The 12-agent UACL mesh is AGI for automotive commerce — it runs the entire back office of a dealership (sales, finance, service, logistics, support) at near-zero marginal cost.",
    metric: { label: "Autonomous agents", value: "12" },
    upgrades: [
      { label: "12-agent UACL mesh",        status: "shipped", detail: "Sales, Finance, Service, Manager, Logistics, Referral, Support + 5 more — multi-AI routed" },
      { label: "MCP-native platform",       status: "shipped", detail: "Model Context Protocol server exposed — ChatGPT, Gemini, Grok, Meta can all drive ONYX" },
      { label: "Self-improving deal loop",  status: "next",    detail: "Agents learn from every closed deal · win-rate compounds without adding a single human" },
    ],
  },
  {
    name: "Warren Buffett", e: "🏰", title: "The Moat · Compounding · Margin of Safety",
    doctrine: "Buy durable competitive advantage. Compound patiently. Always build with a margin of safety. Be the owner-operator who thinks in decades.",
    play: "3C ONYX's moat is structural: regulated rails + cryptographic proof engine + invite-only graph + 25 compounding streams. Solo-owner, owner-operated, built to compound for decades.",
    metric: { label: "Compounding streams", value: "25" },
    upgrades: [
      { label: "Quadruple moat",            status: "shipped", detail: "Rails + proof engine + invite graph + multi-stream economics — documented on /hardening" },
      { label: "Margin-of-safety runway",   status: "shipped", detail: "18-month runway · $2.1M disciplined spend · detailed on /blitz" },
      { label: "Compounding treasury",      status: "next",    detail: "Reinvest commission yield into inventory float — the moat funds its own deepening" },
    ],
  },
  {
    name: "Bill Gates", e: "🪟", title: "Platform Over Product · Become the Standard",
    doctrine: "A platform is when others make more money on it than you do. Set the standard everyone builds against. 'A computer on every desk' — own the OS.",
    play: "3C ONYX isn't an app — it's the operating system for automotive commerce. An ONYX node in every dealership, shop, and fleet. The protocol others build on, not just another marketplace.",
    metric: { label: "Open API surfaces", value: "MCP + REST + tRPC" },
    upgrades: [
      { label: "ONYX as the OS",            status: "shipped", detail: "API platform · MCP server · the rails any dealer/shop/fleet plugs into — see /standard" },
      { label: "Developer ecosystem",       status: "active",  detail: "Public API + webhook surface so third parties build on ONYX and pay the tech fee" },
      { label: "Industry standard spec",    status: "next",    detail: "Publish the ONYX Proof Engine spec so title/service records are portable across the industry" },
    ],
  },
  {
    name: "Jensen Huang", e: "⛏️", title: "Picks & Shovels · Full-Stack Infrastructure",
    doctrine: "Don't mine the gold — sell the infrastructure every miner needs. Own the full accelerated stack. 'The more you buy, the more you save.'",
    play: "3C ONYX sells the rails, not the cars. We are the picks-and-shovels infrastructure for the entire automotive economy — the more volume flows through ONYX, the cheaper each transaction.",
    metric: { label: "Infra take, falling", value: "↓ per scale" },
    upgrades: [
      { label: "Infrastructure layer",      status: "shipped", detail: "Payments, identity, proof, agents, logistics — the full stack any automotive business needs" },
      { label: "Volume-discount economics",  status: "active",  detail: "Per-transaction cost falls as network volume rises — the Jensen curve, applied to mobility" },
      { label: "ONYX Compute for fleets",    status: "next",    detail: "Sell fleet-intelligence compute (routing, maintenance prediction) as a metered infra product" },
    ],
  },
  {
    name: "Steve Jobs", e: "🍎", title: "Design as Moat · Radical Simplicity",
    doctrine: "Simplicity is the ultimate sophistication. Integrate hardware and software so 'it just works.' Stand at the intersection of technology and the liberal arts.",
    play: "The deskless ONYX Black + Metallic Gold experience is the moat. Radically simple: 'a person who cannot read can join.' One-tap, mobile-first, beautiful — design nobody can copy.",
    metric: { label: "Taps to join", value: "1" },
    upgrades: [
      { label: "Deskless mobile-first PWA",  status: "shipped", detail: "#000000 + #C9A85D · WCAG AAA · installable · 'it just works' on any phone on Earth" },
      { label: "Universal accessibility",    status: "shipped", detail: "10×9 access matrix · literacy-free onboarding · 6-language switch — see /access" },
      { label: "Zero-friction magic moment", status: "next",    detail: "Snap a VIN, see a full vehicle passport in 2 seconds — the demo that sells itself" },
    ],
  },
];

const counts = TITANS.reduce(
  (acc, t) => {
    for (const u of t.upgrades) acc[u.status]++;
    acc.total += t.upgrades.length;
    return acc;
  },
  { shipped: 0, active: 0, next: 0, total: 0 } as Record<string, number>,
);

// ── Revolution Math — illustrative compounding model ────────────────────
const MATH = [
  { layer: "Global automotive transaction TAM",         value: "$4.0T / yr", note: "New + used vehicle sales worldwide" },
  { layer: "+ Parts, accessories & performance",        value: "$0.5T / yr", note: "Aftermarket · tuning · suspension · OEM parts" },
  { layer: "+ Auto finance & lending",                  value: "$1.3T / yr", note: "Loans · leases · payoff clearing" },
  { layer: "+ Insurance premiums (InsureMO)",           value: "$0.9T / yr", note: "Coverage · claims · warranty" },
  { layer: "+ Logistics, transport & fleet",            value: "$1.1T / yr", note: "Delivery · runners · fleet ops" },
  { layer: "+ Service, maintenance & roadside",         value: "$1.2T / yr", note: "Repair · maintenance · roadside" },
];
const TAM_TOTAL = "$9.0T / yr";

const SCENARIO = [
  { take: "0.10%", capture: "$9.0B / yr", label: "Year 1–3 — USA beachhead", color: "text-emerald-300" },
  { take: "0.50%", capture: "$45B / yr",  label: "Year 4–6 — North America + LATAM", color: "text-amber-300" },
  { take: "1.00%", capture: "$90B / yr",  label: "Year 7–9 — global rails", color: "text-amber-300" },
  { take: "2.40%", capture: "$216B / yr", label: "Year 10+ — the standard (25 streams)", color: "text-sky-300" },
];

export default function TycoonsPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">👑 The Tycoon Doctrine · 8 Titans · One Operating System</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          Think like the people who{" "}
          <span className="text-amber-400">built the future</span>.
          <br />Then <span className="text-emerald-400">out-build them</span>.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          Eight of the most consequential builders of this era each cracked one principle the rest of the world copies for decades. 3C ONYX doesn't pick one — it composes all eight into a single automotive operating system. Below: each doctrine, how the cathedral already applies it, and the next revolutionary play.
        </p>
      </section>

      {/* Counters */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-amber-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">Doctrines composed</div>
            <div className="mt-1 text-4xl font-black text-amber-400 tabular-nums">8</div>
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Plays shipped</div>
            <div className="mt-1 text-4xl font-black text-emerald-400 tabular-nums">{counts.shipped}</div>
          </div>
          <div className="rounded-lg border border-amber-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">In flight</div>
            <div className="mt-1 text-4xl font-black text-amber-400 tabular-nums">{counts.active}</div>
          </div>
          <div className="rounded-lg border border-sky-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-sky-300">Next plays queued</div>
            <div className="mt-1 text-4xl font-black text-sky-400 tabular-nums">{counts.next}</div>
          </div>
        </div>
      </section>

      {/* Titans */}
      {TITANS.map((t) => (
        <section key={t.name} className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl">{t.e}</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-stone-100">{t.name}</h2>
                  <div className="text-amber-400 text-sm font-semibold uppercase tracking-wide">{t.title}</div>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/40 bg-black/40 px-4 py-2 text-right">
                <div className="text-[10px] uppercase tracking-widest text-amber-300">{t.metric.label}</div>
                <div className="text-xl font-black text-amber-400 tabular-nums">{t.metric.value}</div>
              </div>
            </div>

            <p className="mt-4 text-zinc-400 italic">“{t.doctrine}”</p>
            <p className="mt-3 text-zinc-200"><span className="text-emerald-400 font-bold">The ONYX play · </span>{t.play}</p>

            <div className="mt-5 grid md:grid-cols-3 gap-2">
              {t.upgrades.map((u) => (
                <div key={u.label} className="rounded-lg border border-zinc-800 bg-black/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-stone-100 text-sm">{u.label}</div>
                    <span className={`shrink-0 text-[10px] uppercase tracking-widest font-bold border rounded px-2 py-0.5 ${BADGE[u.status]}`}>
                      {STATUS_LABEL[u.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{u.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Revolution Math */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">The Revolution Math <span className="text-zinc-500 text-base">(illustrative model — not a promise)</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">
          The tycoon move isn't to chase one number — it's to sit underneath an entire economy and take a thin, fair slice of every flow. Here's the addressable liquidity 3C ONYX is built to coordinate:
        </p>

        <div className="mt-6 grid md:grid-cols-2 gap-3">
          {MATH.map((m) => (
            <div key={m.layer} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-stone-100">{m.layer}</div>
                <div className="text-xs text-zinc-500">{m.note}</div>
              </div>
              <div className="text-xl font-black text-amber-400 tabular-nums shrink-0">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-zinc-950 p-6 flex items-center justify-between gap-4">
          <div className="text-lg font-bold text-amber-200">Total addressable automotive liquidity</div>
          <div className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">{TAM_TOTAL}</div>
        </div>

        <h3 className="mt-10 text-2xl font-bold text-stone-100">The compounding take-rate path</h3>
        <p className="mt-2 max-w-3xl text-zinc-400">
          Buffett's compounding + Bezos's thin slice + Jensen's falling unit cost: capture grows not by raising fees, but by widening the flows that pass through the rails.
        </p>
        <div className="mt-5 space-y-3">
          {SCENARIO.map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={`font-bold ${s.color}`}>{s.label}</div>
                <div className="text-xs text-zinc-500">Effective blended take across 25 streams: {s.take}</div>
              </div>
              <div className="text-2xl font-black text-stone-100 tabular-nums">{s.capture}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500 max-w-3xl">
          Figures are an illustrative strategic model of total addressable liquidity and blended take-rate scenarios — not financial guidance, not a forecast, not a promise of returns. 3C ONYX is a regulated automotive infrastructure utility, not a security or investment product. See /genius.
        </p>
      </section>

      {/* Synthesis / Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            One founder. <span className="text-amber-400">Eight doctrines.</span> <span className="text-emerald-400">One operating system.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            Musk's vertical integration. Bezos's flywheel. Zuckerberg's network graph. Altman's AI layer. Buffett's compounding moat. Gates's platform standard. Jensen's picks-and-shovels infrastructure. Jobs's design simplicity.
            No single company has ever composed all eight into one vertical. 3C ONYX does — anchored in regulated rails, cryptographic proof, and the discipline of <em>don't change, only upgrade</em>. That's not a startup. That's a category.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/everything" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🌐 See Everything</Link>
            <Link href="/revenue" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">💰 25 Revenue Streams</Link>
            <Link href="/blitz" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🚀 Blitz Doctrine</Link>
            <Link href="/genius" className="rounded-lg border border-sky-500/40 hover:bg-sky-500/10 text-sky-300 font-bold px-5 py-3 transition">⚖️ GENIUS Act</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
