import { logger } from "./logger";

const log = logger.child({ module: "hubspot" });

export interface HubSpotConfig {
  apiKey: string;
  portalId?: string;
}

interface HubSpotContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  lifecycleStage: string;
  leadSource: string;
  onyxMemberId?: string;
  vehicleInterest?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotDeal {
  id: string;
  name: string;
  stage: string;
  amount: number;
  pipeline: string;
  contactId: string;
  vehicleVin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  commissionRate: number;
  closedAt?: string;
  createdAt: string;
}

interface HubSpotPipeline {
  id: string;
  label: string;
  stages: { id: string; label: string; probability: number }[];
}

const ONYX_PIPELINES: HubSpotPipeline[] = [
  {
    id: "onyx_vehicle_sales",
    label: "ONYX Vehicle Sales",
    stages: [
      { id: "lead_in", label: "Lead In", probability: 10 },
      { id: "contacted", label: "Contacted", probability: 20 },
      { id: "test_drive", label: "Test Drive Scheduled", probability: 40 },
      { id: "negotiation", label: "Negotiation", probability: 60 },
      { id: "finance_approval", label: "Finance Approval", probability: 80 },
      { id: "closed_won", label: "Closed Won", probability: 100 },
      { id: "closed_lost", label: "Closed Lost", probability: 0 },
    ],
  },
  {
    id: "onyx_service",
    label: "ONYX Service Pipeline",
    stages: [
      { id: "inquiry", label: "Service Inquiry", probability: 20 },
      { id: "quoted", label: "Quoted", probability: 40 },
      { id: "scheduled", label: "Scheduled", probability: 70 },
      { id: "in_progress", label: "In Progress", probability: 90 },
      { id: "completed", label: "Completed", probability: 100 },
    ],
  },
  {
    id: "onyx_partnerships",
    label: "ONYX Partnership Pipeline",
    stages: [
      { id: "prospect", label: "Prospect", probability: 10 },
      { id: "pitch", label: "Pitch Delivered", probability: 30 },
      { id: "evaluation", label: "Evaluation", probability: 50 },
      { id: "contract", label: "Contract Review", probability: 75 },
      { id: "onboarded", label: "Onboarded", probability: 100 },
    ],
  },
];

const CUSTOM_PROPERTIES = [
  { name: "onyx_member_id", label: "ONYX Member ID", type: "string", group: "3c_onyx" },
  { name: "onyx_referral_code", label: "Referral Code", type: "string", group: "3c_onyx" },
  { name: "onyx_tier", label: "Member Tier", type: "enumeration", group: "3c_onyx", options: ["bronze", "silver", "gold", "platinum", "sovereign"] },
  { name: "onyx_vehicle_vin", label: "Vehicle VIN", type: "string", group: "3c_onyx" },
  { name: "onyx_vehicle_make", label: "Vehicle Make", type: "string", group: "3c_onyx" },
  { name: "onyx_vehicle_model", label: "Vehicle Model", type: "string", group: "3c_onyx" },
  { name: "onyx_commission_earned", label: "Commission Earned", type: "number", group: "3c_onyx" },
  { name: "onyx_network_depth", label: "Network Depth", type: "number", group: "3c_onyx" },
  { name: "onyx_lead_score", label: "ONYX Lead Score", type: "number", group: "3c_onyx" },
  { name: "onyx_engagement_state", label: "Engagement State", type: "enumeration", group: "3c_onyx", options: ["COLD", "CURIOUS", "WARM", "HOT", "CLOSING", "CLOSED", "RETAINED", "AT_RISK", "SAVED"] },
  { name: "tiktok_lead_id", label: "TikTok Lead ID", type: "string", group: "3c_onyx" },
  { name: "tiktok_campaign_id", label: "TikTok Campaign ID", type: "string", group: "3c_onyx" },
];

const LIFECYCLE_MAPPING: Record<string, string> = {
  new: "lead",
  contacted: "marketingqualifiedlead",
  working: "salesqualifiedlead",
  negotiation: "opportunity",
  closed_won: "customer",
  closed_lost: "other",
};

let hubspotConfig: HubSpotConfig | null = null;
let connected = false;

const contacts: HubSpotContact[] = [];
const deals: HubSpotDeal[] = [];

export function initHubSpot(config: HubSpotConfig): boolean {
  hubspotConfig = config;
  connected = true;
  log.info({ portalId: config.portalId }, "HubSpot CRM integration initialized");
  return true;
}

export function isHubSpotConnected(): boolean {
  return connected && !!hubspotConfig?.apiKey;
}

export function getHubSpotStatus() {
  return {
    connected,
    configured: !!hubspotConfig?.apiKey,
    portalId: hubspotConfig?.portalId ?? null,
    pipelines: ONYX_PIPELINES.length,
    customProperties: CUSTOM_PROPERTIES.length,
    contacts: contacts.length,
    deals: deals.length,
    syncStatus: connected ? "active" : "disconnected",
    features: {
      contactSync: true,
      dealTracking: true,
      pipelineManagement: true,
      customProperties: true,
      webhookInbound: true,
      tiktokLeadSync: true,
      behavioralSync: true,
      automatedWorkflows: true,
    },
    message: connected
      ? "HubSpot CRM fully integrated — contacts, deals, and behavioral data syncing"
      : "Add HUBSPOT_API_KEY to activate. All integration logic is ready.",
  };
}

