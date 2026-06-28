import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

beforeEach(async () => {
  await prisma.searchIndexEntry.deleteMany()
  await prisma.onboardingStep.deleteMany()
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("GET /api/discover", () => {
  it("returns paginated creators", async () => {
    const user = await prisma.user.create({
      data: { email: "creator1@test.com", passwordHash: "hash" },
    })
    await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: "Artist One",
        slug: "artist-one",
        genre: "Jazz",
      },
    })

    const res = await request(app).get("/api/discover")
    expect(res.status).toBe(200)
    expect(res.body.creators).toBeInstanceOf(Array)
    expect(res.body.creators.length).toBe(1)
    expect(res.body.pagination).toHaveProperty("page")
    expect(res.body.pagination).toHaveProperty("total")
    expect(res.body.pagination).toHaveProperty("totalPages")
  })

  it("filters by genre", async () => {
    const user1 = await prisma.user.create({
      data: { email: "jazz@test.com", passwordHash: "hash" },
    })
    const user2 = await prisma.user.create({
      data: { email: "rock@test.com", passwordHash: "hash" },
    })
    await prisma.creatorProfile.create({
      data: {
        userId: user1.id,
        displayName: "Jazz Artist",
        slug: "jazz-artist",
        genre: "Jazz",
      },
    })
    await prisma.creatorProfile.create({
      data: {
        userId: user2.id,
        displayName: "Rock Band",
        slug: "rock-band",
        genre: "Rock",
      },
    })

    const res = await request(app).get("/api/discover?genre=Jazz")
    expect(res.body.creators.length).toBe(1)
    expect(res.body.creators[0].genre).toBe("Jazz")
  })

  it("returns empty array when no creators exist", async () => {
    const res = await request(app).get("/api/discover")
    expect(res.status).toBe(200)
    expect(res.body.creators).toEqual([])
    expect(res.body.pagination.total).toBe(0)
  })
})
