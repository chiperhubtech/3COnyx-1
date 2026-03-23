# Overview

This project is a pnpm workspace monorepo utilizing TypeScript for a sophisticated platform called "3C Onyx." The platform aims to revolutionize the vehicle marketplace by integrating advanced AI, telematics, logistics, and financial services. It offers a comprehensive suite of tools for customers, dealers, and specialists, focusing on a cinematic dark-mode user experience with a "Apple × GTA" visual language. Key capabilities include an AI-enriched marketplace with dynamic pricing, a national wholesale engine, secure financial transactions, AI-powered automation, and robust auditing features. The long-term vision is to establish a "Hectocorn" company by leveraging cutting-edge technology to create a seamless and highly efficient ecosystem for vehicle transactions and related services.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project is structured as a pnpm workspace monorepo, managing multiple packages (`artifacts`, `lib`, `scripts`). It uses Node.js 24, pnpm, and TypeScript 5.9. The API is built with Express 5, utilizing PostgreSQL and Drizzle ORM for database management, and Zod for validation. API codegen is handled by Orval from an OpenAPI specification, generating React Query hooks and Zod schemas. `esbuild` is used for CJS bundling.

## TypeScript Configuration

All packages extend a base `tsconfig.json` with `composite: true`, enabling project references for cross-package type-checking and dependency resolution. `tsc --build --emitDeclarationOnly` is used for type-checking and declaration file generation, while `esbuild` handles actual JavaScript bundling.

## API Server (`@workspace/api-server`)

The core API server is an Express 5 application. Routes are organized under `src/routes/` and leverage `@workspace/api-zod` for request/response validation and `@workspace/db` for database interactions.

### Production Hardening (MVP-ready)
- **CORS**: Configurable via `ALLOWED_ORIGINS` env var (comma-separated). Leave unset for open (dev). Set to domain list in production.
- **Request timeout**: 15-second timeout on all routes via `src/middlewares/timeout.ts`. Returns 503 + JSON if exceeded.
- **Global error handler**: Catches all unhandled Express errors, returns JSON with `code: "INTERNAL_ERROR"`. Error message hidden in production.
- **404 handler**: Returns `{"error":"Not found","code":"NOT_FOUND"}` instead of HTML.
- **Health probes** (AWS ALB / ECS / K8s compatible):
  - `GET /api/healthz` — Deep check: DB + WS + metrics. Returns 200 (healthy) or 503 (DB degraded).
  - `GET /api/readyz` — Lightweight readiness probe: DB only. Used by ALB target group health checks.
  - `GET /api/livez` — Liveness probe: process alive check. Used by ECS task health checks.
- **Body limit**: 2 MB request body cap to prevent payload attacks.

### AWS Deployment Architecture
```
Internet → Route 53 → CloudFront (CDN + TLS)
                         │
              ┌──────────┴──────────────┐
              │                         │
     S3 Static Hosting              ALB (Application Load Balancer)
     (React SPA / dist/public)          │
                                   ECS Fargate (API containers)
                                        │
                                   RDS PostgreSQL 16 (Multi-AZ)
```

**Container images** (built via esbuild — fully self-contained, no node_modules in runner):
- `Dockerfile.api` → API server (~50MB Alpine image)
- `Dockerfile.web` → Nginx serving Vite SPA (~25MB Alpine image)
- `docker-compose.yml` → Local full-stack simulation of AWS environment

**Stack-agnostic design** — The backend can swap any provider without frontend downtime:
- AI: Gemini → OpenAI → Anthropic (already multi-provider via ai-router)
- Payments: Stripe Connect (swap to Braintree/Adyen via stripeClient.ts)
- Database: PostgreSQL via Drizzle ORM (swap to MySQL/Aurora by changing the adapter)
- Storage: Extend with S3 by adding `STORAGE_PROVIDER=s3` env var

**Zero-downtime deployments**: ECS rolling updates with health check gating. New tasks must pass `/api/readyz` before old tasks are terminated.

### Frontend Resilience
- **React Error Boundary** (`src/components/ErrorBoundary.tsx`): Wraps entire app and inner layout. Any render crash shows branded 3C recovery screen instead of blank page.
- **React Query config**: `retry: 2`, `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: false`. Exponential backoff on retries.

## UI/UX Design (3C Onyx Visual Language)

The platform adopts a "Apple × GTA" visual language, characterized by a cinematic dark mode with a deep black (`#0A0A0A`), gold (`#C9A227`), and neon accents.

