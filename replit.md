# Overview

3C Onyx is a luxury dark-mode Automotive Ecosystem OS developed by CUXTOMCANDYCLUB LLC (Ronald Antonio Cadet, Founder/CVO). It serves as the Unified Automotive Command Layer (UACL) — a sovereign infrastructure platform that replaces the fragmented legacy stack (VinSolutions, Dealertrack, RouteOne, Stellantis fax workflows) with one intelligent, monetized operating system. The Genesis Protocol (v1.0) is the production-hardened final state.

Key capabilities include:
- **Alibaba ICBU Dropshipping Integration**: Full Node.js Alibaba Open Platform integration with IOP SDK signing, OAuth 2.0, product import pipeline, PostgreSQL storage, and Express API.
- **Ground-Up Worker Enhancement Layer**: Provides unified earnings dashboards, leaderboards, and a recommendation engine for various worker roles.
- **ONYX Impact — Member Value Intelligence System**: Visualizes total member value (savings, earnings, referrals) to drive engagement.
- **Dynasty Protocol**: Features Pay-at-the-Bay QR payment generation, VIN Digital Passport with NHTSA decode and AI summary, and a Smart Bay Traffic Dashboard.
- **User Accounts, Push Notifications, and Subscription Billing**: Implements persistent user accounts, push notifications via Expo, and a 5-tier subscription upgrade screen integrated with Stripe.
- **Automotive Ecosystem Layer**: Integrates with HONK Roadside Assistance, CarCrawler Car Rentals, and Google Maps Places for a comprehensive service directory.
- **Decision Engine**: A rule-based, deterministic scoring system for vehicles, shops, and fraud detection, independent of LLMs.
- **VC Red-Flag Resolutions**: Addresses critical concerns like blockchain for vehicle data integrity, enhanced vehicle data sourcing, traction funnel optimization, and robust security measures.
- **Core Platform Features**: Includes an AI-enriched Marketplace/National Wholesale Engine, Watchlist, My Garage (Smartcar telematics), Logistics (HyperTrack), Inspections, Member Wallet (Stripe Connect), an AI Concierge, Specialist Onboarding/Dashboard (Checkr integration), and a SOC2 Audit Vault.

The project aims to establish a complete automotive intelligence layer, offering advanced personalization and a robust platform for both consumers and automotive professionals.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project is structured as a pnpm workspace monorepo using Node.js 24 and TypeScript 5. The API is built with Express 5, PostgreSQL, and Drizzle ORM, with Zod for validation. API codegen leverages Orval from an OpenAPI spec to generate React Query hooks and Zod schemas. `esbuild` is used for CJS bundling.

## API Server

The Express 5 API server integrates `@workspace/api-zod` for validation and `@workspace/db` for database interactions. It incorporates production hardening measures such as CORS, request timeouts, a global error handler, 404 handler, health probes, and a 2 MB body limit.

## AWS Deployment Architecture

The system is designed for AWS, utilizing Route 53, CloudFront, S3 for static hosting, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16. Container images are lightweight due to `esbuild`. The architecture is designed to be stack-agnostic for key services and supports zero-downtime deployments via ECS rolling updates. A separate AWS CDK blueprint (`/infra`) defines the production deployment across various stacks (Foundation, Security, Data, Intelligence, Compute, Workflows, API, Monitoring).

## Frontend Resilience

