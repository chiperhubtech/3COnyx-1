import { Link } from "wouter";

const CIRCLES = [
  { e: "🏀", t: "Pro Athletes",
    who: "NBA · NFL · MLB · NHL · MLS · WNBA · NCAA · F1 · MotoGP · NASCAR · IndyCar · UFC · Boxing · Tennis · Golf · Cycling · Surf · Skate · Olympic federations · Premier League · La Liga · Serie A · Bundesliga · Ligue 1 · J-League · K-League · CSL · IPL cricket · NRL · AFL · global esports orgs",
    use: "Custom-built daily drivers via CUXTOMCANDYCLUB · enclosed transport between cities · gameday fleet · family-safe secondary vehicles · post-career investment vehicles" },
  { e: "🎤", t: "Music & Entertainment",
    who: "Recording artists · touring musicians · DJs · producers · actors · directors · comedians · podcasters · content creators · streamers · YouTubers · TikTok stars",
    use: "Tour bus fleet ops · city-to-city enclosed delivery · video-shoot vehicle rental · custom builds for music videos · crew transport · greenroom discretion" },
  { e: "👔", t: "Their Teams",
    who: "Agents · managers · publicists · stylists · trainers · chefs · security details · drivers · assistants · road managers · tour managers · NIL collectives",
    use: "Single dashboard to manage talent's full vehicle life — purchase, lease, insure, maintain, ship, sell — across continents in any time zone, any currency" },
  { e: "🛡️", t: "Privacy & Security First",
    who: "Anyone who needs total discretion — high-net-worth, public figures, witness-protection, diplomatic, family-of-public-figures",
    use: "Anonymous-LLC purchase rails · NDA-bound shop network · armored upgrades via partner network · routes off public tracking · zero data sold, ever" },
  { e: "🏎️", t: "Custom Builds — CUXTOMCANDYCLUB Tier",
    who: "Anyone wanting a bespoke vehicle — paint, wheels, audio, interior, performance, wraps, EV conversions, concours restorations",
    use: "Direct line to vetted shops globally · transparent build sheets · Stripe-escrowed milestone payments · global shipping included · resale lane when ready for the next one" },
  { e: "💼", t: "League & Franchise Ops",
    who: "Team operations directors · player-services VPs · franchise GMs · league commissioners · NIL platforms · player-development orgs",
    use: "White-label the protocol for your roster · bulk fleet pricing · player-onboarding programs · post-career transition support · sponsorship integration with OEMs" },
];

const WHY_TEAMS_DEMAND_IT = [
  { e: "⚡", t: "Faster than their current concierge",     p: "AI-matched verified shop in < 8 sec vs. 'let me make a few calls' from the assistant. The Velocity Doctrine applies at every tier." },
  { e: "💰", t: "No more dealer markup tax on celebrity",   p: "Famous people get gouged. We see the real price (Marketcheck) and shop the real market — no 'celebrity premium' allowed on the protocol." },
  { e: "🔒", t: "Privacy by architecture",                  p: "Anonymous-LLC purchase rails · encrypted transit logs · zero data sold to insurance/marketing aggregators · NDA-bound partner network." },
  { e: "🌐", t: "Works the same in LA · London · Lagos · Dubai · Tokyo · São Paulo", p: "Same dashboard for the talent in every city of their tour or season. Multi-currency Stripe. Cross-border title support." },
  { e: "🤝", t: "The team earns too",                       p: "Agents, managers, road managers can be Connectors — when they manage talent's vehicle life on the platform, they earn referral wallet payouts. Aligned incentives." },
  { e: "📈", t: "Post-career readiness",                    p: "Athletes have ~3.5 yr avg careers. We help them build a vehicle-asset portfolio while earning, not after the income stops." },
];

