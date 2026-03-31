import * as cdk from "aws-cdk-lib";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

export class DataStack extends cdk.Stack {
  public readonly domain: opensearch.Domain;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.domain = new opensearch.Domain(this, "VehicleSearchDomain", {
      domainName: "onyx-vehicles",
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      capacity: {
        dataNodeInstanceType: "t3.small.search",
        dataNodes: 1,
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      encryptionAtRest: {
        enabled: true,
      },
      nodeToNodeEncryption: true,
      enforceHttps: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      logging: {
        slowSearchLogEnabled: true,
        slowIndexLogEnabled: true,
        appLogEnabled: true,
      },
    });

    new cdk.CfnOutput(this, "OpenSearchEndpoint", {
      value: this.domain.domainEndpoint,
      description: "OpenSearch domain endpoint for vehicle search",
      exportName: "OnyxOpenSearchEndpoint",
    });

    new cdk.CfnOutput(this, "OpenSearchDomainArn", {
      value: this.domain.domainArn,
      description: "OpenSearch domain ARN",
      exportName: "OnyxOpenSearchDomainArn",
    });
  }
}