-   **Typography**: Barlow Condensed (900/800/700/600, uppercase, 0.04em letterSpacing) for headings and Inter for body/UI text, loaded via Google Fonts.
-   **Key Visuals**: Home hero section features "YOUR FLEET, YOUR RULES." with white and gold outlined text and an ambient radial gradient. Page headers use Barlow Condensed h1 with amber-500/10 icon boxes.
-   **Components**: `AppSidebar.tsx` provides navigation, `PageHeader.tsx` is a reusable header component.
-   **Data Display**: Stat cards utilize translucent glassmorphism (`rgba(255,255,255,0.04)`) with accent-colored large numbers.
-   **AI-Native Design System (CSS)**: Global CSS classes implement futuristic elements:
    -   `.ai-card`, `.holographic-card`, `.neural-grid-overlay`, `.scan-line-overlay` for glassmorphism and animated effects.
    -   `.neural-glow-blue/green/gold/violet` for colored box-shadow glows.
    -   `.neural-badge` for blinking status indicators.
    -   `.gradient-border-card` for animated gradient borders.
    -   `.hero-mesh`, `.hero-grid`, `.neon-underline` for homepage visuals.
    -   Numerous keyframe animations for dynamic UI elements.

## Core Platform Features

-   **Marketplace / National Wholesale Engine**: Two-tab UI for inventory and wholesale. AI-enriched listings with `market_avg`, `guardian_health_score`, `club_price`, `savings_vs_retail`, and `wholesale_potential`. Features gold badges, SVG health score rings, and CTAs.
-   **Watchlist**: Vehicle tracking with target price alerts.
-   **My Garage**: Smartcar telematics integration for vehicle data.
-   **Logistics**: HyperTrack integration for live delivery tracking.
-   **Inspections & Proof of Delivery**: Multi-step forms with SHA-256 audit trails and QR digital handshake.
-   **Member Wallet**: Stripe Connect integration for commission transfers and payout history.
-   **AI Concierge**: Floating Gemini chat with garage context injection and SSE streaming.
-   **Specialist Onboarding/Dashboard**: BGC portal (Checkr integration) and performance tracking.
-   **Analytics**: Admin-only revenue dashboards with Recharts.
-   **Live Notifications**: Sidebar notification bell with polling and read management.
-   **SOC2 Audit Vault**: Admin-only, SHA-256 tamper-hashed audit logs with CSV export.
-   **MCP Server**: `@modelcontextprotocol/sdk` server exposing tools for vehicle search, garage management, notifications, gig tasks, runner booking, analytics, and inspections, utilized by the Gemini Concierge for function calling.
-   **CI/CD Pipeline**: Dashboard for monitoring and running TypeScript Check, Build API Server, and Build Web App, integrated with Replit workflows.
-   **Dropship Coordinator**: Manages vehicle transport with carrier integration, digital BOLs (SHA-256 tamper hash), 360° scan viewer, and AR preview. Mobile app for runner 360° capture.
-   **NIST-MCP 2026 Security Layer**: Implements AES-256-GCM encryption, PII masking, transient agent tokens, immutable audit trails, and decision transparency ledgers.
-   **Founder's Command Center**: Live metrics (K-Factor, Member Slices), active missions, kill-switch, national stats, alerts.
-   **Dynasty Final Orchestration**: Triple-Threat AI with Guardian V2X Predictive Layer, 7-Agent Mesh (Gemini, MarketCheck, Stripe), revenue gating, and subscription management.
-   **Fullpath Data Intelligence & High-Value Strike Engine**: Shopper Intent profiles, Inventory Velocity scoring, MarketCheck wholesale matching, autonomous High-Value Strike detection with a 7-Agent Strike Mesh.
-   **Unity Infrastructure & Industrial OS**: Two-Way Integrity Mesh for I-95 Spine directory, AI-verified reputation scores, priority routing, priority runner tiers, immutable NIST-MCP Reputation Ledger, and Guardian mesh Match Agent upgrade.
-   **Unity MVP Investor Demo**: 5-tab investor demo page (`/unity`). Tab 1: Guardian Scan (V2X wholesaler matching vs Ignorance Tax). Tab 2: Dynasty Split (animated Stripe multi-split). Tab 3: Integrity Mesh (two-way SHA-256 rating). Tab 4: Concierge (Sophisticated Architect AI persona). Tab 5: Investor Stack (Temporal.io 7-step durable workflow with live failure/recovery simulation, Magna.com tokenized cap table with founder/seed/F&F equity + live member slice pool, Modernize.io home-to-garage expansion with EV charger/solar/smart garage services). Hectocorn Ticker live at $847K+ MRR / $10.17M+ ARR / 10.17% toward $100M.
-   **CFA Impact & ESG Dashboard** (`/impact`): Mission-driven social proof layer. Ignorance Tax Tracker (live $4M+ savings counter vs retail markup, 23% tax rate eliminated), Complaints Prevented metric from Guardian, ESG Score panel (Environmental/Social/Governance with animated gauge + 3-tab switcher), Integrity Mesh Visualizer (I-95 Spine shop directory with pulsing Verified Shop blockchain badges + SHA-256 ledger hashes), systemic crisis stats (CFPB data), mission footer. Home page shows Ignorance Tax mini-strip widget. 3 backend API endpoints in `impact.ts`.
-   **Professional Agentic Mesh** (`/pro`): Workforce empowerment platform for the full automotive tech hierarchy. 4-tab UI: (1) Apprentice Mentor — step-by-step diagnostic guides with interactive checklists and AI tips, HV Safety Override requiring Foreman digital sign-off before EV battery work proceeds; (2) Foreman Command Center — Guardian alert feed, Gumloop automation (auto-parts orders, SMS, Carfax stamps), Bay Queue; (3) OEM Intelligence Feed — I-95 corridor failure heatmap with heat bars, trending failure analysis, soft recall candidates; (4) Skill Token Ledger — blockchain credential leaderboard (Apprentice→Master Tech), recent token events. 4 backend API endpoints in `pro.ts`.

