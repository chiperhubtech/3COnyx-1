import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { auditMiddleware } from "./lib/auditMiddleware";
import { requestTimeout } from "./middlewares/timeout";

const app: Express = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGINS="https://app.3conyx.com,https://admin.3conyx.com"
// Leave unset (or "*") to allow all origins in development.
const rawOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins ? rawOrigins.split(",").map((o) => o.trim()) : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, health checks, server-to-server)
      if (!origin) return callback(null, true);
      // Allow all if no explicit list configured
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not permitted`));
    },
    credentials: true,
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id:     req.id,
          method: req.method,
          url:    req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Per-request timeout (15 s) ────────────────────────────────────────────────
app.use(requestTimeout(15_000));

// ── Audit + Routes ────────────────────────────────────────────────────────────
app.use(auditMiddleware);
app.use("/api", router);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error:   "Not found",
    code:    "NOT_FOUND",
    ts:      new Date().toISOString(),
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Must be last and must have 4 parameters so Express recognises it as an error handler.
// Express 5 automatically forwards thrown errors in async handlers here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled application error");
  if (res.headersSent) return;
  res.status(500).json({
    error:   "Internal server error",
    code:    "INTERNAL_ERROR",
    message: process.env.NODE_ENV !== "production" ? err.message : undefined,
    ts:      new Date().toISOString(),
  });
});

export default app;
