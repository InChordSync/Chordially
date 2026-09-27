import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"

// This file exercises the sponsored-account-creation path, which only runs
// when a sponsor key is configured. `apps/api/tests/setup.ts` globally mocks
// `stellarClient`, so we only need to override env for these tests and can
// reuse that mock; per-test spies below adjust its behavior as needed.
vi.mock("../../../shared/config/env.js", () => ({
  env: {
    STELLAR_NETWORK: "testnet",
    STELLAR_SPONSOR_SECRET_KEY: "SSPONSORSECRETKEYFORTESTSONLYXXXXXXXXXXXXXXXXXXXXXXXXX",
    STELLAR_SPONSOR_PUBLIC_KEY: "GSPONSORPUBLICKEYFORTESTSONLYXXXXXXXXXXXXXXXXXXXXXXXXX",
    STELLAR_SPONSOR_LOW_BALANCE_XLM: 50,
  },
}))

const { walletService } = await import("../services/wallet.service.js")
const { stellarClient } = await import("../../../shared/stellar/client.js")

async function createTestUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: "irrelevant-hash" } })
}

describe("walletService.createWalletForUser (sponsored path)", () => {
  beforeEach(() => {
    vi.mocked(stellarClient.sponsorAccountCreation).mockClear()
    vi.mocked(stellarClient.isInsufficientSponsorBalanceError).mockReturnValue(false)
  })

  afterEach(() => {
    vi.mocked(stellarClient.sponsorAccountCreation).mockReset().mockResolvedValue({
      hash: "reset-hash",
      ledger: 1,
      successful: true,
    })
  })

  it("sponsors the new account instead of calling Friendbot", async () => {
    const user = await createTestUser("sponsored@test.com")
    const fundTestnetSpy = vi.mocked(stellarClient.fundTestnetAccount)
    fundTestnetSpy.mockClear()

    const wallet = await walletService.createWalletForUser(user.id)

    expect(stellarClient.sponsorAccountCreation).toHaveBeenCalledTimes(1)
    expect(fundTestnetSpy).not.toHaveBeenCalled()
    expect(wallet.publicKey).toMatch(/^G[A-Z0-9]{55}$/)
  })

  it("fails wallet creation loudly when the sponsor account is depleted, without creating a wallet row", async () => {
    const user = await createTestUser("depleted@test.com")

    vi.mocked(stellarClient.sponsorAccountCreation).mockRejectedValueOnce(new Error("underfunded"))
    vi.mocked(stellarClient.isInsufficientSponsorBalanceError).mockReturnValueOnce(true)

    await expect(walletService.createWalletForUser(user.id)).rejects.toMatchObject({
      statusCode: 503,
      code: "SPONSOR_ACCOUNT_DEPLETED",
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    expect(wallet).toBeNull()
  })

  it("fails wallet creation with a distinct error for any other sponsorship failure", async () => {
    const user = await createTestUser("other-failure@test.com")

    vi.mocked(stellarClient.sponsorAccountCreation).mockRejectedValueOnce(new Error("horizon down"))

    await expect(walletService.createWalletForUser(user.id)).rejects.toMatchObject({
      statusCode: 502,
      code: "WALLET_PROVISIONING_FAILED",
    })

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    expect(wallet).toBeNull()
  })
})
