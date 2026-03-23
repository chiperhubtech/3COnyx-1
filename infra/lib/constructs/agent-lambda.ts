import * as cdk          from "aws-cdk-lib";
import * as ec2          from "aws-cdk-lib/aws-ec2";
import * as kms          from "aws-cdk-lib/aws-kms";
import * as lambda       from "aws-cdk-lib/aws-lambda";
import * as logs         from "aws-cdk-lib/aws-logs";
import * as iam          from "aws-cdk-lib/aws-iam";
import * as sm           from "aws-cdk-lib/aws-secretsmanager";
import * as ddb          from "aws-cdk-lib/aws-dynamodb";
import { Construct }     from "constructs";
import * as path         from "path";
import { Config }        from "../config";

export interface AgentLambdaProps {
  /** Human-readable agent name — used in CloudWatch metrics + log group names */
  agentName:     string;
  /** Path relative to infra/lib/lambda/agents/<handler> */
  handlerPath:   string;
  /** Handler entry point (e.g. "index.handler") */
  handler?:      string;
  /** Memory allocation — override for heavy agents like Concierge */
  memoryMb?:     number;
  /** Timeout — override for long-running agentic loops */
  timeoutSec?:   number;
  /** Additional environment variables injected at deploy time */
  environment?:  Record<string, string>;
  /** VPC private subnet placement */
  vpc:           ec2.Vpc;
  /** CMK for log group encryption */
  encryptionKey: kms.Key;
  /** Secrets to grant GetSecretValue on (auto-injected as env ARN refs) */
  secrets?:      sm.Secret[];
  /** DynamoDB tables to grant read/write on */
  tables?:       ddb.Table[];
  /** Bedrock model IDs this agent may invoke */
  bedrockModels?: string[];
  /**
   * Goal-seeking: when true, the lambda has a 15-min timeout and receives
   * an SQS-triggered loop allowing it to re-queue itself until task resolution.
   */
  goalSeeking?:  boolean;
}

/**
 * AgentLambda
 * ───────────
 * Reusable CDK construct wrapping a Node.js Lambda function with:
 *  • VPC private-subnet placement (no public IP)
 *  • Structured JSON logging → CloudWatch log group (encrypted, 1-year retention)
 *  • X-Ray active tracing
 *  • Least-privilege IAM: only grants Bedrock/DynamoDB/Secrets for what's declared
 *  • ARM64 Graviton2 runtime (40% cheaper, lower latency vs x86)
 *  • Goal-seeking mode: extended timeout + self-requeue capability
 */
export class AgentLambda extends Construct {
  public readonly fn:       lambda.Function;
  public readonly logGroup: logs.LogGroup;
  public readonly role:     iam.Role;

  constructor(scope: Construct, id: string, props: AgentLambdaProps) {
    super(scope, id);

    const {
      agentName,
      handlerPath,
      handler      = "index.handler",
      memoryMb     = Config.scale.lambdaMemoryMb,
      timeoutSec   = props.goalSeeking
                       ? Config.scale.agentTimeoutSec
                       : Config.scale.lambdaTimeoutSec,
      environment  = {},
      vpc,
      encryptionKey,
      secrets      = [],
      tables       = [],
      bedrockModels = [],
      goalSeeking  = false,
    } = props;

    // ── Dedicated log group (encrypted, 1-year retention) ────────────────────
    this.logGroup = new logs.LogGroup(scope, `${id}LogGroup`, {
      logGroupName:  `/3c-onyx/agents/${agentName.toLowerCase()}`,
      retention:     logs.RetentionDays.ONE_YEAR,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── IAM execution role ────────────────────────────────────────────────────
    this.role = new iam.Role(scope, `${id}Role`, {
      roleName:  `${Config.appName}-agent-${agentName.toLowerCase()}-role`,
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole",
        ),
      ],
    });

    // CloudWatch logs
    this.logGroup.grantWrite(this.role);

    // X-Ray tracing
    this.role.addToPolicy(new iam.PolicyStatement({
      actions:   ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
      resources: ["*"],
    }));

    // Bedrock model invocations (only the declared models)
    if (bedrockModels.length > 0) {
      this.role.addToPolicy(new iam.PolicyStatement({
        sid:     `BedrockInvoke${agentName}`,
        actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream", "bedrock:Retrieve"],
        resources: bedrockModels.map(
          m => `arn:aws:bedrock:${cdk.Stack.of(scope).region}::foundation-model/${m}`,
        ).concat(["*"]),  // "*" needed for knowledge base retrieval
      }));
    }

    // DynamoDB table grants
    tables.forEach(t => t.grantReadWriteData(this.role));

    // Secret access grants — inject ARN as env var automatically
    const secretEnv: Record<string, string> = {};
    secrets.forEach(s => {
      s.grantRead(this.role);
      const envKey = s.secretName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase() + "_ARN";
      secretEnv[envKey] = s.secretArn;
    });

    // ── Lambda function ───────────────────────────────────────────────────────
    this.fn = new lambda.Function(scope, `${id}Fn`, {
      functionName: `${Config.appName}-agent-${agentName.toLowerCase()}`,
      runtime:      lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,          // Graviton2 — cost-optimised
      code:         lambda.Code.fromAsset(
        path.join(__dirname, "..", "lambda", "agents", handlerPath),
      ),
      handler,
      role:        this.role,
      memorySize:  memoryMb,
      timeout:     cdk.Duration.seconds(timeoutSec),
      tracing:     lambda.Tracing.ACTIVE,                // X-Ray
      logGroup:    this.logGroup,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        AGENT_NAME:       agentName,
        GOAL_SEEKING:     goalSeeking ? "true" : "false",
        STAGE:            Config.stage,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",        // SDK connection pooling
        POWERTOOLS_SERVICE_NAME:  agentName,
        POWERTOOLS_LOG_LEVEL:     "INFO",
        CONCIERGE_MODEL_ID:       Config.bedrock.conciergeModelId,
        GUARDIAN_MODEL_ID:        Config.bedrock.guardianModelId,
        ANALYSIS_MODEL_ID:        Config.bedrock.analysisModelId,
        ...secretEnv,
        ...environment,
      },
      // Reserved concurrency: Guardian gets 100, others share pool
      reservedConcurrentExecutions: agentName === "Guardian" ? 100 : undefined,
    });

    // ── Goal-seeking: allow lambda to re-invoke itself ────────────────────────
    if (goalSeeking) {
      this.fn.addToRolePolicy(new iam.PolicyStatement({
        sid:       `SelfInvoke${agentName}`,
        actions:   ["lambda:InvokeFunction"],
        resources: [this.fn.functionArn],
      }));
    }
  }
}
