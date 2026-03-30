/**
 * 3C ONYX — EventBridge Event Bus
 * ─────────────────────────────────
 * Production: publishes typed events to AWS EventBridge
 * Development: in-process EventEmitter (same API, zero infra needed)
 *
 * AWS-05 upgrade — decouples agent mesh into event-driven architecture
 *
 * Usage:
 *   import { eventBus, onEvent } from "./eventBus";
 *   await eventBus.emit("agent.task.complete", { taskId, agentId, result });
 *   onEvent("agent.task.complete", (payload) => { ... });
 */

import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { EventEmitter } from "events";
import { logger } from "./logger";

export type OnyxEventType =
  | "agent.task.pending"
  | "agent.task.assigned"
  | "agent.task.running"
  | "agent.task.complete"
  | "agent.task.failed"
  | "agent.task.handed_off"
  | "member.registered"
  | "member.kyc.passed"
  | "member.kyc.failed"
  | "payment.escrow.created"
  | "payment.escrow.released"
  | "payment.dynasty_fee.earned"
  | "runner.dispatched"
  | "runner.location.updated"
  | "runner.mission.complete"
  | "vehicle.dvp.stamped"
  | "vehicle.inspection.complete"
  | "vehicle.alert.guardian"
  | "guardian.predictive.alert"
  | "fraud.score.high"
  | "referral.chain.activated";

export interface OnyxEvent<T = Record<string, unknown>> {
  type:      OnyxEventType;
  source:    string;
  payload:   T;
  ts:        string;
  traceId?:  string;
}

// ── Local EventEmitter (dev + test) ──────────────────────────────────────────
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(50);

// ── AWS EventBridge client ────────────────────────────────────────────────────
const EVENT_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME ?? "3c-onyx-event-bus";
const AWS_REGION     = process.env.AWS_REGION ?? "us-east-1";
const USE_EVENTBRIDGE = process.env.NODE_ENV === "production" && !!process.env.AWS_REGION;

let _eb: EventBridgeClient | null = null;
function getEBClient(): EventBridgeClient {
  if (!_eb) _eb = new EventBridgeClient({ region: AWS_REGION });
  return _eb;
}

// ── Publish ───────────────────────────────────────────────────────────────────
async function emit<T extends Record<string, unknown>>(
  type: OnyxEventType,
  payload: T,
  options?: { source?: string; traceId?: string },
): Promise<void> {
  const event: OnyxEvent<T> = {
    type,
    source:  options?.source ?? "3c-onyx-api",
    payload,
    ts:      new Date().toISOString(),
    traceId: options?.traceId,
  };

  // Always emit locally (subscribers in same process always work)
  localEmitter.emit(type, event);
  localEmitter.emit("*", event);

  // In production, also publish to EventBridge
  if (USE_EVENTBRIDGE) {
    try {
      const client = getEBClient();
      await client.send(new PutEventsCommand({
        Entries: [{
          EventBusName: EVENT_BUS_NAME,
          Source:       event.source,
          DetailType:   event.type,
          Detail:       JSON.stringify(event),
          Time:         new Date(),
        }],
      }));
    } catch (err) {
      logger.warn({ type, err: (err as Error).message }, "[eventBus] EventBridge publish failed — event delivered locally only");
    }
  }
}

// ── Subscribe ─────────────────────────────────────────────────────────────────
function onEvent<T extends Record<string, unknown>>(
  type: OnyxEventType | "*",
  handler: (event: OnyxEvent<T>) => void | Promise<void>,
): () => void {
  const wrapper = (event: OnyxEvent<T>) => {
    try {
      Promise.resolve(handler(event)).catch(err => {
        logger.error({ type, err: (err as Error).message }, "[eventBus] Event handler error");
      });
    } catch (err) {
      logger.error({ type, err: (err as Error).message }, "[eventBus] Event handler sync error");
    }
  };
  localEmitter.on(type, wrapper);
  return () => localEmitter.off(type, wrapper);
}

// ── Status ────────────────────────────────────────────────────────────────────
function getStatus() {
  return {
    mode:          USE_EVENTBRIDGE ? "eventbridge" : "local",
    eventBusName:  USE_EVENTBRIDGE ? EVENT_BUS_NAME : "local-emitter",
    listenerCount: localEmitter.eventNames().length,
  };
}

export const eventBus = { emit, onEvent, getStatus };
export { onEvent };
