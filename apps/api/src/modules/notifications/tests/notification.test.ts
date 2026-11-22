import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password1!" })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

beforeEach(async () => {
  await prisma.notification.deleteMany()
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("GET /api/notifications", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/notifications")
    expect(res.status).toBe(401)
  })

  it("returns an empty list when the user has no notifications", async () => {
    const { token } = await registerAndLogin("notif-empty@test.com")
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
    expect(res.body.total).toBe(0)
    expect(res.body.unread).toBe(0)
  })

  it("paginates a user's notifications and reports unread count", async () => {
    const { token, userId } = await registerAndLogin("notif-page@test.com")

    await prisma.notification.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        recipientId: userId,
        type: "FOLLOW",
        title: `Follow ${i}`,
        body: `body ${i}`,
        read: i % 2 === 0,
      })),
    })

    const res = await request(app)
      .get("/api/notifications?page=1&pageSize=2")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.page).toBe(1)
    expect(res.body.pageSize).toBe(2)
    expect(res.body.total).toBe(5)
    expect(res.body.unread).toBe(3)
    expect(res.body.items[0].title).toBe("Follow 4")
  })
})

describe("POST /api/notifications/:id/read", () => {
  it("marks a single notification as read", async () => {
    const { token, userId } = await registerAndLogin("notif-read@test.com")

    const created = await prisma.notification.create({
      data: { recipientId: userId, type: "MENTION", title: "Mention", body: "hi" },
    })

    const res = await request(app)
      .post(`/api/notifications/${created.id}/read`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.id)
    expect(res.body.read).toBe(true)

    const stored = await prisma.notification.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.read).toBe(true)
  })

  it("returns 404 for a notification that isn't the caller's", async () => {
    const owner = await registerAndLogin("notif-owner@test.com")
    const other = await registerAndLogin("notif-other@test.com")

    const created = await prisma.notification.create({
      data: { recipientId: owner.userId, type: "FOLLOW", title: "Owner", body: "hi" },
    })

    const res = await request(app)
      .post(`/api/notifications/${created.id}/read`)
      .set("Authorization", `Bearer ${other.token}`)

    expect(res.status).toBe(404)
  })
})

describe("POST /api/notifications/read-all", () => {
  it("marks all of a user's notifications as read", async () => {
    const { token, userId } = await registerAndLogin("notif-readall@test.com")

    await prisma.notification.createMany({
      data: [
        { recipientId: userId, type: "FOLLOW", title: "A", body: "a" },
        { recipientId: userId, type: "MENTION", title: "B", body: "b" },
      ],
    })

    const res = await request(app)
      .post("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)

    const stored = await prisma.notification.findMany({ where: { recipientId: userId } })
    expect(stored.every((n) => n.read)).toBe(true)
  })
})
