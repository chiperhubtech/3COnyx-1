# Overview

3C Onyx is the Global Automotive Liquidity Network — a Protocol for Automotive Value Exchange that decentralizes the dealership. Every gas station, mechanic bay, and smartphone becomes a high-conversion point-of-sale. Known as the Unified Automotive Command Layer (UACL), it replaces fragmented legacy systems with an intelligent, monetized operating system. The Liquidity Network Protocol (v2.0) is the production-hardened final state. Key capabilities include dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and a comprehensive AI-enriched marketplace. The project's vision is to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for consumers and professionals, with significant market potential for monetized services.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project uses a pnpm workspace monorepo with Node.js 24, TypeScript 5, Express 5 API, PostgreSQL, Drizzle ORM, and Zod for validation. API codegen uses Orval from an OpenAPI spec, and `esbuild` is used for CJS bundling.

## AWS Deployment Architecture

The system is designed for AWS, leveraging Route 53, CloudFront, S3, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16, ensuring lightweight container images and zero-downtime deployments.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a multi-theme system (dark default, warm ivory light mode, plus 12 holiday/seasonal themes and auto-birthday detection). Typography uses Barlow Condensed for headings and Inter for body text. Design elements include an "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber accents, translucent glassmorphism, and a custom AI-Native Design System with futuristic components and dynamic animations. The UI also incorporates a "Google Search Bar" pivot for a consumer-first assistant experience, de-jargonized status labels, and a mobile-first, Zero-Thought Assistant-First UI.

## Core Platform Features

