/**
 * authz-middleware.ts
 *
 * Role-aware authorization middleware.
 * Always chain after requireAuth so res.locals.session is populated.
 *
 * Usage:
 *   app.get('/admin', requireAuth, requireRole('admin'), handler)
 *   app.get('/creator', requireAuth, requireRole('artist', 'admin'), handler)
 */
import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "@chordially/types";
import { getUserById } from "./auth-store.js";
import type { AuthSession } from "@chordially/types";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = res.locals["session"] as AuthSession | undefined;
    if (!session) {
      res.status(401).json({ error: "INVALID_SESSION", message: "Authentication required." });
      return;
    }

    const user = getUserById(session.userId);
    if (!user) {
      res.status(401).json({ error: "INVALID_SESSION", message: "User not found." });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Requires one of: ${roles.join(", ")}.`,
      });
      return;
    }

    res.locals["user"] = user;
    next();
  };
}
