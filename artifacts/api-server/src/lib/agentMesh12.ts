/**
 * ONYX Agent Mesh — 12-Agent Registry
 * AUTHOR: Ronald Antonio Cadet | CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-20260328-SOVEREIGN-ORIGIN-LOCKED
 *
 * All 12 agents formally defined. This is additive infrastructure —
 * existing agents.ts, agentOrchestrator.ts, and all routes are untouched.
 */

export type MeshAgentId =
  | "concierge"
  | "deal"
  | "service"
  | "parts"
  | "finance"
  | "insurance"
  | "roadside"
  | "runner"
  | "partner"
  | "payout"
  | "trust"
  | "growth";

export type AgentStatus = "idle" | "active" | "processing" | "standby";
export type AgentDomain = "core" | "automotive" | "financial" | "operations" | "intelligence";

export interface AgentIntegration {
  id: string;
  name: string;
  memberUse: string;
  proUse: string;
  endpoints: string[];
}

export interface MeshAgent {
  id: MeshAgentId;
  name: string;
  tagline: string;
  domain: AgentDomain;
  color: string;
  capabilities: string[];
  integrations: AgentIntegration[];
  routingKeywords: string[];
  handoffTargets: MeshAgentId[];
  apiRoute: string;
  status: AgentStatus;
  actionsToday: number;
  successRate: number;
  isAiPowered: boolean;
  futureReady: string[];
}

export interface MeshAction {
  id: string;
  ts: string;
  agentId: MeshAgentId;
  agentName: string;
  action: string;
  detail: string;
  outcome: "success" | "pending" | "routed";
  userId?: string;
}

// In-memory action log (Trust Agent writes here; persisted to audit_logs in prod)
export const meshActionLog: MeshAction[] = [];