The architecture is AI-first, featuring:
- **Enterprise AI Stack v4.0**: An AI router using OpenAI as primary, with Gemini/Bedrock/Anthropic fallbacks, supporting various task types including vision and a Critique & Review loop.
- **WebSocket Real-Time Hub**: Provides real-time communication across distinct rooms.
- **Agent Orchestration Engine**: A 12-agent UACL mesh with a state machine.
- **Blockchain Chain-of-Custody**: Ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose`, supporting full authentication flows, role-based access control, bcrypt-hashed passwords, and WebAuthn biometric authentication (Face ID / Fingerprint) via `@simplewebauthn`.
- **Fortress Governor (AI Safety & Control Layer)**: A three-tier confidence classification system for AI decisions, including AUTO_EXECUTE, SUGGEST, and HALT, with an Explainability Layer for user understanding.
- **Security Middleware**: Uses Helmet for security headers, `express-rate-limit` for API rate limiting, and secure Stripe webhook handling.
- **Database Layer**: Drizzle ORM with PostgreSQL (optimized connection pool), ensuring all tables are SOC2 audit-trail compliant.
- **API Performance Stack (ByteByteGo 5)**: Implements standardized pagination, async logging, TTL in-memory caching, gzip/brotli compression, and tuned connection pools.
- **Sovereign Infrastructure Layer (UACL)**: Ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages, including a 12-Intent Neural Classifier and the Genesis Protocol.
- **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals, featuring a Smart Routing Engine, SLA Auto-Escalation, Bank-Ready Vault, AI Vision OCR Intake, Dependency-Aware DAG Execution, and Zero-Trust Delegation Architecture.
- **Autonomous Execution Protocol**: AI confidence scoring per task with auto-escalation and a retry mechanism.
- **Omni-Node Open Intake**: A public submission portal with AI-powered smart routing, duplicate detection, and a Global Trust Score Engine.
- **Invisible Funnel Protocol**: A headless API orchestration layer for growth, communication, and commerce, including a Growth Event Bus, Communication Orchestrator, Referral Engine API, Commerce API, and a Decentralized Bird-Dog Flywheel.
- **Universal Commission Engine**: Automates referral commissions on platform transactions, tracking earnings, awarding ONYX Points, and integrating with `commission_ledger` and `transactions` tables.
- **Shareable AR Badge**: A themed 3C branded badge generator at `/ar-badge` that allows members to create, download, and share personalized badges linking back to their profiles for viral growth.
- **ONYX Nerve Center**: The "daily habit" dashboard for logged-in members, displaying real-time tiles for total earnings, Driver Tier progress, Garage vehicle summary with service alerts, and People Helped.
- **Autonomous Execution Engine**: "Scan → Diagnose → Execute" one-tap workflow. `POST /api/input/process` normalizes vehicle input, `POST /api/ai/diagnose` runs AI-powered vehicle analysis (Gemini w/ rule-based fallback), `POST /api/decision/execute` autonomously triggers cascading workflows (deal creation, service scheduling, parts ordering, inspections) with blockchain proof stamping. 90% AI confidence guardrails with human escalation. All routes auth-gated + rate-limited. Server-side diagnosis store prevents client-side action injection. UI at `/one-tap`.
- **Universal Attribution Engine**: Multi-level referral attribution (Direct + Secondary at 20% of primary rate). `POST /api/payout/distribute` requires proof-of-completion gating (invoice_verified, delivery_signed, service_confirmed, payment_confirmed) before any payout is released. Anti-abuse layer detects velocity spikes (50 referrals/24h), new account gaming, same-domain clusters, suspicious conversion rates — quarantines at risk score >= 70/100. All payouts are blockchain-stamped. Idempotency via dedupe keys prevents replay attacks. Authorization enforces caller === buyer or Admin/Finance role. `GET /api/node/:id/earnings` returns real-time earnings hub.
- **Altruistic Share Component**: Gold-on-black modal triggered after one-tap completion showing "You helped someone! Earn by helping another." Displays real-time earnings (paid/pending/helped counts), 1-tap native share sheet, copy link, QR code. Referral deep-links go to `/assist/{code}`. Falls back to `/join` if no referral code exists.
- **Street-Level Distribution Network**: The "Global Automotive Liquidity Network" entry layer. `GET /api/referral/:username` captures QR scans at physical nodes (gas stations, repair shops) and permanently tags the referrer to the new user's attribution chain with SHA-256 hash stamps. `GET /api/node/:id/qr` generates dynamic QR codes for members. `GET /api/leaderboard` ranks nodes by People Helped and Total Earnings. `GET /api/activity/feed` provides real-time dopamine loop ("John in Taunton just earned $150 from a referral"). Identity roles: Connector (0+) → Closer (10+) → Operator (50+) → Enterprise (200+). All responses carry forensic sovereignty headers (X-Protocol-Class: Global-Automotive-Liquidity-Network).
- **Architectural Upgrades**: Includes CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API, and a Beta Waitlist system.

## Kilocorn Infrastructure Layers ($1T+ Architecture)

Seven protocol-level infrastructure layers that elevate 3C ONYX from an application to the global automotive protocol:

1. **Developer Platform / API Gateway** (`/api/developer/*`): Third-party developer registration, API key issuance (SHA-256 hashed, prefix-only storage), tiered rate limiting (Free → Builder → Enterprise → Partner → Sovereign), webhook delivery system with retry logic. 16 subscribable event types. This makes ONYX a protocol others build on — like Stripe for automotive.

2. **Federation / Multi-Region Architecture** (`/api/federation/*`): 9-region global node topology (NA_EAST/WEST/CENTRAL, EU_WEST/CENTRAL, APAC_EAST/SOUTH, LATAM, MEA). Event-sourced incremental sync with conflict-free merge. Jurisdiction-aware geographic data sharding. mTLS with certificate pinning. <500ms automatic regional failover. 1M TPS global capacity. Cross-region sync tracking.

3. **Global Settlement Engine** (`/api/settlement/*`): 20-currency support (USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, BRL, MXN, KRW, AED, SGD, ZAR, NGN, SAR, HKD, SEK, NOK). 8 payment rails (Stripe, ACH, SEPA, PIX, UPI, Wire, Alipay, WeChat Pay). Real-time FX conversion. 2% platform fee on all settlements. Full settlement ledger with jurisdiction tagging and compliance flags.

4. **Plugin / Extension System** (`/api/plugins/*`): App Store for automotive — third parties build modules on ONYX. 8 system plugins (Guardian, Bird-Dog, F&I, Marketplace, Fleet Telemetry, Compliance Shield, Dealer CRM, Transport). Sandboxed V8 isolate execution with memory limits. Plugin lifecycle: Draft → Review → Published → Suspended → Deprecated. Install/uninstall tracking.

5. **IoT / Vehicle Telemetry Pipeline** (`/api/iot/*`): OBD-II, telematics, connected car API, AR headset, and robotics node data ingestion. 12 supported metric types. Predictive maintenance engine with 5 failure prediction models (brake, battery, tire, engine, transmission). Supports Tesla, Ford, GM, BMW, Mercedes connected car APIs + HoloLens, Magic Leap, Apple Vision Pro + Boston Dynamics, Figure, Tesla Bot. 10Hz refresh rate. 90-day raw retention, 7-year aggregated.

6. **Governance & Compliance Engine** (`/api/governance/*`): 10 default jurisdictions (US-FL, US-CA, US-TX, US-NY, GB, DE, JP, AE, BR, IN). 8 compliance frameworks (SOC 2, NIST 800-53, GDPR, CCPA, LGPD, DPDP, PCI DSS 4.0, FIPS 140-3). Automated compliance report generation. Consent model management (opt-in/opt-out per region). Data residency enforcement. Cross-border transfer impact assessments.

7. **Data Intelligence Platform** (`/api/data-intelligence/*`): Bloomberg Terminal for automotive. Market pricing intelligence across 2.8M+ listings. Demand forecasting with ARIMA, Prophet, LSTM, Transformer models (84-92% accuracy). Regional trend analysis at metro-area granularity. Competitive intelligence (Cox, CDK, Carvana, TrueCar, CarGurus). Predictive maintenance models (88-94% accuracy). Fleet analytics with TCO optimization.

### Kilocorn Database Tables
`developer_apps`, `onyx_api_keys`, `webhook_endpoints`, `webhook_deliveries`, `federation_nodes`, `cross_region_sync`, `settlement_ledger`, `fx_rates`, `plugins`, `plugin_installs`, `telemetry_streams`, `telemetry_data_points`, `predictive_maintenance`, `compliance_jurisdictions`, `compliance_reports`, `intelligence_reports`, `market_data_snapshots`

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

## Explainer Video (Onyx Explainer)

Located at `artifacts/onyx-explainer`. 11-scene cinematic explainer video with browser-based voiceover (Web Speech API). Scenes auto-advance with configurable durations in `VideoTemplate.tsx`. Scene arc: Reveal ($2.7T) → Problem → What We Built → Protocol (Scan→Diagnose→Execute) → Agent Mesh (7 agents) → Proof Engine → Revenue (Tollbooth) → Street Economy (K>1 QR viral) → Blitzscaling (10M→100M) → Moat (Five Walls) → Close. Total runtime ~4.5 minutes. Architecture communicates full execution platform vision: AI agents today, AR inspection next, humanoid robotics integration, full autonomous protocol as endgame.

## Pitch Deck

Located at `artifacts/pitch-deck`. 10 slides, routed via `/slide1` through `/slide10`. Auto-discovered via `import.meta.glob` + `slides-manifest.json`. Slide order: Title → Problem ($2.7T) → What We Built (10 LIVE systems) → Protocol (8 pillars) → Street Economy → Revenue (Tollbooth) → Scale (10M→100M, AI→AR→Robotics→Full Autonomy) → Moat (Five Walls) → Capital (SBA 7(a)) → Close. Pre-existing build-time issue: vite.config.ts references PORT env var that isn't set during `pnpm build`; dev server works fine.