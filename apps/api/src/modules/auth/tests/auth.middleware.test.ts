import express from "express"
import jwt from "jsonwebtoken"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { env } from "../../../shared/config/env.js"
import { errorHandler } from "../../../shared/middleware/error-handler.js"
import { requireAuth, requireRole } from "../../../shared/middleware/auth.middleware.js"
import { prisma } from "../../../shared/database/prisma.js"

function buildTestApp() {
  const app = express()

  app.get("/protected", requireAuth, (req, res) => {
    res.status(200).json({ userId: req.userId })
  })

  app.use(errorHandler)

  return app
}

describe("requireAuth middleware", () => {
  it("allows requests with a valid token", async () => {
    const app = buildTestApp()
    const token = jwt.sign({ sub: "user-123" }, env.JWT_SECRET)

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.userId).toBe("user-123")
  })

  it("rejects requests without a token", async () => {
    const app = buildTestApp()

    const response = await request(app).get("/protected")

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe("UNAUTHORIZED")
  })

  it("rejects requests with an invalid token", async () => {
    const app = buildTestApp()

    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer not-a-real-token")

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe("UNAUTHORIZED")
  })
})

describe("requireRole middleware", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  async function createUser(email: string, role: string): Promise<string> {
    const { id } = await prisma.user.create({
      data: {
        email,
        passwordHash: "not-used-in-this-test",
        role,
      },
    })
    return id
  }

  it("allows a caller whose role is in the allowlist", async () => {
    const userId = await createUser("admin@test.com", "admin")
    const app = express()
    app.get("/admin", requireAuth, requireRole(["admin"]), (_req, res) => {
      res.status(200).json({ ok: true })
    })
    app.use(errorHandler)

    const token = jwt.sign({ sub: userId }, env.JWT_SECRET)
    const response = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it("rejects a caller whose role is not in the allowlist", async () => {
    const userId = await createUser("fan@test.com", "user")
    const app = express()
    app.get("/admin", requireAuth, requireRole(["admin"]), (_req, res) => {
      res.status(200).json({ ok: true })
    })
    app.use(errorHandler)

    const token = jwt.sign({ sub: userId }, env.JWT_SECRET)
    const response = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe("FORBIDDEN")
  })

  it("rejects a caller whose account no longer exists", async () => {
    const app = express()
    app.get("/admin", requireAuth, requireRole(["admin"]), (_req, res) => {
      res.status(200).json({ ok: true })
    })
    app.use(errorHandler)

    const token = jwt.sign({ sub: "does-not-exist" }, env.JWT_SECRET)
    const response = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe("FORBIDDEN")
  })
})
