# Overview

3C Onyx is a luxury dark-mode Automotive AI Operating System and Super App developed by CUXTOMCANDYCLUB LLC. It serves as a comprehensive trust layer and ecosystem connector for the entire automotive industry. The platform's core vision is to provide measurable value to every member, driving retention, referrals, and repeat engagement through an "Impact" system.

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
- **AI Model Abstraction Layer**: `ai-router.ts` for multi-provider LLM access (Gemini, OpenAI, Anthropic fallback).
- **WebSocket Real-Time Hub**: `wsHub.ts` for real-time communication across five distinct rooms.
- **Agent Orchestration Engine**: `agentOrchestrator.ts` for AI-powered tool execution using a 7-agent mesh.
- **Blockchain Chain-of-Custody**: `chainOfCustody.ts` ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose` library, supporting registration, login, token refresh, and logout. Includes `requireAuth` and `requireRole` middleware for access control. Passwords are bcrypt-hashed (cost factor 12).
- **Security Middleware**: Helmet for security headers, `express-rate-limit` for API rate limiting, cookie parser support, trust proxy configuration, and secure Stripe webhook handling.
- **Database Layer**: `@workspace/db` package utilizing Drizzle ORM with PostgreSQL, including Drizzle Kit for migrations. All tables are SOC2 audit-trail compliant with `created_at` and `updated_at` timestamps.
- **API Specification and Code Generation**: `@workspace/api-spec` manages OpenAPI 3.1 specification and Orval configuration for type-safe API interactions.

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
-   **Carrier Integration**: Ship.cars, RunBuggy
-   **Identity Verification**: Stripe Identity
-   **Data Intelligence**: Fullpath
-   **Vehicle Market Data**: MarketCheck
-   **Push Notifications**: Expo (for mobile)