The frontend implements a React Error Boundary for crash recovery and configures React Query with retries and caching for robust data fetching.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a dual-theme system:
- **Dark Mode (Default)**: Deep black, gold, and neon accents.
- **Light Mode**: Warm ivory (#F8F4ED) palette.
Typography uses Barlow Condensed for headings and Inter for body text. Key design elements include a "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber-accented page headers, and translucent glassmorphism for stat cards. A custom AI-Native Design System (CSS) provides futuristic components like holographic cards, neural glow effects, and dynamic animations. The `next-themes` library manages theme switching with CSS variables for dynamic styling.

## Core Platform Features

The platform's architectural decisions prioritize an AI-first approach with:
- **Enterprise AI Stack v4.0**: `ai-router.ts` — OpenAI primary (GPT-4o/mini/nano), Gemini/Bedrock/Anthropic fallback chain. Task types: conversation, analysis, summarization, coding, quick, vision (OpenAI-only), critique. Critique & Review loop validates all responses. Vision endpoint for multi-modal image analysis (VIN, damage, window stickers).
- **WebSocket Real-Time Hub**: `wsHub.ts` for real-time communication across five distinct rooms.
- **Agent Orchestration Engine**: `agentOrchestrator.ts` — 12-agent UACL mesh with state machine (pending→assigned→running→complete/handed_off).
- **Blockchain Chain-of-Custody**: `chainOfCustody.ts` ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose` library, supporting registration, login, token refresh, and logout. Includes `requireAuth` and `requireRole` middleware for access control. Passwords are bcrypt-hashed (cost factor 12).
- **Security Middleware**: Helmet for security headers, `express-rate-limit` for API rate limiting, cookie parser support, trust proxy configuration, and secure Stripe webhook handling.
- **Database Layer**: `@workspace/db` package utilizing Drizzle ORM with PostgreSQL, including Drizzle Kit for migrations. All tables are SOC2 audit-trail compliant with `created_at` and `updated_at` timestamps.
- **API Specification and Code Generation**: `@workspace/api-spec` manages OpenAPI 3.1 specification and Orval configuration for type-safe API interactions.

## Sovereign Infrastructure Layer (UACL)

**Unified Automotive Command Layer** — every request passes through S1 (Classify/Authenticate), S2 (Execute/Verify, AES-256-GCM FIPS 140-3), S3 (Log/Audit, CJIS-grade EventBridge). PAT-07.

**12-Intent Neural Classifier** — warranty, broker, funding, referral, vehicle, logistics, search, service, node, timeline, ecosystem, monetization. All live DB execution. No mock data.

**Genesis Protocol** — `/api/genesis/manifest` (full sovereign system declaration), `/api/genesis/pulse` (real-time heartbeat — agent mesh health, DB, infra), `/api/genesis/agents` (individual agent status). Every response carries 14 sovereignty headers including `X-Platform-Class: Automotive-Ecosystem-OS`, `X-Protocol-Version: Genesis-1.0`, `X-Agent-Mesh: 12-Agent-UACL`, `X-Encryption: AES-256-GCM-FIPS-140-3`.

**Transporter Agent (PAT-08)** — Interstate vehicle logistics engine. Haversine routing, 5-carrier Verified Provider Mesh (Enclosed Elite for luxury/BMW), 12-state title/registration compliance DB, best interstate path builder, 3% Dynasty Logistics Fee. DB: `shipment_orders`. Routes: `POST /api/transport/quote`, `POST /api/transport/:id/confirm`, `PUT /api/transport/:id/status`, `GET /api/transport/active`, `GET /api/transport/:id`.

**AWS SDK Integration** — `@aws-sdk/client-bedrock-runtime` (Claude 3 Haiku/Sonnet via Bedrock-first AI router), `@aws-sdk/client-secrets-manager` (secret abstraction, prod/dev fallback), `@aws-sdk/client-eventbridge` (live in EventBus), `@aws-sdk/client-rekognition` (vehicle inspection), `@aws-sdk/client-location` (runner GPS), `@opensearch-project/opensearch` (vehicle search, fallback to Postgres).

**Dealer DMS Connectors (Oracle OIC)** — `dealerConnectors.ts` covers CDK Global, Reynolds & Reynolds, DealerSocket, Dealertrack. Inventory sync, lead submission, service booking, Dynasty Fee split config.

**Fraud Scoring Middleware** — rule-based engine + AWS Fraud Detector hook. Scores 0-100 on every registration and payment. CRIT (80+) = block.

## DealerFlow OS — Industry Professional Integration Layer

**DealerFlow OS** is the Unified Integration Layer for automotive industry professionals (dealerships, fleet managers, service centers). It does NOT replace existing dealership software (AutoMate, Mopar, DealerCONNECT) — it acts as the "Intelligent Connective Tissue" (UACL) that automates the gaps between people, systems, and documents.

- **Smart Routing Engine** (`smart-router.ts`): Keyword-based auto-classification routes incoming tasks to the correct department (DMV, Parts, Service, Finance, Logistics, Sales, Customer Service) and assigns the appropriate UACL agent (Guardian, Source, Finance, Logistics, Concierge). Includes VIN extraction and part number detection.
- **DealerFlow Task Engine**: PostgreSQL-backed task management with SLA timers, priority levels, department routing, and status tracking. Every action is visible on the live operations dashboard.
- **Universal Intake Gateway**: Document scanning intake (invoices, DMV forms, titles, Mopar sheets, warranty claims) with smart routing — paste text/OCR output and the system extracts VINs, customer names, part numbers, then auto-creates routed tasks.
- **Customer Ticket Inbox**: Unified customer communication hub with auto-responses, channel tracking (SMS, Email, Phone, Walk-In, App, WhatsApp), and category-based routing.
- **DB Tables**: `dealerflow_tasks`, `document_scans`, `customer_tickets` with full indexing.
- **API Routes**: `/api/dealerflow/tasks`, `/api/dealerflow/intake`, `/api/dealerflow/tickets`, `/api/dealerflow/dashboard`, `/api/dealerflow/route`.
- **Web Dashboard**: `dealerflow.tsx` — Card-based operations dashboard with Command Center (stats), Task Board (filterable), Scan & Route (intake), and Customer Inbox tabs.

## Architectural Upgrades

Recent architectural enhancements include CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API for platform management, and a robust Beta Waitlist system.

# External Dependencies

-   **Monorepo Tool**: pnpm workspaces
-   **API Framework**: Express 5
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Validation**: Zod, `drizzle-zod`
-   **API Codegen**: Orval
-   **Build Tool**: esbuild
-   **Cloud/Deployment**: Replit, AWS
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
-   **AI/LLM**: Multi-model abstraction (Gemini, OpenAI, Anthropic)
-   **Charts**: Recharts
-   **Real-time Communication**: WebSocket Hub, Server-Sent Events (SSE)
-   **Model Context Protocol**: `@modelcontextprotocol/sdk`
-   **Carrier Integration**: Ship.cars, RunBuggy, Enclosed Elite, Montway, AmeriFreight, uShip (Transporter Agent Verified Provider Mesh)
-   **Identity Verification**: Stripe Identity
-   **Data Intelligence**: Fullpath
-   **Vehicle Market Data**: MarketCheck
-   **Push Notifications**: Expo (for mobile)