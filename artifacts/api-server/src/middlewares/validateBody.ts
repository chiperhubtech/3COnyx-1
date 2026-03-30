/**
 * 3C ONYX — Zod Request Body Validation Middleware
 *
 * Enforces strict schema validation on all mutation routes (POST, PUT, PATCH).
 * Any request that doesn't match the schema is rejected with a 422 and a
 * human-readable error — never passed to route handlers with unvalidated input.
 *
 * Usage:
 *   import { validateBody } from "../middlewares/validateBody";
 *   import { z } from "zod";
 *
 *   const schema = z.object({ vin: z.string().length(17), ... });
 *   router.post("/lookup", validateBody(schema), handler);
 */
import type { Request, Response, NextFunction } from "express";
import { z, ZodError, type ZodSchema } from "zod";
import { logger } from "../lib/logger";

export interface ValidationError {
  field:   string;
  message: string;
}

function formatZodErrors(err: ZodError): ValidationError[] {
  return err.errors.map((e) => ({
    field:   e.path.join(".") || "root",
    message: e.message,
  }));
}

/**
 * Validates req.body against the provided Zod schema.
 * On failure: returns 422 with structured error list.
 * On success:  replaces req.body with the parsed (sanitized) output.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      logger.warn({
        method: req.method,
        path:   req.path,
        errors,
      }, "Request body validation failed");

      res.status(422).json({
        error:   "Validation failed",
        code:    "INVALID_REQUEST_BODY",
        errors,
        ts:      new Date().toISOString(),
      });
      return;
    }

    // Replace body with Zod-parsed output (strips unknown keys, coerces types)
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against the provided Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(422).json({
        error:   "Invalid query parameters",
        code:    "INVALID_QUERY_PARAMS",
        errors,
        ts:      new Date().toISOString(),
      });
      return;
    }

    // Safe: Zod-validated and typed query params
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}

/**
 * Validates req.params against the provided Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(422).json({
        error:   "Invalid path parameters",
        code:    "INVALID_PATH_PARAMS",
        errors,
        ts:      new Date().toISOString(),
      });
      return;
    }

    (req as Request & { validatedParams: T }).validatedParams = result.data;
    next();
  };
}

// ── Common shared schemas ─────────────────────────────────────────────────
export const VinSchema = z.object({
  vin: z.string().length(17, "VIN must be exactly 17 characters").toUpperCase().regex(
    /^[A-HJ-NPR-Z0-9]{17}$/,
    "Invalid VIN format"
  ),
});

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UuidSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const PhoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (+1234567890)"),
});

export const EmailSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});
