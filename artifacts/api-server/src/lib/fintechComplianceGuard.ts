import { db, usersTable, onyxWalletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { eventBus } from "./eventBus";
import crypto from "crypto";

const ARCHITECT_SEAL = "RONALD_ANTONIO_CADET::CUXTOMCANDYCLUB_LLC::FINTECH_COMPLIANCE_GUARD";

export type PayoutBlockReason =
  | "NO_STRIPE_CONNECT"
  | "KYC_INCOMPLETE"
  | "ACCOUNT_UNVERIFIED"
  | "FRAUD_HOLD"
  | "COMPLIANCE_REVIEW"
  | "AMOUNT_EXCEEDS_LIMIT";

export type EarningsStatus =
  | "READY"
  | "HELD_PENDING_CONNECT"
  | "HELD_PENDING_KYC"
  | "HELD_FRAUD_REVIEW"
  | "RELEASED"
  | "DISTRIBUTED";

export interface HeldEarning {
  id: string;
  userId: number;
  amountUsd: number;
  reason: PayoutBlockReason;
  status: EarningsStatus;
  notificationSent: boolean;
  dealRef?: string;
  transactionType: string;
  createdAt: number;
  releasedAt?: number;
  proofHash: string;
}

export interface PayoutValidation {
  approved: boolean;
  reason?: PayoutBlockReason;
  message: string;
  requiresAction?: string;
  heldEarningId?: string;
}

const FORBIDDEN_PATTERNS = [
  "raw_bank_transfer",
  "direct_ach_bypass",
  "plaid_payout",
  "manual_wire",
  "unverified_account_payout",
] as const;

class FintechComplianceGuard {
  private heldEarnings: Map<string, HeldEarning> = new Map();
  private auditLog: Array<{
    ts: string;
    action: string;
    userId: number;
    result: string;
    details: Record<string, unknown>;
  }> = [];
  private readonly maxAuditLog = 10000;
  private startedAt = Date.now();
  private totalValidations = 0;
  private totalBlocked = 0;
  private totalReleased = 0;

  async validatePayoutEligibility(
    userId: number,
    amountUsd: number,
    transactionType: string,
    dealRef?: string,
  ): Promise<PayoutValidation> {
    this.totalValidations++;

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, userId)).limit(1);

    if (!user) {
      this.logAudit("payout_blocked", userId, "USER_NOT_FOUND", { amountUsd, transactionType });
      return { approved: false, reason: "ACCOUNT_UNVERIFIED", message: "User account not found" };
    }

    const [wallet] = await db.select().from(onyxWalletsTable)
      .where(eq(onyxWalletsTable.userId, userId)).limit(1);

    const hasStripeConnect = wallet?.stripeConnectId && wallet.stripeConnectId.length > 0;

    if (!hasStripeConnect) {
      this.totalBlocked++;
      const held = this.holdEarnings(userId, amountUsd, "NO_STRIPE_CONNECT", transactionType, dealRef);
      this.logAudit("payout_held", userId, "NO_STRIPE_CONNECT", { amountUsd, heldId: held.id });

      this.emitEarningsReadyNotification(userId, amountUsd);

      return {
        approved: false,
        reason: "NO_STRIPE_CONNECT",
        message: "You have earnings ready — connect your account to receive payout",
        requiresAction: "CONNECT_STRIPE_ACCOUNT",
        heldEarningId: held.id,
      };
    }

    if (!user.isVerified) {
      this.totalBlocked++;
      const held = this.holdEarnings(userId, amountUsd, "KYC_INCOMPLETE", transactionType, dealRef);
      this.logAudit("payout_held", userId, "KYC_INCOMPLETE", { amountUsd, heldId: held.id });

      return {
        approved: false,
        reason: "KYC_INCOMPLETE",
        message: "Complete identity verification to unlock your earnings",
        requiresAction: "COMPLETE_KYC",
        heldEarningId: held.id,
      };
    }

    this.logAudit("payout_approved", userId, "APPROVED", { amountUsd, transactionType, stripeConnectId: wallet.stripeConnectId });
    return { approved: true, message: "Payout eligible — proceeding with Stripe Connect transfer" };
  }

  enforcePayoutMethod(method: string): { allowed: boolean; violation?: string } {
    const normalized = method.toLowerCase().replace(/[\s-]/g, "_");

    for (const forbidden of FORBIDDEN_PATTERNS) {
      if (normalized.includes(forbidden)) {
        this.logAudit("forbidden_method_blocked", 0, "FORBIDDEN_PAYOUT_METHOD", { method, pattern: forbidden });
        logger.warn({ method, pattern: forbidden }, "[fintech-guard] FORBIDDEN payout method blocked");
        return {
          allowed: false,
          violation: `Payout method "${method}" is strictly prohibited. All payouts must flow through Stripe Connect.`,
        };
      }
    }

    const allowedMethods = ["stripe_connect_transfer", "stripe_destination_charge", "stripe_separate_transfer"];
    if (!allowedMethods.some(m => normalized.includes(m.replace(/[\s-]/g, "_")))) {
      return {
        allowed: false,
        violation: `Payout method "${method}" is not recognized. Only Stripe Connect flows are permitted.`,
      };
    }

    return { allowed: true };
  }

  holdEarnings(
    userId: number,
    amountUsd: number,
    reason: PayoutBlockReason,
    transactionType: string,
    dealRef?: string,
  ): HeldEarning {
    const held: HeldEarning = {
      id: `HELD-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      userId,
      amountUsd,
      reason,
      status: reason === "NO_STRIPE_CONNECT" ? "HELD_PENDING_CONNECT" : reason === "KYC_INCOMPLETE" ? "HELD_PENDING_KYC" : "HELD_FRAUD_REVIEW",
      notificationSent: false,
      dealRef,
      transactionType,
      createdAt: Date.now(),
      proofHash: crypto.createHash("sha256")
        .update(`${ARCHITECT_SEAL}::${userId}::${amountUsd}::${reason}::${Date.now()}`)
        .digest("hex"),
    };

    this.heldEarnings.set(held.id, held);

    eventBus.emit("agent.action", {
      type: "agent.action" as const,
      source: "fintech-compliance-guard",
      payload: {
        event: "earnings_held",
        userId,
        amountUsd,
        reason,
        heldId: held.id,
      },
      ts: new Date().toISOString(),
    });

    logger.info({ heldId: held.id, userId, amountUsd, reason }, "[fintech-guard] Earnings held");
    return held;
  }

  async releaseHeldEarnings(heldId: string): Promise<{ success: boolean; message: string }> {
    const held = this.heldEarnings.get(heldId);
    if (!held) return { success: false, message: "Held earning record not found" };

    if (held.status === "RELEASED" || held.status === "DISTRIBUTED") {
      return { success: false, message: "Earnings already released" };
    }

    const validation = await this.validatePayoutEligibility(held.userId, held.amountUsd, held.transactionType);
    if (!validation.approved) {
      return { success: false, message: validation.message };
    }

    held.status = "RELEASED";
    held.releasedAt = Date.now();
    this.totalReleased++;

    this.logAudit("earnings_released", held.userId, "RELEASED", { heldId, amountUsd: held.amountUsd });

    eventBus.emit("agent.action", {
      type: "agent.action" as const,
      source: "fintech-compliance-guard",
      payload: {
        event: "earnings_released",
        userId: held.userId,
        amountUsd: held.amountUsd,
        heldId,
      },
      ts: new Date().toISOString(),
    });

    return { success: true, message: `$${held.amountUsd.toFixed(2)} released for payout via Stripe Connect` };
  }

  getHeldEarningsForUser(userId: number): HeldEarning[] {
    return Array.from(this.heldEarnings.values())
      .filter(h => h.userId === userId && h.status !== "RELEASED" && h.status !== "DISTRIBUTED")
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getTotalHeldAmount(): number {
    let total = 0;
    for (const h of this.heldEarnings.values()) {
      if (h.status !== "RELEASED" && h.status !== "DISTRIBUTED") total += h.amountUsd;
    }
    return total;
  }

  private emitEarningsReadyNotification(userId: number, amountUsd: number): void {
    eventBus.emit("agent.action", {
      type: "agent.action" as const,
      source: "fintech-compliance-guard",
      payload: {
        event: "earnings_ready_notification",
        userId,
        amountUsd,
        message: "You have earnings ready — connect your account to receive payout",
        action: "ONE_TAP_STRIPE_CONNECT",
      },
      ts: new Date().toISOString(),
    });
  }

  private logAudit(action: string, userId: number, result: string, details: Record<string, unknown>): void {
    this.auditLog.push({ ts: new Date().toISOString(), action, userId, result, details });
    if (this.auditLog.length > this.maxAuditLog) {
      this.auditLog = this.auditLog.slice(-Math.floor(this.maxAuditLog * 0.8));
    }
  }

  getDashboard(): {
    architect: string;
    protocol: string;
    version: string;
    status: string;
    uptime: number;
    totalValidations: number;
    totalBlocked: number;
    totalReleased: number;
    blockRate: number;
    totalHeldEarnings: number;
    totalHeldAmountUsd: number;
    forbiddenPatterns: string[];
    allowedPayoutMethods: string[];
    recentAudit: Array<{ ts: string; action: string; userId: number; result: string }>;
    heldByReason: Record<string, number>;
  } {
    const heldByReason: Record<string, number> = {};
    let totalHeldCount = 0;
    for (const h of this.heldEarnings.values()) {
      if (h.status !== "RELEASED" && h.status !== "DISTRIBUTED") {
        heldByReason[h.reason] = (heldByReason[h.reason] || 0) + 1;
        totalHeldCount++;
      }
    }

    return {
      architect: "Ronald Antonio Cadet",
      protocol: "Fintech Compliance Guard",
      version: "1.0.0",
      status: "ARMED",
      uptime: Date.now() - this.startedAt,
      totalValidations: this.totalValidations,
      totalBlocked: this.totalBlocked,
      totalReleased: this.totalReleased,
      blockRate: this.totalValidations > 0
        ? Number((this.totalBlocked / this.totalValidations * 100).toFixed(1))
        : 0,
      totalHeldEarnings: totalHeldCount,
      totalHeldAmountUsd: Number(this.getTotalHeldAmount().toFixed(2)),
      forbiddenPatterns: [...FORBIDDEN_PATTERNS],
      allowedPayoutMethods: ["Stripe Connect Transfer", "Stripe Destination Charge", "Stripe Separate Transfer"],
      recentAudit: this.auditLog.slice(-20).reverse().map(a => ({
        ts: a.ts,
        action: a.action,
        userId: a.userId,
        result: a.result,
      })),
      heldByReason,
    };
  }

  genesis(): void {
    console.log(`[FINTECH COMPLIANCE GUARD] 🔒 Payout validation ARMED — ${FORBIDDEN_PATTERNS.length} forbidden patterns blocked, Stripe-only enforcement, earnings-hold system active — Architect: Ronald Antonio Cadet`);
  }
}

export const fintechGuard = new FintechComplianceGuard();