## Database Schema

All database tables are SOC2 audit-trail compliant, including `created_at` and `updated_at` timestamps.

-   **Tables**: `users`, `vehicles`, `gig_tasks`, `commission_ledger`, `audit_logs`, `specialist_applications`, `conversations`, `messages`, `notifications`, `inspections`, `watchlist`.
-   **Enums**: `user_role`, `vehicle_status`, `gig_task_type`, `gig_task_status`, `ledger_entry_type`, `ledger_entry_status`.

## Database Layer (`@workspace/db`)

Utilizes Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models. Drizzle Kit is configured for migrations.

## API Specification and Code Generation (`@workspace/api-spec`)

Manages the OpenAPI 3.1 specification (`openapi.yaml`) and Orval configuration (`orval.config.ts`), generating:

-   `@workspace/api-client-react`: React Query hooks and fetch client.
-   `@workspace/api-zod`: Zod schemas for validation.

# External Dependencies

-   **Monorepo Tool**: pnpm workspaces
-   **API Framework**: Express 5
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Validation**: Zod, `drizzle-zod`
-   **API Codegen**: Orval
-   **Build Tool**: esbuild
-   **Cloud/Deployment**: Replit
-   **Fonts**: Google Fonts (Barlow Condensed, Inter)
-   **Financial Linking**: Plaid
-   **Insurance Quotes**: Insuremo
-   **Vehicle History**: Motor.com
-   **Remote Browser Automation**: Browserbase
-   **AI Workflow Engine**: Gumloop
-   **Telematics**: Smartcar
-   **Logistics Tracking**: HyperTrack
-   **Payments/Payouts**: Stripe Connect
-   **Background Checks**: Checkr
-   **AI/LLM**: Multi-model abstraction (Gemini primary, OpenAI secondary, Anthropic tertiary) via `ai-router.ts`; task-type routing (conversation/analysis/summarization/coding/quick)
-   **Charts**: Recharts
-   **Real-time Communication**: WebSocket Hub (`wsHub.ts`) — rooms: tracking, alerts, prices, agents, notify; frontend hook `useSocket.ts`; Server-Sent Events (SSE) for legacy routes
-   **Model Context Protocol**: `@modelcontextprotocol/sdk`
-   **Carrier Integration**: Ship.cars, RunBuggy
-   **Identity Verification**: Stripe Identity (for Dynasty Wallet)
-   **Data Intelligence**: Fullpath (mocked API integration)
-   **Vehicle Market Data**: MarketCheck (mocked API integration)

## Architectural Upgrades (T001–T006)

Six major architectural components added to the platform:

### T001 · AI Model Abstraction Layer
- File: `artifacts/api-server/src/lib/ai-router.ts`
- 3 providers with fallback chain: Gemini → OpenAI → Anthropic
- Task-type routing: conversation, analysis, summarization, coding, quick
- Status endpoint: `GET /api/ai-router/status`

