import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: "Password1!" })

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })

  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreatorProfile(userId: string, slug: string) {
  return prisma.creatorProfile.create({
    data: { userId, displayName: "Test Creator", slug },
  })
}

beforeEach(async () => {
  await prisma.searchIndexEntry.deleteMany()
  await prisma.onboardingStep.deleteMany()
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("PATCH /api/creators/me/tags", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .patch("/api/creators/me/tags")
      .send({ tags: ["guitar", "jazz"] })
    expect(res.status).toBe(401)
  })

  it("updates tags for creator", async () => {
    const { token, userId } = await registerAndLogin("tags@test.com")
    await createCreatorProfile(userId, "tags-creator")

    const res = await request(app)
      .patch("/api/creators/me/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ tags: ["guitar", "jazz", "fusion"] })

    expect(res.status).toBe(200)
    expect(res.body.tags).toEqual(["guitar", "jazz", "fusion"])
  })

  it("returns 400 for invalid tags", async () => {
    const { token, userId } = await registerAndLogin("tags-invalid@test.com")
    await createCreatorProfile(userId, "tags-invalid")

    const res = await request(app)
      .patch("/api/creators/me/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ tags: "not-an-array" })

    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/creators/me/availability", () => {
  it("updates availability windows", async () => {
    const { token, userId } = await registerAndLogin("avail@test.com")
    await createCreatorProfile(userId, "avail-creator")

    const res = await request(app)
      .patch("/api/creators/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({
        availability: [
          {
            day: "Monday",
            slots: [
              { start: "09:00", end: "12:00" },
              { start: "14:00", end: "17:00" },
            ],
          },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.availability).toBeInstanceOf(Array)
    expect(res.body.availability[0].day).toBe("Monday")
  })
})

describe("POST /api/creators/me/activity-ping", () => {
  it("bumps activity score", async () => {
    const { token, userId } = await registerAndLogin("ping@test.com")
    await createCreatorProfile(userId, "ping-creator")

    const res1 = await request(app)
      .post("/api/creators/me/activity-ping")
      .set("Authorization", `Bearer ${token}`)

    expect(res1.status).toBe(200)
    expect(res1.body.activityScore).toBe(1)

    const res2 = await request(app)
      .post("/api/creators/me/activity-ping")
      .set("Authorization", `Bearer ${token}`)

    expect(res2.body.activityScore).toBe(2)
  })
})
