import rateLimit, { type RateLimitExceededEventHandler } from "express-rate-limit";

const json429: RateLimitExceededEventHandler = (_req, res) =>
  res.status(429).json({
    error: "Too many requests. Please slow down.",
    code: "RATE_LIMITED",
    retryAfter: "60s",
  });

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: json429,
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});
