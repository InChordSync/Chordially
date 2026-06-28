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

beforeEach(async () => {
  await prisma.searchIndexEntry.deleteMany()
  await prisma.onboardingStep.deleteMany()
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("GET /api/users/me/onboarding", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/users/me/onboarding")
    expect(res.status).toBe(401)
  })

  it("returns onboarding steps seeded at registration", async () => {
    const { token } = await registerAndLogin("onboard@test.com")
    const res = await request(app)
      .get("/api/users/me/onboarding")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.steps).toBeInstanceOf(Array)
    expect(res.body.steps.length).toBeGreaterThan(0)
    expect(res.body).toHaveProperty("completenessScore")
    expect(res.body.completenessScore).toBe(0)
  })

  it("marks displayName step complete after patchMe", async () => {
    const { token, userId } = await registerAndLogin("onboard-patch@test.com")

    await prisma.creatorProfile.create({
      data: { userId, displayName: "Test Creator", slug: "test-creator" },
    })

    await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Updated Name" })

    const res = await request(app)
      .get("/api/users/me/onboarding")
      .set("Authorization", `Bearer ${token}`)

    const displayNameStep = res.body.steps.find(
      (s: { stepKey: string }) => s.stepKey === "displayName"
    )
    expect(displayNameStep.completed).toBe(true)
    expect(res.body.completenessScore).toBeGreaterThan(0)
  })
})
