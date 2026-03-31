import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

export type TaskType = "conversation" | "analysis" | "summarization" | "coding" | "quick" | "vision" | "critique";
export type Provider = "openai" | "gemini" | "bedrock" | "anthropic";

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string;
}

export interface RouteResult {
  content: string;
  provider: Provider;
  model: string;
  taskType: TaskType;
  durationMs: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  citations?: string[];
}

const MODEL_MAP: Record<Provider, Record<TaskType, string>> = {
  openai: {
    conversation:   "gpt-5-mini",
    analysis:       "gpt-5.2",
    summarization:  "gpt-5-mini",
    coding:         "gpt-5.2",
    quick:          "gpt-5-nano",
    vision:         "gpt-5.2",
    critique:       "gpt-5-mini",
  },
  gemini: {
    conversation:   "gemini-2.0-flash",
    analysis:       "gemini-2.5-pro-preview-06-05",
    summarization:  "gemini-2.0-flash",
    coding:         "gemini-2.5-pro-preview-06-05",
    quick:          "gemini-2.0-flash",
    vision:         "gemini-2.0-flash",
    critique:       "gemini-2.0-flash",
  },
  bedrock: {
    conversation:  "anthropic.claude-3-haiku-20240307-v1:0",
    analysis:      "anthropic.claude-3-5-sonnet-20241022-v2:0",
    summarization: "anthropic.claude-3-haiku-20240307-v1:0",
    coding:        "anthropic.claude-3-5-sonnet-20241022-v2:0",
    quick:         "anthropic.claude-3-haiku-20240307-v1:0",
    vision:        "anthropic.claude-3-5-sonnet-20241022-v2:0",
    critique:      "anthropic.claude-3-haiku-20240307-v1:0",
  },
  anthropic: {
    conversation:   "claude-sonnet-4-6",
    analysis:       "claude-opus-4-6",
    summarization:  "claude-haiku-4-5",
    coding:         "claude-opus-4-6",
    quick:          "claude-haiku-4-5",
    vision:         "claude-sonnet-4-6",
    critique:       "claude-haiku-4-5",
  },
};

const ROUTING_TABLE: Record<TaskType, Provider[]> = {
  conversation:   ["openai",  "gemini",    "bedrock",   "anthropic"],
  analysis:       ["openai",  "bedrock",   "anthropic", "gemini"  ],
  summarization:  ["openai",  "gemini",    "bedrock",   "anthropic"],
  coding:         ["openai",  "bedrock",   "anthropic", "gemini"  ],
  quick:          ["openai",  "gemini",    "bedrock",   "anthropic"],
  vision:         ["openai"],
  critique:       ["openai",  "gemini",    "bedrock",   "anthropic"],
};

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const USE_BEDROCK = !!process.env.AWS_REGION;

let _bedrock:   BedrockRuntimeClient | null = null;
let _openai:    OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrock) _bedrock = new BedrockRuntimeClient({ region: AWS_REGION });
  return _bedrock;
}

async function callBedrock(messages: AiMessage[], model: string, systemPrompt?: string): Promise<string> {
  if (!USE_BEDROCK) throw new Error("AWS_REGION not configured — Bedrock unavailable");
  const client = getBedrockClient();

  const anthropicMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens:        2048,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: anthropicMessages,
  };

  const cmd = new InvokeModelCommand({
    modelId:     model,
    contentType: "application/json",
    accept:      "application/json",
    body:        JSON.stringify(requestBody),
  });

  const res  = await client.send(cmd);
  const body = JSON.parse(new TextDecoder().decode(res.body)) as {
    content: Array<{ type: string; text: string }>;
  };
  return body.content[0]?.text ?? "";
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey:  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "placeholder",
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey:  process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "placeholder",
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });
  }
  return _anthropic;
}

async function callGemini(messages: AiMessage[], systemPrompt?: string): Promise<string> {
  const userMsg = messages.filter(m => m.role !== "system").at(-1)?.content ?? "";
  const history = messages
    .filter(m => m.role !== "system")
    .slice(0, -1)
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user" as "user" | "model",
      parts: [{ text: m.content }],
    }));
  const chat = gemini.chats.create({
    model: "gemini-2.0-flash",
    config: { systemInstruction: systemPrompt },
    history,
  });
  const res = await chat.sendMessage({ message: userMsg });
  return res.text ?? "";
}

async function callOpenAI(messages: AiMessage[], model: string, systemPrompt?: string): Promise<string> {
  const oai = getOpenAI();
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });

  for (const m of messages.filter(m2 => m2.role !== "system")) {
    if (m.imageUrl && m.role === "user") {
      msgs.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: m.imageUrl } },
        ],
      });
    } else {
      msgs.push({ role: m.role as "user" | "assistant", content: m.content });
    }
  }
  const res = await oai.chat.completions.create({ model, messages: msgs });
  return res.choices[0]?.message?.content ?? "";
}

async function callAnthropic(messages: AiMessage[], model: string, systemPrompt?: string): Promise<string> {
  const anth = getAnthropic();
  const msgs = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
  const res = await anth.messages.create({
    model,
    max_tokens: 2048,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: msgs,
  });
  return res.content[0]?.type === "text" ? res.content[0].text : "";
}

