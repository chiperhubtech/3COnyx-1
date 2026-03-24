// @ts-nocheck
import { Router, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

const SEED_NOTIFICATIONS = [
  { type: "DELIVERY" as const, title: "Runner en route", body: "Marcus Webb has picked up your 2022 Porsche Cayenne and is heading to Beverly Hills Porsche." },
  { type: "BGC" as const, title: "Background check cleared", body: "Specialist Jordan Lee has passed Checkr screening. BGC badge issued." },
  { type: "PAYOUT" as const, title: "Member Slice payout landed", body: "$2,375 has been transferred to your Stripe Connect account. Ref: tr_****8812." },
  { type: "RUNNER" as const, title: "Delivery completed", body: "Your 2021 Tesla Model S Plaid has been delivered. QR handshake verified at 2:14 PM." },
  { type: "ALERT" as const, title: "Watchlist price drop", body: "2023 Ferrari Roma you're watching dropped $8,000 to $287,500. Now below your target price." },
  { type: "BGC" as const, title: "New specialist application", body: "Priya Kapoor submitted a Specialist application. Checkr BGC is pending (est. 24–72h)." },
  { type: "PAYOUT" as const, title: "Stripe payout scheduled", body: "Your weekly payout of $14,200 is scheduled for Monday at 9 AM." },
  { type: "DELIVERY" as const, title: "Inspection completed", body: "Pre-pickup inspection for your Bentley Bentayga is complete. 5 panels rated — all clear." },
  { type: "SYSTEM" as const, title: "SOC2 audit sync", body: "Audit Vault automatically synced 24 new log entries. SHA-256 hashes verified." },
  { type: "RUNNER" as const, title: "Runner assigned", body: "Devon Carter (Checkr verified) has been assigned to your Rolls-Royce Ghost delivery." },
  { type: "ALERT" as const, title: "Delivery delayed", body: "Traffic on I-405 — your delivery ETA has shifted by 22 minutes. Runner tracking live." },
  { type: "PAYOUT" as const, title: "Commission ledger updated", body: "3 new commission entries posted totaling $6,850. View details in Member Wallet." },
];

router.get("/notifications", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  const unreadCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(eq(notificationsTable.read, false));
  res.json({ notifications: rows, unreadCount: unreadCount[0]?.count ?? 0 });
});

router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
  res.json({ ok: true });
});

router.post("/notifications/read-all", async (_req: Request, res: Response) => {
  await db.update(notificationsTable).set({ read: true });
  res.json({ ok: true });
});

router.post("/notifications/seed", async (_req: Request, res: Response) => {
  const now = Date.now();
  const entries = SEED_NOTIFICATIONS.map((n, i) => ({
    ...n,
    read: i > 4,
    createdAt: new Date(now - i * 3_600_000 * 2),
  }));
  await db.insert(notificationsTable).values(entries);
  res.json({ seeded: entries.length });
});

export default router;
