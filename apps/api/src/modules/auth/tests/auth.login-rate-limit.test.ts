import request from "supertest"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { loginPerAccountRateLimiter, loginPerIpRateLimiter } from "../services/auth-rate-limiters.js"

const app = createApp()

afterEach(() => {
  vi.restoreAllMocks()
})

describe("POST /api/auth/login rate limiting", () => {
  it("returns 429 when the per-account login threshold is exceeded", async () => {
    const consume = vi.spyOn(loginPerAccountRateLimiter, "consume").mockReturnValue(false)

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ratelimit@example.com", password: "password1" })

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe("RATE_LIMITED")
    expect(consume).toHaveBeenCalledWith("ratelimit@example.com")
  })

  it("returns 429 when the per-IP login threshold is exceeded", async () => {
    vi.spyOn(loginPerAccountRateLimiter, "consume").mockReturnValue(true)
    const consumeIp = vi.spyOn(loginPerIpRateLimiter, "consume").mockReturnValue(false)

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ratelimit-ip@example.com", password: "password1" })

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe("IP_RATE_LIMITED")
    expect(consumeIp).toHaveBeenCalled()
  })
})
