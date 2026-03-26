import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import webhookRouter from "./routes/webhooks";
import { logger } from "./lib/logger";
import { auditMiddleware } from "./lib/auditMiddleware";
import { requestTimeout } from "./middlewares/timeout";
import { generalLimiter, authLimiter } from "./middlewares/rateLimiter";
import { sanitizeInputs } from "./middlewares/sanitize";
import { pruneExpiredBlacklistEntries } from "./lib/tokenBlacklist";

const app: Express = express();

// Trust reverse proxy (Replit/AWS ALB/Cloudflare) for rate limiting and IP detection
app.set("trust proxy", 1);

// ── Compression — gzip/brotli all responses (reduces bandwidth 60-80% at scale) ──
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'", "https://api.stripe.com", "https://js.stripe.com"],
      frameSrc:       ["'self'", "https://js.stripe.com"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge:            63072000,
    includeSubDomains: true,
    preload:           true,
  },
  referrerPolicy:             { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  xContentTypeOptions:        true,
  xFrameOptions:              { action: "deny" },
}));

// ── Nightly cleanup: prune expired blacklist entries on startup ───────────────
void pruneExpiredBlacklistEntries().catch(() => { /* non-fatal */ });

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

// ── Input sanitization (XSS / injection prevention) ──────────────────────────
app.use(sanitizeInputs);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

// ── Per-request timeout (15 s) ────────────────────────────────────────────────
app.use(requestTimeout(15_000));

// ── CDN / Cache headers ───────────────────────────────────────────────────────
// Public read routes get short CDN cache; mutations / auth routes remain private
app.use((req: Request, res: Response, next: NextFunction) => {
  const isPublicReadRoute =
    req.method === "GET" &&
    /^\/(vin\/passport|bay\/slots)/.test(req.path.replace(/^\/api\//, ""));
  if (isPublicReadRoute) {
    res.set("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=30");
    res.set("CDN-Cache-Control", "public, max-age=120");
    res.set("Surrogate-Control",  "max-age=120");
  } else {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }
  next();
});

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
