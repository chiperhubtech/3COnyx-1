import { eventBus } from "./eventBus";
import { db, referralLedgerTable, commissionLedgerTable, usersTable, dealerflowTasksTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "./logger";
import crypto from "crypto";

const TECH_FEE_PCT = 0.03;

const REWARD_TABLE: Record<string, number> = {
  Finance: 50,
  F_And_I: 50,
  Sales: 50,
  Insurance: 25,
  Service: 15,
  Parts: 10,
  DMV: 10,
  Logistics: 10,
};

const settledTaskIds = new Set<number>();

export function initGrowthSubscribers() {
  eventBus.onEvent("agent.task.complete", async (event) => {
    const { taskId, department, customerPhone, customerEmail } = event.payload as any;
    if (!taskId) return;

    logger.info({ taskId, department }, "[GrowthEngine] Task completed — resolving Bird-Dog referrer");

    try {
      const [task] = await db.select().from(dealerflowTasksTable)
        .where(eq(dealerflowTasksTable.id, taskId));
      if (!task) return;

      const meta = (task.metadata as any) || {};
      const referrerId = meta.referrerId;
      const contactName = meta.contactName || task.initiatorName || "someone";

      if (!referrerId) {
        logger.info({ taskId }, "[GrowthEngine] No referrer on task — skipping reward");
        return;
      }

      if (settledTaskIds.has(taskId)) {
        logger.warn({ taskId }, "[GrowthEngine] Duplicate settlement blocked (in-memory)");
        return;
      }

      const [existingSettlement] = await db.select({ id: referralLedgerTable.id })
        .from(referralLedgerTable)
        .where(sql`${referralLedgerTable.metadata}->>'taskId' = ${String(taskId)}`);
      if (existingSettlement) {
        settledTaskIds.add(taskId);
        logger.warn({ taskId }, "[GrowthEngine] Duplicate settlement blocked (DB check)");
        return;
      }

      if (task.initiatorId && task.initiatorId === referrerId) {
        logger.warn({ taskId, referrerId }, "[GrowthEngine] Self-referral blocked");
        return;
      }

      const reward = REWARD_TABLE[department] || 10;

      const [referrer] = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
      }).from(usersTable).where(eq(usersTable.id, referrerId));

      if (!referrer) {
        logger.warn({ referrerId, taskId }, "[GrowthEngine] Referrer not found");
        return;
      }

      const refId = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();

      await db.insert(referralLedgerTable).values({
        referralId: refId,
        vin: task.vin || "N/A",
        referringNodeId: referrer.id,
        referringNodeName: referrer.name || "ONYX Member",
        referringNodeType: "Member",
        buyerName: contactName,
        status: "Closed",
        commissionPctBps: 300,
        commissionUsd: String(reward),
        closedAt: new Date(),
        metadata: {
          taskId,
          department,
          autoSettled: true,
          source: "bird_dog_protocol",
          architect: "Ronald Antonio Cadet",
          system: "3C ONYX Altruistic Viral Loop",
        },
      });

      await db.insert(commissionLedgerTable).values({
        entryType: "Referral",
        status: "Pending",
        recipientId: referrer.id,
        amountUsd: String(reward),
        referredByUserId: referrer.id,
        note: `Bird-Dog reward — ${contactName} completed ${department} task #${taskId}`,
      });

      await db.update(usersTable)
        .set({ points: sql`${usersTable.points} + 25` })
        .where(eq(usersTable.id, referrer.id));

      settledTaskIds.add(taskId);

      const [currentUser] = await db.select({ communityRole: usersTable.communityRole })
        .from(usersTable).where(eq(usersTable.id, referrer.id));
      if (currentUser && currentUser.communityRole === "Member") {
        await db.update(usersTable)
          .set({ communityRole: "Connector", updatedAt: new Date() })
          .where(eq(usersTable.id, referrer.id));
        logger.info({ referrerId: referrer.id }, "[GrowthEngine] Promoted to Connector — first successful connection");
      }

      logger.info({ referrerId: referrer.id, reward, refId, taskId }, "[GrowthEngine] Bird-Dog reward settled");

      await eventBus.emit("referral.settled", {
        referralId: refId,
        referrerId: referrer.id,
        referrerName: referrer.name,
        referrerEmail: referrer.email,
        referrerPhone: referrer.phone,
        reward,
        contactName,
        department,
        taskId,
      });
    } catch (err) {
      logger.error({ err: (err as Error).message, taskId }, "[GrowthEngine] Bird-Dog reward failed");
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

  logger.info({
    protocol: "Bird-Dog Flywheel v2.0",
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
    system: "3C ONYX — Sovereign Automotive Ecosystem OS",
  }, "[GrowthEngine] Altruistic Viral Loop — Decentralized Flywheel initialized");
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
