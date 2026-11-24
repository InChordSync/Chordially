import "reflect-metadata"
import type { NextFunction, Request, Response } from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { AppError } from "../../../shared/errors/app-error.js"
import { logger } from "../../../shared/logger/logger.js"
import { FileService } from "../../../shared/storage/file.service.js"
import { UserController } from "../controllers/user.controller.js"

// Keep avatar verification deterministic: the controller's job here is to
// confirm the URL, commit the update and only then clean up the old object.
vi.mock("../services/avatar.service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/avatar.service.js")>()
  return {
    ...actual,
    verifyAvatarForUser: vi.fn(async (_creatorId: string, avatarUrl: string) => {
      const key = actual.avatarKeyFromUrl(avatarUrl)
      if (!key) throw new AppError(400, "INVALID_AVATAR_URL", "avatarUrl must be an avatar object URL")
      return key
    }),
  }
})

function makeResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res as typeof res & Response
}

function makeRequest(userId: string): Request {
  return { userId } as unknown as Request
}

async function createUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: "test-hash" } })
}

beforeEach(async () => {
  await prisma.fanProfile.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.user.deleteMany()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("UserController — deleted accounts", () => {
  it("forwards a 401 AppError instead of dereferencing a missing user", async () => {
    const user = await createUser("deleted-direct@test.com")
    await prisma.user.delete({ where: { id: user.id } })

    const fileService = new FileService()
    const controller = new UserController(fileService)
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    await controller.getMe(makeRequest(user.id), res, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, name: "AppError" })
    )
    expect(res.body).toBeUndefined()
  })
})

describe("UserController — atomic /users/me updates", () => {
  it("returns the updated creator and fan profiles", async () => {
    const user = await createUser("payload@test.com")
    await prisma.creatorProfile.create({
      data: { userId: user.id, displayName: "Before", slug: "payload-before" },
    })
    await prisma.fanProfile.create({
      data: { userId: user.id, displayName: "Fan Before" },
    })

    const controller = new UserController(new FileService())
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    await controller.patchMe(
      makeRequest(user.id),
      { displayName: "After", genrePrefs: ["jazz"] },
      res,
      next
    )

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect((res.body as { ok: boolean }).ok).toBe(true)
    const body = res.body as {
      user: { email: string; creatorProfile: { displayName: string }; fanProfile: { genrePrefs: string[] } }
      creatorProfile: { displayName: string }
    }
    expect(body.user.email).toBe("payload@test.com")
    expect(body.user.creatorProfile.displayName).toBe("After")
    expect(body.user.fanProfile.genrePrefs).toEqual(["jazz"])
    expect(body.creatorProfile.displayName).toBe("After")
  })

  it("rolls back creator and fan writes when the genrePrefs update throws", async () => {
    const user = await createUser("rollback-direct@test.com")
    await prisma.creatorProfile.create({
      data: { userId: user.id, displayName: "Before", slug: "rollback-direct-before" },
    })
    await prisma.fanProfile.create({
      data: { userId: user.id, displayName: "Fan Before" },
    })

    const controller = new UserController(new FileService())
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction
    const fanService = await import("../../fans/services/fan.service.js")
    const genrePrefsSpy = vi
      .spyOn(fanService.fanService, "updateGenrePrefs")
      .mockRejectedValueOnce(new Error("genrePrefs write failed"))

    await controller.patchMe(
      makeRequest(user.id),
      { displayName: "After", genrePrefs: ["jazz"] },
      res,
      next
    )

    expect(genrePrefsSpy).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "genrePrefs write failed" }))
    expect(res.body).toBeUndefined()

    const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: user.id } })
    const fan = await prisma.fanProfile.findUniqueOrThrow({ where: { userId: user.id } })
    expect(creator.displayName).toBe("Before")
    expect(fan.displayName).toBe("Fan Before")
    expect(JSON.parse(fan.genrePrefs)).toEqual([])
  })
})

describe("UserController — avatar lifecycle", () => {
  const oldKey = "avatars/old-key.png"

  async function creatorWithAvatar(email: string) {
    const user = await createUser(email)
    const profile = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: "Avatar Creator",
        slug: `${email.split("@")[0]}-slug`,
        avatarUrl: `https://s3.example.com/${oldKey}`,
      },
    })
    return { user, profile }
  }

  it("keeps the current avatar when an upload URL is issued", async () => {
    const { user } = await creatorWithAvatar("upload-url@test.com")
    const fileService = new FileService()
    const deleteSpy = vi.spyOn(fileService, "deleteAvatar")
    vi.spyOn(fileService, "getAvatarUploadUrl").mockResolvedValueOnce("https://s3.example.com/presigned")
    const controller = new UserController(fileService)
    const res = makeResponse()

    await controller.getAvatarUploadUrl(makeRequest(user.id), "image/png", res, vi.fn())

    expect(res.statusCode).toBe(200)
    expect((res.body as { avatarUrl: string }).avatarUrl).toMatch(
      new RegExp(`avatars/${user.id}/[^/]+\\.png$`)
    )
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it("does not delete the current avatar when the client PUT fails", async () => {
    const { user } = await creatorWithAvatar("failed-put@test.com")
    const fileService = new FileService()
    const deleteSpy = vi.spyOn(fileService, "deleteAvatar")
    const uploadSpy = vi
      .spyOn(fileService, "getAvatarUploadUrl")
      .mockRejectedValueOnce(new Error("presigned PUT unavailable"))
    const controller = new UserController(fileService)
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    // No confirming PATCH follows the failed client-side PUT.
    await controller.getAvatarUploadUrl(makeRequest(user.id), "image/png", res, next)

    expect(uploadSpy).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "presigned PUT unavailable" }))
    expect(res.body).toBeUndefined()
    expect(deleteSpy).not.toHaveBeenCalled()

    const stored = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: user.id } })
    expect(stored.avatarUrl).toBe(`https://s3.example.com/${oldKey}`)
  })

  it("deletes the previous object only after a confirmed PATCH succeeds", async () => {
    const { user } = await creatorWithAvatar("confirmed@test.com")
    const fileService = new FileService()
    const deleteSpy = vi.spyOn(fileService, "deleteAvatar").mockResolvedValueOnce(undefined)
    const controller = new UserController(fileService)
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction
    const newUrl = `https://s3.example.com/avatars/${user.id}/new-upload.png`

    await controller.patchMe(makeRequest(user.id), { avatarUrl: newUrl }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(deleteSpy).toHaveBeenCalledTimes(1)
    expect(deleteSpy).toHaveBeenCalledWith(oldKey)
    const stored = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: user.id } })
    expect(stored.avatarUrl).toBe(newUrl)
  })

  it("logs cleanup failures without failing the confirmed profile update", async () => {
    const { user } = await creatorWithAvatar("cleanup-fail@test.com")
    const fileService = new FileService()
    vi.spyOn(fileService, "deleteAvatar").mockRejectedValueOnce(new Error("S3 unavailable"))
    const logSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined)
    const controller = new UserController(fileService)
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    await controller.patchMe(
      makeRequest(user.id),
      { avatarUrl: `https://s3.example.com/avatars/${user.id}/another-upload.png` },
      res,
      next
    )

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(logSpy).toHaveBeenCalledWith(
      "Failed to delete previous avatar after profile update",
      expect.objectContaining({ key: oldKey })
    )
  })
})
