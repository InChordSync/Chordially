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

describe("GET /api/search", () => {
  it("returns search results for a query", async () => {
    const user = await prisma.user.create({
      data: { email: "search@test.com", passwordHash: "hash" },
    })
    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: "Jazz Guitarist",
        slug: "jazz-guitarist",
        genre: "Jazz",
        tags: JSON.stringify(["guitar", "jazz"]),
      },
    })

    await prisma.searchIndexEntry.create({
      data: {
        creatorId: creator.id,
        displayName: "Jazz Guitarist",
        slug: "jazz-guitarist",
        bio: "A jazz guitarist",
        genre: "Jazz",
        tags: JSON.stringify(["guitar", "jazz"]),
        activityScore: 10,
        followerCount: 5,
      },
    })

    const res = await request(app).get("/api/search?q=jazz")
    expect(res.status).toBe(200)
    expect(res.body.results).toBeInstanceOf(Array)
    expect(res.body.results.length).toBe(1)
    expect(res.body.results[0].displayName).toBe("Jazz Guitarist")
    expect(res.body.pagination.total).toBe(1)
  })

  it("returns empty results for non-matching query", async () => {
    const res = await request(app).get("/api/search?q=nonexistent")
    expect(res.status).toBe(200)
    expect(res.body.results).toEqual([])
    expect(res.body.pagination.total).toBe(0)
  })

  it("returns empty results when q is empty", async () => {
    const res = await request(app).get("/api/search?q=")
    expect(res.status).toBe(200)
    expect(res.body.results).toEqual([])
  })
})
