import { env } from "../../../shared/config/env.js"
import { createRateLimiter } from "../../../shared/rate-limit/rate-limiter.js"

export const loginPerAccountRateLimiter = createRateLimiter({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_PER_ACCOUNT,
})

export const loginPerIpRateLimiter = createRateLimiter({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_PER_IP,
})
