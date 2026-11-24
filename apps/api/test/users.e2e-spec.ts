import type { INestApplication } from "@nestjs/common"
import request from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createE2eApp, registerAndLogin } from "./utils/app.js"

describe("Users (e2e)", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createE2eApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it("registers, logs in and returns the current user", async () => {
    const token = await registerAndLogin(app, "e2e-users@example.com")

    const me = await request(app.getHttpServer())
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
    expect(me.status).toBe(200)
    expect(me.body.user.creatorProfile).toBeNull()
    expect(me.body.user.fanProfile).toBeNull()
  })

  it("rejects requests without a token", async () => {
    const res = await request(app.getHttpServer()).get("/api/users/me")
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe("UNAUTHORIZED")
  })

  it("updates a profile through a real PATCH request", async () => {
    const token = await registerAndLogin(app, "e2e-users-patch@example.com")

    const res = await request(app.getHttpServer())
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "E2E User" })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user).toBeDefined()
  })
})
