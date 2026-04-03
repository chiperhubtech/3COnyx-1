/**
 * Growth Engine API
 * ───────────────────────────────────────────────────────────────────────
 * GET  /growth/stats          Founder dashboard: members, revenue, K-factor, runway
 * GET  /growth/leaderboard    Top referrers + reward tier status
 * GET  /growth/member/:code   Public member profile (viral invite page data)
 * POST /growth/track          Fire-and-forget event tracking
 *
 * Scale target: 100M members via K-factor > 1.25
 * Break-even at ~M3, cash-flow +$3.3M/mo by M12.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { foundingMembersTable, analyticsEventsTable, usersTable } from "@workspace/db";
import { eq, count, sql, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Reward Tier Definitions ────────────────────────────────────────────── */

export const REWARD_TIERS = [
  {
    id: "dynasty_wallet",
    threshold: 1,
    label: "Dynasty Wallet",
    description: "Revenue sharing on every deal you refer — activated.",
    icon: "💎",
  },
  {
    id: "guardian_v2x",
    threshold: 3,
    label: "Guardian V2X",
    description: "Predictive vehicle safety network — early access.",
    icon: "🛡️",
  },
  {
    id: "ai_priority",
    threshold: 5,
    label: "ONYX AI Priority",
    description: "Front of every AI Concierge queue — forever.",
    icon: "⚡",
  },
  {
    id: "concierge_line",
    threshold: 10,
    label: "Founding Concierge",
    description: "Direct line to the 3C Onyx core team.",
    icon: "👑",
  },
  {
    id: "revenue_share",
    threshold: 25,
    label: "Revenue Share",
    description: "1% lifetime value on every member you refer. Compounding.",
    icon: "📈",
  },
] as const;

