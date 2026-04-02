import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

interface ExtractedEntities {
  customerName: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vin: string | null;
  maxBudget: number | null;
  minBudget: number | null;
  serviceType: string | null;
  urgency: "standard" | "priority" | "urgent" | "emergency";
  intent: "buy" | "sell" | "service" | "refer" | "assist" | "unknown";
  location: string | null;
  phoneNumber: string | null;
  rawKeywords: string[];
}

interface Participant {
  role: "referral" | "service" | "logistics" | "location" | "deal";
  userId: number | null;
  autoDetected: boolean;
  share: number;
}

const VIN_REGEX = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const YEAR_REGEX = /\b(19[89]\d|20[0-3]\d)\b/;
const PRICE_REGEX = /\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*k?\b/gi;

const MAKES = [
  "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "jeep",
  "bmw", "mercedes", "audi", "lexus", "acura", "hyundai", "kia",
  "dodge", "ram", "chrysler", "subaru", "mazda", "volkswagen", "vw",
  "tesla", "cadillac", "buick", "gmc", "lincoln", "infiniti",
  "porsche", "land rover", "range rover", "jaguar", "volvo",
  "mitsubishi", "genesis", "alfa romeo", "maserati", "ferrari",
  "lamborghini", "bentley", "rolls royce", "rivian", "lucid",
];

const MODELS: Record<string, string[]> = {
  jeep: ["cherokee", "grand cherokee", "wrangler", "gladiator", "compass", "renegade", "wagoneer"],
  toyota: ["camry", "corolla", "rav4", "highlander", "tacoma", "tundra", "4runner", "prius", "supra"],
  honda: ["civic", "accord", "cr-v", "pilot", "odyssey", "hr-v", "ridgeline", "fit"],
  ford: ["f-150", "f150", "mustang", "explorer", "escape", "bronco", "ranger", "edge", "expedition"],
  chevrolet: ["silverado", "equinox", "tahoe", "suburban", "traverse", "malibu", "camaro", "corvette", "blazer"],
  chevy: ["silverado", "equinox", "tahoe", "suburban", "traverse", "malibu", "camaro", "corvette", "blazer"],
  bmw: ["3 series", "5 series", "x3", "x5", "x7", "m3", "m5", "i4", "ix"],
  nissan: ["altima", "sentra", "rogue", "pathfinder", "frontier", "titan", "maxima"],
  dodge: ["charger", "challenger", "durango", "hornet"],
  ram: ["1500", "2500", "3500"],
  tesla: ["model 3", "model y", "model s", "model x", "cybertruck"],
  mercedes: ["c-class", "e-class", "s-class", "gle", "glc", "gls", "amg"],
  kia: ["forte", "k5", "sportage", "telluride", "seltos", "sorento", "soul", "ev6"],
  hyundai: ["elantra", "sonata", "tucson", "santa fe", "palisade", "kona", "ioniq"],
};

const SERVICE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\boil\s*change\b/i, label: "Oil Change" },
  { pattern: /\bbrake\b/i, label: "Brake Service" },
  { pattern: /\btire[s]?\b/i, label: "Tire Service" },
  { pattern: /\btransmission\b/i, label: "Transmission Repair" },
  { pattern: /\bengine\b/i, label: "Engine Diagnostic" },
  { pattern: /\bdetail(?:ing)?\b/i, label: "Detailing" },
  { pattern: /\bpaint\b/i, label: "Paint/Body Work" },
  { pattern: /\balignment\b/i, label: "Alignment" },
  { pattern: /\binspection\b/i, label: "Vehicle Inspection" },
  { pattern: /\bmechanic\b/i, label: "General Mechanic" },
  { pattern: /\bdmv\b/i, label: "DMV Run" },
  { pattern: /\bregistration\b/i, label: "Registration" },
  { pattern: /\btitle\s+transfer\b/i, label: "Title Transfer" },
  { pattern: /\btransport\b/i, label: "Vehicle Transport" },
  { pattern: /\btow(?:ing)?\b/i, label: "Towing" },
  { pattern: /\bbattery\b/i, label: "Battery Service" },
  { pattern: /\ba\/?c\s+(?:repair|service|fix|broken|not working)\b/i, label: "A/C Repair" },
  { pattern: /\bair\s*condition(?:ing|er)?\b/i, label: "A/C Repair" },
  { pattern: /\bbodywork\b/i, label: "Body Work" },
  { pattern: /\bdent\b/i, label: "Dent Repair" },
  { pattern: /\bwindshield\b/i, label: "Windshield Repair" },
  { pattern: /\bceramic\b/i, label: "Ceramic Coating" },
  { pattern: /\bwrap\b/i, label: "Vehicle Wrap" },
  { pattern: /\btint(?:ing)?\b/i, label: "Window Tinting" },
];

