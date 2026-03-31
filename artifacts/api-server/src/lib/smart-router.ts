const ROUTING_RULES: Array<{
  keywords: string[];
  phrases: string[];
  department: string;
  agent: string;
  slaMinutes: number;
  weight: number;
  bankReady: boolean;
}> = [
  {
    keywords: ["sticker", "plate", "title", "registration", "dmv", "tag", "transfer", "lien", "notary", "clerk", "inspection", "mvr", "odometer", "temp tag"],
    phrases: ["motor vehicle", "dept of motor", "title work", "tag and title", "title application", "power of attorney", "duplicate title"],
    department: "DMV",
    agent: "Guardian",
    slaMinutes: 480,
    weight: 1.3,
    bankReady: true,
  },
  {
    keywords: ["part", "mopar", "backorder", "oem", "accessory", "catalog", "order part", "fender", "bumper", "headlight", "windshield", "alternator", "sensor", "gasket", "rotor"],
    phrases: ["parts department", "special order", "parts counter", "parts backorder", "core return", "warranty part"],
    department: "Parts",
    agent: "Source",
    slaMinutes: 240,
    weight: 1.1,
    bankReady: false,
  },
  {
    keywords: ["warranty", "recall", "repair", "service", "maintenance", "oil change", "brake", "diagnostic", "check engine", "transmission", "alignment", "tire rotation", "coolant", "exhaust"],
    phrases: ["service advisor", "repair order", "service appointment", "check engine light", "warranty claim", "recall notice", "service contract"],
    department: "Service",
    agent: "Guardian",
    slaMinutes: 360,
    weight: 1.0,
    bankReady: false,
  },
  {
    keywords: ["finance", "loan", "payment", "lease", "credit", "bank", "contract", "cit", "contracts in transit", "stellantis", "paperwork", "approval", "down payment", "interest", "cosigner", "payoff"],
    phrases: ["finance department", "credit application", "bank approval", "contract in transit", "funding package", "deal jacket", "stipulation", "proof of income", "proof of insurance", "bank funded"],
    department: "Finance",
    agent: "Finance",
    slaMinutes: 240,
    weight: 1.4,
    bankReady: true,
  },
  {
    keywords: ["delivery", "transport", "ship", "out of state", "pickup", "drop off", "flatbed", "carrier", "logistics", "auction", "dealer trade"],
    phrases: ["vehicle delivery", "dealer trade", "out of state delivery", "transport company", "shipping quote"],
    department: "Logistics",
    agent: "Logistics",
    slaMinutes: 720,
    weight: 0.9,
    bankReady: false,
  },
  {
    keywords: ["deal", "sale", "trade", "appraisal", "offer", "negotiate", "buyer", "test drive", "prospect", "lead", "gross", "commission", "desk"],
    phrases: ["sales desk", "trade appraisal", "test drive", "pencil deal", "desk deal", "sales manager", "closing deal", "turn over"],
    department: "Sales",
    agent: "Concierge",
    slaMinutes: 120,
    weight: 1.2,
    bankReady: false,
  },
  {
    keywords: ["question", "where is", "status", "update", "complaint", "help", "when", "how long", "eta", "follow up", "callback", "waiting"],
    phrases: ["customer complaint", "status update", "follow up", "call back", "how long", "where is my"],
    department: "Customer_Service",
    agent: "Concierge",
    slaMinutes: 60,
    weight: 0.8,
    bankReady: false,
  },
];

const URGENCY_BOOSTERS: Array<{ pattern: RegExp; priorityBoost: number }> = [
  { pattern: /\b(urgent|asap|emergency|immediately|critical|red alert)\b/i, priorityBoost: 2 },
  { pattern: /\b(rush|expedite|priority|time.?sensitive|hot deal)\b/i, priorityBoost: 1 },
  { pattern: /\b(customer waiting|on the lot|at the desk|deal falling through)\b/i, priorityBoost: 2 },
  { pattern: /\b(stellantis deadline|bank deadline|cit overdue|funding deadline)\b/i, priorityBoost: 2 },
  { pattern: /\b(recall|safety)\b/i, priorityBoost: 1 },
];

