import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

interface IntegrationEntry {
  id: string;
  name: string;
  category: string;
  ownerAgent: string;
  memberBenefit: string;
  industryBenefit: string;
  envKeys: string[];
  live: boolean;
  endpoints: string[];
}

function checkLive(keys: string[]): boolean {
  return keys.every(k => !!process.env[k]);
}

function getRegistry(): IntegrationEntry[] {
  return [
    {
      id: "smartcar",
      name: "Smartcar",
      category: "Vehicle Telemetry",
      ownerAgent: "Guardian Agent",
      memberBenefit: "Connect your car to ONYX — see fuel, mileage, battery, service alerts in real time without plugging anything in",
      industryBenefit: "Live OBD-free vehicle data for service scheduling, fleet management, and telemetry-driven underwriting",
      envKeys: ["SMARTCAR_CLIENT_ID", "SMARTCAR_CLIENT_SECRET"],
      live: checkLive(["SMARTCAR_CLIENT_ID", "SMARTCAR_CLIENT_SECRET"]),
      endpoints: ["/api/garage/vehicles", "/api/garage/vehicles/:id/telemetry", "/api/garage/connect"],
    },
    {
      id: "marketcheck",
      name: "MarketCheck",
      category: "Market Intelligence",
      ownerAgent: "MarketCheck Agent",
      memberBenefit: "Instant vehicle valuations, price comparisons across every dealer in your area — know the real price before you negotiate",
      industryBenefit: "Real-time market data, VIN decoding, listing analytics, price trend intelligence for dealer inventory pricing",
      envKeys: ["MARKETCHECK_API_KEY"],
      live: checkLive(["MARKETCHECK_API_KEY"]),
      endpoints: ["/api/marketcheck/search", "/api/marketcheck/vin/:vin", "/api/marketcheck/trends"],
    },
    {
      id: "plaid",
      name: "Plaid",
      category: "Financial Verification",
      ownerAgent: "F&I Agent",
      memberBenefit: "Instant bank verification for financing — no paperwork, no pay stubs, approved in seconds from the deal desk",
      industryBenefit: "Real-time income verification, bank account linking, fraud reduction, and faster loan decisioning",
      envKeys: ["PLAID_CLIENT_ID", "PLAID_SECRET"],
      live: checkLive(["PLAID_CLIENT_ID", "PLAID_SECRET"]),
      endpoints: ["/api/plaid/link-token", "/api/plaid/accounts", "/api/plaid/transactions", "/api/plaid/identity"],
    },
    {
      id: "spinwheel",
      name: "Spinwheel Connect",
      category: "Liability Verification",
      ownerAgent: "F&I Agent",
      memberBenefit: "See all your auto loans and payoff amounts in one place — know your trade-in equity instantly",
      industryBenefit: "Automated payoff quotes, liability verification, negative equity detection for accurate deal structuring",
      envKeys: ["SPINWHEEL_API_KEY"],
      live: checkLive(["SPINWHEEL_API_KEY"]),
      endpoints: ["/api/spinwheel/connect", "/api/spinwheel/payoff/:id", "/api/spinwheel/trade-equity"],
    },
    {
      id: "docusign",
      name: "DocuSign",
      category: "Digital Contracts",
      ownerAgent: "Title/Compliance Agent",
      memberBenefit: "Sign your purchase agreement, title transfer, and insurance from your phone — no dealership visit needed",
      industryBenefit: "Fully digital contract execution, e-title transfers, audit-ready document trails, compliance automation",
      envKeys: ["DOCUSIGN_ACCOUNT_ID", "DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_ACCESS_TOKEN"],
      live: checkLive(["DOCUSIGN_ACCOUNT_ID", "DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_ACCESS_TOKEN"]),
      endpoints: ["/api/docusign/envelope", "/api/docusign/templates", "/api/docusign/deal/:dealId/envelopes"],
    },
    {
      id: "insuremo",
      name: "InsureMO",
      category: "Insurance Marketplace",
      ownerAgent: "F&I Agent",
      memberBenefit: "Compare insurance quotes from multiple carriers instantly — bundled into your vehicle purchase or standalone",
      industryBenefit: "Multi-carrier product distribution, embedded insurance at point of sale, revenue-sharing model",
      envKeys: ["INSUREMO_API_KEY"],
      live: checkLive(["INSUREMO_API_KEY"]),
      endpoints: ["/api/insuremo/quote", "/api/insuremo/policies"],
    },
    {
      id: "motor",
      name: "MOTOR",
      category: "Repair Intelligence",
      ownerAgent: "Service/Parts Agent",
      memberBenefit: "Factory-accurate repair estimates — know exactly what the work should cost before approving it",
      industryBenefit: "OEM repair procedures, labor time guides, parts catalogs, VIN-specific service data for accurate quoting",
      envKeys: ["MOTOR_API_KEY"],
      live: checkLive(["MOTOR_API_KEY"]),
      endpoints: ["/api/motor/history/:vin", "/api/motor/market-value/:vin"],
    },
    {
      id: "predii",
      name: "Predii",
      category: "Automotive AI",
      ownerAgent: "Service/Parts Agent",
      memberBenefit: "AI that reads your check-engine codes and tells you exactly what's wrong, what it costs, and where to go — in plain English",
      industryBenefit: "AI-powered diagnostic analysis, repair prediction, parts matching, and labor estimation trained on automotive data",
      envKeys: ["PREDII_API_KEY"],
      live: checkLive(["PREDII_API_KEY"]),
      endpoints: ["/api/predii/diagnose", "/api/predii/parts-lookup", "/api/predii/labor-estimate"],
    },
    {
      id: "honk",
      name: "HONK",
      category: "Roadside Assistance",
      ownerAgent: "Guardian Agent",
      memberBenefit: "Flat tire, dead battery, locked out? One tap and help is on the way — tracked live on your map",
      industryBenefit: "Nationwide roadside dispatch network, real-time ETA tracking, automated service completion verification",
      envKeys: ["HONK_API_KEY"],
      live: checkLive(["HONK_API_KEY"]),
      endpoints: ["/api/roadside/request", "/api/roadside/request/:id", "/api/roadside/providers"],
    },
    {
      id: "mapbox",
      name: "Mapbox",
      category: "Maps & Navigation",
      ownerAgent: "Transporter Agent",
      memberBenefit: "Live transport tracking, nearest service center locator, and turn-by-turn navigation to your delivery",
      industryBenefit: "Geocoding, routing optimization, isochrone analysis, fleet tracking, and location-based service discovery",
      envKeys: ["MAPBOX_ACCESS_TOKEN"],
      live: checkLive(["MAPBOX_ACCESS_TOKEN"]),
      endpoints: ["/api/maps/geocode", "/api/maps/directions", "/api/maps/nearby", "/api/maps/transport-track/:id"],
    },
    {
      id: "cartrawler",
      name: "CarTrawler",
      category: "Rental Aggregation",
      ownerAgent: "Transporter Agent",
      memberBenefit: "Need a car while yours is in the shop? Instantly compare rentals from Enterprise, Hertz, Avis and 30+ others",
      industryBenefit: "Multi-provider rental aggregation, affiliate revenue, white-label rental marketplace",
      envKeys: ["CARCRAWLER_API_KEY"],
      live: checkLive(["CARCRAWLER_API_KEY"]),
      endpoints: ["/api/rentals/search", "/api/rentals/providers", "/api/rentals/book"],
    },
    {
      id: "loopit",
      name: "Loopit",
      category: "Vehicle Subscriptions",
      ownerAgent: "Broker AI Deal Desk",
      memberBenefit: "Subscribe to a car instead of buying — swap vehicles monthly, insurance and maintenance included",
      industryBenefit: "Fleet subscription management, vehicle utilization tracking, recurring revenue model for dealers",
      envKeys: ["LOOPIT_API_KEY"],
      live: checkLive(["LOOPIT_API_KEY"]),
      endpoints: ["/api/fleet/plans", "/api/fleet/inventory", "/api/fleet/subscribe", "/api/fleet/swap"],
    },
    {
      id: "api2cart",
      name: "API2Cart",
      category: "eCommerce Bridge",
      ownerAgent: "Service/Parts Agent",
      memberBenefit: "Shop for parts and accessories from the best suppliers — pulled from real inventory across Shopify, WooCommerce, and more",
      industryBenefit: "Unified eCommerce API across 40+ shopping cart platforms, real-time inventory sync, order management",
      envKeys: ["API2CART_API_KEY"],
      live: checkLive(["API2CART_API_KEY"]),
      endpoints: ["/api/aftermarket/suppliers", "/api/aftermarket/search", "/api/aftermarket/featured"],
    },
    {
      id: "rocksolid",
      name: "Basemark Rocksolid AR",
      category: "AR Safety & HUD",
      ownerAgent: "Guardian Agent",
      memberBenefit: "AR lane departure warnings, collision alerts, and night vision on your windshield HUD — safety you can see",
      industryBenefit: "In-vehicle AR rendering SDK for ADAS visualization, AR navigation, multi-display cockpit experiences",
      envKeys: ["ROCKSOLID_API_KEY"],
      live: checkLive(["ROCKSOLID_API_KEY"]),
      endpoints: ["/api/ar/status", "/api/ar/session/start", "/api/ar/adas/alerts", "/api/ar/navigation/overlay", "/api/ar/vehicle/:id/safety-score"],
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "Payments & Commerce",
      ownerAgent: "Stripe Agent",
      memberBenefit: "Apple Pay, Google Pay, or card — one tap to pay for anything on the platform",
      industryBenefit: "Payment processing, Stripe Connect for marketplace payouts, subscription billing, commission splits",
      envKeys: ["STRIPE_SECRET_KEY"],
      live: checkLive(["STRIPE_SECRET_KEY"]),
      endpoints: ["/api/checkout/session", "/api/checkout/verify", "/api/wallet/balance"],
    },
  ];
}

