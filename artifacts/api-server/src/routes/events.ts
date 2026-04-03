import { Router, type Request, type Response } from "express";
import {
  db, eventsTable, eventAttendeesTable, venuesTable, clubsTable, usersTable,
} from "@workspace/db";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const log = logger.child({ module: "events" });

const SOVEREIGN_USER_ID = 6;

function isSovereign(userId: number): boolean {
  return userId === SOVEREIGN_USER_ID;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

router.post("/events", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const {
      title, description, type, clubId, venueId, vehicleTypes,
      address, city, state, zipCode, country,
      startsAt, endsAt, maxAttendees, entryFeeCents, vendorFeeCents,
      rules, tags, coverImageUrl,
    } = req.body;

    if (!title || !startsAt || !endsAt) {
      res.status(400).json({ error: "Title, start time, and end time required" });
      return;
    }

    const slug = slugify(title) + "-" + crypto.randomBytes(2).toString("hex");

    const [event] = await db.insert(eventsTable).values({
      title: title.trim(),
      slug,
      description: description || null,
      type: type || "car_meet",
      status: "draft",
      organizerId: userId,
      clubId: clubId || null,
      venueId: venueId || null,
      coverImageUrl: coverImageUrl || null,
      vehicleTypes: vehicleTypes || ["car"],
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      country: country || "US",
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      maxAttendees: maxAttendees || null,
      entryFeeCents: entryFeeCents || 0,
      vendorFeeCents: vendorFeeCents || 0,
      rules: rules || null,
      tags: tags || null,
    }).returning();

    await db.insert(eventAttendeesTable).values({
      eventId: event.id,
      userId,
      status: "confirmed",
      role: "organizer",
    });

    await db.update(eventsTable)
      .set({ attendeeCount: 1 })
      .where(eq(eventsTable.id, event.id));

    log.info({ eventId: event.id, userId }, "Event created");
    res.status(201).json({ event });
  } catch (err) {
    log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.get("/events", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const upcoming = req.query.upcoming === "true";

    let query = db.select({
      id: eventsTable.id,
      title: eventsTable.title,
      slug: eventsTable.slug,
      description: eventsTable.description,
      type: eventsTable.type,
      status: eventsTable.status,
      vehicleTypes: eventsTable.vehicleTypes,
      city: eventsTable.city,
      state: eventsTable.state,
      startsAt: eventsTable.startsAt,
      endsAt: eventsTable.endsAt,
      maxAttendees: eventsTable.maxAttendees,
      attendeeCount: eventsTable.attendeeCount,
      entryFeeCents: eventsTable.entryFeeCents,
      coverImageUrl: eventsTable.coverImageUrl,
    }).from(eventsTable)
      .where(
        upcoming
          ? and(gte(eventsTable.startsAt, now), eq(eventsTable.status, "approved"))
          : eq(eventsTable.status, "approved")
      )
      .orderBy(desc(eventsTable.startsAt))
      .limit(50)
      .$dynamic();

    const events = await query;
    res.json({ events });
  } catch (err) {
    log.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Failed to list events" });
  }
});

