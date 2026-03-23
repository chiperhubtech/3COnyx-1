/**
 * Smartcar Agent — Connected Vehicle Telemetry
 * ─────────────────────────────────────────────
 * Handles:
 *   TELEMETRY — Fetch real-time vehicle data (location, odometer, fuel, battery)
 *   LOCK      — Remote door lock command
 *   UNLOCK    — Remote door unlock command
 *   SYNC_DVP  — Sync latest telemetry into Digital Vehicle Passport
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const sm     = new SecretsManagerClient({});
const dynamo = new DynamoDBClient({});

type SmartcarAction = "TELEMETRY" | "LOCK" | "UNLOCK" | "SYNC_DVP";

interface SmartcarInput {
  action:    SmartcarAction;
  vehicleId: string;
  vin?:      string;
  memberId?: string;
}

export const handler = async (event: SmartcarInput | Record<string, unknown>) => {
  const isApiEvent = "requestContext" in event;
  const input: SmartcarInput = isApiEvent
    ? {
        action:    "TELEMETRY",
        vehicleId: (event as { queryStringParameters?: { vehicleId?: string } }).queryStringParameters?.vehicleId ?? "",
      }
    : (event as SmartcarInput);

  const secret  = await sm.send(new GetSecretValueCommand({ SecretId: process.env["3C_PROD_SMARTCAR_ARN"] }));
  const { apiKey: smartcarToken } = JSON.parse(secret.SecretString ?? "{}");

  const base    = "https://api.smartcar.com/v2.0";
  const headers = {
    Authorization: `Bearer ${smartcarToken}`,
    "Content-Type": "application/json",
  };

  switch (input.action) {
    case "TELEMETRY": {
      const [location, odometer, fuel, battery] = await Promise.allSettled([
        fetch(`${base}/vehicles/${input.vehicleId}/location`,  { headers }).then(r => r.json()),
        fetch(`${base}/vehicles/${input.vehicleId}/odometer`,  { headers }).then(r => r.json()),
        fetch(`${base}/vehicles/${input.vehicleId}/fuel`,      { headers }).then(r => r.json()),
        fetch(`${base}/vehicles/${input.vehicleId}/battery`,   { headers }).then(r => r.json()),
      ]);

      const telemetry = {
        vehicleId: input.vehicleId,
        location:  location.status  === "fulfilled" ? location.value  : null,
        odometer:  odometer.status  === "fulfilled" ? odometer.value  : null,
        fuel:      fuel.status      === "fulfilled" ? fuel.value      : null,
        battery:   battery.status   === "fulfilled" ? battery.value   : null,
        timestamp: new Date().toISOString(),
      };

      // Stamp DVP with telemetry snapshot
      if (input.vin) {
        await dynamo.send(new PutItemCommand({
          TableName: process.env.DVP_TABLE_NAME ?? "3c-digital-vehicle-passports",
          Item: {
            pk:        { S: `VIN#${input.vin}` },
            sk:        { S: `EVENT#${telemetry.timestamp}` },
            eventType: { S: "TELEMETRY_SNAPSHOT" },
            data:      { S: JSON.stringify(telemetry) },
            createdAt: { S: telemetry.timestamp },
          },
        }));
      }

      return {
        statusCode: 200,
        body: JSON.stringify(telemetry),
      };
    }

    case "LOCK": {
      const res = await fetch(`${base}/vehicles/${input.vehicleId}/security`, {
        method:  "POST",
        headers,
        body:    JSON.stringify({ action: "LOCK" }),
      });
      const data = await res.json() as Record<string, unknown>;
      await auditAction("REMOTE_LOCK", input, data);
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    case "UNLOCK": {
      const res = await fetch(`${base}/vehicles/${input.vehicleId}/security`, {
        method:  "POST",
        headers,
        body:    JSON.stringify({ action: "UNLOCK" }),
      });
      const data = await res.json() as Record<string, unknown>;
      await auditAction("REMOTE_UNLOCK", input, data);
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    default:
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  }
};

async function auditAction(type: string, input: SmartcarInput, result: Record<string, unknown>) {
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#Smartcar" },
      sk:           { S: `DECISION#${now}` },
      decisionType: { S: type },
      vehicleId:    { S: input.vehicleId },
      memberId:     { S: input.memberId ?? "UNKNOWN" },
      result:       { S: JSON.stringify(result) },
      createdAt:    { S: now },
    },
  }));
}