const USE_OR_DEMAND = [
  { n: "1", t: "USE it personally",        p: "Tap once. AI matches your needs (drive · ship · custom · insure · invest). Your assistant gets cc'd on every step. You stay in control." },
  { n: "2", t: "DEMAND your team uses it", p: "Hand the dashboard to your manager / agent / road-manager. They run your full vehicle life through one transparent rail. You see every line. Nobody pads invoices anymore." },
  { n: "3", t: "AMPLIFY it",               p: "Post once → AXON syndicates to 12 platforms in 6 voices · 720 posts. Your following gets the same protocol benefits at consumer tier. Your endorsement = real money for the people who follow you." },
];

export default function IconsPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">⭐ Icons Tier · Every Athlete · Every Celebrity · Every Team · Globally</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          For every <span className="text-amber-400">athlete</span>.{" "}
          Every <span className="text-emerald-400">celebrity</span>.{" "}
          And every <span className="text-amber-400">team</span> behind them.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          The same protocol that opens the door for a hobo with a state ID is the protocol the world's biggest names should
          run their vehicle life through — <strong className="text-amber-300">because it's faster, fairer, more private,
          and more profitable</strong> than any concierge service they're paying today.{" "}
          <strong className="text-emerald-300">Use it yourself, or demand your team use it for you.</strong> Either way,
          your money stops getting wasted and your time stops getting stolen.
        </p>
      </section>

      {/* Use or Demand */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl md:text-4xl font-bold">Three ways in — <span className="text-amber-400">all open</span></h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {USE_OR_DEMAND.map((s) => (
            <div key={s.n} className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-6">
              <div className="text-5xl font-black text-amber-400">{s.n}</div>
              <div className="mt-2 text-xl font-bold">{s.t}</div>
              <p className="mt-2 text-zinc-300 text-sm">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Circles */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Who the Icons tier serves — <span className="text-amber-400">globally</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">From rookies to legends. From garage-band to stadium tour. From local league to global federation. Same protocol. Concierge velocity at every tier.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {CIRCLES.map((c) => (
            <div key={c.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-amber-500/40 transition">
              <div className="text-3xl">{c.e}</div>
              <div className="mt-1 font-bold text-amber-300 text-lg">{c.t}</div>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-zinc-300 font-semibold">Who:</span> {c.who}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-emerald-300 font-semibold">How they use it:</span> {c.use}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why teams should DEMAND it */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Why every team should <span className="text-amber-400">demand</span> the protocol</h2>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY_TEAMS_DEMAND_IT.map((w) => (
            <div key={w.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-3xl">{w.e}</div>
              <div className="mt-1 font-bold text-amber-300">{w.t}</div>
              <p className="mt-2 text-sm text-zinc-300">{w.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The honest framing */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 p-8">
          <h3 className="text-2xl md:text-3xl font-bold leading-tight">
            🎙️ The honest pitch to every icon:
          </h3>
          <p className="mt-4 text-zinc-200">
            <em>"You already have an assistant who books your cars. You already have an agent who negotiates your sponsorships.
            You already have a manager who fields the calls. We don't replace any of them — we give them
            <strong className="text-amber-300"> one transparent rail</strong> so they stop wasting your money on dealer
            markups, broker spreads, padded invoices, and insurance gouging. Your team keeps their job; they just do it
            <strong className="text-emerald-300"> faster, cheaper, and with receipts you can read</strong>. And when you
            mention us to your followers, the same protocol opens the same door for them — at consumer tier — and you
            earn a Connector share for every door you opened. <strong className="text-amber-300">Aligned. Clean. Public.
            Fair.</strong>"</em>
          </p>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            From the locker room to the tour bus.{" "}
            <span className="text-amber-400">From the red carpet to the green room.</span>{" "}
            <span className="text-emerald-400">One protocol. Total dignity. Total speed.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            The same bridge that welcomes a teen with a learner's permit welcomes the world #1. The same fair-share
            that protects a single mom in Lagos protects the touring artist in Tokyo. <strong className="text-amber-300">
            Your fame doesn't get you a worse deal here — it gets you a faster one, and your endorsement pays the people
            who follow you.</strong> That's the difference between extraction and ecosystem.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/access" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🌐 Universal Access · 1·2·3</Link>
            <Link href="/velocity" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">⚡ Velocity Doctrine</Link>
            <Link href="/everything" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
