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
import { generalLimiter, authLimiter, strictLimiter, adminLimiter } from "./middlewares/rateLimiter";
import { sanitizeInputs } from "./middlewares/sanitize";
import { scannerDetector } from "./middlewares/scannerDetector";
import { pruneExpiredBlacklistEntries } from "./lib/tokenBlacklist";
import { isOwnedOrigin } from "./lib/domainConfig";
import { sovereigntyMiddleware } from "./middlewares/sovereignty";
import { logSovereigntyDeclaration } from "./lib/honeyToken";
import { ipGuard } from "./middlewares/ipGuard";

// ── Sovereignty Declaration — logged at every boot ────────────────────────────
logSovereigntyDeclaration();

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
    maxAge:            63072000,     // 2 years
    includeSubDomains: true,
    preload:           true,
  },
  referrerPolicy:               { policy: "strict-origin-when-cross-origin" },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  xContentTypeOptions:          true,
  xFrameOptions:                { action: "deny" },
}));

// ── Permissions-Policy — disable hardware sensor APIs from web context ────────
// Prevents rogue scripts from accessing camera, mic, gyro, etc.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), gyroscope=(), accelerometer=(), magnetometer=()",
  );
  next();
});

// ── Sovereignty — stamp every response with owner fingerprint ─────────────────
app.use(sovereigntyMiddleware);

// ── CORS ──────────────────────────────────────────────────────────────────────
const rawOrigins     = process.env.ALLOWED_ORIGINS;
const isProduction   = process.env.NODE_ENV === "production";
const allowedOrigins = rawOrigins ? rawOrigins.split(",").map((o) => o.trim()) : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = same-origin / server-to-server — always allow
      if (!origin) return callback(null, true);
      // In production without explicit ALLOWED_ORIGINS, lock to owned domains
      if (isProduction && allowedOrigins.length === 0) {
        if (isOwnedOrigin(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin '${origin}' not permitted in production`));
      }
      if (allowedOrigins.length === 0) return callback(null, true); // dev: open
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not permitted`));
    },
    credentials: true,
  }),
);

// ── Logging (sanitized — no auth headers in logs) ────────────────────────────
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        id:     req.id,
        method: req.method,
        url:    req.url?.split("?")[0],
        // Deliberately omit Authorization header from logs
      };
    },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

// ── Scanner / reconnaissance detector ─────────────────────────────────────────
// Blocks any IP that probes 10+ distinct 404 paths in 60 seconds
app.use(scannerDetector);

// ── IP Guard — Autonomous threat detection + auto-ban ─────────────────────────
// Tracks failed auths, scanner probes, rate limit hits per IP
// Progressive penalties: temp ban → permanent ban — no human needed
app.use(ipGuard);

// ── Stripe Webhooks — MUST be before body parsers (needs raw body) ────────────
app.use("/api/webhooks/stripe", (req: Request, res: Response, next: NextFunction) => {
  let raw = Buffer.alloc(0);
  req.on("data", (chunk: Buffer) => { raw = Buffer.concat([raw, chunk]); });
  req.on("end", () => { req.body = raw; next(); });
});
app.use("/api/webhooks", webhookRouter);

// ── Body parsing (auth routes capped at 16KB to prevent oversized payloads) ──
app.use("/api/auth", express.json({ limit: "16kb" }));
app.use("/api/auth", express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ── Input sanitization (XSS / injection prevention) ──────────────────────────
app.use(sanitizeInputs);

// ── Rate limiting — defense-in-depth with route-specific tiers ───────────────
app.use("/api/auth",           authLimiter);    // 15/15min (failed only)
app.use("/api/compliance",     strictLimiter);  // 10/min — PII routes
app.use("/api/kyc",            strictLimiter);  // 10/min — identity verification
app.use("/api/bay/transact",   strictLimiter);  // 10/min — payment execution
app.use("/api/command/admin",  adminLimiter);   // 5/min  — admin operations
app.use("/api",                generalLimiter); // 200/15min — everything else

// ── Per-request timeout (15 s) ────────────────────────────────────────────────
app.use(requestTimeout(15_000));

// ── CDN / Cache headers ───────────────────────────────────────────────────────
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
    // Never expose stack traces or internal messages in production
    message: process.env.NODE_ENV !== "production" ? err.message : undefined,
    ts:      new Date().toISOString(),
  });
});

// ── Startup cleanup: prune expired blacklist entries ─────────────────────────
void pruneExpiredBlacklistEntries().catch(() => { /* non-fatal */ });

export default app;
