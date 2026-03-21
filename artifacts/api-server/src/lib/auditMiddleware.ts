// SOC2 audit middleware — fires after every request, non-blocking
import type { Request, Response, NextFunction } from "express";
import { writeAudit } from "./auditService";

const SKIP_PATHS = new Set(["/api/health", "/api/audit/logs"]); // avoid infinite loops

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const path = req.path;
    if (SKIP_PATHS.has(path)) return;

    const statusCode = res.statusCode;
    const method = req.method;

    // Derive event type from path
    let eventType: Parameters<typeof writeAudit>[0]["eventType"] = "API_CALL";
    let action = `${method} ${path}`;

    if (path.includes("/auth") || path.includes("/login") || path.includes("/session")) {
      eventType = "AUTH";
      action = statusCode < 400 ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
    } else if (path.includes("/wallet/payout")) {
      eventType = "PAYOUT";
      action = "MEMBER_SLICE_PAYOUT";
    } else if (path.includes("/delivery/verify")) {
      eventType = "DELIVERY";
      action = "QR_DELIVERY_VERIFIED";
    } else if (path.includes("/delivery/generate")) {
      eventType = "DELIVERY";
      action = "QR_TOKEN_GENERATED";
    } else if (path.includes("/wallet/connect")) {
      eventType = "PAYOUT";
      action = "STRIPE_CONNECT_ONBOARD";
    } else if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
      eventType = "DB_CHANGE";
      action = `${method}_${path.split("/").filter(Boolean).join("_").toUpperCase()}`;
    }

    const severity: Parameters<typeof writeAudit>[0]["severity"] =
      statusCode >= 500 ? "CRIT" :
      statusCode >= 400 ? "WARN" : "INFO";

    // Extract masked actor hint from header (if set by auth layer later)
    const actorHint = (req.headers["x-actor-id"] as string) ?? null;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress;

    writeAudit({
      eventType,
      action,
      actorId: actorHint,
      actorRole: "System",
      path,
      method,
      statusCode,
      severity,
      metadata: {
        durationMs: Date.now() - startedAt,
        contentLength: res.getHeader("content-length"),
      },
      ip,
    });
  });

  next();
}
