import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  listDepositsForUser: vi.fn(),
  refreshDepositStatus: vi.fn(),
  initiateDeposit: vi.fn(),
}))

vi.mock("../../wallet/services/deposit.service.js", () => ({
  depositService: {
    listDepositsForUser: mocks.listDepositsForUser,
    refreshDepositStatus: mocks.refreshDepositStatus,
    initiateDeposit: mocks.initiateDeposit,
  },
}))

import { DepositController } from "../controllers/deposit.controller.js"

function mockRes() {
  const res: any = {
    statusCode: 0,
    body: undefined,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res
}

describe("DepositController", () => {
  let controller: DepositController
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new DepositController()
    next = vi.fn()
    mocks.listDepositsForUser.mockResolvedValue([{ id: "dep-1" }])
    mocks.refreshDepositStatus.mockResolvedValue({ id: "dep-1", status: "pending_user_transfer_start" })
    mocks.initiateDeposit.mockResolvedValue({
      id: "dep-2",
      interactiveUrl: "https://anchor.example/deposit/dep-2",
    })
  })

  it("reads the real status for an owned deposit from a path param", async () => {
    const res = mockRes()

    await controller.pollStatus("dep-1", undefined, { userId: "user-1" } as any, res, next)

    expect(mocks.refreshDepositStatus).toHaveBeenCalledWith("user-1", "dep-1")
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe("pending_user_transfer_start")
    expect(next).not.toHaveBeenCalled()
  })

  it("also accepts the depositId query parameter", async () => {
    const res = mockRes()

    await controller.pollStatus(undefined, "dep-1", { userId: "user-1" } as any, res, next)

    expect(mocks.refreshDepositStatus).toHaveBeenCalledWith("user-1", "dep-1")
    expect(res.statusCode).toBe(200)
  })

  it("requires a depositId", async () => {
    const res = mockRes()

    await controller.pollStatus(undefined, undefined, { userId: "user-1" } as any, res, next)

    expect(mocks.refreshDepositStatus).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: "VALIDATION_ERROR" })
    )
  })

  it("forwards 404 from the service for deposits owned by someone else", async () => {
    const notFound = Object.assign(new Error("not found"), { statusCode: 404 })
    mocks.refreshDepositStatus.mockRejectedValue(notFound)
    const res = mockRes()

    await controller.pollStatus("dep-1", undefined, { userId: "user-1" } as any, res, next)

    expect(next).toHaveBeenCalledWith(notFound)
  })

  it("starts an interactive deposit through the deposit service", async () => {
    const res = mockRes()

    await controller.interactiveDeposit(
      { userId: "user-1" } as any,
      { assetCode: "USDC" },
      res,
      next
    )

    expect(mocks.initiateDeposit).toHaveBeenCalledWith(
      "user-1",
      "USDC",
      undefined
    )
    expect(res.statusCode).toBe(201)
    expect(res.body.interactiveUrl).toBe("https://anchor.example/deposit/dep-2")
  })

  it("lists only the caller's deposits with pagination", async () => {
    const res = mockRes()

    await controller.getDeposits("2", "10", { userId: "user-1" } as any, res, next)

    expect(mocks.listDepositsForUser).toHaveBeenCalledWith("user-1", 2, 10)
    expect(res.body).toEqual([{ id: "dep-1" }])
  })
})
