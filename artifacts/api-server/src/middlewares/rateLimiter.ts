import rateLimit, { type RateLimitExceededEventHandler } from "express-rate-limit";

const json429: RateLimitExceededEventHandler = (_req, res) =>
  res.status(429).json({
    error: "Too many requests. Please slow down.",
    code: "RATE_LIMITED",
    retryAfter: "60s",
  });

/** General API: 200 requests per 15 minutes per IP */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/** Auth endpoints: 15 attempts per 15 minutes (failed only) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: json429,
  skipSuccessfulRequests: true,
});

/** AI/LLM endpoints: 30 requests per minute */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/**
 * Strict limiter for payment, compliance, and KYC routes.
 * 10 requests per minute per IP — these endpoints touch money and PII.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/**
 * Admin limiter — 5 requests per minute per IP.
 * Admin operations are infrequent; aggressive limiting stops brute-force pivoting.
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});
