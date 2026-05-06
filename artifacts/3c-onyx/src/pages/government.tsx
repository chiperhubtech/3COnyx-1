import { Link } from "wouter";
import { useMemo, useState } from "react";

type TrackKey = "sanitation" | "schoolbus" | "police" | "postal" | "un" | "military" | "dmv" | "disaster";

type Track = {
  key: TrackKey;
  emoji: string;
  title: string;
  audience: string;
  fleetSize: string;
  annualSpend: string;
  weOffer: string;
  theyGet: string;
  revenueModel: string;
  firstAsk: string;
};

const TRACKS: Track[] = [
  {
    key: "sanitation",
    emoji: "🚛",
    title: "Municipal Sanitation",
    audience: "City public-works departments worldwide",
    fleetSize: "~1.5M garbage trucks, sweepers, recycling rigs globally",
    annualSpend: "~$30B/yr",
    weOffer:
      "Fleet liquidity protocol — vendor-neutral procurement, telematics, parts marketplace, transparent disposal of retired trucks, EV-transition financing.",
    theyGet:
      "Lower TCO (15–30% savings vs. closed vendor lock-in), auditable to taxpayers, ESG carbon tracking baked in.",
    revenueModel: "Per-vehicle SaaS ($50–$200/mo) + 0.5–2% on resale of retired fleet.",
    firstAsk: "90-day pilot on 10 trucks. Free. We get the case study, they get modernization at zero cost.",
  },
  {
    key: "schoolbus",
    emoji: "🚌",
    title: "School Bus Fleets",
    audience: "Public school districts (US ~500K buses; global ~3M)",
    fleetSize: "~3M buses globally",
    annualSpend: "~$25B/yr (acquisition + maintenance + fuel)",
    weOffer:
      "Routing optimization, parent transparency app, driver management, EV-transition financing aligned with state/federal funding (US EPA Clean School Bus Program = $5B available).",
    theyGet:
      "Modernization that meets federal EV deadlines, parent trust, lower insurance premiums.",
    revenueModel: "Per-bus annual license ($300–$500) + EV-transition advisory fees + parts marketplace.",
    firstAsk: "Pilot in one district (Newark Public Schools, ~500 buses). Tied to your hometown story.",
  },
  {
    key: "police",
    emoji: "🚓",
    title: "Police & First Responder",
    audience: "Municipal/county/state law enforcement, fire, EMS",
    fleetSize: "~800K police + ~200K fire/EMS in US alone",
    annualSpend: "~$20B/yr globally for first-responder fleets",
    weOffer:
      "Procurement transparency, telematics, body-cam vehicle integration, evidence-chain audit trail, multi-OEM compatibility.",
    theyGet:
      "Faster procurement cycles, accountability for the public record, lower insurance, FOIA-ready logs.",
    revenueModel: "Per-vehicle annual + integration fees + KYC/verification rev share.",
    firstAsk: "Pilot with one mid-size city PD (50–200 vehicles). Public accountability is the political win.",
  },
  {
    key: "postal",
    emoji: "📮",
    title: "Postal & Last-Mile Government",
    audience: "USPS, Royal Mail, Correos, La Poste, India Post, China Post",
    fleetSize: "~2M postal vehicles globally",
    annualSpend: "~$40B/yr on fleet",
    weOffer:
      "EV transition planning (USPS is mid-$10B EV transition right now), multi-OEM procurement, route optimization, parts marketplace.",
    theyGet:
      "Vendor-neutral path off single-vendor lock-in (Oshkosh holds USPS hostage today), faster modernization.",
    revenueModel: "Multi-million-$ advisory contracts + protocol licensing + ongoing per-vehicle SaaS.",
    firstAsk: "Smaller national post office first (e.g., Caribbean nation). Reference customer for USPS later.",
  },
  {
    key: "un",
    emoji: "🌍",
    title: "UN / World Bank / NGO Vehicle Programs",
    audience: "WFP, UNICEF, UNHCR, Red Cross, Doctors Without Borders, World Bank-funded programs",
    fleetSize: "~2M vehicles (vaccine cold-chain, ambulances, water trucks, emergency response)",
    annualSpend: "~$15B/yr on fleet",
    weOffer:
      "Free/$1 Sovereign tier deployment, parts marketplace, driver training, vehicle tracking across remote regions.",
    theyGet:
      "Mobility for the world's poorest, aligned with SDG-3 (Health) and SDG-9 (Infrastructure), full transparency to donors.",
    revenueModel: "UN procurement contracts + foundation grants + downstream private-sector spillover.",
    firstAsk: "WFP Innovation Accelerator (Munich) — pilot in Kenya. UN Global Marketplace registration.",
  },
  {
    key: "military",
    emoji: "🛡️",
    title: "Every Army Globally — 100% (Non-Combat Light Fleets)",
    audience: "NATO base operations, logistics, transport, MWR (non-combat)",
    fleetSize: "~3M non-combat light vehicles globally",
    annualSpend: "~$40B/yr",
    weOffer:
      "Inventory + maintenance + parts protocol, multi-vendor sourcing, lifecycle tracking.",
    theyGet:
      "Reduced cost on non-strategic procurement, audit-ready records.",
    revenueModel: "Government contracting (high-margin, slow approval, huge ticket sizes).",
    firstAsk: "DoD Defense Innovation Unit (DIU) — they fund commercial-tech pilots. Then NATO.",
  },
  {
    key: "dmv",
    emoji: "🪪",
    title: "DMV / Title Authorities",
    audience: "State DMVs (US), provincial/national vehicle authorities globally",
    fleetSize: "Not a fleet — title issuance authority for ~280M US vehicles + ~1.4B global",
    annualSpend: "Operating budgets in the hundreds of millions",
    weOffer:
      "API integration so any 3C ONYX transaction (sale, transfer, lien release) auto-files title in real time.",
    theyGet:
      "Reduced fraud (the #1 DMV pain), faster processing, better citizen experience, zero cost to the state.",
    revenueModel: "Per-transaction fee paid by the USER, not the state. State pays $0. We pay them nothing — they save by avoiding fraud.",
    firstAsk: "One pilot state (Florida — your HQ — or New Jersey). Then scale state-by-state.",
  },
  {
    key: "disaster",
    emoji: "🌪️",
    title: "Disaster Relief Fleets",
    audience: "FEMA, Red Cross, WFP emergency operations, national civil-defense agencies",
    fleetSize: "~500K surge-capacity vehicles + on-demand civilian fleet activation",
    annualSpend: "~$8B/yr (highly variable by event)",
    weOffer:
      "Surge-capacity vehicle pool, real-time positioning, civilian opt-in fleet activation (own-your-truck, lend-it-when-needed).",
    theyGet:
      "Faster deployment in hurricanes/earthquakes/wildfires, lower standby cost, public-private mobility surge.",
    revenueModel: "Annual standby contract + per-deployment fees + civilian pay-per-use (we route + take a slice).",
    firstAsk: "FEMA Region 4 (Florida-based, your HQ region). Hurricane-readiness is annual political priority.",
  },
];

