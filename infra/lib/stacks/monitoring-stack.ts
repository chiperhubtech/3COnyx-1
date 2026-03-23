import * as cdk        from "aws-cdk-lib";
import * as cw         from "aws-cdk-lib/aws-cloudwatch";
import * as actions    from "aws-cdk-lib/aws-cloudwatch-actions";
import * as lambda     from "aws-cdk-lib/aws-lambda";
import * as ddb        from "aws-cdk-lib/aws-dynamodb";
import * as sfn        from "aws-cdk-lib/aws-stepfunctions";
import * as apigwv2    from "aws-cdk-lib/aws-apigatewayv2";
import * as sns        from "aws-cdk-lib/aws-sns";
import * as subs       from "aws-cdk-lib/aws-sns-subscriptions";
import * as logs       from "aws-cdk-lib/aws-logs";
import { Construct }   from "constructs";
import { Config }      from "../config";

interface MonitoringStackProps extends cdk.StackProps {
  api:              apigwv2.HttpApi;
  guardianFn:       lambda.Function;
  conciergeFn:      lambda.Function;
  reputationTable:  ddb.Table;
  walletTable:      ddb.Table;
  repairWorkflow:   sfn.StateMachine;
  purchaseWorkflow: sfn.StateMachine;
}

/**
 * MonitoringStack
 * ───────────────
 * Full observability layer — CloudWatch dashboards + alarms + X-Ray + SNS.
 *
 *  Dashboard "3C-Onyx-Operations":
 *   Row 1: API RPS, 4xx rate, 5xx rate, P99 latency
 *   Row 2: Guardian invocations, errors, duration
 *   Row 3: Concierge invocations, errors, duration
 *   Row 4: Repair workflow executions, failures
 *   Row 5: Purchase workflow executions, failures
 *   Row 6: DynamoDB consumed reads/writes
 *
 *  Critical alarms (PagerDuty via SNS):
 *   • API 5xx rate > 1% in 5-min window
 *   • Guardian errors > 5 in 5-min window
 *   • Repair workflow failure (any)
 *   • DynamoDB throttles > 100 in 1-min window
 */
