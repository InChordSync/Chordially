import "reflect-metadata"
import type { NextFunction, Request, Response } from "express"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AppError } from "../../../shared/errors/app-error.js"
import { DepositController } from "../controllers/deposit.controller.js"
import { depositService } from "../services/deposit.service.js"

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

function makeRequest(userId?: string, query: Record<string, unknown> = {}): Request {
  return { userId, query } as unknown as Request
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DepositController (typed Nest replacement for the Express adapter)", () => {
  it("starts a deposit using the validated request body", async () => {
    const expected = { id: "deposit-1", status: "incomplete" }
    const initiateSpy = vi
      .spyOn(depositService, "initiateDeposit")
      .mockResolvedValueOnce(expected as never)
    const controller = new DepositController()
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction
    const idempotencyKey = "2b3a4a55-5a5d-4b1c-9b7f-1c8d5dd8d111"

    await controller.create(
      makeRequest("user-1"),
      { assetCode: "USDC", idempotencyKey },
      res,
      next
    )

    expect(next).not.toHaveBeenCalled()
    expect(initiateSpy).toHaveBeenCalledWith("user-1", "USDC", idempotencyKey)
    expect(res.statusCode).toBe(201)
    expect(res.body).toBe(expected)
  })

  it("defaults the asset code and rejects unauthenticated callers", async () => {
    const initiateSpy = vi.spyOn(depositService, "initiateDeposit")
    const controller = new DepositController()
    const next = vi.fn()

    await controller.create(makeRequest(), {}, makeResponse(), next as unknown as NextFunction)
    expect(next).toHaveBeenCalledWith(expect.any(AppError))
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401)
    expect(initiateSpy).not.toHaveBeenCalled()

    next.mockClear()
    await controller.create(
      makeRequest("user-1"),
      { assetCode: "BTC" },
      makeResponse(),
      next as unknown as NextFunction
    )
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "ZodError" }))
    expect(initiateSpy).not.toHaveBeenCalled()
  })

  it("forwards pagination to the deposit service", async () => {
    const page = { items: [], page: 2, pageSize: 5, total: 0, totalPages: 0, hasNextPage: false }
    const listSpy = vi.spyOn(depositService, "listDepositsForUser").mockResolvedValueOnce(page)
    const controller = new DepositController()
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    await controller.list(makeRequest("user-1", { page: "2", pageSize: "5" }), res, next)

    expect(next).not.toHaveBeenCalled()
    expect(listSpy).toHaveBeenCalledWith("user-1", 2, 5)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(page)
  })

  it("refreshes a caller's deposit by id", async () => {
    const status = { id: "deposit-1", status: "completed" }
    const refreshSpy = vi.spyOn(depositService, "refreshDepositStatus").mockResolvedValueOnce(status as never)
    const controller = new DepositController()
    const res = makeResponse()
    const next = vi.fn() as unknown as NextFunction

    await controller.getById("deposit-1", makeRequest("user-1"), res, next)

    expect(next).not.toHaveBeenCalled()
    expect(refreshSpy).toHaveBeenCalledWith("user-1", "deposit-1")
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(status)
  })

  it("passes service errors to the error handler", async () => {
    vi.spyOn(depositService, "refreshDepositStatus").mockRejectedValueOnce(
      new AppError(404, "DEPOSIT_NOT_FOUND", "Deposit not found")
    )
    const controller = new DepositController()
    const next = vi.fn() as unknown as NextFunction

    await controller.getById("missing", makeRequest("user-1"), makeResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "DEPOSIT_NOT_FOUND" })
    )
  })
})