const BANK_READY_KEYWORDS = [
  "funded", "bank funded", "contract signed", "deal finalized", "paperwork complete",
  "title received", "registration complete", "lien released", "payoff received",
  "stipulation cleared", "proof submitted", "insurance verified",
];

export interface RoutingResult {
  department: string;
  agent: string;
  slaMinutes: number;
  confidence: number;
  matchedKeywords: string[];
  matchedPhrases: string[];
  urgencyScore: number;
  suggestedPriority: string;
  bankReady: boolean;
  bankReadySignals: string[];
}

export function smartRoute(input: string): RoutingResult {
  const text = input.toLowerCase();
  let bestMatch: RoutingResult | null = null;
  let bestScore = 0;

  for (const rule of ROUTING_RULES) {
    const matchedKw = rule.keywords.filter((kw) => {
      if (kw.includes(" ")) return text.includes(kw);
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return re.test(text);
    });
    const matchedPh = rule.phrases.filter((ph) => text.includes(ph));

    const kwScore = matchedKw.length / rule.keywords.length;
    const phScore = matchedPh.length > 0 ? (matchedPh.length / rule.phrases.length) * 1.5 : 0;
    const rawScore = (kwScore + phScore) * rule.weight;

    if ((matchedKw.length > 0 || matchedPh.length > 0) && rawScore > bestScore) {
      bestScore = rawScore;

      let urgencyScore = 0;
      for (const booster of URGENCY_BOOSTERS) {
        if (booster.pattern.test(text)) {
          urgencyScore += booster.priorityBoost;
        }
      }

      let suggestedPriority: string;
      if (urgencyScore >= 3) suggestedPriority = "Critical";
      else if (urgencyScore >= 2) suggestedPriority = "High";
      else if (urgencyScore >= 1 || rawScore > 0.5) suggestedPriority = "High";
      else suggestedPriority = "Medium";

      const bankReadySignals = BANK_READY_KEYWORDS.filter((bk) => text.includes(bk));
      const isBankReady = rule.bankReady && bankReadySignals.length > 0;

      bestMatch = {
        department: rule.department,
        agent: rule.agent,
        slaMinutes: urgencyScore >= 2 ? Math.floor(rule.slaMinutes * 0.5) : rule.slaMinutes,
        confidence: Math.min((kwScore + phScore) * rule.weight * 1.5, 1),
        matchedKeywords: matchedKw,
        matchedPhrases: matchedPh,
        urgencyScore,
        suggestedPriority,
        bankReady: isBankReady,
        bankReadySignals,
      };
    }
  }

  return bestMatch || {
    department: "General",
    agent: "Concierge",
    slaMinutes: 480,
    confidence: 0,
    matchedKeywords: [],
    matchedPhrases: [],
    urgencyScore: 0,
    suggestedPriority: "Medium",
    bankReady: false,
    bankReadySignals: [],
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

export function extractCustomerName(text: string): string | null {
  const patterns = [
    /(?:customer|client|buyer|name)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /(?:for|re|regarding)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

export function extractPhoneNumber(text: string): string | null {
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

export function checkSlaBreached(slaDueAt: Date | null): { breached: boolean; minutesOverdue: number } {
  if (!slaDueAt) return { breached: false, minutesOverdue: 0 };
  const now = Date.now();
  const due = new Date(slaDueAt).getTime();
  if (now > due) {
    return { breached: true, minutesOverdue: Math.floor((now - due) / 60000) };
  }
  return { breached: false, minutesOverdue: 0 };
}

export function calculateTechFee(taskValue: number): number {
  return Math.round(taskValue * 0.03 * 100) / 100;
}
