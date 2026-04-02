import { Router, Request, Response } from "express";
import { db, taskMatchingTable, nodeProfilesTable } from "@workspace/db";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateTaskRef(): string {
  return `TASK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function generateProofHash(data: Record<string, any>): string {
  return crypto.createHash("sha256").update(JSON.stringify({ ...data, ts: Date.now(), architect: "Ronald Antonio Cadet" })).digest("hex");
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  Open: ["Matching", "Cancelled"],
  Matching: ["Matched", "Cancelled"],
  Matched: ["Confirmed", "Cancelled"],
  Confirmed: ["En_Route", "Cancelled"],
  En_Route: ["Executing", "Cancelled"],
  Executing: ["Verifying", "Cancelled"],
  Verifying: ["Completed", "Disputed"],
  Completed: ["Paid"],
  Paid: [],
  Cancelled: [],
  Disputed: ["Verifying", "Cancelled"],
};

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Real-Time Task Matching Engine",
    version: "1.0.0",
    description: "Uber/DoorDash-grade distributed task matching with proof-of-completion payments",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    stateMachine: "Open → Matching → Matched → Confirmed → En_Route → Executing → Verifying → Completed → Paid",
    categories: [
      "Bank_Payoff", "DMV_Run", "Vehicle_Inspection", "Mechanic_Service",
      "Detailing", "Tire_Service", "Oil_Change", "Transport",
      "Parts_Pickup", "Document_Delivery", "Warranty_Claim", "Insurance_Quote",
      "Title_Transfer", "Registration", "Roadside_Assist", "Custom",
    ],
    urgencyLevels: ["Standard", "Priority", "Urgent", "Emergency"],
    payoutTrigger: "Proof of Completion → Instant Split Payment",
  });
});

router.post("/create", async (req: Request, res: Response) => {
  try {
    const { category, title, description, requestedByUserId, vin, urgency, geoHash, latitude, longitude, radiusMiles, estimatedPayoutUsd } = req.body;

    if (!category || !title || !requestedByUserId) {
      res.status(400).json({ error: "category, title, and requestedByUserId are required" });
      return;
    }

    const taskRef = generateTaskRef();

    const [task] = await db.insert(taskMatchingTable).values({
      taskRef,
      category,
      title,
      description: description || null,
      requestedByUserId,
      urgency: urgency || "Standard",
      vin: vin || null,
      geoHash: geoHash || null,
      latitude: latitude || null,
      longitude: longitude || null,
      radiusMiles: radiusMiles || 25,
      estimatedPayoutUsd: estimatedPayoutUsd || null,
      proofHashes: [generateProofHash({ event: "task_created", taskRef })],
    }).returning();

    res.status(201).json({
      message: "Task created — entering matching queue",
      task,
      nextState: "Matching",
      estimatedMatchTime: urgency === "Emergency" ? "< 30 seconds" : urgency === "Urgent" ? "< 2 minutes" : "< 5 minutes",
    });
  } catch (error) {
    res.status(500).json({ error: "Task creation failed", detail: String(error) });
  }
});

router.post("/match/:taskRef", async (req: Request, res: Response) => {
  try {
    const taskRef = req.params.taskRef as string;
    const [task] = await db.select().from(taskMatchingTable).where(eq(taskMatchingTable.taskRef, taskRef)).limit(1);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const roleMap: Record<string, string> = {
      Bank_Payoff: "Service",
      DMV_Run: "Logistics",
      Mechanic_Service: "Service",
      Detailing: "Service",
      Tire_Service: "Service",
      Oil_Change: "Service",
      Transport: "Logistics",
      Parts_Pickup: "Logistics",
      Document_Delivery: "Logistics",
      Vehicle_Inspection: "Service",
      Warranty_Claim: "Service",
      Insurance_Quote: "Service",
      Title_Transfer: "Logistics",
      Registration: "Logistics",
      Roadside_Assist: "Service",
      Custom: "Hybrid",
    };

    const requiredRole = roleMap[task.category] || "Hybrid";

    let availableNodes = await db.select().from(nodeProfilesTable)
      .where(eq(nodeProfilesTable.isAvailable, true))
      .orderBy(desc(nodeProfilesTable.rating), desc(nodeProfilesTable.tasksCompleted))
      .limit(50);

    availableNodes = availableNodes.filter(n =>
      (n.activeRoles as string[])?.includes(requiredRole) || (n.activeRoles as string[])?.includes("Hybrid")
    );

    if (task.geoHash) {
      const prefix = task.geoHash.substring(0, 4);
      const geoFiltered = availableNodes.filter(n => n.geoHash?.startsWith(prefix));
      if (geoFiltered.length > 0) availableNodes = geoFiltered;
    }

    if (availableNodes.length === 0) {
      await db.update(taskMatchingTable).set({ state: "Matching", updatedAt: new Date() })
        .where(eq(taskMatchingTable.id, task.id));
      res.json({ message: "No available nodes found — task stays in matching queue", taskRef, state: "Matching" });
      return;
    }

    const bestNode = availableNodes[0];
    const proofHash = generateProofHash({ event: "task_matched", taskRef, nodeId: bestNode.onyxId });

    const [updated] = await db.update(taskMatchingTable).set({
      state: "Matched",
      assignedNodeId: bestNode.userId,
      matchedAt: new Date(),
      agentRouting: requiredRole,
      proofHashes: [...(task.proofHashes as string[] || []), proofHash],
      updatedAt: new Date(),
    }).where(eq(taskMatchingTable.id, task.id)).returning();

    res.json({
      message: "Task matched to nearest qualified node",
      task: updated,
      assignedNode: { onyxId: bestNode.onyxId, role: bestNode.primaryRole, rating: bestNode.rating, tasksCompleted: bestNode.tasksCompleted },
      nextAction: "Node must CONFIRM within 60 seconds or task returns to queue",
    });
  } catch (error) {
    res.status(500).json({ error: "Task matching failed", detail: String(error) });
  }
});

router.post("/transition/:taskRef", async (req: Request, res: Response) => {
  try {
    const taskRef = req.params.taskRef as string;
    const { newState, proofData, cancelReason, actualPayoutUsd } = req.body;

    const [task] = await db.select().from(taskMatchingTable).where(eq(taskMatchingTable.taskRef, taskRef)).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const allowed = VALID_TRANSITIONS[task.state];
    if (!allowed?.includes(newState)) {
      res.status(400).json({ error: `Invalid transition: ${task.state} → ${newState}`, allowedTransitions: allowed });
      return;
    }

    const proofHash = generateProofHash({ event: `state_${newState.toLowerCase()}`, taskRef, from: task.state, to: newState, proofData });

    const updates: any = {
      state: newState,
      proofHashes: [...(task.proofHashes as string[] || []), proofHash],
      updatedAt: new Date(),
    };

    if (newState === "Confirmed") updates.confirmedAt = new Date();
    if (newState === "Executing") updates.executionStartedAt = new Date();
    if (newState === "Verifying") updates.verifiedAt = new Date();
    if (newState === "Completed") updates.completedAt = new Date();
    if (newState === "Paid") {
      updates.paidAt = new Date();
      if (actualPayoutUsd) updates.actualPayoutUsd = actualPayoutUsd;
    }
    if (newState === "Cancelled") {
      updates.cancelledAt = new Date();
      updates.cancelReason = cancelReason || "User cancelled";
    }

    const [updated] = await db.update(taskMatchingTable).set(updates)
      .where(eq(taskMatchingTable.id, task.id)).returning();

    if (newState === "Completed" && task.assignedNodeId) {
      await db.update(nodeProfilesTable).set({
        tasksCompleted: sql`tasks_completed + 1`,
        updatedAt: new Date(),
      }).where(eq(nodeProfilesTable.userId, task.assignedNodeId));
    }

    res.json({
      message: `Task transitioned: ${task.state} → ${newState}`,
      task: updated,
      proofHash,
      chainLength: (updated.proofHashes as string[])?.length,
    });
  } catch (error) {
    res.status(500).json({ error: "State transition failed", detail: String(error) });
  }
});

router.get("/task/:taskRef", async (req: Request, res: Response) => {
  try {
    const [task] = await db.select().from(taskMatchingTable).where(eq(taskMatchingTable.taskRef, String(req.params.taskRef))).limit(1);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task", detail: String(error) });
  }
});

router.get("/queue", async (req: Request, res: Response) => {
  try {
    const state = (req.query.state as string) || "Open";
    const tasks = await db.select().from(taskMatchingTable)
      .where(eq(taskMatchingTable.state, state as any))
      .orderBy(asc(taskMatchingTable.createdAt))
      .limit(50);

    res.json({ state, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch queue", detail: String(error) });
  }
});

router.get("/my-tasks/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const role = req.query.role as string;

    const requested = await db.select().from(taskMatchingTable)
      .where(eq(taskMatchingTable.requestedByUserId, userId))
      .orderBy(desc(taskMatchingTable.createdAt))
      .limit(50);

    const assigned = await db.select().from(taskMatchingTable)
      .where(eq(taskMatchingTable.assignedNodeId, userId))
      .orderBy(desc(taskMatchingTable.createdAt))
      .limit(50);

    res.json({
      requested: { count: requested.length, tasks: requested },
      assigned: { count: assigned.length, tasks: assigned },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks", detail: String(error) });
  }
});

router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const states = ["Open", "Matching", "Matched", "Confirmed", "En_Route", "Executing", "Verifying", "Completed", "Paid", "Cancelled"];
    const metrics: Record<string, number> = {};

    for (const state of states) {
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(taskMatchingTable)
        .where(eq(taskMatchingTable.state, state as any));
      metrics[state] = Number(result?.count || 0);
    }

    res.json({
      protocol: "ONYX Task Matching Metrics",
      stateCounts: metrics,
      totalTasks: Object.values(metrics).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics", detail: String(error) });
  }
});

export default router;