const FIRST_THREE = [
  {
    rank: "🥇",
    name: "Newark, NJ Sanitation Fleet",
    why: "Your hometown. Your origin story (\"one block in Newark\"). Mayor Ras Baraka actively courts hometown tech. Sanitation runs ~150 trucks. Pilot-able in 90 days. Press-friendly.",
    ask: "90-day free pilot on 10 trucks. We get case study + first government logo.",
    contact: "Newark Mayor's Office of Innovation & Newark Department of Public Works",
  },
  {
    rank: "🥈",
    name: "UN World Food Programme — Sub-Saharan Africa",
    why: "Your $1/free Sovereign tier was BUILT for this. WFP runs 5,000+ vehicles across Africa. UN Procurement is open, public, actively seeks protocol-level vendors.",
    ask: "Pilot in one country (Kenya is friendliest). Free first 12 months. Then UN procurement contract.",
    contact: "WFP Innovation Accelerator (Munich) + UN Global Marketplace registration",
  },
  {
    rank: "🥉",
    name: "GSA SmartPay / GSA Fleet (US Federal)",
    why: "CUXTOMCANDYCLUB LLC is Florida-incorporated → qualifies for GSA Schedule. GSA actively seeks small-business vendors. Federal fleet = 650K vehicles, $4.5B/yr.",
    ask: "GSA Schedule application → first contract on a single agency (Department of Interior fleet is most accessible).",
    contact: "SAM.gov registration + GSA Schedule 23 (Vehicle Equipment & Services)",
  },
];

