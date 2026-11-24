import { beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "../../../shared/config/env.js"

const mocks = vi.hoisted(() => ({
  findCreator: vi.fn(),
  findUser: vi.fn(),
  findWallet: vi.fn(),
  getAssetBalance: vi.fn(),
}))

vi.mock("../../creators/services/creator.service.js", () => ({
  creatorService: { findByUserId: mocks.findCreator },
}))

vi.mock("../../users/services/user.service.js", () => ({
  userService: { findById: mocks.findUser },
}))

vi.mock("../../wallet/repositories/wallet.repository.js", () => ({
  walletRepository: { findByUserId: mocks.findWallet },
}))

vi.mock("../../../shared/stellar/client.js", () => ({
  stellarClient: {
    getAssetBalance: mocks.getAssetBalance,
    isTransientSubmissionError: vi.fn(() => false),
  },
}))

import { creatorPayoutService } from "../services/creator-payout.service.js"

const verifiedCreator = {
  id: "creator-1",
  userId: "user-1",
  isVerified: true,
  displayName: "Creator",
  slug: "creator",
}
const verifiedUser = { id: "user-1", emailVerified: true, role: "user" }
const custodialWallet = {
  id: "wallet-1",
  userId: "user-1",
  publicKey: "G".padEnd(56, "A"),
  walletType: "custodial",
  network: "testnet",
}

function setEligibleState() {
  mocks.findCreator.mockResolvedValue(verifiedCreator)
  mocks.findUser.mockResolvedValue(verifiedUser)
  mocks.findWallet.mockResolvedValue(custodialWallet)
  mocks.getAssetBalance.mockResolvedValue("100.0000000")
}

describe("creatorPayoutService.checkEligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setEligibleState()
  })

  it("returns eligible with no reasons when every rule passes", async () => {
    const result = await creatorPayoutService.checkEligibility("user-1", "20", "native")

    expect(result).toEqual({
      eligible: true,
      reasons: [],
      minimumAmount: env.CREATOR_PAYOUT_MINIMUM_AMOUNT,
      balance: "100.0000000",
    })
  })

  it("reports a missing creator profile", async () => {
    mocks.findCreator.mockResolvedValue(null)

    const result = await creatorPayoutService.checkEligibility("user-1", "20", "native")

    expect(result.eligible).toBe(false)
    expect(result.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "CREATOR_PROFILE_NOT_FOUND"
    )
  })

  it("reports an unverified creator", async () => {
    mocks.findCreator.mockResolvedValue({ ...verifiedCreator, isVerified: false })

    const result = await creatorPayoutService.checkEligibility("user-1", "20", "native")

    expect(result.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "CREATOR_NOT_VERIFIED"
    )
  })

  it("reports an unverified email", async () => {
    mocks.findUser.mockResolvedValue({ ...verifiedUser, emailVerified: false })

    const result = await creatorPayoutService.checkEligibility("user-1", "20", "native")

    expect(result.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "EMAIL_NOT_VERIFIED"
    )
  })

  it("enforces CREATOR_PAYOUT_MINIMUM_AMOUNT", async () => {
    const result = await creatorPayoutService.checkEligibility(
      "user-1",
      String(env.CREATOR_PAYOUT_MINIMUM_AMOUNT - 1),
      "native"
    )

    expect(result.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "PAYOUT_BELOW_MINIMUM"
    )
    expect(result.minimumAmount).toBe(env.CREATOR_PAYOUT_MINIMUM_AMOUNT)
  })

  it("reports a missing or linked wallet", async () => {
    mocks.findWallet.mockResolvedValue(null)
    const withoutWallet = await creatorPayoutService.checkEligibility("user-1", "20", "native")
    expect(withoutWallet.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "WALLET_NOT_FOUND"
    )

    mocks.findWallet.mockResolvedValue({ ...custodialWallet, walletType: "linked" })
    const withLinkedWallet = await creatorPayoutService.checkEligibility("user-1", "20", "native")
    expect(withLinkedWallet.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "WALLET_NOT_CUSTODIAL"
    )
  })

  it("reports an insufficient balance and a failed balance read", async () => {
    mocks.getAssetBalance.mockResolvedValue("1.0000000")
    const insufficient = await creatorPayoutService.checkEligibility("user-1", "20", "native")
    expect(insufficient.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "INSUFFICIENT_BALANCE"
    )

    mocks.getAssetBalance.mockRejectedValue(new Error("horizon down"))
    const unavailable = await creatorPayoutService.checkEligibility("user-1", "20", "native")
    expect(unavailable.reasons.map((reason: { code: string }) => reason.code)).toContain(
      "BALANCE_UNAVAILABLE"
    )
  })

  it("returns every failing rule at once", async () => {
    mocks.findCreator.mockResolvedValue({ ...verifiedCreator, isVerified: false })
    mocks.findUser.mockResolvedValue({ ...verifiedUser, emailVerified: false })
    mocks.findWallet.mockResolvedValue(null)

    const result = await creatorPayoutService.checkEligibility("user-1", "1", "native")

    expect(result.eligible).toBe(false)
    expect(result.reasons.map((reason: { code: string }) => reason.code)).toEqual([
      "CREATOR_NOT_VERIFIED",
      "EMAIL_NOT_VERIFIED",
      "PAYOUT_BELOW_MINIMUM",
      "WALLET_NOT_FOUND",
    ])
  })
})
