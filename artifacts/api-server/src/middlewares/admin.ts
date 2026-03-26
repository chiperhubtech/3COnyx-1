import { type Request, type Response, type NextFunction } from "express";

/**
 * Requires the authenticated user to have the "Admin" role.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  if (req.user.role !== "Admin") {
    res.status(403).json({ error: "Admin access required", code: "FORBIDDEN", yourRole: req.user.role });
    return;
  }
  next();
}
