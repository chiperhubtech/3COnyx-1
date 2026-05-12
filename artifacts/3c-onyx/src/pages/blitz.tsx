import { Link } from "wouter";

// ── BOOK SYNTHESIS ───────────────────────────────────────────────────────
// Lean Startup (Ries) · Blitzscaling (Hoffman) · Intelligent Investor (Graham)
// + the attached strategic letter ("narrow + sequence + validate")
// → Resolved into ONE doctrine: parallel channels, sequenced wedges,
//   measurable per channel, margin-of-safety financials underneath.

const DOCTRINE = [
  { e: "🔬", t: "Lean Startup discipline",
    p: "Every channel ships as a Build → Measure → Learn loop. One falsifiable hypothesis per channel. Pivot or persevere weekly. Vanity metrics banned." },
  { e: "🚀", t: "Blitzscaling speed",
    p: "Prioritize speed over efficiency in a winner-take-most market. Run all 8 channels in parallel from day one — first to 10M MAU on a global protocol wins for 30 years." },
  { e: "🛡️", t: "Intelligent Investor margin-of-safety",
    p: "Every dollar of growth spend has a defensible payback path. CAC < 3-month payback or the channel gets cut. Treasury holds 18-month runway minimum." },
  { e: "📜", t: "Narrow-and-sequence (your strategic letter)",
    p: "Inside each channel, one wedge first: meets → custom builds → fleet SaaS → DOT verification. Win the wedge, then expand outward. Don't fight on every front, but enter every front." },
];

// ── 8 PARALLEL CHANNELS ──────────────────────────────────────────────────
const CHANNELS = [
  { id: 1, e: "🗣️", t: "Word-of-Mouth · Connector Network",
    wedge: "100 super-connectors in 10 cities (LA, Atlanta, Houston, Miami, Detroit, NYC, Chicago, Dallas, Phoenix, Las Vegas)",
    play: "Every connector earns 5-deep referral commissions for life. The Connector wallet ships with the protocol — they get paid the second a downstream tx clears.",
    measure: "K-factor ≥ 1.4 by week 12 · 60% of new sign-ups arrive with a referrer ID",
    cost: "$0 fixed · pure variable — paid out of platform fee", color: "amber" },

  { id: 2, e: "📱", t: "Social Media · Native to Each Platform",
    wedge: "TikTok (build culture) · YouTube Shorts (motorsport) · Instagram (Icons tier) · X (CVO/sovereignty) · Reddit (DIY repair) · LinkedIn (DOT/fleet)",
    play: "One creator-style content team per platform. Each platform gets posts in its native language and rhythm — no cross-posting. 4-6 posts/day, every platform, every day.",
    measure: "10M monthly impressions per platform by day 90 · ≥ 3% engagement floor · cost-per-install < $0.40",
    cost: "$80K/mo blended (6 creators · tools · paid amplification)", color: "rose" },

  { id: 3, e: "🎮", t: "Gaming Venues · Where Car Culture Lives Online",
    wedge: "GTA V Online roleplay servers (NoPixel, Eclipse, Project Homecoming) · Forza Horizon clubs · iRacing leagues · Need For Speed Discords · Twitch IRL car streamers",
    play: "Sponsor branded car clubs in GTA RP servers · ship a real-world Connector ID for every in-game member · cross-pollinate the digital scene with the real one. Custom Twitch overlays for IRL streamers.",
    measure: "100 active in-game clubs by day 90 · 50K Twitch overlay impressions/mo · 5% of in-game members convert to real Connectors",
    cost: "$40K/mo (server sponsorships + creator deals + overlay tooling)", color: "fuchsia" },

  { id: 4, e: "🪧", t: "Guerrilla Marketing · Real-World Theater",
    wedge: "Wrap 50 cars (one per metro × 10 metros × 5 verticals) as 'mobile billboards' for top connectors · QR sticker drops at gas stations, mechanic bays, car washes, body shops",
    play: "Every wrap and sticker is a Mobile Node — scan the QR, get pulled into the network, the wrapper/dropper earns from every downstream tx. The platform pays for the wrap, the connector keeps it.",
    measure: "1M physical QR scans by day 90 · 8% scan-to-signup conversion",
    cost: "$200K one-time wrap + $30K/mo sticker logistics", color: "emerald" },

  { id: 5, e: "🏁", t: "Events & Meets · Cultural Beachhead",
    wedge: "1 flagship 3C ONYX meet per metro per month × 10 metros · piggyback on existing meets (Cars & Coffee, SEMA, Goodguys, Formula Drift paddock, local KDM/JDM nights)",
    play: "Show up with the protocol live · sign people up on the spot · ship branded gear and Mobile Node QR cards · partner with promoters for revenue share.",
    measure: "30K in-person sign-ups by day 90 · 90% retention at 30 days for in-person sign-ups", cost: "$150K/mo events + gear", color: "orange" },

  { id: 6, e: "🏛️", t: "Government & Fleet Pilots · Institutional Validation",
    wedge: "3 pilot cities (1 US, 1 EU, 1 emerging market) running the Civil Utility Layer for free for 90 days · 2 fleet operators (1 sanitation, 1 sovereign army logistics) on /utility-class telemetry",
    play: "Free pilot · publish the savings number publicly · the pilot becomes the case study that unlocks the next 50 cities. This is your Intelligent Investor moat.",
    measure: "$10M+ documented savings across 3 cities by day 90 · 1 signed paid contract by day 120",
    cost: "$0 cash · ~$300K in eng time deployed", color: "sky" },

  { id: 7, e: "🤖", t: "AI Channels · ChatGPT, Gemini, Grok, Meta",
    wedge: "Ship 3C ONYX as a first-class action/plugin/MCP server on every major AI surface · 'Ask ChatGPT to find me a car' returns 3C ONYX results",
    play: "MCP server is already wired in api-server. Submit to OpenAI Actions, Gemini Extensions, Grok Tools, Meta AI SDK. Every AI conversation about cars routes through 3C ONYX.",
    measure: "Listed on all 4 surfaces by day 60 · 500K AI-routed sessions/mo by day 120",
    cost: "$0 distribution · ~$80K eng time", color: "indigo" },

  { id: 8, e: "📺", t: "Earned Media + PR · Free Megaphones",
    wedge: "Pitch the Civil Utility savings counter to TechCrunch, The Verge, WSJ, Bloomberg, Axios · pitch the Connector wealth-creation story to Forbes, Fast Company · pitch the cultural angle to Complex, Hypebeast, Road & Track",
    play: "One narrative per outlet. The hook is always the public number — '$X saved this second by 3C ONYX.' Numbers move journalists.",
    measure: "12 tier-1 placements by day 90 · 50M impressions earned",
    cost: "$25K/mo PR retainer", color: "amber" },
];

