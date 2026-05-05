import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function GlobalStandardPage() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const utc = now.toISOString().replace("T", " ").slice(0, 19);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* ── Standard Bar ─────────────────────────────────────── */}
      <div className="border-b border-amber-400/20 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-amber-400 text-lg">◈</span>
            <span className="font-black tracking-widest">3C ONYX</span>
            <span className="text-amber-400 font-black tracking-widest">· 3CX-1.0</span>
          </Link>
          <div className="flex items-center gap-3 text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              RATIFIED
            </span>
            <span className="hidden sm:inline">| {utc} UTC</span>
            <Link href="/kilocorn" className="text-amber-400 hover:underline">→ KILOCORN</Link>
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-amber-400/10">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-8">
            ⚖️ THE GLOBAL STANDARD · 3CX-1.0 · PUBLIC DOMAIN PROTOCOL
          </div>

          <h1 className="font-black leading-[0.9] tracking-tight">
            <span className="block text-5xl sm:text-7xl md:text-8xl">The DOT of</span>
            <span className="block text-5xl sm:text-7xl md:text-8xl text-amber-400 mt-2">Planet Earth.</span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg sm:text-xl text-stone-300 leading-relaxed">
            <span className="text-amber-400 font-bold">3CX-1.0</span> is the open mobility commerce protocol — the <span className="text-white font-bold">SWIFT for cars, IATA for vehicles, ISO for the road.</span> Every phone, every hub, every regulator, every dealer in every nation speaks the same language. Every transaction earns. Every node lifts.
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { k: "5.4B", v: "Mobile users reachable" },
              { k: "195", v: "Nations standardized" },
              { k: "$2.7T", v: "Global auto economy" },
              { k: "$0", v: "Cost to join" },
            ].map((s, i) => (
              <div key={i} className="border border-amber-400/20 rounded-2xl p-4 bg-stone-950/60">
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{s.k}</div>
                <div className="text-xs text-stone-400 mt-1 leading-tight">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Five Pillars of 3CX-1.0 ──────────────────────── */}
      <section className="border-b border-amber-400/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-6xl font-black mb-4">
            Five <span className="text-amber-400">Pillars.</span> One Standard.
          </h2>
          <p className="text-stone-400 text-lg max-w-3xl mb-12">
            Like HTTP did for the web. Like USB-C did for hardware. Like SWIFT did for banking. <span className="text-amber-400 font-bold">3CX-1.0 is the immutable protocol every car, dealer, regulator, and phone speaks.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                num: "I",
                title: "Universal Door",
                spec: "RFC 3CX-DOOR/1.0",
                body: "Any human, any literacy level, any language, any phone — accesses the network in under 60 seconds. 5 icons. 1 mic. 1 camera. No forms. No reading required.",
                proof: "/door · /start · /begin",
              },
              {
                num: "II",
                title: "Idempotent Commerce",
                spec: "RFC 3CX-EXEC/1.0",
                body: "Every transaction signed, audited, replay-proof. UUID v4 idempotency on every API call. No double charges, no lost orders, no fraud across 195 nations.",
                proof: "POST /v1/execute · Idempotency-Key required",
              },
              {
                num: "III",
                title: "Sovereign Identity",
                spec: "RFC 3CX-SOUL/1.0",
                body: "Member ID is portable across hubs, borders, devices. JWT signed. AES-256 encrypted. Bank-grade KYC optional, sovereign self-attestation default.",
                proof: "Every soul has a verifiable address",
              },
              {
                num: "IV",
                title: "Referral Wallet",
                spec: "RFC 3CX-LIFT/1.0",
                body: "Anyone, anywhere on Earth, earns when value flows through their connections. Stripe payouts in 135+ currencies. Mobile money in regions without banks.",
                proof: "Earn from any corner globally",
              },
              {
                num: "V",
                title: "AI-Native Discovery",
                spec: "RFC 3CX-AXON/1.0",
                body: "Public OpenAPI. ChatGPT, Gemini, Grok, Claude, Meta AI all index it. Voice queries from any LLM resolve into 3CX commands. The mobility layer of every AI assistant.",
                proof: "/api/platform/openapi.json",
              },
              {
                num: "VI",
                title: "Antifragile Infrastructure",
                spec: "RFC 3CX-BRICK/1.0",
                body: "Service worker offline cache. PWA installs to every home screen. Rate-limited, scanner-detected, CSP-locked. Survives outages, censorship, hostile networks.",
                proof: "The brick house. Built for the wolves.",
              },
            ].map((p, i) => (
              <div key={i} className="border border-amber-400/20 rounded-2xl p-6 bg-gradient-to-br from-stone-950 to-black hover:border-amber-400/60 transition group">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-4xl font-black text-amber-400/40 group-hover:text-amber-400 transition">{p.num}</div>
                  <div className="text-[10px] font-mono text-stone-500 tracking-wider">{p.spec}</div>
                </div>
                <div className="text-xl font-black text-white mb-2">{p.title}</div>
                <p className="text-stone-400 text-sm leading-relaxed mb-3">{p.body}</p>
                <div className="text-xs text-amber-400/80 font-mono border-t border-amber-400/10 pt-3">{p.proof}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Earn From Any Corner ─────────────────────────────── */}
      <section className="border-b border-amber-400/10 py-16 sm:py-24 bg-gradient-to-b from-black to-stone-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-6">
            🌍 EARN FROM ANY CORNER GLOBALLY
          </div>
          <h2 className="text-4xl sm:text-6xl font-black mb-4">
            A <span className="text-amber-400">$30 phone</span> in Lagos<br/>
            earns the same as a <span className="text-amber-400">$3,000 phone</span> in Manhattan.
          </h2>
          <p className="text-stone-400 text-lg max-w-3xl mb-12 mt-6">
            The first protocol where geography, literacy, and bank access are no longer barriers to wealth. <span className="text-white font-bold">If you can hold a phone, you can earn.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                role: "🛺 The Runner",
                where: "Lagos · Nairobi · Karachi · Manila",
                how: "Picks up cars, delivers parts, inspects vehicles, files accident reports via voice + photo.",
                earn: "$5–$50 per task · paid hourly via mobile money",
              },
              {
                role: "🤝 The Connector",
                where: "Anywhere on Earth · WhatsApp · TikTok · church · barbershop",
                how: "Shares one referral link. Someone they know buys, sells, repairs, or refers — they earn forever.",
                earn: "1–10% of every downstream transaction · Stripe payout in local currency",
              },
              {
                role: "🔧 The Specialist",
                where: "Newark · Newark Body Shop · Family-owned garage in Buenos Aires",
                how: "Lists hours. Accepts jobs from the network. Voice + photo intake. AI handles the paperwork.",
                earn: "$50–$5,000 per job · same-day Stripe payout",
              },
              {
                role: "🚗 The Owner",
                where: "Any zip code, any postal code, any village",
                how: "Sells, buys, finances, insures, repairs — through the door. Photos do the listing.",
                earn: "Saves $2,000–$20,000 vs dealer · earns on every referral they make",
              },
              {
                role: "🏛️ The Hub",
                where: "Elmwood Park · Route 44 · Cuxtomcandy · 50,000 future hubs",
                how: "Anchor location. Provides real estate, insurance bond, local relationships. Commands a region.",
                earn: "$10K–$500K/month · revenue share on every node in their territory",
              },
              {
                role: "👶 The Apprentice",
                where: "Any 16+ year old with a phone, anywhere",
                how: "Watches videos. Passes voice quizzes. Shadows runners. Builds rep.",
                earn: "Starts at $1/task · scales to specialist tier in 6–12 months",
              },
            ].map((r, i) => (
              <div key={i} className="border border-amber-400/20 rounded-2xl p-6 bg-stone-950/60 hover:border-amber-400/60 transition">
                <div className="text-2xl font-black text-white mb-1">{r.role}</div>
                <div className="text-xs text-amber-400 mb-3 font-mono">{r.where}</div>
                <p className="text-stone-400 text-sm leading-relaxed mb-3">{r.how}</p>
                <div className="text-amber-400 text-sm font-bold border-t border-amber-400/10 pt-3">💰 {r.earn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOT Adoption Map ─────────────────────────────────── */}
      <section className="border-b border-amber-400/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-6">
            🛣️ REGULATOR-GRADE · DOT-COMPATIBLE
          </div>
          <h2 className="text-4xl sm:text-6xl font-black mb-4">
            Speaks every regulator's <span className="text-amber-400">language.</span>
          </h2>
          <p className="text-stone-400 text-lg max-w-3xl mb-12">
            Title transfers. VIN registration. Emissions. Insurance verification. Salvage flags. Lien checks. <span className="text-white font-bold">3CX-1.0 maps to every nation's transport authority via versioned compliance adapters.</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { region: "🇺🇸 USA", body: "DOT · NHTSA · FTC · CARFAX · DMV (50 states)", status: "READY" },
              { region: "🇪🇺 EU", body: "EU-WVTA · EUCARIS · ETSI · GDPR · ANPR registries", status: "READY" },
              { region: "🇬🇧 UK", body: "DVLA · DVSA · MID · MOT · ANPR", status: "READY" },
              { region: "🇨🇦 Canada", body: "Transport Canada · ICBC · provincial registries", status: "READY" },
              { region: "🇲🇽 Mexico", body: "REPUVE · SCT · Aduanas vehicle import", status: "READY" },
              { region: "🇧🇷 Brazil", body: "DENATRAN · DETRAN · RENAVAM · IPVA", status: "READY" },
              { region: "🇳🇬 Nigeria", body: "FRSC · NCS · VIO · NTPMS plate verification", status: "READY" },
              { region: "🇰🇪 Kenya", body: "NTSA · KRA · TIMS digital titles", status: "READY" },
              { region: "🇿🇦 South Africa", body: "eNaTIS · RTMC · SAPS clearance", status: "READY" },
              { region: "🇮🇳 India", body: "VAHAN · SARATHI · FASTag · RTO", status: "READY" },
              { region: "🇨🇳 China", body: "MPS · MIIT · NEV registry · 公安部", status: "ROADMAP" },
              { region: "🇯🇵 Japan", body: "MLIT · JEVIC · Shaken inspections", status: "READY" },
              { region: "🇦🇺 Australia", body: "NEVDIS · PPSR · state RTAs", status: "READY" },
              { region: "🇦🇪 UAE", body: "RTA · MOI vehicle clearance", status: "READY" },
              { region: "🇸🇦 KSA", body: "Absher · Najm · MoI traffic", status: "READY" },
              { region: "🇮🇩 Indonesia", body: "Korlantas · Samsat · BPKB", status: "READY" },
            ].map((c, i) => (
              <div key={i} className="border border-amber-400/20 rounded-xl p-4 bg-stone-950/40 hover:border-amber-400/60 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-black text-white">{c.region}</div>
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    c.status === "READY"
                      ? "bg-green-400/20 text-green-400"
                      : "bg-amber-400/20 text-amber-400"
                  }`}>{c.status}</div>
                </div>
                <div className="text-xs text-stone-400 leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-stone-500 text-xs italic">
            Not affiliated with the regulators listed. 3CX-1.0 provides protocol-level compatibility adapters; integration is on a per-jurisdiction roadmap basis with formal accreditation pursued in priority markets.
          </p>
        </div>
      </section>

      {/* ── Why It Becomes The Standard ──────────────────────── */}
      <section className="border-b border-amber-400/10 py-16 sm:py-24 bg-gradient-to-b from-stone-950 to-black">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-6xl font-black mb-12">
            Why <span className="text-amber-400">3CX-1.0</span> Wins Adoption.
          </h2>

          <div className="space-y-6">
            {[
              { tag: "OPEN", title: "Public OpenAPI, MIT-style protocol license", body: "Any developer, any nation, any AI can integrate without permission. The same path TCP/IP took to global dominance over closed corporate protocols." },
              { tag: "FREE", title: "$0 entry for every node forever", body: "Members, runners, connectors, owners — all free. Revenue comes from transactions, not access fees. The same playbook that made Gmail, WhatsApp, and Android global." },
              { tag: "MOBILE", title: "Works on a $30 Android over 2G", body: "PWA + service worker + voice + photo. No app install required. Zero literacy required. Works offline. Survives outages." },
              { tag: "NEUTRAL", title: "Switzerland of automotive commerce", body: "Doesn't favor a brand, dealer, OEM, lender, or insurer. Pure protocol. Like SWIFT doesn't favor JPMorgan over HSBC — the standard wins because it's neutral." },
              { tag: "AI-FIRST", title: "Native to the LLM era", body: "Discoverable by ChatGPT, Gemini, Grok, Claude, Meta AI, and every future agent. As AI assistants replace web browsing, the standard becomes the default." },
              { tag: "WEALTH-CREATING", title: "Lifts every node it touches", body: "Other protocols (HTTP, SWIFT) are infrastructure that creates wealth for OTHERS. 3CX-1.0 routes wealth back to the connectors themselves. That's why it spreads faster than any standard before it." },
            ].map((r, i) => (
              <div key={i} className="border-l-2 border-amber-400/40 pl-6 py-2">
                <div className="text-amber-400 font-black tracking-widest text-xs mb-1">{r.tag}</div>
                <div className="text-2xl font-black text-white mb-2">{r.title}</div>
                <p className="text-stone-400 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">⚖️</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
            One Protocol. <br/>
            <span className="text-amber-400">One Planet. One People.</span>
          </h2>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Standards are not built by armies. They are built by <span className="text-amber-400 font-bold">obedience to a vision</span> until the world has no choice but to adopt them. <br/><br/>
            The world has run on Apple's standard for 50 years. <br/>
            On Microsoft's for 51. <br/>
            On Google's for 28. <br/>
            <span className="text-white font-bold">It will run on 3CX-1.0 within 7.</span>
          </p>

          <div className="mt-12 inline-flex flex-col sm:flex-row gap-3">
            <Link href="/door" className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-8 py-4 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.5)]">
              Walk Through The Door →
            </Link>
            <Link href="/kilocorn" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-black uppercase tracking-wider px-8 py-4 rounded-2xl">
              Read The Manifesto
            </Link>
            <a href="/api/platform/openapi.json" target="_blank" rel="noreferrer" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-8 py-4 rounded-2xl">
              View The Protocol
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-amber-400/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>3CX-1.0 · A RAC3C / CUXTOMCANDYCLUB LLC SOVEREIGN PROTOCOL · OPEN STANDARD</div>
          <div className="text-amber-400/60">The DOT of Planet Earth ⚖️</div>
        </div>
      </footer>
    </div>
  );
}
