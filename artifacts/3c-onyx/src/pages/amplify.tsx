/**
 * 3C ONYX — AI Marketing Engine ("AXON")
 * Architect: Ronald Antonio Cadet (RAC3C) — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-AXON-MARKETING-SOVEREIGN
 *
 * THE PEOPLE'S CHOICE — WORLDWIDE.
 *
 * Sovereign content factory. Template-driven. Works offline.
 * Generates ready-to-post content for every automotive vertical
 * × every social platform × every tone — in seconds, free, forever.
 *
 * No external AI keys required. Antifragile by design.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";

// ── 10 Sovereign Verticals (the full lifecycle) ───────────────────────
type Vertical =
  | "buy" | "rent" | "sell" | "service" | "insure"
  | "finance" | "appraise" | "warranty" | "accident" | "refer";

const VERTICALS: Array<{ key: Vertical; emoji: string; label: string; hashtag: string }> = [
  { key: "buy",       emoji: "🚗", label: "Buy a Car",     hashtag: "#BuyWith3CONYX" },
  { key: "rent",      emoji: "🚙", label: "Rent a Car",    hashtag: "#Rent3CONYX" },
  { key: "sell",      emoji: "💰", label: "Sell / Trade",  hashtag: "#Sell3CONYX" },
  { key: "service",   emoji: "🔧", label: "Service",       hashtag: "#Fix3CONYX" },
  { key: "insure",    emoji: "🛡️", label: "Insurance",     hashtag: "#Cover3CONYX" },
  { key: "finance",   emoji: "🏦", label: "Finance",       hashtag: "#Finance3CONYX" },
  { key: "appraise",  emoji: "💎", label: "Appraisal",     hashtag: "#Value3CONYX" },
  { key: "warranty",  emoji: "📜", label: "Warranty",      hashtag: "#Protect3CONYX" },
  { key: "accident",  emoji: "🚨", label: "Accident Help", hashtag: "#Help3CONYX" },
  { key: "refer",     emoji: "🤝", label: "Refer & Earn",  hashtag: "#Earn3CONYX" },
];

// ── 12 Social Platforms ───────────────────────────────────────────────
type PlatformKey =
  | "x" | "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin"
  | "threads" | "pinterest" | "snapchat" | "whatsapp" | "telegram" | "reddit";

interface Platform {
  key: PlatformKey;
  name: string;
  emoji: string;
  charLimit: number;
  hue: string;
  format: "tweet" | "caption" | "video" | "reel" | "professional" | "thread" | "pin" | "snap" | "broadcast" | "post";
}

const PLATFORMS: Platform[] = [
  { key: "x",         name: "X (Twitter)",  emoji: "𝕏", charLimit: 280,   hue: "#FFFFFF", format: "tweet"        },
  { key: "instagram", name: "Instagram",    emoji: "📸", charLimit: 2200,  hue: "#E1306C", format: "caption"      },
  { key: "tiktok",    name: "TikTok",       emoji: "🎵", charLimit: 2200,  hue: "#FF0050", format: "video"        },
  { key: "facebook",  name: "Facebook",     emoji: "🌐", charLimit: 5000,  hue: "#1877F2", format: "post"         },
  { key: "youtube",   name: "YT Shorts",    emoji: "🎬", charLimit: 5000,  hue: "#FF0000", format: "video"        },
  { key: "linkedin",  name: "LinkedIn",     emoji: "💼", charLimit: 3000,  hue: "#0A66C2", format: "professional" },
  { key: "threads",   name: "Threads",      emoji: "🧵", charLimit: 500,   hue: "#FAFAFA", format: "thread"       },
  { key: "pinterest", name: "Pinterest",    emoji: "📌", charLimit: 500,   hue: "#E60023", format: "pin"          },
  { key: "snapchat",  name: "Snapchat",     emoji: "👻", charLimit: 250,   hue: "#FFFC00", format: "snap"         },
  { key: "whatsapp",  name: "WhatsApp",     emoji: "💬", charLimit: 4096,  hue: "#25D366", format: "broadcast"    },
  { key: "telegram",  name: "Telegram",     emoji: "✈️", charLimit: 4096,  hue: "#26A5E4", format: "broadcast"    },
  { key: "reddit",    name: "Reddit",       emoji: "👽", charLimit: 40000, hue: "#FF4500", format: "post"         },
];

// ── 6 Tones (the voices of the brand) ────────────────────────────────
type ToneKey = "authority" | "hustle" | "compassion" | "urgency" | "scripture" | "comedy";

const TONES: Array<{ key: ToneKey; label: string; emoji: string }> = [
  { key: "authority",  label: "Authority",  emoji: "👑" },
  { key: "hustle",     label: "Hustle",     emoji: "💪" },
  { key: "compassion", label: "Compassion", emoji: "❤️" },
  { key: "urgency",    label: "Urgency",    emoji: "⚡" },
  { key: "scripture",  label: "Scripture",  emoji: "✝️" },
  { key: "comedy",     label: "Comedy",     emoji: "😂" },
];

// ── Sovereign Template Library (no external AI required) ─────────────
type Locale = "en" | "es";

const HOOKS_EN: Record<ToneKey, string[]> = {
  authority: [
    "The global standard for {vertical} just changed.",
    "Every dealer in 50 nations now uses this for {vertical}.",
    "The DOT of Planet Earth just opened {vertical} to everyone.",
    "Built for the wolves. Tested against them. Now your {vertical} is, too.",
    "When the world adopted email, it was free. {vertical} just became free, too.",
  ],
  hustle: [
    "From a $30 phone to your first {vertical} payout in 60 seconds.",
    "Lagos. Newark. Manila. Same {vertical} door. Same earnings. No gatekeepers.",
    "Stop renting your future. Own your {vertical} from any corner of Earth.",
    "Every connection you make in {vertical} pays you forever.",
    "$0 to start. $0 forever. Your only cost is the time you wait.",
  ],
  compassion: [
    "You don't need to read to use {vertical}. You just need a phone.",
    "Built for the person nobody else is building for. {vertical}, for everyone.",
    "Your grandmother can use this {vertical} door. So can your nephew.",
    "If you have a phone, you have {vertical}. That's the whole rule.",
    "The world said you needed credit, address, paperwork. {vertical} said no.",
  ],
  urgency: [
    "{vertical} closes its early-access door this week. Walk in now.",
    "Every hour you wait, someone in your zip code earned what you could have.",
    "First 1,000 in your city get founder rates on {vertical}. Forever.",
    "The protocol is live. The door is open. {vertical} won't wait for you.",
    "Today is the cheapest day {vertical} will ever be.",
  ],
  scripture: [
    "\"Cast down your bucket where you are.\" Your {vertical} starts on the phone in your hand.",
    "\"The stone the builders rejected became the cornerstone.\" {vertical}, for those the system rejected.",
    "\"Whoever is faithful with little will be faithful with much.\" Start your {vertical} small. Grow forever.",
    "\"To everyone who has, more will be given.\" {vertical} pays the connector before the connected.",
    "\"Let the little children come.\" A child can use this {vertical} door. So can a king.",
  ],
  comedy: [
    "POV: Your dealer wants $4,000 over MSRP. {vertical} laughs in 50 languages. 🚪",
    "Me: I just want to {vertical} a car without filling out 47 forms. 3C ONYX: bet.",
    "Other apps: \"Please verify your fax number.\" 3C ONYX {vertical}: tap the picture. done.",
    "When your cousin says \"I know a guy.\" That guy was 3C ONYX {vertical} the whole time.",
    "Bank: $300 application fee. 3C ONYX {vertical}: free. Bank: 😶",
  ],
};

const HOOKS_ES: Record<ToneKey, string[]> = {
  authority: [
    "El estándar global para {vertical} acaba de cambiar.",
    "Cada concesionario en 50 naciones ya usa esto para {vertical}.",
    "El DOT del Planeta Tierra acaba de abrir {vertical} para todos.",
    "Construido para los lobos. Probado contra ellos. Ahora tu {vertical} también lo está.",
    "Cuando el mundo adoptó el correo electrónico, era gratis. {vertical} acaba de volverse gratis, también.",
  ],
  hustle: [
    "De un teléfono de $30 a tu primer pago por {vertical} en 60 segundos.",
    "Lagos. Newark. Manila. La misma puerta de {vertical}. Las mismas ganancias. Sin guardianes.",
    "Deja de alquilar tu futuro. Posee tu {vertical} desde cualquier rincón de la Tierra.",
    "Cada conexión que hagas en {vertical} te paga para siempre.",
    "$0 para empezar. $0 para siempre. Tu único costo es el tiempo que esperas.",
  ],
  compassion: [
    "No necesitas saber leer para usar {vertical}. Solo necesitas un teléfono.",
    "Construido para la persona que nadie más está construyendo. {vertical}, para todos.",
    "Tu abuela puede usar esta puerta de {vertical}. Tu sobrino también.",
    "Si tienes un teléfono, tienes {vertical}. Esa es toda la regla.",
    "El mundo dijo que necesitabas crédito, dirección, papeleo. {vertical} dijo que no.",
  ],
  urgency: [
    "{vertical} cierra su puerta de acceso anticipado esta semana. Entra ahora.",
    "Cada hora que esperas, alguien en tu código postal ganó lo que tú podrías haber ganado.",
    "Los primeros 1,000 en tu ciudad obtienen tarifas de fundador en {vertical}. Para siempre.",
    "El protocolo está vivo. La puerta está abierta. {vertical} no te esperará.",
    "Hoy es el día más barato que {vertical} jamás será.",
  ],
  scripture: [
    "\"Echa tu cubo donde estás.\" Tu {vertical} comienza en el teléfono que tienes en la mano.",
    "\"La piedra que desecharon los constructores se convirtió en piedra angular.\" {vertical}, para los que el sistema rechazó.",
    "\"El que es fiel en lo poco, también en lo mucho lo será.\" Empieza tu {vertical} pequeño. Crece para siempre.",
    "\"A todo el que tiene, le será dado más.\" {vertical} paga al conector antes que al conectado.",
    "\"Dejen que los niños vengan.\" Un niño puede usar esta puerta de {vertical}. Un rey también.",
  ],
  comedy: [
    "POV: Tu concesionario quiere $4,000 sobre el MSRP. {vertical} se ríe en 50 idiomas. 🚪",
    "Yo: Solo quiero {vertical} un coche sin llenar 47 formularios. 3C ONYX: hecho.",
    "Otras apps: \"Por favor verifica tu número de fax.\" 3C ONYX {vertical}: toca la foto. listo.",
    "Cuando tu primo dice \"Conozco a un tipo.\" Ese tipo era 3C ONYX {vertical} todo el tiempo.",
    "Banco: $300 de cargo por solicitud. 3C ONYX {vertical}: gratis. Banco: 😶",
  ],
};

const HOOKS_BY_LOCALE: Record<Locale, Record<ToneKey, string[]>> = {
  en: HOOKS_EN,
  es: HOOKS_ES,
};

const VERTICAL_NOUNS_EN: Record<Vertical, string> = {
  buy:      "buying a car",
  rent:     "renting a car",
  sell:     "selling your car",
  service:  "fixing your car",
  insure:   "insuring your car",
  finance:  "financing a car",
  appraise: "knowing your car's worth",
  warranty: "protecting your car",
  accident: "handling an accident",
  refer:    "earning from your network",
};

const VERTICAL_NOUNS_ES: Record<Vertical, string> = {
  buy:      "comprar un coche",
  rent:     "alquilar un coche",
  sell:     "vender tu coche",
  service:  "reparar tu coche",
  insure:   "asegurar tu coche",
  finance:  "financiar un coche",
  appraise: "saber el valor de tu coche",
  warranty: "proteger tu coche",
  accident: "manejar un accidente",
  refer:    "ganar con tu red",
};

const VERTICAL_NOUNS_BY_LOCALE: Record<Locale, Record<Vertical, string>> = {
  en: VERTICAL_NOUNS_EN,
  es: VERTICAL_NOUNS_ES,
};

const CTAS_EN = [
  "Walk through the door → 3conyx.com/door",
  "Tap the picture. No reading required → /door",
  "Earn from any corner globally → /door",
  "The People's Choice Worldwide → 3conyx.com",
  "Free forever. Open for everyone → /start",
];

const CTAS_ES = [
  "Cruza la puerta → 3conyx.com/door",
  "Toca la foto. No hace falta leer → /door",
  "Gana desde cualquier rincón del mundo → /door",
  "La Elección del Pueblo en Todo el Mundo → 3conyx.com",
  "Gratis para siempre. Abierto para todos → /start",
];

const CTAS_BY_LOCALE: Record<Locale, string[]> = {
  en: CTAS_EN,
  es: CTAS_ES,
};

const SCENE_LABELS: Record<Locale, { hook: string; scene1: string; scene2: string; scene3: string; voiceover: string; threadNote: (n: string) => string; pinNote: (n: string) => string; broadcastNote: (n: string) => string; profWhy: (n: string) => string; profClose: string }> = {
  en: {
    hook: "🎬 Hook",
    scene1: "[Scene 1] Phone screen — tap the door icon",
    scene2: "[Scene 2] Voice command in any language",
    scene3: "[Scene 3] Result lands in 60 seconds",
    voiceover: "Voiceover",
    threadNote: (n) => `↓ A thread on why this changes everything for ${n}.`,
    pinNote: (n) => `Save this. Share it with someone who needs ${n} done differently.`,
    broadcastNote: (n) => `Forward this to anyone who handles ${n}. They will thank you.`,
    profWhy: (n) => `Why this matters: ${n} has been gated by paperwork, credit, and geography for 100 years. 3C ONYX collapses that wall.`,
    profClose: "The protocol is open. The door is free. The standard is global.",
  },
  es: {
    hook: "🎬 Gancho",
    scene1: "[Escena 1] Pantalla del teléfono — toca el ícono de la puerta",
    scene2: "[Escena 2] Comando de voz en cualquier idioma",
    scene3: "[Escena 3] El resultado llega en 60 segundos",
    voiceover: "Voz en off",
    threadNote: (n) => `↓ Un hilo sobre por qué esto cambia todo para ${n}.`,
    pinNote: (n) => `Guarda esto. Compártelo con alguien que necesite ${n} de forma diferente.`,
    broadcastNote: (n) => `Reenvía esto a cualquiera que maneje ${n}. Te lo agradecerán.`,
    profWhy: (n) => `Por qué importa: ${n} ha estado bloqueado por papeleo, crédito y geografía durante 100 años. 3C ONYX derriba ese muro.`,
    profClose: "El protocolo está abierto. La puerta es gratis. El estándar es global.",
  },
};

// Deterministic pick — given a seed, always returns the same item.
function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

// ── Generator (fully sovereign — no external API) ────────────────────
interface Post {
  id: string;
  vertical: Vertical;
  platform: PlatformKey;
  tone: ToneKey;
  body: string;
  hashtags: string;
  cta: string;
  fullText: string;
  charCount: number;
}

function generatePost(v: Vertical, p: Platform, tone: ToneKey, seed: number, locale: Locale): Post {
  const noun = VERTICAL_NOUNS_BY_LOCALE[locale][v];
  const verticalMeta = VERTICALS.find((x) => x.key === v)!;
  const hook = pick(HOOKS_BY_LOCALE[locale][tone], seed).replace(/{vertical}/g, noun);
  const cta = pick(CTAS_BY_LOCALE[locale], seed + 7);
  const sl = SCENE_LABELS[locale];
  const baseTags = ["#3CONYX", "#PeoplesChoiceWorldwide", "#KilocornEra", verticalMeta.hashtag];

  let body = hook;
  if (p.format === "professional") {
    body = `${hook}\n\n${sl.profWhy(noun)}\n\n${sl.profClose}`;
  } else if (p.format === "video" || p.format === "reel") {
    body = `${sl.hook}: ${hook}\n\n${sl.scene1}\n${sl.scene2}\n${sl.scene3}\n\n${sl.voiceover}: ${cta}`;
  } else if (p.format === "thread") {
    body = `${hook}\n\n${sl.threadNote(noun)}`;
  } else if (p.format === "pin") {
    body = `${hook}\n\n${sl.pinNote(noun)}`;
  } else if (p.format === "snap") {
    body = hook.length > 200 ? hook.slice(0, 197) + "..." : hook;
  } else if (p.format === "broadcast") {
    body = `${hook}\n\n${cta}\n\n${sl.broadcastNote(noun)}`;
  } else if (p.format === "tweet") {
    const max = 280 - 30 - baseTags.join(" ").length;
    body = hook.length > max ? hook.slice(0, max - 3) + "..." : hook;
  }

  const hashtags = baseTags.join(" ");
  const fullText = p.format === "tweet"
    ? `${body}\n\n${hashtags}`
    : `${body}\n\n${cta}\n\n${hashtags}`;

  return {
    id: `${v}-${p.key}-${tone}-${seed}`,
    vertical: v,
    platform: p.key,
    tone,
    body,
    hashtags,
    cta,
    fullText,
    charCount: fullText.length,
  };
}

export default function AmplifyEngine() {
  const [vertical, setVertical] = useState<Vertical>("buy");
  const [tone, setTone] = useState<ToneKey>("authority");
  const [locale, setLocale] = useState<Locale>("en");
  const [seed, setSeed] = useState(1);
  const [batchMode, setBatchMode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Generate one post per platform for the chosen vertical+tone+locale
  const posts = useMemo<Post[]>(() => {
    return PLATFORMS.map((p, i) => generatePost(vertical, p, tone, seed + i, locale));
  }, [vertical, tone, seed, locale]);

  // Batch: every combo × current locale (10 v × 12 p × 6 t = 720 posts)
  const batch = useMemo<Post[]>(() => {
    if (!batchMode) return [];
    const all: Post[] = [];
    let s = seed;
    for (const v of VERTICALS) {
      for (const p of PLATFORMS) {
        for (const t of TONES) {
          all.push(generatePost(v.key, p, t.key, s++, locale));
        }
      }
    }
    return all;
  }, [batchMode, seed, locale]);

  function copy(text: string, id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  function downloadJSON() {
    const data = batchMode ? batch : posts;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3conyx-amplify-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    const data = batchMode ? batch : posts;
    const rows = [
      ["vertical", "platform", "tone", "body", "hashtags", "cta", "char_count"].join(","),
      ...data.map((p) =>
        [p.vertical, p.platform, p.tone,
          `"${p.body.replace(/"/g, '""')}"`,
          `"${p.hashtags.replace(/"/g, '""')}"`,
          `"${p.cta.replace(/"/g, '""')}"`,
          String(p.charCount),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3conyx-amplify-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
      {/* Top bar */}
      <div className="border-b border-amber-400/20 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <span className="text-amber-400 text-lg">◈</span>
            <span className="font-black tracking-widest">3C ONYX · AXON</span>
            <span className="text-amber-400 hidden sm:inline">· AI MARKETING ENGINE</span>
          </Link>
          <div className="flex items-center gap-3 text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              SOVEREIGN · OFFLINE-CAPABLE
            </span>
            <Link href="/cvo" className="text-amber-400 hover:underline">→ CVO</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-amber-400/10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 border border-amber-400/40 rounded-full px-4 py-1.5 text-xs tracking-widest text-amber-400 mb-6">
            🌍 THE PEOPLE'S CHOICE — WORLDWIDE
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-[0.9] mb-6">
            Every Vertical.<br/>
            Every Platform.<br/>
            <span className="text-amber-400">Every Voice.</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-300 max-w-3xl mb-8 leading-relaxed">
            <span className="text-amber-400 font-bold">10 verticals × 12 platforms × 6 tones = 720 ready-to-post pieces of content,</span> generated in your browser, no API key, no rate limit, no subscription. Sovereign forever. Free forever. The People's Choice — by the people, for the people.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <Kpi v="10" l="Verticals" hue="#C9A227" />
            <Kpi v="12" l="Platforms" hue="#5EC2D9" />
            <Kpi v="6"  l="Tones"     hue="#A78BFA" />
            <Kpi v="720" l="Posts / batch" hue="#22c55e" />
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="border-b border-amber-400/10 py-8 bg-stone-950/60">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {/* Vertical picker */}
          <div>
            <div className="text-xs tracking-widest text-amber-400 mb-2">CHOOSE A VERTICAL</div>
            <div className="flex flex-wrap gap-2">
              {VERTICALS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVertical(v.key)}
                  data-testid={`vertical-${v.key}`}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
                    vertical === v.key
                      ? "bg-amber-400 text-black border-amber-400"
                      : "border-amber-400/30 text-stone-300 hover:border-amber-400"
                  }`}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone picker */}
          <div>
            <div className="text-xs tracking-widest text-amber-400 mb-2">CHOOSE A VOICE</div>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  data-testid={`tone-${t.key}`}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
                    tone === t.key
                      ? "bg-amber-400 text-black border-amber-400"
                      : "border-amber-400/30 text-stone-300 hover:border-amber-400"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language picker */}
          <div>
            <div className="text-xs tracking-widest text-amber-400 mb-2">CHOOSE A LANGUAGE · ELIGE UN IDIOMA</div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: "en" as Locale, label: "English",  emoji: "🇺🇸" },
                { key: "es" as Locale, label: "Español",  emoji: "🌎" },
              ]).map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLocale(l.key)}
                  data-testid={`locale-${l.key}`}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition ${
                    locale === l.key
                      ? "bg-amber-400 text-black border-amber-400"
                      : "border-amber-400/30 text-stone-300 hover:border-amber-400"
                  }`}
                >
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              onClick={() => setSeed((s) => s + 1)}
              data-testid="btn-regenerate"
              className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-6 py-3 rounded-2xl"
            >
              ↻ Regenerate
            </button>
            <button
              onClick={() => setBatchMode((b) => !b)}
              data-testid="btn-batch"
              className={`border font-black uppercase tracking-wider px-6 py-3 rounded-2xl transition ${
                batchMode
                  ? "bg-amber-400 text-black border-amber-400"
                  : "border-amber-400/40 text-amber-400 hover:border-amber-400"
              }`}
            >
              {batchMode ? "✓ Batch (720)" : "⚡ Generate All 720"}
            </button>
            <button onClick={downloadJSON} className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">
              ↓ JSON
            </button>
            <button onClick={downloadCSV} className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-6 py-3 rounded-2xl">
              ↓ CSV
            </button>
            <div className="text-xs text-stone-500 ml-auto font-mono">
              {batchMode ? `${batch.length} posts ready` : `${posts.length} posts ready`}
            </div>
          </div>
        </div>
      </section>

      {/* Output: 12-platform grid (single vertical+tone) */}
      {!batchMode && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-black mb-6">
              Ready to post.{" "}
              <span className="text-amber-400">{VERTICALS.find((v) => v.key === vertical)?.label}</span>
              {" · "}
              <span className="text-amber-400">{TONES.find((t) => t.key === tone)?.label}</span>
              {" · "}
              <span className="text-stone-400 text-base">12 platforms</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {posts.map((post) => {
                const platform = PLATFORMS.find((p) => p.key === post.platform)!;
                const isCopied = copied === post.id;
                const overLimit = post.charCount > platform.charLimit;
                return (
                  <div
                    key={post.id}
                    data-testid={`post-${post.platform}`}
                    className="border border-amber-400/20 rounded-2xl p-5 bg-stone-950/60 hover:border-amber-400/60 transition flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden>{platform.emoji}</span>
                        <span className="font-black text-white">{platform.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        overLimit ? "bg-red-400/20 text-red-400" : "bg-stone-700/40 text-stone-400"
                      }`}>
                        {post.charCount}/{platform.charLimit}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-stone-200 font-sans leading-relaxed flex-1 mb-3">
                      {post.fullText}
                    </pre>
                    <button
                      onClick={() => copy(post.fullText, post.id)}
                      data-testid={`copy-${post.platform}`}
                      className={`text-xs font-black uppercase tracking-wider rounded-xl py-2 transition ${
                        isCopied
                          ? "bg-green-400 text-black"
                          : "bg-amber-400/10 hover:bg-amber-400 hover:text-black text-amber-400"
                      }`}
                    >
                      {isCopied ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Batch output */}
      {batchMode && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-black mb-2">
              Batch generated. <span className="text-amber-400">{batch.length} posts.</span>
            </h2>
            <p className="text-stone-400 mb-6 text-sm">
              Every vertical × every platform × every tone. Download as CSV, plug into your scheduler of choice (Buffer, Hootsuite, Later, Sprout, or your own cron job).
            </p>
            <div className="border border-amber-400/20 rounded-2xl bg-stone-950/60 max-h-[600px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-black border-b border-amber-400/20">
                  <tr className="text-left text-amber-400">
                    <th className="p-3">Vertical</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Tone</th>
                    <th className="p-3">Preview</th>
                    <th className="p-3">Chars</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.slice(0, 100).map((p) => (
                    <tr key={p.id} className="border-b border-stone-900 hover:bg-stone-900/40">
                      <td className="p-3 font-mono text-stone-400">{p.vertical}</td>
                      <td className="p-3 font-mono text-stone-400">{p.platform}</td>
                      <td className="p-3 font-mono text-stone-400">{p.tone}</td>
                      <td className="p-3 text-stone-300 truncate max-w-[400px]">{p.body.split("\n")[0]}</td>
                      <td className="p-3 font-mono text-stone-500">{p.charCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {batch.length > 100 && (
                <div className="text-center text-stone-500 text-xs p-4 border-t border-stone-900">
                  Showing first 100 of {batch.length}. Download CSV/JSON to see all.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why It's In The DNA */}
      <section className="border-t border-amber-400/10 py-12 bg-gradient-to-b from-black to-stone-950">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-black mb-8">
            Why This Lives In <span className="text-amber-400">The DNA.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { tag: "SOVEREIGN", title: "No external AI, no API key, no rate limit", body: "Constant Contact charges $12-$415/month. Hootsuite charges $99-$249/month. AXON charges $0, forever, no card required. Runs in your browser — they cannot turn it off." },
              { tag: "GLOBAL", title: "Every platform, every region, every language-ready", body: "X · Instagram · TikTok · Facebook · YouTube · LinkedIn · Threads · Pinterest · Snapchat · WhatsApp · Telegram · Reddit. Every channel where any human on Earth scrolls." },
              { tag: "ANTIFRAGILE", title: "Works offline, works on a $30 phone", body: "Templates ship with the app. No server round-trip. Pure JavaScript. Generate 720 posts on a flight, on a subway, in a village without WiFi." },
              { tag: "PEOPLE-OWNED", title: "The People's Choice — by the People", body: "Every connector, every member, every node uses the same engine. No premium tier. No paywall. The marketing power of a Fortune 500 in the pocket of a runner in Lagos." },
            ].map((d, i) => (
              <div key={i} className="border-l-2 border-amber-400/40 pl-5 py-2">
                <div className="text-amber-400 font-black tracking-widest text-xs mb-1">{d.tag}</div>
                <div className="text-xl font-black text-white mb-2">{d.title}</div>
                <p className="text-stone-400 leading-relaxed text-sm">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🌍</div>
          <h2 className="text-3xl sm:text-5xl font-black mb-6">
            The People's Choice. <br/>
            <span className="text-amber-400">Worldwide.</span>
          </h2>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/door" className="bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider px-8 py-4 rounded-2xl">Open the Door →</Link>
            <Link href="/standard" className="border border-amber-400/40 hover:border-amber-400 text-amber-400 font-black uppercase tracking-wider px-8 py-4 rounded-2xl">View the Standard</Link>
            <Link href="/cvo" className="border border-stone-700 hover:border-stone-500 text-stone-300 font-black uppercase tracking-wider px-8 py-4 rounded-2xl">CVO Console</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-amber-400/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div>3C ONYX AXON · MARKETING DNA · RAC3C / CUXTOMCANDYCLUB LLC</div>
          <div className="text-amber-400/60">Sovereign · Free Forever 🌍</div>
        </div>
      </footer>
    </div>
  );
}

function Kpi({ v, l, hue }: { v: string; l: string; hue: string }) {
  return (
    <div className="border border-amber-400/20 rounded-2xl p-4 bg-stone-950/60">
      <div className="text-3xl font-black" style={{ color: hue }}>{v}</div>
      <div className="text-xs text-stone-400 mt-1">{l}</div>
    </div>
  );
}
