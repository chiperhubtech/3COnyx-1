import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as events from "aws-cdk-lib/aws-events";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

export class WorkflowStack extends cdk.Stack {
  public readonly dynastyFeeStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const onyxBus = events.EventBus.fromEventBusName(this, "OnyxBus", "3c-onyx-event-bus");

    const computeFeeFn = new lambda.Function(this, "ComputeFeeFn", {
      functionName: "3c-onyx-compute-dynasty-fee",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const commissionUsd = Number(event.commissionUsd) || 0;
          const dynastyFeeUsd = Math.round((commissionUsd / 3) * 100) / 100;
          return { ...event, dynastyFeeUsd };
        };
      `),
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      description: "Compute dynasty fee as commissionUsd / 3",
    });

    const computeFee = new tasks.LambdaInvoke(this, "ComputeDynastyFee", {
      lambdaFunction: computeFeeFn,
      comment: "DealStructured → compute fee (commissionUsd × 1/3)",
      outputPath: "$.Payload",
    });

    const emitEvent = new tasks.EventBridgePutEvents(this, "EmitDynastyFeeEarned", {
      entries: [
        {
          detail: sfn.TaskInput.fromObject({
            "dealId.$": "$.dealId",
            "commissionUsd.$": "$.commissionUsd",
            "dynastyFeeUsd.$": "$.dynastyFeeUsd",
            "referrerId.$": "$.referrerId",
            "agentId.$": "$.agentId",
            "ts.$": "$.ts",
          }),
          detailType: "payment.dynasty_fee.earned",
          source: "3c-onyx-workflow",
          eventBus: onyxBus,
        },
      ],
      resultPath: "$.eventResult",
    });

    const settleReferral = new tasks.EventBridgePutEvents(this, "SettleReferralLedger", {
      entries: [
        {
          detail: sfn.TaskInput.fromObject({
            "dealId.$": "$.dealId",
            "dynastyFeeUsd.$": "$.dynastyFeeUsd",
            "referrerId.$": "$.referrerId",
            "action": "settle",
            "ts.$": "$.ts",
          }),
          detailType: "referral.settled",
          source: "3c-onyx-workflow",
          eventBus: events.EventBus.fromEventBusName(this, "OnyxBusSettle", "3c-onyx-event-bus"),
        },
      ],
      resultPath: "$.settleResult",
    });

    const done = new sfn.Succeed(this, "Done", {
      comment: "Dynasty fee flow complete",
    });

    const dealStructured = new sfn.Pass(this, "DealStructured", {
      comment: "Entry state: deal has been closed/structured, extract input fields",
      parameters: {
        "dealId.$": "$.dealId",
        "commissionUsd.$": "$.commissionUsd",
        "referrerId.$": "$.referrerId",
        "agentId.$": "$.agentId",
        "ts.$": "$$.State.EnteredTime",
      },
    });

    const definition = dealStructured
      .next(computeFee)
      .next(emitEvent)
      .next(settleReferral)
      .next(done);

    const logGroup = new logs.LogGroup(this, "DynastyFeeLogGroup", {
      logGroupName: "/aws/stepfunctions/3c-onyx-dynasty-fee",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.dynastyFeeStateMachine = new sfn.StateMachine(this, "DynastyFeeStateMachine", {
      stateMachineName: "3c-onyx-dynasty-fee",
      stateMachineType: sfn.StateMachineType.EXPRESS,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
      comment: "Dynasty Fee calculation: deal closed → compute fee (commissionUsd × 1/3) → emit payment.dynasty_fee.earned → settle referral ledger",
    });

    new cdk.CfnOutput(this, "DynastyFeeStateMachineArn", {
      value: this.dynastyFeeStateMachine.stateMachineArn,
      description: "Dynasty Fee Step Functions state machine ARN",
      exportName: "OnyxDynastyFeeStateMachineArn",
    });
  }
}
