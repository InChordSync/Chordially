import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  const regRes = await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  if (regRes.body.token && regRes.body.user) {
    return { token: regRes.body.token as string, userId: regRes.body.user.id as string }
  }
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user?.id as string }
}

async function createCreator(email: string, slug: string) {
  const { token, userId } = await registerAndLogin(email)
  const creator = await prisma.creatorProfile.create({
    data: { userId, displayName: slug, slug },
  })
  return { token, userId, creator }
}

beforeEach(async () => {
  await prisma.streamPayoutConfig.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("PUT /api/streams/:id/payout-config", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .put("/api/streams/does-not-exist/payout-config")
      .send({ payees: [] })
    expect(res.status).toBe(401)
  })

  it("sets a payout config for the host's own stream", async () => {
    const host = await createCreator("host-route@test.com", "host-route")
    const bob = await createCreator("bob-route@test.com", "bob-route")

    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})

    const res = await request(app)
      .put(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({
        payees: [
          { creatorId: host.creator.id, percentage: 70 },
          { creatorId: bob.creator.id, percentage: 30 },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.payees).toHaveLength(2)
  })

  it("rejects a payload where payees isn't an array", async () => {
    const host = await createCreator("host-route2@test.com", "host-route2")
    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})

    const res = await request(app)
      .put(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ payees: "not-an-array" })

    expect(res.status).toBe(400)
  })

  it("rejects a non-host setting the config", async () => {
    const host = await createCreator("host-route3@test.com", "host-route3")
    const intruder = await createCreator("intruder-route@test.com", "intruder-route")
    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})

    const res = await request(app)
      .put(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ payees: [{ creatorId: host.creator.id, percentage: 100 }] })

    expect(res.status).toBe(403)
  })
})

describe("GET /api/streams/:id/payout-config", () => {
  it("returns 404 when no config has been set", async () => {
    const host = await createCreator("host-route4@test.com", "host-route4")
    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})

    const res = await request(app)
      .get(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)

    expect(res.status).toBe(404)
  })

  it("returns the config once one has been set", async () => {
    const host = await createCreator("host-route5@test.com", "host-route5")
    const streamRes = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${host.token}`)
      .send({})

    await request(app)
      .put(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ payees: [{ creatorId: host.creator.id, percentage: 100 }] })

    const res = await request(app)
      .get(`/api/streams/${streamRes.body.id}/payout-config`)
      .set("Authorization", `Bearer ${host.token}`)

    expect(res.status).toBe(200)
    expect(res.body.payees).toEqual([{ creatorId: host.creator.id, percentage: 100 }])
  })
})
