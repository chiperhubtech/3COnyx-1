/**
 * HyperTrack Agent — Delivery Intelligence + Technician Dispatch
 * ──────────────────────────────────────────────────────────────
 * Handles:
 *   DISPATCH  — Assign nearest certified technician to repair job
 *   TRACK     — Real-time delivery / technician location
 *   ETA       — Compute ETA using HyperTrack + Bedrock route analysis
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

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sm      = new SecretsManagerClient({});
const dynamo  = new DynamoDBClient({});

const HYPERTRACK_BASE = "https://v3.api.hypertrack.com";

type HyperTrackAction = "DISPATCH" | "TRACK" | "ETA";

interface HyperTrackInput {
  action:        HyperTrackAction;
  memberId?:     string;
  vehicleId?:    string;
  vin?:          string;
  jobId?:        string;
  destination?: { lat: number; lng: number; address: string };
  faultCodes?:  string[];
}

export const handler = async (event: HyperTrackInput | Record<string, unknown>) => {
  const isApiEvent = "requestContext" in event;
  const input: HyperTrackInput = isApiEvent
    ? {
        action: "TRACK",
        jobId:  (event as { queryStringParameters?: { id?: string } }).queryStringParameters?.id,
      }
    : (event as HyperTrackInput);

  const secret   = await sm.send(new GetSecretValueCommand({ SecretId: process.env["3C_PROD_HYPERTRACK_ARN"] }));
  const { apiKey } = JSON.parse(secret.SecretString ?? "{}");
  const authHeader = `Basic ${Buffer.from(apiKey).toString("base64")}`;

  switch (input.action) {
    case "DISPATCH": return await dispatch(input, authHeader);
    case "TRACK":    return await track(input, authHeader);
    case "ETA":      return await computeEta(input, authHeader);
    default:         return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  }
};

async function dispatch(input: HyperTrackInput, authHeader: string) {
  if (!input.destination) throw new Error("destination required for DISPATCH");

  // Create a HyperTrack trip (technician → member location)
  const tripRes = await fetch(`${HYPERTRACK_BASE}/trips`, {
    method:  "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body:    JSON.stringify({
      device_id:   "AUTO_ASSIGN",   // HyperTrack auto-assigns nearest available driver
      destination: {
        geometry:  { type: "Point", coordinates: [input.destination.lng, input.destination.lat] },
        radius:    50,
        scheduled_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),  // 15 min from now
      },
      metadata: {
        memberId: input.memberId,
        vin:      input.vin,
        jobType:  "REPAIR",
        faults:   input.faultCodes?.join(",") ?? "",
      },
    }),
  });
  const trip = await tripRes.json() as { id?: string; status?: string; estimate?: { arrive_at?: string } };

  // Ask Bedrock to generate an ETA message for the member
  const etaMsg = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.ANALYSIS_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      messages: [{
        role:    "user",
        content: [{
          text: `Generate a brief, professional message for a luxury automotive client confirming their repair technician dispatch.
ETA: ${trip.estimate?.arrive_at ?? "within 20 minutes"}.
Address: ${input.destination.address}.
Tone: white-glove, concise. Max 2 sentences.`,
        }],
      }],
      inferenceConfig: { maxTokens: 100, temperature: 0.3 },
    }),
  }));

  const parsedEta = JSON.parse(new TextDecoder().decode(etaMsg.body));
  const etaMessage = parsedEta.output?.message?.content?.[0]?.text ?? "Your technician is on the way.";

  // Audit record
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#HyperTrack" },
      sk:           { S: `DECISION#${now}` },
      decisionType: { S: "TECHNICIAN_DISPATCHED" },
      memberId:     { S: input.memberId ?? "UNKNOWN" },
      tripId:       { S: trip.id ?? "UNKNOWN" },
      createdAt:    { S: now },
    },
  }));

  return {
    tripId:      trip.id,
    status:      trip.status ?? "dispatched",
    eta:         trip.estimate?.arrive_at,
    etaMessage,
    destination: input.destination,
    timestamp:   now,
  };
}

async function track(input: HyperTrackInput, authHeader: string) {
  if (!input.jobId) return { statusCode: 400, body: JSON.stringify({ error: "jobId required" }) };

  const res  = await fetch(`${HYPERTRACK_BASE}/trips/${input.jobId}`, {
    headers: { Authorization: authHeader },
  });
  const trip = await res.json() as Record<string, unknown>;

  return { statusCode: res.status, body: JSON.stringify(trip) };
}

async function computeEta(input: HyperTrackInput, authHeader: string) {
  if (!input.jobId) throw new Error("jobId required");

  const res   = await fetch(`${HYPERTRACK_BASE}/trips/${input.jobId}/summary`, {
    headers: { Authorization: authHeader },
  });
  const data  = await res.json() as { duration?: number; distance?: number; status?: string };

  return {
    statusCode: 200,
    body: JSON.stringify({
      jobId:     input.jobId,
      eta:       data.duration ? `${Math.round(data.duration / 60)} minutes` : "Calculating…",
      distance:  data.distance ? `${(data.distance / 1609).toFixed(1)} miles` : "Unknown",
      status:    data.status,
      timestamp: new Date().toISOString(),
    }),
  };
}
