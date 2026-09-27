import crypto from "node:crypto"
import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function registerAndLogin(email: string) {
  await request(app).post("/api/auth/register").send({ email, password: "Password1!" })
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  return res.body as { token: string; refreshToken: string; user: { id: string; email: string } }
}

beforeEach(async () => {
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
})

describe("refresh tokens", () => {
  it("registers/login issue a refresh token alongside the access token", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ email: "rt-register@example.com", password: "Password1!" })

    expect(register.status).toBe(201)
    expect(typeof register.body.token).toBe("string")
    expect(typeof register.body.refreshToken).toBe("string")

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "rt-register@example.com", password: "Password1!" })

    expect(login.status).toBe(200)
    expect(typeof login.body.token).toBe("string")
    expect(typeof login.body.refreshToken).toBe("string")
    expect(login.body.refreshToken).not.toBe(register.body.refreshToken)
  })

  it("rotates a valid refresh token and revokes the presented one", async () => {
    const auth = await registerAndLogin("rt-rotate@example.com")

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: auth.refreshToken })

    expect(refresh.status).toBe(200)
    expect(refresh.body.user.email).toBe("rt-rotate@example.com")
    expect(typeof refresh.body.accessToken).toBe("string")
    expect(typeof refresh.body.refreshToken).toBe("string")
    expect(refresh.body.refreshToken).not.toBe(auth.refreshToken)

    const stored = await prisma.refreshToken.findMany({ where: { userId: auth.user.id } })
    expect(stored).toHaveLength(3)
    expect(stored.filter((row) => row.revokedAt !== null)).toHaveLength(1)
    expect(stored.filter((row) => row.revokedAt === null)).toHaveLength(2)

    // The presented token is single-use: replaying it must fail.
    const replay = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: auth.refreshToken })
    expect(replay.status).toBe(401)
    expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN")
  })

  it("rejects an unknown refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: crypto.randomBytes(32).toString("hex") })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN")
  })

  it("rejects an expired refresh token", async () => {
    const auth = await registerAndLogin("rt-expired@example.com")
    const raw = crypto.randomBytes(32).toString("hex")
    await prisma.refreshToken.create({
      data: {
        userId: auth.user.id,
        tokenHash: crypto.createHash("sha256").update(raw).digest("hex"),
        expiresAt: new Date(Date.now() - 1000),
      },
    })

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: raw })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN")
  })

  it("requires auth on logout", async () => {
    const res = await request(app).post("/api/auth/logout").send({})
    expect(res.status).toBe(401)
  })

  it("logout revokes the presented refresh token server-side", async () => {
    const auth = await registerAndLogin("rt-logout@example.com")

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ refreshToken: auth.refreshToken })
    expect(logout.status).toBe(200)

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: auth.refreshToken })
    expect(refresh.status).toBe(401)
    expect(refresh.body.error.code).toBe("INVALID_REFRESH_TOKEN")
  })

  it("logout without a body revokes every outstanding refresh token", async () => {
    const auth = await registerAndLogin("rt-logout-all@example.com")
    const second = await request(app)
      .post("/api/auth/login")
      .send({ email: "rt-logout-all@example.com", password: "Password1!" })
    const secondRefreshToken = second.body.refreshToken as string

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${auth.token}`)
    expect(logout.status).toBe(200)

    for (const refreshToken of [auth.refreshToken, secondRefreshToken]) {
      const refresh = await request(app).post("/api/auth/refresh").send({ refreshToken })
      expect(refresh.status).toBe(401)
    }
  })

  it("logout rejects a refresh token that belongs to another user", async () => {
    const auth = await registerAndLogin("rt-other@example.com")
    const other = await registerAndLogin("rt-other-2@example.com")

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ refreshToken: other.refreshToken })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN")
  })
})