import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

interface IntentMatch {
  intent: string;
  confidence: number;
  agent: string;
  category: string;
  action: string;
  urgency: string;
}

const INTENT_PATTERNS: Array<{ patterns: RegExp[]; intent: string; agent: string; category: string; action: string; urgency?: string }> = [
  {
    patterns: [/bank\s*payoff/i, /pay\s*off\s*(my\s*)?car/i, /lien\s*release/i, /payoff\s*quote/i, /payoff\s*amount/i],
    intent: "bank_payoff",
    agent: "Finance Agent",
    category: "Bank_Payoff",
    action: "Initiate automated bank payoff protocol",
  },
  {
    patterns: [/flat\s*tire/i, /tire\s*(blow|flat|puncture)/i, /need\s*a?\s*tire/i, /tire\s*change/i, /spare\s*tire/i],
    intent: "tire_service",
    agent: "Service Agent",
    category: "Tire_Service",
    action: "Dispatch nearest Service Node for tire assistance",
    urgency: "Urgent",
  },
  {
    patterns: [/mechanic/i, /car\s*(won't|wont)\s*start/i, /engine\s*(light|problem|issue)/i, /brake\s*(problem|noise|squeal)/i, /transmission/i, /check\s*engine/i],
    intent: "mechanic_service",
    agent: "Service Agent",
    category: "Mechanic_Service",
    action: "Dispatch qualified mechanic Node",
  },
  {
    patterns: [/dmv/i, /registration/i, /title\s*transfer/i, /license\s*plate/i, /tag\s*renewal/i],
    intent: "dmv_run",
    agent: "Logistics Agent",
    category: "DMV_Run",
    action: "Dispatch DMV Runner Node",
  },
  {
    patterns: [/detail/i, /car\s*wash/i, /clean\s*(my\s*)?car/i, /polish/i, /wax/i, /ceramic\s*coat/i],
    intent: "detailing",
    agent: "Service Agent",
    category: "Detailing",
    action: "Match to nearest Detailing Node",
  },
  {
    patterns: [/oil\s*change/i, /oil\s*service/i, /lube/i, /synthetic\s*oil/i],
    intent: "oil_change",
    agent: "Service Agent",
    category: "Oil_Change",
    action: "Dispatch oil change service Node",
  },
  {
    patterns: [/transport/i, /ship\s*(my\s*)?car/i, /deliver\s*(my\s*)?vehicle/i, /move\s*(my\s*)?car/i, /tow/i, /haul/i],
    intent: "transport",
    agent: "Logistics Agent",
    category: "Transport",
    action: "Initiate vehicle transport logistics",
  },
  {
    patterns: [/inspect/i, /pre[\-\s]?purchase/i, /vehicle\s*check/i, /ppi/i, /condition\s*report/i],
    intent: "vehicle_inspection",
    agent: "Service Agent",
    category: "Vehicle_Inspection",
    action: "Dispatch certified Vehicle Inspector Node",
  },
  {
    patterns: [/warranty/i, /covered/i, /factory\s*warranty/i, /powertrain/i, /recall/i],
    intent: "warranty_check",
    agent: "Intake Agent",
    category: "Warranty_Claim",
    action: "Run warranty intelligence check on VIN",
  },
  {
    patterns: [/insurance/i, /quote/i, /coverage/i, /premium/i],
    intent: "insurance_quote",
    agent: "Finance Agent",
    category: "Insurance_Quote",
    action: "Generate insurance quote comparison",
  },
  {
    patterns: [/parts/i, /pick\s*up\s*parts/i, /auto\s*parts/i, /need\s*a?\s*part/i],
    intent: "parts_pickup",
    agent: "Logistics Agent",
    category: "Parts_Pickup",
    action: "Dispatch Parts Runner Node",
  },
  {
    patterns: [/roadside/i, /stranded/i, /locked\s*out/i, /jump\s*start/i, /dead\s*battery/i, /broke\s*down/i, /breakdown/i],
    intent: "roadside_assist",
    agent: "Service Agent",
    category: "Roadside_Assist",
    action: "Emergency roadside assistance dispatch",
    urgency: "Emergency",
  },
  {
    patterns: [/sell\s*(my\s*)?car/i, /trade\s*in/i, /what'?s?\s*(my\s*)?car\s*worth/i, /value\s*(my\s*)?car/i, /appraisal/i],
    intent: "sell_vehicle",
    agent: "Intake Agent",
    category: "Custom",
    action: "Initiate vehicle valuation and listing flow",
  },
  {
    patterns: [/buy\s*a?\s*car/i, /find\s*me\s*a?\s*(car|vehicle|truck|suv)/i, /looking\s*for/i, /search\s*(for\s*)?cars/i],
    intent: "buy_vehicle",
    agent: "Intake Agent",
    category: "Custom",
    action: "Launch vehicle search and matching",
  },
  {
    patterns: [/help/i, /what\s*can\s*you\s*do/i, /how\s*does\s*(this|onyx)\s*work/i],
    intent: "general_help",
    agent: "Support Agent",
    category: "Custom",
    action: "Display ONYX capabilities and guide user",
  },
];

function classifyIntent(input: string): IntentMatch {
  const normalizedInput = input.toLowerCase().trim();

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(normalizedInput)) {
        return {
          intent: pattern.intent,
          confidence: 0.92,
          agent: pattern.agent,
          category: pattern.category,
          action: pattern.action,
          urgency: pattern.urgency || "Standard",
        };
      }
    }
  }

  return {
    intent: "unclassified",
    confidence: 0.3,
    agent: "Support Agent",
    category: "Custom",
    action: "Route to Support Agent for human-assisted classification",
    urgency: "Standard",
  };
}

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    protocol: "3C ONYX — Ask ONYX Command Router",
    version: "1.0.0",
    description: "Single NLP-ready input that routes intents to the 7-Agent Mesh",
    architect: "Ronald Antonio Cadet",
    sovereignty: "CUXTOMCANDYCLUB LLC",
    agents: [
      { name: "Intake Agent", handles: "OCR, VIN scanning, warranty documents, vehicle valuation" },
      { name: "Finance Agent", handles: "Bank payoffs, funding, insurance, S1-S3 Stellantis" },
      { name: "Service Agent", handles: "Mechanics, detailing, tire, oil, inspections, roadside" },
      { name: "Logistics Agent", handles: "DMV runs, transport, parts pickup, document delivery" },
      { name: "Referral Agent", handles: "Universal Bird-Dog Ledger, multi-node payout splits" },
      { name: "Support Agent", handles: "Real-time WebSocket communication, general help" },
      { name: "Proof Agent", handles: "ONYX Proof Hash Chain stamping for every event" },
    ],
    supportedIntents: INTENT_PATTERNS.map(p => p.intent),
    confidenceThreshold: 0.9,
  });
});

