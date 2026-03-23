import * as cdk        from "aws-cdk-lib";
import * as ec2        from "aws-cdk-lib/aws-ec2";
import * as kms        from "aws-cdk-lib/aws-kms";
import * as lambda     from "aws-cdk-lib/aws-lambda";
import * as sm         from "aws-cdk-lib/aws-secretsmanager";
import * as ddb        from "aws-cdk-lib/aws-dynamodb";
import * as events     from "aws-cdk-lib/aws-events";
import * as targets    from "aws-cdk-lib/aws-events-targets";
import * as sqs        from "aws-cdk-lib/aws-sqs";
import { Construct }   from "constructs";
import { Config }      from "../config";
import { AgentLambda } from "../constructs/agent-lambda";

interface ComputeStackProps extends cdk.StackProps {
  vpc:                    ec2.Vpc;
  encryptionKey:          kms.Key;
  stripeSecret:           sm.Secret;
  browserbaSecretSecret:  sm.Secret;
  gumloopSecret:          sm.Secret;
  marketcheckSecret:      sm.Secret;
  checkrSecret:           sm.Secret;
  smartcarSecret:         sm.Secret;
  hypertrackSecret:       sm.Secret;
  geminiSecret:           sm.Secret;
  plaidSecret:            sm.Secret;
  reputationTable:        ddb.Table;
  vehiclePassportTable:   ddb.Table;
  walletTable:            ddb.Table;
  auditTable:             ddb.Table;
  agentTaskQueue:         ddb.Table;
  subscriptionsTable:     ddb.Table;
}

/**
 * ComputeStack — 7-Agent Lambda Mesh
 * ────────────────────────────────────
 * Each agent is a separate Lambda function, giving independent:
 *  • Scaling — Guardian scales to 100 concurrent, others elastic
 *  • Deployments — hot-swap individual agents without downtime
 *  • IAM scopes — each agent has its own least-privilege role
 *  • Memory tuning — Concierge gets 2 GB for LLM streaming
 *
 *  Agent        Model                  Memory    Timeout   Goal-seeking
 *  ─────────────────────────────────────────────────────────────────────
 *  Guardian     claude-3-haiku         1024 MB   15 min    ✓ (V2X loop)
 *  Concierge    claude-3-5-sonnet      2048 MB   30 s      —
 *  MarketCheck  amazon.nova-pro        1024 MB   30 s      —
 *  Checkr       claude-3-haiku         512  MB   30 s      —
 *  Smartcar     amazon.nova-lite       512  MB   30 s      —
 *  Stripe       amazon.nova-lite       512  MB   30 s      —
 *  HyperTrack   amazon.nova-lite       1024 MB   30 s      —
 *
 *  Additional "router" lambdas:
 *  VehiclePassport, Wallet, Reputation  (thin CRUD — no LLM)
 *
 *  EventBridge bus "3c-agent-bus" fans out cross-agent events.
 */
export class ComputeStack extends cdk.Stack {
  // The 7 primary agents
  public readonly guardianFn:        lambda.Function;
  public readonly conciergeFn:       lambda.Function;
  public readonly marketcheckFn:     lambda.Function;
  public readonly checkrFn:          lambda.Function;
  public readonly smartcarFn:        lambda.Function;
  public readonly stripeFn:          lambda.Function;
  public readonly hypertrackFn:      lambda.Function;
  // Router lambdas
  public readonly vehiclePassportFn: lambda.Function;
  public readonly walletFn:          lambda.Function;
  public readonly reputationFn:      lambda.Function;
  // Shared EventBridge bus
  public readonly agentBus:          events.EventBus;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const {
      vpc, encryptionKey,
      stripeSecret, browserbaSecretSecret, gumloopSecret,
      marketcheckSecret, checkrSecret, smartcarSecret,
      hypertrackSecret, geminiSecret, plaidSecret,
      reputationTable, vehiclePassportTable, walletTable,
      auditTable, agentTaskQueue, subscriptionsTable,
    } = props;

    // Common DynamoDB tables every agent can read/write
    const coreTables = [auditTable, agentTaskQueue];

    // ── EventBridge Bus — cross-agent event fabric ────────────────────────────
    this.agentBus = new events.EventBus(this, "AgentBus", {
      eventBusName: `${Config.appName}-agent-bus`,
    });

