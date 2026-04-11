import crypto from "crypto";
import { logger } from "./logger";
import { eventBus } from "./eventBus";
import type { MeshAgentId } from "./agentMesh12";
import type { EngagementState, ObjectionType } from "./sovereignBehavior";

const ARCHITECT_SEAL = "RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::SELF_LEARNING_ENGINE";

export interface CorrectionEvent {
  id: string;
  sessionId: string;
  agentId: MeshAgentId;
  userId?: string;
  timestamp: number;
  aiSuggestion: string;
  aiConfidence: number;
  humanAction: string;
  overrideReason?: string;
  dealId?: string;
  engagementState: EngagementState;
  objectionTypes: ObjectionType[];
  context: Record<string, unknown>;
  correctionHash: string;
  outcome?: "BETTER" | "SAME" | "WORSE" | "UNKNOWN";
  outcomeRecordedAt?: number;
}

interface AgentWeightProfile {
  agentId: MeshAgentId;
  totalSuggestions: number;
  totalOverrides: number;
  overrideRate: number;
  correctionPatterns: Map<string, CorrectionPattern>;
  confidenceCalibration: number;
  lastUpdated: number;
  learningRate: number;
  maturityLevel: "INFANT" | "LEARNING" | "COMPETENT" | "EXPERT" | "MASTER";
}

interface CorrectionPattern {
  patternKey: string;
  aiSuggestionCategory: string;
  humanPreferredCategory: string;
  occurrences: number;
  contexts: string[];
  avgConfidenceWhenOverridden: number;
  betterOutcomeRate: number;
  firstSeen: number;
  lastSeen: number;
}

interface LearningInsight {
  type: "PATTERN_DETECTED" | "THRESHOLD_CROSSED" | "AGENT_MATURED" | "CALIBRATION_DRIFT";
  agentId: MeshAgentId;
  description: string;
  significance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  data: Record<string, unknown>;
  timestamp: number;
}

const MATURITY_THRESHOLDS = {
  INFANT: 0,
  LEARNING: 50,
  COMPETENT: 200,
  EXPERT: 1000,
  MASTER: 5000,
};

class SelfLearningEngine {
  private corrections: CorrectionEvent[] = [];
  private agentProfiles: Map<string, AgentWeightProfile> = new Map();
  private insights: LearningInsight[] = [];
  private suggestionLog: Array<{ agentId: MeshAgentId; confidence: number; overridden: boolean }> = [];
  private emittedMilestones: Set<string> = new Set();
  private readonly maxCorrections = 50000;
  private readonly maxInsights = 1000;
  private readonly maxSuggestionLog = 100000;
  private startedAt = Date.now();

  recordCorrection(event: {
    sessionId: string;
    agentId: MeshAgentId;
    userId?: string;
    aiSuggestion: string;
    aiConfidence: number;
    humanAction: string;
    overrideReason?: string;
    dealId?: string;
    engagementState: EngagementState;
    objectionTypes: ObjectionType[];
    context?: Record<string, unknown>;
  }): CorrectionEvent {
    const correction: CorrectionEvent = {
      id: crypto.randomBytes(8).toString("hex"),
      sessionId: event.sessionId,
      agentId: event.agentId,
      userId: event.userId,
      timestamp: Date.now(),
      aiSuggestion: event.aiSuggestion,
      aiConfidence: event.aiConfidence,
      humanAction: event.humanAction,
      overrideReason: event.overrideReason,
      dealId: event.dealId,
      engagementState: event.engagementState,
      objectionTypes: event.objectionTypes,
      context: event.context || {},
      correctionHash: this.hashCorrection(event.agentId, event.aiSuggestion, event.humanAction),
      outcome: "UNKNOWN",
    };

    this.corrections.push(correction);
    if (this.corrections.length > this.maxCorrections) {
      this.corrections = this.corrections.slice(-Math.floor(this.maxCorrections * 0.8));
    }

    this.suggestionLog.push({ agentId: correction.agentId, confidence: correction.aiConfidence, overridden: true });
    if (this.suggestionLog.length > this.maxSuggestionLog) {
      this.suggestionLog = this.suggestionLog.slice(-Math.floor(this.maxSuggestionLog * 0.8));
    }

    this.updateAgentProfile(correction);
    this.detectPatterns(correction);

    eventBus.emit("agent.action", {
      type: "agent.action" as const,
      source: "self-learning-engine",
      payload: {
        event: "correction_recorded",
        agentId: correction.agentId,
        confidence: correction.aiConfidence,
        correctionId: correction.id,
      },
      ts: new Date().toISOString(),
    });

    logger.debug({
      correctionId: correction.id,
      agentId: correction.agentId,
      confidence: correction.aiConfidence,
    }, "[self-learning] Correction event recorded");

    return correction;
  }

