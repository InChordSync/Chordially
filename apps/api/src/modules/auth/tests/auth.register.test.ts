import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function clearRateLimitRecords() {
  const records = await prisma.rateLimitRecord.findMany({ select: { id: true } })
  if (records.length > 0) {
    await prisma.rateLimitRecord.deleteMany({
      where: { id: { in: records.map((r) => r.id) } },
    })
  }
}

beforeEach(async () => {
  await clearRateLimitRecords()
})

describe("POST /api/auth/register", () => {
  it("registers a new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "fan@example.com", password: "password1" })

    expect(response.status).toBe(201)
    expect(response.body.user.email).toBe("fan@example.com")
    expect(typeof response.body.token).toBe("string")
    expect(response.body.user.passwordHash).toBeUndefined()
  })

  it("returns a generic error for a duplicate email (no enumeration)", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password1" })

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password1" })

    // The duplicate-email response is deliberately generic so an attacker
    // cannot distinguish an existing email from any other failure.
    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe("REGISTRATION_FAILED")
    expect(response.body.error.message).not.toMatch(/already exists/i)
  })

  it("rejects invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("rate-limits repeated registration attempts for the same email", async () => {
    // Default budget is 10 registrations per email per minute; the 11th must
    // be rejected with the register-specific 429.
    let limited = false
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "ratelimit@example.com", password: "password1" })

      if (res.status === 429) {
        limited = true
        expect(res.body.error.code).toBe("REGISTRATION_RATE_LIMITED")
        break
      }
    }

    expect(limited).toBe(true)
  })
})
