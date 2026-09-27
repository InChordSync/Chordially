import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

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
  return { token, userId }
}

beforeEach(async () => {
  await prisma.tip.deleteMany()
  await prisma.user.deleteMany()
})

describe("POST /api/reconciliation/run", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/reconciliation/run")
    expect(res.status).toBe(401)
  })

  it("rejects non-admin (regular user) requests with 403", async () => {
    const { token } = await registerAndLogin("recon-route-fan@test.com")

    const res = await request(app)
      .post("/api/reconciliation/run")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe("FORBIDDEN")
  })

  it("runs reconciliation and returns a summary when an admin triggers it", async () => {
    const { token } = await registerAndLoginAdmin("recon-route-admin@test.com")

    const res = await request(app)
      .post("/api/reconciliation/run")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      scanned: expect.any(Number),
      confirmed: expect.any(Number),
      deadLettered: expect.any(Number),
      stillPending: expect.any(Number),
    })
  })
})