const TOTAL_MARKET = [
  { seg: "US Federal fleet (GSA-managed)", fleet: "650,000",   spend: "$4.5B+"  },
  { seg: "US State + Local",                fleet: "4,000,000", spend: "$50B+"   },
  { seg: "EU public sector fleets",         fleet: "5,000,000", spend: "€60B+"   },
  { seg: "UN / World Bank / NGO fleets",    fleet: "2,000,000", spend: "$15B+"   },
  { seg: "Municipal sanitation worldwide",  fleet: "1,500,000", spend: "$30B+"   },
  { seg: "Global military light vehicles",  fleet: "3,000,000", spend: "$40B+"   },
];

const API_INTEGRATIONS = [
  { name: "Stripe",       role: "Payments + Connect (referrer payouts) + Identity (KYC/license verify)", status: "INSTALLED",           secret: "STRIPE_SECRET_KEY · STRIPE_PUBLISHABLE_KEY · STRIPE_WEBHOOK_SECRET" },
  { name: "Plaid",        role: "Bank verification · ACH funding · lender connections (12K+ banks)",     status: "READY TO WIRE",       secret: "PLAID_CLIENT_ID + PLAID_SECRET" },
  { name: "Marketcheck",  role: "Live US vehicle inventory feed (200M+ listings · sale + rental)",       status: "SECRET REQUESTED",    secret: "MARKETCHECK_API_KEY" },
  { name: "Crawler · Rentals", role: "Aggregator across Turo · Getaround · Hertz · Avis · Enterprise · Sixt + global peer-to-peer", status: "READY TO WIRE", secret: "CRAWLER_API_KEY (pick provider: Bright Data / Apify / ScrapingBee)" },
  { name: "InsureMO",     role: "Global insurance middleware — auto, gap, warranty, rideshare, fleet (300+ carriers, 70+ countries)", status: "READY TO WIRE", secret: "INSUREMO_TENANT_ID + INSUREMO_API_KEY" },
  { name: "Twilio",       role: "SMS + WhatsApp Business notifications (4B+ users worldwide)",          status: "READY TO WIRE",       secret: "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM" },
  { name: "NameCheap",    role: "DNS for 3conyx.ai + cuxtomcandyclub.ai/.com",                          status: "OWNED ✓",             secret: "NAMECHEAP_API_KEY ✓ (set)" },
  { name: "JWT + Crypto", role: "Auth tokens + at-rest encryption (every transaction signed + sealed)",  status: "READY TO WIRE",       secret: "JWT_SECRET + ENCRYPTION_KEY (paste 64+ random chars)" },
];

const ECOSYSTEM_CIRCLES = [
  { e: "🚪", t: "Buy",       v: "Marketcheck inventory · 200M+ listings"   },
  { e: "🔄", t: "Rent",      v: "Crawler aggregator · Turo · Hertz · P2P"  },
  { e: "🛡️", t: "Insure",    v: "InsureMO · 300+ carriers · 70+ countries" },
  { e: "🏦", t: "Finance",   v: "Plaid · 12K+ banks · ACH + lender match"  },
  { e: "💳", t: "Pay",       v: "Stripe · 195 countries · Connect payouts" },
  { e: "🪪", t: "Verify",    v: "Stripe Identity · scan license at home"   },
  { e: "🔧", t: "Service",   v: "Bay-shop network · parts marketplace"     },
  { e: "📤", t: "Sell",      v: "P2P · dealer · auction lanes"             },
  { e: "📦", t: "Ship",      v: "Logistics rails · cross-border FX"        },
  { e: "🤝", t: "Refer",     v: "Connector tier · referral wallet payouts" },
  { e: "🏛️", t: "Govern",    v: "Sovereign Fleet Protocol · 8 tracks"      },
  { e: "📲", t: "Reach",     v: "Twilio SMS + WhatsApp · AXON · 720 posts" },
];

