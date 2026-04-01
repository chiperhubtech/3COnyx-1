# Overview

3C Onyx is a luxury dark-mode Automotive Ecosystem OS, the Unified Automotive Command Layer (UACL), designed to replace fragmented legacy systems with an intelligent, monetized operating system. The Genesis Protocol (v1.0) represents its production-hardened final state. Its key capabilities span dropshipping integration, professional dashboards, member value intelligence, QR payments, VIN Digital Passports, and a comprehensive AI-enriched marketplace. The project aims to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for both consumers and professionals with significant market potential for monetized services.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project uses a pnpm workspace monorepo with Node.js 24, TypeScript 5, Express 5 API, PostgreSQL, Drizzle ORM, and Zod for validation. API codegen leverages Orval from an OpenAPI spec. `esbuild` is used for CJS bundling.

## AWS Deployment Architecture

The system is designed for AWS, utilizing Route 53, CloudFront, S3, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16, with lightweight container images and zero-downtime deployments.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a dual-theme system (dark default, warm ivory light mode). Typography uses Barlow Condensed for headings and Inter for body text. Key design elements include a "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber accents, translucent glassmorphism, and a custom AI-Native Design System with futuristic components and dynamic animations. The UI also features a "Google Search Bar" pivot for a consumer-first assistant experience, de-jargonized status labels, and a mobile-first design with a Zero-Thought Assistant-First UI.

## Core Platform Features

The architecture prioritizes an AI-first approach with:
- **Enterprise AI Stack v4.0**: An AI router using OpenAI as primary, with Gemini/Bedrock/Anthropic fallbacks, supporting various task types including vision and a Critique & Review loop.
- **WebSocket Real-Time Hub**: For real-time communication across distinct rooms.
- **Agent Orchestration Engine**: A 12-agent UACL mesh with a state machine.
- **Blockchain Chain-of-Custody**: Ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose` library, supporting full authentication flows, role-based access control, and bcrypt-hashed passwords.
- **Security Middleware**: Helmet for security headers, `express-rate-limit` for API rate limiting, and secure Stripe webhook handling.
- **Database Layer**: Drizzle ORM with PostgreSQL, including Drizzle Kit for migrations. All tables are SOC2 audit-trail compliant.
- **API Specification and Code Generation**: `@workspace/api-spec` manages OpenAPI 3.1 specification and Orval configuration.
- **Sovereign Infrastructure Layer (UACL)**: Ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages. Includes a 12-Intent Neural Classifier and the Genesis Protocol for sovereign system declaration.
- **DealerFlow OS v2.0**: An industrial infrastructure layer for automotive professionals, featuring a Smart Routing Engine, SLA Auto-Escalation, Bank-Ready Vault, AI Vision OCR Intake, Dependency-Aware DAG Execution for deal lifecycles, and a Zero-Trust Delegation Architecture.
- **Autonomous Execution Protocol**: AI confidence scoring per task with auto-escalation and a retry mechanism.
- **Omni-Node Open Intake**: A public submission portal with AI-powered smart routing, duplicate detection, and a Global Trust Score Engine.
- **Invisible Funnel Protocol**: A headless API orchestration layer for growth, communication, and commerce, including a Growth Event Bus, Communication Orchestrator, Referral Engine API, and Commerce API. It also implements a Decentralized Bird-Dog Flywheel for viral growth.
- **Architectural Upgrades**: Includes CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API, and a Beta Waitlist system.

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
-   **Carrier Integration**: Ship.cars, RunBuggy, Enclosed Elite, Montway, AmeriFreight, uShip
-   **Identity Verification**: Stripe Identity
-   **Data Intelligence**: Fullpath
-   **Vehicle Market Data**: MarketCheck
-   **Push Notifications**: Expo