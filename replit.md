# Overview

3C Onyx is the Global Automotive Liquidity Network, aiming to decentralize the dealership experience by transforming every gas station, mechanic bay, and smartphone into a high-conversion point-of-sale. It replaces fragmented legacy systems with a Unified Automotive Command Layer (UACL), an intelligent, monetized operating system. The project's vision is to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for consumers and professionals, with significant market potential for monetized services. Key capabilities include dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and an AI-enriched marketplace.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

**DON'T CHANGE — ONLY UPGRADE.** Never replace, rename, remove, or rewrite existing pages, routes, brand names, copy, components, or features. Only add to them or extend them. The cathedral is sacred — every brick stays. New work goes alongside, never on top of. This applies to: brand (3C ONYX stays), domains (3conyx.ai stays), stack (Node/TypeScript/tRPC/Drizzle stays), all existing pages and routes, all manifesto copy, all integrations already wired. If something genuinely needs improvement, ADD a better version next to the existing one — don't overwrite. Ask before any deletion of any kind.

# System Architecture

The project uses a pnpm workspace monorepo with Node.js 24 and TypeScript 5, leveraging Express 5, PostgreSQL with Drizzle ORM, and Zod for validation. It is designed for AWS deployment, utilizing Route 53, CloudFront, S3, ALB, ECS Fargate, and RDS PostgreSQL 16.

The UI/UX adopts a "Apple × GTA" cinematic visual language with a multi-theme system, Barlow Condensed and Inter typography, amber accents, glassmorphism, and a custom AI-Native Design System with futuristic components. It prioritizes a mobile-first, Zero-Thought Assistant-First approach with a "Google Search Bar" pivot for a consumer-first assistant experience.

The core architecture is AI-first, featuring an Enterprise AI Stack v4.0 with multi-model routing, a WebSocket Real-Time Hub, and an Agent Orchestration Engine powering a 12-agent UACL mesh. It includes a Blockchain Chain-of-Custody for tamper-proof ledgering, a JWT-based authentication system with WebAuthn and OAuth, and a Fortress Governor for AI safety with a three-tier confidence classification.

The system is designed for AWS, leveraging Route 53, CloudFront, S3, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16 for lightweight containers and zero-downtime deployments.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a multi-theme system (dark default, warm ivory light mode, seasonal themes). Typography uses Barlow Condensed for headings and Inter for body text. Design elements include an "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber accents, translucent glassmorphism, and a custom AI-Native Design System with futuristic components and dynamic animations. The UI incorporates a "Google Search Bar" pivot for a consumer-first assistant experience and is designed with a mobile-first, Zero-Thought Assistant-First approach.

## Core Platform Features

The architecture is AI-first, encompassing:

