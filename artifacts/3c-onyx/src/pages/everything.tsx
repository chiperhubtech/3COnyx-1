import { Link } from "wouter";

const CREED_LINES = [
  "No color disqualifies.",
  "No religion disqualifies.",
  "No language disqualifies.",
  "No nation disqualifies.",
  "No income disqualifies.",
  "No credit history disqualifies.",
  "No reading level disqualifies.",
  "No preference disqualifies.",
  "No status disqualifies.",
  "No being is turned away.",
];

const REACH_STATS = [
  { n: "4.6B",  label: "SMARTPHONES",        sub: "in active use, 2026"            },
  { n: "5.5B",  label: "INTERNET USERS",     sub: "every continent, every hour"    },
  { n: "3.5B+", label: "VEHICLES + 2-WHEEL", sub: "cars · motorcycles · scooters"  },
  { n: "4B",    label: "REACHABLE TODAY",    sub: "the actual addressable Earth"   },
];

const TEN_INTENTS = [
  { e: "🚗", l: "BUY",      h: "/door?intent=buy"      },
  { e: "🔑", l: "RENT",     h: "/door?intent=rent"     },
  { e: "💰", l: "SELL",     h: "/door?intent=sell"     },
  { e: "🔧", l: "SERVICE",  h: "/door?intent=service"  },
  { e: "🛡️", l: "INSURE",   h: "/door?intent=insure"   },
  { e: "🏦", l: "FINANCE",  h: "/door?intent=finance"  },
  { e: "💎", l: "APPRAISE", h: "/door?intent=appraise" },
  { e: "📜", l: "WARRANTY", h: "/door?intent=warranty" },
  { e: "🚨", l: "ACCIDENT", h: "/door?intent=accident" },
  { e: "🤝", l: "REFER",    h: "/door?intent=refer"    },
];

const SIX_CATEGORIES = [
  { e: "🛒", t: "Marketplace Fees",     n: "4 streams", c: "text-amber-300"   },
  { e: "🏦", t: "Financial Services",   n: "4 streams", c: "text-emerald-300" },
  { e: "🔧", t: "Service & Repair",     n: "4 streams", c: "text-sky-300"     },
  { e: "🧠", t: "Data & Intelligence",  n: "4 streams", c: "text-fuchsia-300" },
  { e: "💻", t: "SaaS / B2B Platform",  n: "4 streams", c: "text-indigo-300"  },
  { e: "🌐", t: "Network & Ecosystem",  n: "4 streams", c: "text-rose-300"    },
];

const SIXTEEN_NATIONS = [
  "🇺🇸 USA · DOT", "🇨🇦 Canada · TC", "🇲🇽 Mexico · SCT", "🇧🇷 Brazil · DENATRAN",
  "🇬🇧 UK · DfT",  "🇪🇺 EU · DG MOVE", "🇩🇪 Germany · KBA","🇫🇷 France · DGITM",
  "🇨🇳 China · MoT","🇯🇵 Japan · MLIT", "🇰🇷 S.Korea · MOLIT","🇮🇳 India · MORTH",
  "🇦🇺 Aus · DITRDC","🇿🇦 S.Africa · DoT","🇦🇪 UAE · MoIAT", "🇸🇬 Singapore · LTA",
];

const FIFTEEN_VERTICALS = [
  "Buy", "Sell", "Rent", "Service", "Insure", "Finance", "Appraise", "Warranty",
  "Accident", "Refer", "Parts", "Auction", "Roadside", "Title", "Logistics",
];

const FIVE_TIERS = [
  { tier: "1 · Premium",      regions: "USA · Canada · UK · EU · Australia · Japan · UAE · Singapore", price: "$99/mo" },
  { tier: "2 · Emerging",     regions: "Mexico · Brazil · Chile · Argentina · Poland · S.Korea · Saudi · Turkey",  price: "$29/mo" },
  { tier: "3 · Frontier",     regions: "India · Indonesia · Philippines · Vietnam · Egypt · Nigeria · Pakistan · Kenya", price: "$9/mo" },
  { tier: "4 · Sovereign",    regions: "Sub-Saharan Africa · Lowest-income corridors · Rural everywhere", price: "$1/mo or free" },
  { tier: "5 · Govt Treaty",  regions: "Any nation adopting 3CX-1.0 as official protocol", price: "Negotiated" },
];