    // ── Dead-Letter Queue (shared) ─────────────────────────────────────────────
    const dlq = new sqs.Queue(this, "AgentDlq", {
      queueName:    `${Config.appName}-agent-dlq`,
      encryptionMasterKey: encryptionKey,
      retentionPeriod:     cdk.Duration.days(14),
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 1 — GUARDIAN V2X (Goal-Seeking, 15-min, 100 reserved concurrency)
    // ═══════════════════════════════════════════════════════════════════════════
    const guardian = new AgentLambda(this, "Guardian", {
      agentName:    "Guardian",
      handlerPath:  "guardian",
      vpc,
      encryptionKey,
      memoryMb:     1024,
      goalSeeking:  true,    // continuous V2X threat-assessment loop
      secrets:      [smartcarSecret, geminiSecret],
      tables:       [...coreTables, vehiclePassportTable, reputationTable],
      bedrockModels: [Config.bedrock.guardianModelId],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.guardianFn = guardian.fn;
    this.agentBus.grantPutEventsTo(guardian.fn);

    // EventBridge rule: Smartcar telemetry → Guardian every 60 s
    new events.Rule(this, "SmartcarToGuardian", {
      schedule:    events.Schedule.rate(cdk.Duration.minutes(1)),
      description: "Pulse Guardian V2X agent with latest telemetry",
      targets:     [new targets.LambdaFunction(guardian.fn, { deadLetterQueue: dlq })],
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 2 — CONCIERGE (Gemini AI / Bedrock NLP)
    // ═══════════════════════════════════════════════════════════════════════════
    const concierge = new AgentLambda(this, "Concierge", {
      agentName:    "Concierge",
      handlerPath:  "concierge",
      vpc,
      encryptionKey,
      memoryMb:     2048,   // LLM streaming needs more RAM
      timeoutSec:   30,
      secrets:      [geminiSecret, gumloopSecret, browserbaSecretSecret],
      tables:       [...coreTables, reputationTable],
      bedrockModels: [Config.bedrock.conciergeModelId, Config.bedrock.guardianModelId],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.conciergeFn = concierge.fn;
    this.agentBus.grantPutEventsTo(concierge.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 3 — MARKETCHECK WHOLESALE ENGINE
    // ═══════════════════════════════════════════════════════════════════════════
    const marketcheck = new AgentLambda(this, "MarketCheck", {
      agentName:    "MarketCheck",
      handlerPath:  "marketcheck",
      vpc,
      encryptionKey,
      secrets:      [marketcheckSecret, geminiSecret],
      tables:       [...coreTables, vehiclePassportTable],
      bedrockModels: [Config.bedrock.analysisModelId],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.marketcheckFn = marketcheck.fn;
    this.agentBus.grantPutEventsTo(marketcheck.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 4 — CHECKR BACKGROUND CHECK
    // ═══════════════════════════════════════════════════════════════════════════
    const checkr = new AgentLambda(this, "Checkr", {
      agentName:    "Checkr",
      handlerPath:  "checkr",
      vpc,
      encryptionKey,
      memoryMb:     512,
      secrets:      [checkrSecret, geminiSecret],
      tables:       [...coreTables, reputationTable],
      bedrockModels: [Config.bedrock.guardianModelId],   // haiku for report summarisation
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.checkrFn = checkr.fn;
    this.agentBus.grantPutEventsTo(checkr.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 5 — SMARTCAR CONNECTED VEHICLE
    // ═══════════════════════════════════════════════════════════════════════════
    const smartcar = new AgentLambda(this, "Smartcar", {
      agentName:    "Smartcar",
      handlerPath:  "smartcar",
      vpc,
      encryptionKey,
      memoryMb:     512,
      secrets:      [smartcarSecret],
      tables:       [...coreTables, vehiclePassportTable],
      bedrockModels: [Config.bedrock.analysisModelId],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.smartcarFn = smartcar.fn;
    this.agentBus.grantPutEventsTo(smartcar.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 6 — STRIPE DYNASTY PAYMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    const stripe = new AgentLambda(this, "Stripe", {
      agentName:    "Stripe",
      handlerPath:  "stripe",
      vpc,
      encryptionKey,
      memoryMb:     512,
      secrets:      [stripeSecret, plaidSecret],
      tables:       [...coreTables, walletTable, subscriptionsTable],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.stripeFn = stripe.fn;
    this.agentBus.grantPutEventsTo(stripe.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 7 — HYPERTRACK DELIVERY INTELLIGENCE
    // ═══════════════════════════════════════════════════════════════════════════
    const hypertrack = new AgentLambda(this, "HyperTrack", {
      agentName:    "HyperTrack",
      handlerPath:  "hypertrack",
      vpc,
      encryptionKey,
      secrets:      [hypertrackSecret],
      tables:       [...coreTables, vehiclePassportTable],
      bedrockModels: [Config.bedrock.analysisModelId],
      environment: {
        AGENT_BUS_NAME: this.agentBus.eventBusName,
      },
    });
    this.hypertrackFn = hypertrack.fn;
    this.agentBus.grantPutEventsTo(hypertrack.fn);

    // ═══════════════════════════════════════════════════════════════════════════
    // Router Lambdas (thin CRUD — no LLM, no VPC needed for speed)
    // ═══════════════════════════════════════════════════════════════════════════
    const routerDefaults = {
      runtime:      lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize:   256,
      timeout:      cdk.Duration.seconds(10),
      tracing:      lambda.Tracing.ACTIVE,
      environment: {
        STAGE:                    Config.stage,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        REPUTATION_TABLE:         reputationTable.tableName,
        DVP_TABLE:                vehiclePassportTable.tableName,
        WALLET_TABLE:             walletTable.tableName,
      },
    } satisfies Partial<lambda.FunctionProps>;

    this.vehiclePassportFn = new lambda.Function(this, "VehiclePassportRouter", {
      ...routerDefaults,
      functionName: `${Config.appName}-vehicle-passport-router`,
      code:         lambda.Code.fromInline(dvpRouterCode),
      handler:      "index.handler",
    });
    vehiclePassportTable.grantReadWriteData(this.vehiclePassportFn);
    auditTable.grantWriteData(this.vehiclePassportFn);

    this.walletFn = new lambda.Function(this, "WalletRouter", {
      ...routerDefaults,
      functionName: `${Config.appName}-wallet-router`,
      code:         lambda.Code.fromInline(walletRouterCode),
      handler:      "index.handler",
    });
    walletTable.grantReadWriteData(this.walletFn);
    auditTable.grantWriteData(this.walletFn);
    stripeSecret.grantRead(this.walletFn);

    this.reputationFn = new lambda.Function(this, "ReputationRouter", {
      ...routerDefaults,
      functionName: `${Config.appName}-reputation-router`,
      code:         lambda.Code.fromInline(reputationRouterCode),
      handler:      "index.handler",
    });
    reputationTable.grantReadWriteData(this.reputationFn);

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "GuardianFnArn",   { value: this.guardianFn.functionArn,   exportName: "3c-guardian-fn"    });
    new cdk.CfnOutput(this, "ConciergeFnArn",  { value: this.conciergeFn.functionArn,  exportName: "3c-concierge-fn"   });
    new cdk.CfnOutput(this, "AgentBusName",    { value: this.agentBus.eventBusName,    exportName: "3c-agent-bus"      });
  }
}

// ── Inline router stubs (replaced with file-based handlers in production) ─────
const dvpRouterCode = `
exports.handler = async (event) => {
  const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
  const db = new DynamoDBClient({});
  const method = event.requestContext?.http?.method ?? event.httpMethod;
  const vin    = event.pathParameters?.vin;
  if (method === 'GET' && vin) {
    const res = await db.send(new QueryCommand({
      TableName: process.env.DVP_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': { S: 'VIN#' + vin } },
    }));
    return { statusCode: 200, body: JSON.stringify(res.Items) };
  }
  if (method === 'POST') {
    const body  = JSON.parse(event.body ?? '{}');
    const now   = new Date().toISOString();
    await db.send(new PutItemCommand({
      TableName: process.env.DVP_TABLE,
      Item: {
        pk:        { S: 'VIN#' + body.vin },
        sk:        { S: 'EVENT#' + now },
        eventType: { S: body.eventType ?? 'UNKNOWN' },
        data:      { S: JSON.stringify(body) },
        createdAt: { S: now },
      },
    }));
    return { statusCode: 201, body: JSON.stringify({ ok: true }) };
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
};
`;

const walletRouterCode = `
exports.handler = async (event) => {
  const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
  const db = new DynamoDBClient({});
  const memberId = event.pathParameters?.memberId ?? event.queryStringParameters?.memberId;
  if (!memberId) return { statusCode: 400, body: 'memberId required' };
  const res = await db.send(new QueryCommand({
    TableName: process.env.WALLET_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': { S: 'WALLET#' + memberId } },
    ScanIndexForward: false,
    Limit: 50,
  }));
  return { statusCode: 200, body: JSON.stringify(res.Items) };
};
`;

const reputationRouterCode = `
exports.handler = async (event) => {
  const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
  const db = new DynamoDBClient({});
  const memberId = event.pathParameters?.memberId ?? event.queryStringParameters?.memberId;
  if (!memberId) return { statusCode: 400, body: 'memberId required' };
  const res = await db.send(new QueryCommand({
    TableName: process.env.REPUTATION_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': { S: 'MEMBER#' + memberId } },
    ScanIndexForward: false,
    Limit: 100,
  }));
  return { statusCode: 200, body: JSON.stringify(res.Items) };
};
`;
