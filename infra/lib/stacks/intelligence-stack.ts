import * as cdk        from "aws-cdk-lib";
import * as ddb        from "aws-cdk-lib/aws-dynamodb";
import * as iam        from "aws-cdk-lib/aws-iam";
import * as logs       from "aws-cdk-lib/aws-logs";
import * as s3         from "aws-cdk-lib/aws-s3";
import { Construct }   from "constructs";
import { Config }      from "../config";

interface IntelligenceStackProps extends cdk.StackProps {
  agentTaskQueue: ddb.Table;
}

/**
 * IntelligenceStack
 * ─────────────────
 * Provisions all Amazon Bedrock resources powering the 7-Agent Mesh.
 *
 *  Agent              Model                               Use-case
 *  ─────────────────────────────────────────────────────────────────────────
 *  Guardian           claude-3-haiku (low-latency)        V2X threat detection, real-time
 *  Concierge          claude-3-5-sonnet                   Member NLP, deal negotiation
 *  MarketCheck        amazon.nova-pro                     Wholesale pricing analysis
 *  Checkr BGC         claude-3-haiku                      BGC report summarisation
 *  Smartcar           amazon.nova-lite                    Vehicle telemetry interpretation
 *  Stripe             amazon.nova-lite                    Payment anomaly detection
 *  HyperTrack         amazon.nova-lite                    Delivery ETA + re-routing logic
 *
 *  Bedrock Knowledge Bases:
 *   KB-1: Vehicle Reputation Corpus  (from DynamoDB stream → S3 → Bedrock ingestion)
 *   KB-2: I-95 Regulatory Corpus     (static PDFs — DMV, NHTSA, insurance rules)
 */
export class IntelligenceStack extends cdk.Stack {
  /** IAM role all Bedrock agents assume */
  public readonly bedrockExecutionRole: iam.Role;
  /** S3 bucket used as Bedrock Knowledge Base data source */
  public readonly knowledgeBaseBucket:  s3.Bucket;

  constructor(scope: Construct, id: string, props: IntelligenceStackProps) {
    super(scope, id, props);

    // ── Bedrock Agent Execution Role ──────────────────────────────────────────
    this.bedrockExecutionRole = new iam.Role(this, "BedrockAgentRole", {
      roleName:  `${Config.appName}-bedrock-agent-role`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("bedrock.amazonaws.com"),
        new iam.ServicePrincipal("lambda.amazonaws.com"),
      ),
    });

    // Bedrock foundation model invocation
    this.bedrockExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid:       "BedrockModelInvoke",
      actions:   ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/${Config.bedrock.conciergeModelId}`,
        `arn:aws:bedrock:${this.region}::foundation-model/${Config.bedrock.guardianModelId}`,
        `arn:aws:bedrock:${this.region}::foundation-model/${Config.bedrock.analysisModelId}`,
        // Titan embeddings for knowledge base ingestion
        `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
      ],
    }));

    // Bedrock Knowledge Base retrieval
    this.bedrockExecutionRole.addToPolicy(new iam.PolicyStatement({
      sid:       "BedrockKnowledgeBase",
      actions:   ["bedrock:Retrieve", "bedrock:RetrieveAndGenerate"],
      resources: ["*"],
    }));

    // Allow reading from DynamoDB task queue
    props.agentTaskQueue.grantReadWriteData(this.bedrockExecutionRole);

    // ── S3 Knowledge Base Source Bucket ──────────────────────────────────────
    this.knowledgeBaseBucket = new s3.Bucket(this, "KnowledgeBaseBucket", {
      bucketName:        `${Config.appName}-bedrock-kb-${this.account}`,
      encryption:        s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL:        true,
      versioned:         true,
      removalPolicy:     cdk.RemovalPolicy.RETAIN,
    });

    this.knowledgeBaseBucket.grantReadWrite(this.bedrockExecutionRole);

    // ── CloudWatch Log Group for Bedrock agent invocations ────────────────────
    new logs.LogGroup(this, "BedrockLogs", {
      logGroupName: `/3c-onyx/bedrock/invocations`,
      retention:    logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── CfnOutputs document the Bedrock model IDs for operators ──────────────
    new cdk.CfnOutput(this, "ConciergeModelId", {
      value:       Config.bedrock.conciergeModelId,
      description: "Bedrock model ID for Concierge agent",
      exportName:  "3c-concierge-model",
    });
    new cdk.CfnOutput(this, "GuardianModelId", {
      value:       Config.bedrock.guardianModelId,
      description: "Bedrock model ID for Guardian V2X agent (low-latency Haiku)",
      exportName:  "3c-guardian-model",
    });
    new cdk.CfnOutput(this, "KnowledgeBaseBucketName", {
      value:       this.knowledgeBaseBucket.bucketName,
      description: "S3 bucket that feeds Bedrock Knowledge Bases",
      exportName:  "3c-kb-bucket",
    });
    new cdk.CfnOutput(this, "BedrockRoleArn", {
      value:       this.bedrockExecutionRole.roleArn,
      description: "Shared Bedrock agent execution role ARN",
      exportName:  "3c-bedrock-role-arn",
    });

    // ── Inline note: Bedrock Knowledge Base provisioning ─────────────────────
    // Bedrock Knowledge Bases (L1 CfnKnowledgeBase) require Bedrock to be
    // enabled for the account region. Enable via:
    //   aws bedrock put-model-invocation-logging-configuration \
    //     --logging-config '{"cloudWatchConfig":{"logGroupName":"/3c-onyx/bedrock/invocations","roleArn":"..."}}'
    //
    // Then create via console or CDK L1 construct:
    //   new bedrock.CfnKnowledgeBase(this, "ReputationKB", {
    //     name: "3c-reputation-corpus",
    //     roleArn: this.bedrockExecutionRole.roleArn,
    //     knowledgeBaseConfiguration: { type: "VECTOR", vectorKnowledgeBaseConfiguration: { embeddingModelArn: "..." } },
    //     storageConfiguration: { type: "OPENSEARCH_SERVERLESS", ... }
    //   });
    //
    // Full Bedrock L1 CDK reference:
    //   https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_bedrock-readme.html
  }
}
