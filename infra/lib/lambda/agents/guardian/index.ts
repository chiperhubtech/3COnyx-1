/**
 * Guardian Agent — V2X Predictive Intelligence
 * ─────────────────────────────────────────────
 * Handles:
 *   DIAGNOSE          — OBD-II telemetry analysis + fault code interpretation
 *   TITLE_VERIFY      — Digital Vehicle Passport chain-of-title cross-check
 *   ALERT             — Real-time strike generation from telemetry anomalies
 *   STATUS            — Guardian mesh health for dashboard
 *
 * Bedrock model: claude-3-haiku (low-latency, optimised for structured JSON output)
 * Goal-seeking: re-invokes itself via EventBridge on ALERT detection (15-min max)
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const bedrock  = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamo   = new DynamoDBClient({});
const smClient = new SecretsManagerClient({});

type GuardianAction = "DIAGNOSE" | "TITLE_VERIFY" | "ALERT" | "STATUS";

interface GuardianInput {
  action:    GuardianAction;
  vin?:      string;
  memberId?: string;
  telemetry?: Record<string, unknown>;
  alertData?: Record<string, unknown>;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export const handler = async (
  event: APIGatewayProxyEventV2 | GuardianInput,
): Promise<APIGatewayProxyResultV2 | Record<string, unknown>> => {

  // Detect whether invoked from API GW or Step Functions / EventBridge
  const isApiEvent = "requestContext" in event;
  const input: GuardianInput = isApiEvent
    ? { action: (event.queryStringParameters?.action as GuardianAction) ?? "STATUS" }
    : (event as GuardianInput);

  try {
    switch (input.action) {
      case "DIAGNOSE":      return await diagnoseVehicle(input);
      case "TITLE_VERIFY":  return await verifyTitle(input);
      case "ALERT":         return await processAlert(input);
      case "STATUS":
      default:              return await getGuardianStatus();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error({ agentName: "Guardian", action: input.action, error: msg });
    if (isApiEvent) {
      return { statusCode: 500, body: JSON.stringify({ error: "Guardian agent error", detail: msg }) };
    }
    throw err;  // Let Step Functions handle retry
  }
};

// ── DIAGNOSE ─────────────────────────────────────────────────────────────────
async function diagnoseVehicle(input: GuardianInput) {
  const { vin, telemetry } = input;
  if (!vin) throw new Error("VIN required for DIAGNOSE action");

  const prompt = `You are the Guardian V2X vehicle intelligence agent for 3C Onyx, a luxury automotive platform.
Analyse the following vehicle telemetry data and OBD-II fault codes for VIN ${vin}.
Return a structured JSON diagnosis with:
- severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAR"
- faultCodes: string[]
- diagnosis: string (plain language, < 100 words)
- recommendedAction: string
- estimatedRepairCost: { min: number, max: number, currency: "USD" }
- safetyRisk: boolean

Telemetry: ${JSON.stringify(telemetry ?? {})}`;

  const response = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.GUARDIAN_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens:        512,
      messages:          [{ role: "user", content: prompt }],
    }),
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  const diagnosis = JSON.parse(result.content[0].text);

  // Stamp vehicle passport with diagnosis event
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.DVP_TABLE_NAME ?? "3c-digital-vehicle-passports",
    Item: {
      pk:        { S: `VIN#${vin}` },
      sk:        { S: `EVENT#${now}` },
      eventType: { S: "GUARDIAN_DIAGNOSIS" },
      severity:  { S: diagnosis.severity },
      data:      { S: JSON.stringify(diagnosis) },
      createdAt: { S: now },
    },
    ConditionExpression: "attribute_not_exists(pk) OR attribute_not_exists(sk)",
  }));

  return { statusCode: 200, body: JSON.stringify({ vin, diagnosis, timestamp: now }) };
}

// ── TITLE_VERIFY ──────────────────────────────────────────────────────────────
async function verifyTitle(input: GuardianInput) {
  const { vin } = input;
  if (!vin) throw new Error("VIN required for TITLE_VERIFY");

  // Query all DVP events for this VIN (chain-of-title)
  const dvpResult = await dynamo.send(new QueryCommand({
    TableName:                 process.env.DVP_TABLE_NAME ?? "3c-digital-vehicle-passports",
    KeyConditionExpression:    "pk = :pk",
    ExpressionAttributeValues: { ":pk": { S: `VIN#${vin}` } },
    ScanIndexForward:          true,
  }));

  const events = dvpResult.Items ?? [];

  // Ask Bedrock to analyse the chain for anomalies
  const prompt = `You are a vehicle title verification agent. Analyse this chain-of-title event log for VIN ${vin}.
Detect any title washing, odometer rollback, salvage history, or ownership gap anomalies.
Return JSON: { clean: boolean, flags: string[], riskScore: number (0-100), summary: string }

Event chain (${events.length} events):
${JSON.stringify(events.slice(-20))}`;

  const response = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.GUARDIAN_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens:        512,
      messages:          [{ role: "user", content: prompt }],
    }),
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  const verification = JSON.parse(result.content[0].text);

  return {
    statusCode: 200,
    body: JSON.stringify({ vin, verification, eventCount: events.length }),
  };
}

// ── ALERT ─────────────────────────────────────────────────────────────────────
async function processAlert(input: GuardianInput) {
  const now = new Date().toISOString();
  const alertId = `alert-${Date.now()}`;

  // Write to audit vault
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#Guardian" },
      sk:           { S: `DECISION#${now}` },
      decisionType: { S: "V2X_ALERT" },
      alertId:      { S: alertId },
      data:         { S: JSON.stringify(input.alertData ?? {}) },
      createdAt:    { S: now },
    },
  }));

  return { alertId, status: "PROCESSED", timestamp: now };
}

// ── STATUS ────────────────────────────────────────────────────────────────────
async function getGuardianStatus() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      agent:      "Guardian",
      status:     "ACTIVE",
      modelId:    process.env.GUARDIAN_MODEL_ID,
      goalSeeking: process.env.GOAL_SEEKING === "true",
      meshRegions: { west: 0, midwest: 0, south: 0, northeast: 0 },  // populated by telemetry
      timestamp:   new Date().toISOString(),
    }),
  };
}
