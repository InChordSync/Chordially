import { Router, type NextFunction, type Request, type Response } from "express"
import { env } from "../config/env.js"
import { requireAuth, requireRole } from "../middleware/auth.middleware.js"
import { metrics } from "./metrics.js"

export const metricsRouter: Router = Router()

const requireAdmin = requireRole(["admin"])

/**
 * Scrape tokens are the primary production credential; an authenticated admin
 * session still works for local debugging. Checking the token first also
 * avoids a database lookup for every Prometheus scrape.
 */
function requireMetricsAccess(req: Request, res: Response, next: NextFunction): void {
  const token = env.METRICS_SCRAPE_TOKEN
  if (token && req.header("authorization") === `Bearer ${token}`) {
    next()
    return
  }

  requireAuth(req, res, () => {
    requireAdmin(req, res, next)
  })
}

metricsRouter.get("/", requireMetricsAccess, (_req, res) => {
  res.status(200).json(metrics.getSnapshot())
})

metricsRouter.get("/prometheus", requireMetricsAccess, (_req, res) => {
  res.type("text/plain").status(200).send(metrics.toPrometheus())
})
