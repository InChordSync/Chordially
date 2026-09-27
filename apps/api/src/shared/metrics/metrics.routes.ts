import { Router } from "express"
import { requireAuth, requireRole } from "../middleware/auth.middleware.js"
import { metrics } from "./metrics.js"

export const metricsRouter: Router = Router()

// Operator-only: exposes process/runtime metrics that fan/creator users have
// no business reading. Gate on admin role (and auth) as defense-in-depth; a
// real deployment would additionally sit this behind an internal-only network
// boundary or scrape API key.
metricsRouter.get("/", requireAuth, requireRole(["admin"]), (_req, res) => {
  res.status(200).json(metrics.getSnapshot())
})
