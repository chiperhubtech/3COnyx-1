/**
 * Concierge Agent — Gemini AI / Bedrock NLP
 * ──────────────────────────────────────────
 * Handles:
 *   CHAT              — Member natural-language interaction (deal negotiation, Q&A)
 *   SEARCH_PARTS      — Browserbase-powered OEM parts search
 *   SEND_WELCOME      — Post-purchase personalised message
 *   ONBOARDING_WELCOME— New subscriber welcome flow
 *
 * Bedrock model: claude-3-5-sonnet (highest quality reasoning)
 * Memory: 2 GB (streaming response buffering)
 */

import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const bedrock  = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sm       = new SecretsManagerClient({});
const dynamo   = new DynamoDBClient({});

type ConciergeAction = "CHAT" | "SEARCH_PARTS" | "SEND_WELCOME" | "ONBOARDING_WELCOME";

interface ConciergeInput {
  action:     ConciergeAction;
  memberId?:  string;
  message?:   string;
  context?:   Record<string, unknown>;
  vehicleData?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are the 3C Onyx luxury automotive concierge — a world-class automotive advisor
with deep knowledge of vehicle acquisition, maintenance, financing, and the luxury car market.
You represent Cuxtom Candy Club (3C), a premium members-only automotive platform.
Tone: sophisticated, confident, succinct. Never mention competitors. Always be security-first.
You have access to live wholesale pricing, vehicle history, and member wallet data.
Respond in plain text unless JSON is explicitly requested.`;

export const handler = async (
  event: APIGatewayProxyEventV2 | ConciergeInput,
): Promise<APIGatewayProxyResultV2 | Record<string, unknown>> => {

  const isApiEvent = "requestContext" in event;
  let input: ConciergeInput;

  if (isApiEvent) {
    const body = JSON.parse((event as APIGatewayProxyEventV2).body ?? "{}");
    input = { action: "CHAT", ...body };
  } else {
    input = event as ConciergeInput;
  }

  try {
    switch (input.action) {
      case "CHAT":               return await chat(input);
      case "SEARCH_PARTS":       return await searchParts(input);
      case "SEND_WELCOME":       return await sendWelcome(input, "purchase");
      case "ONBOARDING_WELCOME": return await sendWelcome(input, "onboarding");
      default:                   throw new Error(`Unknown action: ${(input as ConciergeInput).action}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error({ agentName: "Concierge", action: input.action, error: msg });
    return isApiEvent
      ? { statusCode: 500, body: JSON.stringify({ error: "Concierge unavailable", detail: msg }) }
      : Promise.reject(err);
  }
};

async function chat(input: ConciergeInput): Promise<APIGatewayProxyResultV2> {
  if (!input.message) {
    return { statusCode: 400, body: JSON.stringify({ error: "message required" }) };
  }

  const contextBlock = input.context
    ? `\n\nMember context: ${JSON.stringify(input.context)}`
    : "";

  const response = await bedrock.send(new InvokeModelWithResponseStreamCommand({
    modelId:     process.env.CONCIERGE_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens:        1024,
      system:            SYSTEM_PROMPT + contextBlock,
      messages:          [{ role: "user", content: input.message }],
    }),
  }));

  // Collect streamed response
  let fullText = "";
  if (response.body) {
    for await (const chunk of response.body) {
      if (chunk.chunk?.bytes) {
        const parsed = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          fullText += parsed.delta.text;
        }
      }
    }
  }

  // Log to audit vault
  const now = new Date().toISOString();
  await dynamo.send(new PutItemCommand({
    TableName: process.env.AUDIT_TABLE_NAME ?? "3c-soc2-audit-vault",
    Item: {
      pk:           { S: "AGENT#Concierge" },
      sk:           { S: `DECISION#${now}` },
      decisionType: { S: "CHAT_RESPONSE" },
      memberId:     { S: input.memberId ?? "ANONYMOUS" },
      createdAt:    { S: now },
    },
  }));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      response:  fullText,
      agentId:   "Concierge",
      modelId:   process.env.CONCIERGE_MODEL_ID,
      timestamp: now,
    }),
  };
}

async function searchParts(input: ConciergeInput): Promise<Record<string, unknown>> {
  // Retrieve Browserbase credentials
  const secret = await sm.send(new GetSecretValueCommand({
    SecretId: process.env["3C_PROD_BROWSERBASE_ARN"],
  }));
  const creds = JSON.parse(secret.SecretString ?? "{}");

  // Browserbase session start (parts search automation)
  // In production, this calls the Browserbase API to launch a headless browser
  // session that navigates OEM parts suppliers and returns structured results.
  // Stub response below — replace with actual Browserbase SDK call.
  const partsResults = {
    source:   "Browserbase Autonomous Search",
    query:    input.context?.partQuery ?? "OEM parts",
    results:  [],
    apiKey:   creds.apiKey ? "CONFIGURED" : "MISSING",
    note:     "Browserbase session will launch headless browser to search OEM suppliers",
  };

  return { statusCode: 200, body: JSON.stringify(partsResults) };
}

async function sendWelcome(
  input:   ConciergeInput,
  context: "purchase" | "onboarding",
): Promise<Record<string, unknown>> {
  const vehicleInfo = input.vehicleData
    ? `Vehicle: ${JSON.stringify(input.vehicleData)}`
    : "";

  const prompt = context === "purchase"
    ? `Generate a sophisticated, personalised luxury post-purchase congratulations message for a 3C Onyx member.
${vehicleInfo}
Keep it under 150 words. Reference their vehicle specifics if provided.`
    : `Generate a warm, exclusive welcome message for a new 3C Onyx member ($99/mo subscription).
Emphasise: the luxury concierge, Dynasty Wallet, Guardian V2X protection, and white-glove service.
Keep it under 120 words.`;

  const response = await bedrock.send(new InvokeModelWithResponseStreamCommand({
    modelId:     process.env.CONCIERGE_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens:        256,
      messages:          [{ role: "user", content: prompt }],
    }),
  }));

  let message = "";
  if (response.body) {
    for await (const chunk of response.body) {
      if (chunk.chunk?.bytes) {
        const parsed = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          message += parsed.delta.text;
        }
      }
    }
  }

  return { message, memberId: input.memberId, context, timestamp: new Date().toISOString() };
}
