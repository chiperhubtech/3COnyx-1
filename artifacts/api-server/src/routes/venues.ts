import { Router, type Request, type Response } from "express";
import { db, venuesTable, eventsTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const log = logger.child({ module: "venues" });

const SOVEREIGN_USER_ID = 6;
const PLATFORM_COMMISSION_RATE = 0.03;

function isSovereign(userId: number): boolean {
  return userId === SOVEREIGN_USER_ID;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

router.post("/venues", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const {
      name, type, businessName, contactName, contactPhone, contactEmail,
      address, city, state, zipCode, country, lat, lng,
      capacity, hourlyRateCents,
      afterHoursAvailable, afterHoursStart, afterHoursEnd,
      amenities, rules, images,
      permitRequired, insuranceRequired,
    } = req.body;

    if (!name || !address || !city || !state) {
      res.status(400).json({ error: "Name, address, city, and state required" });
      return;
    }

    const slug = slugify(name) + "-" + crypto.randomBytes(2).toString("hex");

    const [venue] = await db.insert(venuesTable).values({
      name: name.trim(),
      slug,
      type: type || "parking_lot",
      ownerId: userId,
      businessName: businessName || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      address,
      city,
      state,
      zipCode: zipCode || null,
      country: country || "US",
      lat: lat || null,
      lng: lng || null,
      capacity: capacity || null,
      hourlyRateCents: hourlyRateCents || null,
      afterHoursAvailable: afterHoursAvailable || false,
      afterHoursStart: afterHoursStart || null,
      afterHoursEnd: afterHoursEnd || null,
      amenities: amenities || null,
      rules: rules || null,
      images: images || null,
      permitRequired: permitRequired || false,
      insuranceRequired: insuranceRequired || false,
    }).returning();

    log.info({ venueId: venue.id, userId }, "Venue registered — bottom-up: registerer owns the node");
    res.status(201).json({ venue });
  } catch (err) {
    log.error({ err }, "Failed to register venue");
    res.status(500).json({ error: "Failed to register venue" });
  }
});

router.get("/venues", async (req: Request, res: Response) => {
  try {
    const cityFilter = req.query.city as string | undefined;
    const stateFilter = req.query.state as string | undefined;
    const afterHours = req.query.afterHours === "true";

    let conditions = [eq(venuesTable.active, true)];
    if (cityFilter) conditions.push(eq(venuesTable.city, cityFilter));
    if (stateFilter) conditions.push(eq(venuesTable.state, stateFilter));
    if (afterHours) conditions.push(eq(venuesTable.afterHoursAvailable, true));

    const venues = await db.select({
      id: venuesTable.id,
      name: venuesTable.name,
      slug: venuesTable.slug,
      type: venuesTable.type,
      businessName: venuesTable.businessName,
      address: venuesTable.address,
      city: venuesTable.city,
      state: venuesTable.state,
      capacity: venuesTable.capacity,
      hourlyRateCents: venuesTable.hourlyRateCents,
      afterHoursAvailable: venuesTable.afterHoursAvailable,
      afterHoursStart: venuesTable.afterHoursStart,
      afterHoursEnd: venuesTable.afterHoursEnd,
      amenities: venuesTable.amenities,
      verified: venuesTable.verified,
      totalEventsHosted: venuesTable.totalEventsHosted,
    }).from(venuesTable)
      .where(and(...conditions))
      .orderBy(desc(venuesTable.totalEventsHosted))
      .limit(100);

    res.json({ venues });
  } catch (err) {
    log.error({ err }, "Failed to list venues");
    res.status(500).json({ error: "Failed to list venues" });
  }
});

router.get("/venues/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const venues = await db.select().from(venuesTable).orderBy(desc(venuesTable.createdAt));
    res.json({ venues });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/venues/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.slug, slug));

    if (!venue) {
      res.status(404).json({ error: "Venue not found" });
      return;
    }

    const events = await db.select({
      id: eventsTable.id,
      title: eventsTable.title,
      slug: eventsTable.slug,
      type: eventsTable.type,
      startsAt: eventsTable.startsAt,
      endsAt: eventsTable.endsAt,
      attendeeCount: eventsTable.attendeeCount,
      status: eventsTable.status,
    }).from(eventsTable)
      .where(eq(eventsTable.venueId, venue.id))
      .orderBy(desc(eventsTable.startsAt))
      .limit(20);

    let owner = null;
    if (venue.ownerId) {
      const [o] = await db.select({
        id: usersTable.id,
        name: usersTable.name,
      }).from(usersTable).where(eq(usersTable.id, venue.ownerId));
      owner = o || null;
    }

    res.json({ venue, events, owner });
  } catch (err) {
    log.error({ err }, "Failed to get venue");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/venues/:slug/verify", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const slug = req.params.slug as string;
    await db.update(venuesTable)
      .set({ verified: true, updatedAt: new Date() })
      .where(eq(venuesTable.slug, slug));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify venue" });
  }
});

router.get("/venues/my/listings", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const venues = await db.select().from(venuesTable)
      .where(eq(venuesTable.ownerId, userId))
      .orderBy(desc(venuesTable.createdAt));

    res.json({ venues });
  } catch (err) {
    log.error({ err }, "Failed to get my venues");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