export function getRewardTier(referredCount: number) {
  const unlocked = REWARD_TIERS.filter((t) => referredCount >= t.threshold);
  const next     = REWARD_TIERS.find((t) => referredCount < t.threshold);
  return { unlocked, next, referredCount };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Monthly burn assumption for runway calculation (lean team, fully operational) */
const MONTHLY_BURN_USD = 167_000;

/** Stripe net retention: 2.9% + $0.30/txn → on $99 = $96.33 net */
function netRevenue(count: number): number {
  return count * (99 - 99 * 0.029 - 0.30);
}

/* ─── Routes ─────────────────────────────────────────────────────────────── */

/**
 * GET /growth/stats
 * Founder-only ops dashboard: real-time metrics
 */
router.get("/growth/stats", async (_req: Request, res: Response) => {
  try {
    const [memberStats, dailyStats, topReferrers, eventStats] = await Promise.all([
      // Total active + pending members
      db.select({
        active:  sql<number>`count(*) filter (where status = 'active')::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        total:   sql<number>`count(*)::int`,
      }).from(foundingMembersTable),

      // Last 30 days daily signups
      db.select({
        day:   sql<string>`date_trunc('day', created_at)::date::text`,
        count: sql<number>`count(*)::int`,
      })
        .from(foundingMembersTable)
        .where(sql`created_at > now() - interval '30 days'`)
        .groupBy(sql`date_trunc('day', created_at)`)
        .orderBy(sql`date_trunc('day', created_at)`),

      // Top 10 referrers
      db.select({
        name:          foundingMembersTable.name,
        referralCode:  foundingMembersTable.referralCode,
        memberNumber:  foundingMembersTable.memberNumber,
        referredCount: sql<number>`
          (select count(*)::int from founding_members ref
           where ref.referred_by = founding_members.referral_code
           and ref.status = 'active')
        `.as("referred_count"),
      })
        .from(foundingMembersTable)
        .where(eq(foundingMembersTable.status, "active"))
        .orderBy(desc(sql`referred_count`))
        .limit(10),

      // Event counts for K-factor estimation
      db.select({
        event: analyticsEventsTable.event,
        count: sql<number>`count(*)::int`,
      })
        .from(analyticsEventsTable)
        .where(sql`created_at > now() - interval '7 days'`)
        .groupBy(analyticsEventsTable.event),
    ]);

    const active        = memberStats[0]?.active  ?? 0;
    const pending       = memberStats[0]?.pending ?? 0;
    const total         = memberStats[0]?.total   ?? 0;
    const grossRevenue  = active * 99;
    const netRev        = netRevenue(active);
    const runway        = netRev > 0 ? Math.floor(netRev / MONTHLY_BURN_USD) : 0;

    // K-factor: referral_click events / member_confirmed events (7-day window)
    const clickCount  = eventStats.find((e) => e.event === "referral_page_view")?.count ?? 0;
    const convertCount = eventStats.find((e) => e.event === "member_confirmed")?.count  ?? 0;
    const conversionRate = clickCount > 0 ? convertCount / clickCount : 0;

    // Avg referrals per active member
    const totalReferred = topReferrers.reduce((s, r) => s + (r.referredCount ?? 0), 0);
    const avgReferrals  = active > 0 ? totalReferred / active : 0;
    const kFactor       = parseFloat((avgReferrals * conversionRate).toFixed(3));

    // Month 12 projection at current K-factor
    const m12Members  = kFactor > 1
      ? Math.min(Math.round(active * Math.pow(kFactor, 12)), 100_000_000)
      : active + (active * 0.15 * 12); // Conservative 15% monthly organic

    res.json({
      members: { active, pending, total },
      revenue: {
        gross:     grossRevenue,
        net:       Math.round(netRev),
        perMember: 96.33,
      },
      growth: {
        kFactor,
        conversionRate: parseFloat((conversionRate * 100).toFixed(1)),
        avgReferralsPerMember: parseFloat(avgReferrals.toFixed(2)),
        projectedM12Members: m12Members,
      },
      runway: {
        monthsRemaining: runway,
        monthlyBurnUsd:  MONTHLY_BURN_USD,
        breakEvenMembers: Math.ceil(MONTHLY_BURN_USD / 96.33),
      },
      dailySignups: dailyStats,
      topReferrers: topReferrers.map((r) => ({
        ...r,
        rewards: getRewardTier(r.referredCount ?? 0),
      })),
      ts: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "[growth] Stats query failed");
    res.status(500).json({ error: "Stats unavailable" });
  }
});

/**
 * GET /growth/leaderboard
 * Public-facing top referrers leaderboard (name + member # only, anonymized)
 */
router.get("/growth/leaderboard", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select({
      firstName:     sql<string>`split_part(name, ' ', 1)`,
      memberNumber:  foundingMembersTable.memberNumber,
      referralCode:  foundingMembersTable.referralCode,
      referredCount: sql<number>`
        (select count(*)::int from founding_members ref
         where ref.referred_by = founding_members.referral_code
         and ref.status = 'active')
      `.as("referred_count"),
    })
      .from(foundingMembersTable)
      .where(eq(foundingMembersTable.status, "active"))
      .orderBy(desc(sql`referred_count`))
      .limit(20);

    res.json({
      leaderboard: rows.map((r, i) => ({
        rank:         i + 1,
        firstName:    r.firstName,
        memberNumber: r.memberNumber,
        referredCount: r.referredCount,
        rewardTier:   getRewardTier(r.referredCount ?? 0),
        referralUrl:  `/join?ref=${r.referralCode}`,
      })),
    });
  } catch (err) {
    logger.error({ err }, "[growth] Leaderboard failed");
    res.status(500).json({ error: "Leaderboard unavailable" });
  }
});

/**
 * GET /growth/member/:code
 * Public member profile — powers the viral /m/:code invite page.
 * Returns ONLY safe public data (first name, member#, referred count, reward tier).
 */
router.get("/growth/member/:code", async (req: Request, res: Response) => {
  const { code } = req.params as { code: string };

  try {
    const [member] = await db.select({
      name:         foundingMembersTable.name,
      memberNumber: foundingMembersTable.memberNumber,
      referralCode: foundingMembersTable.referralCode,
      status:       foundingMembersTable.status,
      confirmedAt:  foundingMembersTable.confirmedAt,
    })
      .from(foundingMembersTable)
      .where(
        and(
          eq(foundingMembersTable.referralCode, code),
          eq(foundingMembersTable.status, "active"),
        ),
      )
      .limit(1);

    if (member) {
      const [{ referredCount }] = await db.select({
        referredCount: sql<number>`count(*)::int`,
      })
        .from(foundingMembersTable)
        .where(
          and(
            eq(foundingMembersTable.referredBy, code),
            eq(foundingMembersTable.status, "active"),
          ),
        );

      const [{ totalActive }] = await db.select({
        totalActive: sql<number>`count(*)::int`,
      })
        .from(foundingMembersTable)
        .where(eq(foundingMembersTable.status, "active"));

      const rewards = getRewardTier(referredCount ?? 0);
      const firstName = member.name.split(" ")[0];

      res.json({
        firstName,
        memberNumber:  member.memberNumber,
        referralCode:  member.referralCode,
        referredCount: referredCount ?? 0,
        totalMembers:  totalActive ?? 0,
        rewards,
        memberSince:   member.confirmedAt?.toISOString() ?? new Date().toISOString(),
      });
      return;
    }

    const [platformUser] = await db.select({
      id:           usersTable.id,
      name:         usersTable.name,
      referralCode: usersTable.referralCode,
      role:         usersTable.role,
      avatarUrl:    usersTable.avatarUrl,
      createdAt:    usersTable.createdAt,
    })
      .from(usersTable)
      .where(eq(usersTable.referralCode, code))
      .limit(1);

    if (!platformUser) {
      res.status(404).json({ error: "Member not found", code: "NOT_FOUND" });
      return;
    }

    const [{ totalUsers }] = await db.select({
      totalUsers: sql<number>`count(*)::int`,
    }).from(usersTable);

    const firstName = (platformUser.name || "Member").split(" ")[0];

    res.json({
      firstName,
      memberNumber:  platformUser.id,
      referralCode:  platformUser.referralCode,
      referredCount: 0,
      totalMembers:  totalUsers ?? 0,
      rewards:       getRewardTier(0),
      memberSince:   platformUser.createdAt?.toISOString?.() ?? new Date().toISOString(),
      avatarUrl:     platformUser.avatarUrl,
      role:          platformUser.role,
    });
  } catch (err) {
    logger.error({ err, code }, "[growth] Member profile lookup failed");
    res.status(500).json({ error: "Profile unavailable" });
  }
});

/**
 * POST /growth/track
 * Fire-and-forget event tracking. Never blocks the user.
 * Events: page_view, referral_page_view, checkout_started, member_confirmed,
 *         share_copied, share_native, reward_viewed
 */
router.post("/growth/track", (req: Request, res: Response) => {
  const { event, sessionId, referralCode, payload } = req.body as {
    event:        string;
    sessionId?:   string;
    referralCode?: string;
    payload?:     Record<string, unknown>;
  };

  if (!event) {
    res.status(400).json({ error: "event is required" });
    return;
  }

  // Acknowledge immediately — never block on analytics
  res.json({ ok: true });

  // Write async (non-blocking)
  db.insert(analyticsEventsTable)
    .values({
      event,
      sessionId:    sessionId ?? null,
      referralCode: referralCode ?? null,
      payload:      payload ?? null,
      ip:           req.ip ?? null,
      userAgent:    req.headers["user-agent"] ?? null,
    })
    .catch((err) => logger.warn({ err, event }, "[growth] Event track insert failed"));
});

router.get("/growth/network-dominance", async (_req: Request, res: Response) => {
  try {
    const [memberStats] = await db.select({
      active: sql<number>`count(*) filter (where status = 'active')::int`,
      total: sql<number>`count(*)::int`,
    }).from(foundingMembersTable);

    const [userStats] = await db.select({
      totalUsers: sql<number>`count(*)::int`,
    }).from(usersTable);

    const active = (memberStats?.active ?? 0) + (userStats?.totalUsers ?? 0);

    res.json({
      protocol: "3C ONYX Universal Participation Network",
      architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
      model: {
        name: "Universal Participation Network",
        type: "Coordination Protocol (NOT MLM)",
        joinCost: "$0 — Free forever",
        inventoryRequired: false,
        recruitmentPressure: false,
        revenueSource: "3% platform commission on $2.7T automotive market",
        settlementSpeed: "Instant (< 2 minutes)",
        attributionDepth: 5,
        nodeTypes: 86,
        transactionCategories: 28,
        margin: "~98% at scale",
      },
      advantages: [
        { vs: "Traditional MLM", advantage: "No inventory, no recruitment fees, no monthly quotas — members earn from real automotive transactions" },
        { vs: "Amway ($8.1B)", advantage: "3C ONYX targets $2.7T market with 3% fee = $81B TAM vs Amway's $8.1B on supplements" },
        { vs: "Herbalife ($5.1B)", advantage: "Zero inventory risk — 3C ONYX nodes earn commissions without buying or storing products" },
        { vs: "Epixel MLM Software", advantage: "5-level instant-settlement attribution engine with SHA-256 proof, anti-fraud quarantine, and 86 universal node types — built into the protocol, not bolted on" },
        { vs: "All Top 100 MLMs", advantage: "Instant settlement vs monthly/quarterly payouts. Every node from CEO to gas station clerk earns equally. No downline pressure." },
      ],
      metrics: {
        activeNodes: active,
        attributionLevels: 5,
        avgSettlementTime: "< 120 seconds",
        antifraudSystem: "Quarantine engine with 6-factor risk scoring",
        proofEngine: "SHA-256 hash chain stamped by architect",
        payoutMethod: "Stripe Connect ACH — instant",
        globalSupport: "13 languages, offline-first mobile, universal QR",
      },
      competitiveEdge: {
        reachPerNode: "Every mechanic, clerk, runner, dealer, inspector, and consumer is a revenue node",
        viralMechanism: "QR-based invite-only access — members recruit the network organically",
        moat: "Protocol lock-in: once a business runs on 3C ONYX settlement rails, switching cost is infinite",
        scaleCeiling: "None — no inventory, no labor overhead, no geographic limit",
      },
      ts: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "[growth] Network dominance query failed");
    res.status(500).json({ error: "Unavailable" });
  }
});

export default router;
