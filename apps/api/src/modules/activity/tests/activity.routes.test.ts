import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { ActivityStreamService } from "../services/activity-stream.service.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "password1" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "password1" })
  return { token: res.body.token as string }
}

beforeEach(() => {
  ActivityStreamService.clear()
})

describe("GET /api/activity/stream", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/activity/stream")
    expect(res.status).toBe(401)
  })

  it("returns paginated activity items for a creator", async () => {
    const { token } = await registerAndLogin("activity@test.com")

    for (let i = 0; i < 5; i += 1) {
      ActivityStreamService.addActivity({
        id: `act_${i}`,
        creatorId: "creator_1",
        type: "STREAM_STARTED",
        title: `Stream ${i}`,
        createdAt: new Date().toISOString(),
      })
    }

    const res = await request(app)
      .get("/api/activity/stream")
      .query({ creatorId: "creator_1", pageSize: 2 })
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.total).toBe(5)
    expect(res.body.totalPages).toBe(3)
    expect(res.body.hasNextPage).toBe(true)
  })
})