const URGENCY_PATTERNS: Array<{ pattern: RegExp; level: "urgent" | "emergency" | "priority" }> = [
  { pattern: /\b(emergency|broke down|stranded|accident|crash|tow)\b/i, level: "emergency" },
  { pattern: /\b(urgent|asap|right now|immediately|today)\b/i, level: "urgent" },
  { pattern: /\b(soon|priority|rush|this week|hot lead)\b/i, level: "priority" },
];

function extractEntities(text: string): ExtractedEntities {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let customerName: string | null = null;
  const clientMatch = text.match(/(?:client|customer|buyer|my (?:guy|friend|cousin|brother|sister|uncle|boy|girl|homie|neighbor|coworker|boss)|(?:someone|somebody))\s+(?:named?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (clientMatch) customerName = clientMatch[1];

  const nameMatch2 = text.match(/(?:for|name(?:'s| is)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (!customerName && nameMatch2) customerName = nameMatch2[1];

  const vin = text.match(VIN_REGEX)?.[0]?.toUpperCase() || null;
  const phoneNumber = text.match(PHONE_REGEX)?.[0] || null;

  let vehicleMake: string | null = null;
  let vehicleModel: string | null = null;
  for (const make of MAKES) {
    const makeRegex = new RegExp(`\\b${make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (makeRegex.test(lower)) {
      vehicleMake = make.charAt(0).toUpperCase() + make.slice(1);
      if (make === "chevy") vehicleMake = "Chevrolet";
      if (make === "vw") vehicleMake = "Volkswagen";
      if (make === "range rover") vehicleMake = "Range Rover";
      if (make === "land rover") vehicleMake = "Land Rover";
      if (make === "rolls royce") vehicleMake = "Rolls Royce";
      if (make === "alfa romeo") vehicleMake = "Alfa Romeo";
      const modelsForMake = MODELS[make] || [];
      for (const model of modelsForMake) {
        const modelRegex = new RegExp(`\\b${model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (modelRegex.test(lower)) {
          vehicleModel = model.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          break;
        }
      }
      break;
    }
  }

  const yearMatch = text.match(YEAR_REGEX);
  const vehicleYear = yearMatch ? parseInt(yearMatch[1]) : null;

  let maxBudget: number | null = null;
  let minBudget: number | null = null;
  const priceMatches: number[] = [];
  let m: RegExpExecArray | null;

  const textWithoutZip = text.replace(/\b(?:zip(?:\s*code)?|postal)\s*\d{5}\b/gi, "").replace(/\b\d{5}(?:-\d{4})?\b/g, (match, offset) => {
    const before = text.substring(Math.max(0, offset - 15), offset).toLowerCase();
    if (/zip|postal|area|code|fl|ca|ny|tx|il|nj|pa|oh|mi|ga|nc|va|wa|ma|az|co|mn|wi|md|mo|sc|al|la|ky|or|ok|ct|ia|ms|ar|ks|ut|nv|nm/.test(before)) return "";
    return match;
  });

  const priceRegex = /(?:\$\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)\s*(k|K|thousand)?|(\d{1,3}(?:,?\d{3})*)\s*(k|K|thousand))\b/g;
  while ((m = priceRegex.exec(textWithoutZip)) !== null) {
    const rawNum = m[1] || m[3];
    const multiplier = m[2] || m[4];
    if (!rawNum) continue;
    let val = parseFloat(rawNum.replace(/,/g, ""));
    if (multiplier) val *= 1000;
    if (val >= 500 && val <= 500000) priceMatches.push(val);
  }
  if (priceMatches.length === 1) {
    if (lower.includes("under") || lower.includes("below") || lower.includes("max") || lower.includes("budget") || lower.includes("less than")) {
      maxBudget = priceMatches[0];
    } else if (lower.includes("over") || lower.includes("above") || lower.includes("at least") || lower.includes("minimum")) {
      minBudget = priceMatches[0];
    } else {
      maxBudget = priceMatches[0];
    }
  } else if (priceMatches.length >= 2) {
    minBudget = Math.min(...priceMatches);
    maxBudget = Math.max(...priceMatches);
  }

  let serviceType: string | null = null;
  for (const { pattern, label } of SERVICE_PATTERNS) {
    if (pattern.test(text)) {
      serviceType = label;
      break;
    }
  }

  let intent: ExtractedEntities["intent"] = "unknown";
  if (/\b(buy|purchase|looking for|wants?|need(?:s)? a|find|searching|get a|shop)\b/i.test(lower)) intent = "buy";
  else if (/\b(sell|trade|get rid|unload|flip)\b/i.test(lower)) intent = "sell";
  else if (serviceType || /\b(fix|repair|service|maintain|check|diagnose|detail|wash|tow|transport)\b/i.test(lower)) intent = "service";
  else if (/\b(refer|know(?:s)? (?:a|someone)|connect|intro|send|hook up|link)\b/i.test(lower)) intent = "refer";
  else if (/\b(help|assist|support|pick up|drop off|deliver|run)\b/i.test(lower)) intent = "assist";

  let urgency: ExtractedEntities["urgency"] = "standard";
  for (const { pattern, level } of URGENCY_PATTERNS) {
    if (pattern.test(lower)) {
      urgency = level;
      break;
    }
  }

  const locationMatch = text.match(/\b(?:in|near|around|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)\b/);
  const location = locationMatch?.[1] || null;

  const rawKeywords = words.filter(w => w.length > 3 && !["with", "that", "this", "from", "they", "them", "their", "have", "been", "will", "would", "could", "should", "about", "into", "just", "like", "some", "want", "need", "under", "over", "client", "customer"].includes(w));

  return {
    customerName, vehicleMake, vehicleModel, vehicleYear,
    vin, maxBudget, minBudget, serviceType, urgency,
    intent, location, phoneNumber, rawKeywords,
  };
}

function buildParticipants(requestingUserId: number, entities: ExtractedEntities): Participant[] {
  const participants: Participant[] = [];
  const isReferral = entities.intent === "refer" || entities.intent === "buy";

  if (isReferral) {
    participants.push({ role: "referral", userId: requestingUserId, autoDetected: true, share: 10.0 });
  }

  if (entities.intent === "service" || entities.serviceType) {
    participants.push({ role: "service", userId: null, autoDetected: true, share: 65.0 });
  }

  if (entities.intent === "assist" || /transport|deliver|tow|pick up|drop off|dmv/i.test(entities.rawKeywords.join(" "))) {
    participants.push({ role: "logistics", userId: null, autoDetected: true, share: 11.5 });
  }

  participants.push({ role: "location", userId: null, autoDetected: true, share: 5.0 });

  if (entities.intent === "buy" || entities.intent === "sell") {
    participants.push({ role: "deal", userId: null, autoDetected: true, share: 0 });
  }

  return participants;
}

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Text-to-Deal Engine",
    version: "1.0.0",
    description: "Paste a message like a text. Get a deal. Everyone gets paid.",
    flow: "Message → Extract → Match → Deal → Split → Paid",
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    rule: "If you touch the deal, you get paid.",
  });
});

