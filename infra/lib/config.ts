/**
 * 3C Onyx — Global CDK Configuration
 * All environment, account, and scaling parameters live here.
 * Deploy with: npx cdk deploy --all --profile 3c-corp
 */

export const Config = {
  /** ── Corporate AWS Account (linked to EIN) ── */
  account: process.env.CDK_DEFAULT_ACCOUNT ?? "REPLACE_WITH_CORPORATE_ACCOUNT_ID",
  region:  process.env.CDK_DEFAULT_REGION  ?? "us-east-1",

  /** ── Product Identity ── */
  appName:    "3c-onyx",
  orgPrefix:  "cuxtomcandyclub",   // matches EIN/trade name
  stage:      (process.env.STAGE ?? "prod") as "dev" | "staging" | "prod",

  /**
   * I-95 Corridor Deployment Regions — ordered by priority.
   * us-east-1 is primary; us-east-2 is warm standby.
   * Add us-west-2 for national expansion at 500k+ users.
   */
  regions: {
    primary:  "us-east-1",   // New York / Miami I-95 Spine
    failover: "us-east-2",   // Ohio warm DR
    west:     "us-west-2",   // West Coast (Phase 2 — 500k users)
  },

  /** ── Scale Targets ── */
  scale: {
    targetUsers:       1_000_000,
    peakRps:           10_000,
    lambdaMemoryMb:    1024,
    lambdaTimeoutSec:  30,
    agentTimeoutSec:   900,   // 15 min max for long-running agents
    dynamoReadCap:     1000,
    dynamoWriteCap:    500,
  },

  /** ── Tags (billing + trade-reference) ── */
  tags: {
    Project:       "3C-Onyx",
    Organization:  "CuxtomCandyClub",
    CostCenter:    "AGENTIC-OS",
    Stage:         process.env.STAGE ?? "prod",
    "terraform:managed": "false",
    "cdk:version":  "2.x",
  },

  /** ── Bedrock Model IDs ── */
  bedrock: {
    conciergeModelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    guardianModelId:  "anthropic.claude-3-haiku-20240307-v1:0",  // low-latency for V2X
    analysisModelId:  "amazon.nova-pro-v1:0",
  },

  /** ── DynamoDB Table Names ── */
  tables: {
    reputationLedger:    "3c-reputation-ledger",
    vehiclePassports:    "3c-digital-vehicle-passports",
    dynastyWallet:       "3c-dynasty-wallet",
    auditVault:          "3c-soc2-audit-vault",
    agentTaskQueue:      "3c-agent-task-queue",
    subscriptions:       "3c-member-subscriptions",
  },

  /** ── Secret Names in Secrets Manager ── */
  secrets: {
    stripe:       "3c/prod/stripe",
    browserbase:  "3c/prod/browserbase",
    gumloop:      "3c/prod/gumloop",
    marketcheck:  "3c/prod/marketcheck",
    checkr:       "3c/prod/checkr",
    smartcar:     "3c/prod/smartcar",
    hypertrack:   "3c/prod/hypertrack",
    geminiAi:     "3c/prod/gemini-ai",
    plaid:        "3c/prod/plaid",
    superagi:     "3c/prod/superagi",
  },
} as const;

export type Stage = typeof Config.stage;
