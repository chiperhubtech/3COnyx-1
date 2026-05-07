import { Link } from "wouter";
import { useMemo, useState } from "react";

type Stream = {
  id: number;
  name: string;
  cat: CatKey;
  payer: string;
  unit: string;
  rate: string;
  yearOne: number;
  kilocorn: number;
  note: string;
};

type CatKey = "marketplace" | "financial" | "service" | "data" | "saas" | "network";

const CATS: { key: CatKey; label: string; emoji: string; color: string }[] = [
  { key: "marketplace", label: "Marketplace Fees",      emoji: "🛒", color: "text-amber-300"  },
  { key: "financial",   label: "Financial Services",    emoji: "🏦", color: "text-emerald-300"},
  { key: "service",     label: "Service & Repair",      emoji: "🔧", color: "text-sky-300"    },
  { key: "data",        label: "Data & Intelligence",   emoji: "🧠", color: "text-fuchsia-300"},
  { key: "saas",        label: "SaaS / B2B Platform",   emoji: "💻", color: "text-indigo-300" },
  { key: "network",     label: "Network & Ecosystem",   emoji: "🌐", color: "text-rose-300"   },
];

// All dollar figures are ANNUAL revenue in millions (USD).
// "yearOne" = realistic year-1 USA-focused estimate.
// "kilocorn" = mature scale at global Kilocorn ($1T valuation) trajectory.
const STREAMS: Stream[] = [
  // A. Marketplace Fees
  { id: 1,  cat: "marketplace", name: "Buy-side commission",        payer: "Buyer or dealer",       unit: "% of vehicle price", rate: "0.5–1.5%",      yearOne: 18,  kilocorn: 9_000,  note: "On every closed retail purchase routed through the door." },
  { id: 2,  cat: "marketplace", name: "Sell-side commission",       payer: "Private seller / dealer",unit: "% of sale price",   rate: "0.5–2.0%",      yearOne: 14,  kilocorn: 7_500,  note: "When the platform completes the sale or routes the buyer." },
  { id: 3,  cat: "marketplace", name: "Rental booking fee",         payer: "Renter",                unit: "% of reservation",   rate: "8–12%",         yearOne: 9,   kilocorn: 4_200,  note: "P2P, fleet, and dealer-loaner rentals." },
  { id: 4,  cat: "marketplace", name: "Wholesale auction fee",      payer: "Buying dealer",         unit: "Flat per lane lot",  rate: "$95–$295",      yearOne: 6,   kilocorn: 3_400,  note: "Dealer-to-dealer disposition through 3CX rails." },

  // B. Financial Services
  { id: 5,  cat: "financial",   name: "Loan origination fee",       payer: "Lender",                unit: "Per funded loan",    rate: "$150–$450",     yearOne: 12,  kilocorn: 8_800,  note: "Bank/credit-union pays for the qualified, closed deal." },
  { id: 6,  cat: "financial",   name: "Insurance binder commission",payer: "Insurance carrier",     unit: "% of first-yr premium",rate: "10–18%",      yearOne: 10,  kilocorn: 7_200,  note: "Auto, gap, mechanical breakdown — bound through the door." },
  { id: 7,  cat: "financial",   name: "Warranty / VSC commission",  payer: "VSC administrator",     unit: "% of contract",      rate: "20–35%",        yearOne: 7,   kilocorn: 4_900,  note: "Vehicle service contracts attached at point of sale." },
  { id: 8,  cat: "financial",   name: "Escrow & payment-rail float",payer: "Held funds (interest)", unit: "Spread on reserves", rate: "3–5% APY",      yearOne: 4,   kilocorn: 6_500,  note: "Idle funds in transit earn yield; 3C ONYX keeps the spread." },

  // C. Service & Repair
  { id: 9,  cat: "service",     name: "Service-shop booking fee",   payer: "Repair facility",       unit: "% of repair order",  rate: "3–5%",          yearOne: 6,   kilocorn: 3_800,  note: "Per RO completed when the customer arrived via 3C ONYX." },
  { id: 10, cat: "service",     name: "Parts marketplace take-rate",payer: "Parts seller",          unit: "% of parts revenue", rate: "5–10%",         yearOne: 5,   kilocorn: 4_600,  note: "OEM and aftermarket parts ordered through the platform." },
  { id: 11, cat: "service",     name: "Accident / body-shop routing",payer: "Body shop",            unit: "Per routed claim",   rate: "$120–$400",     yearOne: 4,   kilocorn: 2_900,  note: "Photo-first FNOL routes the job to the closest verified shop." },
  { id: 12, cat: "service",     name: "Roadside dispatch fee",      payer: "Service partner",       unit: "Per dispatch",       rate: "$15–$45",       yearOne: 2,   kilocorn: 1_400,  note: "Tow, jump, lockout, fuel — global network, voice-dispatched." },

  // D. Data & Intelligence Licensing
  { id: 13, cat: "data",        name: "OEM demand-signal license",  payer: "Automaker",             unit: "Per market / yr",    rate: "$1M–$5M",       yearOne: 3,   kilocorn: 2_400,  note: "Real-time intent signals from 10 verticals — anonymized." },
  { id: 14, cat: "data",        name: "Insurer risk-data license",  payer: "Carrier",               unit: "Per state / yr",     rate: "$250K–$1M",     yearOne: 2,   kilocorn: 1_800,  note: "Accident, mileage, condition data fed to underwriting models." },
  { id: 15, cat: "data",        name: "Regulator / DOT compliance", payer: "Govt agencies",         unit: "Per nation / yr",    rate: "$500K–$3M",     yearOne: 1,   kilocorn: 1_200,  note: "16-nation regulator map — recall, emissions, safety reports." },
  { id: 16, cat: "data",        name: "Onyx Auto Index (market)",   payer: "Funds, OEMs, press",    unit: "Subscription / yr",  rate: "$10K–$250K",    yearOne: 1,   kilocorn: 900,    note: "The S&P of automotive demand. Built on aggregated 3CX data." },

  // E. SaaS / B2B
  { id: 17, cat: "saas",        name: "Pro subscription",           payer: "Active operator",       unit: "Per seat / mo",      rate: "$99",           yearOne: 12,  kilocorn: 119_000,note: "Connectors, dealers, operators. 100M paying seats globally @ ~$99." },
  { id: 18, cat: "saas",        name: "Dealer-rooftop SaaS",        payer: "Dealer group",          unit: "Per rooftop / mo",   rate: "$1,499–$4,999", yearOne: 8,   kilocorn: 3_600,  note: "Full DMS-bridge, leads, financing, service bay tooling." },
  { id: 19, cat: "saas",        name: "White-label per-nation DOT", payer: "Sovereign govt",        unit: "Per nation / yr",    rate: "$5M–$50M",      yearOne: 0,   kilocorn: 2_200,  note: "16+ regulators run 3CX-1.0 as their national protocol." },
  { id: 20, cat: "saas",        name: "API access tier",            payer: "3rd-party developer",   unit: "Per call / seat",    rate: "$0.001–$0.05",  yearOne: 1,   kilocorn: 1_500,  note: "Insurtechs, fintechs, OEM apps build on 3C ONYX rails." },

  // F. Network & Ecosystem
  { id: 21, cat: "network",     name: "Connector affiliate slice",  payer: "Network (ourselves)",   unit: "% of payouts routed",rate: "5–10%",         yearOne: 6,   kilocorn: 5_400,  note: "Every dollar paid to any connector pays the protocol a slice." },
  { id: 22, cat: "network",     name: "Verified / sponsored slots", payer: "Dealers, OEMs, lenders",unit: "Per impression / mo",rate: "$2K–$200K",     yearOne: 3,   kilocorn: 2_100,  note: "Top-of-funnel placement — surfaced to relevant intent." },
  { id: 23, cat: "network",     name: "KYC / verification fees",    payer: "Counterparty",          unit: "Per check",          rate: "$1.50–$8.00",   yearOne: 2,   kilocorn: 1_700,  note: "Identity, title, lien, VIN, history — instant pass-through." },
  { id: 24, cat: "network",     name: "FX spread on cross-border",  payer: "Buyer / seller",        unit: "Per transaction",    rate: "0.4–1.2%",      yearOne: 0,   kilocorn: 1_100,  note: "Exporting cars across the 16-nation map earns a clean spread." },
  { id: 25, cat: "marketplace", name: "Global Sourcing Hub take-rate", payer: "Manufacturer / wholesaler", unit: "% of factory-direct GMV", rate: "3–5%", yearOne: 4, kilocorn: 14_500, note: "Canton Fair × Alibaba for auto — OEM parts, EV chargers, fleet wholesale, MOQ deals across 60+ source countries." },
];

