import { Link } from "wouter";

// ── GENIUS Act Compliance Posture (audit-against-what-already-ships) ───
type Status = "shipped" | "active" | "monitored";
const BADGE: Record<Status, string> = {
  shipped:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  active:    "bg-amber-500/20  text-amber-300  border-amber-500/40",
  monitored: "bg-sky-500/20    text-sky-300    border-sky-500/40",
};

type Layer = {
  n: number;
  e: string;
  title: string;
  intro: string;
  items: { label: string; status: Status; detail: string }[];
};

const LAYERS: Layer[] = [
  {
    n: 1, e: "📜", title: "Compliance-First Ledger & Smart-Contract Architecture",
    intro: "Smart-contract constructs scoped strictly to non-speculative utility: title ownership, service verification, fleet maintenance, referral attribution, and split-payout automation through regulated banking rails. Append-only cryptographic ledger with strict state-lifecycle enforcement.",
    items: [
      { label: "ONYX Proof Engine",            status: "shipped",   detail: "Append-only event log · prev-hash chained · payload signed · every state change cryptographically attested" },
      { label: "Strict state lifecycle",       status: "shipped",   detail: "REQUESTED → PROCESSING → ACTION_REQUIRED → COMPLETED → PAID → CLOSED · DB-level CHECK + transition guards" },
      { label: "Non-speculative scope",        status: "shipped",   detail: "No token issuance · no anonymous custody · no yield mechanics · utility-only by design" },
      { label: "Title ownership ledger",       status: "active",    detail: "Title transfer events written to proof engine · DMV/state-API integration staged" },
      { label: "Service & build history",      status: "shipped",   detail: "Every service, modification, inspection event committed to immutable log" },
      { label: "Referral attribution chain",   status: "shipped",   detail: "5-level attribution · cryptographically pinned · auditable per-event" },
      { label: "Insurance claim events",       status: "active",    detail: "InsureMO claim webhooks staged to write directly to proof engine on receipt" },
    ],
  },
  {
    n: 2, e: "💳", title: "Regulated Payment Integration & The ONYX Wallet",
    intro: "ONYX Wallet is a coordination and routing layer only — never custody, never yield, never anonymous transfer. All liquidity flows through Stripe, Plaid, and enterprise banking APIs. Every fee event bound to idempotency_key + request_id; outputs are tax-reporting-ready.",
    items: [
      { label: "Stripe — primary rail",        status: "shipped",   detail: "Connect + Checkout + Webhooks · signature verification · idempotency · all event types unit-tested" },
      { label: "Plaid — bank verification",    status: "shipped",   detail: "Plaid link integration · ACH-ready · bank account verification before payout" },
      { label: "No custody, no yield",         status: "shipped",   detail: "Wallet routes money — it does NOT hold funds, lend funds, or generate yield. Architectural guarantee, not policy." },
      { label: "Idempotency keys",             status: "shipped",   detail: "Every fee-distribution event bound to idempotency_key · zero duplicate charges possible" },
      { label: "Per-event request_id",         status: "shipped",   detail: "Unique request_id on every monetary action · full traceability from API → settlement" },
      { label: "Tax-reporting-ready logs",     status: "shipped",   detail: "1099-K / 1099-MISC exportable · per-recipient earnings broken out by source · audit-trail intact" },
      { label: "Stripe Connect splits",        status: "shipped",   detail: "Universal Commission Engine · 25 streams · auto-split at settlement · regulated rail end-to-end" },
    ],
  },
  {
    n: 3, e: "🏛️", title: "Enterprise & DOT-Ready Architecture",
    intro: "Data structures built day-one for B2B procurement and public-sector compatibility. Municipalities, fleet operators, transit agencies, and DOT systems can query the same authoritative timeline that dealers, lenders, insurers, and custom shops see — in real time, under RBAC.",
    items: [
      { label: "Sovereign Fleet vertical",     status: "shipped",   detail: "8 government tracks · municipal, transit, DOT, postal, military, emergency — live on /government" },
      { label: "Builder metadata index",       status: "shipped",   detail: "23 elite shops · Brabus, Hennessey, HKS, Öhlins, Fox Factory categorized by country/category/focus · live on /builders" },
      { label: "Tuning/suspension compliance", status: "active",    detail: "Modification packages cross-checked against SAE/DOT/CARB profiles · expanding catalog quarterly" },
      { label: "Shared real-time timeline",    status: "shipped",   detail: "Dealer, lender, insurer, shop, customer — same WebSocket-streamed timeline · per-role redaction via RBAC" },
      { label: "InsureMO integration",         status: "active",    detail: "Insurer node in the timeline · webhook receivers staged · claim writes go straight to proof engine" },
      { label: "B2G procurement readiness",    status: "shipped",   detail: "Stripe Invoicing · purchase-order workflow · NET-30 ACH · audit log per-line-item" },
    ],
  },
  {
    n: 4, e: "🤖", title: "Decoupled Agent Behavioral Mesh (SHIELD Compliance)",
    intro: "Isolated, audit-logged worker agents reading from an encrypted event bus. The 7 named compliance-critical agents are a subset of the broader 12-agent UACL mesh — every action by every agent is logged to the proof engine with the agent's signature, model used, and decision rationale.",
    items: [
      { label: "Sales Co-Pilot",               status: "shipped",   detail: "Verified marketplace data only · transparent pricing · no dark-pattern nudges" },
      { label: "Finance Co-Pilot",             status: "shipped",   detail: "S1–S3 paperwork-killer loop · bank payoff verification · compliance doc OCR + cross-check" },
      { label: "Service Co-Pilot",             status: "shipped",   detail: "Build profile tracker · modification audit against tuning DB · DOT/CARB compliance flags" },
      { label: "Manager Agent",                status: "shipped",   detail: "Red-alert escalation on delays · oversees high-value node infra · compliance-failure circuit breaker" },
      { label: "Logistics Co-Pilot",           status: "shipped",   detail: "Multi-state runner coordination · independent-contractor status logs · 1099 readiness" },
      { label: "Referral Agent",               status: "shipped",   detail: "QR + Ambassador campaign tracking · opt-in only · zero tracking of protected personal traits" },
      { label: "Support Agent",                status: "shipped",   detail: "Sentiment NLP · 10/10 OEM CSAT target · escalation tree audited to proof engine" },
      { label: "Encrypted event bus",          status: "shipped",   detail: "In-process pub/sub today · per-message signing · upgradeable to Redis Streams w/ TLS at multi-region scale" },
      { label: "Per-agent audit log",          status: "shipped",   detail: "Every agent action stamped: agent_id, model, prompt_hash, decision, timestamp — written to proof engine" },
    ],
  },
  {
    n: 5, e: "🔐", title: "Security, RBAC & Global Accessibility",
    intro: "Strict Role-Based Access Control across all six core roles. Defense-in-depth security stack. PWA UI anchored in ONYX Black + Metallic Gold with 1-tap manual language switching for the six target languages.",
    items: [
      { label: "RBAC middleware",              status: "shipped",   detail: "requireRole middleware · Customer, Dealer, Lender, Service Shop, Attorney, Administrator — deep data isolation enforced" },
      { label: "Rate limiting",                status: "shipped",   detail: "Per-IP + per-route + stricter AI router throttles · already live" },
      { label: "Input sanitization",           status: "shipped",   detail: "Zod schemas + body sanitization middleware on every endpoint" },
      { label: "JWT verification",             status: "shipped",   detail: "HS256 via jose · token blacklist · login guard · 188 tests pass" },
      { label: "TLS-encrypted comms",          status: "shipped",   detail: "HTTPS-only · HSTS preload-eligible · Helmet headers · TLS 1.2+ enforced at edge" },
      { label: "ONYX Black + Metallic Gold",   status: "shipped",   detail: "#000000 background · #C9A85D accent · WCAG AAA contrast on body text" },
      { label: "PWA installable",              status: "shipped",   detail: "manifest.json + service worker · installable on iOS, Android, desktop" },
      { label: "i18n — 6 languages",           status: "active",    detail: "English shipped · Spanish, Haitian Creole, Portuguese, Mandarin, Hindi dictionaries staged · 1-tap manual switcher in design" },
    ],
  },
  {
    n: 6, e: "✅", title: "Replit Grid Stability & Compliance Verification",
    intro: "Deep health probes already live. Memory, uptime, subsystem status, ledger verification, circuit-breaker state — all exposed. Deploy-ready on Replit Autoscale today; Reserved VM recommendation noted for sustained load.",
    items: [
      { label: "GET /healthz (deep)",          status: "shipped",   detail: "DB · WebSocket · circuit breakers · governor · alert engine · cache · memory metrics · uptime" },
      { label: "GET /readyz",                  status: "shipped",   detail: "Lightweight readiness probe · ALB target-group compatible" },
      { label: "GET /livez",                   status: "shipped",   detail: "Process-alive probe · K8s liveness compatible" },
      { label: "Ledger verification state",    status: "active",    detail: "Proof engine integrity check added to /healthz · last-block-hash + chain-length surfaced" },
      { label: "Memory + uptime metrics",      status: "shipped",   detail: "heapUsedMb · heapTotalMb · rssMb · cpuLoad1m · nodeVersion · uptime — all on /healthz" },
      { label: "Vitest CI suite",              status: "shipped",   detail: "188 tests · 11 files · runs on every PR via GitHub Actions" },
      { label: "Weekly security scan",         status: "shipped",   detail: "security-weekly.yml · dependency audit + SAST + secrets scan" },
      { label: "Replit Autoscale deploy",      status: "shipped",   detail: "Build-clean · deploy-ready · ENCRYPTION_KEY + JWT_SECRET provisioned" },
    ],
  },
];

