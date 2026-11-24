import { beforeEach, describe, expect, it, vi } from "vitest"

const startStream = vi.hoisted(() => vi.fn())

vi.mock("../services/stream.service.js", () => ({
  streamService: { startStream, findById: vi.fn(), endStream: vi.fn() },
}))

import { StreamController } from "../controllers/stream.controller.js"

function mockRes() {
  const res: any = {
    statusCode: 0,
    body: undefined,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  }
  return res
}

describe("StreamController.start", () => {
  let controller: StreamController
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new StreamController()
    next = vi.fn()
    startStream.mockResolvedValue({
      id: "stream-1",
      creatorId: "creator-1",
      title: "Jazz set",
      startedAt: new Date(),
      endedAt: null,
    })
  })

  it("validates and forwards the title", async () => {
    const res = mockRes()

    await controller.start({ userId: "user-1" } as any, { title: "  Jazz set  " }, res, next)

    expect(startStream).toHaveBeenCalledWith("user-1", "Jazz set")
    expect(res.statusCode).toBe(201)
    expect(next).not.toHaveBeenCalled()
  })

  it("allows an omitted title", async () => {
    const res = mockRes()

    await controller.start({ userId: "user-1" } as any, {}, res, next)

    expect(startStream).toHaveBeenCalledWith("user-1", undefined)
  })

  it("rejects titles longer than 140 characters", async () => {
    const res = mockRes()

    await controller.start({ userId: "user-1" } as any, { title: "x".repeat(141) }, res, next)

    expect(startStream).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it("rejects unknown body fields", async () => {
    const res = mockRes()

    await controller.start({ userId: "user-1" } as any, { title: "Jazz", isLive: true }, res, next)

    expect(startStream).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
