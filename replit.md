# Overview

3C Onyx is a luxury dark-mode Automotive Ecosystem OS, the Unified Automotive Command Layer (UACL), designed to replace fragmented legacy systems with an intelligent, monetized operating system. The Genesis Protocol (v1.0) represents its production-hardened final state.

Key capabilities include:
- **Alibaba ICBU Dropshipping Integration**: Full Node.js integration for product import and management.
- **Worker Enhancement Layer**: Provides unified dashboards, leaderboards, and a recommendation engine for automotive professionals.
- **ONYX Impact**: A Member Value Intelligence System to visualize and drive engagement.
- **Dynasty Protocol**: Features QR payment generation, VIN Digital Passport with AI summaries, and Smart Bay Traffic Dashboard.
- **User Accounts & Billing**: Persistent accounts, push notifications, and a 5-tier subscription system with Stripe.
- **Automotive Ecosystem Layer**: Integrates roadside assistance, car rentals, and service directories.
- **Decision Engine**: A rule-based scoring system for vehicles, shops, and fraud detection.
- **Core Platform Features**: Includes an AI-enriched Marketplace, Watchlist, My Garage (Smartcar telematics), Logistics (HyperTrack), Inspections, Member Wallet (Stripe Connect), AI Concierge, Specialist Onboarding (Checkr), and SOC2 Audit Vault.

The project aims to establish a comprehensive automotive intelligence layer, offering advanced personalization and a robust platform for both consumers and professionals.

# User Preferences

I prefer detailed explanations and iterative development. Ask before making major changes. Do not make changes to folder `Z` and file `Y`.

# System Architecture

## Monorepo Structure and Tooling

The project uses a pnpm workspace monorepo with Node.js 24 and TypeScript 5. The API is built with Express 5, PostgreSQL, Drizzle ORM, and Zod for validation. API codegen uses Orval from an OpenAPI spec to generate React Query hooks and Zod schemas. `esbuild` handles CJS bundling.

## API Server

The Express 5 API server integrates for validation and database interactions, incorporating production hardening measures like CORS, request timeouts, global error handling, and health probes.

## AWS Deployment Architecture

Designed for AWS, the system utilizes Route 53, CloudFront, S3, ALB, ECS Fargate for API containers, and RDS PostgreSQL 16. Container images are lightweight, supporting zero-downtime deployments via ECS rolling updates. A separate AWS CDK blueprint defines the production deployment across various stacks.

## Frontend Resilience

The frontend implements a React Error Boundary for crash recovery and configures React Query with retries and caching for robust data fetching.

## UI/UX Design (3C Onyx Visual Language)

The platform features a cinematic "Apple × GTA" visual language with a dual-theme system (dark default, warm ivory light mode). Typography uses Barlow Condensed for headings and Inter for body text. Key design elements include a "THE AUTOMOTIVE INTELLIGENCE LAYER" hero, amber-accented headers, translucent glassmorphism, and a custom AI-Native Design System with futuristic components and dynamic animations. `next-themes` manages theme switching with CSS variables.

## Core Platform Features

The platform's architecture prioritizes an AI-first approach with:
- **Enterprise AI Stack v4.0**: An AI router using OpenAI (GPT-4o/mini/nano) as primary, with Gemini/Bedrock/Anthropic fallbacks, supporting various task types including vision. A Critique & Review loop validates responses.
- **WebSocket Real-Time Hub**: For real-time communication across five distinct rooms.
- **Agent Orchestration Engine**: A 12-agent UACL mesh with a state machine for task management.
- **Blockchain Chain-of-Custody**: Ensures tamper-proof ledgering with SHA-256 hash chains, HMAC-SHA-256 signing, PostgreSQL persistence, and optional Ethereum Sepolia anchoring.
- **Authentication System**: JWT-based (HS256) with `jose` library, supporting full authentication flows, role-based access control, and bcrypt-hashed passwords.
- **Security Middleware**: Helmet for security headers, `express-rate-limit` for API rate limiting, and secure Stripe webhook handling.
- **Database Layer**: Drizzle ORM with PostgreSQL, including Drizzle Kit for migrations. All tables are SOC2 audit-trail compliant.
- **API Specification and Code Generation**: `@workspace/api-spec` manages OpenAPI 3.1 specification and Orval configuration for type-safe API interactions.

## Sovereign Infrastructure Layer (UACL)

The Unified Automotive Command Layer ensures every request passes through classification, authentication, execution, verification, logging, and auditing stages. It includes a 12-Intent Neural Classifier for live database execution and the Genesis Protocol for sovereign system declaration, real-time heartbeat, and agent status. A Transporter Agent (PAT-08) handles interstate vehicle logistics with Haversine routing and a verified provider mesh. AWS SDK integration supports various services like Bedrock Runtime, Secrets Manager, EventBridge, Rekognition, Location, and OpenSearch. Dealer DMS Connectors (Oracle OIC) for inventory sync, lead submission, and service booking. Fraud Scoring Middleware provides a rule-based engine with AWS Fraud Detector hook.

## DealerFlow OS v2.0

