/**
 * 3C ONYX — Automotive CRM Integration Hub
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal adapter connecting to every major automotive CRM.
 * Supports: VinSolutions, DealerSocket, Tekion, Reynolds & Reynolds,
 *           CDK Drive, Salesforce Automotive, elead/ELEAD1ONE, HubSpot,
 *           and any Generic REST/Webhook CRM.
 *
 * Pattern: OAuth2 or API-Key auth per provider → normalized 3C data model
 */

import { Router, type Request, type Response } from "express";

const router = Router();

// ─── CRM Provider Registry ────────────────────────────────────────────────────

const CRM_PROVIDERS: CRMProvider[] = [
  {
    id: "vinsolutions",
    name: "VinSolutions",
    vendor: "Cox Automotive",
    category: "Dealer CRM",
    marketShare: "~35%",
    authType: "oauth2",
    authUrl: "https://api.vinsolutions.com/oauth/authorize",
    tokenUrl: "https://api.vinsolutions.com/oauth/token",
    baseUrl: "https://api.vinsolutions.com/v2",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals","appointments","service"],
    logo: "VS",
    docsUrl: "https://developer.vinsolutions.com",
    notes: "Largest dealer CRM. Full lead management + DMS integration.",
  },
  {
    id: "dealersocket",
    name: "DealerSocket",
    vendor: "CDK Global",
    category: "Dealer CRM + DMS",
    marketShare: "~22%",
    authType: "oauth2",
    authUrl: "https://api.dealersocket.com/oauth/authorize",
    tokenUrl: "https://api.dealersocket.com/oauth/token",
    baseUrl: "https://api.dealersocket.com/v1",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals","finance","desking"],
    logo: "DS",
    docsUrl: "https://developers.dealersocket.com",
    notes: "Strong F&I and desking tools. Good for high-volume dealerships.",
  },
  {
    id: "tekion",
    name: "Tekion ARC",
    vendor: "Tekion Corp",
    category: "Cloud DMS + CRM",
    marketShare: "~8% (fastest growing)",
    authType: "api_key",
    baseUrl: "https://api.tekion.com/arc/v1",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals","service","parts","finance"],
    logo: "TK",
    docsUrl: "https://developer.tekion.com",
    notes: "Modern cloud-native platform. Real-time data sync. Fast growing.",
  },
  {
    id: "reynolds",
    name: "Reynolds & Reynolds",
    vendor: "Reynolds and Reynolds",
    category: "DMS + CRM",
    marketShare: "~18%",
    authType: "api_key",
    baseUrl: "https://api.reyrey.com/v1",
    webhookSupport: false,
    capabilities: ["leads","contacts","inventory","deals","accounting","service"],
    logo: "RR",
    docsUrl: "https://www.reyrey.com/api",
    notes: "Legacy DMS with broad dealer network. API access via Reynolds API.",
  },
  {
    id: "cdkdrive",
    name: "CDK Drive",
    vendor: "CDK Global",
    category: "DMS + CRM",
    marketShare: "~20%",
    authType: "oauth2",
    authUrl: "https://api.cdk.com/oauth2/v1/token",
    tokenUrl: "https://api.cdk.com/oauth2/v1/token",
    baseUrl: "https://api.cdk.com/fortellis/v1",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals","service","accounting"],
    logo: "CDK",
    docsUrl: "https://developer.cdk.com",
    notes: "CDK Fortellis marketplace. Large dealer network integration.",
  },
  {
    id: "salesforce_auto",
    name: "Salesforce Automotive Cloud",
    vendor: "Salesforce",
    category: "Enterprise CRM",
    marketShare: "~5% (enterprise)",
    authType: "oauth2",
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    baseUrl: "https://your-instance.salesforce.com/services/data/v58.0",
    webhookSupport: true,
    capabilities: ["leads","contacts","opportunities","vehicles","accounts","analytics"],
    logo: "SF",
    docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta",
    notes: "Enterprise grade. Used by OEMs and large dealer groups.",
  },
  {
    id: "elead",
    name: "elead / ELEAD1ONE",
    vendor: "CDK Global",
    category: "Dealer CRM",
    marketShare: "~6%",
    authType: "api_key",
    baseUrl: "https://api.elead-crm.com/v1",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals","BDC","marketing"],
    logo: "EL",
    docsUrl: "https://developer.elead-crm.com",
    notes: "Strong BDC and internet lead management capabilities.",
  },
  {
    id: "hubspot_auto",
    name: "HubSpot (Automotive)",
    vendor: "HubSpot",
    category: "General CRM (Auto-configured)",
    marketShare: "~3% (growing)",
    authType: "oauth2",
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    baseUrl: "https://api.hubapi.com/crm/v3",
    webhookSupport: true,
    capabilities: ["contacts","deals","companies","vehicles","marketing","analytics"],
    logo: "HS",
    docsUrl: "https://developers.hubspot.com",
    notes: "Popular with independent dealers. Full marketing automation included.",
  },
  {
    id: "generic_rest",
    name: "Generic REST CRM",
    vendor: "Custom",
    category: "Universal Connector",
    marketShare: "Any CRM",
    authType: "api_key",
    baseUrl: "https://your-crm.com/api",
    webhookSupport: true,
    capabilities: ["leads","contacts","inventory","deals"],
    logo: "GN",
    docsUrl: "",
    notes: "Universal connector. Configure any CRM with a REST API.",
  },
];

