import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../../database/prisma.js"
import { createDbRateLimiter } from "./db-rate-limiter.js"

async function clearRateLimitRecords(): Promise<void> {
  const records = await prisma.rateLimitRecord.findMany({
    where: { key: { startsWith: "db-limiter-test:" } },
    select: { id: true },
  })
  if (records.length > 0) {
    await prisma.rateLimitRecord.deleteMany({
      where: { id: { in: records.map((r) => r.id) } },
    })
  }
}

describe("createDbRateLimiter (shared store)", () => {
  beforeEach(async () => {
    await clearRateLimitRecords()
  })

  it("allows calls up to the max in a window, then rejects", async () => {
    const limiter = createDbRateLimiter({ scope: "db-limiter-test", windowMs: 1000, max: 2 })

    expect(await limiter.consume("a")).toBe(true)
    expect(await limiter.consume("a")).toBe(true)
    expect(await limiter.consume("a")).toBe(false)
  })

  it("tracks separate keys independently", async () => {
    const limiter = createDbRateLimiter({ scope: "db-limiter-test", windowMs: 1000, max: 1 })

    expect(await limiter.consume("a")).toBe(true)
    expect(await limiter.consume("b")).toBe(true)
    expect(await limiter.consume("a")).toBe(false)
    expect(await limiter.consume("b")).toBe(false)
  })

  it("two independent limiter instances share the same counter (multi-instance safe)", async () => {
    const instanceA = createDbRateLimiter({ scope: "db-limiter-test", windowMs: 1000, max: 2 })
    const instanceB = createDbRateLimiter({ scope: "db-limiter-test", windowMs: 1000, max: 2 })

    // Simulate two API processes: each tallies into the shared DB row, so
    // the budget is global, not per-instance.
    expect(await instanceA.consume("shared")).toBe(true)
    expect(await instanceB.consume("shared")).toBe(true)
    expect(await instanceA.consume("shared")).toBe(false)
    expect(await instanceB.consume("shared")).toBe(false)
  })

  it("scopedKey keeps two limiters from colliding on the same raw key", async () => {
    const registerLimiter = createDbRateLimiter({ scope: "db-limiter-test:register", windowMs: 1000, max: 1 })
    const loginLimiter = createDbRateLimiter({ scope: "db-limiter-test:login", windowMs: 1000, max: 1 })

    expect(await registerLimiter.consume("user-1")).toBe(true)
    // The login limiter uses a different scope, so it has a fresh budget for
    // the same raw key.
    expect(await loginLimiter.consume("user-1")).toBe(true)
  })
})
