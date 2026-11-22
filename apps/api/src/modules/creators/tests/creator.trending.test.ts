import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

async function createCreator(email: string, slug: string, displayName: string) {
  const user = await prisma.user.create({
    data: { email, passwordHash: "hash" },
  })
  return prisma.creatorProfile.create({
    data: { userId: user.id, displayName, slug },
  })
}

describe("GET /api/creators/trending", () => {
  it("returns 200 with an items array", async () => {
    await createCreator("trend-a@test.com", "creator-a", "Creator A")

    const res = await request(app).get("/api/creators/trending")

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it("ranks creators with more recent streams first", async () => {
    const creatorA = await createCreator("trend-a@test.com", "creator-a", "Creator A")
    const creatorB = await createCreator("trend-b@test.com", "creator-b", "Creator B")
    await createCreator("trend-c@test.com", "creator-c", "Creator C")

    await prisma.stream.createMany({
      data: [
        { creatorId: creatorA.id, title: "A1" },
        { creatorId: creatorA.id, title: "A2" },
        { creatorId: creatorB.id, title: "B1" },
      ],
    })

    const res = await request(app).get("/api/creators/trending")

    expect(res.status).toBe(200)
    expect(res.body.items.map((item: { slug: string }) => item.slug)).toEqual([
      "creator-a",
      "creator-b",
      "creator-c",
    ])
  })

  it("respects the limit query param", async () => {
    await createCreator("trend-a@test.com", "creator-a", "Creator A")
    await createCreator("trend-b@test.com", "creator-b", "Creator B")

    const res = await request(app).get("/api/creators/trending?limit=1")

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
  })
})
