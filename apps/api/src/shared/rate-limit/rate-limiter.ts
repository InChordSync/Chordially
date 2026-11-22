export interface RateLimiterOptions {
  windowMs: number
  max: number
}

export interface RateLimiter {
  /** Returns true if the call is within the limit (and records it), false if it should be rejected. */
  consume(key: string): boolean
}

/**
 * Simple in-memory fixed-window-per-key rate limiter. Good enough for a
 * single API instance. A multi-instance deployment must NOT rely on this
 * alone: each process carries its own counter, so a caller could rotate
 * across instances to bypass the limit. Use the shared store in
 * shared/rate-limit/db-rate-limiter.ts (Redis or DB-backed) for limits that
 * must hold across all instances.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const hitsByKey = new Map<string, number[]>()

  return {
    consume(key: string): boolean {
      const now = Date.now()
      const windowStart = now - options.windowMs
      const recentHits = (hitsByKey.get(key) ?? []).filter((timestamp) => timestamp > windowStart)

      if (recentHits.length >= options.max) {
        hitsByKey.set(key, recentHits)
        return false
      }

      recentHits.push(now)
      hitsByKey.set(key, recentHits)
      return true
    },
  }
}
