/**
 * 3C ONYX — EventBridge Event Bus + Proof Engine Integration
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-EVENTBUS-SOVEREIGN
 *
 * The Event Bus is the nervous system of the ONYX network.
 * Every agent action, deal state change, payment, and vehicle event
 * flows through this bus. Subscribers react in real-time.
 *
 * Integrations:
 *   - AWS EventBridge (production pub/sub)
 *   - WebSocket Hub (real-time client push)
 *   - Proof Engine (cryptographic state recording)
 *   - Agent Mesh (agent-to-agent communication)
 */

import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { EventEmitter } from "events";
import { logger } from "./logger";
import * as wsHub from "./wsHub";

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
  | "dealer_group_created"
  | "dealer_group_joined"
  | "dealer_benchmark_submitted"
  | "referral.chain.activated"
  | "referral.created"
  | "referral.settled"
  | "vault.bundle.sealed"
  | "node.registered"
  | "node.appointment.scheduled"
  | "deal.structured"
  | "deal.created"
  | "deal.status_changed"
  | "payment.completed"
  | "payout.split"
  | "vehicle.verified"
  | "vehicle.registered"
  | "node.joined"
  | "node.attributed"
  | "referral.credited"
  | "service.dispatched"
  | "service.completed"
  | "logistics.dispatched"
  | "logistics.delivered"
  | "finance.submitted"
  | "finance.approved"
  | "incentive.applied"
  | "kyc.verified"
  | "wallet.credit"
  | "wallet.debit"
  | "remittance.sent"
  | "qr.scanned"
  | "agent.action"
  | "escalation.created"
  | "friction.detected"
  | "demand.assessed"
  | "hub.upgrade.eligible";

export interface OnyxEvent<T = Record<string, unknown>> {
  type:      OnyxEventType;
  source:    string;
  payload:   T;
  ts:        string;
  traceId?:  string;
  entityType?: string;
  entityId?:   string;
  actorId?:    string;
  actorRole?:  string;
  agentId?:    string;
  participants?: Record<string, unknown>[];
  confidenceScore?: number;
}

const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(100);

const EVENT_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME ?? "3c-onyx-event-bus";
const AWS_REGION     = process.env.AWS_REGION ?? "us-east-1";
const USE_EVENTBRIDGE = process.env.NODE_ENV === "production" && !!process.env.AWS_REGION;

let _eb: EventBridgeClient | null = null;
function getEBClient(): EventBridgeClient {
  if (!_eb) _eb = new EventBridgeClient({ region: AWS_REGION });
  return _eb;
}

const EVENT_TO_WS_ROOM: Record<string, string> = {
  "deal.created": "agents",
  "deal.status_changed": "agents",
  "deal.structured": "agents",
  "payment.completed": "notify",
  "payout.split": "notify",
  "vehicle.verified": "agents",
  "vehicle.registered": "agents",
  "node.joined": "notify",
  "node.attributed": "notify",
  "service.dispatched": "tracking",
  "service.completed": "tracking",
  "logistics.dispatched": "tracking",
  "logistics.delivered": "tracking",
  "runner.dispatched": "tracking",
  "runner.location.updated": "tracking",
  "runner.mission.complete": "tracking",
  "agent.action": "agents",
  "agent.task.complete": "agents",
  "guardian.predictive.alert": "alerts",
  "vehicle.alert.guardian": "alerts",
  "referral.created": "notify",
  "referral.credited": "notify",
  "wallet.credit": "notify",
  "escalation.created": "agents",
};

const PROOF_EVENTS = new Set([
  "deal.created",
  "deal.status_changed",
  "payment.completed",
  "payout.split",
  "vehicle.verified",
  "vehicle.registered",
  "node.joined",
  "node.attributed",
  "referral.credited",
  "service.dispatched",
  "service.completed",
  "logistics.dispatched",
  "logistics.delivered",
  "finance.submitted",
  "finance.approved",
  "incentive.applied",
  "kyc.verified",
  "wallet.credit",
  "wallet.debit",
  "remittance.sent",
  "qr.scanned",
  "agent.action",
  "escalation.created",
]);

