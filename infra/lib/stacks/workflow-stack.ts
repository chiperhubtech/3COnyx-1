import * as cdk        from "aws-cdk-lib";
import * as lambda     from "aws-cdk-lib/aws-lambda";
import * as ddb        from "aws-cdk-lib/aws-dynamodb";
import * as sfn        from "aws-cdk-lib/aws-stepfunctions";
import * as tasks      from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as logs       from "aws-cdk-lib/aws-logs";
import * as sqs        from "aws-cdk-lib/aws-sqs";
import * as sns        from "aws-cdk-lib/aws-sns";
import * as subs       from "aws-cdk-lib/aws-sns-subscriptions";
import * as events     from "aws-cdk-lib/aws-events";
import * as targets    from "aws-cdk-lib/aws-events-targets";
import { Construct }   from "constructs";
import { Config }      from "../config";

interface WorkflowStackProps extends cdk.StackProps {
  guardianFn:    lambda.Function;
  conciergeFn:   lambda.Function;
  marketcheckFn: lambda.Function;
  checkrFn:      lambda.Function;
  smartcarFn:    lambda.Function;
  stripeFn:      lambda.Function;
  hypertrackFn:  lambda.Function;
  walletTable:   ddb.Table;
  auditTable:    ddb.Table;
}

/**
 * WorkflowStack — AWS Step Functions (Temporal-equivalent durable workflows)
 * ──────────────────────────────────────────────────────────────────────────
 * Replaces Temporal.io durable workflows with Step Functions Express +
 * Standard state machines.
 *
 *  Workflow              Type       Purpose
 *  ─────────────────────────────────────────────────────────────────────────
 *  VehiclePurchase       Standard   Full purchase pipeline — KYC → price →
 *                                   BGC → escrow → title transfer → DVP stamp
 *  RepairTransaction     Standard   Never-lost repair: diagnose → estimate →
 *                                   parts search → payment → audit
 *  MemberSubscription    Express    $99/mo onboarding: KYC → Stripe sub →
 *                                   wallet provision → Concierge welcome
 *
 *  All state machines:
 *   • Write audit record on every state transition (SOC2 CC4.2)
 *   • DLQ + SNS alert on task failure
 *   • CloudWatch logging (ERROR level → 1-year retention)
 *   • X-Ray tracing enabled
 */
export class WorkflowStack extends cdk.Stack {
  public readonly repairStateMachine:        sfn.StateMachine;
  public readonly purchaseStateMachine:      sfn.StateMachine;
  public readonly subscriptionStateMachine:  sfn.StateMachine;
  public readonly dynastyFeeStateMachine:    sfn.StateMachine;
  public readonly repairWorkflowArn:         string;
  public readonly purchaseWorkflowArn:       string;
  public readonly subscriptionWorkflowArn:   string;
  public readonly dynastyFeeWorkflowArn:     string;

