import { Router, type Request, type Response } from "express";
import { db, successStoriesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireSovereign } from "../middlewares/requireSovereign";

const router = Router();

router.get("/published", async (_req: Request, res: Response) => {
  const stories = await db
    .select()
    .from(successStoriesTable)
    .where(
      sql`${successStoriesTable.status} IN ('Published', 'Featured')`
    )
    .orderBy(desc(successStoriesTable.totalEarnings));
  res.json({ stories });
});

router.get("/featured", async (_req: Request, res: Response) => {
  const stories = await db
    .select()
    .from(successStoriesTable)
    .where(
      and(
        eq(successStoriesTable.status, "Featured"),
        eq(successStoriesTable.isFeatured, true),
      )
    )
    .orderBy(desc(successStoriesTable.totalEarnings));
  res.json({ stories });
});

router.get("/stats", async (_req: Request, res: Response) => {
  const result = await db
    .select({
      totalStories: sql<number>`count(*)`,
      totalEarnings: sql<number>`coalesce(sum(${successStoriesTable.totalEarnings}), 0)`,
      avgMonthly: sql<number>`coalesce(avg(${successStoriesTable.monthlyAvg}), 0)`,
      totalDeals: sql<number>`coalesce(sum(${successStoriesTable.dealsCompleted}), 0)`,
      topEarner: sql<number>`coalesce(max(${successStoriesTable.totalEarnings}), 0)`,
    })
    .from(successStoriesTable)
    .where(sql`${successStoriesTable.status} IN ('Published', 'Featured')`);

  const stats = result[0];
  res.json({
    totalStories: Number(stats?.totalStories ?? 0),
    totalEarnings: Number(stats?.totalEarnings ?? 0),
    avgMonthly: Math.round(Number(stats?.avgMonthly ?? 0)),
    totalDeals: Number(stats?.totalDeals ?? 0),
    topEarner: Number(stats?.topEarner ?? 0),
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [story] = await db
    .select()
    .from(successStoriesTable)
    .where(eq(successStoriesTable.id, id));
  if (!story) { res.status(404).json({ error: "Story not found" }); return; }
  res.json({ story });
});

router.post("/", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const [story] = await db
    .insert(successStoriesTable)
    .values(req.body)
    .returning();
  res.status(201).json({ story });
});

router.patch("/:id", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [story] = await db
    .update(successStoriesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(successStoriesTable.id, id))
    .returning();
  if (!story) { res.status(404).json({ error: "Story not found" }); return; }
  res.json({ story });
});

router.delete("/:id", requireAuth, requireSovereign, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
  res.json({ deleted: true });
});

export default router;
