import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { recordAuditEvent } from "./audit-store.js";

const trackedMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!trackedMethods.has(req.method)) {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      recordAuditEvent({
        id: crypto.randomUUID(),
        actor: req.header("x-demo-actor") ?? "system",
        action: req.path,
        path: req.originalUrl,
        method: req.method,
        createdAt: new Date().toISOString()
      });
    }
  });

  next();
}
