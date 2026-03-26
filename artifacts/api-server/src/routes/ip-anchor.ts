/**
 * IP Anchoring Routes — Proof-of-Invention Module
 * Timestamps every unique AI interaction, AR anchor, algorithm, and
 * trade secret to an immutable chain, creating a legal moat for
 * CUXTOMCANDYCLUB LLC's IP portfolio.
 *
 * POST /api/ip/anchor          — create new IP anchor
 * GET  /api/ip/anchors         — list all anchors (paginated)
 * GET  /api/ip/anchors/:id     — get specific anchor + verify integrity
 * GET  /api/ip/anchors/verify/:hash — verify anchor by hash
 */
import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db, ipAnchorsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function computeAnchorHash(contentHash: string, ts: string, previousHash: string): string {
  return createHash("sha256")
    .update(`IP|${contentHash}|${ts}|${previousHash}|CUXTOMCANDYCLUB`)
    .digest("hex");
}

// ─── POST /api/ip/anchor ──────────────────────────────────────────────────────
router.post("/ip/anchor", requireAuth, async (req: Request, res: Response) => {
  const anchoredBy = (req as Request & { user: { id: number } }).user.id;
  const { assetType, title, description, contentHash, ethTxHash } = req.body as {
    assetType?:   string;
    title?:       string;
    description?: string;
    contentHash?: string;
    ethTxHash?:   string;
  };

  if (!assetType || !title || !description || !contentHash) {
    res.status(400).json({ error: "assetType, title, description, and contentHash are all required." });
    return;
  }

  const validTypes = ["AI_INTERACTION", "AR_ANCHOR", "ALGORITHM", "FEATURE_SPEC", "TRADE_SECRET", "BRAND_ASSET", "CODE_MODULE", "DATASET"];
  if (!validTypes.includes(assetType)) {
    res.status(400).json({ error: `Invalid assetType. Must be one of: ${validTypes.join(", ")}` });
    return;
  }

  // Get the last anchor to chain correctly
  const [last] = await db.select({ anchorHash: ipAnchorsTable.anchorHash })
    .from(ipAnchorsTable).orderBy(desc(ipAnchorsTable.anchoredAt)).limit(1);

  const previousHash = last?.anchorHash ?? "GENESIS";
  const ts = new Date().toISOString();
  const anchorHash = computeAnchorHash(contentHash, ts, previousHash);

  const [anchor] = await db.insert(ipAnchorsTable).values({
    anchoredBy,
    assetType:    assetType as typeof ipAnchorsTable.$inferInsert["assetType"],
    title:        title.trim(),
    description:  description.trim(),
    contentHash:  contentHash.toLowerCase(),
    anchorHash,
    previousHash,
    ethTxHash:    ethTxHash ?? null,
    assignee:     "CUXTOMCANDYCLUB LLC",
    anchoredAt:   new Date(ts),
  }).returning();

  res.status(201).json({
    id:           anchor.id,
    anchorHash:   anchor.anchorHash,
    previousHash: anchor.previousHash,
    anchoredAt:   anchor.anchoredAt,
    assignee:     anchor.assignee,
    chainIntegrity: true,
  });
});

// ─── GET /api/ip/anchors ──────────────────────────────────────────────────────
router.get("/ip/anchors", requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "50"), 10), 200);
  const rows = await db.select().from(ipAnchorsTable).orderBy(desc(ipAnchorsTable.anchoredAt)).limit(limit);
  res.json({ anchors: rows, total: rows.length });
});

// ─── GET /api/ip/anchors/verify/:hash ─────────────────────────────────────────
router.get("/ip/anchors/verify/:hash", requireAuth, async (req: Request, res: Response) => {
  const hash = String(req.params["hash"] ?? "");
  const [anchor] = await db.select().from(ipAnchorsTable).where(eq(ipAnchorsTable.anchorHash, hash)).limit(1);
  if (!anchor) { res.status(404).json({ valid: false, error: "Anchor not found." }); return; }

  // Re-compute and verify chain integrity
  const recomputed = computeAnchorHash(anchor.contentHash, anchor.anchoredAt.toISOString(), anchor.previousHash);
  const valid = recomputed === anchor.anchorHash;

  res.json({
    valid,
    anchor: {
      id:          anchor.id,
      title:       anchor.title,
      assetType:   anchor.assetType,
      anchoredAt:  anchor.anchoredAt,
      assignee:    anchor.assignee,
      contentHash: anchor.contentHash,
      anchorHash:  anchor.anchorHash,
    },
    integrity: valid ? "CHAIN_INTACT" : "CHAIN_BROKEN",
  });
});

// ─── GET /api/ip/anchors/:id ──────────────────────────────────────────────────
router.get("/ip/anchors/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  const [anchor] = await db.select().from(ipAnchorsTable).where(eq(ipAnchorsTable.id, id)).limit(1);
  if (!anchor) { res.status(404).json({ error: "Anchor not found." }); return; }
  res.json(anchor);
});

export default router;
