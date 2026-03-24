/**
 * 3C Onyx — Admin Dashboard API
 * All routes require: Auth + Admin role
 *
 * GET  /api/admin/stats          — Platform-wide metrics
 * GET  /api/admin/users          — All users (paginated)
 * GET  /api/admin/users/:id      — Single user detail
 * PATCH /api/admin/users/:id     — Update user (role, isActive, isVerified)
 * GET  /api/admin/transactions   — All transactions (paginated)
 * GET  /api/admin/waitlist       — Waitlist overview
 * POST /api/admin/audit          — Write admin audit entry
 */
import { Router, type Request, type Response } from "express";
import { db, usersTable, transactionsTable, waitlistTable, gigTasksTable, vehiclesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { writeAudit } from "../lib/auditService";

const router = Router();
router.use(requireAuth, requireRole("Admin"));

router.get("/stats", async (_req: Request, res: Response) => {
  const [userCount]    = await db.select({ count: count() }).from(usersTable);
  const [txCount]      = await db.select({ count: count() }).from(transactionsTable);
  const [vehicleCount] = await db.select({ count: count() }).from(vehiclesTable);
  const [taskCount]    = await db.select({ count: count() }).from(gigTasksTable);
  const [waitCount]    = await db.select({ count: count() }).from(waitlistTable);

  const roleBreakdown = await db
    .select({ role: usersTable.role, count: count() })
    .from(usersTable)
    .groupBy(usersTable.role);

  const recentTx = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);

  const totalRevenueCents = await db
    .select({ total: sql<string>`COALESCE(SUM(amount_cents),0)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "COMPLETED"));

  res.json({
    users:          Number(userCount.count),
    transactions:   Number(txCount.count),
    vehicles:       Number(vehicleCount.count),
    gigTasks:       Number(taskCount.count),
    waitlist:       Number(waitCount.count),
    totalRevenue:   `$${(Number(totalRevenueCents[0].total) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    roleBreakdown:  roleBreakdown.map((r) => ({ role: r.role, count: Number(r.count) })),
    recentTransactions: recentTx,
    ts: new Date().toISOString(),
  });
});

router.get("/users", async (req: Request, res: Response) => {
  const page  = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 25));
  const offset = (page - 1) * limit;

  const users = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, isActive: usersTable.isActive, isVerified: usersTable.isVerified,
      createdAt: usersTable.createdAt, lastLoginAt: usersTable.lastLoginAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db.select({ count: count() }).from(usersTable);
  res.json({ users, total: Number(total.count), page, limit, pages: Math.ceil(Number(total.count) / limit) });
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { passwordHash: _, ...pub } = user;
  res.json({ user: pub });
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  const { role, isActive, isVerified } = req.body as {
    role?: string; isActive?: boolean; isVerified?: boolean;
  };
  const userId = Number(req.params.id);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (role !== undefined)       updates.role       = role;
  if (isActive !== undefined)   updates.isActive   = isActive;
  if (isVerified !== undefined) updates.isVerified = isVerified;

  const [updated] = await db.update(usersTable).set(updates as Parameters<typeof db.update>[0]).where(eq(usersTable.id, userId)).returning();
  await writeAudit({ eventType: "ADMIN", severity: "INFO", action: `Admin updated user ${userId}`, metadata: { updates, byAdmin: req.user!.sub } });
  const { passwordHash: _, ...pub } = updated;
  res.json({ user: pub });
});

router.get("/transactions", async (req: Request, res: Response) => {
  const page  = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 25));
  const offset = (page - 1) * limit;

  const txs   = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(limit).offset(offset);
  const [total] = await db.select({ count: count() }).from(transactionsTable);
  res.json({ transactions: txs, total: Number(total.count), page, limit });
});

router.get("/waitlist", async (_req: Request, res: Response) => {
  const entries = await db.select().from(waitlistTable).orderBy(desc(waitlistTable.createdAt)).limit(200);
  const [total] = await db.select({ count: count() }).from(waitlistTable);
  res.json({ entries, total: Number(total.count) });
});

router.post("/audit", async (req: Request, res: Response) => {
  const { message, data } = req.body as { message?: string; data?: Record<string, unknown> };
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  await writeAudit({ eventType: "ADMIN", severity: "INFO", action: message, metadata: data ?? {} });
  res.json({ success: true });
});

export default router;