export const MESH_REGISTRY: Record<MeshAgentId, MeshAgent> = {
  concierge: {
    id: "concierge",
    name: "AI Concierge",
    tagline: "Your single point of contact. Handle everything for me.",
    domain: "core",
    color: "#C9A227",
    capabilities: [
      "Intent classification",
      "Agent routing",
      "Member communication",
      "Multi-agent coordination",
      "Request summarization",
    ],
    integrations: [],
    routingKeywords: ["help", "handle", "need", "want", "can you", "what", "how", "i want"],
    handoffTargets: ["deal", "service", "finance", "insurance", "roadside", "runner", "growth"],
    apiRoute: "/api/gemini/chat",
    status: "active",
    actionsToday: 284,
    successRate: 99.1,
    isAiPowered: true,
    futureReady: ["AR/VR interface", "Voice command", "Predictive intent"],
  },

  deal: {
    id: "deal",
    name: "Deal Agent",
    tagline: "Vehicle sourcing, pricing, and negotiation — automated.",
    domain: "automotive",
    color: "#3B82F6",
    capabilities: [
      "Vehicle search & sourcing",
      "MarketCheck price comparison",
      "Trade-in valuation",
      "Negotiation automation",
      "CARS Act 2026 compliance",
    ],
    integrations: [
      {
        id: "marketcheck",
        name: "MarketCheck",
        memberUse: "Instant vehicle valuations and price comparisons across every dealer — know the real price before you negotiate",
        proUse: "Real-time market data, VIN decoding, listing analytics, price trend intelligence for inventory pricing and wholesale sourcing",
        endpoints: ["/api/marketcheck/search", "/api/marketcheck/vin/:vin", "/api/marketcheck/trends"],
      },
      {
        id: "loopit",
        name: "Loopit",
        memberUse: "Subscribe to a car instead of buying — swap vehicles monthly, insurance and maintenance included",
        proUse: "Fleet subscription management, vehicle utilization tracking, recurring revenue model for dealers and fleet operators",
        endpoints: ["/api/fleet/plans", "/api/fleet/inventory", "/api/fleet/subscribe", "/api/fleet/swap"],
      },
    ],
    routingKeywords: ["buy", "vehicle", "car", "price", "deal", "trade", "purchase", "negotiate", "find me a"],
    handoffTargets: ["finance", "partner", "trust"],
    apiRoute: "/api/marketcheck/search",
    status: "active",
    actionsToday: 156,
    successRate: 94.2,
    isAiPowered: true,
    futureReady: ["Predictive pricing", "AI negotiation bots", "VIN blockchain verification"],
  },

  service: {
    id: "service",
    name: "Service Agent",
    tagline: "Diagnostics, repair coordination, and vehicle health.",
    domain: "automotive",
    color: "#F97316",
    capabilities: [
      "OBD-II / DTC code analysis",
      "V2X telemetry monitoring",
      "Repair shop coordination",
      "Predictive maintenance",
      "Digital Vehicle Passport",
    ],
    integrations: [
      {
        id: "motor",
        name: "MOTOR",
        memberUse: "Factory-accurate repair estimates — know exactly what the work should cost before approving it",
        proUse: "OEM repair procedures, labor time guides, VIN-specific service data for accurate quoting and warranty compliance",
        endpoints: ["/api/motor/history/:vin", "/api/motor/market-value/:vin"],
      },
      {
        id: "predii",
        name: "Predii",
        memberUse: "AI reads your check-engine codes and tells you what's wrong, what it costs, and where to go — in plain English",
        proUse: "AI-powered diagnostic analysis, repair prediction, parts matching, and labor estimation trained on millions of automotive records",
        endpoints: ["/api/predii/diagnose", "/api/predii/parts-lookup", "/api/predii/labor-estimate"],
      },
      {
        id: "smartcar",
        name: "Smartcar",
        memberUse: "Connect your car to ONYX — see fuel, mileage, battery, service alerts live without plugging anything in",
        proUse: "Live OBD-free vehicle data for service scheduling, fleet management, and telemetry-driven underwriting",
        endpoints: ["/api/garage/vehicles", "/api/garage/vehicles/:id/telemetry", "/api/garage/connect"],
      },
    ],
    routingKeywords: ["repair", "broken", "check engine", "diagnostic", "maintenance", "service", "fix", "noise", "light"],
    handoffTargets: ["parts", "runner", "partner", "trust"],
    apiRoute: "/api/agents/pipeline",
    status: "active",
    actionsToday: 203,
    successRate: 96.7,
    isAiPowered: true,
    futureReady: ["NVIDIA SDV telemetry", "Digital twin diagnostics", "Predictive failure AI"],
  },

  parts: {
    id: "parts",
    name: "Parts & Custom Agent",
    tagline: "Upgrades, accessories, and custom builds — all certified.",
    domain: "automotive",
    color: "#8B5CF6",
    capabilities: [
      "Wholesale parts sourcing",
      "Aftermarket catalog search",
      "CUXTOMCANDY build visualization",
      "Master technician verification",
      "Global supplier network",
    ],
    integrations: [
      {
        id: "api2cart",
        name: "API2Cart",
        memberUse: "Shop for parts and accessories from the best suppliers — pulled from real inventory across Shopify, WooCommerce, and more",
        proUse: "Unified eCommerce API across 40+ platforms, real-time inventory sync, order management, wholesale pricing aggregation",
        endpoints: ["/api/aftermarket/suppliers", "/api/aftermarket/search", "/api/aftermarket/featured"],
      },
      {
        id: "predii",
        name: "Predii (Parts Lookup)",
        memberUse: "Find the exact part for your vehicle — OEM, aftermarket, or remanufactured — price-compared instantly",
        proUse: "AI-matched parts catalog by VIN, cross-reference OEM to aftermarket part numbers, availability and fitment verification",
        endpoints: ["/api/predii/parts-lookup"],
      },
    ],
    routingKeywords: ["parts", "custom", "upgrade", "wheels", "audio", "wrap", "build", "accessories", "install"],
    handoffTargets: ["service", "partner", "runner", "trust"],
    apiRoute: "/api/aftermarket",
    status: "active",
    actionsToday: 118,
    successRate: 97.4,
    isAiPowered: true,
    futureReady: ["AR customization preview", "3D build configurator", "NVIDIA Omniverse rendering"],
  },

  finance: {
    id: "finance",
    name: "Finance Agent",
    tagline: "Loan matching, approvals, and the 3% Dynasty tech fee.",
    domain: "financial",
    color: "#10B981",
    capabilities: [
      "Loan matching (2,200+ lenders)",
      "Real-time approval simulation",
      "Dynasty split execution",
      "Member Slice dividend logic",
      "3% Global Tech Fee management",
    ],
    integrations: [
      {
        id: "plaid",
        name: "Plaid",
        memberUse: "Instant bank verification for financing — no paperwork, no pay stubs, approved in seconds from the deal desk",
        proUse: "Real-time income verification, bank account linking, fraud reduction, and faster loan decisioning for F&I managers",
        endpoints: ["/api/plaid/link-token", "/api/plaid/accounts", "/api/plaid/transactions", "/api/plaid/identity"],
      },
      {
        id: "spinwheel",
        name: "Spinwheel Connect",
        memberUse: "See all your auto loans and payoff amounts in one place — know your trade-in equity instantly",
        proUse: "Automated payoff quotes, liability verification, negative equity detection for accurate deal structuring",
        endpoints: ["/api/spinwheel/connect", "/api/spinwheel/payoff/:id", "/api/spinwheel/trade-equity"],
      },
      {
        id: "insuremo",
        name: "InsureMO",
        memberUse: "Compare insurance quotes from multiple carriers instantly — bundled into your vehicle purchase or standalone",
        proUse: "Multi-carrier product distribution, embedded insurance at point of sale, revenue-sharing model for F&I departments",
        endpoints: ["/api/insuremo/quote", "/api/insuremo/policies"],
      },
    ],
    routingKeywords: ["loan", "finance", "payment", "credit", "approve", "monthly", "down payment", "rate", "fund"],
    handoffTargets: ["payout", "trust", "partner"],
    apiRoute: "/api/finance",
    status: "active",
    actionsToday: 89,
    successRate: 91.3,
    isAiPowered: true,
    futureReady: ["DeFi integration", "Crypto collateral", "Plaid open banking"],
  },

  insurance: {
    id: "insurance",
    name: "Insurance Agent",
    tagline: "Quote matching, optimization, and coverage activation.",
    domain: "financial",
    color: "#06B6D4",
    capabilities: [
      "Multi-carrier quote comparison",
      "Coverage optimization",
      "Insuremo API integration",
      "Policy activation",
      "Claims routing",
    ],
    integrations: [
      {
        id: "insuremo",
        name: "InsureMO",
        memberUse: "Compare insurance quotes, activate coverage, and file claims — all from one screen, no phone calls",
        proUse: "Multi-carrier product distribution, embedded insurance at point of sale, policy lifecycle management",
        endpoints: ["/api/insuremo/quote", "/api/insuremo/policies"],
      },
    ],
    routingKeywords: ["insurance", "coverage", "policy", "quote", "claim", "protect", "liability", "collision"],
    handoffTargets: ["trust", "partner", "payout"],
    apiRoute: "/api/insuremo",
    status: "active",
    actionsToday: 74,
    successRate: 93.8,
    isAiPowered: true,
    futureReady: ["Telematics-based pricing", "Real-time risk scoring", "Embedded insurance"],
  },

  roadside: {
    id: "roadside",
    name: "Roadside Agent",
    tagline: "Emergency dispatch and real-time roadside coordination.",
    domain: "operations",
    color: "#EF4444",
    capabilities: [
      "Emergency SOS dispatch",
      "Tow truck coordination",
      "Jump start / tire service",
      "Real-time GPS tracking",
      "I-95 corridor optimization",
    ],
    integrations: [
      {
        id: "honk",
        name: "HONK",
        memberUse: "Flat tire, dead battery, locked out? One tap and help is on the way — tracked live on your map",
        proUse: "Nationwide roadside dispatch network, real-time ETA tracking, automated service completion verification for fleet operators",
        endpoints: ["/api/roadside/request", "/api/roadside/request/:id", "/api/roadside/providers"],
      },
      {
        id: "rocksolid",
        name: "Basemark Rocksolid AR",
        memberUse: "AR lane departure warnings, collision alerts, and night vision on your HUD — safety you can see while driving",
        proUse: "In-vehicle AR rendering SDK for ADAS visualization, AR navigation, multi-display cockpit, and driver safety scoring",
        endpoints: ["/api/ar/status", "/api/ar/session/start", "/api/ar/adas/alerts", "/api/ar/navigation/overlay", "/api/ar/vehicle/:id/safety-score"],
      },
      {
        id: "mapbox",
        name: "Mapbox",
        memberUse: "Live map showing the tow truck or service vehicle coming to you — real-time ETA and route",
        proUse: "Geocoding for dispatch routing, nearest-provider search, optimized routing for roadside service fleets",
        endpoints: ["/api/maps/geocode", "/api/maps/directions", "/api/maps/nearby"],
      },
    ],
    routingKeywords: ["stuck", "tow", "flat tire", "battery", "emergency", "stranded", "help", "accident", "roadside"],
    handoffTargets: ["runner", "partner", "service", "trust"],
    apiRoute: "/api/roadside",
    status: "standby",
    actionsToday: 31,
    successRate: 98.9,
    isAiPowered: true,
    futureReady: ["Drone dispatch", "Autonomous tow routing", "V2X crash detection"],
  },

  runner: {
    id: "runner",
    name: "Runner Agent",
    tagline: "Assigns real-world tasks: pickup, delivery, DMV, and more.",
    domain: "operations",
    color: "#F59E0B",
    capabilities: [
      "Task assignment to verified runners",
      "HyperTrack GPS coordination",
      "Pickup & delivery scheduling",
      "DMV and title work dispatch",
      "Performance scoring",
    ],
    integrations: [
      {
        id: "mapbox",
        name: "Mapbox",
        memberUse: "Track your vehicle delivery or runner pickup live on a map — see exactly where they are and when they arrive",
        proUse: "Route optimization for runner dispatch, distance/time estimation, delivery zone isochrone analysis",
        endpoints: ["/api/maps/directions", "/api/maps/transport-track/:id", "/api/maps/geocode"],
      },
      {
        id: "cartrawler",
        name: "CarTrawler",
        memberUse: "Need a car while yours is in the shop? Instantly compare rentals from Enterprise, Hertz, Avis and 30+ others",
        proUse: "Multi-provider rental aggregation, affiliate revenue, white-label rental marketplace for dealership service lounges",
        endpoints: ["/api/rentals/search", "/api/rentals/providers", "/api/rentals/book"],
      },
      {
        id: "docusign",
        name: "DocuSign",
        memberUse: "Sign delivery receipts and title transfer docs right from your phone — runner brings the car, you tap to confirm",
        proUse: "Digital delivery receipt and chain-of-custody signatures, title transfer authorization, power of attorney for DMV runs",
        endpoints: ["/api/docusign/envelope", "/api/docusign/envelope/:id"],
      },
    ],
    routingKeywords: ["pickup", "deliver", "dmv", "title", "drop off", "fetch", "transport", "runner", "send someone"],
    handoffTargets: ["partner", "payout", "trust"],
    apiRoute: "/api/runner",
    status: "active",
    actionsToday: 167,
    successRate: 95.1,
    isAiPowered: false,
    futureReady: ["Drone delivery", "Autonomous vehicle routing", "Verified node mesh"],
  },

  partner: {
    id: "partner",
    name: "Partner Agent",
    tagline: "Routes jobs to the best vendors based on performance.",
    domain: "operations",
    color: "#A78BFA",
    capabilities: [
      "Vendor performance ranking",
      "Job-to-vendor matching",
      "Real-time capacity checking",
      "SLA enforcement",
      "Partner onboarding pipeline",
    ],
    integrations: [
      {
        id: "mapbox",
        name: "Mapbox",
        memberUse: "Find the nearest 3C Certified service center, body shop, or detailing studio — with distance and directions",
        proUse: "Location-based vendor discovery, service area mapping, capacity planning with geographic coverage analysis",
        endpoints: ["/api/maps/nearby", "/api/maps/geocode"],
      },
    ],
    routingKeywords: ["vendor", "shop", "mechanic", "dealer", "partner", "service provider", "who does"],
    handoffTargets: ["payout", "trust", "runner"],
    apiRoute: "/api/specialists",
    status: "active",
    actionsToday: 94,
    successRate: 92.6,
    isAiPowered: true,
    futureReady: ["AI vendor scoring", "Predictive capacity planning", "Global partner network"],
  },

  payout: {
    id: "payout",
    name: "Payout Agent",
    tagline: "Tracks commissions, referrals, and every dollar owed.",
    domain: "financial",
    color: "#34D399",
    capabilities: [
      "Commission calculation",
      "Referral tracking (K-Factor)",
      "Creator payout processing",
      "Dynasty split execution",
      "Stripe Connect disbursement",
    ],
    integrations: [
      {
        id: "stripe",
        name: "Stripe",
        memberUse: "Apple Pay, Google Pay, or card — one tap to pay for anything, and every referral commission lands in your wallet automatically",
        proUse: "Payment processing, Stripe Connect marketplace payouts, commission splits, subscription billing for recurring services",
        endpoints: ["/api/checkout/session", "/api/checkout/verify", "/api/wallet/balance"],
      },
    ],
    routingKeywords: ["commission", "payout", "referral", "earnings", "owe", "pay me", "my money", "balance"],
    handoffTargets: ["trust", "finance"],
    apiRoute: "/api/wallet",
    status: "active",
    actionsToday: 52,
    successRate: 99.7,
    isAiPowered: false,
    futureReady: ["Real-time settlement", "Multi-currency payout", "DeFi yield on balances"],
  },

  trust: {
    id: "trust",
    name: "Trust Agent",
    tagline: "Logs every action. Ensures full transparency. Nothing hidden.",
    domain: "intelligence",
    color: "#60A5FA",
    capabilities: [
      "Immutable audit trail",
      "NIST 800-53 compliance",
      "Chain of custody tracking",
      "Forensic watermarking",
      "FBI/DOT oversight reporting",
    ],
    integrations: [
      {
        id: "docusign",
        name: "DocuSign",
        memberUse: "Every signed document is logged and verifiable — your purchase, title, and warranty contracts are always accessible",
        proUse: "Audit-ready document trail, compliance-grade e-signatures, automatic document retention for regulatory requirements",
        endpoints: ["/api/docusign/envelope/:id", "/api/docusign/deal/:dealId/envelopes"],
      },
    ],
    routingKeywords: ["audit", "log", "history", "proof", "verify", "compliance", "record", "trace"],
    handoffTargets: [],
    apiRoute: "/api/audit",
    status: "active",
    actionsToday: 1847,
    successRate: 100,
    isAiPowered: false,
    futureReady: ["Blockchain immutability", "FIPS 140-3 encryption", "Zero-knowledge proofs"],
  },

  growth: {
    id: "growth",
    name: "Growth Agent",
    tagline: "Referrals, affiliate tracking, and network expansion.",
    domain: "intelligence",
    color: "#FB7185",
    capabilities: [
      "K-Factor referral engine",
      "Creator affiliate tracking",
      "Network expansion modeling",
      "B2B2C institutional pipeline",
      "WhatsApp viral distribution",
    ],
    integrations: [
      {
        id: "stripe",
        name: "Stripe",
        memberUse: "Every referral you make earns a commission — tracked automatically and paid out to your wallet",
        proUse: "Affiliate program management, tiered commission automation, Stripe Connect payouts for referral networks",
        endpoints: ["/api/checkout/session", "/api/wallet/balance"],
      },
    ],
    routingKeywords: ["refer", "invite", "share", "grow", "affiliate", "commission", "network", "spread"],
    handoffTargets: ["payout", "trust", "concierge"],
    apiRoute: "/api/growth",
    status: "active",
    actionsToday: 723,
    successRate: 96.3,
    isAiPowered: true,
    futureReady: ["Predictive K-Factor modeling", "Global expansion AI", "Creator network intelligence"],
  },
};