router.get("/integrations/status", (_req: Request, res: Response) => {
  const registry = getRegistry();
  const liveCount = registry.filter(r => r.live).length;
  const categories = [...new Set(registry.map(r => r.category))];

  res.json({
    platform: "3C ONYX — Sovereign Automotive Ecosystem OS",
    totalIntegrations: registry.length,
    liveIntegrations: liveCount,
    pendingApiKeys: registry.length - liveCount,
    categories,
    integrations: registry.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      ownerAgent: r.ownerAgent,
      live: r.live,
      memberBenefit: r.memberBenefit,
      industryBenefit: r.industryBenefit,
      endpointCount: r.endpoints.length,
    })),
  });
});

router.get("/integrations/detail/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const registry = getRegistry();
  const entry = registry.find(r => r.id === id);
  if (!entry) {
    res.status(404).json({ error: `Integration '${id}' not found`, available: registry.map(r => r.id) });
    return;
  }
  res.json(entry);
});

router.get("/integrations/by-agent/:agentName", (req: Request, res: Response) => {
  const { agentName } = req.params;
  const registry = getRegistry();
  const name = String(agentName);
  const matches = registry.filter(r => r.ownerAgent.toLowerCase().includes(name.toLowerCase()));
  res.json({ agent: agentName, integrations: matches });
});

export default router;
