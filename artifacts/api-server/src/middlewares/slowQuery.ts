/**
 * Slow Response Tracking — logs structured warnings whenever a request
 * exceeds the slow threshold so we can target optimization without
 * having to manually instrument every route.
 */
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const DEFAULT_SLOW_MS = Number(process.env.SLOW_REQUEST_MS || 500);

export function slowQueryTracker(thresholdMs = DEFAULT_SLOW_MS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration >= thresholdMs) {
        logger.warn({
          component: "slow_request",
          method: req.method,
          path: req.path,
          route: req.route?.path,
          status: res.statusCode,
          durationMs: duration,
          query: req.query,
        }, `[SLOW] ${req.method} ${req.path} took ${duration}ms`);
      }
    });
    next();
  };
}
