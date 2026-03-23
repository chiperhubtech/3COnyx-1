#!/usr/bin/env node
/**
 * 3C Onyx — CDK App Entry Point
 *
 * Deployment order (respects cross-stack dependencies):
 *   1. FoundationStack   — VPC, KMS, IAM baseline
 *   2. SecurityStack     — Secrets Manager, WAF, Shield
 *   3. DataStack         — DynamoDB (reputation ledger, DVP, wallet, audit)
 *   4. IntelligenceStack — Bedrock model access + knowledge bases
 *   5. ComputeStack      — 7-Agent Lambda Mesh + EventBridge bus
 *   6. WorkflowStack     — Step Functions (Temporal-equivalent durable workflows)
 *   7. ApiStack          — API Gateway v2 + Cognito + usage plans
 *   8. MonitoringStack   — CloudWatch dashboards, alarms, X-Ray, SNS alerts
 *
 * One-command deploy:
 *   npx cdk deploy --all --require-approval never --profile 3c-corp
 */

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Config } from "../lib/config";
import { FoundationStack }   from "../lib/stacks/foundation-stack";
import { SecurityStack }     from "../lib/stacks/security-stack";
import { DataStack }         from "../lib/stacks/data-stack";
import { IntelligenceStack } from "../lib/stacks/intelligence-stack";
import { ComputeStack }      from "../lib/stacks/compute-stack";
import { WorkflowStack }     from "../lib/stacks/workflow-stack";
import { ApiStack }          from "../lib/stacks/api-stack";
import { MonitoringStack }   from "../lib/stacks/monitoring-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: Config.account,
  region:  Config.region,
};

/** Apply organisation-wide billing tags to every resource */
function tagStack(stack: cdk.Stack): void {
  Object.entries(Config.tags).forEach(([k, v]) => cdk.Tags.of(stack).add(k, v));
}

// ── Stack 1: Foundation ──────────────────────────────────────────────────────
const foundation = new FoundationStack(app, "3C-Foundation", { env });
tagStack(foundation);

// ── Stack 2: Security ────────────────────────────────────────────────────────
const security = new SecurityStack(app, "3C-Security", {
  env,
  encryptionKey: foundation.encryptionKey,
  vpc:           foundation.vpc,
});
tagStack(security);

// ── Stack 3: Data ────────────────────────────────────────────────────────────
const data = new DataStack(app, "3C-Data", {
  env,
  encryptionKey: foundation.encryptionKey,
});
tagStack(data);

// ── Stack 4: Intelligence (Bedrock) ──────────────────────────────────────────
const intelligence = new IntelligenceStack(app, "3C-Intelligence", {
  env,
  agentTaskQueue: data.agentTaskQueue,
});
tagStack(intelligence);

// ── Stack 5: Compute (7-Agent Lambda Mesh) ───────────────────────────────────
const compute = new ComputeStack(app, "3C-Compute", {
  env,
  vpc:                   foundation.vpc,
  encryptionKey:         foundation.encryptionKey,
  stripeSecret:          security.stripeSecret,
  browserbaSecretSecret: security.browserbaseSecret,
  gumloopSecret:         security.gumloopSecret,
  marketcheckSecret:     security.marketcheckSecret,
  checkrSecret:          security.checkrSecret,
  smartcarSecret:        security.smartcarSecret,
  hypertrackSecret:      security.hypertrackSecret,
  geminiSecret:          security.geminiSecret,
  plaidSecret:           security.plaidSecret,
  reputationTable:       data.reputationLedger,
  vehiclePassportTable:  data.vehiclePassports,
  walletTable:           data.dynastyWallet,
  auditTable:            data.auditVault,
  agentTaskQueue:        data.agentTaskQueue,
  subscriptionsTable:    data.subscriptions,
});
tagStack(compute);

// ── Stack 6: Workflows (Step Functions — Temporal equivalent) ─────────────────
const workflows = new WorkflowStack(app, "3C-Workflows", {
  env,
  guardianFn:     compute.guardianFn,
  conciergeFn:    compute.conciergeFn,
  marketcheckFn:  compute.marketcheckFn,
  checkrFn:       compute.checkrFn,
  smartcarFn:     compute.smartcarFn,
  stripeFn:       compute.stripeFn,
  hypertrackFn:   compute.hypertrackFn,
  walletTable:    data.dynastyWallet,
  auditTable:     data.auditVault,
});
tagStack(workflows);

// ── Stack 7: API Gateway ──────────────────────────────────────────────────────
const api = new ApiStack(app, "3C-Api", {
  env,
  guardianFn:         compute.guardianFn,
  conciergeFn:        compute.conciergeFn,
  marketcheckFn:      compute.marketcheckFn,
  checkrFn:           compute.checkrFn,
  smartcarFn:         compute.smartcarFn,
  stripeFn:           compute.stripeFn,
  hypertrackFn:       compute.hypertrackFn,
  vehiclePassportFn:  compute.vehiclePassportFn,
  walletFn:           compute.walletFn,
  reputationFn:       compute.reputationFn,
  repairWorkflowArn:  workflows.repairWorkflowArn,
  purchaseWorkflowArn: workflows.purchaseWorkflowArn,
  subscriptionWorkflowArn: workflows.subscriptionWorkflowArn,
});
tagStack(api);

// ── Stack 8: Monitoring ───────────────────────────────────────────────────────
const monitoring = new MonitoringStack(app, "3C-Monitoring", {
  env,
  api:               api.httpApi,
  guardianFn:        compute.guardianFn,
  conciergeFn:       compute.conciergeFn,
  reputationTable:   data.reputationLedger,
  walletTable:       data.dynastyWallet,
  repairWorkflow:    workflows.repairStateMachine,
  purchaseWorkflow:  workflows.purchaseStateMachine,
});
tagStack(monitoring);

app.synth();
