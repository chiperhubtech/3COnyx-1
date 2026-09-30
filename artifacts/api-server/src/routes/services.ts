import { Router, type Request, type Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod/v4";
import { db, serviceRequestsTable, serviceRequestEventsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/admin";
import { writeAudit } from "../lib/auditService";

const router = Router();
router.use(requireAuth);

const createRequestSchema = z.object({
  type: z.enum(["INSURANCE", "ROADSIDE", "RENTAL", "BODY_WORK"]),
  vehicleYear: z.number().int().min(1886).max(new Date().getFullYear() + 2),
  vehicleMake: z.string().trim().min(2).max(80),
  vehicleModel: z.string().trim().min(1).max(80),
  location: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(2000),
}).strict();
const statusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "FULFILLED"]),
}).strict();
const idSchema = z.coerce.number().int().positive();

function userId(req: Request): number {
  return Number(req.user!.sub);
}

router.get("/requests", async (req: Request, res: Response): Promise<void> => {
  const requests = await db.select().from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.memberId, userId(req)))
    .orderBy(desc(serviceRequestsTable.createdAt));
  res.json({ requests });
});

router.post("/requests", async (req: Request, res: Response): Promise<void> => {
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid service request", issues: parsed.error.issues });
    return;
  }
  const memberId = userId(req);
  const request = await db.transaction(async (tx) => {
    const [created] = await tx.insert(serviceRequestsTable)
      .values({ ...parsed.data, memberId }).returning();
    await tx.insert(serviceRequestEventsTable).values({
      requestId: created.id, memberId, actorId: memberId, toStatus: "NEW",
      readAt: new Date(), // the creator already knows the request was submitted
    });
    return created;
  });
  await writeAudit({
    eventType: "DB_CHANGE", action: "Service request created", actorId: memberId,
    resourceType: "service_request", resourceId: request.id,
    metadata: { type: request.type, status: request.status },
  });
  res.status(201).json({ request });
});

router.get("/requests/:id/events", async (req: Request, res: Response): Promise<void> => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request ID" }); return; }
  const memberId = userId(req);
  const [request] = await db.select({ id: serviceRequestsTable.id }).from(serviceRequestsTable)
    .where(and(eq(serviceRequestsTable.id, parsed.data), eq(serviceRequestsTable.memberId, memberId)));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  const events = await db.select().from(serviceRequestEventsTable)
    .where(eq(serviceRequestEventsTable.requestId, request.id))
    .orderBy(desc(serviceRequestEventsTable.createdAt));
  res.json({ events });
});

router.get("/notifications", async (req: Request, res: Response): Promise<void> => {
  const events = await db.select().from(serviceRequestEventsTable)
    .where(and(eq(serviceRequestEventsTable.memberId, userId(req)), isNull(serviceRequestEventsTable.readAt)))
    .orderBy(desc(serviceRequestEventsTable.createdAt));
  res.json({ notifications: events });
});

router.patch("/notifications/:id/read", async (req: Request, res: Response): Promise<void> => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) { res.status(400).json({ error: "Invalid notification ID" }); return; }
  const [event] = await db.update(serviceRequestEventsTable).set({ readAt: new Date() })
    .where(and(eq(serviceRequestEventsTable.id, parsed.data), eq(serviceRequestEventsTable.memberId, userId(req))))
    .returning();
  if (!event) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json({ notification: event });
});

router.get("/admin/requests", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const requests = await db.select({
    id: serviceRequestsTable.id,
    memberId: serviceRequestsTable.memberId,
    memberName: usersTable.name,
    memberEmail: usersTable.email,
    type: serviceRequestsTable.type,
    status: serviceRequestsTable.status,
    vehicleYear: serviceRequestsTable.vehicleYear,
    vehicleMake: serviceRequestsTable.vehicleMake,
    vehicleModel: serviceRequestsTable.vehicleModel,
    location: serviceRequestsTable.location,
    description: serviceRequestsTable.description,
    createdAt: serviceRequestsTable.createdAt,
    updatedAt: serviceRequestsTable.updatedAt,
  }).from(serviceRequestsTable)
    .innerJoin(usersTable, eq(usersTable.id, serviceRequestsTable.memberId))
    .orderBy(desc(serviceRequestsTable.createdAt));
  res.json({ requests });
});

router.patch("/admin/requests/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = idSchema.safeParse(req.params.id);
  const body = statusSchema.safeParse(req.body);
  if (!id.success || !body.success) {
    res.status(400).json({ error: "Invalid request ID or status" });
    return;
  }
  const actorId = userId(req);
  const result = await db.transaction(async (tx) => {
    // Lock the row: a concurrent update must not create a misleading status history.
    const [current] = await tx.select().from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.id, id.data)).for("update");
    if (!current) return { kind: "missing" as const };
    const next = body.data.status;
    if (
      (current.status === "NEW" && next !== "IN_PROGRESS") ||
      (current.status === "IN_PROGRESS" && next !== "FULFILLED") ||
      current.status === "FULFILLED"
    ) return { kind: "conflict" as const };
    const [updated] = await tx.update(serviceRequestsTable)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(serviceRequestsTable.id, id.data)).returning();
    await tx.insert(serviceRequestEventsTable).values({
      requestId: updated.id, memberId: updated.memberId, actorId,
      fromStatus: current.status, toStatus: next,
    });
    return { kind: "updated" as const, request: updated, fromStatus: current.status };
  });
  if (result.kind === "missing") { res.status(404).json({ error: "Request not found" }); return; }
  if (result.kind === "conflict") { res.status(409).json({ error: "Status must advance from New to In Progress to Fulfilled" }); return; }
  await writeAudit({
    eventType: "ADMIN", action: "Service request status changed", actorId,
    resourceType: "service_request", resourceId: result.request.id,
    metadata: { fromStatus: result.fromStatus, toStatus: result.request.status },
  });
  res.json({ request: result.request });
});

export default router;