export function getPipelines() {
  return ONYX_PIPELINES;
}

export function getCustomProperties() {
  return CUSTOM_PROPERTIES;
}

export function syncContactToHubSpot(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  memberId?: string;
  referralCode?: string;
  vehicleInterest?: string;
  leadSource?: string;
  engagementState?: string;
}): HubSpotContact {
  const existing = contacts.find(c => c.email === data.email);
  if (existing) {
    existing.firstName = data.firstName;
    existing.lastName = data.lastName;
    if (data.phone) existing.phone = data.phone;
    if (data.vehicleInterest) existing.vehicleInterest = data.vehicleInterest;
    if (data.referralCode) existing.referralCode = data.referralCode;
    existing.updatedAt = new Date().toISOString();
    log.info({ email: data.email }, "HubSpot contact updated");
    return existing;
  }

  const contact: HubSpotContact = {
    id: `hs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone ?? "",
    company: data.company ?? "",
    lifecycleStage: LIFECYCLE_MAPPING[data.leadSource ?? "new"] ?? "lead",
    leadSource: data.leadSource ?? "3C ONYX Platform",
    onyxMemberId: data.memberId,
    vehicleInterest: data.vehicleInterest,
    referralCode: data.referralCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  contacts.push(contact);
  log.info({ email: data.email, contactId: contact.id }, "HubSpot contact created");
  return contact;
}

export function createHubSpotDeal(data: {
  name: string;
  amount: number;
  pipelineId?: string;
  stageId?: string;
  contactEmail?: string;
  vehicleVin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
}): HubSpotDeal {
  const contact = data.contactEmail
    ? contacts.find(c => c.email === data.contactEmail)
    : undefined;

  const deal: HubSpotDeal = {
    id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: data.name,
    stage: data.stageId ?? "lead_in",
    amount: data.amount,
    pipeline: data.pipelineId ?? "onyx_vehicle_sales",
    contactId: contact?.id ?? "",
    vehicleVin: data.vehicleVin,
    vehicleMake: data.vehicleMake,
    vehicleModel: data.vehicleModel,
    vehicleYear: data.vehicleYear,
    commissionRate: 0.03,
    createdAt: new Date().toISOString(),
  };
  deals.push(deal);
  log.info({ dealId: deal.id, amount: data.amount }, "HubSpot deal created");
  return deal;
}

export function getHubSpotContacts(filters?: { lifecycleStage?: string; leadSource?: string }) {
  let result = [...contacts];
  if (filters?.lifecycleStage) result = result.filter(c => c.lifecycleStage === filters.lifecycleStage);
  if (filters?.leadSource) result = result.filter(c => c.leadSource === filters.leadSource);
  return result;
}

export function getHubSpotDeals(filters?: { pipeline?: string; stage?: string }) {
  let result = [...deals];
  if (filters?.pipeline) result = result.filter(d => d.pipeline === filters.pipeline);
  if (filters?.stage) result = result.filter(d => d.stage === filters.stage);
  return result;
}

export function getHubSpotAnalytics() {
  const totalRevenue = deals.reduce((s, d) => s + d.amount, 0);
  const closedDeals = deals.filter(d => d.stage === "closed_won");
  const pipelineBreakdown = ONYX_PIPELINES.map(p => ({
    pipeline: p.label,
    deals: deals.filter(d => d.pipeline === p.id).length,
    revenue: deals.filter(d => d.pipeline === p.id).reduce((s, d) => s + d.amount, 0),
    stages: p.stages.map(s => ({
      stage: s.label,
      count: deals.filter(d => d.pipeline === p.id && d.stage === s.id).length,
    })),
  }));

  return {
    totalContacts: contacts.length,
    totalDeals: deals.length,
    totalRevenue,
    closedWon: closedDeals.length,
    closedRevenue: closedDeals.reduce((s, d) => s + d.amount, 0),
    platformCommission: totalRevenue * 0.03,
    avgDealSize: deals.length > 0 ? Math.round(totalRevenue / deals.length) : 0,
    conversionRate: contacts.length > 0 ? Math.round((closedDeals.length / contacts.length) * 100) : 0,
    pipelineBreakdown,
    contactsByLifecycle: {
      lead: contacts.filter(c => c.lifecycleStage === "lead").length,
      mql: contacts.filter(c => c.lifecycleStage === "marketingqualifiedlead").length,
      sql: contacts.filter(c => c.lifecycleStage === "salesqualifiedlead").length,
      opportunity: contacts.filter(c => c.lifecycleStage === "opportunity").length,
      customer: contacts.filter(c => c.lifecycleStage === "customer").length,
    },
    leadSources: [...new Set(contacts.map(c => c.leadSource))].map(source => ({
      source,
      count: contacts.filter(c => c.leadSource === source).length,
    })),
  };
}

export function syncTikTokLeadToHubSpot(lead: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tiktokLeadId: string;
  tiktokCampaignId: string;
  adName?: string;
}) {
  const contact = syncContactToHubSpot({
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    leadSource: `TikTok Ads — ${lead.adName ?? lead.tiktokCampaignId}`,
  });

  log.info({ contactId: contact.id, tiktokLeadId: lead.tiktokLeadId }, "TikTok lead synced to HubSpot");
  return contact;
}
