import * as cdk  from "aws-cdk-lib";
import * as ec2  from "aws-cdk-lib/aws-ec2";
import * as kms  from "aws-cdk-lib/aws-kms";
import * as iam  from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { Config }    from "../config";

/**
 * FoundationStack
 * ───────────────
 * Provisions the networking + cryptographic bedrock for the entire platform.
 *
 *  ┌─────────────────────────────────────────────────┐
 *  │  VPC (3 AZs)                                    │
 *  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
 *  │  │Public /24│  │Private   │  │Isolated (DB) │  │
 *  │  │ (NAT GW) │  │/24 (App) │  │/24 (DynDB EP)│  │
 *  │  └──────────┘  └──────────┘  └──────────────┘  │
 *  └─────────────────────────────────────────────────┘
 *  KMS CMK (AES-256) → encrypts every DynamoDB table,
 *    Lambda env vars, CloudWatch logs, SQS queues.
 */
export class FoundationStack extends cdk.Stack {
  public readonly vpc:           ec2.Vpc;
  public readonly encryptionKey: kms.Key;
  public readonly agentRole:     iam.Role;
  public readonly flowLogGroup:  logs.LogGroup;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // ── KMS Customer-Managed Key ─────────────────────────────────────────────
    this.encryptionKey = new kms.Key(this, "3cMasterKey", {
      description:       "3C Onyx master encryption key — AES-256 (SOC2 compliant)",
      enableKeyRotation: true,
      alias:             `alias/${Config.appName}-master`,
      policy:            new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            principals: [new iam.AccountRootPrincipal()],
            actions:    ["kms:*"],
            resources:  ["*"],
          }),
        ],
      }),
    });

    // ── VPC — 3 AZ, public + private + isolated subnets ─────────────────────
    this.vpc = new ec2.Vpc(this, "3cVpc", {
      maxAzs:             3,
      natGateways:        2,   // 2 NAT GWs for HA (one per AZ pair)
      ipAddresses:        ec2.IpAddresses.cidr("10.0.0.0/16"),
      enableDnsHostnames: true,
      enableDnsSupport:   true,
      subnetConfiguration: [
        {
          name:       "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask:   24,
        },
        {
          name:       "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask:   24,
        },
        {
          name:       "isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask:   24,
        },
      ],
    });

    // DynamoDB Gateway Endpoint (free, no NAT cost for DB traffic)
    this.vpc.addGatewayEndpoint("DynamoDBEndpoint", {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Secrets Manager Interface Endpoint (private — secrets never traverse internet)
    this.vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service:            ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled:  true,
      subnets:            { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Bedrock Interface Endpoint (private AI inference)
    this.vpc.addInterfaceEndpoint("BedrockEndpoint", {
      service:           ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
      privateDnsEnabled: true,
      subnets:           { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // ── VPC Flow Logs → CloudWatch ────────────────────────────────────────────
    this.flowLogGroup = new logs.LogGroup(this, "VpcFlowLogs", {
      logGroupName:  `/3c-onyx/vpc-flow-logs`,
      retention:     logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.encryptionKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new ec2.FlowLog(this, "FlowLog", {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination:  ec2.FlowLogDestination.toCloudWatchLogs(
        this.flowLogGroup,
        new iam.Role(this, "FlowLogRole", {
          assumedBy: new iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
        }),
      ),
    });

    // ── Shared Lambda Execution Role (least-privilege baseline) ──────────────
    this.agentRole = new iam.Role(this, "AgentExecutionRole", {
      roleName:   `${Config.appName}-agent-execution-role`,
      assumedBy:  new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole",
        ),
      ],
    });

    // Allow agents to write structured logs
    this.agentRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resources: ["*"],
    }));

    // Allow agents to call Bedrock models
    this.agentRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:Retrieve",
      ],
      resources: ["*"],
    }));

    // Allow X-Ray tracing
    this.agentRole.addToPolicy(new iam.PolicyStatement({
      actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
      resources: ["*"],
    }));

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "VpcId", {
      value:       this.vpc.vpcId,
      exportName:  "3c-vpc-id",
      description: "3C Onyx VPC ID",
    });

    new cdk.CfnOutput(this, "KmsKeyArn", {
      value:       this.encryptionKey.keyArn,
      exportName:  "3c-kms-key-arn",
      description: "3C Onyx master KMS key ARN",
    });
  }
}
