import { afterAll, beforeEach, vi } from "vitest"
import { prisma } from "../src/shared/database/prisma.js"
import { AppError } from "../src/shared/errors/app-error.js"

// Wallet creation on signup involves two external services (AWS KMS and the
// Stellar Friendbot). Tests should never depend on real network access or
// credentials for those, so they're mocked globally here rather than in every
// test file that happens to register a user.
vi.mock("../src/modules/wallet/services/wallet-crypto.service.js", () => ({
  encryptSecret: vi.fn(async (plaintext: string) => ({
    encryptedSecret: Buffer.from(plaintext).toString("base64"),
    encryptedDataKey: "test-encrypted-data-key",
    iv: "test-iv",
    authTag: "test-auth-tag",
  })),
  decryptSecret: vi.fn(async (encrypted: { encryptedSecret: string }) =>
    Buffer.from(encrypted.encryptedSecret, "base64").toString("utf8")
  ),
  requireCustodialSecrets: vi.fn((wallet: { walletType: string; encryptedSecret: string | null }) => {
    if (wallet.walletType !== "custodial" || wallet.encryptedSecret === null) {
      throw new AppError(
        400,
        "WALLET_NOT_CUSTODIAL",
        "This operation requires the platform to hold custody of the wallet, and this wallet is linked (self-custodied)"
      )
    }
    return wallet
  }),
}))

vi.mock("../src/shared/stellar/client.js", async () => {
  const { HorizonStellarClient } = await vi.importActual<typeof import("@chordially/stellar")>(
    "@chordially/stellar"
  )

  const client = new HorizonStellarClient({
    network: "testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  })

  return {
    stellarClient: {
      // Keypair generation is pure local crypto, so it's fine to keep real.
      generateKeypair: client.generateKeypair.bind(client),
      getAccount: vi.fn(),
      getNativeBalance: vi.fn(async () => "10000.0000000"),
      fundTestnetAccount: vi.fn(async () => undefined),
      isAccountNotFoundError: client.isAccountNotFoundError.bind(client),
      submitPayment: vi.fn(async () => ({
        hash: `test-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      submitSplitPayment: vi.fn(async () => ({
        hash: `test-split-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      isTransientSubmissionError: client.isTransientSubmissionError.bind(client),
      listSentPayments: vi.fn(async () => []),
      sponsorAccountCreation: vi.fn(async () => ({
        hash: `test-sponsor-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      getSponsorBalance: vi.fn(async () => "10000.0000000"),
      isInsufficientSponsorBalanceError: vi.fn(() => false),
      establishTrustline: vi.fn(async () => ({
        hash: `test-trustline-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      hasTrustline: vi.fn(async () => true),
      getAssetBalance: vi.fn(async () => "0.0000000"),
      signTransactionXdr: vi.fn((xdr: string) => `signed:${xdr}`),
      verifySignature: client.verifySignature.bind(client),
      buildPaymentTransactionXdr: vi.fn(async () => "test-unsigned-payment-xdr"),
      buildSplitPaymentTransactionXdr: vi.fn(async () => "test-unsigned-split-payment-xdr"),
      submitSignedTransactionXdr: vi.fn(async () => ({
        hash: `test-external-sign-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
    },
  }
})

// The fiat on-ramp talks to an external SEP-10/24 anchor over HTTP; tests
// get a fake anchor instead so they never depend on real network access.
vi.mock("../src/shared/anchor/client.js", () => ({
  anchorClient: {
    requestChallenge: vi.fn(async () => ({ transactionXdr: "test-challenge-xdr" })),
    submitChallenge: vi.fn(async () => ({ token: "test-anchor-token" })),
    startInteractiveDeposit: vi.fn(async () => ({
      id: `test-anchor-tx-${Math.random().toString(36).slice(2)}`,
      url: "https://testanchor.stellar.org/sep24/interactive?id=test",
    })),
    startInteractiveWithdrawal: vi.fn(async () => ({
      id: `test-anchor-withdraw-tx-${Math.random().toString(36).slice(2)}`,
      url: "https://testanchor.stellar.org/sep24/interactive?id=test-withdraw",
    })),
    fetchTransaction: vi.fn(async () => ({ status: "incomplete" as const })),
  },
}))

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
