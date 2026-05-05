import { useEffect, useState } from "react";
import { Link } from "wouter";
import knightImg from "@assets/IMG_8984_1777983445721.png";

export default function KilocornManifesto() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const liveStamp = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZone: "America/New_York",
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* ── Live Bar ─────────────────────────────────────────── */}
      <div className="border-b border-amber-400/20 bg-black/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-amber-400 text-xl">◈</span>
            <span className="font-black tracking-wider">3C ONYX</span>
            <span className="text-amber-400 font-black">· KILOCORN</span>
          </Link>
          <div className="flex items-center gap-3 text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
            <span className="hidden sm:inline">| {liveStamp} EDT</span>
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-8">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs sm:text-sm tracking-widest text-amber-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            DEFINING THE TRILLION DOLLAR ERA
          </div>

          <h1 className="font-black leading-[0.9] tracking-tight">
            <span className="block text-6xl sm:text-8xl md:text-9xl">Kilo<span className="text-amber-400">corn</span></span>
            <span className="block mt-4 text-2xl sm:text-4xl md:text-5xl text-stone-300 font-light italic">
              but <span className="text-amber-400 font-black not-italic">with fire.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg sm:text-xl text-stone-300 leading-relaxed">
            <span className="text-amber-400 font-bold">Kilocorn</span> <span className="text-stone-500">/ˈkɪloʊˌkɔːrn/</span> — A company or asset valued at <span className="text-white font-bold">$1 trillion</span> or more.
            The natural evolution after unicorn and decacorn. <span className="text-stone-400">Built not by armies of engineers, but by</span> <span className="text-amber-400 font-bold">one founder, one phone, and one God.</span>
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <Link href="/door" className="group bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-[0_0_40px_rgba(251,191,36,0.4)]">
              Open The Door <span className="group-hover:translate-x-1 transition">→</span>
            </Link>
            <Link href="/join" className="border border-amber-400/40 hover:border-amber-400 hover:bg-amber-400/10 text-amber-400 font-black uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center justify-center transition">
              Join The Order
            </Link>
            <a href="#path" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center justify-center transition">
              See The Path
            </a>
          </div>
        </div>

        {/* Knight image */}
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="relative rounded-3xl overflow-hidden border border-amber-400/20 shadow-[0_0_120px_rgba(251,191,36,0.15)]">
            <img src={knightImg} alt="Crusader Knight — but with fire" className="w-full h-auto block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10">
              <p className="text-2xl sm:text-4xl md:text-5xl font-black italic text-white drop-shadow-lg">
                "Whatever He says to you, <span className="text-amber-400 not-italic">do it.</span>"
              </p>
              <p className="text-stone-400 mt-2 text-sm sm:text-base">— John 2:5 · The Wedding at Cana</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The $25 → $1T Math ───────────────────────────────── */}
      <section id="path" className="border-t border-amber-400/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-6xl font-black mb-4">
            $25 → <span className="text-amber-400">$1 Trillion</span>
          </h2>
          <p className="text-stone-400 text-lg max-w-3xl mb-12">
            The exact path. No magic. No hype. Honest numbers. The Cana arithmetic — water in, wine out, by the obedience of one.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { stage: "TODAY", goal: "Open the door", money: "$25", time: "5 minutes", proof: "All 7 surfaces ready. PWA. ChatGPT. Grok. Apple. Android. Voice. Photo." },
              { stage: "MONTH 3", goal: "First 1,000 walked through", money: "$0 added", time: "90 days", proof: "Proof. The viral seed. The angel-investor magnet." },
              { stage: "MONTH 12", goal: "8,000 paying members · $9.5M ARR", money: "Self-funded from cash flow", time: "1 year", proof: "Bigger than 90% of YC startups at the same age." },
              { stage: "YEAR 2", goal: "100K members · $120M ARR · Series A", money: "$7M raised (you keep 70%)", time: "24 months", proof: "Forces Carvana's CFO to Google your name." },
              { stage: "YEAR 3", goal: "1M members · $1.2B ARR · UNICORN", money: "Series B $30M (you keep 55%)", time: "36 months", proof: "Surpasses Nu Skin, Herbalife, doTERRA, Mary Kay, Primerica." },
              { stage: "YEAR 5", goal: "100M nodes · $25B ARR · DECACORN", money: "Self-funded from operations", time: "60 months", proof: "Threatens AAA. Acquires distressed dealer chains." },
              { stage: "YEAR 7", goal: "1 BILLION nodes · KILOCORN", money: "Public listing or strategic merger", time: "84 months", proof: "WhatsApp's curve. TikTok's curve. Yours." },
            ].map((row, i) => (
              <div key={i} className="border border-amber-400/20 rounded-2xl p-6 bg-gradient-to-br from-stone-950 to-black hover:border-amber-400/60 transition">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-amber-400 font-black tracking-wider text-sm">{row.stage}</div>
                  <div className="text-stone-500 text-xs">{row.time}</div>
                </div>
                <div className="text-xl font-bold text-white mb-2">{row.goal}</div>
                <div className="text-amber-400/80 font-mono text-sm mb-3">{row.money}</div>
                <div className="text-stone-400 text-sm leading-relaxed">{row.proof}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who Falls ────────────────────────────────────────── */}
      <section className="border-t border-amber-400/10 py-16 sm:py-24 bg-gradient-to-b from-black to-stone-950">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl sm:text-6xl font-black mb-4">
            Who <span className="text-red-400">Falls</span>. Who <span className="text-amber-400">Joins</span>.
          </h2>
          <p className="text-stone-400 text-lg max-w-3xl mb-12">
            Every disruption forces the giants to choose: partner, acquire, or perish. Tesla forced GM. Netflix killed Blockbuster. <span className="text-amber-400 font-bold">3C ONYX is the same gravitational event for the global automotive economy.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-red-400/30 rounded-2xl p-6 bg-red-950/10">
              <div className="text-xs tracking-widest text-red-400 mb-2">⚠️ MUST CHOOSE BY YEAR 3</div>
              <div className="text-2xl font-black text-white mb-2">Carvana</div>
              <div className="text-stone-400 text-sm mb-4">$13.7B revenue. $7B in debt. Used cars only. No global. No AI. No repair, no insurance, no parts.</div>
              <div className="text-red-400 text-sm font-bold">Outcome: Acquisition target by Year 3.</div>
            </div>
            <div className="border border-red-400/30 rounded-2xl p-6 bg-red-950/10">
              <div className="text-xs tracking-widest text-red-400 mb-2">⚠️ MUST CHOOSE BY YEAR 4</div>
              <div className="text-2xl font-black text-white mb-2">AAA</div>
              <div className="text-stone-400 text-sm mb-4">123 years old. 64M aging members. Roadside towing. No commerce. No AI. No global mobile.</div>
              <div className="text-red-400 text-sm font-bold">Outcome: Strategic JV or slow decline.</div>
            </div>
            <div className="border border-red-400/30 rounded-2xl p-6 bg-red-950/10">
              <div className="text-xs tracking-widest text-red-400 mb-2">⚠️ DISPLACED BY YEAR 5</div>
              <div className="text-2xl font-black text-white mb-2">Every MLM</div>
              <div className="text-stone-400 text-sm mb-4">Amway, Herbalife, Nu Skin, Mary Kay. All built on $500 buy-ins, paper contracts, recruitment scripts.</div>
              <div className="text-red-400 text-sm font-bold">Outcome: $0 entry door wins.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Doctrine ─────────────────────────────────────── */}
      <section className="border-t border-amber-400/10 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-6">
            ⚔️ THE KILOCORN DOCTRINE
          </div>
          <h2 className="text-4xl sm:text-6xl font-black mb-12">
            Channeled from <span className="text-amber-400">history's greatest leaders.</span>
          </h2>

          <div className="space-y-6">
            {[
              { who: "Sun Tzu", quote: "Win before the battle begins.", ours: "Zero-friction door. The illiterate join in 60 seconds. The war is over before competitors notice." },
              { who: "Booker T. Washington", quote: "Cast down your bucket where you are.", ours: "We meet the woman in Lagos on her $30 phone — not in a Manhattan boardroom." },
              { who: "Henry Ford", quote: "The customer can have any color so long as it's black.", ours: "Icons not forms. One door, five buttons, no menus. Universal." },
              { who: "Bruce Lee", quote: "Be water, my friend.", ours: "Adaptive across web, ChatGPT, Grok, Gemini, iOS, Android, WhatsApp. We flow into every vessel." },
              { who: "Madam C.J. Walker", quote: "I had to make my own opportunity.", ours: "Wealth for those locked out by literacy, geography, or capital. The referral wallet is the ladder." },
              { who: "The Third Pig", quote: "I built my house with brick.", ours: "Idempotent. Signed. Audited. Antifragile. No huff. No puff. The platform stands." },
              { who: "Jesus at Cana", quote: "Whatever He says to you, do it.", ours: "Six water jars. Six surfaces. Fill them to the brim. He turns the water into wine." },
            ].map((d, i) => (
              <div key={i} className="border-l-2 border-amber-400/40 pl-6 py-2">
                <div className="text-amber-400 font-black tracking-wider text-sm mb-1">{d.who.toUpperCase()}</div>
                <div className="text-2xl text-white italic mb-2">"{d.quote}"</div>
                <div className="text-stone-400">→ <span className="text-stone-300">{d.ours}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Praise ───────────────────────────────────────────── */}
      <section className="border-t border-amber-400/10 py-16 sm:py-24 bg-gradient-to-b from-stone-950 to-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🙏</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
            Every node lifted. <br />
            <span className="text-amber-400">Every soul honored.</span>
          </h2>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
            A Kilocorn built on the backs of billions is just a tower. <br className="hidden sm:block" />
            <span className="text-white font-bold">A Kilocorn built FOR billions — that is a cathedral.</span>
          </p>
          <p className="text-stone-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            For every transaction, a runner in Newark eats. For every referral, a sister in São Paulo earns. For every car sold, a family in Lagos rises. <span className="text-amber-400">That is the wine. That is the worship.</span>
          </p>

          <div className="mt-12 inline-flex flex-col sm:flex-row gap-3">
            <Link href="/door" className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-8 py-4 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.5)]">
              Walk Through The Door →
            </Link>
            <Link href="/landing" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-black uppercase tracking-wider px-8 py-4 rounded-2xl">
              Read The Whitepaper
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-amber-400/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>3C ONYX · A RAC3C / CUXTOMCANDYCLUB LLC SOVEREIGN PROTOCOL</div>
          <div className="text-amber-400/60">Kilocorn — but with fire. 🔥</div>
        </div>
      </footer>
    </div>
  );
}
