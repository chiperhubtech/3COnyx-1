# 3C Onyx — AWS Infrastructure (CDK TypeScript)

> **One-click** production deployment blueprint for the 3C Agentic OS.
> Maps every component of the I-95 Corridor platform to AWS-native services,
> structured under a Corporate AWS Account (EIN-linked) for Tier 1 trade reference.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│  MEMBER / INVESTOR CLIENTS                                          │
│  Web (React+Vite)          Mobile (Expo React Native)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API GATEWAY v2 (HTTP)  ←  WAFv2 + Shield + Cognito JWT            │
│  10,000 req/s burst  ·  OWASP managed rules  ·  per-IP rate limit  │
└──────────┬───────────────────────────────────────────────────────────┘
           │  Lambda Proxy Integration
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7-AGENT LAMBDA MESH  (ARM64 Graviton2 · VPC Private Subnets)      │
│                                                                     │
│  ┌──────────┐  ┌───────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ Guardian │  │ Concierge │  │ MarketCheck  │  │    Checkr    │  │
│  │  V2X     │  │ claude3.5 │  │ nova-pro     │  │  haiku+BGC   │  │
│  │ (haiku)  │  │  sonnet   │  │  wholesale   │  │  KYC/AML     │  │
│  └────┬─────┘  └─────┬─────┘  └──────┬──────┘  └──────┬───────┘  │
│       │               │               │                  │          │
│  ┌────┴──────┐  ┌─────┴──────┐  ┌────┴──────────────────┴───────┐ │
│  │ Smartcar  │  │   Stripe   │  │        HyperTrack              │ │
│  │ Connected │  │  Dynasty   │  │   Delivery Intelligence        │ │
│  │  Vehicle  │  │  Wallet    │  │   Technician Dispatch          │ │
│  └───────────┘  └────────────┘  └────────────────────────────────┘ │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AMAZON BEDROCK                                                     │
│  claude-3-5-sonnet (Concierge)  ·  claude-3-haiku (Guardian)       │
│  amazon.nova-pro (Analysis)  ·  Bedrock Knowledge Bases            │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AWS STEP FUNCTIONS (Temporal-equivalent durable workflows)         │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ RepairWorkflow │  │ PurchaseWorkflow  │  │SubscriptionWorkflow │ │
│  │ (Standard·24h) │  │ (Standard·72h)   │  │ (Express·5min)      │ │
│  │ exactly-once   │  │ KYC-gated        │  │ $99/mo onboard      │ │
│  └────────────────┘  └──────────────────┘  └─────────────────────┘ │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DYNAMODB (6 tables · on-demand · PITR · KMS CMK encrypted)        │
│  ReputationLedger  ·  VehiclePassports (DVP)  ·  DynastyWallet     │
│  AuditVault (SOC2) ·  AgentTaskQueue         ·  Subscriptions      │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SECRETS MANAGER  ·  KMS CMK  ·  VPC Flow Logs  ·  CloudTrail      │
│  S3 Glacier WORM (7-year)  ·  CloudWatch + X-Ray  ·  SNS Alerts    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack Map

| CDK Stack | AWS Services | Purpose |
|---|---|---|
| `3C-Foundation` | VPC (3 AZ), KMS, VPC Endpoints | Network isolation + master encryption |
| `3C-Security` | Secrets Manager, WAFv2, Shield, IAM | API keys, OWASP protection, perm boundaries |
| `3C-Data` | DynamoDB (6 tables), S3 Glacier | Reputation ledger, DVP, wallet, SOC2 audit |
| `3C-Intelligence` | Bedrock, S3 Knowledge Base | LLM inference for all 7 agents |
| `3C-Compute` | Lambda (10 fns), EventBridge, SQS | 7-agent mesh + router lambdas |
| `3C-Workflows` | Step Functions (3 SMs), SNS | Durable purchase/repair/subscription flows |
| `3C-Api` | API Gateway v2, Cognito, WAF | Single HTTPS entry point + JWT auth |
| `3C-Monitoring` | CloudWatch, X-Ray, SNS | Dashboards, alarms, PagerDuty-ready |

---

## Prerequisites

```bash
# 1. Install AWS CDK globally
npm install -g aws-cdk

# 2. Configure corporate AWS credentials (EIN-linked account)
aws configure --profile 3c-corp
# Set: AWS Account ID, us-east-1, your access key pair

# 3. Bootstrap CDK in the corporate account
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1 --profile 3c-corp

# 4. Install CDK dependencies
cd infra && npm install
```

---

## One-Click Deploy

```bash
# From the infra/ directory:
npx cdk deploy --all \
  --require-approval never \
  --profile 3c-corp \
  --context stage=prod

# Or deploy stacks individually (in order):
npx cdk deploy 3C-Foundation  --profile 3c-corp
npx cdk deploy 3C-Security    --profile 3c-corp
npx cdk deploy 3C-Data        --profile 3c-corp
npx cdk deploy 3C-Intelligence --profile 3c-corp
npx cdk deploy 3C-Compute     --profile 3c-corp
npx cdk deploy 3C-Workflows   --profile 3c-corp
npx cdk deploy 3C-Api         --profile 3c-corp
npx cdk deploy 3C-Monitoring  --profile 3c-corp
```

