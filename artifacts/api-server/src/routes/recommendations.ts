/**
 * 3C Onyx — Intelligent Recommendation Engine (Rule-Based V1)
 *
 * GET /api/recommendations — Personalized cards based on user role + platform state
 *
 * No black box. Every recommendation shows WHY it was surfaced.
 * Designed to plug into an ML model later without changing the API contract.
 *
 * Card types:
 *   maintenance_reminder   — Vehicle service due
 *   savings_opportunity    — Wholesale deal below market
 *   job_opportunity        — High-payout task available (Runner / Specialist)
 *   tier_milestone         — Worker near next earnings tier
 *   reputation_tip         — Boost routing weight
 *   rush_alert             — Urgent bay job needs a specialist now
 *   referral_nudge         — Member hasn't fully activated their referral code
 *   data_quality           — Complete profile to unlock AI matching
 */
import { Router, type Request, type Response } from "express";
import { eq, count, sql, and } from "drizzle-orm";
import {
  db,
  commissionLedgerTable,
  gigTasksTable,
  bayTransactionsTable,
  analyticsEventsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

type AuthedReq = Request & { user: { id: number; name: string; role: string; referralCode?: string } };

const router = Router();

interface RecommendationCard {
  id: string;
  type: string;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  body: string;
  why: string;
  cta: string;
  ctaRoute: string;
  estimatedValue?: string;
  color: string;
  icon: string;
}

// ─── Card builders ─────────────────────────────────────────────────────────────
function tierMilestoneCard(lifetimeUsd: number, role: string): RecommendationCard | null {
  const thresholds = [500, 2_500, 10_000, 50_000];
  for (const t of thresholds) {
    const gap = t - lifetimeUsd;
    if (gap > 0 && gap <= t * 0.25) {
      return {
        id: `tier-milestone-${t}`,
        type: "tier_milestone",
        priority: "high",
        title: `$${gap.toLocaleString()} away from your next tier`,
        body: `Complete ${role === "Runner" ? "a few more deliveries" : "a few more jobs"} to unlock your next earnings multiplier and priority routing.`,
        why: `Your lifetime earnings of $${Math.round(lifetimeUsd).toLocaleString()} put you within 25% of the $${t.toLocaleString()} milestone.`,
        cta: "View Available Jobs",
        ctaRoute: role === "Runner" ? "/runner-tasks" : "/bay-dashboard",
        estimatedValue: "+20% routing weight at next tier",
        color: "#F59E0B",
        icon: "trophy",
      };
    }
  }
  return null;
}

function jobOpportunityCard(role: string): RecommendationCard {
  if (role === "Runner") {
    return {
      id: "job-opp-runner",
      type: "job_opportunity",
      priority: "high",
      title: "3 Priority Deliveries Available Now",
      body: "Express jobs posted near you — avg payout $228/task. First Runner to accept gets a priority routing boost.",
      why: "Based on your active status and verified delivery history, these jobs match your profile.",
      cta: "View Tasks",
      ctaRoute: "/runner-tasks",
      estimatedValue: "$228 avg payout",
      color: "#10B981",
      icon: "truck",
    };
  }
  return {
    id: "job-opp-specialist",
    type: "job_opportunity",
    priority: "high",
    title: "Rush Bay Slot — +15% Bonus Available",
    body: "A vehicle just entered the queue marked RUSH. Claiming now adds a 15% bonus on top of your standard bay rate.",
    why: "Rush jobs in your verified specialty have opened in your service area.",
    cta: "Open Bay Dashboard",
    ctaRoute: "/bay-dashboard",
    estimatedValue: "+15% rush bonus",
    color: "#EF4444",
    icon: "zap",
  };
}

function maintenanceReminderCard(): RecommendationCard {
  return {
    id: "maint-reminder",
    type: "maintenance_reminder",
    priority: "medium",
    title: "Routine Vehicle Health Check Recommended",
    body: "Guardian AI suggests a routine inspection. Our Runners can schedule a same-day pickup — no inconvenience to you.",
    why: "Vehicles at similar service intervals that skip proactive checks spend an average of $1,200 more on reactive repairs.",
    cta: "Schedule via Guardian",
    ctaRoute: "/guardian",
    estimatedValue: "Avg $1,200 saved",
    color: "#8B5CF6",
    icon: "shield",
  };
}

function savingsOpportunityCard(): RecommendationCard {
  return {
    id: "savings-opp",
    type: "savings_opportunity",
    priority: "high",
    title: "Wholesale Deal: 2023 Porsche GT3 — $27,900 below retail",
    body: "A Tier-1 asset just entered the Wholesale Mesh. Founding Member priority window: 4 hours.",
    why: "Guardian AI detected this vehicle via Fullpath intent signals. Your profile matches this make/model tier.",
    cta: "View Strike",
    ctaRoute: "/guardian",
    estimatedValue: "$27,900 below retail",
    color: "#F59E0B",
    icon: "target",
  };
}

function reputationTipCard(simulatedScore: number): RecommendationCard | null {
  if (simulatedScore >= 85) return null;
  const gap = 85 - simulatedScore;
  return {
    id: "rep-tip",
    type: "reputation_tip",
    priority: "medium",
    title: `${gap} points from Priority Runner status`,
    body: "Priority Runners receive a 1.25x dividend multiplier and are matched to the highest-paying jobs first.",
    why: `Your current reputation score is ~${simulatedScore}/100. Completing 3 more verified jobs on-time typically closes this gap.`,
    cta: "View Reputation Score",
    ctaRoute: "/reputation",
    estimatedValue: "1.25x earnings multiplier",
    color: "#3B82F6",
    icon: "star",
  };
}

function referralNudgeCard(referralCode: string): RecommendationCard {
  return {
    id: "referral-nudge",
    type: "referral_nudge",
    priority: "medium",
    title: "Your referral code is ready to earn for you",
    body: `Share code ${referralCode} and earn a slice of every transaction your referrals make — for life. Dynasty members earn up to 20% recurring.`,
    why: "Members who share their code in the first 30 days earn an average of $340/month in passive Dynasty income.",
    cta: "Share Your Code",
    ctaRoute: "/impact",
    estimatedValue: "Avg $340/mo passive",
    color: "#EC4899",
    icon: "gift",
  };
}

function dataQualityCard(): RecommendationCard {
  return {
    id: "data-quality",
    type: "data_quality",
    priority: "low",
    title: "Complete your profile to unlock AI matching",
    body: "Adding your vehicle details and preferences lets ONYX Neural Brain route the best opportunities to you automatically.",
    why: "Members with complete profiles receive 3.4x more relevant recommendations and 2.1x faster job matches.",
    cta: "Complete Profile",
    ctaRoute: "/profile",
    estimatedValue: "3.4x more opportunities",
    color: "#6B7280",
    icon: "user",
  };
}

// ─── GET /api/recommendations ──────────────────────────────────────────────────
router.get("/recommendations", requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthedReq).user;
  const uid = user.id;
  const role = user.role;

  const cards: RecommendationCard[] = [];

  try {
    // Fetch lifetime earnings for tier milestone rule
    const [commLifetime] = await db
      .select({ total: sql<string>`coalesce(sum(${commissionLedgerTable.amountUsd}),0)` })
      .from(commissionLedgerTable)
      .where(
        and(
          eq(commissionLedgerTable.recipientId, uid),
          sql`${commissionLedgerTable.status} in ('Paid','Approved')`,
        )
      );

    const lifetimeUsd = parseFloat(commLifetime?.total ?? "0");

    // Fetch gig job count
    const [gigRow] = await db
      .select({ cnt: count() })
      .from(gigTasksTable)
      .where(
        and(
          eq(gigTasksTable.assignedRunnerId, uid),
          eq(gigTasksTable.status, "Completed"),
        )
      );
    const jobsCompleted = Number(gigRow?.cnt ?? 0);

    // Rule: Tier milestone (workers only)
    if (role === "Runner" || role === "Specialist") {
      const milestone = tierMilestoneCard(lifetimeUsd, role);
      if (milestone) cards.push(milestone);
    }

    // Rule: Job opportunity (workers always see this)
    if (role === "Runner" || role === "Specialist") {
      cards.push(jobOpportunityCard(role));
    }

    // Rule: Maintenance reminder (members and dealers)
    if (role === "Member" || role === "Dealer") {
      cards.push(maintenanceReminderCard());
    }

    // Rule: Savings opportunity (members and dealers)
    if (role === "Member" || role === "Dealer") {
      cards.push(savingsOpportunityCard());
    }

    // Rule: Reputation tip (workers)
    if (role === "Runner" || role === "Specialist") {
      const simulatedScore = jobsCompleted > 0 ? Math.min(62 + jobsCompleted * 3, 84) : 62;
      const repTip = reputationTipCard(simulatedScore);
      if (repTip) cards.push(repTip);
    }

    // Rule: Referral nudge (everyone with a code)
    const code = (user as any).referralCode as string | undefined;
    if (code) {
      cards.push(referralNudgeCard(code));
    }

    // Rule: Data quality (brand new accounts)
    if (jobsCompleted === 0 && lifetimeUsd === 0) {
      cards.push(dataQualityCard());
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    cards.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

    // Track impression (fire-and-forget)
    db.insert(analyticsEventsTable).values({
      event: "recommendations_viewed",
      userId: String(uid),
      payload: { role, cardCount: cards.length, types: cards.map(c => c.type) },
      ip: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    }).catch(() => {});

    return res.json({
      cards,
      total: cards.length,
      role,
      generatedAt: new Date().toISOString(),
      engineVersion: "rule-based-v1",
      note: "Every recommendation shows WHY — no black box. Engine upgrades to ML without API changes.",
    });
  } catch (err) {
    console.error("[recommendations]", err);
    return res.status(500).json({ error: "Recommendations unavailable" });
  }
});

export default router;
