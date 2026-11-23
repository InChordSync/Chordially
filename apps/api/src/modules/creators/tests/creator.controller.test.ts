import { beforeEach, describe, expect, it, vi } from "vitest"

const findBySlug = vi.hoisted(() => vi.fn())

vi.mock("../services/creator.service.js", () => ({
  creatorService: { findBySlug, findByUserId: vi.fn() },
}))

import { CreatorController } from "../controllers/creator.controller.js"

function mockRes() {
  const res: any = {
    statusCode: 0,
    body: undefined,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  }
  return res
}

describe("CreatorController.getBySlug", () => {
  let controller: CreatorController
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new CreatorController()
    next = vi.fn()
  })

  it("returns a found creator as JSON", async () => {
    findBySlug.mockResolvedValue({
      id: "creator-1",
      userId: "user-1",
      displayName: "Alice",
      slug: "alice",
      bio: null,
      avatarUrl: null,
      isVerified: true,
      genre: null,
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const res = mockRes()

    await controller.getBySlug("alice", {} as any, res, next)

    expect(res.statusCode).toBe(200)
    expect(res.body.displayName).toBe("Alice")
    expect(next).not.toHaveBeenCalled()
  })

  it("returns a 404 AppError instead of null for an unknown slug", async () => {
    findBySlug.mockResolvedValue(null)
    const res = mockRes()

    await controller.getBySlug("missing", {} as any, res, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "CREATOR_NOT_FOUND" })
    )
  })
})