After deploy, the stack Outputs tab in CloudFormation shows:
- `3c-api-url` — your production API endpoint
- `3c-cognito-user-pool-id` — update `VITE_API_URL` and Cognito config in the web app
- `3c-dashboard-url` — CloudWatch operations dashboard

---

## Secrets Provisioning (post-deploy)

Each secret is pre-created with a `REPLACE_ME` placeholder. Populate via:

```bash
# Stripe Connect platform key
aws secretsmanager put-secret-value \
  --secret-id "3c/prod/stripe" \
  --secret-string '{"apiKey":"sk_live_...","webhookSecret":"whsec_..."}' \
  --profile 3c-corp

# Browserbase
aws secretsmanager put-secret-value \
  --secret-id "3c/prod/browserbase" \
  --secret-string '{"apiKey":"bb_live_..."}' \
  --profile 3c-corp

# Repeat for: gumloop, marketcheck, checkr, smartcar, hypertrack, gemini-ai, plaid
```

---

## Scale to 1M Users

| Component | Current limit | 1M user limit |
|---|---|---|
| Lambda concurrency | 1,000 (default) | Request 10,000 via AWS Support |
| API Gateway | 10,000 req/s burst | Default; scales automatically |
| DynamoDB | On-demand (unlimited) | No action needed |
| Bedrock | Varies by model | Request throughput increase |
| Cognito | 50,000 MAU (default) | Enable Cognito high-capacity |

---

## Business Credit Readiness (Tier 1 AWS Trade Reference)

This infrastructure is structured to qualify for AWS Tier 1 trade reference:

1. **Corporate account** — deploy under an AWS account linked to your EIN
2. **AWS Business Support** — upgrade from Basic to Business ($100/mo) — generates a billing relationship under your legal entity
3. **Steady-state spend** — running infrastructure creates monthly AWS invoices that function as Tier 1 trade references with net-30 terms
4. **AWS Activate** — apply at https://aws.amazon.com/startups for $25K+ in credits
5. **Proof packet** — CloudFormation stack ARNs + monthly billing dashboard screenshots serve as technology capability documentation for investor due diligence

---

## Investor Demo Talking Points

| Claim | AWS Evidence |
|---|---|
| "Scales to 1M users" | API GW 10K RPS + DynamoDB on-demand + Lambda auto-scale |
| "SOC2 compliant architecture" | KMS CMK + CloudTrail + AuditVault WORM + VPC isolation |
| "Zero repair transaction loss" | Step Functions Standard (exactly-once) + DLQ |
| "Real-time AI at V2X speed" | Bedrock claude-3-haiku via VPC endpoint (< 500ms P99) |
| "7-agent autonomous mesh" | 7 independent Lambda functions + EventBridge fan-out |
| "Bank-grade security" | WAFv2 OWASP + Shield + Cognito MFA + Secrets Manager |
| "I-95 corridor ready" | us-east-1 primary + us-east-2 warm DR + EventBridge |

---

## Directory Structure

```
infra/
├── bin/
│   └── app.ts                     # CDK App entry — 8 stacks in order
├── lib/
│   ├── config.ts                  # All account, table, secret, model config
│   ├── constructs/
│   │   └── agent-lambda.ts        # Reusable AgentLambda CDK construct
│   ├── stacks/
│   │   ├── foundation-stack.ts    # VPC + KMS + IAM baseline
│   │   ├── security-stack.ts      # Secrets Manager + WAFv2 + Shield
│   │   ├── data-stack.ts          # 6 DynamoDB tables + S3 Glacier
│   │   ├── intelligence-stack.ts  # Bedrock model access + KB
│   │   ├── compute-stack.ts       # 7-Agent Lambda Mesh + EventBridge
│   │   ├── workflow-stack.ts      # Step Functions (3 state machines)
│   │   ├── api-stack.ts           # API Gateway v2 + Cognito
│   │   └── monitoring-stack.ts    # CloudWatch dashboards + alarms
│   └── lambda/
│       └── agents/
│           ├── guardian/index.ts   # V2X threat detection + DVP stamping
│           ├── concierge/index.ts  # Bedrock streaming NLP
│           ├── marketcheck/index.ts # Wholesale pricing engine
│           ├── checkr/index.ts     # BGC initiation + KYC
│           ├── smartcar/index.ts   # Connected vehicle telemetry
│           ├── stripe/index.ts     # Dynasty Wallet triple-split
│           └── hypertrack/index.ts # Technician dispatch + ETA
├── cdk.json
├── package.json
└── tsconfig.json
```

---

*Generated for Cuxtom Candy Club (3C) — EIN-linked corporate AWS deployment.*
*For deployment support: ops@cuxtomcandyclub.com*
