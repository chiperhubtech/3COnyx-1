import { db, dealsTable, dealerflowTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeAudit } from "./auditService";

interface AgentResult {
  agent: string;
  success: boolean;
  action: string;
  data: Record<string, any>;
  executedAt: string;
}

async function getDeal(dealId: number) {
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId));
  return deal || null;
}

async function updateDealStatus(dealId: number, status: string) {
  await db.update(dealsTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(dealsTable.id, dealId));
}

async function logAgent(agent: string, dealId: number, action: string, actorId: number) {
  await writeAudit({
    eventType: "API_CALL",
    action: `[${agent}] ${action} — Deal #${dealId}`,
    actorId,
    severity: "INFO",
  });
}

export async function salesAgent(dealId: number, actorId: number): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Sales", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  await updateDealStatus(dealId, "In_Progress");
  await logAgent("SalesAgent", dealId, `Lead qualified. Customer: ${deal.customerName}. Vehicle: ${deal.vehicleLabel || "TBD"}`, actorId);

  return {
    agent: "Sales",
    success: true,
    action: `Lead qualified and deal opened for ${deal.customerName}`,
    data: {
      customer: deal.customerName,
      vehicle: deal.vehicleLabel || deal.vin || "Pending selection",
      nextStep: "Structure deal terms",
    },
    executedAt: new Date().toISOString(),
  };
}

export async function deskAgent(dealId: number, actorId: number, params: {
  sellingPrice: number;
  downPayment?: number;
  tradeInValue?: number;
  creditTier?: string;
}): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Desk", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const { structureDeal } = await import("./brokerDesk");
  const structure = structureDeal({
    vin: deal.vin || "UNKNOWN",
    vehicleLabel: deal.vehicleLabel || "Vehicle",
    msrp: params.sellingPrice,
    sellingPrice: params.sellingPrice,
    downPayment: params.downPayment || 0,
    tradeInValue: params.tradeInValue || 0,
    creditTier: (params.creditTier as any) || "Tier2",
  });

  await logAgent("DeskAgent", dealId, `Deal structured: Best option = ${structure.recommendation.bestOption}`, actorId);

  return {
    agent: "Desk",
    success: true,
    action: `Deal structured — recommended: ${structure.recommendation.bestOption}`,
    data: { structure },
    executedAt: new Date().toISOString(),
  };
}

export async function financeAgent(dealId: number, actorId: number): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Finance", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const lenders = [
    { name: "Ally Financial", rate: 5.9, term: 72, status: "Pre-Approved" },
    { name: "Chase Auto", rate: 6.4, term: 60, status: "Pre-Approved" },
    { name: "Capital One Auto", rate: 7.2, term: 72, status: "Pending" },
    { name: "Stellantis Financial", rate: 4.9, term: 60, status: "Pre-Approved" },
  ];

  const bestLender = lenders.reduce((a, b) => a.rate < b.rate ? a : b);

  await updateDealStatus(dealId, "Pending_Finance");
  await logAgent("FinanceAgent", dealId, `Credit submitted to ${lenders.length} lenders. Best rate: ${bestLender.rate}% from ${bestLender.name}`, actorId);

  return {
    agent: "Finance",
    success: true,
    action: `Credit submitted to ${lenders.length} lenders — best rate: ${bestLender.rate}% APR`,
    data: { lenders, bestLender, submittedAt: new Date().toISOString() },
    executedAt: new Date().toISOString(),
  };
}

export async function insuranceAgent(dealId: number, actorId: number, params?: {
  coverageType?: string;
}): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Insurance", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const coverage = params?.coverageType || "Full Coverage";
  const monthlyPremium = Math.floor(Math.random() * 80) + 120;
  const policyNumber = `ONX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await updateDealStatus(dealId, "Pending_Insurance");
  await logAgent("InsuranceAgent", dealId, `Insurance bound: ${coverage} — $${monthlyPremium}/mo — Policy ${policyNumber}`, actorId);

  return {
    agent: "Insurance",
    success: true,
    action: `Insurance bound instantly — no phone calls. Policy ${policyNumber}`,
    data: {
      policyNumber,
      coverage,
      monthlyPremium,
      provider: "ONYX Insurance Network",
      boundAt: new Date().toISOString(),
    },
    executedAt: new Date().toISOString(),
  };
}

export async function inventoryAgent(dealId: number, actorId: number): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Inventory", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const matches = [
    { dealerId: "D-2847", distance: "12 miles", available: true, color: "Black", msrp: 38500 },
    { dealerId: "D-1093", distance: "28 miles", available: true, color: "White", msrp: 37900 },
    { dealerId: "D-4521", distance: "47 miles", available: true, color: "Silver", msrp: 39200 },
  ];

  await logAgent("InventoryAgent", dealId, `Located ${matches.length} matching units for ${deal.vehicleLabel || "requested vehicle"}`, actorId);

  return {
    agent: "Inventory",
    success: true,
    action: `Found ${matches.length} matching vehicles within 50 miles — closest at ${matches[0].distance}`,
    data: { matches, vehicle: deal.vehicleLabel || deal.vin },
    executedAt: new Date().toISOString(),
  };
}

export async function logisticsAgent(dealId: number, actorId: number): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Logistics", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const eta = new Date(Date.now() + (Math.floor(Math.random() * 48) + 2) * 3600000);

  await logAgent("LogisticsAgent", dealId, `Transport arranged. ETA: ${eta.toISOString()}`, actorId);

  return {
    agent: "Logistics",
    success: true,
    action: `Transport arranged — vehicle en route. ETA: ${eta.toLocaleString()}`,
    data: {
      carrier: "ONYX Express Transport",
      eta: eta.toISOString(),
      tracking: `TRK-${Date.now().toString(36).toUpperCase()}`,
      cost: Math.floor(Math.random() * 300) + 200,
    },
    executedAt: new Date().toISOString(),
  };
}

export async function serviceAgent(dealId: number, actorId: number, params?: {
  serviceType?: string;
}): Promise<AgentResult> {
  const deal = await getDeal(dealId);
  if (!deal) return { agent: "Service", success: false, action: "Deal not found", data: {}, executedAt: new Date().toISOString() };

  const serviceType = params?.serviceType || "Pre-Delivery Inspection";

  await logAgent("ServiceAgent", dealId, `${serviceType} scheduled for ${deal.vehicleLabel || "vehicle"}`, actorId);

  return {
    agent: "Service",
    success: true,
    action: `${serviceType} scheduled — technician assigned`,
    data: {
      serviceType,
      vehicle: deal.vehicleLabel || deal.vin,
      technician: "Assigned automatically",
      estimatedTime: "45 minutes",
      scheduledFor: new Date(Date.now() + 3600000).toISOString(),
    },
    executedAt: new Date().toISOString(),
  };
}

export const AGENTS = {
  sales: salesAgent,
  desk: deskAgent,
  finance: financeAgent,
  insurance: insuranceAgent,
  inventory: inventoryAgent,
  logistics: logisticsAgent,
  service: serviceAgent,
} as const;

export type AgentName = keyof typeof AGENTS;
