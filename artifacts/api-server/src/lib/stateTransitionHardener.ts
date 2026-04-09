/**
 * 3C ONYX — State Transition Hardener
 * Architect: Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC
 * FINGERPRINT: 3CONYX-RAC-STATE-HARDENER-SOVEREIGN
 *
 * Enforces strict state transition validation across every domain in the ONYX
 * ecosystem. No state can skip steps, go backwards illegally, or be forced
 * into an invalid configuration. Every valid transition is architect-signed
 * and cryptographically sealed in the proof chain.
 *
 * This is the "Institutional Viability" layer — the component that makes
 * the system "Unbreakable" for private equity or global OEM partnerships.
 *
 * Domains enforced:
 *   - Deal lifecycle (REQUESTED → PROCESSING → ACTION_REQUIRED → COMPLETED → FAILED)
 *   - Agent tasks (pending → assigned → running → complete → failed → handed_off)
 *   - Engagement funnel (COLD → CURIOUS → WARM → HOT → CLOSING → CLOSED)
 *   - KYC verification
 *   - Transaction settlement
 *   - Runner missions
 */

import crypto from "crypto";
import { logger } from "./logger";

const ARCHITECT = "Ronald Antonio Cadet";
const SOVEREIGN = "CUXTOMCANDYCLUB LLC";
const HARDENER_VERSION = "1.0.0";
const HMAC_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "3CONYX-STATE-HARDENER";

type TransitionMap = Record<string, string[]>;

