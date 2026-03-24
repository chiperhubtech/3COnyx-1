import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import webhookRouter from "./routes/webhooks";
import { logger } from "./lib/logger";
import { auditMiddleware } from "./lib/auditMiddleware";
import { requestTimeout } from "./middlewares/timeout";
import { generalLimiter, authLimiter } from "./middlewares/rateLimiter";

const app: Express = express();

// Trust reverse proxy (Replit/AWS ALB) for rate limiting and IP detection
app.set("trust proxy", 1);

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const rawOrigins    = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins ? rawOrigins.split(",").map((o) => o.trim()) : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not permitted`));
    },
    credentials: true,
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

// ── Stripe Webhooks — MUST be before body parsers (needs raw body) ────────────
// Stripe requires the raw body buffer to verify webhook signatures.
app.use("/api/webhooks/stripe", (req: Request, res: Response, next: NextFunction) => {
  let raw = Buffer.alloc(0);
  req.on("data", (chunk: Buffer) => { raw = Buffer.concat([raw, chunk]); });
  req.on("end", () => { req.body = raw; next(); });
});
app.use("/api/webhooks", webhookRouter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

// ── Per-request timeout (15 s) ────────────────────────────────────────────────
app.use(requestTimeout(15_000));

// ── Audit + Routes ────────────────────────────────────────────────────────────
app.use(auditMiddleware);
app.use("/api", router);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND", ts: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────
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