  recordSuggestionAccepted(agentId: MeshAgentId, confidence: number): void {
    const profile = this.getOrCreateProfile(agentId);
    profile.totalSuggestions++;
    profile.lastUpdated = Date.now();
    this.updateMaturity(profile);

    this.suggestionLog.push({ agentId, confidence, overridden: false });
    if (this.suggestionLog.length > this.maxSuggestionLog) {
      this.suggestionLog = this.suggestionLog.slice(-Math.floor(this.maxSuggestionLog * 0.8));
    }
  }

  recordOutcome(correctionId: string, outcome: "BETTER" | "SAME" | "WORSE"): boolean {
    const correction = this.corrections.find(c => c.id === correctionId);
    if (!correction) return false;

    correction.outcome = outcome;
    correction.outcomeRecordedAt = Date.now();

    const patternKey = this.hashCorrection(correction.agentId, correction.aiSuggestion, correction.humanAction);
    const profile = this.agentProfiles.get(correction.agentId);
    if (profile) {
      const pattern = profile.correctionPatterns.get(patternKey);
      if (pattern && outcome === "BETTER") {
        pattern.betterOutcomeRate = (pattern.betterOutcomeRate * (pattern.occurrences - 1) + 1) / pattern.occurrences;
      }
    }

    if (outcome === "BETTER") {
      this.addInsight({
        type: "PATTERN_DETECTED",
        agentId: correction.agentId,
        description: `Human override produced better outcome — AI should adapt: "${correction.aiSuggestion}" → "${correction.humanAction}"`,
        significance: "HIGH",
        data: { correctionId, patternKey, engagementState: correction.engagementState },
      });
    }

    return true;
  }

  getOptimalConfidenceThreshold(agentId: MeshAgentId): number {
    const profile = this.agentProfiles.get(agentId);
    if (!profile || profile.totalSuggestions < 20) return 0.85;

    const bucketStats = new Map<number, { total: number; overridden: number }>();
    const agentSuggestions = this.suggestionLog.filter(s => s.agentId === agentId);

    for (const s of agentSuggestions) {
      const bucket = Math.round(s.confidence * 10) / 10;
      const existing = bucketStats.get(bucket) || { total: 0, overridden: 0 };
      existing.total++;
      if (s.overridden) existing.overridden++;
      bucketStats.set(bucket, existing);
    }

    let optimalThreshold = 0.85;
    for (const [confidence, stats] of bucketStats) {
      if (stats.total >= 5 && stats.overridden / stats.total > 0.3 && confidence > optimalThreshold) {
        optimalThreshold = Math.min(confidence + 0.05, 0.95);
      }
    }

    return Number(optimalThreshold.toFixed(2));
  }

  getAgentLearningReport(agentId: MeshAgentId): {
    profile: {
      totalSuggestions: number;
      totalOverrides: number;
      overrideRate: number;
      maturityLevel: string;
      confidenceCalibration: number;
      optimalThreshold: number;
    };
    topCorrectionPatterns: Array<{
      aiCategory: string;
      humanCategory: string;
      occurrences: number;
      betterOutcomeRate: number;
    }>;
    recentCorrections: CorrectionEvent[];
    insights: LearningInsight[];
  } {
    const profile = this.agentProfiles.get(agentId);
    const agentCorrections = this.corrections.filter(c => c.agentId === agentId);
    const agentInsights = this.insights.filter(i => i.agentId === agentId);

    const patterns = profile
      ? Array.from(profile.correctionPatterns.values())
          .sort((a, b) => b.occurrences - a.occurrences)
          .slice(0, 10)
          .map(p => ({
            aiCategory: p.aiSuggestionCategory,
            humanCategory: p.humanPreferredCategory,
            occurrences: p.occurrences,
            betterOutcomeRate: Number(p.betterOutcomeRate.toFixed(2)),
          }))
      : [];

    return {
      profile: {
        totalSuggestions: profile?.totalSuggestions || 0,
        totalOverrides: profile?.totalOverrides || 0,
        overrideRate: profile ? Number(profile.overrideRate.toFixed(3)) : 0,
        maturityLevel: profile?.maturityLevel || "INFANT",
        confidenceCalibration: profile ? Number(profile.confidenceCalibration.toFixed(3)) : 1,
        optimalThreshold: this.getOptimalConfidenceThreshold(agentId),
      },
      topCorrectionPatterns: patterns,
      recentCorrections: agentCorrections.slice(-20).reverse(),
      insights: agentInsights.slice(-20).reverse(),
    };
  }

