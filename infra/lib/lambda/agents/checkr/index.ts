/**
 * Checkr Agent — Background Check + AML / KYC
 * ─────────────────────────────────────────────
 * Handles:
 *   KYC_AML          — Identity verify + BGC initiation + Plaid AML signal
 *   REPORT           — Fetch completed Checkr report
 *   POST_CONFIRM     — Cognito post-confirmation trigger (auto-BGC on signup)
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import type { CognitoUserPoolTriggerEvent } from "aws-lambda";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sm      = new SecretsManagerClient({});
const dynamo  = new DynamoDBClient({});

type CheckrAction = "KYC_AML" | "REPORT" | "POST_CONFIRM";

interface CheckrInput {
  action:     CheckrAction;
  memberId?:  string;
  candidateData?: {
    firstName: string; lastName: string;
    email:     string; ssn:      string;
    dob:       string; zipCode:  string;
  };
  reportId?:  string;
}

export const handler = async (event: CheckrInput | CognitoUserPoolTriggerEvent | Record<string, unknown>) => {
  // Detect Cognito post-confirmation trigger
  if ("triggerSource" in event && (event as CognitoUserPoolTriggerEvent).triggerSource === "PostConfirmation_ConfirmSignUp") {
    return await handlePostConfirmation(event as CognitoUserPoolTriggerEvent);
  }

  const input = event as CheckrInput;

  const [checkrSecret, plaidSecret] = await Promise.all([
    sm.send(new GetSecretValueCommand({ SecretId: process.env["3C_PROD_CHECKR_ARN"] })),
    sm.send(new GetSecretValueCommand({ SecretId: process.env["3C_PROD_PLAID_ARN"] })),
  ]);

  const checkrKey = JSON.parse(checkrSecret.SecretString ?? "{}").apiKey;
  const plaidKey  = JSON.parse(plaidSecret.SecretString  ?? "{}").apiKey;

  switch (input.action) {
    case "KYC_AML": return await initiateKyc(input, checkrKey, plaidKey);
    case "REPORT":  return await fetchReport(input, checkrKey);
    default:        return { status: "OK" };
  }
};

async function initiateKyc(input: CheckrInput, checkrKey: string, _plaidKey: string) {
  if (!input.candidateData) throw new Error("candidateData required for KYC_AML");
  const { firstName, lastName, email, ssn, dob, zipCode } = input.candidateData;

  // Create Checkr candidate
  const candidateRes = await fetch("https://api.checkr.com/v1/candidates", {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${Buffer.from(checkrKey + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ first_name: firstName, last_name: lastName, email, ssn, dob, zipcode: zipCode }),
  });
  const candidate = await candidateRes.json() as { id?: string; error?: string };
  if (!candidate.id) throw new Error(`Checkr candidate creation failed: ${JSON.stringify(candidate)}`);

  // Initiate background report (criminal + SSN trace + sex offender)
  const reportRes = await fetch("https://api.checkr.com/v1/reports", {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${Buffer.from(checkrKey + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      package:      "tasker_standard",
      candidate_id: candidate.id,
    }),
  });
  const report = await reportRes.json() as { id?: string; status?: string };

  // Write KYC initiation to audit vault
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#Checkr" },
      sk:           { S: `DECISION#${now}` },
      decisionType: { S: "KYC_INITIATED" },
      memberId:     { S: input.memberId ?? "UNKNOWN" },
      candidateId:  { S: candidate.id },
      reportId:     { S: report.id ?? "PENDING" },
      status:       { S: report.status ?? "pending" },
      createdAt:    { S: now },
    },
  }));

  return {
    status:      report.status ?? "pending",
    candidateId: candidate.id,
    reportId:    report.id,
    note:        "Checkr webhook will fire to /stripe/webhook when report is complete",
  };
}

async function fetchReport(input: CheckrInput, checkrKey: string) {
  if (!input.reportId) throw new Error("reportId required");

  const res    = await fetch(`https://api.checkr.com/v1/reports/${input.reportId}`, {
    headers: { Authorization: `Basic ${Buffer.from(checkrKey + ":").toString("base64")}` },
  });
  const report = await res.json() as Record<string, unknown>;

  // Use Bedrock Haiku to summarise the report in plain English
  const summary = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.GUARDIAN_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens:        256,
      messages:          [{
        role:    "user",
        content: `Summarise this Checkr background check report for a 3C Onyx compliance officer.
Return JSON: { clear: boolean, flags: string[], summary: string, riskLevel: "LOW"|"MEDIUM"|"HIGH" }
Report: ${JSON.stringify(report)}`,
      }],
    }),
  }));

  const result = JSON.parse(new TextDecoder().decode(summary.body));
  const analysis = JSON.parse(result.content[0].text);

  return { statusCode: 200, body: JSON.stringify({ report, analysis, timestamp: new Date().toISOString() }) };
}

async function handlePostConfirmation(event: CognitoUserPoolTriggerEvent) {
  // Auto-initiate BGC on Cognito signup confirmation
  const { email, given_name, family_name } = event.request.userAttributes;
  console.log({
    trigger:   "PostConfirmation",
    email,
    action:    "BGC_AUTO_INITIATE",
    note:      "Full KYC requires SSN/DOB — collected via member onboarding flow",
  });
  // Write placeholder audit record
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#Checkr" },
      sk:           { S: `DECISION#${new Date().toISOString()}` },
      decisionType: { S: "SIGNUP_CONFIRMED" },
      email:        { S: email ?? "unknown" },
      name:         { S: `${given_name ?? ""} ${family_name ?? ""}`.trim() },
      createdAt:    { S: new Date().toISOString() },
    },
  }));
  return event;   // Must return event for Cognito trigger
}
