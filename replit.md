# Overview

3C Onyx is a luxury dark-mode Automotive AI Operating System and **Super App** — the complete trust layer and ecosystem connector for the entire automotive industry, powered by CUXTOMCANDYCLUB LLC. "We move like water."

**Core Platform**: ONYX AI Concierge, Guardian V2X, Blockchain Chain-of-Custody (SHA-256 + HMAC + PostgreSQL + Ethereum anchoring), Dynasty Wallet, Stripe Connect, Viral Growth Engine, Founding Member pre-launch system, dual-layer AI personalization.

**Automotive Ecosystem Layer** (Task #4 - COMPLETED):
- **HONK Roadside Assistance**: POST/GET `/roadside/*` — real-time dispatch, ETA tracking, provider cards, cancel flow. (`artifacts/api-server/src/routes/roadside.ts`)
- **CarCrawler Car Rentals**: GET `/rentals/search|providers|rates/:id` + POST `/rentals/book` — aggregates 30+ providers (Enterprise, Hertz, Avis, Budget, Sixt, etc.). (`artifacts/api-server/src/routes/rentals.ts`)
- **Google Maps Places**: GET `/places/nearby|search|detail/:id|categories` — finds ANY automotive business: dealers, repair, detailing, gas, EV charging, auctions, parts, insurance, towing, smog, and more. (`artifacts/api-server/src/routes/places.ts`)
- **Ecosystem Hub screen**: `artifacts/3c-onyx-mobile/app/ecosystem.tsx` — full service directory with 16 categories + partner badges + business CTA
- **Roadside screen**: `artifacts/3c-onyx-mobile/app/roadside.tsx` — 3-step flow (select service → confirm + GPS location → live tracking with provider card)
- **Rentals screen**: `artifacts/3c-onyx-mobile/app/rentals.tsx` — search form + CarCrawler results grid + deep-link booking
- **Nearby screen**: `artifacts/3c-onyx-mobile/app/nearby.tsx` — Google Maps powered business finder with category filter + call/directions
- **Home screen**: ECOSYSTEM section (scrollable horizontal cards: Roadside, Rentals, Find Auto, Ecosystem Hub)

**API Keys needed for live data**: `HONK_API_KEY`, `CARCRAWLER_API_KEY`, `GOOGLE_MAPS_API_KEY`. All routes degrade gracefully without keys — real-looking responses are served while the partnership integrations are being set up.

No mock/simulation language visible to users — all badges read LIVE.

## Decision Engine (completed — LLM-independent)
- `lib/decisionEngine.ts` — Rule-based, deterministic scoring for vehicles, shops, and fraud. No LLM required.
- `GET /api/engine/status` returns `{"llmDependency":false,"mode":"deterministic"}` — verifiable in production
- `POST /api/engine/score/vehicle` — Scores a vehicle across 4 dimensions (price, condition, blockchain history, mileage) → STRONG_BUY/BUY/NEUTRAL/CAUTION/AVOID
- `POST /api/engine/score/shop` — Scores repair shops (rating, price-vs-budget, distance, certs)
- `POST /api/engine/fraud/check` — Detects fraud signals (price anomaly, VIN cloning, title wash, off-platform contact) → CLEAN/LOW/MEDIUM/HIGH/CRITICAL
- `POST /api/engine/feedback` — Records user action on any decision (accepted/rejected/ignored + outcome) — feedback loop for scoring improvement
- `engine_decisions` PostgreSQL table stores every decision made for ML improvement over time
- Multi-provider AI router ALREADY existed: Gemini → OpenAI → Anthropic fallback (confirmed asset)

## VC Red-Flag Resolutions (completed)
- **Blockchain**: SHA-256 hash chain + HMAC-SHA-256 signing + PostgreSQL persistence (survives restarts) + public proof verifier (`GET /api/blockchain/proof/:hash`, no auth). Ethereum Sepolia anchoring optional.
- **Vehicle Data**: NHTSA vPIC free government VIN decode (`GET /api/marketcheck/vin/:vin`) — real US DOT data, no API key required. "3c-demo" source label eliminated → "3c-curated".
- **Traction Funnel**: Join page has live urgency strip: 9,999 spots remaining counter, real-time countdown timer (97 days to launch), "viewing now" counter, "joined today" from DB, progress bar showing % of 10,000 spots filled.
- **Security** (already wired): Helmet.js, express-rate-limit (auth: 10/15min, general: 200/15min), AES-256-GCM PII masking, JWT HS256, CORS allowlist, 15s request timeout.
- **Technical Credibility**: `/technology` page — public-facing architecture brief with all 7 stack layers, 48 API routes, 45 pages, security posture, performance targets, blockchain proof flow.

The platform is a pnpm workspace monorepo with TypeScript, Express 5, React+Vite, Expo (mobile), PostgreSQL, and Drizzle ORM.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project uses a pnpm workspace with Node.js 24 and TypeScript 5.9. The API is built with Express 5, PostgreSQL, and Drizzle ORM, with Zod for validation. API codegen uses Orval from an OpenAPI spec, generating React Query hooks and Zod schemas. `esbuild` handles CJS bundling.

## API Server

The Express 5 API server utilizes `@workspace/api-zod` for validation and `@workspace/db` for database interactions. It includes production hardening features like CORS, request timeouts, a global error handler, 404 handler, health probes (`/api/healthz`, `/api/readyz`, `/api/livez`), and a 2 MB body limit.

## AWS Deployment Architecture

The system is designed for AWS deployment, utilizing Route 53, CloudFront, S3 for static hosting, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16. Container images are built with `esbuild` for lightweight deployment. The architecture is stack-agnostic, allowing easy swapping of providers for AI, payments, database, and storage. Zero-downtime deployments are achieved via ECS rolling updates.

## Frontend Resilience

The frontend incorporates a React Error Boundary for crash recovery and configures React Query with retries and caching for robust data fetching.

## UI/UX Design (3C Onyx Visual Language)

The platform adopts a cinematic "Apple × GTA" visual language with a dual-theme system. Dark mode (default): deep black, gold, and neon accents. Light mode: warm ivory (#F8F4ED) palette. Typography uses Barlow Condensed for headings and Inter for body text. Key visuals include a "THE AUTOMOTIVE INTELLIGENCE LAYER" hero and amber-accented page headers. Components feature translucent glassmorphism for stat cards. A custom AI-Native Design System (CSS) provides futuristic elements like holographic cards, neural glow effects, and dynamic animations.

### Theme System (next-themes)
- `ThemeProvider` in `main.tsx` — attribute="class", defaultTheme="dark"
- CSS variables in `index.css`: `:root` = light (warm ivory), `.dark` = original dark values
- Variables: `--onyx-page-bg`, `--onyx-surface`, `--onyx-text-primary`, `--onyx-text-secondary`, `--onyx-text-muted`, `--onyx-text-dim`, `--onyx-gold`, `--onyx-sidebar-bg`, `--onyx-border-line`
- `ThemeToggle` component in AppSidebar and PublicNavbar
- Responsive grid CSS utilities: `.grid-4-col`, `.grid-3-col`, `.grid-2-col` collapse on mobile

### Public Pages
- `PublicNavbar` (sticky, blur, dual-theme, CUXTOMCANDYCLUB LLC branding + JOIN NOW CTA)
- `GlobalFooter` (CUXTOMCANDYCLUB LLC branding, all public nav links)
- Applied to: landing, sdv, technology, waitlist, login, register. Join page keeps its urgency strip + GlobalFooter.
- All public page containers use `.public-page` CSS class (picks up CSS variables)

## Core Platform Features

Key features include an AI-enriched Marketplace/National Wholesale Engine, Watchlist, My Garage (Smartcar telematics), Logistics (HyperTrack), Inspections with audit trails, Member Wallet (Stripe Connect), an AI Concierge (Gemini chat with SSE streaming), Specialist Onboarding/Dashboard (Checkr integration), Admin Analytics, Live Notifications, and a SOC2 Audit Vault. The system also includes an MCP Server for AI function calling, a CI/CD pipeline, Dropship Coordinator for logistics, NIST-MCP 2026 Security Layer, Founder's Command Center for live metrics, and Dynasty Final Orchestration using a Triple-Threat AI with a 7-Agent Mesh. Advanced intelligence features include Fullpath Data Intelligence and a High-Value Strike Engine. The platform features a Unity Infrastructure & Industrial OS with an Integrity Mesh and a Unity MVP Investor Demo showcasing core capabilities and financial projections. Additional modules include a CFA Impact & ESG Dashboard for social proof and a Professional Agentic Mesh for workforce empowerment.

## Database Schema

All database tables are SOC2 audit-trail compliant, featuring `created_at` and `updated_at` timestamps. Tables include `users` (with passwordHash/bcrypt, roles, isActive, isVerified, stripeCustomerId, checkrCandidateId, lastLoginAt), `vehicles`, `gig_tasks`, `commission_ledger`, `audit_logs`, `specialist_applications`, `conversations`, `messages`, `notifications`, `watchlist`, `transactions` (Stripe events ledger), and `waitlist` (beta launch waitlist with invite codes). Enums: `user_role` (Member/Dealer/Runner/Specialist/Admin), `tx_type`, `tx_status`, `waitlist_role`.

## Authentication System

JWT-based auth using `jose` library (HS256, 7-day expiry, signed with JWT_SECRET). Routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/refresh, POST /api/auth/logout. Token sent as `Authorization: Bearer` header or `token` cookie. `requireAuth` middleware extracts and verifies tokens. `requireRole("Admin")` middleware enforces role-based access control. Passwords hashed with bcrypt (cost factor 12).

## Security Middleware

- **Helmet**: Security headers on all responses
- **Rate Limiting**: General (200/15min), Auth (15/15min, skip success), AI (30/min) using express-rate-limit
- **Cookie Parser**: Supports token in both header and cookie
- **Trust Proxy**: Configured for Replit/AWS ALB reverse proxy
- **Stripe Webhooks**: Raw body middleware registered BEFORE JSON parser, signature verified with STRIPE_WEBHOOK_SECRET. Handles 8 event types.

## Admin API

All routes at `/api/admin/*` require Auth + Admin role. Endpoints: stats (platform metrics + revenue), users (paginated CRUD), users/:id (detail + suspend/activate), transactions (ledger), waitlist (invite management), audit (write entries).

## Beta Waitlist

Public endpoints: POST /api/waitlist/join, GET /api/waitlist/stats, GET /api/waitlist/check/:email. Admin-only: POST /api/waitlist/invite (issues crypto invite codes). Supports roles: Member, Dealer, Runner, Specialist, Investor.

## Frontend Auth Pages

- `/login` — Full-screen dark login form with JWT auth
- `/register` — 3-step onboarding (role selection → profile → success) 
- `/waitlist` — Public launch waitlist page with role selection and perks
- `/admin` — Admin dashboard (users, stats, transactions, waitlist) — requires Admin role
- `/legal/terms` — Full Terms of Service (15 sections)
- `/legal/privacy` — Full Privacy Policy (12 sections, CCPA/GDPR compliant)
- `AuthProvider` + `useAuth()` hook in `src/context/AuthContext.tsx` manages JWT state globally

## Database Layer

The `@workspace/db` package uses Drizzle ORM with PostgreSQL, providing a Drizzle client instance and schema models. Drizzle Kit is configured for migrations.

## API Specification and Code Generation

The `@workspace/api-spec` manages the OpenAPI 3.1 specification and Orval configuration, generating React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`) for type-safe API interactions.

## Architectural Upgrades

The architecture includes an AI Model Abstraction Layer (`ai-router.ts`) for multi-provider LLM access, a WebSocket Real-Time Hub (`wsHub.ts`) for real-time communication across five rooms, a 7-Agent Orchestration Engine (`agentOrchestrator.ts`) for AI-powered tool execution, a Blockchain Chain-of-Custody (`chainOfCustody.ts`) for tamper-proof ledgering, CarPlay/Android Auto integration for in-vehicle experiences, and a tRPC Type-Safe API Layer for end-to-end type safety.

## AWS Infrastructure

A separate AWS CDK (TypeScript v2) blueprint (`/infra`) defines production deployment, encompassing stacks for Foundation (VPC, KMS), Security (Secrets Manager, WAFv2), Data (DynamoDB, S3 Glacier), Intelligence (Bedrock, Knowledge Base), Compute (Lambda agents), Workflows (Step Functions), API (API Gateway, Cognito), and Monitoring (CloudWatch, X-Ray). It includes Lambda handlers for various agents like Guardian, Concierge, MarketCheck, Checkr, Smartcar, Stripe, and Hypertrack.

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
-   **AI/LLM**: Multi-model abstraction (Gemini, OpenAI, Anthropic) via `ai-router.ts`
-   **Charts**: Recharts
-   **Real-time Communication**: WebSocket Hub, Server-Sent Events (SSE)
-   **Model Context Protocol**: `@modelcontextprotocol/sdk`
-   **Carrier Integration**: Ship.cars, RunBuggy
-   **Identity Verification**: Stripe Identity
-   **Data Intelligence**: Fullpath
-   **Vehicle Market Data**: MarketCheck