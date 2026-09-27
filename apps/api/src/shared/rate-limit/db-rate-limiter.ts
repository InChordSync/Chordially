import { prisma } from "../../database/prisma.js"

export interface DbRateLimiterOptions {
  windowMs: number
  max: number
  /** Unique scope prefix for this limiter's keys (e.g. "register" or "global-ip"). */
  scope: string
}

export interface DbRateLimiter {
  /** Returns true if the call is within the limit (and records it), false if it should be rejected. */
  consume(key: string): Promise<boolean>
  /**
   * Prefixes a raw key with the limiter's scope so the same raw key from two
   * different limiters never collides in the shared RateLimitRecord table.
   */
  scopedKey(key: string): string
}

/**
 * Shared-store rate limiter backed by the database. It fixes a real gap in
 * the in-memory limiter (shared/rate-limit/rate-limiter.ts): each API
 * process holds its own counter, so in a multi-instance deployment a caller
 * could simply rotate between instances to avoid being limited. This
 * implementation keeps a single per-key counter in the RateLimitRecord row,
 * so every instance tallies into the same fixed window.
 *
 * Fixed-window semantics: the first request in a window upserts the row with
 * a count of 1; subsequent requests increment it. Once 'now' has moved past
 * windowStart + windowMs the window slides forward and the counter resets.
 *
 * The db write on every request adds a little latency compared to a pure
 * in-memory/LRU approach; in production the same interface could be backed
 * by Redis to retain the shared-store guarantee without the per-request DB
 * round trip. Call sites should depend on the `DbRateLimiter` interface only,
 * so swapping the store never changes call sites.
 */
export function createDbRateLimiter(options: DbRateLimiterOptions): DbRateLimiter {
  const scopedKey = (key: string): string => `${options.scope}:${key}`

  return {
    scopedKey,

    async consume(key: string): Promise<boolean> {
      const now = Date.now()
      const fullKey = scopedKey(key)
      const windowStartBoundary = new Date(now - options.windowMs)

      const existing = await prisma.rateLimitRecord.findUnique({ where: { key: fullKey } })

      // Fresh key: start a new fixed window with a count of 1. Two
      // concurrent requests can both see "no row" and race on the unique
      // key; on conflict we just re-read and count them on the winner's row.
      if (!existing) {
        try {
          await prisma.rateLimitRecord.create({
            data: { key: fullKey, count: 1, windowStart: new Date(now) },
          })
          return true
        } catch (error) {
          const code = (error as { code?: string } | null)?.code
          if (code !== "P2002") throw error
          const winner = await prisma.rateLimitRecord.findUniqueOrThrow({
            where: { key: fullKey },
          })
          if (winner.count >= options.max) return false
          await prisma.rateLimitRecord.update({
            where: { id: winner.id },
            data: { count: { increment: 1 } },
          })
          return true
        }
      }

      // A previous window's counter survived: the window has slid, so reset
      // the count as if this were a fresh window.
      if (existing.windowStart.getTime() <= windowStartBoundary.getTime()) {
        await prisma.rateLimitRecord.update({
          where: { id: existing.id },
          data: { count: 1, windowStart: new Date(now) },
        })
        return true
      }

      // Still inside the current window: enforce the cap.
      if (existing.count >= options.max) {
        return false
      }

      await prisma.rateLimitRecord.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      })
      return true
    },
  }
}
