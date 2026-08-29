/**
 * AUTHOR_ID:     Ronald Antonio Cadet
 * ENTITY:        CUXTOMCANDYCLUB LLC
 * STATUS:        SOVEREIGN_OWNER
 * DISTRIBUTION:  PROHIBITED
 *
 * ONYX Source — Sovereign Procurement Engine API
 * ───────────────────────────────────────────────
 * Member submits a sourcing request anonymously. Vendors bid.
 * ONYX AI scores every bid. Member confirms one winner.
 * Platform fee captured on award. Member never negotiates.
 */

import { Router, type Request, type Response } from "express";
import {
  db,
  sourceRequestsTable,
  sourceBidsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";
import { z } from "zod/v4";

const router = Router();

function authenticatedUserId(req: Request): number {
  return Number(req.user!.sub);
}

// ── Category labels for display ──────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  VEHICLE_PURCHASE:  "Vehicle Purchase",
  VEHICLE_TRANSPORT: "Vehicle Transport",
  VEHICLE_SERVICE:   "Vehicle Service",
  VEHICLE_INSURANCE: "Vehicle Insurance",
  LEGAL_SERVICES:    "Legal Services",
  FINANCIAL_SERVICES:"Financial Services",
  CONCIERGE:         "Concierge",
  OTHER:             "Other",
};