DealerFlow OS is an industrial infrastructure layer for automotive professionals, wrapping existing systems with intelligence.
- **Smart Routing Engine v2.0**: Multi-signal scoring for routing tasks to departments with UACL agent assignment, including VIN/part number/customer extraction.
- **SLA Auto-Escalation**: Automatic detection and escalation of overdue tasks.
- **Bank-Ready Vault**: Auto-moves completed finance/DMV tasks for submission, speeding up Contract in Transit (CIT).
- **3% Dynasty Tech Fee Ledger**: Logs tech fees for completed DealerFlow tasks to a commission ledger.
- **Department Queue Views**: Priority-sorted, age-ordered queues per department.
- **Performance Report**: Manager dashboard for tracking hours saved, efficiency, SLA compliance, and revenue impact.
- **Tenant Isolation**: All queries/updates scoped by `dealershipId` for secure data access.
- **AI Vision OCR Intake**: AI Vision LLM extracts text from dealership documents for auto-classification and task creation.
- **In-Task Customer Communication**: Send customer updates directly from tasks, with communication logged.
- **GM Velocity Dashboard**: Dealership-wide velocity metrics, bottleneck detection, and daily throughput.
- **Bird-Dog Referral Tracker**: Cross-department referral tracking and invisible monetization capture.
- **Cross-Department Approval Engine**: Manages approval workflows for tasks, pausing SLA timers during approval waits.
- **Internal/External Task Classification**: Auto-classifies tasks and pauses SLA timers for external dependencies.
- **Proactive Next-Step Suggestions**: AI-driven routing suggestions based on workflow patterns.
- **Pipeline Journey Visualization**: Visualizes department-to-department task flow.
- **Approval Queue**: Real-time list of tasks awaiting manager approval.
- **Deal Lifecycle Engine**: Manages car sales deals as parent containers, auto-generating sub-tasks across the 7-Agent Mesh with a dependency-aware DAG execution chain.
- **Dependency-Aware DAG Execution**: Tasks have `dependsOnTaskId` (self-referential FK) forming a strict dependency chain. Blocked tasks auto-unlock when predecessors complete, with SLA timers starting on unlock. Visual dependency map in Deal Detail, blocker chain in commission tracker, and lock badges in Task Board.
- **My Deals — Commission Tracker**: Salesperson dashboard for real-time earnings and commission tracking with dependency chain visibility showing exactly which tasks block payout.
- **Deal Board**: UI for full deal lifecycle management, including commission approval and payment.
- **Global Search**: Unified search across Deals and Tasks.
- **Auto-Status Customer Updates**: Automated customer notifications upon task completion.
- **Store P&L Manager Dashboard**: Real-time macro-view for managers on revenue, profit, and commission.
- **Autonomous Execution Protocol**: AI confidence scoring per task (based on routing confidence, OCR confidence, scope, priority, retries), with auto-escalation when confidence drops below 85% or SLA breaches occur. Retry mechanism with max 3 attempts before forced escalation. Dashboard shows AI Execution Rate vs Human-Assisted %, avg confidence, and blocked-by-DAG count.
- **Auto-Resume Protocol**: When human resolves an escalated task, AI reclaims execution with boosted confidence (0.95+), fresh SLA timer, and execution mode tagged as "Auto-Resumed". Seamless handoff back from human to autonomous flow.
- **Zero-Thought Guided Execution UI**: Hero "Active Step" card at top of each Deal Detail showing the single next action with confidence badge, execution mode, and department. Escalated tasks panel with inline resolution controls. Per-task confidence badges, execution mode indicators (AI-Autonomous/Escalated/Human-Assisted/Auto-Resumed), and retry counters.
- **Zero-Trust Delegation Architecture**: Every task tracks `initiatorId`, `ownerId`, `authorizerId` with role-based state transition guards. Initiators cannot approve/execute their own submissions. Immutable audit log (`dealerflow_audit_log` table) records every status change with user, role, IP, and timestamp. Audit trail endpoint returns role-filtered data (Admin/Dealer see full details, others see base info).
- **Omni-Node Open Intake**: Public submission portal allowing anyone (lot attendants, detailers, customers, vendors, anonymous) to submit issues. Features: AI-powered smart routing, Jaccard-based duplicate detection (1hr window, >0.7 similarity), reliability scoring (tier + photo + description), 128-bit entropy tracking codes (`3CX-{timestamp}-{16hex}`), public status tracker (no auth required), and auto-audit-log on creation. Backend: POST `/omni-node/submit`, GET `/omni-node/track/:code`, GET `/omni-node/my-submissions`. Frontend: "Open Intake" tab (12th tab) in DealerFlow with Submit form and Track mode.
- **Web Dashboard**: 12-tab Industrial Command Center with various management and operational views.

## Architectural Upgrades

Recent upgrades include CarPlay/Android Auto integration, a tRPC Type-Safe API Layer, an Admin API, and a Beta Waitlist system.

# External Dependencies

-   **Monorepo Tool**: pnpm workspaces
-   **API Framework**: Express 5
-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **API Codegen**: Orval
-   **Build Tool**: esbuild
-   **Cloud/Deployment**: Replit, AWS
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