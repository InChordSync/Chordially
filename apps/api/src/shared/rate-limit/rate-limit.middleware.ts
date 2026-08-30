import type { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/app-error.js"
import type { RateLimiter } from "./rate-limiter.js"

/**
 * Express middleware that gates a route behind a rate limiter, keyed by the
 * caller's IP address. Used for routes that have no authenticated principal
 * to key on (e.g. the intentionally public creator profile endpoint).
 */
export function rateLimitByIp(
  limiter: RateLimiter,
  errorMessage = "Too many requests. Please try again shortly."
) {
  return function rateLimitByIpMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const key = req.ip ?? "unknown"
    if (!limiter.consume(key)) {
      throw new AppError(429, "RATE_LIMITED", errorMessage)
    }
    next()
  }
}