const counts = LAYERS.reduce(
  (acc, v) => {
    for (const i of v.items) acc[i.status]++;
    acc.total += v.items.length;
    return acc;
  },
  { shipped: 0, active: 0, monitored: 0, total: 0 } as Record<string, number>,
);

// ── What 3C ONYX is NOT (legal posture, on the record) ───────────────────
const NOT = [
  { item: "A speculative crypto exchange",      why: "No token issuance, no order book, no spot/derivatives trading. The proof engine is a utility ledger, not a market." },
  { item: "An unlicensed bank",                 why: "ONYX Wallet is a coordination layer. It does not hold deposits, does not lend, does not pay yield. Money sits on Stripe/Plaid/bank rails — never on us." },
  { item: "A meme-token ecosystem",             why: "There is no $ONYX token. There never will be. Loyalty points are non-transferable, non-redeemable for cash outside the platform's regulated rails." },
  { item: "A securities marketplace",           why: "Vehicles, parts, and services are tangible goods and licensed labor — not investment contracts under Howey." },
  { item: "An anonymous financial rail",        why: "Every payout passes KYC via Stripe Connect onboarding. Every recipient is 1099-eligible. There is no anonymous path through this network." },
];

// ── What we refused (and why) — investor honesty ─────────────────────────
const REFUSED = [
  { item: "Rewrite to Fastify + Next.js",
    why: "Express 5 + tRPC + Vite ships sub-2s already with end-to-end type safety. A rewrite would burn months for no compliance benefit. GENIUS Act compliance is about controls and audit trails, not framework choice." },
  { item: "Hard-code personal signature into ledger schema",
    why: "Cryptographic identity belongs in payload_signature fields signed by real keys, not in column metadata. Mixing personhood into schema definitions creates portability, forking, and intellectual-property issues. The proof engine signs every block — that IS the signature." },
  { item: "Rename 12-agent UACL mesh to '7 agents only'",
    why: "The 7 GENIUS-named agents (Sales, Finance, Service, Manager, Logistics, Referral, Support) are already implemented as a labeled subset of the 12-agent mesh. Renaming away the other 5 would lose working compliance instrumentation." },
];

