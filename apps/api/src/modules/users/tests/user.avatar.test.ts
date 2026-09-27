import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

function makePngBytes() {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64),
  ])
}

vi.mock("../../../shared/storage/s3.js", () => ({
  createAvatarUploadUrl: vi.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
  getAvatarObject: vi.fn().mockResolvedValue({
    key: "avatars/test.png",
    contentType: "image/png",
    contentLength: 72,
    body: Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(64),
    ]),
  }),
}))

const { getAvatarObject } = await import("../../../shared/storage/s3.js")

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
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

describe("POST /api/users/me/avatar-upload-url", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app)
      .post("/api/users/me/avatar-upload-url")
      .send({ contentType: "image/jpeg" })

    expect(res.status).toBe(401)
  })

  it("rejects an unsupported content type", async () => {
    const { token } = await registerAndLogin("avatar-invalid@test.com")

    const res = await request(app)
      .post("/api/users/me/avatar-upload-url")
      .set("Authorization", `Bearer ${token}`)
      .send({ contentType: "image/gif" })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("INVALID_CONTENT_TYPE")
  })

  it("rejects a request with no contentType", async () => {
    const { token } = await registerAndLogin("avatar-missing@test.com")

    const res = await request(app)
      .post("/api/users/me/avatar-upload-url")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
  })

  it("returns a presigned uploadUrl and the final avatarUrl for jpeg", async () => {
    const { token, userId } = await registerAndLogin("avatar-jpeg@test.com")

    const res = await request(app)
      .post("/api/users/me/avatar-upload-url")
      .set("Authorization", `Bearer ${token}`)
      .send({ contentType: "image/jpeg" })

    expect(res.status).toBe(200)
    expect(typeof res.body.uploadUrl).toBe("string")
    expect(res.body.avatarUrl).toContain(`avatars/${userId}.jpeg`)
  })

  it("returns a presigned uploadUrl and the final avatarUrl for png", async () => {
    const { token, userId } = await registerAndLogin("avatar-png@test.com")

    const res = await request(app)
      .post("/api/users/me/avatar-upload-url")
      .set("Authorization", `Bearer ${token}`)
      .send({ contentType: "image/png" })

    expect(res.status).toBe(200)
    expect(res.body.avatarUrl).toContain(`avatars/${userId}.png`)
  })
})

describe("PATCH /api/users/me — post-upload avatar verification", () => {
  it("verifies the stored object and marks a valid avatar active", async () => {
    const { token, userId } = await registerAndLogin("avatar-verify@test.com")
    await prisma.creatorProfile.create({
      data: { userId, displayName: "Avatar Creator", slug: "avatar-creator" },
    })

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ avatarUrl: `https://s3.example.com/avatars/${userId}.png` })

    expect(res.status).toBe(200)
    expect(vi.mocked(getAvatarObject)).toHaveBeenCalledWith(`avatars/${userId}.png`)

    const stored = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId } })
    expect(stored.avatarUrl).toBe(`https://s3.example.com/avatars/${userId}.png`)
  })

  it("rejects an avatar whose uploaded bytes fail moderation", async () => {
    const { token, userId } = await registerAndLogin("avatar-reject@test.com")
    await prisma.creatorProfile.create({
      data: { userId, displayName: "Bad Avatar", slug: "bad-avatar" },
    })

    // A PNG-declared object whose body is not a PNG should be rejected.
    vi.mocked(getAvatarObject).mockResolvedValueOnce({
      key: `avatars/${userId}.png`,
      contentType: "image/png",
      contentLength: 16,
      body: Buffer.from("not-an-image at all"),
    })

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ avatarUrl: `https://s3.example.com/avatars/${userId}.png` })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("AVATAR_REJECTED")

    const stored = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId } })
    expect(stored.avatarUrl).toBeNull()
  })

  it("rejects an avatarUrl that is not an avatar object URL", async () => {
    const { token, userId } = await registerAndLogin("avatar-badurl@test.com")
    await prisma.creatorProfile.create({
      data: { userId, displayName: "Bad URL", slug: "bad-url" },
    })

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ avatarUrl: "https://example.com/other/path.png" })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("INVALID_AVATAR_URL")
  })
})