router.post("/convert", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 3) {
      res.status(400).json({ error: "Message is required. Just type what you need — like a text." });
      return;
    }

    const userId = (req as any).user?.id || null;
    const entities = extractEntities(message.trim());
    const participants = buildParticipants(userId || 0, entities);
    const dealId = `TXD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const proofHash = crypto.createHash("sha256").update(`${dealId}:${message}:${Date.now()}`).digest("hex");

    let vehicleLabelParts = "";
    if (entities.vehicleYear) vehicleLabelParts += `${entities.vehicleYear} `;
    if (entities.vehicleMake) vehicleLabelParts += `${entities.vehicleMake} `;
    if (entities.vehicleModel) vehicleLabelParts += entities.vehicleModel;
    const vehicleLabel: string | null = vehicleLabelParts.trim() || null;

    let actionSummary = "";
    switch (entities.intent) {
      case "buy":
        actionSummary = `Lead created: ${entities.customerName || "Unknown buyer"} wants ${vehicleLabel || "a vehicle"}${entities.maxBudget ? ` under $${entities.maxBudget.toLocaleString()}` : ""}`;
        break;
      case "sell":
        actionSummary = `Trade-in/sell opportunity: ${vehicleLabel || "vehicle"} submitted`;
        break;
      case "service":
        actionSummary = `Service request: ${entities.serviceType || "General service"} for ${vehicleLabel || "vehicle"}`;
        break;
      case "refer":
        actionSummary = `Referral: ${entities.customerName || "Someone"} needs ${vehicleLabel || entities.serviceType || "automotive help"}`;
        break;
      case "assist":
        actionSummary = `Assistance request: ${entities.serviceType || "logistics/help"} needed`;
        break;
      default:
        actionSummary = `Opportunity logged from text: "${message.substring(0, 60)}${message.length > 60 ? "..." : ""}"`;
    }

    const deal = {
      dealId,
      status: "Open",
      type: entities.intent,
      actionSummary,
      vehicle: vehicleLabel ? {
        make: entities.vehicleMake,
        model: entities.vehicleModel,
        year: entities.vehicleYear,
        vin: entities.vin,
        budget: entities.maxBudget ? { max: entities.maxBudget, min: entities.minBudget } : null,
      } : null,
      customer: {
        name: entities.customerName,
        phone: entities.phoneNumber,
        location: entities.location,
      },
      service: entities.serviceType ? {
        type: entities.serviceType,
        urgency: entities.urgency,
      } : null,
      participants,
      platformFee: 8.5,
      splitRule: "If you touch the deal, you get paid.",
      proofHash,
      proofAlgorithm: "SHA-256",
      createdAt: new Date().toISOString(),
      createdBy: userId,
      originalMessage: message,
      nextSteps: [
        entities.intent === "buy"
          ? { action: "Match to inventory or source vehicle", endpoint: "POST /api/ask-onyx", note: "The 7-Agent Mesh will find matching vehicles" }
          : { action: "Match to nearest available Node", endpoint: "POST /api/tasks/create", note: "Auto-dispatch to qualified Nodes in your area" },
        { action: "Track deal in real-time", endpoint: `GET /api/deals/${dealId}`, note: "Watch the deal progress — everyone sees the same thing" },
        { action: "View your wallet", endpoint: "GET /api/onyx-wallet/balance", note: "Your earnings update instantly when the deal completes" },
      ],
    };

    res.status(201).json({
      success: true,
      message: actionSummary,
      deal,
      entities,
      tip: "That's it. You just sent a text and created a deal. When it closes, everyone who touched it gets paid.",
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    });
  } catch (err: any) {
    console.error("[text-to-deal] Error:", err);
    res.status(500).json({ error: "Failed to convert message to deal", details: err.message });
  }
});

router.post("/extract", (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }
  const entities = extractEntities(message.trim());
  res.json({
    success: true,
    entities,
    readableIntent: entities.intent === "buy" ? "Looking to buy a vehicle"
      : entities.intent === "sell" ? "Looking to sell/trade a vehicle"
      : entities.intent === "service" ? `Needs ${entities.serviceType || "automotive service"}`
      : entities.intent === "refer" ? "Referring someone who needs help"
      : entities.intent === "assist" ? "Offering/requesting assistance"
      : "General automotive inquiry",
  });
});

export default router;
