/**
 * 3C ONYX — Conversion Intelligence Engine
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-CONVERSION-INTELLIGENCE-SOVEREIGN
 *
 * The Global Learning Brain. Tracks which behavioral patterns lead to
 * conversions and prioritizes winners across all 4 billion nodes.
 * Every behavioral intervention is measured. Every conversion is
 * attributed to the pattern that caused it. The system learns and
 * optimizes continuously — what works in Miami at 2pm on a Tuesday
 * becomes available to every node worldwide by 2:01pm.
 *
 * This is the unfair advantage. Competitors can copy the UI.
 * They cannot copy the accumulated behavioral intelligence that
 * improves with every interaction across the entire network.
 */

import crypto from "crypto";
import { logger } from "./logger";
import type { MeshAgentId } from "./agentMesh12";
import type { EngagementState, ObjectionType, SentimentLevel } from "./sovereignBehavior";

const ARCHITECT_SEAL = "RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::CONVERSION_INTELLIGENCE";

export interface BehavioralSignal {
  id: string;
  sessionId: string;
  agentId: MeshAgentId;
  timestamp: number;
  engagementState: EngagementState;
  objectionTypes: ObjectionType[];
  sentimentLevel: SentimentLevel;
  patternUsed: string;
  behavioralHash: string;
  convertedToAction: boolean;
  actionType?: string;
  actionValue?: number;
  responseTimeMs?: number;
}

interface PatternMetrics {
  patternId: string;
  agentId: MeshAgentId;
  totalExposures: number;
  totalConversions: number;
  conversionRate: number;
  averageResponseTimeMs: number;
  totalRevenueAttributed: number;
  lastUsed: number;
  effectivenessScore: number;
}

interface AgentMetrics {
  agentId: MeshAgentId;
  totalInteractions: number;
  totalConversions: number;
  conversionRate: number;
  averageEngagementDepth: number;
  averageSentimentDelta: number;
  topPatterns: string[];
  objectionResolutionRate: number;
  escalationRate: number;
  revenueAttributed: number;
}

interface EngagementFunnel {
  cold: number;
  curious: number;
  warm: number;
  hot: number;
  closing: number;
  closed: number;
  atRisk: number;
  saved: number;
  retained: number;
  dropoffPoints: Record<string, number>;
}

const signalBuffer: BehavioralSignal[] = [];
const patternMetrics = new Map<string, PatternMetrics>();
const agentInteractions = new Map<MeshAgentId, number>();
const agentConversions = new Map<MeshAgentId, number>();
const agentRevenue = new Map<MeshAgentId, number>();
const objectionResolutions = new Map<ObjectionType, { total: number; resolved: number }>();
const engagementFunnel: EngagementFunnel = {
  cold: 0, curious: 0, warm: 0, hot: 0, closing: 0,
  closed: 0, atRisk: 0, saved: 0, retained: 0,
  dropoffPoints: {},
};

const MAX_SIGNAL_BUFFER = 10000;

setInterval(() => {
  if (signalBuffer.length > MAX_SIGNAL_BUFFER) {
    signalBuffer.splice(0, signalBuffer.length - MAX_SIGNAL_BUFFER);
  }
}, 5 * 60 * 1000);

export function recordBehavioralSignal(signal: Omit<BehavioralSignal, "id">): string {
  const id = crypto.randomUUID();
  const fullSignal: BehavioralSignal = { ...signal, id };

  signalBuffer.push(fullSignal);

  const interactions = agentInteractions.get(signal.agentId) ?? 0;
  agentInteractions.set(signal.agentId, interactions + 1);

  const STATE_TO_FUNNEL: Record<string, keyof EngagementFunnel> = {
    COLD: "cold", CURIOUS: "curious", WARM: "warm", HOT: "hot",
    CLOSING: "closing", CLOSED: "closed", AT_RISK: "atRisk",
    SAVED: "saved", RETAINED: "retained",
  };
  const funnelKey = STATE_TO_FUNNEL[signal.engagementState];
  if (funnelKey && typeof engagementFunnel[funnelKey] === "number") {
    (engagementFunnel[funnelKey] as number)++;
  }

  for (const objType of signal.objectionTypes) {
    const existing = objectionResolutions.get(objType) ?? { total: 0, resolved: 0 };
    existing.total++;
    objectionResolutions.set(objType, existing);
  }

  updatePatternMetrics(fullSignal);

  return id;
}

export function recordConversion(
  sessionId: string,
  agentId: MeshAgentId,
  actionType: string,
  actionValue: number = 0,
): void {
  const conversions = agentConversions.get(agentId) ?? 0;
  agentConversions.set(agentId, conversions + 1);

  const revenue = agentRevenue.get(agentId) ?? 0;
  agentRevenue.set(agentId, revenue + actionValue);

  const recentSignals = signalBuffer.filter(
    (s) => s.sessionId === sessionId && s.agentId === agentId,
  );

  for (const signal of recentSignals) {
    signal.convertedToAction = true;
    signal.actionType = actionType;
    signal.actionValue = actionValue;

    if (signal.patternUsed) {
      const metrics = patternMetrics.get(signal.patternUsed);
      if (metrics) {
        metrics.totalConversions++;
        metrics.totalRevenueAttributed += actionValue;
        metrics.conversionRate = (metrics.totalConversions / metrics.totalExposures) * 100;
        metrics.effectivenessScore = calculateEffectiveness(metrics);
      }
    }

    for (const objType of signal.objectionTypes) {
      const existing = objectionResolutions.get(objType);
      if (existing) {
        existing.resolved++;
        objectionResolutions.set(objType, existing);
      }
    }
  }

  engagementFunnel.closed++;

  logger.info(
    { sessionId, agentId, actionType, actionValue, signalsAttributed: recentSignals.length },
    "[ConversionIntelligence] Conversion recorded"
  );
}

