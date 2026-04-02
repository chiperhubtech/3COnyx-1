import { onEvent, eventBus, type OnyxEventType, type OnyxEvent } from "./eventBus";
import { addEntry, type EntryType } from "./chainOfCustody";
import { logger } from "./logger";

const log = logger.child({ module: "paperwork-killer" });

interface CascadeStep {
  trigger: OnyxEventType;
  agent: string;
  action: string;
  downstream: OnyxEventType[];
  blockchainEntry?: EntryType;
  memberNotification?: string;
  proNotification?: string;
}

const S1_S3_CASCADE: CascadeStep[] = [
  {
    trigger: "deal.structured",
    agent: "Finance Agent",
    action: "CreditSweep — pull credit, match lenders, generate pre-approvals",
    downstream: ["agent.task.assigned"],
    blockchainEntry: "ownership",
    memberNotification: "Your deal is being structured — we're matching you with the best lenders now.",
    proNotification: "Deal structured — credit sweep initiated, lender matching in progress.",
  },
  {
    trigger: "member.kyc.passed",
    agent: "Finance Agent",
    action: "LenderMatch — submit to matched lenders for approval decisioning",
    downstream: ["agent.task.running"],
    blockchainEntry: "bgc_verified",
    memberNotification: "Identity verified — lender approvals are being processed.",
    proNotification: "KYC passed — lender submissions queued for matched institutions.",
  },
  {
    trigger: "payment.escrow.created",
    agent: "F&I Agent",
    action: "InsuranceBind — auto-quote insurance, bind coverage on approval",
    downstream: ["agent.task.assigned"],
    memberNotification: "Payment secured — we're getting your insurance quotes now.",
    proNotification: "Escrow created — insurance binding initiated across carriers.",
  },
  {
    trigger: "vehicle.inspection.complete",
    agent: "Service Agent",
    action: "ServicePrep — schedule PDI, detail, and delivery prep",
    downstream: ["runner.dispatched"],
    blockchainEntry: "inspection",
    memberNotification: "Inspection complete — your vehicle is being prepared for delivery.",
    proNotification: "Inspection passed — service prep and detailing scheduled.",
  },
  {
    trigger: "vault.bundle.sealed",
    agent: "Title/Compliance Agent",
    action: "DigitalFunding — seal document vault, submit bank-ready package",
    downstream: ["payment.escrow.released"],
    blockchainEntry: "bol_issued",
    memberNotification: "Documents sealed — funding is being processed. Almost done.",
    proNotification: "Vault sealed — bank-ready package submitted for funding release.",
  },
  {
    trigger: "payment.escrow.released",
    agent: "Runner Agent",
    action: "DeliveryDispatch — assign runner, schedule delivery, track live",
    downstream: ["runner.dispatched"],
    blockchainEntry: "delivery",
    memberNotification: "Funded! Your vehicle is being dispatched for delivery.",
    proNotification: "Escrow released — runner dispatched for vehicle delivery.",
  },
  {
    trigger: "runner.mission.complete",
    agent: "Trust Agent",
    action: "FinalSeal — stamp blockchain, calculate commissions, trigger share prompt",
    downstream: ["referral.settled"],
    blockchainEntry: "transfer",
    memberNotification: "Done. Everything is handled.",
    proNotification: "Mission complete — blockchain sealed, commissions calculated, referral settled.",
  },
  {
    trigger: "vehicle.dvp.stamped",
    agent: "Trust Agent",
    action: "DVPVerification — stamp Digital Vehicle Passport, anchor to chain",
    downstream: [],
    blockchainEntry: "sdv_registration",
    memberNotification: "Your vehicle's Digital Passport is now ONYX Verified.",
    proNotification: "DVP stamped — vehicle identity anchored to ONYX trust ledger.",
  },
  {
    trigger: "referral.created",
    agent: "Growth Agent",
    action: "ReferralActivation — activate bird-dog chain, queue commission on completion",
    downstream: ["referral.chain.activated"],
    memberNotification: "Your referral is active — you'll earn when they complete.",
    proNotification: "Referral chain activated — commission tracking engaged.",
  },
  {
    trigger: "referral.settled",
    agent: "Payout Agent",
    action: "CommissionPayout — calculate splits, execute Stripe transfer, notify earner",
    downstream: ["payment.dynasty_fee.earned"],
    memberNotification: "You earned a commission! Check your ONYX Wallet.",
    proNotification: "Commission settled — Stripe transfer executed, dynasty fee distributed.",
  },
  {
    trigger: "guardian.predictive.alert",
    agent: "Guardian Agent",
    action: "PredictiveResponse — evaluate threat, dispatch roadside if critical, notify member",
    downstream: ["vehicle.alert.guardian"],
    memberNotification: "ONYX detected something — checking your vehicle now.",
    proNotification: "Predictive alert triggered — evaluating threat level and response options.",
  },
  {
    trigger: "node.registered",
    agent: "Partner Agent",
    action: "NodeOnboarding — verify credentials, assign service zone, activate in mesh",
    downstream: ["agent.task.complete"],
    memberNotification: undefined,
    proNotification: "New service node registered — credentials verified, zone assigned, mesh active.",
  },
];

