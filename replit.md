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

## Platform Features (3C Onyx)

1. **Marketplace** — MarketCheck live luxury inventory (Rolls-Royce, Ferrari, Lamborghini etc.) with filters, Bookmark/Watch button, Concierge purchase modal
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
