import type { NextFunction, Request, Response } from "express"
import { env } from "../../../shared/config/env.js"
import { createDbRateLimiter } from "../../../shared/rate-limit/db-rate-limiter.js"

// Dedicated limiter for POST /api/creator-payouts (withdrawals/withdrawal
// starts). Differentiated from the tipping and auth limiters so that, say,
// heavy tipping activity never exhausts a creator's withdrawal budget and
// vice-versa. Keyed per user so one abusive account can't drain the shared
// budget for everyone else.
const creatorPayoutLimiter = createDbRateLimiter({
  scope: "creator-payout-withdrawal",
  windowMs: env.CREATOR_PAYOUT_RATE_LIMIT_WINDOW_MS,
  max: env.CREATOR_PAYOUT_RATE_LIMIT_MAX,
})

export async function creatorPayoutRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allowed = await creatorPayoutLimiter.consume(`user:${req.userId ?? "unknown"}`)
    if (!allowed) {
      res.status(429).json({
        error: {
          code: "WITHDRAWAL_RATE_LIMITED",
          message: "Too many withdrawal requests. Try again shortly.",
        },
      })
      return
    }
    next()
  } catch {
    next()
  }
}
