/**
 * 3C ONYX — Proof Engine API Routes
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 *
 * GET /api/proof/stats              — Chain statistics
 * GET /api/proof/chain              — Full chain (paginated)
 * GET /api/proof/:entityType/:entityId — Entity timeline
 * GET /api/proof/verify             — Verify full chain integrity
 * GET /api/proof/verify/:entityType/:entityId — Verify entity chain
 * GET /api/vehicle/:vin/verify      — ONYX Verified vehicle passport
 */

import { Router, type Request, type Response } from "express";
import {
  getChainStats,
  getEntityTimeline,
  verifyChain,
  getVehicleVerification,
  ensureGenesis,
} from "../lib/proofEngine";
import { db, proofChainTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/proof/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getChainStats();
    res.json({
      ...stats,
      status: "OPERATIONAL",
      protocol: "ONYX Proof Engine v1.0",
      standard: "SHA-256 Hash-Chain + HMAC-SHA-256",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve chain stats" });
  }
});

router.get("/proof/chain", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const blocks = await db
      .select()
      .from(proofChainTable)
      .orderBy(desc(proofChainTable.chainIndex))
      .limit(limit)
      .offset(offset);

    const stats = await getChainStats();

    res.json({
      blocks: blocks.map((b) => ({
        chainIndex: b.chainIndex,
        eventType: b.eventType,
        entityType: b.entityType,
        entityId: b.entityId,
        proofHash: b.proofHash,
        previousHash: b.previousHash,
        actorId: b.actorId,
        agentId: b.agentId,
        confidenceScore: b.confidenceScore,
        isVerified: b.isVerified,
        createdAt: b.createdAt,
      })),
      total: stats.totalBlocks,
      limit,
      offset,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve chain" });
  }
});

router.get("/proof/verify", async (_req: Request, res: Response) => {
  try {
    const result = await verifyChain();
    res.json({
      ...result,
      protocol: "ONYX Proof Engine",
      architect: "Ronald Antonio Cadet",
      entity: "CUXTOMCANDYCLUB LLC",
    });
  } catch (err) {
    res.status(500).json({ error: "Chain verification failed" });
  }
});

router.get("/proof/verify/:entityType/:entityId", async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    const result = await verifyChain(entityType, entityId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Entity chain verification failed" });
  }
});

router.get("/proof/:entityType/:entityId", async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    const timeline = await getEntityTimeline(entityType, entityId);
    const verification = await verifyChain(entityType, entityId);

    res.json({
      entityType,
      entityId,
      timeline,
      chainIntegrity: verification.valid,
      totalEvents: verification.totalBlocks,
      verifiedAt: verification.verifiedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve entity timeline" });
  }
});

router.get("/vehicle/:vin/verify", async (req: Request, res: Response) => {
  try {
    const vin = req.params.vin as string;
    if (!vin || vin.length < 11) {
      res.status(400).json({ error: "Valid VIN required" });
      return;
    }
    const verification = await getVehicleVerification(vin.toUpperCase());
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: "Vehicle verification failed" });
  }
});

router.post("/proof/genesis", async (_req: Request, res: Response) => {
  try {
    await ensureGenesis();
    const stats = await getChainStats();
    res.json({
      message: "Genesis block verified",
      ...stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Genesis initialization failed" });
  }
});

export default router;
