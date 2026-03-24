/**
 * 3C Onyx — Blockchain Chain-of-Custody
 *
 * SHA-256 hash-linked immutable ledger for vehicle records.
 * Each entry hashes the previous entry's hash + its own data,
 * creating a tamper-evident chain identical in principle to blockchain.
 *
 * Architecture:
 *   - In-memory store (Redis/DB-ready interface)
 *   - Ethereum Sepolia testnet anchoring (optional — fires when ETH_PRIVATE_KEY is set)
 *   - Verification: any entry can be independently re-verified
 *
 * Entry types: inspection | delivery | transfer | ownership | maintenance | v2x_alert
 */
import crypto from "crypto";
import { ethers } from "ethers";
import { logger } from "./logger";
import { db, blockchainRecordsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type EntryType =
  | "inspection"
  | "delivery"
  | "transfer"
  | "ownership"
  | "maintenance"
  | "v2x_alert"
  | "bgc_verified"
  | "bol_issued";

export interface CustodyEntry {
  entryId: string;
  vehicleId: string;
  vinMasked: string;
  type: EntryType;
  actor: string;
  actorRole: string;
  data: Record<string, unknown>;
  sha256: string;
  hmacSignature: string;
  previousHash: string;
  blockIndex: number;
  timestamp: string;
  ethTxHash?: string;
  ethBlock?: number;
  verified: boolean;
}

interface ChainState {
  entries: CustodyEntry[];
  genesisHash: string;
}

const chains = new Map<string, ChainState>();
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const HMAC_SECRET = process.env.BLOCKCHAIN_HMAC_SECRET ?? "3c-onyx-chain-of-custody-v1-secret";

function computeHMAC(hash: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(hash).digest("hex");
}

function computeHash(entry: Omit<CustodyEntry, "sha256" | "verified">): string {
  const payload = JSON.stringify({
    entryId: entry.entryId,
    vehicleId: entry.vehicleId,
    type: entry.type,
    actor: entry.actor,
    data: entry.data,
    previousHash: entry.previousHash,
    blockIndex: entry.blockIndex,
    timestamp: entry.timestamp,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function anchorToEthereum(hash: string): Promise<{ txHash: string; block: number } | null> {
  const privateKey = process.env.ETH_PRIVATE_KEY;
  if (!privateKey) return null;

  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.ETH_RPC_URL ?? "https://rpc.sepolia.org"
    );
    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data: ethers.hexlify(ethers.toUtf8Bytes(`3C:${hash.slice(0, 16)}`)),
    });
    const receipt = await tx.wait();
    logger.info({ txHash: tx.hash, hash }, "Chain-of-custody anchored to Ethereum");
    return { txHash: tx.hash, block: receipt?.blockNumber ?? 0 };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "Ethereum anchoring failed (non-fatal)");
    return null;
  }
}

export async function addEntry(
  vehicleId: string,
  vinMasked: string,
  type: EntryType,
  actor: string,
  actorRole: string,
  data: Record<string, unknown>,
): Promise<CustodyEntry> {
  let chain = chains.get(vehicleId);
  if (!chain) {
    chain = { entries: [], genesisHash: GENESIS_HASH };
    chains.set(vehicleId, chain);
  }

  const previousHash = chain.entries.at(-1)?.sha256 ?? GENESIS_HASH;
  const blockIndex = chain.entries.length;
  const timestamp = new Date().toISOString();
  const entryId = crypto.randomUUID();

  const partial = {
    entryId,
    vehicleId,
    vinMasked,
    type,
    actor,
    actorRole,
    data,
    previousHash,
    blockIndex,
    timestamp,
  };

  const sha256 = computeHash(partial);
  const hmacSignature = computeHMAC(sha256);
  const entry: CustodyEntry = { ...partial, sha256, hmacSignature, verified: true };

  const ethResult = await anchorToEthereum(sha256);
  if (ethResult) {
    entry.ethTxHash = ethResult.txHash;
    entry.ethBlock = ethResult.block;
  }

  chain.entries.push(entry);

  try {
    await db.insert(blockchainRecordsTable).values({
      entryId: entry.entryId,
      vehicleId: entry.vehicleId,
      vinMasked: entry.vinMasked,
      type: entry.type,
      actor: entry.actor,
      actorRole: entry.actorRole,
      data: entry.data,
      sha256: entry.sha256,
      previousHash: entry.previousHash,
      blockIndex: entry.blockIndex,
      timestamp: new Date(entry.timestamp),
      hmacSignature: entry.hmacSignature,
      ethTxHash: entry.ethTxHash ?? null,
      ethBlock: entry.ethBlock ?? null,
      verified: entry.verified,
    }).onConflictDoNothing();
  } catch (err) {
    logger.warn({ err, vehicleId, sha256: sha256.slice(0, 16) }, "[blockchain] DB persist failed (non-fatal)");
  }

  logger.info({ vehicleId, type, blockIndex, sha256: sha256.slice(0, 16), hmac: hmacSignature.slice(0, 12) }, "Custody entry added");
  return entry;
}

