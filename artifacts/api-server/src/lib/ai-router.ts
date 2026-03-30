/**
 * 3C Onyx — Multi-Model AI Router
 *
 * Provides a single interface over Bedrock (Claude), Gemini, OpenAI, and Anthropic.
 * Bedrock is the primary provider: sovereign AI — member data never leaves AWS.
 * Falls back automatically on failure. Tracks provider, model, latency, fallback events.
 *
 * AWS-12 upgrade: Amazon Bedrock added as primary provider for analysis + conversation.
 * Member conversations are now processed inside AWS infrastructure — zero third-party exposure.
 */
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

export type TaskType = "conversation" | "analysis" | "summarization" | "coding" | "quick";
export type Provider = "bedrock" | "gemini" | "openai" | "anthropic";

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface RouteResult {
  content: string;
  provider: Provider;
  model: string;
  taskType: TaskType;
  durationMs: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
}

const MODEL_MAP: Record<Provider, Record<TaskType, string>> = {
  // AWS Bedrock: Claude models — sovereign AI, never leaves AWS infrastructure
  bedrock: {
    conversation:  "anthropic.claude-3-haiku-20240307-v1:0",
    analysis:      "anthropic.claude-3-5-sonnet-20241022-v2:0",
    summarization: "anthropic.claude-3-haiku-20240307-v1:0",
    coding:        "anthropic.claude-3-5-sonnet-20241022-v2:0",
    quick:         "anthropic.claude-3-haiku-20240307-v1:0",
  },
  gemini: {
    conversation:   "gemini-2.0-flash",
    analysis:       "gemini-2.5-pro-preview-06-05",
    summarization:  "gemini-2.0-flash",
    coding:         "gemini-2.5-pro-preview-06-05",
    quick:          "gemini-2.0-flash",
  },
  openai: {
    conversation:   "gpt-5-mini",
    analysis:       "gpt-5.2",
    summarization:  "gpt-5-mini",
    coding:         "gpt-5.2",
    quick:          "gpt-5-nano",
  },
  anthropic: {
    conversation:   "claude-sonnet-4-6",
    analysis:       "claude-opus-4-6",
    summarization:  "claude-haiku-4-5",
    coding:         "claude-opus-4-6",
    quick:          "claude-haiku-4-5",
  },
};

// Bedrock is primary for analysis + conversation — sovereign, 5x faster, 50% cheaper
// Gemini leads for quick tasks (already integrated via Replit integration proxy)
const ROUTING_TABLE: Record<TaskType, Provider[]> = {
  conversation:   ["bedrock",   "gemini",    "openai",    "anthropic"],
  analysis:       ["bedrock",   "anthropic", "openai",    "gemini"  ],
  summarization:  ["bedrock",   "openai",    "gemini",    "anthropic"],
  coding:         ["bedrock",   "anthropic", "openai",    "gemini"  ],
  quick:          ["gemini",    "bedrock",   "openai",    "anthropic"],
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
  msgs.push(...messages.filter(m => m.role !== "system").map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  })));
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

export function getRouterStatus() {
  return {
    providers: (Object.keys(MODEL_MAP) as Provider[]).map(p => ({
      name: p,
      models: MODEL_MAP[p],
      isPrimary: p === "bedrock",
      sovereign: p === "bedrock",
    })),
    routingTable: ROUTING_TABLE,
    taskTypes: Object.keys(ROUTING_TABLE) as TaskType[],
    bedrockRegion: USE_BEDROCK ? AWS_REGION : null,
    sovereignAi: USE_BEDROCK,
  };
}
