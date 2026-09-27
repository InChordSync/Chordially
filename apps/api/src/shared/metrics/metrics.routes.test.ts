import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../app.js"
import { prisma } from "../database/prisma.js"
import { metrics } from "./metrics.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function registerAndLoginAdmin(email: string) {
  const { token, userId } = await registerAndLogin(email)
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } })
  return { token }
}

beforeEach(async () => {
  await prisma.user.deleteMany()
  metrics.reset()
})

describe("GET /api/metrics", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/metrics")
    expect(res.status).toBe(401)
  })

  it("rejects non-admin (regular user) requests with 403", async () => {
    const { token } = await registerAndLogin("metrics-fan@test.com")

    const res = await request(app).get("/api/metrics").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe("FORBIDDEN")
  })

  it("returns the current counters and histogram summaries for an admin", async () => {
    const { token } = await registerAndLoginAdmin("metrics-admin@test.com")

    metrics.incrementCounter("tip_confirmed_total", 2)
    metrics.observeLatency("tip_confirmation_latency_ms", 150)

    const res = await request(app).get("/api/metrics").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.counters.tip_confirmed_total).toBe(2)
    expect(res.body.histograms.tip_confirmation_latency_ms.count).toBe(1)
  })
})
