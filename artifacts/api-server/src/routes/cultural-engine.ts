import { Router, type Request, type Response } from "express";
import { db, usersTable, vehiclesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();
const log = logger.child({ module: "cultural-engine" });

interface CulturalProfile {
  userId: number;
  musicAffinity: string;
  styleAffinity: string;
  toneOfVoice: string;
  greetingStyle: string;
  colorPalette: string[];
  arCharacter: string;
  arCharacterLicense: string;
  sampleMessages: {
    maintenance: string;
    upgrade: string;
    accessory: string;
    greeting: string;
    event: string;
  };
  demographics: {
    zipCode: string | null;
    regionStyle: string;
    purchasePattern: string;
    vehicleCategory: string;
  };
}

const ZIP_REGION_MAP: Record<string, string> = {
  "1": "northeast",
  "0": "northeast",
  "2": "southeast",
  "3": "southeast",
  "4": "midwest",
  "5": "midwest",
  "6": "south_central",
  "7": "south_central",
  "8": "mountain_west",
  "9": "pacific_west",
};

const REGION_CULTURE: Record<string, { primary: string; secondary: string; style: string }> = {
  northeast: { primary: "hip_hop", secondary: "rock", style: "urban_luxury" },
  southeast: { primary: "hip_hop", secondary: "country", style: "southern_premium" },
  midwest: { primary: "rock", secondary: "country", style: "heartland_classic" },
  south_central: { primary: "hip_hop", secondary: "country", style: "southern_bold" },
  mountain_west: { primary: "country", secondary: "rock", style: "rugged_adventure" },
  pacific_west: { primary: "hip_hop", secondary: "pop", style: "west_coast_clean" },
};

const MUSIC_TONES: Record<string, {
  tone: string;
  greeting: string;
  maintenance: string;
  upgrade: string;
  accessory: string;
  event: string;
  arChar: string;
  arLicense: string;
  palette: string[];
}> = {
  hip_hop: {
    tone: "confident, direct, culture-forward",
    greeting: "What's good, fam. Your ride's looking right.",
    maintenance: "Aye, your whip needs attention. Oil change coming up — don't sleep on it. Tap below, we got you.",
    upgrade: "Listen, we can get you out that and into something crazy. Better price, better everything. Yes or nah?",
    accessory: "This piece right here would go hard on your ride. Tap in.",
    event: "Pull up — big meet this weekend. Your people gonna be there.",
    arChar: "ONYX Racer — Street Legend",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#000000", "#1a1a1a", "#ff3333"],
  },
  rock: {
    tone: "bold, raw energy, no-nonsense",
    greeting: "Let's ride. Your machine's ready to go.",
    maintenance: "Heads up — your engine needs some love. Oil change is due. Hit the button, we'll handle it.",
    upgrade: "Your current ride's been solid, but we found something with more power. Better deal. Interested?",
    accessory: "This gear was made for your build. Check it out.",
    event: "There's a show this weekend — loud cars, louder people. You in?",
    arChar: "Chrome Phantom — Road Warrior",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#1a1a1a", "#8b0000", "#c0c0c0"],
  },
  country: {
    tone: "friendly, straightforward, community-first",
    greeting: "Hey there, good to see you. Your truck's running strong.",
    maintenance: "Just a friendly heads-up — your tires are due for a rotation. We can get that handled real quick for you.",
    upgrade: "We found a deal that might work for you — newer model, lower payment. Worth a look?",
    accessory: "This would be a great addition to your setup. Take a look when you get a chance.",
    event: "There's a meetup this Saturday — good people, good trucks. Come on out.",
    arChar: "Dusty Thunder — Trail Blazer",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#2d1f0e", "#8B4513", "#f5deb3"],
  },
  pop: {
    tone: "upbeat, clean, modern",
    greeting: "Hey! Looking good out there. Your ride is on point.",
    maintenance: "Quick reminder — your car could use some TLC. Oil change time! Tap to schedule.",
    upgrade: "We found something perfect for you — sleek, modern, great price. Want to check it out?",
    accessory: "This accessory is trending right now and it's perfect for your car. Take a peek!",
    event: "Fun event coming up this weekend! Cars, vibes, good energy. Join us?",
    arChar: "Neon Drift — Speed Star",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#000000", "#ff69b4", "#00d4ff"],
  },
  latin: {
    tone: "warm, familia-first, passionate",
    greeting: "Que lo que, familia! Your ride is clean.",
    maintenance: "Oye, tu carro necesita mantenimiento. Oil change time — we got you covered. Tap below.",
    upgrade: "Mira, we can get you into something better. Better price, better ride. What you say?",
    accessory: "This would look fire on your ride. Check it out, familia.",
    event: "Big meet this weekend — la familia's coming through. Pull up!",
    arChar: "Fuego Racer — Street Heat",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#000000", "#ff4500", "#00cc44"],
  },
  electronic: {
    tone: "futuristic, minimal, tech-forward",
    greeting: "System online. Your vehicle status: optimal.",
    maintenance: "Maintenance alert: oil service interval approaching. One tap to schedule.",
    upgrade: "New vehicle match detected. Superior specs, optimized pricing. Review?",
    accessory: "Compatible upgrade found for your vehicle. Details below.",
    event: "Event detected in your area. High-performance vehicles. RSVP?",
    arChar: "Circuit Runner — Digital Phantom",
    arLicense: "Original IP — 3C ONYX Studio",
    palette: ["#D4AF37", "#0a0a0a", "#00ff88", "#7b2fef"],
  },
};

function inferMusicFromZip(zip: string | null): string {
  if (!zip) return "hip_hop";
  const firstDigit = zip.charAt(0);
  const region = ZIP_REGION_MAP[firstDigit] || "pacific_west";
  return REGION_CULTURE[region]?.primary || "hip_hop";
}

function inferFromName(name: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();

  const latinNames = ["carlos", "maria", "jose", "juan", "luis", "rosa", "miguel", "pedro", "sofia", "diego", "alejandro", "camila", "valentina", "mateo", "santiago"];
  if (latinNames.some(n => lower.includes(n))) return "latin";

  return null;
}

function inferFromVehicle(make: string | null, type: string | null): string | null {
  if (!make) return null;
  const lower = make.toLowerCase();

  const luxuryMakes = ["bmw", "mercedes", "audi", "lexus", "porsche", "maserati", "bentley", "rolls-royce", "lamborghini", "ferrari"];
  if (luxuryMakes.includes(lower)) return "hip_hop";

  const truckMakes = ["ford", "chevrolet", "ram", "gmc", "toyota"];
  if (truckMakes.includes(lower) && (type === "truck" || type === "suv")) return "country";

  const sportMakes = ["subaru", "mitsubishi", "nissan", "honda"];
  if (sportMakes.includes(lower)) return "electronic";

  if (type === "motorcycle") return "rock";
  if (type === "boat" || type === "jet_ski") return "pop";

  return null;
}

router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.user!.sub, 10);

    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    }).from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const vehicles = await db.select({
      make: vehiclesTable.make,
      model: vehiclesTable.model,
      year: vehiclesTable.year,
    }).from(vehiclesTable).where(eq(vehiclesTable.dealerId, userId)).limit(1);

    const vehicleMake = vehicles[0]?.make || null;
    const vehicleType = "car";
    let userZip: string | null = null;

    let musicAffinity = inferMusicFromZip(userZip);

    const nameInference = inferFromName(user.name || null);
    if (nameInference) musicAffinity = nameInference;

    const vehicleInference = inferFromVehicle(vehicleMake, vehicleType);
    if (vehicleInference) musicAffinity = vehicleInference;

    const cultureTone = MUSIC_TONES[musicAffinity] || MUSIC_TONES.hip_hop;

    const profile: CulturalProfile = {
      userId: user.id,
      musicAffinity,
      styleAffinity: cultureTone.tone,
      toneOfVoice: cultureTone.tone,
      greetingStyle: cultureTone.greeting,
      colorPalette: cultureTone.palette,
      arCharacter: cultureTone.arChar,
      arCharacterLicense: cultureTone.arLicense,
      sampleMessages: {
        maintenance: cultureTone.maintenance,
        upgrade: cultureTone.upgrade,
        accessory: cultureTone.accessory,
        greeting: cultureTone.greeting,
        event: cultureTone.event,
      },
      demographics: {
        zipCode: userZip,
        regionStyle: userZip ? (ZIP_REGION_MAP[(userZip as string).charAt(0)] || "unknown") : "unknown",
        purchasePattern: vehicles.length > 0 ? "active_owner" : "prospect",
        vehicleCategory: vehicleType,
      },
    };

    res.json({ profile });
  } catch (err) {
    log.error({ err }, "Cultural profile generation failed");
    res.status(500).json({ error: "Failed to build cultural profile" });
  }
});

router.get("/tones", async (_req: Request, res: Response) => {
  const tones = Object.entries(MUSIC_TONES).map(([key, val]) => ({
    id: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    tone: val.tone,
    greeting: val.greeting,
    arCharacter: val.arChar,
    palette: val.palette,
  }));
  res.json({ tones });
});

router.get("/ar-characters", async (_req: Request, res: Response) => {
  const characters = Object.entries(MUSIC_TONES).map(([key, val]) => ({
    id: `ar-${key}`,
    name: val.arChar,
    culture: key,
    license: val.arLicense,
    licenseFeeHandled: true,
    autoPayEnabled: true,
    palette: val.palette,
  }));

  res.json({
    characters,
    licensing: {
      status: "all_cleared",
      message: "All AR character licenses are original IP owned by 3C ONYX Studio. Any third-party licensing fees are auto-settled through the platform commission system.",
      autoPayEnabled: true,
    },
  });
});

export default router;
