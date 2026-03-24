import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, extractBearerToken, type TokenPayload } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token =
    extractBearerToken(req.headers.authorization) ??
    (req.cookies?.token as string | undefined);

  if (!token) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    req.user = await verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token =
    extractBearerToken(req.headers.authorization) ??
    (req.cookies?.token as string | undefined);

  if (token) {
    try {
      req.user = await verifyToken(token);
    } catch {
      // silently ignore — caller decides how to handle unauthenticated state
    }
  }
  next();
}
