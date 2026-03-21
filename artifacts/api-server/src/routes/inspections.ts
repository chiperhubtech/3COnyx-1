import { Router, type Request, type Response } from "express";
import { db, inspectionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/inspections", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(inspectionsTable)
    .orderBy(desc(inspectionsTable.createdAt))
    .limit(50);
  res.json({ inspections: rows });
});

router.post("/inspections", async (req: Request, res: Response) => {
  const {
    vehicleLabel,
    inspectorName,
    conditionFront,
    conditionRear,
    conditionDriverSide,
    conditionPassengerSide,
    conditionInterior,
    odometerConfirmed,
    notes,
    signed,
  } = req.body as {
    vehicleLabel?: string;
    inspectorName?: string;
    conditionFront?: number;
    conditionRear?: number;
    conditionDriverSide?: number;
    conditionPassengerSide?: number;
    conditionInterior?: number;
    odometerConfirmed?: number;
    notes?: string;
    signed?: boolean;
  };

  if (!vehicleLabel || !inspectorName) {
    res.status(400).json({ error: "vehicleLabel and inspectorName are required" });
    return;
  }

  const [row] = await db
    .insert(inspectionsTable)
    .values({
      vehicleLabel,
      inspectorName,
      conditionFront: conditionFront ?? 5,
      conditionRear: conditionRear ?? 5,
      conditionDriverSide: conditionDriverSide ?? 5,
      conditionPassengerSide: conditionPassengerSide ?? 5,
      conditionInterior: conditionInterior ?? 5,
      odometerConfirmed: odometerConfirmed ?? null,
      notes: notes ?? null,
      signed: signed ?? false,
    })
    .returning();

  res.status(201).json(row);
});

export default router;