const EVENT_TO_PROOF_TYPE: Record<string, string> = {
  "deal.created": "DEAL_CREATED",
  "deal.status_changed": "DEAL_STATUS_CHANGED",
  "payment.completed": "PAYMENT_COMPLETED",
  "payout.split": "PAYOUT_SPLIT",
  "vehicle.verified": "VEHICLE_VERIFIED",
  "vehicle.registered": "VEHICLE_REGISTERED",
  "node.joined": "NODE_JOINED",
  "node.attributed": "NODE_ATTRIBUTED",
  "referral.credited": "REFERRAL_CREDITED",
  "service.dispatched": "SERVICE_DISPATCHED",
  "service.completed": "SERVICE_COMPLETED",
  "logistics.dispatched": "LOGISTICS_DISPATCHED",
  "logistics.delivered": "LOGISTICS_DELIVERED",
  "finance.submitted": "FINANCE_SUBMITTED",
  "finance.approved": "FINANCE_APPROVED",
  "incentive.applied": "INCENTIVE_APPLIED",
  "kyc.verified": "KYC_VERIFIED",
  "wallet.credit": "WALLET_CREDIT",
  "wallet.debit": "WALLET_DEBIT",
  "remittance.sent": "REMITTANCE_SENT",
  "qr.scanned": "QR_SCANNED",
  "agent.action": "AGENT_ACTION",
  "escalation.created": "ESCALATION_CREATED",
};

let totalEmitted = 0;
let totalProofed = 0;
const startedAt = new Date().toISOString();

async function emit<T extends Record<string, unknown>>(
  type: OnyxEventType,
  payload: T,
  options?: {
    source?: string;
    traceId?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    actorRole?: string;
    agentId?: string;
    participants?: Record<string, unknown>[];
    confidenceScore?: number;
  },
): Promise<string | null> {
  const event: OnyxEvent<T> = {
    type,
    source:  options?.source ?? "3c-onyx-api",
    payload,
    ts:      new Date().toISOString(),
    traceId: options?.traceId,
    entityType: options?.entityType,
    entityId: options?.entityId,
    actorId: options?.actorId,
    actorRole: options?.actorRole,
    agentId: options?.agentId,
    participants: options?.participants,
    confidenceScore: options?.confidenceScore,
  };

  totalEmitted++;

  localEmitter.emit(type, event);
  localEmitter.emit("*", event);

  const wsRoom = EVENT_TO_WS_ROOM[type];
  if (wsRoom) {
    try {
      wsHub.broadcast(wsRoom as any, {
        event: type,
        entityType: options?.entityType,
        entityId: options?.entityId,
        payload,
        timestamp: event.ts,
      });
    } catch (e) {
      logger.warn({ event: type, error: (e as Error).message }, "WS broadcast failed");
    }
  }

  let proofHash: string | null = null;
  if (PROOF_EVENTS.has(type) && options?.entityType && options?.entityId) {
    try {
      const { appendProof } = await import("./proofEngine");
      const proofType = EVENT_TO_PROOF_TYPE[type] as any;
      if (proofType) {
        proofHash = await appendProof({
          eventType: proofType,
          entityType: options.entityType,
          entityId: options.entityId,
          actorId: options.actorId,
          actorRole: options.actorRole,
          agentId: options.agentId,
          payload: payload as Record<string, unknown>,
          participants: options.participants,
          confidenceScore: options.confidenceScore,
        });
        totalProofed++;
      }
    } catch (e) {
      logger.error({ event: type, error: (e as Error).message }, "Proof Engine append failed");
    }
  }

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

  return proofHash;
}

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

function getStatus() {
  return {
    mode:          USE_EVENTBRIDGE ? "eventbridge" : "local",
    eventBusName:  USE_EVENTBRIDGE ? EVENT_BUS_NAME : "local-emitter",
    listenerCount: localEmitter.eventNames().length,
    totalEmitted,
    totalProofed,
    startedAt,
    architect: "Ronald Antonio Cadet",
  };
}

localEmitter.on("friction.detected", (event: OnyxEvent) => {
  try {
    const { assessDemand } = require("./michelinDemandEngine") as typeof import("./michelinDemandEngine");
    const frictionEvents = (event.payload?.frictionEvents ?? [event.payload?.frictionEvent]) as string[];
    const assessment = assessDemand(
      frictionEvents.filter(Boolean) as import("./michelinDemandEngine").FrictionEvent[],
      event.payload?.vehicleAge as number | undefined,
      event.payload?.vehicleMileage as number | undefined,
    );
    if (assessment.demandTier === "CRITICAL" || assessment.demandTier === "EMERGENCY") {
      emit("demand.assessed", {
        ...assessment,
        sourceEvent: event.type,
      }, {
        source: "michelin-demand-engine",
        entityType: "vehicle",
        entityId: event.entityId,
        actorId: event.actorId,
      }).catch(() => {});
    }
    logger.info({
      demandScore: assessment.demandScore,
      tier: assessment.demandTier,
      upgradePath: assessment.upgradePath,
      entityId: event.entityId,
    }, "[eventBus] Michelin Demand auto-assessed friction event");
  } catch (err) {
    logger.error({ err: (err as Error).message }, "[eventBus] Michelin Demand listener error");
  }
});

export const eventBus = { emit, onEvent, getStatus };
export { onEvent };
