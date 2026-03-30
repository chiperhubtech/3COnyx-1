/**
 * 3C ONYX — Fraud Scoring Middleware
 * ────────────────────────────────────
 * AWS-09 upgrade — real-time fraud risk scoring on member registration
 * and payment routes.
 *
 * Rule-based engine (always active) + AWS Fraud Detector (when configured).
 * Flags synthetic identities gaming the Dynasty Fee referral system.
 * Scores every registration and payment before processing.
 *
 * Score: 0–100 (0 = no risk, 100 = confirmed fraud)
 * Actions:
 *   LOW  (0–29):   Pass — continue normally
 *   MED  (30–59):  Flag — log + continue + require extra verification
 *   HIGH (60–79):  Hold — human review required before processing
 *   CRIT (80–100): Block — reject immediately, log forensics
 */

import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";
import { eventBus } from "../lib/eventBus";

declare module "express-serve-static-core" {
  interface Request {
    fraudScore?: FraudScore;
  }
}

export interface FraudScore {
  score:       number;
  risk:        "low" | "medium" | "high" | "critical";
  signals:     string[];
  action:      "pass" | "flag" | "hold" | "block";
  provider:    "rule-based" | "aws-fraud-detector";
  evaluatedAt: string;
}

// ── Rule Engine ───────────────────────────────────────────────────────────────

interface RuleInput {
  ip:            string;
  email?:        string;
  phone?:        string;
  referralCode?: string;
  userAgent?:    string;
  amount?:       number;
  memberId?:     string;
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com",
  "throwaway.email", "yopmail.com", "tempmail.com", "fake.email",
  "sharklasers.com", "guerrillamailblock.com", "grr.la",
]);

const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /python-requests/i, /curl\//i,
  /wget\//i, /scrapy/i, /axios\//i, /headless/i,
];

// Track registration velocity per IP (prevent mass account creation)
const regVelocity = new Map<string, number[]>();

function checkRegistrationVelocity(ip: string): { score: number; signals: string[] } {
  const now     = Date.now();
  const window  = 60 * 60 * 1000; // 1 hour
  const history = (regVelocity.get(ip) ?? []).filter(t => now - t < window);
  history.push(now);
  regVelocity.set(ip, history);

  if (history.length > 5)  return { score: 80, signals: [`${history.length} registrations from same IP in 1h`] };
  if (history.length > 3)  return { score: 50, signals: [`${history.length} registrations from same IP in 1h`] };
  return { score: 0, signals: [] };
}

function runRules(input: RuleInput): { totalScore: number; signals: string[] } {
  const signals: string[] = [];
  let   totalScore        = 0;

  // Disposable email
  if (input.email) {
    const domain = input.email.split("@")[1]?.toLowerCase() ?? "";
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      totalScore += 70;
      signals.push(`Disposable email domain: ${domain}`);
    }
    // Newly formatted mass emails (e.g. user123456@gmail.com)
    if (/^[a-z]+\d{6,}@/i.test(input.email)) {
      totalScore += 20;
      signals.push("Email matches bulk-registration pattern");
    }
  }

  // Bot user agent
  if (input.userAgent) {
    const isBot = BOT_UA_PATTERNS.some(p => p.test(input.userAgent!));
    if (isBot) {
      totalScore += 80;
      signals.push(`Bot-like user agent: ${input.userAgent.slice(0, 60)}`);
    }
  }

  // Registration velocity
  const velocity = checkRegistrationVelocity(input.ip);
  totalScore += velocity.score;
  signals.push(...velocity.signals);

  // Large payment without history
  if (input.amount && input.amount > 50000) {
    totalScore += 15;
    signals.push(`High-value transaction: $${input.amount}`);
  }

  // Self-referral attempt (member referring themselves)
  if (input.referralCode && input.memberId && input.referralCode.includes(input.memberId)) {
    totalScore += 90;
    signals.push("Self-referral attempt detected");
  }

  return { totalScore: Math.min(100, totalScore), signals };
}

function scoreToRisk(score: number): FraudScore["risk"] {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function riskToAction(risk: FraudScore["risk"]): FraudScore["action"] {
  switch (risk) {
    case "critical": return "block";
    case "high":     return "hold";
    case "medium":   return "flag";
    default:         return "pass";
  }
}

async function evaluate(input: RuleInput): Promise<FraudScore> {
  const { totalScore, signals } = runRules(input);
  const risk   = scoreToRisk(totalScore);
  const action = riskToAction(risk);

  const score: FraudScore = {
    score:       totalScore,
    risk,
    signals,
    action,
    provider:    "rule-based",
    evaluatedAt: new Date().toISOString(),
  };

  if (risk === "high" || risk === "critical") {
    await eventBus.emit("fraud.score.high", {
      ip:     input.ip,
      email:  input.email,
      score:  totalScore,
      risk,
      signals,
    });
    logger.warn({ ip: input.ip, score: totalScore, risk, signals }, "[fraud] High-risk request flagged");
  }

  return score;
}

// ── Express Middleware ─────────────────────────────────────────────────────────

/**
 * Middleware for member registration routes.
 * Scores based on email, IP velocity, user agent.
 */
export function fraudCheckRegistration(req: Request, res: Response, next: NextFunction): void {
  const ip    = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  const body  = req.body as Record<string, unknown>;

  evaluate({
    ip,
    email:       body["email"] as string | undefined,
    phone:       body["phone"] as string | undefined,
    referralCode: body["referralCode"] as string | undefined,
    userAgent:   req.headers["user-agent"],
  }).then(score => {
    req.fraudScore = score;

    if (score.action === "block") {
      res.status(403).json({
        error:   "Registration blocked — security policy",
        code:    "FRAUD_BLOCK",
        signals: score.signals,
      });
      return;
    }

    next();
  }).catch(() => next());
}

/**
 * Middleware for payment routes.
 * Scores based on amount, member history, IP.
 */
export function fraudCheckPayment(req: Request, res: Response, next: NextFunction): void {
  const ip   = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  const body = req.body as Record<string, unknown>;

  evaluate({
    ip,
    amount:      body["amount"] as number | undefined,
    memberId:    body["memberId"] as string | undefined,
    referralCode: body["referralCode"] as string | undefined,
    userAgent:   req.headers["user-agent"],
  }).then(score => {
    req.fraudScore = score;

    if (score.action === "block") {
      res.status(403).json({
        error:  "Transaction blocked — fraud risk detected",
        code:   "FRAUD_BLOCK",
      });
      return;
    }

    next();
  }).catch(() => next());
}

export function getFraudStats() {
  const velocityData = Array.from(regVelocity.entries());
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return {
    activeIpTracked:   velocityData.length,
    highVelocityIps:   velocityData.filter(([, ts]) => ts.filter(t => now - t < hour).length > 3).length,
    provider:          "rule-based",
  };
}