let initialized = false;

export function initPaperworkKiller(): void {
  if (initialized) return;
  initialized = true;

  log.info({
    protocol: "S1-S3 Paperwork Killer",
    cascadeSteps: S1_S3_CASCADE.length,
    architect: "Ronald Antonio Cadet",
    entity: "CUXTOMCANDYCLUB LLC",
  }, "[paperwork-killer] Initialized — zero-manual-coordination protocol active");

  for (const step of S1_S3_CASCADE) {
    onEvent(step.trigger, async (event: OnyxEvent) => {
      const payload = event.payload;
      const traceId = event.traceId ?? `trace-${Date.now()}`;
      const vehicleId = (payload.vehicleId as string) ?? (payload.vin as string) ?? undefined;

      log.info({
        trigger: step.trigger,
        agent: step.agent,
        action: step.action,
        vehicleId,
        traceId,
      }, `[paperwork-killer] CASCADE: ${step.trigger} → ${step.agent}`);

      if (step.blockchainEntry && vehicleId) {
        try {
          await addEntry(
            vehicleId,
            "•••masked•••",
            step.blockchainEntry,
            step.agent,
            "system",
            {
              trigger: step.trigger,
              action: step.action,
              traceId,
              automated: true,
              memberNotification: step.memberNotification,
              proNotification: step.proNotification,
            },
          );
          log.info({ vehicleId, type: step.blockchainEntry }, "[paperwork-killer] Blockchain entry stamped");
        } catch (err) {
          log.error({ err, vehicleId }, "[paperwork-killer] Blockchain stamp failed");
        }
      }

      for (const downstream of step.downstream) {
        try {
          await eventBus.emit(downstream, {
            ...payload,
            triggeredBy: step.trigger,
            agent: step.agent,
            automated: true,
          }, { traceId });
          log.info({ downstream, traceId }, `[paperwork-killer] Downstream emitted: ${downstream}`);
        } catch (err) {
          log.error({ err, downstream }, "[paperwork-killer] Downstream emit failed");
        }
      }
    });
  }
}

export function getCascadeStatus() {
  return {
    protocol: "S1-S3 Paperwork-Killer",
    architect: "Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC",
    status: initialized ? "ACTIVE" : "STANDBY",
    totalSteps: S1_S3_CASCADE.length,
    cascade: S1_S3_CASCADE.map(s => ({
      trigger: s.trigger,
      agent: s.agent,
      action: s.action,
      downstreamCount: s.downstream.length,
      stampsBlockchain: !!s.blockchainEntry,
      memberNotification: s.memberNotification ?? null,
      proNotification: s.proNotification ?? null,
    })),
    philosophy: "SocialClick → CreditSweep → LenderMatch → InsuranceBind → ServicePrep → DigitalFunding. NO manual coordination allowed.",
  };
}
