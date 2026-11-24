import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyChallenge: vi.fn(),
  linkWallet: vi.fn(),
  getWalletForUser: vi.fn(),
}))

vi.mock("../../../shared/wallet-link/challenge.js", () => ({
  issueWalletLinkChallenge: vi.fn(() => ({ challenge: "token", expiresAt: 1 })),
  verifyWalletLinkChallenge: mocks.verifyChallenge,
}))

vi.mock("../services/wallet.service.js", () => ({
  walletService: {
    linkWallet: mocks.linkWallet,
    getWalletForUser: mocks.getWalletForUser,
    establishUsdcTrustline: vi.fn(),
  },
}))

import { WalletController } from "../controllers/wallet.controller.js"

const validBody = {
  publicKey: "G".repeat(56),
  challenge: "challenge-token",
  signature: "c2lnbmF0dXJl",
}

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

describe("WalletController", () => {
  let controller: WalletController
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new WalletController()
    next = vi.fn()
    mocks.verifyChallenge.mockReturnValue(true)
    mocks.linkWallet.mockResolvedValue({ id: "wallet-1", publicKey: validBody.publicKey })
    mocks.getWalletForUser.mockResolvedValue({ id: "wallet-1" })
  })

  it("verifies control of the key before linking a wallet", async () => {
    const res = mockRes()
    const req: any = { userId: "user-1" }

    await controller.verifyChallenge(req, validBody, res, next)

    expect(mocks.verifyChallenge).toHaveBeenCalledWith(
      validBody.challenge,
      validBody.publicKey,
      validBody.signature
    )
    expect(mocks.linkWallet).toHaveBeenCalledWith(
      "user-1",
      validBody.publicKey,
      validBody.challenge,
      validBody.signature
    )
    expect(res.statusCode).toBe(201)
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects an invalid signature with 401 instead of storing the wallet", async () => {
    mocks.verifyChallenge.mockReturnValue(false)
    const res = mockRes()
    const req: any = { userId: "user-1" }

    await controller.verifyChallenge(req, validBody, res, next)

    expect(mocks.linkWallet).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "INVALID_SIGNATURE" })
    )
  })

  it("rejects malformed public keys with a validation error", async () => {
    const res = mockRes()
    const req: any = { userId: "user-1" }

    await controller.verifyChallenge(req, { ...validBody, publicKey: "not-a-key" }, res, next)

    expect(mocks.verifyChallenge).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it("serves the single wallet from the service", async () => {
    const res = mockRes()
    const req: any = { userId: "user-1" }

    await controller.getMe(req, res, next)

    expect(mocks.getWalletForUser).toHaveBeenCalledWith("user-1")
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ id: "wallet-1" })
  })

  it("returns 501 for multi-wallet stubs instead of ok:true", async () => {
    const res = mockRes()

    await controller.getWallets({} as any, res, next)
    await controller.unlinkWallet("wallet-1", {} as any, res, next)
    await controller.setPrimaryWallet("wallet-1", {} as any, res, next)

    expect(next).toHaveBeenCalledTimes(3)
    for (const call of next.mock.calls) {
      expect(call[0]).toEqual(expect.objectContaining({ statusCode: 501, code: "NOT_IMPLEMENTED" }))
    }
  })
})