async function invokeProvider(
  provider: Provider,
  taskType: TaskType,
  messages: AiMessage[],
  systemPrompt?: string,
): Promise<string> {
  const model = MODEL_MAP[provider][taskType];
  switch (provider) {
    case "bedrock":   return callBedrock(messages, model, systemPrompt);
    case "gemini":    return callGemini(messages, systemPrompt);
    case "openai":    return callOpenAI(messages, model, systemPrompt);
    case "anthropic": return callAnthropic(messages, model, systemPrompt);
  }
}

export async function route(
  messages: AiMessage[],
  taskType: TaskType = "conversation",
  systemPrompt?: string,
): Promise<RouteResult> {
  const chain = ROUTING_TABLE[taskType];
  const start = Date.now();
  let lastError: Error | null = null;
  let fallbackReason: string | undefined;

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    try {
      const content = await invokeProvider(provider, taskType, messages, systemPrompt);
      const result: RouteResult = {
        content,
        provider,
        model: MODEL_MAP[provider][taskType],
        taskType,
        durationMs: Date.now() - start,
        fallbackUsed: i > 0,
        fallbackReason,
      };
      if (i > 0) {
        logger.info({ provider, model: result.model, taskType, fallbackReason }, "AI router used fallback");
      }
      return result;
    } catch (err) {
      lastError = err as Error;
      fallbackReason = `${provider} failed: ${(err as Error).message?.slice(0, 80)}`;
      logger.warn({ provider, taskType, err: fallbackReason }, "AI provider failed, trying next");
    }
  }

  throw lastError ?? new Error("All AI providers exhausted");
}

export async function critiqueAndReview(
  originalQuery: string,
  agentResponse: string,
  context?: string,
): Promise<{ approved: boolean; revisedContent?: string; reviewNotes: string }> {
  const critiquePrompt = `You are a quality-assurance reviewer for 3C ONYX, a sovereign automotive platform.
Your job is to review an AI agent's response and ensure it is:
1. ACCURATE — no hallucinated data, prices, or facts
2. COMPLETE — answers the user's actual question fully
3. CLEAR — written so anyone from age 5 to 90 can understand
4. ACTIONABLE — tells the user exactly what to do next
5. SAFE — no PII exposure, no financial advice without disclaimers

User asked: "${originalQuery}"
${context ? `Context: ${context}` : ""}

Agent responded:
"""
${agentResponse}
"""

If the response is good, reply with: APPROVED
If it needs improvement, reply with: REVISED: [your improved version]
Then on a new line, write NOTES: [brief explanation of what you checked/changed]`;

  try {
    const result = await route(
      [{ role: "user", content: critiquePrompt }],
      "critique",
    );

    const text = result.content.trim();
    if (text.startsWith("APPROVED")) {
      const notesMatch = text.match(/NOTES:\s*(.*)/s);
      return { approved: true, reviewNotes: notesMatch?.[1]?.trim() ?? "Passed review" };
    }

    const revisedMatch = text.match(/REVISED:\s*([\s\S]*?)(?:NOTES:|$)/);
    const notesMatch = text.match(/NOTES:\s*(.*)/s);
    return {
      approved: false,
      revisedContent: revisedMatch?.[1]?.trim() ?? agentResponse,
      reviewNotes: notesMatch?.[1]?.trim() ?? "Revised for clarity",
    };
  } catch (err) {
    logger.warn({ err }, "Critique loop failed — passing through original response");
    return { approved: true, reviewNotes: "Critique unavailable — original passed through" };
  }
}

export async function analyzeImage(
  imageBase64: string,
  prompt: string,
): Promise<RouteResult> {
  const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
  const messages: AiMessage[] = [
    { role: "user", content: prompt, imageUrl: dataUrl },
  ];
  return route(messages, "vision", VISION_SYSTEM_PROMPT);
}

const VISION_SYSTEM_PROMPT = `You are ONYX Vision — the visual analysis engine of 3C ONYX, a sovereign automotive platform.

When analyzing automotive images, you MUST:
1. If you see a VIN (Vehicle Identification Number) — extract it exactly (17 characters)
2. If you see a window sticker / Monroney label — extract: Year, Make, Model, Trim, MSRP, key features
3. If you see vehicle damage — describe: location, severity (minor/moderate/severe), estimated repair category
4. If you see a rim/wheel — identify: brand if visible, size, condition, finish type
5. If you see a document — extract key text content

Always respond in plain, friendly language that anyone can understand.
Format structured data clearly. Be specific and confident.`;

export function getRouterStatus() {
  return {
    providers: (Object.keys(MODEL_MAP) as Provider[]).map(p => ({
      name: p,
      models: MODEL_MAP[p],
      isPrimary: p === "openai",
      sovereign: p === "bedrock",
    })),
    routingTable: ROUTING_TABLE,
    taskTypes: Object.keys(ROUTING_TABLE) as TaskType[],
    bedrockRegion: USE_BEDROCK ? AWS_REGION : null,
    sovereignAi: USE_BEDROCK,
    enterpriseStack: "v4.0",
    capabilities: ["text", "vision", "critique-review", "multi-model-routing"],
  };
}
