/**
 * 3C ONYX — Node Attribution Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-NODE-ATTRIBUTION-SOVEREIGN
 *
 * Every user in the ONYX network is a "Node." The Node Attribution Engine
 * automatically builds and maintains the participants array for every deal.
 * When a PaymentCompleted event fires, the engine splits payouts to every
 * node that touched the deal.
 *
 * Participant Roles:
 *   - Referral:   The node that brought the customer
 *   - Closer:     The salesperson who closed the deal
 *   - Finance:    The F&I manager who structured the deal
 *   - Service:    The service node that prepared the vehicle
 *   - Logistics:  The runner/transporter who delivered
 *   - Location:   The dealership/hub where the deal originated
 *   - Inspector:  The node that inspected the vehicle
 *
 * The 3% Global Tech Fee is partitioned:
 *   - 1.5% → Platform (CUXTOMCANDYCLUB LLC)
 *   - 0.5% → Referral Node
 *   - 0.5% → Service/Logistics Nodes (split)
 *   - 0.5% → Location Node
 */

import { logger } from "./logger";

export interface NodeParticipant {
  role: string;
  nodeId: string;
  nodeName?: string;
  sharePercent: number;
  payoutUsd?: number;
}

const DEFAULT_SPLIT: Record<string, number> = {
  Platform: 50,
  Referral: 16.67,
  Closer: 10,
  Finance: 6.67,
  Service: 6.67,
  Logistics: 5,
  Location: 5,
};

export function buildParticipantsArray(deal: {
  salespersonId?: number | null;
  salespersonName?: string | null;
  financeManagerId?: number | null;
  dealershipId?: number | null;
  referralCode?: string | null;
  runnerId?: number | null;
  serviceNodeId?: number | null;
  inspectorId?: number | null;
  metadata?: Record<string, unknown> | null;
}): NodeParticipant[] {
  const participants: NodeParticipant[] = [];

  participants.push({
    role: "Platform",
    nodeId: "SOVEREIGN",
    nodeName: "CUXTOMCANDYCLUB LLC",
    sharePercent: DEFAULT_SPLIT.Platform,
  });

  if (deal.salespersonId) {
    participants.push({
      role: "Closer",
      nodeId: String(deal.salespersonId),
      nodeName: deal.salespersonName || undefined,
      sharePercent: DEFAULT_SPLIT.Closer,
    });
  }

  if (deal.financeManagerId) {
    participants.push({
      role: "Finance",
      nodeId: String(deal.financeManagerId),
      sharePercent: DEFAULT_SPLIT.Finance,
    });
  }

  if (deal.dealershipId) {
    participants.push({
      role: "Location",
      nodeId: String(deal.dealershipId),
      sharePercent: DEFAULT_SPLIT.Location,
    });
  }

  const referralCode = deal.referralCode || (deal.metadata as any)?.referralCode;
  if (referralCode) {
    participants.push({
      role: "Referral",
      nodeId: referralCode,
      sharePercent: DEFAULT_SPLIT.Referral,
    });
  }

  if (deal.runnerId || (deal.metadata as any)?.runnerId) {
    participants.push({
      role: "Logistics",
      nodeId: String(deal.runnerId || (deal.metadata as any)?.runnerId),
      sharePercent: DEFAULT_SPLIT.Logistics,
    });
  }

  if (deal.serviceNodeId || (deal.metadata as any)?.serviceNodeId) {
    participants.push({
      role: "Service",
      nodeId: String(deal.serviceNodeId || (deal.metadata as any)?.serviceNodeId),
      sharePercent: DEFAULT_SPLIT.Service,
    });
  }

  if (deal.inspectorId || (deal.metadata as any)?.inspectorId) {
    participants.push({
      role: "Inspector",
      nodeId: String(deal.inspectorId || (deal.metadata as any)?.inspectorId),
      sharePercent: 0,
    });
  }

  const totalAssigned = participants.reduce((sum, p) => sum + p.sharePercent, 0);
  if (totalAssigned < 100) {
    const platformIdx = participants.findIndex((p) => p.role === "Platform");
    if (platformIdx >= 0) {
      participants[platformIdx].sharePercent += (100 - totalAssigned);
    }
  }

  return participants;
}

export function calculatePayouts(
  participants: NodeParticipant[],
  techFeeUsd: number,
): NodeParticipant[] {
  return participants.map((p) => ({
    ...p,
    payoutUsd: Math.round((p.sharePercent / 100) * techFeeUsd * 100) / 100,
  }));
}

export function calculateTechFee(salePrice: number, feePercent: number = 3): number {
  return Math.round(salePrice * (feePercent / 100) * 100) / 100;
}

export function formatParticipantsSummary(participants: NodeParticipant[]): string {
  return participants
    .filter((p) => p.role !== "Platform")
    .map((p) => `${p.role}: ${p.nodeId} (${p.sharePercent}%)`)
    .join(" | ");
}
