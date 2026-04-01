import { eventBus, type OnyxEventType } from "./eventBus";
import { db, referralLedgerTable, commissionLedgerTable, usersTable, dealerflowTasksTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "./logger";

const TECH_FEE_PCT = 0.03;

export function initGrowthSubscribers() {
  eventBus.onEvent("agent.task.complete", async (event) => {
    const { taskId, customerId, department } = event.payload as any;
    if (!taskId) return;

    logger.info({ taskId, department }, "[GrowthEngine] Task completed — checking referral rewards");

    try {
      if (customerId) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, customerId));
        if (user?.referredBy) {
          const referralReward = department === "Finance" ? 15.0 : department === "Sales" ? 10.0 : 3.0;
          await db.insert(commissionLedgerTable).values({
            entryType: "Referral",
            status: "Pending",
            recipientId: user.referredBy,
            amountUsd: String(referralReward),
            referredByUserId: user.referredBy,
            note: `Bird-Dog reward — referred member completed ${department} task #${taskId}`,
          });
          logger.info({ referrerId: user.referredBy, reward: referralReward }, "[GrowthEngine] Referral reward logged");
        }
      }
    } catch (err) {
      logger.error({ err: (err as Error).message }, "[GrowthEngine] Referral reward failed");
    }
  });

  eventBus.onEvent("referral.created", async (event) => {
    const { referrerId } = event.payload as any;
    if (!referrerId) return;

    try {
      await db.update(usersTable)
        .set({ points: sql`${usersTable.points} + 5` })
        .where(eq(usersTable.id, referrerId));
      logger.info({ referrerId }, "[GrowthEngine] +5 points for new referral");
    } catch (err) {
      logger.error({ err: (err as Error).message }, "[GrowthEngine] Points update failed");
    }
  });

  eventBus.onEvent("payment.escrow.released", async (event) => {
    const { dealId, totalUsd, sellerId } = event.payload as any;
    if (!totalUsd || !sellerId) return;

    const techFee = Math.round(totalUsd * TECH_FEE_PCT * 100) / 100;
    try {
      await db.insert(commissionLedgerTable).values({
        entryType: "GigCompletion",
        status: "Pending",
        recipientId: sellerId,
        amountUsd: String(totalUsd - techFee),
        note: `Deal #${dealId} payout (3% tech fee: $${techFee})`,
      });
      logger.info({ dealId, techFee, net: totalUsd - techFee }, "[GrowthEngine] Deal payout logged");
    } catch (err) {
      logger.error({ err: (err as Error).message }, "[GrowthEngine] Deal payout failed");
    }
  });

  logger.info("[GrowthEngine] Invisible Funnel subscribers initialized");
}

export async function getUserReferralStats(userId: number) {
  const [user] = await db.select({
    id: usersTable.id,
    referralCode: usersTable.referralCode,
    points: usersTable.points,
    name: usersTable.name,
  }).from(usersTable).where(eq(usersTable.id, userId));

  if (!user) return null;

  const [referralCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.referredBy, userId));

  const [earningsResult] = await db
    .select({ total: sql<string>`coalesce(sum(${commissionLedgerTable.amountUsd}), '0')` })
    .from(commissionLedgerTable)
    .where(and(
      eq(commissionLedgerTable.recipientId, userId),
      eq(commissionLedgerTable.entryType, "Referral"),
    ));

  const [pendingResult] = await db
    .select({ total: sql<string>`coalesce(sum(${commissionLedgerTable.amountUsd}), '0')` })
    .from(commissionLedgerTable)
    .where(and(
      eq(commissionLedgerTable.recipientId, userId),
      eq(commissionLedgerTable.status, "Pending"),
    ));

  return {
    referralCode: user.referralCode,
    points: user.points || 0,
    referralsCount: referralCount?.count || 0,
    totalEarnings: parseFloat(earningsResult?.total || "0"),
    pendingEarnings: parseFloat(pendingResult?.total || "0"),
  };
}
