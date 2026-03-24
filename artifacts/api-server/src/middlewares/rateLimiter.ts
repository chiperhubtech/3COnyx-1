// @ts-nocheck
import rateLimit from "express-rate-limit";

const json429 = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
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
  handler: json429 as Parameters<typeof rateLimit>[0]["handler"],
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: undefined,
  handler: json429 as Parameters<typeof rateLimit>[0]["handler"],
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429 as Parameters<typeof rateLimit>[0]["handler"],
});