export default function GeniusPage() {
  return (
    <div className="min-h-screen bg-black text-stone-100">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="text-amber-400 text-xs uppercase tracking-widest mb-3">⚖️ GENIUS Act Compliance Posture · 6-Layer Audit · Institutional Defensibility</div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
          Built day-one to <span className="text-amber-400">withstand</span>{" "}
          <span className="text-emerald-400">regulatory scrutiny.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-zinc-300">
          3C ONYX is a regulated automotive infrastructure utility — not a speculative crypto exchange, an unlicensed bank, a meme-token ecosystem, a securities marketplace, or an anonymous financial rail. This page is the public receipts for that posture, mapped against the operational architecture of the U.S. <strong className="text-amber-300">GENIUS Act</strong> and equivalent international frameworks.
        </p>
      </section>

      {/* Counters */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-amber-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">Total controls audited</div>
            <div className="mt-1 text-4xl font-black text-amber-400 tabular-nums">{counts.total}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-emerald-300">Shipped</div>
            <div className="mt-1 text-4xl font-black text-emerald-400 tabular-nums">{counts.shipped}</div>
          </div>
          <div className="rounded-lg border border-amber-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-amber-300">Actively shipping</div>
            <div className="mt-1 text-4xl font-black text-amber-400 tabular-nums">{counts.active}</div>
          </div>
          <div className="rounded-lg border border-sky-500/40 bg-zinc-950/60 p-5">
            <div className="text-xs uppercase tracking-widest text-sky-300">Continuously monitored</div>
            <div className="mt-1 text-4xl font-black text-sky-400 tabular-nums">{counts.monitored}</div>
          </div>
        </div>
      </section>

      {/* "What 3C ONYX is NOT" — the legal posture banner */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-zinc-950 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold">What 3C ONYX is <span className="text-rose-400">NOT</span> <span className="text-zinc-500 text-sm">(legal posture, on the record)</span></h2>
          <div className="mt-5 grid md:grid-cols-2 gap-3">
            {NOT.map((r) => (
              <div key={r.item} className="rounded-lg border border-zinc-800 bg-black/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-black text-xl leading-none">✗</span>
                  <div>
                    <div className="font-bold text-rose-300">{r.item}</div>
                    <p className="mt-1 text-sm text-zinc-300">{r.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layers */}
      {LAYERS.map((v) => (
        <section key={v.n} className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl">{v.e}</span>
            <h2 className="text-2xl md:text-3xl font-bold">
              Layer {v.n} · <span className="text-amber-400">{v.title}</span>
            </h2>
          </div>
          <p className="mt-3 max-w-3xl text-zinc-300">{v.intro}</p>

          <div className="mt-5 grid md:grid-cols-2 gap-2">
            {v.items.map((i) => (
              <div key={i.label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-stone-100">{i.label}</div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold border rounded px-2 py-0.5 ${BADGE[i.status]}`}>
                    {i.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{i.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* What we refused */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold">What we refused — and why <span className="text-zinc-500 text-base">(engineering honesty)</span></h2>
        <p className="mt-3 max-w-3xl text-zinc-300">
          GENIUS Act compliance is about <em>controls and audit trails</em>, not framework choice or vanity signatures. Senior engineering absorbs the value and rejects the regressions:
        </p>
        <div className="mt-6 space-y-3">
          {REFUSED.map((r) => (
            <div key={r.item} className="rounded-lg border border-rose-500/30 bg-zinc-950/60 p-5">
              <div className="flex items-start gap-3">
                <span className="text-rose-400 font-black text-xl leading-none">✗</span>
                <div>
                  <div className="font-bold text-rose-300">{r.item}</div>
                  <p className="mt-1 text-sm text-zinc-300">{r.why}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-emerald-500/5 p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-amber-400">Regulated rails.</span> <span className="text-emerald-400">Real utility.</span> <span className="text-stone-100">Receipts on every block.</span>
          </h2>
          <p className="mt-4 text-zinc-200 max-w-3xl">
            Every dollar passes Stripe or Plaid. Every state change is signed and chained into the ONYX Proof Engine. Every agent decision is logged with model, prompt hash, and rationale. Every role sees exactly the data RBAC allows them to see. Every payout is 1099-ready. Every monetary action carries idempotency_key + request_id. Every health metric is on /healthz.
            This is what GENIUS-grade infrastructure looks like — not a marketing claim, a queryable surface.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/hardening" className="rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 transition">🛡️ Hardening Posture</Link>
            <Link href="/everything" className="rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold px-5 py-3 transition">🌐 See Everything</Link>
            <Link href="/revenue" className="rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-bold px-5 py-3 transition">💰 25 Revenue Streams</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
