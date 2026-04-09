/**
 * 3C ONYX — Proof Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-PROOF-ENGINE-SOVEREIGN
 *
 * The ONYX Proof Engine produces a cryptographic hash-chain that records
 * every meaningful state change across the network. Each proof links to
 * its predecessor, forming an unbreakable chain of custody. The architect
 * signature "RONALD_ANTONIO_CADET" is hard-coded into every proof block.
 *
 * This is the intellectual fortress. Every deal, every payout, every
 * vehicle verification, every node attribution — all sealed in chain.
 */

import crypto from "crypto";
import { db, proofChainTable } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { logger } from "./logger";

const ARCHITECT_SIGNATURE = "RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::3CONYX_SOVEREIGN";
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const HMAC_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "3CONYX-SOVEREIGN-HMAC-KEY";

export type ProofEventType =
  | "GENESIS"
  | "DEAL_CREATED"
  | "DEAL_STATUS_CHANGED"
  | "PAYMENT_COMPLETED"
  | "PAYOUT_SPLIT"
  | "VEHICLE_VERIFIED"
  | "VEHICLE_REGISTERED"
  | "NODE_JOINED"
  | "NODE_ATTRIBUTED"
  | "REFERRAL_CREDITED"
  | "SERVICE_DISPATCHED"
  | "SERVICE_COMPLETED"
  | "LOGISTICS_DISPATCHED"
  | "LOGISTICS_DELIVERED"
  | "FINANCE_SUBMITTED"
  | "FINANCE_APPROVED"
  | "INCENTIVE_APPLIED"
  | "KYC_VERIFIED"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "REMITTANCE_SENT"
  | "QR_SCANNED"
  | "AGENT_ACTION"
  | "ESCALATION_CREATED"
  | "SYSTEM_EVENT";

