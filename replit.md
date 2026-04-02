# Overview

3C Onyx is the Global Automotive Liquidity Network, aiming to decentralize the dealership experience by transforming every gas station, mechanic bay, and smartphone into a high-conversion point-of-sale. It replaces fragmented legacy systems with a Unified Automotive Command Layer (UACL), an intelligent, monetized operating system. The project's vision is to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for consumers and professionals, with significant market potential for monetized services. Key capabilities include dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and an AI-enriched marketplace.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project utilizes a pnpm workspace monorepo, built with Node.js 24 and TypeScript 5. The backend employs an Express 5 API, PostgreSQL with Drizzle ORM, and Zod for validation. API codegen is handled by Orval from an OpenAPI spec, and `esbuild` is used for CJS bundling.

## AWS Deployment Architecture

The system is designed for AWS, using Route 53, CloudFront, S3, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16 to ensure lightweight container images and zero-downtime deployments.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a multi-theme system, including a dark default, warm ivory light mode, and seasonal themes. Typography uses Barlow Condensed for headings and Inter for body text. Design elements include an "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber accents, translucent glassmorphism, and a custom AI-Native Design System with futuristic components and dynamic animations. The UI also incorporates a "Google Search Bar" pivot for a consumer-first assistant experience and is designed with a mobile-first, Zero-Thought Assistant-First approach.

## Core Platform Features