const DOMAIN_TRANSITIONS: Record<string, TransitionMap> = {
  deal: {
    DRAFT:            ["REQUESTED"],
    REQUESTED:        ["PROCESSING", "FAILED", "CANCELLED"],
    PROCESSING:       ["ACTION_REQUIRED", "COMPLETED", "FAILED"],
    ACTION_REQUIRED:  ["PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
    COMPLETED:        ["REFUNDED"],
    FAILED:           ["REQUESTED"],
    CANCELLED:        [],
    REFUNDED:         [],
  },

  agent_task: {
    pending:    ["assigned", "failed"],
    assigned:   ["running", "failed", "handed_off"],
    running:    ["complete", "failed", "handed_off"],
    complete:   [],
    failed:     ["pending"],
    handed_off: ["assigned", "running"],
  },

  engagement: {
    COLD:     ["CURIOUS"],
    CURIOUS:  ["WARM", "COLD"],
    WARM:     ["HOT", "CURIOUS", "AT_RISK"],
    HOT:      ["CLOSING", "WARM", "AT_RISK"],
    CLOSING:  ["CLOSED", "HOT", "AT_RISK"],
    CLOSED:   ["RETAINED"],
    RETAINED: ["AT_RISK"],
    AT_RISK:  ["SAVED", "COLD"],
    SAVED:    ["RETAINED", "WARM"],
  },

  kyc: {
    REQUESTED:        ["PROCESSING", "FAILED"],
    PROCESSING:       ["ACTION_REQUIRED", "COMPLETED", "FAILED"],
    ACTION_REQUIRED:  ["PROCESSING", "COMPLETED", "FAILED"],
    COMPLETED:        [],
    FAILED:           ["REQUESTED"],
  },

  transaction: {
    PENDING:   ["COMPLETED", "FAILED"],
    COMPLETED: ["REFUNDED", "DISPUTED"],
    FAILED:    ["PENDING"],
    REFUNDED:  [],
    DISPUTED:  ["COMPLETED", "REFUNDED"],
  },

  runner_mission: {
    DISPATCHED:       ["EN_ROUTE", "CANCELLED"],
    EN_ROUTE:         ["ARRIVED", "CANCELLED"],
    ARRIVED:          ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS:      ["COMPLETED", "FAILED"],
    COMPLETED:        [],
    FAILED:           ["DISPATCHED"],
    CANCELLED:        [],
  },

  logistics: {
    REQUESTED:   ["QUOTED", "CANCELLED"],
    QUOTED:      ["BOOKED", "CANCELLED"],
    BOOKED:      ["PICKED_UP", "CANCELLED"],
    PICKED_UP:   ["IN_TRANSIT"],
    IN_TRANSIT:  ["DELIVERED", "DELAYED"],
    DELAYED:     ["IN_TRANSIT", "DELIVERED"],
    DELIVERED:   ["CONFIRMED"],
    CONFIRMED:   [],
    CANCELLED:   [],
  },
};

export interface TransitionResult {
  valid: boolean;
  domain: string;
  from: string;
  to: string;
  reason?: string;
  transitionHash: string;
  architect: string;
  timestamp: string;
}

function signTransition(domain: string, from: string, to: string, valid: boolean): string {
  const payload = `${ARCHITECT}|${domain}|${from}→${to}|${valid}|${Date.now()}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex").slice(0, 24);
}

export function validateTransition(domain: string, from: string, to: string): TransitionResult {
  const transitions = DOMAIN_TRANSITIONS[domain];
  const timestamp = new Date().toISOString();

  if (!transitions) {
    const hash = signTransition(domain, from, to, false);
    logger.warn({ domain, from, to, hash }, "[state-hardener] Unknown domain");
    return {
      valid: false,
      domain,
      from,
      to,
      reason: `Unknown domain: ${domain}`,
      transitionHash: hash,
      architect: ARCHITECT,
      timestamp,
    };
  }

  const allowedTargets = transitions[from];
  if (!allowedTargets) {
    const hash = signTransition(domain, from, to, false);
    logger.warn({ domain, from, to, hash }, "[state-hardener] Unknown source state");
    return {
      valid: false,
      domain,
      from,
      to,
      reason: `Unknown source state '${from}' in domain '${domain}'`,
      transitionHash: hash,
      architect: ARCHITECT,
      timestamp,
    };
  }

  if (!allowedTargets.includes(to)) {
    const hash = signTransition(domain, from, to, false);
    logger.warn({ domain, from, to, allowed: allowedTargets, hash }, "[state-hardener] BLOCKED illegal transition");
    return {
      valid: false,
      domain,
      from,
      to,
      reason: `Transition ${from} → ${to} is not allowed in domain '${domain}'. Valid targets: [${allowedTargets.join(", ")}]`,
      transitionHash: hash,
      architect: ARCHITECT,
      timestamp,
    };
  }

  const hash = signTransition(domain, from, to, true);
  logger.debug({ domain, from, to, hash }, "[state-hardener] Transition validated");
  return {
    valid: true,
    domain,
    from,
    to,
    transitionHash: hash,
    architect: ARCHITECT,
    timestamp,
  };
}

export function enforceTransition(domain: string, from: string, to: string): void {
  const result = validateTransition(domain, from, to);
  if (!result.valid) {
    throw new StateTransitionError(result);
  }
}

export class StateTransitionError extends Error {
  public result: TransitionResult;
  constructor(result: TransitionResult) {
    super(`[STATE HARDENER] Illegal transition blocked: ${result.domain} ${result.from} → ${result.to}. ${result.reason}`);
    this.name = "StateTransitionError";
    this.result = result;
  }
}

export function getValidTransitions(domain: string, currentState: string): string[] {
  const transitions = DOMAIN_TRANSITIONS[domain];
  if (!transitions) return [];
  return transitions[currentState] || [];
}

export function getDomainStates(domain: string): string[] {
  const transitions = DOMAIN_TRANSITIONS[domain];
  if (!transitions) return [];
  return Object.keys(transitions);
}

export function getHardenerStatus() {
  const domains = Object.keys(DOMAIN_TRANSITIONS);
  const totalStates = domains.reduce((acc, d) => acc + Object.keys(DOMAIN_TRANSITIONS[d]).length, 0);
  const totalTransitions = domains.reduce((acc, d) => {
    return acc + Object.values(DOMAIN_TRANSITIONS[d]).reduce((a, t) => a + t.length, 0);
  }, 0);

  return {
    version: HARDENER_VERSION,
    domains: domains.length,
    totalStates,
    totalTransitions,
    domainList: domains.map(d => ({
      name: d,
      states: Object.keys(DOMAIN_TRANSITIONS[d]).length,
      transitions: Object.values(DOMAIN_TRANSITIONS[d]).reduce((a, t) => a + t.length, 0),
    })),
    architect: ARCHITECT,
    entity: SOVEREIGN,
    status: "ARMED",
  };
}
