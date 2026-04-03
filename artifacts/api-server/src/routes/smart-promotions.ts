import { Router, type Request, type Response } from "express";
import { db, vehiclesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "smart-promotions" });

const PLATFORM_COMMISSION_RATE = 0.03;

interface Promotion {
  id: string;
  type: "vehicle_upgrade" | "accessory" | "maintenance" | "part" | "apparel" | "insurance" | "finance";
  title: string;
  message: string;
  urgency: "low" | "medium" | "high" | "critical";
  estimatedSavingsUsd: number | null;
  actionLabel: string;
  declineLabel: string;
  productId: string | null;
  vehicleContext: string | null;
  expiresAt: string | null;
  tags: string[];
}

const MAINTENANCE_INTERVALS: Record<string, { miles: number; label: string; description: string }> = {
  oil_change: { miles: 5000, label: "Oil Change", description: "Your engine oil is due for a change. Fresh oil protects your engine and keeps it running smooth." },
  tire_rotation: { miles: 7500, label: "Tire Rotation", description: "Time to rotate those tires. Even wear means longer life and better grip." },
  brake_inspection: { miles: 15000, label: "Brake Inspection", description: "Your brakes should be inspected. Safety first — this one matters." },
  air_filter: { miles: 15000, label: "Air Filter Replacement", description: "A clean air filter means better performance and fuel economy." },
  transmission_fluid: { miles: 30000, label: "Transmission Fluid", description: "Transmission fluid keeps your shifts smooth. Don't skip this one." },
  coolant_flush: { miles: 30000, label: "Coolant Flush", description: "Fresh coolant prevents overheating and protects your engine from corrosion." },
  spark_plugs: { miles: 30000, label: "Spark Plugs", description: "New spark plugs mean better starts, smoother idle, and improved fuel economy." },
  timing_belt: { miles: 60000, label: "Timing Belt", description: "Your timing belt is approaching its service interval. This is critical — a broken belt can destroy your engine." },
  battery_check: { miles: 25000, label: "Battery Health Check", description: "Batteries typically last 3-5 years. Let us check yours before you get stranded." },
};

function generateMaintenancePromotions(mileage: number, vehicleDesc: string): Promotion[] {
  const promos: Promotion[] = [];

  for (const [key, interval] of Object.entries(MAINTENANCE_INTERVALS)) {
    const milesUntilDue = interval.miles - (mileage % interval.miles);
    if (milesUntilDue <= 1000) {
      promos.push({
        id: `maint-${key}-${Date.now()}`,
        type: "maintenance",
        title: `${interval.label} — Due Soon`,
        message: `${interval.description} Your ${vehicleDesc} is at ${mileage.toLocaleString()} miles.`,
        urgency: milesUntilDue <= 200 ? "critical" : milesUntilDue <= 500 ? "high" : "medium",
        estimatedSavingsUsd: null,
        actionLabel: "Schedule Now",
        declineLabel: "I'll pass for now",
        productId: null,
        vehicleContext: vehicleDesc,
        expiresAt: null,
        tags: ["maintenance", key],
      });
    }
  }

  return promos;
}