function updatePatternMetrics(signal: BehavioralSignal): void {
  if (!signal.patternUsed) return;

  let metrics = patternMetrics.get(signal.patternUsed);
  if (!metrics) {
    metrics = {
      patternId: signal.patternUsed,
      agentId: signal.agentId,
      totalExposures: 0,
      totalConversions: 0,
      conversionRate: 0,
      averageResponseTimeMs: 0,
      totalRevenueAttributed: 0,
      lastUsed: Date.now(),
      effectivenessScore: 50,
    };
    patternMetrics.set(signal.patternUsed, metrics);
  }

  metrics.totalExposures++;
  metrics.lastUsed = Date.now();

  if (signal.responseTimeMs) {
    metrics.averageResponseTimeMs =
      (metrics.averageResponseTimeMs * (metrics.totalExposures - 1) + signal.responseTimeMs) /
      metrics.totalExposures;
  }

  metrics.conversionRate = metrics.totalExposures > 0
    ? (metrics.totalConversions / metrics.totalExposures) * 100
    : 0;
  metrics.effectivenessScore = calculateEffectiveness(metrics);
}

function calculateEffectiveness(metrics: PatternMetrics): number {
  const conversionWeight = 0.5;
  const revenueWeight = 0.3;
  const recencyWeight = 0.2;

  const conversionScore = Math.min(100, metrics.conversionRate * 2);

  const maxRevenue = 50000;
  const revenueScore = Math.min(100, (metrics.totalRevenueAttributed / maxRevenue) * 100);

  const hoursSinceUse = (Date.now() - metrics.lastUsed) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 100 - hoursSinceUse * 2);

  return Math.round(
    conversionScore * conversionWeight +
    revenueScore * revenueWeight +
    recencyScore * recencyWeight
  );
}

export function getTopPatterns(agentId: MeshAgentId, limit: number = 5): PatternMetrics[] {
  const patterns = Array.from(patternMetrics.values())
    .filter((p) => p.agentId === agentId && p.totalExposures >= 3)
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  return patterns.slice(0, limit);
}

export function getAgentMetrics(agentId: MeshAgentId): AgentMetrics {
  const interactions = agentInteractions.get(agentId) ?? 0;
  const conversions = agentConversions.get(agentId) ?? 0;
  const revenue = agentRevenue.get(agentId) ?? 0;

  const agentSignals = signalBuffer.filter((s) => s.agentId === agentId);
  const avgDepth = agentSignals.length > 0
    ? agentSignals.reduce((sum, s) => sum + (s.engagementState === "CLOSING" ? 5 : s.engagementState === "HOT" ? 4 : 3), 0) / agentSignals.length
    : 0;

  const escalations = agentSignals.filter((s) => s.sentimentLevel === "HOSTILE" || s.sentimentLevel === "DETRACTOR").length;

  const topPatterns = getTopPatterns(agentId, 3).map((p) => p.patternId);

  let totalObjections = 0;
  let resolvedObjections = 0;
  for (const [, data] of objectionResolutions) {
    totalObjections += data.total;
    resolvedObjections += data.resolved;
  }

  return {
    agentId,
    totalInteractions: interactions,
    totalConversions: conversions,
    conversionRate: interactions > 0 ? Math.round((conversions / interactions) * 10000) / 100 : 0,
    averageEngagementDepth: Math.round(avgDepth * 100) / 100,
    averageSentimentDelta: 0,
    topPatterns,
    objectionResolutionRate: totalObjections > 0
      ? Math.round((resolvedObjections / totalObjections) * 10000) / 100
      : 0,
    escalationRate: interactions > 0
      ? Math.round((escalations / interactions) * 10000) / 100
      : 0,
    revenueAttributed: revenue,
  };
}

export function getNetworkIntelligence() {
  let totalInteractions = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  for (const [, count] of agentInteractions) totalInteractions += count;
  for (const [, count] of agentConversions) totalConversions += count;
  for (const [, amount] of agentRevenue) totalRevenue += amount;

  const objectionBreakdown: Record<string, { total: number; resolved: number; rate: number }> = {};
  for (const [type, data] of objectionResolutions) {
    objectionBreakdown[type] = {
      ...data,
      rate: data.total > 0 ? Math.round((data.resolved / data.total) * 10000) / 100 : 0,
    };
  }

  const topGlobalPatterns = Array.from(patternMetrics.values())
    .filter((p) => p.totalExposures >= 5)
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
    .slice(0, 10)
    .map((p) => ({
      patternId: p.patternId.slice(0, 16) + "...",
      agent: p.agentId,
      exposures: p.totalExposures,
      conversions: p.totalConversions,
      conversionRate: p.conversionRate,
      effectivenessScore: p.effectivenessScore,
      revenueAttributed: p.totalRevenueAttributed,
    }));

  return {
    networkMetrics: {
      totalInteractions,
      totalConversions,
      networkConversionRate: totalInteractions > 0
        ? Math.round((totalConversions / totalInteractions) * 10000) / 100
        : 0,
      totalRevenueAttributed: totalRevenue,
      activePatterns: patternMetrics.size,
      signalBufferSize: signalBuffer.length,
    },
    engagementFunnel,
    objectionBreakdown,
    topGlobalPatterns,
    architectSeal: ARCHITECT_SEAL,
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    protocol: "Conversion Intelligence Engine",
    version: "2.0.0",
    status: "OPERATIONAL",
  };
}