router.get("/events/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const events = await db.select().from(eventsTable).orderBy(desc(eventsTable.startsAt));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/events/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, slug));

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const attendees = await db.select({
      id: eventAttendeesTable.id,
      userId: eventAttendeesTable.userId,
      status: eventAttendeesTable.status,
      role: eventAttendeesTable.role,
      vehicleInfo: eventAttendeesTable.vehicleInfo,
      checkedInAt: eventAttendeesTable.checkedInAt,
      registeredAt: eventAttendeesTable.registeredAt,
      userName: usersTable.name,
    }).from(eventAttendeesTable)
      .innerJoin(usersTable, eq(usersTable.id, eventAttendeesTable.userId))
      .where(eq(eventAttendeesTable.eventId, event.id))
      .orderBy(desc(eventAttendeesTable.registeredAt));

    let venue = null;
    if (event.venueId) {
      const [v] = await db.select().from(venuesTable).where(eq(venuesTable.id, event.venueId));
      venue = v || null;
    }

    let club = null;
    if (event.clubId) {
      const [c] = await db.select({
        id: clubsTable.id,
        name: clubsTable.name,
        slug: clubsTable.slug,
      }).from(clubsTable).where(eq(clubsTable.id, event.clubId));
      club = c || null;
    }

    res.json({ event, attendees, venue, club });
  } catch (err) {
    log.error({ err }, "Failed to get event");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/events/:slug/register", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const slug = req.params.slug as string;

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, slug));
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      res.status(409).json({ error: "Event is at capacity" });
      return;
    }

    const [existing] = await db.select().from(eventAttendeesTable)
      .where(and(eq(eventAttendeesTable.eventId, event.id), eq(eventAttendeesTable.userId, userId)));

    if (existing) {
      res.status(409).json({ error: "Already registered" });
      return;
    }

    const ticketRef = "TKT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    await db.insert(eventAttendeesTable).values({
      eventId: event.id,
      userId,
      status: "registered",
      role: "attendee",
      vehicleInfo: req.body?.vehicleInfo || null,
      ticketRef,
      paidCents: event.entryFeeCents || 0,
    });

    await db.update(eventsTable)
      .set({ attendeeCount: sql`${eventsTable.attendeeCount} + 1` })
      .where(eq(eventsTable.id, event.id));

    log.info({ eventId: event.id, userId, ticketRef }, "Attendee registered");
    res.json({ success: true, ticketRef, message: "You're in. See you there." });
  } catch (err) {
    log.error({ err }, "Failed to register for event");
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/events/:slug/checkin", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const slug = req.params.slug as string;
    const { attendeeUserId, ticketRef } = req.body;

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, slug));
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const isOrganizer = event.organizerId === userId;
    if (!isOrganizer && !isSovereign(userId)) {
      res.status(403).json({ error: "Only the organizer can check in attendees" });
      return;
    }

    const targetUserId = attendeeUserId || userId;

    await db.update(eventAttendeesTable)
      .set({ checkedInAt: new Date(), status: "checked_in" })
      .where(and(
        eq(eventAttendeesTable.eventId, event.id),
        eq(eventAttendeesTable.userId, targetUserId),
      ));

    log.info({ eventId: event.id, attendeeUserId: targetUserId }, "Checked in");
    res.json({ success: true, message: "Checked in" });
  } catch (err) {
    log.error({ err }, "Check-in failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/events/:slug/approve", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    if (!isSovereign(userId)) {
      res.status(403).json({ error: "Sovereign access only" });
      return;
    }

    const slug = req.params.slug as string;
    await db.update(eventsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(eventsTable.slug, slug));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve event" });
  }
});

router.get("/events/my/registered", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const registrations = await db.select({
      attendeeId: eventAttendeesTable.id,
      status: eventAttendeesTable.status,
      role: eventAttendeesTable.role,
      ticketRef: eventAttendeesTable.ticketRef,
      registeredAt: eventAttendeesTable.registeredAt,
      checkedInAt: eventAttendeesTable.checkedInAt,
      eventId: eventsTable.id,
      eventTitle: eventsTable.title,
      eventSlug: eventsTable.slug,
      eventType: eventsTable.type,
      startsAt: eventsTable.startsAt,
      endsAt: eventsTable.endsAt,
      city: eventsTable.city,
      state: eventsTable.state,
    }).from(eventAttendeesTable)
      .innerJoin(eventsTable, eq(eventsTable.id, eventAttendeesTable.eventId))
      .where(eq(eventAttendeesTable.userId, userId))
      .orderBy(desc(eventsTable.startsAt));

    res.json({ registrations });
  } catch (err) {
    log.error({ err }, "Failed to get registrations");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
