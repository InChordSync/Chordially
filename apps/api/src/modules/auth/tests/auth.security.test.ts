import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function register(email: string): Promise<{ verificationToken: string; password: string }> {
  const password = "password1"
  const response = await request(app)
    .post("/api/auth/register")
    .send({ email, password })

  expect(response.status).toBe(201)
  return { verificationToken: response.body.emailVerificationToken, password }
}

describe("POST /api/auth/login (account lockout)", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "lockout@example.com", password: "password1" })
  })

  it("returns the email verification token after a successful login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "lockout@example.com", password: "password1" })

    expect(response.status).toBe(200)
    expect(typeof response.body.emailVerificationToken).toBe("string")
  })

  it("locks the account after too many failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "lockout@example.com", password: "wrong-password-1" })
      expect(response.status).toBe(401)
    }

    const locked = await request(app)
      .post("/api/auth/login")
      .send({ email: "lockout@example.com", password: "password1" })

    expect(locked.status).toBe(423)
    expect(locked.body.error.code).toBe("ACCOUNT_LOCKED")
  })
})

describe("POST /api/auth/verify-email", () => {
  beforeEach(async () => {
    await prisma.emailVerificationToken.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it("verifies an email with a valid token", async () => {
    const { verificationToken } = await register("verify@example.com")

    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: verificationToken })

    expect(response.status).toBe(200)
    expect(response.body.emailVerified).toBe(true)
  })

  it("rejects an unknown verification token", async () => {
    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "not-a-real-token" })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("INVALID_VERIFICATION_TOKEN")
  })
})

describe("POST /api/auth/forgot-password + reset-password", () => {
  beforeEach(async () => {
    await prisma.passwordResetToken.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it("returns a reset token for a known account", async () => {
    await register("reset@example.com")

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "reset@example.com" })

    expect(response.status).toBe(200)
    expect(typeof response.body.token).toBe("string")
  })

  it("returns an opaque token for an unknown email too", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "missing@example.com" })

    expect(response.status).toBe(200)
    expect(typeof response.body.token).toBe("string")
  })

  it("resets the password with a valid token", async () => {
    const { verificationToken } = await register("resetpw@example.com")

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "resetpw@example.com" })
    const resetToken = forgot.body.token

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: "newpassword1" })

    expect(reset.status).toBe(200)

    void verificationToken

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "resetpw@example.com", password: "newpassword1" })
    expect(login.status).toBe(200)
  })

  it("rejects a bogus reset token", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "bogus", password: "newpassword1" })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe("INVALID_RESET_TOKEN")
  })
})