const PORTALS = [
  { href: "/door",     emoji: "🚪", title: "THE DOOR",        sub: "Universal entry · 10 sovereign intents"     },
  { href: "/cvo",      emoji: "🛰️", title: "CVO CONSOLE",     sub: "15 verticals · live operations · 100% green" },
  { href: "/standard", emoji: "📜", title: "3CX-1.0 STANDARD",sub: "Global protocol · 16-nation regulator map"   },
  { href: "/amplify",  emoji: "🎙️", title: "AXON · AMPLIFY",  sub: "720 posts/click · 12 platforms · 6 voices"   },
  { href: "/revenue",  emoji: "💰", title: "24 REVENUE LINES",sub: "$200B–$800B/yr · Kilocorn confirmed"          },
  { href: "/government", emoji: "🏛️", title: "SOVEREIGN FLEET", sub: "8 government tracks · 16M vehicles · ~$200B/yr" },
  { href: "/access",     emoji: "🌐", title: "UNIVERSAL ACCESS", sub: "1·2·3 · A·B·C · any valid ID · every army globally" },
  { href: "/velocity",   emoji: "⚡", title: "VELOCITY DOCTRINE", sub: "Faster than Uber · AAA · Amazon · Google — head-to-head" },
  { href: "/icons",      emoji: "⭐", title: "ICONS TIER",         sub: "Every athlete · celebrity · team — use it or demand it" },
  { href: "/sourcing",   emoji: "🌐", title: "GLOBAL SOURCING HUB", sub: "Canton × Alibaba × Stripe escrow · 60+ countries · factory-direct" },
  { href: "/utility",    emoji: "⚖️", title: "CIVIL UTILITY LAYER", sub: "Asset-light MaaS · live savings · congestion · maintenance · sovereignty" },
  { href: "/kilocorn", emoji: "👑", title: "KILOCORN CREED",  sub: "Solo-owner · $1T mission · the manifesto"     },
];