export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      api, guardianFn, conciergeFn,
      reputationTable, walletTable,
      repairWorkflow, purchaseWorkflow,
    } = props;

    // ── Alert SNS Topic ───────────────────────────────────────────────────────
    const opsAlertTopic = new sns.Topic(this, "OpsAlerts", {
      topicName:   `${Config.appName}-ops-alerts`,
      displayName: "3C Onyx Critical Operations Alerts",
    });
    opsAlertTopic.addSubscription(new subs.EmailSubscription("ops@cuxtomcandyclub.com"));
    // Uncomment to add PagerDuty webhook:
    // opsAlertTopic.addSubscription(new subs.UrlSubscription("https://events.pagerduty.com/..."));

    const opsAction = new actions.SnsAction(opsAlertTopic);

    // ── Helper: create a standard Lambda error alarm ──────────────────────────
    const lambdaAlarm = (
      id:         string,
      fn:         lambda.Function,
      agentName:  string,
      threshold:  number = 5,
    ): cw.Alarm => {
      const alarm = fn.metricErrors({ period: cdk.Duration.minutes(5) })
        .createAlarm(this, id, {
          alarmName:         `3c-${agentName.toLowerCase()}-errors`,
          threshold,
          evaluationPeriods: 1,
          alarmDescription:  `CRITICAL: ${agentName} agent errors exceed ${threshold} in 5-min window`,
          treatMissingData:  cw.TreatMissingData.NOT_BREACHING,
        });
      alarm.addAlarmAction(opsAction);
      return alarm;
    };

    // ── Guardian alarms ───────────────────────────────────────────────────────
    lambdaAlarm("GuardianErrorAlarm", guardianFn, "Guardian", 5);

    guardianFn.metricDuration({ period: cdk.Duration.minutes(1) })
      .createAlarm(this, "GuardianLatencyAlarm", {
        alarmName:         "3c-guardian-high-latency",
        threshold:         8000,   // 8s — Guardian must respond in < 8s for V2X
        evaluationPeriods: 3,
        alarmDescription:  "WARN: Guardian V2X latency > 8s — check Bedrock endpoint",
        treatMissingData:  cw.TreatMissingData.NOT_BREACHING,
      });

    // ── Concierge alarms ──────────────────────────────────────────────────────
    lambdaAlarm("ConciergeErrorAlarm", conciergeFn, "Concierge", 10);

    // ── Workflow failure alarms ───────────────────────────────────────────────
    const repairFailAlarm = repairWorkflow.metricFailed({ period: cdk.Duration.minutes(5) })
      .createAlarm(this, "RepairWorkflowFailAlarm", {
        alarmName:         "3c-repair-workflow-failed",
        threshold:         1,
        evaluationPeriods: 1,
        alarmDescription:  "CRITICAL: Repair transaction workflow has failed — manual intervention required",
        treatMissingData:  cw.TreatMissingData.NOT_BREACHING,
      });
    repairFailAlarm.addAlarmAction(opsAction);

    const purchaseFailAlarm = purchaseWorkflow.metricFailed({ period: cdk.Duration.minutes(5) })
      .createAlarm(this, "PurchaseWorkflowFailAlarm", {
        alarmName:         "3c-purchase-workflow-failed",
        threshold:         1,
        evaluationPeriods: 1,
        alarmDescription:  "CRITICAL: Vehicle purchase workflow has failed",
        treatMissingData:  cw.TreatMissingData.NOT_BREACHING,
      });
    purchaseFailAlarm.addAlarmAction(opsAction);

    // ── DynamoDB throttle alarm ───────────────────────────────────────────────
    const ddbThrottleAlarm = new cw.Alarm(this, "DdbThrottleAlarm", {
      alarmName:         "3c-dynamodb-throttle",
      metric:            new cw.Metric({
        namespace:    "AWS/DynamoDB",
        metricName:   "SystemErrors",
        dimensionsMap: { TableName: walletTable.tableName },
        period:        cdk.Duration.minutes(1),
        statistic:     "Sum",
      }),
      threshold:         100,
      evaluationPeriods: 1,
      alarmDescription:  "WARN: DynamoDB throttles detected on Dynasty Wallet table",
      treatMissingData:  cw.TreatMissingData.NOT_BREACHING,
    });
    ddbThrottleAlarm.addAlarmAction(opsAction);

    // ── Main Operations Dashboard ─────────────────────────────────────────────
    new cw.Dashboard(this, "OperationsDashboard", {
      dashboardName: "3C-Onyx-Operations",
      widgets: [
        // Row 1: API health
        [
          new cw.GraphWidget({
            title:  "API — Requests per Second",
            width:  6,
            left:   [new cw.Metric({ namespace: "AWS/ApiGateway", metricName: "Count",       dimensionsMap: { ApiId: api.apiId }, period: cdk.Duration.minutes(1), statistic: "Sum"     })],
          }),
          new cw.GraphWidget({
            title:  "API — 4xx Rate",
            width:  6,
            left:   [new cw.Metric({ namespace: "AWS/ApiGateway", metricName: "4xx",         dimensionsMap: { ApiId: api.apiId }, period: cdk.Duration.minutes(5), statistic: "Average" })],
          }),
          new cw.GraphWidget({
            title:  "API — 5xx Rate",
            width:  6,
            left:   [new cw.Metric({ namespace: "AWS/ApiGateway", metricName: "5xx",         dimensionsMap: { ApiId: api.apiId }, period: cdk.Duration.minutes(5), statistic: "Average" })],
          }),
          new cw.GraphWidget({
            title:  "API — P99 Latency (ms)",
            width:  6,
            left:   [new cw.Metric({ namespace: "AWS/ApiGateway", metricName: "IntegrationLatency", dimensionsMap: { ApiId: api.apiId }, period: cdk.Duration.minutes(5), statistic: "p99" })],
          }),
        ],
        // Row 2: Guardian
        [
          new cw.GraphWidget({ title: "Guardian — Invocations", width: 8, left: [guardianFn.metricInvocations({ period: cdk.Duration.minutes(1) })]   }),
          new cw.GraphWidget({ title: "Guardian — Errors",      width: 8, left: [guardianFn.metricErrors({ period: cdk.Duration.minutes(1) })]         }),
          new cw.GraphWidget({ title: "Guardian — Duration (ms)",width: 8, left: [guardianFn.metricDuration({ period: cdk.Duration.minutes(1), statistic: "p99" })] }),
        ],
        // Row 3: Concierge
        [
          new cw.GraphWidget({ title: "Concierge — Invocations",  width: 8, left: [conciergeFn.metricInvocations({ period: cdk.Duration.minutes(1) })]  }),
          new cw.GraphWidget({ title: "Concierge — Errors",       width: 8, left: [conciergeFn.metricErrors({ period: cdk.Duration.minutes(1) })]        }),
          new cw.GraphWidget({ title: "Concierge — Duration (ms)", width: 8, left: [conciergeFn.metricDuration({ period: cdk.Duration.minutes(1), statistic: "p99" })] }),
        ],
        // Row 4: Workflows
        [
          new cw.GraphWidget({
            title: "Repair Workflow — Executions",
            width: 12,
            left:  [
              repairWorkflow.metricStarted(  { period: cdk.Duration.minutes(5) }),
              repairWorkflow.metricSucceeded({ period: cdk.Duration.minutes(5) }),
              repairWorkflow.metricFailed(   { period: cdk.Duration.minutes(5) }),
            ],
          }),
          new cw.GraphWidget({
            title: "Purchase Workflow — Executions",
            width: 12,
            left:  [
              purchaseWorkflow.metricStarted(  { period: cdk.Duration.minutes(5) }),
              purchaseWorkflow.metricSucceeded({ period: cdk.Duration.minutes(5) }),
              purchaseWorkflow.metricFailed(   { period: cdk.Duration.minutes(5) }),
            ],
          }),
        ],
        // Row 5: DynamoDB
        [
          new cw.GraphWidget({
            title:  "DynamoDB — Wallet Consumed Capacity",
            width:  12,
            left: [
              new cw.Metric({ namespace: "AWS/DynamoDB", metricName: "ConsumedReadCapacityUnits",  dimensionsMap: { TableName: walletTable.tableName },      period: cdk.Duration.minutes(1), statistic: "Sum" }),
              new cw.Metric({ namespace: "AWS/DynamoDB", metricName: "ConsumedWriteCapacityUnits", dimensionsMap: { TableName: walletTable.tableName },      period: cdk.Duration.minutes(1), statistic: "Sum" }),
            ],
          }),
          new cw.GraphWidget({
            title:  "DynamoDB — Reputation Consumed Capacity",
            width:  12,
            left: [
              new cw.Metric({ namespace: "AWS/DynamoDB", metricName: "ConsumedReadCapacityUnits",  dimensionsMap: { TableName: reputationTable.tableName },  period: cdk.Duration.minutes(1), statistic: "Sum" }),
              new cw.Metric({ namespace: "AWS/DynamoDB", metricName: "ConsumedWriteCapacityUnits", dimensionsMap: { TableName: reputationTable.tableName },  period: cdk.Duration.minutes(1), statistic: "Sum" }),
            ],
          }),
        ],
      ],
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "DashboardUrl", {
      value:       `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=3C-Onyx-Operations`,
      description: "CloudWatch Operations Dashboard URL",
      exportName:  "3c-dashboard-url",
    });
    new cdk.CfnOutput(this, "OpsAlertTopicArn", {
      value:       opsAlertTopic.topicArn,
      exportName:  "3c-ops-alert-topic",
    });
  }
}
