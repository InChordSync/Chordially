import type { NextFunction, Request, Response } from "express"
import { createRateLimiter } from "../../../shared/rate-limit/rate-limiter.js"
import { env } from "../../../shared/config/env.js"

// Manual reconciliation runs are an operator/ops action — cheap to trigger,
// expensive to execute. This limiter bounds how often a single admin can fire
// one. Uses the in-memory limiter: reconciliation is a single-instance,
// rollup-style task and the cap here is about preventing accidental
// over-triggering, not defending a high-traffic public endpoint.
const reconciliationRunLimiter = createRateLimiter({
  windowMs: env.RECONCILIATION_RUN_RATE_LIMIT_WINDOW_MS,
  max: env.RECONCILIATION_RUN_RATE_LIMIT_MAX,
})

export function reconciliationRunRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!reconciliationRunLimiter.consume(`user:${req.userId ?? "unknown"}`)) {
    res.status(429).json({
      error: {
        code: "RECONCILIATION_RUN_RATE_LIMITED",
        message: "Too many reconciliation runs. Try again shortly.",
      },
    })
    return
  }
  next()
}
