import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";

export interface SecurityStackProps extends cdk.StackProps {
  apiStageArn: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly webAclAssociation: wafv2.CfnWebACLAssociation;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    this.webAcl = new wafv2.CfnWebACL(this, "OnyxWebACL", {
      name: "3c-onyx-waf",
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "3cOnyxWAF",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "CommonRuleSet",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWSManagedRulesSQLiRuleSet",
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesSQLiRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "SQLiRuleSet",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "KnownBadInputsRuleSet",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    this.webAclAssociation = new wafv2.CfnWebACLAssociation(this, "OnyxWebACLAssociation", {
      webAclArn: this.webAcl.attrArn,
      resourceArn: props.apiStageArn,
    });

    new cdk.CfnOutput(this, "WebAclArn", {
      value: this.webAcl.attrArn,
      description: "WAF Web ACL ARN for API Gateway association",
      exportName: "OnyxWebAclArn",
    });
  }
}
