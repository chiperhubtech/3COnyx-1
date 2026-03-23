/**
 * 3C Onyx — Chain of Custody API
 *
 * GET  /api/blockchain/chain/:vehicleId        — Full hash-linked audit chain
 * POST /api/blockchain/entry                   — Add a new custody entry
 * GET  /api/blockchain/verify/:vehicleId       — Verify chain integrity
 * GET  /api/blockchain/entry/:hash             — Lookup entry by SHA-256 hash
 * GET  /api/blockchain/status                  — Hub status + all tracked vehicles
 */
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

export default router;