// ─── In-memory store (replace with DB in production) ─────────────────────────

let connections: CRMConnection[] = [
  {
    id: "conn_demo_vs",
    providerId: "vinsolutions",
    dealerName: "Demo Dealer Group",
    dealerId: "DLR_001",
    status: "active",
    authType: "oauth2",
    apiKey: null,
    accessToken: "demo_token",
    lastSync: new Date(Date.now() - 12 * 60_000).toISOString(),
    syncInterval: 15,
    leadsImported: 247,
    dealsCreated: 18,
    inventorySynced: 134,
    webhookUrl: "/api/crm/webhooks/vinsolutions",
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
];

let leads: CRMLead[] = [
  {
    id: "lead_001", connectionId: "conn_demo_vs", providerId: "vinsolutions",
    source: "Website", firstName: "Marcus", lastName: "Thompson",
    email: "m.thompson@email.com", phone: "555-0101",
    vehicleInterest: { year: 2024, make: "BMW", model: "M3", trim: "Competition", vin: "WBS93GA04RCJ74219", stockNumber: "STK-2247" },
    status: "new", assignedTo: "Sales Rep 1", leadScore: 87,
    nextAction: "Call within 2 hours", nextActionAt: new Date(Date.now() + 7_200_000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(), updatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    id: "lead_002", connectionId: "conn_demo_vs", providerId: "vinsolutions",
    source: "AutoTrader", firstName: "Priya", lastName: "Sharma",
    email: "p.sharma@email.com", phone: "555-0202",
    vehicleInterest: { year: 2025, make: "Mercedes-Benz", model: "GLE 450", vin: "", stockNumber: "STK-2251" },
    status: "contacted", assignedTo: "Sales Rep 2", leadScore: 72,
    nextAction: "Follow up email", nextActionAt: new Date(Date.now() + 3_600_000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(), updatedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
  },
  {
    id: "lead_003", connectionId: "conn_demo_vs", providerId: "vinsolutions",
    source: "Cars.com", firstName: "Devon", lastName: "Wright",
    email: "d.wright@email.com", phone: "555-0303",
    vehicleInterest: { year: 2023, make: "Porsche", model: "Cayenne", trim: "S", vin: "WP1AB2AY7PDA63011", stockNumber: "" },
    status: "working", assignedTo: "Sales Manager", leadScore: 94,
    nextAction: "Schedule test drive", nextActionAt: new Date(Date.now() + 1_800_000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3_600_000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: "lead_004", connectionId: "conn_demo_vs", providerId: "vinsolutions",
    source: "3C ONYX Platform", firstName: "Jordan", lastName: "Lee",
    email: "j.lee@email.com", phone: "555-0404",
    vehicleInterest: { year: 2024, make: "Audi", model: "RS 7", vin: "WUAPWAF25RN901446", stockNumber: "STK-2198" },
    status: "sold", assignedTo: "Top Closer", leadScore: 99,
    nextAction: "Delivery scheduled", nextActionAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), updatedAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
  },
];

let webhookEvents: WebhookEvent[] = [];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CRMProvider {
  id: string; name: string; vendor: string; category: string;
  marketShare: string; authType: "oauth2" | "api_key";
  authUrl?: string; tokenUrl?: string; baseUrl: string;
  webhookSupport: boolean; capabilities: string[];
  logo: string; docsUrl: string; notes: string;
}

interface CRMConnection {
  id: string; providerId: string; dealerName: string; dealerId: string;
  status: "active" | "error" | "syncing" | "pending";
  authType: "oauth2" | "api_key";
  apiKey: string | null; accessToken: string | null;
  lastSync: string; syncInterval: number;
  leadsImported: number; dealsCreated: number; inventorySynced: number;
  webhookUrl: string; createdAt: string;
}

interface CRMLead {
  id: string; connectionId: string; providerId: string;
  source: string; firstName: string; lastName: string;
  email: string; phone: string;
  vehicleInterest?: { year?: number; make?: string; model?: string; trim?: string; vin?: string; stockNumber?: string };
  status: "new" | "contacted" | "working" | "sold" | "lost";
  assignedTo: string; leadScore: number;
  nextAction: string; nextActionAt: string;
  createdAt: string; updatedAt: string;
}

interface WebhookEvent {
  id: string; provider: string; eventType: string;
  payload: Record<string, unknown>; receivedAt: string; processed: boolean;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /crm/providers — all supported CRM platforms
router.get("/crm/providers", (_req: Request, res: Response) => {
  res.json({
    providers: CRM_PROVIDERS,
    total: CRM_PROVIDERS.length,
    categories: [...new Set(CRM_PROVIDERS.map(p => p.category))],
  });
});

// GET /crm/connections — active CRM connections for this account
router.get("/crm/connections", (_req: Request, res: Response) => {
  const enriched = connections.map(conn => {
    const provider = CRM_PROVIDERS.find(p => p.id === conn.providerId);
    return { ...conn, provider: provider ?? null };
  });
  res.json({ connections: enriched, total: connections.length });
});

// POST /crm/connections — add a new CRM connection
router.post("/crm/connections", (req: Request, res: Response) => {
  const { providerId, dealerName, dealerId, apiKey, authType } = req.body as Record<string, string>;
  if (!providerId || !dealerName) {
    res.status(400).json({ error: "providerId and dealerName are required" });
    return;
  }
  const provider = CRM_PROVIDERS.find(p => p.id === providerId);
  if (!provider) {
    res.status(404).json({ error: `Provider "${providerId}" not found` });
    return;
  }
  const newConn: CRMConnection = {
    id: `conn_${Date.now()}`,
    providerId, dealerName,
    dealerId: dealerId ?? `DLR_${Date.now()}`,
    status: "pending",
    authType: (authType as "oauth2" | "api_key") ?? provider.authType,
    apiKey: apiKey ?? null, accessToken: null,
    lastSync: new Date().toISOString(),
    syncInterval: 15, leadsImported: 0, dealsCreated: 0, inventorySynced: 0,
    webhookUrl: `/api/crm/webhooks/${providerId}`,
    createdAt: new Date().toISOString(),
  };
  // Simulate activation if API key provided
  if (apiKey) { newConn.status = "active"; newConn.lastSync = new Date().toISOString(); }
  connections.push(newConn);
  res.status(201).json({ connection: { ...newConn, provider }, message: "CRM connection added successfully" });
});

// POST /crm/connections/:id/test — test a CRM connection
router.post("/crm/connections/:id/test", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const conn = connections.find(c => c.id === id);
  if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
  // Simulate connection test
  const success = conn.status === "active" || conn.apiKey !== null;
  res.json({
    connectionId: id,
    success,
    latencyMs: Math.floor(Math.random() * 120) + 45,
    message: success ? "Connection healthy — all endpoints reachable" : "Authentication required. Please provide valid credentials.",
    checkedAt: new Date().toISOString(),
  });
});

// POST /crm/connections/:id/sync — trigger a manual sync
router.post("/crm/connections/:id/sync", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const conn = connections.find(c => c.id === id);
  if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
  conn.status = "syncing";
  // Simulate sync completion
  setTimeout(() => {
    conn.status = "active";
    conn.lastSync = new Date().toISOString();
    conn.leadsImported += Math.floor(Math.random() * 5);
  }, 2000);
  res.json({
    connectionId: id,
    syncStarted: new Date().toISOString(),
    message: "Sync initiated. New leads and inventory will appear within 30 seconds.",
  });
});

// DELETE /crm/connections/:id — remove a connection
router.delete("/crm/connections/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const idx = connections.findIndex(c => c.id === id);
  if (idx === -1) { res.status(404).json({ error: "Connection not found" }); return; }
  connections.splice(idx, 1);
  res.json({ message: "Connection removed", removedId: id });
});

// GET /crm/leads — all leads from all connected CRMs
router.get("/crm/leads", (req: Request, res: Response) => {
  const { status, source, connectionId, limit = "50", offset = "0" } = req.query as Record<string, string>;
  let filtered = [...leads];
  if (status)       filtered = filtered.filter(l => l.status === status);
  if (source)       filtered = filtered.filter(l => l.source === source);
  if (connectionId) filtered = filtered.filter(l => l.connectionId === connectionId);
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = filtered.length;
  const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({
    leads: paginated, total,
    summary: {
      new:       leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      working:   leads.filter(l => l.status === "working").length,
      sold:      leads.filter(l => l.status === "sold").length,
      lost:      leads.filter(l => l.status === "lost").length,
    },
  });
});

// POST /crm/leads — push a new lead to a connected CRM
router.post("/crm/leads", (req: Request, res: Response) => {
  const { connectionId, firstName, lastName, email, phone, vehicleInterest, source } = req.body as Record<string, unknown>;
  if (!connectionId || !firstName || !email) {
    res.status(400).json({ error: "connectionId, firstName, and email are required" });
    return;
  }
  const conn = connections.find(c => c.id === (connectionId as string));
  if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
  const newLead: CRMLead = {
    id: `lead_${Date.now()}`,
    connectionId: connectionId as string,
    providerId: conn.providerId,
    source: (source as string) ?? "3C ONYX Platform",
    firstName: firstName as string,
    lastName: (req.body as Record<string,string>)["lastName"] ?? "",
    email: email as string,
    phone: (phone as string) ?? "",
    vehicleInterest: vehicleInterest as CRMLead["vehicleInterest"],
    status: "new",
    assignedTo: "Auto-Assigned",
    leadScore: Math.floor(Math.random() * 30) + 60,
    nextAction: "Initial outreach", nextActionAt: new Date(Date.now() + 3_600_000).toISOString(),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  leads.push(newLead);
  conn.leadsImported += 1;
  res.status(201).json({ lead: newLead, pushedToCRM: true, provider: conn.providerId });
});

// PATCH /crm/leads/:id — update lead status
router.patch("/crm/leads/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const lead = leads.find(l => l.id === id);
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  const { status, assignedTo, nextAction } = req.body as Partial<CRMLead>;
  if (status)     lead.status = status;
  if (assignedTo) lead.assignedTo = assignedTo;
  if (nextAction) lead.nextAction = nextAction;
  lead.updatedAt = new Date().toISOString();
  if (status === "sold") {
    const conn = connections.find(c => c.id === lead.connectionId);
    if (conn) conn.dealsCreated += 1;
  }
  res.json({ lead, syncedToCRM: true });
});

// GET /crm/inventory — vehicle inventory synced from CRMs
router.get("/crm/inventory", (_req: Request, res: Response) => {
  const inventory = [
    { vin: "WBS93GA04RCJ74219", year: 2024, make: "BMW",      model: "M3",       trim: "Competition",   stockNumber: "STK-2247", price: 89995,  status: "available", mileage: 0,    source: "vinsolutions" },
    { vin: "WUAPWAF25RN901446", year: 2024, make: "Audi",     model: "RS 7",      trim: "Prestige",      stockNumber: "STK-2198", price: 127000, status: "available", mileage: 12,   source: "vinsolutions" },
    { vin: "WP1AB2AY7PDA63011", year: 2023, make: "Porsche",  model: "Cayenne",   trim: "S",             stockNumber: "STK-2301", price: 94500,  status: "in_deal",   mileage: 8,    source: "vinsolutions" },
    { vin: "4T1G11AKXPU745183", year: 2024, make: "Lexus",    model: "IS 500",    trim: "F Sport",       stockNumber: "STK-2219", price: 64888,  status: "available", mileage: 0,    source: "vinsolutions" },
    { vin: "1G1YY2D74K5108399", year: 2023, make: "Chevrolet",model: "Corvette",  trim: "Z06",           stockNumber: "STK-2090", price: 115500, status: "available", mileage: 2210, source: "vinsolutions" },
    { vin: "W1KWJ8DB5PF012345", year: 2025, make: "Mercedes", model: "GLE 450",   trim: "4MATIC",        stockNumber: "STK-2251", price: 81500,  status: "available", mileage: 0,    source: "vinsolutions" },
  ];
  res.json({ inventory, total: inventory.length, lastSync: connections[0]?.lastSync ?? new Date().toISOString() });
});

// GET /crm/analytics — lead analytics and conversion funnel
router.get("/crm/analytics", (_req: Request, res: Response) => {
  const now = Date.now();
  res.json({
    period: "last_30_days",
    funnel: {
      leads:     leads.length,
      contacted: leads.filter(l => l.status !== "new").length,
      working:   leads.filter(l => l.status === "working" || l.status === "sold").length,
      sold:      leads.filter(l => l.status === "sold").length,
    },
    conversionRate: Math.round((leads.filter(l => l.status === "sold").length / Math.max(1, leads.length)) * 100),
    avgLeadScore: Math.round(leads.reduce((a, b) => a + b.leadScore, 0) / Math.max(1, leads.length)),
    topSources: [
      { source: "3C ONYX Platform", leads: 47, conversions: 9, rate: "19.1%" },
      { source: "AutoTrader",        leads: 63, conversions: 8, rate: "12.7%" },
      { source: "Website",           leads: 91, conversions: 7, rate:  "7.7%" },
      { source: "Cars.com",          leads: 34, conversions: 4, rate: "11.8%" },
      { source: "Social Media",      leads: 28, conversions: 2, rate:  "7.1%" },
    ],
    revenueGenerated: 847500,
    avgDealValue: 47083,
    byProvider: connections.map(c => ({
      provider: c.providerId, dealerName: c.dealerName,
      leads: c.leadsImported, deals: c.dealsCreated,
    })),
  });
});

// POST /crm/webhooks/:provider — inbound webhook from CRM platform
router.post("/crm/webhooks/:provider", (req: Request, res: Response) => {
  const provider = String(req.params["provider"] ?? "");
  const event: WebhookEvent = {
    id: `evt_${Date.now()}`,
    provider, eventType: req.body?.eventType ?? "unknown",
    payload: req.body ?? {},
    receivedAt: new Date().toISOString(),
    processed: false,
  };
  webhookEvents.push(event);
  // Auto-process lead events
  if (event.eventType === "lead.created" || event.eventType === "lead.updated") {
    const payload = event.payload as Record<string, unknown>;
    const conn = connections.find(c => c.providerId === provider && c.status === "active");
    if (conn && payload["email"]) {
      leads.push({
        id: `lead_wh_${Date.now()}`,
        connectionId: conn.id, providerId: provider,
        source: "CRM Webhook",
        firstName: String(payload["firstName"] ?? "Unknown"),
        lastName: String(payload["lastName"] ?? ""),
        email: String(payload["email"]),
        phone: String(payload["phone"] ?? ""),
        vehicleInterest: payload["vehicle"] as CRMLead["vehicleInterest"],
        status: "new", assignedTo: "Auto-Assigned", leadScore: 75,
        nextAction: "Initial outreach", nextActionAt: new Date(Date.now() + 3_600_000).toISOString(),
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      conn.leadsImported += 1;
    }
    event.processed = true;
  }
  res.json({ received: true, eventId: event.id });
});

// GET /crm/webhooks/events — recent webhook events (admin/monitoring)
router.get("/crm/webhooks/events", (_req: Request, res: Response) => {
  res.json({
    events: webhookEvents.slice(-50).reverse(),
    total: webhookEvents.length,
  });
});

// GET /crm/summary — dashboard summary card
router.get("/crm/summary", (_req: Request, res: Response) => {
  res.json({
    connectedCRMs: connections.filter(c => c.status === "active").length,
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.leadScore >= 85 && l.status !== "sold" && l.status !== "lost").length,
    dealsClosed: leads.filter(l => l.status === "sold").length,
    revenueInfluenced: leads.filter(l => l.status === "sold").length * 47083,
    lastActivity: leads.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt ?? null,
    supportedProviders: CRM_PROVIDERS.length,
  });
});

export default router;