// ── 90-DAY BLITZ TIMELINE ────────────────────────────────────────────────
const TIMELINE = [
  { d: "Days 1–7",   t: "Ignition",   p: "Publish & deploy 3conyx.ai · launch Connector wallet · seed 100 super-connectors · go live on TikTok/YT/IG/X/Reddit/LinkedIn simultaneously" },
  { d: "Days 8–30",  t: "Saturation", p: "Wrap 50 cars · ship 100K QR stickers · open 3 city pilots · submit to all 4 AI surfaces · run first 10 city meets · first PR wave" },
  { d: "Days 31–60", t: "Compounding", p: "K-factor crosses 1.0 · fleet pilots show first savings number publicly · 100 GTA RP clubs live · earned media cycles begin · first paid fleet contract signed" },
  { d: "Days 61–90", t: "Escape velocity", p: "10M MAU run-rate · per-channel CAC under $0.40 · second PR wave with first contract case study · open Series A conversations from inbound only" },
];

// ── INTELLIGENT INVESTOR — MARGIN OF SAFETY ──────────────────────────────
const FINANCIALS = [
  { k: "Total 90-day blitz spend",           v: "$2.1M",     n: "Wraps + stickers + events + paid social + PR + creators + gaming sponsorships" },
  { k: "Eng & ops cost (already-paid)",      v: "$0 incremental", n: "Cathedral is built · 9 workflows already running · marginal cost ≈ 0" },
  { k: "Target users at day 90",             v: "10M MAU",   n: "From 8 channels compounding (each must hit its measurement floor or get cut)" },
  { k: "Blended CAC at day 90",              v: "≤ $0.40",   n: "Lean Startup kill rule: any channel above $1.50 CAC by day 60 gets cut" },
  { k: "First-year revenue (conservative)",  v: "$120M",     n: "From 25 streams · weighted toward marketplace fees + Pro subscriptions + fleet pilot conversions" },
  { k: "Margin-of-safety runway",            v: "18 months", n: "Treasury hold · never below 18 months even if 4 of 8 channels miss" },
];

// ── COLOR HELPERS ────────────────────────────────────────────────────────
const RING: Record<string, string> = {
  amber: "border-amber-500/40 hover:border-amber-400",
  rose: "border-rose-500/40 hover:border-rose-400",
  fuchsia: "border-fuchsia-500/40 hover:border-fuchsia-400",
  emerald: "border-emerald-500/40 hover:border-emerald-400",
  orange: "border-orange-500/40 hover:border-orange-400",
  sky: "border-sky-500/40 hover:border-sky-400",
  indigo: "border-indigo-500/40 hover:border-indigo-400",
};
const TEXT: Record<string, string> = {
  amber: "text-amber-300",
  rose: "text-rose-300",
  fuchsia: "text-fuchsia-300",
  emerald: "text-emerald-300",
  orange: "text-orange-300",
  sky: "text-sky-300",
  indigo: "text-indigo-300",
};

