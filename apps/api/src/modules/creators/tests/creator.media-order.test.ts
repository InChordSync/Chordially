import request from "supertest"
import jwt from "jsonwebtoken"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { env } from "../../../shared/config/env.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

function authToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET)
}

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("PATCH /api/creators/:slug/media-order", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app)
      .patch("/api/creators/some-creator/media-order")
      .send({ items: [{ id: "m1", isCover: false }], orderedIds: ["m1"] })

    expect(res.status).toBe(401)
  })

  it("returns 400 for an invalid body", async () => {
    const user = await prisma.user.create({
      data: { email: "media@test.com", passwordHash: "hash" },
    })
    const token = authToken(user.id)

    const res = await request(app)
      .patch("/api/creators/any-slug/media-order")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderedIds: ["m1"] })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("reorders items and sets the cover", async () => {
    const user = await prisma.user.create({
      data: { email: "media-reorder@test.com", passwordHash: "hash" },
    })
    const token = authToken(user.id)

    const res = await request(app)
      .patch("/api/creators/some-creator/media-order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          { id: "a", isCover: true },
          { id: "b", isCover: false },
          { id: "c", isCover: false },
        ],
        orderedIds: ["c", "a", "b"],
        coverId: "b",
      })

    expect(res.status).toBe(200)
    expect(res.body.items.map((item: { id: string }) => item.id)).toEqual(["c", "a", "b"])
    expect(
      res.body.items.map((item: { position: number }) => item.position)
    ).toEqual([0, 1, 2])
    expect(res.body.items.find((item: { id: string }) => item.id === "b").isCover).toBe(true)
    expect(
      res.body.items
        .filter((item: { id: string }) => item.id !== "b")
        .every((item: { isCover: boolean }) => item.isCover === false)
    ).toBe(true)
  })
})
