import { Link } from "wouter";

const CONSTITUENCIES = [
  { e: "🪪", t: "Anyone with a valid ID",
    who: "Driver's license · State ID · Passport · Refugee/asylum doc · Tribal ID · Consular ID · Work permit · Military ID · School ID (where legal to drive)",
    save: "Skip dealer markup · pre-approved financing in minutes · transparent fees, never hidden",
    maintain: "Find honest local shops with verified ratings · parts at fleet pricing · service reminders" },
  { e: "🏠", t: "Unhoused / housing-insecure with valid ID",
    who: "If you have any government-issued or recognized ID, you qualify. Period. No address required to start — we work with shelters, VA offices, and outreach orgs to verify.",
    save: "Pathway-to-vehicle programs · sliding-scale referral payouts · earn money as a Connector before you ever buy",
    maintain: "Free basic-check days · partner shop network · roadside referral wallet" },
  { e: "🎓", t: "Teens of legal driving age",
    who: "16+ in most US states · 17+ in EU · 18+ where required. Parent/guardian co-sign tier built in.",
    save: "First-driver insurance via InsureMO · graduated pricing · earn referral income from day one",
    maintain: "Beginner-friendly maintenance guides · safety-first service network · learning resources" },
  { e: "🏛️", t: "College students globally",
    who: "Any accredited college/university worldwide · student ID + valid driving doc",
    save: "Student-tier pricing · campus shuttle alternatives · ride-share earnings · gap-year sabbatical pause",
    maintain: "Campus-area service partners · winter/summer storage · breakdown coverage abroad" },
  { e: "🏥", t: "Hospital & healthcare workers",
    who: "Doctors · nurses · EMTs · paramedics · techs · admin · janitorial — every role, every shift",
    save: "Healthcare-hero tier · night-shift safe parking · fleet pricing on commuter vehicles",
    maintain: "Priority service (because you save lives — your car can't be down) · 24/7 roadside" },
  { e: "🏗️", t: "Construction contractors",
    who: "GCs · subs · framers · electricians · plumbers · roofers · landscapers · operators · day-laborers with valid ID",
    save: "Trade-vehicle financing · bulk-fleet pricing for crews · tool-vehicle insurance via InsureMO",
    maintain: "Heavy-use service plans · job-site mobile mechanics · parts marketplace at trade pricing" },
  { e: "⚓", t: "Ports · shipping · maritime",
    who: "Longshoremen · port operators · customs · freight forwarders · ship crew on shore leave",
    save: "Port-area fleet hubs · short-term rental for crews on rotation · multi-currency settlement",
    maintain: "Coastal-climate service network (salt-air rust care) · cross-border title support" },
  { e: "🚛", t: "Logistics · trucking · last-mile",
    who: "OTR drivers · regional · local · gig drivers (Uber/Lyft/DoorDash) · independent owner-operators",
    save: "Owner-op financing · fuel-card integration · dispatch-ready vehicles · referral wallet on every load",
    maintain: "DOT inspection prep · 24/7 nationwide bay network · downtime-replacement loaners" },
  { e: "🛡️", t: "Every army globally — 100%",
    who: "Active · reserve · veteran · contractor support — NATO · UN · AU · ASEAN · GCC · BRICS · neutral states · every flag, every uniform, every base",
    save: "Military-tier pricing matched or beaten · PCS-move vehicle programs · deployment-pause storage · veteran small-biz Connector tier",
    maintain: "Base-adjacent service partners worldwide · global title transfer support · spouse + dependent access included" },
];

const ID_MATRIX = [
  { id: "Driver's License (any country)",     accept: "✅ Primary" },
  { id: "State / Province / National ID",     accept: "✅ Primary" },
  { id: "Passport (any country)",             accept: "✅ Primary" },
  { id: "Military ID (any nation)",           accept: "✅ Primary" },
  { id: "Refugee / Asylum / UNHCR document",  accept: "✅ Honored" },
  { id: "Tribal / Indigenous Nation ID",      accept: "✅ Honored" },
  { id: "Consular ID (Matrícula etc.)",       accept: "✅ Honored" },
  { id: "Student ID (accredited school)",     accept: "✅ Secondary (with above)" },
  { id: "Work permit / Employment auth",      accept: "✅ Honored" },
  { id: "Veteran ID / VA card",               accept: "✅ Honored + bonus tier" },
];

const BRIDGE_PROMISES = [
  { e: "🌉", t: "We are the BRIDGE",
    p: "3C ONYX does not replace your bank, your dealer, your shop, your insurer, your government. We connect them — fairly, transparently, in your language, on your device, at your tier. The middlemen who used to extract value? They become honest service providers paid fair rates by you, the owner of your own data." },
  { e: "💰", t: "We help you SAVE",
    p: "Pre-approved financing through 12K+ banks (Plaid). 200M+ live vehicle prices (Marketcheck). Rental aggregator across Turo · Hertz · Avis · Sixt · P2P (Crawler). Insurance shopped across 300+ carriers in 70+ countries (InsureMO). The platform takes a small fair share — the savings stay with you." },
  { e: "🔧", t: "We help you MAINTAIN",
    p: "Verified-shop network · parts marketplace at fleet pricing · service reminders · DOT/state inspection prep · 24/7 roadside referral · downtime-replacement loaners · climate-specific care guides · honest local mechanics rated by people who actually used them." },
];

