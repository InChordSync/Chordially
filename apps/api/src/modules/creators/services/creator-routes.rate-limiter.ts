import { env } from "../../../shared/config/env.js"
import { createRateLimiter } from "../../../shared/rate-limit/rate-limiter.js"

export const creatorProfileRateLimiter = createRateLimiter({
  windowMs: env.CREATOR_PROFILE_RATE_LIMIT_WINDOW_MS,
  max: env.CREATOR_PROFILE_RATE_LIMIT_PER_IP,
})