export default function GovernmentPage() {
  const [activeTrack, setActiveTrack] = useState<TrackKey | "all">("all");
  const filtered = useMemo(
    () => (activeTrack === "all" ? TRACKS : TRACKS.filter((t) => t.key === activeTrack)),
    [activeTrack],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-100">
      {/* ─── Top bar ──────────────────────────────────────────────────── */}
      <header className="border-b border-amber-500/20 bg-black/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-xl">◆</span>
            <span className="font-semibold tracking-wide">3C ONYX · GOVERNMENT</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/everything" className="hover:text-amber-300">Everything</Link>
            <Link href="/door"       className="hover:text-amber-300">Door</Link>
            <Link href="/revenue"    className="hover:text-amber-300">Revenue</Link>
            <Link href="/standard"   className="hover:text-amber-300">Standard</Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs uppercase tracking-widest text-amber-300">
          🏛️ Sovereign Fleet Protocol · 3rd Pillar
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-tight">
          Every government. Every fleet.{" "}
          <span className="text-amber-400">Every continent.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          The same protocol that serves <strong>4 billion consumers</strong> and <strong>every industry professional</strong> also serves
          the <strong>institutions that move public life</strong> — sanitation trucks, school buses, ambulances, postal vans, vaccine cold-chain
          rigs, disaster-relief fleets. Not by mandate. By choice. Because it's free at the bottom, transparent at the top, and
          better than what they have today.
        </p>
        <p className="mt-4 max-w-3xl text-sm text-emerald-300/90">
          ⚖️ <strong>Consumer first. Industry pro always. Government too.</strong> The Creed does not change. No nation forces its citizens
          onto this platform. But every nation may run its own fleets on it — voluntarily, sovereignly, on the same rails.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#tracks"
            className="rounded-md bg-amber-500 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-400"
          >
            → 8 Partnership Tracks
          </a>
          <a
            href="#first-three"
            className="rounded-md border border-amber-500/40 px-5 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-500/10"
          >
            → 3 First Targets
          </a>
          <a
            href="#integrations"
            className="rounded-md border border-emerald-500/40 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
          >
            → Stripe-Only Launch Switch
          </a>
        </div>
      </section>

      {/* ─── Market size ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-emerald-400 text-xs uppercase tracking-widest mb-2">🌐 The B2G Prize</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          16 million government vehicles.{" "}
          <span className="text-emerald-400">~$200B/year.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Real, addressable, underserved by any single global player today. Capturing just <strong>0.5% = $1B/year</strong> from
          public-sector partnerships alone — one of the 24 revenue lines, on its own.
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Segment</th>
                <th className="text-right px-4 py-3 font-medium">Vehicles</th>
                <th className="text-right px-4 py-3 font-medium">Annual spend</th>
              </tr>
            </thead>
            <tbody>
              {TOTAL_MARKET.map((row) => (
                <tr key={row.seg} className="border-t border-zinc-800 hover:bg-zinc-900/30">
                  <td className="px-4 py-3">{row.seg}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{row.fleet}</td>
                  <td className="px-4 py-3 text-right text-emerald-300 font-semibold">{row.spend}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-amber-500/40 bg-amber-500/5">
                <td className="px-4 py-3 font-bold">Total addressable global government fleet</td>
                <td className="px-4 py-3 text-right font-bold">~16,000,000</td>
                <td className="px-4 py-3 text-right text-amber-400 font-bold">~$200B/yr</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 8 Partnership Tracks ─────────────────────────────────────── */}
      <section id="tracks" className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-2">🛤️ The 8 Tracks</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Eight ways governments plug in. <span className="text-amber-400">All voluntary.</span>
        </h2>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTrack("all")}
            className={`rounded-full px-4 py-1.5 text-sm border ${activeTrack === "all" ? "bg-amber-500 text-black border-amber-500" : "border-zinc-700 text-zinc-300 hover:border-amber-500/40"}`}
          >
            All 8
          </button>
          {TRACKS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTrack(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm border ${activeTrack === t.key ? "bg-amber-500 text-black border-amber-500" : "border-zinc-700 text-zinc-300 hover:border-amber-500/40"}`}
            >
              {t.emoji} {t.title}
            </button>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.key} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 hover:border-amber-500/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl">{t.emoji}</div>
                  <h3 className="mt-2 text-xl font-bold text-amber-300">{t.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{t.audience}</p>
                </div>
                <div className="text-right text-xs text-emerald-300/80">
                  <div>{t.fleetSize}</div>
                  <div className="font-semibold mt-1">{t.annualSpend}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div><span className="text-zinc-500">We offer:</span> <span className="text-zinc-200">{t.weOffer}</span></div>
                <div><span className="text-zinc-500">They get:</span> <span className="text-zinc-200">{t.theyGet}</span></div>
                <div><span className="text-zinc-500">Revenue:</span> <span className="text-emerald-300">{t.revenueModel}</span></div>
                <div className="rounded bg-amber-500/10 border border-amber-500/30 px-3 py-2 mt-3">
                  <span className="text-amber-300 text-xs font-semibold uppercase tracking-wider">First ask:</span>
                  <p className="text-zinc-200 text-sm mt-1">{t.firstAsk}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── First 3 Targets ──────────────────────────────────────────── */}
      <section id="first-three" className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-2">🎯 First 3 Targets</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          The first three doors{" "}
          <span className="text-amber-400">we knock on.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Ranked by highest probability of <strong>yes within 12 months</strong>. Each one chosen so the next one becomes easier.
        </p>

        <div className="mt-8 space-y-4">
          {FIRST_THREE.map((t) => (
            <div key={t.name} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 hover:border-amber-500/40 transition">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl">{t.rank}</span>
                <h3 className="text-2xl font-bold text-amber-300">{t.name}</h3>
              </div>
              <p className="mt-3 text-zinc-200">{t.why}</p>
              <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                  <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">The ask:</span>
                  <p className="text-zinc-200 mt-1">{t.ask}</p>
                </div>
                <div className="rounded bg-zinc-800/40 border border-zinc-700 px-3 py-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Path:</span>
                  <p className="text-zinc-200 mt-1">{t.contact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Default not Mandate ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-2">⚖️ Default, Not Mandate</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          We do not ask any nation{" "}
          <span className="text-amber-400">to force its people in.</span>
        </h2>
        <p className="mt-6 max-w-3xl text-zinc-300">
          Mandates would betray the Creed. They would never survive antitrust review (EU DMA, US Sherman Act, India CCI, China AML).
          And they would die in court within a year. Instead, 3C ONYX seeks <strong>default status</strong> — the protocol every nation's
          fleet naturally rests on because it is compliant, free at the bottom tier, vendor-neutral, and easier than building one in-house.
        </p>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Stripe never asked any country to mandate Stripe. Visa never asked. Bluetooth never asked. They simply made the alternative
          more painful. <strong className="text-amber-300">We are doing the same for global vehicle liquidity.</strong>
        </p>
      </section>

      {/* ─── Integrations / Stripe-only switch ────────────────────────── */}
      <section id="integrations" className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-emerald-400 text-xs uppercase tracking-widest mb-2">🔌 Launch Switch</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          One Stripe key.{" "}
          <span className="text-emerald-400">Whole machine starts.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-300">
          The full integration stack is wired and waiting. Domains owned. NameCheap set. Code clean. The remaining secrets each
          unlock one capability. <strong className="text-amber-300">Stripe alone unlocks revenue.</strong> Everything else can come online
          afterward without breaking the launch.
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Integration</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Secret needed</th>
              </tr>
            </thead>
            <tbody>
              {API_INTEGRATIONS.map((i) => (
                <tr key={i.name} className="border-t border-zinc-800 hover:bg-zinc-900/30">
                  <td className="px-4 py-3 font-semibold text-amber-300">{i.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{i.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      i.status.includes("INSTALLED") || i.status.includes("OWNED") ? "text-emerald-400" :
                      i.status.includes("READY") ? "text-amber-400" :
                      "text-zinc-400"
                    }`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{i.secret}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-6">
          <h3 className="text-xl font-bold text-emerald-300">🚀 Minimum-launch checklist (today)</h3>
          <ol className="mt-4 space-y-2 text-zinc-200 text-sm list-decimal list-inside">
            <li>Paste <code className="text-amber-300">JWT_SECRET</code> + <code className="text-amber-300">ENCRYPTION_KEY</code> into Replit Secrets (~2 min)</li>
            <li>Paste <code className="text-amber-300">STRIPE_SECRET_KEY</code> + <code className="text-amber-300">STRIPE_PUBLISHABLE_KEY</code> + <code className="text-amber-300">STRIPE_WEBHOOK_SECRET</code> from your Stripe dashboard (~3 min)</li>
            <li>Click <strong>Publish</strong> in Replit. Choose Reserved VM ($25/mo). (~5 min)</li>
            <li>In NameCheap, point <code className="text-amber-300">3conyx.ai</code> CNAME to the deploy URL Replit gives you. (~3 min)</li>
            <li>Done. Citizens, professionals, and governments can all walk through the door at <strong className="text-amber-300">https://3conyx.ai</strong>.</li>
          </ol>
          <p className="mt-4 text-xs text-zinc-400">
            Plaid, Marketcheck, Twilio can be added later — none of them block launch. The site, payments, referrals, license-scan
            onboarding, and government tracks are all live the moment Stripe is connected.
          </p>
        </div>
      </section>

      {/* ─── Full Economy Ecosystem ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-2">🌐 Full Economy Ecosystem</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          By the people. For the people.{" "}
          <span className="text-amber-400">Globally.</span>
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Twelve circles. One protocol. Each circle is a complete sub-economy on its own — buy, rent, insure, finance, pay,
          verify, service, sell, ship, refer, govern, reach. Connect them and you have a <strong className="text-amber-300">full
          mobility economy that any human, any pro, any government on Earth can plug into in their language, on their device,
          at their tier.</strong>
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ECOSYSTEM_CIRCLES.map((c) => (
            <div key={c.t} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 hover:border-amber-500/40 transition">
              <div className="text-2xl">{c.e}</div>
              <div className="mt-1 font-bold text-amber-300">{c.t}</div>
              <div className="text-xs text-zinc-400 mt-1">{c.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 p-6">
          <p className="text-zinc-200">
            <strong className="text-amber-300">No middleman extracts the value. No corner of Earth is excluded. No language is locked out.</strong>{" "}
            The protocol takes a small fair share at each circle — the rest stays with the people who did the work, drove the car,
            scanned the license, made the referral, ran the shop, served the city. <strong className="text-emerald-300">That is the
            difference between an extractive platform and a sovereign economy.</strong> 3C ONYX is the second.
          </p>
        </div>
      </section>

      {/* ─── Closing creed ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            One protocol. Three pillars.{" "}
            <span className="text-amber-400">No being turned away.</span>
          </h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
              <div className="text-emerald-400 text-xs uppercase tracking-widest">Pillar I</div>
              <h3 className="mt-2 text-xl font-bold">4 Billion Consumers</h3>
              <p className="mt-2 text-sm text-zinc-300">Free at the bottom. Premium at the top. Anyone with a phone — or anyone next to someone with a phone — walks through the door.</p>
              <Link href="/door" className="mt-3 inline-block text-amber-300 hover:text-amber-200 text-sm">→ /door</Link>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
              <div className="text-amber-400 text-xs uppercase tracking-widest">Pillar II</div>
              <h3 className="mt-2 text-xl font-bold">Industry Professionals</h3>
              <p className="mt-2 text-sm text-zinc-300">Dealers, mechanics, lenders, body shops, parts sellers, insurers — 100M paying seats globally on the same rails.</p>
              <Link href="/revenue" className="mt-3 inline-block text-amber-300 hover:text-amber-200 text-sm">→ /revenue</Link>
            </div>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5">
              <div className="text-amber-400 text-xs uppercase tracking-widest">Pillar III · NEW</div>
              <h3 className="mt-2 text-xl font-bold">Sovereign Governments</h3>
              <p className="mt-2 text-sm text-zinc-300">16M municipal/federal/UN/military fleets. ~$200B/yr. Voluntary, transparent, vendor-neutral. Default not mandate.</p>
              <span className="mt-3 inline-block text-amber-300 text-sm">→ /government (you are here)</span>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/everything"
              className="inline-flex items-center rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400"
            >
              ↩ Back to the Cathedral · /everything
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-zinc-500">
        3C ONYX · Sovereign Fleet Protocol · CUXTOMCANDYCLUB LLC · 3conyx.ai
      </footer>
    </div>
  );
}