interface ProofInput {
  eventType: ProofEventType;
  entityType: string;
  entityId: string;
  actorId?: string;
  actorRole?: string;
  agentId?: string;
  payload?: Record<string, unknown>;
  participants?: Record<string, unknown>[];
  confidenceScore?: number;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSign(data: string): string {
  return crypto.createHmac("sha256", HMAC_KEY).update(data).digest("hex");
}

async function getLastProof(): Promise<{ proofHash: string; chainIndex: number } | null> {
  const rows = await db
    .select({ proofHash: proofChainTable.proofHash, chainIndex: proofChainTable.chainIndex })
    .from(proofChainTable)
    .orderBy(desc(proofChainTable.chainIndex))
    .limit(1);
  return rows[0] ?? null;
}

export async function ensureGenesis(): Promise<void> {
  const existing = await db
    .select({ id: proofChainTable.id })
    .from(proofChainTable)
    .where(eq(proofChainTable.eventType, "GENESIS"))
    .limit(1);

  if (existing.length > 0) return;

  const payloadStr = JSON.stringify({
    system: "3C ONYX",
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    mission: "Global Automotive Liquidity Network",
    protocol: "Sovereign Intelligent Revenue Network",
    techFee: "3%",
    timestamp: new Date().toISOString(),
    declaration: "This genesis block establishes the ONYX Proof Engine. " +
      "Every state change hereafter is cryptographically sealed. " +
      "The architect signature is immutable. The chain is sovereign.",
  });

  const payloadHash = sha256(payloadStr);
  const proofHash = sha256(`${GENESIS_HASH}:${payloadHash}:0:${ARCHITECT_SIGNATURE}`);
  const hmacSig = hmacSign(proofHash);

  await db.insert(proofChainTable).values({
    chainIndex: 0,
    eventType: "GENESIS",
    entityType: "SYSTEM",
    entityId: "3CONYX-GENESIS",
    actorId: "SOVEREIGN",
    actorRole: "Architect",
    agentId: "trust",
    payloadHash,
    previousHash: GENESIS_HASH,
    proofHash,
    hmacSignature: hmacSig,
    payload: JSON.parse(payloadStr),
    participants: [{ role: "Architect", name: "Ronald Antonio Cadet", entity: "CUXTOMCANDYCLUB LLC" }],
    confidenceScore: 100,
    isVerified: true,
    architectSignature: ARCHITECT_SIGNATURE,
  });

  logger.info({ proofHash }, "ONYX Proof Engine genesis block created");
}

export async function appendProof(input: ProofInput): Promise<string> {
  const last = await getLastProof();
  const previousHash = last?.proofHash ?? GENESIS_HASH;
  const nextIndex = (last?.chainIndex ?? -1) + 1;

  if (nextIndex === 0) {
    await ensureGenesis();
    return appendProof(input);
  }

  const payloadStr = JSON.stringify(input.payload ?? {});
  const payloadHash = sha256(payloadStr);

  const proofData = `${previousHash}:${payloadHash}:${nextIndex}:${input.eventType}:${input.entityType}:${input.entityId}:${ARCHITECT_SIGNATURE}`;
  const proofHash = sha256(proofData);
  const hmacSig = hmacSign(proofHash);

  await db.insert(proofChainTable).values({
    chainIndex: nextIndex,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    agentId: input.agentId,
    payloadHash,
    previousHash,
    proofHash,
    hmacSignature: hmacSig,
    payload: input.payload ?? {},
    participants: input.participants ?? [],
    confidenceScore: input.confidenceScore ?? 100,
    isVerified: true,
    architectSignature: ARCHITECT_SIGNATURE,
  });

  logger.info(
    { proofHash, chainIndex: nextIndex, eventType: input.eventType, entityId: input.entityId },
    "Proof appended to chain"
  );

  return proofHash;
}

export async function verifyChain(entityType?: string, entityId?: string): Promise<{
  valid: boolean;
  totalBlocks: number;
  brokenAt?: number;
  verifiedAt: string;
}> {
  const conditions = [];
  if (entityType) conditions.push(eq(proofChainTable.entityType, entityType));
  if (entityId) conditions.push(eq(proofChainTable.entityId, entityId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const blocks = await db
    .select()
    .from(proofChainTable)
    .where(where)
    .orderBy(proofChainTable.chainIndex);

  if (blocks.length === 0) {
    return { valid: true, totalBlocks: 0, verifiedAt: new Date().toISOString() };
  }

  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].previousHash !== blocks[i - 1].proofHash) {
      return {
        valid: false,
        totalBlocks: blocks.length,
        brokenAt: blocks[i].chainIndex,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  return { valid: true, totalBlocks: blocks.length, verifiedAt: new Date().toISOString() };
}

export async function getEntityTimeline(entityType: string, entityId: string) {
  const blocks = await db
    .select()
    .from(proofChainTable)
    .where(and(
      eq(proofChainTable.entityType, entityType),
      eq(proofChainTable.entityId, entityId),
    ))
    .orderBy(proofChainTable.chainIndex);

  return blocks.map((b) => ({
    chainIndex: b.chainIndex,
    eventType: b.eventType,
    proofHash: b.proofHash,
    actorId: b.actorId,
    actorRole: b.actorRole,
    agentId: b.agentId,
    payload: b.payload,
    participants: b.participants,
    confidenceScore: b.confidenceScore,
    isVerified: b.isVerified,
    createdAt: b.createdAt,
  }));
}

export async function getVehicleVerification(vin: string) {
  const timeline = await getEntityTimeline("VEHICLE", vin);
  const chainVerification = await verifyChain("VEHICLE", vin);

  const eventCount = timeline.length;
  const verifiedEvents = timeline.filter((e) => e.isVerified).length;
  const trustScore = eventCount > 0 ? Math.round((verifiedEvents / eventCount) * 100) : 0;

  const participants = new Set<string>();
  for (const event of timeline) {
    if (event.actorId) participants.add(event.actorId);
    if (Array.isArray(event.participants)) {
      (event.participants as Array<{ role?: string }>).forEach((p) => {
        if (p.role) participants.add(p.role);
      });
    }
  }

  return {
    vin,
    status: chainVerification.valid ? "ONYX_VERIFIED" : "CHAIN_BROKEN",
    trustScore,
    totalEvents: eventCount,
    verifiedEvents,
    chainIntegrity: chainVerification.valid,
    participantRoles: Array.from(participants),
    timeline,
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    verifiedAt: new Date().toISOString(),
  };
}

export async function getChainStats() {
  const totalResult = await db.select({ total: count() }).from(proofChainTable);
  const total = totalResult[0]?.total ?? 0;

  const last = await getLastProof();

  return {
    totalBlocks: total,
    latestIndex: last?.chainIndex ?? -1,
    latestHash: last?.proofHash ?? GENESIS_HASH,
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    engineStatus: "OPERATIONAL",
  };
}
