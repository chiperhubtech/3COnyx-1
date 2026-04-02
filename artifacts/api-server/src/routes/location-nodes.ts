import { Router, Request, Response } from "express";
import { db, locationNodesTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function locationRef(): string {
  return `LOC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

const LOCATION_TYPES = [
  "Gas_Station", "Mechanic_Shop", "Dealership", "Auto_Parts",
  "Car_Wash", "Tire_Shop", "Body_Shop", "Tint_Shop",
  "Detailing_Studio", "DMV_Office", "Insurance_Office",
  "Fleet_Yard", "Parking_Garage", "EV_Charging", "Other",
];

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Location Node Network",
    version: "1.0.0",
    description: "Every gas station, mechanic bay, and shop becomes a high-conversion point-of-sale",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    locationTypes: LOCATION_TYPES,
    features: {
      qrCodeGeneration: true,
      revenueTracking: true,
      signupAttribution: true,
      geoHashDiscovery: true,
    },
    mandate: "Turn every physical location into a revenue-generating node in the ONYX network",
  });
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { userId, name, type, address, city, state, zip, country, latitude, longitude, geoHash, operatingHours } = req.body;
    if (!userId || !name) { res.status(400).json({ error: "userId and name required" }); return; }

    const ref = locationRef();
    const qrCode = `https://3conyx.com/loc/${ref}`;

    const [location] = await db.insert(locationNodesTable).values({
      userId,
      locationRef: ref,
      name,
      type: type || "Other",
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || "US",
      latitude: latitude || null,
      longitude: longitude || null,
      geoHash: geoHash || null,
      qrCode,
      operatingHours: operatingHours || null,
    }).returning();

    res.status(201).json({
      message: "Location registered in the ONYX Network",
      location,
      qrCode,
      instructions: "Print and display this QR code at your location. Every scan earns you revenue.",
    });
  } catch (error) {
    res.status(500).json({ error: "Location registration failed", detail: String(error) });
  }
});

router.get("/location/:locationRef", async (req: Request, res: Response) => {
  try {
    const [location] = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.locationRef, String(req.params.locationRef))).limit(1);
    if (!location) { res.status(404).json({ error: "Location not found" }); return; }
    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch location", detail: String(error) });
  }
});

router.post("/scan/:locationRef", async (req: Request, res: Response) => {
  try {
    const ref = req.params.locationRef as string;
    const [location] = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.locationRef, ref)).limit(1);
    if (!location) { res.status(404).json({ error: "Location not found" }); return; }

    await db.update(locationNodesTable).set({
      qrScans: sql`qr_scans + 1`,
      updatedAt: new Date(),
    }).where(eq(locationNodesTable.id, location.id));

    res.json({
      message: "QR scan recorded",
      location: { name: location.name, type: location.type, ref },
      totalScans: location.qrScans + 1,
    });
  } catch (error) {
    res.status(500).json({ error: "Scan tracking failed", detail: String(error) });
  }
});

router.post("/signup/:locationRef", async (req: Request, res: Response) => {
  try {
    const ref = req.params.locationRef as string;
    const [location] = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.locationRef, ref)).limit(1);
    if (!location) { res.status(404).json({ error: "Location not found" }); return; }

    await db.update(locationNodesTable).set({
      signupsGenerated: sql`signups_generated + 1`,
      updatedAt: new Date(),
    }).where(eq(locationNodesTable.id, location.id));

    res.json({
      message: "Signup attributed to location",
      locationName: location.name,
      totalSignups: location.signupsGenerated + 1,
    });
  } catch (error) {
    res.status(500).json({ error: "Signup attribution failed", detail: String(error) });
  }
});

router.post("/revenue/:locationRef", async (req: Request, res: Response) => {
  try {
    const ref = req.params.locationRef as string;
    const { amountUsd } = req.body;

    const [location] = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.locationRef, ref)).limit(1);
    if (!location) { res.status(404).json({ error: "Location not found" }); return; }

    const amount = parseFloat(amountUsd || "0");
    await db.update(locationNodesTable).set({
      transactionsGenerated: sql`transactions_generated + 1`,
      revenueGeneratedUsd: sql`revenue_generated_usd + ${amount}`,
      updatedAt: new Date(),
    }).where(eq(locationNodesTable.id, location.id));

    res.json({
      message: "Revenue recorded for location",
      locationName: location.name,
      transactionRevenue: amount.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: "Revenue tracking failed", detail: String(error) });
  }
});

router.get("/my-locations/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(String(req.params.userId));
    const locations = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.userId, userId))
      .orderBy(desc(locationNodesTable.revenueGeneratedUsd));

    const totalRevenue = locations.reduce((s, l) => s + parseFloat(l.revenueGeneratedUsd), 0);
    const totalScans = locations.reduce((s, l) => s + l.qrScans, 0);
    const totalSignups = locations.reduce((s, l) => s + l.signupsGenerated, 0);

    res.json({
      locationCount: locations.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalScans,
      totalSignups,
      locations,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch locations", detail: String(error) });
  }
});

router.get("/nearby/:geoHash", async (req: Request, res: Response) => {
  try {
    const prefix = String(req.params.geoHash).substring(0, 4);
    const locations = await db.select().from(locationNodesTable)
      .where(and(
        eq(locationNodesTable.isActive, true),
        sql`${locationNodesTable.geoHash} LIKE ${prefix + '%'}`
      )).limit(30);

    res.json({ geoPrefix: prefix, count: locations.length, locations });
  } catch (error) {
    res.status(500).json({ error: "Nearby search failed", detail: String(error) });
  }
});

router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const locations = await db.select().from(locationNodesTable)
      .where(eq(locationNodesTable.isActive, true))
      .orderBy(desc(locationNodesTable.revenueGeneratedUsd))
      .limit(50);

    res.json({
      protocol: "ONYX Location Leaderboard",
      topLocations: locations.map((l, i) => ({
        rank: i + 1,
        name: l.name,
        type: l.type,
        city: l.city,
        state: l.state,
        revenue: l.revenueGeneratedUsd,
        scans: l.qrScans,
        signups: l.signupsGenerated,
        transactions: l.transactionsGenerated,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Leaderboard failed", detail: String(error) });
  }
});

export default router;
