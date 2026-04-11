# Overview

3C Onyx is the Global Automotive Liquidity Network, aiming to decentralize the dealership experience by transforming every gas station, mechanic bay, and smartphone into a high-conversion point-of-sale. It replaces fragmented legacy systems with a Unified Automotive Command Layer (UACL), an intelligent, monetized operating system. The project's vision is to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for consumers and professionals, with significant market potential for monetized services. Key capabilities include dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and an AI-enriched marketplace.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project utilizes a pnpm workspace monorepo with Node.js 24 and TypeScript 5. The backend uses Express 5, PostgreSQL with Drizzle ORM, and Zod for validation. API codegen is handled by Orval from an OpenAPI spec, and `esbuild` is used for CJS bundling.

## AWS Deployment Architecture

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
-   **Database Layer**: Drizzle ORM with PostgreSQL (optimized connection pool), ensuring all tables are SOC2 audit-trail compliant.
-   **API Performance Stack (ByteByteGo 5)**: Implements standardized pagination, async logging, TTL in-memory caching, gzip/brotli compression, and tuned connection pools.
-   **Sovereign Infrastructure Layer (UACL)**: Ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages, including a 12-Intent Neural Classifier and the Genesis Protocol.
-   **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals, featuring a Smart Routing Engine, SLA Auto-Escalation, Bank-Ready Vault, AI Vision OCR Intake, Dependency-Aware DAG Execution, and Zero-Trust Delegation Architecture.
-   **Deal Command Center**: Single-screen autonomous deal pipeline replacing the entire dealership workflow, featuring a Text-to-Deal parser, Mobile Desking calculator, One-Tap Insurance binding, cryptographic Deal Verify timeline, Live Deal Thread, and 6-button command grid, with a spatial UI.
-   **ONYX AI Mode**: Google AI Mode-style conversational automotive intelligence interface with a full-page cinematic spatial UI, suggested prompts, 12-agent mesh routing, multi-turn conversation with session persistence, formatted responses, related topics chips, SHA-256 proof hashes, and typing indicators.
-   **Auto Pulse**: Perplexity-style automotive intelligence feed aggregating real-time content from Google News RSS, Reddit, NHTSA API, and automotive publications.
-   **Vehicle Customization Hub**: Full-service vehicle customization platform with fleet mode, volume pricing, instant quotes, and a product selection builder.
-   **Autonomous Execution Protocol**: AI confidence scoring per task with auto-escalation and a retry mechanism.
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
-   **Conversion Intelligence Engine**: Global Learning Brain that tracks which behavioral patterns lead to conversions, records behavioral signals, attributes conversions, and calculates effectiveness scores.
-   **Multi-Channel Referral Sharing**: SMS, TikTok, Instagram, WhatsApp, Telegram, Copy Link, QR sharing in AltruisticShare modal and My QR page.
-   **Idempotency Guard**: API-level duplicate prevention middleware with HMAC-signed response caching, concurrent lock management, and 24h TTL. Applied to `/auto-settle`, `/splits`, `/bank-payoff`, `/text-to-deal`. Prevents zero-duplicate deals/payments.
-   **State Transition Hardener**: Strict state transition validation across 7 domains (deal, agent_task, engagement, kyc, transaction, runner_mission, logistics) with 49 states and 79 validated transitions. Architect-signed transition hashes. Integrated into Agent Orchestrator.
-   **Michelin Demand Engine**: Converts 15 friction event types (accident, breakdown, recall, lease expiry, etc.) into demand scores with 5 tiers (LOW→EMERGENCY), 6 upgrade path types, compound multipliers for multiple friction events, and auto-triggers via EventBus `friction.detected` listener. Routes at `/hardened/michelin`.
-   **Distribution Hub Auto-Upgrade Engine**: Katamari Growth Model — 5 node tiers (MEMBER→DISTRIBUTION_CENTER), 8 hub categories (Attorney, Rideshare, Shop, Dealer, Fleet, Influencer, Community, General) with category-specific fast-track thresholds and special features. Routes at `/hardened/hub`.
-   **Self-Learning Feedback Loop**: Correction event system — captures every AI override, detects recurring patterns, adjusts confidence thresholds, tracks agent maturity (INFANT→LEARNING→COMPETENT→EXPERT→MASTER), and generates learning insights. Routes at `/learning`.
-   **Next Best Action Engine**: Zero-blindness operator guidance — 11 action rules across 11 categories analyze deal state, engagement temperature, objections, timing, and sentiment to generate confidence-scored action suggestions with pre-written responses. Batch computation for operator dashboards. Routes at `/nba`.
-   **Sovereign Service Mesh**: Kubernetes-equivalent service registry with 13 microservices, health probes (15s interval), circuit breakers (CLOSED→OPEN→HALF_OPEN), horizontal pod autoscaling simulation, network policies, and cluster-wide metrics. Routes at `/infrastructure/mesh`.
-   **ONYX Metrics Engine**: Prometheus+Grafana-equivalent with 8 counters, 6 gauges, 4 histograms, 5 time series. Prometheus-compatible `/metrics` endpoint, HTTP middleware auto-collects request rates, latency percentiles (P50/P95/P99), error rates. Routes at `/infrastructure/metrics`.
-   **ONYX Log Aggregator**: ELK Stack-equivalent centralized structured logging with 50K-entry ring buffer, 24h retention, correlation ID tracing, full-text search, log level filtering, per-service aggregation, error pattern tracking, slow endpoint detection. Routes at `/infrastructure/logs`.
-   **ONYX Object Vault**: S3+CloudFront-equivalent document storage with AES-256-CBC encryption, 5 default buckets (documents, media, contracts, exports, system), CDN cache layer (100MB), ETag support, signed URL generation, content-type detection. Routes at `/infrastructure/vault`.
-   **ONYX CI/CD Pipeline**: GitHub Actions-equivalent with 5-stage pipeline (typecheck → build-api → build-web → security-audit → deployment-readiness), parallel stage execution, retry logic, deployment readiness checks, Sovereign-only trigger. Routes at `/infrastructure/pipeline`.
-   **Architectural Upgrades**: Includes CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API, and a Beta Waitlist system.