const STEPS_123 = [
  { n: "1", t: "Show your ID",      p: "Snap a photo of any valid ID — we accept the world." },
  { n: "2", t: "Pick what you need", p: "Buy · Rent · Insure · Finance · Service. Or just earn as a Connector." },
  { n: "3", t: "Drive · Save · Earn", p: "Approved in minutes. Money saved on day one. Referral wallet opens immediately." },
];

const STEPS_ABC = [
  { n: "A", t: "Any valid ID is welcome",   p: "License, passport, refugee doc, military ID, tribal ID, work permit — if it's real, you're in." },
  { n: "B", t: "Bridge to every service",   p: "Banks, dealers, shops, insurers, rentals, governments — connected on one protocol, in your language." },
  { n: "C", t: "Carry value back to you",   p: "Fair fees. Transparent pricing. Referral payouts. Your data stays yours. The savings stay with you." },
];

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">🌐 Universal Access · By The People · For The People · Globally</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          Easy as <span className="text-amber-400">1·2·3</span>.{" "}
          Open as <span className="text-emerald-400">A·B·C</span>.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          If you have a valid ID — <strong className="text-amber-300">any</strong> valid ID, from{" "}
          <strong className="text-amber-300">any</strong> country, on{" "}
          <strong className="text-amber-300">any</strong> device, in{" "}
          <strong className="text-amber-300">any</strong> language —{" "}
          <strong className="text-emerald-300">you are welcome here.</strong> Hobos with a state ID. Teens of legal driving age.
          College students. Hospital workers. Construction crews. Port and shipping workers. Truckers. Every army on Earth.
          Everyone. <strong className="text-amber-300">3C ONYX is the bridge — and the bridge is open.</strong>
        </p>
      </section>

      {/* 1-2-3 */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl md:text-4xl font-bold">It's <span className="text-amber-400">1·2·3</span></h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {STEPS_123.map((s) => (
            <div key={s.n} className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-6">
              <div className="text-5xl font-black text-amber-400">{s.n}</div>
              <div className="mt-2 text-xl font-bold">{s.t}</div>
              <p className="mt-2 text-zinc-300 text-sm">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A-B-C */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="text-3xl md:text-4xl font-bold">And it's <span className="text-emerald-400">A·B·C</span></h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {STEPS_ABC.map((s) => (
            <div key={s.n} className="rounded-xl border border-emerald-500/30 bg-zinc-950/60 p-6">
              <div className="text-5xl font-black text-emerald-400">{s.n}</div>
              <div className="mt-2 text-xl font-bold">{s.t}</div>
              <p className="mt-2 text-zinc-300 text-sm">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Constituencies */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">Who we serve — <span className="text-amber-400">everyone</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">No one is too small. No one is too big. No one is too far. No one is too poor.</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONSTITUENCIES.map((c) => (
            <div key={c.t} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-amber-500/40 transition">
              <div className="text-3xl">{c.e}</div>
              <div className="mt-1 font-bold text-amber-300">{c.t}</div>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-zinc-300 font-semibold">Who:</span> {c.who}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-emerald-300 font-semibold">Save:</span> {c.save}</p>
              <p className="mt-2 text-xs text-zinc-400"><span className="text-amber-300 font-semibold">Maintain:</span> {c.maintain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ID Matrix */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">🪪 Every valid ID is <span className="text-amber-400">honored</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">No one is turned away for being undocumented in the wrong country, unhoused, on the road, or between papers. If a recognized authority issued it, we accept it.</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400 uppercase text-xs tracking-wider">
              <tr><th className="text-left p-3">ID Type</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {ID_MATRIX.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 text-zinc-200">{r.id}</td>
                  <td className="p-3 text-emerald-300 font-semibold">{r.accept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bridge / Save / Maintain */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">The platform is the <span className="text-amber-400">BRIDGE</span></h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {BRIDGE_PROMISES.map((b) => (
            <div key={b.t} className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-emerald-500/5 p-6">
              <div className="text-3xl">{b.e}</div>
              <div className="mt-1 font-bold text-amber-300 text-lg">{b.t}</div>
              <p className="mt-2 text-zinc-300 text-sm">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            One protocol. Every human. <span className="text-amber-400">Every flag.</span>{" "}
            <span className="text-emerald-400">Every army.</span> Every corner of Earth.
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            <strong className="text-amber-300">3C ONYX is the bridge.</strong> We don't take your data. We don't lock you in. We don't extract value
            from people who have little to spare. We connect you — fairly, transparently, with dignity — to the services that help you{" "}
            <strong className="text-emerald-300">save money</strong> and <strong className="text-emerald-300">maintain what you have</strong>.
            That's the whole creed. That's why this exists.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/door" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🚪 Walk through The Door</Link>
            <Link href="/government" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🏛️ Sovereign Fleet Protocol</Link>
            <Link href="/everything" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
