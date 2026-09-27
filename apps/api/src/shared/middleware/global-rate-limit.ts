import type { NextFunction, Request, Response } from "express"
import { env } from "../../config/env.js"
import { logger } from "../logger/logger.js"
import { createDbRateLimiter } from "../rate-limit/db-rate-limiter.js"

/**
 * A conservative, IP-based, per-request global limiter applied app-wide as
 * defense-in-depth underneath the per-feature limiters (e.g. login, register,
 * creator-payouts, tips). If a feature limiter is misconfigured or a new
 * endpoint ships without one, this still bounds how much a single IP can ask
 * of the whole API.
 *
 * It is deliberately looser than the feature-level limits so it never beats a
 * tighter feature limit into a 429 first; it exists to catch aggregate abuse,
 * not to police a single endpoint. Health probes and the metrics endpoint are
 * exempt so monitoring traffic never trips it.
 */
const globalLimiter = createDbRateLimiter({
  scope: "global-ip",
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: env.GLOBAL_RATE_LIMIT_MAX,
})

function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown"
}

export async function globalRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // The global limiter is intentionally disabled under NODE_ENV=test: an
  // entire integration-test run shares one IP and would otherwise trip the
  // same shared Store as the feature limiters, making the suite flaky. The
  // feature- and per-key limiters below it still get exercised by tests.
  if (env.NODE_ENV === "test") {
    next()
    return
  }

  try {
    const allowed = await globalLimiter.consume(clientIp(req))
    if (!allowed) {
      res
        .status(429)
        .json({ error: { code: "RATE_LIMITED", message: "Too many requests" } })
      return
    }
    next()
  } catch (error) {
    // A database failure in the shared store should never take the whole API
    // down; fail open and let the request through, but log it loudly.
    logger.error("global rate limiter store unavailable; allowing request", {
      error: error instanceof Error ? error.message : String(error),
    })
    next()
  }
}
