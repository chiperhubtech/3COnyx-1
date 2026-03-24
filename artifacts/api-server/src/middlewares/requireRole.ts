import { type Request, type Response, type NextFunction } from "express";

type Role = "Member" | "Dealer" | "Runner" | "Specialist" | "Admin";

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
      return;
    }
    if (!roles.includes(req.user.role as Role)) {
      res.status(403).json({
        error: `Access restricted to: ${roles.join(", ")}`,
        code: "FORBIDDEN",
        yourRole: req.user.role,
      });
      return;
    }
    next();
  };
}