// ── ONYX AI bid scoring (deterministic scoring engine) ───────────────────────
function scoreAndRankBids(
  bids: Array<{ id: number; priceCents: number; deliveryDays: number; proposalText: string }>,
  budgetMaxCents: number,
) {
  return bids.map((bid) => {
    const priceScore    = Math.max(0, 100 - Math.round(((bid.priceCents - 0) / budgetMaxCents) * 60));
    const speedScore    = Math.max(0, 40 - bid.deliveryDays);
    const qualityScore  = Math.min(20, Math.round(bid.proposalText.length / 25));
    const total         = Math.min(100, priceScore + speedScore + qualityScore);

    let reasoning = `Scored ${total}/100. `;
    if (priceScore > 40) reasoning += "Competitive pricing. ";
    else reasoning += "Price is above average for this request. ";
    if (speedScore > 20) reasoning += "Fast turnaround. ";
    if (qualityScore > 12) reasoning += "Detailed proposal indicates thoroughness.";

    return { ...bid, aiScore: total, aiReasoning: reasoning };
  }).sort((a, b) => b.aiScore - a.aiScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/source  —  Member's own requests
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = authenticatedUserId(req);

  const requests = await db
    .select()
    .from(sourceRequestsTable)
    .where(eq(sourceRequestsTable.memberId, userId))
    .orderBy(desc(sourceRequestsTable.createdAt));

  const enriched = await Promise.all(requests.map(async (r) => {
    const bids = await db
      .select()
      .from(sourceBidsTable)
      .where(eq(sourceBidsTable.requestId, r.id));
    return { ...r, bidCount: bids.length, categoryLabel: CATEGORY_LABELS[r.category] ?? r.category };
  }));

  res.json({ requests: enriched });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/source/:id  —  Full request detail with ranked bids
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId    = authenticatedUserId(req);
  const requestId = parseInt(String(req.params.id), 10);

  const [request] = await db
    .select()
    .from(sourceRequestsTable)
    .where(and(eq(sourceRequestsTable.id, requestId), eq(sourceRequestsTable.memberId, userId)));

  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  const rawBids = await db
    .select({
      id:            sourceBidsTable.id,
      vendorId:      sourceBidsTable.vendorId,
      proposalText:  sourceBidsTable.proposalText,
      priceCents:    sourceBidsTable.priceCents,
      feeStructure:  sourceBidsTable.feeStructure,
      deliveryDays:  sourceBidsTable.deliveryDays,
      credentials:   sourceBidsTable.credentials,
      aiScore:       sourceBidsTable.aiScore,
      aiReasoning:   sourceBidsTable.aiReasoning,
      status:        sourceBidsTable.status,
      createdAt:     sourceBidsTable.createdAt,
      vendorName:    usersTable.name,
    })
    .from(sourceBidsTable)
    .leftJoin(usersTable, eq(sourceBidsTable.vendorId, usersTable.id))
    .where(eq(sourceBidsTable.requestId, requestId))
    .orderBy(desc(sourceBidsTable.aiScore));

  // Mask vendor identity if member has not awarded yet (Theorem concept)
  const bids = rawBids.map((b: (typeof rawBids)[0], i: number) => ({
    ...b,
    vendorName: request.status === "AWARDED" && request.awardedBidId === b.id
      ? b.vendorName
      : `Vendor ${String.fromCharCode(65 + i)}`,   // Vendor A, Vendor B, Vendor C...
  }));

  res.json({ request: { ...request, categoryLabel: CATEGORY_LABELS[request.category] ?? request.category }, bids });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/source  —  Member creates a new sourcing request
// ─────────────────────────────────────────────────────────────────────────────
const createSchema = z.object({
  category:         z.enum(["VEHICLE_PURCHASE","VEHICLE_TRANSPORT","VEHICLE_SERVICE","VEHICLE_INSURANCE","LEGAL_SERVICES","FINANCIAL_SERVICES","CONCIERGE","OTHER"]),
  title:            z.string().min(5).max(200),
  description:      z.string().min(20).max(2000),
  budgetMinCents:   z.number().int().min(0).default(0),
  budgetMaxCents:   z.number().int().min(100),
  feeStructurePref: z.enum(["FIXED","HOURLY","HYBRID","ANY"]).default("ANY"),
  deadlineDays:     z.number().int().min(1).max(30).default(7),
  isAnonymous:      z.boolean().default(true),
});

router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = authenticatedUserId(req);
  const body   = createSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid request", issues: body.error.issues }); return; }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + body.data.deadlineDays);

  const [created] = await db
    .insert(sourceRequestsTable)
    .values({
      memberId:         userId,
      category:         body.data.category,
      title:            body.data.title,
      description:      body.data.description,
      budgetMinCents:   body.data.budgetMinCents,
      budgetMaxCents:   body.data.budgetMaxCents,
      feeStructurePref: body.data.feeStructurePref,
      anonymousToken:   randomUUID(),
      isAnonymous:      body.data.isAnonymous,
      deadline,
      status:           "OPEN",
    })
    .returning();

  res.status(201).json({ request: created });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/source/:id/bid  —  Vendor submits a bid
// ─────────────────────────────────────────────────────────────────────────────
const bidSchema = z.object({
  proposalText:  z.string().min(50).max(3000),
  priceCents:    z.number().int().min(1),
  feeStructure:  z.enum(["FIXED","HOURLY","HYBRID"]).default("FIXED"),
  deliveryDays:  z.number().int().min(1).max(365).default(7),
  credentials:   z.string().max(1000).optional(),
});

router.post("/:id/bid", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const vendorId  = authenticatedUserId(req);
  const requestId = parseInt(String(req.params.id), 10);

  const [request] = await db
    .select()
    .from(sourceRequestsTable)
    .where(eq(sourceRequestsTable.id, requestId));

  if (!request)           { res.status(404).json({ error: "Request not found" }); return; }
  if (request.status !== "OPEN") { res.status(400).json({ error: "This request is no longer accepting bids" }); return; }
  if (request.memberId === vendorId) { res.status(400).json({ error: "Cannot bid on your own request" }); return; }

  const body = bidSchema.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid bid", issues: body.error.issues }); return; }

  // AI-score all bids including this new one
  const existingBids = await db
    .select()
    .from(sourceBidsTable)
    .where(eq(sourceBidsTable.requestId, requestId));

  const allBids = [
    ...existingBids,
    { id: -1, priceCents: body.data.priceCents, deliveryDays: body.data.deliveryDays, proposalText: body.data.proposalText },
  ];

  const scored = scoreAndRankBids(allBids, request.budgetMaxCents);
  const newBidScored = scored.find((b) => b.id === -1)!;

  const [created] = await db
    .insert(sourceBidsTable)
    .values({
      requestId,
      vendorId,
      proposalText: body.data.proposalText,
      priceCents:   body.data.priceCents,
      feeStructure: body.data.feeStructure,
      deliveryDays: body.data.deliveryDays,
      credentials:  body.data.credentials,
      aiScore:      newBidScored.aiScore,
      aiReasoning:  newBidScored.aiReasoning,
      status:       "PENDING",
    })
    .returning();

  // Update AI top bid on the request
  const topScored = scored.filter((b) => b.id !== -1).sort((a, b) => b.aiScore - a.aiScore);
  const topBidId  = topScored[0]?.id ?? null;

  await db
    .update(sourceRequestsTable)
    .set({ aiTopBidId: topBidId, status: "IN_REVIEW", updatedAt: new Date() })
    .where(eq(sourceRequestsTable.id, requestId));

  res.status(201).json({ bid: created });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/source/:id/award/:bidId  —  Member awards a bid (one confirmation)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:id/award/:bidId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId    = authenticatedUserId(req);
  const requestId = parseInt(String(req.params.id), 10);
  const bidId     = parseInt(String(req.params.bidId), 10);

  const [request] = await db
    .select()
    .from(sourceRequestsTable)
    .where(and(eq(sourceRequestsTable.id, requestId), eq(sourceRequestsTable.memberId, userId)));

  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  if (request.status === "AWARDED") { res.status(400).json({ error: "Already awarded" }); return; }

  const [bid] = await db
    .select()
    .from(sourceBidsTable)
    .where(and(eq(sourceBidsTable.id, bidId), eq(sourceBidsTable.requestId, requestId)));

  if (!bid) { res.status(404).json({ error: "Bid not found" }); return; }

  // Platform fee = 3% of winning bid (the ONYX revenue model)
  const platformFeeCents = Math.round(bid.priceCents * 0.03);

  await db
    .update(sourceRequestsTable)
    .set({ status: "AWARDED", awardedBidId: bidId, platformFeeCents, updatedAt: new Date() })
    .where(eq(sourceRequestsTable.id, requestId));

  await db
    .update(sourceBidsTable)
    .set({ status: "AWARDED", updatedAt: new Date() })
    .where(eq(sourceBidsTable.id, bidId));

  // Reject all other bids
  await db
    .update(sourceBidsTable)
    .set({ status: "REJECTED", updatedAt: new Date() })
    .where(and(eq(sourceBidsTable.requestId, requestId)));

  // Re-award the winner
  await db
    .update(sourceBidsTable)
    .set({ status: "AWARDED" })
    .where(eq(sourceBidsTable.id, bidId));

  res.json({ awarded: true, platformFeeCents, message: "ONYX Source award confirmed." });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/source/:id/close  —  Member closes a request without awarding
// ─────────────────────────────────────────────────────────────────────────────
router.post("/:id/close", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId    = authenticatedUserId(req);
  const requestId = parseInt(String(req.params.id), 10);

  const [request] = await db
    .select()
    .from(sourceRequestsTable)
    .where(and(eq(sourceRequestsTable.id, requestId), eq(sourceRequestsTable.memberId, userId)));

  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  await db
    .update(sourceRequestsTable)
    .set({ status: "CLOSED", updatedAt: new Date() })
    .where(eq(sourceRequestsTable.id, requestId));

  res.json({ closed: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/source/admin/all  —  Admin overview of all sourcing activity
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/all", requireAuth, async (_req: Request, res: Response) => {
  const requests = await db
    .select()
    .from(sourceRequestsTable)
    .orderBy(desc(sourceRequestsTable.createdAt))
    .limit(100);

  const totalPlatformFees = requests.reduce((sum: number, r: (typeof requests)[0]) => sum + (r.platformFeeCents ?? 0), 0);
  const awarded  = requests.filter((r: (typeof requests)[0]) => r.status === "AWARDED").length;
  const open     = requests.filter((r: (typeof requests)[0]) => r.status === "OPEN").length;
  const inReview = requests.filter((r: (typeof requests)[0]) => r.status === "IN_REVIEW").length;

  res.json({ requests, stats: { total: requests.length, open, inReview, awarded, totalPlatformFees } });
});

export default router;