function generateAccessoryPromotions(make: string, model: string, vehicleType: string): Promotion[] {
  const promos: Promotion[] = [];

  const accessoryMap: Record<string, Array<{ name: string; price: number; desc: string }>> = {
    car: [
      { name: "All-Weather Floor Mats", price: 89.99, desc: "Custom-fit mats that protect your interior. Rain, mud, snow — covered." },
      { name: "Dash Cam Pro 4K", price: 149.99, desc: "Always recording. Front and rear coverage. Protects you on the road." },
      { name: "LED Interior Light Kit", price: 29.99, desc: "Transform your cabin. Easy install, multiple colors." },
      { name: "Wireless Phone Charger Mount", price: 39.99, desc: "Keep your phone charged and mounted. No cables, no hassle." },
    ],
    motorcycle: [
      { name: "Bluetooth Helmet Comm System", price: 199.99, desc: "Ride connected. Music, calls, rider-to-rider communication." },
      { name: "Tank Grip Pads", price: 34.99, desc: "Better grip, better control. Anti-slip knee pads for your tank." },
      { name: "LED Turn Signal Kit", price: 49.99, desc: "Sequential LED signals. Brighter, safer, cleaner look." },
    ],
    truck: [
      { name: "Bed Liner Spray Coating", price: 399.99, desc: "Protect your truck bed. UV-resistant, impact-proof, permanent." },
      { name: "LED Light Bar — 52 inch", price: 189.99, desc: "Light up the night. 300W flood/spot combo beam." },
    ],
    boat: [
      { name: "Marine GPS Chartplotter", price: 599.99, desc: "Navigate with confidence. Touchscreen, weatherproof, satellite maps." },
      { name: "LED Underwater Lights", price: 149.99, desc: "Turn heads at the dock. RGB color-changing underwater LEDs." },
    ],
  };

  const accessories = accessoryMap[vehicleType] || accessoryMap.car;

  for (const acc of accessories!) {
    promos.push({
      id: `acc-${acc.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      type: "accessory",
      title: acc.name,
      message: `${acc.desc} Perfect for your ${make} ${model}.`,
      urgency: "low",
      estimatedSavingsUsd: null,
      actionLabel: "Add to Cart",
      declineLabel: "Not right now",
      productId: null,
      vehicleContext: `${make} ${model}`,
      expiresAt: null,
      tags: ["accessory", vehicleType],
    });
  }

  return promos;
}

function generateUpgradePromotion(vehicle: { year: number; make: string; model: string; mileage: number; priceUsd: string | null }): Promotion | null {
  const age = new Date().getFullYear() - vehicle.year;
  const mileage = vehicle.mileage;

  if (age >= 3 || mileage >= 50000) {
    const currentValue = vehicle.priceUsd ? parseFloat(vehicle.priceUsd) : (age >= 5 ? 8000 : 15000);
    const upgradeValue = currentValue * 1.4;
    const monthlySavings = age >= 5 ? 150 : 75;

    return {
      id: `upgrade-${vehicle.make}-${vehicle.model}-${Date.now()}`,
      type: "vehicle_upgrade",
      title: `Time to Upgrade Your ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      message: `We can get you out of your ${vehicle.year} ${vehicle.make} ${vehicle.model} and into something newer. Better price, better features, lower maintenance costs. Your estimated monthly savings: $${monthlySavings}. One tap — yes or no.`,
      urgency: age >= 6 ? "high" : "medium",
      estimatedSavingsUsd: monthlySavings * 12,
      actionLabel: "Show Me Options",
      declineLabel: "I'll pass for now",
      productId: null,
      vehicleContext: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ["upgrade", "vehicle_trade"],
    };
  }

  return null;
}

router.get("/feed", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const vehicles = await db.select().from(vehiclesTable)
      .where(eq(vehiclesTable.dealerId, userId));

    const allPromotions: Promotion[] = [];

    for (const v of vehicles) {
      const vehicleDesc = `${v.year} ${v.make} ${v.model}`;
      const vType = (v as any).vehicleType || "car";

      const maintenancePromos = generateMaintenancePromotions(v.mileage, vehicleDesc);
      allPromotions.push(...maintenancePromos);

      const accessoryPromos = generateAccessoryPromotions(v.make, v.model, vType);
      allPromotions.push(...accessoryPromos.slice(0, 2));

      const upgradePromo = generateUpgradePromotion(v);
      if (upgradePromo) allPromotions.push(upgradePromo);
    }

    if (vehicles.length === 0) {
      allPromotions.push({
        id: `welcome-${Date.now()}`,
        type: "vehicle_upgrade",
        title: "Find Your First Vehicle",
        message: "Welcome to the network. Let us help you find the perfect ride — car, motorcycle, boat, whatever moves you. We'll find the best deal.",
        urgency: "medium",
        estimatedSavingsUsd: null,
        actionLabel: "Browse Vehicles",
        declineLabel: "Just looking",
        productId: null,
        vehicleContext: null,
        expiresAt: null,
        tags: ["onboarding", "first_vehicle"],
      });
    }

    allPromotions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    res.json({
      promotions: allPromotions,
      total: allPromotions.length,
      vehicleCount: vehicles.length,
      message: "Personalized for you. One tap — yes or no.",
    });
  } catch (err) {
    log.error({ err }, "Smart promotions feed failed");
    res.status(500).json({ error: "Failed to load promotions" });
  }
});

router.post("/respond", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { promotionId, response } = req.body;

    if (!promotionId || !response) {
      res.status(400).json({ error: "promotionId and response (accepted/declined) required" });
      return;
    }

    log.info({ userId, promotionId, response }, "Promotion response recorded");

    if (response === "accepted") {
      res.json({
        success: true,
        message: "Great choice. We're on it.",
        nextStep: "A specialist will reach out within the hour.",
      });
    } else {
      res.json({
        success: true,
        message: "No problem. We'll check back when something better comes up.",
      });
    }
  } catch (err) {
    log.error({ err }, "Promotion response failed");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
