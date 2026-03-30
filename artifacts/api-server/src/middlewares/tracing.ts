/**
 * 3C ONYX — Distributed Tracing Middleware
 *
 * Implements W3C Trace Context (traceparent / tracestate) headers.
 * Every request gets a trace ID — either propagated from an upstream system
 * (AWS ALB, Cloudflare, API Gateway) or generated fresh.
 *
 * Compatible with: OpenTelemetry, Datadog APM, AWS X-Ray, Jaeger, Grafana Tempo.
 * Zero external dependencies — pure Node.js crypto.
 *
 * Spec: https://www.w3.org/TR/trace-context/
 */
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare module "express-serve-static-core" {
  interface Request {
    traceId:  string;
    spanId:   string;
    parentId: string | null;
  }
}

// W3C traceparent format: 00-{traceId}-{spanId}-{flags}
const TRACEPARENT_RE = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

function generateTraceId(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateSpanId(): string {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Attach tracing middleware to Express.
 * - Parses incoming W3C traceparent header if present
 * - Generates a new trace + span ID if not
 * - Stamps every outgoing response with traceparent and X-Request-ID
 * - Attaches req.traceId, req.spanId, req.parentId for use in logs
 */
export function tracing(req: Request, res: Response, next: NextFunction): void {
  let traceId:  string      = generateTraceId();
  let parentId: string|null = null;
  const spanId = generateSpanId();

  // Parse upstream traceparent if present (ALB, Cloudflare, API Gateway)
  const incoming = req.headers["traceparent"] as string | undefined;
  if (incoming) {
    const match = TRACEPARENT_RE.exec(incoming);
    if (match) {
      traceId  = match[1]!;
      parentId = match[2]!;
    }
  }

  // Also honor AWS X-Ray / Cloudflare Ray-ID as alternate trace roots
  if (!incoming) {
    const xRay   = req.headers["x-amzn-trace-id"]  as string | undefined;
    const cfRay  = req.headers["x-request-id"]      as string | undefined;
    if (xRay || cfRay) {
      // Use as trace context root — do not override our own traceId,
      // just store for correlation in logs
      const external = xRay || cfRay;
      if (external) req.headers["x-upstream-trace"] = external;
    }
  }

  // Attach to request for use in route handlers + logs
  req.traceId  = traceId;
  req.spanId   = spanId;
  req.parentId = parentId;

  // Stamp outgoing response
  const traceparentOut = `00-${traceId}-${spanId}-01`;
  res.setHeader("traceparent",   traceparentOut);
  res.setHeader("X-Request-ID",  traceId);
  res.setHeader("X-Span-ID",     spanId);

  next();
}

/**
 * Returns a structured log context object from the current request.
 * Use in route handlers for consistent log correlation:
 *
 *   logger.info(traceContext(req), "Deal agent invoked");
 */
export function traceContext(req: Request) {
  return {
    traceId:  req.traceId,
    spanId:   req.spanId,
    parentId: req.parentId ?? undefined,
    method:   req.method,
    path:     req.path,
  };
}
