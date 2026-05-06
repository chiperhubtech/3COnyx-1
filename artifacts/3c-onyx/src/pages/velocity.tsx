import { Link } from "wouter";

const SPEED_BENCHMARKS = [
  { flow: "Find a verified mechanic near you",            them: "Angie's List · Yelp",       themTime: "~15–45 min browsing",       us: "AI match in < 8 sec" },
  { flow: "Get a tow / roadside",                         them: "AAA · Honk",                themTime: "~5–10 min call + 30–90 min wait", us: "AI dispatch in < 12 sec, ETA live" },
  { flow: "Get a ride",                                   them: "Uber · Lyft",               themTime: "~30–90 sec match, surge pricing", us: "AI match in < 6 sec, transparent fare" },
  { flow: "Order a part / accessory",                     them: "Amazon · eBay Motors",      themTime: "~5–20 min search + checkout",     us: "AI fit-check + 1-tap order in < 10 sec" },
  { flow: "Search vehicles for sale",                     them: "Craigslist · CarGurus",     themTime: "~30 min sift through scams",      us: "AI-verified inventory in < 4 sec" },
  { flow: "Find any local service business",              them: "Google · Yelp",             themTime: "~10–30 min reviews + calls",      us: "AI rank + auto-quote in < 8 sec" },
  { flow: "Order food (driver downtime use case)",        them: "DoorDash · Uber Eats",      themTime: "~3–8 min browse + checkout",      us: "1-tap reorder in < 5 sec" },
  { flow: "Verify driver / pro identity",                 them: "Manual KYC, days",          themTime: "~24–72 hr",                       us: "Stripe Identity in < 60 sec" },
  { flow: "Match insurance quote",                        them: "The General · Progressive", themTime: "~5–15 min form",                  us: "InsureMO multi-carrier in < 30 sec" },
  { flow: "Get pre-approved financing",                   them: "Bank visit · LendingTree",  themTime: "~24–72 hr",                       us: "Plaid pre-approval in < 90 sec" },
];

const AI_FUSION = [
  { e: "🧠", t: "AI as the matchmaker",
    p: "End user types 'brakes squeaking, drive safe to work tomorrow' → AI parses intent, vehicle, location, urgency, budget → matches a verified pro within seconds. No browsing. No comparison-shopping. No phone tag." },
  { e: "🪪", t: "AI as the verifier",
    p: "Pro uploads license, insurance, certifications once → AI re-verifies with state/national databases continuously. End user sees a green badge, not a blank profile. Trust is computed, not advertised." },
  { e: "💸", t: "AI as the price-keeper",
    p: "AI watches the market in real time across Marketcheck, Crawler, InsureMO, parts marketplaces → quotes the user the FAIR price, shows the pro the FAIR margin. Both sides win because nobody's getting fleeced." },
  { e: "📲", t: "AI as the translator",
    p: "Pro speaks Spanish, user speaks Mandarin? Doesn't matter. AI translates the intake, the diagnosis, the quote, the receipt — all in real time. The bridge speaks every language." },
  { e: "🔁", t: "AI as the loop-closer",
    p: "After the job: AI prompts review, schedules follow-up, books next service, suggests cross-sell (insurance up for renewal? lender refi cheaper now?) — the relationship doesn't die at checkout." },
  { e: "💰", t: "AI as the wallet",
    p: "Referral payouts, Connector commissions, fleet rebates, Stripe Connect splits — all calculated and paid out automatically. No invoices, no chasing money, no 30-day-net waiting." },
];

const COMPETITORS = [
  { name: "Uber",         what: "Rides only · driver-hostile margins · no parts/service/sales/finance", lose: "Loses every non-ride dollar" },
  { name: "AAA",          what: "Roadside only · membership friction · slow phone-based dispatch",       lose: "Loses everyone under 35" },
  { name: "DoorDash",     what: "Food only · ignores the vehicle the driver depends on",                  lose: "Driver downtime = our upside" },
  { name: "Angie's List", what: "Browse-and-call directory · slow · paid placements skew rankings",       lose: "AI match beats browse, every time" },
  { name: "Craigslist",   what: "No verification · scam-heavy · 1995 UX · no trust layer",                lose: "Verified inventory wins outright" },
  { name: "Amazon",       what: "Generic parts · no fit-check · no install network · no trade pricing",   lose: "Loses the install + service tail" },
  { name: "Google",       what: "Ads-first ranking · no transaction layer · no follow-through",           lose: "Loses transaction take-rate" },
  { name: "eBay Motors",  what: "Auction friction · no instant financing · no insurance bind",            lose: "Loses speed-to-keys race" },
  { name: "CarGurus",     what: "Listings only · no end-to-end · no service network",                     lose: "Loses post-sale lifetime value" },
];