// ── Routing Logic ──────────────────────────────────────────────────────────

export interface RoutingResult {
  agentId: MeshAgentId;
  confidence: number;
  matchedKeywords: string[];
  requiresEscalation: boolean;
  guardrailTriggered: boolean;
}

const FINANCIAL_GUARDRAIL_KEYWORDS = [
  "transfer", "wire", "send money", "withdraw", "payout", "pay me",
  "refund", "loan", "approve", "finance", "credit", "down payment",
];

const HIGH_VALUE_THRESHOLD = 10000;

export function routeToAgent(userMessage: string): MeshAgentId {
  const result = routeToAgentWithConfidence(userMessage);
  return result.agentId;
}

export function routeToAgentWithConfidence(userMessage: string): RoutingResult {
  const msg = userMessage.toLowerCase();
  const scores: { id: MeshAgentId; hits: string[]; weight: number }[] = [];

  for (const [id, agent] of Object.entries(MESH_REGISTRY)) {
    const hits: string[] = [];
    let weight = 0;

    for (const keyword of agent.routingKeywords) {
      if (msg.includes(keyword)) {
        hits.push(keyword);
        weight += keyword.split(" ").length;
      }
    }

    if (hits.length > 0) {
      scores.push({ id: id as MeshAgentId, hits, weight });
    }
  }

  if (scores.length === 0) {
    return {
      agentId: "concierge",
      confidence: 50,
      matchedKeywords: [],
      requiresEscalation: false,
      guardrailTriggered: false,
    };
  }

  scores.sort((a, b) => b.weight - a.weight || b.hits.length - a.hits.length);
  const best = scores[0];

  const maxPossibleKeywords = MESH_REGISTRY[best.id].routingKeywords.length;
  const rawConfidence = Math.min(100, Math.round((best.hits.length / Math.max(maxPossibleKeywords, 1)) * 100) + (best.weight * 8));
  const confidence = Math.min(100, Math.max(30, rawConfidence));

  const isFinancial = FINANCIAL_GUARDRAIL_KEYWORDS.some((k) => msg.includes(k));
  const mentionsMoney = /\$[\d,]+/.test(msg);
  const highValue = mentionsMoney && parseFloat(msg.replace(/[^0-9.]/g, "")) > HIGH_VALUE_THRESHOLD;

  const guardrailTriggered = isFinancial && confidence < 90;
  const requiresEscalation = confidence < 70 || highValue || guardrailTriggered;

  return {
    agentId: best.id,
    confidence,
    matchedKeywords: best.hits,
    requiresEscalation,
    guardrailTriggered,
  };
}