-   **Enterprise AI Stack v4.0**: An AI router using OpenAI primarily, with Gemini, Bedrock, and Anthropic fallbacks.
-   **WebSocket Real-Time Hub**: Provides real-time communication across distinct rooms.
-   **Agent Orchestration Engine**: A 12-agent UACL mesh with a state machine.
-   **Blockchain Chain-of-Custody**: Ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
-   **Authentication System**: JWT-based (HS256) with `jose`, supporting full authentication flows, role-based access control, bcrypt-hashed passwords, WebAuthn biometric authentication (Face ID/fingerprint), and social OAuth login (Google, Apple).
-   **Fortress Governor (AI Safety & Control Layer)**: A three-tier confidence classification system for AI decisions (AUTO_EXECUTE, SUGGEST, HALT) with an Explainability Layer.
-   **Security Middleware**: Uses Helmet for security headers, `express-rate-limit` for API rate limiting, and secure Stripe webhook handling.
-   **Database Layer**: Drizzle ORM with PostgreSQL (optimized connection pool), ensuring all tables are SOC2 audit-trail compliance.
-   **API Performance Stack (ByteByteGo 5)**: Implements standardized pagination, async logging, TTL in-memory caching, gzip/brotli compression, and tuned connection pools.
-   **Sovereign Infrastructure Layer (UACL)**: Ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages, including a 12-Intent Neural Classifier and the Genesis Protocol.
-   **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals, featuring a Smart Routing Engine, SLA Auto-Escalation, Bank-Ready Vault, AI Vision OCR Intake, Dependency-Aware DAG Execution, and Zero-Trust Delegation Architecture.
-   **Deal Command Center**: Single-screen autonomous deal pipeline replacing the entire dealership workflow, featuring a Text-to-Deal parser, Mobile Desking calculator, One-Tap Insurance binding, cryptographic Deal Verify timeline, Live Deal Thread, and 6-button command grid, with a spatial UI.
-   **ONYX AI Mode**: Google AI Mode-style conversational automotive intelligence interface with a full-page cinematic spatial UI, suggested prompts, 12-agent mesh routing, multi-turn conversation with session persistence, formatted responses, related topics chips, SHA-256 proof hashes, and typing indicators.
-   **Auto Pulse**: Perplexity-style automotive intelligence feed aggregating real-time content from Google News RSS, Reddit, NHTSA API, and automotive publications.
-   **Vehicle Customization Hub**: Full-service vehicle customization platform with fleet mode, volume pricing, instant quotes, and a product selection builder.
-   **Autonomous Execution Protocol**: AI confidence scoring per task with auto-escalation and a retry mechanism.
-   **Automated Test Suite (Vitest)**: Comprehensive unit and integration test suite in `artifacts/api-server/src/__tests__/` covering commission engine (15 categories), circuit breaker, idempotency guard, sanitization middleware, cache (with LRU eviction), JWT lifecycle, token blacklist, login guard, webhooks (all Stripe event types), checkout flow (DB-mocked), and auth integration. Run with `pnpm --filter @workspace/api-server test` or `pnpm --filter @workspace/api-server test:coverage`. 188 tests across 11 test files.
-   **Omni-Node Open Intake**: A public submission portal with AI-powered smart routing, duplicate detection, and a Global Trust Score Engine.
-   **Invisible Funnel Protocol**: A headless API orchestration layer for growth, communication, and commerce.
-   **Universal Commission Engine**: Automates referral commissions on platform transactions.
-   **Autonomous Execution Engine**: Implements a "Scan → Diagnose → Execute" one-tap workflow, normalizing vehicle input, running AI-powered vehicle analysis, and autonomously triggering cascading workflows with blockchain proof stamping.
-   **Universal Attribution Engine**: 5-level depth referral attribution with diminishing commission rates and blockchain proof stamping.
-   **Street-Level Distribution Network**: Entry layer for the "Global Automotive Liquidity Network," capturing QR scans at physical nodes and tracking referrers.
-   **ONYX Proof Engine**: Cryptographic SHA-256 hash-chain recording every state change across the network for 25 event types.
-   **Event Bus + Proof Integration**: Enhanced EventBus integrates with WebSocket Hub for real-time broadcast and Proof Engine for cryptographic recording. Supports AWS EventBridge in production.
-   **Node Attribution Engine**: Every deal auto-populates a participants array with roles and calculates a 3% Global Tech Fee split.
-   **NLP Intent Classifier v2**: Enhanced `routeToAgentWithConfidence()` returns confidence scores, matched keywords, and escalation flags, with 90% AI Confidence Guardrails for financial/critical actions.
-   **Sovereign Behavioral Execution Engine**: Psychological intelligence layer over the 12-Agent Mesh.
-   **Conversion Intelligence Engine**: Tracks behavioral patterns for conversion optimization.
-   **Multi-Channel Referral Sharing**: Integrated sharing across various social platforms.
-   **Idempotency Guard**: API-level duplicate prevention for critical transactions.
-   **Escrow Orders**: PostgreSQL-persisted for vehicle escrow, with Stripe Connect integration.
-   **Webhook Transaction Safety**: Atomic DB operations and idempotency for Stripe webhooks.
-   **Commission Auto-Trigger**: Automatic commission processing on `payment_intent.succeeded` events.
-   **Reconciliation Endpoint**: Compares Stripe PaymentIntents against internal records for discrepancies.
-   **State Transition Hardener**: Strict validation across multiple domains and states.
-   **Michelin Demand Engine**: Converts friction events into demand scores and auto-triggers.
-   **Distribution Hub Auto-Upgrade Engine**: Katamari Growth Model for node tier progression.
-   **C-Suite + Book Doctrine Agent Engine**: 18 autonomous AI agents with directives, self-learning, and KPI monitoring.
-   **Success Stories Engine**: Tracks and showcases user achievements.
-   **Command Center Sovereign Blueprint DNA**: New Founder's Command Center tabs for doctrine agents, success stories, and sovereign HQ.
-   **ONYX Automotive OS (v4.0.0-ULTRA)**: AI-Callable, Node-Based Transaction Network with 7-Agent Mesh Orchestration (Sales/Finance/Service/Manager/Logistics/Network/Support), Force-Action Execution Engine (`/v1/execute`), Transaction Case Tracking (`/v1/cases/:caseId`), Fintech-Grade Payout Engine (`/v1/payout/connect` via Stripe Connect), AI Inventory Matching (`/v1/inventory/match`), Vehicle Trust Layer (`/v1/verify/:vin`), OpenAPI 3.1 spec at `/openapi.json` (ChatGPT Actions & Gemini Extensions compatible), Live Node Registry (ELMWOOD_CDJR, ROUTE_44, CUXTOMCANDY_HUB), Transaction Ledger with 3% platform commission, deploy targets: Web (PWA), iOS (App Store), Android (Google Play), ChatGPT Actions, Gemini Extensions. Mounted at `/api/platform/`.
-   **Fintech Compliance Guard**: Production-grade enforcement for payouts, KYC, and Stripe Connect.
-   **Self-Learning Feedback Loop**: Captures AI overrides, adjusts confidence, and tracks agent maturity.
-   **Next Best Action Engine**: Operator guidance with confidence-scored action suggestions.
-   **Sovereign Service Mesh**: Kubernetes-equivalent service registry with health probes, circuit breakers, and autoscaling simulation.
-   **ONYX Metrics Engine**: Prometheus+Grafana-equivalent with various counters, gauges, histograms, and time series.
-   **ONYX Log Aggregator**: ELK Stack-equivalent centralized structured logging with correlation ID tracing.
-   **ONYX Object Vault**: S3+CloudFront-equivalent document storage with encryption and CDN caching.
-   **ONYX CI/CD Pipeline**: GitHub Actions-equivalent 5-stage pipeline.
-   **Architectural Upgrades**: CarPlay/Android Auto integration, tRPC Type-Safe API Layer, Admin API, Beta Waitlist.

