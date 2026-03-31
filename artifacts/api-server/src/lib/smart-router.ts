const ROUTING_RULES: Array<{
  keywords: string[];
  department: string;
  agent: string;
  slaMinutes: number;
}> = [
  {
    keywords: ["sticker", "plate", "title", "registration", "dmv", "tag", "transfer", "lien", "notary", "clerk"],
    department: "DMV",
    agent: "Guardian",
    slaMinutes: 480,
  },
  {
    keywords: ["part", "mopar", "backorder", "oem", "accessory", "catalog", "order part", "fender", "bumper", "headlight"],
    department: "Parts",
    agent: "Source",
    slaMinutes: 240,
  },
  {
    keywords: ["warranty", "recall", "repair", "service", "maintenance", "oil change", "brake", "diagnostic", "check engine", "transmission"],
    department: "Service",
    agent: "Guardian",
    slaMinutes: 360,
  },
  {
    keywords: ["finance", "loan", "payment", "lease", "credit", "bank", "contract", "cit", "contracts in transit", "stellantis", "paperwork", "approval"],
    department: "Finance",
    agent: "Finance",
    slaMinutes: 240,
  },
  {
    keywords: ["delivery", "transport", "ship", "out of state", "pickup", "drop off", "flatbed", "carrier", "logistics"],
    department: "Logistics",
    agent: "Logistics",
    slaMinutes: 720,
  },
  {
    keywords: ["deal", "sale", "trade", "appraisal", "offer", "negotiate", "buyer", "test drive", "prospect"],
    department: "Sales",
    agent: "Concierge",
    slaMinutes: 120,
  },
  {
    keywords: ["question", "where is", "status", "update", "complaint", "help", "when", "how long", "eta"],
    department: "Customer_Service",
    agent: "Concierge",
    slaMinutes: 60,
  },
];

export interface RoutingResult {
  department: string;
  agent: string;
  slaMinutes: number;
  confidence: number;
  matchedKeywords: string[];
}

export function smartRoute(input: string): RoutingResult {
  const text = input.toLowerCase();
  let bestMatch: RoutingResult | null = null;
  let bestScore = 0;

  for (const rule of ROUTING_RULES) {
    const matched = rule.keywords.filter((kw) => text.includes(kw));
    const score = matched.length / rule.keywords.length;

    if (matched.length > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = {
        department: rule.department,
        agent: rule.agent,
        slaMinutes: rule.slaMinutes,
        confidence: Math.min(score * 2, 1),
        matchedKeywords: matched,
      };
    }
  }

  return bestMatch || {
    department: "General",
    agent: "Concierge",
    slaMinutes: 480,
    confidence: 0,
    matchedKeywords: [],
  };
}

export function extractVinFromText(text: string): string | null {
  const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/gi;
  const match = text.match(vinRegex);
  return match ? match[0].toUpperCase() : null;
}

export function extractPartNumbers(text: string): string[] {
  const partRegex = /\b[A-Z0-9]{2,4}[-\s]?[A-Z0-9]{4,8}\b/gi;
  const matches = text.match(partRegex) || [];
  return [...new Set(matches.map((m) => m.toUpperCase()))];
}
