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

const EXTERNAL_SIGNALS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(bank|lender|credit union|ally|cap one|chase auto|wells fargo|td auto)\b/i, reason: "Waiting on lender/bank" },
  { pattern: /\b(insurance|binder|policy|geico|progressive|state farm|allstate|usaa)\b/i, reason: "Waiting on insurance provider" },
  { pattern: /\b(vendor|supplier|aftermarket|outside shop|sublet|rim repair|glass repair|paintless dent|pdr|tint|upholstery)\b/i, reason: "Waiting on external vendor" },
  { pattern: /\b(transport|carrier|flatbed|ship.*out of state|dealer trade|auction)\b/i, reason: "Waiting on transport/logistics" },
  { pattern: /\b(dmv office|state dmv|county clerk|mvd|secretary of state)\b/i, reason: "Waiting on government agency" },
  { pattern: /\b(warranty company|extended warranty|service contract provider|mopar warranty)\b/i, reason: "Waiting on warranty provider" },
  { pattern: /\b(body shop|collision center|outside repair)\b/i, reason: "Waiting on body shop" },
];

export function detectTaskScope(input: string): { scope: "Internal" | "External"; externalParty: string | null; externalReason: string | null } {
  const text = input.toLowerCase();
  for (const signal of EXTERNAL_SIGNALS) {
    if (signal.pattern.test(text)) {
      const match = text.match(signal.pattern);
      return { scope: "External", externalParty: match?.[0] || null, externalReason: signal.reason };
    }
  }
  return { scope: "Internal", externalParty: null, externalReason: null };
}

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
  taskScope: "Internal" | "External";
  externalParty: string | null;
  externalReason: string | null;
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

      const scopeResult = detectTaskScope(input);

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
        taskScope: scopeResult.scope,
        externalParty: scopeResult.externalParty,
        externalReason: scopeResult.externalReason,
      };
    }
  }

  if (bestMatch) return bestMatch;

  const fallbackScope = detectTaskScope(input);
  return {
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
    taskScope: fallbackScope.scope,
    externalParty: fallbackScope.externalParty,
    externalReason: fallbackScope.externalReason,
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

const NEXT_STEP_MAP: Record<string, { nextDept: string; action: string; reason: string }[]> = {
  Service: [
    { nextDept: "Parts", action: "Route to Parts", reason: "Order replacement parts for repair" },
    { nextDept: "Finance", action: "Send to Finance", reason: "Process repair cost approval or warranty claim" },
    { nextDept: "Customer_Service", action: "Update Customer", reason: "Notify customer of repair status" },
  ],
  Parts: [
    { nextDept: "Service", action: "Return to Service", reason: "Parts received — ready for installation" },
    { nextDept: "Customer_Service", action: "Notify Customer", reason: "Inform customer parts are available" },
  ],
  Sales: [
    { nextDept: "Finance", action: "Send to Finance", reason: "Process deal paperwork and credit application" },
    { nextDept: "DMV", action: "Route to DMV", reason: "Begin title and registration process" },
    { nextDept: "Service", action: "Request Inspection", reason: "Pre-delivery inspection or reconditioning" },
  ],
  Finance: [
    { nextDept: "DMV", action: "Route to DMV", reason: "Title work and registration after funding" },
    { nextDept: "Logistics", action: "Schedule Delivery", reason: "Arrange vehicle delivery to customer" },
    { nextDept: "Sales", action: "Return to Sales", reason: "Deal structure needs revision" },
  ],
  DMV: [
    { nextDept: "Finance", action: "Send to Finance", reason: "Title received — ready for bank funding" },
    { nextDept: "Logistics", action: "Schedule Delivery", reason: "Registration complete — arrange delivery" },
    { nextDept: "Customer_Service", action: "Notify Customer", reason: "Plates/registration ready for pickup" },
  ],
  Logistics: [
    { nextDept: "Sales", action: "Confirm with Sales", reason: "Vehicle delivered — confirm handoff" },
    { nextDept: "Customer_Service", action: "Notify Customer", reason: "Delivery scheduled or completed" },
  ],
  Customer_Service: [
    { nextDept: "Service", action: "Escalate to Service", reason: "Customer issue requires service attention" },
    { nextDept: "Sales", action: "Escalate to Sales", reason: "Customer inquiry about a deal" },
    { nextDept: "Finance", action: "Escalate to Finance", reason: "Customer question about payments or contract" },
  ],
  General: [
    { nextDept: "Service", action: "Route to Service", reason: "Appears to be a service-related task" },
    { nextDept: "Sales", action: "Route to Sales", reason: "Appears to be a sales-related task" },
    { nextDept: "DMV", action: "Route to DMV", reason: "Appears to need title/registration work" },
  ],
};

export interface NextStepSuggestion {
  nextDept: string;
  action: string;
  reason: string;
  confidence: string;
}

export function suggestNextStep(department: string, status: string, metadata?: Record<string, any>): NextStepSuggestion[] {
  if (status === "Completed" || status === "Cancelled") return [];

  const steps = NEXT_STEP_MAP[department] || NEXT_STEP_MAP.General;
  const suggestions: NextStepSuggestion[] = [];

  for (const step of steps) {
    let confidence = "medium";

    if (metadata?.bankReady && step.nextDept === "Finance") confidence = "high";
    if (metadata?.bankReady && step.nextDept === "DMV") confidence = "high";
    if (department === "Service" && step.nextDept === "Parts") confidence = "high";
    if (department === "Sales" && step.nextDept === "Finance") confidence = "high";
    if (department === "Finance" && step.nextDept === "DMV") confidence = "high";
    if (department === "Parts" && step.nextDept === "Service") confidence = "high";

    if (metadata?.departmentHistory?.some((h: any) => h.from === step.nextDept)) {
      confidence = "low";
    }

    suggestions.push({ ...step, confidence });
  }

  return suggestions.sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.confidence] ?? 1) - (order[b.confidence] ?? 1);
  });
}
