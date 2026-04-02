import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const LOOPIT_API_KEY = process.env.LOOPIT_API_KEY;
const LOOPIT_BASE = process.env.LOOPIT_BASE_URL || "https://api.loopit.co/v1";

function isLive(): boolean {
  return !!LOOPIT_API_KEY;
}

router.get("/fleet/status", (_req: Request, res: Response) => {
  res.json({
    provider: "Loopit",
    live: isLive(),
    mode: isLive() ? "production" : "demo",
    capabilities: ["subscription_plans", "fleet_inventory", "booking_management", "usage_tracking", "swap_scheduling"],
    description: "Vehicle subscription and fleet management — members subscribe monthly instead of buying, swap vehicles anytime",
  });
});

router.get("/fleet/plans", async (_req: Request, res: Response) => {
  if (isLive()) {
    try {
      const r = await fetch(`${LOOPIT_BASE}/plans`, {
        headers: { Authorization: `Bearer ${LOOPIT_API_KEY}` },
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[loopit] plans error:", err);
    }
  }

  res.json({
    plans: [
      {
        id: "plan-daily",
        name: "ONYX Daily Driver",
        tier: "essential",
        monthlyPrice: 599,
        includes: ["Insurance", "Maintenance", "Roadside assistance"],
        mileageLimit: 1500,
        excessMileageRate: 0.25,
        swapsPerMonth: 0,
        vehicleClasses: ["economy", "compact", "midsize"],
        minTerm: 1,
      },
      {
        id: "plan-flex",
        name: "ONYX Flex",
        tier: "premium",
        monthlyPrice: 999,
        includes: ["Insurance", "Maintenance", "Roadside assistance", "1 vehicle swap/month"],
        mileageLimit: 2500,
        excessMileageRate: 0.20,
        swapsPerMonth: 1,
        vehicleClasses: ["midsize", "fullsize", "suv", "luxury"],
        minTerm: 1,
      },
      {
        id: "plan-unlimited",
        name: "ONYX Unlimited",
        tier: "elite",
        monthlyPrice: 1899,
        includes: ["Insurance", "Maintenance", "Roadside assistance", "Unlimited swaps", "Concierge delivery"],
        mileageLimit: 5000,
        excessMileageRate: 0.15,
        swapsPerMonth: -1,
        vehicleClasses: ["luxury", "sports", "suv", "exotic"],
        minTerm: 3,
      },
    ],
    simulated: true,
  });
});

router.get("/fleet/inventory", async (req: Request, res: Response) => {
  const vehicleClass = req.query.class as string;

  if (isLive()) {
    try {
      const url = `${LOOPIT_BASE}/vehicles${vehicleClass ? `?class=${vehicleClass}` : ""}`;
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${LOOPIT_API_KEY}` },
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[loopit] inventory error:", err);
    }
  }

  const inventory = [
    { id: "fl-001", make: "BMW", model: "X3 xDrive30i", year: 2025, color: "Alpine White", class: "suv", status: "available", mileage: 3_200, monthlyFrom: 899 },
    { id: "fl-002", make: "Mercedes-Benz", model: "C 300", year: 2025, color: "Obsidian Black", class: "luxury", status: "available", mileage: 1_800, monthlyFrom: 949 },
    { id: "fl-003", make: "Tesla", model: "Model 3 Long Range", year: 2025, color: "Pearl White", class: "midsize", status: "available", mileage: 5_400, monthlyFrom: 749 },
    { id: "fl-004", make: "Porsche", model: "Macan", year: 2025, color: "Gentian Blue", class: "luxury", status: "reserved", mileage: 900, monthlyFrom: 1_299 },
    { id: "fl-005", make: "Range Rover", model: "Sport SE", year: 2025, color: "Santorini Black", class: "suv", status: "available", mileage: 2_100, monthlyFrom: 1_499 },
    { id: "fl-006", make: "Audi", model: "e-tron GT", year: 2025, color: "Daytona Grey", class: "sports", status: "available", mileage: 4_600, monthlyFrom: 1_699 },
  ];

  const filtered = vehicleClass ? inventory.filter(v => v.class === vehicleClass) : inventory;

  res.json({
    totalAvailable: filtered.filter(v => v.status === "available").length,
    vehicles: filtered,
    simulated: true,
  });
});

router.post("/fleet/subscribe", requireAuth, async (req: Request, res: Response) => {
  const { planId, vehicleId } = req.body as { planId?: string; vehicleId?: string };

  if (!planId || !vehicleId) {
    res.status(400).json({ error: "planId and vehicleId are required" });
    return;
  }

  if (isLive()) {
    try {
      const r = await fetch(`${LOOPIT_BASE}/subscriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOOPIT_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planId, vehicleId, memberId: req.user?.sub }),
      });
      const data = await r.json();
      res.json(data);
      return;
    } catch (err) {
      console.error("[loopit] subscribe error:", err);
    }
  }

  res.status(201).json({
    subscriptionId: `sub-${Date.now()}`,
    planId,
    vehicleId,
    status: "active",
    startDate: new Date().toISOString(),
    nextBillingDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    swapsRemaining: planId === "plan-unlimited" ? "unlimited" : planId === "plan-flex" ? 1 : 0,
    simulated: true,
  });
});

router.post("/fleet/swap", requireAuth, (req: Request, res: Response) => {
  const { subscriptionId, newVehicleId, pickupDate, deliveryPreference } = req.body as {
    subscriptionId?: string;
    newVehicleId?: string;
    pickupDate?: string;
    deliveryPreference?: "pickup" | "delivery";
  };

  if (!subscriptionId || !newVehicleId) {
    res.status(400).json({ error: "subscriptionId and newVehicleId are required" });
    return;
  }

  res.json({
    swapId: `swap-${Date.now()}`,
    subscriptionId,
    newVehicleId,
    status: "scheduled",
    scheduledDate: pickupDate || new Date(Date.now() + 2 * 86_400_000).toISOString(),
    deliveryPreference: deliveryPreference ?? "delivery",
    instructions: "Your current vehicle will be picked up and the new one delivered to your registered address.",
    simulated: !isLive(),
  });
});

export default router;
