#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SecurityStack } from "../lib/security-stack";
import { WorkflowStack } from "../lib/workflow-stack";
import { DataStack } from "../lib/data-stack";
import { ComputeStack } from "../lib/compute-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

const apiStageArn = app.node.tryGetContext("apiStageArn")
  ?? process.env.API_STAGE_ARN
  ?? "arn:aws:apigateway:us-east-1::/restapis/placeholder/stages/prod";

const securityStack = new SecurityStack(app, "OnyxSecurity", { env, apiStageArn });
const workflowStack = new WorkflowStack(app, "OnyxWorkflow", { env });
const dataStack = new DataStack(app, "OnyxData", { env });
const computeStack = new ComputeStack(app, "OnyxCompute", { env });

cdk.Tags.of(app).add("project", "3c-onyx");
cdk.Tags.of(app).add("managed-by", "cdk");