export async function initChains(): Promise<void> {
  try {
    const records = await db
      .select()
      .from(blockchainRecordsTable)
      .orderBy(blockchainRecordsTable.id);

    for (const r of records) {
      let chain = chains.get(r.vehicleId);
      if (!chain) {
        chain = { entries: [], genesisHash: GENESIS_HASH };
        chains.set(r.vehicleId, chain);
      }
      const alreadyLoaded = chain.entries.some(e => e.sha256 === r.sha256);
      if (!alreadyLoaded) {
        chain.entries.push({
          entryId: r.entryId,
          vehicleId: r.vehicleId,
          vinMasked: r.vinMasked ?? "•••masked•••",
          type: r.type as EntryType,
          actor: r.actor,
          actorRole: r.actorRole,
          data: r.data as Record<string, unknown>,
          sha256: r.sha256,
          hmacSignature: r.hmacSignature,
          previousHash: r.previousHash,
          blockIndex: r.blockIndex,
          timestamp: r.timestamp.toISOString(),
          ethTxHash: r.ethTxHash ?? undefined,
          ethBlock: r.ethBlock ?? undefined,
          verified: r.verified,
        });
      }
    }
    logger.info({ vehicleCount: chains.size, totalEntries: records.length }, "[blockchain] Chains loaded from PostgreSQL");
  } catch (err) {
    logger.warn({ err }, "[blockchain] Failed to load chains from DB — starting fresh");
  }
}

export function getChain(vehicleId: string): CustodyEntry[] {
  return chains.get(vehicleId)?.entries ?? [];
}

export function verifyChain(vehicleId: string): {
  valid: boolean;
  totalEntries: number;
  brokenAt?: number;
  detail?: string;
} {
  const chain = chains.get(vehicleId);
  if (!chain || chain.entries.length === 0) {
    return { valid: true, totalEntries: 0 };
  }

  for (let i = 0; i < chain.entries.length; i++) {
    const entry = chain.entries[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : chain.entries[i - 1].sha256;

    if (entry.previousHash !== expectedPrev) {
      return {
        valid: false,
        totalEntries: chain.entries.length,
        brokenAt: i,
        detail: `Entry ${i} previousHash mismatch`,
      };
    }

    const recomputed = computeHash({
      entryId: entry.entryId,
      vehicleId: entry.vehicleId,
      vinMasked: entry.vinMasked,
      type: entry.type,
      actor: entry.actor,
      actorRole: entry.actorRole,
      data: entry.data,
      previousHash: entry.previousHash,
      blockIndex: entry.blockIndex,
      timestamp: entry.timestamp,
    });

    if (recomputed !== entry.sha256) {
      return {
        valid: false,
        totalEntries: chain.entries.length,
        brokenAt: i,
        detail: `Entry ${i} hash tampered`,
      };
    }
  }

  return { valid: true, totalEntries: chain.entries.length };
}

export function verifyEntry(entryHash: string): CustodyEntry | null {
  for (const chain of chains.values()) {
    const found = chain.entries.find(e => e.sha256 === entryHash);
    if (found) return found;
  }
  return null;
}

export function getAllVehicleIds(): string[] {
  return [...chains.keys()];
}

export function seedDemoChain(vehicleId: string, vinMasked: string): void {
  if (chains.has(vehicleId)) return;
  const entries: Array<[EntryType, string, string, Record<string, unknown>]> = [
    ["ownership",    "3C Certified Platform",       "system",      { event: "Vehicle onboarded to 3C Onyx", certified: true }],
    ["inspection",   "Marcus Webb",                 "runner",      { score: 94, condition: "Excellent", odometer: 4_812, sha256Signed: true }],
    ["bgc_verified", "Checkr Inc.",                 "system",      { clearanceLevel: "Premium", adjudicationStatus: "CLEAR" }],
    ["bol_issued",   "3C Logistics",                "system",      { carrier: "Ship.cars", origin: "Beverly Hills, CA", destination: "Malibu, CA" }],
    ["delivery",     "Marcus Webb",                 "runner",      { qrHandshake: true, memberSigned: true, deliveredAt: new Date(Date.now() - 86_400_000 * 2).toISOString() }],
  ];

  for (const [type, actor, role, data] of entries) {
    let chain = chains.get(vehicleId);
    if (!chain) {
      chain = { entries: [], genesisHash: GENESIS_HASH };
      chains.set(vehicleId, chain);
    }
    const previousHash = chain.entries.at(-1)?.sha256 ?? GENESIS_HASH;
    const blockIndex = chain.entries.length;
    const timestamp = new Date(Date.now() - (entries.length - blockIndex) * 86_400_000 * 3).toISOString();
    const entryId = crypto.randomUUID();
    const partial = { entryId, vehicleId, vinMasked, type, actor, actorRole: role, data, previousHash, blockIndex, timestamp };
    const sha256 = computeHash(partial);
    const hmacSignature = computeHMAC(sha256);
    chain.entries.push({ ...partial, sha256, hmacSignature, verified: true });
  }
}

seedDemoChain("veh-001", "•••••••••••8123");
seedDemoChain("veh-002", "•••••••••••7841");
