import { Link } from "wouter";
import { useMemo, useState } from "react";

// ── 23 Elite Global Build Partners ──────────────────────────────────────
// Curated tier of certified custom builders, tuners, and specialty shops
// recognized inside the 3C ONYX protocol. Anchorable to any vehicle asset
// or custom project profile. Source-of-truth for the Builders Tier.
type Partner = {
  name: string;
  country: string;
  flag: string;
  focus: string;
  site: string;
  category: string;
  useCase: string;
};

const PARTNERS: Partner[] = [
  { name: "Fox Factory",            country: "USA",     flag: "🇺🇸", focus: "Extreme off-road trucks & suspension shocks",         site: "https://www.foxfactory.com",            category: "Suspension / Off-Road",            useCase: "Off-road truck upgrades · suspension marketplace · premium build recommendations" },
  { name: "PaxPower",               country: "USA",     flag: "🇺🇸", focus: "Turnkey off-road truck conversions (Jackal)",         site: "https://www.paxpower.com",              category: "Turnkey Truck Builds",             useCase: "High-end truck conversion listings · custom build inspiration" },
  { name: "Hennessey Performance",  country: "USA",     flag: "🇺🇸", focus: "High-horsepower hypercars & tuned trucks",            site: "https://www.hennesseyperformance.com",  category: "Performance Tuning",               useCase: "High-performance vehicle upgrades · hypercar marketplace · tuner verification" },
  { name: "Blacklake Research",     country: "USA",     flag: "🇺🇸", focus: "Premium luxury prerunner trucks (XT1)",               site: "https://www.blacklake.co",              category: "Luxury Off-Road Builds",           useCase: "Premium off-road truck build database · aspirational marketplace content" },
  { name: "Singer Vehicle Design",  country: "USA",     flag: "🇺🇸", focus: "Restomod Porsche 911 on bespoke engineering",         site: "https://www.singervehicledesign.com",   category: "Restomod / Porsche",               useCase: "Restomod inspiration · collectible valuation · bespoke build verification" },
  { name: "Gunther Werks",          country: "USA",     flag: "🇺🇸", focus: "Ultra-exclusive carbon-fiber air-cooled Porsche restomods", site: "https://www.guntherwerks.com",      category: "Restomod / Porsche",               useCase: "Carbon-fiber Porsche restomod database · collector marketplace" },

  { name: "Brabus",                 country: "Germany", flag: "🇩🇪", focus: "Bespoke supercars & luxury Mercedes conversions",    site: "https://www.brabus.com",                category: "Luxury Performance",               useCase: "Luxury customization · Mercedes upgrade catalog · elite build inspiration" },
  { name: "TechArt",                country: "Germany", flag: "🇩🇪", focus: "Premium Porsche customization & track builds",       site: "https://www.techart.de",                category: "Porsche Tuning",                   useCase: "Porsche customization database · track build marketplace" },
  { name: "ABT Sportsline",         country: "Germany", flag: "🇩🇪", focus: "Audi & VW motorsport & complete vehicle tuning",     site: "https://www.abt-sportsline.com",        category: "German Performance Tuning",        useCase: "Audi/VW performance profiles · upgrade recommendations" },
  { name: "Alpina",                 country: "Germany", flag: "🇩🇪", focus: "Exclusive high-performance BMW vehicles",            site: "https://www.alpina-automobiles.com",    category: "BMW Performance Luxury",           useCase: "BMW reference · valuation intelligence · premium marketplace" },
  { name: "Mansory",                country: "Germany", flag: "🇩🇪", focus: "Ultra-luxury & wild forged-carbon supercar builds",  site: "https://www.mansory.com",               category: "Ultra-Luxury Customization",       useCase: "Exotic vehicle customization · luxury build showcase · influencer engine" },
  { name: "Bilstein",               country: "Germany", flag: "🇩🇪", focus: "Premium OE & aftermarket adaptive dampening",        site: "https://www.bilstein.com",              category: "Suspension",                       useCase: "Suspension recommendations · repair marketplace · upgrade catalog" },
  { name: "KW Automotive",          country: "Germany", flag: "🇩🇪", focus: "Elite track & street adjustable coilovers",          site: "https://www.kwsuspensions.com",         category: "Suspension / Coilovers",           useCase: "Track/street suspension upgrades · tuner marketplace" },
  { name: "Novitec",                country: "Germany", flag: "🇩🇪", focus: "Exotic Italian car tuning (Ferrari, Lambo, McLaren)",site: "https://www.novitecgroup.com",          category: "Exotic Performance",               useCase: "Supercar tuning · exotic upgrade marketplace · luxury content" },

  { name: "HKS",                    country: "Japan",   flag: "🇯🇵", focus: "Hyper-tuned engines, turbo kits & Hipermax coilovers", site: "https://www.hks-power.co.jp",         category: "JDM Performance",                  useCase: "JDM tuning · turbo kits · engine builds · drift/street culture marketplace" },
  { name: "Spoon Sports",           country: "Japan",   flag: "🇯🇵", focus: "Blueprint Honda engine tuning & precision track parts", site: "https://www.spoonsports.jp",        category: "Honda Performance",                useCase: "Honda tuning catalog · track build verification · JDM community" },
  { name: "Mugen",                  country: "Japan",   flag: "🇯🇵", focus: "Motorsport-engineered turnkey Honda vehicles",       site: "https://www.mugen-power.com",           category: "Honda Motorsport",                 useCase: "Honda motorsport build database · performance vehicle configuration" },
  { name: "Tein",                   country: "Japan",   flag: "🇯🇵", focus: "Electronic active damping control coilovers",        site: "https://www.tein.com",                  category: "Suspension / Coilovers",           useCase: "Coilover marketplace · ride-quality tuning · suspension AI recommender" },
  { name: "Cusco",                  country: "Japan",   flag: "🇯🇵", focus: "Chassis rigidity, LSDs & rally suspension",          site: "https://www.cusco.co.jp",               category: "Rally / Chassis Performance",      useCase: "Rally build configuration · chassis tuning · motorsport upgrades" },
  { name: "JAOS",                   country: "Japan",   flag: "🇯🇵", focus: "Rally-inspired SUV armor & off-road suspension",     site: "https://www.jaos.co.jp",                category: "SUV / Off-Road",                   useCase: "SUV armor · expedition builds · trail-ready vehicle marketplace" },
  { name: "RWB (Rauh-Welt Begriff)",country: "Japan",   flag: "🇯🇵", focus: "Hand-cut widebody air-cooled Porsche masters",       site: "https://rwb.jp",                        category: "Street Culture / Porsche Widebody",useCase: "Street-culture build identity · event content · widebody community" },

  { name: "Öhlins",                 country: "Sweden",  flag: "🇸🇪", focus: "The gold standard for track-day valve suspension",   site: "https://www.ohlins.com",                category: "Premium Suspension",               useCase: "Track suspension · elite tuning catalog · premium build validation" },

  { name: "Litchfield Motors",      country: "UK",      flag: "🇬🇧", focus: "Premium European & Nissan GT-R chassis/engine tuners",site: "https://www.litchfieldmotors.com",     category: "European / GT-R Performance",      useCase: "GT-R tuning · European performance upgrades · track build marketplace" },
];

