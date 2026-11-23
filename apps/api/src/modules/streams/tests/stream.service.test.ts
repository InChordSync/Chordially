import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(),
  findOpenByCreator: vi.fn(),
  create: vi.fn(),
}))

vi.mock("../../creators/services/creator.service.js", () => ({
  creatorService: { findByUserId: mocks.findByUserId },
}))

vi.mock("../repositories/stream.repository.js", () => ({
  streamRepository: {
    findById: vi.fn(),
    findOpenByCreator: mocks.findOpenByCreator,
    create: mocks.create,
    end: vi.fn(),
  },
}))

import { streamService } from "../services/stream.service.js"

const creator = { id: "creator-1", userId: "user-1" }

describe("streamService.startStream", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findByUserId.mockResolvedValue(creator)
    mocks.findOpenByCreator.mockResolvedValue(null)
    mocks.create.mockResolvedValue({ id: "stream-1", title: "Jazz set" })
  })

  it("passes a validated title to the repository", async () => {
    await streamService.startStream("user-1", "Jazz set")

    expect(mocks.findOpenByCreator).toHaveBeenCalledWith("creator-1")
    expect(mocks.create).toHaveBeenCalledWith({
      creatorId: "creator-1",
      title: "Jazz set",
    })
  })

  it("rejects a second concurrent live stream with 409", async () => {
    mocks.findOpenByCreator.mockResolvedValue({
      id: "stream-open",
      creatorId: "creator-1",
      endedAt: null,
    })

    await expect(streamService.startStream("user-1", "Another set")).rejects.toMatchObject({
      statusCode: 409,
      code: "STREAM_ALREADY_LIVE",
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