## Kilocorn Infrastructure Layers ($1T+ Architecture)

Seven protocol-level infrastructure layers:
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
5.  **Bank Payoff Protocol**: Automates bank payoffs for 18 lenders.
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

## Key API Endpoints

-   **Text-to-Deal Engine**: Converts raw text messages into structured deals via NLP entity extraction.
-   **Universal Auto-Settle Engine**: Core payment infrastructure for transaction settlement with auto-splitting and platform fees.
-   **Dealer 20 Group Protocol**: Viral growth engine for dealer groups with benchmarking and leaderboards.
-   **OEM Incentives Engine**: Matches VIN, ZIP, and customer profiles to exact OEM discounts and rebates.
-   **Club / Event / Venue System**: Full social infrastructure for creating/managing clubs, events, and venues.
-   **Social Amplifier**: Auto-posts campaigns and content across 9 social platforms.
-   **Marketplace Hub**: Multichannel product distribution across 18+ marketplace channels.
-   **Marketing Hub**: Email, SMS campaigns, landing pages, and marketing automations.
-   **Apparel & Entertainment**: Motorsport dropship apparel catalog and entertainment subscriptions.
-   **Smart Promotions & Cultural Engine**: Proactive maintenance/upgrade alerts and cultural personalization based on user data.
-   **eCommerce Bridge**: Unifies 40+ eCommerce platforms for B2B and B2C dropship.
-   **Survey Shield & OEM Bridge Protocol**: Income protection for salespeople via sentiment checkpoints and automatic OEM app registration.
-   **Paramount Access & Sovereign Credential**: Sovereign credential system with role-based access.

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
-   **Advertising**: TikTok Ads
-   **Email Marketing**: Constant Contact