const SPEED_PROMISE = [
  { e: "⚡", n: "< 6 sec",  t: "AI ride / pro / part match" },
  { e: "🪪", n: "< 60 sec", t: "Identity + license verify" },
  { e: "💸", n: "< 90 sec", t: "Bank pre-approval (Plaid)" },
  { e: "🛡️", n: "< 30 sec", t: "Insurance quote (InsureMO 300+ carriers)" },
  { e: "🚪", n: "< 3 min",  t: "Door-to-driveway (vehicle reserved + financed + insured)" },
  { e: "💰", n: "Instant",  t: "Connector referral wallet credited" },
];

export default function VelocityPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">⚡ Velocity Doctrine · AI × Pros × Users · Faster Than Anyone</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          Faster than <span className="text-amber-400">Uber</span>.{" "}
          Faster than <span className="text-emerald-400">AAA</span>.{" "}
          Faster than <span className="text-amber-400">all of them.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          Every vehicle moment — find, fix, fund, drive, sell, insure, refer — collapses to{" "}
          <strong className="text-amber-300">seconds</strong>, not minutes. AI is the bridge between every industry pro
          and every end user on Earth. <strong className="text-emerald-300">Either the incumbents adapt and join us, or they
          get left behind.</strong> No middle path. The clock is faster now.
        </p>
      </section>

      {/* Speed benchmarks vs incumbents */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl md:text-4xl font-bold">⚔️ Head-to-head: <span className="text-amber-400">us vs them</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">Same flows. Honest stopwatch. Public benchmark — anyone can verify.</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left p-3">Flow</th>
                <th className="text-left p-3">Incumbent</th>
                <th className="text-left p-3">Their time</th>
                <th className="text-left p-3 text-amber-300">3C ONYX</th>
              </tr>
            </thead>
            <tbody>
              {SPEED_BENCHMARKS.map((b) => (
                <tr key={b.flow} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 text-zinc-200 font-semibold">{b.flow}</td>
                  <td className="p-3 text-zinc-400">{b.them}</td>
                  <td className="p-3 text-zinc-500">{b.themTime}</td>
                  <td className="p-3 text-amber-300 font-bold">{b.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Fusion */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">🧠 AI fuses <span className="text-amber-400">pros</span> and <span className="text-emerald-400">users</span> — both sides win</h2>
        <p className="mt-3 max-w-3xl text-zinc-300">AI is not the product. AI is the bridge that collapses time, distance, language, and trust between humans who need each other.</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_FUSION.map((a) => (
            <div key={a.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-amber-500/40 transition">
              <div className="text-3xl">{a.e}</div>
              <div className="mt-1 font-bold text-amber-300">{a.t}</div>
              <p className="mt-2 text-sm text-zinc-300">{a.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Speed Promise */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">⏱️ The Speed Promise — <span className="text-amber-400">public, measured, public-shamable if we miss</span></h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPEED_PROMISE.map((s) => (
            <div key={s.t} className="rounded-lg border border-amber-500/30 bg-zinc-950/60 p-5">
              <div className="text-2xl">{s.e}</div>
              <div className="mt-1 text-3xl font-black text-amber-400">{s.n}</div>
              <div className="mt-1 text-sm text-zinc-300">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Either / Or — the challenge */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">📣 To every incumbent: <span className="text-amber-400">join</span> or <span className="text-red-400">fall behind</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">We don't fight you. We invite you. Plug your inventory, your fleet, your shop, your platform into the protocol — keep your customers, share fair revenue, get AI superpowers free. Or stay slow and watch your users walk through our door.</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left p-3">Incumbent</th>
                <th className="text-left p-3">What they do today</th>
                <th className="text-left p-3 text-red-300">What they lose if they don't join</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.name} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 text-amber-300 font-bold">{c.name}</td>
                  <td className="p-3 text-zinc-400">{c.what}</td>
                  <td className="p-3 text-red-300">{c.lose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            The clock is the new <span className="text-amber-400">currency</span>.{" "}
            <span className="text-emerald-400">We pay it back to the people.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            Every second a user wastes on a slow app is a second stolen from their life. Every minute a pro spends chasing
            leads is a minute taken from the work they trained for. <strong className="text-amber-300">3C ONYX collapses the
            seconds and gives them back — to both sides — and pays a fair share for the bridge.</strong> That's the velocity
            doctrine. That's why this wins.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/access" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🌐 Universal Access · 1·2·3</Link>
            <Link href="/door" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🚪 Walk through The Door</Link>
            <Link href="/everything" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
