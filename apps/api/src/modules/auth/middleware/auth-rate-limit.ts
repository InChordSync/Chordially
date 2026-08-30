import type { NextFunction, Request, Response } from "express"
import { env } from "../../../shared/config/env.js"
import { createDbRateLimiter } from "../../../shared/rate-limit/db-rate-limiter.js"

// Dedicated limiter for account-creation endpoints (POST /api/auth/register
// and /register-linked). Keyed per email (normalized to lowercase) so a
// single scripted client can't hammer registration, while a unique email per
// request — the legitimate case — is effectively unbounded. Scoped
// independently of login so failed-login policies never constrict signups.
const registerLimiter = createDbRateLimiter({
  scope: "auth-register",
  windowMs: env.REGISTER_RATE_LIMIT_WINDOW_MS,
  max: env.REGISTER_RATE_LIMIT_MAX,
})

function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "unknown"
}

export async function registerRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = normalizeEmail((req.body as { email?: unknown } | undefined)?.email)
    const allowed = await registerLimiter.consume(key)
    if (!allowed) {
      res.status(429).json({
        error: {
          code: "REGISTRATION_RATE_LIMITED",
          message: "Too many registration attempts. Try again shortly.",
        },
      })
      return
    }
    next()
  } catch {
    next()
  }
}