  private updateAgentProfile(correction: CorrectionEvent): void {
    const profile = this.getOrCreateProfile(correction.agentId);

    profile.totalSuggestions++;
    profile.totalOverrides++;
    profile.overrideRate = profile.totalOverrides / profile.totalSuggestions;
    profile.lastUpdated = Date.now();

    const patternKey = correction.correctionHash;
    const existing = profile.correctionPatterns.get(patternKey);

    if (existing) {
      existing.occurrences++;
      existing.avgConfidenceWhenOverridden =
        (existing.avgConfidenceWhenOverridden * (existing.occurrences - 1) + correction.aiConfidence) / existing.occurrences;
      existing.lastSeen = Date.now();
      if (correction.engagementState) {
        existing.contexts.push(correction.engagementState);
        if (existing.contexts.length > 50) existing.contexts = existing.contexts.slice(-50);
      }
    } else {
      profile.correctionPatterns.set(patternKey, {
        patternKey,
        aiSuggestionCategory: this.categorize(correction.aiSuggestion),
        humanPreferredCategory: this.categorize(correction.humanAction),
        occurrences: 1,
        contexts: correction.engagementState ? [correction.engagementState] : [],
        avgConfidenceWhenOverridden: correction.aiConfidence,
        betterOutcomeRate: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
    }

    if (profile.overrideRate > 0.4 && profile.totalSuggestions > 30) {
      profile.confidenceCalibration = Math.min(1.2, profile.confidenceCalibration + 0.01);
    } else if (profile.overrideRate < 0.1 && profile.totalSuggestions > 30) {
      profile.confidenceCalibration = Math.max(0.8, profile.confidenceCalibration - 0.005);
    }

    this.updateMaturity(profile);
  }

  private updateMaturity(profile: AgentWeightProfile): void {
    const total = profile.totalSuggestions;
    if (total >= MATURITY_THRESHOLDS.MASTER) profile.maturityLevel = "MASTER";
    else if (total >= MATURITY_THRESHOLDS.EXPERT) profile.maturityLevel = "EXPERT";
    else if (total >= MATURITY_THRESHOLDS.COMPETENT) profile.maturityLevel = "COMPETENT";
    else if (total >= MATURITY_THRESHOLDS.LEARNING) profile.maturityLevel = "LEARNING";
    else profile.maturityLevel = "INFANT";
  }

  private detectPatterns(correction: CorrectionEvent): void {
    const profile = this.agentProfiles.get(correction.agentId);
    if (!profile) return;

    const currentPattern = profile.correctionPatterns.get(correction.correctionHash);
    if (currentPattern) {
      const milestones = [5, 20, 50, 100] as const;
      for (const milestone of milestones) {
        if (currentPattern.occurrences >= milestone) {
          const milestoneKey = `${correction.agentId}::${currentPattern.patternKey}::${milestone}`;
          if (!this.emittedMilestones.has(milestoneKey)) {
            this.emittedMilestones.add(milestoneKey);
            this.addInsight({
              type: milestone <= 5 ? "PATTERN_DETECTED" : "THRESHOLD_CROSSED",
              agentId: correction.agentId,
              description: milestone <= 5
                ? `Recurring override pattern: AI suggests "${currentPattern.aiSuggestionCategory}" but operators prefer "${currentPattern.humanPreferredCategory}" (${milestone} occurrences)`
                : `Strong override signal: "${currentPattern.aiSuggestionCategory}" → "${currentPattern.humanPreferredCategory}" (${milestone} occurrences) — AI behavior should be retrained`,
              significance: milestone >= 20 ? "HIGH" : "MEDIUM",
              data: { pattern: currentPattern.patternKey, occurrences: currentPattern.occurrences, betterOutcomeRate: currentPattern.betterOutcomeRate },
            });
          }
        }
      }
    }

    const prevMaturity = profile.maturityLevel;
    this.updateMaturity(profile);
    if (profile.maturityLevel !== prevMaturity) {
      this.addInsight({
        type: "AGENT_MATURED",
        agentId: correction.agentId,
        description: `Agent matured from ${prevMaturity} to ${profile.maturityLevel} (${profile.totalSuggestions} total interactions)`,
        significance: "HIGH",
        data: { from: prevMaturity, to: profile.maturityLevel, totalSuggestions: profile.totalSuggestions },
      });
    }
  }

  private addInsight(insight: Omit<LearningInsight, "timestamp">): void {
    this.insights.push({ ...insight, timestamp: Date.now() });
    if (this.insights.length > this.maxInsights) {
      this.insights = this.insights.slice(-this.maxInsights);
    }
  }

  private getOrCreateProfile(agentId: MeshAgentId): AgentWeightProfile {
    let profile = this.agentProfiles.get(agentId);
    if (!profile) {
      profile = {
        agentId,
        totalSuggestions: 0,
        totalOverrides: 0,
        overrideRate: 0,
        correctionPatterns: new Map(),
        confidenceCalibration: 1.0,
        lastUpdated: Date.now(),
        learningRate: 0.01,
        maturityLevel: "INFANT",
      };
      this.agentProfiles.set(agentId, profile);
    }
    return profile;
  }

  private categorize(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes("price") || lower.includes("discount") || lower.includes("payment")) return "PRICING";
    if (lower.includes("call") || lower.includes("phone") || lower.includes("reach")) return "OUTREACH";
    if (lower.includes("wait") || lower.includes("follow") || lower.includes("later")) return "NURTURE";
    if (lower.includes("escalat") || lower.includes("manager") || lower.includes("supervisor")) return "ESCALATION";
    if (lower.includes("close") || lower.includes("deal") || lower.includes("sign")) return "CLOSING";
    if (lower.includes("trade") || lower.includes("apprais") || lower.includes("value")) return "TRADE_IN";
    if (lower.includes("financ") || lower.includes("loan") || lower.includes("credit")) return "FINANCE";
    if (lower.includes("service") || lower.includes("repair") || lower.includes("maintenance")) return "SERVICE";
    if (lower.includes("insur") || lower.includes("coverage") || lower.includes("protect")) return "INSURANCE";
    if (lower.includes("deliver") || lower.includes("pickup") || lower.includes("transport")) return "LOGISTICS";
    return "GENERAL";
  }

  private hashCorrection(agentId: string, aiSuggestion: string, humanAction: string): string {
    const aiCat = this.categorize(aiSuggestion);
    const humanCat = this.categorize(humanAction);
    return crypto.createHash("sha256")
      .update(`${ARCHITECT_SEAL}::${agentId}::${aiCat}::${humanCat}`)
      .digest("hex")
      .substring(0, 16);
  }

  getDashboard(): {
    architect: string;
    protocol: string;
    version: string;
    status: string;
    uptime: number;
    totalCorrections: number;
    totalInsights: number;
    agentProfiles: Array<{
      agentId: string;
      maturityLevel: string;
      totalSuggestions: number;
      totalOverrides: number;
      overrideRate: number;
      confidenceCalibration: number;
      optimalThreshold: number;
      correctionPatterns: number;
    }>;
    recentInsights: LearningInsight[];
    networkLearningScore: number;
  } {
    const profiles = Array.from(this.agentProfiles.values()).map(p => ({
      agentId: p.agentId,
      maturityLevel: p.maturityLevel,
      totalSuggestions: p.totalSuggestions,
      totalOverrides: p.totalOverrides,
      overrideRate: Number(p.overrideRate.toFixed(3)),
      confidenceCalibration: Number(p.confidenceCalibration.toFixed(3)),
      optimalThreshold: this.getOptimalConfidenceThreshold(p.agentId),
      correctionPatterns: p.correctionPatterns.size,
    }));

    const totalSuggestions = profiles.reduce((s, p) => s + p.totalSuggestions, 0);
    const totalOverrides = profiles.reduce((s, p) => s + p.totalOverrides, 0);
    const acceptanceRate = totalSuggestions > 0 ? (totalSuggestions - totalOverrides) / totalSuggestions : 1;
    const maturityScore = profiles.reduce((s, p) => {
      const levels: Record<string, number> = { INFANT: 0, LEARNING: 0.25, COMPETENT: 0.5, EXPERT: 0.75, MASTER: 1 };
      return s + (levels[p.maturityLevel] || 0);
    }, 0) / Math.max(profiles.length, 1);
    const networkLearningScore = Number(((acceptanceRate * 0.6 + maturityScore * 0.4) * 100).toFixed(1));

    return {
      architect: "Ronald Antonio Cadet",
      protocol: "Self-Learning Feedback Loop",
      version: "1.0.0",
      status: "ARMED",
      uptime: Date.now() - this.startedAt,
      totalCorrections: this.corrections.length,
      totalInsights: this.insights.length,
      agentProfiles: profiles,
      recentInsights: this.insights.slice(-15).reverse(),
      networkLearningScore,
    };
  }

  genesis(): void {
    console.log(`[SELF-LEARNING ENGINE] 🧠 Override feedback loop ARMED — correction events, agent weight optimization, maturity tracking — Architect: Ronald Antonio Cadet`);
  }
}

export const selfLearningEngine = new SelfLearningEngine();