Kilocorn Infrastructure Layers include a Developer Platform/API Gateway, Federation/Multi-Region Architecture, Global Settlement Engine, Plugin/Extension System, IoT/Vehicle Telemetry Pipeline, Governance & Compliance Engine, and Data Intelligence Platform.

The Unified Sovereign Nexus integrates gig-economy logistics, warranty management, and a 7-Agent Mesh into a Distributed Node Economy with invite-only architecture, real-time task matching, an Ask ONYX Command Router, Instant Split-Payment Engine, Bank Payoff Protocol, and Warranty Intelligence Engine.

The Global Automotive Economic Network includes an ONYX Wallet System, Location Node Network, Social Proof Engine, Global Remittance System, and Global Inclusion & Localization Engine.

A theme engine offers 20 culture-driven themes. Key API Endpoints include Text-to-Deal Engine, Universal Auto-Settle Engine, Dealer 20 Group Protocol, OEM Incentives Engine, Club / Event / Venue System, Social Amplifier, Marketplace Hub, Marketing Hub, Apparel & Powersport Catalog, Smart Promotions & Cultural Engine, eCommerce Bridge, Survey Shield & OEM Bridge Protocol, and Paramount Access & Sovereign Credential.

# External Dependencies

-   **Monorepo Tool**: pnpm workspaces
-   **API Framework**: Express 5
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **API Codegen**: Orval
-   **Build Tool**: esbuild
-   **Cloud/Deployment**: AWS
-   **Financial Linking**: Plaid
-   **Liability Verification**: Spinwheel Connect
-   **Insurance Quotes**: InsureMO
-   **Vehicle History**: MOTOR
-   **Automotive AI**: Predii
-   **Telematics**: Smartcar
-   **Vehicle Market Data**: MarketCheck
-   **Vehicle Subscriptions**: Loopit
-   **E-Signatures**: DocuSign
-   **Maps & Navigation**: Mapbox
-   **Roadside Assistance**: HONK
-   **AR Safety & HUD**: Basemark Rocksolid AR
-   **Rental Aggregation**: CarTrawler
-   **eCommerce Bridge**: API2Cart
-   **Payments/Payouts**: Stripe Connect
-   **Remote Browser Automation**: Browserbase
-   **AI Workflow Engine**: Gumloop
-   **Logistics Tracking**: HyperTrack
-   **Background Checks**: Checkr
-   **AI/LLM**: Multi-model abstraction (Gemini, OpenAI, Anthropic)
-   **Charts**: Recharts
-   **Real-time Communication**: WebSocket Hub, Server-Sent Events (SSE)
-   **Model Context Protocol**: `@modelcontextprotocol/sdk`
-   **Carrier Integration**: Ship.cars, RunBuggy, Enclosed Elite, Montway, AmeriFreight, uShip
-   **Identity Verification**: Stripe Identity
-   **Data Intelligence**: Fullpath
-   **Push Notifications**: Expo
-   **CRM**: HubSpot
-   **Advertising**: TikTok Ads, Axon Pixel (via `VITE_AXON_PIXEL_ID` env var)
-   **Email Marketing**: Constant Contact

## Testing

The API server has a comprehensive Vitest test suite covering critical business logic. Run tests with:
- `pnpm --filter @workspace/api-server test` — run all tests
- `pnpm --filter @workspace/api-server test:coverage` — run with V8 coverage report

Test files live in `artifacts/api-server/src/__tests__/` and cover:
- Commission engine (all 15 categories, rate calculations, self-referral blocking, validation)
- Circuit breaker (state transitions, timeout behavior, recovery)
- Idempotency guard (cache hit/miss, key conflict, concurrent requests)
- Input sanitization (XSS, SQL injection, null bytes)
- In-memory cache (TTL expiry, LRU eviction, stats)
- JWT (sign/verify, token uniqueness, tamper detection)
- Token blacklist (revocation, cache behavior, DB pruning)
- Login guard (brute-force lockout, threshold, recovery)
- Webhook handler (route structure, event shape verification)
