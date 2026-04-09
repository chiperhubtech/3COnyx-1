/**
 * 3C ONYX — Proof Engine Hash-Chain Schema
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Sovereign Infrastructure — Cryptographic State Verification Layer
 * Trade Secret TS-PROOF — Immutable Proof-of-State for Every System Action
 *
 * Every state change in the ONYX network produces a cryptographically linked
 * proof record. The chain is append-only and self-verifying. Any break in the
 * chain is detectable, making post-hoc tampering provably impossible.
 */
import { pgTable, text, serial, integer, timestamp, pgEnum, jsonb, index, boolean } from "drizzle-orm/pg-core";

export const proofEventTypeEnum = pgEnum("proof_event_type", [
  "GENESIS",
  "DEAL_CREATED",
  "DEAL_STATUS_CHANGED",
  "PAYMENT_COMPLETED",
  "PAYOUT_SPLIT",
  "VEHICLE_VERIFIED",
  "VEHICLE_REGISTERED",
  "NODE_JOINED",
  "NODE_ATTRIBUTED",
  "REFERRAL_CREDITED",
  "SERVICE_DISPATCHED",
  "SERVICE_COMPLETED",
  "LOGISTICS_DISPATCHED",
  "LOGISTICS_DELIVERED",
  "FINANCE_SUBMITTED",
  "FINANCE_APPROVED",
  "INCENTIVE_APPLIED",
  "KYC_VERIFIED",
  "WALLET_CREDIT",
  "WALLET_DEBIT",
  "REMITTANCE_SENT",
  "QR_SCANNED",
  "AGENT_ACTION",
  "ESCALATION_CREATED",
  "SYSTEM_EVENT",
]);

export const proofChainTable = pgTable("proof_chain", {
  id: serial("id").primaryKey(),
  chainIndex: integer("chain_index").notNull(),
  eventType: proofEventTypeEnum("event_type").notNull(),

  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),

  actorId: text("actor_id"),
  actorRole: text("actor_role"),
  agentId: text("agent_id"),

  payloadHash: text("payload_hash").notNull(),
  previousHash: text("previous_hash").notNull(),
  proofHash: text("proof_hash").notNull().unique(),

  hmacSignature: text("hmac_signature").notNull(),

  payload: jsonb("payload"),
  participants: jsonb("participants"),

  confidenceScore: integer("confidence_score"),
  isVerified: boolean("is_verified").notNull().default(true),

  architectSignature: text("architect_signature").notNull()
    .default("RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::3CONYX_SOVEREIGN"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("proof_chain_entity_idx").on(t.entityType, t.entityId),
  index("proof_chain_event_type_idx").on(t.eventType),
  index("proof_chain_actor_idx").on(t.actorId),
  index("proof_chain_created_idx").on(t.createdAt),
  index("proof_chain_proof_hash_idx").on(t.proofHash),
  index("proof_chain_chain_index_idx").on(t.chainIndex),
]);

export type ProofChainRecord = typeof proofChainTable.$inferSelect;
export type ProofChainInsert = typeof proofChainTable.$inferInsert;
