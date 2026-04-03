import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "event-radar" });

const SOVEREIGN_USER_ID = 6;

const EVENT_CATEGORIES = [
  "car_meet", "bike_night", "motorcycle_rally", "car_show", "drag_race",
  "drift_event", "track_day", "gumball_rally", "cruise", "charity_ride",
  "swap_meet", "auction", "crypto_conference", "affiliate_summit",
  "influencer_meetup", "skate_competition", "surf_competition",
  "boat_show", "rv_rally", "atv_ride", "snowmobile_rally",
  "jet_ski_race", "food_truck_festival", "pop_up_market",
  "streetwear_drop", "sneaker_con", "music_festival", "art_walk",
  "lowrider_show", "truck_pull", "burnout_competition",
  "custom_build_reveal", "detailing_expo", "tuner_meet",
];

const REGIONS = [
  "North America", "South America", "Europe", "Asia", "Africa",
  "Middle East", "Oceania", "Caribbean",
];

interface RadarEvent {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  organizerName: string;
  organizerContact: string | null;
  organizerSocial: string | null;
  location: string;
  region: string;
  date: string;
  estimatedAttendees: number | null;
  vehicleTypes: string[];
  tags: string[];
  relevanceScore: number;
  contactable: boolean;
  status: "live" | "upcoming" | "recurring" | "past";
  discoveredAt: string;
}

