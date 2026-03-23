/**
 * MarketCheck Agent — Wholesale Pricing Engine
 * ─────────────────────────────────────────────
 * Handles:
 *   PRICE_LOOKUP     — Live wholesale + retail pricing via MarketCheck API
 *   ESTIMATE_REPAIR  — Parts + labour cost estimation
 *   AUCTION          — Live auction inventory search
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import type { APIGatewayProxyResultV2 } from "aws-lambda";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sm      = new SecretsManagerClient({});

type MarketCheckAction = "PRICE_LOOKUP" | "ESTIMATE_REPAIR" | "AUCTION";

interface MarketCheckInput {
  action:   MarketCheckAction;
  vin?:     string;
  make?:    string;
  model?:   string;
  year?:    number;
  zip?:     string;
  miles?:   number;
  faultCodes?: string[];
  parts?:   string[];
}

export const handler = async (event: MarketCheckInput | Record<string, unknown>) => {
  const input = "action" in event ? (event as MarketCheckInput) : JSON.parse((event as { body?: string }).body ?? "{}") as MarketCheckInput;

  // Retrieve MarketCheck API key from Secrets Manager
  const secret = await sm.send(new GetSecretValueCommand({
    SecretId: process.env["3C_PROD_MARKETCHECK_ARN"],
  }));
  const { apiKey } = JSON.parse(secret.SecretString ?? "{}");

  switch (input.action) {
    case "PRICE_LOOKUP":    return await priceLookup(input, apiKey);
    case "ESTIMATE_REPAIR": return await estimateRepair(input, apiKey);
    case "AUCTION":         return await auctionSearch(input, apiKey);
    default:                return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
  }
};

async function priceLookup(input: MarketCheckInput, apiKey: string): Promise<APIGatewayProxyResultV2> {
  const params = new URLSearchParams({
    api_key: apiKey,
    ...(input.vin   && { vin:   input.vin   }),
    ...(input.make  && { make:  input.make  }),
    ...(input.model && { model: input.model }),
    ...(input.year  && { year:  String(input.year)  }),
    ...(input.zip   && { zip:   input.zip   }),
    ...(input.miles && { miles: String(input.miles) }),
  });

  const [wholesaleRes, retailRes] = await Promise.all([
    fetch(`https://marketcheck-prod.apigee.net/v2/search/car/active?${params}&price_range=0-200000&car_type=used`),
    fetch(`https://marketcheck-prod.apigee.net/v2/stats/car?${params}`),
  ]);

  const [wholesale, retail] = await Promise.all([wholesaleRes.json(), retailRes.json()]);

  // Use Bedrock Nova Pro to extract structured pricing insight
  const prompt = `You are a wholesale vehicle pricing analyst. Given the following MarketCheck API data, extract:
{ wholesalePrice: number, retailPrice: number, gap: number, confidence: "HIGH"|"MEDIUM"|"LOW", priceRange: { min: number, max: number } }

Wholesale data: ${JSON.stringify((wholesale as { listings?: unknown[] }).listings?.slice(0, 5) ?? wholesale)}
Retail stats:   ${JSON.stringify(retail)}`;

  const bedrockRes = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.ANALYSIS_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      messages:   [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 256, temperature: 0 },
    }),
  }));

  const parsed = JSON.parse(new TextDecoder().decode(bedrockRes.body));
  const pricing = JSON.parse(parsed.output?.message?.content?.[0]?.text ?? "{}");

  return {
    statusCode: 200,
    body: JSON.stringify({ vin: input.vin, pricing, source: "MarketCheck", timestamp: new Date().toISOString() }),
  };
}

async function estimateRepair(input: MarketCheckInput, _apiKey: string) {
  if (!input.faultCodes?.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "faultCodes required" }) };
  }

  const prompt = `Estimate vehicle repair cost for fault codes: ${input.faultCodes.join(", ")}.
Vehicle: ${input.year ?? "Unknown"} ${input.make ?? ""} ${input.model ?? ""}, ${input.miles ?? 0} miles.
Return JSON: { parts: [{name: string, partCost: number}], laborHours: number, laborRate: number, totalMin: number, totalMax: number }`;

  const bedrockRes = await bedrock.send(new InvokeModelCommand({
    modelId:     process.env.ANALYSIS_MODEL_ID!,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify({
      messages:        [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 512, temperature: 0 },
    }),
  }));

  const parsed   = JSON.parse(new TextDecoder().decode(bedrockRes.body));
  const estimate = JSON.parse(parsed.output?.message?.content?.[0]?.text ?? "{}");

  return { estimate, source: "Bedrock+MarketCheck", timestamp: new Date().toISOString() };
}

async function auctionSearch(input: MarketCheckInput, apiKey: string) {
  const params = new URLSearchParams({
    api_key: apiKey,
    ...(input.make  && { make:  input.make  }),
    ...(input.model && { model: input.model }),
    ...(input.year  && { year:  String(input.year) }),
    rows: "20",
    sort_by: "price", sort_order: "asc",
  });

  const res = await fetch(`https://marketcheck-prod.apigee.net/v2/search/car/active?${params}&car_type=used`);
  const data = await res.json() as { listings?: unknown[] };

  return {
    statusCode: 200,
    body: JSON.stringify({
      results:   data.listings?.slice(0, 10) ?? [],
      count:     data.listings?.length ?? 0,
      source:    "MarketCheck Live Auction",
      timestamp: new Date().toISOString(),
    }),
  };
}
