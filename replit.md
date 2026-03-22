# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

## Design System (3C Onyx)

**Visual Language**: Apple × GTA — cinematic dark mode, deep black (#0A0A0A) + gold (#C9A227) + neon accents.

- **Fonts**: Barlow Condensed (900/800/700/600, uppercase, letterSpacing 0.04em) for all H1/display headings; Inter for body/UI text. Loaded via Google Fonts in `index.html`.
- **Home hero**: "YOUR FLEET, YOUR RULES." — solid white + gold outlined text in massive Barlow Condensed, ambient radial gradient background.
- **Page headers**: All key customer pages (Marketplace, My Garage, Live Tracking, Member Wallet) use Barlow Condensed 800 uppercase h1, amber-500/10 icon box.
- **Sidebar**: `AppSidebar.tsx` — "3C ONYX / SECURE PLATFORM" brand; sections: MY ACCOUNT (customer nav), SPECIALIST (runner nav), PLATFORM (collapsed admin tools: Concierge, Inventory, Analytics, Audit Vault, CI/CD).
- **PageHeader component**: `src/components/PageHeader.tsx` — reusable header with accent icon box + Barlow Condensed title + optional badge/actions.
- **Stat cards**: Translucent glassmorphism `rgba(255,255,255,0.04)` with accent-colored big numbers.

## New Integrations (Backend Routes)

| Integration | Route Prefix | Description | API Key Env Var | Fallback |
|---|---|---|---|---|
| **Plaid** | `/api/plaid/` | Financial linking — link-token, exchange, accounts, transactions, net-worth | `PLAID_CLIENT_ID` + `PLAID_SECRET` + `PLAID_ENV` | Full simulation |
| **Insuremo** | `/api/insuremo/` | Insurance quotes by VIN across 4 carriers; active policy management | `INSUREMO_API_KEY` | Full simulation |
| **Motor.com** | `/api/motor/` | VIN vehicle history reports + market value | `MOTOR_API_KEY` | SHA-256 seeded simulation |
| **Browserbase** | `/api/browserbase/` | Remote browser automation tasks (dealer verify, price check, VIN decode) | `BROWSERBASE_API_KEY` + `BROWSERBASE_PROJECT_ID` | In-memory task simulation |
| **Gumloop** | `/api/gumloop/` | AI workflow engine — 6 pre-built workflows with run/poll loop | `GUMLOOP_API_KEY` | Timed simulation with realistic outputs |

## New Frontend Pages

| Page | Route | Integration | Accent |
|---|---|---|---|
| Finance Hub | `/finance` | Plaid | #4FC3F7 (cyan) |
| Insurance Hub | `/insurance` | Insuremo | #34D399 (emerald) |
| Vehicle History | `/vehicle-history` | Motor.com | #F97316 (orange) |
| AI Automation Hub | `/ai-hub` | Gumloop + Browserbase | #818CF8 (violet) |

## AI-Native Design System (index.css additions)

Global CSS classes for the futuristic look:
- `.ai-card` — glassmorphism base card (backdrop-filter, dark bg, rounded-2xl)
- `.holographic-card` — shimmer overlay animation on ::before
- `.neural-grid-overlay` — subtle dot/grid pattern
- `.scan-line-overlay` — animated scan line sweep on ::after
- `.neural-glow-blue/green/gold/violet` — colored box-shadow glow
- `.neural-badge` + `.neural-badge-green/gold/violet/orange` — blinking status badges
- `.gradient-border-card` — animated gradient border via ::before
- `.section-label` — 10px uppercase spaced label style
- `.hero-mesh` — multi-radial gradient home background
- `.hero-grid` — gold grid overlay with mask-image fade
- `.neon-underline` — animated holographic underline on ::after
- Keyframes: `scan-line`, `neural-pulse`, `gradient-shift`, `data-stream`, `hologram-shimmer`, `border-flow`, `float-up`, `glitch`, `status-blink`

## Platform Features (3C Onyx)

1. **Marketplace / National Wholesale Engine** — Two-tab UI: "All Inventory" + "Wholesale Engine". Every listing is AI-enriched server-side with: `market_avg` (deterministic regional retail estimate), `guardian_health_score` (VIN + mileage + age + DOM algorithm, 55-99), `club_price` (listed − 3% dealer discount + 1.2% platform fee), `savings_vs_retail`, and `wholesale_potential` flag. Cards show: gold SAVE $X badge, Guardian Health Score ring (SVG, color-coded EXCELLENT/GOOD/FAIR), 3C Club Price with strikethrough retail avg, "X% below retail" gold progress bar, green WHOLESALE pill, "Claim Club Price" CTA. Wholesale stats bar: deal count, total savings, avg savings, avg guardian score. Inline price breakdown tooltip. API routes: `GET /api/marketcheck/search` (enriched, filterable) + `GET /api/marketcheck/wholesale` (wholesale-only stats). Search bar with 350ms debounce. Filter panel (make/price/miles/year). Count bar with clickable wholesale shortcut link.
2. **Watchlist** — Track vehicles with target price alerts, gap tracking, "Alert me" action
3. **My Garage** — Smartcar telematics with odometer, fuel/battery, demo vehicles
4. **Logistics** — HyperTrack Runner delivery map, live task tracking
5. **Pre-Pickup Inspection** — 3-step form (vehicle → condition sliders → sign-off), saves to DB with SHA-256 audit trail
6. **Proof of Delivery** — QR digital handshake with SHA-256 tamper hashing
7. **Member Wallet** — Stripe Connect with 5% Member Slice transfers, payout history
8. **AI Concierge** — Floating Gemini chat (garage context injection, SSE streaming, quick chips)
9. **Specialist Onboarding** — 4-step BGC portal (SSN → Checkr only, never stored), Checkr simulation fallback
10. **Specialist Dashboard** — Delivery history, star ratings, performance scores, milestone tracker
11. **Analytics** — Admin-only revenue dashboard with Recharts charts: GMV, Member Slice, task breakdown, BGC pie chart
12. **Live Notifications** — Notification bell in sidebar header (polls every 15s), mark read/all read, 12 seed events
13. **SOC2 Audit Vault** — Admin-only, SHA-256 tamper hashing, filterable table, CSV export, 80 seed records
14. **MCP Server** — `@modelcontextprotocol/sdk` StreamableHTTP server at `/api/mcp` with 8 tools: `search_vehicles`, `get_garage`, `get_watchlist`, `get_notifications`, `get_gig_tasks`, `book_runner`, `get_analytics`, `get_inspections`. Gemini Concierge uses Gemini function calling to invoke MCP tools with real DB data.
15. **CI/CD Pipeline** — `/ci-cd` dashboard; 3 steps (TypeScript Check, Build API Server, Build Web App) run via `/api/ci/run` endpoint; live status polling every 2s; deployment config: autoscale, us-east-1, `pnpm run build`. Validation commands also registered as Replit workflows (typecheck, build-api, build-web).

## Database Schema

### Tables (SOC2 audit-trail compliant — all have `created_at` / `updated_at`)

| Table | Key Fields |
|---|---|
| `users` | `id`, `name`, `email`, `role` (Member/Dealer/Runner), `phone`, `avatar_url` |
| `vehicles` | `id`, `vin` (unique), `year`, `make`, `model`, `color`, `price_usd`, `status`, `dealer_id` |
| `gig_tasks` | `id`, `title`, `task_type`, `status`, `vehicle_id`, `assigned_runner_id`, `posted_by_dealer_id`, `payout_usd` |
| `commission_ledger` | `id`, `entry_type`, `status`, `recipient_id`, `amount_usd`, `vehicle_id`, `gig_task_id`, `referred_by_user_id`, `paid_at` |
| `audit_logs` | `id`, `event_type`, `action`, `actor_id`, `actor_role`, `severity`, `sha256_hash`, `metadata` |
| `specialist_applications` | `id`, `applicant_name`, `email`, `dl_state`, `checkr_candidate_id`, `bgc_status`, `simulated` |
| `conversations` | `id`, `title`, `created_at` (Gemini AI chat sessions) |
| `messages` | `id`, `conversation_id`, `role`, `content`, `created_at` |
| `notifications` | `id`, `type`, `title`, `body`, `read`, `created_at` |
| `inspections` | `id`, `vehicle_label`, `inspector_name`, `condition_front/rear/driver/passenger/interior`, `odometer_confirmed`, `signed` |
| `watchlist` | `id`, `session_id`, `vin_masked`, `heading`, `make`, `model`, `year`, `listed_price`, `target_price` |

### Enums
- `user_role`: Member | Dealer | Runner
- `vehicle_status`: Available | Reserved | In Transit | Sold | Maintenance
- `gig_task_type`: Delivery | Inspection | Photography | Detailing | Transport | Concierge | Other
- `gig_task_status`: Open | Claimed | In Progress | Completed | Cancelled | Disputed
- `ledger_entry_type`: Referral | GigCompletion | Bonus | Clawback | Adjustment
- `ledger_entry_status`: Pending | Approved | Paid | Failed | Voided

---

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

---

## Feature Registry (Prompts 1–13)

| Prompt | Feature | Status | Key Files |
|--------|---------|--------|-----------|
| 1-9 | Core platform (marketplace, garage, logistics, delivery, AI concierge, MCP, inspection, watchlist, analytics) | ✅ Live | Various |
| 10 | National Wholesale Engine (MarketCheck, Guardian Health Score, 3C Club Price, SAVE badges) | ✅ Live | `routes/marketcheck.ts`, `pages/marketplace.tsx` |
| 11 | SOC2 Audit Vault, CI/CD, AI Hub (Gumloop, Browserbase), Finance Hub (Plaid), Insurance (Insuremo), Vehicle History (Motor.com) | ✅ Live | Various routes |
| 12 | Dynasty Wallet (KYC/AML via Stripe Identity, Triple-Split: 85%/2.5%/20% referrer, passive income polling) | ✅ Live | `routes/dynasty.ts`, `pages/wallet.tsx`, `pages/referral-wallet.tsx` |
| 13 | Dropship Coordinator (Ship.cars + RunBuggy bridge, Digital BOL + SHA-256 tamper seal + QR, 360° scan viewer, AR Preview via WebRTC camera + CSS 3D, mobile Runner scanner) | ✅ Live | `routes/dropship.ts`, `pages/dropship.tsx`, mobile `app/scanner.tsx` |
| 14 | NIST-MCP 2026 Security Layer (AES-256-GCM encryption, PII masking, Transient Agent Tokens 15-min TTL, Immutable Agent Audit Trail hash chain, Decision Transparency ledger) | ✅ Live | `lib/cipher.ts`, `routes/security.ts`, `pages/security.tsx` |
| 15 | Founder's Command Center (Live K-Factor sparkline, Member Slices telemetry, Active Missions mesh, Kill-Switch override queue, National Mesh stats, System alerts, Mobile Expo tab) | ✅ Live | `routes/command.ts`, `pages/command.tsx`, mobile `app/(tabs)/command.tsx` |
| 16 | Dynasty Final Orchestration — Triple-Threat AI (Guardian V2X Predictive Layer, 7-Agent Mesh with Gemini+MarketCheck+Stripe, $99/mo Revenue Gate, Hectocorn Stress Test Ticker, Subscription paywall with Founding Member access) | ✅ Live | `routes/guardian.ts`, `routes/subscription.ts`, `pages/guardian.tsx`, `pages/subscription.tsx`, `command.tsx` Hectocorn tab |

### Dropship Coordinator (Prompt 13) Architecture
- **Backend** (`routes/dropship.ts`): 7 endpoints — carriers, claim, BOL fetch, shipments, status update, scan submit (per-position), scan retrieve. SHA-256 tamper hash generated at BOL creation. Scan sessions auto-created on claim.
- **Web** (`pages/dropship.tsx`): Stats bar, carrier status rail (Ship.cars LIVE / RunBuggy LIVE / uShip offline), BOL cards with View BOL / 360° Scan / AR Preview actions. Digital BOL modal: SHA-256 seal, QR code (SVG), digital signatures, tamper watermark. 360° Scan viewer: 8-position carousel with auto-spin, sidebar thumbnails, angle labels. AR Preview: getUserMedia camera + CSS 3D car overlay + ground shadow + drag-to-rotate, "Place Car in Driveway" scan animation.
- **Mobile** (`app/scanner.tsx`): Runner 360° capture UX — radar dial with 8 position dots, shutter animation, flash effect, position chips, auto-advance, submit → SHA-256 hash success screen.