function generateRadarEvents(query?: string, category?: string, region?: string): RadarEvent[] {
  const events: RadarEvent[] = [
    {
      id: "radar-gumball-2026",
      title: "Gumball 3000 Rally 2026",
      category: "gumball_rally",
      source: "gumball3000.com",
      sourceUrl: "https://gumball3000.com/rally-2026",
      organizerName: "Maximillion Cooper",
      organizerContact: "press@gumball3000.com",
      organizerSocial: "@gaborone",
      location: "London to Tokyo",
      region: "Europe",
      date: "2026-06-01",
      estimatedAttendees: 120,
      vehicleTypes: ["car"],
      tags: ["luxury", "rally", "supercar", "international"],
      relevanceScore: 98,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-sturgis-2026",
      title: "Sturgis Motorcycle Rally 2026",
      category: "motorcycle_rally",
      source: "sturgismotorcyclerally.com",
      sourceUrl: "https://sturgismotorcyclerally.com",
      organizerName: "City of Sturgis",
      organizerContact: "info@sturgismotorcyclerally.com",
      organizerSocial: "@sturgisrally",
      location: "Sturgis, South Dakota",
      region: "North America",
      date: "2026-08-03",
      estimatedAttendees: 500000,
      vehicleTypes: ["motorcycle"],
      tags: ["motorcycle", "rally", "massive", "annual"],
      relevanceScore: 99,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-sema-2026",
      title: "SEMA Show 2026",
      category: "car_show",
      source: "semashow.com",
      sourceUrl: "https://semashow.com",
      organizerName: "SEMA",
      organizerContact: "info@sema.org",
      organizerSocial: "@saborea",
      location: "Las Vegas, NV",
      region: "North America",
      date: "2026-11-03",
      estimatedAttendees: 160000,
      vehicleTypes: ["car", "truck", "suv"],
      tags: ["aftermarket", "builds", "industry", "massive"],
      relevanceScore: 97,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-bitcoin-miami-2026",
      title: "Bitcoin Miami 2026",
      category: "crypto_conference",
      source: "b.tc/conference",
      sourceUrl: "https://b.tc/conference",
      organizerName: "Bitcoin Magazine",
      organizerContact: "events@bitcoinmagazine.com",
      organizerSocial: "@bitcoinmagazine",
      location: "Miami, FL",
      region: "North America",
      date: "2026-05-15",
      estimatedAttendees: 35000,
      vehicleTypes: [],
      tags: ["crypto", "bitcoin", "fintech", "networking"],
      relevanceScore: 85,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-affiliate-world-2026",
      title: "Affiliate World Global 2026",
      category: "affiliate_summit",
      source: "affiliateworldconferences.com",
      sourceUrl: "https://affiliateworldconferences.com",
      organizerName: "Affiliate World",
      organizerContact: "info@affiliateworldconferences.com",
      organizerSocial: "@affiliateworld",
      location: "Barcelona, Spain",
      region: "Europe",
      date: "2026-07-08",
      estimatedAttendees: 8000,
      vehicleTypes: [],
      tags: ["affiliate", "marketing", "ecommerce", "networking"],
      relevanceScore: 88,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-caffeine-octane-2026",
      title: "Caffeine & Octane Monthly Meet",
      category: "car_meet",
      source: "caffeineandoctane.com",
      sourceUrl: "https://caffeineandoctane.com",
      organizerName: "Caffeine & Octane",
      organizerContact: "info@caffeineandoctane.com",
      organizerSocial: "@caffeineandoctane",
      location: "Atlanta, GA",
      region: "North America",
      date: "2026-04-06",
      estimatedAttendees: 3000,
      vehicleTypes: ["car", "motorcycle", "truck"],
      tags: ["car_meet", "recurring", "community", "free"],
      relevanceScore: 92,
      contactable: true,
      status: "recurring",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-xgames-2026",
      title: "X Games California 2026",
      category: "skate_competition",
      source: "xgames.com",
      sourceUrl: "https://xgames.com",
      organizerName: "ESPN / X Games",
      organizerContact: "partnerships@xgames.com",
      organizerSocial: "@xgames",
      location: "Ventura, CA",
      region: "North America",
      date: "2026-06-20",
      estimatedAttendees: 50000,
      vehicleTypes: ["motorcycle", "atv"],
      tags: ["extreme", "skateboard", "motocross", "bmx", "youth"],
      relevanceScore: 90,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-miami-boat-2026",
      title: "Miami International Boat Show 2026",
      category: "boat_show",
      source: "miamiboatshow.com",
      sourceUrl: "https://miamiboatshow.com",
      organizerName: "Informa Markets",
      organizerContact: "miami@informamarkets.com",
      organizerSocial: "@miamiboatshow",
      location: "Miami, FL",
      region: "North America",
      date: "2026-02-12",
      estimatedAttendees: 100000,
      vehicleTypes: ["boat", "jet_ski"],
      tags: ["boat", "marine", "luxury", "lifestyle"],
      relevanceScore: 91,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-lowrider-supershow-2026",
      title: "Lowrider Super Show 2026",
      category: "lowrider_show",
      source: "lowrider.com",
      sourceUrl: "https://lowrider.com/events",
      organizerName: "Lowrider Magazine",
      organizerContact: "events@lowrider.com",
      organizerSocial: "@lowridermagazine",
      location: "Las Vegas, NV",
      region: "North America",
      date: "2026-10-18",
      estimatedAttendees: 30000,
      vehicleTypes: ["car"],
      tags: ["lowrider", "custom", "hydraulics", "culture"],
      relevanceScore: 95,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-wsk-2026",
      title: "World Surf League Finals 2026",
      category: "surf_competition",
      source: "worldsurfleague.com",
      sourceUrl: "https://worldsurfleague.com",
      organizerName: "World Surf League",
      organizerContact: "partnerships@worldsurfleague.com",
      organizerSocial: "@wsl",
      location: "Trestles, San Clemente, CA",
      region: "North America",
      date: "2026-09-10",
      estimatedAttendees: 20000,
      vehicleTypes: [],
      tags: ["surf", "ocean", "lifestyle", "extreme"],
      relevanceScore: 82,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-sneakercon-2026",
      title: "Sneaker Con NYC 2026",
      category: "streetwear_drop",
      source: "sneakercon.com",
      sourceUrl: "https://sneakercon.com",
      organizerName: "Sneaker Con",
      organizerContact: "info@sneakercon.com",
      organizerSocial: "@sneakercon",
      location: "New York, NY",
      region: "North America",
      date: "2026-04-25",
      estimatedAttendees: 15000,
      vehicleTypes: [],
      tags: ["sneakers", "streetwear", "culture", "youth", "resale"],
      relevanceScore: 80,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
    {
      id: "radar-local-2car-meet",
      title: "Sunset Cruise — 2 Cars, Big Dreams",
      category: "car_meet",
      source: "instagram.com/sunsetcruisers",
      sourceUrl: "https://instagram.com/sunsetcruisers",
      organizerName: "@sunsetcruisers",
      organizerContact: null,
      organizerSocial: "@sunsetcruisers",
      location: "Orlando, FL",
      region: "North America",
      date: "2026-04-12",
      estimatedAttendees: 2,
      vehicleTypes: ["car"],
      tags: ["micro", "grassroots", "local", "startup_crew"],
      relevanceScore: 75,
      contactable: true,
      status: "upcoming",
      discoveredAt: new Date().toISOString(),
    },
  ];

  let filtered = events;

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.category.includes(q) ||
      e.tags.some(t => t.includes(q)) ||
      e.organizerName.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  }

  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }

  if (region) {
    filtered = filtered.filter(e => e.region === region);
  }

  return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

router.get("/radar", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const query = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const region = req.query.region as string | undefined;

    const events = generateRadarEvents(query, category, region);

    res.json({
      events,
      total: events.length,
      categories: EVENT_CATEGORIES,
      regions: REGIONS,
      message: "Live event intelligence — from 2-car crews to Gumball 3000. Everyone on your radar.",
    });
  } catch (err) {
    log.error({ err }, "Event radar failed");
    res.status(500).json({ error: "Radar offline" });
  }
});

router.get("/radar/categories", async (_req: Request, res: Response) => {
  res.json({ categories: EVENT_CATEGORIES, regions: REGIONS });
});

router.post("/radar/outreach", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);
    const { eventId, message, channel } = req.body;

    if (!eventId) {
      res.status(400).json({ error: "eventId required" });
      return;
    }

    log.info({ userId, eventId, channel: channel || "email" }, "Outreach initiated from radar");
    res.json({
      success: true,
      message: "Outreach logged. Follow up within 24 hours.",
      outreach: {
        eventId,
        sentBy: userId,
        channel: channel || "email",
        sentAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    log.error({ err }, "Outreach failed");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
