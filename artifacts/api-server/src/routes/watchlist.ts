import { Router, type Request, type Response } from "express";
import { db, watchlistTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/watchlist", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(watchlistTable)
    .orderBy(desc(watchlistTable.createdAt));
  res.json({ watchlist: rows });
});

router.post("/watchlist", async (req: Request, res: Response) => {
  const { vinMasked, heading, make, model, year, listedPrice, targetPrice } = req.body as {
    vinMasked?: string;
    heading?: string;
    make?: string;
    model?: string;
    year?: number;
    listedPrice?: number;
    targetPrice?: number;
  };

  if (!vinMasked || !heading || !make || !model || !year) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [row] = await db
    .insert(watchlistTable)
    .values({
      sessionId: "demo",
      vinMasked,
      heading,
      make,
      model,
      year,
      listedPrice: listedPrice ?? null,
      targetPrice: targetPrice ?? null,
    })
    .returning();

  res.status(201).json(row);
});

router.delete("/watchlist/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
  res.status(204).end();
});

export default router;
