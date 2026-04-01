/**
 * 3C ONYX — Trust Engine v1.0
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * Algorithmic Trust Economy — Mathematically-Earned Authority
 *
 * The Trust Engine computes dynamic reputation scores based on:
 * - Submission acceptance/rejection history
 * - Spam detection rate
 * - Deal closure attribution
 * - Consecutive quality streaks
 * - Tier-based multipliers
 *
 * Score Range: 0.000 — 100.000
 * Tier Thresholds:
 *   Unverified:    0–29
 *   Contributor:   30–59
 *   Verified_Node: 60–79 (requires KYC-lite)
 *   Trusted_Node:  80–94
 *   Keyholder:     95–100 (requires JWT role)
 */
import { db, trustScoresTable, trustEventLogTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const SCORE_WEIGHTS = {
  SUBMISSION_ACCEPTED: 2.5,
  SUBMISSION_REJECTED: -3.0,
  SPAM_FLAGGED: -8.0,
  DEAL_SOURCED: 5.0,
  DEAL_CLOSED: 12.0,
  STREAK_BONUS_PER_5: 1.5,
  VERIFICATION_BONUS: 10.0,
  INACTIVITY_DECAY_PER_WEEK: -0.5,
  MAX_SCORE: 100.0,
  MIN_SCORE: 0.0,
} as const;

type TrustTier = "Unverified" | "Contributor" | "Verified_Node" | "Trusted_Node" | "Keyholder";

function computeTier(score: number, isVerified: boolean, userRole?: string): TrustTier {
  if (userRole && ["Admin", "Dealer", "Specialist"].includes(userRole)) return "Keyholder";
  if (score >= 80 && isVerified) return "Trusted_Node";
  if (score >= 60 && isVerified) return "Verified_Node";
  if (score >= 30) return "Contributor";
  return "Unverified";
}

function clampScore(score: number): number {
  return Math.max(SCORE_WEIGHTS.MIN_SCORE, Math.min(SCORE_WEIGHTS.MAX_SCORE, score));
}

export async function getOrCreateTrustProfile(userId: number | null, fingerprint?: string, displayName?: string) {
  if (userId) {
    const [existing] = await db.select().from(trustScoresTable).where(eq(trustScoresTable.userId, userId));
    if (existing) return existing;

    const [created] = await db.insert(trustScoresTable).values({
      userId,
      displayName: displayName || "Anonymous",
      tier: "Unverified",
      verificationStatus: "None",
      trustScore: "50.000",
    }).returning();
    return created;
  }

  if (fingerprint) {
    const [existing] = await db.select().from(trustScoresTable).where(eq(trustScoresTable.externalFingerprint, fingerprint));
    if (existing) return existing;

    const [created] = await db.insert(trustScoresTable).values({
      externalFingerprint: fingerprint,
      displayName: displayName || "Anonymous Contributor",
      tier: "Unverified",
      verificationStatus: "None",
      trustScore: "50.000",
    }).returning();
    return created;
  }

  return null;
}

export async function recordTrustEvent(
  trustScoreId: number,
  eventType: string,
  delta: number,
  reason: string,
  taskId?: number,
  dealId?: number,
) {
  const [profile] = await db.select().from(trustScoresTable).where(eq(trustScoresTable.id, trustScoreId));
  if (!profile) return null;

  const previousScore = Number(profile.trustScore);
  const newScore = clampScore(previousScore + delta);
  const isVerified = profile.verificationStatus === "Verified";
  const newTier = computeTier(newScore, isVerified);

  const updates: Record<string, unknown> = {
    trustScore: newScore.toFixed(3),
    tier: newTier,
    lastActivityAt: new Date(),
    updatedAt: new Date(),
  };

  if (eventType === "SUBMISSION_ACCEPTED") {
    updates.acceptedSubmissions = sql`${trustScoresTable.acceptedSubmissions} + 1`;
    updates.consecutiveGoodSubmissions = sql`${trustScoresTable.consecutiveGoodSubmissions} + 1`;
  } else if (eventType === "SUBMISSION_REJECTED") {
    updates.rejectedSubmissions = sql`${trustScoresTable.rejectedSubmissions} + 1`;
    updates.consecutiveGoodSubmissions = 0;
  } else if (eventType === "SPAM_FLAGGED") {
    updates.spamFlagged = sql`${trustScoresTable.spamFlagged} + 1`;
    updates.consecutiveGoodSubmissions = 0;
  } else if (eventType === "DEAL_SOURCED") {
    updates.dealsSourced = sql`${trustScoresTable.dealsSourced} + 1`;
  } else if (eventType === "DEAL_CLOSED") {
    updates.dealsClosed = sql`${trustScoresTable.dealsClosed} + 1`;
  } else if (eventType === "SUBMISSION_CREATED") {
    updates.totalSubmissions = sql`${trustScoresTable.totalSubmissions} + 1`;
  }

  let finalScore = newScore;
  const streakCount = profile.consecutiveGoodSubmissions + (eventType === "SUBMISSION_ACCEPTED" ? 1 : 0);
  if (streakCount > 0 && streakCount % 5 === 0 && eventType === "SUBMISSION_ACCEPTED") {
    finalScore = clampScore(finalScore + SCORE_WEIGHTS.STREAK_BONUS_PER_5);
  }

  const finalTier = computeTier(finalScore, isVerified);
  updates.trustScore = finalScore.toFixed(3);
  updates.tier = finalTier;

  await db.update(trustScoresTable).set(updates).where(eq(trustScoresTable.id, trustScoreId));

  const totalDelta = finalScore - previousScore;
  await db.insert(trustEventLogTable).values({
    trustScoreId,
    eventType,
    previousScore: previousScore.toFixed(3),
    newScore: finalScore.toFixed(3),
    scoreDelta: totalDelta.toFixed(3),
    reason,
    taskId: taskId || null,
    dealId: dealId || null,
  });

  return { previousScore, newScore: finalScore, delta: totalDelta, tier: finalTier };
}

export async function onSubmissionCreated(userId: number | null, fingerprint?: string, displayName?: string) {
  const profile = await getOrCreateTrustProfile(userId, fingerprint, displayName);
  if (!profile) return null;
  return recordTrustEvent(profile.id, "SUBMISSION_CREATED", 0, "New Omni-Node submission received");
}

export async function onSubmissionAccepted(userId: number | null, taskId: number) {
  if (!userId) return null;
  const profile = await getOrCreateTrustProfile(userId);
  if (!profile) return null;
  return recordTrustEvent(profile.id, "SUBMISSION_ACCEPTED", SCORE_WEIGHTS.SUBMISSION_ACCEPTED, "Submission accepted into workflow", taskId);
}

export async function onSubmissionRejected(userId: number | null, taskId: number, reason: string) {
  if (!userId) return null;
  const profile = await getOrCreateTrustProfile(userId);
  if (!profile) return null;
  return recordTrustEvent(profile.id, "SUBMISSION_REJECTED", SCORE_WEIGHTS.SUBMISSION_REJECTED, `Rejected: ${reason}`, taskId);
}

export async function onSpamFlagged(userId: number | null, fingerprint?: string) {
  const profile = await getOrCreateTrustProfile(userId, fingerprint);
  if (!profile) return null;
  return recordTrustEvent(profile.id, "SPAM_FLAGGED", SCORE_WEIGHTS.SPAM_FLAGGED, "Flagged as spam by AI Firewall");
}

export async function onDealSourced(userId: number, taskId: number, dealId: number) {
  const profile = await getOrCreateTrustProfile(userId);
  if (!profile) return null;
  return recordTrustEvent(profile.id, "DEAL_SOURCED", SCORE_WEIGHTS.DEAL_SOURCED, "Referral converted to open deal", taskId, dealId);
}

export async function onDealClosed(userId: number, dealId: number, commissionUsd: number) {
  const profile = await getOrCreateTrustProfile(userId);
  if (!profile) return null;
  await db.update(trustScoresTable).set({
    totalCommissionEarnedUsd: sql`${trustScoresTable.totalCommissionEarnedUsd} + ${commissionUsd}`,
  }).where(eq(trustScoresTable.id, profile.id));
  return recordTrustEvent(profile.id, "DEAL_CLOSED", SCORE_WEIGHTS.DEAL_CLOSED, `Deal closed — $${commissionUsd.toFixed(2)} commission earned`, undefined, dealId);
}

export async function verifyNode(trustScoreId: number, verificationData: Record<string, unknown>) {
  const [profile] = await db.select().from(trustScoresTable).where(eq(trustScoresTable.id, trustScoreId));
  if (!profile) return null;

  const currentScore = Number(profile.trustScore);
  const newScore = clampScore(currentScore + SCORE_WEIGHTS.VERIFICATION_BONUS);
  const newTier = computeTier(newScore, true);

  await db.update(trustScoresTable).set({
    verificationStatus: "Verified",
    verifiedAt: new Date(),
    trustScore: newScore.toFixed(3),
    tier: newTier,
    verificationData,
    updatedAt: new Date(),
  }).where(eq(trustScoresTable.id, trustScoreId));

  await db.insert(trustEventLogTable).values({
    trustScoreId,
    eventType: "VERIFICATION_COMPLETED",
    previousScore: currentScore.toFixed(3),
    newScore: newScore.toFixed(3),
    scoreDelta: SCORE_WEIGHTS.VERIFICATION_BONUS.toFixed(3),
    reason: "KYC-lite verification passed — upgraded to Verified Node",
  });

  return { previousScore: currentScore, newScore, tier: newTier };
}

export function assessSpamRisk(title: string, description: string | null, trustScore: number): { isSpam: boolean; spamScore: number; reasons: string[] } {
  const reasons: string[] = [];
  let spamScore = 0;

  const rawText = `${title} ${description || ""}`;
  const text = rawText.toLowerCase();

  const spamPatterns = [
    /\b(buy now|click here|free money|congratulations|winner|prize|lottery|casino|viagra|crypto.*earn)\b/i,
    /(.)\1{5,}/,
    /https?:\/\/[^\s]+/g,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamScore += 25;
      reasons.push(`Matched spam pattern: ${pattern.source.substring(0, 30)}`);
    }
  }

  if (/[A-Z]{10,}/.test(rawText)) {
    spamScore += 25;
    reasons.push("Excessive uppercase text");
  }

  if (title.length < 5) { spamScore += 15; reasons.push("Title too short"); }
  if (title.length > 500) { spamScore += 10; reasons.push("Title suspiciously long"); }
  if (!description || description.length < 3) { spamScore += 10; reasons.push("No description provided"); }

  if (trustScore < 20) { spamScore += 15; reasons.push("Very low trust score"); }
  else if (trustScore < 40) { spamScore += 5; reasons.push("Below-average trust score"); }
  else if (trustScore >= 70) { spamScore -= 10; }

  spamScore = Math.max(0, Math.min(100, spamScore));

  return { isSpam: spamScore >= 50, spamScore, reasons };
}

export function shouldBypassFiltering(trustScore: number, tier: string): boolean {
  return tier === "Trusted_Node" || tier === "Keyholder";
}

export { SCORE_WEIGHTS, computeTier };
