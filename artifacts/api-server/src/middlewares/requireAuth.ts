import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, extractBearerToken, type TokenPayload } from "../lib/jwt";
import { isTokenRevoked } from "../lib/tokenBlacklist";

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

  let payload: TokenPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
    return;
  }

  // Check token blacklist (revoked on logout)
  if (payload.jti && await isTokenRevoked(payload.jti)) {
    res.status(401).json({ error: "Token has been revoked. Please log in again.", code: "TOKEN_REVOKED" });
    return;
  }

  req.user = payload;
  next();
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
      const payload = await verifyToken(token);
      if (!payload.jti || !(await isTokenRevoked(payload.jti))) {
        req.user = payload;
      }
    } catch {
      // silently ignore — caller decides how to handle unauthenticated state
    }
  }
  next();
}