// ── Action Logging (Trust Agent) ───────────────────────────────────────────

export function logMeshAction(
  agentId: MeshAgentId,
  action: string,
  detail: string,
  outcome: MeshAction["outcome"] = "success",
  userId?: string
): void {
  const entry: MeshAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    agentId,
    agentName: MESH_REGISTRY[agentId].name,
    action,
    detail,
    outcome,
    userId,
  };

  meshActionLog.unshift(entry);

  // Cap at 500 entries in memory
  if (meshActionLog.length > 500) {
    meshActionLog.splice(500);
  }
}

// ── Mesh Status Summary ────────────────────────────────────────────────────

export function getMeshStatus() {
  const agents = Object.values(MESH_REGISTRY);
  const activeCount = agents.filter((a) => a.status === "active").length;
  const totalActions = agents.reduce((sum, a) => sum + a.actionsToday, 0);
  const avgSuccess = agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length;

  return {
    totalAgents: agents.length,
    activeAgents: activeCount,
    totalActionsToday: totalActions,
    avgSuccessRate: Math.round(avgSuccess * 10) / 10,
    recentActions: meshActionLog.slice(0, 20),
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      tagline: a.tagline,
      domain: a.domain,
      color: a.color,
      status: a.status,
      actionsToday: a.actionsToday,
      successRate: a.successRate,
      isAiPowered: a.isAiPowered,
      capabilities: a.capabilities,
      integrations: a.integrations,
      handoffTargets: a.handoffTargets,
      futureReady: a.futureReady,
    })),
  };
}