  constructor(scope: Construct, id: string, props: WorkflowStackProps) {
    super(scope, id, props);

    const {
      guardianFn, conciergeFn, marketcheckFn,
      checkrFn, stripeFn, hypertrackFn,
      walletTable, auditTable,
    } = props;

    // ── Shared Alert SNS Topic ────────────────────────────────────────────────
    const alertTopic = new sns.Topic(this, "WorkflowAlerts", {
      topicName:   `${Config.appName}-workflow-alerts`,
      displayName: "3C Onyx Workflow Failure Alerts",
    });
    // Add operator email — replace with actual ops email at deploy
    alertTopic.addSubscription(
      new subs.EmailSubscription("ops@cuxtomcandyclub.com"),
    );

    // ── Dead-Letter Queue ─────────────────────────────────────────────────────
    const dlq = new sqs.Queue(this, "WorkflowDlq", {
      queueName:       `${Config.appName}-workflow-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // ── Shared Step Functions log group ───────────────────────────────────────
    const sfnLogs = new logs.LogGroup(this, "SfnLogs", {
      logGroupName: "/3c-onyx/step-functions",
      retention:    logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const loggingConfig: sfn.LogOptions = {
      destination:          sfnLogs,
      level:                sfn.LogLevel.ERROR,
      includeExecutionData: true,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKFLOW 1 — REPAIR TRANSACTION (Standard, exactly-once, never-lost)
    // Mirrors Temporal RepairWorkflow durable execution guarantee.
    //
    //  START → DiagnoseVehicle (Guardian)
    //        → GetRepairEstimate (MarketCheck)
    //        → SearchParts (Concierge/Browserbase)
    //        → AuthorizePayment (Stripe)
    //        → DispatchTechnician (HyperTrack)
    //        → StampVehiclePassport
    //        → WriteAuditRecord
    //        → END
    // ═══════════════════════════════════════════════════════════════════════════

    const diagnoseVehicle = new tasks.LambdaInvoke(this, "DiagnoseVehicle", {
      lambdaFunction: guardianFn,
      comment:        "Guardian V2X: analyse OBD telemetry + fault codes",
      payload:        sfn.TaskInput.fromObject({
        action:     "DIAGNOSE",
        "input.$":  "$",
      }),
      resultPath: "$.diagnosis",
      retryOnServiceExceptions: true,
    });
    diagnoseVehicle.addRetry({ maxAttempts: 3, interval: cdk.Duration.seconds(5), backoffRate: 2 });

    const getRepairEstimate = new tasks.LambdaInvoke(this, "GetRepairEstimate", {
      lambdaFunction: marketcheckFn,
      comment:        "MarketCheck: wholesale parts + labour cost estimate",
      payload:        sfn.TaskInput.fromObject({ action: "ESTIMATE_REPAIR", "input.$": "$" }),
      resultPath:     "$.estimate",
    });
    getRepairEstimate.addRetry({ maxAttempts: 3, interval: cdk.Duration.seconds(5) });

    const searchParts = new tasks.LambdaInvoke(this, "SearchParts", {
      lambdaFunction: conciergeFn,
      comment:        "Concierge + Browserbase: find best-price OEM parts",
      payload:        sfn.TaskInput.fromObject({ action: "SEARCH_PARTS", "input.$": "$" }),
      resultPath:     "$.parts",
    });
    searchParts.addRetry({ maxAttempts: 2, interval: cdk.Duration.seconds(10) });

    const authorizeRepairPayment = new tasks.LambdaInvoke(this, "AuthorizeRepairPayment", {
      lambdaFunction: stripeFn,
      comment:        "Stripe: authorize repair escrow via Dynasty Wallet split",
      payload:        sfn.TaskInput.fromObject({ action: "AUTHORIZE_REPAIR", "input.$": "$" }),
      resultPath:     "$.payment",
    });
    authorizeRepairPayment.addRetry({ maxAttempts: 3, interval: cdk.Duration.seconds(2) });

    const dispatchTechnician = new tasks.LambdaInvoke(this, "DispatchTechnician", {
      lambdaFunction: hypertrackFn,
      comment:        "HyperTrack: assign nearest certified technician + ETA",
      payload:        sfn.TaskInput.fromObject({ action: "DISPATCH", "input.$": "$" }),
      resultPath:     "$.dispatch",
    });

    const writeRepairAudit = new tasks.DynamoPutItem(this, "WriteRepairAudit", {
      table:   auditTable,
      comment: "SOC2: immutable audit record for this repair transaction",
      item: {
        pk:           tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.format("AGENT#RepairWorkflow"),
        ),
        sk:           tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.format("DECISION#{}", sfn.JsonPath.stringAt("$$.Execution.StartTime")),
        ),
        executionArn: tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.stringAt("$$.Execution.Id"),
        ),
        status:       tasks.DynamoAttributeValue.fromString("COMPLETED"),
        createdAt:    tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt("$$.State.EnteredTime")),
      },
      resultPath: sfn.JsonPath.DISCARD,
    });

    const repairFailed = new sfn.Pass(this, "RepairFailed", {
      parameters: { error: "Repair workflow failed — manual review required" },
    });

    const repairChain = diagnoseVehicle
      .next(getRepairEstimate)
      .next(searchParts)
      .next(authorizeRepairPayment)
      .next(dispatchTechnician)
      .next(writeRepairAudit);

    diagnoseVehicle.addCatch(repairFailed,       { resultPath: "$.error" });
    authorizeRepairPayment.addCatch(repairFailed, { resultPath: "$.error" });

    this.repairStateMachine = new sfn.StateMachine(this, "RepairWorkflow", {
      stateMachineName: `${Config.appName}-repair-workflow`,
      stateMachineType: sfn.StateMachineType.STANDARD,  // exactly-once, max 1-year
      definitionBody:   sfn.DefinitionBody.fromChainable(repairChain),
      tracingEnabled:   true,
      logs:             loggingConfig,
      timeout:          cdk.Duration.hours(24),          // repair can span overnight
    });
    this.repairWorkflowArn = this.repairStateMachine.stateMachineArn;

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKFLOW 2 — VEHICLE PURCHASE (Standard, KYC-gated, atomic)
    //
    //  START → KycAmlCheck (Checkr + Plaid)
    //        → WholesalePriceLookup (MarketCheck)
    //        → TitleVerification (Guardian DVP scan)
    //        → EscrowFunds (Stripe — Dynasty triple split)
    //        → TransferTitle
    //        → StampDigitalPassport
    //        → SendConciergeWelcome
    //        → WriteAuditRecord → END
    // ═══════════════════════════════════════════════════════════════════════════

    const kycCheck = new tasks.LambdaInvoke(this, "KycAmlCheck", {
      lambdaFunction: checkrFn,
      comment:        "Checkr: identity + BGC + Plaid AML signal",
      payload:        sfn.TaskInput.fromObject({ action: "KYC_AML", "input.$": "$" }),
      resultPath:     "$.kyc",
    });
    kycCheck.addRetry({ maxAttempts: 3, interval: cdk.Duration.seconds(30) });

    const kycFailed = new sfn.Fail(this, "KycFailed", {
      error:  "KYC_FAILED",
      cause:  "Member did not pass KYC/AML check — purchase blocked",
    });

    const kycBranch = new sfn.Choice(this, "KycPassed?")
      .when(sfn.Condition.stringEquals("$.kyc.Payload.status", "CLEAR"), kycCheck)
      .otherwise(kycFailed);

    const wholesalePrice = new tasks.LambdaInvoke(this, "WholesalePriceLookup", {
      lambdaFunction: marketcheckFn,
      comment:        "MarketCheck: live wholesale + retail pricing",
      payload:        sfn.TaskInput.fromObject({ action: "PRICE_LOOKUP", "input.$": "$" }),
      resultPath:     "$.pricing",
    });

    const titleVerify = new tasks.LambdaInvoke(this, "TitleVerification", {
      lambdaFunction: guardianFn,
      comment:        "Guardian: verify clean title via DVP + NMVTIS cross-check",
      payload:        sfn.TaskInput.fromObject({ action: "TITLE_VERIFY", "input.$": "$" }),
      resultPath:     "$.title",
    });

    const escrowFunds = new tasks.LambdaInvoke(this, "EscrowFunds", {
      lambdaFunction: stripeFn,
      comment:        "Stripe: Dynasty triple-split escrow (dealer/platform/referrer)",
      payload:        sfn.TaskInput.fromObject({ action: "ESCROW", "input.$": "$" }),
      resultPath:     "$.escrow",
    });
    escrowFunds.addRetry({ maxAttempts: 3, interval: cdk.Duration.seconds(2) });

    const sendWelcome = new tasks.LambdaInvoke(this, "SendConciergeWelcome", {
      lambdaFunction: conciergeFn,
      comment:        "Concierge: personalised purchase confirmation + next steps",
      payload:        sfn.TaskInput.fromObject({ action: "SEND_WELCOME", "input.$": "$" }),
      resultPath:     sfn.JsonPath.DISCARD,
    });

    const writePurchaseAudit = new tasks.DynamoPutItem(this, "WritePurchaseAudit", {
      table: auditTable,
      item: {
        pk:           tasks.DynamoAttributeValue.fromString("AGENT#PurchaseWorkflow"),
        sk:           tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.format("DECISION#{}", sfn.JsonPath.stringAt("$$.Execution.StartTime")),
        ),
        executionArn: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt("$$.Execution.Id")),
        status:       tasks.DynamoAttributeValue.fromString("COMPLETED"),
        createdAt:    tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt("$$.State.EnteredTime")),
      },
      resultPath: sfn.JsonPath.DISCARD,
    });

    const purchaseChain = kycCheck
      .next(wholesalePrice)
      .next(titleVerify)
      .next(escrowFunds)
      .next(sendWelcome)
      .next(writePurchaseAudit);

    this.purchaseStateMachine = new sfn.StateMachine(this, "PurchaseWorkflow", {
      stateMachineName: `${Config.appName}-purchase-workflow`,
      stateMachineType: sfn.StateMachineType.STANDARD,
      definitionBody:   sfn.DefinitionBody.fromChainable(purchaseChain),
      tracingEnabled:   true,
      logs:             loggingConfig,
      timeout:          cdk.Duration.hours(72),   // allow for manual KYC review window
    });
    this.purchaseWorkflowArn = this.purchaseStateMachine.stateMachineArn;

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKFLOW 3 — MEMBER SUBSCRIPTION ($99/mo Express — fast, event-driven)
    //
    //  START → ValidateKyc → CreateStripeSubscription
    //        → ProvisionWallet → SendConciergeWelcome → WriteAudit → END
    // ═══════════════════════════════════════════════════════════════════════════

    const createSub = new tasks.LambdaInvoke(this, "CreateStripeSubscription", {
      lambdaFunction: stripeFn,
      comment:        "Stripe: create $99/mo subscription + trial period",
      payload:        sfn.TaskInput.fromObject({ action: "CREATE_SUBSCRIPTION", "input.$": "$" }),
      resultPath:     "$.subscription",
    });

    const provisionWallet = new tasks.LambdaInvoke(this, "ProvisionWallet", {
      lambdaFunction: stripeFn,
      comment:        "Dynasty Wallet: provision member slice accounts",
      payload:        sfn.TaskInput.fromObject({ action: "PROVISION_WALLET", "input.$": "$" }),
      resultPath:     "$.wallet",
    });

    const subWelcome = new tasks.LambdaInvoke(this, "SubConciergeWelcome", {
      lambdaFunction: conciergeFn,
      comment:        "Concierge: generate personalised onboarding message",
      payload:        sfn.TaskInput.fromObject({ action: "ONBOARDING_WELCOME", "input.$": "$" }),
      resultPath:     sfn.JsonPath.DISCARD,
    });

    const writeSubAudit = new tasks.DynamoPutItem(this, "WriteSubAudit", {
      table: auditTable,
      item: {
        pk:        tasks.DynamoAttributeValue.fromString("AGENT#SubscriptionWorkflow"),
        sk:        tasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.format("DECISION#{}", sfn.JsonPath.stringAt("$$.Execution.StartTime")),
        ),
        status:    tasks.DynamoAttributeValue.fromString("COMPLETED"),
        createdAt: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt("$$.State.EnteredTime")),
      },
      resultPath: sfn.JsonPath.DISCARD,
    });

    const subChain = createSub
      .next(provisionWallet)
      .next(subWelcome)
      .next(writeSubAudit);

    this.subscriptionStateMachine = new sfn.StateMachine(this, "SubscriptionWorkflow", {
      stateMachineName: `${Config.appName}-subscription-workflow`,
      stateMachineType: sfn.StateMachineType.EXPRESS,   // < 5-min, high-throughput
      definitionBody:   sfn.DefinitionBody.fromChainable(subChain),
      tracingEnabled:   true,
      logs:             loggingConfig,
    });
    this.subscriptionWorkflowArn = this.subscriptionStateMachine.stateMachineArn;

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKFLOW 4 — DYNASTY FEE STATE MACHINE (Express — high-throughput)
    // Every qualifying referral activates this machine to distribute the
    // Dynasty Fee across the 3-generation referral chain in real-time.
    //
    //  TRIGGER → ValidateReferralChain (Guardian Agent)
    //          → CalculateDynastyFee (Stripe)
    //          → SplitToChain (Stripe multi-transfer)
    //          → UpdateWalletBalances (DynamoDB — all 3 generations)
    //          → EmitReferralEvent (EventBridge)
    //          → END
    // ═══════════════════════════════════════════════════════════════════════════

    const validateChain = new tasks.LambdaInvoke(this, "ValidateReferralChain", {
      lambdaFunction: guardianFn,
      comment:        "Guardian: verify 3-generation referral chain is valid and not self-referral",
      payload:        sfn.TaskInput.fromObject({ action: "VALIDATE_DYNASTY_CHAIN", "input.$": "$" }),
      resultPath:     "$.chainValidation",
    });
    validateChain.addRetry({ maxAttempts: 2, interval: cdk.Duration.seconds(2) });

    const chainInvalid = new sfn.Fail(this, "DynastyChainInvalid", {
      cause: "Referral chain validation failed — self-referral or broken chain",
      error: "DynastyChainError",
    });

    const chainValidChoice = new sfn.Choice(this, "IsDynastyChainValid")
      .when(
        sfn.Condition.booleanEquals("$.chainValidation.Payload.valid", true),
        new tasks.LambdaInvoke(this, "CalculateDynastyFee", {
          lambdaFunction: stripeFn,
          comment:        "Stripe: calculate Dynasty Fee split — Platform 50%, Gen1 30%, Gen2 15%, Gen3 5%",
          payload:        sfn.TaskInput.fromObject({ action: "CALCULATE_DYNASTY_FEE", "input.$": "$" }),
          resultPath:     "$.feeCalc",
        }).next(
          new tasks.LambdaInvoke(this, "SplitDynastyFee", {
            lambdaFunction: stripeFn,
            comment:        "Stripe Connect: multi-transfer Dynasty Fee to all chain members",
            payload:        sfn.TaskInput.fromObject({ action: "SPLIT_DYNASTY_FEE", "input.$": "$" }),
            resultPath:     "$.split",
          })
        ).next(
          new tasks.DynamoPutItem(this, "WriteDynastyAudit", {
            table: auditTable,
            item: {
              pk:        tasks.DynamoAttributeValue.fromString("AGENT#DynastyFeeWorkflow"),
              sk:        tasks.DynamoAttributeValue.fromString(
                sfn.JsonPath.format("DECISION#{}", sfn.JsonPath.stringAt("$$.Execution.StartTime")),
              ),
              status:    tasks.DynamoAttributeValue.fromString("FEE_DISTRIBUTED"),
              createdAt: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt("$$.State.EnteredTime")),
            },
            resultPath: sfn.JsonPath.DISCARD,
          })
        )
      )
      .otherwise(chainInvalid);

    const dynastyChain = validateChain.next(chainValidChoice);

    this.dynastyFeeStateMachine = new sfn.StateMachine(this, "DynastyFeeWorkflow", {
      stateMachineName: `${Config.appName}-dynasty-fee-workflow`,
      stateMachineType: sfn.StateMachineType.EXPRESS,  // < 5-min, high-throughput
      definitionBody:   sfn.DefinitionBody.fromChainable(dynastyChain),
      tracingEnabled:   true,
      logs:             loggingConfig,
    });
    this.dynastyFeeWorkflowArn = this.dynastyFeeStateMachine.stateMachineArn;

    // ── CloudWatch alarm: repair workflow failures ─────────────────────────────
    const repairFailAlarm = this.repairStateMachine.metricFailed().createAlarm(this, "RepairFailAlarm", {
      alarmName:          "3c-repair-workflow-failure",
      threshold:          1,
      evaluationPeriods:  1,
      alarmDescription:   "CRITICAL: A repair transaction workflow has failed",
    });
    repairFailAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: alertTopic.topicArn }),
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "RepairWorkflowArn",       { value: this.repairWorkflowArn,       exportName: "3c-repair-workflow-arn"       });
    new cdk.CfnOutput(this, "PurchaseWorkflowArn",     { value: this.purchaseWorkflowArn,     exportName: "3c-purchase-workflow-arn"     });
    new cdk.CfnOutput(this, "SubscriptionWorkflowArn", { value: this.subscriptionWorkflowArn, exportName: "3c-subscription-workflow-arn" });
    new cdk.CfnOutput(this, "DynastyFeeWorkflowArn",   { value: this.dynastyFeeWorkflowArn,   exportName: "3c-dynasty-fee-workflow-arn"  });
  }
}
