import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { fanService } from "../services/fan.service.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "password1" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "password1" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createCreator(displayName: string, slug: string) {
  const user = await prisma.user.create({ data: { email: `${slug}@test.com`, passwordHash: "hash" } })
  return prisma.creatorProfile.create({
    data: { userId: user.id, displayName, slug },
  })
}

beforeEach(async () => {
  await prisma.bookmark.deleteMany()
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("fan profile endpoint", () => {
  it("reads the fan profile for the authenticated user", async () => {
    const { token, userId } = await registerAndLogin("fan-me@test.com")
    await fanService.createFanProfile({ userId, displayName: "Cool Fan" })

    const res = await request(app)
      .get("/api/fans/me")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.displayName).toBe("Cool Fan")
  })

  it("returns 404 when no fan profile exists", async () => {
    const { token } = await registerAndLogin("fan-none@test.com")
    const res = await request(app)
      .get("/api/fans/me")
      .set("Authorization", `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it("updates the fan profile display name", async () => {
    const { token, userId } = await registerAndLogin("fan-update@test.com")
    await fanService.createFanProfile({ userId, displayName: "Original" })

    const res = await request(app)
      .patch("/api/fans/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Updated Fan" })

    expect(res.status).toBe(200)
    expect(res.body.displayName).toBe("Updated Fan")
  })
})

describe("fan bookmarks endpoint", () => {
  it("creates, lists, and deletes a bookmark", async () => {
    const { token, userId } = await registerAndLogin("fan-bookmark@test.com")
    await fanService.createFanProfile({ userId, displayName: "Bookmarker" })
    const creator = await createCreator("Signed Artist", "signed-artist")

    const createRes = await request(app)
      .post("/api/fans/me/bookmarks")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id })

    expect(createRes.status).toBe(201)
    expect(createRes.body.creatorId).toBe(creator.id)

    const listRes = await request(app)
      .get("/api/fans/me/bookmarks")
      .set("Authorization", `Bearer ${token}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body).toHaveLength(1)
    expect(listRes.body[0].creatorId).toBe(creator.id)

    const deleteRes = await request(app)
      .delete(`/api/fans/me/bookmarks/${creator.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(deleteRes.status).toBe(204)

    const afterDelete = await request(app)
      .get("/api/fans/me/bookmarks")
      .set("Authorization", `Bearer ${token}`)
    expect(afterDelete.body).toHaveLength(0)
  })

  it("rejects creating a bookmark for a missing creator", async () => {
    const { token, userId } = await registerAndLogin("fan-bookmark2@test.com")
    await fanService.createFanProfile({ userId, displayName: "Bookmarker" })

    const res = await request(app)
      .post("/api/fans/me/bookmarks")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: "nonexistent" })

    expect(res.status).toBe(404)
  })
})
