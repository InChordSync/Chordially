import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function createCreator(email: string, data: { displayName: string; slug: string; genre: string; location: string }) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  return prisma.creatorProfile.create({ data: { userId: user.id, ...data } })
}

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("GET /api/creators/search", () => {
  it("returns an empty array when nothing matches", async () => {
    const res = await request(app).get("/api/creators/search").query({ genre: "Metal" })
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it("filters by genre and location and shapes results for the web client", async () => {
    await createCreator("search-afro@test.com", {
      displayName: "Kelechi Sounds",
      slug: "kelechi-sounds",
      genre: "Afrobeat",
      location: "Lagos",
    })
    await createCreator("search-class@test.com", {
      displayName: "Berlin Strings",
      slug: "berlin-strings",
      genre: "Classical",
      location: "Berlin",
    })

    const res = await request(app)
      .get("/api/creators/search")
      .query({ genre: "Afrobeat", location: "Lagos" })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      displayName: "Kelechi Sounds",
      slug: "kelechi-sounds",
      avatarUrl: null,
      followerCount: 0,
    })
    expect(Object.keys(res.body[0]).sort()).toEqual(
      ["avatarUrl", "displayName", "followerCount", "slug"]
    )
  })

  it("matches a free-text q against the search index case-insensitively", async () => {
    await createCreator("search-q1@test.com", {
      displayName: "Solar Vibes",
      slug: "solar-vibes",
      genre: "Indie",
      location: "Lagos",
    })
    await createCreator("search-q2@test.com", {
      displayName: "Beta Band",
      slug: "beta-band",
      genre: "Pop",
      location: "Accra",
    })

    const uppercase = await request(app).get("/api/creators/search").query({ q: "SOLAR" })
    expect(uppercase.status).toBe(200)
    expect(uppercase.body).toHaveLength(1)
    expect(uppercase.body[0].slug).toBe("solar-vibes")

    const byGenreMatch = await request(app).get("/api/creators/search").query({ q: "indie" })
    expect(byGenreMatch.status).toBe(200)
    expect(byGenreMatch.body.map((r: { slug: string }) => r.slug)).toEqual(["solar-vibes"])

    const noMatch = await request(app).get("/api/creators/search").query({ q: "zzz-nothing" })
    expect(noMatch.status).toBe(200)
    expect(noMatch.body).toEqual([])
  })

  it("ranks exact name matches above substring matches", async () => {
    await createCreator("search-rank1@test.com", {
      displayName: "DJ Remix",
      slug: "dj-remix",
      genre: "Electronic",
      location: "Nairobi",
    })
    await createCreator("search-rank2@test.com", {
      displayName: "The Remix Collective",
      slug: "the-remix-collective",
      genre: "House",
      location: "Nairobi",
    })

    const res = await request(app).get("/api/creators/search").query({ q: "remix" })
    expect(res.status).toBe(200)
    expect(res.body.map((r: { slug: string }) => r.slug)).toEqual([
      "dj-remix",
      "the-remix-collective",
    ])
  })

  it("is not shadowed by GET /:slug", async () => {
    const res = await request(app).get("/api/creators/search")
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})