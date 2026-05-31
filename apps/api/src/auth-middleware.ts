/**
 * auth-middleware.ts
 *
 * Express middleware that validates the Bearer JWT on protected routes.
 * Attaches the active session to res.locals so downstream handlers can use it
 * without re-verifying the token.
 */
import type { NextFunction, Request, Response } from "express";

import { getActiveSession } from "./auth-store.js";
import { verifyAccessToken } from "./token-service.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "INVALID_SESSION", message: "Missing Bearer token." });
    return;
  }

  const token = header.slice(7);

  try {
    verifyAccessToken(token); // throws on tampered / expired tokens
  } catch {
    res.status(401).json({ error: "INVALID_SESSION", message: "Token is invalid or expired." });
    return;
  }

  const session = getActiveSession(token);
  if (!session) {
    res.status(401).json({ error: "INVALID_SESSION", message: "Session has been revoked." });
    return;
  }

  res.locals["session"] = session;
  next();
}