### T002 · WebSocket Real-Time Hub
- File: `artifacts/api-server/src/lib/wsHub.ts`
- 5 subscription rooms: tracking, alerts, prices, agents, notify
- Auto-reconnect, stale-connection eviction, heartbeat ping
- Mounted at `/ws` on the HTTP server (index.ts uses `http.createServer`)
- Frontend hook: `artifacts/3c-onyx/src/hooks/useSocket.ts`
- Stats endpoint: `GET /api/ws-stats`

### T003 · 7-Agent Orchestration Engine
- File: `artifacts/api-server/src/lib/agentOrchestrator.ts`
- Named agents: Guardian, Concierge, MarketCheck, Mission, Vault, Stripe, Notify
- Formal state machine: pending → assigned → running → complete | failed | handed_off
- AI-powered tool execution with handoff protocol and full audit log
- Endpoints under `/api/orchestrator/*`

### T004 · Blockchain Chain-of-Custody
- File: `artifacts/api-server/src/lib/chainOfCustody.ts`
- SHA-256 hash-linked ledger; each block chains the previous hash
- Optional Ethereum Sepolia anchoring (when `ETH_PRIVATE_KEY` env var is set)
- Demo chains seeded for veh-001 (Rolls-Royce Ghost) and veh-002 (Ferrari Roma)
- Chain integrity badge: `INTEGRITY_INTACT` | `TAMPERED`
- UI page: `/custody` — full visual chain explorer with masked PII
- Endpoints under `/api/blockchain/*`

### T005 · CarPlay / Android Auto
- File: `artifacts/3c-onyx-mobile/app/(tabs)/carplay.tsx`
- 4 scenes: Garage, Delivery, Guardian Alerts, Emergency Dispatch
- Platform-aware: iOS (CarPlay) vs Android (Android Auto)
- Requires native Xcode/Android Studio build; gracefully documented in UI
- Added as "In-Vehicle" tab in mobile navigation

### T006 · tRPC Type-Safe API Layer
- Server: `artifacts/api-server/src/lib/trpc.ts` — 6 sub-routers (vehicle, wallet, tasks, ai, blockchain, agent)
- Client: `artifacts/3c-onyx/src/lib/trpc.ts` — self-contained, no cross-package type import
- Mounted at `POST/GET /api/trpc` via Express adapter
- tRPC endpoint verified: `tasks.stats` returns `{total:96, completed:84, completionRate:88}`

## AWS Infrastructure (`/infra`)

A complete AWS CDK (TypeScript v2) deployment blueprint lives in `/infra`. It is standalone (not part of the pnpm workspace) and targets production deployment on a corporate AWS account (EIN-linked).

### Stacks (deploy order)
| Stack | Key Services |
|---|---|
| `3C-Foundation` | VPC (3 AZ, 2 NAT GW), KMS CMK, VPC Endpoints (DynamoDB, Bedrock, Secrets Manager) |
| `3C-Security` | Secrets Manager (9 API secrets), WAFv2 OWASP, Shield Standard, IAM permission boundary |
| `3C-Data` | 6 DynamoDB tables (ReputationLedger, VehiclePassports, DynastyWallet, AuditVault, AgentTaskQueue, Subscriptions) + S3 Glacier WORM |
| `3C-Intelligence` | Bedrock model access (claude-3-5-sonnet, claude-3-haiku, nova-pro), Knowledge Base S3 bucket |
| `3C-Compute` | 7 Lambda agents (ARM64 Graviton2) + 3 router Lambdas + EventBridge bus |
| `3C-Workflows` | 3 Step Functions state machines (RepairWorkflow, PurchaseWorkflow, SubscriptionWorkflow) |
| `3C-Api` | API Gateway v2 HTTP, Cognito User Pool (MFA), WAF association, 20+ routes |
| `3C-Monitoring` | CloudWatch dashboard, 6 alarms, X-Ray, SNS ops alerts |

### One-command deploy
```bash
cd infra && npm install
npx cdk deploy --all --require-approval never --profile 3c-corp
```

### Agent Lambda handlers (in `infra/lib/lambda/agents/`)
- `guardian/` — V2X threat detection, DVP stamping, Bedrock haiku
- `concierge/` — Bedrock claude-3-5-sonnet streaming NLP, Browserbase parts search
- `marketcheck/` — Live wholesale/retail pricing + Bedrock nova-pro analysis
- `checkr/` — BGC initiation, KYC/AML, Cognito post-confirmation trigger
- `smartcar/` — Connected vehicle telemetry + remote lock/unlock
- `stripe/` — Dynasty triple-split (85/13/2), subscriptions, Stripe Connect wallet
- `hypertrack/` — Technician dispatch, ETA computation, delivery tracking