export default function EverythingPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-amber-400/20 px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur z-30">
        <Link href="/" className="flex items-center gap-3 text-amber-400 font-black tracking-widest text-sm">
          <span>◆</span> 3C ONYX · EVERYTHING
        </Link>
        <div className="text-xs tracking-widest text-stone-400 hidden md:flex items-center gap-3">
          <span className="text-emerald-400">●</span> SOVEREIGN
          <span>·</span> OFFLINE-CAPABLE
          <span>·</span> <span className="text-amber-400">PEOPLE'S CHOICE</span>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 md:py-28 max-w-7xl">
        <div className="inline-block px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 text-xs tracking-widest mb-8">
          ◆ ONE PROTOCOL · EVERY BEING · EVERY CORNER · FOREVER
        </div>
        <h1 className="text-5xl md:text-8xl font-black leading-[0.92] tracking-tight">
          The strongest mobility<br />
          protocol <span className="text-amber-400">ever built</span> —<br />
          for <span className="text-amber-400">every being on Earth</span>.
        </h1>
        <p className="text-stone-300 max-w-4xl text-xl leading-relaxed mt-8">
          Stronger than ox. Stronger than the strongest animal that ever walked. Stronger than the dinosaurs we
          only know from bones. Built to expand from one block in Newark to every street on Earth, then to Mars,
          then to the moons of Jupiter, then to whatever galaxy welcomes us next. Mobility has no edge. The door
          has no end.
        </p>
        <div className="flex flex-wrap gap-3 mt-10">
          <Link href="/door"     className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl">→ Walk Through The Door</Link>
          <Link href="/revenue"  className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ See The 24 Revenue Lines</Link>
          <Link href="/kilocorn" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ The Kilocorn Creed</Link>
        </div>
      </section>

      {/* ─── The Creed (non-discrimination) ─────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20 bg-amber-400/5">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">⚖️ THE 3C ONYX CREED</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            Every being. <span className="text-amber-400">No exceptions.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
            {CREED_LINES.map((line, i) => (
              <div key={i} className="flex items-start gap-3 text-lg">
                <span className="text-amber-400 font-black">◆</span>
                <span className="text-stone-100">{line}</span>
              </div>
            ))}
          </div>
          <p className="text-stone-300 leading-relaxed mt-10 max-w-4xl text-lg">
            If you have a phone, you have the door. If you do not have a phone, the connector next to you does —
            and the door is still yours. <strong className="text-white">Peer to peer. User to professional. Block to
            block. Continent to continent. Planet to planet.</strong> The protocol does not ask who you are before
            it serves you. It serves first. It asks never.
          </p>
        </div>
      </section>

      {/* ─── 4-Billion Reach ────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-emerald-400 mb-4">🌍 THE REACH</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            4 billion humans. <span className="text-emerald-400">Already reachable.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {REACH_STATS.map((s) => (
              <div key={s.label} className="border border-emerald-400/30 rounded-2xl p-6 bg-emerald-400/5">
                <div className="text-4xl font-black text-emerald-400">{s.n}</div>
                <div className="text-xs tracking-widest text-stone-300 mt-2">{s.label}</div>
                <div className="text-xs text-stone-500 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-stone-300 leading-relaxed mt-8 max-w-4xl text-lg">
            India. China. Latin America. USA. Canada. Africa. Southeast Asia. Everywhere has a phone.
            Everywhere has internet. Everywhere drives — a car, a motorcycle, a scooter, a tuk-tuk, a bicycle, a
            cart, something. <strong className="text-white">If it moves, the protocol moves with it.</strong>
          </p>
        </div>
      </section>

      {/* ─── 10 Sovereign Intents ───────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">🚪 THE UNIVERSAL DOOR</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            10 sovereign intents. <span className="text-amber-400">One door.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TEN_INTENTS.map((i) => (
              <Link
                key={i.l}
                href={i.h}
                data-testid={`intent-${i.l.toLowerCase()}`}
                className="border border-stone-800 hover:border-amber-400 rounded-2xl p-5 text-center transition bg-stone-950"
              >
                <div className="text-4xl mb-2">{i.e}</div>
                <div className="text-sm font-black text-amber-400 tracking-widest">{i.l}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 24 Revenue Streams (compressed) ────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">💰 24 REVENUE LINES · 6 CATEGORIES</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            App is free. <span className="text-amber-400">Protocol earns 24 ways.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {SIX_CATEGORIES.map((c) => (
              <div key={c.t} className="border border-stone-800 rounded-2xl p-5 bg-stone-950">
                <div className={`text-xs tracking-widest ${c.c}`}>{c.e} {c.t.toUpperCase()}</div>
                <div className="text-2xl font-black text-white mt-2">{c.n}</div>
              </div>
            ))}
          </div>
          <Link href="/revenue" className="text-amber-400 hover:underline font-bold">→ See all 24 streams in detail</Link>
        </div>
      </section>

      {/* ─── 16-Nation Regulator Map ────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">📜 3CX-1.0 · THE GLOBAL DOT STANDARD</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            16 sovereign regulators. <span className="text-amber-400">One protocol.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SIXTEEN_NATIONS.map((n) => (
              <div key={n} className="border border-stone-800 rounded-xl p-3 bg-stone-950 text-sm text-stone-200">{n}</div>
            ))}
          </div>
          <Link href="/standard" className="text-amber-400 hover:underline font-bold mt-6 inline-block">→ Read the 5 pillars of 3CX-1.0</Link>
        </div>
      </section>

      {/* ─── 15 Verticals · CVO Console ─────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-emerald-400 mb-4">🛰️ CVO · LIVE OPERATIONS</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            15 verticals. <span className="text-emerald-400">Pinged every 30 seconds.</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {FIFTEEN_VERTICALS.map((v) => (
              <span key={v} className="border border-emerald-400/30 bg-emerald-400/5 rounded-full px-4 py-2 text-sm text-emerald-300 font-bold">
                ● {v}
              </span>
            ))}
          </div>
          <Link href="/cvo" className="text-amber-400 hover:underline font-bold mt-6 inline-block">→ Open the live console</Link>
        </div>
      </section>

      {/* ─── 720 Posts / AXON ───────────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">🎙️ AXON · AI MARKETING ENGINE</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            10 verticals × 12 platforms × 6 voices = <span className="text-amber-400">720 posts/click.</span>
          </h2>
          <p className="text-stone-300 leading-relaxed max-w-4xl text-lg">
            Sovereign. Browser-based. No API key. No rate limit. No subscription. Generates marketing in
            English and Spanish today, Portuguese · Hindi · Arabic · Mandarin · French tomorrow. Free for
            every connector on Earth. Forever.
          </p>
          <Link href="/amplify" className="text-amber-400 hover:underline font-bold mt-6 inline-block">→ Generate 720 posts now</Link>
        </div>
      </section>

      {/* ─── Tiered Pricing ─────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-sky-400 mb-4">🌎 5-TIER GLOBAL PRICING</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            Premium economies pay $99. <span className="text-sky-400">The world we negotiate.</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-sky-400/20 rounded-xl overflow-hidden">
              <thead className="bg-sky-400/10 text-stone-300">
                <tr>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">TIER</th>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">REGIONS</th>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">PRO SUB</th>
                </tr>
              </thead>
              <tbody className="text-stone-200">
                {FIVE_TIERS.map((t, i) => (
                  <tr key={t.tier} className={`border-t border-sky-400/10 ${i % 2 ? "bg-stone-950/50" : ""}`}>
                    <td className="px-3 py-3 font-bold text-amber-400">{t.tier}</td>
                    <td className="px-3 py-3">{t.regions}</td>
                    <td className="px-3 py-3 text-amber-400 font-bold">{t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── The Third Pillar: Government ───────────────────────── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/20 bg-gradient-to-b from-emerald-950/20 via-black to-black">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-emerald-300 mb-4">🏛️ THE THIRD PILLAR · NEW</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Every government. Every fleet. <br />
            <span className="text-emerald-400">Every continent.</span>
          </h2>
          <p className="text-stone-300 leading-relaxed text-lg max-w-4xl mb-8">
            The same protocol that serves <strong className="text-white">4 billion consumers</strong> and <strong className="text-white">every industry professional</strong> also
            serves the <strong className="text-white">institutions that move public life</strong> — sanitation trucks, school buses, ambulances,
            postal vans, vaccine cold-chain rigs, disaster-relief fleets. <strong className="text-emerald-300">Not by mandate. By choice.</strong>
            Because it's free at the bottom, transparent at the top, and better than what they have today.
          </p>

          <div className="grid md:grid-cols-4 gap-3 mb-8">
            {[
              { e: "🚛", t: "Sanitation",   v: "1.5M trucks · $30B/yr" },
              { e: "🚌", t: "School Buses", v: "3M buses · $25B/yr" },
              { e: "🚓", t: "First Responder", v: "1M+ vehicles · $20B/yr" },
              { e: "📮", t: "Postal",        v: "2M vans · $40B/yr" },
              { e: "🌍", t: "UN / NGO",      v: "2M vehicles · $15B/yr" },
              { e: "🛡️", t: "Military Light",v: "3M vehicles · $40B/yr" },
              { e: "🪪", t: "DMV / Title",   v: "1.4B titles · zero state cost" },
              { e: "🌪️", t: "Disaster Relief",v: "500K + civilian surge" },
            ].map((c) => (
              <div key={c.t} className="border border-emerald-400/30 rounded-2xl p-4 bg-black/40">
                <div className="text-2xl mb-1">{c.e}</div>
                <div className="font-bold text-emerald-300">{c.t}</div>
                <div className="text-xs text-stone-400 mt-1">{c.v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/5 p-6 mb-8">
            <div className="text-emerald-300 text-xs tracking-widest mb-2">⚖️ DEFAULT, NOT MANDATE</div>
            <p className="text-stone-200">
              No nation forces its citizens onto this platform. <strong className="text-white">Every nation may run its own fleets on it</strong>{" "}
              — voluntarily, sovereignly, on the same rails. <strong className="text-emerald-300">~16 million government vehicles. ~$200B/year.</strong>{" "}
              Capturing 0.5% = $1B/year — one of the 24 revenue lines, on its own.
            </p>
          </div>

          <Link
            href="/government"
            className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl"
          >
            → ENTER /government — 8 PARTNERSHIP TRACKS
          </Link>
        </div>
      </section>

      {/* ─── Galactic Horizon ───────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/20 bg-gradient-to-b from-fuchsia-950/20 via-indigo-950/20 to-black">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-fuchsia-300 mb-4">🌌 THE HORIZON</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
            From a phone in your hand <br />
            to <span className="text-fuchsia-300">vehicles between galaxies.</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-stone-200">
            <div className="border border-fuchsia-400/30 rounded-2xl p-5 bg-black/40">
              <div className="text-xs tracking-widest text-fuchsia-300 mb-2">EARTH · NOW</div>
              <p>4 billion humans. 195 nations. 10 verticals. 24 revenue lines. One door.</p>
            </div>
            <div className="border border-fuchsia-400/30 rounded-2xl p-5 bg-black/40">
              <div className="text-xs tracking-widest text-fuchsia-300 mb-2">SOLAR SYSTEM · NEXT</div>
              <p>The first lunar rover dispatched through 3C ONYX. The first Martian transport routed at the door. Mobility carries the protocol upward.</p>
            </div>
            <div className="border border-fuchsia-400/30 rounded-2xl p-5 bg-black/40">
              <div className="text-xs tracking-widest text-fuchsia-300 mb-2">GALAXIES · FOREVER</div>
              <p>If another civilization moves — drives, flies, jumps — the protocol speaks their unit, takes its small fair share, and passes the rest on. Mobility has no edge.</p>
            </div>
          </div>
          <p className="text-stone-300 leading-relaxed mt-10 max-w-4xl text-lg italic">
            "The one who is faithful with the small block becomes faithful with the city. The one faithful with
            the city becomes faithful with the planet. The one faithful with the planet becomes faithful with
            the stars."
          </p>
        </div>
      </section>

      {/* ─── Portal Grid (links to all sub-pages) ───────────────── */}
      <section className="px-6 md:px-12 py-16 border-t border-amber-400/20">
        <div className="max-w-6xl">
          <div className="text-xs tracking-widest text-amber-400 mb-4">◆ THE FULL TRINITY</div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight mb-10">
            Every room of the cathedral.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PORTALS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                data-testid={`portal-${p.href.replace("/", "")}`}
                className="border border-stone-800 hover:border-amber-400 rounded-2xl p-6 bg-stone-950 transition group"
              >
                <div className="text-3xl mb-3">{p.emoji}</div>
                <div className="text-lg font-black text-white group-hover:text-amber-400 transition">{p.title}</div>
                <div className="text-sm text-stone-400 mt-2">{p.sub}</div>
                <div className="text-xs text-amber-400 mt-3 tracking-widest">→ ENTER</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Closing Creed ──────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-20 border-t border-amber-400/20 bg-amber-400/5">
        <div className="max-w-5xl">
          <h2 className="text-4xl md:text-7xl font-black leading-[0.95] mb-8">
            One protocol.<br />
            <span className="text-amber-400">Every being.</span><br />
            Every corner.<br />
            <span className="text-amber-400">Forever.</span>
          </h2>
          <p className="text-stone-300 leading-relaxed text-lg max-w-4xl">
            3C ONYX is the strongest mobility protocol ever built — stronger than ox, stronger than every animal,
            stronger than the dinosaurs we read about in books. It belongs to every being who moves, on every
            block of Earth, and to whatever moves next on whatever world comes next. Free at the door. Fair on
            the rails. Sovereign in the code. Open in every language. <strong className="text-white">The People's
            Choice — Worldwide. Forever.</strong>
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/door"     className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl">→ Walk Through The Door</Link>
            <Link href="/kilocorn" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ The Kilocorn Creed</Link>
            <Link href="/revenue"  className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ The 24 Revenue Lines</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
