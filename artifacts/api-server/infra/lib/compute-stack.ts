import * as cdk from "aws-cdk-lib";
import * as location from "aws-cdk-lib/aws-location";
import type { Construct } from "constructs";

export class ComputeStack extends cdk.Stack {
  public readonly tracker: location.CfnTracker;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.tracker = new location.CfnTracker(this, "RunnerTracker", {
      trackerName: "3c-onyx-runner-tracker",
      positionFiltering: "AccuracyBased",
      description: "3C Onyx runner GPS tracker with accuracy-based position filtering",
    });

    new cdk.CfnOutput(this, "TrackerName", {
      value: this.tracker.trackerName,
      description: "Location Service tracker name for runner GPS tracking",
      exportName: "OnyxRunnerTrackerName",
    });

    new cdk.CfnOutput(this, "TrackerArn", {
      value: this.tracker.attrArn,
      description: "Location Service tracker ARN",
      exportName: "OnyxRunnerTrackerArn",
    });
  }
}
