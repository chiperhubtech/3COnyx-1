# Overview

3C Onyx is the Global Automotive Liquidity Network, aiming to decentralize the dealership experience by transforming every gas station, mechanic bay, and smartphone into a high-conversion point-of-sale. It replaces fragmented legacy systems with a Unified Automotive Command Layer (UACL), an intelligent, monetized operating system. The project's vision is to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for consumers and professionals, with significant market potential for monetized services. Key capabilities include dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and an AI-enriched marketplace.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

The project uses a pnpm workspace monorepo with Node.js 24 and TypeScript 5, leveraging Express 5, PostgreSQL with Drizzle ORM, and Zod for validation. It is designed for AWS deployment, utilizing Route 53, CloudFront, S3, ALB, ECS Fargate, and RDS PostgreSQL 16.

The UI/UX adopts a "Apple × GTA" cinematic visual language with a multi-theme system, Barlow Condensed and Inter typography, amber accents, glassmorphism, and a custom AI-Native Design System with futuristic components. It prioritizes a mobile-first, Zero-Thought Assistant-First approach with a "Google Search Bar" pivot for a consumer-first assistant experience.

The core architecture is AI-first, featuring an Enterprise AI Stack v4.0 with multi-model routing, a WebSocket Real-Time Hub, and an Agent Orchestration Engine powering a 12-agent UACL mesh. It includes a Blockchain Chain-of-Custody for tamper-proof ledgering, a JWT-based authentication system with WebAuthn and OAuth, and a Fortress Governor for AI safety with a three-tier confidence classification.

Key features and architectural layers include:
-   **Security Middleware**: Helmet for headers, rate limiting, and secure webhook handling.
-   **Database Layer**: Drizzle ORM with PostgreSQL, ensuring SOC2 audit-trail compliance.
-   **API Performance Stack**: Pagination, async logging, TTL caching, compression, and tuned connection pools.
-   **Sovereign Infrastructure Layer (UACL)**: Comprehensive request processing including classification, authentication, execution, verification, logging, auditing, and a 12-Intent Neural Classifier.
-   **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals with smart routing, SLA auto-escalation, and Zero-Trust Delegation.
-   **Deal Command Center**: A single-screen autonomous deal pipeline with a Text-to-Deal parser, Mobile Desking, and cryptographic Deal Verify timeline.
-   **ONYX AI Mode**: A conversational automotive intelligence interface with a full-page cinematic spatial UI and multi-turn capabilities.
-   **Auto Pulse**: A Perplexity-style automotive intelligence feed aggregating real-time content.
-   **Vehicle Customization Hub**: A full-service platform for vehicle customization with fleet mode and volume pricing.
-   **Autonomous Execution Protocol**: AI confidence scoring with auto-escalation and retry mechanisms.
-   **Omni-Node Open Intake**: A public submission portal with AI-powered smart routing and a Global Trust Score Engine.
-   **Invisible Funnel Protocol**: A headless API orchestration layer for growth and commerce.
-   **Universal Commission Engine**: Automates referral commissions.
-   **Autonomous Execution Engine**: Implements a "Scan → Diagnose → Execute" workflow with blockchain proof stamping.
-   **Universal Attribution Engine**: 5-level deep referral attribution.
-   **Street-Level Distribution Network**: Captures QR scans at physical nodes for referral tracking.
-   **ONYX Proof Engine**: Cryptographic SHA-256 hash-chain recording state changes.
-   **Event Bus + Proof Integration**: Integrates with WebSocket Hub and Proof Engine.
-   **Node Attribution Engine**: Auto-populates participant arrays and calculates tech fees.
-   **NLP Intent Classifier v2**: Enhanced intent classification with confidence scores and guardrails.
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
-   **Advertising**: TikTok Ads
-   **Email Marketing**: Constant Contact