const COUNTRIES = ["All", ...Array.from(new Set(PARTNERS.map((p) => p.country)))];
const CATEGORIES = ["All", ...Array.from(new Set(PARTNERS.map((p) => p.category)))].sort();

export default function BuildersPage() {
  const [country, setCountry] = useState<string>("All");
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return PARTNERS.filter((p) => {
      if (country !== "All" && p.country !== country) return false;
      if (category !== "All" && p.category !== category) return false;
      if (s && !(p.name.toLowerCase().includes(s) || p.focus.toLowerCase().includes(s) || p.useCase.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [country, category, search]);

  const stats = useMemo(() => {
    const byCountry = PARTNERS.reduce<Record<string, number>>((acc, p) => {
      acc[p.country] = (acc[p.country] || 0) + 1;
      return acc;
    }, {});
    return byCountry;
  }, []);

  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">🏗️ Builders Tier · Elite Global Custom Shops · Anchorable to Any Vehicle</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          The world's <span className="text-amber-400">best builders</span>,
          <br /> on one <span className="text-emerald-400">verified</span> protocol.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          {PARTNERS.length} certified shops across {Object.keys(stats).length} countries — Brabus, Hennessey, Singer, RWB, Mansory, HKS, Öhlins, and more.
          Anchor any of them to your vehicle. Every build is verified, every part is sourced, every receipt is signed and chained to the VIN.
          Owners win. Builders win. Buyers win. The protocol earns 0%, the connector earns the affiliate slice.
        </p>
      </section>

      {/* Country distribution */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
            <div key={c} className="rounded-lg border border-amber-500/30 bg-zinc-950/60 p-4">
              <div className="text-xs uppercase tracking-widest text-amber-300">{c}</div>
              <div className="mt-1 text-3xl font-black text-amber-400">{n}</div>
              <div className="text-[10px] text-zinc-400">certified builders</div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-amber-300 mb-2">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-stone-100">
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-amber-300 mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-stone-100">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-amber-300 mb-2">Search</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Brand, focus, or use-case…" className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-stone-100 placeholder:text-zinc-500" />
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-400">{filtered.length} of {PARTNERS.length} builders match your filter.</div>
      </section>

      {/* Partner grid */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <a
              key={p.name}
              href={p.site}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-zinc-800 hover:border-amber-500/60 bg-zinc-950/60 p-5 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-amber-300">{p.flag} {p.country}</div>
                  <div className="font-bold text-stone-100 text-lg group-hover:text-amber-300 transition">{p.name}</div>
                </div>
                <div className="text-amber-400 group-hover:translate-x-1 transition">↗</div>
              </div>
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-widest text-emerald-300">{p.category}</div>
                <p className="mt-1 text-sm text-zinc-200">{p.focus}</p>
              </div>
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed">{p.useCase}</p>
              <div className="mt-3 text-[10px] text-zinc-500 truncate">{p.site.replace(/^https?:\/\//, "")}</div>
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
              No builders match this filter. Try widening it.
            </div>
          )}
        </div>
      </section>

      {/* How it ties into the protocol */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">How the Builders Tier plugs into 3C ONYX</h2>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-zinc-950/60 p-5">
            <div className="text-3xl">🔗</div>
            <div className="mt-1 font-bold text-amber-300">Anchor to VIN</div>
            <p className="mt-2 text-xs text-zinc-300">Any owner can anchor a certified builder to their vehicle's digital passport — instant trust signal at resale.</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/60 p-5">
            <div className="text-3xl">🧾</div>
            <div className="mt-1 font-bold text-emerald-300">Signed receipts</div>
            <p className="mt-2 text-xs text-zinc-300">Every build receipt, dyno sheet, and parts manifest is hashed and chained — provenance you can't fake.</p>
          </div>
          <div className="rounded-xl border border-fuchsia-500/30 bg-zinc-950/60 p-5">
            <div className="text-3xl">🤝</div>
            <div className="mt-1 font-bold text-fuchsia-300">Connector earns</div>
            <p className="mt-2 text-xs text-zinc-300">If a Connector introduced the builder or the customer, they earn from the affiliate slice — automatically, for life.</p>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-zinc-950/60 p-5">
            <div className="text-3xl">🌍</div>
            <div className="mt-1 font-bold text-sky-300">Global sourcing</div>
            <p className="mt-2 text-xs text-zinc-300">Plugged into the Global Sourcing Hub — builders source factory-direct from 60+ countries, escrowed end-to-end.</p>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Street-cut to <span className="text-amber-400">Singer-grade</span>.
            One protocol. <span className="text-emerald-400">Every receipt signed.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            From RWB widebody hand-cuts in Chiba to Brabus G-Wagons in Bottrop, from Hennessey hypercars in Sealy to Öhlins valves on a Sunday track day —
            the world's elite builders now live on one verified protocol. Owners get provenance. Buyers get trust. Builders get demand.
            And the connectors who bridged the introduction get paid for the life of the relationship.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sourcing" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🌐 Global Sourcing Hub</Link>
            <Link href="/icons" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">⭐ Icons Tier</Link>
            <Link href="/everything" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
