/**
 * 3C Onyx — Input Sanitization Middleware
 * Strips XSS payloads and dangerous characters from string fields in
 * request body, query, and params before they reach route handlers.
 * Applied globally so every endpoint is protected without per-route code.
 */
import { type Request, type Response, type NextFunction } from "express";

const DANGEROUS = /<\s*(script|iframe|object|embed|form|svg|img|link|meta|base|style)[^>]*>/gi;
const ON_EVENT  = /\bon\w+\s*=/gi;
const JS_PROTO  = /javascript\s*:/gi;
const DATA_PROTO = /data\s*:/gi;
const NULL_BYTE  = /\x00/g;
const SQL_INJECT = /('|--|;\s*(drop|alter|insert|delete|update|exec|union)\s)/gi;

function sanitizeString(value: string): string {
  return value
    .replace(NULL_BYTE,   "")
    .replace(DANGEROUS,   "")
    .replace(ON_EVENT,    "")
    .replace(JS_PROTO,    "")
    .replace(DATA_PROTO,  "")
    .replace(SQL_INJECT,  "");
}

function sanitizeValue(val: unknown): unknown {
  if (typeof val === "string") return sanitizeString(val);
  if (Array.isArray(val))      return val.map(sanitizeValue);
  if (val !== null && typeof val === "object") return sanitizeObject(val as Record<string, unknown>);
  return val;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  // Skip raw body routes (e.g. Stripe webhooks that need the original bytes)
  if (req.path.startsWith("/webhooks")) { next(); return; }

  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  // req.query is a read-only getter on IncomingMessage — mutate keys in-place
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      const v = req.query[key];
      if (typeof v === "string") {
        req.query[key] = sanitizeString(v);
      } else if (Array.isArray(v)) {
        req.query[key] = v.map(item => (typeof item === "string" ? sanitizeString(item) : item)) as typeof v;
      }
    }
  }
  next();
}