The architecture is AI-first, encompassing:
- **Enterprise AI Stack v4.0**: An AI router using OpenAI primarily, with Gemini, Bedrock, and Anthropic fallbacks, supporting various task types including vision and a Critique & Review loop.
- **WebSocket Real-Time Hub**: Provides real-time communication across distinct rooms.
- **Agent Orchestration Engine**: A 12-agent UACL mesh with a state machine.
- **Blockchain Chain-of-Custody**: Ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose`, supporting full authentication flows, role-based access control, bcrypt-hashed passwords, and WebAuthn biometric authentication via `@simplewebauthn`.
- **Fortress Governor (AI Safety & Control Layer)**: A three-tier confidence classification system for AI decisions (AUTO_EXECUTE, SUGGEST, HALT) with an Explainability Layer.
- **Security Middleware**: Uses Helmet for security headers, `express-rate-limit` for API rate limiting, and secure Stripe webhook handling.
- **Database Layer**: Drizzle ORM with PostgreSQL (optimized connection pool), ensuring all tables are SOC2 audit-trail compliant.
- **API Performance Stack (ByteByteGo 5)**: Implements standardized pagination, async logging, TTL in-memory caching, gzip/brotli compression, and tuned connection pools.
- **Sovereign Infrastructure Layer (UACL)**: Ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages, including a 12-Intent Neural Classifier and the Genesis Protocol.
- **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals, featuring a Smart Routing Engine, SLA Auto-Escalation, Bank-Ready Vault, AI Vision OCR Intake, Dependency-Aware DAG Execution, and Zero-Trust Delegation Architecture.
- **Autonomous Execution Protocol**: AI confidence scoring per task with auto-escalation and a retry mechanism.
- **Omni-Node Open Intake**: A public submission portal with AI-powered smart routing, duplicate detection, and a Global Trust Score Engine.
- **Invisible Funnel Protocol**: A headless API orchestration layer for growth, communication, and commerce.
- **Universal Commission Engine**: Automates referral commissions on platform transactions.
- **Shareable AR Badge**: A themed 3C branded badge generator for viral growth.
- **ONYX Nerve Center**: A "daily habit" dashboard for logged-in members.
- **Autonomous Execution Engine**: Implements a "Scan → Diagnose → Execute" one-tap workflow, normalizing vehicle input, running AI-powered vehicle analysis, and autonomously triggering cascading workflows with blockchain proof stamping.
- **Universal Attribution Engine**: Manages multi-level referral attribution and payout distribution with anti-abuse layers and blockchain stamping.
- **Altruistic Share Component**: A post-completion modal encouraging sharing and displaying real-time earnings.
- **Street-Level Distribution Network**: The entry layer for the "Global Automotive Liquidity Network," capturing QR scans at physical nodes and tracking referrers.
- **Architectural Upgrades**: Includes CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API, and a Beta Waitlist system.

## Kilocorn Infrastructure Layers ($1T+ Architecture)

Seven protocol-level infrastructure layers designed to elevate 3C ONYX:
1.  **Developer Platform / API Gateway**: For third-party developer registration, API key issuance, tiered rate limiting, and a webhook delivery system.
2.  **Federation / Multi-Region Architecture**: A 9-region global node topology with event-sourced incremental sync, jurisdiction-aware data sharding, mTLS, and automatic regional failover.
3.  **Global Settlement Engine**: Supports 20 currencies and 8 payment rails, with real-time FX conversion and a 2% platform fee.
4.  **Plugin / Extension System**: An "App Store for automotive" where third parties can build modules.
5.  **IoT / Vehicle Telemetry Pipeline**: Data ingestion from OBD-II, telematics, connected car APIs, AR headsets, and robotics, with a predictive maintenance engine.
6.  **Governance & Compliance Engine**: Manages compliance across 10 default jurisdictions and 8 frameworks, with automated reporting and consent management.
7.  **Data Intelligence Platform**: Provides market pricing intelligence, demand forecasting, regional trend analysis, competitive intelligence, predictive maintenance models, and fleet analytics.

## Unified Sovereign Nexus — The Living Money Network

Six systems integrating gig-economy logistics, warranty management, and a 7-Agent Mesh into a Distributed Node Economy:
1.  **Invite-Only Node Architecture**: Gated entry with cryptographic invites for lifetime attribution and role assignment.
2.  **Real-Time Task Matching Engine**: Uber/DoorDash-grade distributed task matching with a state machine and geo-hash nearest-node dispatching.
3.  **Ask ONYX Command Router**: Single NLP-ready input routing intents to the 7-Agent Mesh with high-confidence auto-routing.
4.  **Instant Split-Payment Engine**: Automatic multi-party split on every transaction with proof-of-completion gating and blockchain-stamped distribution.
5.  **Bank Payoff Protocol**: Automates bank payoffs for 18 lenders, significantly reducing processing time.
6.  **Warranty Intelligence Engine**: Integrates factory warranty verification with VIN decoding and recall information.

## Global Automotive Economic Network — The Living Money Network

Five systems completing the zero-friction global economy:
1.  **ONYX Wallet System**: A financial system for real-time balances, earnings tracking, and instant credit/debit.
2.  **Location Node Network**: Transforms physical locations into high-conversion points-of-sale with QR code generation and tracking.
3.  **Social Proof Engine**: Provides real-time social proof and gamification elements for user engagement.
4.  **Global Remittance System**: Facilitates cross-border payments with multi-currency support and blockchain proof stamps.
5.  **Global Inclusion & Localization Engine**: Optimizes the platform for diverse users, devices, and networks with multi-language and multi-currency support, offline-first sync, and emerging market readiness.

## ONYX Theme Engine — Culture-Driven Visual Identity

A theme engine offering 20 culture-driven themes across 10 categories, each with full color palettes, dark mode overrides, typography, and visual effect flags.

# External Dependencies

-   **Monorepo Tool**: pnpm workspaces
-   **API Framework**: Express 5
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **API Codegen**: Orval
-   **Build Tool**: esbuild
-   **Cloud/Deployment**: AWS
-   **Fonts**: Google Fonts
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

## Text-to-Deal Engine (POST /api/text-to-deal)

A unified "Forrest Gump simple" endpoint that converts raw text messages into structured deals. NLP entity extraction identifies customer names, vehicle make/model/year, VIN, budget, phone numbers, location, service type, urgency, and intent (buy/sell/service/refer/assist). Auto-assigns participants with role-based splits and generates SHA-256 proof hashes. Routes: `/convert` (full deal creation), `/extract` (entity extraction only), `/status`.

## OEM Incentives Engine (POST /api/oem-incentives)

VIN + ZIP + Customer Profile → exact discounts and rebates. Covers 28 manufacturers with 90+ active programs across 11 incentive types (rebate, bonus cash, loyalty, conquest, APR reduction, lease cash, tax credits, referral credits, EV rebates). Includes 14 state-level EV incentive programs. Customer qualification factors: military/veteran, first responder, recent graduate, current vehicle brand (loyalty/conquest), income eligibility, referral codes. Routes: `/match` (full personalized matching), `/quick-match` (guaranteed + possible savings), `/manufacturers`, `/programs/:manufacturer`, `/status`. Replaces the hardcoded $1,500 OEM incentive default in brokerDesk.ts.