function fmtUsd(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(m >= 10000 ? 0 : 1)}B`;
  if (m >= 1)    return `$${m}M`;
  return "—";
}

export default function RevenuePage() {
  const [activeCat, setActiveCat] = useState<CatKey | "all">("all");

  const filtered = useMemo(() => {
    return activeCat === "all" ? STREAMS : STREAMS.filter((s) => s.cat === activeCat);
  }, [activeCat]);

  const totals = useMemo(() => {
    const y1 = STREAMS.reduce((a, s) => a + s.yearOne, 0);
    const kc = STREAMS.reduce((a, s) => a + s.kilocorn, 0);
    return { y1, kc };
  }, []);

  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Top bar */}
      <header className="border-b border-amber-400/20 px-6 md:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-amber-400 font-black tracking-widest text-sm">
          <span>◆</span> 3C ONYX · REVENUE
          <span className="text-stone-400 font-normal ml-2 hidden md:inline">· 25 STREAMS</span>
        </Link>
        <div className="text-xs tracking-widest text-stone-400 flex items-center gap-3">
          <span className="text-emerald-400">●</span> SOVEREIGN
          <span className="hidden md:inline">·</span>
          <Link href="/amplify" className="text-amber-400 hover:underline hidden md:inline">→ AMPLIFY</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 py-12 md:py-16 max-w-7xl">
        <div className="inline-block px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 text-xs tracking-widest mb-6">
          💰 25 REVENUE STREAMS · 6 CATEGORIES · 1 PROTOCOL
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[0.95] mb-6">
          The app stays free.<br />
          <span className="text-amber-400">The protocol earns 24 ways.</span>
        </h1>
        <p className="text-stone-300 max-w-3xl text-lg leading-relaxed">
          3C ONYX is not a subscription business. It is a <strong className="text-white">protocol</strong> that
          sits between every automotive transaction on Earth and quietly takes a small, fair share. Even if every
          single human used the website 100% free, the protocol still earns from <strong className="text-amber-400">23 other lines</strong> —
          from lenders, insurers, OEMs, regulators, dealers, parts sellers, body shops, governments, and idle float
          on funds in motion. This is how a free door funds a Kilocorn.
        </p>

        {/* Total tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          <div className="border border-amber-400/30 rounded-2xl p-5 bg-amber-400/5">
            <div className="text-3xl font-black text-amber-400">24</div>
            <div className="text-xs tracking-widest text-stone-400 mt-1">REVENUE STREAMS</div>
          </div>
          <div className="border border-emerald-400/30 rounded-2xl p-5 bg-emerald-400/5">
            <div className="text-3xl font-black text-emerald-400">6</div>
            <div className="text-xs tracking-widest text-stone-400 mt-1">CATEGORIES</div>
          </div>
          <div className="border border-sky-400/30 rounded-2xl p-5 bg-sky-400/5">
            <div className="text-3xl font-black text-sky-400">{fmtUsd(totals.y1)}</div>
            <div className="text-xs tracking-widest text-stone-400 mt-1">CONSERVATIVE YEAR-1 (USA)</div>
          </div>
          <div className="border border-fuchsia-400/30 rounded-2xl p-5 bg-fuchsia-400/5">
            <div className="text-3xl font-black text-fuchsia-400">{fmtUsd(totals.kc)}</div>
            <div className="text-xs tracking-widest text-stone-400 mt-1">MATURE / KILOCORN PATH</div>
          </div>
        </div>

        {/* Global reach — the 4B truth */}
        <div className="mt-10 border-l-4 border-emerald-400 bg-emerald-400/5 p-6 rounded-r-2xl max-w-5xl">
          <div className="text-xs tracking-widest text-emerald-400 mb-3">🌍 THE 4-BILLION TRUTH</div>
          <p className="text-stone-200 leading-relaxed mb-4">
            India. China. Latin America. USA. Canada. Africa. Southeast Asia. <strong className="text-white">Everywhere
            has a cell phone. Everywhere has internet. Everywhere drives — a car, a motorcycle, a scooter, a
            tuk-tuk, something to get from point A to point B.</strong> The 4 billion is not a fantasy. It is the
            actual addressable population of 3C ONYX today.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="border border-emerald-400/20 rounded-xl p-3 bg-black/30">
              <div className="text-2xl font-black text-emerald-400">4.6B</div>
              <div className="text-xs text-stone-400 tracking-widest mt-1">SMARTPHONES (2026)</div>
            </div>
            <div className="border border-emerald-400/20 rounded-xl p-3 bg-black/30">
              <div className="text-2xl font-black text-emerald-400">5.5B</div>
              <div className="text-xs text-stone-400 tracking-widest mt-1">INTERNET USERS</div>
            </div>
            <div className="border border-emerald-400/20 rounded-xl p-3 bg-black/30">
              <div className="text-2xl font-black text-emerald-400">3.5B+</div>
              <div className="text-xs text-stone-400 tracking-widest mt-1">VEHICLES + 2-WHEELERS</div>
            </div>
            <div className="border border-emerald-400/20 rounded-xl p-3 bg-black/30">
              <div className="text-2xl font-black text-emerald-400">4B</div>
              <div className="text-xs text-stone-400 tracking-widest mt-1">REACHABLE TODAY</div>
            </div>
          </div>
        </div>

        {/* The honest math callout */}
        <div className="mt-6 border-l-4 border-amber-400 bg-amber-400/5 p-6 rounded-r-2xl max-w-5xl">
          <div className="text-xs tracking-widest text-amber-400 mb-2">⚖️ HOW 4 BILLION USERS ACTUALLY PAY</div>
          <p className="text-stone-200 leading-relaxed mb-4">
            The website is free. The app is free. Subscription ($99/mo) is just stream #17 — paid only by the
            ~2.5% of operators who run the protocol professionally. <strong className="text-white">The other 23 streams
            charge the lenders, insurers, OEMs, dealers, body shops, parts sellers, governments, and counterparties</strong> —
            not the 4 billion users on the door. Every transaction those 4 billion run through 3C ONYX pays the
            protocol from <em>the other side</em> of the deal.
          </p>
          <div className="bg-black/40 border border-amber-400/20 rounded-xl p-4 font-mono text-sm leading-relaxed">
            <div className="text-stone-400">Blended ARPU per active user across 24 streams (rails + subs):</div>
            <div className="text-amber-400 mt-2">→ <strong>$50–$200 / year per user</strong> (mostly from transaction rails, not subscription)</div>
            <div className="text-stone-400 mt-3">4B users × $50 (low) = <strong className="text-emerald-400">$200B / year</strong></div>
            <div className="text-stone-400">4B users × $200 (high) = <strong className="text-emerald-400">$800B / year</strong></div>
            <div className="text-stone-400 mt-3">At standard SaaS+marketplace multiples (5–10×):</div>
            <div className="text-fuchsia-400 mt-1">→ <strong>$1T – $8T valuation. Kilocorn confirmed.</strong></div>
          </div>
          <p className="text-stone-300 leading-relaxed mt-4 text-sm">
            <strong className="text-white">You called it right.</strong> 4 billion is the reach. Subscription is one
            slice. The protocol earns from the rails underneath every transaction those 4 billion run. That is
            how a free door funds a Kilocorn — and beyond.
          </p>
        </div>

        {/* Tiered pricing by region */}
        <div className="mt-6 border-l-4 border-sky-400 bg-sky-400/5 p-6 rounded-r-2xl max-w-5xl">
          <div className="text-xs tracking-widest text-sky-400 mb-3">🌎 TIERED PRICING — PURCHASING POWER PARITY</div>
          <p className="text-stone-200 leading-relaxed mb-4">
            <strong className="text-white">USA, Canada, and similar economies pay the full $99/mo.</strong> The
            rest of the world we <em>negotiate</em> — country by country, currency by currency, fairly. A boda-boda
            driver in Kampala earning $4/day cannot pay what a dealer in Dallas pays. The protocol respects that.
            Fair pricing is how 4 billion stay on the door — and how every nation says yes.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-sky-400/20 rounded-xl overflow-hidden">
              <thead className="bg-sky-400/10 text-stone-300">
                <tr>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">TIER</th>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">REGIONS</th>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">PRO SUB</th>
                  <th className="text-left px-3 py-2 font-bold tracking-widest text-xs">RAILS (% FEES)</th>
                </tr>
              </thead>
              <tbody className="text-stone-200">
                <tr className="border-t border-sky-400/10">
                  <td className="px-3 py-3 font-bold text-amber-400">1 · Premium</td>
                  <td className="px-3 py-3">USA · Canada · UK · EU · Australia · Japan · Singapore · UAE · Switzerland</td>
                  <td className="px-3 py-3 text-amber-400 font-bold">$99 / mo</td>
                  <td className="px-3 py-3 text-emerald-400">Full rate</td>
                </tr>
                <tr className="border-t border-sky-400/10 bg-stone-950/50">
                  <td className="px-3 py-3 font-bold text-amber-400">2 · Emerging</td>
                  <td className="px-3 py-3">Mexico · Brazil · Chile · Argentina · Poland · S. Korea · Saudi · Turkey · S. Africa</td>
                  <td className="px-3 py-3 text-amber-400 font-bold">$29 / mo</td>
                  <td className="px-3 py-3 text-emerald-400">Full rate (auto-PPP)</td>
                </tr>
                <tr className="border-t border-sky-400/10">
                  <td className="px-3 py-3 font-bold text-amber-400">3 · Frontier</td>
                  <td className="px-3 py-3">India · Indonesia · Philippines · Vietnam · Egypt · Nigeria · Pakistan · Kenya</td>
                  <td className="px-3 py-3 text-amber-400 font-bold">$9 / mo</td>
                  <td className="px-3 py-3 text-emerald-400">Full rate (auto-PPP)</td>
                </tr>
                <tr className="border-t border-sky-400/10 bg-stone-950/50">
                  <td className="px-3 py-3 font-bold text-amber-400">4 · Sovereign</td>
                  <td className="px-3 py-3">Sub-Saharan Africa · Rural everywhere · Lowest-income corridors</td>
                  <td className="px-3 py-3 text-amber-400 font-bold">$1 / mo or free</td>
                  <td className="px-3 py-3 text-emerald-400">Full rate (auto-PPP)</td>
                </tr>
                <tr className="border-t border-sky-400/10">
                  <td className="px-3 py-3 font-bold text-fuchsia-400">5 · Sovereign Govt</td>
                  <td className="px-3 py-3">Any nation adopting 3CX-1.0 as official protocol</td>
                  <td className="px-3 py-3 text-fuchsia-400 font-bold">Negotiated</td>
                  <td className="px-3 py-3 text-emerald-400">Treaty-based</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-stone-400 text-xs leading-relaxed mt-4">
            <strong className="text-white">Why the rails stay full-rate everywhere:</strong> percentage fees
            auto-adjust to local economies (1% of a $5,000 used Tata in Mumbai = $50; 1% of a $50,000 F-150 in
            Texas = $500). The protocol gets a fair, proportional slice in every currency. That is the whole
            secret of a global free-door business — your subs flex, your rails do not.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="px-6 md:px-12 pb-6 max-w-7xl">
        <div className="text-xs tracking-widest text-amber-400 mb-3">FILTER BY CATEGORY</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat("all")}
            data-testid="cat-all"
            className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
              activeCat === "all"
                ? "bg-amber-400 text-black border-amber-400"
                : "border-amber-400/30 text-stone-300 hover:border-amber-400"
            }`}
          >
            All 24
          </button>
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              data-testid={`cat-${c.key}`}
              className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
                activeCat === c.key
                  ? "bg-amber-400 text-black border-amber-400"
                  : "border-amber-400/30 text-stone-300 hover:border-amber-400"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Streams grid */}
      <section className="px-6 md:px-12 pb-20 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const cat = CATS.find((c) => c.key === s.cat)!;
            return (
              <div
                key={s.id}
                data-testid={`stream-${s.id}`}
                className="border border-stone-800 hover:border-amber-400/50 rounded-2xl p-5 bg-stone-950 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`text-xs tracking-widest ${cat.color}`}>
                    {cat.emoji} #{String(s.id).padStart(2, "0")} · {cat.label.toUpperCase()}
                  </div>
                </div>
                <h3 className="text-lg font-black text-white mb-3 leading-tight">{s.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-xs text-stone-500 tracking-widest">PAYER</div>
                    <div className="text-stone-200">{s.payer}</div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 tracking-widest">UNIT</div>
                    <div className="text-stone-200">{s.unit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 tracking-widest">RATE</div>
                    <div className="text-amber-400 font-bold">{s.rate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 tracking-widest">SCALE → KILOCORN</div>
                    <div className="text-emerald-400 font-bold">{fmtUsd(s.kilocorn)}/yr</div>
                  </div>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed border-t border-stone-800 pt-3">{s.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing band */}
      <section className="px-6 md:px-12 py-12 border-t border-amber-400/20 max-w-7xl">
        <h2 className="text-3xl md:text-5xl font-black mb-4">
          Free for the people. <span className="text-amber-400">Funded by the flow.</span>
        </h2>
        <p className="text-stone-300 max-w-3xl mb-6 leading-relaxed">
          Email is free. Phone calls are mostly free. The web is free. The greatest protocols of every era have
          always been free at the door — and they earn from the rails underneath. 3C ONYX is the rail under every
          car bought, sold, rented, financed, insured, serviced, appraised, warrantied, claimed, or referred on
          Earth. Twenty-four ways to earn. One door. The People's Choice — Worldwide.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/amplify" className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl">→ AMPLIFY</Link>
          <Link href="/cvo" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ CVO Console</Link>
          <Link href="/standard" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ 3CX-1.0 Standard</Link>
          <Link href="/kilocorn" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-bold uppercase tracking-wider px-6 py-3 rounded-2xl">→ Kilocorn Manifesto</Link>
        </div>
      </section>
    </div>
  );
}
