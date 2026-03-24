/**
 * 3C Onyx — Chain of Custody API
 *
 * GET  /api/blockchain/chain/:vehicleId        — Full hash-linked audit chain
 * POST /api/blockchain/entry                   — Add a new custody entry
 * GET  /api/blockchain/verify/:vehicleId       — Verify chain integrity
 * GET  /api/blockchain/entry/:hash             — Lookup entry by SHA-256 hash
 * GET  /api/blockchain/proof/:hash             — Public proof certificate (no auth)
 * GET  /api/blockchain/status                  — Hub status + all tracked vehicles
 */
import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { addEntry, getChain, verifyChain, verifyEntry, getAllVehicleIds, type EntryType } from "../lib/chainOfCustody";
import { maskPii } from "../lib/cipher";

const router = Router();

router.get("/blockchain/status", (_req: Request, res: Response) => {
  const vehicleIds = getAllVehicleIds();
  res.json({
    status: "LIVE",
    network: process.env.ETH_PRIVATE_KEY ? "ethereum-sepolia" : "local-hash-chain",
    anchoringEnabled: !!process.env.ETH_PRIVATE_KEY,
    trackedVehicles: vehicleIds.length,
    vehicleIds,
    algorithm: "SHA-256",
    description: "Tamper-evident hash-linked ledger. Optional Ethereum Sepolia anchoring.",
  });
});

router.get("/blockchain/chain/:vehicleId", (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const chain = getChain(vehicleId);
  if (!chain.length) {
    res.status(404).json({ error: "No chain found for this vehicle" });
    return;
  }
  res.json({
    vehicleId,
    totalEntries: chain.length,
    latestHash: chain.at(-1)?.sha256,
    entries: chain.map(e => ({
      ...e,
      actor: maskPii(e.actor),
    })),
  });
});

router.post("/blockchain/entry", async (req: Request, res: Response) => {
  const { vehicleId, vinMasked, type, actor, actorRole, data } = req.body as {
    vehicleId: string;
    vinMasked: string;
    type: EntryType;
    actor: string;
    actorRole: string;
    data: Record<string, unknown>;
  };

  if (!vehicleId || !type || !actor) {
    res.status(400).json({ error: "vehicleId, type, and actor are required" });
    return;
  }

  const entry = await addEntry(vehicleId, vinMasked ?? "•••masked•••", type, actor, actorRole ?? "member", data ?? {});
  res.status(201).json({ entry: { ...entry, actor: maskPii(entry.actor) } });
});

router.get("/blockchain/verify/:vehicleId", (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const result = verifyChain(vehicleId);
  res.json({
    vehicleId,
    ...result,
    verifiedAt: new Date().toISOString(),
    badge: result.valid ? "INTEGRITY_INTACT" : "CHAIN_BROKEN",
  });
});

router.get("/blockchain/entry/:hash", (req: Request, res: Response) => {
  const { hash } = req.params;
  const entry = verifyEntry(hash);
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json({ ...entry, actor: maskPii(entry.actor) });
});

/**
 * GET /api/blockchain/proof/:hash
 * Public, no-auth proof certificate for a single entry.
 * Anyone — investor, regulator, buyer — can verify any hash independently.
 */
router.get("/blockchain/proof/:hash", (req: Request, res: Response) => {
  const { hash } = req.params;

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    res.status(400).json({ error: "Invalid hash — must be a 64-character hex SHA-256 string" });
    return;
  }

  const entry = verifyEntry(hash);
  if (!entry) {
    res.status(404).json({
      verified: false,
      hash,
      error: "Hash not found in 3C Onyx chain-of-custody ledger",
      tip: "Ensure the hash is exact — SHA-256 hashes are case-sensitive",
    });
    return;
  }

  const HMAC_SECRET = process.env.BLOCKCHAIN_HMAC_SECRET ?? "3c-onyx-chain-of-custody-v1-secret";
  const expectedHmac = crypto.createHmac("sha256", HMAC_SECRET).update(hash).digest("hex");
  const hmacValid = entry.hmacSignature === expectedHmac;

  res.json({
    verified: true,
    hmacValid,
    integrityStatus: hmacValid ? "INTACT" : "SIGNATURE_MISMATCH",
    certificate: {
      hash,
      hmacSignature: entry.hmacSignature,
      vehicleId: entry.vehicleId,
      vinMasked: entry.vinMasked,
      eventType: entry.type,
      blockIndex: entry.blockIndex,
      previousHash: entry.previousHash,
      timestamp: entry.timestamp,
      ethTxHash: entry.ethTxHash ?? null,
      ethNetwork: entry.ethTxHash ? "ethereum-sepolia" : null,
      issuedBy: "3C Onyx Chain-of-Custody Authority",
      algorithm: "SHA-256 + HMAC-SHA-256",
      verifiedAt: new Date().toISOString(),
    },
    howToVerify: [
      "1. Reproduce the SHA-256 hash using: SHA256(entryId + vehicleId + type + actor + data + previousHash + blockIndex + timestamp)",
      "2. Compare to the hash field — any tamper breaks the match",
      "3. Verify the HMAC signature using the published HMAC-SHA-256 key",
      "4. If ethTxHash is present, verify on Sepolia Etherscan — the hash prefix is anchored on-chain",
    ],
  });
});

export default router;
