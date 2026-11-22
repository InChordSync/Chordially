import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"

const app = createApp()

describe("JSON body size limit", () => {
  it("returns 413 for a request body larger than the limit", async () => {
    const oversized = {
      email: "a".repeat(300 * 1024),
      password: "p",
    }

    const res = await request(app)
      .post("/api/auth/login")
      .send(oversized)

    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE")
  })

  it("accepts a small body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@test.com", password: "wrongpass" })

    expect(res.status).not.toBe(413)
  })
})