router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { input, userId, vin, geoHash, latitude, longitude } = req.body;

    if (!input) {
      res.status(400).json({ error: "input is required — tell ONYX what you need" });
      return;
    }

    const classification = classifyIntent(input);
    const requestId = `ASK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const proofHash = crypto.createHash("sha256").update(JSON.stringify({
      requestId,
      input,
      classification,
      userId,
      ts: Date.now(),
      architect: "Ronald Antonio Cadet",
    })).digest("hex");

    const response: any = {
      requestId,
      input,
      classification: {
        intent: classification.intent,
        confidence: classification.confidence,
        agent: classification.agent,
        category: classification.category,
        urgency: classification.urgency,
      },
      action: classification.action,
      proofHash,
    };

    if (classification.confidence >= 0.9) {
      response.execution = {
        status: "AUTO_ROUTED",
        message: `Your request has been routed to the ${classification.agent}`,
        taskCategory: classification.category,
        nextStep: classification.urgency === "Emergency"
          ? "Emergency dispatch initiated — Node en route"
          : `Creating task in the matching queue (urgency: ${classification.urgency})`,
        createTaskEndpoint: "/api/tasks/create",
        suggestedPayload: {
          category: classification.category,
          title: input,
          requestedByUserId: userId,
          urgency: classification.urgency,
          vin: vin || null,
          geoHash: geoHash || null,
          latitude: latitude || null,
          longitude: longitude || null,
        },
      };
    } else {
      response.execution = {
        status: "NEEDS_CLARIFICATION",
        message: "I'm not 100% sure what you need. Can you give me more detail?",
        suggestions: [
          "Try: 'I need a bank payoff for my car'",
          "Try: 'I have a flat tire'",
          "Try: 'I need a mechanic'",
          "Try: 'DMV registration renewal'",
          "Try: 'Ship my car to Florida'",
          "Try: 'What's my car worth?'",
        ],
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Ask ONYX failed", detail: String(error) });
  }
});

router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { inputs } = req.body;
    if (!inputs || !Array.isArray(inputs)) {
      res.status(400).json({ error: "inputs must be an array of strings" });
      return;
    }

    const results = inputs.map((input: string) => ({
      input,
      classification: classifyIntent(input),
    }));

    res.json({
      batchSize: results.length,
      results,
      agentDistribution: results.reduce((acc: Record<string, number>, r) => {
        acc[r.classification.agent] = (acc[r.classification.agent] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ error: "Batch classification failed", detail: String(error) });
  }
});

export default router;
