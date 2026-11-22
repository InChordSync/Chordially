import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password1!" })
  return { token: res.body.token as string }
}

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("POST /api/planning/sprint-snapshot", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/planning/sprint-snapshot").send({})
    expect(res.status).toBe(401)
  })

  it("returns a markdown export of the provided backlog items", async () => {
    const { token } = await registerAndLogin("planning-export@test.com")

    const res = await request(app)
      .post("/api/planning/sprint-snapshot")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sprintName: "Sprint 1",
        items: [
          { issueNumber: 1, title: "Setup", complexity: "simple", status: "open" },
          { issueNumber: 2, title: "Ship", complexity: "complex", status: "closed" },
        ],
        options: { includeClosedIssues: false },
      })

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("text/markdown")
    expect(res.text).toContain("# Sprint Snapshot: Sprint 1")
    expect(res.text).toContain("| #1 | Setup |")
    // includeClosedIssues=false filters the closed issue out.
    expect(res.text).not.toContain("Ship")
  })

  it("returns a validation error for an invalid item shape", async () => {
    const { token } = await registerAndLogin("planning-invalid@test.com")

    const res = await request(app)
      .post("/api/planning/sprint-snapshot")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ issueNumber: "nope", title: 5, complexity: "huge", status: "open" }],
      })

    expect(res.status).toBe(400)
  })
})
