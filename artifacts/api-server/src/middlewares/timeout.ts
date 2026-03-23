import type { Request, Response, NextFunction } from "express";

/**
 * Request timeout middleware.
 * Sends 503 if the handler has not responded within `ms` milliseconds.
 * Safe: skips already-sent responses and cleans up automatically.
 */
export function requestTimeout(ms = 15_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          error: "Request timeout",
          code: "REQUEST_TIMEOUT",
          path: req.path,
          ts: new Date().toISOString(),
        });
      }
    }, ms);
    res.on("finish", () => clearTimeout(timer));
    res.on("close",  () => clearTimeout(timer));
    next();
  };
}