export default function BlitzPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">🚀 The Blitz Doctrine · 8 channels in parallel · 90-day ignition · margin-of-safety underneath</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          <span className="text-amber-400">Lean</span> · <span className="text-rose-400">Blitz</span> ·{" "}
          <span className="text-emerald-400">Intelligent</span>
          <br />— all at once.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          The strategic letter said <em>narrow and sequence</em>. The market says <em>move now or lose the decade</em>. Both are right.
          This is how 3C ONYX honors both: <strong className="text-amber-300">8 channels open in parallel</strong>, each with{" "}
          <strong className="text-amber-300">one narrow wedge</strong>, each measured with <strong className="text-emerald-300">Lean Startup discipline</strong>,
          all funded with <strong className="text-emerald-300">Intelligent Investor margin-of-safety</strong>.
        </p>
      </section>

      {/* Doctrine — 4 books synthesized */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-2xl uppercase tracking-widest text-amber-400 mb-4">The Doctrine — 4 books, one operating system</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {DOCTRINE.map((d) => (
            <div key={d.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-3xl">{d.e}</div>
              <div className="mt-1 font-bold text-amber-300">{d.t}</div>
              <p className="mt-2 text-sm text-zinc-300">{d.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Channels */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">8 Channels · All At Once · Each With One Wedge</h2>
        <p className="mt-2 max-w-3xl text-zinc-300">Every channel below ships in week 1. Each has a falsifiable measurement. Channels that miss their floor by day 60 get cut — surviving channels get the freed budget.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {CHANNELS.map((c) => (
            <div key={c.id} className={`rounded-xl border bg-zinc-950/60 p-5 transition ${RING[c.color]}`}>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{c.e}</div>
                <div className="flex-1">
                  <div className={`text-xs uppercase tracking-widest ${TEXT[c.color]}`}>Channel #{c.id}</div>
                  <div className="font-bold text-stone-100 text-lg">{c.t}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <p><span className="text-zinc-400 font-semibold">Wedge: </span><span className="text-zinc-300">{c.wedge}</span></p>
                <p><span className="text-zinc-400 font-semibold">Play: </span><span className="text-zinc-300">{c.play}</span></p>
                <p><span className="text-emerald-400 font-semibold">Measure: </span><span className="text-zinc-300">{c.measure}</span></p>
                <p><span className="text-amber-400 font-semibold">Cost: </span><span className="text-zinc-300">{c.cost}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 90-Day Timeline */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">90-Day Blitz Timeline</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-3">
          {TIMELINE.map((t, i) => (
            <div key={t.d} className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-5">
              <div className="text-4xl font-black text-amber-400">{i + 1}</div>
              <div className="text-xs uppercase tracking-widest text-amber-300 mt-1">{t.d}</div>
              <div className="mt-2 font-bold text-stone-100">{t.t}</div>
              <p className="mt-2 text-xs text-zinc-300">{t.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligent Investor — Margin of Safety */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Margin of Safety <span className="text-zinc-500 text-base">— the financials that keep the blitz from killing us</span></h2>
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-zinc-950/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-emerald-500/10">
              <tr>
                <th className="text-left px-5 py-3 text-emerald-300 font-bold uppercase tracking-widest text-xs">Metric</th>
                <th className="text-left px-5 py-3 text-emerald-300 font-bold uppercase tracking-widest text-xs">Number</th>
                <th className="text-left px-5 py-3 text-emerald-300 font-bold uppercase tracking-widest text-xs">Note</th>
              </tr>
            </thead>
            <tbody>
              {FINANCIALS.map((f, i) => (
                <tr key={f.k} className={i % 2 === 0 ? "bg-zinc-950/40" : "bg-zinc-950/80"}>
                  <td className="px-5 py-3 text-zinc-300 font-semibold">{f.k}</td>
                  <td className="px-5 py-3 text-amber-400 font-black tabular-nums">{f.v}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{f.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-zinc-400 max-w-3xl">
          Graham's rule: never confuse growth with quality. Every channel has a kill switch. Every dollar has a payback path.
          The blitz is fast — the underlying engineering is conservative.
        </p>
      </section>

      {/* The Honest Trade-Off */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-rose-500/30 bg-zinc-950/60 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-rose-300">The honest trade-off</h2>
          <p className="mt-3 text-zinc-300">
            The strategic letter is <strong>right</strong> that most startups die from over-extension. But 3C ONYX is not a startup at the wedge stage —
            the cathedral is already built, the protocol is already deployable, the 25 revenue lines are already wired.
            What's missing is <strong className="text-amber-300">distribution</strong>, and distribution rewards parallel motion in winner-take-most markets.
          </p>
          <p className="mt-3 text-zinc-300">
            So we honor the letter <em>inside each channel</em>: one narrow wedge per channel, one falsifiable hypothesis, kill-or-keep at day 60.
            And we honor blitzscaling <em>across channels</em>: all 8 open at once, because waiting on the third one to validate would let a worse competitor with worse software win the standard.
          </p>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            The cathedral is built. The doors are open.{" "}
            <span className="text-amber-400">Now we light the world up — fast, measured, safe.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            $2.1M of disciplined growth spend across 8 parallel channels with kill-switches every 60 days, against an 18-month margin-of-safety runway,
            targeting 10M MAU and $120M year-one revenue. By the people. For the people. Globally. At Blitz speed. With Graham's discipline.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/everything" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🌐 See Everything</Link>
            <Link href="/revenue" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">💰 25 Revenue Streams</Link>
            <Link href="/utility" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">⚖️ Civil Utility Layer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
